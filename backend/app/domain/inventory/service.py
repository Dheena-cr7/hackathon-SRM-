"""
CampusOps — Inventory & Concurrency-Safe Parts Reservation Service
Prevents negative inventory and manages stock movement.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.models.inventory import InventoryItem, PartsReservation
from backend.app.models.audit import AuditLog
from backend.app.schemas.inventory import PartsReservationRequest, InventoryItemResponse
from backend.app.core.events import event_bus

class InsufficientStockError(Exception):
    """Raised when attempting to reserve more parts than available stock."""
    pass

class InventoryService:
    @staticmethod
    async def list_items(db: AsyncSession) -> List[InventoryItemResponse]:
        result = await db.execute(select(InventoryItem).order_by(InventoryItem.name.asc()))
        items = result.scalars().all()
        return [
            InventoryItemResponse(
                id=item.id,
                sku=item.sku,
                name=item.name,
                category=item.category,
                quantity_on_hand=item.quantity_on_hand,
                quantity_reserved=item.quantity_reserved,
                available_stock=item.quantity_on_hand - item.quantity_reserved,
                reorder_threshold=item.reorder_threshold,
                unit_cost=item.unit_cost
            )
            for item in items
        ]

    @staticmethod
    async def reserve_parts(db: AsyncSession, actor_id: str, data: PartsReservationRequest) -> PartsReservation:
        # Atomic reservation query guaranteeing non-negative available stock
        stmt = (
            update(InventoryItem)
            .where(
                InventoryItem.id == data.item_id,
                (InventoryItem.quantity_on_hand - InventoryItem.quantity_reserved) >= data.quantity
            )
            .values(quantity_reserved=InventoryItem.quantity_reserved + data.quantity)
        )
        res = await db.execute(stmt)
        if res.rowcount == 0:
            item = await db.get(InventoryItem, data.item_id)
            available = (item.quantity_on_hand - item.quantity_reserved) if item else 0
            raise InsufficientStockError(
                f"Insufficient stock for '{item.name if item else data.item_id}'. "
                f"Requested: {data.quantity}, Available: {available}"
            )

        reservation = PartsReservation(
            work_order_id=data.work_order_id,
            item_id=data.item_id,
            quantity=data.quantity,
            status="reserved"
        )
        db.add(reservation)

        audit = AuditLog(
            event_type="PARTS_RESERVED",
            actor_id=actor_id,
            entity_type="inventory",
            entity_id=data.item_id,
            details={"work_order_id": data.work_order_id, "quantity": data.quantity}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(reservation)

        await event_bus.publish("PartsReserved", {
            "work_order_id": data.work_order_id,
            "item_id": data.item_id,
            "quantity": data.quantity
        })
        return reservation

