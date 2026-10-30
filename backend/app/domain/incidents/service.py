"""
CampusOps — Incident Operations Service
Manages ticket creation, number generation, status transitions, and audit records.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.incident import Incident
from backend.app.models.audit import AuditLog
from backend.app.schemas.incident import IncidentCreate
from backend.app.core.events import event_bus

class IncidentService:
    @staticmethod
    async def create_incident(db: AsyncSession, reporter_id: str, data: IncidentCreate) -> Incident:
        # Generate incident number
        count_query = select(func.count(Incident.id))
        count = (await db.execute(count_query)).scalar() or 0
        incident_number = f"INC-2026-{count + 1:04d}"

        priority = getattr(data, "severity", None) or data.priority or "medium"
        bld_id = data.building_id
        if not bld_id:
            from backend.app.models.campus import Building
            bld_res = await db.execute(select(Building.id).limit(1))
            bld_id = bld_res.scalar() or "BLD-TECH-01"

        incident = Incident(
            incident_number=incident_number,
            reporter_id=reporter_id,
            title=data.title,
            description=data.description,
            category=data.category,
            priority=priority,
            status="reported",
            building_id=bld_id,
            room_id=data.room_id or getattr(data, "room_number", None),
            asset_id=data.asset_id,
            raw_text=data.raw_text,
            extraction_metadata=data.extraction_metadata
        )
        db.add(incident)
        await db.flush()

        # Audit record
        audit = AuditLog(
            event_type="INCIDENT_CREATED",
            actor_id=reporter_id,
            entity_type="incident",
            entity_id=incident.id,
            details={"incident_number": incident.incident_number, "priority": incident.priority}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(incident)

        # Publish event
        await event_bus.publish("IncidentCreated", {
            "incident_id": incident.id,
            "incident_number": incident.incident_number,
            "building_id": incident.building_id,
            "room_id": incident.room_id,
            "priority": incident.priority,
            "category": incident.category
        })

        return incident

    @staticmethod
    async def get_incident(db: AsyncSession, incident_id: str) -> Optional[Incident]:
        return await db.get(Incident, incident_id)

    @staticmethod
    async def list_incidents(db: AsyncSession, status: Optional[str] = None, building_id: Optional[str] = None) -> List[Incident]:
        query = select(Incident).order_by(Incident.created_at.desc())
        if status:
            query = query.where(Incident.status == status)
        if building_id:
            query = query.where(Incident.building_id == building_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    get_incidents = list_incidents

    @staticmethod
    async def update_status(db: AsyncSession, incident_id: str, new_status: str, actor_id: str) -> Optional[Incident]:
        incident = await db.get(Incident, incident_id)
        if not incident:
            return None
        
        old_status = incident.status
        incident.status = new_status
        if new_status == "resolved":
            incident.resolved_at = datetime.now(timezone.utc)
        
        audit = AuditLog(
            event_type="INCIDENT_STATUS_CHANGED",
            actor_id=actor_id,
            entity_type="incident",
            entity_id=incident.id,
            details={"old_status": old_status, "new_status": new_status}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(incident)

        await event_bus.publish("IncidentStatusChanged", {
            "incident_id": incident.id,
            "old_status": old_status,
            "new_status": new_status,
            "building_id": incident.building_id
        })
        return incident

