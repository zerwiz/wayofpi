#!/usr/bin/env bash
# Start Way of Pi web UI (Bun API + Vite). By default opens the default browser when ready.
# Set WOP_USE_ELECTRON=1 to open an Electron window instead (no separate browser tab).
# Same full stack as ./start-full-system.sh or: just wayofpi-full
# Usage: from repo root: ./start-wayofpi-ui.sh
set -euo pipefail

# Bun ships server + dev; ensure ~/.bun/bin is on PATH in non-login shells
export PATH="${HOME}/.bun/bin:${PATH}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$ROOT/apps/wayofpi-ui"
URL="${WOP_UI_URL:-http://localhost:5173/}"

if [[ ! -d "$UI_DIR" ]]; then
	echo "error: missing $UI_DIR" >&2
	exit 1
fi

# Optional: load playground API keys / overrides from repo .env
if [[ -f "$ROOT/.env" ]]; then
	set -a
	# shellcheck source=/dev/null
	source "$ROOT/.env"
	set +a
fi

# Default workspace to this repo if unset (server jails file I/O here)
export WOP_WORKSPACE="${WOP_WORKSPACE:-$ROOT}"

cd "$UI_DIR"

if ! command -v bun >/dev/null 2>&1; then
	echo "error: bun is required for apps/wayofpi-ui (server). Install: https://bun.sh" >&2
	exit 1
fi

if [[ ! -d node_modules ]]; then
	echo "Installing npm dependencies in apps/wayofpi-ui …"
	npm install
fi

open_browser_when_ready() {
	local i
	for i in $(seq 1 120); do
		if curl -sf -o /dev/null "$URL" 2>/dev/null; then
			if command -v xdg-open >/dev/null 2>&1; then
				xdg-open "$URL" >/dev/null 2>&1 || true
			elif command -v open >/dev/null 2>&1; then
				open "$URL" >/dev/null 2>&1 || true
			elif command -v wslview >/dev/null 2>&1; then
				wslview "$URL" >/dev/null 2>&1 || true
			else
				echo "Open in a browser: $URL"
			fi
			return 0
		fi
		sleep 0.5
	done
	echo "warning: UI did not respond at $URL in time; open it manually." >&2
}

if [[ "${WOP_USE_ELECTRON:-}" == "1" ]]; then
	exec npm run electron:dev
fi

open_browser_when_ready &
exec npm run dev
