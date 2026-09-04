"""
matcher.py — Business-rule filtering.

Eliminates candidates that must NEVER appear in recommendations,
before any scoring takes place.

Each filter function returns a (passed: bool, reason: str) tuple so
callers can log why a candidate was rejected during debugging.
"""

from __future__ import annotations

from datetime import date

from app.models.schemas import MedicineRequest, StockItem, RequestStatus, StockStatus


# ─── Individual rule checks ───────────────────────────────────────────────────

def _medicine_matches(a: str, b: str) -> bool:
    """Case-insensitive exact medicine name match."""
    return a.strip().lower() == b.strip().lower()


def _stock_is_available(stock: StockItem) -> tuple[bool, str]:
    if stock.status != StockStatus.AVAILABLE:
        return False, f"Stock status is '{stock.status.value}', not available"
    return True, ""


def _stock_has_quantity(stock: StockItem) -> tuple[bool, str]:
    if stock.quantity <= 0:
        return False, "Stock quantity is zero or negative"
    return True, ""


def _stock_not_expired(stock: StockItem) -> tuple[bool, str]:
    today = date.today()
    if stock.expiryDate <= today:
        return False, f"Stock expired on {stock.expiryDate} (today is {today})"
    return True, ""


def _request_is_open(request: MedicineRequest) -> tuple[bool, str]:
    if request.status != RequestStatus.OPEN:
        return False, f"Request status is '{request.status.value}', not open"
    return True, ""


def _not_same_hospital(id_a: str, id_b: str) -> tuple[bool, str]:
    if id_a.strip() == id_b.strip():
        return False, "Hospital cannot supply to itself"
    return True, ""


# ─── Public filter functions ───────────────────────────────────────────────────

def filter_suppliers(
    request: MedicineRequest,
    stock_items: list[StockItem],
) -> list[StockItem]:
    """
    Given a medicine request, return only the stock items that pass
    all business rules and are eligible for scoring.

    Rejects:
    - Wrong medicine
    - Zero / negative stock
    - Expired stock
    - Unavailable / reserved stock status
    - Same hospital as requester
    """
    eligible: list[StockItem] = []

    for stock in stock_items:
        # Rule 1: Medicine must match
        if not _medicine_matches(request.medicine, stock.medicine):
            continue

        # Rule 2: Same-hospital self-supply not allowed
        ok, _ = _not_same_hospital(request.hospitalId, stock.hospitalId)
        if not ok:
            continue

        # Rule 3: Stock must be in "available" status
        ok, _ = _stock_is_available(stock)
        if not ok:
            continue

        # Rule 4: Stock must have quantity > 0
        ok, _ = _stock_has_quantity(stock)
        if not ok:
            continue

        # Rule 5: Stock must not be expired
        ok, _ = _stock_not_expired(stock)
        if not ok:
            continue

        eligible.append(stock)

    return eligible


def filter_recipients(
    stock: StockItem,
    open_requests: list[MedicineRequest],
) -> list[MedicineRequest]:
    """
    Given an available stock item, return only the open requests that pass
    all business rules and are eligible for scoring.

    Rejects:
    - Wrong medicine
    - Closed / cancelled requests
    - Same hospital as stock owner
    """
    eligible: list[MedicineRequest] = []

    for req in open_requests:
        # Rule 1: Medicine must match
        if not _medicine_matches(stock.medicine, req.medicine):
            continue

        # Rule 2: Same-hospital self-receipt not allowed
        ok, _ = _not_same_hospital(stock.hospitalId, req.hospitalId)
        if not ok:
            continue

        # Rule 3: Request must be open
        ok, _ = _request_is_open(req)
        if not ok:
            continue

        eligible.append(req)

    return eligible

