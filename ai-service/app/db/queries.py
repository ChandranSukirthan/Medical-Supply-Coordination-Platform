"""
queries.py — All MongoDB query functions for the AI service.

Each function fetches data from MongoDB and returns it as Pydantic models
ready for the matcher and scorer to consume.

The AI service uses three collections:
    hospitals  — hospital registry
    inventory  — available medicine stock
    requests   — open medicine requests
"""

from __future__ import annotations

from datetime import date

from app import config
from app.db.connection import get_db
from app.models.schemas import (
    StockItem, MedicineRequest, StockStatus, RequestStatus, UrgencyLevel
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _doc_to_stock(doc: dict) -> StockItem:
    """Convert a raw MongoDB inventory document to a StockItem Pydantic model."""
    expiry = doc.get("expiryDate")
    if isinstance(expiry, str):
        expiry = date.fromisoformat(expiry)

    return StockItem(
        stockId=str(doc.get("stockId") or doc.get("_id", "")),
        hospitalId=str(doc["hospitalId"]),
        medicine=doc["medicine"],
        quantity=int(doc["quantity"]),
        location=doc["location"],
        province=doc.get("province"),
        expiryDate=expiry,
        status=StockStatus(doc.get("status", "available")),
    )


def _doc_to_request(doc: dict) -> MedicineRequest:
    """Convert a raw MongoDB request document to a MedicineRequest Pydantic model."""
    required_by = doc.get("requiredBy")
    if isinstance(required_by, str):
        required_by = date.fromisoformat(required_by)

    return MedicineRequest(
        requestId=str(doc.get("requestId") or doc.get("_id", "")),
        hospitalId=str(doc["hospitalId"]),
        medicine=doc["medicine"],
        quantity=int(doc["quantity"]),
        urgency=UrgencyLevel(doc.get("urgency", "MEDIUM")),
        location=doc["location"],
        province=doc.get("province"),
        requiredBy=required_by,
        status=RequestStatus(doc.get("status", "open")),
    )


# ─── Request queries ──────────────────────────────────────────────────────────

async def get_request_by_id(request_id: str) -> MedicineRequest | None:
    """Fetch a single medicine request by its requestId field or _id."""
    db = get_db()
    query = {"$or": [{"requestId": request_id}]}
    try:
        from bson import ObjectId
        if ObjectId.is_valid(request_id):
            query["$or"].append({"_id": ObjectId(request_id)})
    except Exception:
        pass

    doc = await db[config.COLLECTION_REQUESTS].find_one(query)
    if doc is None:
        return None
    return _doc_to_request(doc)


async def get_open_requests(exclude_hospital_id: str | None = None) -> list[MedicineRequest]:
    """
    Fetch all open medicine requests.
    Optionally exclude requests from a specific hospital (to avoid self-matching).
    """
    db = get_db()
    query: dict = {"status": "open"}
    if exclude_hospital_id:
        query["hospitalId"] = {"$ne": exclude_hospital_id}

    cursor = db[config.COLLECTION_REQUESTS].find(query)
    docs = await cursor.to_list(length=500)
    return [_doc_to_request(d) for d in docs]


# ─── Stock / Inventory queries ────────────────────────────────────────────────

async def get_stock_by_id(stock_id: str) -> StockItem | None:
    """Fetch a single stock item by its stockId field or _id."""
    db = get_db()
    query = {"$or": [{"stockId": stock_id}]}
    try:
        from bson import ObjectId
        if ObjectId.is_valid(stock_id):
            query["$or"].append({"_id": ObjectId(stock_id)})
    except Exception:
        pass

    doc = await db[config.COLLECTION_INVENTORY].find_one(query)
    if doc is None:
        return None
    return _doc_to_stock(doc)


async def get_available_stock(
    medicine: str | None = None,
    exclude_hospital_id: str | None = None,
) -> list[StockItem]:
    """
    Fetch all available stock items.
    Optionally filter by medicine name and exclude a specific hospital.
    """
    db = get_db()
    query: dict = {"status": "available", "quantity": {"$gt": 0}}
    if medicine:
        query["medicine"] = {"$regex": f"^{medicine}$", "$options": "i"}
    if exclude_hospital_id:
        query["hospitalId"] = {"$ne": exclude_hospital_id}

    cursor = db[config.COLLECTION_INVENTORY].find(query)
    docs = await cursor.to_list(length=500)
    return [_doc_to_stock(d) for d in docs]
