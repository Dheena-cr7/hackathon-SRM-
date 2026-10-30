# CAMPUSOPS — EVENT CATALOG & WORKFLOW SPECIFICATION

CampusOps employs an asynchronous, in-memory domain event bus to coordinate decoupled workflows across bounded contexts without incurring external message broker overhead.

---

## 1. Domain Events Catalog

### 1.1 Incident Events

| Event Name | Trigger Condition | Published Payload Attributes | Downstream Subscribed Handlers |
| :--- | :--- | :--- | :--- |
| `IncidentCreated` | New report submitted via form, chat, or email | `incident_id`, `reporter_id`, `building_id`, `room_id`, `priority`, `category` | - SLA timer initialization<br>- Facilities Admin notification<br>- Booking disruption evaluation |
| `IncidentClassified` | Layer 1 extraction completes | `incident_id`, `category`, `asset_id`, `urgency_level` | - Incident priority update<br>- Duplicate search indexing |
| `IncidentCorrelated` | Relationship detected between multiple tickets | `incident_ids`, `cluster_type`, `common_building_id` | - Grouping recommendation prompt |
| `IncidentResolved` | Work order verified and signed off | `incident_id`, `technician_id`, `resolved_at`, `notes` | - SLA closure<br>- Reporter notification<br>- Digital twin building status clear |

---

### 1.2 Work Order & Allocation Events

| Event Name | Trigger Condition | Published Payload Attributes | Downstream Subscribed Handlers |
| :--- | :--- | :--- | :--- |
| `WorkOrderCreated` | Incident transitioned to active maintenance | `work_order_id`, `incident_id`, `required_skills`, `priority` | - Candidate technician ranking<br>- Parts demand calculation |
| `TechnicianAssigned`| Technician selected and confirmed | `work_order_id`, `technician_id`, `assigned_by_id` | - Technician in-app push notification<br>- Workload counter increment |
| `TechnicianUnavailable` | Technician shift disrupted or reported sick | `technician_id`, `reason`, `effective_until` | - Workload recalculation<br>- Automatic reassignment trigger |
| `WorkOrderStateChanged` | State transition (e.g., InProgress -> Completed) | `work_order_id`, `old_state`, `new_state`, `actor_id` | - Audit log entry<br>- 3D HUD live status update |

---

### 1.3 Booking & Disruption Events

| Event Name | Trigger Condition | Published Payload Attributes | Downstream Subscribed Handlers |
| :--- | :--- | :--- | :--- |
| `RoomDisrupted` | Incident renders room unserviceable | `room_id`, `building_id`, `incident_id`, `severity` | - Identify affected bookings<br>- Generate relocation proposals<br>- 3D building status set to alert |
| `BookingRelocated` | Alternative room confirmed by admin | `booking_id`, `old_room_id`, `new_room_id`, `authorized_by_id` | - In-app notification to instructors & students<br>- Update academic calendar |
| `BookingCancelled` | Reservation cancelled due to conflict | `booking_id`, `room_id`, `reason` | - Room availability release |

---

### 1.4 Inventory & Procurement Events

| Event Name | Trigger Condition | Published Payload Attributes | Downstream Subscribed Handlers |
| :--- | :--- | :--- | :--- |
| `PartsReserved` | Required parts allocated to work order | `work_order_id`, `item_id`, `quantity` | - Atomic decrement of available stock<br>- Shortage threshold check |
| `InventoryShortageDetected` | Available stock drops below threshold | `item_id`, `current_stock`, `reorder_threshold` | - Auto-draft purchase request<br>- Procurement Approver alert |
| `PurchaseRequestApproved` | Authorized approver signs off request | `request_id`, `approver_id`, `item_id`, `quantity` | - Revalidate price & constraints<br>- Purchase order generation |
| `StockReplenished` | Inbound parts shipment received | `item_id`, `quantity_added`, `new_total` | - Release blocked work orders |

---

### 1.5 SLA & System Events

| Event Name | Trigger Condition | Published Payload Attributes | Downstream Subscribed Handlers |
| :--- | :--- | :--- | :--- |
| `SLAWarning` | Response or resolution deadline reaches 75% | `incident_id`, `deadline`, `time_remaining_minutes` | - High-priority banner in admin dashboard |
| `SLABreached` | Deadline exceeded without resolution | `incident_id`, `breached_at`, `priority` | - Department Manager escalation<br>- Audit log incident tag |

---

## 2. Event Dispatching Architecture
- Events are dispatched asynchronously via Python `asyncio` queues in FastAPI.
- Events trigger WebSocket message broadcasts to connected client browsers.
- Handlers are wrapped in database transaction blocks: failure in a downstream handler is recorded in the error log without aborting the originating event.
