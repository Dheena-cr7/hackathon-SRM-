"""
CampusOps — SLA Monitoring & Escalation Service
Calculates response and resolution deadlines and evaluates compliance.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.audit import SLAPolicy
from backend.app.models.incident import Incident

class SLAService:
    @staticmethod
    async def get_deadlines_for_priority(db: AsyncSession, priority: str) -> Optional[Dict[str, int]]:
        res = await db.execute(select(SLAPolicy).where(SLAPolicy.priority == priority.lower()))
        policy = res.scalar_one_or_none()
        if not policy:
            return None
        return {
            "response_deadline_minutes": policy.response_deadline_minutes,
            "resolution_deadline_minutes": policy.resolution_deadline_minutes
        }

    @staticmethod
    def calculate_sla_status(incident: Incident, policy: SLAPolicy) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        created_at = incident.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        resolution_deadline = created_at + timedelta(minutes=policy.resolution_deadline_minutes)
        time_remaining_seconds = (resolution_deadline - now).total_seconds()
        
        is_breached = time_remaining_seconds < 0 and incident.status not in ("resolved", "closed", "cancelled")
        is_warning = (time_remaining_seconds < (policy.resolution_deadline_minutes * 60 * 0.25)) and not is_breached

        return {
            "incident_id": incident.id,
            "priority": incident.priority,
            "deadline": resolution_deadline.isoformat(),
            "time_remaining_minutes": max(0, int(time_remaining_seconds / 60)),
            "is_breached": is_breached,
            "is_warning": is_warning
        }
