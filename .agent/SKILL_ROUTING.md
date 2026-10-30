# CAMPUSOPS — SKILL ROUTING

This routing document governs how engineering tasks in CampusOps route dynamically to specific installed skills in `.agent/skills/`.

---

## Routing Principles
1. **Single Primary Driver**: Each task must have exactly one primary driving skill.
2. **Strict Limit on Supporting Skills**: At most two supporting skills may be activated in conjunction with the primary skill.
3. **Instruction Ingestion Prerequisite**: Before initiating execution within any domain, the driving skill's `SKILL.md` must be read completely.
4. **Handoff Contracts**: Artifacts generated in one domain (e.g., architectural plans from `software-architecture` + `writing-plans`) serve as the direct specification input for implementation skills (e.g., `fastapi-pro`, `nextjs-best-practices`).

---

## Domain Routing Table

### 1. Product & Planning
- **Task Types**: Problem analysis, MVP scoping, requirement specifications, feature prioritisation, user journeys.
- **Primary Skill**: [`brainstorming`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/brainstorming/SKILL.md)
- **Supporting Skills**: [`product-manager`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/product-manager/SKILL.md), [`spec-driven-development`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/spec-driven-development/SKILL.md)
- **Trigger**: New requirement, epic definition, or user journey scoping.

### 2. System Architecture
- **Task Types**: Modular architecture, API boundaries, service responsibilities, event orchestration, technical decisions.
- **Primary Skill**: [`software-architecture`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/software-architecture/SKILL.md)
- **Supporting Skills**: [`api-design-principles`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/api-design-principles/SKILL.md), [`writing-plans`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/writing-plans/SKILL.md)
- **Trigger**: System design, service boundary definition, C4 diagramming, or ADR drafting.

### 3. Frontend Development
- **Task Types**: Next.js App Router, React component tree, TypeScript interfaces, dashboard layout, role-specific UI, responsive forms.
- **Primary Skill**: [`nextjs-best-practices`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/nextjs-best-practices/SKILL.md)
- **Supporting Skills**: [`ui-ux-pro-max`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/ui-ux-pro-max/SKILL.md), [`tailwind-patterns`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/tailwind-patterns/SKILL.md)
- **Trigger**: Frontend scaffolding, page/component authoring, UI state management.

### 4. Backend Development
- **Task Types**: FastAPI routes, Pydantic data models, business rules, authentication, authorization, workflow orchestration.
- **Primary Skill**: [`fastapi-pro`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/fastapi-pro/SKILL.md)
- **Supporting Skills**: [`pydantic-models-py`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/pydantic-models-py/SKILL.md), [`auth-implementation-patterns`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/auth-implementation-patterns/SKILL.md)
- **Trigger**: API endpoint development, domain logic implementation, auth enforcement.

### 5. Database Engineering
- **Task Types**: PostgreSQL schema, SQLAlchemy ORM models, Alembic migrations, database constraints, concurrent updates, transaction locks.
- **Primary Skill**: [`postgresql`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/postgresql/SKILL.md)
- **Supporting Skills**: [`sql-pro`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/sql-pro/SKILL.md), [`database-migrations-sql-migrations`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/database-migrations-sql-migrations/SKILL.md)
- **Trigger**: Entity definition, migration generation, concurrency control logic.

### 6. AI & Intelligent Workflows
- **Task Types**: Natural-language intake, structured JSON extraction, incident categorisation, duplicate detection, similarity correlation, summarisation.
- **Primary Skill**: [`llm-structured-output`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/llm-structured-output/SKILL.md)
- **Supporting Skills**: [`similarity-search-patterns`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/similarity-search-patterns/SKILL.md), [`agent-evals`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/agent-evals/SKILL.md)
- **Trigger**: Ticket/incident triage, report extraction, AI assistant pipeline.

### 7. Security & Hardening
- **Task Types**: RBAC enforcement, separation of duties, API security, input sanitization, audit logging, secret management.
- **Primary Skill**: [`backend-security-coder`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/backend-security-coder/SKILL.md)
- **Supporting Skills**: [`threat-modeling`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/threat-modeling/SKILL.md), [`audit-logging`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/audit-logging/SKILL.md)
- **Trigger**: Security review, permission modeling, secret isolation, audit log integration.

### 8. Testing & Quality Assurance
- **Task Types**: TDD cycles, Python unit/integration tests, concurrent booking tests, Playwright E2E browser tests, API contract tests.
- **Primary Skill**: [`tdd-workflow`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/tdd-workflow/SKILL.md)
- **Supporting Skills**: [`pytest-skill`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/pytest-skill/SKILL.md), [`playwright-skill`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/playwright-skill/SKILL.md)
- **Trigger**: Writing test suites, red-green-refactor loop, regression runs.

### 9. Debugging & Optimisation
- **Task Types**: Root cause analysis, runtime error tracing, API latency profiling, database query optimization, UI render performance.
- **Primary Skill**: [`systematic-debugging`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/systematic-debugging/SKILL.md)
- **Supporting Skills**: [`performance-profiling`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/performance-profiling/SKILL.md), [`postgresql-optimization`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/postgresql-optimization/SKILL.md)
- **Trigger**: Unhandled exceptions, failing tests, slow API endpoints, high query execution times.

### 10. Deployment & Infrastructure
- **Task Types**: Docker containers, multi-stage builds, compose environments, CI/CD pipelines, OpenTelemetry instrumentation.
- **Primary Skill**: [`docker-management`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/docker-management/SKILL.md)
- **Supporting Skills**: [`docker-compose`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/docker-compose/SKILL.md), [`opentelemetry`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/opentelemetry/SKILL.md)
- **Trigger**: Dockerfile creation, container orchestration, telemetry configuration.

