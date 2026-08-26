import json
import logging
from typing import Dict, Any, Type, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.agent.multi_agent.schemas import (
    MatchAgentResult,
    RiskAgentResult,
    FinanceAgentResult,
    JudgeResult
)

logger = logging.getLogger(__name__)

async def run_agent(
    agent_name: str,
    system_prompt: str,
    user_prompt: str,
    response_model: Type[BaseModel],
    fallback_response: dict
) -> BaseModel:
    """Runs a Groq LLM call and returns a validated Pydantic model."""
    if not GROQ_API_KEY:
        logger.warning(f"Groq API Key missing. Using fallback for {agent_name}.")
        return response_model(**fallback_response)

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=GROQ_API_KEY)
        
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1000,
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return response_model(**data)
        
    except Exception as exc:
        logger.error(f"Agent {agent_name} failed: {exc}. Using fallback.")
        return response_model(**fallback_response)


class MatchInvestigator:
    @staticmethod
    async def analyze(evidence_json: str) -> MatchAgentResult:
        system_prompt = """You are the Match Investigator agent.
Determine why a transaction was or was not reconciled.
Do NOT modify anything. You are read-only.
You MUST output valid JSON conforming to this structure:
{
  "agent": "match_investigator",
  "finding": "...",
  "candidate_transaction_ids": [],
  "evidence": ["...", "..."],
  "confidence": 0.0,
  "recommendation": "..."
}"""
        user_prompt = f"Analyze the following evidence:\n{evidence_json}"
        fallback = {
            "agent": "match_investigator",
            "finding": "Fallback analysis due to LLM unavailability.",
            "candidate_transaction_ids": [],
            "evidence": ["Deterministic fallback triggered."],
            "confidence": 0.5,
            "recommendation": "Manual review required."
        }
        return await run_agent("MatchInvestigator", system_prompt, user_prompt, MatchAgentResult, fallback)


class FinancialRiskAnalyst:
    @staticmethod
    async def analyze(evidence_json: str) -> RiskAgentResult:
        system_prompt = """You are the Financial Risk Analyst agent.
Determine the financial significance and risk of the exception.
Calculate absolute exposure based on provided data. Do NOT invent numbers.
Risk levels: LOW, MEDIUM, HIGH, CRITICAL.
You MUST output valid JSON conforming to this structure:
{
  "agent": "financial_risk",
  "risk_level": "...",
  "financial_exposure": 0.0,
  "currency": "INR",
  "reason": "...",
  "evidence": ["...", "..."],
  "confidence": 0.0
}"""
        user_prompt = f"Analyze the following financial data for risk:\n{evidence_json}"
        fallback = {
            "agent": "financial_risk",
            "risk_level": "MEDIUM",
            "financial_exposure": 0.0,
            "currency": "INR",
            "reason": "Fallback analysis due to LLM unavailability.",
            "evidence": ["Deterministic fallback triggered."],
            "confidence": 0.5
        }
        return await run_agent("FinancialRiskAnalyst", system_prompt, user_prompt, RiskAgentResult, fallback)


class FinanceOperationsAnalyst:
    @staticmethod
    async def analyze(evidence_json: str) -> FinanceAgentResult:
        system_prompt = """You are the Finance Operations Analyst agent.
Determine the operational/business meaning of the exception.
Distinguish CONFIRMED FACT from LIKELY CAUSE.
You MUST output valid JSON conforming to this structure:
{
  "agent": "finance_operations",
  "exception_type": "...",
  "root_cause": "...",
  "business_impact": "...",
  "recommended_action": "...",
  "evidence": ["...", "..."],
  "confidence": 0.0
}"""
        user_prompt = f"Analyze the operational impact of this exception:\n{evidence_json}"
        fallback = {
            "agent": "finance_operations",
            "exception_type": "UNKNOWN",
            "root_cause": "Fallback analysis due to LLM unavailability.",
            "business_impact": "Unknown",
            "recommended_action": "Investigate manually.",
            "evidence": ["Deterministic fallback triggered."],
            "confidence": 0.5
        }
        return await run_agent("FinanceOperationsAnalyst", system_prompt, user_prompt, FinanceAgentResult, fallback)


class JudgeAgent:
    @staticmethod
    async def evaluate(aggregated_evidence_json: str) -> JudgeResult:
        system_prompt = """You are the final Judge Agent.
Compare the agent findings, identify agreements and explicit disagreements.
CRITICAL AI GOVERNANCE RULE: You must NOT blindly average the agents. 
If the Match Agent says "likely valid" but the Risk Agent says "potential duplicate", you MUST detect this as an agent disagreement.
When agent disagreement is detected, you MUST set `agent_disagreement: true`, severely penalize the final confidence (e.g., < 50%), and set `requires_human_review: true`.
Verify conclusions against the supplied database evidence.
Decisions: RESOLVED, RECOMMENDED_ACTION, HUMAN_REVIEW, INSUFFICIENT_EVIDENCE.
You MUST output valid JSON conforming to this structure:
{
  "decision": "...",
  "exception_type": "...",
  "root_cause": "...",
  "financial_impact": 0.0,
  "recommendation": "...",
  "confidence": 0.0,
  "requires_human_review": true,
  "reasoning": "...",
  "supporting_evidence": ["...", "..."],
  "agent_agreement": 0.0,
  "agent_disagreement": true
}"""
        user_prompt = f"Evaluate the aggregated evidence and agent findings:\n{aggregated_evidence_json}"
        fallback = {
            "decision": "INSUFFICIENT_EVIDENCE",
            "exception_type": "UNKNOWN",
            "root_cause": "Unable to determine (fallback)",
            "financial_impact": 0.0,
            "recommendation": "Manual human review required.",
            "confidence": 0.0,
            "requires_human_review": True,
            "reasoning": "Deterministic fallback triggered due to LLM unavailability.",
            "supporting_evidence": [],
            "agent_agreement": 0.0,
            "agent_disagreement": False
        }
        return await run_agent("JudgeAgent", system_prompt, user_prompt, JudgeResult, fallback)
