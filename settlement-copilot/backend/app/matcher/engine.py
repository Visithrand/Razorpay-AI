"""
Matching Engine — orchestrates the 3-pass pipeline and persists results.

Pass 1: Exact  → UTR exact + amount ±₹0.01 + date ±1 day
Pass 2: Fuzzy  → rapidfuzz UTR + amount ±5% + date ±4 days
Pass 3: Batch  → subset-sum of gateway net amounts = bank credit

Each match gets a confidence score + reason string.
Unmatched rows are categorised as exceptions.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from app.models import ExceptionRecord, MatchResult, RawTransaction, Report
from app.matcher.exact import exact_match
from app.matcher.fuzzy import fuzzy_match
from app.matcher.batch_unbundler import batch_unbundle

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(os.getenv("REPORTS_DIR", "reports"))


def _load_df(db: Session, run_id: str, source: str) -> pd.DataFrame:
    rows = (
        db.query(RawTransaction)
        .filter(RawTransaction.run_id == run_id, RawTransaction.source == source)
        .all()
    )
    if not rows:
        return pd.DataFrame()
    records = [
        {
            "id": r.id,
            "txn_id": r.txn_id,
            "utr": r.utr or "",
            "amount": r.amount,
            "fee": r.fee,
            "net_amount": r.net_amount,
            "date": pd.Timestamp(r.date),
            "description": r.description or "",
            "reference": r.reference or "",
            "status": r.status or "",
        }
        for r in rows
    ]
    return pd.DataFrame(records).set_index("id")


def _classify_exception(
    row: pd.Series,
    source: str,
    unmatched_utrs: set[str],
) -> str:
    """Heuristic exception category."""
    utr = str(row.get("utr", "")).strip()
    desc = str(row.get("description", "")).lower()

    if "batch" in utr.lower() or "batch" in desc:
        return "batch"
    if utr in unmatched_utrs and source == "bank":
        return "missing"
    if "duplicate" in desc:
        return "duplicate"
    if source == "gateway":
        return "missing"
    return "missing"


def run_matching(
    db: Session,
    run_id: str,
    threshold: float = 0.70,
) -> dict:
    """
    Full 3-pass reconciliation for a given run_id.
    Returns summary dict (same payload as /report endpoint).
    """
    try:
        threshold = float(threshold.default) if hasattr(threshold, "default") else float(threshold)
    except Exception:
        threshold = 0.70

    logger.info("Starting matching run_id=%s threshold=%.2f", run_id, threshold)

    gw_df = _load_df(db, run_id, "gateway")
    bank_df = _load_df(db, run_id, "bank")
    ledger_df = _load_df(db, run_id, "ledger")

    if gw_df.empty or bank_df.empty:
        logger.warning("Empty DataFrames for run_id=%s", run_id)
        return {}

    unmatched_gw: set[int] = set(gw_df.index)
    unmatched_bank: set[int] = set(bank_df.index)

    all_match_results: list[MatchResult] = []

    # ── Pass 1: Exact ────────────────────────────────────────────────────────
    exact_matches, unmatched_gw, unmatched_bank = exact_match(
        gw_df, bank_df, ledger_df, unmatched_gw, unmatched_bank, threshold
    )

    for m in exact_matches:
        mr = MatchResult(
            run_id=run_id,
            gateway_txn_id=m.gateway_idx,
            bank_txn_id=m.bank_idx,
            ledger_txn_id=m.ledger_idx,
            confidence=m.confidence,
            reason=m.reason,
            match_type="exact",
            status="matched",
            gateway_amount=m.gateway_amount,
            bank_amount=m.bank_amount,
            ledger_amount=m.ledger_amount,
            gateway_date=m.gateway_date,
            bank_date=m.bank_date,
            gateway_utr=m.gateway_utr,
            bank_utr=m.bank_utr,
            gateway_txn_ref=m.gateway_txn_ref,
        )
        db.add(mr)
        all_match_results.append(mr)

    # ── Pass 2: Fuzzy ────────────────────────────────────────────────────────
    fuzzy_matches, unmatched_gw, unmatched_bank = fuzzy_match(
        gw_df, bank_df, ledger_df, unmatched_gw, unmatched_bank, threshold
    )

    for m in fuzzy_matches:
        mr = MatchResult(
            run_id=run_id,
            gateway_txn_id=m.gateway_idx,
            bank_txn_id=m.bank_idx,
            ledger_txn_id=m.ledger_idx,
            confidence=m.confidence,
            reason=m.reason,
            match_type="fuzzy",
            status="matched",
            gateway_amount=m.gateway_amount,
            bank_amount=m.bank_amount,
            ledger_amount=m.ledger_amount,
            gateway_date=m.gateway_date,
            bank_date=m.bank_date,
            gateway_utr=m.gateway_utr,
            bank_utr=m.bank_utr,
            gateway_txn_ref=m.gateway_txn_ref,
        )
        db.add(mr)
        all_match_results.append(mr)

    # ── Pass 3: Batch ────────────────────────────────────────────────────────
    batch_matches, unmatched_gw, unmatched_bank = batch_unbundle(
        gw_df, bank_df, unmatched_gw, unmatched_bank, threshold
    )

    for bm in batch_matches:
        # One MatchResult per gateway row in the batch
        for gi in bm.gateway_indices:
            mr = MatchResult(
                run_id=run_id,
                gateway_txn_id=gi,
                bank_txn_id=bm.bank_idx,
                ledger_txn_id=None,
                confidence=bm.confidence,
                reason=bm.reason,
                match_type="batch",
                status="matched",
                gateway_amount=float(gw_df.loc[gi]["amount"]),
                bank_amount=bm.bank_amount,
                bank_date=bm.bank_date,
                gateway_utr=str(gw_df.loc[gi].get("utr", "")),
                bank_utr=bm.bank_utr,
                gateway_txn_ref=str(gw_df.loc[gi].get("txn_id", "")),
            )
            db.add(mr)
            all_match_results.append(mr)

    db.flush()

    # ── Exceptions ───────────────────────────────────────────────────────────
    exception_records: list[ExceptionRecord] = []
    bank_utrs = {str(bank_df.loc[bi].get("utr", "")) for bi in unmatched_bank}

    for gi in unmatched_gw:
        row = gw_df.loc[gi]
        utr = str(row.get("utr", ""))
        cat = "fee_adjusted" if utr in bank_utrs else "missing"
        exc = ExceptionRecord(
            run_id=run_id,
            txn_id=gi,
            source="gateway",
            category=cat,
            description=f"Unmatched gateway transaction — UTR: {utr} | Amount: ₹{row['amount']:,.2f}",
            amount=float(row["amount"]),
            date=row["date"].to_pydatetime() if hasattr(row["date"], "to_pydatetime") else row["date"],
            utr=utr,
        )
        db.add(exc)
        exception_records.append(exc)

    for bi in unmatched_bank:
        row = bank_df.loc[bi]
        utr = str(row.get("utr", ""))
        desc = str(row.get("description", "")).lower()
        if "batch" in desc or "batch" in utr.lower():
            cat = "batch"
        else:
            cat = "timing_drift" if abs(float(row.get("amount", 0))) > 0 else "missing"
        exc = ExceptionRecord(
            run_id=run_id,
            txn_id=bi,
            source="bank",
            category=cat,
            description=f"Unmatched bank credit — UTR: {utr} | Amount: ₹{row['amount']:,.2f}",
            amount=float(row["amount"]),
            date=row["date"].to_pydatetime() if hasattr(row["date"], "to_pydatetime") else row["date"],
            utr=utr,
        )
        db.add(exc)
        exception_records.append(exc)

    db.flush()

    # ── Report ───────────────────────────────────────────────────────────────
    total_matched = len(exact_matches) + len(fuzzy_matches) + len(batch_matches)
    total_exceptions = len(exception_records)
    total_gw = len(gw_df)
    match_rate = total_matched / total_gw if total_gw > 0 else 0.0
    avg_conf = (
        sum(mr.confidence for mr in all_match_results) / len(all_match_results)
        if all_match_results else 0.0
    )

    exc_breakdown: dict[str, int] = {}
    for exc in exception_records:
        exc_breakdown[exc.category] = exc_breakdown.get(exc.category, 0) + 1

    report = Report(
        run_id=run_id,
        total_gateway=total_gw,
        total_bank=len(bank_df),
        total_ledger=len(ledger_df),
        matched=total_matched,
        unmatched=total_exceptions,
        match_rate=round(match_rate, 4),
        exception_breakdown=exc_breakdown,
        threshold_used=threshold,
        avg_confidence=round(avg_conf, 4),
        exact_matches=len(exact_matches),
        fuzzy_matches=len(fuzzy_matches),
        batch_matches=len(batch_matches),
    )
    db.add(report)

    # ── JSON Report Artifact ─────────────────────────────────────────────────
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    run_date = datetime.utcnow().strftime("%Y-%m-%d")
    report_path = REPORTS_DIR / f"run_{run_date}_{run_id[:8]}.json"
    report_data = {
        "run_id": run_id,
        "run_at": datetime.utcnow().isoformat(),
        "total_gateway": total_gw,
        "total_bank": len(bank_df),
        "total_ledger": len(ledger_df),
        "matched": total_matched,
        "unmatched": total_exceptions,
        "match_rate": round(match_rate * 100, 2),
        "avg_confidence": round(avg_conf, 4),
        "threshold_used": threshold,
        "pass_breakdown": {
            "exact": len(exact_matches),
            "fuzzy": len(fuzzy_matches),
            "batch": len(batch_matches),
        },
        "exception_breakdown": exc_breakdown,
    }
    report_path.write_text(json.dumps(report_data, indent=2))
    report.report_path = str(report_path)

    db.commit()
    logger.info(
        "Matching complete run_id=%s matched=%d unmatched=%d rate=%.1f%%",
        run_id, total_matched, total_exceptions, match_rate * 100
    )
    return report_data
