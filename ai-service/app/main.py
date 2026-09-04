"""
main.py — FastAPI application factory.

Creates and configures the FastAPI application:
- Connects to MongoDB on startup, disconnects on shutdown (lifespan)
- Mounts the API router under /api/v1
- Enables CORS for the Node.js backend and React frontend
- Configures Swagger UI metadata
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.db import connection
from app.api.routes import router


# ─── Lifespan (startup / shutdown) ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB when the service starts; disconnect when it stops."""
    connection.connect()
    yield
    connection.disconnect()


# ─── App factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Medical Supply AI Service",
    description=(
        "AI-powered recommendation engine for hospital medicine stock sharing.\n\n"
        "## Two Modes\n\n"
        "### 🗄️ DB Mode (recommended)\n"
        "Send only IDs — the AI fetches all data from MongoDB automatically.\n"
        "- `POST /api/v1/recommend/suppliers` → send `requestId`\n"
        "- `POST /api/v1/recommend/recipients` → send `hospitalId` + `stockId`\n\n"
        "### 📋 Manual Mode (for Node.js bridge)\n"
        "Send the full data payload — AI scores without touching the database.\n"
        "- `POST /api/v1/recommend/suppliers/manual`\n"
        "- `POST /api/v1/recommend/recipients/manual`\n\n"
        "All recommendations are ranked 0–100. The AI does **not** approve transactions."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "ok", "message": "Medical Supply AI Service is running"}


# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=config.PORT, reload=True)
