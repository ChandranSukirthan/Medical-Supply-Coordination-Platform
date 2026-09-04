"""
recommender.py — Top-level orchestrator.

Combines the matcher (business-rule filtering) and the scorer (weighted ranking)
into the two main recommendation operations.

This module has NO FastAPI dependency — it works purely with Pydantic models
and can be tested independently.

Call flow:
    FastAPI route
        ↓
    recommender.recommend_suppliers / recommend_recipients
        ↓
    matcher.filter_suppliers / filter_recipients
        ↓
    scorer.score_supplier / score_recipient  (per candidate)
        ↓
    Sorted, limited, structured results
"""

from __future__ import annotations

from app import config
from app.models.schemas import (
    MedicineRequest,
    StockItem,
    RecommendSuppliersResponse,
    RecommendRecipientsResponse,
    SupplierRecommendation,
    RecipientRecommendation,
)
from app.services import matcher, scorer


def recommend_suppliers(
    request: MedicineRequest,
    available_stock: list[StockItem],
    limit: int | None = None,
) -> RecommendSuppliersResponse:
    """
    Given a medicine request, find and rank the best supplier hospitals.

    Steps:
    1. Filter candidates through business rules (matcher).
    2. Score each eligible stock item (scorer).
    3. Sort descending by score.
    4. Return top `limit` results.

    Args:
        request:         The hospital's medicine request.
        available_stock: All stock items from other hospitals.
        limit:           Maximum number of recommendations to return.

    Returns:
        RecommendSuppliersResponse with ranked SupplierRecommendation list.
    """
    max_results = limit or config.DEFAULT_LIMIT
    total_candidates = len(available_stock)

    # Step 1 — Filter
    eligible = matcher.filter_suppliers(request, available_stock)

    # Step 2 — Score each eligible stock item
    scored: list[tuple[scorer.ScoreResult, StockItem]] = []
    for stock in eligible:
        result = scorer.score_supplier(request, stock)
        scored.append((result, stock))

    # Step 3 — Sort by score descending
    scored.sort(key=lambda x: x[0].final_score, reverse=True)

    # Step 4 — Build response models (top N)
    recommendations: list[SupplierRecommendation] = []
    for score_result, stock in scored[:max_results]:
        recommendations.append(
            SupplierRecommendation(
                hospitalId=stock.hospitalId,
                stockId=stock.stockId,
                matchScore=score_result.final_score,
                reasons=score_result.reasons,
                canFulfil=stock.quantity >= request.quantity,
                availableQty=stock.quantity,
            )
        )

    return RecommendSuppliersResponse(
        requestId=request.requestId,
        medicine=request.medicine,
        totalCandidates=total_candidates,
        recommendations=recommendations,
    )


def recommend_recipients(
    stock: StockItem,
    open_requests: list[MedicineRequest],
    limit: int | None = None,
) -> RecommendRecipientsResponse:
    """
    Given available medicine stock, find and rank the best recipient hospitals.

    Steps:
    1. Filter candidates through business rules (matcher).
    2. Score each eligible open request (scorer).
    3. Sort descending by score.
    4. Return top `limit` results.

    Args:
        stock:         The available medicine stock.
        open_requests: All open medicine requests from other hospitals.
        limit:         Maximum number of recommendations to return.

    Returns:
        RecommendRecipientsResponse with ranked RecipientRecommendation list.
    """
    max_results = limit or config.DEFAULT_LIMIT
    total_candidates = len(open_requests)

    # Step 1 — Filter
    eligible = matcher.filter_recipients(stock, open_requests)

    # Step 2 — Score each eligible request
    scored: list[tuple[scorer.ScoreResult, MedicineRequest]] = []
    for req in eligible:
        result = scorer.score_recipient(stock, req)
        scored.append((result, req))

    # Step 3 — Sort by score descending
    scored.sort(key=lambda x: x[0].final_score, reverse=True)

    # Step 4 — Build response models (top N)
    recommendations: list[RecipientRecommendation] = []
    for score_result, req in scored[:max_results]:
        recommendations.append(
            RecipientRecommendation(
                requestId=req.requestId,
                hospitalId=req.hospitalId,
                matchScore=score_result.final_score,
                reasons=score_result.reasons,
                canFulfil=stock.quantity >= req.quantity,
                requestedQty=req.quantity,
            )
        )

    return RecommendRecipientsResponse(
        hospitalId=stock.hospitalId,
        medicine=stock.medicine,
        totalCandidates=total_candidates,
        recommendations=recommendations,
    )

