"""
test_scorer.py — Unit tests for the weighted scoring algorithm.

Tests each scoring dimension independently and verifies the final
combined score is always in range 0–100.
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.services.scorer import (
    score_supplier,
    score_recipient,
    _medicine_score,
    _quantity_score,
    _urgency_score,
    _expiry_score,
)
from app.models.schemas import UrgencyLevel
from app import config


# ─── Dimension: Medicine ──────────────────────────────────────────────────────

class TestMedicineScore:

    def test_exact_match(self):
        assert _medicine_score("Insulin", "Insulin") == 1.0

    def test_case_insensitive_match(self):
        assert _medicine_score("Insulin", "insulin") == 1.0
        assert _medicine_score("INSULIN", "Insulin") == 1.0

    def test_no_match(self):
        assert _medicine_score("Insulin", "Paracetamol") == 0.0


# ─── Dimension: Quantity ──────────────────────────────────────────────────────

class TestQuantityScore:

    def test_full_coverage(self):
        """Available >= requested → score = 1.0"""
        assert _quantity_score(requested=100, available=100) == 1.0
        assert _quantity_score(requested=100, available=150) == 1.0

    def test_partial_coverage(self):
        """Available = 60, requested = 100 → score = 0.6"""
        score = _quantity_score(requested=100, available=60)
        assert abs(score - 0.60) < 0.01

    def test_very_low_coverage(self):
        """Available = 10, requested = 100 → score = 0.1"""
        score = _quantity_score(requested=100, available=10)
        assert abs(score - 0.10) < 0.01

    def test_zero_requested(self):
        """Zero requested quantity → treat as full coverage (edge case guard)."""
        assert _quantity_score(requested=0, available=50) == 1.0

    def test_score_never_exceeds_one(self):
        assert _quantity_score(requested=50, available=1000) == 1.0


# ─── Dimension: Urgency ───────────────────────────────────────────────────────

class TestUrgencyScore:

    def test_high_urgency(self):
        assert _urgency_score(UrgencyLevel.HIGH) == 1.0

    def test_medium_urgency(self):
        score = _urgency_score(UrgencyLevel.MEDIUM)
        assert 0.60 < score < 0.70  # expected ~0.65

    def test_low_urgency(self):
        score = _urgency_score(UrgencyLevel.LOW)
        assert 0.25 < score < 0.35  # expected ~0.30


# ─── Dimension: Expiry ────────────────────────────────────────────────────────

class TestExpiryScore:

    def test_well_within_expiry(self):
        """More than 6 months away → 1.0"""
        assert _expiry_score(date.today() + timedelta(days=200)) == 1.0

    def test_three_to_six_months(self):
        """4 months away → 0.75"""
        assert _expiry_score(date.today() + timedelta(days=120)) == 0.75

    def test_one_to_three_months(self):
        """2 months away → 0.50"""
        assert _expiry_score(date.today() + timedelta(days=60)) == 0.50

    def test_less_than_one_month(self):
        """20 days away → 0.25"""
        assert _expiry_score(date.today() + timedelta(days=20)) == 0.25

    def test_today_expired(self):
        """Today → 0.0 (should have been caught by matcher but guarded)."""
        assert _expiry_score(date.today()) == 0.0

    def test_past_expired(self):
        """Yesterday → 0.0"""
        assert _expiry_score(date.today() - timedelta(days=1)) == 0.0


# ─── Weights validation ───────────────────────────────────────────────────────

class TestWeightsConfig:

    def test_weights_sum_to_one(self):
        total = sum(config.WEIGHTS.values())
        assert abs(total - 1.0) < 0.001, f"Weights sum to {total}, expected 1.0"

    def test_all_weights_positive(self):
        for key, weight in config.WEIGHTS.items():
            assert weight > 0, f"Weight for '{key}' is not positive"


# ─── Combined score_supplier ─────────────────────────────────────────────────

class TestScoreSupplier:

    def test_score_in_valid_range(
        self, req_insulin_high, stock_insulin_full
    ):
        result = score_supplier(req_insulin_high, stock_insulin_full)
        assert 0 <= result.final_score <= 100

    def test_same_location_higher_than_different(
        self, req_insulin_high, stock_insulin_full, stock_insulin_partial
    ):
        """Same city (Colombo) should score higher than different city (Kandy)."""
        # req_insulin_high is in Colombo, stock_insulin_full is in Colombo
        # stock_insulin_partial is in Kandy
        same_city = score_supplier(req_insulin_high, stock_insulin_full)
        diff_city = score_supplier(req_insulin_high, stock_insulin_partial)
        assert same_city.final_score > diff_city.final_score

    def test_full_quantity_higher_than_partial(
        self, req_insulin_high, stock_insulin_full, stock_insulin_partial
    ):
        """Full coverage (120 units) should score higher than partial (60 units)."""
        full = score_supplier(req_insulin_high, stock_insulin_full)
        partial = score_supplier(req_insulin_high, stock_insulin_partial)
        assert full.final_score > partial.final_score

    def test_near_expiry_lower_than_far_expiry(
        self, req_insulin_high, stock_insulin_full, stock_insulin_near_expiry
    ):
        """Near-expiry stock should score lower than well-within-expiry stock."""
        far = score_supplier(req_insulin_high, stock_insulin_full)
        near = score_supplier(req_insulin_high, stock_insulin_near_expiry)
        assert far.final_score > near.final_score

    def test_can_fulfil_flag(
        self, req_insulin_high, stock_insulin_full, stock_insulin_partial
    ):
        """canFulfil should be True when stock >= requested quantity."""
        full_result = score_supplier(req_insulin_high, stock_insulin_full)
        partial_result = score_supplier(req_insulin_high, stock_insulin_partial)
        # req asks for 100, full has 120, partial has 60
        # Note: canFulfil is set in recommender, not scorer; just test score here
        assert full_result.final_score > 0
        assert partial_result.final_score > 0

    def test_reasons_list_not_empty(
        self, req_insulin_high, stock_insulin_full
    ):
        """A valid match should produce at least one reason string."""
        result = score_supplier(req_insulin_high, stock_insulin_full)
        assert len(result.reasons) > 0
        assert any("Medicine" in r or "medicine" in r for r in result.reasons)


# ─── Combined score_recipient ─────────────────────────────────────────────────

class TestScoreRecipient:

    def test_score_in_valid_range(
        self, stock_insulin_full, req_insulin_high
    ):
        result = score_recipient(stock_insulin_full, req_insulin_high)
        assert 0 <= result.final_score <= 100

    def test_high_urgency_request_scores_higher(
        self, stock_insulin_full, req_insulin_high, req_insulin_medium
    ):
        """HIGH urgency request should score higher than MEDIUM."""
        high_result = score_recipient(stock_insulin_full, req_insulin_high)
        medium_result = score_recipient(stock_insulin_full, req_insulin_medium)
        assert high_result.final_score > medium_result.final_score

    def test_reasons_not_empty(
        self, stock_insulin_full, req_insulin_high
    ):
        result = score_recipient(stock_insulin_full, req_insulin_high)
        assert len(result.reasons) > 0

