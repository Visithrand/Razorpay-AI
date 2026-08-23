"""
Pass 3 — Batch Settlement Unbundler.

Payment gateways often aggregate multiple transactions into a single bank
credit (a "batch settlement").  This pass detects those cases by finding
subsets of unmatched gateway rows whose net_amount sum equals a single
unmatched bank credit.

Algorithm:
  For each unmatched bank row B:
    Collect candidate gateway rows within ±2 days and with individual
    amounts ≤ B.amount.
    Use a greedy subset-sum (with a small tolerance) to find a subset S
    such that Σ S.net_amount ≈ B.amount.

Confidence is 0.88 for a perfect subset sum, lower if approximate.
"""

from __future__ import annotations

import logging
from itertools import combinations
from dataclasses import dataclass, field
from datetime import datetime

import pandas as pd

logger = logging.getLogger(__name__)

AMOUNT_TOL_ABS = 1.00   # ₹ absolute tolerance for batch sum
DATE_TOL_DAYS = 2
MAX_BATCH_SIZE = 10     # don't try combinations larger than this (perf guard)


@dataclass
class BatchMatch:
    gateway_indices: list[int]
    bank_idx: int
    confidence: float
    reason: str
    match_type: str = "batch"
    gateway_amounts: list[float] = field(default_factory=list)
    bank_amount: float = 0.0
    bank_date: datetime | None = None
    bank_utr: str = ""


def batch_unbundle(
    gateway_df: pd.DataFrame,
    bank_df: pd.DataFrame,
    unmatched_gw: set[int],
    unmatched_bank: set[int],
    threshold: float = 0.6,
) -> tuple[list[BatchMatch], set[int], set[int]]:
    """
    Find bank rows that are batch settlements of multiple gateway rows.

    Returns (batch_matches, remaining_unmatched_gw, remaining_unmatched_bank).
    """
    matches: list[BatchMatch] = []
    used_bank: set[int] = set()
    used_gw: set[int] = set()

    for bi in list(unmatched_bank):
        brow = bank_df.loc[bi]
        b_amount = float(brow.get("amount", 0))
        b_date = brow.get("date")
        if pd.isna(b_date) or b_amount <= 0:
            continue
        b_date_ts = pd.Timestamp(b_date)

        # Candidate gateway rows: date within window, net_amount ≤ b_amount
        candidates: list[int] = []
        for gi in unmatched_gw:
            if gi in used_gw:
                continue
            grow = gateway_df.loc[gi]
            g_net = float(grow.get("net_amount", 0))
            g_date = grow.get("date")
            if pd.isna(g_date) or g_net <= 0:
                continue
            date_diff = abs((b_date_ts - pd.Timestamp(g_date)).days)
            if date_diff <= DATE_TOL_DAYS and g_net <= b_amount + AMOUNT_TOL_ABS:
                candidates.append(gi)

        if not candidates:
            continue

        subset = _find_subset_sum(gateway_df, candidates, b_amount)
        if not subset:
            continue

        subset_sum = sum(float(gateway_df.loc[gi]["net_amount"]) for gi in subset)
        diff = abs(subset_sum - b_amount)
        conf = max(0.60, 0.88 - (diff / max(b_amount, 1.0)) * 10)
        conf = round(min(conf, 0.90), 4)

        if conf < threshold:
            continue

        reason = (
            f"Batch settlement: {len(subset)} gateway transactions "
            f"(sum ₹{subset_sum:,.2f}) matched to bank credit ₹{b_amount:,.2f}"
        )

        matches.append(
            BatchMatch(
                gateway_indices=subset,
                bank_idx=bi,
                confidence=conf,
                reason=reason,
                gateway_amounts=[float(gateway_df.loc[gi]["net_amount"]) for gi in subset],
                bank_amount=b_amount,
                bank_date=b_date_ts.to_pydatetime(),
                bank_utr=str(brow.get("utr", "")),
            )
        )
        used_bank.add(bi)
        used_gw.update(subset)

    remaining_gw = unmatched_gw - used_gw
    remaining_bank = unmatched_bank - used_bank
    logger.info("Batch pass: %d batch groups found", len(matches))
    return matches, remaining_gw, remaining_bank


def _find_subset_sum(
    gateway_df: pd.DataFrame,
    candidates: list[int],
    target: float,
) -> list[int] | None:
    """
    Greedy + bounded exhaustive search for subset sum.

    1. Greedy: sort descending, add while sum < target.
    2. If greedy fails, try all combinations up to MAX_BATCH_SIZE.
    """
    nets = {gi: float(gateway_df.loc[gi]["net_amount"]) for gi in candidates}
    sorted_cands = sorted(candidates, key=lambda gi: nets[gi], reverse=True)

    # Greedy pass
    running = 0.0
    greedy: list[int] = []
    for gi in sorted_cands:
        if running + nets[gi] <= target + AMOUNT_TOL_ABS:
            greedy.append(gi)
            running += nets[gi]
        if abs(running - target) <= AMOUNT_TOL_ABS:
            return greedy

    # Exhaustive pass (small batches only)
    cap = min(len(candidates), MAX_BATCH_SIZE)
    for size in range(2, cap + 1):
        for combo in combinations(sorted_cands[:cap], size):
            s = sum(nets[gi] for gi in combo)
            if abs(s - target) <= AMOUNT_TOL_ABS:
                return list(combo)

    return None
