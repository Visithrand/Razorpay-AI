import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import PaymentEvent, ExceptionRecord, EventRisk
from app.live.detector import DetectionEngine, IdempotencyException
from app.agent.multi_agent.orchestrator import InvestigationOrchestrator

# Setup in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_idempotency_live_events(db):
    """Test that submitting the same transaction ID twice raises IdempotencyException."""
    event_data = {
        "transaction_id": "TXN-TEST-123",
        "merchant_id": "M-101",
        "customer_reference": "C-999",
        "amount": 1000.0,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "payment_status": "SUCCESS"
    }

    # First ingestion should succeed
    event, risk = DetectionEngine.process_event(db, event_data)
    assert event.transaction_id == "TXN-TEST-123"
    assert risk.risk_level == "NORMAL"

    # Second ingestion with same txn ID should fail
    with pytest.raises(IdempotencyException) as excinfo:
        DetectionEngine.process_event(db, event_data)
    
    assert "already processed" in str(excinfo.value).lower()

def test_high_velocity_anomaly_detection(db):
    """Test that multiple rapid transactions from same customer triggers velocity anomaly."""
    base_time = datetime.datetime.utcnow()
    
    # Ingest 6 rapid events for same customer
    for i in range(6):
        event_data = {
            "transaction_id": f"TXN-VEL-{i}",
            "merchant_id": "M-101",
            "customer_reference": "C-RAPID",
            "amount": 500.0 + i, # Vary amount to avoid duplicate detection
            "timestamp": (base_time + datetime.timedelta(seconds=i)).isoformat(),
            "payment_status": "SUCCESS"
        }
        event, risk = DetectionEngine.process_event(db, event_data)
        
        if i < 5:
            assert "velocity" not in risk.classification.lower()
        else:
            # The 6th transaction should trigger velocity anomaly classification (score 25)
            assert "velocity" in risk.classification.lower()
            assert risk.risk_score >= 25

def test_deterministic_fallback():
    """Test that the deterministic rule engine correctly processes evidence when AI is unavailable."""
    # Simulate evidence that lacks UTR but has matching amounts
    evidence = {
        "amount": 10500.0,
        "utr": None,
        "category": "amount_mismatch",
        "source": "gateway"
    }
    
    fallback_result = InvestigationOrchestrator._run_deterministic_checks(evidence)
    
    assert fallback_result["amount_match"] is True
    assert fallback_result["utr_match"] is False
    assert fallback_result["timing_drift"] is False
    assert fallback_result["ledger_entry"] is False
    
    evidence_with_drift = {
        "amount": 200.0,
        "utr": "SBIN123",
        "category": "settlement_delay",
        "source": "bank"
    }
    
    fallback_result_2 = InvestigationOrchestrator._run_deterministic_checks(evidence_with_drift)
    assert fallback_result_2["timing_drift"] is True
    assert fallback_result_2["utr_match"] is True


