#!/usr/bin/env bash
# Start Way of Pi desktop shell: Bun API (:3333) + Vite (:5173) + Electron (no browser tab).
# Same stack as ./start-wayofpi-ui.sh with WOP_USE_ELECTRON=1 — see apps/wayofpi-ui/README.md.
# Usage from repo root: ./start-wayofpi-electron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export WOP_USE_ELECTRON=1
exec "$ROOT/start-wayofpi-ui.sh" "$@"
