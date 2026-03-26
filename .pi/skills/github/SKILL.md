---
name: github
description: GitHub workflows with branches and git worktrees so multiple agents (or Pi sessions) work in parallel in the same repo without stepping on each other’s files. Use for parallel specialists, agent-team handoffs, feature isolation, or before opening a PR.
allowed-tools: read write edit bash grep find ls
---

# GitHub + branches + worktrees (multi-agent)

Use this skill when you need **isolated working directories** in **one Git repository**: each agent or session gets its **own branch** and **own worktree path**, while **GitHub** remains the single remote source of truth.

## Concepts

| Idea | Role |
|------|------|
| **Branch** | Line of commits; one logical task or agent lane. |
| **Worktree** | A **second checkout** of the same repo at another path, locked to a branch. Multiple worktrees = parallel trees on disk, one `.git` (main repo holds all refs). |
| **GitHub** | **`origin`** remote; push branches, open PRs (`gh` CLI optional). |

**Why worktrees for agents:** Pi’s **cwd** is per session. Run **session A** in **`../myrepo.wt/agent-scout`**, **session B** in **`../myrepo.wt/agent-builder`**—no file contention; merge via Git, not copy/paste.

## Prerequisites

- **Git 2.5+** (`git worktree` is built in).
- Repo already has **`origin`** pointing at GitHub (HTTPS or SSH).
- **Clean state** on the branch you branch from (`git status`); stash or commit WIP first if needed.

## Naming convention (recommended)

Pick a stable **slug** per agent or task so paths and branches stay unique:

```text
Branch:  agent/<agent-or-role>/<short-slug>     e.g. agent/scout/map-extensions
Path:    <repo>.wt/<same-slug-or-role>         e.g. ../pi.wt/scout-map-extensions
```

Avoid spaces in branch and directory names.

## One-time: directory for extra worktrees

From the **main repo** root (the first checkout, where `.git` is a directory):

```bash
# Example: repo at ~/proj/myapp — keep worktrees as siblings
mkdir -p ../myapp.wt
```

All `git worktree add` paths below are **relative to the main repo** unless you use absolute paths.

## Create a new branch + worktree (new agent lane)

Run from the **main** repository (not inside another worktree unless you know what you’re doing):

```bash
cd /path/to/main/repo

# Update baseline
git fetch origin

# New branch from main (or develop)
git worktree add -b agent/builder/add-widget ../myapp.wt/add-widget origin/main
# If the branch already exists locally:
# git worktree add ../myapp.wt/add-widget agent/builder/add-widget
```

Then **start the Pi session with cwd** = **`../myapp.wt/add-widget`** (absolute path in **`dispatch_agent`** tasks).

## List and inspect worktrees

```bash
git worktree list
```

Shows each path, branch, and whether locked. **Always** verify you are in the intended worktree before editing:

```bash
git rev-parse --show-toplevel
git branch --show-current
```

## Remove a worktree when done

From **any** worktree of the repo:

```bash
git worktree remove /absolute/path/to/myapp.wt/add-widget
# or, if the folder was deleted manually:
git worktree prune
```

Delete the branch on GitHub only after merge or explicit abandon:

```bash
git push origin --delete agent/builder/add-widget   # optional
```

## GitHub: push and PR

Inside the **worktree** (correct cwd):

```bash
git push -u origin HEAD
```

Optional (**[GitHub CLI](https://cli.github.com/)**):

```bash
gh pr create --fill --base main
```

## Multi-agent dispatcher pattern (agent-team)

1. **Planner** writes **`plans/PLAN-*.md`** with one subsection **Per-agent worktrees** listing **absolute path** + **branch** per specialist.
2. **Dispatcher** **`dispatch_agent`** with **`cwd`** set to that agent’s worktree path (if your Pi/agent-team supports per-dispatch cwd; otherwise state the path loudly in the task and require the specialist to **`cd`** first via **`bash`**).
3. **No two agents** share the same worktree path for write work.

If cwd cannot be set per subagent, open **separate Pi terminals** and **`cd`** each to its worktree before starting the session.

## Safety rules

- **Never** run destructive git (`reset --hard`, `clean -fdx`, `worktree remove`) on paths you did not verify.
- **Do not** check out the **same branch** in two worktrees—Git forbids it; use one branch per worktree.
- Resolve **merge conflicts** in one worktree, push, then **`git fetch`** in others.

## Optional: manifest file (human + agents)

To remember who owns which tree, maintain **`docs/WORKTREE_MANIFEST.md`** (or **`plans/worktrees.md`**) in the **main** repo:

```markdown
| Agent / task | Branch | Absolute path | Status |
|--------------|--------|---------------|--------|
| scout-1 | agent/scout/foo | /home/me/proj.wt/foo | active |
```

Update when adding/removing worktrees.

## Quick reference

| Goal | Command |
|------|---------|
| New worktree + branch from `origin/main` | `git worktree add -b <branch> <path> origin/main` |
| Attach existing branch | `git worktree add <path> <branch>` |
| List | `git worktree list` |
| Remove | `git worktree remove <path>` |
| Push branch | `git push -u origin HEAD` |

## Pi helpers

- **Skill:** `/skill:github` (this file).
- Works with **agent-team**: put the **worktree absolute path** in every handoff.
- **Hermes** (if used) supports **`--worktree`** for its own isolation—orthogonal to Git worktrees; you can combine both when needed.
