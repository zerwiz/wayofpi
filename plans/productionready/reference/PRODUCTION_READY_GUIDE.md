# Way of Pi: Production-Ready Guide

This document defines the roadmap and checklist for moving **Way of Pi** from a development/prototype state to a production-ready platform.

## 1. Executive Summary
Way of Pi is transitioning into a multi-tenant, professional platform for organizations with **multiple Work Leaders and 100+ Workers**. Production readiness involves **mitigating critical security risks (Path Traversal)**, hardening the **Data Foundation (SQLite Migration)**, implementing a robust **4-tier RBAC system**, and ensuring performance at scale while eliminating all mock data.

## 2. Risk Mitigation & Prioritization Roadmap
To avoid data corruption and security breaches in multi-tenant environments, the roadmap follows a strict **Foundation-First** strategy:

1.  **Phase 1: Data & Security (Blocker Level):** Replace in-memory logic with SQLite and implement path hardening to prevent cross-tenant directory traversal.
2.  **Phase 2: Auth & Multi-Tenancy (Architecture Level):** Enforce tenant isolation across all routes and finalize real Worker Portal APIs.
3.  **Phase 3: Work Leader Integrations (Feature Level):** Build WhatsApp and CAD integrations on the locked-down foundation.
4.  **Phase 4: Release Polish (DevOps Level):** Finalize Docker, graceful shutdowns, and automated testing.

---

## 3. Production Readiness Checklist

### 3.1 Security & Authentication
- [ ] **Path Hardening (CRITICAL):** Ensure `getPrimaryWorkspacePath(tenantId)` cannot be bypassed (symlink/`..` checks). This is the #1 blocker for cloud/multi-tenant safety.
- [ ] **Multi-Tier RBAC Implementation:** Support Super Admin, Admin, Work Leader, Worker, and Client roles.
- [ ] **Personal vs. Shared Workspaces:** Implement file-system isolation for private sandboxes and team projects.
- [ ] **Leader Login:** Implement a proper login page in the main UI that uses `/api/login`.
- [ ] **Worker Auth:** Connect `WorkerPortal.tsx` to the server's auth/db (ID + PIN).
- [ ] **Secret Management:** Ensure `WOP_AUTH_SECRET` and API keys are never logged and are masked in UI.
- [ ] **CORS/CSRF:** Configure strict policies for non-localhost deployments.

### 3.2 Reliability & Scale
- [ ] **Load Testing:** Verify performance for 100+ concurrent worker requests (time logging, file downloads).
- [ ] **Pagination/Virtualization:** Implement in all high-volume UI lists (Worker Portal, Admin logs).
- [ ] **Pinned Versions:** Use exact versions for `pi-coding-agent` (e.g., `2026.4.30`) as per `PI_VERSION_MANAGEMENT.md`.
- [ ] **Dockerization:** Finalize the non-root Dockerfile from `PI_INTEGRATION_DOCKER_PLAN.md`.
- [ ] **Structured Logging:** Implement request-ID-based logging that avoids leaking raw prompts in production logs.
- [ ] **Graceful Shutdown:** Handle `SIGTERM` to close Pi subprocesses and database connections cleanly.

### 3.3 Core Implementation (P0)
- [ ] **Database Persistence (CRITICAL):** Replace in-memory logic/JSON with `.pi/db/wayofpi.sqlite`. Ensure all session and tenant data is correctly persisted.
- [ ] **Headless Pi Spine:** Transition all tool execution from interim Bun logic to the authoritative Pi CLI (`--mode json`).
- [ ] **Manifest-Driven UI:** Use `GET /api/manifest` to drive the command palette and tool list dynamically.

### 3.4 Work Leader System Alignment (Kanban Reuse 📋)
- [ ] **Kanban Code Reuse:** Copy `/ref/kanban/` components, reskin with Way of Pi colors (`KANBAN_REUSE_PLAN.md`).
- [ ] **Project Management:** Gantt charts, task cards, document browser (from kanban `CardView`, `BoardDocsView`).
- [ ] **AI Scheduling:** Pi analyzes PRD/API specs + worker data → predicts scheduling conflicts and tomorrow's priorities.
- [ ] **Worker Portal:** Connect to real backend for file downloads and time logging.
- [ ] **WhatsApp Integration:** Implement the @WorkTimeBot and @WorkLeaderClaw system (with AI predictions).
- [ ] **CAD Support:** Ensure the UI can preview or link to CAD drawings (`.dwg`, `.rvt`).

### 3.5 Data Integrity & Mock Removal
- [ ] **Real Auth Flow:** Remove all hardcoded PINs and "demo" user bypasses.
- [ ] **Database Source of Truth:** Replace in-memory Maps and mock JSON files with SQLite/Postgres queries.
- [ ] **Live File System:** Ensure file explorers and previews reflect real disk state, not static example trees.
- [ ] **API Responses:** Ensure all UI components fetch data from real `/api/*` endpoints with error handling.

---

## 4. Maintenance & Updates
To avoid getting "stuck" after updates:
1. **Always use pinned versions** for upstream dependencies.
2. **Run `doctor.sh --fix`** after system updates to ensure path portability.
3. **Validate the manifest** (`GET /api/manifest`) to ensure extensions and tools are correctly loaded.
4. **Monitor logs** via `GET /api/diagnostics` for runtime errors.

## 5. Deployment Models

### 5.1 Local (Personal)
- Bind to `127.0.0.1` only.
- Auto-login or simple password.
- Local Ollama.

### 5.2 Cloud (Team)
- Docker Compose (Way of Pi + PostgreSQL + Ollama).
- JWT Auth + MFA.
- Multi-tenant workspace isolation.

---

**Last Updated:** 2026-05-04
