"""Repository for Report, InvestigationRecord, RecommendationRecord, and AuditLog operations."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Report, InvestigationRecord, RecommendationRecord, AuditLog


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_report(self, report: Report) -> Report:
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_latest_report(self) -> Optional[Report]:
        return self.db.query(Report).order_by(Report.run_at.desc()).first()

    def get_by_run_id(self, run_id: str) -> Optional[Report]:
        return self.db.query(Report).filter(Report.run_id == run_id).first()

    def save_investigation(self, inv: InvestigationRecord) -> InvestigationRecord:
        self.db.add(inv)
        self.db.commit()
        self.db.refresh(inv)
        return inv

    def save_recommendation(self, rec: RecommendationRecord) -> RecommendationRecord:
        self.db.add(rec)
        self.db.commit()
        self.db.refresh(rec)
        return rec

    def add_audit_log(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_audit_logs(self, limit: int = 50) -> List[AuditLog]:
        return self.db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
