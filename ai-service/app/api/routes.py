"""
routes.py — FastAPI route definitions (Hybrid: DB mode + Manual mode).

Endpoints:
    POST /api/v1/recommend/suppliers
        - If { requestId: "REQ001" }: fetches from MongoDB automatically (DB Mode)
        - If { request: {...}, availableStock: [...] }: uses provided data (Manual Mode)

    POST /api/v1/recommend/recipients
        - If { stockId: "STK001" }: fetches from MongoDB automatically (DB Mode)
        - If { stock: {...}, openRequests: [...] }: uses provided data (Manual Mode)

    POST /api/v1/recommend/suppliers/manual
    POST /api/v1/recommend/recipients/manual

    GET  /api/v1/health
"""

from __future__ import annotations
from typing import Union

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    # DB-mode schemas
    DBSuppliersRequest,
    DBRecipientsRequest,
    # Manual-mode schemas
    RecommendSuppliersRequest,
    RecommendSuppliersResponse,
    RecommendRecipientsRequest,
    RecommendRecipientsResponse,
    # Health
    HealthResponse,
)
from app.services import recommender
from app.db import queries

router = APIRouter()


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    tags=["Health"],
)
async def health_check() -> HealthResponse:
    """Returns 200 OK when the service is running."""
    return HealthResponse()


# ─── Suppliers Endpoint (Hybrid: DB + Manual) ──────────────────────────────────

@router.post(
    "/recommend/suppliers",
    response_model=RecommendSuppliersResponse,
    summary="Find best suppliers for a medicine request (Hybrid: DB or Manual)",
    description=(
        "**Hybrid Endpoint**:\n\n"
        "1. **DB Mode (Simple)**: Pass `{ \"requestId\": \"REQ001\", \"limit\": 5 }`. "
        "The AI fetches the request and matching stock from MongoDB.\n\n"
        "2. **Manual Mode**: Pass `{ \"request\": {...}, \"availableStock\": [...], \"limit\": 5 }`. "
        "The AI scores the provided payload directly without querying MongoDB."
    ),
    tags=["Recommendations"],
)
async def recommend_suppliers(
    body: Union[RecommendSuppliersRequest, DBSuppliersRequest]
) -> RecommendSuppliersResponse:
    # Manual mode: full payload provided
    if isinstance(body, RecommendSuppliersRequest):
        return recommender.recommend_suppliers(
            request=body.request,
            available_stock=body.availableStock,
            limit=body.limit,
        )

    # DB mode: fetch from MongoDB
    request = await queries.get_request_by_id(body.requestId)
    if request is None:
        raise HTTPException(
            status_code=404,
            detail=f"No medicine request found with requestId='{body.requestId}'"
        )

    available_stock = await queries.get_available_stock(
        medicine=request.medicine,
        exclude_hospital_id=request.hospitalId,
    )

    return recommender.recommend_suppliers(
        request=request,
        available_stock=available_stock,
        limit=body.limit,
    )


# ─── Recipients Endpoint (Hybrid: DB + Manual) ─────────────────────────────────

@router.post(
    "/recommend/recipients",
    response_model=RecommendRecipientsResponse,
    summary="Find best recipients for available stock (Hybrid: DB or Manual)",
    description=(
        "**Hybrid Endpoint**:\n\n"
        "1. **DB Mode (Simple)**: Pass `{ \"stockId\": \"STK001\", \"limit\": 5 }`. "
        "The AI fetches the stock and open requests from MongoDB.\n\n"
        "2. **Manual Mode**: Pass `{ \"stock\": {...}, \"openRequests\": [...], \"limit\": 5 }`. "
        "The AI scores the provided payload directly without querying MongoDB."
    ),
    tags=["Recommendations"],
)
async def recommend_recipients(
    body: Union[RecommendRecipientsRequest, DBRecipientsRequest]
) -> RecommendRecipientsResponse:
    # Manual mode: full payload provided
    if isinstance(body, RecommendRecipientsRequest):
        return recommender.recommend_recipients(
            stock=body.stock,
            open_requests=body.openRequests,
            limit=body.limit,
        )

    # DB mode: fetch from MongoDB
    stock = await queries.get_stock_by_id(body.stockId)
    if stock is None:
        raise HTTPException(
            status_code=404,
            detail=f"No stock item found with stockId='{body.stockId}'"
        )

    open_requests = await queries.get_open_requests(
        exclude_hospital_id=stock.hospitalId,
    )

    return recommender.recommend_recipients(
        stock=stock,
        open_requests=open_requests,
        limit=body.limit,
    )


# ─── Dedicated Manual Endpoints ───────────────────────────────────────────────

@router.post(
    "/recommend/suppliers/manual",
    response_model=RecommendSuppliersResponse,
    summary="[Manual Mode] Find best suppliers — send full data payload",
    tags=["Manual Mode"],
)
async def recommend_suppliers_manual(body: RecommendSuppliersRequest) -> RecommendSuppliersResponse:
    return recommender.recommend_suppliers(
        request=body.request,
        available_stock=body.availableStock,
        limit=body.limit,
    )


@router.post(
    "/recommend/recipients/manual",
    response_model=RecommendRecipientsResponse,
    summary="[Manual Mode] Find best recipients — send full data payload",
    tags=["Manual Mode"],
)
async def recommend_recipients_manual(body: RecommendRecipientsRequest) -> RecommendRecipientsResponse:
    return recommender.recommend_recipients(
        stock=body.stock,
        open_requests=body.openRequests,
        limit=body.limit,
    )
