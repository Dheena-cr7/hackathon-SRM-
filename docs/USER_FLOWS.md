# CAMPUSOPS — USER FLOWS & JOURNEYS SPECIFICATION

This document details the operational user flows across all six personas, detailing UI steps, backend validations, and state transitions.

---

## 1. Flow 1: Natural-Language Incident Reporting & Triage (Student / Faculty)

```mermaid
sequenceDiagram
    actor User as Student / Faculty
    participant Client as Frontend (Chat / Form)
    participant IntakeAPI as /api/v1/intake
    participant NLP as Layer 1 NLP Engine
    participant DB as Database
    participant Admin as Facilities Admin

    User->>Client: Types: "Projector in Room B204 is broken, lecture in 20 mins"
    Client->>IntakeAPI: POST /intake/analyze { text: ... }
    IntakeAPI->>NLP: Deterministic Extraction
    NLP-->>IntakeAPI: Category: IT/AV, Location: Tech Park B204, Asset: Projector, Urgency: High
    IntakeAPI-->>Client: Returns Preview & Extracted Entities
    User->>Client: Confirms / Edits Details & Submits
    Client->>IntakeAPI: POST /intake/submit { ... }
    IntakeAPI->>DB: Insert Incident (Status: Reported, Priority: High)
    IntakeAPI->>DB: Record Audit Log Entry
    IntakeAPI-->>Admin: WebSocket Alert: New High-Priority Incident
    IntakeAPI-->>Client: Returns Ticket #INC-2026-0001
```

---

## 2. Flow 2: Scenario A — Classroom Disruption & Re-allocation

```mermaid
sequenceDiagram
    actor Reporter as Faculty
    participant System as CampusOps Core
    participant Admin as Facilities Administrator
    actor Tech as Certified Electrician
    actor Students as Enrolled Students

    Reporter->>System: Reports: "Electrical failure & sparks in Room B204 before exam"
    System->>System: Layer 1 extracts Room B204, sparks (Critical)
    System->>System: Identifies affected booking: "CS301 Midterm Exam (60 students) at 10:00"
    System->>System: Searches available rooms with Capacity >= 60 & Audio/Electrical OK
    System->>System: Proposes: AUD-01 (Auditorium, Cap 120, Available)
    System-->>Admin: Disruption Alert + Relocation Recommendation
    Admin->>System: Approves relocation to AUD-01 & dispatches Work Order
    System->>System: Updates Booking: room_id=AUD-01, relocated_from=RM-TP-204
    System->>System: Updates Room RM-TP-204: is_operational=False
    System->>System: Updates 3D Digital Twin: Tech Park turns Alert Amber
    System-->>Students: In-App Notification: "Exam relocated to AUD-01"
    System-->>Tech: Dispatches Work Order + Reserves 30A Circuit Breaker
```

---

## 3. Flow 3: Scenario B — Technician Unavailability & Dynamic Reassignment

```mermaid
sequenceDiagram
    actor TechA as Technician A (HVAC)
    participant System as CampusOps Allocation Engine
    participant Admin as Facilities Administrator
    actor TechB as Technician B (HVAC Certified)

    TechA->>System: Reports shift disruption / illness
    System->>System: Identifies assigned active Work Orders for Tech A
    System->>System: Queries Staff Directory for active HVAC certified technicians
    System->>System: Calculates current workload & shift schedules
    System->>System: Ranks Tech B as optimal candidate (0 active orders, shift ends 18:00)
    System-->>Admin: Alert: "Tech A unavailable. Reassign WO-2026-0004 to Tech B?"
    Admin->>System: Confirms Reassignment with reason: "Staff illness"
    System->>System: Atomic update on Work Order: assigned_technician_id = Tech B
    System->>System: Audit log records reassignment reason and actor
    System-->>TechB: In-App Notification: "New Work Order WO-2026-0004 assigned"
    System-->>Admin: Dashboard workload counters updated
```

---

## 4. Flow 4: Concurrency-Safe Inventory Reservation & Procurement Approval

```mermaid
sequenceDiagram
    actor Tech as Technician
    participant InventoryAPI as /api/v1/inventory
    participant DB as Database
    actor Approver as Procurement Approver

    Tech->>InventoryAPI: POST /inventory/reserve { work_order_id, item_sku: "BRK-30A", qty: 2 }
    InventoryAPI->>DB: Atomic Reservation Query (quantity_on_hand - quantity_reserved >= 2)
    alt Stock Available
        DB-->>InventoryAPI: Reserved Successfully (quantity_reserved + 2)
        InventoryAPI-->>Tech: Reservation Confirmed
    else Stock Below Threshold
        DB-->>InventoryAPI: Stock Low / Insufficient
        InventoryAPI->>DB: Generate Purchase Request #PR-2026-0012
        InventoryAPI-->>Approver: In-App Notification: "Purchase Request requires sign-off"
        Approver->>InventoryAPI: POST /inventory/purchase-requests/12/approve
        Note over InventoryAPI,Approver: Enforces Anti-Self-Approval: approver_id != requester_id
        InventoryAPI->>DB: Revalidate Pricing & Constraints -> Mark Approved
        InventoryAPI-->>Tech: In-App Notification: "Purchase approved for replenishment"
    end
```
