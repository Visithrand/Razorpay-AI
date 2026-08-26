from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class MatchAgentResult(BaseModel):
    agent: str = Field(default="match_investigator")
    finding: str = Field(description="Explanation of the matching result")
    candidate_transaction_ids: List[int] = Field(description="List of IDs for possible matching candidates")
    evidence: List[str] = Field(description="List of factual evidence points")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    recommendation: str = Field(description="Recommended match or action")


class RiskAgentResult(BaseModel):
    agent: str = Field(default="financial_risk")
    risk_level: str = Field(description="Risk level: LOW, MEDIUM, HIGH, CRITICAL")
    financial_exposure: float = Field(description="Absolute financial exposure amount")
    currency: str = Field(default="INR")
    reason: str = Field(description="Explanation for the risk assessment")
    evidence: List[str] = Field(description="List of factual evidence points")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")


class FinanceAgentResult(BaseModel):
    agent: str = Field(default="finance_operations")
    exception_type: str = Field(description="Type of exception (e.g. amount mismatch, missing settlement)")
    root_cause: str = Field(description="Likely root cause")
    business_impact: str = Field(description="Operational impact of the exception")
    recommended_action: str = Field(description="Recommended next operational step")
    evidence: List[str] = Field(description="List of factual evidence points")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")


class EvidenceBundle(BaseModel):
    exception_id: int
    facts: List[Dict[str, Any]]
    financial_exposure: float
    candidate_matches: List[Dict[str, Any]]
    agent_findings: List[Dict[str, Any]]
    conflicts: List[str]
    overall_evidence_quality: float


class JudgeResult(BaseModel):
    decision: str = Field(description="RESOLVED, RECOMMENDED_ACTION, HUMAN_REVIEW, INSUFFICIENT_EVIDENCE")
    exception_type: str = Field(description="Final classification of the exception type")
    root_cause: str = Field(description="Final determined root cause")
    financial_impact: float = Field(description="Final financial exposure/impact")
    recommendation: str = Field(description="Final recommended action")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    requires_human_review: bool = Field(description="Whether human review is required")
    reasoning: str = Field(description="Explanation of the final decision")
    supporting_evidence: List[str] = Field(description="Evidence supporting the final decision")
    agent_agreement: float = Field(description="Score representing agreement between agents (0.0 to 1.0)")
    agent_disagreement: bool = Field(default=False, description="Explicit flag if there is significant conflicting evidence between agents")
