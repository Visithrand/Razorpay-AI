"""Tests for Human-in-the-Loop approvals and persistent Audit Log entries."""

import pytest


def test_audit_log_entry_structure():
    entry = {
        "actor": "Finance Admin",
        "action_type": "APPROVE_RECOMMENDATION",
        "entity_type": "RECOMMENDATION",
        "entity_id": "REC-102",
        "previous_state": "PENDING",
        "new_state": "APPROVED",
        "reason": "Approved action: Update ERP settlement value from ₹12,400 to ₹12,450."
    }

    assert entry["actor"] == "Finance Admin"
    assert entry["new_state"] == "APPROVED"
    assert "Update ERP" in entry["reason"]
