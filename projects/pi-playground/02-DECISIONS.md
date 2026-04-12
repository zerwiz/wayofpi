# Decisions Log

This file records dated decisions made by agents or the user while working on this codebase (or the playground itself).

---

## 2026-03-26 — Initial project scan

- **Project scanned:** Pi / Way of Pi playground repo (path on scanner’s machine; use `git rev-parse --show-toplevel` from the clone)
- **Slug chosen:** `pi-playground`
- **Documentation created:** `projects/pi-playground/` (copied from `_template/`)
- **KEY FILE:** INDEX.md — Comprehensive project map covering:
  - Core extensions (23 files in `extensions/`)
  - Agents (18+.md personas + teams.yaml)
  - Skills (6 skills, including built-in)
  - Themes (12 JSON theme configs)
  - Scripts and utilities
  - Documentation structure
  - Git-ignored areas
  - Configuration files

- **Decisions:**
  - Use `projects/<slug>/` for per-codebase documentation
  - Copy `_template/` files when new workspace is discovered
  - `project-scanner` agent (team `new-project`) handles bootstrapping
  - Use `INDEX.md` as project-wide map; `projects/<slug>/INDEX.md` for codebase-specific maps

---

## Future decisions / open items

(Leave blank for agents / humans to fill.)

<!--
- [ ] Decide when to merge project notes into docs/
- [ ] How to handle old project folders
-->

---

## How to add decisions

Agents and users can append decisions here:

```markdown
## YYYY-MM-DD — Decision title

- Decision: ...
- Rationale: ...
- Alternatives: ...
```

Or delegate to: [04-TASKS.md](04-TASKS.md) or [03-NOTES.md](03-NOTES.md).
