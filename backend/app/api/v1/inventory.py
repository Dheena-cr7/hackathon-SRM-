"""
CampusOps — Inventory, Parts & Anti-Self-Approval Procurement Endpoints
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.inventory import InventoryItem, PurchaseRequest
from backend.app.schemas.inventory import (
    InventoryItemResponse, PartsReservationRequest, PurchaseRequestCreate,
    PurchaseRequestResponse, ApprovalDecisionRequest
)
from backend.app.domain.inventory.service import InventoryService, InsufficientStockError
from backend.app.domain.approvals.service import ApprovalService, SelfApprovalProhibitedError
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/inventory", tags=["Inventory & Procurement"])

@router.get("", response_model=List[InventoryItemResponse])
@router.get("/", response_model=List[InventoryItemResponse])
@router.get("/items", response_model=List[InventoryItemResponse])
async def list_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve catalog of spare parts with live quantities on hand and work-order reservations."""
    return await InventoryService.list_items(db)

@router.get("/purchases")
@router.get("/purchase-requests")
async def list_purchases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of purchase requisitions for procurement approval review."""
    stmt = select(PurchaseRequest).order_by(PurchaseRequest.created_at.desc())
    result = await db.execute(stmt)
    prs = result.scalars().all()
    
    response = []
    for pr in prs:
        item = await db.get(InventoryItem, pr.item_id)
        requester = await db.get(User, pr.requested_by_id)
        unit_cost = (pr.total_cost / pr.quantity) if pr.quantity else (item.unit_cost if item else 45.0)
        req_name = getattr(requester, "full_name", None) or getattr(requester, "email", "Operations Staff")
        response.append({
            "id": pr.id,
            "pr_number": f"PR-{pr.id[:6].upper()}",
            "item_name": item.name if item else "General Component",
            "quantity": pr.quantity,
            "estimated_unit_cost": round(unit_cost, 2),
            "vendor": "Schneider / Siemens Direct",
            "justification": pr.justification,
            "status": pr.status,
            "requester_id": pr.requested_by_id,
            "requester_name": req_name,
            "created_at": pr.created_at.isoformat() if pr.created_at else None
        })
    return response

@router.post("/reserve", status_code=status.HTTP_201_CREATED)
async def reserve_parts(
    data: PartsReservationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Atomically reserve parts; fails if reservation causes available stock to drop below 0."""
    try:
        actor_id = data.reserved_by or current_user.id
        reservation = await InventoryService.reserve_parts(db, actor_id, data)
        item = await db.get(InventoryItem, data.item_id)
        new_avail = (item.quantity_on_hand - item.quantity_reserved) if item else 0
        return {
            "success": True,
            "reservation_id": reservation.id,
            "work_order_id": reservation.work_order_id,
            "quantity_reserved": data.quantity,
            "new_available_quantity": new_avail,
            "status": reservation.status
        }
    except InsufficientStockError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/purchases", status_code=status.HTTP_201_CREATED)
@router.post("/purchase-requests", status_code=status.HTTP_201_CREATED)
async def create_purchase_request(
    data: PurchaseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new institutional purchase requisition."""
    try:
        requester_id = data.requester_id or current_user.id
        request = await ApprovalService.create_purchase_request(db, requester_id, data)
        item = await db.get(InventoryItem, request.item_id)
        unit_cost = data.estimated_unit_cost or (item.unit_cost if item else 45.0)
        user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "Operations Staff")
        return {
            "id": request.id,
            "pr_number": f"PR-{request.id[:6].upper()}",
            "item_name": item.name if item else (data.item_name or "General Component"),
            "quantity": request.quantity,
            "estimated_unit_cost": unit_cost,
            "vendor": data.vendor or "Schneider / Siemens Direct",
            "justification": request.justification,
            "status": request.status,
            "requester_id": request.requested_by_id,
            "requester_name": user_name
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/purchases/{request_id}/approve")
@router.post("/purchase-requests/{request_id}/approve")
async def decide_purchase_approval(
    request_id: str,
    data: ApprovalDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Decide approval on a purchase request.
    Strictly prohibits self-approval: requester cannot approve their own requisition.
    """
    try:
        approver_id = data.approver_id or current_user.id
        approval = await ApprovalService.decide_approval(db, approver_id, request_id, data)
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
