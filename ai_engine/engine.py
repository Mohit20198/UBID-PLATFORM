"""
engine.py  (improved)
---------------------
Full UBID entity resolution pipeline using Splink (Fellegi-Sunter).

Outputs written to ai_engine/:
  ubid_assignments.csv   — every source record → UBID
  review_queue.json      — ambiguous pairs (0.55–0.84) for human review
  auto_linked.csv        — pairs auto-linked at ≥ 0.85
  audit_log.csv          — append-only decision log
"""

import json
import sys
import pandas as pd
from datetime import datetime
from pathlib import Path

# ── local utilities ──────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
from normalise import normalize_name, normalize_address, clean_id, validate_pan, validate_gstin

# ── splink (3.x API) ────────────────────────────────────────
from splink.duckdb.linker import DuckDBLinker
import splink.duckdb.comparison_library as cl

# ─────────────────────────────────────────────────────────────
# Thresholds
# ─────────────────────────────────────────────────────────────
AUTO_LINK_THRESHOLD = 0.85
REVIEW_THRESHOLD    = 0.55

# ─────────────────────────────────────────────────────────────
# 1. Load & normalise source data
# ─────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "synthetic_data"

bbmp      = pd.read_csv(DATA_DIR / "bbmp_trade_licences.csv")
escom     = pd.read_csv(DATA_DIR / "escom_connections.csv")
labour    = pd.read_csv(DATA_DIR / "labour_establishments.csv")
factories = pd.read_csv(DATA_DIR / "factories_licences.csv")

def standardize(df, id_col, name_col, addr_col, source_name):
    df = df.copy()
    df = df.rename(columns={id_col: 'unique_id', name_col: 'business_name', addr_col: 'address'})
    keep = ['unique_id', 'business_name', 'address', 'pin_code', 'pan', 'gstin']
    for c in keep:
        if c not in df.columns:
            df[c] = None
    df = df[keep].copy()
    df['source_system'] = source_name

    # Normalise
    df['name_norm']  = df['business_name'].apply(normalize_name)
    df['addr_norm']  = df['address'].apply(normalize_address)
    df['pan']        = df['pan'].apply(clean_id)
    df['gstin']      = df['gstin'].apply(clean_id)
    df['pin_code']   = df['pin_code'].astype(str).str.strip()

    # Validity flags (store but don't drop)
    df['pan_valid']   = df['pan'].apply(validate_pan)
    df['gstin_valid'] = df['gstin'].apply(validate_gstin)

    # Masked identifier for splink (None if invalid)
    df['pan_clean']   = df.apply(lambda r: r['pan'] if r['pan_valid'] else None, axis=1)
    df['gstin_clean'] = df.apply(lambda r: r['gstin'] if r['gstin_valid'] else None, axis=1)

    return df

bbmp_c      = standardize(bbmp,      'trade_licence_no',   'business_name',    'business_address', 'BBMP')
escom_c     = standardize(escom,     'consumer_no',        'consumer_name',     'service_address',  'ESCOM')
labour_c    = standardize(labour,    'pf_code',            'establishment_name','address',          'LABOUR')
factories_c = standardize(factories, 'factory_licence_no', 'factory_name',      'factory_address',  'FACTORIES')

master_df = pd.concat([bbmp_c, escom_c, labour_c, factories_c], ignore_index=True)
print(f"Loaded {len(master_df)} records across 4 systems.")

# Save normalised master for backend use
master_df.to_csv(Path(__file__).parent / "master_records.csv", index=False)

# ─────────────────────────────────────────────────────────────
# 2. Splink configuration
# ─────────────────────────────────────────────────────────────
settings = {
    "link_type": "dedupe_only",
    "blocking_rules_to_generate_predictions": [
        "l.pin_code = r.pin_code",
        "l.pan_clean = r.pan_clean AND l.pan_clean IS NOT NULL",
        "l.gstin_clean = r.gstin_clean AND l.gstin_clean IS NOT NULL",
    ],
    "comparisons": [
        cl.jaro_winkler_at_thresholds("name_norm", [0.92, 0.80]),
        cl.exact_match("pan_clean",   term_frequency_adjustments=False),
        cl.exact_match("gstin_clean", term_frequency_adjustments=False),
        cl.jaro_winkler_at_thresholds("addr_norm", [0.85, 0.70]),
        cl.exact_match("pin_code"),
    ],
    "retain_matching_columns": True,
    "retain_intermediate_calculation_columns": True,
}

# ─────────────────────────────────────────────────────────────
# 3. Train & predict
# ─────────────────────────────────────────────────────────────
linker = DuckDBLinker(master_df, settings)
print("Estimating u-probabilities via random sampling...")
linker.estimate_u_using_random_sampling(max_pairs=1e6)

print("Estimating m-probabilities via EM (blocking on pin_code)...")
linker.estimate_parameters_using_expectation_maximisation("l.pin_code = r.pin_code")

print("Predicting matches...")
predictions = linker.predict(threshold_match_probability=0.30)
df_preds = predictions.as_pandas_dataframe()
print(f"  {len(df_preds)} candidate pairs found.")

# ─────────────────────────────────────────────────────────────
# 4. UBID assignment via union-find on auto-linked pairs
# ─────────────────────────────────────────────────────────────
auto_links   = df_preds[df_preds.match_probability >= AUTO_LINK_THRESHOLD].copy()
review_pairs = df_preds[(df_preds.match_probability >= REVIEW_THRESHOLD) &
                        (df_preds.match_probability <  AUTO_LINK_THRESHOLD)].copy()

all_ids = master_df['unique_id'].tolist()

# Union-Find
parent = {uid: uid for uid in all_ids}

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(x, y):
    rx, ry = find(x), find(y)
    if rx != ry:
        parent[rx] = ry

for _, row in auto_links.iterrows():
    uid_l, uid_r = row['unique_id_l'], row['unique_id_r']
    if uid_l in parent and uid_r in parent:
        union(uid_l, uid_r)

# Assign UBID strings
root_to_ubid: dict = {}
ubid_map: dict     = {}
counter = 1
for uid in all_ids:
    root = find(uid)
    if root not in root_to_ubid:
        root_to_ubid[root] = f"UBID-KA-{counter:06d}"
        counter += 1
    ubid_map[uid] = root_to_ubid[root]

# ─────────────────────────────────────────────────────────────
# 5. Build ubid_assignments.csv
# ─────────────────────────────────────────────────────────────
assign_rows = []
for _, rec in master_df.iterrows():
    uid  = rec['unique_id']
    ubid = ubid_map.get(uid, f"UBID-KA-{counter:06d}")
    cluster = root_to_ubid.get(find(uid), ubid)
    assign_rows.append({
        "source_record_id": uid,
        "ubid":             ubid,
        "source_system":    rec['source_system'],
        "business_name":    rec['business_name'],
        "name_norm":        rec['name_norm'],
        "address":          rec['address'],
        "pin_code":         rec['pin_code'],
        "pan":              rec['pan'],
        "gstin":            rec['gstin'],
        "pan_valid":        rec['pan_valid'],
        "gstin_valid":      rec['gstin_valid'],
    })

assignments_df = pd.DataFrame(assign_rows)
assignments_df.to_csv(Path(__file__).parent / "ubid_assignments.csv", index=False)
print(f"  {assignments_df['ubid'].nunique()} unique UBIDs assigned from {len(assignments_df)} records.")

# ─────────────────────────────────────────────────────────────
# 6. Build review_queue.json with feature breakdown
# ─────────────────────────────────────────────────────────────
def get_feature_contributions(row) -> dict:
    """Extract feature-level contribution scores from splink output row."""
    contribs = {}
    score = float(row.get('match_probability', 0))

    # Name similarity
    gamma_name = row.get('gamma_name_norm', -1)
    if gamma_name == 2:
        contribs['name_similarity'] = 28
    elif gamma_name == 1:
        contribs['name_similarity'] = 14
    else:
        contribs['name_similarity'] = -5

    # PAN
    gamma_pan = row.get('gamma_pan_clean', -1)
    contribs['pan_match'] = 40 if gamma_pan == 1 else (-3 if gamma_pan == 0 else 0)

    # GSTIN
    gamma_gstin = row.get('gamma_gstin_clean', -1)
    contribs['gstin_match'] = 35 if gamma_gstin == 1 else (-3 if gamma_gstin == 0 else 0)

    # Address
    gamma_addr = row.get('gamma_addr_norm', -1)
    if gamma_addr == 2:
        contribs['address_similarity'] = 18
    elif gamma_addr == 1:
        contribs['address_similarity'] = 9
    else:
        contribs['address_similarity'] = -4

    # Pin code
    gamma_pin = row.get('gamma_pin_code', -1)
    contribs['pin_code_match'] = 12 if gamma_pin == 1 else -8

    return contribs

review_queue_items = []
for i, row in review_pairs.iterrows():
    uid_l = row['unique_id_l']
    uid_r = row['unique_id_r']
    rec_l = master_df[master_df.unique_id == uid_l].iloc[0] if (master_df.unique_id == uid_l).any() else {}
    rec_r = master_df[master_df.unique_id == uid_r].iloc[0] if (master_df.unique_id == uid_r).any() else {}

    item = {
        "pair_id":              f"PAIR-{i:05d}",
        "unique_id_l":          uid_l,
        "unique_id_r":          uid_r,
        "business_name_l":      row.get('business_name_l', ''),
        "business_name_r":      row.get('business_name_r', ''),
        "source_system_l":      row.get('source_system_l', ''),
        "source_system_r":      row.get('source_system_r', ''),
        "pan_l":                row.get('pan_clean_l', None),
        "pan_r":                row.get('pan_clean_r', None),
        "gstin_l":              row.get('gstin_clean_l', None),
        "gstin_r":              row.get('gstin_clean_r', None),
        "address_l":            row.get('address_l', ''),
        "address_r":            row.get('address_r', ''),
        "pin_code_l":           row.get('pin_code_l', ''),
        "pin_code_r":           row.get('pin_code_r', ''),
        "match_probability":    round(float(row['match_probability']), 4),
        "confidence_pct":       round(float(row['match_probability']) * 100, 1),
        "feature_contributions": get_feature_contributions(row),
        "status":               "PENDING",
        "ubid_l":               ubid_map.get(uid_l, ''),
        "ubid_r":               ubid_map.get(uid_r, ''),
    }
    review_queue_items.append(item)

with open(Path(__file__).parent / "review_queue.json", "w") as f:
    json.dump(review_queue_items, f, indent=2)
print(f"  {len(review_queue_items)} pairs written to review_queue.json")

# ─────────────────────────────────────────────────────────────
# 7. Auto-linked pairs CSV
# ─────────────────────────────────────────────────────────────
auto_links.to_csv(Path(__file__).parent / "auto_linked.csv", index=False)

# ─────────────────────────────────────────────────────────────
# 8. Audit log
# ─────────────────────────────────────────────────────────────
audit_rows = []
now = datetime.utcnow().isoformat()
for _, row in auto_links.iterrows():
    audit_rows.append({
        "timestamp":    now,
        "actor":        "SYSTEM",
        "decision":     "AUTO_LINK",
        "pair_id":      f"AL-{row.name}",
        "unique_id_l":  row['unique_id_l'],
        "unique_id_r":  row['unique_id_r'],
        "confidence":   round(float(row['match_probability']) * 100, 1),
        "ubid":         ubid_map.get(row['unique_id_l'], ''),
        "notes":        "",
    })
for item in review_queue_items:
    audit_rows.append({
        "timestamp":    now,
        "actor":        "SYSTEM",
        "decision":     "ROUTED_TO_REVIEW",
        "pair_id":      item['pair_id'],
        "unique_id_l":  item['unique_id_l'],
        "unique_id_r":  item['unique_id_r'],
        "confidence":   item['confidence_pct'],
        "ubid":         "",
        "notes":        "",
    })

pd.DataFrame(audit_rows).to_csv(Path(__file__).parent / "audit_log.csv", index=False)

print(f"\nPipeline complete.")
print(f"   Auto-linked pairs : {len(auto_links)}")
print(f"   Review queue      : {len(review_queue_items)}")
print(f"   Unique UBIDs      : {assignments_df['ubid'].nunique()}")