# CAMPUSOPS — REQUIREMENT-TO-TEST TRACEABILITY MATRIX

This matrix maps every functional and non-functional requirement to its designated test suite and verification method.

| Req ID | Requirement Description | Verification Level | Target Test File / Script | Passing Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Multi-channel intake (Form, Chat, Email) | Integration / API | `tests/api/test_intake.py` | HTTP 200/201 on all 3 payload structures |
| **FR-02** | Layer 1 Deterministic NLP extraction | Unit / Logic | `tests/unit/test_nlp_extractor.py` | Accurate extraction without network or external model |
| **FR-03** | Missing field clarification questions | Unit | `tests/unit/test_nlp_extractor.py` | Generates clarification when room or location omitted |
| **FR-04** | Incident lifecycle transitions | Integration | `tests/api/test_incidents.py` | Status moves through valid state machine only |
| **FR-05** | Deterministic technician recommendation | Unit / Service | `tests/unit/test_technician_allocator.py` | Matches certified technicians; ranks by workload |
| **FR-06** | Work order state machine | Unit / Service | `tests/unit/test_work_order_state_machine.py`| Rejects invalid state jumps with HTTP 400 |
| **FR-07** | Room booking & double-booking prevention| Concurrency / DB | `tests/api/test_bookings_concurrency.py` | 1 success, 1 conflict on overlapping requests |
| **FR-08** | Classroom disruption impact & relocation | Integration | `tests/api/test_disruption_impact.py` | Detects affected classes; suggests eligible spaces |
| **FR-09** | Concurrency-safe inventory reservations | Concurrency / DB | `tests/api/test_inventory_concurrency.py` | Negative stock strictly prohibited |
| **FR-10** | Anti-self-approval in procurement | Unit / Auth | `tests/api/test_procurement_approvals.py` | HTTP 403 when approver_id == requester_id |
| **FR-11** | SLA monitoring & deadline warnings | Unit / Timer | `tests/unit/test_sla_engine.py` | Deadlines calculated correctly by priority |
| **FR-12** | In-app notifications dispatch | Integration | `tests/api/test_notifications.py` | Notifications created on lifecycle events |
| **FR-13** | Operational analytics calculation | Integration | `tests/api/test_analytics.py` | Metrics calculated accurately from DB records |
| **FR-14** | 3D procedural campus generation | Frontend / Unit | `frontend/tests/digital_twin.test.tsx` | Extrudes GeoJSON polygons; sets status colors |
| **FR-15** | Interactive HUD & floor exploded view | Frontend / E2E | `tests/e2e/test_digital_twin.spec.ts` | Building click opens HUD; slider adjusts height |
| **FR-16** | 2D accessible fallback | Frontend / A11y | `frontend/tests/fallback_2d.test.tsx` | SVG site plan renders when WebGL is absent |
| **FR-17** | Mandatory Disruption Scenario A | End-to-End | `tests/scenarios/test_scenario_a.py` | Complete electrical failure to exam relocation flow |
| **FR-18** | Mandatory Disruption Scenario B | End-to-End | `tests/scenarios/test_scenario_b.py` | Complete technician unavailability & reassignment flow |
| **NFR-01**| Zero-cost dependency audit | Compliance | `scripts/license_auditor.py` | All dependencies MIT/Apache/BSD/ISC/CC0 |
| **NFR-02**| Offline runtime execution | Network sandbox | `tests/offline/test_offline_boot.py` | App boots & tests pass with socket block enabled |
| **NFR-03**| 3D framerate & load performance | Benchmark | Browser performance audit | >= 30 FPS, load time < 5.0 seconds |
