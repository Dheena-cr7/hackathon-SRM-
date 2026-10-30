# CAMPUSOPS — DEPENDENCY & DATA LICENSE REGISTRY

In accordance with the Zero-Cost and Open-Source mandates of CampusOps, every dependency and dataset must possess a confirmed, permissive open-source license.

## 1. Permitted License Policy
Only the following software licenses are permitted:
- **MIT**
- **Apache-2.0**
- **BSD** (2-Clause, 3-Clause)
- **ISC**
- **CC0** (Public Domain dedication)

**Data Licensing Note:** OpenStreetMap data is licensed under the Open Database License (**ODbL** 1.0). OpenStreetMap contributors must be attributed on the UI and in all documentation. ODbL is a dataset license, not a software license.

---

## 2. Software Dependencies Registry

| Dependency | Category | Intended Version | License | Purpose | Verification Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FastAPI** | Backend | ^0.115.0 | MIT | Core async REST API framework | PyPI / GitHub (`tiangolo/fastapi`) |
| **Uvicorn** | Backend | ^0.32.0 | BSD-3-Clause | ASGI web server | PyPI / GitHub (`encode/uvicorn`) |
| **Pydantic** | Backend | ^2.9.0 | MIT | Data validation & schema contracts | PyPI / GitHub (`pydantic/pydantic`) |
| **SQLAlchemy** | Backend / DB | ^2.0.35 | MIT | Async ORM and SQL expression engine | PyPI / GitHub (`sqlalchemy/sqlalchemy`) |
| **Alembic** | Backend / DB | ^1.13.3 | MIT | Database migrations tool | PyPI / GitHub (`sqlalchemy/alembic`) |
| **asyncpg** | Backend / DB | ^0.30.0 | Apache-2.0 | Async PostgreSQL client driver | PyPI / GitHub (`MagicStack/asyncpg`) |
| **aiosqlite** | Backend / DB | ^0.20.0 | MIT | Async SQLite driver for zero-install offline dev | PyPI / GitHub (`omnilib/aiosqlite`) |
| **python-jose** / **PyJWT** | Security / Auth | ^2.9.0 | MIT | Token encoding, signing, and verification | PyPI / GitHub (`jpadilla/pyjwt`) |
| **passlib** / **bcrypt** | Security / Auth | ^4.0.1 | Apache-2.0 | Secure password hashing | PyPI / GitHub (`pyca/bcrypt`) |
| **python-multipart** | Backend | ^0.0.12 | Apache-2.0 | Form data and multipart parsing | PyPI / GitHub (`Kludex/python-multipart`) |
| **pytest** | Testing | ^8.3.0 | MIT | Automated test framework | PyPI / GitHub (`pytest-dev/pytest`) |
| **pytest-asyncio** | Testing | ^0.24.0 | Apache-2.0 | Pytest support for async coroutines | PyPI / GitHub (`pytest-dev/pytest-asyncio`) |
| **httpx** | Testing / Client | ^0.27.0 | BSD-3-Clause | Async HTTP client for test client | PyPI / GitHub (`encode/httpx`) |
| **Next.js** | Frontend | ^15.0.0 | MIT | React full-stack framework & App Router | npm / GitHub (`vercel/next.js`) |
| **React** & **React-DOM** | Frontend | ^19.0.0 | MIT | Core UI component library | npm / GitHub (`facebook/react`) |
| **TypeScript** | Frontend / Dev | ^5.6.0 | Apache-2.0 | Type checking and compile safety | npm / GitHub (`microsoft/TypeScript`) |
| **Tailwind CSS** | Frontend | ^3.4.0 / ^4.0 | MIT | Utility-first styling engine | npm / GitHub (`tailwindlabs/tailwindcss`) |
| **Lucide React** | Frontend / UI | ^0.454.0 | ISC | Open-source SVG iconography | npm / GitHub (`lucide-icons/lucide`) |
| **Three.js** | 3D Visualization| ^0.170.0 | MIT | WebGL 3D rendering library | npm / GitHub (`mrdoob/three.js`) |
| **@react-three/fiber** | 3D Visualization| ^8.17.0 | MIT | React reconciler for Three.js | npm / GitHub (`pmndrs/react-three-fiber`) |
| **@react-three/drei** | 3D Visualization| ^9.115.0 | MIT | Useful helpers for React Three Fiber | npm / GitHub (`pmndrs/drei`) |
| **Recharts** | Analytics / UI | ^2.13.0 | MIT | Declarative charting library for React | npm / GitHub (`recharts/recharts`) |
| **React Hook Form** | Frontend / UI | ^7.53.0 | MIT | Performant form state management | npm / GitHub (`react-hook-form`) |
| **Zod** | Frontend / Schema | ^3.23.0 | MIT | TypeScript-first schema declaration | npm / GitHub (`colinhacks/zod`) |
| **Playwright** | Testing / E2E | ^1.48.0 | Apache-2.0 | Cross-browser end-to-end testing | npm / GitHub (`microsoft/playwright`) |

---

## 3. Dataset & Geometry Licensing

| Asset | Source | License | Purpose | Attribution Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Campus Building Footprints & Roads** | OpenStreetMap (Overpass API query) | **ODbL 1.0** | Procedural 3D campus geometry generation | Must display **"© OpenStreetMap contributors"** in application footer and docs |
| **Campus GeoJSON (`data/campus.geojson`)** | Prepared locally from OSM / Verified | ODbL 1.0 | Offline building footprints and spatial coordinates | Preserved with origin timestamp and attribution |
| **Fictional Demo Campus Seed Data** | Generated for CampusOps (Synthetic) | CC0 1.0 | Demo buildings, rooms, users, assets, incidents | Public domain fictional data |

---

## 4. Prohibited Dependency Check
- Google Maps SDK: **None**
- Google 3D Tiles: **None**
- Cesium ion: **None**
- Mapbox GL: **None**
- OpenAI / Anthropic / Google Cloud API packages: **None** (Layer 1 deterministic NLP used; optional CPU embeddings/Ollama if enabled)
- Paid SaaS / Auth / DB SDKs: **None**
