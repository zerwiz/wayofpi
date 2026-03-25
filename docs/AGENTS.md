# Agents in this Pi playground

This document explains **what “agents” are** in this repository, **how they are defined**, **where Pi loads them from**, and **which extensions integrate** them. For the **agent-team** dispatcher, rosters, and presets, see **[AGENT_TEAMS.md](AGENT_TEAMS.md)**.

---

## 1. What is an “agent” here?

An **agent definition** is a **Markdown file** with:

1. **YAML frontmatter** (between `---` lines) with at least:
   - **`name`** — stable identifier used in chains, teams, and dispatch (e.g. `planner`)
   - **`description`** — short summary for UIs and prompts
   - **`tools`** — comma-separated list (used by extensions that spawn sub-sessions with restricted tools), e.g. `read,grep,find,ls`
2. **Body** — the **system prompt / persona** text for that agent.

Example (truncated):

```markdown
---
name: planner
description: Architecture and implementation planning
tools: read,grep,find,ls
---
You are a planner agent. Analyze requirements...
```

This is **not** the same as a Pi **extension** (`.ts` code) or a **skill** (`SKILL.md` workflow). Agents are **prompt + metadata** consumed by orchestration extensions. See **[CONCEPTS.md](CONCEPTS.md)** for a four-way comparison including **tools**; **[TOOLS.md](TOOLS.md)** for how tool allowlists relate to built-ins and extensions.

### Built-in specialist: `project-scanner`

**File:** `.pi/agents/project-scanner.md`

Bootstraps **`/home/zerwiz/.pi/projects/<slug>/`** from **`projects/_template/`** after scanning a user-supplied workspace (README, manifests, layout). Use at the **start of every new codebase** tracked in Pi, or follow the same steps manually per **`.cursor/rules/pi-projects-docs.mdc`**. Teams: **`new-project`** (scanner only); also listed under **`full`** and **`info`**.

### Built-in specialist: `ralph`

**File:** `.pi/agents/ralph.md`

Processes **`.txt`** tickets in **`todo/` → `inprogress/` → `done/`**, producing **one HTML file** per ticket with minimal filesystem scope. Team **`ralph`** also includes **`scout`**, **`planner`**, **`reviewer`** for dispatcher-assisted exploration, planning, and review; Ralph may emit **`RALPH_ESCALATE`** when blocked in headless mode. Extension: **`ralph_queue_status`**, **`/ralph`**. See **`.pi/skills/ralph/SKILL.md`**.

---

## 2. Where agent files live (scan order)

Extensions that scan the filesystem typically look under the **project cwd** (the directory you run Pi from), in this order or a subset:

| Directory | Typical use |
|-----------|-------------|
| **`agents/`** | Repo-root agent markdown (if present) |
| **`.claude/agents/`** | Shared with Claude-style layouts |
| **`.pi/agents/`** | **Primary** location in this playground (e.g. `planner.md`, `teams.yaml`) |

Some extensions also consult **global** paths under the user home (e.g. **`system-select`** may include `.claude/agents/`, `.gemini/agents/`, `.codex/agents/`).

**Duplicates:** If the same `name` appears in multiple dirs, the **first scan win** applies (see `extensions/agent-team.ts` — `scanAgentDirs`).

---

## 3. How agents integrate with Pi

### 3.1 `agent/AGENTS.md` (Pi agent context)

Pi may inject **`agent/AGENTS.md`** (next to your Pi agent install) into session **[Context]** as static instructions. That file is **policy for the model**, not a specialist roster. This repo includes **`agent/AGENTS.md`** with pointers to **`docs/SYSTEM.md`** and **`docs/AGENT_MEMORY.md`**.

### 3.2 `system-select` extension

**File:** `extensions/system-select.ts`

- **`/system`** opens a picker of agent `.md` files.
- The chosen agent’s **body** is merged into the **main** session’s system prompt (you stay one agent, different persona).
- Can restrict tools when the frontmatter declares them.

**Use when:** you want **one** chat with a different “hat,” not parallel subagents.

### 3.3 `agent-team` extension

**File:** `extensions/agent-team.ts`

- The **primary** model is a **dispatcher** (no direct codebase tools in the default setup).
- Specialists run as **separate Pi processes** spawned with their own session files; work is delegated via **`dispatch_agent`**.
- Teams and presets: see **[AGENT_TEAMS.md](AGENT_TEAMS.md)**.

**Use when:** you want **multiple specialists** with **isolated** sessions and a **grid** overview.

### 3.4 `agent-chain` extension

**File:** `extensions/agent-chain.ts`

- Pipelines are defined in **`.pi/agents/agent-chain.yaml`**.
- Steps reference agent **`name`** values; output of step *n* feeds step *n+1* via templates (`$INPUT`, `$ORIGINAL`).
- Primary agent typically uses **`run_chain`** (no direct repo tools in the default pattern).

**Use when:** you want a **fixed sequence** (e.g. plan → implement → review), not ad-hoc dispatch.

### 3.5 `pi-pi` and other meta flows

**`extensions/pi-pi.ts`** and agents under **`.pi/agents/pi-pi/`** are specialized experts for Pi configuration and agents. They are normal agent markdown files consumed when those workflows or teams reference them.

---

## 4. Session files and memory (subagents)

**`agent-team`** (and similar spawn-based flows) store per-specialist state under **`.pi/agent-sessions/`** (gitignored in this repo). Each specialist can **resume** its own JSON session between dispatches within a project session.

That is **separate** from:

- The **main** chat JSONL (Pi session file)
- **`session-memory`** / **`session-saver`** extensions (see **[AGENT_MEMORY.md](AGENT_MEMORY.md)**)

---

## 5. Related documentation

| Doc | Topic |
|-----|--------|
| **[AGENT_TEAMS.md](AGENT_TEAMS.md)** | Teams, `teams.yaml`, presets, `dispatch_agent`, tools |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Transcript memory vs cross-session notes |
| **[EXTENSIONS.md](EXTENSIONS.md)** | Authoring Pi extensions and shims |
| **[SYSTEM.md](SYSTEM.md)** | Repo context and agent conduct |
| Root **[README.md](../README.md)** | Extension table and `just` recipes |

---

## 6. Quick “which extension?”

| Goal | Extension |
|------|-----------|
| Switch **my** persona in one chat | **`system-select`** |
| Delegate to **parallel specialists** | **`agent-team`** |
| Run a **fixed multi-step pipeline** | **`agent-chain`** |
| Edit agent text on disk | Any editor; then **`/agents-reload`** in **`agent-team`** or restart Pi for other flows |
