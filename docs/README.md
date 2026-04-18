# Documentation (`docs/`)

Purpose: onboarding and **accurate** descriptions of how this Pi extension playground is wired—especially **memory**, **extensions**, and **specs vs implementation**.

**GitHub:** [zerwiz/wayofpi](https://github.com/zerwiz/wayofpi)

**Cursor:** When editing these markdown files, follow **`.cursor/rules/pi-documentation-consistency.mdc`** (terminology, links, index updates). **Core** guides (**TOOLS**, **SKILLS**, **AGENTS**, **AGENT_TEAMS**, **TUI**) also follow **`.cursor/rules/pi-docs-core.mdc`**.

**Honcho doc set:** If you edit one of **HONCHO_*** / **Hermes_Honcho_*** / **PI_LOCAL_AI** (Hermes+Honcho parts), update **all** of them together — see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)** (includes **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)**).

| Document | Contents |
|----------|-----------|
| **[REPO_INDEX.md](REPO_INDEX.md)** | **Repo map:** what each top-level folder and **`.pi/`** subtree is for; **`projects/_template`** file list; gitignored paths; path cheatsheet (repo-relative); **`apps/wayofpi-ui/`**; root **`start-wayofpi-ui.sh`** / **`start-wayofpi-electron.sh`** |
| **[WOP_PLANNING.md](WOP_PLANNING.md)** | **Planning hub:** links to Way of Pi and other roadmap docs |
| **[WOP_PRODUCT_OVERVIEW.md](WOP_PRODUCT_OVERVIEW.md)** | **Product overview** — narrative onboarding (pitch, journeys, component map); pairs with **[WOP_PRODUCT_CAPABILITIES.md](WOP_PRODUCT_CAPABILITIES.md)** |
| **[WOP_PRODUCT_CAPABILITIES.md](WOP_PRODUCT_CAPABILITIES.md)** | **Product capabilities** — stakeholder summary: Pi playground + Way of Pi shell, shipped vs partial vs planned, boundaries; links to wiring plan and backlog |
| **[WOP_COMBINED_BUILD_TODO.md](WOP_COMBINED_BUILD_TODO.md)** | **Combined build TODO** — merged backlog from WOP plans + **[WOP_STANDALONE_SYSTEM_PLAN](WOP_STANDALONE_SYSTEM_PLAN.md)** (**§15**) + **[WOP_PLANNING](WOP_PLANNING.md)** (**§16**); trim when items ship |
| **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** | **Way of Pi** product plan — web UI + headless Pi, `WOP_*` isolation, sitemap, MVP, production checklist |
| **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** | **Web UI → Pi backend wiring** — **§2.5** = audit of what **does / does not** invoke the Pi process (Bun chat vs Pi-shaped disk reads); **§3–§5** API/WS/UI matrices; phased roadmap (**manifest**, engine swap, sessions, orchestration); complements **WOP_STANDALONE_SYSTEM_PLAN** |
| **[WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md](WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md)** | **Token / context discipline** — how upstream Pi stays lean (compaction, minimal tools, MCP cost), operator checklist, Way of Pi gaps vs **`WOP_CHAT_ENGINE`** |
| **[WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md](WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md)** | **Orchestrator vs Pi dispatcher** — whether Way of Pi is a superset of **`agent-team`**; **two engines** (headless Pi vs interim Bun tools); links to parity tables |
| **[WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md](WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md)** | **Pi tools ↔ Way of Pi** — tool catalogs, Bun orchestrator vs **`dispatch_agent`**, UI/runtime differences; companion to **WOP_ORCHESTRATOR_VS_PI_DISPATCHER** |
| **[IDE_EXPLORER_PARITY.md](IDE_EXPLORER_PARITY.md)** | **Explorer / IDE shell** — Cursor & Zed reference vs `wayofpi-ui` technical shell; gaps and behavior notes |
| **[WOP_CODE_EDITOR_LINE_NUMBERS.md](WOP_CODE_EDITOR_LINE_NUMBERS.md)** | **Workspace code editing** — line gutter vs body typography, **`WorkspaceTextBuffer`** inventory, Notepad++/IDE-style guidance; constants **`apps/wayofpi-ui/src/constants/workspaceEditorChrome.ts`** |
| **[WOP_GENERATED_FILES_AND_LINE_PARITY.md](WOP_GENERATED_FILES_AND_LINE_PARITY.md)** | **Generated/binary files** — Cursor ignore vs indexing, Zed/Git attributes, doc ↔ code **line parity**, `wayofpi-ui` previews |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | **`wayofpi-ui` technical shell** — **`TechnicalWorkspaceGrid`** (up to **3×4** **`WorkspacePane`** cells, resizable flex + **`DockSplitHandle`**, edge-drop grid grow, cross-cell tab strip), persistence, components, hooks, server boundaries, extension checklist; **Electron-first** dev (same **`/api`** / **`/ws`** proxy as browser) |
| **[WOP_MOBILE_UI_PLAN.md](WOP_MOBILE_UI_PLAN.md)** | **Mobile-friendly UI** for **Claw**, **Simple**, and **Technical** (each its own touch layout); **build order: Claw → Simple → Technical**; **`?shell=mobile`** + same **`/api`** / **`/ws`**; per-track exit criteria |
| **[WOP_ORCHESTRATION_EXTENSIONS_PANEL.md](WOP_ORCHESTRATION_EXTENSIONS_PANEL.md)** | **Extensions activity — Orchestration card:** Plan/Build, **`GET /api/config`**, **`POST /api/config`** runtime toggles (Pi drives chat, orchestrator tools/bash), 404 troubleshooting, **Pi extensions** / **`extensions[]`** |
| **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** | **Modular dock TODO** — **Zed reference model** (center panes vs docks), **Phase Z** pane/`PaneItem` target, **N** strips, movable agent/sidebar, **Phase E** graph, **Phase F** preview/review; pairs with **`.cursor/rules/wop-ui-modular-docks.mdc`** |
| **[WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md)** | **Modular docks rule → functional work** — rebuild vs add vs extend, gaps vs **[WOP_MODULAR_DOCKS_PLAN](WOP_MODULAR_DOCKS_PLAN.md)** phases |
| **[WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)** | **`pi-e` appearances → web views** — menu inventory, dock preset model, roadmap phases; complements **WOP_MODULAR_DOCKS_PLAN** |
| **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** | **Workspace agents in the web UI** — `.pi/agents` parity, **My AI Team** / workspace agent dropdown, 404 vs missing API server, phases toward **`dispatch_agent`**; pairs with **`.cursor/rules/wop-ui-workspace-agents.mdc`** |
| **[WOP_BUILD_PLAN_MODE.md](WOP_BUILD_PLAN_MODE.md)** | **Build vs Plan** — when to use each, Cursor comparison, **`plans/PLAN-…md`**, **`GET /api/plans`**, **`Shift+Tab`**, palette / composer handoffs, **section 7** backlog vs Pi TUI |
| **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)** | **Claw mode** — UI mode + roadmap for autonomous-agent-style capabilities (Pi-backed, phases for orchestration, schedules, channels) |
| **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)** | **Claw UI** — interface research (OpenClaw ecosystem, IDE agents), layout presets, phased UI vs Pi blockers, non-goals |
| **[WOP_TELEGRAM_PLAN.md](WOP_TELEGRAM_PLAN.md)** | **Telegram bot agent** — extension vs tool decision, `pi-telegram` path vs custom, phased plan T-0→T-4, security notes, setup reference |
| **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** | **Menu bar & shell parity** — File→Help, palette, panels; each row mapped to Way of Pi / Pi / server (**Planning** side panel links here) |
| **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** | **`WOP_*`**, **`WOP_HOME`**, **`WOP_PI_BINARY`**; **workspace (project root) vs Way of Pi system files vs editor-only state** (see **Workspace (project) vs Way of Pi system files** in that doc) |
| **[WOP_NGROK.md](WOP_NGROK.md)** | **ngrok / public dev URL** — optional HTTPS tunnel to Vite+Bun dev; **Settings → ngrok** (install, authtoken, managed tunnel, tunnel login); dev **`/api/dev/*`** routes; **`scripts/install-ngrok-optional.sh`** for apt/Homebrew |
| **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** | UI **manifest strategy** — runtime introspection vs static manifest; **`GET /api/manifest`** (static v1 in **`wayofpi-ui`**) vs future Pi merge |
| **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** | **Orchestration** WebSocket event contract (per-agent streams) |
| **[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)** | **Safe** skills / extensions / packages / Pi update pipeline |
| **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)** | **Upstream sync:** check Pi GitHub/npm for updates; user-triggered **`vendor/wop-upstream/`** mirror + path renames |
| **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** | **Way of Pi backlog:** missing features, UI stubs, production checklist gaps, script limits |
| **[PLAYGROUND.md](PLAYGROUND.md)** | What “the playground” is — **`pi-e`** **FULL (1)** vs **project-scoped (2)**; opt-in from other repos; see **`.cursor/rules/pi-pi-e-playground-modes.mdc`** |
| **[AGENTS.md](AGENTS.md)** | Agent **definitions** (`.md` + frontmatter), scan paths, integration: `system-select`, `agent-team`, `agent-chain`, sessions |
| **[HOW_TO_USE_AGENTS.md](HOW_TO_USE_AGENTS.md)** | **Practical agent usage guide** — which agent to use when, commands (`/system`, `agent-team` teams, `/ralph`), and example workflows |
| **[AGENT_TEAMS.md](AGENT_TEAMS.md)** | **Agent-team** extension: `teams.yaml`, presets, `dispatch_agent`, team tools, slash commands; **grid vs footer context %**; **limits / truncation / missing files** |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | **Agent memory guide:** JSONL sessions, session-memory vs session-saver vs `/remember`, AGENTS.md, skills, privacy, troubleshooting |
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | **Hermes** client: `~/.hermes/config.yaml`, Honcho toolset, env, `just hermes-*`, relation to Pi |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | **Honcho** server: Docker stack, **`/docs`**, **app.honcho.dev**, Pi **honcho-mirror**; stack/UI scripts live in **`~/honcho-server`** |
| **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** | **Honcho feature map** from [docs.honcho.dev](https://docs.honcho.dev): primitives, API groups, cloud dashboard, SDKs, integrations |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Short **Hermes ↔ Honcho** bridge only (not Pi); minimal happy path |
| **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** | **Pi-first local AI:** TUI, **[AGENT_MEMORY](AGENT_MEMORY.md)**, **honcho-mirror**, Hermes agent, launchers — mirror to **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | **Stack-wide:** Pi + Hermes + Honcho patterns, what gets recorded |
| **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** | **Runbook:** workspace switching, session anchors, cost/deriver, Pi `/reload`, backups, `~/Documents/Honcho` |
| **[SYSTEM.md](SYSTEM.md)** | Session memory vs session saver, skills vs extensions, project layout, rules for agents (execute tools; don’t fake output), specs summary |
| **[TUI.md](TUI.md)** | Terminal UI: **Ctrl+T** thinking toggle, **Shift+Tab** thinking level, **Ctrl+O** tools, links to **[`RESERVED_KEYS.md`](../RESERVED_KEYS.md)** |
| **[EXTENSIONS.md](EXTENSIONS.md)** | Upstream extension model, shim pattern, **inventory** of `extensions/*.ts` + `.pi/extensions/` shims, new-extension checklist, picker FAQ |
| **[HOW_TO_USE_EXTENSIONS.md](HOW_TO_USE_EXTENSIONS.md)** | **Practical extensions usage guide** — what each extension does (agent-team, ralph, tilldone, session-memory, etc.), stacks, and when to enable/disable them |
| **[SKILLS.md](SKILLS.md)** | **Skills:** **inventory** of `.pi/skills/`, discovery, `/skill:name`, authoring, cross-agent + settings |
| **[HOW_TO_USE_SKILLS.md](HOW_TO_USE_SKILLS.md)** | **Practical skills usage guide** — when to use `bowser`, `find-skills`, `github`, `indexer`, `ralph`, how to call `/skill:name`, and example flows |
| **[EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md](EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md)** | Post-mortem: agent-team session — what worked, what failed, **`docs/codereadme.md`** myth, **`files-widget`** deps, recommendations |
| **[CLAUDE_CODE_VS_PI_GAPS.md](CLAUDE_CODE_VS_PI_GAPS.md)** | **Claude Code vs Pi** — product/features Anthropic ships vs upstream Pi vs this playground; gap list + link to **[COMPARISON.md](../COMPARISON.md)** |
| **[CONCEPTS.md](CONCEPTS.md)** | **Skills vs agents vs extensions vs tools** — definitions, distinctions, when to use which |
| **[TOOLS.md](TOOLS.md)** | **Tools:** built-ins, **inventory** of extension-registered tool names, agent `tools:` allowlists, safety, root `TOOLS.md` signatures |
| **[HOW_TO_USE_TOOLS.md](HOW_TO_USE_TOOLS.md)** | **Practical tools usage guide** — how to use `read`, `bash`, `edit`, `write`, and the key extension tools like `dispatch_agent`, `tilldone`, `ralph_queue_status`, `run_chain` |
| **[sessions.md](sessions.md)** | Older session-saver-oriented doc; canonical behavior for saver: **`../extensions/sessions/README.md`** |
| **[commands/REFERENCE.md](commands/REFERENCE.md)** | Slash-command reference (may mix generic Pi concepts—verify against your Pi version) |
| **[SUPERPOWERS_BUILD_MAP.md](SUPERPOWERS_BUILD_MAP.md)** | Mapping Superpowers skills/workflows into Pi extension + agent components |
| **[SUPERPOWERS_TODO.md](SUPERPOWERS_TODO.md)** | Checkbox TODO for implementing Superpowers-like workflow in this Pi repo |
| **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** | Plan to port **[awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents)** (Codex `.toml`) into Pi **`.md`** agents |
| **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** | Auto **agent/model** fit: skill + **`agent-model-routes.yaml`** + **`agent-team`** subprocess **`--model`** override; optional main-session switch |
| **[../projects/README.md](../projects/README.md)** | **Per-project docs** Pi uses while working on a codebase: layout, slug naming, template under `projects/_template/` |

Repo boot notes: root **[README.md](../README.md)** and **[CLAUDE.md](../CLAUDE.md)**.
