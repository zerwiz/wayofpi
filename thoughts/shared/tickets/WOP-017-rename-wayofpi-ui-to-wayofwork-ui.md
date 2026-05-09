# [WOP-017] Rename `wayofpi-ui` → `wayofwork-ui`

## Why
"Way of Pi" name should belong only to the Technical IDE (`apps/technicalIDE/`). The main app with ÄTA tickets, portals, and WorkPortal should be called "Way of Work".

## Impact
~50-60 files reference `wayofpi-ui`. Rename the directory and all references.

## Files to change
- Rename `apps/wayofpi-ui/` → `apps/wayofwork-ui/`
- `package.json` name field
- `vite.config.ts` path aliases
- `tsconfig.app.json` path aliases
- Server path references (db.ts, init-db.ts)
- Service name strings (index.ts, diagnostics.ts)
- Shell scripts (start-wayofpi.sh, build-release.sh, etc.)
- Docker files
- justfile
- Documentation (README, CHANGELOG, AGENTS.md, tickets)
- UI component inline references (user-facing text)
- Electron main process
- .gitignore entries
- technicalIDE references (vite.config, tsconfig, server/index.ts, README)

## Depends on
- WOP-016 (Technical IDE extraction) — should be done first so the rename scope is clear

## Status
⬜ Todo
