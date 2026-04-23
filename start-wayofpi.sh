#!/usr/bin/env bash
# Start Way of Pi application (Bun API + Vite + Electron).
# **Default behavior:** Launches the **Electron desktop window** with the Way of Pi UI.
# Same full stack as ./start-full-system.sh or: just wayofpi-full
# Usage: from repo root: ./start-wayofpi.sh
# To start browser-only UI: set **`WOP_USE_ELECTRON=0`** before running
set -euo pipefail

# GUI .desktop launches often have a minimal PATH — include common locations for bun / npm / pi / cargo.
export PATH="${HOME}/.bun/bin:${HOME}/.local/bin:${HOME}/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$ROOT/apps/wayofpi-ui"

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

# Match **`apps/wayofpi-ui/vite.config.ts`** (default **5173**, **`strictPort`** — no silent **5174** fallback).
_vite_port="${WOP_VITE_PORT:-5173}"
URL="${WOP_UI_URL:-http://localhost:${_vite_port}/}"

cd "$UI_DIR"

# Phones must use this machine's LAN IPv4 + the same port as Vite (see "Network:" in the Vite log).
_vh="${WOP_VITE_HOST:-}"
_vh_lc="$(printf '%s' "$_vh" | tr '[:upper:]' '[:lower:]')"
if [[ "$_vh_lc" != "local" && "$_vh_lc" != "localhost" && "$_vh_lc" != "loopback" ]] && command -v ip >/dev/null 2>&1; then
	_wop_lan_ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<NF;i++) if($i=="src"){print $(i+1); exit}}' || true)"
	if [[ -n "$_wop_lan_ip" && "$_wop_lan_ip" != "127.0.0.1" ]]; then
		echo "Remote dev (phone/tablet, same Wi‑Fi): http://${_wop_lan_ip}:${_vite_port}/"
		echo "If the page does not load: stop any old Vite on port ${_vite_port}, restart this script, allow tcp/${_vite_port} through the firewall, and use this machine's IP (from ip route / Settings). ERR_CONNECTION_REFUSED on localhost:${_vite_port} means the dev server is not running."
	fi
fi

# Electron dev: if a compatible Bun API is already on WOP_SERVER_PORT, do not start a second server (avoids EADDRINUSE when the menu launcher runs while an old API is still bound).
if [[ "${WOP_USE_ELECTRON:-1}" == "1" && -z "${WOP_REUSE_BUN_API:-}" ]]; then
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

if [[ "${WOP_USE_ELECTRON:-1}" == "1" ]]; then
	if [[ "${WOP_REUSE_BUN_API:-}" == "1" ]]; then
		exec npm run electron:dev:reuse-api
	fi
	exec npm run electron:dev
fi

open_browser_when_ready &
exec npm run dev
