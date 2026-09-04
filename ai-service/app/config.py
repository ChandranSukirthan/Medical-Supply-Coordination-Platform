"""
config.py — Centralised configuration for the AI service.

All values are loaded from environment variables (via .env file).
Scoring weights are validated to ensure they sum to 1.0.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def _float_env(key: str, default: float) -> float:
    try:
        return float(os.getenv(key, default))
    except (TypeError, ValueError):
        return default


def _int_env(key: str, default: int) -> int:
    try:
        return int(os.getenv(key, default))
    except (TypeError, ValueError):
        return default


# ─── Server ───────────────────────────────────────────────────────────────────
PORT: int = _int_env("AI_SERVICE_PORT", 8000)
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5000,http://localhost:3000,http://localhost:5173"
).split(",")

# ─── MongoDB ──────────────────────────────────────────────────────────────────
MONGODB_URL: str = os.getenv(
    "MONGODB_URL",
    "mongodb+srv://sukirsukirthan347_db_user:2yn3ZzYBiK4NGdV9@cluster0.jrypkvq.mongodb.net/?appName=Cluster0"
)
MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "medical_supply_db")

# Collection names (single source of truth)
COLLECTION_HOSPITALS: str = "hospitals"
COLLECTION_INVENTORY:  str = "inventory"
COLLECTION_REQUESTS:   str = "requests"

# ─── Default recommendation limit ─────────────────────────────────────────────
DEFAULT_LIMIT: int = _int_env("DEFAULT_LIMIT", 5)

# ─── Scoring Weights ──────────────────────────────────────────────────────────
WEIGHT_MEDICINE: float = _float_env("WEIGHT_MEDICINE", 0.40)
WEIGHT_QUANTITY: float = _float_env("WEIGHT_QUANTITY", 0.25)
WEIGHT_URGENCY:  float = _float_env("WEIGHT_URGENCY",  0.15)
WEIGHT_LOCATION: float = _float_env("WEIGHT_LOCATION", 0.10)
WEIGHT_EXPIRY:   float = _float_env("WEIGHT_EXPIRY",   0.10)

WEIGHTS: dict[str, float] = {
    "medicine": WEIGHT_MEDICINE,
    "quantity": WEIGHT_QUANTITY,
    "urgency":  WEIGHT_URGENCY,
    "location": WEIGHT_LOCATION,
    "expiry":   WEIGHT_EXPIRY,
}

_total = sum(WEIGHTS.values())
if abs(_total - 1.0) > 0.01:
    raise ValueError(
        f"Scoring weights must sum to 1.0, but got {_total:.4f}. "
        "Check your .env file or config.py defaults."
    )
