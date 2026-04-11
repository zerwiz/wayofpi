#!/usr/bin/env bash
# Start the full Way of Pi web stack: Bun server (port 3333: /api, /ws) + Vite (5173).
# Equivalent to: cd apps/wayofpi-ui && npm run dev
# Not the same as dev:ui — Vite-only leaves the chat WebSocket unreachable.
#
# Usage from repo root: ./start-full-system.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/start-wayofpi-ui.sh" "$@"
