# CAMPUSOPS — ZERO-COST INTELLIGENT CAMPUS OPERATIONS PLATFORM
### Hackathon-Winning Platform Built with Antigravity, Agentic Awesome Skills & Open Source

> **Core Principle:** AI understands. The backend validates. Deterministic workflows execute. Humans approve sensitive actions. The digital twin visualizes operational reality.

---

## 1. Overview
**CampusOps** transforms unstructured campus incident reports, emails, and facility events into coordinated, trackable workflows across:
- **Incident Intake & Layer 1 Deterministic AI** (Zero-cost, offline natural-language entity extraction).
- **Staff & Technician Allocation** (Deterministic ranking based on skill certificates, shifts, and workloads).
- **Room Booking & Concurrency Protection** (Double-booking prevention and classroom disruption relocation).
- **Inventory Reservation & Procurement** (Negative stock prevention and anti-self-approval enforcement).
- **SLA & Escalation Monitoring** (Priority-based response timers and in-app notifications).
- **3D Procedural Digital Twin** (Extruded Three.js / React Three Fiber campus with real-time operational status glow and 2D accessible fallback).

---

## 2. Zero-Cost & Offline Guarantee
- **Zero Paid Services:** No Google Maps API, no hosted LLM APIs, no Clerk/Auth0, no paid databases.
- **Permissive Open-Source Licenses:** 100% verified MIT, Apache-2.0, BSD, ISC, CC0 software dependencies.
- **OpenStreetMap Attribution:** Campus geometry derived under **ODbL 1.0**; attributed to **© OpenStreetMap contributors**.
- **Offline Runtime:** The application boots, executes, and demonstrates complete operational workflows without an internet connection.

---

## 3. Technology Stack

| Layer | Technologies | Key Architectural Decisions |
| :--- | :--- | :--- |
| **Backend** | FastAPI, Python 3.14+, Pydantic v2, Uvicorn | Clean Architecture & DDD modular monolith; domain logic decoupled from web delivery. |
| **Database** | SQLAlchemy 2.0 (Async), Alembic, SQLite (`aiosqlite`) / PostgreSQL (`asyncpg`) | Dual-engine support: zero-installation offline SQLite for immediate local dev; PostgreSQL for production. |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons | Server components, accessible UI systems, role-specific operational dashboards. |
| **3D Digital Twin** | Three.js, React Three Fiber, @react-three/drei | Procedural extrusion from `data/campus.geojson`; instanced meshes; accessible 2D SVG fallback. |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, Playwright | High-coverage unit, integration, concurrency race-condition, and scenario suites. |

---

## 4. Quick Start (Local & Offline)

### 4.1 Prerequisites
- Python 3.10+ (Tested on Python 3.14.3)
- Node.js 18+ (Tested on Node v24.14.0) and npm

### 4.2 Configuration
```bash
# Clone or navigate to the workspace
cd "hackathon(SRM)"

# Copy development environment configuration
cp .env.example .env
```

### 4.3 Backend Setup & Execution
```bash
# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Run database migrations and seed deterministic campus data
python -m scripts.seed_generator

# Start FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 4.4 Frontend Setup & Execution
```bash
# Install frontend dependencies
cd frontend
npm install

# Start Next.js development server
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 5. Automated Verification & Testing
```bash
# Run all backend unit, concurrency, and scenario tests
pytest -v

# Run GeoJSON footprint validation
python scripts/geojson_validator.py list

# Run open-source license compliance audit
python scripts/verify_licenses.py
```

---

## 6. Project Documentation Index

- [Product Requirements Document (PRD)](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/PRD.md)
- [System Architecture & C4 Container Specification](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/ARCHITECTURE.md)
- [Database Architecture & Schema](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/DATABASE.md)
- [REST & Realtime API Contracts](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/API.md)
- [Security, RBAC & Anti-Self-Approval](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/SECURITY.md)
- [Free & Offline AI Architecture](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/AI_DESIGN.md)
- [3D Campus Digital Twin & 2D Fallback](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/DIGITAL_TWIN.md)
- [Domain Event Catalog](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/EVENT_CATALOG.md)
- [User Flows & Disruption Scenarios](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/USER_FLOWS.md)
- [Acceptance Criteria Specification](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/ACCEPTANCE_CRITERIA.md)
- [Requirements Traceability Matrix](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/REQUIREMENT_TO_TEST_MATRIX.md)
- [Comprehensive Test Plan](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/TEST_PLAN.md)
- [Hackathon Live Demo Script](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/DEMO_SCRIPT.md)
- [Dependency License Registry](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/LICENSES.md)
- [Phase 0 Inspection Report](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/PHASE_0_INSPECTION_REPORT.md)
- [Phased Implementation Plan](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/plans/2026-10-30-phase-0-to-12-implementation-plan.md)
- [Project Progress Log](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/PROGRESS_LOG.md)
- [Known Issues & Notes](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/docs/KNOWN_ISSUES.md)
