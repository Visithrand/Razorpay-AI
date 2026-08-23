"""
Pass 1 — Exact matcher.

Criteria (all three must hold):
  1. UTR strings are identical (and non-empty)
  2. |gateway.net_amount − bank.amount| ≤ ₹0.01
  3. |date_gateway − date_bank| ≤ 1 calendar day

Confidence for an exact match is always ≥ 0.90 (UTR 0.40 + amount 0.30 + date 0.20 = 0.90).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime

import pandas as pd

from app.matcher.scoring import compute_confidence

logger = logging.getLogger(__name__)

AMOUNT_TOL = 0.01   # ₹ absolute tolerance for "exact" amount match
DATE_TOL_DAYS = 1   # calendar days


@dataclass
class MatchCandidate:
    gateway_idx: int
    bank_idx: int
    ledger_idx: int | None
    confidence: float
    reason: str
    match_type: str = "exact"
    gateway_amount: float = 0.0
    bank_amount: float = 0.0
    ledger_amount: float = 0.0
    gateway_date: datetime | None = None
    bank_date: datetime | None = None
    gateway_utr: str = ""
    bank_utr: str = ""
    gateway_txn_ref: str = ""
    signals: list[str] = field(default_factory=list)


def exact_match(
    gateway_df: pd.DataFrame,
    bank_df: pd.DataFrame,
    ledger_df: pd.DataFrame,
    unmatched_gw: set[int],
    unmatched_bank: set[int],
    threshold: float = 0.0,
) -> tuple[list[MatchCandidate], set[int], set[int]]:
    """
    Try to match each unmatched gateway row with an unmatched bank row.

    Returns (matches, remaining_unmatched_gw, remaining_unmatched_bank).
    """
    matches: list[MatchCandidate] = []
    used_bank: set[int] = set()

    # Build a UTR → bank_idx lookup for O(1) lookups
    utr_to_bank: dict[str, list[int]] = {}
    for bi in unmatched_bank:
        brow = bank_df.loc[bi]
        utr = str(brow.get("utr", "")).strip()
        if utr:
            utr_to_bank.setdefault(utr, []).append(bi)

    for gi in list(unmatched_gw):
        grow = gateway_df.loc[gi]
        g_utr = str(grow.get("utr", "")).strip()
        g_net = float(grow.get("net_amount", 0))
        g_date = grow.get("date")
        if pd.isna(g_date):
            continue

        candidates = utr_to_bank.get(g_utr, [])
        for bi in candidates:
            if bi in used_bank:
                continue
            brow = bank_df.loc[bi]
            b_amount = float(brow.get("amount", 0))
            b_date = brow.get("date")
            if pd.isna(b_date):
                continue

            amount_diff = abs(g_net - b_amount)
            date_diff = abs((g_date - b_date).days) if hasattr(g_date, 'days') else abs((pd.Timestamp(g_date) - pd.Timestamp(b_date)).days)

            if amount_diff <= AMOUNT_TOL and date_diff <= DATE_TOL_DAYS:
                amount_diff_pct = amount_diff / max(g_net, 0.01)
                conf, signals = compute_confidence(
                    utr_score=1.0,
                    amount_diff_pct=amount_diff_pct,
                    date_diff_days=date_diff,
                )
                if conf < threshold:
                    continue

                # Try to find a matching ledger row
                ledger_idx = _find_ledger(
                    ledger_df, grow, g_utr, g_date
                )

                matches.append(
                    MatchCandidate(
                        gateway_idx=gi,
                        bank_idx=bi,
                        ledger_idx=ledger_idx,
                        confidence=conf,
                        reason=" + ".join(signals),
                        match_type="exact",
                        gateway_amount=float(grow.get("amount", 0)),
                        bank_amount=b_amount,
                        ledger_amount=float(ledger_df.loc[ledger_idx]["amount"]) if ledger_idx is not None else 0.0,
                        gateway_date=pd.Timestamp(g_date).to_pydatetime(),
                        bank_date=pd.Timestamp(b_date).to_pydatetime(),
                        gateway_utr=g_utr,
                        bank_utr=str(brow.get("utr", "")),
                        gateway_txn_ref=str(grow.get("txn_id", "")),
                        signals=signals,
                    )
                )
                used_bank.add(bi)
                unmatched_gw.discard(gi)
                break  # one gateway row → one bank row

    remaining_bank = unmatched_bank - used_bank
    logger.info("Exact pass: %d matches found", len(matches))
    return matches, unmatched_gw, remaining_bank


def _find_ledger(
    ledger_df: pd.DataFrame,
    grow: pd.Series,
    g_utr: str,
    g_date,
) -> int | None:
    """Heuristic: ledger row with matching reference or txn_id within ±1 day."""
    g_ref = str(grow.get("txn_id", "")).strip()
    g_amount = float(grow.get("amount", 0))

    for li, lrow in ledger_df.iterrows():
        l_ref = str(lrow.get("reference", lrow.get("utr", ""))).strip()
        l_date = lrow.get("date")
        if pd.isna(l_date):
            continue
        date_diff = abs((pd.Timestamp(g_date) - pd.Timestamp(l_date)).days)
        amount_match = abs(float(lrow.get("amount", 0)) - g_amount) <= AMOUNT_TOL
        ref_match = l_ref and (l_ref == g_ref or l_ref == g_utr)
        if ref_match and date_diff <= 1 and amount_match:
            return li
    return None
