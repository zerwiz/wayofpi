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
description: Writes structured plans under plans/ for other agents to read
tools: read,write,edit,grep,find,ls,bash
---
You are a planner agent. Analyze requirements, recon the repo, then write plans/PLAN-…md …
```

This is **not** the same as a Pi **extension** (`.ts` code) or a **skill** (`SKILL.md` workflow). Agents are **prompt + metadata** consumed by orchestration extensions. See **[CONCEPTS.md](CONCEPTS.md)** for a four-way comparison including **tools**; **[TOOLS.md](TOOLS.md)** for how tool allowlists relate to built-ins and extensions.

### Agent inventory (`.pi/agents/`)

| `name` | File | Summary |
| ------ | ---- | ------- |
| **planner** | [`planner.md`](../.pi/agents/planner.md) | Writes **`plans/PLAN-YYYYMMDD-<slug>.md`** (structured steps, handoff); tools include **`write`/`edit`**. |
| **builder** | [`builder.md`](../.pi/agents/builder.md) | Implementation and code generation. |
| **scout** | [`scout.md`](../.pi/agents/scout.md) | Fast recon and codebase exploration (no file edits). |
| **reviewer** | [`reviewer.md`](../.pi/agents/reviewer.md) | Code review and quality checks (no direct edits). When **`github-management`** is loaded: **`github_pr_*`** for PR diff/checks/review/inline suggestions. |
| **documenter** | [`documenter.md`](../.pi/agents/documenter.md) | **Reads** existing docs, reconciles with code, **`edit`**/**`write`** to keep READMEs and **`docs/`** current. |
| **code-documenter** | [`code-documenter.md`](../.pi/agents/code-documenter.md) | **Reads** source, **reviews** for a doc pass; **`edit`**/**`write`** **comments / TSDoc / technical `.md` only**—no logic or tests. |
| **red-team** | [`red-team.md`](../.pi/agents/red-team.md) | Security and adversarial testing (no direct edits). |
| **plan-reviewer** | [`plan-reviewer.md`](../.pi/agents/plan-reviewer.md) | Critiques and validates implementation plans. |
| **bowser** | [`bowser.md`](../.pi/agents/bowser.md) | Playwright CLI / headless browser automation (`skills: playwright-bowser`). |
| **hermes** | [`hermes.md`](../.pi/agents/hermes.md) | **`bash`** invokes **Hermes CLI** (`hermes chat -q … -Q`); relays **stdout** reply. Teams **`hermes`**, **`info`** (not **`full`**—see **`.pi/agents/teams.yaml`**). See **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** §7. |
| **project-scanner** | [`project-scanner.md`](../.pi/agents/project-scanner.md) | Scans a workspace and fills **`projects/<slug>/`** in this repo from **`projects/_template/`** (teams **`new-project`**, **`full`**, **`info`**). |
| **playground-portal** | [`playground-portal.md`](../.pi/agents/playground-portal.md) | Ports extensions/skills/shims from the playground clone (**`PI_PLAYGROUND`**) into the **current app repo**’s **`.pi/`** and **`extensions/`** when the user wants playground behavior **inside that project** (teams **`playground-portal`**, **`new-project`**, **`full`**, **`info`**; **`pi-e` option 2** scaffolds local **`.pi/`**). |
| **indexer** | [`indexer.md`](../.pi/agents/indexer.md) | Writes **`INDEX.md`** at a requested path: tree + per-file purpose map; skill [`indexer/SKILL.md`](../.pi/skills/indexer/SKILL.md); teams **`index`**, **`info`**, **`new-project`** (not **`full`**). |
| **ralph** | [`ralph.md`](../.pi/agents/ralph.md) | **Ralph Wiggum** — **HTML ticket queue** `todo→inprogress→done`; may **`RALPH_ESCALATE`** to **`scout`/`planner`/`builder`/`reviewer`/`code-documenter`/`documenter`**; skill [`ralph/SKILL.md`](../.pi/skills/ralph/SKILL.md); extension **`ralph_queue_status`**. |
| **web-searcher** | [`web-searcher.md`](../.pi/agents/web-searcher.md) | **`web_search`** + **`web_fetch`** only (+ **`read`** for local files); team **`info`**. Tools come from **`pi-web-access`** (default for many setups) or playground **`web-tools`** — not both. |

#### Domain specialist agents (ported into `.pi/agents/`)

This repo includes a library of **domain specialist agents** under **`.pi/agents/domain-specialists/`**, organized by the 01–10 category folders:

- `01-core-development`
- `02-language-specialists`
- `03-infrastructure`
- `04-quality-security`
- `05-data-ai`
- `06-developer-experience`
- `07-specialized-domains`
- `08-business-product`
- `09-meta-orchestration`
- `10-research-analysis`

Each agent file is a normal Pi agent markdown with:

- `name`: prefixed to avoid collisions (examples: `infra-azure-infra-engineer`, `lang-erlang-expert`, `quality-code-reviewer`)
- `description`: short summary
- `tools`: mapped from the agent’s sandbox intent
- Body: the agent’s **full instruction text** (so it keeps working even if the `ref/` folder is deleted)

**How to use:**

- With **`system-select`**: run `/system` and pick a specialist agent by `name`.
- With **`agent-team`**: add the specialist agent `name` into `teams.yaml` rosters/presets so the dispatcher can call them.

**`pi-pi/` meta-experts** (used by the **`pi-pi`** team; `dispatch_agent` targets by **`name`**):

| `name` | File | Summary |
| ------ | ---- | ------- |
| **pi-orchestrator** | [`pi-pi/pi-orchestrator.md`](../.pi/agents/pi-pi/pi-orchestrator.md) | Coordinates experts and builds Pi components. |
| **ext-expert** | [`pi-pi/ext-expert.md`](../.pi/agents/pi-pi/ext-expert.md) | Extensions: tools, events, commands, shortcuts, state. |
| **theme-expert** | [`pi-pi/theme-expert.md`](../.pi/agents/pi-pi/theme-expert.md) | Themes: JSON tokens, vars, distribution. |
| **tui-expert** | [`pi-pi/tui-expert.md`](../.pi/agents/pi-pi/tui-expert.md) | TUI components, widgets, overlays, footers. |
| **prompt-expert** | [`pi-pi/prompt-expert.md`](../.pi/agents/pi-pi/prompt-expert.md) | Prompt templates: `.md` format, `/template`, discovery. |
| **config-expert** | [`pi-pi/config-expert.md`](../.pi/agents/pi-pi/config-expert.md) | `settings.json`, providers, models, packages, keybindings. |
| **cli-expert** | [`pi-pi/cli-expert.md`](../.pi/agents/pi-pi/cli-expert.md) | Pi CLI flags, env, non-interactive modes. |
| **keybinding-expert** | [`pi-pi/keybinding-expert.md`](../.pi/agents/pi-pi/keybinding-expert.md) | Shortcuts, `registerShortcut`, `keybindings.json`. |
| **skill-expert** | [`pi-pi/skill-expert.md`](../.pi/agents/pi-pi/skill-expert.md) | Skills: `SKILL.md`, validation, `/skill:name`. |
| **agent-expert** | [`pi-pi/agent-expert.md`](../.pi/agents/pi-pi/agent-expert.md) | Agent `.md` frontmatter, `teams.yaml`, agent-team sessions. |

Rosters reference these `name` values in **`.pi/agents/teams.yaml`**; see **[AGENT_TEAMS.md](AGENT_TEAMS.md)**. YAML/JSON there (e.g. **`agent-chain.yaml`**) are **not** agents—they are pipeline/team config.

---

## 2. Where agent files live (scan order)

Extensions that scan the filesystem typically look under the **project cwd** (the directory you run Pi from), in this order or a subset:

| Directory | Typical use |
|-----------|-------------|
| **`agents/`** | Repo-root agent markdown (if present) |
| **`.claude/agents/`** | Shared with Claude-style layouts |
| **`.pi/agents/`** | **Primary** location in this playground (e.g. `planner.md`, `teams.yaml`, and subfolders like **`domain-specialists/`**) |

`agent-team`, `agent-chain`, `system-select`, and `cross-agent` scan these directories **recursively** for `*.md` agent files (nested paths like `.pi/agents/domain-specialists/03-infrastructure/infra-azure-infra-engineer.md` are loaded).

**Path check:** If your repo root is `~/.pi`, agent files live under **`~/.pi/.pi/agents/`** (note the inner **`.pi`**). That is **not** the same as repo-root **`~/agents/`** (some setups use a top-level `agents/` folder instead).

Some extensions also consult **global** paths under the user home (e.g. **`system-select`** may include `.claude/agents/`, `.gemini/agents/`, `.codex/agents/`).

**Duplicates:** If the same `name` appears in multiple dirs, the **first scan win** applies (see `extensions/agent-team.ts` — `scanAgentDirs`).

---

## 3. How agents integrate with Pi

### 3.1 `agent/AGENTS.md` (Pi agent context)

Pi may inject **`agent/AGENTS.md`** (next to your Pi agent install) into session **[Context]** as static instructions. That file is **policy for the model**, not a specialist roster. This repo includes **`agent/AGENTS.md`** with pointers to **`docs/SYSTEM.md`** and **`docs/AGENT_MEMORY.md`**.

### 3.2 `system-select` extension

**File:** `extensions/system-select.ts`

- **`/system`** opens a **flat** picker of all agent `.md` files (every scanned tree).
- **`/agent`** opens a **domain-first** picker: **Reset**, **Core** (agents not under **`domain-specialists/`**), **All agents** (same flat list as **`/system`**), then one row per **`domain-specialists/<category>/`** folder (e.g. **`03-infrastructure`**) with a count; second step lists only specialists in that scope.
- The chosen agent’s **body** is merged into the **main** session’s system prompt (you stay one agent, different persona).
- Can restrict tools when the frontmatter declares them.

**Use when:** you want **one** chat with a different “hat,” not parallel subagents. Prefer **`/agent`** to browse **domain specialists** by category.

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
