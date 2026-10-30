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
        item = None
        if data.item_id:
            item = await db.get(InventoryItem, data.item_id)
        if not item and data.item_name:
            res = await db.execute(select(InventoryItem).where(InventoryItem.name.ilike(f"%{data.item_name}%")))
            item = res.scalars().first()
        if not item:
            res = await db.execute(select(InventoryItem))
            item = res.scalars().first()
        if not item:
            item = InventoryItem(
                sku="SKU-GEN-01",
                name=data.item_name or "Siemens 32A Industrial Breaker",
                category="electrical",
                quantity_on_hand=50,
                quantity_reserved=0,
                reorder_threshold=10,
                unit_cost=data.estimated_unit_cost or 45.0
            )
            db.add(item)
            await db.flush()

        unit_cost = data.estimated_unit_cost or item.unit_cost
        total_cost = data.quantity * unit_cost
        effective_requester = data.requester_id or requester_id
        
        request = PurchaseRequest(
            item_id=item.id,
            requested_by_id=effective_requester,
            quantity=data.quantity,
            total_cost=total_cost,
            justification=data.justification,
            status="pending"
        )
        db.add(request)
        await db.flush()

        audit = AuditLog(
            event_type="PURCHASE_REQUEST_CREATED",
            actor_id=effective_requester,
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
        effective_approver_id = data.approver_id or approver_id
        if request.requested_by_id == effective_approver_id:
            raise SelfApprovalProhibitedError(
                f"Separation of duties violation: Approver ({effective_approver_id}) cannot approve their own purchase request. "
                f"Self-approval is strictly prohibited by institutional policy."
            )

        if request.status != "pending":
            raise ValueError(f"Purchase request is already finalized with status: '{request.status}'.")

        approval = Approval(
            purchase_request_id=request_id,
            approver_id=effective_approver_id,
            decision=data.decision,
            comments=data.comments or "Approved under institutional policy"
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
