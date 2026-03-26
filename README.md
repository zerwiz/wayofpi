# pi-vs-cc

A collection of [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent) customized instances. _Why?_ To showcase what it looks like to hedge against the leader in the agentic coding market, Claude Code. Here we showcase how you can customize the UI, agent orchestration tools, safety auditing, and cross-agent integrations.

**This repository also includes:** a **[documentation set](docs/README.md)** (memory, extensions, skills, tools, agents, Hermes/Honcho, repo index), **`projects/`** for per-codebase notes under Pi, **`project-scanner`** and **`ralph`** agents/skills/extensions for onboarding and HTML ticket queues, **`/skill:github`** for **branches + git worktrees** (parallel agents in one repo), and **Cursor rules** under **`.cursor/rules/`** for consistent agent behavior.

<div align="center">
  <img src="./images/pi-logo.png" alt="pi-vs-cc" width="700">
</div>

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

---

## Installation

```bash
bun install
```

### Ollama (this repo’s defaults)

Pi is pointed at **local Ollama** (`http://localhost:11434/v1`) with **`agent/models.json`** listing the chat models pulled on this machine. **Default model:** **`qwen3.5:9b-32k`** (see **`agent/settings.json`**). Change **`defaultModel`** or add/remove entries in **`agent/models.json`** and **`pi.config.json`** to match `ollama list`. **Embedding-only** models (e.g. **`mxbai-embed-large`**) are omitted from the chat picker. For a remote Ollama host, set the base URL in **`agent/models.json`** / [`Pi models docs`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md).

### OpenRouter

Set **`OPENROUTER_API_KEY`** in **`.env`** (see **`.env.sample`**). The **`openrouter`** block in **`agent/models.json`** points at **`https://openrouter.ai/api/v1`** and merges with Pi’s **built-in OpenRouter model list**—use **`/model`** or e.g. **`--model openrouter/google/gemini-3-flash-preview`** (same pattern as **`extensions/agent-team.ts`** defaults). **`openai`** is listed **after** **`openrouter`** in **`agent/models.json`** (keys + merge) with **`OPENAI_API_KEY`** for the native OpenAI API.

**Provider order in the TUI:** Pi’s **`/model`** overlay sorts providers with **`localeCompare`**, so **`openai`** appears **before** **`openrouter`** (alphabetically). That cannot be changed from JSON alone; use **`just pi-cycle-or-free-first`** (or the same **`--models`** list) so **Ctrl+P** cycles **OpenRouter `:free` models first**, then other OpenRouter picks, **Ollama**, then **OpenAI** last.

**Free OpenRouter models first (reference list):** **`pi.config.json`** lists **`:free`** OpenRouter model ids **before** paid-route OpenRouter rows, then **Ollama**, then **`openai`** / **`gpt-4o-mini`**. Update ids if [OpenRouter](https://openrouter.ai/models) drops or renames a free tier.

**Loading the key:** **`scripts/ppi`** and **`just`** (from this repo) source **`.env`** before launching **`pi`**, so **`ppi pi`**, **`just pi`**, and **`ppi-<recipe>`** pick up **`OPENROUTER_API_KEY`** automatically. For a bare **`pi`** command, use **`scripts/pi-with-env`** (see **`scripts/README.md`**).

---

## Documentation

Full index: **[docs/README.md](docs/README.md)**. Highlights:

| Topic | Doc |
| ----- | --- |
| **TUI** (thinking toggle, tools expand, keyboard shortcuts) | **[docs/TUI.md](docs/TUI.md)** |
| **Repo map** (folders, gitignored paths, `projects/_template`) | **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** |
| **Skills** (discovery, `/skill:name`, authoring) | **[docs/SKILLS.md](docs/SKILLS.md)** |
| **Tools** (built-ins + `registerTool` + agent allowlists) | **[docs/TOOLS.md](docs/TOOLS.md)** |
| **Skills vs agents vs extensions vs tools** | **[docs/CONCEPTS.md](docs/CONCEPTS.md)** |
| **Agents** + **agent-team** | **[docs/AGENTS.md](docs/AGENTS.md)**, **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)** |
| **Memory** (JSONL, session-memory, saver, `/remember`) | **[docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md)**, **[docs/SYSTEM.md](docs/SYSTEM.md)** |
| **Extensions** (shims, checklist) | **[docs/EXTENSIONS.md](docs/EXTENSIONS.md)** |
| **Hermes** / **Honcho** (cross-session memory, local Docker) | **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)**, **[docs/HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md)**, **[docs/Hermes_Honcho_connection.md](docs/Hermes_Honcho_connection.md)** |
| **Per-project markdown** | **[projects/README.md](projects/README.md)** |
| **Changes** | **[CHANGELOG.md](CHANGELOG.md)** |
| **Porting Codex subagents** | **[docs/PLAN_AWESOME_CODEX_SUBAGENTS.md](docs/PLAN_AWESOME_CODEX_SUBAGENTS.md)** (from [awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents)) |
| **Agent / model routing** | **[docs/PLAN_AGENT_MODEL_ROUTING.md](docs/PLAN_AGENT_MODEL_ROUTING.md)** |

---

## Extensions

| Extension               | File                                | Description                                                                                                                                                |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pure-focus**          | `extensions/pure-focus.ts`          | Removes the footer bar and status line entirely — pure distraction-free mode                                                                               |
| **minimal**             | `extensions/minimal.ts`             | Compact footer showing model name and a 10-block context usage meter `[###-------] 30%`                                                                    |
| **cross-agent**         | `extensions/cross-agent.ts`         | Scans `.claude/`, `.gemini/`, `.codex/` dirs for commands, skills, and agents and registers them in Pi                                                     |
| **purpose-gate**        | `extensions/purpose-gate.ts`        | Prompts you to declare session intent on startup; shows a persistent purpose widget and blocks prompts until answered                                      |
| **tool-counter**        | `extensions/tool-counter.ts`        | Rich two-line footer: model + context meter + token/cost stats on line 1, cwd/branch + per-tool call tally on line 2                                       |
| **tool-counter-widget** | `extensions/tool-counter-widget.ts` | Live-updating above-editor widget showing per-tool call counts with background colors                                                                      |
| **subagent-widget**     | `extensions/subagent-widget.ts`     | `/sub <task>` command that spawns background Pi subagents; each gets its own streaming live-progress widget                                                |
| **tilldone**            | `extensions/tilldone.ts`            | Task discipline — **`tilldone`** tool gates other tools; footer + widget; writes **`.pi/tilldone-checklist.md`** (Markdown `- [ ]` / `- [x]`) on each update for handoffs and agent **`read`** |
| **agent-team**          | `extensions/agent-team.ts`          | Dispatcher: `dispatch_agent` + **team_*** tools — add/remove/**replace** members, **reload** `.md` defs from disk, switch teams, save/load **`.pi/agents/teams-presets.json`**; grid; **`.pi/agents/teams.yaml`** |
| **system-select**       | `extensions/system-select.ts`       | `/system` command to interactively switch between agent personas/system prompts from `.pi/agents/`, `.claude/agents/`, `.gemini/agents/`, `.codex/agents/` |
| **damage-control**      | `extensions/damage-control.ts`      | Real-time safety auditing — intercepts dangerous bash patterns and enforces path-based access controls from `.pi/damage-control-rules.yaml`                |
| **agent-chain**         | `extensions/agent-chain.ts`         | Sequential pipeline orchestrator — chains multiple agents where each step's output feeds into the next step's prompt; use `/chain` to select and run       |
| **pi-pi**               | `extensions/pi-pi.ts`               | Meta-agent that builds Pi agents using parallel research experts for documentation                                                                         |
| **session-replay**      | `extensions/session-replay.ts`      | Scrollable timeline overlay of session history - showcasing customizable dialog UI                                                                         |
| **theme-cycler**        | `extensions/theme-cycler.ts`        | Keyboard shortcuts (Ctrl+X/Ctrl+Q) and `/theme` command to cycle/switch between custom themes                                                              |
| **extension-picker**    | `extensions/extension-picker.ts`    | **`/extensions`** lists `pi.extensions` from settings packages + local `extensions/*.ts`; saves `pi -e` to `~/.pi/storage/`. In the slash menu, **`/ex`** filters to this command. `/remember` and `/memory` for cross-session notes |
| **session-memory**     | `extensions/session-memory.ts`     | Each turn: injects this chat’s **JSONL path**, **session id**, compaction/branch summaries, and a dialogue recap read from disk (`getSessionFile()`). Recap lines use **`zerwis`** (you) / **`pi`** (agent)—change in **`extensions/chatLabels.ts`**. Rules so **`1`** = pick previous numbered option. `/sessionmemory` toggles |
| **session-saver**     | `extensions/sessions/index.ts`     | Auto-save user/assistant turns to JSON; **`/save`**, **`/list`**, **`/show`**, **`/load`** (`.jsonl` uses `switchSession`). See `extensions/sessions/README.md` |
| **dynamic-loader**    | `extensions/dynamic-loader.ts`     | **`/extension-hint`** — prints stacked **`pi -e`** suggestions for this playground (`PLAYGROUND_BASES` optional) |
| **agent-forge**       | `extensions/agent-forge.ts`       | LLM tools **`forge_list`** / **`forge_create`** write `extensions/forge-*.ts` and update **`forge-registry.json`**; shim + **`/reload`** to load new tools |
| **chronicle**         | `extensions/chronicle.ts`         | Workflow ledger **`.pi/chronicle/ledger.json`**, optional **`workflow.json`**; tools **`chronicle_*`** and **`/chronicle`** (phase 1; no sub-agent spawning) |
| **ralph**            | `extensions/ralph.ts`            | **Ralph** queue: **`todo/` → `inprogress/` → `done/`**; tool **`ralph_queue_status`**; **`/ralph`**; skill **`/skill:ralph`**; team **`ralph`** (**`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**) |

---


## Usage

### Auto-load (slash commands without `-e`)

Pi discovers extensions only under `~/.pi/agent/extensions/` or **project** `.pi/extensions/`, not the repo-root `extensions/` directory (see [upstream docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#extension-locations)).

This repo keeps implementations in **`extensions/`** and adds **thin `.pi/extensions/*.ts` shims** that `export { default } from "../../extensions/…"`. That way Pi only loads real extensions (with a default factory); helper modules like **`themeMap.ts` are not placed under `.pi/extensions/`** (Pi would try to load them as extensions and fail). Entries are listed in **`.pi/settings.json`**. After editing code, run **`/reload`** in Pi. Use **`/extensions`** for the package picker (typing **`/ex`** narrows the menu).

Skills belong in **`.pi/skills/<skill-name>/SKILL.md`** (directory name must match frontmatter `name`).

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
just ext-agent-team         # Multi-agent orchestration grid dashboard
just ext-system-select      # Agent persona switcher via /system command
just ext-damage-control     # Safety auditing + minimal footer
just ext-agent-chain        # Sequential pipeline orchestrator with step chaining
just ext-pi-pi              # Meta-agent that builds Pi agents using parallel experts
just ext-session-replay     # Scrollable timeline overlay of session history
just ext-theme-cycler       # Theme cycler + minimal footer
just ext-extension-picker   # /extensions package picker + minimal
just ext-session-memory     # JSONL recap in system prompt + minimal
just ext-session-saver        # Auto-save snapshots + /save /list /show /load
just ext-chronicle          # Workflow ledger + chronicle_* tools
just ext-agent-forge        # forge_list / forge_create
just ext-dynamic-loader     # /extension-hint for pi -e stacks
just ext-ralph              # Ralph queue: ralph_queue_status + /ralph (todo → inprogress → done)
just all                    # Interactive multi-select (just pi-e) to stack extensions
```

### Global commands (`ppi`, `pi-e`, `ppi-*`)

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
| **`ppi ext-agent-team`** | same as `just ext-agent-team` in this repo |
| **`pi-e`** / **`ppi pi-e`** | interactive extension stacker |
| **`ppi-pi`** | plain Pi (`just pi`) — does **not** replace the real **`pi`** binary |
| **`ppi-honcho-up`**, **`ppi-hermes-status`**, … | other `justfile` recipes |

Details: **[scripts/README.md](scripts/README.md)**.

**Honcho / Hermes** (optional — expects `~/honcho-server` and local Hermes venv paths; adjust in `justfile`):

```bash
just honcho-up              # Docker: database, redis, api, deriver
just honcho-up-api          # API-only stack (lighter)
just honcho-status          # curl Honcho HTTP
just hermes-honcho-status   # Hermes ↔ Honcho check
```

The `open` recipe allows you to spin up a new terminal window with any combination of stacked extensions (omit `.ts`):

```bash
just open purpose-gate minimal tool-counter-widget
```

---

## Project Structure

Indexed in **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** (paths, purposes, gitignored dirs, **`projects/_template`** files).

```
pi-vs-cc/
├── agent/               # Pi agent dir: AGENTS.md (context), sessions/ (gitignored)
├── docs/                # Guides: REPO_INDEX, SKILLS, TOOLS, AGENTS, integrations, …
├── extensions/          # Pi extension source (.ts) — one file per extension
├── projects/            # Per-codebase notes: projects/<slug>/ (copy from _template/)
│   └── _template/       # README + 00–04 markdown for new slugs
├── specs/               # Extension specifications
├── .cursor/rules/       # Cursor rules (extensions, project docs, core docs)
├── .pi/
│   ├── extensions/      # Shims: export from ../../extensions/… (Pi loads these)
│   ├── agent-sessions/  # Ephemeral specialist sessions (gitignored)
│   ├── agents/          # Agent .md, teams.yaml, teams-presets.json, agent-chain.yaml
│   │   ├── pi-pi/       # Experts for pi-pi meta-agent
│   │   └── …            # e.g. ralph.md, project-scanner.md, planner.md
│   ├── skills/          # SKILL.md trees (e.g. bowser/, github/, ralph/)
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

Learn tactical agentic coding patterns with [Tactical Agentic Coding](https://agenticengineer.com/tactical-agentic-coding?y=pivscc)

Follow the [IndyDevDan YouTube channel](https://www.youtube.com/@indydevdan) to improve your agentic coding advantage.
