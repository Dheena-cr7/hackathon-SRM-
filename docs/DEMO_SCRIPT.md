# CAMPUSOPS — HACKATHON LIVE DEMO SCRIPT

This script provides an exact, step-by-step walkthrough to demonstrate CampusOps to hackathon judges.

---

## 1. Demo Setup & Zero-Cost Offline Launch
1. Ensure the backend and frontend are running locally:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`
2. Point out to judges:
   - **Zero paid services:** No external API keys, zero cloud billing.
   - **Full offline execution:** Running on local machine without external CDN or hosted LLM.
   - **Procedural 3D Digital Twin:** OpenStreetMap building footprints rendered via Three.js.

---

## 2. Walkthrough: Scenario A — Classroom Electrical Failure Before Exam

| Step | Action on UI | Underlying System Operation | Expected Judge Wow-Factor |
| :---: | :--- | :--- | :--- |
| **1** | Open `/intake/chat` as **Faculty Member (Prof. Sharma)**. Type: *"There is a sparking circuit breaker in Tech Park Room B204. We have a midterm exam starting in 30 minutes!"* | Layer 1 Deterministic NLP extracts: Category=Electrical, Building=Tech Park, Room=B204, Urgency=Critical, Constraint=<30 mins. | Instant structured breakdown without any external LLM call or cost. |
| **2** | Review the preview card showing extracted details and click **"Submit Incident"**. | Incident `INC-2026-0001` created in database. Disruption engine flags collision with `CS301 Midterm Exam` (60 students). | Immediate detection that an academic exam is threatened by this defect. |
| **3** | Switch tab to **Facilities Administrator Dashboard** (`/admin/command-center`). | Real-time WebSocket event received. 3D Digital Twin pulses **Tech Park in warning amber**. | Operational reality visualized on the 3D twin in real time. |
| **4** | Click on the Tech Park 3D building to open HUD. Click **"Disruption Alert: Room B204"**. | Engine shows: Room B204 Out of Order. Evaluates campus directory: proposes **AUD-01 (Auditorium, Capacity 120, Available)**. | Explainable AI recommendation: matches exam capacity & equipment. |
| **5** | Click **"Authorize Relocation to AUD-01"**. | Updates booking transactionally. Room B204 locked. In-app notifications sent to instructors and enrolled students. | Solves the crisis in 2 clicks with zero human panic. |
| **6** | Click **"Dispatch Electrician"**. | Work Order created. Engine filters staff for `Electrical Certified` and available shift. Dispatches **Technician Rajesh**. Circuit breaker reserved from inventory. | Connected operations: maintenance, inventory, and academics aligned. |

---

## 3. Walkthrough: Scenario B — Assigned Technician Becomes Unavailable

| Step | Action on UI | Underlying System Operation | Expected Judge Wow-Factor |
| :---: | :--- | :--- | :--- |
| **1** | Open `/technician` as **Technician Rajesh**. Click **"Report Shift Interruption / Sickness"**. | Shift updated to inactive. Engine identifies active assigned Work Order `WO-2026-0001`. | Automated cascading detection of operational gaps. |
| **2** | Switch to **Facilities Admin** view. High-priority toast notification appears: *"Assigned technician unavailable for WO-2026-0001"*. | Allocation engine evaluates remaining on-duty certified electricians and workload counts. | No lost tickets in email threads. |
| **3** | Click **"Review Reassignment"**. The system recommends **Technician Ananya** (Workload: 0 active orders, shift ends 18:00). | Deterministic ranking with transparent explanation. | Explains *why* Ananya was chosen over others. |
| **4** | Click **"Confirm Reassignment"**. | Atomic update to work order. Immutable audit log entry created. | Complete audit trail for compliance. |

---

## 4. Key Takeaway for Evaluators
> **"CampusOps is not just another ticketing dashboard. It is an operational nervous system that understands what an incident breaks across the campus, prevents double-booking, reserves spare parts, and coordinates the entire institutional response in real time—at zero cost."**
