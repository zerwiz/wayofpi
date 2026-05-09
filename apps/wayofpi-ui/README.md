# Way of Work (née Way of Pi)

Main application for work management — ÄTA ticket system (Swedish construction ERP), portals, Claw leadership modules, and team collaboration.

**Note**: This app will be renamed from `wayofpi-ui` to `wayofwork-ui` to reflect its role as the "Way of Work" platform, while "Way of Pi" becomes the technical IDE in `apps/wayofpi/`.

## What it does

- **ÄTA Ticket System**: Digital change-order management for Swedish construction contracts (AB 04/ABT 06)
- **WorkPortal**: Worker self-service (profile, certificates, calendar, PIN change)
- **Client Portal** (future): Client-facing project tracking
- **Claw Leadership**: Review, financials, office, and compliance modules for Work Leaders and Admins
- **Docs & Knowledge Base**: Markdown-powered documentation

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS 3
- **Runtime**: Bun
- **Backend**: Bun.serve on port 3333 (file ops, git, terminal WebSocket, SQLite)
- **Auth**: JWT-based role system (ADMIN, SUPER_ADMIN, WORKER, LEADER, CLIENT)

## Quick Start

```bash
cd apps/wayofpi-ui
bun install
bun run dev          # Vite on :5173 + API on :3333
```

## Dependencies

- SQLite database (`server/wayofpi.sqlite`)
- Pi.dev CLI for AI agent features
- Requires `WOP_ALLOW_TERMINAL=1` for terminal features
