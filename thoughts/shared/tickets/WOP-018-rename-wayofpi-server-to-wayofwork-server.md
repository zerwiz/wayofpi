# [WOP-018] Rename `wayofpi-server` → `wayofwork-server`

## Why
"Way of Pi" name should belong only to the Technical IDE (`apps/wayofpi/technicalIDE/`). The backend API server should be called "Way of Work Server".

## Impact
~10-15 files reference `wayofpi-server`.

## Files changed
- Renamed `apps/wayofpi-server/` → `apps/wayofwork-server/`
- Path alias `@wayofpi-server` → `@wayofwork-server` in wayofwork-ui
- All server code import references
- .gitignore entries
- technicalIDE references
- Shell scripts (startup-scripts/auto-start-pty-server.sh)

## Depends on
- WOP-017 (wayofpi-ui → wayofwork-ui) — done first since path aliases need to match

## Status
✅ DONE — Completed by Gemini
