"""
Tests for NL2SQL SQL generation and validation.
Uses mocked Groq responses to test without API calls.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.agent.nl2sql import validate_sql, generate_sql


class TestSQLValidation:
    """Test the validate-before-execute safety check."""

    def test_non_select_rejected(self):
        """DROP TABLE should be rejected immediately."""
        db = MagicMock()
        ok, err = validate_sql("DROP TABLE raw_transactions", db)
        assert not ok
        assert "SELECT" in err or "Unsafe" in err

    def test_unsupported_marker(self):
        """UNSUPPORTED marker should return False gracefully."""
        db = MagicMock()
        ok, err = validate_sql("UNSUPPORTED", db)
        assert not ok
        assert "cannot be answered" in err.lower()

    def test_delete_rejected(self):
        """DELETE statement should be rejected."""
        db = MagicMock()
        ok, err = validate_sql("DELETE FROM raw_transactions", db)
        assert not ok

    def test_insert_rejected(self):
        """INSERT statement should be rejected."""
        db = MagicMock()
        ok, err = validate_sql("INSERT INTO raw_transactions VALUES (1)", db)
        assert not ok

    def test_select_passes_format_check(self):
        """Valid SELECT passes the first-word check (EXPLAIN may fail without DB)."""
        db = MagicMock()
        db.execute.side_effect = Exception("no db")  # simulate no DB connection
        ok, err = validate_sql("SELECT id FROM raw_transactions LIMIT 1", db)
        # Should fail because of DB error, not because of format
        assert not ok
        assert "no db" in err.lower() or "db" in err.lower()

    def test_select_valid_with_mock_db(self):
        """Mocked EXPLAIN succeeds → validation passes."""
        db = MagicMock()
        db.execute.return_value = MagicMock()
        ok, err = validate_sql("SELECT * FROM raw_transactions LIMIT 10", db)
        assert ok
        assert err == ""
