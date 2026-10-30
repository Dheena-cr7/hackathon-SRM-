# CAMPUSOPS — AGENTIC SKILL POLICY

## 1. Purpose & Scope
This policy governs the discovery, activation, routing, and execution of agentic skills within the **CampusOps** project ecosystem. It enforces strict precision, reproducibility, and auditability.

---

## 2. Core Policies

### 2.1 Verifiable Existence & Zero Hallucination
- Skills must originate strictly from the official index in `.agent/skills/` as tracked by `.agent/skills/.antigravity-install-manifest.json`.
- Agents must never invent skill names, synthetic capabilities, or arbitrary file paths.
- Paths must be verified on disk before being registered or recommended.

### 2.2 Activation Through Full Inspection
- No skill may be declared "active" or "in use" unless its corresponding `SKILL.md` has been read completely using file reading tools.
- Reading metadata/frontmatter is permitted for discovery, but operational execution requires the full instruction set to be ingested.

### 2.3 Strict Routing & Role Scoping
- Task execution must follow the domain boundaries defined in the **CampusOps Skill Routing Matrix**.
- For each discrete task, select **one primary skill** and **no more than two supporting skills** to prevent context contamination and conflicting directives.

### 2.4 Traceability & Audit Logging
- Every skill invocation, rule read, and plan generation must be recorded in `.agent/SKILL_EXECUTION_LOG.md`.
- Changes to architectural contracts or registry configurations must be reflected across `.agent/SKILL_REGISTRY.md` and `.agent/PROJECT_CONTEXT.md`.

### 2.5 Codebase Preservation
- Preserve existing project files, configurations, and skill-library assets.
- No modifications to third-party skill definitions unless explicitly required and authorized.

