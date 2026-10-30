# CAMPUSOPS — SECURITY & RELIABILITY SPECIFICATION

In compliance with the ingested [`backend-security-coder`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/backend-security-coder/SKILL.md) and [`identity-access-management`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/identity-access-management/SKILL.md) skills, CampusOps enforces strict defense-in-depth security.

---

## 1. Authentication Architecture
- **Algorithm:** PBKDF2 with SHA-256 / bcrypt for secure password hashing.
- **Tokens:** Short-lived JWT access tokens (HMAC-SHA256) paired with HTTP-only, SameSite secure cookies or authorization header.
- **Zero External IDP:** Self-contained token validation with zero reliance on Auth0, Clerk, or Google Identity.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Domain / Action | Student / Faculty | Technician | Dept Manager | Facilities Admin | Procurement Approver | System Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Submit Incident** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Own Tickets** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View All Incidents** | ❌ | ❌ (Assigned) | ✅ (Dept) | ✅ | ✅ | ✅ |
| **Assign Technician** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Update Work Order Status** | ❌ | ✅ (Own) | ❌ | ✅ | ❌ | ✅ |
| **Book Room** | ✅ (Limited) | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Relocate / Cancel Booking** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **View Inventory Stock** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Request Spare Parts** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Approve Purchase Request** | ❌ | ❌ | ❌ | ❌ | ✅ (Non-Self) | ✅ (Non-Self) |
| **3D Command Center** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **User & Role Admin** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Audit Log Exploration**| ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Strict Separation of Duties (Anti-Self-Approval)
To prevent internal fraud or unauthorized budget expenditure:
- Any user who creates a `PurchaseRequest` cannot approve their own request (`requester_id != approver_id`).
- Attempting to self-approve returns `HTTP 403 Forbidden` with error code `SELF_APPROVAL_PROHIBITED`.
- All approval decisions are permanently inscribed in `audit_logs` with the actor's ID, timestamp, and justification.

---

## 4. Input Sanitization & Threat Mitigations

### 4.1 SQL Injection Protection
- Zero raw string SQL formatting or string concatenation.
- Exclusively parameterized queries managed through SQLAlchemy 2.0 ORM and type-checked Core queries.

### 4.2 Cross-Site Scripting (XSS)
- Natural-language intake and user descriptions are strictly HTML-escaped before presentation.
- React DOM auto-escapes string content.
- Content Security Policy (CSP) headers applied on responses.

### 4.3 AI Injection & Prompt Tampering Protection
- Intake text is treated as **untrusted data**.
- Extraction engine uses deterministic regex and regex-safe pattern matchers without executing user text.
- User input cannot override system prompt instructions, elevate user roles, or trigger automated workflows without backend validation.

---

## 5. Tamper-Evident Audit Logging
Every sensitive state change generates an immutable record in `audit_logs`:
- Incident status transitions
- Work order assignments & reassignments
- Room disruptions & booking relocations
- Inventory reservations & stock movements
- Purchase approvals & rejections
- Authentication attempts (success and failure)
