import pytest
import asyncio
from app.agent.multi_agent.schemas import (
    DataGatheringResult, FinancialRiskResult, FinanceOperationsResult, JudgeResult
)
from app.agent.multi_agent.agents import (
    DataGatheringAgent, FinancialRiskAnalyst, FinanceOperationsAgent, JudgeAgent
)

@pytest.mark.asyncio
async def test_data_gathering_fallback():
    anomaly_json = '{"anomaly_id": "EX-101", "type": "amount_mismatch"}'
    result = await DataGatheringAgent.analyze(anomaly_json)
    assert isinstance(result, DataGatheringResult)
    assert result.anomaly_id == "EX-101"
    assert result.data_confidence in ["high", "medium", "low"]

@pytest.mark.asyncio
async def test_risk_analyst_fallback():
    chained_json = '{"anomaly_id": "EX-101", "data_gathering": {}}'
    result = await FinancialRiskAnalyst.analyze(chained_json)
    assert isinstance(result, FinancialRiskResult)
    assert result.anomaly_id == "EX-101"
    assert result.recommended_risk_tier in ["low", "medium", "high", "critical"]

@pytest.mark.asyncio
async def test_finance_ops_fallback():
    chained_json = '{"anomaly_id": "EX-101", "data_gathering": {}}'
    result = await FinanceOperationsAgent.analyze(chained_json)
    assert isinstance(result, FinanceOperationsResult)
    assert result.anomaly_id == "EX-101"
    assert isinstance(result.auto_resolution_eligible, bool)

@pytest.mark.asyncio
async def test_judge_fallback():
    chained_json = '{"anomaly": {"anomaly_id": "EX-101"}}'
    result = await JudgeAgent.evaluate(chained_json)
    assert isinstance(result, JudgeResult)
    assert result.requires_hitl is True
    assert result.decision == "HUMAN_REVIEW"
    assert result.final_confidence_0_100 >= 0.0

def test_schema_validations():
    judge = JudgeResult(
        anomaly_id="EX-1",
        final_confidence_0_100=90.0,
        proposed_action="Execute automatic ledger adjustment",
        requires_hitl=False,
        verdict_summary="Reconciliation confirmed with high confidence."
    )
    assert judge.confidence == 0.9
    assert judge.decision == "RESOLVED"
    assert judge.recommendation == "Execute automatic ledger adjustment"
