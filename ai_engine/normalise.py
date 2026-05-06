"""
normalise.py
------------
Name, address and identifier canonicalisation utilities.
Used by engine.py as a pre-processing step before Splink matching.
"""

import re
import unicodedata
from typing import Optional

# ─────────────────────────────────────────────────────────────
# Abbreviation expansion rules (pattern → canonical form)
# ─────────────────────────────────────────────────────────────
ABBREV_MAP = [
    # Company type (order matters — longer patterns first)
    (r'\bprivate\s+limited\b',  'private limited'),
    (r'\bpvt\.?\s*ltd\.?\b',    'private limited'),
    (r'\bp\.?\s*ltd\.?\b',      'private limited'),
    (r'\bltd\.?\b',             'limited'),
    (r'\bcorp\.?\b',            'corporation'),
    (r'\bincorp\.?\b',          'incorporated'),
    (r'\bco\.?\b',              'company'),
    # Industry
    (r'\bmfg\.?\b',             'manufacturing'),
    (r'\bmfrs\.?\b',            'manufacturers'),
    (r'\bmfr\.?\b',             'manufacturer'),
    (r'\bengg\.?\b',            'engineering'),
    (r'\beng\.?\b',             'engineering'),
    (r'\binds\.?\b',            'industries'),
    (r'\bindus\.?\b',           'industries'),
    (r'\bind\.?\b',             'industries'),
    (r'\bentp\.?\b',            'enterprises'),
    (r'\benterp\.?\b',          'enterprises'),
    (r'\bent\.?\b',             'enterprises'),
    (r'\bintl\.?\b',            'international'),
    # Address
    (r'\bb\'?lore\b',           'bangalore'),
    (r'\bbengaluru\b',          'bangalore'),
    (r'\bblore\b',              'bangalore'),
    (r'\brd\.?\b',              'road'),
    (r'\bst\.?\b',              'street'),
]


def normalize_text(text: str) -> str:
    """Lowercase, strip, normalize unicode to ASCII."""
    if not text or str(text).strip().lower() in ('', 'nan', 'none'):
        return ''
    text = str(text)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return text.lower().strip()


def expand_abbreviations(text: str) -> str:
    for pattern, replacement in ABBREV_MAP:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def normalize_name(name: str) -> str:
    """
    Canonical business name for matching.
    Steps: normalize → expand abbrevs → strip punctuation → token-sort.
    Token sort makes word-order variants compare identically.
    """
    if not name or str(name).strip().lower() in ('', 'nan', 'none'):
        return ''
    text = normalize_text(name)
    text = expand_abbreviations(text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = sorted(text.split())
    return ' '.join(tokens)


def normalize_address(address: str) -> str:
    """Canonical address string for comparison."""
    if not address or str(address).strip().lower() in ('', 'nan', 'none'):
        return ''
    text = normalize_text(address)
    text = expand_abbreviations(text)
    text = re.sub(r'[^\w\s,]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def validate_pan(pan: Optional[str]) -> bool:
    """PAN format: 5 letters + 4 digits + 1 letter."""
    if not pan or str(pan).strip().lower() in ('', 'nan', 'none'):
        return False
    return bool(re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', str(pan).strip().upper()))


def validate_gstin(gstin: Optional[str]) -> bool:
    """GSTIN: 2 digits + 10-char PAN + 1 digit + Z + 1 char."""
    if not gstin or str(gstin).strip().lower() in ('', 'nan', 'none'):
        return False
    return bool(re.match(r'^\d{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$',
                          str(gstin).strip().upper()))


def clean_id(value: Optional[str]) -> Optional[str]:
    """Strip whitespace; return None for empty/null values."""
    if not value or str(value).strip().lower() in ('', 'nan', 'none'):
        return None
    return str(value).strip().upper()
