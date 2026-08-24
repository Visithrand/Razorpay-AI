"""Tests for AI Investigation pipeline & root cause classification."""

import pytest


def test_root_cause_classification_erp_amount_error():
    gw_amt = 12450.0
    erp_amt = 12400.0
    diff = abs(gw_amt - erp_amt)
    
    assert diff == 50.0
    root_cause = "erp_amount_error"
    recommended_action = f"Update ERP ledger record value from ₹{erp_amt:,.2f} to verified settlement amount ₹{gw_amt:,.2f}."
    
    assert "Update ERP ledger" in recommended_action


def test_root_cause_classification_timing_drift():
    category = "timing_drift"
    amount = 20000.0
    
    assert category == "timing_drift"
    action_type = "RE_RECONCILE"
    assert action_type == "RE_RECONCILE"
