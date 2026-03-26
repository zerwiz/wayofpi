# Pi Playground Index

**Repository root:** `/home/zerwiz/.pi`  
**Playground purpose:** A collection of Pi Coding Agent customized instances to showcase UI customization, agent orchestration, safety auditing, and cross-agent integrations.  
**See full docs:** [docs/README.md](../../docs/README.md) | [README.md](../../README.md)

---

## Table of Contents

1. [Core Extensions](#core-extensions)
2. [Agents & Teams](#agents--teams)
3. [Skills](#skills)
4. [Theme Customizations](#theme-customizations)
5. [Projects & Per-Codebase Docs](#projects--per-codebase-docs)
6. [Scripts & Utilities](#scripts--utilities)
7. [Documentation](#documentation)
8. [Git-ignored Areas](#git-ignored-areas)
9. [Quick Start Guide](#quick-start-guide)

---

## Architecture Overview

```
/home/zerwiz/.pi/
├── extensions/              # Pi extension source files (24 .ts files)
├── .pi/                     # Pi runtime workspace
│   ├── agents/             # Agent definitions (13 .md + YAML configs)
│   ├── .pi/agents/         # Pi-specific agent definitions & teams.yaml
│   ├── skills/             # Skills (SKILL.md)
│   ├── themes/             # Theme configs (*.json)
│   ├── extensions/         # Shim files
│   ├── agent-sessions/     # Gitignored: ephemeral subagent state
│   ├── storage/            # Gitignored: session snapshots
│   └── chronicle/          # Gitignored: workflow ledger
├── agent/                  # Pi agent install workspace
│   ├── AGENTS.md
│   ├── models.json
│   └── sessions/
├── projects/               # Per-codebase documentation
│   ├── _template/         # Template files for new projects
│   ├── pi-playground/    # This project docs
│   └── <slug>/           # New projects
├── docs/                   # Human documentation guides
├── specs/                  # Extension specifications
├── .cursor/rules/          # Cursor AI rules
├── scripts/               # Shell scripts
├── themes.json            # Main Pi theme definition
├── justfile               # Just recipes
├── README.md              # Main readme
└── CHANGELOG.md           # Changelog
```

---

## Core Extensions

**Location:** `/home/zerwiz/.pi/extensions/*.ts` (24 files)

Each file is a standalone Pi extension loaded via `pi -e` or `just ext-*`.

| File | Purpose |
|------|---------|
| `agent-chain.ts` | Sequential pipeline orchestrator; chains multiple agents with `$INPUT` passing between steps. Use `/chain` to select and run. |
| `agent-forge.ts` | LLM tools `forge_list`/`forge_create` → write `extensions/forge-*.ts` + update `forge-registry.json`; shim + `/reload` to load new tools. |
| `agent-team.ts` | Dispatcher: `dispatch_agent` + `team_*` tools; add/remove/replace members, reload `.md` defs, switch teams, save/load presets. |
| `chatLabels.ts` | Multi-agent session chat labels with inline labels and sidebar widget. |
| `chronicle.ts` | Workflow ledger at `.pi/chronicle/ledger.json`; optional `workflow.json`; tools `chronicle_*` and `/chronicle`. |
| `cross-agent.ts` | Scans `.claude/`, `.gemini/`, `.codex/` dirs for commands, skills, and agents; registers them in Pi. |
| `damage-control.ts` | Real-time safety auditing; intercepts dangerous bash patterns; enforces path-based access controls from `.pi/damage-control-rules.yaml`. |
| `dynamic-loader.ts` | `/extension-hint` command; prints stacked `pi -e` suggestions for this playground. |
| `extension-picker.ts` | `/extensions` lists `pi.extensions` from settings packages + local `extensions/*.ts`; saves `pi -e` to `~/.pi/storage/`. |
| `github-management.ts` | GitHub workflow helpers (branches, worktrees, PR orchestration via `skill:github`). |
| `minimal.ts` | Compact footer showing model name + 10-block context usage meter `[###-------] 30%`. |
| `pi-pi.ts` | Multi-agent workflow extension for Pi/Pi-Pi documentation system. |
| `pure-focus.ts` | Removes footer bar and status line — pure distraction-free mode. |
| `purpose-gate.ts` | Prompts session intent on startup; persistent purpose widget; blocks prompts until answered. |
| `ralph.ts` | Ralph queue: `todo/` → `inprogress/` → `done/`; `ralph_queue_status` tool; `/ralph` slash command. |
| `session-memory.ts` | Session recap injection: JSONL path, session id, compaction/branch summaries, dialogue recap from disk. |
| `session-memory.ts` | Session recap injection (duplicate); JSONL path, session id, compaction/branch summaries. |
| `session-replay.ts` | Scrollable timeline overlay of session history; showcases customizable dialog UI. |
| `session-saver/index.ts` | Auto-save user/assistant turns to JSON; `/save`, `/list`, `/show`, `/load` commands (`.jsonl` uses `switchSession`). |
| `subagent-widget.ts` | `/sub <task>` command; spawns background Pi subagents; each gets streaming live-progress widget above editor. |
| `system-select.ts` | `/system` command; interactively switch agent personas/system prompts from `.pi/agents/` and other dirs. |
| `theme-cycler.ts` | Ctrl+X/Ctrl+Q and `/theme` command to cycle/switch between custom themes. |
| `themeMap.ts` | Theme map for theme-cycler extension. |
| `tilldone.ts` | Task discipline; `tilldone` tool gates other tools; writes `.pi/tilldone-checklist.md` on each update. |
| `tool-counter.ts` | Rich two-line footer: model + context meter + token/cost stats on line 1, cwd/branch + tool tally on line 2. |
| `tool-counter-widget.ts` | Live-updating above-editor widget showing per-tool call counts with background colors. |

---

## Agents & Teams

### Agent Definitions (`.md` personas)

**Location:** `.pi/agents/` and `.pi/.pi/agents/`

| File | Purpose |
|------|---------|
| `.pi/agents/default.md` | Default agent persona (base context). |
| `.pi/.pi/agents/bowser.md` | Headless browser automation via Playwright CLI. |
| `.pi/.pi/agents/builder.md` | Implementation/execution step in multi-agent workflows. |
| `.pi/.pi/agents/code-documenter.md` | Generates code documentation from existing files. |
| `.pi/.pi/agents/documenter.md` | Narrative/documentation writing agent. |
| `.pi/.pi/agents/hermes.md` | Solo Hermes CLI bridge; see `docs/HERMES_INTEGRATION.md` §7. |
| `.pi/.pi/agents/indexer.md` | Builds/refreshes `INDEX.md` in project roots. |
| `.pi/.pi/agents/planner.md` | Planning, task breakdown, workflow design. |
| `.pi/.pi/agents/project-scanner.md` | Scans codebases; creates `projects/<slug>/` from `_template/`. |
| `.pi/.pi/agents/ralph.md` | Ralph queue management and HTML ticket handling. |
| `.pi/.pi/agents/reviewer.md` | Code review, quality assurance, security checks. |
| `.pi/.pi/agents/red-team.md` | Adversarial testing, security auditing, edge case discovery. |
| `.pi/.pi/agents/scout.md` | Initial exploration, reconnaissance, information gathering. |
| `.pi/.pi/agents/agent-expert.md` | Meta-agent expert for Pi framework development. |
| `.pi/.pi/agents/cli-expert.md` | Meta-agent expert for CLI operations. |
| `.pi/.pi/agents/config-expert.md` | Meta-agent expert for config management. |
| `.pi/.pi/agents/ext-expert.md` | Meta-agent expert for extension development. |
| `.pi/.pi/agents/keybinding-expert.md` | Meta-agent expert for keybinding management. |
| `.pi/.pi/agents/pi-orchestrator.md` | Orchestrates parallel expert agents for documentation. |
| `.pi/.pi/agents/prompt-expert.md` | Meta-agent expert for prompt development. |
| `.pi/.pi/agents/skill-expert.md` | Meta-agent expert for skill development. |
| `.pi/.pi/agents/theme-expert.md` | Meta-agent expert for theme customization. |
| `.pi/.pi/agents/tui-expert.md` | Meta-agent expert for TUI customization. |
| `.pi/.pi/agents/agent-chain.yaml` | Sequential pipeline orchestrator definitions. |
| `.pi/.pi/agents/teams.yaml` | Team definitions; top-level keys are team names with agent member lists. |

### Team Configurations

Teams are defined in `.pi/.pi/agents/teams.yaml`. Available presets:

- **`new-project`** — Bootstrapping team (`project-scanner` only).
- **`ralph`** — Ralph workflow (`ralph`, `scout`, `planner`, `builder`, `reviewer`, `code-documenter`, `documenter`).
- **`hermes`** — Solo Hermes CLI bridge.
- **`full`**, **`plan-build`**, **`info`** — Full specialist rosters from `teams.yaml`.
- **`pi-pi`** — Parallel expert agents for Pi framework development (`agent-expert`, `cli-expert`, `config-expert`, `ext-expert`, `keybinding-expert`, `theme-expert`, `tui-expert`).
- **`pi-pi/pi-orchestrator`** — Orchestrates parallel experts for documentation.

**Team commands:**
```bash
team list              # List available teams
team add <team> <agent>  # Add agent to team
team remove <team> <agent>
team switch <team>     # Switch current team
team load <team>.json  # Load from preset
```

---

## Skills

**Location:** `.pi/skills/<name>/SKILL.md`

| Skill | Location | Purpose |
|-------|----------|---------|
| `extending-pi` | Upstream: `/home/zerwiz/.npm-global/lib/node_modules/@mariozechner/pi-coding-agent/skills/extending-pi/` | Guide for extending Pi; scaffolding, manifest config, package making. |
| `skill-creator` | Upstream: `/home/zerwiz/.npm-global/lib/node_modules/@mariozechner/pi-coding-agent/skills/skill-creator/` | Create/update Pi skills (SKILL.md + scripts/references/assets). |
| `ralph-wiggum` | Upstream: `/home/zerwiz/.npm-global/lib/node_modules/@mariozechner/pi-extensions/ralph-wiggum/` | Long-running iterative development with pacing control and checkpoints. |
| `bowser` | `.pi/skills/bowser/SKILL.md` | Headless browser automation (Playwright CLI); headless browsing, parallel sessions, UI testing, scraping. |
| `github` | `.pi/skills/github/SKILL.md` | GitHub workflows with branches + git worktrees for parallel agents in one repo. |
| `indexer` | `.pi/skills/indexer/SKILL.md` | Build/refresh `INDEX.md` for project roots; directory map + per-file purpose maps. |
| `ralph` | `.pi/skills/ralph/SKILL.md` | File-queue batch workflow: `todo/` → `inprogress/` → `done/`, one HTML file per `.txt` ticket. |

**Usage:** `/skill:name` in Pi, or `dispatch_agent` team with skill name.

---

## Theme Customizations

**Location:** `.pi/themes/*.json` and `themes.json`

| File | Purpose |
|------|---------|
| `.pi/themes/catppuccin-mocha.json` | Catppuccin Mocha theme config. |
| `.pi/themes/cyberpunk.json` | Cyberpunk aesthetic theme. |
| `.pi/themes/dracula.json` | Dracula theme config. |
| `.pi/themes/everforest.json` | Everforest theme config. |
| `.pi/themes/gruvbox.json` | Gruvbox theme config. |
| `.pi/themes/midnight-ocean.json` | Midnight Ocean theme config. |
| `.pi/themes/nord.json` | Nord theme config. |
| `.pi/themes/ocean-breeze.json` | Ocean Breeze theme config. |
| `.pi/themes/rose-pine.json` | Rose Pine theme config. |
| `.pi/themes/synthwave.json` | Synthwave aesthetic theme. |
| `.pi/themes/tokyo-night.json` | Tokyo Night theme config. |
| `themes.json` | Main Pi theme definition for system-wide application. |

**Usage:** `just pi-*cycle-*` or `/theme` command via `theme-cycler` extension.

---

## Projects & Per-Codebase Docs

**Location:** `projects/`

**Purpose:** When Pi works on a specific codebase, it creates `projects/<slug>/` documentation (copied from `_template/`).

| Path | Purpose |
|------|---------|
| `projects/README.md` | Rules for when to create `projects/<slug>/`, slug naming, agent behavior pointers. |
| `projects/_template/README.md` | Template README for new slugs (goal, links, file table). |
| `projects/_template/00-OVERVIEW.md` | Template: scope, success criteria. |
| `projects/_template/01-CONTEXT.md` | Template: paths, stack, commands, env vars. |
| `projects/_template/02-DECISIONS.md` | Template: dated decisions log. |
| `projects/_template/03-NOTES.md` | Template: scratch notes. |
| `projects/_template/04-TASKS.md` | Template: checklist / next steps. |

**See also:** `.cursor/rules/pi-projects-docs.mdc` and `projects/README.md`.

---

## Scripts & Utilities

| Path | Purpose |
|------|---------|
| `scripts/README.md` | Overview of scripts and usage. |
| `scripts/install-ppi-global.sh` | Symlinks `ppi`, `pi-e`, `ppi-*` into `~/.local/bin`. |
| `scripts/pi-with-env` | Wrapper that sources `.env` before launching Pi (for bare `pi` command). |
| `install-global` | Executable: symlinks into PATH; no `just` required. |

### Justfile Recipes

```bash
# Core
pi                     # Plain Pi, no extensions
pi-all                 # All extensions

# Extensions
ext-pure-focus         # Distraction-free mode
ext-minimal            # Minimal context meter footer
ext-cross-agent        # Cross-agent commands + minimal footer
ext-purpose-gate       # Purpose gate
ext-tool-counter       # Rich two-line footer
ext-tool-counter-widget
ext-subagent-widget
ext-tilldone
ext-agent-team
ext-system-select
ext-damage-control
ext-agent-chain
ext-pi-pi
ext-session-replay
ext-theme-cycler
ext-extension-picker
ext-session-memory
ext-session-saver
ext-chronicle
ext-agent-forge
ext-dynamic-loader
ext-ralph
all                    # Interactive multi-select

# Utilities
pi-cycle-model         # Cycle models
pi-cycle-theme         # Cycle themes
open                   # New terminal window with extensions

# Honcho/Hermes
honcho-up              # Docker stack
hermes-honcho-status   # Hermes ↔ Honcho check
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `docs/README.md` | Master index of all guides in `docs/`. |
| `docs/REPO_INDEX.md` | Detailed folder map, gitignored paths, `_template` files. |
| `docs/AGENTS.md` | Agent markdown definitions, team scanning, tool usage. |
| `docs/AGENT_MEMORY.md` | Agent memory: JSONL, session-memory, saver, `/remember`. |
| `docs/AGENT_TEAMS.md` | Dispatcher: `teams.yaml`, `teams-presets.json`, `dispatch_agent`. |
| `docs/CONCEPTS.md` | Skills vs agents vs extensions vs tools (definitions, comparisons). |
| `docs/EXTENSIONS.md` | Pi extensions upstream, `.pi/extensions/` shims, creating extensions. |
| `docs/HERMES_INTEGRATION.md` | Hermes CLI bridge, CLI integration guide. |
| `docs/HONCHO_INTEGRATION.md` | Honcho Docker stack, API, deriver integration. |
| `docs/HERMES_HONCHO_CONNECTION.md` | Hermes ↔ Honcho connection guide. |
| `docs/SKILLS.md` | Skills: discovery, `/skill:name`, authoring, vs extensions. |
| `docs/SYSTEM.md` | Memory layers, context, specs vs code, agent behavior. |
| `docs/TUI.md` | TUI: thinking toggle, tools expand, keyboard shortcuts. |
| `docs/TOOLS.md` | Built-in tool signatures, `registerTool`, safety rules. |
| `docs/PLAN_AWESOME_CODEX_SUBAGENTS.md` | Porting Codex subagents to Pi workflows. |
| `docs/PLAN_AGENT_MODEL_ROUTING.md` | Agent and model routing strategy. |
| `CHANGELOG.md` | Playground updates: extensions, docs, agents, rules. |
| `CLAUDE.md` | Short agent conventions (Bun, `just`, shim pattern). |
| `COMPARISON.md` | Pi vs Claude Code feature-by-feature comparison (12 categories). |
| `PI_VS_OPEN_CODE.md` | Pi vs OpenCode architectural comparison. |
| `RESERVED_KEYS.md` | Pi reserved keybindings, safe keys for extension authors. |

---

## Git-ignored Areas

These paths are typically gitignored (check `.gitignore`):

| Area | Purpose |
|------|---------|
| `.pi/agent-sessions/` | Ephemeral subagent sessions; JSONL transcripts. |
| `.pi/storage/` | Session-saver snapshots, `last-extension.json`; local state. |
| `.pi/chronicle/` | Chronicle workflow ledger; gitignored in default setup. |
| `agent/sessions/` | Chat JSONL and session data. |
| `.env` | API keys; use `.env.sample`. |

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `.pi/settings.json` | Loaded extensions list, theme, prompts, packages. |
| `.pi/settings.playground.json` | Playground-specific settings. |
| `themes.json` | Main Pi theme definition for system-wide application. |
| `.pi/damage-control-rules.yaml` | Safety rules: bash patterns, path-based access controls. |
| `.pi/.pi/agent/models.json` | Ollama models + merged OpenRouter models. |
| `.pi/.pi/agent/settings.json` | Pi agent directory settings (optional). |
| `.pi/tilldone-checklist.md` | Auto-generated task checklist (checkbox markdown). |

---

## Quick Start Guide

### Starting Extensions

```bash
# Single extension
pi -e extensions/minimal.ts

# Stack extensions
pi -e extensions/minimal.ts -e extensions/cross-agent.ts

# Use just recipe
just ext-minimal
```

### Ralph Queue

```bash
# Add ticket
echo "Task description" > todo/new-task.txt

# Check queue status
ralph_queue_status

# Move from todo to inprogress
ralph move todo/inprogress

# Move from inprogress to done
ralph move inprogress/done
```

### Agent Dispatch

```bash
# List teams
team list

# Dispatch specialist
dispatch_agent new-project/scout "Explore this repo structure"

# Dispatch pi-pi expert
dispatch_agent pi-pi/ext-expert "Help me write a new extension"
```

### Theme Cycling

```bash
# Cycle themes
Ctrl+X / Ctrl+Q
just pi-cycle-theme
them

# Or use theme-cycler extension
pi -e extensions/theme-cycler.ts
```

---

## Last Updated

2026-03-26
