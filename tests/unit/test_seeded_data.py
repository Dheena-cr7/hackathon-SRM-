import pytest
from sqlalchemy import select
from backend.app.core.database import AsyncSessionLocal
from backend.app.models import User, Building, Room, Booking, InventoryItem

@pytest.mark.asyncio
async def test_seeded_data_exists():
    async with AsyncSessionLocal() as session:
        # Check users
        users = (await session.execute(select(User))).scalars().all()
        assert len(users) >= 8
        roles = {u.role for u in users}
        assert "student" in roles
        assert "faculty" in roles
        assert "technician" in roles
        assert "facilities_admin" in roles
        assert "procurement_approver" in roles

        # Check Tech Park & Room B204
        building = await session.get(Building, "BLD-TECH-01")
        assert building is not None
        assert building.name == "Tech Park (Main Academic Block)"

        room = await session.get(Room, "RM-TP-204")
        assert room is not None
        assert room.room_number == "B204"

        # Check Exam Booking
        bookings = (await session.execute(select(Booking).where(Booking.room_id == "RM-TP-204"))).scalars().all()
        assert len(bookings) >= 1
        assert "Midterm Examination" in bookings[0].title

        # Check Inventory Breakers
        item = (await session.execute(select(InventoryItem).where(InventoryItem.sku == "SKU-BRK-30A"))).scalar_one_or_none()
        assert item is not None
        assert item.quantity_on_hand == 15

