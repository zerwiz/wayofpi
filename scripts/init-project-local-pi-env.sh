#!/usr/bin/env bash
# Initialize a project-local <target>/.pi/ for Pi (extensions/skills/agents under the repo).
#
# Usage:
#   init-project-local-pi-env.sh [/abs/path/to/project]
#   init-project-local-pi-env.sh [/abs/path/to/project] [/abs/path/to/playground-root]
#
# With two arguments (as from `pi-e` option 2): symlink playground agents/commands/damage-control,
# write `.playground-from`, and emit `settings.json` with extensions[] empty but skills/themes/prompts
# pointing at the playground so agent-team et al. see the main roster while you stack `-e` modules.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$(cd "${1:-$PWD}" && pwd)"
PLAYGROUND_WIRE="${2:-}"

if [[ ! -d "$TARGET" ]]; then
	echo "init-project-local-pi-env: not a directory: $TARGET" >&2
	exit 2
fi

MARKER="$TARGET/.pi/.project-local-pi"
OUT_MAIN="$TARGET/.pi/settings.json"
OUT_ALT="$TARGET/.pi/settings.project-local.json"
OUT_WIRED_ALT="$TARGET/.pi/settings.project-local-wired.json"
WIRE_RENDER="$SCRIPT_DIR/render-project-wired-playground-settings.py"
PAYLOAD=$(printf '%s\n' '{' '  "extensions": [],' '  "skills": [".pi/skills"],' '  "prompts": []' '}')

readme() {
	local r="$TARGET/.pi/README.md"
	[[ -f "$r" ]] && return 0
	cat >"$r" <<'EOF'
# Project-local Pi

Pi reads **`settings.json`** here when you open this repository.

- Add extension **shims** as **`.pi/extensions/*.ts`** (see the extension playground **docs/EXTENSIONS.md**).
- Add **skills** under **`.pi/skills/<name>/SKILL.md`**.
- To **port** something from the Pi extension playground clone, use agent **`playground-portal`** (`dispatch_agent` or **`/system`**) and point at the feature you want.

EOF
}

if [[ -n "$PLAYGROUND_WIRE" ]]; then
	PLAYGROUND_WIRE="$(cd "$PLAYGROUND_WIRE" && pwd)"
	if [[ ! -f "$WIRE_RENDER" ]]; then
		echo "init-project-local-pi-env: missing $WIRE_RENDER" >&2
		exit 3
	fi
	if ! command -v python3 >/dev/null 2>&1; then
		echo "init-project-local-pi-env: wired mode requires python3" >&2
		exit 127
	fi
	mkdir -p "$TARGET/.pi/extensions" "$TARGET/.pi/skills" "$TARGET/.pi/agents"
	# shellcheck source=/dev/null
	source "$SCRIPT_DIR/link-playground-agent-trees.sh"
	link_playground_agent_trees "$PLAYGROUND_WIRE" "$TARGET"
	echo "$PLAYGROUND_WIRE" >"$TARGET/.pi/.playground-from"
	WIRED_JSON="$(python3 "$WIRE_RENDER" "$PLAYGROUND_WIRE" "$TARGET")"
	if [[ ! -f "$OUT_MAIN" ]]; then
		echo "$WIRED_JSON" >"$OUT_MAIN"
		date -Iseconds >"$MARKER"
		readme
		echo "Wrote: $OUT_MAIN (extensions[] empty — choose extensions via pi-e / -e)"
		echo "Wrote: $MARKER"
		exit 0
	fi
	echo "$WIRED_JSON" >"$OUT_WIRED_ALT"
	readme
	echo "Wrote: $OUT_WIRED_ALT — merge into settings.json if you want playground-linked skills/agents paths."
	exit 0
fi

mkdir -p "$TARGET/.pi/extensions" "$TARGET/.pi/skills" "$TARGET/.pi/agents"

if [[ -f "$TARGET/.pi/.playground-from" ]]; then
	echo "init-project-local-pi-env: found .playground-from (playground-linked). Wrote template only — merge or run disable-playground-in-project to drop link." >&2
	echo "$PAYLOAD" >"$OUT_ALT"
	readme
	echo "Wrote: $OUT_ALT"
	exit 0
fi

if [[ -f "$OUT_MAIN" ]]; then
	echo "$PAYLOAD" >"$OUT_ALT"
	readme
	echo "Wrote: $OUT_ALT"
	echo "Note: $OUT_MAIN already exists — compare/merge; rename or merge into settings.json when ready."
	exit 0
fi

echo "$PAYLOAD" >"$OUT_MAIN"
date -Iseconds >"$MARKER"
readme
echo "Wrote: $OUT_MAIN"
echo "Wrote: $MARKER"
