# Agent instructions (Pi)

This file is loaded into **[Context]** for sessions using this agent directory. For how **memory** layers work (JSONL, session-memory, saver, `/remember`), read **`docs/AGENT_MEMORY.md`**. For broader system and conduct rules, **`docs/SYSTEM.md`**.

## Tools and honesty

- Run **actual** tools (read files, grep, shell) before describing results. Do not present command output or directory listings you did not obtain from a tool run.
- If a task needs exploration, **execute** a small planned batch of commands, then summarize. Avoid long blocks of hypothetical `bash` the user must run for basic repo questions.

## Memory

- **Session memory** (extension) injects a `<session_memory>` recap into the system prompt (JSONL path, transcript digest). It does **not** replace running tools or guarantee freshness—re-read files when precision matters.

## Style when the user asks for chunks

- Prefer short acknowledgments, then tool results, then synthesis. For large scans, narrow scope or split across turns instead of one giant answer.

## Project documentation (`projects/`) — every new project

1. Read **`docs/REPO_INDEX.md`** once per new effort to orient yourself in this playground.
2. For **every new codebase or sustained effort**, bootstrap **`/home/zerwiz/.pi/projects/<slug>/`** from **`projects/_template/`** (copy template **files** into `<slug>/`, not a nested `_template`).
3. Populate overview and context from the **target repo** (scan README, manifests, layout) or **`dispatch_agent`** → **`project-scanner`** with the workspace **absolute path** (team **`new-project`**).
4. Keep **`README.md`**, **`01-CONTEXT.md`**, **`02-DECISIONS.md`** current; see **`projects/README.md`** and **`.cursor/rules/pi-projects-docs.mdc`**. Do not commit secrets.

## Skills

**Skills** are **`SKILL.md`** packages under **`.pi/skills/<name>/`** (and other Pi discovery paths). They are **on-demand instructions**, not extensions. Use **`docs/SKILLS.md`** for how they load, **`/skill:name`**, and authoring. When a user’s task matches a skill’s **`description`**, **`read`** that `SKILL.md` and follow it.

## Concepts (skills, agents, extensions, tools)

**`docs/CONCEPTS.md`** maps the four ideas. **`docs/TOOLS.md`** explains Pi **tools** (built-in, extension-registered, agent **`tools:`** restrictions). Root **`TOOLS.md`** lists core **`read` / `bash` / `edit` / `write`** signatures.

## Ralph (optional batch queue)

**Skill:** **`/skill:ralph`** · **Agent:** **`ralph`** · **Team `ralph`:** **`ralph`**, **`scout`**, **`planner`**, **`reviewer`** (dispatcher can **`dispatch_agent`** helpers; Ralph may reply **`RALPH_ESCALATE`** when blocked). **Extension:** **`ralph_queue_status`**, **`/ralph`** — **`todo/` → `inprogress/` → `done/`** for one HTML file per **`.txt`** ticket. Shim **`extensions/ralph.ts`** via **`.pi/settings.json`**.
