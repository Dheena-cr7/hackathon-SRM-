"""
CampusOps — Deterministic Seed Data Generator
Populates the local database with verified demo records matching
GeoJSON coordinates and all required disruption scenarios.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from backend.app.core.database import AsyncSessionLocal, engine, Base
from backend.app.core.security import hash_password
from backend.app.models import (
    User, StaffProfile, Skill, Building, Room, Asset,
    InventoryItem, Booking, SLAPolicy
)

async def seed_database():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        res = await session.execute(select(User).limit(1))
        if res.scalar_one_or_none():
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Skills...")
        skills = {
            "elec": Skill(code="SKL-ELEC", name="Electrical Systems Specialist", category="electrical"),
            "hvac": Skill(code="SKL-HVAC", name="HVAC & Refrigeration Certified", category="hvac"),
            "plumb": Skill(code="SKL-PLUMB", name="Plumbing & Fluid Dynamics", category="plumbing"),
            "itav": Skill(code="SKL-ITAV", name="Audio/Visual & Networking", category="it_av"),
        }
        session.add_all(skills.values())
        await session.flush()

        print("Seeding Users & Staff Profiles...")
        # 1. Student
        student = User(
            email="student@campus.edu",
            hashed_password=hash_password("student123"),
            full_name="Aarav Patel",
            role="student",
            department="Computer Science"
        )
        # 2. Faculty
        faculty = User(
            email="faculty@campus.edu",
            hashed_password=hash_password("faculty123"),
            full_name="Prof. Sharma",
            role="faculty",
            department="Computer Science & Engineering"
        )
        # 3. Technician Rajesh (Electrical)
        tech_rajesh = User(
            email="tech.rajesh@campus.edu",
            hashed_password=hash_password("tech123"),
            full_name="Rajesh Kumar",
            role="technician",
            department="Facilities Electrical"
        )
        # 4. Technician Ananya (HVAC & Electrical)
        tech_ananya = User(
            email="tech.ananya@campus.edu",
            hashed_password=hash_password("tech123"),
            full_name="Ananya Verma",
            role="technician",
            department="Facilities Operations"
        )
        # 5. Department Manager
        manager = User(
            email="manager@campus.edu",
            hashed_password=hash_password("manager123"),
            full_name="Dr. Raman",
            role="dept_manager",
            department="Computer Science & Engineering"
        )
        # 6. Facilities Administrator
        admin_facilities = User(
            email="admin.facilities@campus.edu",
            hashed_password=hash_password("admin123"),
            full_name="Karthik R.",
            role="facilities_admin",
            department="Campus Operations"
        )
        # 7. Procurement Approver
        approver = User(
            email="approver.finance@campus.edu",
            hashed_password=hash_password("approver123"),
            full_name="Sunita Mehra",
            role="procurement_approver",
            department="Finance & Procurement"
        )
        # 8. System Administrator
        sysadmin = User(
            email="sysadmin@campus.edu",
            hashed_password=hash_password("sysadmin123"),
            full_name="DevOps Admin",
            role="system_admin",
            department="IT Infrastructure"
        )

        session.add_all([
            student, faculty, tech_rajesh, tech_ananya,
            manager, admin_facilities, approver, sysadmin
        ])
        await session.flush()

        # Link Staff Profiles
        profile_rajesh = StaffProfile(
            user_id=tech_rajesh.id,
            title="Senior Campus Electrician",
            shift_start="08:00",
            shift_end="17:00",
            is_on_duty=True,
            current_workload=0
        )
        profile_rajesh.skills.append(skills["elec"])

        profile_ananya = StaffProfile(
            user_id=tech_ananya.id,
            title="Senior Facilities Technician",
            shift_start="08:00",
            shift_end="18:00",
            is_on_duty=True,
            current_workload=0
        )
        profile_ananya.skills.extend([skills["hvac"], skills["elec"]])

        session.add_all([profile_rajesh, profile_ananya])
        await session.flush()

        print("Seeding Campus Buildings (Matching GeoJSON IDs)...")
        bld_tech = Building(
            id="BLD-TECH-01",
            name="Tech Park (Main Academic Block)",
            code="TP",
            building_type="academic",
            floors_count=6,
            height_meters=24.0,
            operational_status="normal"
        )
        bld_eng = Building(
            id="BLD-ENG-02",
            name="Mechanical & Civil Engineering Labs",
            code="MECH",
            building_type="laboratory",
            floors_count=4,
            height_meters=16.0,
            operational_status="normal"
        )
        bld_lib = Building(
            id="BLD-LIB-01",
            name="Central University Library",
            code="LIB",
            building_type="library",
            floors_count=3,
            height_meters=14.0,
            operational_status="normal"
        )
        bld_aud = Building(
            id="BLD-AUD-01",
            name="Dr. T.P. Ganesan Auditorium",
            code="AUD",
            building_type="auditorium",
            floors_count=2,
            height_meters=18.0,
            operational_status="normal"
        )
        bld_adm = Building(
            id="BLD-ADM-01",
            name="Administrative Headquarters",
            code="ADMIN",
            building_type="administrative",
            floors_count=4,
            height_meters=16.0,
            operational_status="normal"
        )
        bld_res = Building(
            id="BLD-RES-01",
            name="Student Hostel Complex (Block A)",
            code="HOSTEL-A",
            building_type="residential",
            floors_count=8,
            height_meters=28.0,
            operational_status="normal"
        )
        session.add_all([bld_tech, bld_eng, bld_lib, bld_aud, bld_adm, bld_res])
        await session.flush()

        print("Seeding Rooms & Assets...")
        # Tech Park Rooms
        rm_tp_204 = Room(
            id="RM-TP-204",
            building_id="BLD-TECH-01",
            room_number="B204",
            floor_number=2,
            room_type="lecture_hall",
            capacity=60,
            is_operational=True
        )
        rm_tp_101 = Room(
            id="RM-TP-101",
            building_id="BLD-TECH-01",
            room_number="101",
            floor_number=1,
            room_type="seminar",
            capacity=80,
            is_operational=True
        )
        # Auditorium
        rm_aud_01 = Room(
            id="RM-AUD-01",
            building_id="BLD-AUD-01",
            room_number="Main Hall",
            floor_number=1,
            room_type="auditorium",
            capacity=120,
            is_operational=True
        )
        # Mech Lab
        rm_mech_102 = Room(
            id="RM-MECH-102",
            building_id="BLD-ENG-02",
            room_number="102",
            floor_number=1,
            room_type="lab",
            capacity=40,
            is_operational=True
        )
        session.add_all([rm_tp_204, rm_tp_101, rm_aud_01, rm_mech_102])
        await session.flush()

        # Assets in Room B204
        ast_proj = Asset(
            id="AST-PROJ-001",
            room_id="RM-TP-204",
            asset_tag="AST-PROJ-B204",
            name="Epson 4K Laser Projector",
            category="it_av",
            status="operational"
        )
        ast_hvac = Asset(
            id="AST-HVAC-002",
            room_id="RM-TP-204",
            asset_tag="AST-HVAC-B204",
            name="Daikin Split AC 2.0 Ton",
            category="hvac",
            status="operational"
        )
        ast_brk = Asset(
            id="AST-BRK-003",
            room_id="RM-TP-204",
            asset_tag="AST-BRK-B204",
            name="Main Circuit Breaker Board",
            category="electrical",
            status="operational"
        )
        session.add_all([ast_proj, ast_hvac, ast_brk])

        print("Seeding Inventory...")
        inv_items = [
            InventoryItem(sku="SKU-BRK-30A", name="Schneider 30A Circuit Breaker", category="electrical", quantity_on_hand=15, reorder_threshold=5, unit_cost=45.0),
            InventoryItem(sku="SKU-PROJ-LAMP", name="Epson Laser Projector Lamp", category="av", quantity_on_hand=8, reorder_threshold=3, unit_cost=120.0),
            InventoryItem(sku="SKU-HVAC-VALVE", name="Daikin 2-Way Expansion Valve", category="hvac", quantity_on_hand=4, reorder_threshold=5, unit_cost=85.0),
            InventoryItem(sku="SKU-CAT6-CABLE", name="Cat6 Gigabit Ethernet Spool (100m)", category="hardware", quantity_on_hand=10, reorder_threshold=4, unit_cost=60.0),
        ]
        session.add_all(inv_items)

        print("Seeding Scheduled Examination Booking (Scenario A Target)...")
        now = datetime.now(timezone.utc)
        exam_start = now + timedelta(minutes=25)
        exam_end = exam_start + timedelta(hours=2)
        
        booking_exam = Booking(
            room_id="RM-TP-204",
            booked_by_id=faculty.id,
            title="CS301 Midterm Examination",
            activity_type="exam",
            start_time=exam_start,
            end_time=exam_end,
            attendee_count=55,
            status="confirmed"
        )
        session.add(booking_exam)

        print("Seeding SLA Policies...")
        sla_policies = [
            SLAPolicy(priority="critical", response_deadline_minutes=15, resolution_deadline_minutes=120),
            SLAPolicy(priority="high", response_deadline_minutes=30, resolution_deadline_minutes=240),
            SLAPolicy(priority="medium", response_deadline_minutes=60, resolution_deadline_minutes=480),
            SLAPolicy(priority="low", response_deadline_minutes=120, resolution_deadline_minutes=1440),
        ]
        session.add_all(sla_policies)

        await session.commit()
        print("\nSeed generation COMPLETED successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())

