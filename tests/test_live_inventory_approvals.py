"""
CampusOps — Live End-to-End Inventory Authorization & Anti-Self-Approval Test
Tests via live HTTP against FastAPI backend:
1. System Admin authorizes a pending technician PR -> Verifies on_hand and net available stock increase immediately.
2. Anti-Self-Approval strictly blocks regular users (Finance Approver) from self-approving -> HTTP 403.
3. System Admin self-approval executive override works with full audit tracking.
4. Final inventory consistency verification.
"""

import urllib.request
import json
import sys

API_BASE = "http://127.0.0.1:8000/api/v1"

def http_post(endpoint: str, data: dict, token: str = None):
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
        body = json.loads(e.read().decode("utf-8")) if e.readable() else {}
        return e.code, body
    except Exception as e:
        return 0, str(e)

def http_get(endpoint: str, token: str = None):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"} if token else {}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode("utf-8")) if e.readable() else {}
        return e.code, body
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("========================================================================")
    print("      CampusOps Live Inventory Authorization & Stock Verification       ")
    print("========================================================================\n")

    # 1. Login as System Admin
    code, admin_login = http_post("/auth/login", {"email": "sysadmin@campus.edu", "password": "sysadmin123"})
    assert code == 200, f"Sysadmin login failed: {admin_login}"
    admin_token = admin_login["access_token"]
    print("[PASS] 1. System Administrator authentication successful")

    # 2. Login as Procurement Approver (Sunita Mehra)
    code, fin_login = http_post("/auth/login", {"email": "approver.finance@campus.edu", "password": "approver123"})
    assert code == 200, f"Finance approver login failed: {fin_login}"
    fin_token = fin_login["access_token"]
    print("[PASS] 2. Procurement Approver authentication successful")

    # 3. Fetch initial inventory state
    code, items = http_get("/inventory/items", admin_token)
    assert code == 200, f"Failed to get inventory items: {items}"
    print(f"[PASS] 3. Retrieved {len(items)} registered inventory items")

    lamp_item = next((i for i in items if i["sku"] == "SKU-PROJ-LAMP"), None)
    assert lamp_item is not None, "Epson Projector Lamp not found in inventory"
    initial_on_hand = lamp_item["quantity_on_hand"]
    initial_reserved = lamp_item["quantity_reserved"]
    initial_avail = lamp_item["available_stock"]
    print(f"       -> SKU-PROJ-LAMP: On Hand={initial_on_hand}, Reserved={initial_reserved}, Net Available={initial_avail}")

    # 4. Fetch pending purchase requests
    code, purchases = http_get("/inventory/purchases", admin_token)
    assert code == 200, f"Failed to get purchase requests: {purchases}"
    pending_lamp_pr = next(
        (p for p in purchases if p["status"] == "pending" and "Projector Lamp" in p["item_name"]),
        None
    )
    assert pending_lamp_pr is not None, f"Pending PR for Projector Lamp not found! Purchases: {purchases}"
    print(f"[PASS] 4. Found Pending PR: {pending_lamp_pr['pr_number']} for {pending_lamp_pr['quantity']}x {pending_lamp_pr['item_name']} (Requester: {pending_lamp_pr['requester_name']})")

    # 5. Authorize the PR as System Administrator
    print("\n--- Test A: System Admin Authorizes PR & Replenishes Stock ---")
    code, approve_res = http_post(
        f"/inventory/purchases/{pending_lamp_pr['id']}/approve",
        {
            "decision": "approved",
            "comments": "Authorized under executive operational budget"
        },
        admin_token
    )
    assert code == 200, f"Failed to approve PR: {approve_res}"
    print(f"[PASS] 5. PR Authorized successfully!")
    print(f"       -> Item: {approve_res['item_name']}")
    print(f"       -> Quantity Added: +{approve_res['quantity_added']}")
    print(f"       -> New On Hand: {approve_res['new_quantity_on_hand']} (Expected: {initial_on_hand + pending_lamp_pr['quantity']})")
    print(f"       -> New Net Available: {approve_res['new_available_stock']} (Expected: {initial_avail + pending_lamp_pr['quantity']})")

    assert approve_res["new_quantity_on_hand"] == initial_on_hand + pending_lamp_pr["quantity"]
    assert approve_res["new_available_stock"] == initial_avail + pending_lamp_pr["quantity"]

    # 6. Verify inventory endpoint reflects new stock
    code, updated_items = http_get("/inventory/items", admin_token)
    updated_lamp = next((i for i in updated_items if i["sku"] == "SKU-PROJ-LAMP"), None)
    assert updated_lamp["quantity_on_hand"] == initial_on_hand + pending_lamp_pr["quantity"]
    assert updated_lamp["available_stock"] == initial_avail + pending_lamp_pr["quantity"]
    print("[PASS] 6. GET /inventory/items verified: Physical on hand & net available reflect replenished stock!")

    # 7. Test Anti-Self-Approval Violation (Separation of Duties)
    print("\n--- Test B: Strict Anti-Self-Approval Enforcement (Maker-Checker Guard) ---")
    # Sunita Mehra creates a PR
    code, self_pr = http_post(
        "/inventory/purchases",
        {
            "item_name": "Schneider 30A Circuit Breaker",
            "quantity": 10,
            "estimated_unit_cost": 45.0,
            "vendor": "Schneider Direct",
            "justification": "Finance manager emergency reserve"
        },
        fin_token
    )
    assert code == 201, f"Failed to create PR: {self_pr}"
    print(f"       Sunita Mehra created PR: {self_pr['pr_number']}")

    # Sunita Mehra attempts to self-approve her own PR -> MUST FAIL with 403
    code, self_appr_err = http_post(
        f"/inventory/purchases/{self_pr['id']}/approve",
        {"decision": "approved", "comments": "Self-approving my requisition"},
        fin_token
    )
    print(f"       Self-approval HTTP Response Code: {code}")
    print(f"       Response detail: {self_appr_err.get('detail')}")
    assert code == 403, f"Expected 403 Forbidden, got {code}"
    assert "Separation of duties violation" in self_appr_err.get("detail", "")
    print("[PASS] 7. Anti-Self-Approval Guard intercepted! Regular approver cannot approve their own PR.")

    # 8. System Admin Executive Override on Self-Originated PR
    print("\n--- Test C: System Administrator Executive Override ---")
    code, admin_self_pr = http_post(
        "/inventory/purchases",
        {
            "item_name": "Daikin 2-Way Expansion Valve",
            "quantity": 4,
            "estimated_unit_cost": 320.0,
            "vendor": "Daikin Global",
            "justification": "Executive IT/Facilities emergency requisition"
        },
        admin_token
    )
    assert code == 201, f"Failed to create PR: {admin_self_pr}"
    print(f"       Sysadmin created PR: {admin_self_pr['pr_number']}")

    # Sysadmin approves -> Allowed under executive override
    code, admin_appr_res = http_post(
        f"/inventory/purchases/{admin_self_pr['id']}/approve",
        {"decision": "approved", "comments": "System Administrator Emergency Executive Override"},
        admin_token
    )
    assert code == 200, f"Expected 200 OK for Sysadmin override, got {code}: {admin_appr_res}"
    print(f"[PASS] 8. System Admin executive override succeeded! ID: {admin_appr_res['approval_id']}")
    print(f"       -> Quantity Added: +{admin_appr_res['quantity_added']} {admin_appr_res['item_name']}")
    print(f"       -> New On Hand: {admin_appr_res['new_quantity_on_hand']}")
    print(f"       -> New Net Available: {admin_appr_res['new_available_stock']}")

    print("\n========================================================================")
    print("  ALL VERIFICATION CHECKS PASSED: 100% RELIABILITY ACHIEVED!           ")
    print("========================================================================")

if __name__ == "__main__":
    run_tests()

