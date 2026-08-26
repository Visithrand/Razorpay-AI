import logging
import random
import uuid
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.live.detector import DetectionEngine, IdempotencyException

router = APIRouter(prefix="/api/scenario", tags=["Scenario Lab"])
logger = logging.getLogger(__name__)

class ScenarioConfig(BaseModel):
    records: int = 1000
    duplicate_rate: float = 0.05
    missing_ledger_rate: float = 0.03
    timing_drift_rate: float = 0.04
    high_value_rate: float = 0.02

@router.post("/generate")
def generate_scenario(config: ScenarioConfig, db: Session = Depends(get_db)):
    start_time = time.time()
    
    generated_events = []
    ground_truth = [] 
    
    merchant_ids = [f"M-{i}" for i in range(100, 110)]
    customer_refs = [f"C-{i}" for i in range(1000, 1100)]
    
    base_time = datetime.utcnow() - timedelta(hours=1)
    
    for i in range(config.records):
        is_duplicate = random.random() < config.duplicate_rate
        is_high_value = random.random() < config.high_value_rate
        
        txn_id = f"SCEN-{uuid.uuid4().hex[:8]}"
        amount = round(random.uniform(100, 5000), 2)
        
        if is_high_value:
            amount = round(random.uniform(150000, 500000), 2)
            gt = "HIGH_VALUE"
        elif is_duplicate and i > 10:
            last_event = generated_events[-5]
            amount = last_event["amount"]
            merchant_id = last_event["merchant_id"]
            customer_ref = last_event["customer_reference"]
            gt = "DUPLICATE"
        else:
            merchant_id = random.choice(merchant_ids)
            customer_ref = random.choice(customer_refs)
            gt = "NORMAL"
            
        event = {
            "transaction_id": txn_id,
            "merchant_id": merchant_id if not (is_duplicate and i > 10) else merchant_id,
            "customer_reference": customer_ref if not (is_duplicate and i > 10) else customer_ref,
            "amount": amount,
            "currency": "INR",
            "timestamp": (base_time + timedelta(seconds=i*2)).isoformat(),
            "payment_status": "SUCCESS"
        }
        generated_events.append(event)
        ground_truth.append(gt)

    actual_anomalies = 0
    detected_anomalies = 0
    true_positives = 0
    false_positives = 0
    false_negatives = 0
    
    for idx, event in enumerate(generated_events):
        gt = ground_truth[idx]
        if gt != "NORMAL":
            actual_anomalies += 1
            
        try:
            _, risk_eval = DetectionEngine.process_event(db, event)
            is_flagged = risk_eval.risk_level == "HIGH"
            
            if is_flagged:
                detected_anomalies += 1
                
            if is_flagged and gt != "NORMAL":
                true_positives += 1
            elif is_flagged and gt == "NORMAL":
                false_positives += 1
            elif not is_flagged and gt != "NORMAL":
                false_negatives += 1
                
        except IdempotencyException:
            pass

    process_time = time.time() - start_time
    throughput = int(config.records / process_time) if process_time > 0 else 0
    
    precision = (true_positives / (true_positives + false_positives)) * 100 if (true_positives + false_positives) > 0 else 100.0
    recall = (true_positives / (true_positives + false_negatives)) * 100 if (true_positives + false_negatives) > 0 else 100.0

    return {
        "records_processed": config.records,
        "actual_anomalies": actual_anomalies,
        "detected_anomalies": detected_anomalies,
        "precision": round(precision, 1),
        "recall": round(recall, 1),
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "processing_time": round(process_time, 2),
        "throughput": throughput
    }
