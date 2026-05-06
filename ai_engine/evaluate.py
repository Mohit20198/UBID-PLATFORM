"""
evaluate.py  (fixed + extended)
--------------------------------
Evaluates entity resolution precision, recall, F1 against ground truth.
Also evaluates activity classification accuracy.
"""

import pandas as pd
from pathlib import Path

DATA_DIR  = Path(__file__).parent
SYNTH_DIR = DATA_DIR / "synthetic_data"

print("Loading data...")
preds       = pd.read_csv(DATA_DIR / "auto_linked.csv")
truth       = pd.read_csv(SYNTH_DIR / "ground_truth.csv")
assignments = pd.read_csv(DATA_DIR / "ubid_assignments.csv")

# ── Entity Resolution Evaluation ──────────────────────────────
truth_map = pd.Series(truth.real_business_idx.values, index=truth.source_record_id).to_dict()

true_positives  = 0
false_positives = 0

for _, row in preds.iterrows():
    id_l, id_r  = row['unique_id_l'], row['unique_id_r']
    real_l       = truth_map.get(id_l)
    real_r       = truth_map.get(id_r)
    if real_l and real_r and real_l == real_r:
        true_positives += 1
    else:
        false_positives += 1

real_groups        = truth.groupby('real_business_idx')['source_record_id'].apply(list)
total_actual_pairs = sum((len(g) * (len(g) - 1)) // 2 for g in real_groups if len(g) > 1)
false_negatives    = max(0, total_actual_pairs - true_positives)

precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
recall    = true_positives / total_actual_pairs if total_actual_pairs > 0 else 0
f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

print("\n╔══════════════════════════════════════════╗")
print("║       ENTITY RESOLUTION SCORECARD        ║")
print("╠══════════════════════════════════════════╣")
print(f"║  Total auto-linked pairs  : {len(preds):>6}         ║")
print(f"║  True  Positives          : {true_positives:>6}         ║")
print(f"║  False Positives          : {false_positives:>6}         ║")
print(f"║  False Negatives (missed) : {false_negatives:>6}         ║")
print("╠══════════════════════════════════════════╣")
print(f"║  Precision  : {precision*100:>6.1f}%                  ║")
print(f"║  Recall     : {recall*100:>6.1f}%                  ║")
print(f"║  F1 Score   : {f1*100:>6.1f}%                  ║")
print("╚══════════════════════════════════════════╝")

# ── Activity Classification Evaluation ───────────────────────
activity_path = DATA_DIR / "activity_classifications.csv"
if activity_path.exists():
    act_df   = pd.read_csv(activity_path)
    # Build ground truth status per UBID via majority vote of real_status
    gt_status = truth.merge(
        assignments[['source_record_id', 'ubid']],
        on='source_record_id', how='left'
    ).dropna(subset=['ubid'])
    gt_status = gt_status.groupby('ubid')['real_status'].agg(lambda x: x.mode()[0]).reset_index()
    gt_status.columns = ['ubid', 'gt_status']

    merged = act_df.merge(gt_status, on='ubid', how='inner')
    if not merged.empty:
        # Map CLOSED/DORMANT/ACTIVE equivalences
        status_map = {'ACTIVE': 'ACTIVE', 'DORMANT': 'DORMANT', 'CLOSED': 'CLOSED'}
        merged['gt_norm'] = merged['gt_status'].map(status_map).fillna('DORMANT')
        correct = (merged['activity_status'] == merged['gt_norm']).sum()
        total   = len(merged)
        print(f"\n╔══════════════════════════════════════════╗")
        print(f"║     ACTIVITY CLASSIFICATION ACCURACY     ║")
        print(f"╠══════════════════════════════════════════╣")
        print(f"║  Evaluated UBIDs : {total:>6}                ║")
        print(f"║  Correct         : {correct:>6}                ║")
        print(f"║  Accuracy        : {correct/total*100:>6.1f}%               ║")
        dist = merged['activity_status'].value_counts()
        print(f"║  ACTIVE  : {dist.get('ACTIVE',  0):>4}  DORMANT : {dist.get('DORMANT', 0):>4}  CLOSED: {dist.get('CLOSED', 0):>4}  ║")
        print(f"╚══════════════════════════════════════════╝")