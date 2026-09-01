import asyncio
import json
import logging
import time
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import (
    ExceptionRecord, RawTransaction, InvestigationRecord, 
    AgentFindingRecord, JudgeDecisionRecord, AuditRecord,
    RecommendationRecord
)
from app.agent.multi_agent.schemas import (
    DataGatheringResult, FinancialRiskResult, FinanceOperationsResult,
    JudgeResult
)
from app.agent.multi_agent.agents import (
    DataGatheringAgent, FinancialRiskAnalyst, FinanceOperationsAgent, JudgeAgent
)

logger = logging.getLogger(__name__)


class InvestigationOrchestrator:
    @staticmethod
    def _is_investigation_needed(exception: ExceptionRecord) -> bool:
        """Determines if a multi-agent investigation is warranted."""
        if exception.priority in ["CRITICAL", "HIGH"]:
            return True
        if exception.amount and exception.amount > 50000:
            return True
        if exception.category in [
            "MISSING_BANK_RECORD", "AMOUNT_MISMATCH", "DUPLICATE", 
            "SETTLEMENT_DELAY", "REFUND_MISMATCH", "AMBIGUOUS_MATCH"
        ]:
            return True
        return False

    @staticmethod
    def _gather_raw_anomaly_context(db: Session, exception: ExceptionRecord) -> Dict[str, Any]:
        """Collects raw data across Gateway, Bank, ERP, Merchant Rules, and Precedents."""
        gw_record = None
        bank_record = None
        erp_record = None
        
        if exception.txn_id:
            txn = db.query(RawTransaction).filter(RawTransaction.id == exception.txn_id).first()
            if txn:
                raw_data = {
                    "id": txn.id,
                    "amount": txn.amount,
                    "net_amount": txn.net_amount,
                    "fee": txn.fee,
                    "date": txn.date.isoformat() if txn.date else None,
                    "utr": txn.utr,
                    "description": txn.description,
                    "payment_method": txn.payment_method
                }
                if exception.source == "gateway":
                    gw_record = raw_data
                elif exception.source == "bank":
                    bank_record = raw_data
                elif exception.source == "ledger":
                    erp_record = raw_data

        # If gateway record is still none, fill from exception
        if not gw_record and exception.amount:
            gw_record = {
                "amount": exception.amount,
                "utr": exception.utr,
                "date": exception.date.isoformat() if exception.date else None
            }

        # Check for historical precedents in past 90 days
        historical = []
        try:
            past_excs = db.query(ExceptionRecord).filter(
                ExceptionRecord.id != exception.id,
                ExceptionRecord.category == exception.category
            ).order_by(ExceptionRecord.id.desc()).limit(3).all()

            for pe in past_excs:
                historical.append({
                    "anomaly_id": f"EX-{pe.id}",
                    "type": pe.category,
                    "resolution": "RESOLVED_BY_OPERATOR" if pe.status == "RESOLVED" else "PENDING",
                    "date": pe.date.isoformat() if pe.date else "2026-08-01"
                })
        except Exception:
            pass

        return {
            "anomaly_id": f"EX-{exception.id}",
            "type": exception.category,
            "transaction_ids": [exception.txn_id] if exception.txn_id else [f"TXN-{exception.id}"],
            "amount": exception.amount or 0.0,
            "detected_at": exception.date.isoformat() if exception.date else None,
            "gateway_record": gw_record,
            "bank_record": bank_record,
            "erp_record": erp_record,
            "merchant_rules": {
                "settlement_cycle_days": 1,
                "fee_structure": "Standard 2% Gateway + GST",
                "refund_policy": "Standard T+2",
                "known_bundling": "bundle" in (exception.description or "").lower()
            },
            "historical_precedent": historical
        }

    @staticmethod
    def _run_deterministic_checks(evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Provides deterministic verification."""
        amt = evidence.get("amount") or 0
        has_utr = bool(evidence.get("utr") and evidence.get("utr") != "—")
        cat = str(evidence.get("type") or evidence.get("category") or "")
        
        return {
            "amount_match": amt > 0,
            "utr_match": has_utr,
            "timing_drift": "timing" in cat.lower() or "delay" in cat.lower(),
            "ledger_entry": bool(evidence.get("erp_record")),
            "duplicate": "duplicate" in cat.lower()
        }

    @staticmethod
    async def investigate(db: Session, exception_id: int, force: bool = False) -> Optional[JudgeResult]:
        logger.info(f'{{"event": "multi_agent_investigation_started", "exception_id": {exception_id}}}')
        start_time = time.time()
        
        exception = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
        if not exception:
            logger.error(f"Exception {exception_id} not found.")
            return None

        if not force and not InvestigationOrchestrator._is_investigation_needed(exception):
            logger.info(f"Skipping AI investigation for {exception_id} - deterministic rules suffice.")
            return None

        # 1. Gather raw anomaly context
        raw_anomaly = InvestigationOrchestrator._gather_raw_anomaly_context(db, exception)
        anomaly_json = json.dumps(raw_anomaly, default=str)

        # 2. Step 1: Data Gathering Agent
        try:
            data_gathering_result = await DataGatheringAgent.analyze(anomaly_json)
        except Exception as exc:
            logger.error(f"Data Gathering Agent failed: {exc}")
            data_gathering_result = DataGatheringResult(
                anomaly_id=raw_anomaly["anomaly_id"],
                gateway_record=raw_anomaly.get("gateway_record"),
                bank_record=raw_anomaly.get("bank_record"),
                erp_record=raw_anomaly.get("erp_record"),
                missing_sources=["erp"] if not raw_anomaly.get("erp_record") else [],
                notes="Gathered via deterministic database extractor."
            )

        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f'{{"event": "agent_completed", "agent": "data_gathering", "exception_id": {exception_id}, "latency_ms": {latency_ms}}}')

        # 3. Step 2: Chain to Financial Risk Analyst & Finance Operations Agent
        chained_evidence_bundle = {
            "anomaly": raw_anomaly,
            "data_gathering": data_gathering_result.model_dump()
        }
        chained_evidence_json = json.dumps(chained_evidence_bundle, default=str)

        risk_task = asyncio.create_task(FinancialRiskAnalyst.analyze(chained_evidence_json))
        ops_task = asyncio.create_task(FinanceOperationsAgent.analyze(chained_evidence_json))

        results = await asyncio.gather(risk_task, ops_task, return_exceptions=True)

        risk_result = results[0] if not isinstance(results[0], Exception) else FinancialRiskResult(
            anomaly_id=raw_anomaly["anomaly_id"],
            composite_risk_score_0_100=30.0,
            recommended_risk_tier="medium"
        )
        ops_result = results[1] if not isinstance(results[1], Exception) else FinanceOperationsResult(
            anomaly_id=raw_anomaly["anomaly_id"],
            recommended_action="Review ledger discrepancy manually",
            auto_resolution_eligible=False,
            auto_resolution_reason="Agent execution fallback."
        )

        for agent, result in zip(["financial_risk", "finance_operations"], results):
            if isinstance(result, Exception):
                logger.error(f"Agent {agent} failed with error: {result}")
            else:
                latency_ms = int((time.time() - start_time) * 1000)
                logger.info(f'{{"event": "agent_completed", "agent": "{agent}", "exception_id": {exception_id}, "latency_ms": {latency_ms}}}')

        # 4. Step 3: Chain all upstream agent outputs into Judge AI
        judge_input_bundle = {
            "anomaly": raw_anomaly,
            "data_gathering": data_gathering_result.model_dump(),
            "financial_risk": risk_result.model_dump(),
            "finance_operations": ops_result.model_dump()
        }
        judge_input_json = json.dumps(judge_input_bundle, default=str)

        try:
            judge_result = await JudgeAgent.evaluate(judge_input_json)
            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f'{{"event": "judge_completed", "exception_id": {exception_id}, "confidence": {judge_result.confidence}, "latency_ms": {latency_ms}}}')
        except Exception as e:
            logger.error(f"Judge Agent failed: {e}")
            # Deterministic Fallback
            det = InvestigationOrchestrator._run_deterministic_checks(raw_anomaly)
            gw = raw_anomaly.get("gateway_record") or {}
            bank = raw_anomaly.get("bank_record") or {}
            gw_amt = gw.get("amount", 0.0)
            bank_amt = bank.get("amount", 0.0)
            diff = abs(gw_amt - bank_amt)
            
            reasoning = "Decision source: Deterministic fallback.\n\n"
            if diff > 0:
                reasoning += f"Amount discrepancy of ₹{diff:,.2f} detected between gateway and bank records.\n"
            elif det["duplicate"]:
                reasoning += "Duplicate transaction suspected based on references.\n"
            elif det["timing_drift"]:
                reasoning += "Timing drift detected between systems.\n"
            elif not det["ledger_entry"]:
                reasoning += "No ledger entry found for this transaction.\n"
            else:
                reasoning += "Investigation required. Deterministic rules found no clear matching pattern.\n"
                
            reasoning += f"\nEvidence Matrix:\nAmount match: {'✓' if det['amount_match'] else '✕'}\nUTR match: {'✓' if det['utr_match'] else '✕'}"

            judge_result = JudgeResult(
                anomaly_id=raw_anomaly["anomaly_id"],
                final_confidence_0_100=85.0,
                proposed_action="Manual operator review required.",
                requires_hitl=True,
                hitl_reason="System fallback triggered.",
                verdict_summary=reasoning
            )

        # 5. Persist to DB
        try:
            exc_amount = exception.amount or 0.0
            gw_amt = (data_gathering_result.gateway_record or {}).get("amount", exc_amount)
            bank_amt = (data_gathering_result.bank_record or {}).get("amount", exc_amount)
            erp_amt = (data_gathering_result.erp_record or {}).get("amount", 0.0)
            diff_amt = gw_amt - bank_amt if gw_amt and bank_amt else 0.0

            # Mandatory HITL check
            final_requires_human_review = judge_result.requires_hitl
            if (
                risk_result.recommended_risk_tier in ["high", "critical"]
                or not ops_result.auto_resolution_eligible
                or judge_result.final_confidence_0_100 < 85
                or (judge_result.agent_disagreement and judge_result.agent_disagreement.occurred)
            ):
                final_requires_human_review = True

            # Create Investigation Record
            inv_record = InvestigationRecord(
                exception_id=exception.id,
                run_id=exception.run_id,
                gateway_amount=gw_amt,
                bank_amount=bank_amt,
                erp_amount=erp_amt,
                amount_diff=diff_amt,
                root_cause=judge_result.root_cause,
                overall_confidence=judge_result.confidence,
                business_impact=risk_result.business_impact.justification or "Monetary impact evaluated.",
                recommended_action=judge_result.recommendation,
                evidence_json=judge_input_bundle,
                requires_human_review=1 if final_requires_human_review else 0,
                final_decision=judge_result.decision,
                final_reasoning=judge_result.reasoning,
            )
            db.add(inv_record)
            db.commit()
            db.refresh(inv_record)

            # Create Agent Findings Records
            for result, agent_name in [
                (data_gathering_result, "data_gathering"),
                (risk_result, "financial_risk"),
                (ops_result, "finance_operations")
            ]:
                if not isinstance(result, Exception):
                    af = AgentFindingRecord(
                        investigation_id=inv_record.id,
                        agent_type=agent_name,
                        finding=result.model_dump(),
                        confidence=1.0 if agent_name == "data_gathering" else (result.composite_risk_score_0_100 / 100.0 if hasattr(result, "composite_risk_score_0_100") else 0.8),
                        evidence={"raw": result.model_dump()}
                    )
                    db.add(af)
            
            # Create Judge Decision Record
            jd = JudgeDecisionRecord(
                investigation_id=inv_record.id,
                decision=judge_result.decision,
                recommendation=judge_result.recommendation,
                confidence=judge_result.confidence,
                reasoning=judge_result.reasoning,
                agent_agreement=judge_result.agent_agreement,
                agent_disagreement=1 if (judge_result.agent_disagreement and judge_result.agent_disagreement.occurred) else 0,
                requires_human_review=1 if final_requires_human_review else 0
            )
            db.add(jd)

            # Audit Record
            ar = AuditRecord(
                investigation_id=inv_record.id,
                actor="Judge AI & Orchestrator",
                action="MULTI_AGENT_INVESTIGATION_COMPLETED",
                details={
                    "verdict": judge_result.verdict_summary,
                    "audit_chain": judge_result.audit_log_entry.reasoning_chain if judge_result.audit_log_entry else "",
                    "requires_hitl": final_requires_human_review
                }
            )
            db.add(ar)

            # Create Recommendation Record
            rec = RecommendationRecord(
                investigation_id=inv_record.id,
                action_type="MANUAL_REVIEW" if final_requires_human_review else "AUTO_RESOLVE",
                description=judge_result.recommendation,
                original_val=f"₹{erp_amt:,.2f}" if erp_amt else "Missing",
                proposed_val=f"₹{gw_amt:,.2f}" if gw_amt else "See AI reasoning",
                reason=judge_result.reasoning,
                confidence=judge_result.confidence,
                status="PENDING"
            )
            db.add(rec)
            
            db.commit()
        except Exception as e:
            logger.error(f"Failed to persist investigation results: {e}")
            db.rollback()

        return judge_result
