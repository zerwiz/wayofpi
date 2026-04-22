#!/usr/bin/env bash
# **Primary Way of Pi desktop entrypoint** — Bun API (:3333) + Vite (:5173) + Electron (no browser tab).
# Same stack as ./start-wayofpi-ui.sh with WOP_USE_ELECTRON=1; client uses relative /api and /ws (same as browser dev). See apps/wayofpi-ui/README.md § Electron.
# Usage from repo root: ./start-wayofpi-electron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export WOP_USE_ELECTRON=1
exec "$ROOT/start-wayofpi-ui.sh" "$@"
