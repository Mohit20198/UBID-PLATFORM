"""
activity_inference.py
---------------------
Classifies each UBID as ACTIVE, DORMANT, or CLOSED based on
activity event streams from all department systems.

Signal taxonomy:
  HIGH_RELIABILITY  — monthly ESCOM readings (strong positive signal)
  MEDIUM            — annual renewals, quarterly PF filings
  LOW               — irregular inspections
  TERMINAL          — licence surrender, cancellation (overrides all)

Outputs:
  activity_classifications.csv — per-UBID status + JSON evidence
"""

import json
import math
import sys
import pandas as pd
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────
TODAY            = date.today()
ACTIVE_WINDOW    = 365       # days — at least one signal = ACTIVE
DORMANT_WINDOW   = 365 * 3   # days — no signal in 3 years = CLOSED

SIGNAL_WEIGHTS = {
    "ELECTRICITY_READING": 10,
    "LICENCE_RENEWAL":      8,
    "PF_FILING":            7,
    "INSPECTION":           6,
    "WATER_READING":        10,
    "COMPLIANCE_FILING":    5,
    "LICENCE_SURRENDER":    0,   # terminal — handled separately
    "CLOSURE_ORDER":        0,
}

SIGNAL_HALF_LIFE_DAYS = {
    "ELECTRICITY_READING": 60,
    "LICENCE_RENEWAL":     180,
    "PF_FILING":           120,
    "INSPECTION":          365,
    "WATER_READING":       60,
    "COMPLIANCE_FILING":   120,
    "LICENCE_SURRENDER":   None,
    "CLOSURE_ORDER":       None,
}

TERMINAL_EVENTS = {"LICENCE_SURRENDER", "CLOSURE_ORDER", "CANCELLATION"}

# ─────────────────────────────────────────────────────────────
# Load data
# ─────────────────────────────────────────────────────────────
DATA_DIR   = Path(__file__).parent
SYNTH_DIR  = DATA_DIR / "synthetic_data"

assignments_path = DATA_DIR / "ubid_assignments.csv"
events_path      = SYNTH_DIR / "activity_events.csv"

if not assignments_path.exists():
    raise FileNotFoundError("ubid_assignments.csv not found — run engine.py first.")

assignments = pd.read_csv(assignments_path)
events      = pd.read_csv(events_path)

print(f"Loaded {len(assignments)} UBID assignments, {len(events)} activity events.")

# ─────────────────────────────────────────────────────────────
# Join events → UBIDs via source_record_id mapping
# ─────────────────────────────────────────────────────────────
record_to_ubid = dict(zip(assignments.source_record_id, assignments.ubid))

events['ubid'] = events['source_record_id'].map(record_to_ubid)

unattributed = events[events['ubid'].isna()]
attributed   = events[events['ubid'].notna()].copy()

print(f"  Attributed events  : {len(attributed)}")
print(f"  Unattributed events: {len(unattributed)} (saved for review)")

unattributed.to_csv(DATA_DIR / "unattributed_events.csv", index=False)


# ─────────────────────────────────────────────────────────────
# Score each UBID
# ─────────────────────────────────────────────────────────────
def decay(days_ago: float, half_life: float) -> float:
    """Exponential decay: weight halves every `half_life` days."""
    return math.exp(-0.693 * days_ago / half_life)


results = []
ubid_list = assignments['ubid'].unique()

for ubid in ubid_list:
    ubid_events = attributed[attributed['ubid'] == ubid]

    if ubid_events.empty:
        results.append({
            "ubid":             ubid,
            "activity_status":  "DORMANT",
            "confidence_pct":   40,
            "score":            0,
            "last_signal_date": None,
            "terminal":         False,
            "sources_active":   json.dumps([]),
            "evidence_json":    json.dumps([]),
        })
        continue

    # Check terminal events first
    terminal_hits = ubid_events[ubid_events['event_category'].isin(TERMINAL_EVENTS)]
    if not terminal_hits.empty:
        ev = terminal_hits.sort_values('event_date').iloc[-1]
        results.append({
            "ubid":             ubid,
            "activity_status":  "CLOSED",
            "confidence_pct":   98,
            "score":            -999,
            "last_signal_date": ev['event_date'],
            "terminal":         True,
            "sources_active":   json.dumps([]),
            "evidence_json":    json.dumps([{
                "event": ev['event_category'],
                "source": ev['source'],
                "date": ev['event_date'],
                "weight": "TERMINAL",
                "contribution": "CLOSED override",
            }]),
        })
        continue

    # Score all non-terminal events
    evidence   = []
    total_score = 0.0
    sources_seen = set()
    last_date   = None

    for _, ev in ubid_events.iterrows():
        cat     = ev['event_category']
        src     = ev['source']
        ev_date = ev['event_date']

        if cat in TERMINAL_EVENTS:
            continue

        try:
            d    = datetime.strptime(str(ev_date), "%Y-%m-%d").date()
        except Exception:
            continue

        days_ago  = max((TODAY - d).days, 0)
        base_w    = SIGNAL_WEIGHTS.get(cat, 3)
        hl        = SIGNAL_HALF_LIFE_DAYS.get(cat, 180)
        weighted  = base_w * decay(days_ago, hl)
        total_score += weighted
        sources_seen.add(src)

        if last_date is None or d > last_date:
            last_date = d

        evidence.append({
            "event":        cat,
            "source":       src,
            "date":         str(d),
            "days_ago":     days_ago,
            "base_weight":  base_w,
            "decayed_weight": round(weighted, 2),
        })

    # Source diversity bonus
    if len(sources_seen) >= 2:
        total_score *= 1.25

    # Classify
    days_since_last = (TODAY - last_date).days if last_date else 9999
    if days_since_last <= ACTIVE_WINDOW and total_score > 5:
        status = "ACTIVE"
        conf   = min(95, 60 + int(total_score))
    elif days_since_last <= DORMANT_WINDOW:
        status = "DORMANT"
        conf   = max(40, 70 - int(total_score / 2))
    else:
        status = "CLOSED"
        conf   = 75

    results.append({
        "ubid":             ubid,
        "activity_status":  status,
        "confidence_pct":   conf,
        "score":            round(total_score, 2),
        "last_signal_date": str(last_date) if last_date else None,
        "terminal":         False,
        "sources_active":   json.dumps(list(sources_seen)),
        "evidence_json":    json.dumps(sorted(evidence, key=lambda x: x['date'], reverse=True)[:10]),
    })

out_df = pd.DataFrame(results)
out_df.to_csv(DATA_DIR / "activity_classifications.csv", index=False)

counts = out_df['activity_status'].value_counts()
print(f"\nActivity inference complete.")
print(f"   ACTIVE  : {counts.get('ACTIVE',  0)}")
print(f"   DORMANT : {counts.get('DORMANT', 0)}")
print(f"   CLOSED  : {counts.get('CLOSED',  0)}")
print(f"   Total   : {len(out_df)}")
