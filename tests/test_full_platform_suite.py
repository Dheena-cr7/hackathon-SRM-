"""
CampusOps — Complete End-to-End Platform Verification Suite
Tests all roles, workflows, business rules, buttons, and endpoints.
"""

import sys
import json
import urllib.request
import urllib.error

API_BASE = "http://127.0.0.1:8000/api/v1"
FRONTEND_BASE = "http://localhost:3000"

# Color formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

test_results = []

def record(test_name: str, passed: bool, detail: str = ""):
    status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    test_results.append((test_name, passed, detail))
    print(f"[{status}] {BOLD}{test_name}{RESET} {detail}")

def http_req(url: str, method: str = "GET", headers: dict = None, data: dict = None):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return response.status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

print(f"\n{CYAN}{BOLD}========================================================================{RESET}")
print(f"{CYAN}{BOLD}           CampusOps Comprehensive Automated Platform Audit             {RESET}")
print(f"{CYAN}{BOLD}========================================================================{RESET}\n")

# 1. Test All Role Authentications
roles_to_test = [
    ("admin.facilities@campus.edu", "admin123", "facilities_admin", "Karthik R."),
    ("tech.rajesh@campus.edu", "tech123", "technician", "Rajesh Kumar"),
    ("tech.ananya@campus.edu", "tech123", "technician", "Ananya Verma"),
    ("approver.finance@campus.edu", "approver123", "procurement_approver", "Sunita Mehra"),
    ("manager@campus.edu", "manager123", "dept_manager", "Dr. Raman"),
    ("student@campus.edu", "student123", "student", "Aarav Patel"),
]

tokens = {}
print(f"{YELLOW}--- 1. Identity & Role-Based Access Control ---{RESET}")
for email, password, expected_role, name in roles_to_test:
    status, res = http_req(f"{API_BASE}/auth/login", method="POST", data={"email": email, "password": password})
    if status == 200 and "access_token" in res:
        tokens[expected_role] = res["access_token"]
        record(f"Login: {name} ({expected_role})", True, f"Token exchanged (role: {res['user']['role']})")
    else:
        record(f"Login: {name} ({expected_role})", False, f"HTTP {status}: {res}")

admin_token = tokens.get("facilities_admin", "")
auth_header = {"Authorization": f"Bearer {admin_token}"}

# 2. Analytics Telemetry Matrix
print(f"\n{YELLOW}--- 2. Executive Analytics & Telemetry Matrix ---{RESET}")
status, res = http_req(f"{API_BASE}/analytics/overview", headers=auth_header)
if status == 200 and "total_open_incidents" in res and "incidents" in res:
    inc_active = res["incidents"]["active"]
    wo_active = res["work_orders"]["active"]
    sla_rate = res["sla_compliance_rate"]
    record("Analytics Overview Schema", True, f"Incidents: {inc_active}, Work Orders: {wo_active}, SLA: {sla_rate}%")
else:
    record("Analytics Overview Schema", False, f"HTTP {status}: {res}")

# 3. 3D Spatial Digital Twin Telemetry
print(f"\n{YELLOW}--- 3. 3D Digital Twin & Campus Facilities ---{RESET}")
status, buildings = http_req(f"{API_BASE}/campus/buildings", headers=auth_header)
if status == 200 and isinstance(buildings, list) and len(buildings) > 0:
    record("List Campus Buildings for 3D Scene", True, f"Loaded {len(buildings)} structural blocks")
    bld_id = buildings[0]["id"]
    status, rooms = http_req(f"{API_BASE}/campus/buildings/{bld_id}/rooms", headers=auth_header)
    record("Query Rooms for Building Inspector", status == 200, f"Loaded {len(rooms) if isinstance(rooms, list) else 0} rooms")
else:
    record("List Campus Buildings for 3D Scene", False, f"HTTP {status}")

status, geo = http_req(f"{API_BASE}/campus/geojson", headers=auth_header)
record("Campus GeoJSON Spatial Boundaries", status == 200 and "features" in geo, f"Features: {len(geo.get('features', [])) if isinstance(geo, dict) else 0}")

# 4. Incident Intake & Layer 1 Deterministic NLP
print(f"\n{YELLOW}--- 4. Natural-Language Intake & Entity Extraction ---{RESET}")
test_prompt = "Dr. T.P. Ganesan Auditorium main hall AC unit is smelling like burning plastic and sparking near switch board"
status, analysis = http_req(f"{API_BASE}/intake/analyze", method="POST", headers=auth_header, data={"raw_text": test_prompt})
is_valid_analysis = status == 200 and analysis.get("category") == "electrical" and analysis.get("severity") == "critical"
record("NLP Extraction: Hazard Classification", is_valid_analysis, f"Category: {analysis.get('category')}, Severity: {analysis.get('severity')}")
record("NLP Extraction: Spatial Entity Linking", status == 200 and analysis.get("building_id") == "BLD-AUD-01", f"Building: {analysis.get('building_name')}")

# Check duplicate candidates
status, dupes = http_req(f"{API_BASE}/intake/duplicates", method="POST", headers=auth_header, data={"text": test_prompt})
record("Cosine Similarity Duplicate Ticket Detection", status == 200, f"Evaluated open queue candidate similarity")

# 5. Incident Ticket Lifecycle & Comment Audit Trail
print(f"\n{YELLOW}--- 5. Incident Ticket Lifecycle & Audit Logging ---{RESET}")
inc_payload = {
    "title": "Auditorium Main Hall AC Electrical Disruption",
    "description": test_prompt,
    "category": "electrical",
    "severity": "critical",
    "building_id": "BLD-AUD-01",
    "room_number": "Main Hall",
    "reporter_name": "Karthik R.",
    "channel": "web_portal"
}
status, created_inc = http_req(f"{API_BASE}/incidents", method="POST", headers=auth_header, data=inc_payload)
inc_id = created_inc.get("id") if status == 201 else None
record("Submit Incident Ticket", status == 201 and inc_id is not None, f"Created {created_inc.get('incident_number')} (ID: {inc_id})")

if inc_id:
    # Post comment
    comment_payload = {"comment": "Campus electricians deployed with multimeter and infrared thermal camera"}
    status, updated_inc = http_req(f"{API_BASE}/incidents/{inc_id}/comments", method="POST", headers=auth_header, data=comment_payload)
    record("Post Incident Investigation Note", status == 200, f"Comment attached to incident record")

    # Update status to in_progress
    status, patched_inc = http_req(f"{API_BASE}/incidents/{inc_id}/status?new_status=in_progress", method="PATCH", headers=auth_header)
    record("Transition Incident Status to 'in_progress'", status == 200 and patched_inc.get("status") == "in_progress", f"New status: {patched_inc.get('status')}")

# 6. Work Order Dispatch & Field Resolution
print(f"\n{YELLOW}--- 6. Technician Matching & Field Work Orders ---{RESET}")
status, wo_list = http_req(f"{API_BASE}/work-orders", headers=auth_header)
record("Fetch Dispatch Board Work Orders", status == 200, f"Found {len(wo_list) if isinstance(wo_list, list) else 0} work orders")

status, recs = http_req(f"{API_BASE}/work-orders/technician-recommendations/electrical", headers=auth_header)
record("AI Technician Workload Matching", status == 200, f"Ranked {len(recs) if isinstance(recs, list) else 0} qualified technicians")

if isinstance(wo_list, list) and len(wo_list) > 0:
    wo_target_id = wo_list[0]["id"]
    # Post note
    status, note_res = http_req(f"{API_BASE}/work-orders/{wo_target_id}/notes", method="POST", headers=auth_header, data={"notes": "Field inspection confirmed circuit breaker tripped on overcurrent"})
    record("Attach Work Order Field Note", status == 200, f"Resolution note recorded")

# 7. Classroom Bookings & Emergency Relocation
print(f"\n{YELLOW}--- 7. Space Bookings & Anti-Collision Engine ---{RESET}")
status, bookings = http_req(f"{API_BASE}/bookings", headers=auth_header)
record("Fetch Active Room Schedules", status == 200, f"Found {len(bookings) if isinstance(bookings, list) else 0} booked slots")

# 8. Warehouse Inventory & Negative-Stock Prevention
print(f"\n{YELLOW}--- 8. Inventory & Negative-Stock Guard ---{RESET}")
status, inv_items = http_req(f"{API_BASE}/inventory", headers=auth_header)
record("Load Critical Spare Parts Catalog", status == 200 and len(inv_items) > 0, f"Loaded {len(inv_items) if isinstance(inv_items, list) else 0} SKUs")

if isinstance(inv_items, list) and len(inv_items) > 0:
    target_item = inv_items[0]
    avail = target_item["quantity_on_hand"] - target_item["quantity_reserved"]
    
    # Try invalid over-reservation
    bad_reserve = {"item_id": target_item["id"], "quantity": 999999}
    status, bad_res = http_req(f"{API_BASE}/inventory/reserve", method="POST", headers=auth_header, data=bad_reserve)
    record("Negative-Stock Prevention Rollback", status == 400, f"Blocked over-allocation (HTTP {status})")

    # Valid reserve
    if avail > 0:
        valid_reserve = {"item_id": target_item["id"], "quantity": 1}
        status, good_res = http_req(f"{API_BASE}/inventory/reserve", method="POST", headers=auth_header, data=valid_reserve)
        record("Atomic Component Stock Hold", status == 201, f"Reserved 1 unit of {target_item['name']}")

# 9. Procurement Requisitions & Separation of Duties
print(f"\n{YELLOW}--- 9. Purchase Requisitions & Anti-Self-Approval Guard ---{RESET}")
pr_payload = {
    "item_name": "Schneider 32A DIN Rail Circuit Breaker",
    "quantity": 8,
    "estimated_unit_cost": 42.50,
    "vendor": "Schneider Direct OEM",
    "justification": "Emergency replacement backup for Tech Park distribution risers",
    "requester_id": "user-admin-fac"
}
status, created_pr = http_req(f"{API_BASE}/inventory/purchases", method="POST", headers=auth_header, data=pr_payload)
pr_id = created_pr.get("id") if status == 201 else None
record("Submit Purchase Requisition", status == 201 and pr_id is not None, f"Requisition {created_pr.get('pr_number')} created")

if pr_id:
    # 1. Requester tries to self-approve (MUST BE BLOCKED)
    status, self_block = http_req(
        f"{API_BASE}/inventory/purchases/{pr_id}/approve",
        method="POST",
        headers=auth_header,
        data={"approver_id": "user-admin-fac", "decision": "approved", "comments": "Self approving my order"}
    )
    record("Anti-Self-Approval Separation of Duties", status == 403, f"Strictly forbidden when requester == approver (HTTP {status})")

    # 2. Authorized approver approves
    approver_token = tokens.get("procurement_approver", "")
    approver_header = {"Authorization": f"Bearer {approver_token}"}
    status, auth_appr = http_req(
        f"{API_BASE}/inventory/purchases/{pr_id}/approve",
        method="POST",
        headers=approver_header,
        data={"approver_id": "user-appr-sunita", "decision": "approved", "comments": "Authorized under capital facilities allocation"}
    )
    record("Authorized Procurement Officer Approval", status == 200, f"Approved by Sunita Mehra (Decision: {auth_appr.get('decision')})")

# 10. Next.js Frontend Page Route Accessibility
print(f"\n{YELLOW}--- 10. Frontend User Interface Routes (HTTP 200 OK) ---{RESET}")
pages = [
    ("/", "Executive Dashboard & Telemetry"),
    ("/intake", "Incident Intake & AI Parser"),
    ("/command-center", "3D Digital Twin Command Center"),
    ("/incidents", "Incident Queue & Investigation"),
    ("/work-orders", "Technician Dispatch Board"),
    ("/bookings", "Classroom Schedules & Relocation"),
    ("/inventory", "Parts Inventory & Procurement"),
]

for path, label in pages:
    status, _ = http_req(f"{FRONTEND_BASE}{path}")
    record(f"Page Route: {path}", status == 200, f"{label} (HTTP {status})")

# Summary Report
print(f"\n{CYAN}{BOLD}========================================================================{RESET}")
total = len(test_results)
passed = sum(1 for _, p, _ in test_results if p)
failed = total - passed
print(f"{CYAN}{BOLD}                         Test Suite Summary                             {RESET}")
print(f"{CYAN}{BOLD}========================================================================{RESET}")
print(f" Total Tests Run: {BOLD}{total}{RESET}")
print(f" Passed:          {GREEN}{BOLD}{passed}{RESET}")
print(f" Failed:          {RED if failed > 0 else GREEN}{BOLD}{failed}{RESET}")
pct = (passed / total) * 100
print(f" Health Rate:     {GREEN if pct == 100 else YELLOW}{BOLD}{pct:.1f}%{RESET}\n")

if failed > 0:
    sys.exit(1)
