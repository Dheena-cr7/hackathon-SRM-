"""
CampusOps — Inventory & Concurrency-Safe Parts Reservation Service
Prevents negative inventory and manages stock movement.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.models.inventory import InventoryItem, PartsReservation
from backend.app.models.audit import AuditLog
from backend.app.schemas.inventory import PartsReservationRequest, InventoryItemResponse, InventoryItemCreate
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
    async def create_item(db: AsyncSession, data: InventoryItemCreate, actor_id: str) -> InventoryItemResponse:
        import uuid
        sku = data.sku.strip() if data.sku and data.sku.strip() else f"SKU-{data.category[:3].upper()}-{uuid.uuid4().hex[:4].upper()}"
        item = InventoryItem(
            sku=sku,
            name=data.name.strip(),
            category=data.category,
            quantity_on_hand=data.quantity_on_hand,
            quantity_reserved=data.quantity_reserved,
            reorder_threshold=data.reorder_threshold,
            unit_cost=data.unit_cost
        )
        db.add(item)
        await db.flush()

        audit = AuditLog(
            event_type="INVENTORY_ITEM_CREATED",
            actor_id=actor_id,
            entity_type="inventory_item",
            entity_id=item.id,
            details={"sku": item.sku, "name": item.name, "initial_quantity": item.quantity_on_hand}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(item)

        await event_bus.publish("InventoryItemCreated", {
            "item_id": item.id,
            "sku": item.sku,
            "name": item.name,
            "quantity_on_hand": item.quantity_on_hand
        })

        return InventoryItemResponse(
            id=item.id,
            sku=item.sku,
            name=item.name,
            category=item.category,
            quantity_on_hand=item.quantity_on_hand,
            quantity_reserved=item.quantity_reserved,
            available_stock=item.quantity_on_hand - item.quantity_reserved,
            reorder_threshold=item.reorder_threshold,
            unit_cost=item.unit_cost,
            location=data.location or "Central Depot"
        )

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

