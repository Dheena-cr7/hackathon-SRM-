# CAMPUSOPS — FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS

## 1. Functional Requirements (FR)

- **FR-01 (Multi-Channel Intake):** Support structured form, chat intake, and simulated internal email ingestion.
- **FR-02 (Deterministic NLP Extraction):** Extract issue, category, building, room, asset, and urgency without cloud LLMs.
- **FR-03 (Missing Field Clarification):** Query user when crucial operational details are omitted.
- **FR-04 (Incident Lifecycle Management):** Track status, severity, category, reporter, assigned staff, and resolution.
- **FR-05 (Deterministic Staff Recommendation):** Suggest technicians based on certifications, shift, and workload.
- **FR-06 (Work Order State Transitions):** Enforce strict state machine (Assigned -> InProgress -> Verified -> Closed).
- **FR-07 (Room Booking & Conflict Prevention):** Prevent double-booking using database constraints and locks.
- **FR-08 (Disruption Relocation):** Auto-identify affected bookings when rooms fail and recommend alternative spaces.
- **FR-09 (Concurrency-Safe Inventory):** Support parts reservation, movement logs, and prevent negative stock.
- **FR-10 (Anti-Self-Approval Procurement):** Route purchase requests to separate approvers; prevent self-approval.
- **FR-11 (SLA Tracking & Escalation):** Enforce priority-based deadlines and alert managers when deadlines near.
- **FR-12 (In-App Notification Dispatch):** Deliver real-time notifications for status changes and relocations.
- **FR-13 (Operational Analytics):** Calculate real-time metrics on open incidents, mean time to resolve, and SLA compliance.
- **FR-14 (3D Procedural Digital Twin):** Render campus footprints from `data/campus.geojson` with building status glow.
- **FR-15 (Interactive 3D HUD & Floor Exploder):** Provide building inspection, incident markers, and floor levels.
- **FR-16 (Accessible 2D Fallback):** Fall back to SVG site plan when WebGL is absent or low-graphics mode is chosen.
- **FR-17 (Scenario A Execution):** Classroom electrical failure, exam relocation, technician dispatch.
- **FR-18 (Scenario B Execution):** Assigned technician unavailability and dynamic reassignment.

---

## 2. Non-Functional Requirements (NFR)

- **NFR-01 (Zero Cost):** 100% open-source software; zero API keys, zero cloud billing.
- **NFR-02 (Offline Capability):** Complete functionality without internet access after setup.
- **NFR-03 (Rendering Performance):** Target 30+ FPS and < 5.0s load time for 3D campus twin.
- **NFR-04 (API Latency):** Core endpoints respond within 200ms under standard local load.
- **NFR-05 (Data Integrity):** Foreign keys, check constraints, and atomic transactions.
- **NFR-06 (Auditing):** Tamper-evident logging of all state mutations.
