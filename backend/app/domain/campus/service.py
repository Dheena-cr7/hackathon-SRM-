"""
CampusOps — Campus Directory Service
Provides building status aggregation, room directory, and GeoJSON loading.
"""

import json
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from backend.app.models.campus import Building, Room, Asset
from backend.app.models.incident import Incident
from backend.app.core.config import settings

class CampusService:
    @staticmethod
    async def get_all_buildings(db: AsyncSession) -> List[Building]:
        result = await db.execute(select(Building))
        buildings = result.scalars().all()
        
        # Calculate live operational status from active incidents
        for b in buildings:
            inc_res = await db.execute(
                select(Incident.priority)
                .where(Incident.building_id == b.id, Incident.status.in_(["reported", "triage", "assigned", "in_progress"]))
            )
            priorities = inc_res.scalars().all()
            if "critical" in priorities:
                b.operational_status = "critical_disruption"
            elif "high" in priorities:
                b.operational_status = "active_incident"
            elif priorities:
                b.operational_status = "maintenance"
            else:
                b.operational_status = "normal"
                
        return list(buildings)

    @staticmethod
    async def get_rooms_by_building(db: AsyncSession, building_id: str) -> List[Room]:
        result = await db.execute(
            select(Room).options(selectinload(Room.assets)).where(Room.building_id == building_id)
        )
        return list(result.scalars().all())

    @staticmethod
    def get_campus_geojson() -> Dict[str, Any]:
        with open(settings.CAMPUS_GEOJSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

