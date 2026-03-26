#!/usr/bin/env python3
"""Project settings: extensions [] (Pi loads only CLI -e), skills/themes/prompts from playground + local .pi/skills."""
from __future__ import annotations

import json
import os
import sys


def _abs_under(base: str, *parts: str) -> str:
    return os.path.normpath(os.path.join(base, *parts))


def _abs_prompt(pi_settings_dir: str, rel: str) -> str:
    if rel.startswith("/"):
        return rel
    return os.path.normpath(os.path.join(pi_settings_dir, rel))


def _unique(seq: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for x in seq:
        n = os.path.normpath(x)
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def main() -> None:
    if len(sys.argv) != 3:
        print(
            "usage: render-project-wired-playground-settings.py <playground-root> <project-root>",
            file=sys.stderr,
        )
        sys.exit(2)
    playground = os.path.abspath(sys.argv[1])
    project = os.path.abspath(sys.argv[2])
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

    proj_pi = os.path.join(project, ".pi")
    local_skills = os.path.join(proj_pi, "skills")

    skills_pg = data.get("skills")
    if skills_pg is None:
        skills_pg = []
    if not isinstance(skills_pg, list):
        skills_pg = []
    abs_skills = [
        os.path.normpath(s) if isinstance(s, str) and s.startswith("/") else _abs_under(playground, s)
        for s in skills_pg
        if isinstance(s, str)
    ]
    pg_skills_dir = os.path.join(pi_dir, "skills")
    if os.path.isdir(pg_skills_dir):
        abs_skills.append(os.path.normpath(pg_skills_dir))
    abs_skills.append(os.path.normpath(local_skills))
    abs_skills = _unique(abs_skills)

    prompts = data.get("prompts")
    if prompts is None:
        prompts = []
    if not isinstance(prompts, list):
        prompts = []
    abs_prompts = [_abs_prompt(pi_dir, p) for p in prompts if isinstance(p, str)]

    out: dict = {
        "extensions": [],
        "skills": abs_skills,
        "prompts": abs_prompts,
    }

    themes_dir = os.path.join(pi_dir, "themes")
    if os.path.isdir(themes_dir):
        themes = data.get("themes")
        if themes is None:
            themes = []
        if not isinstance(themes, list):
            themes = []
        abs_themes = [
            os.path.normpath(t) if isinstance(t, str) and t.startswith("/") else _abs_under(playground, t)
            for t in themes
            if isinstance(t, str)
        ]
        td = os.path.normpath(themes_dir)
        if td not in abs_themes:
            abs_themes.append(td)
        out["themes"] = _unique(abs_themes)

    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
