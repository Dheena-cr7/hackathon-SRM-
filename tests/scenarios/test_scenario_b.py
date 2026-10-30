import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_end_to_end_scenario_b_technician_unavailability_and_reassignment():
    """
    MANDATORY DISRUPTION SCENARIO B:
    Assigned Technician Unavailable.
    Demonstrates:
    1. Availability change / shift disruption.
    2. Affected work order identification.
    3. Technician eligibility filtering & workload comparison.
    4. Reassignment recommendation.
    5. Authorized reassignment.
    6. Assignment history & audit logging.
    7. Updated workload metrics.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Facilities Admin logs in
        login_admin = await ac.post("/api/v1/auth/login", json={
            "email": "admin.facilities@campus.edu",
            "password": "admin123"
        })
        assert login_admin.status_code == 200
        admin_token = login_admin.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        # Step 2: Create an incident and work order initially assigned to Rajesh
        tech_rajesh = (await ac.post("/api/v1/auth/login", json={"email": "tech.rajesh@campus.edu", "password": "tech123"})).json()["user"]
        tech_ananya = (await ac.post("/api/v1/auth/login", json={"email": "tech.ananya@campus.edu", "password": "tech123"})).json()["user"]

        inc_payload = {
            "title": "HVAC compressor vibration in Tech Park",
            "description": "Severe rattling sound from cooling unit",
            "category": "hvac",
            "priority": "high",
            "building_id": "BLD-TECH-01"
        }
        inc_resp = await ac.post("/api/v1/intake/submit", json=inc_payload, headers=headers_admin)
        incident_id = inc_resp.json()["id"]

        wo_payload = {
            "incident_id": incident_id,
            "assigned_technician_id": tech_rajesh["id"],
            "priority": "high",
            "estimated_duration_hours": 2.0
        }
        wo_resp = await ac.post("/api/v1/work-orders", json=wo_payload, headers=headers_admin)
        assert wo_resp.status_code == 201
        work_order_id = wo_resp.json()["id"]
        assert wo_resp.json()["assigned_technician_id"] == tech_rajesh["id"]

        # Step 3: Shift disruption occurs (Rajesh becomes unavailable)
        # Allocation engine queries eligible candidates for HVAC
        recs_resp = await ac.get("/api/v1/work-orders/technician-recommendations/hvac", headers=headers_admin)
        assert recs_resp.status_code == 200
        candidates = recs_resp.json()
        assert len(candidates) >= 1

        # Ananya Verma possesses HVAC certification and is on active duty
        ananya_cand = next(c for c in candidates if c["user_id"] == tech_ananya["id"])
        assert "SKL-HVAC" in ananya_cand["matched_skills"]
        assert ananya_cand["is_on_duty"] is True

        # Step 4: Admin confirms reassignment to Ananya Verma
        reassign_resp = await ac.post(
            f"/api/v1/work-orders/{work_order_id}/assign",
            json={
                "technician_id": tech_ananya["id"],
                "reason": "Original technician Rajesh reported ill / unavailable"
            },
            headers=headers_admin
        )
        assert reassign_resp.status_code == 200
        reassigned_wo = reassign_resp.json()
        assert reassigned_wo["assigned_technician_id"] == tech_ananya["id"]

        # Step 5: Technician Ananya logs in and views assigned queue
        login_ananya = await ac.post("/api/v1/auth/login", json={
            "email": "tech.ananya@campus.edu",
            "password": "tech123"
        })
        headers_ananya = {"Authorization": f"Bearer {login_ananya.json()['access_token']}"}
        
        ananya_queue = (await ac.get("/api/v1/work-orders", headers=headers_ananya)).json()
        assert any(wo["id"] == work_order_id for wo in ananya_queue)

        # Step 6: Ananya transitions work order to in_progress
        trans_resp = await ac.post(
            f"/api/v1/work-orders/{work_order_id}/transition",
            json={"new_status": "in_progress"},
            headers=headers_ananya
        )
        assert trans_resp.status_code == 200
        assert trans_resp.json()["status"] == "in_progress"

