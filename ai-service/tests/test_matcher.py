"""
test_matcher.py — Unit tests for business-rule filtering.

Tests that filter_suppliers and filter_recipients correctly reject or pass
candidates according to the business rules, independently of scoring.
"""

from __future__ import annotations

import pytest

from app.services.matcher import filter_suppliers, filter_recipients


# ─── filter_suppliers ─────────────────────────────────────────────────────────

class TestFilterSuppliers:

    def test_exact_medicine_match_passes(
        self, req_insulin_high, stock_insulin_full
    ):
        """Correct medicine + valid stock should pass the filter."""
        result = filter_suppliers(req_insulin_high, [stock_insulin_full])
        assert len(result) == 1
        assert result[0].stockId == "STK001"

    def test_wrong_medicine_rejected(
        self, req_insulin_high, stock_paracetamol
    ):
        """Paracetamol stock must not match an Insulin request."""
        result = filter_suppliers(req_insulin_high, [stock_paracetamol])
        assert result == []

    def test_zero_stock_rejected(
        self, req_insulin_high, stock_insulin_zero
    ):
        """Stock with quantity=0 must be rejected."""
        result = filter_suppliers(req_insulin_high, [stock_insulin_zero])
        assert result == []

    def test_expired_stock_rejected(
        self, req_insulin_high, stock_insulin_expired
    ):
        """Stock expired yesterday must be rejected."""
        result = filter_suppliers(req_insulin_high, [stock_insulin_expired])
        assert result == []

    def test_unavailable_stock_rejected(
        self, req_insulin_high, stock_insulin_unavailable
    ):
        """Stock with status='unavailable' must be rejected."""
        result = filter_suppliers(req_insulin_high, [stock_insulin_unavailable])
        assert result == []

    def test_same_hospital_rejected(
        self, req_insulin_high, stock_same_hospital
    ):
        """A hospital must not supply to itself."""
        result = filter_suppliers(req_insulin_high, [stock_same_hospital])
        assert result == []

    def test_multiple_candidates_filtered_correctly(
        self,
        req_insulin_high,
        stock_insulin_full,
        stock_insulin_partial,
        stock_insulin_zero,
        stock_insulin_expired,
        stock_paracetamol,
    ):
        """Only valid candidates should pass from a mixed list."""
        all_stock = [
            stock_insulin_full,     # ✅ should pass
            stock_insulin_partial,  # ✅ should pass
            stock_insulin_zero,     # ❌ zero quantity
            stock_insulin_expired,  # ❌ expired
            stock_paracetamol,      # ❌ wrong medicine
        ]
        result = filter_suppliers(req_insulin_high, all_stock)
        assert len(result) == 2
        ids = {s.stockId for s in result}
        assert "STK001" in ids
        assert "STK002" in ids

    def test_empty_stock_list(self, req_insulin_high):
        """Empty input should return empty list without error."""
        result = filter_suppliers(req_insulin_high, [])
        assert result == []

    def test_case_insensitive_medicine_match(
        self, req_insulin_high, stock_insulin_full
    ):
        """Medicine matching must be case-insensitive."""
        # Modify the medicine name case on the stock item
        stock_insulin_full.medicine = "insulin"
        result = filter_suppliers(req_insulin_high, [stock_insulin_full])
        assert len(result) == 1


# ─── filter_recipients ────────────────────────────────────────────────────────

class TestFilterRecipients:

    def test_matching_open_request_passes(
        self, stock_insulin_full, req_insulin_high
    ):
        """An open, matching request should pass the filter."""
        result = filter_recipients(stock_insulin_full, [req_insulin_high])
        assert len(result) == 1
        assert result[0].requestId == "REQ001"

    def test_cancelled_request_rejected(
        self, stock_insulin_full, req_cancelled
    ):
        """Cancelled requests must be rejected."""
        result = filter_recipients(stock_insulin_full, [req_cancelled])
        assert result == []

    def test_wrong_medicine_request_rejected(
        self, stock_insulin_full, req_paracetamol_low
    ):
        """A request for Paracetamol must not match Insulin stock."""
        result = filter_recipients(stock_insulin_full, [req_paracetamol_low])
        assert result == []

    def test_same_hospital_request_rejected(
        self, stock_insulin_full, req_insulin_high
    ):
        """A hospital's own request must not match its own stock."""
        req_insulin_high.hospitalId = stock_insulin_full.hospitalId  # H001
        result = filter_recipients(stock_insulin_full, [req_insulin_high])
        assert result == []

    def test_empty_requests_list(self, stock_insulin_full):
        """Empty input should return empty list without error."""
        result = filter_recipients(stock_insulin_full, [])
        assert result == []

    def test_multiple_requests_filtered_correctly(
        self,
        stock_insulin_full,
        req_insulin_high,
        req_insulin_medium,
        req_paracetamol_low,
        req_cancelled,
    ):
        """Only valid open matching requests should pass."""
        all_requests = [
            req_insulin_high,      # ✅ should pass
            req_insulin_medium,    # ✅ should pass
            req_paracetamol_low,   # ❌ wrong medicine
            req_cancelled,         # ❌ cancelled
        ]
        result = filter_recipients(stock_insulin_full, all_requests)
        assert len(result) == 2
        ids = {r.requestId for r in result}
        assert "REQ001" in ids
        assert "REQ002" in ids

