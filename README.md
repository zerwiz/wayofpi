# Pi extension playground

**Source repository:** [github.com/zerwiz/wayofpi](https://github.com/zerwiz/wayofpi)

This repo is a **[Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent)** workspace: extensions, skills, agents, and docs for customizing the **UI**, **agent orchestration**, **safety auditing**, and **cross-agent** integrations.

**This repository also includes:** **[apps/wayofpi-ui/](apps/wayofpi-ui/)** (Way of Pi technical web shell — see **`apps/wayofpi-ui/README.md`**), **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)** and **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)** (Way of Pi product plan), a **[documentation set](docs/README.md)** (memory, extensions, skills, tools, agents, Hermes/Honcho, repo index), **`projects/`** for per-codebase notes under Pi, **project-scanner** and **ralph** agents/skills/extensions for onboarding and HTML ticket queues, **`/skill:github`** for branches + **git worktrees** (parallel agents in one repo), and **Cursor rules** under **`.cursor/rules/`** for consistent agent behavior.

<p align="center">
  <img src="./images/pi-logo.svg" alt="Pi Coding Agent extension playground" width="520">
  <br>
  <strong>Pi extension playground</strong>
</p>

---

## Prerequisites

All three are required:

| Tool            | Purpose                   | Install                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| **Bun** ≥ 1.3.2 | Runtime & package manager | [bun.sh](https://bun.sh)                                   |
| **just**        | Task runner (for `just …` / `ppi …` recipes) | **macOS:** `brew install just` · **Ubuntu/Debian:** `sudo snap install just` or [cargo](https://github.com/casey/just#installation) · See [just releases](https://github.com/casey/just/releases) |
| **pi**          | Pi Coding Agent CLI       | [Pi docs](https://github.com/mariozechner/pi-coding-agent) |

---

## API Keys

Pi does **not** auto-load `.env` files — API keys must be present in your shell's environment **before** you launch Pi. A sample file is provided:

```bash
cp .env.sample .env   # copy the template
# open .env and fill in your keys
```

`.env.sample` covers the four most popular providers:

| Provider         | Variable             | Get your key                                                                                               |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| OpenAI           | `OPENAI_API_KEY`     | [platform.openai.com](https://platform.openai.com/api-keys)                                                |
| Anthropic        | `ANTHROPIC_API_KEY`  | [console.anthropic.com](https://console.anthropic.com/settings/keys)                                       |
| Google           | `GEMINI_API_KEY`     | [aistudio.google.com](https://aistudio.google.com/app/apikey)                                              |
| OpenRouter       | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys)                                                                |
| Many Many Others | `***`                | [Pi Providers docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md) |

### Sourcing your keys

Pick whichever approach fits your workflow:

**Option A — Source manually each session:**
```bash
source .env && pi
```

**Option B — One-liner alias (add to `~/.zshrc` or `~/.bashrc`):**
```bash
alias pi='source $(pwd)/.env && pi'
```

**Option C — Use the `just` task runner (auto-wired via `set dotenv-load`):**
```bash
just pi           # .env is loaded automatically for every just recipe
just ext-minimal  # works for all recipes, not just `pi`
```

**Standard Pi (no project extensions):** Upstream Pi’s **minimal harness** skips loading **extensions / skills / themes / prompt templates** from **`settings.json`** when you pass [**`--no-extensions --no-skills --no-themes --no-prompt-templates`**](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) (see *CLI Reference* → *Resource Options*). This repo wraps that as **`scripts/pi-standard`** / **`just pi-standard`** / **`~/.local/bin/pi-standard`** (after **`install-global`**). A leading **`.`** is ignored if you type **`pi-standard .`**. Stock **`pi .`** does not treat **`.`** specially — it is not the same as standard mode.

---

## Installation

```bash
bun install
```

### Ollama (this repo’s defaults)

Pi is pointed at **local Ollama** (`http://localhost:11434/v1`) with **`agent/models.json`** listing the chat models pulled on this machine. **Default model:** **`qwen3.5:9b-32k`** (see **`agent/settings.json`**). Change **`defaultModel`** or add/remove entries in **`agent/models.json`** and **`pi.config.json`** to match `ollama list`. **Embedding-only** models (e.g. **`mxbai-embed-large`**) are omitted from the chat picker. For a remote Ollama host, set the base URL in **`agent/models.json`** / [`Pi models docs`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md).

### OpenRouter

Set **`OPENROUTER_API_KEY`** in **`.env`** (see **`.env.sample`**). The **`openrouter`** block in **`agent/models.json`** points at **`https://openrouter.ai/api/v1`** and merges with Pi’s **built-in OpenRouter model list**—use **`/model`** or e.g. **`--model openrouter/google/gemini-3-flash-preview`** (same pattern as **`extensions/agent-team.ts`** defaults). This playground does **not** register the native **`openai`** provider in **`agent/models.json`** or **`pi.config.json`** (no **`OPENAI_API_KEY`** required for the stock picker); add it back if you want **`api.openai.com`** models.

**Why `/model` (Ctrl+L) may not show Ollama first:** The picker sorts by **`provider` name** (see [`model-selector.ts` `sortModels`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/modes/interactive/components/model-selector.ts)), so **`anthropic`**, **`google`**, and any other configured provider whose name sorts **before** **`ollama`** appears **above** your local models. Within one provider, order is the merge order from Pi’s registry (for **OpenRouter**, that is a very large catalog — **`pi.config.json` only adds/overrides entries, it does not reorder the full built-in list** in “all models” mode).

**Ollama → free OpenRouter → paid OpenRouter (scoped picker):** Run **`just pi-picker-ollama-free-or`**, which runs **`pi --models "$(bun scripts/pi-models-scoped-priority.ts)"`**. That limits **`/model`** to models you actually list: all **`ollama/*`** from **`agent/models.json`**, then **`:free`** OpenRouter rows from **`pi.config.json`**, then remaining OpenRouter rows there. Toggle **scoped \| all** with **Tab** in the picker if your Pi build supports it — scoped is the useful mode for this list. **`Ctrl+P`** cycles within the same **`--models`** set.

**Reference ordering in git:** **`pi.config.json`** lists **Ollama** block first, then **OpenRouter `:free`**, then other **OpenRouter**; **`just pi-cycle-or-free-first`** is a hand-written **`--models`** chain (OpenRouter + Ollama; no native OpenAI).

**Loading the key:** **`scripts/ppi`** and **`just`** (from this repo) source **`.env`** before launching **`pi`**, so **`ppi pi`**, **`just pi`**, and **`ppi-<recipe>`** pick up **`OPENROUTER_API_KEY`** automatically. For a bare **`pi`** command, use **`scripts/pi-with-env`** (see **`scripts/README.md`**).

---

## Way of Pi web UI

From the repo root, run **`./start-wayofpi-ui.sh`** (or **`./start-full-system.sh`**, same entrypoint) to start **`apps/wayofpi-ui`** in dev mode (Bun API on port **3333** + Vite on **5173**), wait until the page responds, then open your default browser (default URL **`http://localhost:5173/`**). For the **Electron** desktop window instead of a browser tab, run **`./start-wayofpi-electron.sh`** (or **`just wayofpi-electron`**). The scripts prepend **`~/.bun/bin`** to **`PATH`**; install **[Bun](https://bun.sh)** if **`bun`** is missing. They source the repo **`.env`** when present and set **`WOP_WORKSPACE`** to the playground root unless you already exported **`WOP_WORKSPACE`**. Override the opened URL with **`WOP_UI_URL`** (browser flow only). Full setup, API table, Electron, and terminal env: **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)**.

### Recent Way of Pi updates (see [CHANGELOG.md](CHANGELOG.md) § Unreleased)

- **Simple vs Technical UI** — Top-bar toggle; **`wayofpi.uiMode`** in **`localStorage`** (**Simple** default: chat-first; **Technical**: activity bar, explorer, tool log, dense status). Build vs plan handoff: **[docs/WOP_BUILD_PLAN_MODE.md](docs/WOP_BUILD_PLAN_MODE.md)**.
- **Technical workspace grid** — **`TechnicalWorkspaceGrid`**: up to **3×4** **`WorkspacePane`** cells (columns × rows), each with its own **`PanelDockLayout`** and file buffer; **View → Editor Layout** presets; persistence **`wayofpi.technical.workspaceGrid.v1`**. Explorer open targets the **focused** cell. **Draggable splitters** between panes resize row/column shares (**`rowWeights`** / **`colWeights`** in the same `localStorage` key). Dropping files, tabs, or pane grips on an **edge snap zone** when the grid is still **1×1** (or on the outer edge of an **N×1** / **1×N** strip) **grows the grid** so the implied neighbor cell exists; **cross-cell** tab drops can target another pane’s **tab bar** for insert-before order. Shell map: **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)**.
- **Modular docks** — Single **Dock** tab strip under the editor stack (legacy upper horizontal tool dock merged into **bottom**); shared **Zed-style** tab chrome, **in-pane** tab drag-and-drop, splitter handles that **follow the pointer**. Roadmap: **[docs/WOP_MODULAR_DOCKS_PLAN.md](docs/WOP_MODULAR_DOCKS_PLAN.md)**.
- **Editor and files** — Markdown **Source / Preview** toolbar; **`GET /api/file`** returns **base64** for images and other binary types; preview strip uses **`apiGet`** + **`AbortController`** so fast tab switches do not show stale reads.
- **Workspace agents** — **`GET /api/agents`** mirrors playground agent discovery; chat can merge a chosen agent body into the system prompt (persona parity with TUI **system-select** style, not subprocess **`dispatch_agent`** yet). Team Pulse roster in chat from **`teams.yaml`**. Plans: **[docs/WOP_WORKSPACE_AGENTS_UI_PLAN.md](docs/WOP_WORKSPACE_AGENTS_UI_PLAN.md)**, **[docs/WOP_MULTI_AGENT_WEBSOCKET.md](docs/WOP_MULTI_AGENT_WEBSOCKET.md)**.
- **Pi integration map** — HTTP/WebSocket inventory and phased wiring: **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](docs/WOP_PI_BACKEND_WIRING_PLAN.md)**.
- **Upstream Pi mirror** — **`just wop-upstream-check`**, **`just wop-upstream-sync`**: **[docs/WOP_UPSTREAM_SYNC.md](docs/WOP_UPSTREAM_SYNC.md)**.
- **Docs and naming** — Way of Pi planning entrypoints use the **`WOP_*`** prefix (**[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)** hub, **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)**, **[docs/WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)**). Gaps and stubs: **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)**.
- **Optional desktop shell** — **`./start-wayofpi-electron.sh`** (or **`just wayofpi-electron`**), or **`WOP_USE_ELECTRON=1 ./start-wayofpi-ui.sh`**; **`npm run electron:*`** in **`apps/wayofpi-ui/package.json`**.

---

## Documentation

Full index: **[docs/README.md](docs/README.md)**. Highlights:

| Topic | Doc |
| ----- | --- |
| **Playground vs other repos** (opt-in toolbox) | **[docs/PLAYGROUND.md](docs/PLAYGROUND.md)** |
| **TUI** (thinking toggle, tools expand, keyboard shortcuts) | **[docs/TUI.md](docs/TUI.md)** |
| **Repo map** (folders, gitignored paths, `projects/_template`) | **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** |
| **How to use** agents / extensions / skills / tools | **[docs/HOW_TO_USE_AGENTS.md](docs/HOW_TO_USE_AGENTS.md)**, **[docs/HOW_TO_USE_EXTENSIONS.md](docs/HOW_TO_USE_EXTENSIONS.md)**, **[docs/HOW_TO_USE_SKILLS.md](docs/HOW_TO_USE_SKILLS.md)**, **[docs/HOW_TO_USE_TOOLS.md](docs/HOW_TO_USE_TOOLS.md)** |
| **Skills** (discovery, `/skill:name`, authoring) | **[docs/SKILLS.md](docs/SKILLS.md)** |
| **Tools** (built-ins + `registerTool` + agent allowlists) | **[docs/TOOLS.md](docs/TOOLS.md)** |
| **Skills vs agents vs extensions vs tools** | **[docs/CONCEPTS.md](docs/CONCEPTS.md)** |
| **Agents** + **agent-team** | **[docs/AGENTS.md](docs/AGENTS.md)**, **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)** |
| **Memory** (JSONL, session-memory, saver, `/remember`) | **[docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md)**, **[docs/SYSTEM.md](docs/SYSTEM.md)** |
| **Extensions** (shims, checklist) | **[docs/EXTENSIONS.md](docs/EXTENSIONS.md)** |
| **Hermes** / **Honcho** / **Pi** (local AI) | **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)**, **[docs/HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md)**, **[docs/HONCHO_CAPABILITIES.md](docs/HONCHO_CAPABILITIES.md)**, **[docs/HONCHO_OPERATIONS.md](docs/HONCHO_OPERATIONS.md)**, **[docs/Hermes_Honcho_connection.md](docs/Hermes_Honcho_connection.md)**, **[docs/PI_LOCAL_AI.md](docs/PI_LOCAL_AI.md)**, **[docs/HONCHO_LOCAL_AI.md](docs/HONCHO_LOCAL_AI.md)** |
| **Per-project markdown** | **[projects/README.md](projects/README.md)** |
| **Changes** | **[CHANGELOG.md](CHANGELOG.md)** |
| **Porting Codex subagents** | **[docs/PLAN_AWESOME_CODEX_SUBAGENTS.md](docs/PLAN_AWESOME_CODEX_SUBAGENTS.md)** (from [awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents)) |
| **Agent / model routing** | **[docs/PLAN_AGENT_MODEL_ROUTING.md](docs/PLAN_AGENT_MODEL_ROUTING.md)** |
| **Way of Pi** (web UI plan + `WOP_*`) | **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)**, **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)**, **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)** (shell), **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](docs/WOP_PI_BACKEND_WIRING_PLAN.md)** (API map) — dev: **`./start-wayofpi-ui.sh`**, **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)** |
| **Upstream Pi** (GitHub/npm check + mirror) | **[docs/WOP_UPSTREAM_SYNC.md](docs/WOP_UPSTREAM_SYNC.md)** — **`just wop-upstream-check`**, **`just wop-upstream-sync`** |
| **Way of Pi backlog** | **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)** |

---

## Extensions

| Extension               | File                                | Description                                                                                                                                                |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pure-focus**          | `extensions/pure-focus.ts`          | Removes the footer bar and status line entirely — pure distraction-free mode                                                                               |
| **minimal**             | `extensions/minimal.ts`             | Compact footer showing model name and a 10-block context usage meter `[###-------] 30%`                                                                    |
| **cross-agent**         | `extensions/cross-agent.ts`         | Scans `.claude/`, `.gemini/`, `.codex/` dirs for commands, skills, and agents; also lists **`.pi/agents/`** recursively for `@name` discovery                                           |
| **purpose-gate**        | `extensions/purpose-gate.ts`        | Prompts you to declare session intent on startup; shows a persistent purpose widget and blocks prompts until answered                                      |
| **tool-counter**        | `extensions/tool-counter.ts`        | Rich two-line footer: model + context meter + token/cost stats on line 1, cwd/branch + per-tool call tally on line 2                                       |
| **tool-counter-widget** | `extensions/tool-counter-widget.ts` | Live-updating above-editor widget showing per-tool call counts with background colors                                                                      |
| **subagent-widget**     | `extensions/subagent-widget.ts`     | `/sub <task>` command that spawns background Pi subagents; each gets its own streaming live-progress widget                                                |
| **tilldone**            | `extensions/tilldone.ts`            | Task discipline — **`tilldone`** tool gates other tools; footer + widget; writes **`.pi/tilldone-checklist.md`** (Markdown `- [ ]` / `- [x]`) on each update for handoffs and agent **`read`** |
| **agent-team**          | `extensions/agent-team.ts`          | Dispatcher: `dispatch_agent` + **team_*** tools — add/remove/**replace** members, **reload** nested **`.md`** agent defs (recursive scan of `agents/`, `.claude/agents/`, `.pi/agents/`), switch teams, save/load **`.pi/agents/teams-presets.json`**; grid; **`.pi/agents/teams.yaml`** — initial team = **first** YAML/preset key (e.g. **full**) |
| **agent-team (build-orchestra)** | `extensions/agent-team-build-orchestra.ts` | Same dispatcher as **agent-team**; initial team **`build-orchestra`** (builder-orchestrator roster). Do not load with **agent-team.ts** in one session. |
| **system-select**       | `extensions/system-select.ts`       | **`/system`** — interactive switch between agent personas from `.pi/agents/` (recursive), `.claude/agents/`, `.gemini/agents/`, `.codex/agents/` |
| **damage-control**      | `extensions/damage-control.ts`      | Real-time safety auditing — intercepts dangerous bash patterns and enforces path-based access controls from `.pi/damage-control-rules.yaml`                |
| **agent-chain**         | `extensions/agent-chain.ts`         | Sequential pipeline orchestrator — chains multiple agents where each step's output feeds into the next step's prompt; **recursive** agent `.md` scan; use **`/chain`** to select and run |
| **pi-pi**               | `extensions/pi-pi.ts`               | Meta-agent that builds Pi agents using parallel research experts for documentation                                                                         |
| **pi-doctor**           | `extensions/pi-doctor.ts`           | **`/doctor`** — toolchain and playground health checks (**bun**, **just**, Pi on PATH, **`.env`**, **`agent/`** + **`.pi/`** JSON, extension shims, skills, optional Ollama if configured) |
| **session-replay**      | `extensions/session-replay.ts`      | Scrollable timeline overlay of session history - showcasing customizable dialog UI                                                                         |
| **theme-cycler**        | `extensions/theme-cycler.ts`        | Keyboard shortcuts (Ctrl+X/Ctrl+Q) and `/theme` command to cycle/switch between custom themes                                                              |
| **extension-picker**    | `extensions/extension-picker.ts`    | **`/extensions`** lists `pi.extensions` from settings packages + local `extensions/*.ts`; saves `pi -e` to `~/.pi/storage/`. In the slash menu, **`/ex`** filters to this command. `/remember` and `/memory` for cross-session notes |
| **github-management**   | `extensions/github-management.ts`   | **`github_pr_*`** PR workflows (list/view/diff/checks/review + **inline suggested edits**), **`ghm_exec`**, **`/ghm`** — requires **[GitHub CLI](https://cli.github.com/)** (`gh`). |
| **session-memory**     | `extensions/session-memory.ts`     | Each turn: injects this chat’s **JSONL path**, **session id**, compaction/branch summaries, and a dialogue recap read from disk (`getSessionFile()`). Recap lines use **`zerwis`** (you) / **`pi`** (agent)—change in **`extensions/chatLabels.ts`**. Rules so **`1`** = pick previous numbered option. `/sessionmemory` toggles |
| **session-saver**     | `extensions/sessions/index.ts`     | Auto-save user/assistant turns to JSON; **`/save`**, **`/list`**, **`/show`**, **`/load`** (`.jsonl` uses `switchSession`). See `extensions/sessions/README.md` |
| **dynamic-loader**    | `extensions/dynamic-loader.ts`     | **`/extension-hint`** — prints stacked **`pi -e`** suggestions for this playground (`PLAYGROUND_BASES` optional) |
| **agent-forge**       | `extensions/agent-forge.ts`       | LLM tools **`forge_list`** / **`forge_create`** write `extensions/forge-*.ts` and update **`forge-registry.json`**; shim + **`/reload`** to load new tools |
| **chronicle**         | `extensions/chronicle.ts`         | Workflow ledger **`.pi/chronicle/ledger.json`**, optional **`workflow.json`**; tools **`chronicle_*`** and **`/chronicle`** (phase 1; no sub-agent spawning) |
| **ralph**            | `extensions/ralph.ts`            | **Ralph** queue: **`todo/` → `inprogress/` → `done/`**; tool **`ralph_queue_status`**; **`/ralph`**; skill **`/skill:ralph`**; team **`ralph`** (**`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**) |
| **web-tools**        | `extensions/web-tools.ts`        | Opt-in (**`just ext-web-tools`** or add shim to **`settings.json`**). Omitted from default **`settings`** if you use npm **`pi-web-access`** (same tool names — do not load both). **`web_search`**, **`web_fetch`**. Agent **`web-searcher`**; team **`info`**. |

---


## Usage

### Auto-load (slash commands without `-e`)

Pi discovers extensions only under `~/.pi/agent/extensions/` or **project** `.pi/extensions/`, not the repo-root `extensions/` directory (see [upstream docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#extension-locations)).

This repo keeps implementations in **`extensions/`** and adds **thin `.pi/extensions/*.ts` shims** that `export { default } from "../../extensions/…"`. Shared helpers (e.g. **`extensions/agent-dir-scan.ts`**) stay **outside** **`.pi/extensions/`**—only shims and real extension factories belong there. Entries are listed in **`.pi/settings.json`**. After editing code, run **`/reload`** in Pi. Use **`/extensions`** for the package picker (typing **`/ex`** narrows the menu).

Skills belong in **`.pi/skills/<skill-name>/SKILL.md`** (directory name must match frontmatter **`name`**). Global skills from **`npx skills add`** often land in **`~/.agents/skills/`**—Pi merges those too; see **[docs/SKILLS.md](docs/SKILLS.md)** §2.

### Run a single extension

```bash
pi -e extensions/<name>.ts
```

### Stack multiple extensions

Extensions compose — pass multiple `-e` flags:

```bash
pi -e extensions/minimal.ts -e extensions/cross-agent.ts
```

### Use `just` recipes

`just` wraps the most useful combinations. Run `just` with no arguments to list all available recipes:

```bash
just
```

Common recipes:

```bash
just pi                     # Plain Pi, no extensions
just ext-pure-focus         # Distraction-free mode
just ext-minimal            # Minimal context meter footer
just ext-cross-agent        # Cross-agent command loading + minimal footer
just ext-purpose-gate       # Purpose gate + minimal footer
just ext-tool-counter       # Rich two-line footer with tool tally
just ext-tool-counter-widget # Per-tool widget above the editor
just ext-subagent-widget    # Subagent spawner with live progress widgets
just ext-tilldone           # Task discipline system with live progress tracking
just ext-agent-team         # session-memory + context-local-hints + agent-team.ts (default team = first in teams.yaml, often full)
just ext-builder-team       # same stack but agent-team-build-orchestra.ts → initial team build-orchestra (builder orchestrator roster)
just ext-system-select      # Agent persona switcher via /system command
just ext-damage-control     # Safety auditing + minimal footer
just ext-agent-chain        # session-memory + context-local-hints + sequential pipeline orchestrator
just ext-pi-pi              # Meta-agent that builds Pi agents using parallel experts
just ext-session-replay     # Scrollable timeline overlay of session history
just ext-theme-cycler       # Theme cycler + minimal footer
just ext-extension-picker   # /extensions package picker + minimal
just ext-session-memory     # JSONL recap in system prompt + minimal
just ext-session-saver        # Auto-save snapshots + /save /list /show /load
just ext-chronicle          # Workflow ledger + chronicle_* tools
just ext-agent-forge        # forge_list / forge_create
just ext-dynamic-loader     # /extension-hint for pi -e stacks
just ext-pi-doctor          # /doctor — playground + toolchain health checks
just ext-web-tools          # web_search + web_fetch (Brave key optional)
just ext-ralph              # Ralph queue: ralph_queue_status + /ralph (todo → inprogress → done)
just all                    # Interactive multi-select (just pi-e) to stack extensions
```

### Global commands on `PATH` (Pi playground + Hermes)

**Pi** shortcuts: **`ppi`**, **`ppi-*`**, **`pi-e`**, **`pg-pi`**. **Hermes**: **`hermes-honcho-status`**, etc. (from this repo’s **`install-global`**). **Honcho** **`honcho-up`**, **`honcho-open-*`**: install from **`~/honcho-server/scripts/install-honcho-bin.sh`** — **[HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md#command-namespaces-system-first)**.

Recipes are **`just`** targets; from outside this repo use **`scripts/ppi`**, which `cd`s here and runs **`just`**. One-time install puts shortcuts on your **`PATH`**:

```bash
cd ~/.pi    # or your clone path
./install-global
```

This does **not** require **`just`** (use it if `just install-global` is not available yet). After linking, commands like **`ppi`** and **`ppi-ext-minimal`** still need **`just`** on your **`PATH`**—install **`just`** using the table in **Prerequisites** above.

Then (with **`~/.local/bin`** on **`PATH`**):

| Command | Effect |
|---------|--------|
| **`ppi`** | `just --list` |
| **`ppi ext-agent-team`** | **`agent-team.ts`** — dispatcher grid; first **`teams.yaml`** team |
| **`ppi ext-builder-team`** | **`agent-team-build-orchestra.ts`** — same UI; starts on **`build-orchestra`** |
| **`ppi-ext-pi-doctor`** | Pi + **pi-doctor** + minimal → run **`/doctor`** in the TUI |
| **`pi-e`** / **`ppi pi-e`** | **1** alone (±**2**) → full **`extensions[]`** from JSON; **1 12** or any menu **3+** → only stacked **`-e`**; **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** merges JSON + **`-e`** — **[docs/PLAYGROUND.md](docs/PLAYGROUND.md)** |
| **`ppi-pi`** | plain Pi (`just pi`) — does **not** replace the real **`pi`** binary |

Hermes **`just`** recipes: **`just hermes-honcho-status`**, **`just hermes-honcho-setup`**, … (or **`ppi-…`** / **`hermes-honcho-*`** on **`PATH`** after **`install-global`**). Details: **[scripts/README.md](scripts/README.md)**.

**Honcho** (optional — `~/honcho-server` clone):

```bash
cd ~/honcho-server && just honcho-up    # Docker: database, redis, api, deriver
cd ~/honcho-server && just honcho-status
./scripts/install-honcho-bin.sh         # ~/.local/bin: honcho-up, honcho-open-*, …
```

**Hermes ↔ Honcho** check from the Pi repo: **`just hermes-honcho-status`** (expects local Hermes venv path in **`justfile`**).

The `open` recipe allows you to spin up a new terminal window with any combination of stacked extensions (omit `.ts`):

```bash
just open purpose-gate minimal tool-counter-widget
```

---

## Project Structure

Indexed in **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** (paths, purposes, gitignored dirs, **`projects/_template`** files).

```
project/
├── agent/               # Pi agent dir: AGENTS.md (context), sessions/ (gitignored)
├── docs/                # Guides: REPO_INDEX, SKILLS, TOOLS, AGENTS, integrations, …
├── extensions/          # Pi extension source (.ts) — one file per extension
├── projects/            # Per-codebase notes: projects/<slug>/ (copy from _template/)
│   └── _template/       # README + 00–04 markdown for new slugs
├── specs/               # Extension specifications
├── .cursor/rules/       # Cursor rules (extensions, project docs, core docs)
├── scripts/             # ppi, pi-e, import-domain-specialists.cjs, playground scripts — see scripts/README.md
├── .pi/
│   ├── extensions/      # Shims: export from ../../extensions/… (Pi loads these)
│   ├── agent-sessions/  # Ephemeral specialist sessions (gitignored)
│   ├── agents/          # Agent .md, teams.yaml, teams-presets.json, agent-chain.yaml
│   │   ├── domain-specialists/   # Category trees of specialist .md (recursive scan)
│   │   ├── pi-pi/       # Experts for pi-pi meta-agent
│   │   └── …            # e.g. ralph.md, project-scanner.md, planner.md
│   ├── skills/          # SKILL.md trees (bowser/, find-skills/, github/, indexer/, ralph/, …)
│   ├── themes/          # Custom themes (.json)
│   ├── storage/         # Session-saver snapshots (gitignored)
│   ├── chronicle/       # Chronicle ledger (gitignored)
│   ├── damage-control-rules.yaml
│   └── settings.json    # Loaded extensions list + theme + prompts
├── images/
├── justfile
├── CLAUDE.md
├── THEME.md
└── TOOLS.md             # Core built-in tool signatures (see also docs/TOOLS.md)
```

### `projects/` and new codebases

For **every new repo or sustained effort**, Pi agents should read **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)**, then create **`projects/<slug>/`** from **`projects/_template/`** under this playground (paths are **`…/pi/projects/`** on disk). **`project-scanner`** (agent-team team **`new-project`**) can scan a workspace and fill those files. See **`.cursor/rules/pi-projects-docs.mdc`** and **`projects/README.md`**.

### Ralph (HTML queue)

**Ralph** implements **`todo/` → `inprogress/` → `done/`** with **`.txt`** tickets and **one HTML file** per task: extension **`extensions/ralph.ts`** (**`ralph_queue_status`**, **`/ralph`**), skill **`/skill:ralph`**, agent **`ralph`**. Team **`ralph`** lists **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, and **`documenter`** so the **agent-team** dispatcher can **`dispatch_agent`** exploration, planning, extra implementation, review, **code docs**, or **prose docs** (Ralph returns **`RALPH_ESCALATE`** if blocked in headless mode). Use **`just ext-ralph`** with **`minimal`**.

---


## Orchestrating Multi-Agent Workflows

Pi's architecture makes it easy to coordinate multiple autonomous agents. This playground includes several powerful multi-agent extensions:

### Subagent Widget (`/sub`)
The `subagent-widget` extension allows you to offload isolated tasks to background Pi agents while you continue working in the main terminal. Typing `/sub <task>` spawns a headless subagent that reports its streaming progress via a persistent, live-updating UI widget above your editor.

### Agent Teams (`/team`)
The `agent-team` orchestrator operates as a dispatcher. Instead of answering prompts directly, the primary agent reviews your request, selects a specialist from a defined roster, and delegates the work via a `dispatch_agent` tool.
- Teams are configured in `.pi/agents/teams.yaml` where each top-level key is a team name containing a list of agent names (e.g., `frontend: [planner, builder, bowser]`).
- **Built-in teams** include **`new-project`** (**`project-scanner`** only) for bootstrapping **`projects/<slug>/`**, **`hermes`** (solo **Hermes CLI** bridge—see **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)** §7), and **`ralph`** (**`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**) for HTML tickets plus helpers; **`full`**, **`plan-build`**, and **`info`** list specialists per **`teams.yaml`**. See **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)**.
- Individual agent personas (e.g., `builder.md`, `reviewer.md`, `project-scanner.md`, `ralph.md`) live in `.pi/agents/`.
- **pi-pi Meta-Agent**: The `pi-pi` team specifically delegates tasks to specialized Pi framework experts (`ext-expert.md`, `theme-expert.md`, `tui-expert.md`) located in `.pi/agents/pi-pi/` to build high-quality Pi extensions using parallel research.
  - **Web Crawling Fallbacks**: To ingest the latest framework documentation dynamically, these experts use `firecrawl` as their default modern page crawler, but are explicitly programmed to safely fall back to the native `curl` baked into their bash toolset if Firecrawl fails or is unavailable.

### Agent Chains (`/chain`)
Unlike the dynamic dispatcher, `agent-chain` acts as a sequential pipeline orchestrator. Workflows are defined in `.pi/agents/agent-chain.yaml` where the output of one agent becomes the input (`$INPUT`) to the next.
- Workflows are defined as a list of `steps`, where each step specifies an `agent` and a `prompt`. 
- The `$INPUT` variable injects the previous step's output (or the user's initial prompt for the first step), and `$ORIGINAL` always contains the user's initial prompt.
- Example: The `plan-build-review` pipeline feeds your prompt to the `planner`, passes the plan to the `builder`, and finally sends the code to the `reviewer`.

---

## Safety Auditing & Damage Control

The `damage-control` extension provides real-time security hooks to prevent catastrophic mistakes when agents execute bash commands or modify files. It uses Pi's `tool_call` event to intercept and evaluate every action against `.pi/damage-control-rules.yaml`.

- **Dangerous Commands**: Uses regex (`bashToolPatterns`) to block destructive commands like `rm -rf`, `git reset --hard`, `aws s3 rm --recursive`, or `DROP DATABASE`. Some rules strictly block execution, while others (`ask: true`) pause execution to prompt you for confirmation.
- **Zero Access Paths**: Prevents the agent from reading or writing sensitive files (e.g., `.env`, `~/.ssh/`, `*.pem`).
- **Read-Only Paths**: Allows reading but blocks modifying system files or lockfiles (`package-lock.json`, `/etc/`).
- **No-Delete Paths**: Allows modifying but prevents deleting critical project configuration (`.git/`, `Dockerfile`, `README.md`).

---

## Extension Author Reference

Companion docs cover the conventions used across all extensions in this repo:

- **[docs/README.md](docs/README.md)** — Master index of all guides in `docs/`.
- **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** — What lives in each folder (`extensions/`, `.pi/`, `projects/`, `agent/`, …).
- **[docs/AGENTS.md](docs/AGENTS.md)** — Agent markdown definitions, where Pi scans them, and how `system-select`, `agent-team`, and `agent-chain` use them.
- **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)** — Agent-team dispatcher: `teams.yaml`, `teams-presets.json`, `dispatch_agent`, team tools, slash commands.
- **[docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md)** — How agent memory works: JSONL, session-memory, session-saver, `/remember`, AGENTS.md, troubleshooting.
- **[docs/SYSTEM.md](docs/SYSTEM.md)** — Memory (`session-memory` vs `session-saver`), context, specs vs code, and agent behavior (run tools; don’t invent command output).
- **[docs/EXTENSIONS.md](docs/EXTENSIONS.md)** — How Pi extensions work upstream, how **this repo** uses `extensions/` + `.pi/extensions/` shims, creating new extensions, and integrating npm/git packages (for humans and agents).
- **[docs/SKILLS.md](docs/SKILLS.md)** — Skills (`SKILL.md`): where Pi discovers them, progressive disclosure, `/skill:name`, authoring, and how they differ from extensions and agents.
- **[docs/CONCEPTS.md](docs/CONCEPTS.md)** — Skills vs agents vs extensions vs tools (definitions, table, when to use which).
- **[docs/TOOLS.md](docs/TOOLS.md)** — Tools: built-ins, `registerTool`, agent allowlists, safety; complements root **`TOOLS.md`** signatures.
- **[COMPARISON.md](COMPARISON.md)** — Feature-by-feature comparison of Claude Code vs Pi Agent across 12 categories (design philosophy, tools, hooks, SDK, enterprise, and more).
- **[PI_VS_OPEN_CODE.md](PI_VS_OPEN_CODE.md)** — Architectural comparison of Pi Agent vs OpenCode (open-source Claude Code alternative) focusing on extension capabilities, event lifecycle, and UI customization.
- **[RESERVED_KEYS.md](RESERVED_KEYS.md)** — Pi reserved keybindings, overridable keys, and safe keys for extension authors.
- **[THEME.md](THEME.md)** — Color language: which Pi theme tokens (`success`, `accent`, `warning`, `dim`, `muted`) map to which UI roles, with examples.
- **[TOOLS.md](TOOLS.md)** — Function signatures for the built-in tools available inside extensions (`read`, `bash`, `edit`, `write`). Narrative: **[docs/TOOLS.md](docs/TOOLS.md)**.

**Cursor (this repo):** **`.cursor/rules/`** — `pi-extensions-context.mdc` (always-on), `pi-extensions.mdc` (when editing `extensions/`), `pi-projects-docs.mdc` (project onboarding + `projects/`), `pi-docs-core.mdc` (when editing core concept docs).

---

## Hooks & Events

Side-by-side comparison of lifecycle hooks in [Claude Code](https://docs.anthropic.com/en/docs/claude-code/hooks) vs [Pi Agent](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#events).

| Category            | Claude Code                                                      | Pi Agent                                                                                                                | Available In |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Session**         | `SessionStart`, `SessionEnd`                                     | `session_start`, `session_shutdown`                                                                                     | Both         |
| **Input**           | `UserPromptSubmit`                                               | `input`                                                                                                                 | Both         |
| **Tool**            | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`                | `tool_call`, `tool_result`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`                       | Both         |
| **Bash**            | —                                                                | `BashSpawnHook`, `user_bash`                                                                                            | Pi           |
| **Permission**      | `PermissionRequest`                                              | —                                                                                                                       | CC           |
| **Compact**         | `PreCompact`                                                     | `session_before_compact`, `session_compact`                                                                             | Both         |
| **Branching**       | —                                                                | `session_before_fork`, `session_fork`, `session_before_switch`, `session_switch`, `session_before_tree`, `session_tree` | Pi           |
| **Agent / Turn**    | —                                                                | `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`                                              | Pi           |
| **Message**         | —                                                                | `message_start`, `message_update`, `message_end`                                                                        | Pi           |
| **Model / Context** | —                                                                | `model_select`, `context`                                                                                               | Pi           |
| **Sub-agents**      | `SubagentStart`, `SubagentStop`, `TeammateIdle`, `TaskCompleted` | —                                                                                                                       | CC           |
| **Config**          | `ConfigChange`                                                   | —                                                                                                                       | CC           |
| **Worktree**        | `WorktreeCreate`, `WorktreeRemove`                               | —                                                                                                                       | CC           |
| **System**          | `Stop`, `Notification`                                           | —                                                                                                                       | CC           |



## Resources

### Pi upstream

| Doc                                                                                                     | Description                        |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [Mario's Twitter](https://x.com/badlogicgames)                                                          | Creator of Pi Coding Agent         |
| [README.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)              | Overview and getting started       |
| [sdk.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md)               | TypeScript SDK reference           |
| [rpc.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/rpc.md)               | RPC protocol specification         |
| [json.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/json.md)             | JSON event stream format           |
| [providers.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md)   | API keys and provider setup        |
| [models.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md)         | Custom models (Ollama, vLLM, etc.) |
| [extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) | Extension system                   |
| [skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)         | Skills (Agent Skills standard)     |
| [settings.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/settings.md)     | Configuration                      |
| [compaction.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md) | Context compaction                 |

### Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for notable playground updates (extensions, docs, agents, rules).

---

## Master Agentic Coding
> Prepare for the future of software engineering

Learn tactical agentic coding patterns with [Tactical Agentic Coding](https://agenticengineer.com/tactical-agentic-coding)

Follow the [IndyDevDan YouTube channel](https://www.youtube.com/@indydevdan) to improve your agentic coding advantage.
