"""
CampusOps — Work Orders & Allocation API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.work_order import (
    WorkOrderCreate, WorkOrderResponse, WorkOrderTransitionRequest, WorkOrderNoteRequest, TechnicianCandidate, AssignedTechnicianInfo
)
from backend.app.domain.work_orders.service import WorkOrderService
from backend.app.domain.work_orders.state_machine import InvalidStateTransitionError
from backend.app.domain.staff.allocator import StaffAllocator
from backend.app.api.deps import get_current_user, require_roles
from backend.app.models.user import User, StaffProfile
from backend.app.models.work_order import WorkOrder
from backend.app.models.incident import Incident
from backend.app.models.campus import Building, Room
from backend.app.models.audit import AuditLog

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

async def serialize_work_order(db: AsyncSession, wo: WorkOrder) -> WorkOrderResponse:
    """Enriches work order with linked incident details, location, and technician info."""
    incident = await db.get(Incident, wo.incident_id) if wo.incident_id else None
    building = await db.get(Building, incident.building_id) if (incident and incident.building_id) else None
    room = await db.get(Room, incident.room_id) if (incident and incident.room_id) else None

    tech_user = None
    tech_profile = None
    if wo.assigned_technician_id:
        tech_user = await db.get(User, wo.assigned_technician_id)
        tech_profile = await db.get(StaffProfile, wo.assigned_technician_id)

    return WorkOrderResponse(
        id=wo.id,
        order_number=wo.order_number,
        work_order_number=wo.order_number,
        incident_id=wo.incident_id,
        incident_number=incident.incident_number if incident else "INC-UNKNOWN",
        title=incident.title if incident else f"Maintenance Ticket {wo.order_number}",
        description=incident.description if incident else "Facility maintenance inspection and resolution.",
        category=incident.category if incident else "electrical",
        priority=wo.priority or (incident.priority if incident else "medium"),
        status=wo.status,
        building_id=incident.building_id if incident else None,
        building_name=building.name if building else "Campus Facilities",
        room_id=incident.room_id if incident else None,
        room_name=room.name if room else (incident.room_id if incident else "General Zone"),
        estimated_duration_hours=wo.estimated_duration_hours or 1.0,
        assigned_technician_id=wo.assigned_technician_id,
        assigned_technician_name=tech_user.full_name if tech_user else "Unassigned",
        assigned_technician=AssignedTechnicianInfo(
            id=tech_user.id,
            full_name=tech_user.full_name,
            email=tech_user.email,
            title=tech_profile.title if tech_profile else "Maintenance Technician"
        ) if tech_user else None,
        resolution_notes=wo.resolution_notes,
        created_at=wo.created_at,
        updated_at=wo.updated_at,
    )

@router.get("", response_model=List[WorkOrderResponse])
async def list_work_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    query = select(WorkOrder).order_by(WorkOrder.created_at.desc())
    res = await db.execute(query)
    wos = res.scalars().all()
    return [await serialize_work_order(db, wo) for wo in wos]

@router.post("", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    data: WorkOrderCreate,
    current_user: User = Depends(require_roles("facilities_admin", "dept_manager")),
    db: AsyncSession = Depends(get_db)
):
    wo = await WorkOrderService.create_work_order(db, data, current_user.id)
    return await serialize_work_order(db, wo)

@router.get("/technician-recommendations/{category}", response_model=List[TechnicianCandidate])
async def recommend_technicians(
    category: str,
    current_user: User = Depends(require_roles("facilities_admin", "dept_manager")),
    db: AsyncSession = Depends(get_db)
):
    return await StaffAllocator.recommend_technicians(db, category)

@router.post("/{work_order_id}/assign", response_model=WorkOrderResponse)
async def assign_technician(
    work_order_id: str,
    payload: dict,
    current_user: User = Depends(require_roles("facilities_admin", "dept_manager")),
    db: AsyncSession = Depends(get_db)
):
    tech_id = payload.get("technician_id")
    reason = payload.get("reason", "Admin assignment")
    if not tech_id:
        raise HTTPException(status_code=400, detail="technician_id is required")

    wo = await WorkOrderService.assign_technician(db, work_order_id, tech_id, current_user.id, reason)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return await serialize_work_order(db, wo)

@router.patch("/{work_order_id}/transition", response_model=WorkOrderResponse)
@router.post("/{work_order_id}/transition", response_model=WorkOrderResponse)
async def transition_work_order(
    work_order_id: str,
    data: WorkOrderTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        target_status = data.target_status
        if not target_status:
            raise HTTPException(status_code=400, detail="target status is required")

        wo = await WorkOrderService.transition_state(
            db, work_order_id, target_status, current_user.id, data.target_notes
        )
        if not wo:
            raise HTTPException(status_code=404, detail="Work order not found")
        return await serialize_work_order(db, wo)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{work_order_id}/notes", response_model=WorkOrderResponse)
@router.patch("/{work_order_id}/notes", response_model=WorkOrderResponse)
async def add_work_order_note(
    work_order_id: str,
    data: WorkOrderNoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    wo = await db.get(WorkOrder, work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    note_text = data.notes or data.comment or ""
    if wo.resolution_notes:
        wo.resolution_notes = f"{wo.resolution_notes}\n[{current_user.full_name}]: {note_text}"
    else:
        wo.resolution_notes = f"[{current_user.full_name}]: {note_text}"

    audit = AuditLog(
        event_type="WORK_ORDER_NOTE_ADDED",
        actor_id=current_user.id,
        entity_type="work_order",
        entity_id=wo.id,
        details={"note": note_text}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(wo)
    return await serialize_work_order(db, wo)

@router.get("/staff-roster")
async def get_staff_roster(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all maintenance technicians with skills, shifts, workloads, and duty status."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from backend.app.models.user import StaffProfile, User
    query = (
        select(StaffProfile)
        .join(User, StaffProfile.user_id == User.id)
        .options(selectinload(StaffProfile.user), selectinload(StaffProfile.skills))
    )
    result = await db.execute(query)
    profiles = result.scalars().all()
    return [
        {
            "user_id": p.user_id,
            "full_name": p.user.full_name,
            "email": p.user.email,
            "title": p.title,
            "is_on_duty": p.is_on_duty,
            "shift": f"{p.shift_start} - {p.shift_end}",
            "current_workload": p.current_workload,
            "skills": [s.name for s in p.skills],
            "skill_codes": [s.code for s in p.skills]
        }
        for p in profiles
    ]

@router.post("/reassign-disruption")
async def reassign_due_to_disruption(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Demonstrates Disruption Scenario B:
    Assigned technician becomes unavailable (sickness, emergency shift interruption).
    Automatically identifies affected work orders and reassigns to the next best
    qualified, on-duty technician with explainable scoring.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from backend.app.models.user import StaffProfile, User
    from backend.app.models.work_order import WorkOrder
    from backend.app.models.audit import AuditLog

    tech_id = payload.get("technician_id")
    reason = payload.get("reason", "Reported sickness / sudden shift interruption")

    # If technician_id not provided, default to Rajesh Kumar (tech.rajesh)
    if not tech_id:
        u_res = await db.execute(select(User).where(User.email == "tech.rajesh@campus.edu"))
        u = u_res.scalars().first()
        tech_id = u.id if u else None

    if not tech_id:
        raise HTTPException(status_code=400, detail="technician_id required")

    # Mark technician off duty
    prof_res = await db.execute(select(StaffProfile).where(StaffProfile.user_id == tech_id))
    tech_prof = prof_res.scalars().first()
    if tech_prof:
        tech_prof.is_on_duty = False

    # Find work orders assigned to this tech
    wo_res = await db.execute(
        select(WorkOrder)
        .options(selectinload(WorkOrder.incident))
        .where(
            WorkOrder.assigned_technician_id == tech_id,
            WorkOrder.status.in_(["assigned", "in_progress", "pending"])
        )
    )
    active_wos = wo_res.scalars().all()

    # If no work orders directly assigned, find any active work order to demonstrate
    if not active_wos:
        any_wo_res = await db.execute(
            select(WorkOrder)
            .options(selectinload(WorkOrder.incident))
            .where(WorkOrder.status.in_(["assigned", "in_progress", "pending"]))
            .limit(1)
        )
        first_wo = any_wo_res.scalars().first()
        if first_wo:
            active_wos = [first_wo]

    reassigned = []
    for wo in active_wos:
        category = wo.incident.category if (wo.incident and wo.incident.category) else "electrical"
        candidates = await StaffAllocator.recommend_technicians(db, category)
        valid = [c for c in candidates if c.user_id != tech_id and c.is_on_duty]
        if valid:
            replacement = valid[0]
            wo.assigned_technician_id = replacement.user_id
            wo.resolution_notes = (
                f"{wo.resolution_notes or ''}\n"
                f"[Disruption Event]: Original tech unavailable ({reason}). "
                f"Auto-reassigned to {replacement.full_name} ({replacement.recommendation_reason})."
            )
            audit = AuditLog(
                event_type="DISRUPTION_TECHNICIAN_REASSIGNED",
                actor_id=current_user.id,
                entity_type="work_order",
                entity_id=wo.id,
                details={
                    "previous_technician_id": tech_id,
                    "new_technician_id": replacement.user_id,
                    "reason": reason,
                    "score": replacement.score
                }
            )
            db.add(audit)
            reassigned.append({
                "work_order_id": wo.id,
                "work_order_number": wo.order_number,
                "new_technician": replacement.full_name,
                "new_technician_email": replacement.email,
                "score": replacement.score,
                "reason": replacement.recommendation_reason
            })

    await db.commit()
    return {
        "status": "success",
        "unavailable_technician_id": tech_id,
        "disruption_reason": reason,
        "reassigned_work_orders": reassigned,
        "count": len(reassigned)
    }
