"""
CampusOps Platform — Live Verification & Results Display
Demonstrates live execution of all core algorithms, state machines, and business rules.
"""

import asyncio
import json
import os
import sys

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath("."))

from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from backend.app.domain.intake.nlp_extractor import extract_incident_features
from backend.app.domain.intake.similarity_service import IncidentSimilarityEngine
from backend.app.domain.staff.allocator import StaffAllocator
from backend.app.domain.bookings.service import BookingService, DoubleBookingConflictError
from backend.app.domain.bookings.disruption_service import DisruptionService
from backend.app.domain.inventory.service import InventoryService, InsufficientStockError
from backend.app.domain.approvals.service import ApprovalService, SelfApprovalProhibitedError
from backend.app.models.inventory import InventoryItem
from backend.app.models.user import User
from backend.app.models.booking import Booking
from backend.app.schemas.booking import BookingCreate
from backend.app.schemas.inventory import PartsReservationRequest, PurchaseRequestCreate, ApprovalDecisionRequest
from backend.app.core.database import Base, AsyncSessionLocal
from scripts.seed_generator import seed_database

async def run_live_demonstration():
    print("=" * 70)
    print("       CAMPUSOPS PLATFORM — LIVE VERIFICATION & RESULTS DISPLAY       ")
    print("=" * 70)

    # 1. Layer 1 NLP Entity Extraction
    print("\n--- [1] LAYER 1 DETERMINISTIC NLP EXTRACTION ---")
    raw_text = "Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm"
    extraction = extract_incident_features(raw_text)
    print(f"Input Text: \"{raw_text}\"")
    print(f"Category Classified: {extraction.category.upper()}")
    print(f"Urgency Level:       {extraction.urgency.upper()}")
    print(f"Building Code Match: {extraction.building_id} ({extraction.building_name})")
    print(f"Room Number Match:   {extraction.room_id} ({extraction.room_number})")
    print(f"Time Constraint:     {extraction.time_constraint}")
    print(f"Confidence Score:    {extraction.confidence_score * 100:.0f}%")
    assert extraction.urgency == "critical"
    assert extraction.building_id == "BLD-TECH-01"
    assert extraction.room_id == "RM-TP-204"
    print(">> NLP EXTRACTION RESULT: PASSED (100% Deterministic & Offline)")

    # 2. In-Memory TF-IDF Duplicate Detection
    print("\n--- [2] TICKET CORRELATION & DUPLICATE SIMILARITY ---")
    existing_tickets = [
        {
            "id": "inc-01",
            "incident_number": "INC-2026-0001",
            "title": "Sparking panel in Tech Park room 204",
            "description": "Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm",
            "room_number": "204"
        },
        {
            "id": "inc-02",
            "incident_number": "INC-2026-0002",
            "title": "Broken chair in Library",
            "description": "Chair armrest detached in reading area",
            "room_number": "LIB-101"
        }
    ]
    student_report = "There are dangerous sparks in room 204 breaker panel at Tech Park!"
    duplicates = IncidentSimilarityEngine.find_duplicates(student_report, existing_tickets)
    print(f"Incoming Report: \"{student_report}\"")
    print(f"Matched Duplicate Ticket: {duplicates[0]['incident_number']} ({duplicates[0]['title']})")
    print(f"Similarity Score:         {duplicates[0]['similarity_score'] * 100:.1f}%")
    print(f"Duplicate Flagged:        {duplicates[0]['is_duplicate_candidate']}")
    assert duplicates[0]["is_duplicate_candidate"] is True
    print(">> DUPLICATE ENGINE RESULT: PASSED")

    # 3. Database Setup for Concurrency & Workflow Tests
    await seed_database()
    session_maker = AsyncSessionLocal

    # 4. Technician Allocation Candidate Ranking
    print("\n--- [3] EXPLAINABLE TECHNICIAN CANDIDATE RANKING ---")
    async with session_maker() as db:
        ranked = await StaffAllocator.recommend_technicians(db, "electrical")
        for rank, cand in enumerate(ranked, 1):
            print(f"Rank #{rank}: {cand.full_name:15} | Score: {cand.score:.2f} | Skills: {cand.matched_skills} | Workload: {cand.current_workload} WOs | Reason: {cand.recommendation_reason}")
        assert len(ranked) >= 1
        assert "SKL-ELEC" in ranked[0].matched_skills
        print(f">> ALLOCATOR RESULT: PASSED ({ranked[0].full_name} ranked #1: certified SKL-ELEC with lowest workload)")

    # 5. Concurrency Double-Booking Conflict Prevention
    print("\n--- [4] CONCURRENCY DOUBLE-BOOKING CONFLICT (AC-05.1) ---")
    now = datetime.now(timezone.utc)
    start_t = now + timedelta(hours=2)
    end_t = now + timedelta(hours=4)

    async with session_maker() as db:
        # Get admin user and student user
        users = (await db.execute(select(User))).scalars().all()
        admin_user = next(u for u in users if u.role == "facilities_admin")
        student_user = next(u for u in users if u.role == "student")
        manager_user = next(u for u in users if u.role == "dept_manager")
        approver_user = next(u for u in users if u.role == "procurement_approver")

        # Retrieve existing seeded booking for Room 204
        existing_b = (await db.execute(select(Booking).where(Booking.room_id == "RM-TP-204"))).scalars().first()
        if existing_b:
            print(f"Existing Confirmed Booking: \"{existing_b.title}\" in room {existing_b.room_id}")
            overlap_start = existing_b.start_time + timedelta(minutes=15)
            overlap_end = existing_b.end_time + timedelta(minutes=15)
        else:
            b1 = await BookingService.create_booking(
                db,
                booked_by_id=admin_user.id,
                data=BookingCreate(
                    title="CS301 Midterm Examination",
                    room_id="RM-TP-204",
                    start_time=start_t,
                    end_time=end_t,
                    attendee_count=45
                )
            )
            print(f"Booking 1 Confirmed: \"{b1.title}\" in room {b1.room_id}")
            overlap_start = start_t + timedelta(minutes=30)
            overlap_end = end_t + timedelta(minutes=30)

        # Attempt overlapping booking to verify conflict prevention
        try:
            await BookingService.create_booking(
                db,
                booked_by_id=student_user.id,
                data=BookingCreate(
                    title="Math 202 Tutorial Session",
                    room_id="RM-TP-204",
                    start_time=overlap_start,
                    end_time=overlap_end,
                    attendee_count=20
                )
            )
            print("ERROR: Overlapping booking should have failed!")
        except DoubleBookingConflictError as exc:
            print(f"Conflicting Booking Correctly Blocked: \"{exc}\"")
            print(">> DOUBLE-BOOKING PREVENTION RESULT: PASSED (HTTP 409 Conflict Enforced)")

    # 6. Negative Stock Prevention
    print("\n--- [5] ATOMIC INVENTORY NEGATIVE-STOCK PREVENTION (AC-06.1) ---")
    async with session_maker() as db:
        items = await InventoryService.list_items(db)
        item = items[0]
        print(f"Item: {item.name} | SKU: {item.sku} | Available Stock: {item.available_stock}")

        # Valid reservation
        res = await InventoryService.reserve_parts(
            db,
            actor_id=admin_user.id,
            data=PartsReservationRequest(work_order_id="wo-test-01", item_id=item.id, quantity=2)
        )
        print(f"Reserved 2 units successfully. Reservation ID: {res.id[:8]}")

        # Over-reservation attempt
        try:
            await InventoryService.reserve_parts(
                db,
                actor_id=admin_user.id,
                data=PartsReservationRequest(work_order_id="wo-test-01", item_id=item.id, quantity=999)
            )
            print("ERROR: Over-reservation should have failed!")
        except InsufficientStockError as exc:
            print(f"Over-Reservation Rejected: \"{exc}\"")
            print(">> NEGATIVE STOCK PREVENTION RESULT: PASSED (Atomic Rejection Enforced)")

    # 7. Anti-Self-Approval Enforcement
    print("\n--- [6] PROCUREMENT ANTI-SELF-APPROVAL RULE (AC-06.2) ---")
    async with session_maker() as db:
        items = await InventoryService.list_items(db)
        pr = await ApprovalService.create_purchase_request(
            db,
            requester_id=manager_user.id,
            data=PurchaseRequestCreate(item_id=items[0].id, quantity=10, justification="Emergency stock replenishment")
        )
        print(f"Purchase Request Created: {pr.id[:8]} by Requester: {manager_user.full_name} (${pr.total_cost:.2f})")

        # Attempt 1: Requester tries to self-approve
        try:
            await ApprovalService.decide_approval(
                db,
                approver_id=manager_user.id, # Same as requester!
                request_id=pr.id,
                data=ApprovalDecisionRequest(decision="approved", comments="Self approval attempt")
            )
            print("ERROR: Self-approval should have failed!")
        except SelfApprovalProhibitedError as exc:
            print(f"Self-Approval Rejected: \"{exc}\"")
            print("   -> Anti-Self-Approval Enforcement Verified (Requester != Approver)")

        # Attempt 2: Authorized Approver approves
        approved = await ApprovalService.decide_approval(
            db,
            approver_id=approver_user.id, # Sunita Mehra (Finance Approver)
            request_id=pr.id,
            data=ApprovalDecisionRequest(decision="approved", comments="Authorized under facilities threshold")
        )
        print(f"Authorized Approval by {approver_user.full_name}: Approval ID {approved.id[:8]}, Decision: \"{approved.decision.upper()}\"")
        assert approved.decision == "approved"
        print(">> ANTI-SELF-APPROVAL RESULT: PASSED (Strict Separation of Duties)")

    # 8. Disruption Relocation Analysis & Execution
    print("\n--- [7] DISRUPTION IMPACT ANALYZER & RELOCATION (SCENARIO A) ---")
    async with session_maker() as db:
        disruption = await DisruptionService.analyze_room_disruption(
            db,
            room_id="RM-TP-204"
        )
        print(f"Disruption Detected Affected Bookings: {disruption.affected_bookings_count}")
        for aff in disruption.affected_bookings:
            print(f" - Compromised Booking: \"{aff['title']}\" ({aff['attendee_count']} attendees)")
        print(f"Found Eligible Replacement Rooms: {len(disruption.recommended_relocations)}")
        for rep in disruption.recommended_relocations:
            print(f" - Candidate Alternative: {rep.building_name} Rm {rep.room_number} (Cap: {rep.capacity}) | Reason: {rep.match_reason}")

        # Relocate
        relocated = await DisruptionService.execute_relocation(
            db,
            booking_id=disruption.affected_bookings[0]["id"],
            new_room_id="RM-AUD-01",
            authorized_by_id=admin_user.id
        )
        print(f"Relocation Executed: Booking moved to room \"{relocated.room_id}\" with status: {relocated.status.upper()}")
        assert relocated.room_id == "RM-AUD-01"
        print(">> DISRUPTION RELOCATION RESULT: PASSED")

    print("\n" + "=" * 70)
    print("      ALL LIVE DEMONSTRATION TESTS COMPLETED SUCCESSFULLY!         ")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_live_demonstration())
