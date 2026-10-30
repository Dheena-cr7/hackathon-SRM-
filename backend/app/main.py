"""
CampusOps — FastAPI Application Entrypoint
Zero-cost, offline intelligent campus operations platform.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.v1 import (
    auth, campus, intake, incidents, work_orders, bookings, inventory, analytics, ws
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown resources
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Zero-Cost Intelligent Campus Operations Platform",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
API_V1_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(campus.router, prefix=API_V1_PREFIX)
app.include_router(intake.router, prefix=API_V1_PREFIX)
app.include_router(incidents.router, prefix=API_V1_PREFIX)
app.include_router(work_orders.router, prefix=API_V1_PREFIX)
app.include_router(bookings.router, prefix=API_V1_PREFIX)
app.include_router(inventory.router, prefix=API_V1_PREFIX)
app.include_router(analytics.router, prefix=API_V1_PREFIX)
app.include_router(ws.router, prefix=API_V1_PREFIX)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "operational",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_layer1": "active",
        "offline": True
    }

