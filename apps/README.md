# Apps

Multi-app platform: a technical IDE ("Way of Pi"), a work management system ("Way of Work"), and self-service portals.

## Apps

| Directory | Name | Purpose |
|-----------|------|---------|
| `wayofpi/` | **Way of Pi** | IDE-style extension system for Pi.dev — technical coding environment with editor grid, terminal, chat panel |
| `wayofpi-ui/` | **Way of Work** (to be renamed) | Main app with ÄTA ticket system, portals, Claw leadership modules |
| `wayofpi-server/` | **Way of Work API** (to be renamed) | Backend API server — file ops, git, terminal WebSocket, database |
| `workerportal/` | **Worker Portal** | Worker self-service portal (profile, certificates, calendar) |
| `deploy/` | — | Deployment scripts and configs |

## Architecture

```
Frontend                      Backend
─────────────────────────────────────
wayofpi/technicalIDE  ────→  wayofpi-server (port 3333)  ──→  SQLite
(port 5174 / 3334)            (file ops, git, WS, chat)

wayofpi-ui            ────→  wayofpi-server (port 3333)  ──→  SQLite
(port 5173 / 3333)            (same backend)

workerportal          ────→  wayofpi-server (port 3333)  ──→  SQLite
(port 5175)                   (same backend)
```

All frontends share the same backend API, database, and terminal server.

## Future

- `clientportal/` — Client-facing portal for project tracking and communication
- `wayofpi-ui/` → `wayofwork-ui/` — Rename to reflect "Way of Work" branding
- `wayofpi-server/` → `wayofwork-server/` — Rename to match
