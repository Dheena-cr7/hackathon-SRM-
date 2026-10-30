import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_auth_login_and_rbac_protection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login as Student
        resp_student = await ac.post("/api/v1/auth/login", json={
            "email": "student@campus.edu",
            "password": "student123"
        })
        assert resp_student.status_code == 200
        student_data = resp_student.json()
        student_token = student_data["access_token"]
        assert student_data["user"]["role"] == "student"

        # 2. Login as Facilities Admin
        resp_admin = await ac.post("/api/v1/auth/login", json={
            "email": "admin.facilities@campus.edu",
            "password": "admin123"
        })
        assert resp_admin.status_code == 200
        admin_data = resp_admin.json()
        admin_token = admin_data["access_token"]
        assert admin_data["user"]["role"] == "facilities_admin"

        # 3. Student attempts to access admin endpoint (RBAC check -> Expect 403)
        headers_student = {"Authorization": f"Bearer {student_token}"}
        resp_forbidden = await ac.post("/api/v1/work-orders", json={
            "incident_id": "dummy-incident",
            "priority": "high"
        }, headers=headers_student)
        assert resp_forbidden.status_code == 403
        assert "Access denied" in resp_forbidden.json()["detail"]

        # 4. Facilities Admin accessing same endpoint with invalid incident -> Gets 400/404 or DB error, NOT 403
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        resp_allowed = await ac.get("/api/v1/work-orders/technician-recommendations/electrical", headers=headers_admin)
        assert resp_allowed.status_code == 200
        candidates = resp_allowed.json()
        assert len(candidates) >= 1
        assert "Rajesh Kumar" in [c["full_name"] for c in candidates]

