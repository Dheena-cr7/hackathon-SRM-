import pytest
from datetime import datetime, timezone, timedelta
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_double_booking_prevention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login as faculty
        resp = await ac.post("/api/v1/auth/login", json={
            "email": "faculty@campus.edu",
            "password": "faculty123"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Select a future slot for Tech Park Room 101
        now = datetime.now(timezone.utc)
        slot_start = now + timedelta(days=2, hours=10)
        slot_end = slot_start + timedelta(hours=1, minutes=30)

        payload1 = {
            "room_id": "RM-TP-101",
            "title": "Machine Learning Lecture",
            "activity_type": "lecture",
            "start_time": slot_start.isoformat(),
            "end_time": slot_end.isoformat(),
            "attendee_count": 45
        }

        # 1. First reservation request -> Must succeed with 201 Created
        resp1 = await ac.post("/api/v1/bookings", json=payload1, headers=headers)
        assert resp1.status_code == 201
        booking_data = resp1.json()
        assert booking_data["status"] == "confirmed"

        # 2. Second overlapping reservation request for same room and time -> Must fail with 409 Conflict
        payload2 = {
            "room_id": "RM-TP-101",
            "title": "Conflicting Robotics Workshop",
            "activity_type": "seminar",
            "start_time": (slot_start + timedelta(minutes=15)).isoformat(),  # Overlaps!
            "end_time": (slot_end + timedelta(minutes=15)).isoformat(),
            "attendee_count": 30
        }
        resp2 = await ac.post("/api/v1/bookings", json=payload2, headers=headers)
        assert resp2.status_code == 409
        assert "Double-booking conflict" in resp2.json()["detail"]
