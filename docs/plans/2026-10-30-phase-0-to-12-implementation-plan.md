# CampusOps Zero-Cost Intelligent Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a zero-cost, fully offline, intelligent campus operations platform unifying incident triage, maintenance, room booking, inventory reservation, approval workflows, and a 3D digital twin.

**Architecture:** A modular monolith following Clean Architecture and Domain-Driven Design (DDD). Domain business rules and Layer 1 deterministic NLP are completely decoupled from delivery frameworks, backed by a dual-engine async SQLAlchemy database (SQLite/PostgreSQL) and a Next.js 15 React Three Fiber frontend.

**Tech Stack:** Python 3.14+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Three.js, React Three Fiber, Pytest, Playwright.

---

## Phased Roadmap Overview

```
Phase 0: Inspection & Skills [COMPLETED]
   │
Phase 1: Architecture & Specifications [COMPLETED]
   │
Phase 2: Zero-Cost Audit & Data Foundation
   │
Phase 3: Core Foundation (Auth, RBAC, Directory)
   │
Phase 4: Incident Intake & Layer 1 Deterministic AI
   │
Phase 5: Work Orders & Staff Allocation Engine
   │
Phase 6: Room Bookings & Disruption Impact Analysis
   │
Phase 7: Concurrency-Safe Inventory & Anti-Self-Approval
   │
Phase 8: SLA Engine, In-App Notifications & Audit
   │
Phase 9: Realtime 3D Command View & 2D Fallback
   │
Phase 10: Mandatory Disruption Scenarios A & B
   │
Phase 11: Local Intelligence Enhancements (Optional Embeddings)
   │
Phase 12: Final Audits, Performance Benchmarks & Demo Polish
```

---

## Phase 2: Zero-Cost Audit & Data Foundation

### Task 2.1: Verify Software Licenses & Offline Dependencies
**Files:**
- Modify: `docs/LICENSES.md`
- Create: `scripts/verify_licenses.py`
**Step 1:** Write a python script to scan backend and frontend dependency files against permitted licenses (MIT, Apache-2.0, BSD, ISC, CC0).
**Step 2:** Run: `python scripts/verify_licenses.py`
**Expected:** Validates 0 prohibited licenses detected.
**Step 3:** Commit: `git commit -m "chore: add automated license verification script"`

### Task 2.2: Establish Local Seed Data Generator
**Files:**
- Create: `data/seed_data.json`
- Create: `scripts/seed_generator.py`
**Step 1:** Write `scripts/seed_generator.py` to produce deterministic fictional campus data (Users for all 6 roles, Tech Park, Mech Labs, Library, Auditorium, Hostel, Assets, Skills, Inventory).
**Step 2:** Run: `python scripts/seed_generator.py`
**Expected:** Generates `data/seed_data.json` linking GeoJSON building IDs (`BLD-TECH-01`, etc.) to database entities.
**Step 3:** Commit: `git commit -m "feat: add deterministic local seed data generator"`

---

## Phase 3: Core Foundation (Auth, RBAC, Campus Directory)

### Task 3.1: Backend Project Scaffolding & Virtual Environment
**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
**Step 1:** Define pinned dependency versions matching our license audit.
**Step 2:** Implement async session factory supporting both SQLite (`aiosqlite`) and PostgreSQL (`asyncpg`).
**Step 3:** Run: `python -m pytest tests/`
**Expected:** App boots and health check returns `{"status": "ok"}`.
**Step 4:** Commit: `git commit -m "feat(backend): scaffold FastAPI application and async database engine"`

### Task 3.2: Domain Models & Database Migration
**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/campus.py`
- Create: `backend/app/models/incident.py`
- Create: `backend/app/models/work_order.py`
- Create: `backend/app/models/booking.py`
- Create: `backend/app/models/inventory.py`
- Create: `backend/app/models/audit.py`
**Step 1:** Write SQLAlchemy 2.0 declarative models with foreign keys and check constraints.
**Step 2:** Run migration / table creation script.
**Expected:** Tables created without errors.
**Step 3:** Commit: `git commit -m "feat(database): implement complete relational domain models"`

### Task 3.3: Authentication & Role-Based Access Control (RBAC)
**Files:**
- Create: `backend/app/domain/identity/service.py`
- Create: `backend/app/api/v1/auth.py`
- Test: `tests/api/test_auth_rbac.py`
**Step 1: Write failing test** verifying that Students cannot access admin endpoints (`HTTP 403`).
**Step 2: Run test:** `pytest tests/api/test_auth_rbac.py` -> FAILS.
**Step 3: Implement minimal JWT auth & `require_roles` dependency.**
**Step 4: Run test:** `pytest tests/api/test_auth_rbac.py` -> PASSES.
**Step 5: Commit:** `git commit -m "feat(auth): implement JWT authentication and 6-role RBAC"`

---

## Phase 4: Incident Intake & Layer 1 Deterministic AI

### Task 4.1: Deterministic NLP Extractor
**Files:**
- Create: `backend/app/domain/intake/nlp_extractor.py`
- Test: `tests/unit/test_nlp_extractor.py`
**Step 1: Write failing test** asserting extraction of `"The projector in Room B204 is broken, lecture in 20 minutes"`.
**Step 2: Run test:** `pytest tests/unit/test_nlp_extractor.py` -> FAILS.
**Step 3: Implement keyword, regex, and dictionary extraction.**
**Step 4: Run test:** `pytest tests/unit/test_nlp_extractor.py` -> PASSES.
**Step 5: Commit:** `git commit -m "feat(ai): implement Layer 1 deterministic NLP extractor"`

### Task 4.2: Incident Intake API Endpoints
**Files:**
- Create: `backend/app/api/v1/intake.py`
- Create: `backend/app/domain/incidents/service.py`
- Test: `tests/api/test_intake.py`
**Step 1: Write failing test** for chat, form, and simulated email submission.
**Step 2: Implement endpoints with directory validation.**
**Step 3: Run test:** `pytest tests/api/test_intake.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(intake): implement multi-channel intake and ticket creation"`

---

## Phase 5: Work Orders & Staff Allocation Engine

### Task 5.1: Work Order State Machine
**Files:**
- Create: `backend/app/domain/work_orders/state_machine.py`
- Test: `tests/unit/test_work_orders.py`
**Step 1: Write failing test** ensuring invalid transitions (e.g. Created -> Completed) raise validation error.
**Step 2: Implement state transition graph.**
**Step 3: Run test:** `pytest tests/unit/test_work_orders.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(work-orders): implement validated state machine"`

### Task 5.2: Deterministic Staff & Technician Allocator
**Files:**
- Create: `backend/app/domain/staff/allocator.py`
- Test: `tests/unit/test_staff_allocator.py`
**Step 1: Write failing test** asserting technician matching by certification, shift, and lowest workload.
**Step 2: Implement ranking algorithm with explanation.**
**Step 3: Run test:** `pytest tests/unit/test_staff_allocator.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(staff): implement explainable technician allocation engine"`

---

## Phase 6: Room Bookings & Disruption Impact Analysis

### Task 6.1: Concurrency-Safe Room Booking
**Files:**
- Create: `backend/app/domain/bookings/service.py`
- Test: `tests/api/test_bookings_concurrency.py`
**Step 1: Write failing test** for concurrent overlapping booking requests.
**Step 2: Implement database locking / conflict validation.**
**Step 3: Run test:** `pytest tests/api/test_bookings_concurrency.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(bookings): prevent double-booking with atomic conflict checks"`

### Task 6.2: Disruption Impact Analyzer & Room Relocator
**Files:**
- Create: `backend/app/domain/bookings/disruption_service.py`
- Test: `tests/api/test_disruption_impact.py`
**Step 1: Write failing test** for identifying affected bookings when a room fails.
**Step 2: Implement alternative room recommendation based on capacity and equipment.**
**Step 3: Run test:** `pytest tests/api/test_disruption_impact.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(bookings): implement classroom disruption impact and relocation"`

---

## Phase 7: Inventory & Procurement (Anti-Self-Approval)

### Task 7.1: Concurrency-Safe Inventory Reservations
**Files:**
- Create: `backend/app/domain/inventory/service.py`
- Test: `tests/api/test_inventory_concurrency.py`
**Step 1: Write failing test** attempting to reserve more parts than available stock.
**Step 2: Implement atomic reservation with check constraints.**
**Step 3: Run test:** `pytest tests/api/test_inventory_concurrency.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(inventory): implement atomic parts reservation"`

### Task 7.2: Purchase Approval Workflow with Anti-Self-Approval
**Files:**
- Create: `backend/app/domain/approvals/service.py`
- Test: `tests/api/test_procurement_approvals.py`
**Step 1: Write failing test** verifying self-approval returns `HTTP 403`.
**Step 2: Implement approval queue and constraint revalidation.**
**Step 3: Run test:** `pytest tests/api/test_procurement_approvals.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(procurement): enforce anti-self-approval and purchase workflow"`

---

## Phase 8: SLA Engine, In-App Notifications & Audit

### Task 8.1: Priority-Based SLA Timers & Escalation
**Files:**
- Create: `backend/app/domain/sla/service.py`
- Test: `tests/unit/test_sla_engine.py`
**Step 1: Write failing test** verifying high-priority SLA response targets.
**Step 2: Implement SLA calculation and warning dispatch.**
**Step 3: Run test:** `pytest tests/unit/test_sla_engine.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(sla): implement priority-based SLA monitoring"`

### Task 8.2: In-App Notifications & Tamper-Evident Audit Logging
**Files:**
- Create: `backend/app/domain/notifications/service.py`
- Create: `backend/app/domain/audit/service.py`
- Test: `tests/api/test_notifications_audit.py`
**Step 1: Write failing test** ensuring lifecycle events create user notifications and audit logs.
**Step 2: Implement notification and audit persistence.**
**Step 3: Run test:** `pytest tests/api/test_notifications_audit.py` -> PASSES.
**Step 4: Commit:** `git commit -m "feat(audit): implement notification system and audit trails"`

---

## Phase 9: Realtime 3D Command View & 2D Fallback

### Task 9.1: Frontend Application Shell & Role Dashboards
**Files:**
- Create: `frontend/package.json`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/nav.tsx`
**Step 1: Setup Next.js 15 App Router with Tailwind CSS.**
**Step 2: Implement role selector and accessible responsive navigation.**
**Step 3: Run:** `npm run build` in frontend.
**Step 4: Commit:** `git commit -m "feat(frontend): scaffold Next.js App Router shell and navigation"`

### Task 9.2: Three.js / React Three Fiber Procedural Digital Twin
**Files:**
- Create: `frontend/components/digital-twin/scene.tsx`
- Create: `frontend/components/digital-twin/building-mesh.tsx`
- Create: `frontend/components/digital-twin/hud-panel.tsx`
- Create: `frontend/components/digital-twin/fallback-2d.tsx`
**Step 1: Implement GeoJSON parser and polygon extrusions.**
**Step 2: Bind building colors to real-time incident status.**
**Step 3: Implement WebGL detection and 2D SVG fallback.**
**Step 4: Verify rendering and load time.**
**Step 5: Commit:** `git commit -m "feat(3d): implement procedural campus digital twin and 2D fallback"`

---

## Phase 10: Mandatory Disruption Scenarios A & B

### Task 10.1: Scenario A Automated Test Suite & UI Flow
**Files:**
- Create: `tests/scenarios/test_scenario_a.py`
**Step 1: Write complete end-to-end test** simulating electrical failure in Room B204, exam collision detection, relocation to AUD-01, electrician dispatch, and breaker reservation.
**Step 2: Run test:** `pytest tests/scenarios/test_scenario_a.py -v` -> PASSES.
**Step 3: Commit:** `git commit -m "test(scenarios): implement end-to-end test for Scenario A"`

### Task 10.2: Scenario B Automated Test Suite & UI Flow
**Files:**
- Create: `tests/scenarios/test_scenario_b.py`
**Step 1: Write complete end-to-end test** simulating technician unavailability, work order detection, candidate ranking, admin reassignment, and audit logging.
**Step 2: Run test:** `pytest tests/scenarios/test_scenario_b.py -v` -> PASSES.
**Step 3: Commit:** `git commit -m "test(scenarios): implement end-to-end test for Scenario B"`

---

## Phase 11: Optional Intelligence (Local Embeddings)

### Task 11.1: Local Sentence Embeddings for Ticket Clustering
**Files:**
- Create: `backend/app/domain/intake/similarity_service.py`
- Test: `tests/unit/test_similarity.py`
**Step 1: Implement in-memory cosine similarity.**
**Step 2: Test duplicate ticket suggestion.**
**Step 3: Commit:** `git commit -m "feat(ai): add optional local embedding similarity clustering"`

---

## Phase 12: Final Validation & Hackathon Verification

### Task 12.1: Full Regression & Compliance Audit
**Step 1: Run complete backend test suite:** `pytest -v`
**Step 2: Run license verification:** `python scripts/verify_licenses.py`
**Step 3: Run offline boot test.**
**Step 4: Prepare final evaluation report.**
**Step 5: Commit:** `git commit -m "docs: finalize project documentation and hackathon submission"`
