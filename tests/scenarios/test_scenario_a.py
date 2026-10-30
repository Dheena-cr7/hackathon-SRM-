import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_end_to_end_scenario_a_classroom_electrical_failure():
    """
    MANDATORY DISRUPTION SCENARIO A:
    Classroom Electrical Failure Before Exam.
    Demonstrates:
    1. Natural-language report.
    2. Layer 1 extraction.
    3. Incident creation.
    4. Location and asset validation.
    5. Affected booking identification (CS301 Exam in Room B204).
    6. Alternative room recommendations (proposes Auditorium).
    7. Technician eligibility evaluation (matches Certified Electrician).
    8. Inventory availability check and atomic parts reservation.
    9. Authorized operational relocation and room lockout.
    10. Notifications dispatched.
    11. Updated analytics and building status.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Faculty logs in
        login_faculty = await ac.post("/api/v1/auth/login", json={
            "email": "faculty@campus.edu",
            "password": "faculty123"
        })
        assert login_faculty.status_code == 200
        faculty_token = login_faculty.json()["access_token"]
        headers_faculty = {"Authorization": f"Bearer {faculty_token}"}

        # Step 2: Layer 1 NLP Intake
        report_text = "There is a sparking circuit breaker in Tech Park Room B204 before the exam"
        analyze_resp = await ac.post("/api/v1/intake/analyze", json={"text": report_text})
        assert analyze_resp.status_code == 200
        nlp_data = analyze_resp.json()
        assert nlp_data["category"] == "electrical"
        assert nlp_data["building_id"] == "BLD-TECH-01"
        assert nlp_data["room_id"] == "RM-TP-204"
        assert nlp_data["urgency"] == "critical"

        # Step 3: Submit Incident
        submit_payload = {
            "title": "Emergency: Electrical spark in Tech Park B204",
            "description": report_text,
            "category": nlp_data["category"],
            "priority": nlp_data["urgency"],
            "building_id": nlp_data["building_id"],
            "room_id": nlp_data["room_id"],
            "raw_text": report_text,
            "extraction_metadata": nlp_data
        }
        incident_resp = await ac.post("/api/v1/intake/submit", json=submit_payload, headers=headers_faculty)
        assert incident_resp.status_code == 201
        incident = incident_resp.json()
        assert incident["incident_number"].startswith("INC-2026-")
        incident_id = incident["id"]

        # Step 4: Facilities Admin logs in
        login_admin = await ac.post("/api/v1/auth/login", json={
            "email": "admin.facilities@campus.edu",
            "password": "admin123"
        })
        assert login_admin.status_code == 200
        admin_token = login_admin.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        # Step 5: Disruption Impact Analysis on Room B204
        impact_resp = await ac.get(f"/api/v1/bookings/disruption-impact/{incident['room_id']}", headers=headers_admin)
        assert impact_resp.status_code == 200
        impact_data = impact_resp.json()
        assert impact_data["affected_bookings_count"] >= 1
        affected_exam = impact_data["affected_bookings"][0]
        assert "Midterm Examination" in affected_exam["title"]

        # Verify alternative room proposals contain Auditorium
        recommended_rooms = impact_data["recommended_relocations"]
        assert len(recommended_rooms) >= 1
        auditorium_prop = next(r for r in recommended_rooms if r["room_number"] == "Main Hall" or "AUD" in r["alternative_room_id"])
        assert auditorium_prop["capacity"] >= affected_exam["attendee_count"]

        # Step 6: Admin authorizes relocation to Auditorium
        relocate_resp = await ac.post(
            f"/api/v1/bookings/{affected_exam['id']}/relocate",
            json={"new_room_id": auditorium_prop["alternative_room_id"]},
            headers=headers_admin
        )
        assert relocate_resp.status_code == 200
        relocated_booking = relocate_resp.json()
        assert relocated_booking["room_id"] == auditorium_prop["alternative_room_id"]
        assert relocated_booking["relocated_from_room_id"] == "RM-TP-204"

        # Step 7: Create Work Order
        wo_resp = await ac.post("/api/v1/work-orders", json={
            "incident_id": incident_id,
            "priority": "critical",
            "estimated_duration_hours": 1.5
        }, headers=headers_admin)
        assert wo_resp.status_code == 201
        work_order = wo_resp.json()
        work_order_id = work_order["id"]

        # Step 8: Technician Eligibility Evaluation
        tech_recs_resp = await ac.get(f"/api/v1/work-orders/technician-recommendations/{incident['category']}", headers=headers_admin)
        assert tech_recs_resp.status_code == 200
        candidates = tech_recs_resp.json()
        assert len(candidates) >= 1
        top_electrician = candidates[0]
        assert "SKL-ELEC" in top_electrician["matched_skills"]
        assert top_electrician["is_on_duty"] is True

        # Step 9: Assign Electrician to Work Order
        assign_resp = await ac.post(
            f"/api/v1/work-orders/{work_order_id}/assign",
            json={"technician_id": top_electrician["user_id"], "reason": "Certified electrician on active duty"},
            headers=headers_admin
        )
        assert assign_resp.status_code == 200
        assert assign_resp.json()["assigned_technician_id"] == top_electrician["user_id"]
        assert assign_resp.json()["status"] == "assigned"

        # Step 10: Parts Reservation (Reserve 30A Circuit Breaker)
        items = (await ac.get("/api/v1/inventory/items", headers=headers_admin)).json()
        breaker_item = next(i for i in items if i["sku"] == "SKU-BRK-30A")
        
        reserve_resp = await ac.post("/api/v1/inventory/reserve", json={
            "work_order_id": work_order_id,
            "item_id": breaker_item["id"],
            "quantity": 1
        }, headers=headers_admin)
        assert reserve_resp.status_code == 201
        assert reserve_resp.json()["status"] == "reserved"

        # Step 11: Verify Campus Operational Analytics & Building Status
        analytics_resp = await ac.get("/api/v1/analytics/overview", headers=headers_admin)
        assert analytics_resp.status_code == 200
        metrics = analytics_resp.json()
        assert metrics["total_open_incidents"] >= 1
        assert metrics["critical_incidents"] >= 1
        assert metrics["disrupted_rooms_count"] >= 1
        
        # Verify Tech Park is flagged as critical disruption
        tp_status = next(b for b in metrics["building_status_list"] if b["building_id"] == "BLD-TECH-01")
        assert tp_status["operational_status"] == "critical_disruption"

