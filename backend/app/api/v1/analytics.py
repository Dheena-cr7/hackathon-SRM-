"""
CampusOps — Real Operational Analytics Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.analytics import CampusMetricsResponse
from backend.app.domain.analytics.service import AnalyticsService
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=CampusMetricsResponse)
async def get_overview_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_campus_overview(db)

