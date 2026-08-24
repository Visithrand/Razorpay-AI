"""Reconciliation Service — core business logic for reconciliation, health scoring, and risk analysis."""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.match_repository import MatchRepository
from app.repositories.report_repository import ReportRepository


class ReconciliationService:
    def __init__(self, db: Session):
        self.db = db
        self.txn_repo = TransactionRepository(db)
        self.match_repo = MatchRepository(db)
        self.report_repo = ReportRepository(db)

    def calculate_settlement_health(self, run_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates deterministic Settlement Health Score (0-100)."""
        if not run_id:
            latest = self.report_repo.get_latest_report()
            if not latest:
                return {
                    "score": 100.0,
                    "status": "GOOD",
                    "total_processed": 0.0,
                    "match_rate": 1.0,
                    "matched_count": 0,
                    "unmatched_count": 0,
                    "exact_matches": 0,
                    "fuzzy_matches": 0,
                    "batch_matches": 0,
                    "amount_at_risk": 0.0,
                    "exceptions_count": 0,
                    "explanation": "No reconciliation runs executed yet. Baseline health score is 100.0 (GOOD)."
                }
            run_id = latest.run_id

        report = self.report_repo.get_by_run_id(run_id)
        exceptions = self.match_repo.get_exceptions_for_run(run_id)
        gateway_txns = self.txn_repo.get_by_run_and_source(run_id, "gateway")

        total_gateway_amt = sum(t.amount for t in gateway_txns)
        match_rate = report.match_rate if report else 1.0
        exceptions_count = len(exceptions)
        total_risk_amount = sum(e.amount for e in exceptions)

        missing_count = sum(1 for e in exceptions if e.category == "missing")
        duplicate_count = sum(1 for e in exceptions if e.category == "duplicate")

        score = 100.0
        score -= (1.0 - match_rate) * 40.0

        if total_gateway_amt > 0:
            risk_ratio = total_risk_amount / total_gateway_amt
            score -= min(risk_ratio * 300.0, 30.0)

        score -= min((missing_count + duplicate_count) * 2.5, 15.0)
        score = round(max(min(score, 100.0), 0.0), 1)

        health_status = "GOOD" if score >= 85.0 else ("WARNING" if score >= 70.0 else "CRITICAL")

        explanation = (
            f"Settlement Health Score of {score}/100 ({health_status}). Calculated deterministically: "
            f"Match rate of {(match_rate * 100):.1f}% across {report.matched if report else 0} matched batches, "
            f"with ₹{total_risk_amount:,.2f} Amount at Risk across {exceptions_count} active exceptions."
        )

        return {
            "score": score,
            "status": health_status,
            "total_processed": total_gateway_amt,
            "match_rate": match_rate,
            "matched_count": report.matched if report else 0,
            "unmatched_count": report.unmatched if report else 0,
            "exact_matches": report.exact_matches if report else 0,
            "fuzzy_matches": report.fuzzy_matches if report else 0,
            "batch_matches": report.batch_matches if report else 0,
            "amount_at_risk": total_risk_amount,
            "exceptions_count": exceptions_count,
            "explanation": explanation
        }

    def calculate_settlement_risk(self, run_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates Amount at Risk metric broken down by exception category."""
        if not run_id:
            latest = self.report_repo.get_latest_report()
            if not latest:
                return {
                    "total_amount_at_risk": 0.0,
                    "exception_count": 0,
                    "risk_percentage": 0.0,
                    "breakdown": {
                        "timing_drift": {"amount": 0.0, "count": 0, "percentage": 0.0},
                        "fee_adjusted": {"amount": 0.0, "count": 0, "percentage": 0.0},
                        "missing": {"amount": 0.0, "count": 0, "percentage": 0.0},
                        "amount_mismatch": {"amount": 0.0, "count": 0, "percentage": 0.0},
                        "duplicate": {"amount": 0.0, "count": 0, "percentage": 0.0}
                    }
                }
            run_id = latest.run_id

        exceptions = self.match_repo.get_exceptions_for_run(run_id)
        gateway_txns = self.txn_repo.get_by_run_and_source(run_id, "gateway")
        total_gateway_amt = sum(t.amount for t in gateway_txns) or 1.0

        total_risk = sum(e.amount for e in exceptions)
        risk_pct = round((total_risk / total_gateway_amt) * 100, 2)

        categories = ["timing_drift", "fee_adjusted", "missing", "amount_mismatch", "duplicate", "batch", "other"]
        breakdown = {}
        for cat in categories:
            cat_items = [e for e in exceptions if e.category == cat or (cat == "other" and e.category not in categories)]
            breakdown[cat] = {
                "amount": sum(e.amount for e in cat_items),
                "count": len(cat_items),
                "percentage": round((sum(e.amount for e in cat_items) / total_risk * 100), 1) if total_risk > 0 else 0.0
            }

        return {
            "run_id": run_id,
            "total_amount_at_risk": total_risk,
            "exception_count": len(exceptions),
            "risk_percentage": risk_pct,
            "breakdown": breakdown
        }
