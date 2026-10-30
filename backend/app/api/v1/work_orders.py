"""
CampusOps — Work Orders & Allocation API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.work_order import (
    WorkOrderCreate, WorkOrderResponse, WorkOrderTransitionRequest, TechnicianCandidate
)
from backend.app.domain.work_orders.service import WorkOrderService
from backend.app.domain.work_orders.state_machine import InvalidStateTransitionError
from backend.app.domain.staff.allocator import StaffAllocator
from backend.app.api.deps import get_current_user, require_roles
from backend.app.models.user import User

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.get("", response_model=List[WorkOrderResponse])
async def list_work_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from backend.app.models.work_order import WorkOrder
    query = select(WorkOrder).order_by(WorkOrder.created_at.desc())
    if current_user.role == "technician":
        query = query.where(WorkOrder.assigned_technician_id == current_user.id)
    res = await db.execute(query)
    return [WorkOrderResponse.model_validate(wo) for wo in res.scalars().all()]

@router.post("", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    data: WorkOrderCreate,
    current_user: User = Depends(require_roles("facilities_admin", "dept_manager")),
    db: AsyncSession = Depends(get_db)
):
    wo = await WorkOrderService.create_work_order(db, data, current_user.id)
    return WorkOrderResponse.model_validate(wo)

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
    return WorkOrderResponse.model_validate(wo)

@router.patch("/{work_order_id}/transition", response_model=WorkOrderResponse)
@router.post("/{work_order_id}/transition", response_model=WorkOrderResponse)
async def transition_work_order(
    work_order_id: str,
    data: WorkOrderTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        wo = await WorkOrderService.transition_state(
            db, work_order_id, data.new_status, current_user.id, data.resolution_notes
        )
        if not wo:
            raise HTTPException(status_code=404, detail="Work order not found")
        return WorkOrderResponse.model_validate(wo)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
