## How to use tools in this Pi playground

This guide explains **how to actually use tools**, not just their signatures. For the full technical reference and inventory, keep **`TOOLS.md`** open alongside this file.

---

## 1. Core built-in tools (you’ll see these the most)

Pi’s core tools are documented in root **`TOOLS.md`**. Practically, you’ll use these four all the time:

### 1.1 `read` — read files safely

- **What it does**:
  - Reads file contents (text or images) from the current project directory.
  - Supports `offset` and `limit` so you don’t have to load huge files at once.
- **Typical uses**:
  - “Show me `extensions/agent-team.ts`.”
  - “Open lines 200–260 of `extensions/tilldone.ts`.”
- **Notes**:
  - The agent should **prefer `read` before guessing** what’s in a file.

### 1.2 `bash` — run shell commands

- **What it does**:
  - Executes shell commands in the session **cwd**, with optional timeout.
- **Typical uses**:
  - `ls`, `git status`, `npm test` / `bun test`, `just …`.
- **Notes**:
  - This playground uses a **damage-control** extension to intercept dangerous patterns (see `extensions/damage-control.ts` and `.pi/damage-control-rules.yaml`).

### 1.3 `edit` — precise in-place edits

- **What it does**:
  - Replaces an exact span of text in a file.
- **Typical uses**:
  - “Change this function’s body without touching anything else.”
  - “Insert a new property into this JSON object.”
- **Notes**:
  - `oldText` must match **exactly** (including whitespace). Use `read` to copy the exact block first.

### 1.4 `write` — create or overwrite files

- **What it does**:
  - Creates or overwrites a file; creates parent directories as needed.
- **Typical uses**:
  - Writing new markdown docs.
  - Generating config files or small helper scripts.

---

## 2. Extension tools (this repo) and when to use them

These tools are only available when their **extensions are active** (see `HOW_TO_USE_EXTENSIONS.md` for how to enable each extension).

### 2.1 `dispatch_agent` and team tools (from `agent-team.ts`)

- **Extension**: `extensions/agent-team.ts`
- **Key tools**:
  - `dispatch_agent` — run a named agent (e.g. `planner`, `builder`, `reviewer`) in a subprocess.
  - `team_list`, `team_activate` — see and switch between team presets (`full`, `plan-build`, `ralph`, `info`, `pi-pi`, …).
  - `team_member_add` / `team_member_remove` / `team_member_replace` — change roster members.
- **Use when**:
  - You want **multiple agents** collaborating on a task, not just your main session.
  - You want to explicitly send a subtask to a particular specialist.

### 2.2 `tilldone` (from `tilldone.ts`)

- **Extension**: `extensions/tilldone.ts`
- **What it does**:
  - Manages a **TillDone task list** (idle → inprogress → done).
  - Updates the footer, a widget, and `.pi/tilldone-checklist.md` as you add/toggle tasks.
- **Typical actions**:
  - `tilldone` with `action: "new-list"` — start a fresh list.
  - `tilldone` with `action: "add"` — add one or more tasks.
  - `tilldone` with `action: "toggle"` — move a task through idle → inprogress → done.
- **Gate behavior**:
  - In this repo, the strict “block all tools until tasks exist” gate is **opt‑in**:
    - Only enforced when `TILLDONE_ENFORCE=1` is set in the environment (see `tilldone.ts`).

### 2.3 `ralph_queue_status` (from `ralph.ts`)

- **Extension**: `extensions/ralph.ts`
- **What it does**:
  - Summarizes the Ralph queue directories (`todo/`, `inprogress/`, `done/`).
  - Reports ticket counts and suggests the next ticket to pick up.
- **Use when**:
  - You’re running **Ralph** as a supervisor and want agents (or yourself) to see queue state before claiming a ticket.

### 2.4 Chronicle tools (from `chronicle.ts`)

- **Extension**: `extensions/chronicle.ts`
- **Key tools**:
  - `chronicle_status` — show basic chronicle state.
  - `chronicle_snapshot` — snapshot current workflow state.
  - `chronicle_transition` — record transitions between phases.
- **Use when**:
  - You’re tracking **workflow/state transitions** across sessions.

### 2.5 `run_chain` (from `agent-chain.ts`)

- **Extension**: `extensions/agent-chain.ts`
- **What it does**:
  - Executes a named chain defined in `.pi/agents/agent-chain.yaml`.
- **Use when**:
  - You want a **fixed pipeline** (e.g. “plan → build → review → document”) that runs as one tool call.

### 2.6 `forge_list` / `forge_create` (from `agent-forge.ts`)

- **Extension**: `extensions/agent-forge.ts`
- **Key tools**:
  - `forge_list` — list available forge templates.
  - `forge_create` — create new extension modules under `extensions/forge-*.ts` using templates.
- **Use when**:
  - You want to **scaffold new extensions** from templates rather than starting from scratch.

### 2.7 Subagent tools (from `subagent-widget.ts`)

- **Extension**: `extensions/subagent-widget.ts`
- **Tools**:
  - `subagent_create`, `subagent_continue`, `subagent_remove`, `subagent_list`.
- **Use when**:
  - You want **ad-hoc subagents** with a widget view rather than full agent-team grids.

### 2.8 `query_experts` (from `pi-pi.ts`)

- **Extension**: `extensions/pi-pi.ts`
- **What it does**:
  - Routes configuration questions to **pi-pi experts** (config-expert, ext-expert, theme-expert, etc.).
- **Use when**:
  - You’re working **on Pi itself**—changing settings, providers, models, or extension wiring.

---

## 3. How tools relate to agents, skills, and extensions

- **Extensions** define tools (with `registerTool`) and UI/behavior around them.
- **Agents** declare which tools they’re allowed to use via `tools:` in their frontmatter.
- **Skills** may mention tools in text or specify `allowed-tools` in their metadata (spec-level hint).

In practice:

- To **use** a tool, you usually:
  - Ask the agent in natural language (“Run `ls` to show the repo root.”), or
  - Trigger a higher-level command or workflow that **calls the right tools** internally.
- To **restrict** tools, you:
  - Edit agent `.md` frontmatter (see `AGENTS.md`), or
  - Rely on policy extensions like `damage-control`.

---

## 4. Quick “which tool is right for this?”

- “**Read this file or image.**” → `read`
- “**Run a command.**” → `bash` (plus damage-control safeguards)
- “**Change a snippet without rewriting the file.**” → `edit`
- “**Write or overwrite a file.**” → `write`
- “**Delegate work to a specific agent.**” → `dispatch_agent` (via `agent-team`)
- “**Manage a task list in-session.**” → `tilldone`
- “**See the state of Ralph’s ticket queue.**” → `ralph_queue_status`
- “**Run a named pipeline (plan → build → review).**” → `run_chain`
- “**Scaffold new extensions.**” → `forge_create`
- “**Work with Pi’s own configuration.**” → `query_experts`

For more detail, see **`TOOLS.md`** for signatures and **`EXTENSIONS.md`** for which modules register which tools.

