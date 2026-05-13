#!/usr/bin/env bash
# Launcher for Way of Pi from a pinned desktop entry (working dir = repo root).
# Opens the Electron shell by default so the dock/taskbar icon matches BrowserWindow.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# GNOME/KDE often start apps with a tiny PATH — Node/npm/Electron live outside it.
export PATH="${HOME}/.bun/bin:${HOME}/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

_wop_log() {
	mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/wayofpi"
	printf '%s %s\n' "$(date -Iseconds 2>/dev/null || date)" "$1" >>"${XDG_DATA_HOME:-$HOME/.local/share}/wayofpi/launch.log"
}

_wop_notify() {
	_wop_log "$1"
	if command -v notify-send >/dev/null 2>&1; then
		notify-send -a "Way of Pi" "Could not start" "$1" 2>/dev/null || true
	fi
}

exec "$ROOT/start-wayofpi.sh" "$@"
