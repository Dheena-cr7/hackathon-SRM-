# CAMPUSOPS — REST & REALTIME API SPECIFICATION

In compliance with the ingested [`api-design-principles`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/api-design-principles/SKILL.md) skill, all CampusOps endpoints follow predictable RESTful conventions, consistent JSON envelope schemas, RFC-7807 error responses, and token-based authentication.

---

## 1. Global API Conventions
- **Base URL:** `/api/v1`
- **Authentication:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Content-Type:** `application/json` (except multipart intake uploads)
- **Standard Response Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "metadata": {
      "timestamp": "2026-10-30T10:00:00Z",
      "version": "1.0.0"
    }
  }
  ```
- **Standard Error Envelope (RFC-7807 inspired):**
  ```json
  {
    "success": false,
    "error": {
      "code": "DOUBLE_BOOKING_CONFLICT",
      "message": "Room TP-204 is already reserved between 10:00 and 11:30.",
      "details": { "conflicting_booking_id": "b-9912" }
    }
  }
  ```

---

## 2. API Endpoints by Domain

### 2.1 Identity & Access (`/api/v1/auth`)
- `POST /auth/token` — Exchange email & password for JWT access token.
- `GET /auth/me` — Retrieve current authenticated user profile & role permissions.
- `POST /auth/refresh` — Refresh expired access token.

### 2.2 Campus Directory & Spatial Data (`/api/v1/campus`)
- `GET /campus/buildings` — List all campus buildings with real-time operational status.
- `GET /campus/buildings/{id}` — Retrieve detailed building record, floors, and rooms.
- `GET /campus/geojson` — Serve validated `data/campus.geojson` for the 3D twin.
- `GET /campus/rooms` — Search rooms with filters (`building_id`, `capacity`, `equipment`).

### 2.3 Incident Intake & Layer 1 NLP (`/api/v1/intake`)
- `POST /intake/analyze` — Parse raw natural-language report text through Layer 1 deterministic extractor without persisting. Returns extracted entities & clarification questions.
- `POST /intake/submit` — Submit structured or natural language incident. Validates against campus directory and creates persistent incident.
- `POST /intake/simulated-email` — Ingest simulated incoming email for parsing and ticket creation.

### 2.4 Incident Lifecycle (`/api/v1/incidents`)
- `GET /incidents` — List incidents (filters: `status`, `priority`, `building_id`, `reporter_id`).
- `GET /incidents/{id}` — Retrieve full incident details, raw intake, history, and correlated tickets.
- `PATCH /incidents/{id}/status` — Transition incident status (Triage, In Progress, Resolved).
- `POST /incidents/{id}/correlate` — Suggest or link related/duplicate incidents.

### 2.5 Work Orders & Allocation (`/api/v1/work-orders`)
- `GET /work-orders` — List work orders with filter by technician or status.
- `POST /work-orders` — Create work order from incident.
- `GET /work-orders/technician-recommendations/{incident_id}` — Deterministic ranking of eligible technicians based on skill, shift, workload, and location.
- `POST /work-orders/{id}/assign` — Assign or reassign technician with logged reason.
- `PATCH /work-orders/{id}/transition` — State machine step (Assigned -> InProgress -> Verification -> Completed).

### 2.6 Room Bookings & Disruption Management (`/api/v1/bookings`)
- `GET /bookings` — List bookings for a date range and room.
- `POST /bookings` — Create room reservation with atomic double-booking prevention.
- `GET /bookings/disruption-impact/{room_id}` — Analyze classes and bookings affected when a room goes out of order.
- `POST /bookings/{id}/relocate` — Authorized relocation to an alternative room with notifications.

### 2.7 Inventory & Procurement (`/api/v1/inventory`)
- `GET /inventory/items` — List spare parts and current quantities on hand / reserved.
- `POST /inventory/reserve` — Atomic parts reservation for a work order.
- `POST /inventory/purchase-requests` — Create new purchase request for low stock.
- `POST /inventory/purchase-requests/{id}/approve` — Approve purchase request (strictly enforces anti-self-approval).

### 2.8 SLA & Analytics (`/api/v1/analytics`)
- `GET /analytics/overview` — High-level campus operational metrics (open tickets, avg resolution time, SLA compliance rate).
- `GET /analytics/building-breakdown` — Incidents and work orders grouped by building.
- `GET /analytics/sla-breaches` — Active and historical SLA warnings and escalations.

### 2.9 Realtime WebSocket Stream (`/api/v1/ws`)
- `WS /ws` — Bidirectional WebSocket connection broadcasting:
  - `INCIDENT_CREATED`, `INCIDENT_UPDATED`
  - `ROOM_DISRUPTED`, `BOOKING_RELOCATED`
  - `BUILDING_STATUS_CHANGED`
  - `NOTIFICATION_DISPATCHED`
