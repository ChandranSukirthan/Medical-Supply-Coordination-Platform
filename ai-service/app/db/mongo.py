"""
mongo.py — Async MongoDB connection using Motor.

Motor is the async-compatible MongoDB driver for Python.
It uses the same connection URL as the Node.js Mongoose backend.

The client is created once at app startup (lifespan event in main.py)
and shared across all requests via module-level variables.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app import config

# Module-level client and db — set during app startup, used by repositories
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def connect() -> None:
    """Create the MongoDB client. Called once at FastAPI startup."""
    global _client, _db
    _client = AsyncIOMotorClient(config.MONGODB_URL)
    _db = _client[config.DB_NAME]
    print(f"[MongoDB] Connected → {config.MONGODB_URL} / {config.DB_NAME}")


def disconnect() -> None:
    """Close the MongoDB client. Called once at FastAPI shutdown."""
    global _client
    if _client:
        _client.close()
        print("[MongoDB] Connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database instance. Raises if not connected."""
    if _db is None:
        raise RuntimeError("MongoDB not connected. Is the service starting up correctly?")
    return _db

