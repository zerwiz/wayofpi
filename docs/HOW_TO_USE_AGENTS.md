## How to use agents in this Pi playground

This guide is for **humans using Pi**, not for extension authors. It explains **which agents exist**, **what they’re good at**, and **which commands to use** to get them working together.

If you want the low-level definition format and scan rules, see **`AGENTS.md`**. This file focuses on **“when do I use what?”**.

---

## 1. Core working agents

These live under **`.pi/agents/`** and are wired into the default **agent-team** rosters in **`.pi/agents/teams.yaml`**.

### 1.1 `scout` — fast recon

- **Use when**: you want a **quick map** of where something lives in the repo, or a high-level summary.
- **Typical tasks**:
  - “Where does auth middleware live?”
  - “Show me all entrypoints for the frontend.”
- **How to call**:
  - With **agent-team**: `/agents` → pick team **info** or **full**, then ask your question; the dispatcher will route to `scout` when appropriate.

### 1.2 `planner` — turn goals into plans

- **Use when**: you know **what** you want (new feature, refactor, integration) but not the concrete steps or files.
- **Artifacts**:
  - Writes markdown plans under `plans/PLAN-YYYYMMDD-<slug>.md`.
  - When explicitly asked, can also write a **Ralph JSON ticket** under `todo/<id>.json` (see §4).
- **How to call**:
  - With **agent-team**: use team **plan-build** or **full**, ask for a plan (“Plan out adding feature X”), then follow the plan with `builder` / `reviewer`.

### 1.3 `builder` — implementation & code

- **Use when**: you already have a **plan** or know the desired change and want code written or updated.
- **Artifacts**:
  - Modifies source files under `extensions/`, `.pi/`, `docs/`, etc., following the plan’s “Files to touch” table.
- **How to call**:
  - With **agent-team**: team **plan-build** or **full**, ask to “Implement steps 1–3 from PLAN-…”.

### 1.4 `reviewer` — code review

- **Use when**: changes are implemented and you want a second pass for **correctness, style, and risks**.
- **Artifacts**:
  - Code review comments in chat.
  - Optional edits or suggestions; can be paired with `builder` for fixup.
- **How to call**:
  - With **agent-team**: team **plan-build**, ask “Review the changes for PLAN-…”.

### 1.5 `documenter` and `code-documenter`

- **`documenter`**:
  - **Use when** you want README / `docs/` updated to match code.
  - Writes and edits human-facing markdown.
- **`code-documenter`**:
  - **Use when** you want **inline comments / TSDoc** and code-level docs.
  - Does **not** change logic or tests.
- **How to call**:
  - With **agent-team**: team **plan-build**, **info**, or **full**, ask explicitly for doc passes.

### 1.6 `indexer` and `project-scanner`

- **`indexer`**:
  - Writes an **`INDEX.md`** map at a path you specify (tree + per-file purpose).
- **`project-scanner`**:
  - Scans an **external project** and fills `/home/zerwiz/.pi/projects/<slug>/` docs from `projects/_template/`.
- **How to call**:
  - With **agent-team**: team **index** or **new-project**, or use skill **`/skill:indexer`**.

### 1.7 `ralph` — ticket queue supervisor

- **Use when**: you want **disk-backed tickets** and a simple, enforceable workflow **todo → inprogress → done**.
- **Artifacts**:
  - Text/JSON tickets in `todo/`, `inprogress/`, `done/`.
  - HTML results per ticket (see `ralph.md`).
- **How to call**:
  - Extension: `/ralph status` (queue overview), `/ralph prompt` (injects one-task instructions).
  - Tool: `ralph_queue_status` (used by agents to summarize queue).
  - With **agent-team**: team **ralph**; dispatcher can pull `scout`, `planner`, `builder`, `reviewer`, etc. around `ralph`.

---

## 2. pi-pi experts (Pi configuration helpers)

These live under **`.pi/agents/pi-pi/`** and are used when you run Pi with the **pi-pi** extension stack or team.

Key experts:

- **`ext-expert`** — extensions: tools, events, commands, shortcuts, state.
- **`theme-expert`** — themes: JSON tokens, themeMap, distribution.
- **`config-expert`** — `settings.json`, providers, models, packages, keybindings.
- **`tui-expert`** — TUI components and keyboard behavior.
- **`prompt-expert`** — prompt templates and `/template` flows.
- **`skill-expert`** — skills (`SKILL.md`), `/skill:name`, discovery.
- **`agent-expert`** — agent `.md` frontmatter, `teams.yaml`, agent-team sessions.

**How to use**:

- Run Pi with a pi-pi preset (see root `README.md`), or select team **pi-pi** in `agent-team`.
- Then ask things like:
  - “config-expert: help me add OpenRouter models.”
  - “ext-expert: scaffold a new extension that does X.”

---

## 3. How to pick and run agents

There are three main ways to use agents in this repo:

### 3.1 `/system` — one persona in your main chat

- Command: **`/system`** (from `extensions/system-select.ts`).
- Behavior:
  - Opens a picker of agent `.md` files.
  - Merges the chosen agent’s prompt into your **current** chat as the system prompt.
- Use when:
  - You want **one hat at a time** (e.g. “be the planner for this conversation”).

### 3.2 `agent-team` — parallel specialists with a grid

- Extension: `extensions/agent-team.ts`.
- Command: usually exposed via a `just` recipe or stack like `ext-agent-team`.
- Behavior:
  - Creates a **dispatcher** session and multiple **specialist** sub-sessions.
  - Uses **`.pi/agents/teams.yaml`** presets (e.g. `full`, `plan-build`, `ralph`, `info`, `pi-pi`).
- Use when:
  - You want **scout → planner → builder → reviewer** style flows.
  - You want Ralph to supervise tickets while builder/doc agents work.

### 3.3 `agent-chain` — fixed pipelines

- Extension: `extensions/agent-chain.ts`.
- Config: `.pi/agents/agent-chain.yaml`.
- Behavior:
  - Runs a named chain: each step is a different agent; output from step *n* feeds step *n+1*.
- Use when:
  - You want a **repeatable pipeline** (e.g. “plan → implement → review → document”) bound to a single command.

---

## 4. Example workflows

### 4.1 Classic “plan → build → review” for a feature

1. Start Pi in this repo with **agent-team** enabled (see root `README.md` for the exact `just` recipe or stack).
2. In the dispatcher chat:
   - Ask: “Plan out implementing feature X in the frontend.”
   - The dispatcher will mostly use **`planner`** (and sometimes `scout`).
3. Once the plan file exists:
   - Ask: “Use the plan in `plans/PLAN-…-feature-x.md` and implement the changes.”
   - Dispatcher will route to **`builder`**.
4. After code changes:
   - Ask: “Review the implementation for PLAN-…-feature-x.md.”
   - Dispatcher routes to **`reviewer`** (and optionally `code-documenter` / `documenter`).

### 4.2 Using Ralph tickets to keep agents on track

1. Ask the **planner** (via team **ralph** or **plan-build**) to:
   - Create a **JSON ticket** under `todo/feature-x-001.json` with:
     - `requiredStages`: `["scout", "planner", "builder", "reviewer"]`
     - `artifacts`: paths you care about (docs, implementation files, tests).
2. Call `/ralph prompt` in the dispatcher session:
   - This injects clear instructions for the `ralph` agent: pick one ticket, move it to `inprogress/`, and coordinate the required stages.
3. Let the dispatcher+Ralph:
   - Run `scout`/`planner`/`builder`/`reviewer` in order (using `requiredStages`).
   - Only move the ticket to `done/` once all `artifacts` exist and are non-empty.
4. Use `/ralph status` or the `ralph_queue_status` tool to:
   - See which tickets are pending/in progress/done.
   - See which stages/artifacts are still missing for the next ticket.

---

## 5. Quick “which agent should I ask?”

- “**Where is X in the repo?**” → **`scout`**
- “**How do we implement Y?**” → **`planner`**
- “**Please implement these steps.**” → **`builder`**
- “**Is this code OK? Any risks?**” → **`reviewer`**
- “**Update READMEs/docs to match.**” → **`documenter`**
- “**Add comments / TSDoc to this module.**” → **`code-documenter`**
- “**I want a ticket queue and supervision.**” → **`ralph`** (team **ralph**)
- “**Change Pi settings/providers/models.**” → **`config-expert`** (team **pi-pi**)

For the full inventory and technical details, keep **`AGENTS.md`** and **`AGENT_TEAMS.md`** open alongside this guide.

