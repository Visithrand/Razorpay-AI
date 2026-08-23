"""
FastAPI routes — all API endpoints for Settlement Copilot.

POST  /api/upload           Upload 1–3 CSVs (gateway, bank, ledger) and run matching
GET   /api/matches          Get match results for a run (with threshold filter)
GET   /api/exceptions       Get exception list for a run
GET   /api/reports          Get all run summaries
GET   /api/report/{run_id}  Get specific run report
POST  /api/ask              Stream NL question → SQL → answer (SSE)
POST  /api/rematch          Re-run matcher with different threshold
GET   /api/sample-download  Download sample CSVs
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.ingest import ingest_csv
from app.matcher.engine import run_matching
from app.models import ExceptionRecord, MatchResult, RawTransaction, Report
from app.agent.nl2sql import ask_stream

router = APIRouter(prefix="/api")


# ─── Upload + Match ───────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_and_match(
    gateway: Optional[UploadFile] = File(None),
    bank: Optional[UploadFile] = File(None),
    ledger: Optional[UploadFile] = File(None),
    threshold: float = Form(0.70),
    db: Session = Depends(get_db),
):
    """
    Upload CSVs (gateway, bank, ledger) and immediately run the matching engine.
    Returns the reconciliation report.
    """
    if not gateway and not bank:
        raise HTTPException(400, "At least gateway and bank files are required.")

    run_id = str(uuid.uuid4())

    async def read_file(f: UploadFile) -> bytes:
        return await f.read()

    if gateway:
        gw_bytes = await read_file(gateway)
        ingest_csv(gw_bytes, "gateway", run_id, db)

    if bank:
        bank_bytes = await read_file(bank)
        ingest_csv(bank_bytes, "bank", run_id, db)

    if ledger:
        led_bytes = await read_file(ledger)
        ingest_csv(led_bytes, "ledger", run_id, db)

    report = run_matching(db, run_id, threshold=threshold)
    return {"run_id": run_id, **report}


# ─── Matches ─────────────────────────────────────────────────────────────────

@router.get("/matches")
def get_matches(
    run_id: Optional[str] = Query(None),
    threshold: float = Query(0.0),
    match_type: Optional[str] = Query(None),
    limit: int = Query(200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Return match results. Filters by threshold and match_type if provided."""
    if not run_id:
        latest = db.query(Report).order_by(Report.run_at.desc()).first()
        if not latest:
            return {"matches": [], "total": 0}
        run_id = latest.run_id

    q = db.query(MatchResult).filter(
        MatchResult.run_id == run_id,
        MatchResult.confidence >= threshold,
    )
    if match_type:
        q = q.filter(MatchResult.match_type == match_type)

    total = q.count()
    rows = q.order_by(MatchResult.confidence.desc()).offset(offset).limit(limit).all()

    return {
        "run_id": run_id,
        "total": total,
        "matches": [
            {
                "id": r.id,
                "gateway_txn_id": r.gateway_txn_id,
                "bank_txn_id": r.bank_txn_id,
                "ledger_txn_id": r.ledger_txn_id,
                "confidence": r.confidence,
                "reason": r.reason,
                "match_type": r.match_type,
                "status": r.status,
                "gateway_amount": r.gateway_amount,
                "bank_amount": r.bank_amount,
                "ledger_amount": r.ledger_amount,
                "gateway_date": r.gateway_date.isoformat() if r.gateway_date else None,
                "bank_date": r.bank_date.isoformat() if r.bank_date else None,
                "gateway_utr": r.gateway_utr,
                "bank_utr": r.bank_utr,
                "gateway_txn_ref": r.gateway_txn_ref,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


# ─── Exceptions ───────────────────────────────────────────────────────────────

@router.get("/exceptions")
def get_exceptions(
    run_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    limit: int = Query(200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Return exception records, optionally filtered by category and source."""
    if not run_id:
        latest = db.query(Report).order_by(Report.run_at.desc()).first()
        if not latest:
            return {"exceptions": [], "total": 0}
        run_id = latest.run_id

    q = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id)
    if category:
        q = q.filter(ExceptionRecord.category == category)
    if source:
        q = q.filter(ExceptionRecord.source == source)

    total = q.count()
    rows = q.offset(offset).limit(limit).all()

    return {
        "run_id": run_id,
        "total": total,
        "exceptions": [
            {
                "id": r.id,
                "source": r.source,
                "category": r.category,
                "description": r.description,
                "amount": r.amount,
                "date": r.date.isoformat() if r.date else None,
                "utr": r.utr,
            }
            for r in rows
        ],
    }


# ─── Reports ─────────────────────────────────────────────────────────────────

@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    """List all reconciliation runs (newest first)."""
    reports = db.query(Report).order_by(Report.run_at.desc()).limit(20).all()
    return {
        "reports": [
            {
                "run_id": r.run_id,
                "run_at": r.run_at.isoformat() if r.run_at else None,
                "total_gateway": r.total_gateway,
                "total_bank": r.total_bank,
                "matched": r.matched,
                "unmatched": r.unmatched,
                "match_rate": r.match_rate,
                "avg_confidence": r.avg_confidence,
                "threshold_used": r.threshold_used,
                "exception_breakdown": r.exception_breakdown,
            }
            for r in reports
        ]
    }


@router.get("/report/{run_id}")
def get_report(run_id: str, db: Session = Depends(get_db)):
    """Get detailed report for a specific run."""
    r = db.query(Report).filter(Report.run_id == run_id).first()
    if not r:
        raise HTTPException(404, f"Report not found for run_id={run_id}")
    return {
        "run_id": r.run_id,
        "run_at": r.run_at.isoformat() if r.run_at else None,
        "total_gateway": r.total_gateway,
        "total_bank": r.total_bank,
        "total_ledger": r.total_ledger,
        "matched": r.matched,
        "unmatched": r.unmatched,
        "match_rate": r.match_rate,
        "avg_confidence": r.avg_confidence,
        "threshold_used": r.threshold_used,
        "exact_matches": r.exact_matches,
        "fuzzy_matches": r.fuzzy_matches,
        "batch_matches": r.batch_matches,
        "exception_breakdown": r.exception_breakdown,
        "report_path": r.report_path,
    }


# ─── Re-match with new threshold ─────────────────────────────────────────────

@router.post("/rematch")
def rematch(
    run_id: str,
    threshold: float = 0.70,
    db: Session = Depends(get_db),
):
    """Re-run the matching engine with a new confidence threshold (live slider)."""
    # Delete previous results for this run
    db.query(MatchResult).filter(MatchResult.run_id == run_id).delete()
    db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).delete()
    db.query(Report).filter(Report.run_id == run_id).delete()
    db.commit()

    report = run_matching(db, run_id, threshold=threshold)
    return {"run_id": run_id, **report}


# ─── AI Chat ─────────────────────────────────────────────────────────────────

@router.post("/ask")
async def ask(
    question: str = Form(...),
    run_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Stream an NL answer to a question about transactions.
    Response is text/event-stream (SSE).
    """
    async def event_generator():
        async for chunk in ask_stream(question, db):
            # SSE format: data: <chunk>\n\n
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
