# Way of Pi: Production Readiness Documentation

This folder contains the plans, guides, and checklists for moving **Way of Pi** to a production-ready state.

## 📚 Guides & Checklists
- **[TODO.md](TODO.md)** — Active task tracking for production readiness.
- **[PRODUCTION_READY_GUIDE.md](PRODUCTION_READY_GUIDE.md)** — Core roadmap, current status, and comprehensive production checklist.
- **[SAFE_UPDATE_GUIDE.md](SAFE_UPDATE_GUIDE.md)** — Procedures for updating the system safely and troubleshooting "stuck" states.
- **[APPLICATION_LAUNCH_GUIDE.md](APPLICATION_LAUNCH_GUIDE.md)** — Instructions for starting the installed version from the "apps view" on Linux, macOS, and Windows.
- **[GIT_WORKFLOW.md](GIT_WORKFLOW.md)** — Strategy for maintaining a stable `main` branch while developing features on other branches.

## 🏗️ Technical Plans
- **[TECH_STACK.md](TECH_STACK.md)** — Official technology stack for runtime, backend, frontend, and database.
- **[PHASE_1_SECURITY_DATA_GUIDE.md](PHASE_1_SECURITY_DATA_GUIDE.md)** — Implementation tips for DB foundation, RBAC, and path hardening.
- **[KANBAN_REUSE_PLAN.md](KANBAN_REUSE_PLAN.md)** — Strategy for reusing and reskinning the kanban reference project for the Work Leader system.
- **[PRODUCTION_AUTH_TENANCY_WORKLEADER_ALIGNMENT.md](PRODUCTION_AUTH_TENANCY_WORKLEADER_ALIGNMENT.md)** — Architecture for multi-tenancy, JWT/PIN auth, and Work Leader system alignment.
- **[PI_INTEGRATION_DOCKER_PLAN.md](PI_INTEGRATION_DOCKER_PLAN.md)** — Dockerization strategy using non-root users and global Pi installation.
- **[PI_VERSION_MANAGEMENT.md](PI_VERSION_MANAGEMENT.md)** — Strategy for pinning dependencies to prevent upstream breaking changes.

## 🚀 Deployment
- Local Deployment: Use `./start-wayofpi-electron.sh`.
- Cloud Deployment: See `docker-compose.yml` and the Docker plan above.

---
*Way of Pi - Making AI agents work for leaders and workers.*
