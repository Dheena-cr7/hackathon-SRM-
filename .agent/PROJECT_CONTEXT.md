# CAMPUSOPS — PROJECT CONTEXT

## 1. System Vision & Objective
**CampusOps** is an intelligent campus operations management platform engineered for institutional efficiency. It unifies operations across facility maintenance, incident triage, inventory reservations, space/resource bookings, and multi-role operations with automated natural language intake, correlation, and policy-driven routing.

---

## 2. Technology Stack & Architectural Standards

| Layer | Selected Technologies | Architectural Directives |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui | Server components by default, typed API contracts, responsive dashboard layouts with accessible components (WCAG 2.1 AA compliant). |
| **Backend** | FastAPI, Python 3.12+, Pydantic v2 | Clean Architecture / DDD patterns, domain entities isolated from HTTP delivery, typed dependency injection, asynchronous request handling. |
| **Database** | PostgreSQL 16+, SQLAlchemy 2.0 (Async), Alembic | Relational constraints, pessimistic/optimistic locking for concurrent bookings and inventory, declarative Alembic migration scripts. |
| **AI / Intelligece** | LLM Structured Outputs (JSON Schema), Vector Similarity Search | Deterministic natural-language intake, ticket categorization, duplicate detection, automated summarization, and anomaly/correlation flags. |
| **Security** | JWT, RBAC, OAuth2/Password Bearer | Separation of duties (Student, Faculty, Facility Staff, Administrator), tamper-evident audit logging, strict input sanitization. |
| **Testing** | Pytest, Playwright, HTTPX | TDD Red-Green-Refactor cycle, high-coverage unit tests, API schema contract testing, and concurrent race-condition simulation tests. |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions, OpenTelemetry | Containerized services, multi-stage builds, non-root execution, unified observability (traces, metrics, logs). |

---

## 3. Project Phase & Current Status
- **Current Phase**: **Phase 0: Skills Management Initialization** (Completed)
- **Active Skills Ingested**:
  - Primary: [`software-architecture`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/software-architecture/SKILL.md)
  - Supporting 1: [`api-design-principles`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/api-design-principles/SKILL.md)
  - Supporting 2: [`writing-plans`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/writing-plans/SKILL.md)
- **Next Phase**: **Phase 1: Architecture Planning & C4 Container Specification**
  - Define bounded contexts: Incident Management, Resource & Space Booking, Inventory Reservation, Identity & RBAC.
  - Formulate API contracts, transaction boundaries, and concurrency isolation levels.

