# Way of Pi — open TODOs and missing work

Single place to track **what is not done yet** for the **Way of Pi** direction (web UI + headless Pi + `WOP_*` isolation), the **`apps/wayofpi-ui`** shell, supporting **scripts**, and **planning follow-through**. It complements checkbox lists in other docs (e.g. **[SUPERPOWERS_TODO.md](SUPERPOWERS_TODO.md)**) without duplicating every playground extension idea.

**Merged build checklist (all WOP plans):** **[WOP_COMBINED_BUILD_TODO.md](WOP_COMBINED_BUILD_TODO.md)** — trim there and here when you ship.

**Canonical roadmap:** **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** · **End-to-end wiring map (UI ↔ Pi):** **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** (**§0** = Pi-only agent lock · **§2.5** = what still **does not** hit the Pi process vs Bun-only) · **Planning hub:** **[WOP_PLANNING.md](WOP_PLANNING.md)**

---

## P0 — Pi backend (build before expanding Bun “agent” features)

**Rule:** **[`.cursor/rules/wop-ui-pi-backend-parity.mdc`](../.cursor/rules/wop-ui-pi-backend-parity.mdc)** — Way of Pi **must not build or own** a parallel agent/tool/extension **system**; it **uses Pi’s backend** (`WOP_PI_BINARY`). Interim Bun chat/tools are **glue only**, not the end state.

| Priority | Build |
|----------|--------|
| **P0.1** | **Partial:** **`WOP_CHAT_ENGINE=pi`** or **`auto`** → **`pi --mode json`** per turn for **all** personas when **`pi`** resolves (**`runPiChatTurn`**, **`pi-json-mode-chat.ts`**), stream → **`assistant_delta`** / tool log / **`done`**. **Still open:** reuse one long-lived Pi process, attach/tunnel **`/ws`**, fold interim Bun chat behind the same runtime. |
| **P0.2** | **Tool + extension events** from Pi → Tool log + WebSocket contract (**[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** prep); retire or narrow **`WOP_ORCHESTRATOR_*`** Bun tool surface once Pi emits the same actions. |
| **P0.3** | **Runtime manifest** — **`GET /api/manifest`** merges headless Pi introspection (**[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**). |
| **P0.4** | **All personas through Pi** — orchestrator + every workspace **`.md`** agent; no path where “tools:” implies execution without Pi. |

---

## How to use this doc

- Treat items as a **backlog**, not a commitment order.  
- When you ship something, **remove or check it off** here and note **[CHANGELOG.md](../CHANGELOG.md)** if user-visible.  
- Prefer linking to specs (**[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**, **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)**, etc.) instead of pasting long designs here.

---

## Product and architecture (from the plan)

| Status | Item |
|--------|------|
| Not shipped | User-facing **`wop`** CLI (`wop serve`, `wop doctor`, …) replacing playground-only **`ppi` / `pi-e`** strings for product workflows. |
| Partial | **Headless Pi** chat: **`WOP_CHAT_ENGINE=pi`** or **`auto`** uses **`pi --mode json`** when the CLI resolves; default (unset engine) is still **Ollama/OpenRouter** in Bun without **`auto`/`pi`**. |
| Not shipped | **`WOP_HOME`**, isolated install story, and **`WOP_PI_BINARY`** resolution in the server (documented in **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**, not fully implemented in UI server). |
| Partial | **Phase 1 MVP** per plan: **Sessions** persistence + UI, **Profiles** / extension stack UI, **Diagnostics** checklist beyond basic health, **Models** picker wired to change server model at runtime. |
| Not shipped | **Orchestration** grid with **live** multi-agent WebSocket streams (**[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**). |
| Not shipped | **Playground link** wizard (replace `enable-playground-in-project` scripts in product form). |
| Not shipped | **Runtime manifest** for slash commands / tools (**[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**) + UI driven by introspection. |
| Not shipped | **Safe customization** pipeline: backup → preflight → apply → doctor → rollback (**[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)**). |
| Open | Plan **open questions**: single-user vs multi-tenant; `pi install` / `pi update` pinning; subprocess sandbox; session format vs Pi JSONL; backend rename schedule (**[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md#open-questions)**). |

---

## Production and safety (unchecked plan checklist)

Items from **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** production readiness that are still **not done** for a hosted product:

- [ ] **Authn** for the web UI.  
- [ ] **Workspace allowlist** / symlink-hardening beyond path join (verify server behavior).  
- [ ] **Rate limits** and **payload caps** on HTTP/WebSocket.  
- [ ] **CORS / CSRF** policy for non-localhost.  
- [ ] **Structured logging** (no raw prompts by default).  
- [ ] **Graceful shutdown** and **tool timeouts** for child processes (when Pi is integrated).  
- [ ] **Settings backup/rollback** automation.  
- [ ] **Pinned Pi versions** + upgrade docs.  
- [ ] **About** / license attribution surface for embedded Pi (minimal About exists in Technical **Help** only).  
- [ ] **Backend naming audit** — rename *Way of Pi* server artifacts so they never ambiguously read as upstream **`pi`** (**[WOP_NAMESPACE.md](WOP_NAMESPACE.md#backend-code-files-and-identifiers-critical)**).

---

## `apps/wayofpi-ui` — server and APIs

| Status | Item |
|--------|------|
| Missing | **Pi subprocess** (or official headless API) for chat, tools, extensions, skills — see **[apps/wayofpi-ui/README.md](../apps/wayofpi-ui/README.md)**. |
| Missing | **Tool execution** / approvals / bash pipeline from the web UI. |
| Partial | **`GET /api/manifest`** — **static** scan (**`.pi/settings.json`** `extensions[]` + **`.pi/extensions/*.ts`**); **tools** / **slash commands** still need **headless Pi** runtime — **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**. |
| Partial | **`GET /api/diagnostics`** + **`GET /api/upstream`** (read-only lock/config). Full **`wop-pi-upstream` check** (GitHub/npm + lock write) remains **CLI**: **`scripts/wop-pi-upstream.ts`**. |
| Improve | WebSocket **auth**, **message size limits**, **reconnect** UX hardening for production. |

---

## `apps/wayofpi-ui` — Technical UI shell

**Menu bar parity matrix (File → Help, palette, AI shell commands):** **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** — maintained backlog; **Plan / Build** side panel summarizes next steps and links to it.

**Modular dock roadmap (parity, N strips, movable agent/sidebar):** **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** — phased checklists; **Cursor rule:** **[`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc)**.

| Area | Missing / stub |
|------|----------------|
| **Menu** | Many items are **Shipped** in UI; gaps per **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** (LSP, task runner, manifest-driven palette, etc.). |
| **Editor** | No Monaco / LSP; textarea-only. **Outline** sidebar = placeholder. **Timeline** = placeholder. |
| **Center workspace** | **Shipped:** **`WorkspacePane`** — one tab stack per cell (**files ∪ tools**), v3 **`PanelDockLayout`**, Zed-style tab DnD — **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**. **Shipped (partial Phase E):** **`TechnicalWorkspaceGrid`** up to **3×4** cells (**`workspaceGridStorage.ts`**); **nested flex** + **`DockSplitHandle`** (**`rowWeights` / `colWeights`**); **View → Editor Layout** workspace presets; Explorer opens into **focused** cell; **edge-drop grid grow** (**1×1** / **N×1** / **1×N** outer edges); **cross-cell** **tab** moves (surface + **tab-bar** insert). **Still open:** arbitrary **split graph** (not only fixed **cols×rows**), **N** movable horizontal strips, **agent** **left**, **sidebar** **right** — **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)**. |
| **Tool strips (current)** | **Problems** — no analyzer. **Terminal** — no host shell (by design until approvals exist). |
| **Chat** | **Team pulse** tab = placeholder (orchestration not connected). **Attachments** = not implemented (hint only). |
| **Status bar** | **Problems count**, **ctx %**, **tokens** are placeholders (display-only tooltips). |
| **Command palette** | No fuzzy scoring polish; no “recent files” from session. |
| **Model** dropdown in header | Read-only popover; no **runtime model switch** API. |

---

## `apps/wayofpi-ui` — Simple UI shell

| Area | Missing / stub |
|------|----------------|
| **SimpleNavRail / views** | Any view that is a stub should be listed in its component (e.g. **Projects**, **Team**, **Models** depth varies). |
| **Quick run** | **SimpleRightPanel** (or related) **quick run** hook reserved — no project runner wired. |

*(Audit Simple layout files under **`apps/wayofpi-ui/src/components/simple/`** when adding rows.)*

---

## Honcho and Way of Pi UI

**Honcho** is the HTTP **memory / context** service used by **Hermes** and mirrored from Pi via **`honcho-mirror`** (**[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)**, **`extensions/honcho-mirror.ts`**). Way of Pi should **surface** Honcho in all three UI modes without inventing a **Bun-only** substitute for Pi’s tool loop (**[`.cursor/rules/wop-ui-pi-backend-parity.mdc`](../.cursor/rules/wop-ui-pi-backend-parity.mdc)**).

| Mode | Planned connection |
|------|---------------------|
| **Simple** | Chat-adjacent or **Diagnostics**: Honcho **reachable** / **base URL**, workspace id (**`HONCHO_WORKSPACE`**), link to local **Swagger** and setup docs; when chat uses Pi, short **mirror** status (last turn forwarded vs disabled). |
| **Technical** | **Integrations** or **Diagnostics**: editable display of **`HONCHO_BASE_URL`**, JWT if required, workspace; optional **read-only** API proxy for session/message peek (contract TBD in **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** if not Hermes-only). |
| **Claw** | **Mission** or **Channels**-adjacent **memory** card: Honcho health, workspace alignment with **`.claw/`** operator context, link to **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)** Phase C; optional Hermes / Pi tool path for **natural-language** recall (same as TUI today). |

**Claw plan cross-link:** Phase C long-horizon memory — **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md#phase-c--persistence-and-memory-claw-shaped)**.

---

## Scripts and upstream

| Status | Item |
|--------|------|
| Partial | **`wop-pi-upstream`**: **check** + **sync** for **`pi-mono`** doc mirror only; does **not** install or upgrade **`pi`** / npm **`@mariozechner/pi-coding-agent`** (**[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)**). |
| Missing | **`wop`** entry script that wraps upstream check + UI start + future Pi update. |
| Missing | Optional **commit** of **`vendor/wop-upstream/`** policy (currently gitignored). |

---

## Documentation gaps

| Item |
|------|
| Keep **[this file](WOP_OPEN_TODOS.md)** in sync when closing large gaps. |
| **`wop` spelling** final vs **`wayofpi`** (**[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**). |

---

## Other repo TODO lists (not Way-of-Pi-specific)

- **[SUPERPOWERS_TODO.md](SUPERPOWERS_TODO.md)** — Superpowers-style workflow in this Pi playground.  
- **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** — agent/model routing experiments.  
- **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** — Codex → Pi agents port.

---

**Last updated:** 2026-04-11
