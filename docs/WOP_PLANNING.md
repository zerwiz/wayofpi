# Planning hub (`docs/WOP_PLANNING.md`)

High-level **roadmaps and product plans** for this repository.

**Canonical Git remote:** [zerwiz/wayofpi](https://github.com/zerwiz/wayofpi) (clone with `git clone https://github.com/zerwiz/wayofpi.git`).

| Document | Scope |
|----------|--------|
| **[WOP_PRODUCT_CAPABILITIES.md](WOP_PRODUCT_CAPABILITIES.md)** | **Product capabilities** — what ships today vs partial vs planned (Pi playground + Way of Pi); links to wiring plan, namespace, backlog |
| **[WOP_PRODUCT_OVERVIEW.md](WOP_PRODUCT_OVERVIEW.md)** | **Product overview** — narrative onboarding: pitch, why, component map, typical journeys, links to capabilities + standalone plan |
| **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** | **Way of Pi** — web UI + headless Pi, namespace isolation, UI sitemap, MVP phases, production checklist (**critical:** rename *our* backend files/ids so they are never ambiguous with upstream **`pi`**) |
| **[WOP_COMBINED_BUILD_TODO.md](WOP_COMBINED_BUILD_TODO.md)** | **Single build checklist** — merged TODOs from WOP plans **+ [WOP_STANDALONE_SYSTEM_PLAN](WOP_STANDALONE_SYSTEM_PLAN.md)** (**§15**), **+ [WOP_PLANNING](WOP_PLANNING.md)** hub notes (**§16**); sources in doc header |
| **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** | **Pi backend wiring** — **§0 critical lock** (all agents = Pi runtime for tools/extensions); current Bun APIs vs Pi target, `/ws` map, phases 0–6 (**manifest**, **`pi-agent-runtime.ts`**, sessions, **`WOP_MULTI_AGENT_WEBSOCKET`**) |
| **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** | **Living backlog** — not-done items across product, **`apps/wayofpi-ui`**, scripts, docs |
| **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** | `wop` CLI + `WOP_*` environment variables |
| **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** | Static vs runtime manifest for commands/tools/extensions |
| **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** | Orchestration WebSocket event contract |
| **[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)** | Safe skills / extensions / packages / Pi updates |
| **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)** | Check **`pi-mono`** / npm for updates; **`sync --apply`** mirrors docs under **`vendor/wop-upstream/`** (operator choice) |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | **`apps/wayofpi-ui`** technical shell — **`WorkspacePane`** (Zed-style **file ∪ tools** tab stack), optional **`TechnicalWorkspaceGrid`** (≤ **3×4**, flex + splitters, **`rowWeights`/`colWeights`**, edge-grow + cross-cell tab DnD), persistence (**`workspaceGrid.v1`**, **`panelDock`**, **`dockLayout`**); modular **N** strips / full pane graph still planned |
| **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** | **TODO / phases A–F + Z** — **Zed reference model**, **Phase Z** pane/`PaneItem` target, **N** strips, movable **agent** + **primary sidebar**, layout graph, **preview / review** chrome; pairs with **[`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc)** |
| **[WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md)** | **Rule → build** — what to **rebuild / add / extend** for modular docks to be **functionally** compliant; traceability table + order |
| **[WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)** | **`pi-e` menu / extension stacks** → **`wayofpi-ui`** **views** via **dock presets** (inventory table, phases, open questions) |
| **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** | **Web UI ↔ `.pi/agents`** — catalog/API, simple vs technical parity, teams surfacing, roadmap to real **`dispatch_agent`** / **[WOP_MULTI_AGENT_WEBSOCKET](WOP_MULTI_AGENT_WEBSOCKET.md)** |
| **[WOP_BUILD_PLAN_MODE.md](WOP_BUILD_PLAN_MODE.md)** | **Build vs Plan** — chat toggle workflows, artifacts under **`plans/`**, browser limits vs Pi **`planner`** / **agent-team** |
| **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)** | **Claw UI mode** — third shell track (IDE chrome + roadmap banner today); phased plan for Claw-class autonomy (Pi-backed turns, orchestration, schedules, channels) without a Bun-only agent runtime |
| **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)** | **Claw UI** — operator-shell design: market scan (ClawPort, Mission Control, OpenClaw TUI), IDE approval patterns, dock presets, UI phasing vs Pi wiring |
| **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** | **Menu bar & shell parity** — File→Help and related commands mapped to Way of Pi / Pi / server (**Planning** side panel links here) |
| **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** | Port Codex subagents → Pi `.md` agents |
| **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** | Agent/model routing experiments |

**Implementation preview (web shell):** [apps/wayofpi-ui/README.md](../apps/wayofpi-ui/README.md), **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**.
