#!/usr/bin/env python3
"""Remove opt-in-only extension paths from a linked project's .pi/settings.json.

Playground FULL merge used to inject pi-pi.ts; re-runs may only write settings.playground.json.
This patches the on-disk file so Pi stops loading those entries."""
from __future__ import annotations

import json
import os
import sys

# Basename or suffix match (linked settings use absolute paths).
_DROP_SUFFIXES = ("pi-pi.ts",)


def main() -> None:
    if len(sys.argv) != 2:
        print("usage: sanitize-linked-playground-settings.py <path-to/.pi/settings.json>", file=sys.stderr)
        sys.exit(2)
    path = os.path.abspath(sys.argv[1])
    if not os.path.isfile(path):
        sys.exit(0)
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        sys.exit(0)
    if not isinstance(data, dict):
        sys.exit(0)
    exts = data.get("extensions")
    if not isinstance(exts, list):
        sys.exit(0)
    new_exts: list[str] = []
    removed = False
    for e in exts:
        if not isinstance(e, str):
            new_exts.append(e)
            continue
        if any(e.rstrip("/").endswith(s) for s in _DROP_SUFFIXES):
            removed = True
            continue
        new_exts.append(e)
    if not removed:
        sys.exit(0)
    data["extensions"] = new_exts
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print(f"sanitize-linked-playground-settings: removed opt-in extension(s) from {path}", file=sys.stderr)


if __name__ == "__main__":
    main()
