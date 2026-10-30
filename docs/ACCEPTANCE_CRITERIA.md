# CAMPUSOPS — ACCEPTANCE CRITERIA SPECIFICATION

This document details testable conditions for every core module and development phase in CampusOps.

---

## 1. Zero-Cost & Compliance Criteria
- [ ] **AC-01.1 (Licensing):** All direct dependencies in `package.json` and Python requirements match the allowlist (MIT, Apache-2.0, BSD, ISC, CC0) and are recorded in `docs/LICENSES.md`.
- [ ] **AC-01.2 (Attribution):** OpenStreetMap dataset is attributed as "© OpenStreetMap contributors" with ODbL reference on both UI footer and docs.
- [ ] **AC-01.3 (Zero Paid Services):** Project builds and runs without any API key or billing account. Zero references to paid hosted services.
- [ ] **AC-01.4 (Offline Autonomy):** After initial `pip install` and `npm install`, application boots and executes without an active internet connection.

---

## 2. Authentication & RBAC Criteria
- [ ] **AC-02.1 (Role Gating):** Six distinct roles (Student/Faculty, Technician, Dept Manager, Facilities Admin, Procurement Approver, System Admin) strictly enforced by backend routes.
- [ ] **AC-02.2 (Unauthorized Rejection):** Attempt by a Student to access admin routes (e.g. `/api/v1/work-orders/assign`) returns `HTTP 403 Forbidden`.
- [ ] **AC-02.3 (Password Security):** Passwords hashed via PBKDF2/bcrypt; plaintext passwords never logged or persisted.

---

## 3. Incident Intake & Layer 1 Deterministic AI Criteria
- [ ] **AC-03.1 (Offline Extraction):** Processing `"The projector in Room B204 is broken, lecture in 20 minutes"` accurately extracts:
  - Category: `it_av`
  - Location: `BLD-TECH-01`, Room `RM-TP-204`
  - Asset: Projector
  - Urgency: `high` or `critical`
  - Time constraint: `< 30 minutes`
- [ ] **AC-03.2 (Zero Hallucination):** Unrecognized building/room names are not silently invented; flagged as unverified.
- [ ] **AC-03.3 (Clarification):** Missing mandatory location produces a targeted clarification question.

---

## 4. Work Orders & Technician Allocation Criteria
- [ ] **AC-04.1 (State Machine):** Work order status transitions follow `Created -> Assigned -> InProgress -> PendingVerification -> Completed`. Invalid jumps (e.g. `Created -> Completed`) return `HTTP 400 Bad Request`.
- [ ] **AC-04.2 (Skill & Shift Filtering):** Recommendation engine filters out technicians who lack the required skill certification or who are off-shift.
- [ ] **AC-04.3 (Reassignment Traceability):** Reassigning a technician updates workload counters and creates an immutable entry in `audit_logs` with reason.

---

## 5. Room Bookings & Disruption Criteria
- [ ] **AC-05.1 (Double-Booking Prevention):** Two concurrent reservation requests for the same room and overlapping timespan result in exactly one success and one `HTTP 409 Conflict`.
- [ ] **AC-05.2 (Disruption Propagation):** Marking a room unserviceable detects all conflicting future bookings on that day and generates relocation proposals matching capacity.

---

## 6. Inventory & Procurement Criteria
- [ ] **AC-06.1 (No Negative Stock):** Reserving 10 units of an item with only 5 units in stock is rejected with an insufficient stock error; stock count remains 5.
- [ ] **AC-06.2 (Anti-Self-Approval):** An approver attempting to approve their own purchase request receives `HTTP 403 Forbidden` (`SELF_APPROVAL_PROHIBITED`).

---

## 7. 3D Digital Twin & 2D Fallback Criteria
- [ ] **AC-07.1 (Procedural Render):** 3D campus renders extruded buildings from `data/campus.geojson` without fetching remote basemaps.
- [ ] **AC-07.2 (Operational State):** Active incidents dynamically alter the corresponding building's color/glow in real time.
- [ ] **AC-07.3 (2D Fallback):** When WebGL is disabled or unavailable, an accessible SVG site plan is automatically displayed with identical operational indicators.
- [ ] **AC-07.4 (Performance Target):** 3D view maintains >= 30 FPS on integrated GPUs and achieves initial interactive render in < 5.0 seconds.

---

## 8. End-to-End Scenarios Criteria
- [ ] **AC-08.1 (Scenario A):** Electrical spark in Room B204 before exam triggers extraction, incident creation, booking collision detection, relocation proposal to AUD-01, admin approval, and in-app notification.
- [ ] **AC-08.2 (Scenario B):** Technician unavailability triggers active work order detection, ranking of alternate certified technicians, admin confirmation, and notification delivery.
