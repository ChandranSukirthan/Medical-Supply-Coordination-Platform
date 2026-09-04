"""
schemas.py — Pydantic models (request & response contracts).

These schemas define the exact JSON shapes the FastAPI endpoints accept and return.
The Node.js backend must match these shapes exactly.
"""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ─── Enums ────────────────────────────────────────────────────────────────────

class UrgencyLevel(str, Enum):
    HIGH   = "HIGH"
    MEDIUM = "MEDIUM"
    LOW    = "LOW"


class StockStatus(str, Enum):
    AVAILABLE   = "available"
    UNAVAILABLE = "unavailable"
    RESERVED    = "reserved"


class RequestStatus(str, Enum):
    OPEN      = "open"
    CLOSED    = "closed"
    CANCELLED = "cancelled"
    FULFILLED = "fulfilled"


# ─── Input Models ─────────────────────────────────────────────────────────────

class MedicineRequest(BaseModel):
    """A hospital's medicine request (need)."""
    requestId:  str            = Field(..., description="Unique request identifier")
    hospitalId: str            = Field(..., description="Requesting hospital ID")
    medicine:   str            = Field(..., description="Medicine name")
    quantity:   int            = Field(..., ge=1, description="Units required (must be ≥ 1)")
    urgency:    UrgencyLevel   = Field(..., description="Urgency level: HIGH | MEDIUM | LOW")
    location:   str            = Field(..., description="City or district of the requesting hospital")
    province:   Optional[str]  = Field(None, description="Province for broader location matching")
    requiredBy: Optional[date] = Field(None, description="Latest acceptable delivery date")
    status:     RequestStatus  = Field(RequestStatus.OPEN, description="Request status")

    @field_validator("medicine")
    @classmethod
    def medicine_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("medicine name cannot be empty")
        return v


class StockItem(BaseModel):
    """A hospital's available medicine stock."""
    stockId:    Optional[str]  = Field(None, description="Stock record identifier")
    hospitalId: str            = Field(..., description="Hospital that owns this stock")
    medicine:   str            = Field(..., description="Medicine name")
    quantity:   int            = Field(..., ge=0, description="Available units")
    location:   str            = Field(..., description="City or district of the supplying hospital")
    province:   Optional[str]  = Field(None, description="Province for broader location matching")
    expiryDate: date           = Field(..., description="Expiry date of this stock (YYYY-MM-DD)")
    status:     StockStatus    = Field(StockStatus.AVAILABLE, description="Stock status")

    @field_validator("medicine")
    @classmethod
    def medicine_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("medicine name cannot be empty")
        return v


# ─── Output Models ────────────────────────────────────────────────────────────

class SupplierRecommendation(BaseModel):
    """One ranked supplier result for a medicine request."""
    hospitalId: str        = Field(..., description="Supplying hospital ID")
    stockId:    Optional[str] = Field(None, description="Specific stock record ID")
    matchScore: int        = Field(..., ge=0, le=100, description="Match score 0–100")
    reasons:    list[str]  = Field(default_factory=list, description="Human-readable match reasons")
    canFulfil:  bool       = Field(..., description="True if stock quantity >= requested quantity")
    availableQty: int      = Field(..., description="Units this hospital can supply")


class RecipientRecommendation(BaseModel):
    """One ranked recipient result for available stock."""
    requestId:  str        = Field(..., description="Medicine request ID")
    hospitalId: str        = Field(..., description="Requesting hospital ID")
    matchScore: int        = Field(..., ge=0, le=100, description="Match score 0–100")
    reasons:    list[str]  = Field(default_factory=list, description="Human-readable match reasons")
    canFulfil:  bool       = Field(..., description="True if stock quantity >= requested quantity")
    requestedQty: int      = Field(..., description="Units the requesting hospital needs")


# ─── Endpoint Request / Response Bodies ───────────────────────────────────────

class RecommendSuppliersRequest(BaseModel):
    """
    POST /api/v1/recommend/suppliers

    The Node.js backend sends the medicine request and a list of available
    stock items from other hospitals.
    """
    request:        MedicineRequest = Field(..., description="The medicine request to fulfil")
    availableStock: list[StockItem] = Field(..., description="Candidate stock items from other hospitals")
    limit:          int             = Field(5, ge=1, le=50, description="Max recommendations to return")


class RecommendSuppliersResponse(BaseModel):
    """Response for POST /api/v1/recommend/suppliers"""
    requestId:       str                       = Field(..., description="Echo of the request ID")
    medicine:        str                       = Field(..., description="Medicine that was matched")
    totalCandidates: int                       = Field(..., description="Number of stock items evaluated")
    recommendations: list[SupplierRecommendation] = Field(
        default_factory=list,
        description="Ranked supplier recommendations (best first)"
    )


class RecommendRecipientsRequest(BaseModel):
    """
    POST /api/v1/recommend/recipients

    The Node.js backend sends the available stock item and a list of open
    medicine requests from other hospitals.
    """
    stock:        StockItem           = Field(..., description="The available stock to match")
    openRequests: list[MedicineRequest] = Field(..., description="Candidate open requests")
    limit:        int                 = Field(5, ge=1, le=50, description="Max recommendations to return")


class RecommendRecipientsResponse(BaseModel):
    """Response for POST /api/v1/recommend/recipients"""
    hospitalId:      str                        = Field(..., description="The supplying hospital ID")
    medicine:        str                        = Field(..., description="Medicine being offered")
    totalCandidates: int                        = Field(..., description="Number of requests evaluated")
    recommendations: list[RecipientRecommendation] = Field(
        default_factory=list,
        description="Ranked recipient recommendations (best first)"
    )


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:  str = "ok"
    service: str = "Medical Supply AI Service"
    version: str = "1.0.0"


# ─── DB-mode endpoint schemas (Hybrid) ───────────────────────────────────────

class DBSuppliersRequest(BaseModel):
    """
    POST /api/v1/recommend/suppliers  (DB mode)

    The AI fetches matching stock from MongoDB automatically.
    Only send the requestId — no need to send stock data.
    """
    requestId: str = Field(..., description="The requestId of the medicine request (from MongoDB)")
    limit: int     = Field(5, ge=1, le=50, description="Max recommendations to return")


class DBRecipientsRequest(BaseModel):
    """
    POST /api/v1/recommend/recipients  (DB mode)

    The AI fetches open requests from MongoDB automatically.
    Only send the stockId — no need to send request data.
    """
    stockId: str = Field(..., description="The stockId of the inventory item (from MongoDB)")
    limit: int   = Field(5, ge=1, le=50, description="Max recommendations to return")


class DBErrorResponse(BaseModel):
    """Returned when a requestId or stockId is not found in the database."""
    error:   str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
