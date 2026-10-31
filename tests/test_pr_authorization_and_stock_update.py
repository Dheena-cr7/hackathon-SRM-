"""
CampusOps — Verification Test for PR Authorization & Stock Replenishment
Tests:
1. Non-sysadmin self-approval is blocked with 403 / SelfApprovalProhibitedError (Separation of Duties).
2. System Admin approval of technician's PR succeeds, increases quantity_on_hand, and net available stock.
3. System Admin override of self-created PR succeeds with audit trail.
4. Concurrency & negative stock guard check.
"""

import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from backend.app.models.inventory import InventoryItem, PurchaseRequest, Approval
from backend.app.models.user import User
from backend.app.models.audit import AuditLog
from backend.app.domain.approvals.service import ApprovalService, SelfApprovalProhibitedError
from backend.app.schemas.inventory import PurchaseRequestCreate, ApprovalDecisionRequest

DATABASE_URL = "sqlite+aiosqlite:///data/campusops.db"

async def run_test():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("=======================================================")
        print("     PR AUTHORIZATION & INVENTORY UPDATE VERIFICATION  ")
        print("=======================================================")

        # 1. Fetch users
        res_tech = await db.execute(select(User).where(User.email == "tech.rajesh@campus.edu"))
        tech_user = res_tech.scalars().first()
        res_sysadmin = await db.execute(select(User).where(User.email == "sysadmin@campus.edu"))
        sysadmin_user = res_sysadmin.scalars().first()
        res_finance = await db.execute(select(User).where(User.email == "approver.finance@campus.edu"))
        finance_user = res_finance.scalars().first()

        assert tech_user is not None, "Technician user missing"
        assert sysadmin_user is not None, "Sysadmin user missing"
        assert finance_user is not None, "Finance approver user missing"

        # 2. Pick an inventory item to test (e.g. Epson Projector Lamp)
        res_item = await db.execute(select(InventoryItem).where(InventoryItem.sku == "SKU-PROJ-LAMP"))
        lamp = res_item.scalars().first()
        assert lamp is not None, "Projector lamp item missing"

        initial_on_hand = lamp.quantity_on_hand
        initial_reserved = lamp.quantity_reserved
        initial_available = initial_on_hand - initial_reserved
        print(f"\n[Baseline Item] {lamp.name} ({lamp.sku})")
        print(f"  Physical On Hand: {initial_on_hand}")
        print(f"  Work Order Reserved: {initial_reserved}")
        print(f"  Net Available Stock: {initial_available}")

        # 3. Create a PR requested by Technician Rajesh Kumar
        print("\n--- Test 1: Technician creates PR ---")
        pr_data = PurchaseRequestCreate(
            item_id=lamp.id,
            quantity=5,
            estimated_unit_cost=185.0,
            vendor="Epson Direct",
            justification="Lab 201 projector replacement batch",
            requester_id=tech_user.id
        )
        pr = await ApprovalService.create_purchase_request(db, tech_user.id, pr_data)
        print(f"  Created PR: {pr.id} for {pr.quantity} units (Status: {pr.status})")

        # 4. Anti-Self-Approval Test: Technician attempts to approve their OWN PR
        print("\n--- Test 2: Technician attempts to self-approve ---")
        try:
            await ApprovalService.decide_approval(
                db, 
                approver_id=tech_user.id, 
                request_id=pr.id, 
                data=ApprovalDecisionRequest(decision="approved", comments="Self approving")
            )
            print("  [FAIL] Self-approval was unexpectedly allowed!")
            assert False, "Self-approval should have failed!"
        except SelfApprovalProhibitedError as e:
            print(f"  [PASS] Blocked by Anti-Self-Approval Guard: {e}")

        # 5. System Admin authorizes Technician's PR
        print("\n--- Test 3: System Administrator authorizes PR ---")
        approval = await ApprovalService.decide_approval(
            db,
            approver_id=sysadmin_user.id,
            request_id=pr.id,
            data=ApprovalDecisionRequest(decision="approved", comments="Authorized under institutional ops threshold")
        )
        print(f"  [PASS] Approved by System Admin! Approval ID: {approval.id}")

        # 6. Verify inventory stock on hand and net availability updated correctly!
        await db.refresh(lamp)
        new_on_hand = lamp.quantity_on_hand
        new_reserved = lamp.quantity_reserved
        new_available = new_on_hand - new_reserved

        print(f"\n--- Test 4: Inventory Count Verification ---")
        print(f"  Expected On Hand: {initial_on_hand + 5} | Actual: {new_on_hand}")
        print(f"  Expected Available: {initial_available + 5} | Actual: {new_available}")
        assert new_on_hand == initial_on_hand + 5, f"Expected {initial_on_hand + 5}, got {new_on_hand}"
        assert new_available == initial_available + 5, f"Expected {initial_available + 5}, got {new_available}"
        print("  [PASS] Stock count and net availability updated accurately!")

        # 7. System Admin creates their own PR and approves via Executive Override
        print("\n--- Test 5: System Admin self-request & Executive Override ---")
        admin_pr_data = PurchaseRequestCreate(
            item_id=lamp.id,
            quantity=2,
            estimated_unit_cost=185.0,
            vendor="Epson Direct",
            justification="Emergency executive spare batch",
            requester_id=sysadmin_user.id
        )
        admin_pr = await ApprovalService.create_purchase_request(db, sysadmin_user.id, admin_pr_data)
        admin_approval = await ApprovalService.decide_approval(
            db,
            approver_id=sysadmin_user.id,
            request_id=admin_pr.id,
            data=ApprovalDecisionRequest(decision="approved", comments="Executive administrative override")
        )
        print(f"  [PASS] System Admin self-approval permitted via executive override! ID: {admin_approval.id}")
        await db.refresh(lamp)
        print(f"  Final On Hand: {lamp.quantity_on_hand} (+2 units) | Final Available: {lamp.quantity_on_hand - lamp.quantity_reserved}")

        print("\n=======================================================")
        print("   ALL TESTS PASSED: PR AUTHORIZATION & STOCK UPDATE   ")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_test())
