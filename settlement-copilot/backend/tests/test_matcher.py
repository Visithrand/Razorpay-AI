"""
Test suite for the matching engine — uses labeled fixture data.

Design: each fixture row is labeled with the expected match outcome.
These are the "known answers" that separate engineering from guesswork.

Run with: pytest backend/tests/ -v
"""

from __future__ import annotations

import pandas as pd
import pytest

from app.matcher.exact import exact_match
from app.matcher.fuzzy import fuzzy_match
from app.matcher.batch_unbundler import batch_unbundle
from app.matcher.scoring import compute_confidence


# ─── Scoring Unit Tests ───────────────────────────────────────────────────────

class TestConfidenceScoring:

    def test_perfect_match_score(self):
        conf, signals = compute_confidence(
            utr_score=1.0, amount_diff_pct=0.0, date_diff_days=0
        )
        assert conf == 0.90, f"Perfect UTR+amount+date(0 days) should give 0.90, got {conf}"
        assert "UTR exact match" in signals
        assert "Amount exact match" in signals

    def test_perfect_match_with_desc_score(self):
        conf, signals = compute_confidence(
            utr_score=1.0, amount_diff_pct=0.0, date_diff_days=0, desc_score=0.95
        )
        assert conf == 1.0, f"All signals should give 1.0, got {conf}"

    def test_fee_adjusted_score(self):
        """Fee-adjusted: UTR exact, amount off by 1.5%, date same day."""
        conf, signals = compute_confidence(
            utr_score=1.0, amount_diff_pct=0.015, date_diff_days=0
        )
        assert conf >= 0.60
        assert any("fee-adjusted" in s for s in signals)

    def test_fuzzy_utr_score(self):
        """Fuzzy UTR (92%), exact amount, 1-day drift."""
        conf, signals = compute_confidence(
            utr_score=0.92, amount_diff_pct=0.0, date_diff_days=1
        )
        assert 0.60 <= conf <= 0.85
        assert any("fuzzy" in s.lower() for s in signals)

    def test_low_confidence_big_amount_diff(self):
        """Big amount difference should keep confidence low."""
        conf, signals = compute_confidence(
            utr_score=0.0, amount_diff_pct=0.15, date_diff_days=5
        )
        assert conf < 0.20

    def test_confidence_capped_at_one(self):
        conf, _ = compute_confidence(
            utr_score=1.0, amount_diff_pct=0.0, date_diff_days=0, desc_score=1.0
        )
        assert conf <= 1.0


# ─── Exact Match Tests ────────────────────────────────────────────────────────

def _make_gateway_df(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df.set_index("id")


def _make_bank_df(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df.set_index("id")


class TestExactMatcher:

    def _empty_ledger(self) -> pd.DataFrame:
        return pd.DataFrame(columns=["id", "amount", "date", "reference", "utr", "description"]).set_index("id")

    def test_should_match_utr_and_amount_and_date(self):
        """SHOULD match: UTR exact, amount within ₹0.01, date same day."""
        gw = _make_gateway_df([
            {"id": 1, "txn_id": "pay_abc", "utr": "RAZORPAY1234567890123456",
             "amount": 10000.0, "fee": 200.0, "net_amount": 9800.0,
             "date": "2024-01-15", "description": "Test", "reference": "ord_1", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 101, "txn_id": "SBIN001", "utr": "RAZORPAY1234567890123456",
             "amount": 9800.0, "fee": 0, "net_amount": 9800.0,
             "date": "2024-01-15", "description": "RAZORPAY SETTLEMENT", "reference": "SBIN001", "status": "settled"},
        ])
        matches, unmatched_gw, unmatched_bank = exact_match(
            gw, bank, self._empty_ledger(), {1}, {101}, threshold=0.0
        )
        assert len(matches) == 1
        assert matches[0].gateway_idx == 1
        assert matches[0].bank_idx == 101
        assert matches[0].confidence >= 0.90
        assert matches[0].match_type == "exact"
        assert 1 not in unmatched_gw
        assert 101 not in unmatched_bank

    def test_should_not_match_different_utr(self):
        """SHOULD NOT match: different UTR strings."""
        gw = _make_gateway_df([
            {"id": 1, "txn_id": "pay_abc", "utr": "RAZORPAY1234567890000000",
             "amount": 5000.0, "fee": 100.0, "net_amount": 4900.0,
             "date": "2024-01-15", "description": "Test", "reference": "ord_1", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 101, "txn_id": "SBIN001", "utr": "HDFC9999999999999999",
             "amount": 4900.0, "fee": 0, "net_amount": 4900.0,
             "date": "2024-01-15", "description": "SETTLEMENT", "reference": "SBIN001", "status": "settled"},
        ])
        matches, _, _ = exact_match(gw, bank, self._empty_ledger(), {1}, {101})
        assert len(matches) == 0

    def test_should_not_match_amount_too_different(self):
        """SHOULD NOT match: amount differs by ₹5 (above ₹0.01 tolerance)."""
        gw = _make_gateway_df([
            {"id": 1, "txn_id": "pay_abc", "utr": "RAZORPAY1234567890123456",
             "amount": 10000.0, "fee": 200.0, "net_amount": 9800.0,
             "date": "2024-01-15", "description": "Test", "reference": "ord_1", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 101, "txn_id": "SBIN001", "utr": "RAZORPAY1234567890123456",
             "amount": 9795.0, "fee": 0, "net_amount": 9795.0,
             "date": "2024-01-15", "description": "SETTLEMENT", "reference": "SBIN001", "status": "settled"},
        ])
        matches, _, _ = exact_match(gw, bank, self._empty_ledger(), {1}, {101})
        assert len(matches) == 0

    def test_exact_match_with_one_day_date_drift(self):
        """SHOULD match: UTR exact, amount exact, date 1 day apart."""
        gw = _make_gateway_df([
            {"id": 1, "txn_id": "pay_abc", "utr": "RAZORPAY0000000000000001",
             "amount": 3000.0, "fee": 60.0, "net_amount": 2940.0,
             "date": "2024-01-10", "description": "Test", "reference": "ord_1", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 101, "txn_id": "SBIN001", "utr": "RAZORPAY0000000000000001",
             "amount": 2940.0, "fee": 0, "net_amount": 2940.0,
             "date": "2024-01-11", "description": "SETTLEMENT", "reference": "SBIN001", "status": "settled"},
        ])
        matches, _, _ = exact_match(gw, bank, self._empty_ledger(), {1}, {101})
        assert len(matches) == 1
        assert matches[0].confidence >= 0.88


# ─── Fuzzy Match Tests ────────────────────────────────────────────────────────

class TestFuzzyMatcher:

    def _empty_ledger(self) -> pd.DataFrame:
        return pd.DataFrame(columns=["id", "amount", "date", "reference", "utr", "description"]).set_index("id")

    def test_fee_adjusted_fuzzy_match(self):
        """SHOULD fuzzy-match: UTR exact, amount off by 1.5% (fee adjustment), date same."""
        gw = _make_gateway_df([
            {"id": 1, "txn_id": "pay_def", "utr": "RAZORPAY9876543210987654",
             "amount": 20000.0, "fee": 472.0, "net_amount": 19528.0,
             "date": "2024-01-20", "description": "Payment ACME Corp", "reference": "ord_2", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 201, "txn_id": "SBIN002", "utr": "RAZORPAY9876543210987654",
             "amount": 19600.0, "fee": 0, "net_amount": 19600.0,
             "date": "2024-01-20", "description": "RAZORPAY SETTLEMENT", "reference": "SBIN002", "status": "settled"},
        ])
        matches, unmatched_gw, _ = fuzzy_match(
            gw, bank, self._empty_ledger(), {1}, {201}, threshold=0.55
        )
        assert len(matches) == 1, "Fee-adjusted transaction should fuzzy match"
        assert matches[0].confidence >= 0.55
        assert 1 not in unmatched_gw

    def test_timing_drift_fuzzy_match(self):
        """SHOULD fuzzy-match: UTR exact, amount exact, 3-day date drift."""
        gw = _make_gateway_df([
            {"id": 2, "txn_id": "pay_ghi", "utr": "ICICI0000000011111111",
             "amount": 7500.0, "fee": 150.0, "net_amount": 7350.0,
             "date": "2024-01-05", "description": "Payment Swift Retail", "reference": "ord_3", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 202, "txn_id": "SBIN003", "utr": "ICICI0000000011111111",
             "amount": 7350.0, "fee": 0, "net_amount": 7350.0,
             "date": "2024-01-08", "description": "SETTLEMENT", "reference": "SBIN003", "status": "settled"},
        ])
        matches, _, _ = fuzzy_match(
            gw, bank, self._empty_ledger(), {2}, {202}, threshold=0.50
        )
        assert len(matches) == 1, "Timing-drift transaction should fuzzy match"
        assert matches[0].confidence >= 0.50

    def test_should_not_match_below_threshold(self):
        """SHOULD NOT match: confidence too low for given threshold."""
        gw = _make_gateway_df([
            {"id": 3, "txn_id": "pay_xyz", "utr": "AXIS1111111111111111",
             "amount": 1000.0, "fee": 20.0, "net_amount": 980.0,
             "date": "2024-01-01", "description": "Some payment", "reference": "ord_4", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 203, "txn_id": "SBIN004", "utr": "HDFC9999999999999999",
             "amount": 500.0, "fee": 0, "net_amount": 500.0,
             "date": "2024-01-15", "description": "OTHER SETTLEMENT", "reference": "SBIN004", "status": "settled"},
        ])
        matches, _, _ = fuzzy_match(
            gw, bank, self._empty_ledger(), {3}, {203}, threshold=0.70
        )
        assert len(matches) == 0, "Should not match with high threshold"


# ─── Batch Unbundler Tests ────────────────────────────────────────────────────

class TestBatchUnbundler:

    def test_batch_of_three_should_match(self):
        """SHOULD batch-match: 3 gateway transactions sum to 1 bank credit."""
        gw = _make_gateway_df([
            {"id": 10, "txn_id": "pay_b1", "utr": "BATCH_ABC_0", "amount": 5000.0, "fee": 100.0, "net_amount": 4900.0, "date": "2024-02-01", "description": "Batch txn 1", "reference": "ord_10", "status": "captured"},
            {"id": 11, "txn_id": "pay_b2", "utr": "BATCH_ABC_1", "amount": 3000.0, "fee": 60.0, "net_amount": 2940.0, "date": "2024-02-01", "description": "Batch txn 2", "reference": "ord_11", "status": "captured"},
            {"id": 12, "txn_id": "pay_b3", "utr": "BATCH_ABC_2", "amount": 2000.0, "fee": 40.0, "net_amount": 1960.0, "date": "2024-02-01", "description": "Batch txn 3", "reference": "ord_12", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 301, "txn_id": "SBIN_BATCH", "utr": "BATCH_ABC", "amount": 9800.0, "fee": 0, "net_amount": 9800.0, "date": "2024-02-02", "description": "RAZORPAY BATCH SETTLEMENT", "reference": "SBIN_BATCH", "status": "settled"},
        ])
        matches, remaining_gw, remaining_bank = batch_unbundle(
            gw, bank, {10, 11, 12}, {301}, threshold=0.60
        )
        assert len(matches) == 1, "Should detect batch settlement"
        assert set(matches[0].gateway_indices) == {10, 11, 12}
        assert matches[0].bank_idx == 301
        assert matches[0].confidence >= 0.60
        assert 301 not in remaining_bank

    def test_no_batch_if_sum_does_not_match(self):
        """SHOULD NOT batch-match: sum of gateway ≠ bank amount."""
        gw = _make_gateway_df([
            {"id": 20, "txn_id": "pay_c1", "utr": "UTR_C1", "amount": 1000.0, "fee": 20.0, "net_amount": 980.0, "date": "2024-02-10", "description": "C1", "reference": "ord_20", "status": "captured"},
            {"id": 21, "txn_id": "pay_c2", "utr": "UTR_C2", "amount": 500.0, "fee": 10.0, "net_amount": 490.0, "date": "2024-02-10", "description": "C2", "reference": "ord_21", "status": "captured"},
        ])
        bank = _make_bank_df([
            {"id": 401, "txn_id": "SBIN_C", "utr": "UTR_BATCH_C", "amount": 5000.0, "fee": 0, "net_amount": 5000.0, "date": "2024-02-11", "description": "BATCH", "reference": "SBIN_C", "status": "settled"},
        ])
        matches, _, _ = batch_unbundle(gw, bank, {20, 21}, {401}, threshold=0.60)
        assert len(matches) == 0
