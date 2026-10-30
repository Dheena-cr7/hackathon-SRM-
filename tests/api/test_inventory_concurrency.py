import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_inventory_negative_stock_prevention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login as technician
        resp = await ac.post("/api/v1/auth/login", json={
            "email": "tech.rajesh@campus.edu",
            "password": "tech123"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch available inventory items
        items_resp = await ac.get("/api/v1/inventory/items", headers=headers)
        assert items_resp.status_code == 200
        items = items_resp.json()
        assert len(items) >= 1
        
        # Select circuit breaker item (15 on hand)
        breaker = next(item for item in items if item["sku"] == "SKU-BRK-30A")
        initial_available = breaker["available_stock"]

        # 2. Attempt to reserve more parts than available (e.g. initial_available + 50)
        excess_qty = initial_available + 50
        reserve_payload = {
            "work_order_id": "dummy-wo-123",
            "item_id": breaker["id"],
            "quantity": excess_qty
        }
        res_fail = await ac.post("/api/v1/inventory/reserve", json=reserve_payload, headers=headers)
        assert res_fail.status_code == 400
        assert "Insufficient stock" in res_fail.json()["detail"]

        # 3. Verify stock did not drop below 0 or change
        items_resp_after = await ac.get("/api/v1/inventory/items", headers=headers)
        breaker_after = next(item for item in items_resp_after.json() if item["sku"] == "SKU-BRK-30A")
        assert breaker_after["available_stock"] == initial_available

