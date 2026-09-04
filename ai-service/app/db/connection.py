"""
connection.py — MongoDB connection manager using Motor (async driver).

A single Motor client is created once at application startup and reused
across all requests. This avoids the overhead of creating a new connection
per request.

Usage:
    from app.db.connection import get_db
    db = get_db()
    collection = db["inventory"]
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app import config

# Module-level client — initialised once by the FastAPI lifespan handler
_client: AsyncIOMotorClient | None = None


def connect() -> None:
    """Create the MongoDB client. Called once at application startup."""
    global _client
    _client = AsyncIOMotorClient(config.MONGODB_URL)
    print(f"[DB] Connected to MongoDB -> database: '{config.MONGODB_DB_NAME}'")


def disconnect() -> None:
    """Close the MongoDB client. Called once at application shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        print("[DB] MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    if _client is None:
        raise RuntimeError("MongoDB client is not initialised. Call connect() first.")
    return _client[config.MONGODB_DB_NAME]
