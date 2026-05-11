# Way of Pi — Agent Context

This file is loaded by Pi, Gemini, OpenCode, and other AI coding agents. Follow it exactly.

## CRITICAL — File Maintenance

- **CHANGELOG.md**: Always update `~/Way of pi/CHANGELOG.md` when making code changes.
- **STRUCTURE.md**: Keep `~/Way of pi/docs/STRUCTURE.md` up to date when modifying the project layout.
- **`thoughts/shared/tickets/WOP-ALL-TODO.md`**: Master TODO with agent division of labor. Check before starting work.

## Agent Communication

Both agents (OpenCode and Gemini) work on this repo. Coordinate through these shared files:
1. **WOP-ALL-TODO.md** — task status and ownership (update after completing tasks)
2. **CHANGELOG.md** — log all significant changes
3. **AGENTS.md** — this file, keep current state

## Runtime & Tooling
- **Runtime**: Bun (not npm). Use `bun run <script>` not `npm run`.
- **Task runner**: `just` (see `~/Way of pi/justfile` for all commands).

## Build & Dev Commands
```bash
# wayofwork-ui (Vite + React + Electron)
cd ~/Way of pi/apps/wayofwork-ui
bun run build          # tsc -b && vite build
bun run dev            # Vite :5173 + Bun API :3333

# wayofpi/technicalIDE (Way of Pi standalone)
cd ~/Way of pi/apps/wayofpi/technicalIDE
bun run build          # tsc -b && vite build (passing ✅)
bun run dev            # Vite :5174 + Bun API proxy :3334
```

## Path Aliases
- `@technicalIDE` → `apps/wayofpi/technicalIDE/` (in wayofwork-ui vite.config.ts + tsconfig)
- `@wop` → `apps/wayofwork-ui/src/` (in technicalIDE vite.config.ts + tsconfig)
- `@wayofwork-server` → `../wayofwork-server` (legacy, may need update)

## Architecture (FINAL)
```
apps/
├── wayofpi/
│   ├── technicalIDE/       →  "Way of Pi"        — Standalone Technical IDE (port 5174)
│   └── server/              →  "Way of Pi API"    — Bun proxy port 3334 → 3333
├── wayofwork-ui/            →  "Way of Work"      — Main app: Claw, Simple, Docs, Work
├── wayofwork-server/        →  "Way of Work API"  — Bun API server port 3333
└── workerportal/            →  "Worker Portal"    — Worker self-service portal
```

## Status
- **WOP-016**: Technical IDE extraction — **DONE ✅**. Build passes standalone.
- **WOP-017/018**: Renaming to wayofwork — **DONE ✅**.
- **WOP-010**: Phase 6 Full Kanban Integration — **DONE ✅**. 550 TS errors fixed, 19 files un-excluded, build passes.
- **WOP-004**: Phase 4 SDK Migration — **DONE ✅**.
- **WOP-006**: Phase 5 Version Pinning — **DONE ✅**.
- **WOP-012**: Phase 7 ÄTA Tickets — **DONE ✅**.
- **WOP-015**: Phase 8 Claw Leadership — **DONE ✅**.
- **Phase 2**: Routing (react-router-dom) — DONE.
- **Phase 3b Track A/B**: Hooks extraction, page shells — DONE.

## Division of Labor
- **OpenCode**: WOP-016 (Tech IDE), WOP-004 (SDK), WOP-006 (Version Pinning), WOP-010 (Kanban), WOP-012 (ÄTA Tickets), WOP-015 (Claw Leadership). Build passing.
- **Gemini**: Fix SimplePage.tsx build error, Phase 2 routing, Track A/B hooks/page shells.
