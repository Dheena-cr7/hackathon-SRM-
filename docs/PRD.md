# CAMPUSOPS — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Product Overview & Vision
**CampusOps** is an intelligent, zero-cost, open-source campus operations management platform engineered for universities, colleges, and educational institutions. It transforms unstructured campus complaints, emails, and events into coordinated, trackable workflows across facilities, academic scheduling, asset maintenance, inventory reserves, and executive oversight.

### Core Principle
> **AI understands. The backend validates. Deterministic workflows execute. Humans approve sensitive actions. The digital twin visualizes operational reality.**

---

## 2. Target User Personas & Roles

### 2.1 Student / Faculty
- **Responsibilities:** Report physical defects, classroom equipment failures, safety hazards, and schedule classroom/lab bookings.
- **Key Workflows:** Natural language incident reporting (chat/form), ticket tracking, booking requests, receiving disruption notices.
- **Security Boundaries:** Read-only on other users' tickets, cannot assign staff, cannot approve procurement.

### 2.2 Maintenance Technician
- **Responsibilities:** Perform physical repairs, service equipment, log spare parts usage, update work order states.
- **Key Workflows:** View assigned task queue, toggle work order state (In Progress -> Review), record resolution notes.
- **Security Boundaries:** Can modify only assigned work orders, cannot create purchase requests above threshold without approval.

### 2.3 Department Manager
- **Responsibilities:** Oversee department facilities, review staff workload, monitor SLA performance, approve minor operational overrides.
- **Key Workflows:** Departmental dashboard, SLA tracking, staff schedule oversight.

### 2.4 Facilities Administrator
- **Responsibilities:** Central campus logistics, technician assignment, room disruption management, emergency reallocations, 3D command center monitoring.
- **Key Workflows:** 3D digital twin command view, technician dispatch, building status management, room relocation execution.

### 2.5 Procurement Approver
- **Responsibilities:** Financial and inventory oversight, review purchase requests, approve expensive parts consumption.
- **Key Workflows:** Approval queue, budget impact view, vendor ordering authorization.
- **Security Boundaries:** Strict separation of duties: cannot approve requests they created (anti-self-approval rule).

### 2.6 System Administrator
- **Responsibilities:** User identity management, role allocation, system configuration, security audit trail inspection.
- **Key Workflows:** User provisioning, audit log exploration, environment health monitoring.

---

## 3. High-Priority Functional Modules

### 3.1 Multi-Channel Incident Intake & Layer 1 Deterministic AI
- **Inputs:** Structured form, interactive chat dialog, and simulated internal email inbox.
- **Extraction Engine:** Deterministic regex, keyword matching, and campus dictionary lookup.
- **Extracted Fields:**
  - Problem classification (Electrical, HVAC, Plumbing, IT/AV, Structural, Safety)
  - Location (Building ID, Floor, Room Number)
  - Asset/Equipment Tag (Projector, AC, Power Outlet, Router)
  - Urgency & Timing Constraints (e.g. "Lecture in 20 minutes")
  - Clarification triggers when mandatory fields are missing.

### 3.2 Dynamic Staff & Technician Allocation
- **Eligibility Engine:** Evaluates required skills, current shift, existing workload, and physical campus location.
- **Recommendation:** Deterministic ranking of eligible technicians with transparent explanations.
- **Reassignment Workflow:** Automatic detection when an assigned technician becomes unavailable, with one-click re-dispatch.

### 3.3 Concurrency-Safe Room Booking & Disruption Handling
- **Double-Booking Prevention:** Transaction-safe locking at the database level.
- **Disruption Propagation:** When an incident marks a room out of order:
  1. Identifies affected bookings and academic classes.
  2. Evaluates alternative rooms matching capacity and equipment requirements.
  3. Recommends relocation with facilities administrator authorization.
  4. Dispatches in-app notifications to instructors and students.

### 3.4 Concurrency-Safe Inventory & Anti-Self-Approval Procurement
- **Stock Management:** Multi-item inventory tracking with low-stock alerts.
- **Atomic Reservation:** Parts reservation attached to work orders with prevention of negative inventory.
- **Procurement Approvals:** Enforced separation of duties; approval requires re-validation of pricing, stock levels, and constraints at time of execution.

### 3.5 Real-Time Operational Digital Twin (3D & 2D)
- **Geometry Source:** Procedural generation from `data/campus.geojson` (OpenStreetMap ODbL derived).
- **Visualization:** Styled extruded 3D campus using React Three Fiber, Three.js, and drei.
- **Operational Integration:** Real-time building alert glow reflecting live incidents, work orders, and room disruptions.
- **2D Graceful Degradation:** Accessible SVG campus plan and data grid when WebGL is unavailable or low-graphics mode is enabled.

---

## 4. Mandatory Disruption Scenarios

### Scenario A: Classroom Electrical Failure Before Exam
1. User reports electrical spark/failure in Tech Park Room B204 30 minutes before a scheduled exam.
2. Layer 1 AI parses location, urgency, and equipment.
3. System alerts Facilities Admin of an active booking collision.
4. Engine discovers alternative available auditorium/hall (AUD-01 or TP-101) with matching capacity.
5. Facilities Admin confirms relocation; affected instructors notified; 3D building turns warning amber.
6. Technician with electrical certification is dispatched; necessary circuit breaker parts are reserved.

### Scenario B: Assigned Technician Unavailable
1. Assigned HVAC technician calls in sick or logs shift disruption.
2. System identifies pending high-priority work orders.
3. Allocation engine evaluates alternate certified technicians and current workload.
4. Facilities Admin approves reassignment; new technician receives push notification and parts list.
5. Work order status and 3D technician pin update immediately.

---

## 5. Non-Functional & Compliance Requirements
- **Zero-Cost Mandate:** 100% open-source software (MIT, Apache-2.0, BSD, ISC, CC0). Zero paid SaaS, zero API keys, zero cloud billing.
- **Offline Autonomy:** Operates fully without an internet connection after initial package setup.
- **Performance Targets:** 30+ FPS on reference integrated GPU for 3D campus; under 5 seconds to initial interactive scene; API response times < 200ms.
- **Data Integrity:** Strict relational foreign keys, unique indexes, and ACID transaction boundaries.
