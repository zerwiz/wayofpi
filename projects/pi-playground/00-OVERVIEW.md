# Overview

This project folder (`projects/pi-playground/`) serves as **documentation artifacts** for when Pi works on a specific codebase or sustained workflow.

**Note:** This template is copied when a new workspace is scanned. The final populated version lives at:
- Template: `/home/zerwiz/.pi/projects/_template/` (this file)
- Generated: `/home/zerwiz/.pi/projects/<slug>/` where `<slug>` is the codebase name

The `projects/pi-playground/` folder here tracks **meta-documents** about the pi-playground playground itself, while `projects/myrepo/` would track documents about `myrepo` when agents work on it.

See [INDEX.md](INDEX.md) for the complete project map.

---

## Problem

When Pi spends multiple sessions on a codebase, it needs to remember:

1. How to reinstall dependencies
2. Which files mean what
3. What commands run tests and start servers
4. What the project structure is
5. Any important decisions or notes discovered

This folder captures that knowledge.

---

## Scope

- **Scope:** Documentation for specific codebases/projects while Pi works on them.
- **Content:** Stack discovery, file purposes, commands, env vars, decisions.
- **Template:** Copied from `projects/_template/` when bootstrapping.

---

## Non-goals

- **Not** a place to paste the entire codebase README (link to it instead).
- **Not** for committing secrets (use environment placeholders).
- **Not** for storing ephemeral session state (gitignored subtrees).

---

## Success Criteria

- ✅ `01-CONTEXT.md` has commands for install/test/run
- ✅ `00-OVERVIEW.md` has scope/success criteria
- ✅ `INDEX.md` (project-wide) maps all repos/paths/agents
- ✅ Documentation updated before session end or major refactor
- ✅ No secrets in commit (redacted credentials)

---

## Related

- [projects/README.md](../README.md) — Rules and naming conventions
- [INDEX.md](INDEX.md) — Complete project index
- `projects/_template/` — Template files copied from here
