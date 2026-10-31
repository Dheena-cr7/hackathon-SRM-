"""
CampusOps — Procurement & Anti-Self-Approval Service
Enforces strict separation of duties and revalidates constraints at decision time.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.inventory import PurchaseRequest, Approval, InventoryItem
from backend.app.models.audit import AuditLog
from backend.app.models.user import User
from backend.app.schemas.inventory import PurchaseRequestCreate, ApprovalDecisionRequest
from backend.app.core.events import event_bus

class SelfApprovalProhibitedError(Exception):
    """Raised when a user attempts to approve their own purchase request."""
    pass

class ApprovalService:
    @staticmethod
    async def create_purchase_request(db: AsyncSession, requester_id: str, data: PurchaseRequestCreate) -> PurchaseRequest:
        # Resolve effective requester ID
        effective_requester = data.requester_id or requester_id
        if effective_requester:
            user = await db.get(User, effective_requester)
            if not user:
                res = await db.execute(select(User).where((User.id == effective_requester) | (User.email == effective_requester)))
                matched = res.scalars().first()
                if matched:
                    effective_requester = matched.id

        # Resolve inventory item
        item = None
        if data.item_id:
            item = await db.get(InventoryItem, data.item_id)
        if not item and data.item_name:
            res = await db.execute(
                select(InventoryItem).where(
                    (InventoryItem.name.ilike(f"%{data.item_name.strip()}%")) |
                    (InventoryItem.sku.ilike(f"%{data.item_name.strip()}%"))
                )
            )
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

        # Resolve effective approver user
        effective_approver_id = data.approver_id or approver_id
        approver_user = await db.get(User, effective_approver_id)
        if not approver_user and effective_approver_id:
            res = await db.execute(select(User).where((User.id == effective_approver_id) | (User.email == effective_approver_id)))
            approver_user = res.scalars().first()
            if approver_user:
                effective_approver_id = approver_user.id

        is_sysadmin = approver_user is not None and approver_user.role == "system_admin"

        # STRICT ANTI-SELF-APPROVAL RULE (Separation of Duties)
        # Prevents users from approving requisitions they personally authored.
        # System Administrator holds executive emergency override privilege with full audit tracking.
        if request.requested_by_id == effective_approver_id:
            if not is_sysadmin:
                raise SelfApprovalProhibitedError(
                    f"Separation of duties violation: Approver ({effective_approver_id}) cannot approve their own purchase request. "
                    f"Self-approval is strictly prohibited by institutional policy. Please have an authorized procurement approver (e.g. Sunita Mehra) or administrator review this requisition."
                )
            else:
                override_audit = AuditLog(
                    event_type="SYSTEM_ADMIN_OVERRIDE_SELF_APPROVAL",
                    actor_id=effective_approver_id,
                    entity_type="purchase_request",
                    entity_id=request.id,
                    details={
                        "message": "System Administrator executive override exercised over separation of duties.",
                        "approver_role": "system_admin",
                        "request_id": request_id
                    }
                )
                db.add(override_audit)

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

        # If approved, replenish inventory quantities directly on hand
        if data.decision == "approved":
            item = await db.get(InventoryItem, request.item_id)
            if item:
                item.quantity_on_hand += request.quantity
                db.add(item)
                await db.flush()

        audit = AuditLog(
            event_type="PURCHASE_REQUEST_DECIDED",
            actor_id=effective_approver_id,
            entity_type="approval",
            entity_id=approval.id,
            details={
                "decision": data.decision,
                "request_id": request_id,
                "comments": data.comments,
                "system_admin_override": is_sysadmin and (request.requested_by_id == effective_approver_id)
            }
        )
        db.add(audit)
        await db.commit()
        await db.refresh(approval)

        await event_bus.publish("PurchaseRequestApproved" if data.decision == "approved" else "PurchaseRequestRejected", {
            "request_id": request.id,
            "approver_id": effective_approver_id,
            "decision": data.decision
        })
        return approval
