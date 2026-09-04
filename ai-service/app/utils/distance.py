"""
distance.py — Location comparison helpers.

Phase 1 uses city/district string matching.
To upgrade to GPS-based Haversine scoring later, replace `location_score()`
without changing any other file — all other modules call only this function.
"""

from __future__ import annotations


def _normalise(location: str) -> str:
    """Lower-case and strip whitespace for consistent comparison."""
    return location.strip().lower()


def location_score(location_a: str, location_b: str,
                   province_a: str | None = None,
                   province_b: str | None = None) -> float:
    """
    Return a score 0.0–1.0 based on how close two locations are.

    Scoring tiers:
        1.0  — Exact city/district match
        0.6  — Same province (different city)
        0.1  — Different province (no match)

    Args:
        location_a: City/district of party A (e.g. requester's location).
        location_b: City/district of party B (e.g. supplier's location).
        province_a: Province of party A (optional, used for tier-2 match).
        province_b: Province of party B (optional, used for tier-2 match).

    Returns:
        Float in range [0.0, 1.0].
    """
    if _normalise(location_a) == _normalise(location_b):
        return 1.0

    if province_a and province_b:
        if _normalise(province_a) == _normalise(province_b):
            return 0.6

    return 0.1


def location_reason(score: float) -> str | None:
    """Return a human-readable reason string for the location score tier."""
    if score >= 1.0:
        return "Same city/district"
    if score >= 0.6:
        return "Same province"
    return None  # No positive reason for distant locations

