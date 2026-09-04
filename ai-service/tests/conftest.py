"""
conftest.py — Shared pytest fixtures for all test modules.

Provides ready-made Pydantic model instances covering all edge cases.
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import (
    MedicineRequest,
    StockItem,
    UrgencyLevel,
    RequestStatus,
    StockStatus,
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def future(days: int) -> date:
    return date.today() + timedelta(days=days)


def past(days: int) -> date:
    return date.today() - timedelta(days=days)


# ─── Medicine Request Fixtures ────────────────────────────────────────────────

@pytest.fixture
def req_insulin_high() -> MedicineRequest:
    """Standard high-urgency Insulin request, 100 units, Colombo."""
    return MedicineRequest(
        requestId="REQ001",
        hospitalId="H010",
        medicine="Insulin",
        quantity=100,
        urgency=UrgencyLevel.HIGH,
        location="Colombo",
        province="Western",
        status=RequestStatus.OPEN,
    )


@pytest.fixture
def req_insulin_medium() -> MedicineRequest:
    """Medium-urgency Insulin request, 200 units, Kandy."""
    return MedicineRequest(
        requestId="REQ002",
        hospitalId="H004",
        medicine="Insulin",
        quantity=200,
        urgency=UrgencyLevel.MEDIUM,
        location="Kandy",
        province="Central",
        status=RequestStatus.OPEN,
    )


@pytest.fixture
def req_paracetamol_low() -> MedicineRequest:
    """Low-urgency Paracetamol request, 300 units, Galle."""
    return MedicineRequest(
        requestId="REQ003",
        hospitalId="H007",
        medicine="Paracetamol",
        quantity=300,
        urgency=UrgencyLevel.LOW,
        location="Galle",
        province="Southern",
        status=RequestStatus.OPEN,
    )


@pytest.fixture
def req_cancelled() -> MedicineRequest:
    """Cancelled Insulin request — should be filtered out."""
    return MedicineRequest(
        requestId="REQ009",
        hospitalId="H002",
        medicine="Insulin",
        quantity=30,
        urgency=UrgencyLevel.HIGH,
        location="Kandy",
        province="Central",
        status=RequestStatus.CANCELLED,
    )


# ─── Stock Item Fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def stock_insulin_full() -> StockItem:
    """Sufficient Insulin stock (120 units, Colombo, well within expiry)."""
    return StockItem(
        stockId="STK001",
        hospitalId="H001",
        medicine="Insulin",
        quantity=120,
        location="Colombo",
        province="Western",
        expiryDate=future(500),
        status=StockStatus.AVAILABLE,
    )


@pytest.fixture
def stock_insulin_partial() -> StockItem:
    """Partial Insulin stock (60 units, Kandy, well within expiry)."""
    return StockItem(
        stockId="STK002",
        hospitalId="H002",
        medicine="Insulin",
        quantity=60,
        location="Kandy",
        province="Central",
        expiryDate=future(400),
        status=StockStatus.AVAILABLE,
    )


@pytest.fixture
def stock_insulin_zero() -> StockItem:
    """Zero-quantity Insulin — must be rejected by matcher."""
    return StockItem(
        stockId="STK006",
        hospitalId="H006",
        medicine="Insulin",
        quantity=0,
        location="Kurunegala",
        province="North Western",
        expiryDate=future(200),
        status=StockStatus.AVAILABLE,
    )


@pytest.fixture
def stock_insulin_expired() -> StockItem:
    """Expired Insulin (yesterday) — must be rejected by matcher."""
    return StockItem(
        stockId="STK_EXP",
        hospitalId="H003",
        medicine="Insulin",
        quantity=100,
        location="Galle",
        province="Southern",
        expiryDate=past(1),
        status=StockStatus.AVAILABLE,
    )


@pytest.fixture
def stock_insulin_unavailable() -> StockItem:
    """Insulin stock marked as unavailable — must be rejected by matcher."""
    return StockItem(
        stockId="STK013",
        hospitalId="H003",
        medicine="Insulin",
        quantity=75,
        location="Galle",
        province="Southern",
        expiryDate=future(300),
        status=StockStatus.UNAVAILABLE,
    )


@pytest.fixture
def stock_paracetamol() -> StockItem:
    """Paracetamol stock — wrong medicine for Insulin requests."""
    return StockItem(
        stockId="STK003",
        hospitalId="H003",
        medicine="Paracetamol",
        quantity=500,
        location="Galle",
        province="Southern",
        expiryDate=future(300),
        status=StockStatus.AVAILABLE,
    )


@pytest.fixture
def stock_insulin_near_expiry() -> StockItem:
    """Insulin expiring in 20 days — low expiry score expected."""
    return StockItem(
        stockId="STK_NEAR",
        hospitalId="H009",
        medicine="Insulin",
        quantity=100,
        location="Ratnapura",
        province="Sabaragamuwa",
        expiryDate=future(20),
        status=StockStatus.AVAILABLE,
    )


@pytest.fixture
def stock_same_hospital(req_insulin_high) -> StockItem:
    """Stock owned by same hospital as the requester (H010) — must be rejected."""
    return StockItem(
        stockId="STK_SELF",
        hospitalId="H010",
        medicine="Insulin",
        quantity=100,
        location="Matara",
        province="Southern",
        expiryDate=future(300),
        status=StockStatus.AVAILABLE,
    )


# ─── FastAPI Test Client ───────────────────────────────────────────────────────

@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

