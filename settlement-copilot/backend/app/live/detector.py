import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models import PaymentEvent, EventRisk, ExceptionRecord

logger = logging.getLogger(__name__)

class IdempotencyException(Exception):
    pass

class DetectionEngine:
    @staticmethod
    def process_event(db: Session, event_data: Dict[str, Any]) -> Tuple[PaymentEvent, EventRisk]:
        """
        Processes a raw payment event, performs idempotency check, persists it,
        runs risk detection, and returns the event and its risk evaluation.
        """
        txn_id = event_data.get("transaction_id")
        
        # 1. Idempotency Check
        existing_event = db.query(PaymentEvent).filter(PaymentEvent.transaction_id == txn_id).first()
        if existing_event:
            raise IdempotencyException(f"Transaction {txn_id} already processed.")

        # Parse timestamp safely
        try:
            ts = datetime.fromisoformat(event_data.get("timestamp", "").replace("Z", "+00:00"))
        except ValueError:
            ts = datetime.utcnow()

        # 2. Persist PaymentEvent
        event = PaymentEvent(
            transaction_id=txn_id,
            merchant_id=event_data.get("merchant_id", "UNKNOWN"),
            customer_reference=event_data.get("customer_reference", "UNKNOWN"),
            amount=float(event_data.get("amount", 0.0)),
            currency=event_data.get("currency", "INR"),
            timestamp=ts,
            payment_status=event_data.get("payment_status", "SUCCESS")
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # 3. Detect Risk
        score = 0
        signals = []
        classification = "Normal"
        related_transaction_id = None
        related_timestamp = None
        
        # Rule A: Duplicate Detection
        # Check last 60 seconds for same merchant, customer, and amount
        window_start = event.timestamp - timedelta(seconds=60)
        duplicates = db.query(PaymentEvent).filter(
            PaymentEvent.id != event.id,
            PaymentEvent.merchant_id == event.merchant_id,
            PaymentEvent.customer_reference == event.customer_reference,
            PaymentEvent.amount == event.amount,
            PaymentEvent.timestamp >= window_start
        ).all()

        if duplicates:
            latest_dup = max(duplicates, key=lambda d: d.timestamp)
            delta_sec = int(abs((event.timestamp - latest_dup.timestamp).total_seconds()))
            score += 85
            signals.append({"name": "Same merchant", "score": 10})
            signals.append({"name": "Same customer", "score": 15})
            signals.append({"name": "Same amount", "score": 20})
            signals.append({"name": f"{delta_sec}-second interval", "score": 40})
            classification = "Potential duplicate"
            
            related_transaction_id = latest_dup.transaction_id
            related_timestamp = latest_dup.timestamp.isoformat()

        # Rule B: Amount Anomaly
        if event.amount > 100000:
            score += 30
            signals.append({"name": "Unusually large amount", "score": 30})
            if classification == "Normal":
                classification = "Amount anomaly"

        # Rule C: High Velocity (More than 5 txns in last minute for same customer)
        velocity_count = db.query(PaymentEvent).filter(
            PaymentEvent.id != event.id,
            PaymentEvent.customer_reference == event.customer_reference,
            PaymentEvent.timestamp >= window_start
        ).count()
        if velocity_count >= 5:
            score += 25
            signals.append({"name": "High velocity", "score": 25})
            if classification == "Normal":
                classification = "Velocity anomaly"

        # Determine Risk Level
        score = min(score, 100)
        if score >= 80:
            risk_level = "HIGH"
        elif score >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "NORMAL"

        # 4. Generate Exception if High Risk
        exception_id = None
        if risk_level == "HIGH":
            exc = ExceptionRecord(
                run_id=f"LIVE-{uuid.uuid4().hex[:8]}",
                source="gateway",
                category=classification.lower().replace(" ", "_"),
                description=f"Live Monitor flagged: {classification}",
                amount=event.amount,
                date=event.timestamp,
                utr=None,
                priority="HIGH",
                status="PENDING"
            )
            db.add(exc)
            db.commit()
            db.refresh(exc)
            exception_id = exc.id

        # 5. Persist Risk Evaluation
        # Include extra context in the signals list or directly in a JSON field if needed.
        # But we can just use the signals array. We can inject related transaction info as well.
        extra_data = {
            "related_transaction_id": related_transaction_id,
            "related_timestamp": related_timestamp
        }
        
        risk_eval = EventRisk(
            event_id=event.id,
            risk_score=score,
            risk_level=risk_level,
            signals=signals,
            classification=classification,
            exception_id=exception_id
        )
        # Hack to attach related info for UI, can be saved to a JSON column or returned directly
        risk_eval._extra_data = extra_data
        
        db.add(risk_eval)
        db.commit()
        db.refresh(risk_eval)

        return event, risk_eval
