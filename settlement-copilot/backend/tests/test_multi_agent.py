import pytest
from app.agent.multi_agent.schemas import MatchAgentResult, RiskAgentResult, FinanceAgentResult, JudgeResult
from app.agent.multi_agent.agents import MatchInvestigator, FinancialRiskAnalyst, FinanceOperationsAnalyst, JudgeAgent
import asyncio

@pytest.mark.asyncio
async def test_match_investigator_fallback():
    evidence_json = '{"test": "data"}'
    result = await MatchInvestigator.analyze(evidence_json)
    assert isinstance(result, MatchAgentResult)
    assert result.agent == "match_investigator"

@pytest.mark.asyncio
async def test_risk_analyst_fallback():
    evidence_json = '{"test": "data"}'
    result = await FinancialRiskAnalyst.analyze(evidence_json)
    assert isinstance(result, RiskAgentResult)
    assert result.agent == "financial_risk"

@pytest.mark.asyncio
async def test_finance_ops_fallback():
    evidence_json = '{"test": "data"}'
    result = await FinanceOperationsAnalyst.analyze(evidence_json)
    assert isinstance(result, FinanceAgentResult)
    assert result.agent == "finance_operations"

@pytest.mark.asyncio
async def test_judge_fallback():
    evidence_json = '{"test": "data"}'
    result = await JudgeAgent.evaluate(evidence_json)
    assert isinstance(result, JudgeResult)
    assert result.decision == "INSUFFICIENT_EVIDENCE"
    assert result.requires_human_review == True

# Basic testing of the schema correctness
def test_schema_validations():
    mr = MatchAgentResult(finding="test", candidate_transaction_ids=[1,2], evidence=["e1"], confidence=0.8, recommendation="rec")
    assert mr.finding == "test"
    assert mr.confidence == 0.8
