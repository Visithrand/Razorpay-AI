"""
Pass 2 — Fuzzy matcher.

For gateway rows still unmatched after the exact pass, try:
  • UTR similarity via rapidfuzz token_sort_ratio  ≥ 60
  • Amount within 5 % tolerance
  • Date within ±4 days (catches timing-drift and fee-adjusted cases)

Confidence is computed by the shared scoring helper.
"""

from __future__ import annotations

import logging
from datetime import datetime

import pandas as pd
from rapidfuzz import fuzz

from app.matcher.scoring import compute_confidence
from app.matcher.exact import MatchCandidate, _find_ledger

logger = logging.getLogger(__name__)

UTR_MIN_SCORE = 60          # rapidfuzz 0-100 scale
AMOUNT_TOL_PCT = 0.05       # 5 % tolerance
DATE_TOL_DAYS = 4


def fuzzy_match(
    gateway_df: pd.DataFrame,
    bank_df: pd.DataFrame,
    ledger_df: pd.DataFrame,
    unmatched_gw: set[int],
    unmatched_bank: set[int],
    threshold: float = 0.5,
) -> tuple[list[MatchCandidate], set[int], set[int]]:
    """
    Apply fuzzy matching to remaining unmatched rows.

    Returns (matches, remaining_unmatched_gw, remaining_unmatched_bank).
    """
    matches: list[MatchCandidate] = []
    used_bank: set[int] = set()

    for gi in list(unmatched_gw):
        grow = gateway_df.loc[gi]
        g_utr = str(grow.get("utr", "")).strip()
        g_net = float(grow.get("net_amount", 0))
        g_date = grow.get("date")
        if pd.isna(g_date):
            continue
        g_desc = str(grow.get("description", ""))

        best_conf = -1.0
        best_bi = -1
        best_signals: list[str] = []

        for bi in unmatched_bank:
            if bi in used_bank:
                continue
            brow = bank_df.loc[bi]
            b_utr = str(brow.get("utr", "")).strip()
            b_amount = float(brow.get("amount", 0))
            b_date = brow.get("date")
            if pd.isna(b_date):
                continue
            b_desc = str(brow.get("description", ""))

            # Date gate — skip if too far apart
            date_diff = abs((pd.Timestamp(g_date) - pd.Timestamp(b_date)).days)
            if date_diff > DATE_TOL_DAYS:
                continue

            # Amount gate
            amount_diff_pct = abs(g_net - b_amount) / max(abs(g_net), 1.0)
            if amount_diff_pct > AMOUNT_TOL_PCT:
                continue

            # UTR similarity
            if g_utr and b_utr:
                utr_score = fuzz.token_sort_ratio(g_utr, b_utr) / 100.0
            else:
                utr_score = 0.0

            if utr_score < (UTR_MIN_SCORE / 100.0) and amount_diff_pct > 0.001:
                # Need at least either UTR match OR exact amount match
                continue

            desc_score = fuzz.token_sort_ratio(g_desc, b_desc) / 100.0

            conf, signals = compute_confidence(
                utr_score=utr_score,
                amount_diff_pct=amount_diff_pct,
                date_diff_days=date_diff,
                desc_score=desc_score,
            )

            if conf > best_conf:
                best_conf = conf
                best_bi = bi
                best_signals = signals

        if best_conf >= threshold and best_bi >= 0:
            brow = bank_df.loc[best_bi]
            b_date = brow.get("date")
            ledger_idx = _find_ledger(ledger_df, grow, g_utr, g_date)

            matches.append(
                MatchCandidate(
                    gateway_idx=gi,
                    bank_idx=best_bi,
                    ledger_idx=ledger_idx,
                    confidence=best_conf,
                    reason=" + ".join(best_signals),
                    match_type="fuzzy",
                    gateway_amount=float(grow.get("amount", 0)),
                    bank_amount=float(brow.get("amount", 0)),
                    ledger_amount=float(ledger_df.loc[ledger_idx]["amount"]) if ledger_idx is not None else 0.0,
                    gateway_date=pd.Timestamp(g_date).to_pydatetime(),
                    bank_date=pd.Timestamp(b_date).to_pydatetime() if not pd.isna(b_date) else None,
                    gateway_utr=g_utr,
                    bank_utr=str(brow.get("utr", "")),
                    gateway_txn_ref=str(grow.get("txn_id", "")),
                    signals=best_signals,
                )
            )
            used_bank.add(best_bi)
            unmatched_gw.discard(gi)

    remaining_bank = unmatched_bank - used_bank
    logger.info("Fuzzy pass: %d matches found", len(matches))
    return matches, unmatched_gw, remaining_bank
