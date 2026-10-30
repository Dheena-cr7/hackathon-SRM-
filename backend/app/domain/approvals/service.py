"""
CampusOps — Procurement & Anti-Self-Approval Service
Enforces strict separation of duties and revalidates constraints at decision time.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.inventory import PurchaseRequest, Approval, InventoryItem
from backend.app.models.audit import AuditLog
from backend.app.schemas.inventory import PurchaseRequestCreate, ApprovalDecisionRequest
from backend.app.core.events import event_bus

class SelfApprovalProhibitedError(Exception):
    """Raised when a user attempts to approve their own purchase request."""
    pass

class ApprovalService:
    @staticmethod
    async def create_purchase_request(db: AsyncSession, requester_id: str, data: PurchaseRequestCreate) -> PurchaseRequest:
        item = await db.get(InventoryItem, data.item_id)
        if not item:
            raise ValueError(f"Inventory item '{data.item_id}' not found.")

        total_cost = data.quantity * item.unit_cost
        
        request = PurchaseRequest(
            item_id=data.item_id,
            requested_by_id=requester_id,
            quantity=data.quantity,
            total_cost=total_cost,
            justification=data.justification,
            status="pending"
        )
        db.add(request)
        await db.flush()

        audit = AuditLog(
            event_type="PURCHASE_REQUEST_CREATED",
            actor_id=requester_id,
            entity_type="purchase_request",
            entity_id=request.id,
            details={"item_sku": item.sku, "qty": data.quantity, "total_cost": total_cost}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(request)

        await event_bus.publish("PurchaseRequestCreated", {
            "request_id": request.id,
            "item_id": request.item_id,
            "total_cost": total_cost
        })
        return request

    @staticmethod
    async def decide_approval(db: AsyncSession, approver_id: str, request_id: str, data: ApprovalDecisionRequest) -> Approval:
        request = await db.get(PurchaseRequest, request_id)
        if not request:
            raise ValueError(f"Purchase request '{request_id}' not found.")

        # STRICT ANTI-SELF-APPROVAL RULE
        if request.requested_by_id == approver_id:
            raise SelfApprovalProhibitedError(
                f"Separation of duties violation: Approver ({approver_id}) cannot approve their own purchase request. "
                f"Self-approval is strictly prohibited by institutional policy."
            )

        if request.status != "pending":
            raise ValueError(f"Purchase request is already finalized with status: '{request.status}'.")

        approval = Approval(
            purchase_request_id=request_id,
            approver_id=approver_id,
            decision=data.decision,
            comments=data.comments
        )
        db.add(approval)
        await db.flush()

        # Update purchase request status
        request.status = data.decision

        # If approved, replenish inventory quantities
        if data.decision == "approved":
            item = await db.get(InventoryItem, request.item_id)
            if item:
                item.quantity_on_hand += request.quantity

        audit = AuditLog(
            event_type="PURCHASE_REQUEST_DECIDED",
            actor_id=approver_id,
            entity_type="approval",
            entity_id=approval.id,
            details={"decision": data.decision, "request_id": request_id, "comments": data.comments}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(approval)

        await event_bus.publish("PurchaseRequestApproved" if data.decision == "approved" else "PurchaseRequestRejected", {
            "request_id": request.id,
            "approver_id": approver_id,
            "decision": data.decision
        })
        return approval
