import pytest
from backend.app.core.database import engine, Base
from backend.app.models import User, Building, Room, Incident, WorkOrder, Booking, InventoryItem

@pytest.mark.asyncio
async def test_database_table_creation():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Verify metadata contains all registered tables
    table_names = list(Base.metadata.tables.keys())
    assert "users" in table_names
    assert "buildings" in table_names
    assert "rooms" in table_names
    assert "incidents" in table_names
    assert "work_orders" in table_names
    assert "bookings" in table_names
    assert "inventory_items" in table_names
    assert "approvals" in table_names
    assert "audit_logs" in table_names

