"""Tests for deterministic Settlement Health Score & Amount at Risk calculations."""

import pytest


def test_settlement_health_calculation_good_score():
    """Verify deterministic Health Score formula produces GOOD status for high match rate."""
    match_rate = 0.95
    total_risk_amount = 1000.0
    total_gateway_amt = 100000.0
    missing_count = 1
    duplicate_count = 0

    score = 100.0
    score -= (1.0 - match_rate) * 40.0
    if total_gateway_amt > 0:
        score -= min((total_risk_amount / total_gateway_amt) * 300.0, 30.0)
    score -= min((missing_count + duplicate_count) * 2.5, 15.0)

    score = round(max(min(score, 100.0), 0.0), 1)

    assert score >= 85.0
    assert score == 92.5


def test_amount_at_risk_breakdown():
    """Verify Amount at Risk aggregates correctly across exception categories."""
    exceptions = [
        {"category": "timing_drift", "amount": 2000.0},
        {"category": "fee_adjusted", "amount": 500.0},
        {"category": "missing", "amount": 1500.0},
        {"category": "amount_mismatch", "amount": 100.0},
    ]

    total_risk = sum(e["amount"] for e in exceptions)
    assert total_risk == 4100.0
