# Way of Pi: Production Tech Stack

This document outlines the official technology stack for the **Way of Pi** production environment, ensuring consistency across development, deployment, and scaling.

## 1. Core Runtime & Language
- **Runtime:** [Bun](https://bun.sh/) (Primary runtime for server and scripts for high-performance I/O).
- **Language:** [TypeScript](https://www.typescript.org/) (Strict mode enabled for type safety).
- **Desktop Shell:** [Electron](https://www.electronjs.org/) (Used for the Leader IDE experience).

## 2. Backend (Server)
- **Framework:** [Hono](https://hono.dev/) or [Express](https://expressjs.com/) (Lightweight, Bun-compatible API routing).
- **Authentication:** [Jose](https://github.com/panva/jose) (JWT-based token management and signing).
- **Security:** 
  - `bcryptjs` for password hashing.
  - `helmet` for security headers.
  - Custom middleware for Path Hardening (traversal prevention).

## 3. Frontend (UI)
- **Framework:** [React](https://react.dev/) (with Vite for fast development).
- **Styling:** Vanilla CSS / CSS Modules (Avoiding Tailwind for maximum flexibility and "Pi-native" look).
- **State Management:** React Hooks (Context/Reducer) for localized state.
- **Components:** Custom lightweight components (no heavy UI libraries to minimize bloat).

## 4. Database & Storage
- **Local/Edge Database:** [SQLite](https://www.sqlite.org/) (via `bun:sqlite` for single-tenant and multi-tenant local installs).
- **Cloud Database:** [PostgreSQL](https://www.postgresql.org/) (Target for large-scale multi-tenant cloud deployments).
- **ORM/Query Builder:** [Drizzle ORM](https://orm.drizzle.team/) (TypeScript-first, lightweight, supports both SQLite and Postgres).
- **File Orchestration:** Local File System API (with strict `tenantId` base-path scoping).

## 5. AI & Agent Integration
- **Engine:** [Pi Coding Agent (pi-cli)](https://github.com/google/pi-coding-agent) (Authoritative tool executor).
- **Local LLM:** [Ollama](https://ollama.com/) (Defaults: `qwen2.5:7b` or `qwen2.5:coder`).
- **Cloud LLM:** [OpenRouter](https://openrouter.ai/) (Fallback/High-power routing).

## 6. Communication & Integrations
- **WhatsApp:** [Baileys](https://github.com/WhiskeySockets/Baileys) or [WhatsApp Business API](https://www.facebook.com/business/help/2041148702654396) (For @WorkTimeBot and @WorkLeaderClaw).
- **CAD Support:** `node-adsk` or specialized WebAssembly parsers for `.dwg` and `.rvt` metadata/preview.
- **WebSockets:** [Socket.io](https://socket.io/) or native Bun WebSockets (Real-time task and status updates).

## 7. DevOps & Infrastructure
- **Containerization:** [Docker](https://www.docker.com/) (Multi-stage builds, non-root users).
- **Orchestration:** Docker Compose (for Team installs).
- **Process Management:** `systemd` (Linux) or PM2.
- **CI/CD:** GitHub Actions (for automated linting and release packaging).

---
*Last Updated: 2026-05-04*
