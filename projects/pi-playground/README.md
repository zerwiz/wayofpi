# Pi Playground Project Documentation

**Playground root:** your Way of Pi / Pi playground **git clone** (directory that contains `extensions/`, `.pi/`, `projects/`).  
**Last updated:** 2026-03-26

## Goal

This documentation set (`projects/pi-playground/`) tracks on-disk documentation that Pi agents create while working on specific codebases or sustained tasks.

- **Template:** Files copied from `projects/_template/` (README, 00-04 overview/markdown).
- **Usage:** Created by `project-scanner` agent (team `new-project`) when scanning a new workspace.
- **Location:** `projects/pi-playground/` (under that clone)

### Purpose

When Pi works on a different codebase (not this playground repo), agents create `projects/<slug>/` documentation to remember:

- Stack signals (`package.json`, `pyproject.toml`, Dockerfiles, etc.)
- Key file locations and purposes
- Commands to install/test/run
- Environment variables (names only)
- Integration points (APIs, ports)
- Decisions, notes, and tasks

This folder is **not** the playground itself — it's **per-codebase notes** generated while Pi works on external projects.

---

## Links

- Full playground docs: [docs/README.md](../../docs/README.md)
- Project rules: [projects/README.md](../README.md)
- This project: `projects/pi-playground/` (relative to the playground repo root)

---

## Files in this folder (template)

| File | Purpose |
|------|--------|
| `README.md` | Goal, links, last updated |
| `00-OVERVIEW.md` | Scope, success criteria, non-goals |
| `01-CONTEXT.md` | Paths, stack, commands, env vars |
| `02-DECISIONS.md` | Dated decisions log |
| `03-NOTES.md` | Scratch discoveries |
| `04-TASKS.md` | Next steps / checklist |
| `INDEX.md` | Comprehensive project index |
| `attachments/` | Optional artifacts (no secrets) |

---

## For Users

Agents (e.g. `project-scanner`, `indexer`, `code-documenter`) auto-populate these files when given a codebase to work on. You normally don't create new entries here unless asked.

See [projects/README.md](../README.md) for naming conventions and when to create `projects/<slug>/`.
