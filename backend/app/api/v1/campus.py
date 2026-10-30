"""
CampusOps — Campus Directory & Spatial Endpoints
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.campus import BuildingResponse, RoomResponse
from backend.app.domain.campus.service import CampusService

router = APIRouter(prefix="/campus", tags=["Campus Directory"])

@router.get("/buildings", response_model=List[BuildingResponse])
async def list_buildings(db: AsyncSession = Depends(get_db)):
    buildings = await CampusService.get_all_buildings(db)
    return [BuildingResponse.model_validate(b) for b in buildings]

@router.get("/buildings/{building_id}/rooms", response_model=List[RoomResponse])
async def list_rooms(building_id: str, db: AsyncSession = Depends(get_db)):
    rooms = await CampusService.get_rooms_by_building(db, building_id)
    return [RoomResponse.model_validate(r) for r in rooms]

@router.get("/geojson", response_model=Dict[str, Any])
async def get_campus_geojson():
    return CampusService.get_campus_geojson()

