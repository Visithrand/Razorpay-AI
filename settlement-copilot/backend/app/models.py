"""SQLAlchemy ORM models for Settlement Copilot."""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    JSON, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class RawTransaction(Base):
    """Stores every ingested record — gateway, bank, or ledger."""
    __tablename__ = "raw_transactions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, index=True, nullable=False)
    source = Column(String, nullable=False)    # gateway | bank | ledger
    txn_id = Column(String, index=True)
    utr = Column(String, index=True)
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    net_amount = Column(Float)
    date = Column(DateTime, nullable=False)
    description = Column(Text)
    reference = Column(String)
    status = Column(String)
    payment_method = Column(String)
    raw_data = Column(JSON)
    ingested_at = Column(DateTime, default=datetime.utcnow)

    # Relationships for match results
    gateway_matches = relationship(
        "MatchResult",
        foreign_keys="MatchResult.gateway_txn_id",
        back_populates="gateway_txn",
        lazy="dynamic",
    )
    bank_matches = relationship(
        "MatchResult",
        foreign_keys="MatchResult.bank_txn_id",
        back_populates="bank_txn",
        lazy="dynamic",
    )
    ledger_matches = relationship(
        "MatchResult",
        foreign_keys="MatchResult.ledger_txn_id",
        back_populates="ledger_txn",
        lazy="dynamic",
    )
    exceptions = relationship("ExceptionRecord", back_populates="transaction", lazy="dynamic")


class MatchResult(Base):
    """Stores the output of the matching engine for one run."""
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, index=True, nullable=False)

    gateway_txn_id = Column(Integer, ForeignKey("raw_transactions.id"), nullable=True)
    bank_txn_id = Column(Integer, ForeignKey("raw_transactions.id"), nullable=True)
    ledger_txn_id = Column(Integer, ForeignKey("raw_transactions.id"), nullable=True)

    confidence = Column(Float, nullable=False)   # 0.0 – 1.0
    reason = Column(Text)                         # human-readable explanation
    match_type = Column(String)                   # exact | fuzzy | batch | unmatched
    status = Column(String)                       # matched | partial | unmatched

    gateway_amount = Column(Float)
    bank_amount = Column(Float)
    ledger_amount = Column(Float)
    gateway_date = Column(DateTime)
    bank_date = Column(DateTime)
    gateway_utr = Column(String)
    bank_utr = Column(String)
    gateway_txn_ref = Column(String)              # the original txn_id string from CSV
    created_at = Column(DateTime, default=datetime.utcnow)

    gateway_txn = relationship(
        "RawTransaction", foreign_keys=[gateway_txn_id], back_populates="gateway_matches"
    )
    bank_txn = relationship(
        "RawTransaction", foreign_keys=[bank_txn_id], back_populates="bank_matches"
    )
    ledger_txn = relationship(
        "RawTransaction", foreign_keys=[ledger_txn_id], back_populates="ledger_matches"
    )


class ExceptionRecord(Base):
    """Stores transactions that could not be fully matched."""
    __tablename__ = "exceptions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, index=True, nullable=False)
    txn_id = Column(Integer, ForeignKey("raw_transactions.id"), nullable=True)
    source = Column(String)
    category = Column(String)   # fee_adjusted | timing_drift | batch | missing | duplicate | amount_typo
    description = Column(Text)
    amount = Column(Float)
    date = Column(DateTime)
    utr = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("RawTransaction", back_populates="exceptions")


class Report(Base):
    """Aggregate stats for one reconciliation run."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True, nullable=False)
    run_at = Column(DateTime, default=datetime.utcnow)
    total_gateway = Column(Integer, default=0)
    total_bank = Column(Integer, default=0)
    total_ledger = Column(Integer, default=0)
    matched = Column(Integer, default=0)
    unmatched = Column(Integer, default=0)
    match_rate = Column(Float, default=0.0)      # 0.0 – 1.0
    exception_breakdown = Column(JSON, default=dict)
    threshold_used = Column(Float, default=0.7)
    avg_confidence = Column(Float, default=0.0)
    exact_matches = Column(Integer, default=0)
    fuzzy_matches = Column(Integer, default=0)
    batch_matches = Column(Integer, default=0)
    report_path = Column(String)                 # path to JSON report artifact
