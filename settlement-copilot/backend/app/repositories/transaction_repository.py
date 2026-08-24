"""Repository for RawTransaction database operations."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import RawTransaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_batch(self, transactions: List[RawTransaction]) -> List[RawTransaction]:
        self.db.add_all(transactions)
        self.db.commit()
        return transactions

    def get_by_run_and_source(self, run_id: str, source: str) -> List[RawTransaction]:
        return self.db.query(RawTransaction).filter(
            RawTransaction.run_id == run_id,
            RawTransaction.source == source
        ).all()

    def get_by_id(self, txn_id: int) -> Optional[RawTransaction]:
        return self.db.query(RawTransaction).filter(RawTransaction.id == txn_id).first()

    def get_by_txn_ref(self, run_id: str, txn_ref: str) -> Optional[RawTransaction]:
        return self.db.query(RawTransaction).filter(
            RawTransaction.run_id == run_id,
            RawTransaction.txn_id == txn_ref
        ).first()
