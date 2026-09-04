"""
scorer.py — Weighted scoring algorithm.

Produces a score in range 0–100 (integer) for each candidate that passed
the matcher's business-rule filter.

Each scoring dimension is computed independently, then combined using the
configurable weights from config.py.

Score breakdown:
    Medicine compatibility   40%
    Quantity compatibility   25%
    Urgency                  15%
    Location / distance      10%
    Expiry / availability    10%
"""

from __future__ import annotations

from datetime import date, timedelta
from dataclasses import dataclass, field

from app import config
from app.models.schemas import MedicineRequest, StockItem, UrgencyLevel
from app.utils.distance import location_score, location_reason


# ─── Score result dataclass ────────────────────────────────────────────────────

@dataclass
class ScoreResult:
    raw_score:    float           # 0.0 – 1.0
    final_score:  int             # 0 – 100 (rounded)
    reasons:      list[str]       = field(default_factory=list)
    dimensions:   dict[str, float] = field(default_factory=dict)  # for debugging


# ─── Individual dimension scorers ─────────────────────────────────────────────

def _medicine_score(request_medicine: str, stock_medicine: str) -> float:
    """
    40% weight.
    Exact case-insensitive match → 1.0, otherwise 0.0.
    (Non-matching medicine should already be filtered by matcher,
    but we guard here for safety.)
    """
    return 1.0 if request_medicine.strip().lower() == stock_medicine.strip().lower() else 0.0


def _quantity_score(requested: int, available: int) -> float:
    """
    25% weight.
    Score = min(available / requested, 1.0).
    - Full coverage  → 1.0
    - Partial (≥50%) → 0.5 – 1.0 (linear)
    - Partial (<50%) → 0.0 – 0.5 (linear)
    """
    if requested <= 0:
        return 1.0
    ratio = available / requested
    return min(ratio, 1.0)


def _urgency_score(urgency: UrgencyLevel) -> float:
    """
    15% weight.
    Maps urgency to a priority multiplier.
    HIGH requests are the most important to fulfil.
    """
    mapping = {
        UrgencyLevel.HIGH:   1.0,
        UrgencyLevel.MEDIUM: 0.65,
        UrgencyLevel.LOW:    0.30,
    }
    return mapping.get(urgency, 0.30)


def _expiry_score(expiry_date: date) -> float:
    """
    10% weight.
    Scores how safely far away the expiry date is.
    Expired stock should never reach here (filtered by matcher),
    but we guard with 0.0.

    > 6 months → 1.0
    3–6 months → 0.75
    1–3 months → 0.50
    < 1 month  → 0.25
    ≤ today    → 0.0
    """
    today = date.today()
    delta = (expiry_date - today).days

    if delta <= 0:
        return 0.0
    elif delta < 30:
        return 0.25
    elif delta < 90:
        return 0.50
    elif delta < 180:
        return 0.75
    else:
        return 1.0


# ─── Reason builders ──────────────────────────────────────────────────────────

def _quantity_reason(requested: int, available: int) -> str | None:
    if available >= requested:
        return "Sufficient quantity available"
    pct = int((available / requested) * 100)
    return f"Partial quantity available ({pct}% of requested)"


def _urgency_reason(urgency: UrgencyLevel) -> str | None:
    if urgency == UrgencyLevel.HIGH:
        return "High urgency request - prioritised"
    if urgency == UrgencyLevel.MEDIUM:
        return "Medium urgency request"
    return None  # LOW urgency doesn't add a positive reason


def _expiry_reason(expiry_date: date) -> str | None:
    today = date.today()
    delta = (expiry_date - today).days
    if delta > 180:
        return "Stock expiry is well within safe range"
    if delta >= 90:
        return f"Stock expires in ~{delta // 30} months"
    if delta >= 30:
        return f"Note: Stock expires soon ({delta} days)"
    return None


# ─── Main scoring functions ───────────────────────────────────────────────────

def score_supplier(request: MedicineRequest, stock: StockItem) -> ScoreResult:
    """
    Score a single stock item as a potential supplier for a medicine request.

    Returns a ScoreResult with final_score (0–100) and human-readable reasons.
    """
    med_score = _medicine_score(request.medicine, stock.medicine)
    qty_score = _quantity_score(request.quantity, stock.quantity)
    urg_score = _urgency_score(request.urgency)
    loc_score = location_score(
        request.location, stock.location,
        request.province,  stock.province
    )
    exp_score = _expiry_score(stock.expiryDate)

    raw = (
        config.WEIGHT_MEDICINE * med_score +
        config.WEIGHT_QUANTITY * qty_score +
        config.WEIGHT_URGENCY  * urg_score +
        config.WEIGHT_LOCATION * loc_score +
        config.WEIGHT_EXPIRY   * exp_score
    )
    final = round(raw * 100)

    reasons: list[str] = []
    if med_score == 1.0:
        reasons.append("Medicine name matches")
    qty_r = _quantity_reason(request.quantity, stock.quantity)
    if qty_r:
        reasons.append(qty_r)
    urg_r = _urgency_reason(request.urgency)
    if urg_r:
        reasons.append(urg_r)
    loc_r = location_reason(loc_score)
    if loc_r:
        reasons.append(loc_r)
    exp_r = _expiry_reason(stock.expiryDate)
    if exp_r:
        reasons.append(exp_r)

    return ScoreResult(
        raw_score=raw,
        final_score=final,
        reasons=reasons,
        dimensions={
            "medicine": med_score,
            "quantity": qty_score,
            "urgency":  urg_score,
            "location": loc_score,
            "expiry":   exp_score,
        }
    )


def score_recipient(stock: StockItem, request: MedicineRequest) -> ScoreResult:
    """
    Score a single open request as a potential recipient for available stock.

    Urgency here reflects how much this request NEEDS the stock.
    """
    med_score = _medicine_score(stock.medicine, request.medicine)
    qty_score = _quantity_score(request.quantity, stock.quantity)
    urg_score = _urgency_score(request.urgency)
    loc_score = location_score(
        stock.location,   request.location,
        stock.province,   request.province
    )
    exp_score = _expiry_score(stock.expiryDate)

    raw = (
        config.WEIGHT_MEDICINE * med_score +
        config.WEIGHT_QUANTITY * qty_score +
        config.WEIGHT_URGENCY  * urg_score +
        config.WEIGHT_LOCATION * loc_score +
        config.WEIGHT_EXPIRY   * exp_score
    )
    final = round(raw * 100)

    reasons: list[str] = []
    if med_score == 1.0:
        reasons.append("Medicine name matches")
    qty_r = _quantity_reason(request.quantity, stock.quantity)
    if qty_r:
        reasons.append(qty_r)
    urg_r = _urgency_reason(request.urgency)
    if urg_r:
        reasons.append(urg_r)
    loc_r = location_reason(loc_score)
    if loc_r:
        reasons.append(loc_r)
    exp_r = _expiry_reason(stock.expiryDate)
    if exp_r:
        reasons.append(exp_r)

    return ScoreResult(
        raw_score=raw,
        final_score=final,
        reasons=reasons,
        dimensions={
            "medicine": med_score,
            "quantity": qty_score,
            "urgency":  urg_score,
            "location": loc_score,
            "expiry":   exp_score,
        }
    )

