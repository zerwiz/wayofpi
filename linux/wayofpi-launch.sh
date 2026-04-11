#!/usr/bin/env bash
# Launcher for Way of Pi from a pinned desktop entry (working dir = repo root).
# Opens the Electron shell by default so the dock/taskbar icon matches BrowserWindow.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export WOP_USE_ELECTRON="${WOP_USE_ELECTRON:-1}"
exec "$ROOT/start-wayofpi-ui.sh" "$@"
