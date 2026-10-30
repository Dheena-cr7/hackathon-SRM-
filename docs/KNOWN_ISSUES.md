# CAMPUSOPS — KNOWN ISSUES & ENVIRONMENT NOTES

## 1. Environment & Tooling Notes
- **Docker in Local Windows Environment:**
  - *Observation:* The `docker` executable is not currently registered in the Windows system PATH.
  - *Resolution / Mitigation:* The application provides a native dual-database strategy in SQLAlchemy: local development and testing run out-of-the-box on `sqlite+aiosqlite` with zero external service requirements or installation overhead, while complete Dockerfile and Docker Compose manifests are provided for containerized and staging deployments.
- **Python 3.14 Compatibility:**
  - *Observation:* The host runs Python 3.14.3. Some compiled C-extensions may require pre-built wheels or modern versions.
  - *Resolution / Mitigation:* Use modern, well-maintained async libraries (FastAPI ^0.115, SQLAlchemy ^2.0.35, Pydantic ^2.9, aiosqlite ^0.20) that support Python 3.14 or run on pure Python without deprecated C-API internals.
- **WebGL Hardware Variation:**
  - *Observation:* Browser clients running on machines without dedicated GPU acceleration may experience lower framerates on intensive 3D scenes.
  - *Resolution / Mitigation:* Instanced meshes (`InstancedMesh`) are enforced to cap draw calls under 80; a 2D SVG site plan fallback is automatically activated when WebGL is absent or when the user toggles "Low-Graphics Mode".
