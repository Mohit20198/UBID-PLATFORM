"""
similarity.py
-------------
Lightweight entity similarity scorer — from Mohit's backend (integrated).

Used to compute match signals between two normalised records without
pulling in a heavy ML library. Complements the Splink engine output
by providing a transparent, explainable breakdown for the Review Queue.

Signals (each 0.0–1.0):
  - name_token_jaccard   : Jaccard similarity of sorted name token sets
  - name_soundex_match   : whether leading soundex codes match
  - pan_exact            : PAN match (both present and equal)
  - gstin_prefix_match   : first 12 chars of GSTIN match
  - pin_code_match       : pin codes match
  - address_token_jaccard: Jaccard of address tokens

Final score: weighted sum, clamped to [0, 1].
"""

from __future__ import annotations

import hashlib
import re
from typing import Any

# Weight table — tuned for Karnataka regulatory data
_WEIGHTS = {
    "pan_exact":              0.35,
    "gstin_prefix_match":     0.25,
    "name_token_jaccard":     0.20,
    "pin_code_match":         0.10,
    "name_soundex_match":     0.05,
    "address_token_jaccard":  0.05,
}

_STOP_WORDS = {"pvt", "ltd", "private", "limited", "co", "and", "the", "of", "&"}


def _tokenise(text: str) -> list[str]:
    tokens = re.sub(r"[^a-z0-9\s]", " ", text.lower()).split()
    return [t for t in tokens if t not in _STOP_WORDS]


def _jaccard(a: list[str], b: list[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _soundex(name: str) -> str:
    """Simple Soundex — used for phonetic name matching."""
    if not name:
        return ""
    name = name.upper()
    code_map = {
        "BFPV": "1", "CGJKQSXYZ": "2", "DT": "3",
        "L": "4", "MN": "5", "R": "6",
    }
    code = name[0]
    for char in name[1:]:
        for letters, num in code_map.items():
            if char in letters:
                if num != (code[-1] if len(code) > 1 else ""):
                    code += num
                break
        if len(code) == 4:
            break
    return code.ljust(4, "0")


def compute_similarity(left: dict[str, Any], right: dict[str, Any]) -> tuple[float, dict[str, float]]:
    """
    Returns (overall_score 0-100, signal_breakdown).

    Both `left` and `right` are record dicts with fields like:
      pan, gstin, business_name, address, pin_code
    """
    signals: dict[str, float] = {}

    # ── PAN exact match ─────────────────────────────────────
    l_pan = (left.get("pan") or "").strip().upper()
    r_pan = (right.get("pan") or "").strip().upper()
    if l_pan and r_pan:
        signals["pan_exact"] = 1.0 if l_pan == r_pan else 0.0
    else:
        signals["pan_exact"] = 0.0

    # ── GSTIN prefix (first 12 chars) ───────────────────────
    l_g = (left.get("gstin") or "")[:12].upper()
    r_g = (right.get("gstin") or "")[:12].upper()
    if l_g and r_g:
        signals["gstin_prefix_match"] = 1.0 if l_g == r_g else 0.0
    else:
        signals["gstin_prefix_match"] = 0.0

    # ── Name token Jaccard ──────────────────────────────────
    l_name = left.get("business_name") or left.get("name_normalised") or ""
    r_name = right.get("business_name") or right.get("name_normalised") or ""
    signals["name_token_jaccard"] = _jaccard(_tokenise(l_name), _tokenise(r_name))

    # ── Pin code match ──────────────────────────────────────
    l_pin = str(left.get("pin_code") or "").strip()
    r_pin = str(right.get("pin_code") or "").strip()
    signals["pin_code_match"] = 1.0 if (l_pin and r_pin and l_pin == r_pin) else 0.0

    # ── Soundex match (leading name token) ─────────────────
    l_tok = _tokenise(l_name)
    r_tok = _tokenise(r_name)
    if l_tok and r_tok:
        signals["name_soundex_match"] = 1.0 if _soundex(l_tok[0]) == _soundex(r_tok[0]) else 0.0
    else:
        signals["name_soundex_match"] = 0.0

    # ── Address token Jaccard ───────────────────────────────
    l_addr = _tokenise(left.get("address") or left.get("addr_full_normalised") or "")
    r_addr = _tokenise(right.get("address") or right.get("addr_full_normalised") or "")
    signals["address_token_jaccard"] = _jaccard(l_addr, r_addr)

    # ── Weighted sum → 0-100 scale ──────────────────────────
    raw = sum(_WEIGHTS[k] * v for k, v in signals.items())
    score_pct = round(min(max(raw, 0.0), 1.0) * 100, 1)

    return score_pct, signals


def make_pair_id(left_source: str, left_id: str, right_source: str, right_id: str) -> str:
    """Stable, order-independent hash for a candidate pair (from Mohit's backend)."""
    key = "_".join(sorted([f"{left_source}:{left_id}", f"{right_source}:{right_id}"]))
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def confidence_band(score_pct: float) -> str:
    """Map a 0-100 score to a confidence band."""
    if score_pct >= 85:
        return "HIGH"
    if score_pct >= 60:
        return "MEDIUM"
    return "LOW"
