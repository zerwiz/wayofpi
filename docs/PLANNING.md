# Planning hub (`docs/PLANNING.md`)

High-level **roadmaps and product plans** for this repository.

**Canonical Git remote:** [zerwiz/wayofpi](https://github.com/zerwiz/wayofpi) (clone with `git clone https://github.com/zerwiz/wayofpi.git`).

| Document | Scope |
|----------|--------|
| **[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)** | **Way of Pi** — web UI + headless Pi, namespace isolation, UI sitemap, MVP phases, production checklist (**critical:** rename *our* backend files/ids so they are never ambiguous with upstream **`pi`**) |
| **[WAY_OF_PI_OPEN_TODOS.md](WAY_OF_PI_OPEN_TODOS.md)** | **Living backlog** — not-done items across product, **`apps/wayofpi-ui`**, scripts, docs |
| **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** | `wop` CLI + `WOP_*` environment variables |
| **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** | Static vs runtime manifest for commands/tools/extensions |
| **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** | Orchestration WebSocket event contract |
| **[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)** | Safe skills / extensions / packages / Pi updates |
| **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)** | Check **`pi-mono`** / npm for updates; **`sync --apply`** mirrors docs under **`vendor/wop-upstream/`** (operator choice) |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | **`apps/wayofpi-ui`** technical shell — **tool dock under editor stack** (upper band removed), **`DockStripEntry`** (tools + files), persistence; links modular plan below |
| **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** | **TODO / phases A–F** — dock parity, **N** strips, movable **agent** + **primary sidebar**, layout graph, **preview / review queue / Keep–Undo** chrome; pairs with **[`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc)** |
| **[WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md)** | **Rule → build** — what to **rebuild / add / extend** for modular docks to be **functionally** compliant; traceability table + order |
| **[WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)** | **`pi-e` menu / extension stacks** → **`wayofpi-ui`** **views** via **dock presets** (inventory table, phases, open questions) |
| **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** | **Menu bar & shell parity** — File→Help and related commands mapped to Way of Pi / Pi / server (**Planning** side panel links here) |
| **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** | Port Codex subagents → Pi `.md` agents |
| **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** | Agent/model routing experiments |

**Implementation preview (web shell):** [apps/wayofpi-ui/README.md](../apps/wayofpi-ui/README.md), **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**.
