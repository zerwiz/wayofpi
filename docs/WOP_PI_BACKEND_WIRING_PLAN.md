# Way of Pi — full Pi backend wiring plan

**Purpose:** Inventory **what the web UI and Bun server do today**, what **headless Pi** must provide per **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)**, and a **phased wiring map** so every product surface can eventually call the **real Pi engine** (extensions, tools, skills, sessions, orchestration) instead of parallel or stub implementations.

**Related:** **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** (living gaps) · **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** (`WOP_PI_BINARY`, `WOP_HOME`) · **[WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md](WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md)** (why Pi uses fewer tokens, compaction, mimic checklist) · **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** · **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** · **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** · Cursor rules **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**, **`.cursor/rules/wop-ui-workspace-agents.mdc`**

---

## 0. CRITICAL — Pi-only agent runtime (product lock)

| Requirement | Meaning |
|-------------|---------|
| **All agents** | **Orchestrator** and **every** workspace **`.md`** persona must eventually execute in **headless Pi** (`WOP_PI_BINARY`), not only as merged prompts in Bun. |
| **All Pi surfaces** | **Extensions**, **`registerTool`**, **slash commands**, **`dispatch_agent`**, **skills**, **session JSONL**, and **model/provider** behavior must match the **Pi TUI** for the same workspace and **`.pi/settings.json`**. |
| **No permanent “mini Pi”** | **`server/chat.ts`**, **`server/chat-orchestrator-tools.ts`**, and **`server/orchestrator-tools-exec.ts`** are **interim** bridges. **Do not** treat them as parity with Pi; **Phase 2** replaces chat; tool fan-out then comes from **Pi events**, not duplicate Bun handlers. |
| **Gate** | **`WOP_CHAT_ENGINE=pi`** or **`auto`**: **`pi --mode json`** when the CLI resolves (all personas); **`pi`** alone rejects if CLI missing; **`auto`** falls back to Bun. Long-lived Pi process + **`/ws`** tunnel remains Phase 2+. |
| **Rules** | **`.cursor/rules/wop-ui-pi-backend-parity.mdc`** (always on) and **`.cursor/rules/wop-ui-workspace-agents.mdc`** (UI/agent edits). |
| **Ownership** | Way of Pi **does not** own the agent/orchestration/tool **system** — **Pi’s coding-agent** does. The server’s job is **wiring and host I/O**, not a second productized agent engine inside Bun. |

**Build order (non-negotiable):** Ship **§6 Phase 2** (Pi-owned single chat + tool events) **before** adding new Bun-native “agent capabilities.” Track gaps in **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** § P0.

---

## 1. North star (locked architecture)

| Layer | Target |
|-------|--------|
| **Agent runtime** | **Headless Pi** — same `extensions[]`, skills, themes, packages as the TUI workflow. |
| **UX** | **Web UI** + future **`wop`** CLI; browser talks to **Way of Pi server**, server **spawns or drives Pi** with **`WOP_PI_BINARY`**, cwd = workspace, isolated **`WOP_*`** / **`WOP_HOME`** per **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**. |
| **Out of scope for v1 plugin-compat** | Rewriting chat/tools without a Pi subprocess (per product plan). |

**Today’s gap:** **`apps/wayofpi-ui/server/chat.ts`** streams completions via **Ollama / OpenRouter** directly. That stack is **real** for editing and files but is **not** Pi — no `registerTool`, no slash commands, no `dispatch_agent`, no extension hooks.

**Engineering bias (critical):** Treat that direct-LLM path as **interim** only. **Maximize Pi as backend** — new capabilities should default to **Pi subprocess / tunnel / manifest parity**, not a second implementation inside Bun. Enforced in **`.cursor/rules/wop-ui-pi-backend-parity.mdc`** (`alwaysApply`).

---

## 2. Runtime topology (as built)

| Component | Role |
|-----------|------|
| **Vite** (dev) | Serves React; **proxies** `/api` and `/ws` to Bun (**`apps/wayofpi-ui/vite.config.ts`**). |
| **Bun** (`WOP_SERVER_PORT`, default **3333**) | REST + WebSocket + optional **`dist/`** static assets (**`server/index.ts`**). |
| **Browser** | Relative **`/api/*`**, **`/ws`**, **`/ws/terminal`** — no hard-coded API port. |

**Operational note:** If the SPA is served **without** this Bun process (static files only), **`/api/*`** returns **404** — see **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** Phase A.

**Electron (recommended):** In dev, the **Electron** window loads the **Vite** origin (**`WOP_ELECTRON_DEV_URL`**, default **`http://127.0.0.1:5173/`**), so **`/api`**, **`/ws`**, **`/api/manifest`**, and **`/ws/terminal`** hit the same **Bun** backend as the browser via **Vite’s proxy** — no separate API base URL in client code. Production: Electron loads **`WOP_ELECTRON_PROD_URL`** (default Bun **`dist/`** origin on **`WOP_SERVER_PORT`**). See **`apps/wayofpi-ui/README.md`** § Electron first, **`electron/electron-main.mjs`**.

---

## 2.5 Audit — what hits the **Pi process** vs what does not

**Definition:** **“Hits Pi”** means a **running Pi coding-agent process** (or a documented official headless Pi API) executing **extensions**, **tools**, **slash commands**, **`dispatch_agent`**, session JSONL, etc. Reading the **same workspace files** Pi would read is **Pi-shaped** but **not** hitting Pi unless that binary (or gateway) runs a turn.

**Principle:** Prefer **more Pi backend**, less parallel Bun logic — see **§1** (engineering bias) and **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**.

### Bun server (`apps/wayofpi-ui/server/`) — process boundary

| Area | Hits Pi process? | What runs today | Change lever (toward Pi) |
|------|------------------|-----------------|---------------------------|
| **Chat** (`/ws` → `chat` → **`runPiChatTurn`** / **`streamChatCompletion`** / **`runOrchestratorToolLoop`**) | **Partial** — **Yes** per turn when **`WOP_CHAT_ENGINE`** is **`pi`** or **`auto`** and **`pi`** resolves (**`pi --mode json`**); else **No** | With **`pi`/`auto`**: Pi subprocess (full tools + extensions). Else: HTTP to **Ollama** / **OpenRouter**; optional Bun shim when **`WOP_ORCHESTRATOR_TOOLS`**. **§6 Phase 2** — long-lived Pi + **`/ws`** tunnel; shrink Bun shim |
| **`set_model` / `set_chat_mode` / `set_agent`** | **No** | In-memory WS state + **`applyLeadSystem`** (disk-read prompts) | After Pi owns chat: model/mode/agent become Pi session config |
| **`GET /api/agents`** | **No** (filesystem parity) | **`loadWorkspaceAgents()`** — scan **`agents/`**, **`.claude/`**, **`.pi/agents/`**, **`.cursor/`** + **`teams.yaml`** | Keep catalog; **dispatch** = Pi (**§6 Phase 4**) |
| **`GET /api/llm/models`** | **No** | Ollama **`/api/tags`** or OpenRouter placeholder | When engine is Pi: expose Pi/provider list (**§3** row) |
| **`GET /api/config`** | **No** | Env + **`pi-ollama-env`** + **`chatEngine`**, **`piDrivesChat`** / **`piChatEngineWired`** when **`pi`/`auto`** + CLI resolve, **`manifestUrl`** | Pi profile fields when runtime manifest exists |
| **`GET /api/manifest`** | **No** | **`web-manifest.ts`** — scans **`.pi/settings.json`** `extensions[]` + **`.pi/extensions/*.ts`** per workspace root; **`tools`/`slashCommands`[]** | Replace with **headless Pi introspection** per **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** |
| **`GET /api/diagnostics`** | **No** | Probes **`WOP_PI_BINARY`** or **`pi` on PATH** (`--version` only); includes **`manifestStatic`** counts | Full **doctor**: Pi load, extensions, jail (**§6 Phase 1**) |
| **`GET /api/upstream`** | **No** | JSON read under playground root | CLI **`wop-pi-upstream`** for remote check |
| **`POST /api/server/restart`** | **No** | **`process.exit`** when opt-in | Dev only |
| **Workspace I/O** (`/api/tree`, **`/api/file`**, **`/api/fs/entry`**) | **No** (by design) | Bun jailed FS — **editor host** | Pi **tools** must share same jail (**§4.3**) |
| **`POST /api/run-script`** | **No** | **`Bun.spawn(["bun","run",…])`** in workspace | **Not** Pi **`bash`** — keep gated (**`WOP_ALLOW_RUN`**); document |
| **`/ws/terminal`** | **No** | Host shell PTY (**`terminal-ws.ts`**) | Policy vs Pi **approvals** / tool story (**§4.3**) |
| **Git status** (if used from server) | **No** | **`Bun.spawn(["git",…])`** | Optional; not Pi |

### Pi-shaped prompts vs Pi subprocess

- **`session-prompts.ts`** — Same *sources* as TUI personas for system text. **Bundled** engine: personas are prompt-only for tools. **`WOP_CHAT_ENGINE=pi`/`auto`** (CLI present): **`runPiChatTurn`** runs **`pi --mode json`** so **`registerTool`**, **`dispatch_agent`**, and extensions execute **inside Pi**.
- **`pi-ollama-env.ts`** — **`OLLAMA_HOST`** / **`OLLAMA_BASE_URL`**, **`OLLAMA_MODEL`**, **`agent/settings.json`**: matches how **Pi** is started from repo **`.env`**; does not invoke Pi for inference.

### Largest gap (single sentence)

> **Bundled-engine** replies (**`WOP_CHAT_ENGINE`** unset) still bypass Pi (`chat.ts` → Ollama/OpenRouter). **`pi`** / **`auto`** routes through **`pi --mode json`** when the CLI resolves; long-lived Pi + **`/ws`** remains the main follow-up.

Use **§3–§5** for route-level detail, **§6** for phased work, **`docs/WOP_OPEN_TODOS.md`** for backlog ticks.

---

## 3. HTTP API inventory — wired vs Pi target

| Method | Path | Current implementation | Pi / product target |
|--------|------|-------------------------|---------------------|
| GET | `/api/health` | Liveness JSON | Unchanged; use **`/api/diagnostics`** for probes |
| GET | `/api/diagnostics` | Workspace + **`WOP_*`**, Ollama ping, **`WOP_PI_BINARY` / PATH `pi`** + `--version` | Extend toward full **doctor** (Pi subprocess, extension load, jail proofs) |
| GET | `/api/upstream` | Read-only **`wop.upstream.lock.json`** + upstream **config** under playground repo root | Remote refresh: **`bun scripts/wop-pi-upstream.ts check`** (CLI; updates lock) |
| POST | `/api/server/restart` | **`WOP_ALLOW_SERVER_RESTART=1`**: **200** then **`process.exit(0)`**; else **403** + hint | UI: **Settings → Restart server…**; production policy is opt-in only |
| GET/POST | `/api/workspace` | In-memory multi-root folders | Keep; Pi child cwd must track **primary** (or defined) root |
| GET | `/api/config` | Provider + **`chatEngine`** (`pi` / `auto` / provider) + **`piDrivesChat`** when **`pi`/`auto`** + CLI resolve + **`manifestUrl`** + models + `terminalEnabled` | Pi profile + runtime **`manifest`** merge when implemented |
| GET | `/api/manifest` | **Static v1:** **`filesystem_static`** — per-root **`.pi/settings.json`** `extensions[]` + **`.pi/extensions/*.ts`**; empty **`tools`** / **`slashCommands`** | **Runtime** merge from headless Pi + static overlay (**[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**) |
| GET | `/api/tree`, GET/PUT `/api/file`, POST `/api/fs/entry` | Workspace-jailed FS | Keep as **host** editor I/O; Pi uses same roots for tools |
| GET | `/api/llm/models` | Ollama tags / OpenRouter stub | Optional: mirror **Pi provider config** when chat is Pi-driven |
| GET | `/api/agents` | **`loadWorkspaceAgents()`** — Pi-style scan + **`teams.yaml`** | Keep; catalog stays filesystem-sourced (same as TUI) |
| GET | `/api/package-scripts`, POST `/api/run-script` | **`package.json`** scripts via **`WOP_ALLOW_RUN`** | Product choice: **not** a substitute for Pi **`bash`** tool |
| GET/POST | `/api/ui/views` | Workspace **`.wayofpi/ui-views.json`** | Keep as web shell chrome |
| POST | `/api/native-dialog/pick` | OS folder/file picker | Keep |
| WS | `/ws` | See §4 | **Replace or tunnel** chat path through Pi |
| WS | `/ws/terminal` | Host shell when **`WOP_ALLOW_TERMINAL=1`** | Policy: align with Pi **approval** story; not a Pi subprocess |

**Missing for Pi parity**

| Path | Purpose |
|------|---------|
| **`GET /api/manifest`** — **runtime** | Pi subprocess (or probe) returns **tools**, **slash commands**, loaded **extensions** — **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**; ship merges with today’s **static** **`GET /api/manifest`** |
| **`GET /api/sessions`** + mutations | List/load/save/delete — align format with Pi JSONL or adapter layer |
| **Pi control** | **`POST /api/pi/reload`**, profile apply; remote upstream check remains **`bun scripts/wop-pi-upstream.ts check`** (updates lock) — not invoked from **`GET /api/upstream`** |

---

## 4. WebSocket `/ws` — messages today vs Pi target

### 4.1 Client → server (today)

| Message | Effect |
|---------|--------|
| `ping` | `pong` |
| `chat` | **`streamChatCompletion`** (Ollama/OpenRouter), in-memory transcript |
| `stop_chat` | Abort current stream |
| `set_model` | Per-connection Ollama/OpenRouter id |
| `set_chat_mode` | `build` \| `plan` + **`applyLeadSystem`** |
| `set_agent` | Load **`.md` agent body** from disk → merged system prompt (**not** Pi subprocess) |
| `new_session` | Clear messages; keep model/mode/agent prefs |
| `activate_session` | Replace in-memory transcript from `transcript: { role, content }[]` (user/assistant only, capped); **`applyLeadSystem`** reapplied; used when switching stacked chat tabs or reconnecting |

### 4.2 Server → client (today)

`ready`, `log`, `user_message`, `user_queued`, `assistant_turn_start`, `assistant_delta`, `done`, `error`, `session_reset`, `chat_mode`, `agent`, `model_set`, `queue_state`, `pong`.

### 4.3 Pi target

- **Option A — Adapter in Bun:** Same envelope where possible; **server** forwards user text to **headless Pi stdin/API**, maps Pi streaming + tool events to **`assistant_delta`**, **`log`**, and new types from **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** (`tool_start` / `tool_end`, `thinking_delta`, per-`agentId` multiplex).
- **Option B — Dedicated Pi gateway process:** Bun proxies WebSocket to a long-lived Pi sidecar; reduces re-spawn cost.

**Hard requirements when Pi owns the turn**

1. **Tool execution** — Pi invokes `read` / `bash` / etc.; server enforces **workspace jail**, **approvals**, timeouts (**[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** production checklist).
2. **Thinking / skills** — emit only if Pi runtime exposes them; UI already tolerates missing edges (**WOP_MULTI_AGENT_WEBSOCKET** fallback clause).
3. **Session transcript** — either persist Pi JSONL paths or **import/export** between Bun memory and Pi session files (**open question** in product plan).

---

## 5. UI surface → backend matrix

Rows follow the **sitemap** in **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** (information architecture).

| # | UI / product area | Wired today | Pi backend target | Notes |
|---|-------------------|-------------|-------------------|--------|
| 1 | **Workspace** | `/api/workspace`, tree | Same + Pi cwd sync | |
| 2 | **Files & tree** | `/api/tree`, file R/W | Pi tools use same roots | |
| 3 | **Chat** | `/ws` + direct LLM | **Headless Pi** turn loop | Largest migration |
| 4 | **Models** | `/api/config`, `/api/llm/models`, `set_model` | Pi provider/model selection | May dual-run during transition |
| 5 | **Sessions** | In-memory only; localStorage for mode/agent/model | **Pi JSONL** or shared store | MVP gap in open TODOs |
| 6 | **Orchestration** | **Team Pulse** placeholder | **`dispatch_agent`** + **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** | |
| 7 | **Pipelines** | None | **`agent-chain`**, `run_chain` | |
| 8 | **Personas** | `/api/agents`, `set_agent`, Plan mode + `planner.md` | Keep catalog; **persona** from Pi when unified | See **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** |
| 9 | **Skills** | None | `/skill:name` via Pi | Needs manifest + invoke path |
| 10 | **Extensions / profiles** | None in server | Map **`pi-e`** / `.pi/settings.json` | **[PLAYGROUND.md](PLAYGROUND.md)**, **`PIE_*`** |
| 11 | **Themes** | Web tokens only | Optional Pi theme JSON sync | Low priority |
| 12 | **Tools & runs** | Tool log UI; no real Pi tools | Timeline + **approval modal** | **[wop-ui-pi-backend-parity.mdc](../.cursor/rules/wop-ui-pi-backend-parity.mdc)** |
| 13 | **Playground link** | Scripts only | Wizard → server APIs | |
| 14 | **Projects docs** | File editor | No change | |
| 15 | **Integrations** | Env (Hermes, etc.) | As Pi extensions | |
| 16 | **Diagnostics** | `/api/health` minimal | Full **doctor** | |
| 17 | **Settings** | Partial (env) | Reload extensions, merged JSON | **`/reload`** equivalent |

---

## 6. Phased roadmap (recommended order)

### Phase 0 — Foundations (no Pi subprocess yet)

- Resolve **`WOP_PI_BINARY`** and **`WOP_HOME`** in server startup; surface in **`/api/diagnostics`** (partial shipped — probes only; full doctor still open).
- **Backend naming audit** — **[WOP_NAMESPACE.md — Backend naming](WOP_NAMESPACE.md#backend-code-files-and-identifiers-critical)**.
- **Client:** fail-soft banner when **`/api/health`** fails (operational clarity).

### Phase 1 — Manifest and diagnostics

- Implement **`GET /api/manifest`** per **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** (probe Pi or parse static fallback).
- **Diagnostics** page: Pi version, extension list, workspace path, Ollama reachability, manifest freshness.
- Command palette entries driven by manifest keys (even if some route to “not implemented”).

### Phase 2 — Headless Pi single chat (MVP engine swap)

- **Spawn** (or attach) Pi with workspace cwd, loaded **`.pi/settings.json`** / profile equivalent.
- Pipe **one** conversation through Pi; map stream to existing **`assistant_delta`** / **`done`** / **`error`**.
- **Tool events:** forward to Tool log + optional approval gate before executing **host** actions.
- **Feature flag:** `WOP_CHAT_ENGINE=pi` | `auto` | unset (bundled → **`WOP_LLM_PROVIDER`**) — use **`WOP_*`** only.

### Phase 3 — Sessions and persistence

- Align **save/load** with Pi session files or documented adapter (**[AGENT_MEMORY.md](AGENT_MEMORY.md)** concepts).
- UI: Sessions list, export, retention — **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** Phase 1 MVP.

### Phase 4 — Multi-agent orchestration

- Implement **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** on the wire.
- Integrate **`agent-team`**-style **`dispatch_agent`** (subprocesses or multiplexer).
- Replace **Team Pulse** placeholder with live cards + Focus drawer.

### Phase 5 — Skills, chains, profiles

- **`/skill:name`** from UI (palette + API).
- **`agent-chain.yaml`** runner exposure.
- **Extension profiles** UI = **`pi-e`** semantics; document **`PIE_CLEAR_SETTINGS_EXTENSIONS`** mapping for web.

### Phase 6 — Production hardening

- Full checklist in **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** (authn, rate limits, CSRF, logging, child timeouts, rollback).

---

## 7. Acceptance criteria (definition of “fully wired”)

Short version: every **user-visible** control that implies Pi behavior **either** invokes **headless Pi** (or documented bridge) **or** is explicitly **disabled / labeled stub** per **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**.

| Capability | Done when |
|------------|-----------|
| **Chat** | User message → Pi turn → streaming reply; tools run through Pi with policy |
| **Agents** | Catalog from disk (already); **dispatch** uses Pi for specialists, not prompt-only |
| **Commands** | Palette matches **manifest**; unknown commands absent or marked |
| **Sessions** | Save/load compatible with Pi or documented migration |
| **Orchestration** | Multi-agent events per **WOP_MULTI_AGENT_WEBSOCKET** |
| **Diagnostics** | One-click proof of Pi binary, extensions, and connectivity |

---

## 8. Code map (starting points)

| Concern | Location |
|---------|----------|
| HTTP router | `apps/wayofpi-ui/server/index.ts` → `handleApi` |
| Chat / LLM (interim) | `apps/wayofpi-ui/server/chat.ts`, `streamChatCompletion` |
| Orchestrator Bun tools (interim) | `apps/wayofpi-ui/server/chat-orchestrator-tools.ts`, `orchestrator-tools-exec.ts` |
| Pi JSON chat (Phase 2 slice) | `apps/wayofpi-ui/server/pi-agent-runtime.ts` + **`pi-json-mode-chat.ts`** — **`runPiChatTurn`** / **`streamPiJsonChatTurn`** |
| Static manifest | `apps/wayofpi-ui/server/web-manifest.ts`, `GET /api/manifest` |
| System prompt merge | `apps/wayofpi-ui/server/session-prompts.ts`, `applyLeadSystem` |
| Agent scan | `apps/wayofpi-ui/server/agents.ts` |
| Client session | `apps/wayofpi-ui/src/hooks/useWayOfPiSession.ts` |
| Agent catalog | `apps/wayofpi-ui/src/hooks/useAgents.ts` |
| Shell | `apps/wayofpi-ui/src/App.tsx`, `ChatPanel`, `SimpleApp` |

---

## 9. Open questions (carry from product plan)

- Single-user vs multi-tenant: does Pi subprocess run **per user**, **per workspace**, or **shared pool**?
- Exact **Pi CLI** flags for non-interactive / headless (pin in **CHANGELOG** when chosen).
- **Sandbox** policy for **`bash`** from web-triggered Pi.
- **Session file format:** native Pi JSONL vs Way of Pi wrapper.

---

**Last updated:** 2026-04-11 — **§0** critical Pi-only agent lock; **§2.5** audit; update when phases ship (**[CHANGELOG.md](../CHANGELOG.md)**, **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)**).
