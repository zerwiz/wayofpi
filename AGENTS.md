# Way of Pi — Agent Context

This file is loaded by Pi, Gemini, OpenCode, and other AI coding agents. Follow it exactly.

## CRITICAL — File Maintenance

- **CHANGELOG.md**: Always update `~/Way of pi/CHANGELOG.md` when making code changes.
- **STRUCTURE.md**: Keep `~/Way of pi/docs/STRUCTURE.md` up to date when modifying the project layout.

## Runtime & Tooling
- **Runtime**: Bun (not npm). Use `bun run <script>` not `npm run`.
- **Task runner**: `just` (see `~/Way of pi/justfile` for all commands).
- **Pi extensions**: loaded via `pi -e ~/Way of pi/.pi/extensions/util/pi-loader.ts` or `PI_STACK` env var.
- **Pi interactive selector**: `just pi-e` (stacks extensions in one session).

## Build & Dev Commands
```bash
# wayofpi-ui (Vite + React + Electron)
cd ~/Way of pi/apps/wayofpi-ui
bun run build          # tsc -b && vite build (currently 60+ errors, see WOP-002)
bun run dev            # Vite :5173 + Bun API :3333
just wayofpi-full      # Bun API + Vite dev (same as npm run dev)
just wayofpi-electron  # Electron window (Vite :5173 + Bun API :3333)
```

## Path Aliases (vite.config.ts)
- `@wayofpi-server` → `../wayofpi-server`

## Current Known Issues
- **WOP-002**: 60+ TypeScript build errors in `~/Way of pi/apps/wayofpi-ui`. Plan: `~/Way of pi/thoughts/shared/tickets/WOP-002-fix-remaining-build-errors.md`
- **Routing**: No React Router — uses `window.location.pathname` for route detection.
- **Auth**: JWT-based, `/login` page exists but not yet integrated into `App.tsx`.

## Architecture Notes
- **Electron-first** UI in `~/Way of pi/apps/wayofpi-ui/` (Vite + React 19, Tailwind 3).
- **Server**: Bun API in `~/Way of pi/apps/wayofpi-ui/server/` (port 3333), proxied by Vite in dev.
- **Pi agents**: `~/Way of pi/.pi/agents/*.ts`, extensions: `~/Way of pi/.pi/extensions/*.ts`.
- **Hermes**: External CLI at `~/.hermes/hermes-agent/venv/bin/hermes`.

## Conventions
- Extensions are standalone `.ts` files loaded by Pi's jiti runtime.
- Agent tools registered at top level, not inside event handlers.
- No test suite configured for `~/Way of pi/apps/wayofpi-ui` (no `test` script).
