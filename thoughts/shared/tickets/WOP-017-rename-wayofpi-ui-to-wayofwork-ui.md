# [WOP-017] Rename `wayofpi-ui` → `wayofwork-ui`

## Why
"Way of Pi" name should belong only to the Technical IDE (`apps/wayofpi/technicalIDE/`). The main app with ÄTA tickets, portals, and WorkPortal should be called "Way of Work".

## Impact
~50-60 files reference `wayofpi-ui`. Rename the directory and all references.

## Files changed
- Renamed `apps/wayofpi-ui/` → `apps/wayofwork-ui/`
- Updated `package.json` name field
- Updated `vite.config.ts` path aliases
- Updated `tsconfig.app.json` path aliases
- Updated server path references (db.ts, init-db.ts)
- Updated service name strings (index.ts, diagnostics.ts)
- Updated shell scripts (start-wayofpi.sh, build-release.sh, etc.)
- Updated Docker files
- Updated justfile
- Updated documentation (README, CHANGELOG, AGENTS.md, tickets)
- Updated UI component inline references (user-facing text)
- Updated Electron main process
- Updated .gitignore entries
- Updated technicalIDE references (vite.config, tsconfig, server/index.ts, README)

## Depends on
- WOP-016 (Technical IDE extraction) — done first; scope was clear

## Status
✅ DONE — Completed by Gemini
