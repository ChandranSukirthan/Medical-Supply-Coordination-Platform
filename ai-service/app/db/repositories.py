"""
repositories.py — MongoDB data-fetching functions.

These functions query the MongoDB collections and map the raw documents
into the Pydantic models used by the recommendation engine.

Field mapping (MongoDB document → Pydantic model):
────────────────────────────────────────────────────────────────
INVENTORY / STOCK collection ("inventories"):
    _id           → stockId   (converted to string)
    hospitalId    → hospitalId
    medicine      → medicine
    quantity      → quantity
    location      → location
    province      → province  (optional)
    expiryDate    → expiryDate
    status        → status    (default: "available")

SHORTAGE / REQUEST collection ("shortages"):
    _id           → requestId  (converted to string)
    hospitalId    → hospitalId
    medicine      → medicine
    quantity      → quantity
    urgency       → urgency    (default: "MEDIUM")
    location      → location
    province      → province   (optional)
    status        → status     (default: "open")

NOTE: If your field names differ, update the _map_inventory() and
_map_shortage() functions below — no other file needs to change.
────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from datetime import date, datetime

from app import config
from app.db.mongo import get_db
from app.models.schemas import (
    StockItem,
    MedicineRequest,
    StockStatus,
    RequestStatus,
    UrgencyLevel,
)


# ─── Field mappers ─────────────────────────────────────────────────────────────

def _to_date(value) -> date | None:
    """Convert MongoDB date (datetime / string / None) to Python date."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def _map_inventory(doc: dict) -> StockItem | None:
    """
    Map a raw MongoDB inventory document to a StockItem Pydantic model.
    Returns None if the document is missing critical required fields.
    """
    try:
        expiry = _to_date(doc.get("expiryDate"))
        if expiry is None:
            return None  # Can't score without an expiry date

        return StockItem(
            stockId=str(doc.get("_id", "")),
            hospitalId=str(doc.get("hospitalId", "")),
            medicine=str(doc.get("medicine", "")).strip(),
            quantity=int(doc.get("quantity", 0)),
            location=str(doc.get("location", "")).strip(),
            province=doc.get("province") or None,
            expiryDate=expiry,
            status=StockStatus(doc.get("status", "available")),
        )
    except Exception:
        return None  # Skip malformed documents silently


def _map_shortage(doc: dict) -> MedicineRequest | None:
    """
    Map a raw MongoDB shortage document to a MedicineRequest Pydantic model.
    Returns None if the document is missing critical required fields.
    """
    try:
        urgency_raw = str(doc.get("urgency", "MEDIUM")).upper()
        urgency = UrgencyLevel(urgency_raw) if urgency_raw in UrgencyLevel._value2member_map_ else UrgencyLevel.MEDIUM

        return MedicineRequest(
            requestId=str(doc.get("_id", "")),
            hospitalId=str(doc.get("hospitalId", "")),
            medicine=str(doc.get("medicine", "")).strip(),
            quantity=int(doc.get("quantity", 0)),
            urgency=urgency,
            location=str(doc.get("location", "")).strip(),
            province=doc.get("province") or None,
            status=RequestStatus(doc.get("status", "open")),
        )
    except Exception:
        return None  # Skip malformed documents silently


# ─── Public repository functions ───────────────────────────────────────────────

async def get_stock_for_request(
    medicine: str,
    exclude_hospital_id: str,
) -> list[StockItem]:
    """
    Fetch all available stock that matches the given medicine name,
    excluding the requesting hospital's own stock.

    Args:
        medicine:            Medicine name to search for (case-insensitive).
        exclude_hospital_id: The requesting hospital's ID (excluded from results).

    Returns:
        List of StockItem models ready for the recommendation engine.
    """
    db = get_db()
    collection = db[config.INVENTORY_COLLECTION]

    cursor = collection.find({
        "medicine":   {"$regex": f"^{medicine}$", "$options": "i"},
        "hospitalId": {"$ne": exclude_hospital_id},
        "status":     "available",
        "quantity":   {"$gt": 0},
    })

    stock_items: list[StockItem] = []
    async for doc in cursor:
        item = _map_inventory(doc)
        if item:
            stock_items.append(item)

    return stock_items


async def get_shortage_by_id(shortage_id: str) -> MedicineRequest | None:
    """
    Fetch a single shortage/request document by its MongoDB _id.

    Args:
        shortage_id: The MongoDB ObjectId string of the shortage.

    Returns:
        MedicineRequest model, or None if not found.
    """
    from bson import ObjectId

    db = get_db()
    collection = db[config.SHORTAGE_COLLECTION]

    try:
        doc = await collection.find_one({"_id": ObjectId(shortage_id)})
    except Exception:
        # Try string _id as fallback (if your schema uses string IDs)
        doc = await collection.find_one({"_id": shortage_id})

    if doc is None:
        return None
    return _map_shortage(doc)


async def get_inventory_by_id(stock_id: str) -> StockItem | None:
    """
    Fetch a single inventory/stock document by its MongoDB _id.

    Args:
        stock_id: The MongoDB ObjectId string of the stock item.

    Returns:
        StockItem model, or None if not found.
    """
    from bson import ObjectId

    db = get_db()
    collection = db[config.INVENTORY_COLLECTION]

    try:
        doc = await collection.find_one({"_id": ObjectId(stock_id)})
    except Exception:
        doc = await collection.find_one({"_id": stock_id})

    if doc is None:
        return None
    return _map_inventory(doc)


async def get_open_requests_for_medicine(
    medicine: str,
    exclude_hospital_id: str,
) -> list[MedicineRequest]:
    """
    Fetch all open shortage requests that match the given medicine name,
    excluding the supplying hospital's own requests.

    Args:
        medicine:            Medicine name to search for (case-insensitive).
        exclude_hospital_id: The supplying hospital's ID (excluded from results).

    Returns:
        List of MedicineRequest models ready for the recommendation engine.
    """
    db = get_db()
    collection = db[config.SHORTAGE_COLLECTION]

    cursor = collection.find({
        "medicine":   {"$regex": f"^{medicine}$", "$options": "i"},
        "hospitalId": {"$ne": exclude_hospital_id},
        "status":     "open",
    })

    requests: list[MedicineRequest] = []
    async for doc in cursor:
        req = _map_shortage(doc)
        if req:
            requests.append(req)

    return requests

