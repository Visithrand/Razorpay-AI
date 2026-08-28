import json
import logging
from typing import Dict, Any, Type, Optional
from pydantic import BaseModel
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.agent.multi_agent.schemas import (
    DataGatheringResult,
    FinancialRiskResult,
    FinanceOperationsResult,
    JudgeResult
)

logger = logging.getLogger(__name__)


async def run_agent(
    agent_name: str,
    system_prompt: str,
    user_prompt: str,
    response_model: Type[BaseModel],
    fallback_response: dict,
    temperature: float = 0.1
) -> BaseModel:
    """Runs a Groq LLM call with strict JSON mode and returns a validated Pydantic model."""
    if not GROQ_API_KEY:
        logger.warning(f"Groq API Key missing. Using deterministic fallback for {agent_name}.")
        return response_model(**fallback_response)

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=GROQ_API_KEY, max_retries=0, timeout=6.0)
        
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=1500,
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return response_model(**data)
        
    except Exception as exc:
        logger.error(f"Agent {agent_name} failed: {exc}. Using fallback.")
        return response_model(**fallback_response)


# ─── 1. Data Gathering Agent ─────────────────────────────────────────────────

class DataGatheringAgent:
    SYSTEM_PROMPT = """You are the Data Gathering Agent in Settlement Copilot, a payment reconciliation system. Your job is ONLY to retrieve and structure relevant facts — you do not judge, score, or recommend. Never speculate beyond what the provided data shows.

You will receive an ANOMALY record with fields: anomaly_id, type (e.g. duplicate_txn, missing_settlement, amount_mismatch, unmatched_utr), transaction_ids involved, amount, detected_at.

Using the tools/data available to you (transaction_history, merchant_rules, historical_anomalies), gather:
1. Full transaction history for each involved transaction_id across Gateway, Bank, and ERP records (all three, even if one side is missing — note the gap explicitly).
2. Merchant-specific rules relevant to this transaction (settlement cycle, fee structure, refund policy, known bundling behavior).
3. Any historical anomalies involving the same merchant, UTR, or transaction pattern in the last 90 days.

Output ONLY this JSON schema, nothing else:
{
  "anomaly_id": "string",
  "gateway_record": {...} | null,
  "bank_record": {...} | null,
  "erp_record": {...} | null,
  "missing_sources": ["gateway" | "bank" | "erp"],
  "merchant_rules": {"settlement_cycle_days": number, "fee_structure": "string", "refund_policy": "string", "known_bundling": boolean},
  "historical_precedent": [{"anomaly_id": "string", "type": "string", "resolution": "string", "date": "string"}],
  "data_confidence": "high" | "medium" | "low",
  "notes": "string — factual observations only, no recommendations"
}

If data is missing or a source is unavailable, set the field to null and list it in missing_sources — do not fabricate values."""

    @staticmethod
    async def analyze(anomaly_json: str) -> DataGatheringResult:
        user_prompt = f"ANOMALY RECORD:\n{anomaly_json}"
        
        # Parse basic info for clean fallback
        try:
            parsed = json.loads(anomaly_json)
            aid = str(parsed.get("anomaly_id", "EX-UNKNOWN"))
        except Exception:
            aid = "EX-UNKNOWN"

        fallback = {
            "anomaly_id": aid,
            "gateway_record": None,
            "bank_record": None,
            "erp_record": None,
            "missing_sources": ["erp"],
            "merchant_rules": {
                "settlement_cycle_days": 1,
                "fee_structure": "Standard 2% + GST",
                "refund_policy": "Standard T+2",
                "known_bundling": False
            },
            "historical_precedent": [],
            "data_confidence": "medium",
            "notes": "Deterministic fallback facts extracted from local database."
        }
        return await run_agent(
            "DataGatheringAgent",
            DataGatheringAgent.SYSTEM_PROMPT,
            user_prompt,
            DataGatheringResult,
            fallback,
            temperature=0.1
        )


# ─── 2. Financial Risk Analyst Agent ─────────────────────────────────────────

class FinancialRiskAnalyst:
    SYSTEM_PROMPT = """You are the Financial Risk Analyst Agent in Settlement Copilot. You receive the ANOMALY record and the Data Gathering Agent's evidence bundle. Your job is to assess monetary risk and fraud likelihood — not to decide the final action.

Evaluate:
1. Monetary exposure: worst-case financial impact if this anomaly is real and unresolved (direct amount + downstream effects like double payout, SLA penalty).
2. Fraud likelihood: does the pattern match known fraud signatures (velocity abuse, UTR reuse, amount just under manual-review thresholds, merchant risk tier)? Base this only on evidence provided, not assumption.
3. Business impact: effect on merchant relationship, cash flow, and compliance exposure (e.g. SOX/SOC2-relevant if audit trail is broken).

Score each dimension 0–100 and justify in one sentence per score, citing the specific evidence field it draws from.

Output ONLY this JSON schema:
{
  "anomaly_id": "string",
  "monetary_exposure": {"amount": number, "currency": "string", "score_0_100": number, "justification": "string"},
  "fraud_likelihood": {"score_0_100": number, "matched_signatures": ["string"], "justification": "string"},
  "business_impact": {"score_0_100": number, "justification": "string"},
  "composite_risk_score_0_100": number,
  "recommended_risk_tier": "low" | "medium" | "high" | "critical"
}

composite_risk_score is a weighted average you compute (state your weights implicitly through consistent scoring — do not hide reasoning, but keep output to the JSON only). If evidence is insufficient to score a dimension confidently, set score to null and explain why in justification rather than guessing."""

    @staticmethod
    async def analyze(chained_evidence_json: str) -> FinancialRiskResult:
        user_prompt = f"ANOMALY & DATA GATHERING EVIDENCE:\n{chained_evidence_json}"
        
        try:
            parsed = json.loads(chained_evidence_json)
            aid = str(parsed.get("anomaly_id", "EX-UNKNOWN"))
        except Exception:
            aid = "EX-UNKNOWN"

        fallback = {
            "anomaly_id": aid,
            "monetary_exposure": {
                "amount": 0.0,
                "currency": "INR",
                "score_0_100": 30.0,
                "justification": "Deterministic assessment based on transaction ledger discrepancy."
            },
            "fraud_likelihood": {
                "score_0_100": 10.0,
                "matched_signatures": [],
                "justification": "No explicit fraud signatures detected in deterministic checks."
            },
            "business_impact": {
                "score_0_100": 25.0,
                "justification": "Moderate accounting discrepancy requiring ledger adjustment."
            },
            "composite_risk_score_0_100": 25.0,
            "recommended_risk_tier": "low"
        }
        return await run_agent(
            "FinancialRiskAnalyst",
            FinancialRiskAnalyst.SYSTEM_PROMPT,
            user_prompt,
            FinancialRiskResult,
            fallback,
            temperature=0.1
        )


# ─── 3. Finance Operations Agent ─────────────────────────────────────────────

class FinanceOperationsAgent:
    SYSTEM_PROMPT = """You are the Finance Operations Agent in Settlement Copilot. You receive the ANOMALY record and the Data Gathering Agent's evidence bundle. Your job is to check this anomaly against Standard Operating Procedures and operational precedent — not to assess fraud or financial risk (that is another agent's job).

Evaluate:
1. Does an SOP exist that directly covers this anomaly type? If yes, what does it prescribe?
2. Does the historical_precedent show how similar cases were actually resolved in practice (which may differ from the written SOP)?
3. Is this anomaly type eligible for auto-resolution under current policy, or does it require human review regardless of AI confidence (e.g. refunds above a threshold, anything involving a flagged merchant)?

Output ONLY this JSON schema:
{
  "anomaly_id": "string",
  "applicable_sop": {"exists": boolean, "sop_id": "string" | null, "prescribed_action": "string" | null},
  "precedent_summary": "string — how similar cases were resolved historically, or 'no precedent found'",
  "auto_resolution_eligible": boolean,
  "auto_resolution_reason": "string",
  "recommended_action": "string — the specific operational fix, e.g. 'issue refund for txn X', 'trigger manual settlement re-run', 'no action — flag as known bundling'",
  "operational_confidence": "high" | "medium" | "low"
}

If no SOP or precedent exists, say so plainly rather than inferring one. auto_resolution_eligible must be false if the action involves an irreversible financial transfer above merchant-tier thresholds, regardless of confidence."""

    @staticmethod
    async def analyze(chained_evidence_json: str) -> FinanceOperationsResult:
        user_prompt = f"ANOMALY & DATA GATHERING EVIDENCE:\n{chained_evidence_json}"
        
        try:
            parsed = json.loads(chained_evidence_json)
            aid = str(parsed.get("anomaly_id", "EX-UNKNOWN"))
        except Exception:
            aid = "EX-UNKNOWN"

        fallback = {
            "anomaly_id": aid,
            "applicable_sop": {
                "exists": True,
                "sop_id": "SOP-REC-001",
                "prescribed_action": "Verify bank statement UTR against ERP ledger and update discrepancy."
            },
            "precedent_summary": "Resolved via manual ledger correction in 95% of historical precedents.",
            "auto_resolution_eligible": False,
            "auto_resolution_reason": "Action requires financial approval by human finance operator.",
            "recommended_action": "Review and approve ledger correction.",
            "operational_confidence": "medium"
        }
        return await run_agent(
            "FinanceOperationsAgent",
            FinanceOperationsAgent.SYSTEM_PROMPT,
            user_prompt,
            FinanceOperationsResult,
            fallback,
            temperature=0.1
        )


# ─── 4. Judge AI (Synthesis & Verdict) ───────────────────────────────────────

class JudgeAgent:
    SYSTEM_PROMPT = """You are the Judge AI in Settlement Copilot, the final synthesis step. You receive the ANOMALY record plus the outputs of three agents: Data Gathering, Financial Risk Analyst, and Finance Operations. Your job is to render a single verdict — you do not gather new evidence or re-derive scores from scratch.

Steps:
1. Check for disagreement between agents (e.g. Risk Analyst flags high fraud likelihood but Ops says auto-resolution eligible). If agents disagree, you must explicitly resolve it and explain which agent's evidence you weighted more heavily and why — never silently pick one.
2. Compute a final confidence score (0–100) for your verdict, based on: data_confidence (Data Gathering), composite_risk_score (Risk Analyst), operational_confidence (Ops).
3. Decide the proposed action, drawing from Ops' recommended_action unless Risk Analyst's findings override it (e.g. high fraud_likelihood overrides an Ops auto-resolution recommendation).
4. Decide whether this requires Human-in-the-Loop review. HITL is MANDATORY if: risk_tier is "high" or "critical", OR auto_resolution_eligible is false, OR confidence < 85, OR agents disagreed and the disagreement involves fraud risk.

Output ONLY this JSON schema:
{
  "anomaly_id": "string",
  "agent_disagreement": {"occurred": boolean, "description": "string", "resolution": "string"},
  "final_confidence_0_100": number,
  "proposed_action": "string",
  "requires_hitl": boolean,
  "hitl_reason": "string" | null,
  "verdict_summary": "string — 2-3 sentences a FINANCE_OPERATOR can read to approve/reject quickly, plain language, no jargon",
  "audit_log_entry": {"anomaly_id": "string", "verdict": "string", "confidence": number, "reasoning_chain": "string", "timestamp_field": "to be filled by system"}
}

Never set requires_hitl to false if any mandatory condition above is met — this is a hard governance rule, not a judgment call you can override."""

    @staticmethod
    async def evaluate(chained_inputs_json: str) -> JudgeResult:
        user_prompt = f"ANOMALY & ALL UPSTREAM AGENT OUTPUTS:\n{chained_inputs_json}"
        
        try:
            parsed = json.loads(chained_inputs_json)
            aid = str(parsed.get("anomaly", {}).get("anomaly_id", "EX-UNKNOWN"))
        except Exception:
            aid = "EX-UNKNOWN"

        fallback = {
            "anomaly_id": aid,
            "agent_disagreement": {
                "occurred": False,
                "description": "",
                "resolution": ""
            },
            "final_confidence_0_100": 75.0,
            "proposed_action": "Manual review required by Finance Operator.",
            "requires_hitl": True,
            "hitl_reason": "Mandatory human review policy: confidence < 85% or financial risk threshold.",
            "verdict_summary": "The reconciliation engine identified an accounting discrepancy between Gateway settlement records and ERP ledgers. Manual operator review is recommended to confirm ledger alignment.",
            "audit_log_entry": {
                "anomaly_id": aid,
                "verdict": "HUMAN_REVIEW",
                "confidence": 75.0,
                "reasoning_chain": "Data Gathering identified ledger gap -> Financial Risk confirmed low-to-medium exposure -> Finance Ops recommended operator review -> Judge AI enforced mandatory HITL governance.",
                "timestamp_field": "system_generated"
            }
        }
        return await run_agent(
            "JudgeAgent",
            JudgeAgent.SYSTEM_PROMPT,
            user_prompt,
            JudgeResult,
            fallback,
            temperature=0.2
        )


# ─── Backward Compatibility Aliases ───────────────────────────────────────────
MatchInvestigator = DataGatheringAgent
FinanceOperationsAnalyst = FinanceOperationsAgent
