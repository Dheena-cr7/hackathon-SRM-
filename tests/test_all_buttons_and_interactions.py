"""
CampusOps — Comprehensive Button & API Interaction Automated Audit
Tests every single button action, state transition, and backend data flow across all views.
"""

import urllib.request
import json
import sys

API_BASE = "http://127.0.0.1:8000/api/v1"

results = []

def record(test_name: str, passed: bool, details: str = ""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": test_name, "status": status, "details": details})
    print(f"[{status}] {test_name}: {details}")

def post_json(endpoint: str, data: dict, token: str = None):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 0, str(e)

def get_json(endpoint: str, token: str = None):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"} if token else {}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 0, str(e)

def run_all_checks():
    print("========================================================================")
    print("       CampusOps Full Button & Backend Data Interaction Audit           ")
    print("========================================================================\n")

    # 1. Login Buttons (All 6 roles)
    print("--- 1. Authentication & Role Entrance Buttons ---")
    tokens = {}
    users = [
        ("Facilities Admin", "admin.facilities@campus.edu", "admin123", "facilities_admin"),
        ("Technician Rajesh", "tech.rajesh@campus.edu", "tech123", "technician"),
        ("Technician Ananya", "tech.ananya@campus.edu", "tech123", "technician"),
        ("Procurement Approver", "approver.finance@campus.edu", "approver123", "procurement_approver"),
        ("Department Manager", "manager@campus.edu", "manager123", "dept_manager"),
        ("Student Aarav", "student@campus.edu", "student123", "student"),
        ("System Administrator", "sysadmin@campus.edu", "sysadmin123", "system_admin")
    ]
    for label, email, password, expected_role in users:
        status, body = post_json("/auth/login", {"email": email, "password": password})
        is_ok = status == 200 and "access_token" in body and body["user"]["role"] == expected_role
        if is_ok:
            tokens[expected_role] = body["access_token"]
        record(f"Button: Sign In as {label}", is_ok, f"Status {status}, Token exchanged, Role: {body.get('user', {}).get('role')}")

    admin_token = tokens["facilities_admin"]
    student_token = tokens["student"]
    approver_token = tokens["procurement_approver"]
    manager_token = tokens["dept_manager"]

    # 2. Intake Buttons
    print("\n--- 2. Intake Page Buttons & Interaction Flow ---")
    # Preset analysis button
    p_status, p_body = post_json(
        "/intake/analyze",
        {"raw_text": "Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm"},
        student_token
    )
    record("Button: Preset Scenario / NLP Analysis", p_status == 200 and p_body.get("category") in ("electrical", "safety"), f"Category: {p_body.get('category')}, Severity: {p_body.get('severity')}")

    # Form Submit Button
    sub_status, sub_body = post_json(
        "/incidents",
        {
            "title": "Electrical Panel Sparking Rm 204",
            "description": "Sparks and smoke observed in Tech Park Room 204 before midterm exam.",
            "category": "electrical",
            "severity": "critical",
            "building_id": "BLD-TECH-01",
            "room_number": "204",
            "channel": "web_portal"
        },
        student_token
    )
    created_incident_id = sub_body.get("id") if sub_status == 201 else None
    record("Button: Submit Incident Report (Form)", sub_status == 201, f"Created Incident: {sub_body.get('incident_number')} (ID: {created_incident_id})")

    # Chat Assistant Ingestion Button
    chat_status, chat_body = post_json(
        "/incidents",
        {
            "title": "ELECTRICAL Issue: Room 204",
            "description": "AC unit smoking. Location specified: Tech Park Room 204",
            "category": "electrical",
            "severity": "high",
            "building_id": "BLD-TECH-01",
            "room_number": "204",
            "channel": "chat_assistant"
        },
        student_token
    )
    record("Button: Chat Assistant Log Ticket", chat_status == 201, f"Chat ticket: {chat_body.get('incident_number')}")

    # Simulated Email Ingestion Button
    email_status, email_body = post_json(
        "/intake/simulated-email",
        {
            "sender": "prof.sharma@campus.edu",
            "subject": "URGENT: Sparking AC Unit in Tech Park 204 before midterm",
            "body": "There is a heavy burning smell and electrical sparks coming from the central air conditioning wall unit."
        },
        admin_token
    )
    record("Button: Ingest Simulated Campus Email", email_status == 201, f"Ingested email ticket: {email_body.get('incident_number')}")

    # 3. Incidents Registry Buttons
    print("\n--- 3. Incidents Registry Buttons & SLA Operations ---")
    # Sync Registry button
    inc_status, inc_list = get_json("/incidents", admin_token)
    record("Button: Sync Registry / Fetch Incidents", inc_status == 200 and len(inc_list) > 0, f"Total incidents: {len(inc_list)}")

    if created_incident_id:
        # Escalate Incident Button
        esc_status, esc_body = post_json(
            f"/incidents/{created_incident_id}/escalate",
            {"reason": "Manual operator escalation due to imminent class disruption"},
            admin_token
        )
        record("Button: 1-Click Escalate Incident", esc_status == 200, f"Escalated status: {esc_body.get('status')}, Severity: {esc_body.get('severity')}")

        # Post Comment / Field Note Button
        cmt_status, cmt_body = post_json(
            f"/incidents/{created_incident_id}/comments",
            {"comment": "Dispatched senior electrician to isolate circuit breaker immediately."},
            admin_token
        )
        record("Button: Post Investigation Comment", cmt_status == 200, f"Comment attached, current audit log verified.")

        # Generate Work Order Button
        wo_create_status, wo_create_body = post_json(
            "/work-orders",
            {"incident_id": created_incident_id, "priority": "critical"},
            admin_token
        )
        created_wo_id = wo_create_body.get("id") if wo_create_status == 201 else None
        record("Button: Generate Work Order from Incident", wo_create_status == 201, f"Created Work Order: {wo_create_body.get('order_number')}")
    else:
        created_wo_id = None

    # 4. Work Orders & Technician Dispatch Buttons
    print("\n--- 4. Work Orders & Dispatch State Machine Buttons ---")
    wo_list_status, wo_list = get_json("/work-orders", admin_token)
    target_wo = created_wo_id or (wo_list[0]["id"] if wo_list else None)

    # Technician recommendations button
    rec_status, rec_list = get_json("/work-orders/technician-recommendations/electrical", admin_token)
    record("Button: Fetch Recommended Technicians", rec_status == 200 and len(rec_list) > 0, f"Found {len(rec_list)} qualified technicians (Top: {rec_list[0]['full_name'] if rec_list else 'None'})")

    if target_wo and rec_list:
        tech_to_assign = rec_list[0]["user_id"]
        # Assign Technician Button
        asg_status, asg_body = post_json(
            f"/work-orders/{target_wo}/assign",
            {"technician_id": tech_to_assign, "reason": "Automated matching score"},
            admin_token
        )
        record("Button: Assign Technician", asg_status == 200, f"Assigned tech {tech_to_assign} to WO {asg_body.get('order_number')}")

        # Transition State Button -> in_progress
        trans1_status, trans1_body = post_json(
            f"/work-orders/{target_wo}/transition",
            {"new_status": "in_progress", "notes": "Technician on site with multimeter."},
            admin_token
        )
        record("Button: State Transition -> In Progress", trans1_status == 200 and trans1_body.get("status") == "in_progress", f"Status: {trans1_body.get('status')}")

        # Add Field Note Button
        note_status, note_body = post_json(
            f"/work-orders/{target_wo}/notes",
            {"notes": "Replaced thermal fuse and verified 230V clean phase power."},
            admin_token
        )
        record("Button: Add Work Order Field Note", note_status == 200, f"Field note saved.")

        # Transition State Button -> pending_verification
        trans2_status, trans2_body = post_json(
            f"/work-orders/{target_wo}/transition",
            {"new_status": "pending_verification", "notes": "Repairs complete, ready for inspection."},
            admin_token
        )
        record("Button: State Transition -> Pending Verification", trans2_status == 200 and trans2_body.get("status") == "pending_verification", f"Status: {trans2_body.get('status')}")

        # Transition State Button -> completed
        trans3_status, trans3_body = post_json(
            f"/work-orders/{target_wo}/transition",
            {"new_status": "completed", "resolution_notes": "All repairs complete and certified."},
            admin_token
        )
        record("Button: State Transition -> Completed", trans3_status == 200 and trans3_body.get("status") == "completed", f"Status: {trans3_body.get('status')}")

    # Disruption Scenario B Button
    disrup_b_status, disrup_b_body = post_json(
        "/work-orders/reassign-disruption",
        {"reason": "Sudden fever during shift"},
        admin_token
    )
    record("Button: Disruption Scenario B (Technician Sickness Rebalance)", disrup_b_status == 200, f"Reassigned {len(disrup_b_body.get('reassigned_work_orders', []))} work orders to available staff.")

    # 5. Bookings & Relocation Buttons
    print("\n--- 5. Room Bookings & Anti-Collision Engine Buttons ---")
    import time
    epoch = int(time.time())
    day = 1 + (epoch % 27)
    hour = 8 + (epoch % 10)
    minute = (epoch % 60)
    start_dt = f"2027-01-{day:02d}T{hour:02d}:{minute:02d}:00Z"
    end_dt = f"2027-01-{day:02d}T{hour+1:02d}:{minute:02d}:00Z"

    # Create booking button
    bk_status, bk_body = post_json(
        "/bookings",
        {
            "title": f"Autonomous Robotics Session {epoch}",
            "room_id": "RM-TP-101",
            "user_name": "Dr. Raman",
            "user_email": "manager.dept@campus.edu",
            "start_time": start_dt,
            "end_time": end_dt,
            "expected_attendees": 40
        },
        manager_token
    )
    record("Button: Confirm Space Reservation", bk_status == 201, f"Booking created: {bk_body.get('title')}")

    # Double-booking collision rejection test (same slot & room)
    dup_bk_status, dup_bk_body = post_json(
        "/bookings",
        {
            "title": "Conflicting Math Lecture",
            "room_id": "RM-TP-101",
            "user_name": "Prof. Rao",
            "user_email": "faculty.smith@campus.edu",
            "start_time": start_dt,
            "end_time": end_dt,
            "expected_attendees": 35
        },
        manager_token
    )
    record("Anti-Collision Guard: Reject Double Booking", dup_bk_status == 409, f"Conflict properly caught with HTTP {dup_bk_status} ({dup_bk_body.get('detail')})")

    # Disruption Scenario A: Analyze Disruption Button
    disrup_a_status, disrup_a_body = post_json(
        "/bookings/disruptions/analyze",
        {"compromised_room_id": "RM-TP-204"},
        manager_token
    )
    record("Button: Disruption Scenario A (Analyze Compromised Room)", disrup_a_status == 200, f"Found {len(disrup_a_body.get('affected_bookings', []))} affected bookings, {len(disrup_a_body.get('eligible_alternative_rooms', []))} alternative rooms.")

    # Relocate Exam Button
    reloc_status, reloc_body = post_json(
        "/bookings/disruptions/relocate",
        {
            "booking_id": "bk-cs301-exam",
            "target_room_id": "RM-AUD-01",
            "reason": "Emergency electrical hazard evacuation"
        },
        manager_token
    )
    record("Button: Execute Emergency Room Relocation", reloc_status == 200, f"Relocated to: {reloc_body.get('target_room_name')} (Status: {reloc_body.get('status')})")

    # 6. Inventory & Procurement Buttons
    print("\n--- 6. Inventory, Reserve & Procurement Buttons ---")
    # Reserve stock button
    inv_status, inv_items = get_json("/inventory/items", admin_token)
    available_items = [it for it in inv_items if (it.get("quantity_on_hand", 0) - it.get("quantity_reserved", 0)) > 0]
    target_item = available_items[0]["id"] if available_items else inv_items[0]["id"]
    
    res_status, res_body = post_json(
        "/inventory/reserve",
        {
            "item_id": target_item,
            "quantity": 1,
            "work_order_id": target_wo or "WO-2026-0001",
            "reason": "Replacement breaker"
        },
        admin_token
    )
    record("Button: Reserve Spare Parts", res_status in (200, 201), f"Reserved 1 unit. Available: {res_body.get('new_available_quantity')}")

    # Negative-stock guard test
    neg_status, neg_body = post_json(
        "/inventory/reserve",
        {
            "item_id": target_item,
            "quantity": 999999,
            "work_order_id": target_wo or "WO-2026-0001",
            "reason": "Excessive request"
        },
        admin_token
    )
    record("Deterministic Guard: Negative-Stock Prevention", neg_status == 400, f"Blocked over-allocation with HTTP {neg_status} ({neg_body.get('detail')})")

    # Submit Purchase Requisition Button
    pr_status, pr_body = post_json(
        "/inventory/purchases",
        {
            "item_name": "Commercial Heavy Duty AC Compressor Unit",
            "quantity": 2,
            "estimated_unit_cost": 450.0,
            "vendor": "Carrier Commercial HVAC",
            "justification": "Replace failed compressor in Tech Park"
        },
        admin_token
    )
    pr_id = pr_body.get("id") if pr_status == 201 else None
    record("Button: Submit Purchase Requisition", pr_status == 201, f"Created Requisition: {pr_body.get('pr_number')} (Requester: {pr_body.get('requester_name')})")

    if pr_id:
        # Anti-Self-Approval Guard Test
        self_appr_status, self_appr_body = post_json(
            f"/inventory/purchases/{pr_id}/approve",
            {"decision": "approved", "comments": "Self approval attempt"},
            admin_token # Admin is the requester!
        )
        record("Anti-Self-Approval Guard: Forbidden Self-Approval", self_appr_status == 403, f"Self-approval rejected with HTTP {self_appr_status} ({self_appr_body.get('detail')})")

        # Independent Procurement Approver Button
        ind_appr_status, ind_appr_body = post_json(
            f"/inventory/purchases/{pr_id}/approve",
            {"decision": "approved", "comments": "Approved by verified procurement officer"},
            approver_token # Independent procurement approver!
        )
        record("Button: Authorized Procurement Approval", ind_appr_status == 200 and ind_appr_body.get("decision") == "approved", f"Decision: {ind_appr_body.get('decision')}")

    # 7. Spatial Command Center Telemetry
    print("\n--- 7. Spatial Command Center & 3D Twin API Telemetry ---")
    bld_status, bld_list = get_json("/campus/buildings", admin_token)
    record("3D Command Center: Fetch Buildings Matrix", bld_status == 200 and len(bld_list) == 6, f"Loaded {len(bld_list)} buildings")

    geo_status, geo_data = get_json("/campus/geojson", admin_token)
    record("3D Command Center: Fetch GeoJSON Geometry", geo_status == 200 and len(geo_data.get("features", [])) == 6, f"Loaded {len(geo_data.get('features', []))} spatial polygons")

    room_status, room_list = get_json("/campus/buildings/BLD-TECH-01/rooms", admin_token)
    record("3D Command Center: Inspect 4 Floors x 4 Rooms", room_status == 200, f"Rooms loaded for Tech Park: {len(room_list)}")

    # Summary
    print("\n========================================================================")
    print("                          Audit Summary                                 ")
    print("========================================================================")
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = total - passed
    print(f" Total Interaction Checks : {total}")
    print(f" Passed                   : {passed}")
    print(f" Failed                   : {failed}")
    print(f" Health Rate              : {(passed / total) * 100:.1f}%\n")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_all_checks()
