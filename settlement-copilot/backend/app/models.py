"""SQLAlchemy ORM models for Settlement Copilot."""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    JSON, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """User/Merchant credentials and OTP verification."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, unique=True, index=True, nullable=False) # email (@gmail.com) or phone (+91...)
    name = Column(String, default="Merchant Admin")
    role = Column(String, default="Admin")
    mid = Column(String, default="mid_rzp_live")
    otp = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    is_verified = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


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
    category = Column(String)   # MISSING_BANK_RECORD | AMOUNT_MISMATCH | DUPLICATE | SETTLEMENT_DELAY | FEE_DEDUCTION | REFERENCE_MISMATCH | AMBIGUOUS_MATCH
    description = Column(Text)
    amount = Column(Float)
    date = Column(DateTime)
    utr = Column(String)
    priority = Column(String, default="MEDIUM")   # CRITICAL | HIGH | MEDIUM | LOW
    status = Column(String, default="PENDING")     # PENDING | APPROVED | REJECTED
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


class InvestigationRecord(Base):
    """Stores structured AI investigation output for an exception."""
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    exception_id = Column(Integer, ForeignKey("exceptions.id"), nullable=True)
    run_id = Column(String, index=True, nullable=False)
    
    gateway_amount = Column(Float, default=0.0)
    bank_amount = Column(Float, default=0.0)
    erp_amount = Column(Float, default=0.0)
    amount_diff = Column(Float, default=0.0)
    
    utr_status = Column(String, default="Matched")
    date_status = Column(String, default="Matched")
    
    root_cause = Column(String, nullable=False)
    overall_confidence = Column(Float, default=0.95)
    business_impact = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    evidence_json = Column(JSON, default=dict)
    
    requires_human_review = Column(Integer, default=1) # 1 for True, 0 for False (sqlite boolean)
    final_decision = Column(String)
    final_reasoning = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentFindingRecord(Base):
    """Stores individual AI agent findings."""
    __tablename__ = "agent_findings"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False)
    agent_type = Column(String, nullable=False)
    finding = Column(JSON, default=dict)
    confidence = Column(Float, default=0.0)
    evidence = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class JudgeDecisionRecord(Base):
    """Stores the final Judge agent decision."""
    __tablename__ = "judge_decisions"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False)
    decision = Column(String, nullable=False)
    recommendation = Column(Text)
    confidence = Column(Float, default=0.0)
    reasoning = Column(Text)
    agent_agreement = Column(Float, default=0.0)
    requires_human_review = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditRecord(Base):
    """Stores immutable, persistent audit log entries for key actions."""
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecommendationRecord(Base):
    """Stores recommended actions awaiting human-in-the-loop approval."""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False)
    action_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    original_val = Column(String)
    proposed_val = Column(String)
    reason = Column(Text, nullable=False)
    confidence = Column(Float, default=0.95)
    status = Column(String, default="PENDING")         # PENDING | APPROVED | REJECTED
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class HumanFeedback(Base):
    """Stores human operational learning feedback for future evaluation."""
    __tablename__ = "human_feedback"

    id = Column(Integer, primary_key=True, index=True)
    exception_id = Column(Integer, ForeignKey("exceptions.id"), nullable=False)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    human_decision = Column(String, nullable=False)     # CONFIRMED_FEE | CONFIRMED_TYPO | CONFIRMED_DELAY | OVERRIDDEN
    feedback_notes = Column(Text, nullable=True)
    user_actor = Column(String, default="Finance Admin")
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    """Stores immutable, persistent audit log entries for all human approvals & AI actions."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String, nullable=False)             # Finance Admin | AI Agent | System
    action_type = Column(String, nullable=False)       # APPROVE_RECOMMENDATION | REJECT_RECOMMENDATION | HUMAN_FEEDBACK | AI_INVESTIGATION
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    previous_state = Column(String, nullable=True)
    new_state = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    investigation_ref = Column(String, nullable=True)
