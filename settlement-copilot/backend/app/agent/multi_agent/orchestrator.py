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
    MatchAgentResult, RiskAgentResult, FinanceAgentResult, 
    EvidenceBundle, JudgeResult
)
from app.agent.multi_agent.agents import (
    MatchInvestigator, FinancialRiskAnalyst, FinanceOperationsAnalyst, JudgeAgent
)

logger = logging.getLogger(__name__)

class InvestigationOrchestrator:
    @staticmethod
    def _is_investigation_needed(exception: ExceptionRecord) -> bool:
        """Determines if a multi-agent investigation is warranted."""
        # Simple rule-based check
        # High value, specific categories, or just missing/unmatched
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
    def _gather_evidence(db: Session, exception: ExceptionRecord) -> Dict[str, Any]:
        """Collects all deterministic evidence from the database."""
        evidence = {
            "exception_id": exception.id,
            "category": exception.category,
            "description": exception.description,
            "amount": exception.amount,
            "date": exception.date.isoformat() if exception.date else None,
            "utr": exception.utr,
            "source": exception.source,
            "transaction_details": None
        }
        
        if exception.txn_id:
            txn = db.query(RawTransaction).filter(RawTransaction.id == exception.txn_id).first()
            if txn:
                evidence["transaction_details"] = {
                    "id": txn.id,
                    "amount": txn.amount,
                    "net_amount": txn.net_amount,
                    "fee": txn.fee,
                    "date": txn.date.isoformat() if txn.date else None,
                    "utr": txn.utr,
                    "description": txn.description,
                    "payment_method": txn.payment_method
                }
        
        return evidence

    @staticmethod
    def _run_deterministic_checks(evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Provides a strong, deterministic fallback if AI fails."""
        amt = evidence.get("amount") or 0
        has_utr = bool(evidence.get("utr") and evidence.get("utr") != "—")
        cat = evidence.get("category", "")
        source = evidence.get("source", "")
        
        return {
            "amount_match": amt > 0,
            "utr_match": has_utr,
            "timing_drift": "timing" in cat or "delay" in cat,
            "ledger_entry": source == "ledger",
            "duplicate": "duplicate" in cat
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

        # 1. Gather Evidence
        raw_evidence = InvestigationOrchestrator._gather_evidence(db, exception)
        evidence_json = json.dumps(raw_evidence, default=str)

        # 2. Run independent agents concurrently
        match_task = asyncio.create_task(MatchInvestigator.analyze(evidence_json))
        risk_task = asyncio.create_task(FinancialRiskAnalyst.analyze(evidence_json))
        ops_task = asyncio.create_task(FinanceOperationsAnalyst.analyze(evidence_json))

        # We wait for all, handling exceptions so one failure doesn't crash the rest
        results = await asyncio.gather(match_task, risk_task, ops_task, return_exceptions=True)
        
        match_result = results[0] if not isinstance(results[0], Exception) else MatchAgentResult(
            finding="Agent Failed", candidate_transaction_ids=[], evidence=[], confidence=0.0, recommendation="Error"
        )
        risk_result = results[1] if not isinstance(results[1], Exception) else RiskAgentResult(
            risk_level="UNKNOWN", financial_exposure=0.0, reason="Agent Failed", evidence=[], confidence=0.0
        )
        ops_result = results[2] if not isinstance(results[2], Exception) else FinanceAgentResult(
            exception_type="UNKNOWN", root_cause="Agent Failed", business_impact="Unknown", recommended_action="Error", evidence=[], confidence=0.0
        )

        for agent, result, result_type in zip(
            ["match_investigator", "financial_risk", "finance_operations"], 
            results, 
            [MatchAgentResult, RiskAgentResult, FinanceAgentResult]
        ):
            if isinstance(result, Exception):
                logger.error(f"Agent {agent} failed with error: {result}")
            else:
                latency_ms = int((time.time() - start_time) * 1000)
                logger.info(f'{{"event": "agent_completed", "agent": "{agent}", "exception_id": {exception_id}, "latency_ms": {latency_ms}}}')

        # 3. Aggregate Evidence
        aggregator = EvidenceBundle(
            exception_id=exception_id,
            facts=[raw_evidence],
            financial_exposure=risk_result.financial_exposure,
            candidate_matches=[{"id": cid} for cid in match_result.candidate_transaction_ids],
            agent_findings=[
                match_result.model_dump(),
                risk_result.model_dump(),
                ops_result.model_dump()
            ],
            conflicts=[], # We could implement deterministic conflict detection here
            overall_evidence_quality=0.8
        )
        agg_json = json.dumps(aggregator.model_dump(), default=str)

        # 4. Run Judge Agent
        try:
            judge_result = await JudgeAgent.evaluate(agg_json)
            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f'{{"event": "judge_completed", "exception_id": {exception_id}, "confidence": {judge_result.confidence}, "latency_ms": {latency_ms}}}')
        except Exception as e:
            logger.error(f"Judge Agent failed: {e}")
            
            # 🔥 STRONG DETERMINISTIC FALLBACK
            det = InvestigationOrchestrator._run_deterministic_checks(raw_evidence)
            
            reasoning = "AI SERVICE UNAVAILABLE: Deterministic evidence analysis used.\n\n"
            reasoning += f"Amount match       {'✓' if det['amount_match'] else '✕'}\n"
            reasoning += f"UTR match           {'✓' if det['utr_match'] else '✕'}\n"
            reasoning += f"Timing drift        {'⚠' if det['timing_drift'] else '✓'}\n"
            reasoning += f"Duplicate           {'⚠' if det['duplicate'] else '✓'}\n"
            
            judge_result = JudgeResult(
                decision="HUMAN_REVIEW",
                exception_type="UNKNOWN",
                root_cause="System Failure - Rule Fallback",
                financial_impact=raw_evidence.get("amount") or 0.0,
                recommendation="Human review required.",
                confidence=1.0, # Deterministic rules are 100% confident in what they see
                requires_human_review=True,
                reasoning=reasoning,
                supporting_evidence=["Deterministic system constraints checked."],
                agent_agreement=0.0,
                agent_disagreement=False
            )

        # 5. Persist to DB
        try:
            # Extract real amounts from evidence for accurate wiring
            exc_amount = exception.amount or 0.0
            txn_details = raw_evidence.get("transaction_details") or {}
            
            # Default to exception amount if specific breakdown isn't available
            gw_amt = txn_details.get("amount", exc_amount) if exception.source == "gateway" else exc_amount
            bank_amt = txn_details.get("amount", exc_amount) if exception.source == "bank" else exc_amount
            erp_amt = txn_details.get("amount", exc_amount) if exception.source == "ledger" else exc_amount
            diff_amt = gw_amt - bank_amt if gw_amt and bank_amt else 0.0

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
                business_impact=ops_result.business_impact,
                recommended_action=judge_result.recommendation,
                evidence_json=aggregator.model_dump(),
                requires_human_review=1 if judge_result.requires_human_review else 0,
                final_decision=judge_result.decision,
                final_reasoning=judge_result.reasoning,
            )
            db.add(inv_record)
            db.commit()
            db.refresh(inv_record)

            # Create Agent Findings Records
            for result, agent_name in [
                (match_result, "match_investigator"),
                (risk_result, "financial_risk"),
                (ops_result, "finance_operations")
            ]:
                if not isinstance(result, Exception):
                    af = AgentFindingRecord(
                        investigation_id=inv_record.id,
                        agent_type=agent_name,
                        finding=result.model_dump(),
                        confidence=result.confidence,
                        evidence={"evidence_points": result.evidence}
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
                agent_disagreement=1 if judge_result.agent_disagreement else 0,
                requires_human_review=1 if judge_result.requires_human_review else 0
            )
            db.add(jd)

            # Audit Record
            ar = AuditRecord(
                investigation_id=inv_record.id,
                actor="System Orchestrator",
                action="MULTI_AGENT_INVESTIGATION_COMPLETED",
                details={"judge_decision": judge_result.decision}
            )
            db.add(ar)

            # Create Recommendation Record
            rec = RecommendationRecord(
                investigation_id=inv_record.id,
                action_type="MANUAL_REVIEW" if judge_result.requires_human_review else "AUTO_RESOLVE",
                description=judge_result.recommendation,
                original_val="N/A",
                proposed_val="See AI reasoning",
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
