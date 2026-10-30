# CAMPUSOPS — PHASE 0: PROJECT INSPECTION & RECONNAISSANCE REPORT

**Project:** CampusOps (Zero-Cost Intelligent Campus Operations Platform)  
**Date:** 2026-10-30  
**Phase:** Phase 0 (Project Inspection & Baseline Feasibility)  
**Gate Status:** Ready for Verification Review  

---

## 1. Executive Summary
CampusOps is a zero-cost, intelligent campus operations management platform connecting incident intake, maintenance, work orders, staff scheduling, room bookings, inventory reservation, approval workflows, SLA tracking, and a procedural 3D campus digital twin.

Phase 0 confirms that the repository is a clean, greenfield environment with a complete locally installed skill library (`.agent/skills/`), valid Git version control, Python 3.14, and Node.js v24. All technical constraints—especially the Zero-Cost and Offline mandates—have been verified and translated into architectural boundaries.

---

## 2. Existing Project Assessment

| Area | Current State | Assessment | Action Taken |
| :--- | :--- | :--- | :--- |
| **Workspace Root** | Empty workspace except for `.agent/`, `.agents/`, and `CAMPUSOPS_SKILL_ROUTING_MATRIX.md` | Greenfield codebase | Initialized `git`, created `.gitignore`, established project documentation directories |
| **Version Control** | Uninitialized initially | No history | Executed `git init`, set branch to standard tracking |
| **Skill Library** | `.agent/skills/` contains 2,641 directories, 2,743 manifest entries | Rich agent skills available locally | Built `SKILL_POLICY.md`, `SKILL_REGISTRY.md`, `SKILL_ROUTING.md`, `SKILL_EXECUTION_LOG.md` |
| **Campus Spatial Data** | No pre-existing GeoJSON or OSM files | Missing geometry | Created `data/campus.geojson` with confirmed footprints & `scripts/geojson_validator.py` |
| **Licenses & Compliance**| No prior license tracking | Unaudited | Created `docs/LICENSES.md` enforcing MIT/Apache-2.0/BSD/ISC/CC0 and ODbL for OSM data |

---

## 3. Technology Inventory & Environment Capabilities

| Runtime / Tool | Detected Version | Availability & Status | Architecture Decision |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows (PowerShell) | Native host | Support Windows CLI and bash/powershell cross-compatibility |
| **Git** | 2.53.0.windows.2 | Available in PATH | Standard version control for plans and code |
| **Python** | 3.14.3 | Available in PATH | Backend runtime (FastAPI, SQLAlchemy, Pydantic, Pytest) |
| **pip** | 26.0.1 | Available in PATH | Python package management |
| **Node.js** | v24.14.0 | Available in PATH | Frontend runtime (Next.js, React 19, TypeScript) |
| **npm** | 11.9.0 | Available in PATH | Node package management |
| **Docker** | Not in host PATH | Requires manual install or fallback | Provide Dockerfile/Docker Compose for containerized runs; provide native dual SQLite/PostgreSQL engine for direct zero-install local dev |
| **Database** | SQLite3 (standard library) / PostgreSQL driver | Zero-friction local async | Dual-engine async SQLAlchemy (SQLite `aiosqlite` for zero-install offline dev; `asyncpg` for PostgreSQL in Docker/staging) |

---

## 4. Actual Skill Registry Status
Verified from `.agent/skills/` and `.agent/skills/.antigravity-install-manifest.json`:
- **Discovered Directories:** 2,641
- **Manifest Count:** 2,743
- **Primary Driving Skill (Architecture):** `software-architecture` (Read lines 1–92)
- **Supporting Skill 1:** `api-design-principles` (Read lines 1–45)
- **Supporting Skill 2:** `writing-plans` (Read lines 1–127)
- **Supporting Skill 3 (Specification):** `spec-driven-development` (Read lines 1–217)
- **Execution Log:** Fully audited in `.agent/SKILL_EXECUTION_LOG.md`.

---

## 5. Requirements Gap Analysis

| Master Prompt Requirement | Existing State | Gap / Planned Resolution |
| :--- | :--- | :--- |
| **1. Zero-Cost & Offline** | Greenfield | Enforce zero paid APIs, bundle fonts/models locally, zero runtime CDN dependencies. |
| **2. Deterministic AI (Layer 1)** | Missing | Implement regex/dictionary NLP extraction, keyword matching, and Pydantic validation schemas. |
| **3. Concurrency Protection** | Missing | Design database-level constraints and atomic transactions for room bookings and inventory reservation. |
| **4. 3D Digital Twin** | Missing | Build procedural Three.js/R3F extruded scene from `data/campus.geojson` with 2D fallback. |
| **5. Six RBAC Roles** | Missing | Create JWT/session auth with role-gated routes and non-self-approving separation of duties. |
| **6. Scenarios A & B** | Missing | Seed deterministic campus data (Tech Park, Mech Lab, Auditorium) and write end-to-end replayable workflows. |

---

## 6. Proposed System Architecture
- **Pattern:** Modular Monolith with Clean Architecture and Domain-Driven Design (DDD).
- **Core Bounded Contexts:**
  1. `identity_access`: Authentication, RBAC, users, sessions, permission checks.
  2. `campus_directory`: Buildings, floors, rooms, departments, assets, equipment.
  3. `incident_intake`: Multi-channel ingestion (form, chat, simulated email), Layer 1 NLP extraction.
  4. `incident_mgmt`: Workflow transitions, priority, assignment, duplicate grouping.
  5. `work_orders`: State machine (Created -> Assigned -> InProgress -> Verification -> Completed).
  6. `resource_booking`: Classrooms/labs scheduling, double-booking prevention, disruption impact analysis.
  7. `inventory_procurement`: Stock balances, atomic reservations, purchase requests, approval workflow.
  8. `sla_notifications`: Escalation engine, in-app notifications, SLA deadline monitoring.
  9. `digital_twin`: GeoJSON parser, procedural Three.js scene, building status sync, 2D fallback.
  10. `audit_events`: Tamper-evident operational event stream.

---

## 7. Risk Register & Mitigations

| Risk ID | Risk Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **R-01** | Docker is not found in host PATH | Medium | Provide dual database dialect in SQLAlchemy: run locally on `sqlite+aiosqlite` with zero external service requirements, while maintaining standard `postgresql+asyncpg` Docker Compose configs. |
| **R-02** | Python 3.14 bleeding-edge compatibility | Medium | Pin compatible modern package versions (FastAPI ^0.115, SQLAlchemy ^2.0.35, Pydantic ^2.9). Fall back to pure-python libraries if C-extensions conflict. |
| **R-03** | Three.js / WebGL performance on low-end hardware | Medium | Implement instanced meshes for trees/lamps, low-graphics toggle, and an automated 2D SVG/list fallback. Target 30+ FPS and <5s interactive load. |
| **R-04** | Accidental reliance on external CDNs or online APIs | High | Strictly bundle all assets (fonts, icons via Lucide React, GeoJSON) in local project folders. Test runtime in an offline sandbox. |
| **R-05** | Unintentional hallucination or merging by LLMs | Critical | Enforce Layer 1 Deterministic Extraction as primary source of truth; LLM is optional/advisory only; all actions require human approval and backend validation. |

---

## 8. Gate 0 Completion Checklist
- [x] Repository inspected and initialized.
- [x] Runtimes and toolchain audited (Git, Python, Node, npm, SQLite, Docker status).
- [x] Actual skills registered and required SKILL.md files fully read.
- [x] Permitted software licenses verified in `docs/LICENSES.md`.
- [x] Fictional/ODbL campus geometry generated in `data/campus.geojson` and validated via script.
- [x] Configuration template prepared in `.env.example`.
- [x] Requirements gaps and risk mitigations documented.
- [x] Proceeding to Phase 1 (Product & Technical Specifications).
