from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union


# ─── 1. Data Gathering Agent Schema ──────────────────────────────────────────

class MerchantRules(BaseModel):
    settlement_cycle_days: int = 1
    fee_structure: str = "Standard Gateway 2% + GST"
    refund_policy: str = "Standard T+2 refund processing"
    known_bundling: bool = False


class HistoricalPrecedent(BaseModel):
    anomaly_id: str = "N/A"
    type: str = "general"
    resolution: str = "resolved"
    date: str = "N/A"


class DataGatheringResult(BaseModel):
    anomaly_id: str
    gateway_record: Optional[Dict[str, Any]] = None
    bank_record: Optional[Dict[str, Any]] = None
    erp_record: Optional[Dict[str, Any]] = None
    missing_sources: List[str] = Field(default_factory=list)
    merchant_rules: MerchantRules = Field(default_factory=MerchantRules)
    historical_precedent: List[HistoricalPrecedent] = Field(default_factory=list)
    data_confidence: str = Field(default="medium", description="'high' | 'medium' | 'low'")
    notes: str = Field(default="", description="Factual observations only, no recommendations")


# ─── 2. Financial Risk Analyst Agent Schema ──────────────────────────────────

class MonetaryExposure(BaseModel):
    amount: float = 0.0
    currency: str = "INR"
    score_0_100: Optional[float] = 0.0
    justification: str = ""


class FraudLikelihood(BaseModel):
    score_0_100: Optional[float] = 0.0
    matched_signatures: List[str] = Field(default_factory=list)
    justification: str = ""


class BusinessImpactScore(BaseModel):
    score_0_100: Optional[float] = 0.0
    justification: str = ""


class FinancialRiskResult(BaseModel):
    anomaly_id: str
    monetary_exposure: MonetaryExposure = Field(default_factory=MonetaryExposure)
    fraud_likelihood: FraudLikelihood = Field(default_factory=FraudLikelihood)
    business_impact: BusinessImpactScore = Field(default_factory=BusinessImpactScore)
    composite_risk_score_0_100: float = 0.0
    recommended_risk_tier: str = Field(default="low", description="'low' | 'medium' | 'high' | 'critical'")


# ─── 3. Finance Operations Agent Schema ──────────────────────────────────────

class ApplicableSOP(BaseModel):
    exists: bool = False
    sop_id: Optional[str] = None
    prescribed_action: Optional[str] = None


class FinanceOperationsResult(BaseModel):
    anomaly_id: str
    applicable_sop: ApplicableSOP = Field(default_factory=ApplicableSOP)
    precedent_summary: str = "no precedent found"
    auto_resolution_eligible: bool = False
    auto_resolution_reason: str = ""
    recommended_action: str = "Manual review required"
    operational_confidence: str = Field(default="medium", description="'high' | 'medium' | 'low'")


# ─── 4. Judge AI (Synthesis & Verdict) Schema ────────────────────────────────

class AgentDisagreement(BaseModel):
    occurred: bool = False
    description: Optional[str] = ""
    resolution: Optional[str] = ""


class AuditLogEntry(BaseModel):
    anomaly_id: str
    verdict: str
    confidence: float
    reasoning_chain: str
    timestamp_field: str = "to be filled by system"


class JudgeResult(BaseModel):
    anomaly_id: str
    agent_disagreement: AgentDisagreement = Field(default_factory=AgentDisagreement)
    final_confidence_0_100: float = 0.0
    proposed_action: str = "Manual review required"
    requires_hitl: bool = True
    hitl_reason: Optional[str] = None
    verdict_summary: str = ""
    audit_log_entry: AuditLogEntry = Field(
        default_factory=lambda: AuditLogEntry(
            anomaly_id="unknown",
            verdict="HUMAN_REVIEW",
            confidence=0.0,
            reasoning_chain="System initialized."
        )
    )

    # Backward compatibility properties for downstream services/DB mapping
    @property
    def confidence(self) -> float:
        return round(self.final_confidence_0_100 / 100.0, 4)

    @property
    def decision(self) -> str:
        if self.requires_hitl:
            return "HUMAN_REVIEW"
        if self.final_confidence_0_100 >= 85:
            return "RESOLVED"
        return "RECOMMENDED_ACTION"

    @property
    def recommendation(self) -> str:
        return self.proposed_action

    @property
    def reasoning(self) -> str:
        chain = f"\n\n[Audit Reasoning Chain]: {self.audit_log_entry.reasoning_chain}" if self.audit_log_entry and self.audit_log_entry.reasoning_chain else ""
        return f"{self.verdict_summary}{chain}".strip()

    @property
    def root_cause(self) -> str:
        return self.verdict_summary if self.verdict_summary else "Anomaly detected during multi-source reconciliation."

    @property
    def requires_human_review(self) -> bool:
        return self.requires_hitl

    @property
    def agent_agreement(self) -> float:
        if self.agent_disagreement and self.agent_disagreement.occurred:
            return 0.0
        return round(self.final_confidence_0_100 / 100.0, 4)


# ─── Backward Compatibility Aliases ───────────────────────────────────────────
MatchAgentResult = DataGatheringResult
RiskAgentResult = FinancialRiskResult
FinanceAgentResult = FinanceOperationsResult
