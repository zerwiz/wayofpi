# Way of Pi — Technical IDE

IDE-style extension system for Pi.dev. VSCode-inspired workspace with file explorer, multi-cell editor grid, embedded terminal, chat panel, and debug support.

## Architecture

- **Frontend**: Vite + React 19 + Tailwind 3, port **5174** (dev)
- **Server**: Bun.serve on port **3334**, proxies HTTP+WS to `127.0.0.1:3333`
- **Terminal**: WebSocket proxied to main server — PTY context persists
- **Shared code**: Components/hooks from `wayofwork-ui/src/` via `@wop` alias

## Quick Start

```bash
cd apps/wayofpi/technicalIDE
bun install
bun run dev          # Vite dev on :5174
```

Requires API server on port 3333 (`apps/wayofwork-ui/server/`).

## Dev Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Vite dev server on port 5174 |
| `bun run build` | TypeScript check + Vite build |
| `bun run server` | Bun production server on port 3334 |

## Path Aliases

- `@wop/*` → `../wayofwork-ui/src/*` (shared components)
- `@/*` → `src/*` (app-internal)

## Terminal Persistence

Terminal runs on main API server (port 3333). Technical IDE proxies WebSocket to it — PTY survives view switches. Set `WOP_ALLOW_TERMINAL=1` on the API server.
