#!/usr/bin/env bash
# Start Way of Pi web UI (Bun API + Vite).
# **Recommended desktop shell:** **`./start-wayofpi-electron.sh`** or **`just wayofpi-electron`** (or **`WOP_USE_ELECTRON=1`** with this script) — Electron window; same **Vite → Bun** proxy for **`/api`**, **`/ws`**, **`/api/manifest`**, **`/ws/terminal`** as opening **http://127.0.0.1:5173/** in a browser.
# Default without Electron: opens the default browser when **5173** responds (**`WOP_UI_URL`** overrides URL).
# Same full stack as ./start-full-system.sh or: just wayofpi-full
# Usage: from repo root: ./start-wayofpi-ui.sh
set -euo pipefail

# GUI .desktop launches often have a minimal PATH — include common locations for bun / npm / pi / cargo.
export PATH="${HOME}/.bun/bin:${HOME}/.local/bin:${HOME}/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

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

# Electron dev: if a compatible Bun API is already on WOP_SERVER_PORT, do not start a second server (avoids EADDRINUSE when the menu launcher runs while an old API is still bound).
if [[ "${WOP_USE_ELECTRON:-}" == "1" && -z "${WOP_REUSE_BUN_API:-}" ]]; then
	_port="${WOP_SERVER_PORT:-3333}"
	_hy="$(curl -sS -m 2 "http://127.0.0.1:${_port}/api/health" 2>/dev/null || true)"
	if [[ -n "${_hy}" && "${_hy}" == *'"service":"wayofpi-ui-server"'* ]]; then
		if [[ "${_hy}" == *'workspaceProblems'* ]]; then
			export WOP_REUSE_BUN_API=1
		else
			echo "error: port ${_port} has an older Way of Pi Bun build (no workspaceProblems in /api/health). Stop that process, then try again." >&2
			exit 1
		fi
	elif [[ -n "${_hy}" ]]; then
		echo "error: port ${_port} is in use but /api/health is not Way of Pi. Free the port or set WOP_SERVER_PORT." >&2
		exit 1
	fi
fi

if [[ -z "${WOP_REUSE_BUN_API:-}" ]] && ! command -v bun >/dev/null 2>&1; then
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
	if [[ "${WOP_REUSE_BUN_API:-}" == "1" ]]; then
		exec npm run electron:dev:reuse-api
	fi
	exec npm run electron:dev
fi

open_browser_when_ready &
exec npm run dev
