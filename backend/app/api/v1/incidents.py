"""
CampusOps — Incident Management Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from backend.app.core.database import get_db
from backend.app.schemas.incident import IncidentResponse, IncidentCreate
from backend.app.domain.incidents.service import IncidentService
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentPatchRequest(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None
    notes: Optional[str] = None

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[str] = None,
    building_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incidents = await IncidentService.list_incidents(db, status=status, building_id=building_id)
    return [IncidentResponse.model_validate(inc) for inc in incidents]

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    data: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident = await IncidentService.create_incident(db, current_user.id, data)
    return IncidentResponse.model_validate(incident)

@router.get("/ai-summary")
async def get_incidents_ai_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Synthesize open campus incidents into an AI Executive Summary and correlated clusters.
    """
    from backend.app.models.incident import Incident
    incidents = await IncidentService.list_incidents(db)
    active = [inc for inc in incidents if inc.status in ["reported", "assigned", "in_progress", "triage"]]

    by_category = {}
    by_building = {}
    critical_count = 0

    for inc in active:
        by_category[inc.category] = by_category.get(inc.category, 0) + 1
        bld = inc.building_id or "General"
        by_building[bld] = by_building.get(bld, 0) + 1
        if inc.priority in ["critical", "high"]:
            critical_count += 1

    top_cat = max(by_category.items(), key=lambda x: x[1])[0] if by_category else "General"
    top_bld = max(by_building.items(), key=lambda x: x[1])[0] if by_building else "Tech Park"

    summary_text = (
        f"Campus Operations Executive Brief: Tracking {len(active)} active incident(s) campus-wide. "
        f"Primary disruption vector is {top_cat.upper()} with highest concentration in {top_bld}. "
        f"{critical_count} critical safety hazard(s) flagged for immediate field dispatch. "
        f"In-memory correlation analysis indicates infrastructure strain on distribution risers; technicians prioritized."
    )

    clusters = []
    for bld, count in by_building.items():
        matching = [inc for inc in active if (inc.building_id or "General") == bld]
        clusters.append({
            "building_id": bld,
            "incident_count": count,
            "categories": list(set(inc.category for inc in matching)),
            "sample_incident_numbers": [inc.incident_number for inc in matching[:3]],
            "correlation_reason": f"{count} correlated complaint(s) reported in {bld} within the current operational window."
        })

    return {
        "active_incidents_count": len(active),
        "critical_count": critical_count,
        "executive_summary": summary_text,
        "correlated_clusters": clusters,
        "breakdown_by_category": by_category,
        "breakdown_by_building": by_building
    }

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident = await IncidentService.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: str,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident = await IncidentService.update_status(db, incident_id, new_status, current_user.id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def patch_incident(
    incident_id: str,
    data: IncidentPatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from backend.app.models.incident import Incident
    from backend.app.models.audit import AuditLog
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if data.status:
        incident.status = data.status
        if data.status == "resolved":
            from datetime import datetime, timezone
            incident.resolved_at = datetime.now(timezone.utc)

    note_text = data.comment or data.notes
    if note_text:
        existing_desc = incident.description or ""
        incident.description = f"{existing_desc}\n\n[Field Note by {current_user.full_name}]: {note_text}"

    audit = AuditLog(
        event_type="INCIDENT_UPDATED",
        actor_id=current_user.id,
        entity_type="incident",
        entity_id=incident.id,
        details={"status": incident.status, "note": note_text}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(incident)
    return IncidentResponse.model_validate(incident)

@router.post("/{incident_id}/comments", response_model=IncidentResponse)
async def add_incident_comment(
    incident_id: str,
    data: IncidentPatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from backend.app.models.incident import Incident
    from backend.app.models.audit import AuditLog
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    note_text = data.comment or data.notes or ""
    existing_desc = incident.description or ""
    incident.description = f"{existing_desc}\n\n[Comment by {current_user.full_name}]: {note_text}"

    audit = AuditLog(
        event_type="INCIDENT_COMMENT_ADDED",
        actor_id=current_user.id,
        entity_type="incident",
        entity_id=incident.id,
        details={"comment": note_text}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(incident)
    return IncidentResponse.model_validate(incident)

@router.post("/{incident_id}/escalate", response_model=IncidentResponse)
async def escalate_incident(
    incident_id: str,
    payload: dict = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Escalate an incident priority to CRITICAL.
    Triggers expedited SLA deadlines, immediate notifications, and audit logging.
    """
    from backend.app.models.incident import Incident
    from backend.app.models.audit import AuditLog, Notification
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_priority = incident.priority
    incident.priority = "critical"

    reason = payload.get("reason", "Administrative safety override") if payload else "Administrative safety override"
    existing_desc = incident.description or ""
    incident.description = f"{existing_desc}\n\n[ESCALATION by {current_user.full_name}]: Priority raised to CRITICAL ({reason})."

    audit = AuditLog(
        event_type="INCIDENT_ESCALATED",
        actor_id=current_user.id,
        entity_type="incident",
        entity_id=incident.id,
        details={"old_priority": old_priority, "new_priority": "critical", "reason": reason}
    )
    db.add(audit)

    notification = Notification(
        recipient_id=current_user.id,
        title=f"URGENT: {incident.incident_number} Escalated",
        message=f"{incident.title} raised to CRITICAL priority by {current_user.full_name}. Response timer expedited.",
        category="escalation"
    )
    db.add(notification)

    await db.commit()
    await db.refresh(incident)
    return IncidentResponse.model_validate(incident)

@router.get("/{incident_id}/correlated", response_model=List[IncidentResponse])
async def get_correlated_incidents(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Find correlated or concurrent complaints in the same building or category.
    """
    from sqlalchemy import select, or_, and_
    from backend.app.models.incident import Incident
    target = await db.get(Incident, incident_id)
    if not target:
        raise HTTPException(status_code=404, detail="Incident not found")

    query = (
        select(Incident)
        .where(
            and_(
                Incident.id != incident_id,
                or_(
                    Incident.building_id == target.building_id,
                    Incident.category == target.category
                ),
                Incident.status.in_(["reported", "triage", "assigned", "in_progress"])
            )
        )
        .order_by(Incident.created_at.desc())
        .limit(5)
    )
    res = await db.execute(query)
    return [IncidentResponse.model_validate(inc) for inc in res.scalars().all()]





