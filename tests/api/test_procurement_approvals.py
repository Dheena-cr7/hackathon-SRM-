import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_anti_self_approval_procurement_rule():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login as Procurement Approver (Sunita Mehra)
        resp_approver = await ac.post("/api/v1/auth/login", json={
            "email": "approver.finance@campus.edu",
            "password": "approver123"
        })
        approver_token = resp_approver.json()["access_token"]
        headers_approver = {"Authorization": f"Bearer {approver_token}"}

        # 2. Approver creates a purchase request
        items = (await ac.get("/api/v1/inventory/items", headers=headers_approver)).json()
        item_id = items[0]["id"]
        
        pr_payload = {
            "item_id": item_id,
            "quantity": 10,
            "justification": "Emergency replacement stock"
        }
        resp_pr = await ac.post("/api/v1/inventory/purchase-requests", json=pr_payload, headers=headers_approver)
        assert resp_pr.status_code == 201
        request_id = resp_pr.json()["id"]

        # 3. Approver attempts to approve their OWN request -> Must be rejected with 403 Forbidden!
        decision_payload = {
            "decision": "approved",
            "comments": "Self-approving my own request"
        }
        resp_self_approval = await ac.post(
            f"/api/v1/inventory/purchase-requests/{request_id}/approve",
            json=decision_payload,
            headers=headers_approver
        )
        assert resp_self_approval.status_code == 403
        assert "Self-approval is strictly prohibited" in resp_self_approval.json()["detail"]
