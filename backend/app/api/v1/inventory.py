"""
CampusOps — Inventory, Parts & Anti-Self-Approval Procurement Endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.inventory import (
    InventoryItemResponse, PartsReservationRequest, PurchaseRequestCreate,
    PurchaseRequestResponse, ApprovalDecisionRequest
)
from backend.app.domain.inventory.service import InventoryService, InsufficientStockError
from backend.app.domain.approvals.service import ApprovalService, SelfApprovalProhibitedError
from backend.app.api.deps import get_current_user, require_roles
from backend.app.models.user import User

router = APIRouter(prefix="/inventory", tags=["Inventory & Procurement"])

@router.get("/items", response_model=List[InventoryItemResponse])
async def list_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await InventoryService.list_items(db)

@router.post("/reserve", status_code=status.HTTP_201_CREATED)
async def reserve_parts(
    data: PartsReservationRequest,
    current_user: User = Depends(require_roles("technician", "facilities_admin")),
    db: AsyncSession = Depends(get_db)
):
    try:
        reservation = await InventoryService.reserve_parts(db, current_user.id, data)
        return {
            "success": True,
            "reservation_id": reservation.id,
            "work_order_id": reservation.work_order_id,
            "status": reservation.status
        }
    except InsufficientStockError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/purchase-requests", response_model=PurchaseRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_request(
    data: PurchaseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        request = await ApprovalService.create_purchase_request(db, current_user.id, data)
        return PurchaseRequestResponse.model_validate(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/purchase-requests/{request_id}/approve")
async def decide_purchase_approval(
    request_id: str,
    data: ApprovalDecisionRequest,
    current_user: User = Depends(require_roles("procurement_approver")),
    db: AsyncSession = Depends(get_db)
):
    try:
        approval = await ApprovalService.decide_approval(db, current_user.id, request_id, data)
        return {
            "success": True,
            "approval_id": approval.id,
            "decision": approval.decision,
            "comments": approval.comments
        }
    except SelfApprovalProhibitedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
