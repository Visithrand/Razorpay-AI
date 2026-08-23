"""
Confidence scoring helper shared by all matchers.

Each signal contributes a weighted portion:
  UTR     → up to 0.40
  Amount  → up to 0.30
  Date    → up to 0.20
  Desc    → up to 0.10
Total max = 1.00
"""

from __future__ import annotations


def compute_confidence(
    utr_score: float,         # 0.0 – 1.0 (rapidfuzz ratio, or 1.0 for exact)
    amount_diff_pct: float,   # absolute fractional difference, e.g. 0.02 = 2 %
    date_diff_days: int,      # absolute day difference
    desc_score: float = 0.0,  # 0.0 – 1.0 (rapidfuzz ratio)
) -> tuple[float, list[str]]:
    """
    Return (confidence, signal_list).
    signal_list explains *why* the confidence is what it is.
    """
    confidence = 0.0
    signals: list[str] = []

    # ── UTR (max 0.40) ──────────────────────────────────────────────────────
    if utr_score >= 0.9999:
        confidence += 0.40
        signals.append("UTR exact match")
    elif utr_score >= 0.90:
        confidence += 0.25
        signals.append(f"UTR fuzzy match ({utr_score:.0%})")
    elif utr_score >= 0.70:
        confidence += 0.12
        signals.append(f"UTR partial match ({utr_score:.0%})")

    # ── Amount (max 0.30) ───────────────────────────────────────────────────
    if amount_diff_pct <= 0.001:
        confidence += 0.30
        signals.append("Amount exact match")
    elif amount_diff_pct <= 0.02:
        confidence += 0.20
        signals.append(f"Amount within {amount_diff_pct:.1%} (fee-adjusted)")
    elif amount_diff_pct <= 0.05:
        confidence += 0.12
        signals.append(f"Amount within {amount_diff_pct:.1%}")
    elif amount_diff_pct <= 0.10:
        confidence += 0.06
        signals.append(f"Amount within {amount_diff_pct:.1%} (possible typo)")

    # ── Date (max 0.20) ─────────────────────────────────────────────────────
    if date_diff_days <= 1:
        confidence += 0.20
        signals.append(f"Date within {date_diff_days} day(s)")
    elif date_diff_days <= 3:
        confidence += 0.14
        signals.append(f"Date within {date_diff_days} days (timing drift)")
    elif date_diff_days <= 7:
        confidence += 0.08
        signals.append(f"Date within {date_diff_days} days (extended drift)")

    # ── Description (max 0.10) ──────────────────────────────────────────────
    if desc_score >= 0.80:
        confidence += 0.10
        signals.append(f"Description similar ({desc_score:.0%})")
    elif desc_score >= 0.60:
        confidence += 0.05
        signals.append(f"Description partially similar ({desc_score:.0%})")

    return round(min(confidence, 1.0), 4), signals
