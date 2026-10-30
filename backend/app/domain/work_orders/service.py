"""
CampusOps — Work Order Management Service
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.work_order import WorkOrder
from backend.app.models.user import StaffProfile
from backend.app.models.audit import AuditLog
from backend.app.schemas.work_order import WorkOrderCreate
from backend.app.domain.work_orders.state_machine import validate_transition
from backend.app.core.events import event_bus

class WorkOrderService:
    @staticmethod
    async def create_work_order(db: AsyncSession, data: WorkOrderCreate, actor_id: str) -> WorkOrder:
        count_query = select(func.count(WorkOrder.id))
        count = (await db.execute(count_query)).scalar() or 0
        order_number = f"WO-2026-{count + 1:04d}"

        initial_status = "assigned" if data.assigned_technician_id else "pending"
        
        work_order = WorkOrder(
            order_number=order_number,
            incident_id=data.incident_id,
            assigned_technician_id=data.assigned_technician_id,
            status=initial_status,
            priority=data.priority,
            estimated_duration_hours=data.estimated_duration_hours
        )
        db.add(work_order)
        await db.flush()

        if data.assigned_technician_id:
            tech_profile = await db.get(StaffProfile, data.assigned_technician_id)
            if tech_profile:
                tech_profile.current_workload += 1

        audit = AuditLog(
            event_type="WORK_ORDER_CREATED",
            actor_id=actor_id,
            entity_type="work_order",
            entity_id=work_order.id,
            details={"order_number": order_number, "assigned_to": data.assigned_technician_id}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(work_order)

        await event_bus.publish("WorkOrderCreated", {
            "work_order_id": work_order.id,
            "order_number": work_order.order_number,
            "incident_id": work_order.incident_id,
            "assigned_technician_id": work_order.assigned_technician_id
        })
        return work_order

    @staticmethod
    async def assign_technician(db: AsyncSession, work_order_id: str, new_technician_id: str, actor_id: str, reason: str = "Admin reassignment") -> Optional[WorkOrder]:
        work_order = await db.get(WorkOrder, work_order_id)
        if not work_order:
            return None

        old_tech_id = work_order.assigned_technician_id
        
        # Adjust workload
        if old_tech_id and old_tech_id != new_technician_id:
            old_profile = await db.get(StaffProfile, old_tech_id)
            if old_profile and old_profile.current_workload > 0:
                old_profile.current_workload -= 1

        new_profile = await db.get(StaffProfile, new_technician_id)
        if new_profile:
            new_profile.current_workload += 1

        work_order.assigned_technician_id = new_technician_id
        if work_order.status == "pending":
            work_order.status = "assigned"

        audit = AuditLog(
            event_type="TECHNICIAN_REASSIGNED",
            actor_id=actor_id,
            entity_type="work_order",
            entity_id=work_order.id,
            details={"old_tech": old_tech_id, "new_tech": new_technician_id, "reason": reason}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(work_order)

        await event_bus.publish("TechnicianAssigned", {
            "work_order_id": work_order.id,
            "technician_id": new_technician_id,
            "reason": reason
        })
        return work_order

    @staticmethod
    async def transition_state(db: AsyncSession, work_order_id: str, target_status: str, actor_id: str, notes: Optional[str] = None) -> Optional[WorkOrder]:
        work_order = await db.get(WorkOrder, work_order_id)
        if not work_order:
            return None

        validate_transition(work_order.status, target_status)
        old_status = work_order.status
        work_order.status = target_status
        if notes:
            work_order.resolution_notes = notes

        # If completed, reduce technician workload
        if target_status == "completed" and work_order.assigned_technician_id:
            tech = await db.get(StaffProfile, work_order.assigned_technician_id)
            if tech and tech.current_workload > 0:
                tech.current_workload -= 1

        audit = AuditLog(
            event_type="WORK_ORDER_STATUS_CHANGED",
            actor_id=actor_id,
            entity_type="work_order",
            entity_id=work_order.id,
            details={"old_status": old_status, "new_status": target_status, "notes": notes}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(work_order)

        await event_bus.publish("WorkOrderStateChanged", {
            "work_order_id": work_order.id,
            "old_status": old_status,
            "new_status": target_status
        })
        return work_order
