# Way of Pi — full Pi backend wiring plan

**Purpose:** Inventory **what the web UI and Bun server do today**, what **headless Pi** must provide per **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)**, and a **phased wiring map** so every product surface can eventually call the **real Pi engine** (extensions, tools, skills, sessions, orchestration) instead of parallel or stub implementations.

**Related:** **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** (living gaps) · **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** (`WOP_PI_BINARY`, `WOP_HOME`) · **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** · **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** · **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** · Cursor rules **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**, **`.cursor/rules/wop-ui-workspace-agents.mdc`**

---

## 1. North star (locked architecture)

| Layer | Target |
|-------|--------|
| **Agent runtime** | **Headless Pi** — same `extensions[]`, skills, themes, packages as the TUI workflow. |
| **UX** | **Web UI** + future **`wop`** CLI; browser talks to **Way of Pi server**, server **spawns or drives Pi** with **`WOP_PI_BINARY`**, cwd = workspace, isolated **`WOP_*`** / **`WOP_HOME`** per **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**. |
| **Out of scope for v1 plugin-compat** | Rewriting chat/tools without a Pi subprocess (per product plan). |

**Today’s gap:** **`apps/wayofpi-ui/server/chat.ts`** streams completions via **Ollama / OpenRouter** directly. That stack is **real** for editing and files but is **not** Pi — no `registerTool`, no slash commands, no `dispatch_agent`, no extension hooks.

---

## 2. Runtime topology (as built)

| Component | Role |
|-----------|------|
| **Vite** (dev) | Serves React; **proxies** `/api` and `/ws` to Bun (**`apps/wayofpi-ui/vite.config.ts`**). |
| **Bun** (`WOP_SERVER_PORT`, default **3333**) | REST + WebSocket + optional **`dist/`** static assets (**`server/index.ts`**). |
| **Browser** | Relative **`/api/*`**, **`/ws`**, **`/ws/terminal`** — no hard-coded API port. |

**Operational note:** If the SPA is served **without** this Bun process (static files only), **`/api/*`** returns **404** — see **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** Phase A.

---

## 3. HTTP API inventory — wired vs Pi target

| Method | Path | Current implementation | Pi / product target |
|--------|------|-------------------------|---------------------|
| GET | `/api/health` | Liveness JSON | Extend with **Pi binary probe**, version, `WOP_HOME` path |
| GET/POST | `/api/workspace` | In-memory multi-root folders | Keep; Pi child cwd must track **primary** (or defined) root |
| GET | `/api/config` | Env-backed provider + models + `terminalEnabled` | Add **Pi profile** snippet (extensions path, danger flags) when manifest exists |
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
| **`GET /api/manifest`** (or split routes) | Runtime **tools**, **slash commands**, **extensions** — **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** |
| **`GET /api/diagnostics`** | **`wop doctor`**-style: Pi version, extensions load, Ollama, workspace jail |
| **`GET /api/sessions`** + mutations | List/load/save/delete — align format with Pi JSONL or adapter layer |
| **Pi control** | **`POST /api/pi/reload`**, profile apply, optional **`/api/upstream`** wrapping **`scripts/wop-pi-upstream.ts`** |

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

- Resolve **`WOP_PI_BINARY`** and **`WOP_HOME`** in server startup; surface in **`/api/health`** or **`/api/diagnostics`**.
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
- **Feature flag:** `WOP_CHAT_ENGINE=pi` | `ollama` (names illustrative — use **`WOP_*`** only).

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
| Chat / LLM | `apps/wayofpi-ui/server/chat.ts`, `streamChatCompletion` |
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

**Last updated:** 2026-04-11 — planning only; update when phases ship (**[CHANGELOG.md](../CHANGELOG.md)**, **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)**).
