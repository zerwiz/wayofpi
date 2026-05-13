#!/usr/bin/env bash
# Launch `pi` with cwd = app project while loading extensions from the playground clone.
# - Converts relative -e paths against PLAYGROUND_ROOT (so -e works after cd).
# - Optional: temporarily rename PROJECT_DIR/tools so Pi skips the legacy custom-tools
#   scanner (restored on exit). Non-Pi project scripts often live in tools/ — this only
#   hides the directory name from Pi for this process; it does not delete anything.
#
# Usage:
#   pi-launch-from-project.sh <abs-project-dir> <abs-playground-root> -e rel/or/abs.ts ...
#
# Env:
#   PI_SHADOW_LEGACY_PROJECT_TOOLS — 1 (default when unset and caller expects it) moves
#     ./tools aside for the session. Set to 0 to never shadow.
#   PI_SKIP_LINKED_SETTINGS_SANITIZE — set to 1 to skip patching .pi/settings.json (removes
#     stale e.g. pi-pi.ts from playground-linked projects).
#   PIE_CLEAR_SETTINGS_EXTENSIONS — when 1, backup .pi/settings.json and set extensions[]
#     to [] for this run (restore on exit). pi-e uses this for option 2 / extension picks
#     (project-scoped); option 1 (FULL) keeps JSON extensions. PIE_KEEP_SETTINGS_EXTENSIONS=1
#     always keeps settings extensions. If Pi dies before EXIT, run `pi-e backup` (or `restore`)
#     from the app repo — scripts/ppi recovers .pi/.settings.json.pi-e-restore (and tools shadow).
#
set -euo pipefail

PROJECT_DIR="$(cd "${1:?project dir}" && pwd)"
PLAYGROUND_ROOT="$(cd "${2:?playground root}" && pwd)"
shift 2

abs_args=()
while (($#)); do
	case "$1" in
	-e)
		shift
		p="${1:?}"
		if [[ "$p" == /* ]]; then
			abs_args+=(-e "$p")
		else
			abs_args+=(-e "$PLAYGROUND_ROOT/$p")
		fi
		shift
		;;
	*)
		abs_args+=("$1")
		shift
		;;
	esac
done

STASH=""
SETTINGS_BAK="$PROJECT_DIR/.pi/.settings.json.pi-e-restore"

restore_settings_json() {
	if [[ -f "$SETTINGS_BAK" ]]; then
		mv -f "$SETTINGS_BAK" "$PROJECT_DIR/.pi/settings.json"
		echo "pi-launch-from-project: restored .pi/settings.json from pi-e backup" >&2
	fi
}

restore_tools() {
	if [[ -z "$STASH" || ! -d "$STASH" ]]; then
		return 0
	fi
	local target="$PROJECT_DIR/tools"
	if [[ -e "$target" ]]; then
		echo "pi-launch-from-project: not restoring $STASH — $target already exists" >&2
		STASH=""
		return 1
	fi
	mv "$STASH" "$target"
	STASH=""
}

on_exit() {
	restore_settings_json || true
	restore_tools || true
}

TDIR="$PROJECT_DIR/tools"
if [[ "${PI_SHADOW_LEGACY_PROJECT_TOOLS:-0}" == "1" ]]; then
	if [[ -d "$TDIR" && ! -L "$TDIR" ]]; then
		mkdir -p "$PROJECT_DIR/.pi"
		STASH="$PROJECT_DIR/.pi/.pi-tools-shadow.$$"
		if [[ -e "$STASH" ]]; then
			echo "pi-launch-from-project: stale $STASH exists — remove it or restore tools manually" >&2
			exit 1
		fi
		echo "pi-launch-from-project: ./tools hidden for this Pi session only (restored on exit). PI_SHADOW_LEGACY_PROJECT_TOOLS=0 to disable." >&2
		mv "$TDIR" "$STASH"
	fi
fi

export PI_USER_PROJECT_DIR="$PROJECT_DIR"
cd "$PROJECT_DIR"
export PWD="$PROJECT_DIR"

CLR="$PLAYGROUND_ROOT/scripts/pi-e-clear-settings-extensions.py"
SNAP="$PROJECT_DIR/.pi/settings.json"

if [[ "${PIE_CLEAR_SETTINGS_EXTENSIONS:-0}" == "1" && -f "$SNAP" && -f "$CLR" ]]; then
	cp -f "$SNAP" "$SETTINGS_BAK"
	if ! python3 "$CLR" "$SNAP"; then
		mv -f "$SETTINGS_BAK" "$SNAP" 2>/dev/null || true
		echo "pi-launch-from-project: failed to patch settings.json; aborting" >&2
		exit 1
	fi
	echo "pi-launch-from-project: cleared settings extensions[] for this session (backup → $SETTINGS_BAK)" >&2
elif [[ "${PI_SKIP_LINKED_SETTINGS_SANITIZE:-0}" != "1" && -f "$PROJECT_DIR/.pi/.playground-from" && -f "$SNAP" ]]; then
	# Stale FULL merges may still list pi-pi.ts when not using CLI-only stack mode
	SAN="$PLAYGROUND_ROOT/scripts/sanitize-linked-playground-settings.py"
	if [[ -f "$SAN" ]]; then
		python3 "$SAN" "$SNAP" || true
	fi
fi

trap on_exit EXIT INT TERM HUP
set +e
PI_BIN="pi"
if [[ -f "$PLAYGROUND_ROOT/node_modules/.bin/pi" ]]; then
    PI_BIN="$PLAYGROUND_ROOT/node_modules/.bin/pi"
fi
export PI_CODING_AGENT_DIR="$PLAYGROUND_ROOT/.pi/agent"
"$PI_BIN" "${abs_args[@]}"
rc=$?
set -e
exit "$rc"
