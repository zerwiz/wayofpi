#!/usr/bin/env python3
"""Emit Pi project settings JSON for enable-playground-in-project.

Reads <playground>/.pi/settings.json and prints JSON with paths made absolute
under the playground root, plus:

- Every playground extension entry point: listed extensions first, then all
  `.pi/extensions/*.ts` shims, then `extensions/*.ts` factories that have no
  same-named shim (helpers skipped).
- `.pi/skills` and `.pi/themes` when present.
"""
from __future__ import annotations

import json
import os
import sys

# TypeScript modules under extensions/ that are not Pi extension factories.
_SKIP_EXT_ROOT = frozenset({"themeMap.ts", "chatLabels.ts", "agent-dir-scan.ts"})

# Full-link merge skips these factories (opt in via `just ext-pi-pi` or an explicit `pi-e` line).
_FULL_MERGE_OPT_IN = frozenset({"pi-pi.ts"})

# Do not auto-merge dispatcher / grid extensions into app repos — use `just ext-agent-team`,
# `just ext-builder-team`, `just ext-agent-chain`, or `pi-e` instead.
_FULL_MERGE_SKIP = frozenset({"agent-team.ts", "agent-team-build-orchestra.ts"})


def _abs_under(base: str, *parts: str) -> str:
    return os.path.normpath(os.path.join(base, *parts))


def _abs_prompt(pi_settings_dir: str, rel: str) -> str:
    """Paths in .pi/settings.json are relative to the `.pi/` directory."""
    if rel.startswith("/"):
        return rel
    return os.path.normpath(os.path.join(pi_settings_dir, rel))


def _maybe_add_unique(seq: list[str], path: str) -> None:
    if path not in seq:
        seq.append(path)


def _merge_extension_paths(
    playground: str,
    pi_dir: str,
    settings_extensions: list[str],
) -> list[str]:
    """Ordered, deduped absolute paths: settings → shims → root factories."""
    ordered: list[str] = []
    seen: set[str] = set()

    def push(path: str) -> None:
        p = os.path.normpath(path)
        if p not in seen:
            seen.add(p)
            ordered.append(p)

    for e in settings_extensions:
        push(e)

    shim_dir = os.path.join(pi_dir, "extensions")
    shim_names: set[str] = set()
    if os.path.isdir(shim_dir):
        for name in sorted(os.listdir(shim_dir)):
            if not name.endswith(".ts"):
                continue
            shim_names.add(name)
            push(os.path.join(shim_dir, name))

    ext_dir = os.path.join(playground, "extensions")
    if os.path.isdir(ext_dir):
        for name in sorted(os.listdir(ext_dir)):
            if not name.endswith(".ts") or name in _SKIP_EXT_ROOT:
                continue
            if name in _FULL_MERGE_OPT_IN:
                continue
            if name in _FULL_MERGE_SKIP:
                continue
            if name in shim_names:
                continue
            full = os.path.join(ext_dir, name)
            if os.path.isfile(full):
                push(full)

    sess_index = os.path.join(ext_dir, "sessions", "index.ts")
    if os.path.isfile(sess_index) and "session-saver.ts" not in shim_names:
        push(sess_index)

    return ordered


def main() -> None:
    argv = sys.argv[1:]
    lean = False
    if argv and argv[-1] == "--lean":
        lean = True
        argv = argv[:-1]
    if len(argv) != 1:
        print(
            "usage: render-playground-project-settings.py <playground-root> [--lean]",
            file=sys.stderr,
        )
        sys.exit(2)
    playground = os.path.abspath(argv[0])
    pi_dir = os.path.join(playground, ".pi")
    settings_path = os.path.join(pi_dir, "settings.json")
    if not os.path.isfile(settings_path):
        print(f"missing: {settings_path}", file=sys.stderr)
        sys.exit(1)

    with open(settings_path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        print("playground .pi/settings.json must be a JSON object", file=sys.stderr)
        sys.exit(1)

    out: dict = dict(data)

    exts = out.get("extensions")
    if exts is None:
        exts = []
    if not isinstance(exts, list):
        print('settings "extensions" must be a list', file=sys.stderr)
        sys.exit(1)
    abs_exts: list[str] = []
    for e in exts:
        if not isinstance(e, str):
            continue
        if e.startswith("/"):
            abs_exts.append(e)
        else:
            abs_exts.append(_abs_under(playground, e))
    out["extensions"] = (
        abs_exts if lean else _merge_extension_paths(playground, pi_dir, abs_exts)
    )

    prompts = out.get("prompts")
    if prompts is None:
        prompts = []
    if not isinstance(prompts, list):
        print('settings "prompts" must be a list', file=sys.stderr)
        sys.exit(1)
    abs_prompts: list[str] = []
    for p in prompts:
        if not isinstance(p, str):
            continue
        abs_prompts.append(_abs_prompt(pi_dir, p))
    out["prompts"] = abs_prompts

    skills = out.get("skills")
    if skills is None:
        skills = []
    if not isinstance(skills, list):
        print('settings "skills" must be a list', file=sys.stderr)
        sys.exit(1)
    abs_skills = [os.path.normpath(s) if s.startswith("/") else _abs_under(playground, s) for s in skills if isinstance(s, str)]
    skills_dir = os.path.join(pi_dir, "skills")
    if os.path.isdir(skills_dir):
        _maybe_add_unique(abs_skills, os.path.normpath(skills_dir))
    out["skills"] = abs_skills

    themes_dir = os.path.join(pi_dir, "themes")
    if os.path.isdir(themes_dir):
        themes = out.get("themes")
        if themes is None:
            themes = []
        if not isinstance(themes, list):
            themes = []
        abs_themes = [os.path.normpath(t) if t.startswith("/") else _abs_under(playground, t) for t in themes if isinstance(t, str)]
        _maybe_add_unique(abs_themes, os.path.normpath(themes_dir))
        out["themes"] = abs_themes

    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
