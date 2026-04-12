#!/usr/bin/env bash
# Way of Pi — repo path doctor: find (and optionally fix) machine-specific paths
# that break clones (stale .playground-from, absolute settings.json entries,
# and stray /home/zerwiz examples in hub docs / agents).
#
# Usage:
#   ./doctor.sh              # report only (exit 1 if problems found)
#   ./doctor.sh --fix        # apply safe fixes under this repo checkout
#   ./doctor.sh --project /path/to/other/repo   # extra read-only checks there
#
# Requires: bash, python3
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIX=0
EXTRA_PROJECT=""

usage() {
	sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--fix)
			FIX=1
			shift
			;;
		--project)
			EXTRA_PROJECT="${2:?--project requires a directory}"
			if [[ ! -d "$EXTRA_PROJECT" ]]; then
				echo "error: not a directory: $EXTRA_PROJECT" >&2
				exit 2
			fi
			EXTRA_PROJECT="$(cd "$EXTRA_PROJECT" && pwd)"
			shift 2
			;;
		-h | --help)
			usage
			exit 0
			;;
		*)
			echo "error: unknown option: $1 (try --help)" >&2
			exit 2
			;;
	esac
done

if ! command -v python3 >/dev/null 2>&1; then
	echo "error: python3 is required for JSON checks" >&2
	exit 127
fi

export ROOT FIX EXTRA_PROJECT

python3 <<'PY'
from __future__ import annotations

import glob
import json
import os
import sys

root = os.environ["ROOT"]
fix = os.environ.get("FIX") == "1"
extra = os.environ.get("EXTRA_PROJECT", "").strip()

issues = 0

def warn(msg: str) -> None:
    global issues
    issues += 1
    print(f"[WARN] {msg}", file=sys.stderr)

def note(msg: str) -> None:
    print(f"[OK]   {msg}")


def handle_repo_root_playground_marker() -> None:
    p = os.path.join(root, ".playground-from")
    if not os.path.isfile(p):
        return
    if fix:
        try:
            os.remove(p)
            note("Removed .playground-from at repo root.")
        except OSError as e:
            warn(f"Could not remove .playground-from: {e}")
        return
    try:
        line = open(p, encoding="utf-8").read().splitlines()[0].strip()
    except OSError:
        line = ""
    warn(
        "Remove repo-root .playground-from (machine-specific; should not live in the checkout). "
        f"First line: {line!r}"
    )


def norm_join(*parts: str) -> str:
    return os.path.normpath(os.path.join(*parts))


def under_repo(path: str) -> bool:
    try:
        p = os.path.realpath(path)
        r = os.path.realpath(root)
    except OSError:
        return False
    return p == r or p.startswith(r + os.sep)


def portable_string(s: str, key: str, settings_path: str) -> str | None:
    """Return a portable replacement, or None if no change / unknown."""
    if not isinstance(s, str) or not s.strip():
        return None
    s = s.strip()
    if not os.path.isabs(s):
        return None

    sp = os.path.normpath(settings_path)
    pi_dir = norm_join(root, ".pi")

    try:
        if under_repo(s):
            return os.path.relpath(s, root).replace("\\", "/")
    except ValueError:
        pass

    bn = os.path.basename(s)
    if key == "extensions" and bn.endswith(".ts"):
        for rel in (norm_join(root, ".pi", "extensions", bn), norm_join(root, "extensions", bn)):
            if os.path.isfile(rel):
                return os.path.relpath(rel, root).replace("\\", "/")

    if key in ("skills", "themes"):
        base = "skills" if key == "skills" else "themes"
        cand = norm_join(root, ".pi", base)
        if os.path.isdir(cand) and (s.rstrip("/").endswith(base) or base in s.replace("\\", "/")):
            return os.path.relpath(cand, root).replace("\\", "/")

    if key == "prompts":
        cmd = norm_join(root, ".claude", "commands")
        if os.path.isdir(cmd):
            if sp.startswith(pi_dir + os.sep) or sp == pi_dir:
                return "../.claude/commands"
            return ".claude/commands"

    return None


def scan_settings_json(path: str) -> list[str]:
    out: list[str] = []
    if not os.path.isfile(path):
        return out
    try:
        data = json.load(open(path, encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        warn(f"{path}: cannot read JSON ({e})")
        return out
    if not isinstance(data, dict):
        return out
    for key in ("extensions", "prompts", "skills", "themes"):
        val = data.get(key)
        if not isinstance(val, list):
            continue
        for i, item in enumerate(val):
            if not isinstance(item, str):
                continue
            s = item.strip()
            if not s or not os.path.isabs(s):
                continue
            rep = portable_string(s, key, path)
            if rep is not None and rep != s:
                out.append(
                    f"{path}: {key}[{i}] non-portable absolute path — run ./doctor.sh --fix. Current: {s}"
                )
            elif rep is None:
                out.append(
                    f"{path}: {key}[{i}] absolute path not mapped to this repo (edit by hand): {s}"
                )
    return out


def fix_settings_json(path: str) -> bool:
    if not os.path.isfile(path):
        return False
    try:
        data = json.load(open(path, encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    if not isinstance(data, dict):
        return False
    file_changed = False
    for key in ("extensions", "prompts", "skills", "themes"):
        val = data.get(key)
        if not isinstance(val, list):
            continue
        new_list: list = []
        key_changed = False
        for item in val:
            if isinstance(item, str):
                raw = item.strip()
                rep = portable_string(raw, key, path)
                if rep is not None and rep != raw:
                    new_list.append(rep)
                    key_changed = True
                    continue
            new_list.append(item)
        if key_changed:
            data[key] = new_list
            file_changed = True
    if file_changed:
        text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        open(path, "w", encoding="utf-8").write(text)
    return file_changed


def check_extra_project() -> None:
    if not extra:
        return
    print(f"Extra checks (--project): {extra}")
    marker = os.path.join(extra, ".pi", ".playground-from")
    if os.path.isfile(marker):
        try:
            tgt = open(marker, encoding="utf-8").read().splitlines()[0].strip()
        except OSError:
            tgt = ""
        if not tgt:
            warn(f"{marker}: empty first line")
        elif not os.path.isdir(tgt):
            warn(
                f"{marker}: points to missing directory: {tgt} "
                "(re-link from this machine: scripts/disable-playground-in-project then enable-playground-in-project)."
            )
        else:
            note(f"Project link {marker} -> exists: {tgt}")
    else:
        note(f"No {marker} (not a playground-linked .pi/)")

    sp = os.path.join(extra, ".pi", "settings.json")
    if os.path.isfile(sp):
        for msg in scan_settings_json(sp):
            warn(msg)
    else:
        note(f"No {sp}")


FILES_REL = (
    "settings.json",
    "settings.playground.json",
    ".pi/settings.playground.json",
    ".pi/settings.json",
)

# Machine-specific example path that must not creep back into agents / hub docs.
STALE_HOME_SNIPPET = "/home/zerwiz"

TEXT_PATHS_FOR_STALE_SNIPPET = (
    "agent/AGENTS.md",
    "projects/README.md",
    ".cursor/rules/pi-projects-docs.mdc",
    ".cursor/rules/pi-documentation-consistency.mdc",
    "docs/REPO_INDEX.md",
    "docs/PLAYGROUND.md",
)


def scan_stale_home_path_refs() -> None:
    for rel in TEXT_PATHS_FOR_STALE_SNIPPET:
        path = os.path.join(root, rel)
        if not os.path.isfile(path):
            continue
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        if STALE_HOME_SNIPPET in text:
            warn(
                f"{rel}: contains {STALE_HOME_SNIPPET!r} — replace with repo-relative paths or placeholders."
            )
    for path in sorted(glob.glob(os.path.join(root, ".pi", "agents", "*.md"))):
        if not os.path.isfile(path):
            continue
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        if STALE_HOME_SNIPPET in text:
            rel = os.path.relpath(path, root).replace("\\", "/")
            warn(
                f"{rel}: contains {STALE_HOME_SNIPPET!r} — use PLAYGROUND_ROOT / repo-relative docs, not a fixed home path."
            )


def run_repo_checks() -> None:
    global issues
    issues = 0
    handle_repo_root_playground_marker()
    for rel in FILES_REL:
        path = os.path.join(root, rel)
        for msg in scan_settings_json(path):
            warn(msg)
    scan_stale_home_path_refs()


def main() -> None:
    print(f"Way of Pi path doctor (repo: {root})")
    if fix:
        print("Mode: --fix (will modify files under this repo when safe)")
    else:
        print("Mode: check only (pass --fix to rewrite portable paths)")
    print()

    run_repo_checks()

    if fix:
        for rel in FILES_REL:
            path = os.path.join(root, rel)
            if fix_settings_json(path):
                note(f"Rewrote portable paths in {rel}")
        run_repo_checks()

    check_extra_project()

    if issues:
        print(file=sys.stderr)
        print(
            f"Found {issues} problem(s). Review messages above.",
            file=sys.stderr,
        )
        if not fix:
            print("Hint: run ./doctor.sh --fix to remove repo-root .playground-from and relativize paths.", file=sys.stderr)
        sys.exit(1)

    print()
    note("No path issues detected for this checkout.")


if __name__ == "__main__":
    main()
PY

status=$?
if [[ "$status" -eq 0 ]]; then
	echo
	echo "Docs: scripts/enable-playground-in-project, Help → Host doctor in Way of Pi UI."
fi
exit "$status"
