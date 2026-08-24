"""Repository for MatchResult and ExceptionRecord database operations."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import MatchResult, ExceptionRecord


class MatchRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_matches(self, matches: List[MatchResult]) -> List[MatchResult]:
        self.db.add_all(matches)
        self.db.commit()
        return matches

    def save_exceptions(self, exceptions: List[ExceptionRecord]) -> List[ExceptionRecord]:
        self.db.add_all(exceptions)
        self.db.commit()
        return exceptions

    def get_matches_for_run(self, run_id: str, threshold: float = 0.0, match_type: Optional[str] = None) -> List[MatchResult]:
        q = self.db.query(MatchResult).filter(
            MatchResult.run_id == run_id,
            MatchResult.confidence >= threshold
        )
        if match_type:
            q = q.filter(MatchResult.match_type == match_type)
        return q.order_by(MatchResult.confidence.desc()).all()

    def get_exceptions_for_run(self, run_id: str, category: Optional[str] = None) -> List[ExceptionRecord]:
        q = self.db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id)
        if category:
            q = q.filter(ExceptionRecord.category == category)
        return q.all()

    def clear_run(self, run_id: str):
        self.db.query(MatchResult).filter(MatchResult.run_id == run_id).delete()
        self.db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).delete()
        self.db.commit()
