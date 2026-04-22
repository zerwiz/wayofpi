# Extensions activity: Orchestration and Pi extensions

This document describes the **Extensions** side panel in **Technical** UI mode (`apps/wayofpi-ui`): the **Orchestration** card (Plan / Build, chat backend summary, runtime toggles) and the **Pi extensions** card (workspace `extensions[]` in `.pi/settings.json`).

**Code:** `apps/wayofpi-ui/src/components/TechnicalSidePanels.tsx` (`ExtensionsSidePanel`). **Server:** `apps/wayofpi-ui/server/index.ts` (`GET` / `POST` `/api/config`), `server/pi-agent-runtime.ts`, `server/orchestrator-tools-exec.ts`. **Related:** [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md), [WOP_BUILD_PLAN_MODE.md](WOP_BUILD_PLAN_MODE.md), [WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md), [WOP_NAMESPACE.md](WOP_NAMESPACE.md).

---

## Where to find it

1. Switch to **Technical** UI (if you use Simple mode).
2. Open the **Extensions** activity in the left **ActivityBar** (puzzle-style icon region).
3. Scroll the panel: **Orchestration** is the first card; **Pi extensions** follows below.

---

## Orchestration card

### Plan / Build

- **Build** and **Plan** switch the session **system prompt** posture for the active chat (same concept as **Plan / Build** elsewhere in the app: composer, status hints, [WOP_BUILD_PLAN_MODE.md](WOP_BUILD_PLAN_MODE.md)).
- You cannot switch while a reply is **streaming**; finish the turn first.

### Chat engine (read-only)

- Shows the **effective** backend label from the Bun server (for example `ollama`, `openrouter`, or `pi` / `auto` resolution text), from **`GET /api/config`**.
- This row follows **`WOP_CHAT_ENGINE`**, **`WOP_LLM_PROVIDER`**, and related env (see [WOP_NAMESPACE.md](WOP_NAMESPACE.md)). Changing env requires **restarting the Way of Pi Bun server** (and usually the dev script that spawns it).

### Pi drives chat (runtime toggle)

- **On** means the server will use **headless Pi** (`pi --mode json`) for chat turns **when a `pi` executable is resolved** (PATH or **`WOP_PI_BINARY`**).
- **Off** forces the **interim Bun** completion path for this process, even if **`WOP_CHAT_ENGINE`** would otherwise prefer Pi.
- **On** with **no Pi binary**: the row can show **off** until `pi` is installed or **`WOP_PI_BINARY`** is set; the UI may show a short hint under the label.
- Toggles apply to **this Bun process only** until exit; they do not rewrite `.env`. Sending **`piDrivesChat: null`** in **`POST /api/config`** clears the session override (see API section below).

### Orchestrator tools (Bun) and Orchestrator bash (runtime toggles)

- **Orchestrator tools (Bun):** interim **Pi-shaped** workspace tools (read, list_dir, grep, write, team roster tools, optional git tools) on the Bun tool loop when chat is **not** driven by headless Pi. Default follows **`WOP_ORCHESTRATOR_TOOLS`**; the **on/off** control sets a **session override** until restart.
- **Orchestrator bash:** the **`bash`** tool in that same loop. Default follows **`WOP_ORCHESTRATOR_BASH`**; **on/off** is also a session override.

For product intent (Pi owns tools long-term), see [WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md).

### Quick actions under Orchestration

- **Open teams.yaml** — opens **`.pi/agents/teams.yaml`** in the workspace editor when a workspace is loaded.
- **Open chat tool log** — focuses the bottom **Tool log** tab so tool lines are visible.

---

## Runtime toggles API and troubleshooting

### `GET /api/config`

Returns JSON including at least:

| Field | Meaning |
|-------|--------|
| `chatEngine` | Effective chat backend label |
| `piDrivesChat` | Whether headless Pi is used for turns (after env + session override) |
| `piBinaryResolved` | Whether a `pi` binary was found |
| `piChatEngineRequested` | Whether env asked for Pi or auto (rough signal) |
| `orchestratorTools` | Whether interim orchestrator tools are enabled |
| `orchestratorBash` | Whether the `bash` tool is offered in that loop |

### `POST /api/config`

**Body (JSON):** at least one of:

- `orchestratorTools`: `boolean` or `null` (null clears session override for that gate)
- `orchestratorBash`: `boolean` or `null`
- `piDrivesChat`: `boolean` or `null`

**Response:** `{ "ok": true, "orchestratorTools": …, "orchestratorBash": …, "piDrivesChat": … }`.

### `404 {"error":"Not found"}` when using on/off in the UI

The handler lives in the **same Bun server** that serves **`GET /api/config`**. A 404 here almost always means the process on **`WOP_SERVER_PORT`** (default **3333**) is an **older build** that does not register **`POST /api/config`** for these keys.

**Fix:** stop the old Bun API (find the process listening on the port, or stop `npm run dev` / `bun run server/index.ts`), then start the app again from **`apps/wayofpi-ui`** so server code and UI stay in sync.

In dev, Vite proxies **`/api`** to that Bun port; the browser is not wrong if the backend is stale.

---

## Plan: toward 100% reliable Orchestration

**“100%” here means:** (1) the UI never shows working toggles against a server that cannot apply them, (2) operators have a short, repeatable checklist when something fails, (3) the path to **real Pi-owned chat + tools** stays explicit so this panel stays honest as the product converges on [WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md).

### Definition of done (acceptance)

| # | Criterion |
|---|-----------|
| D1 | With a **matching** Bun build, **`POST /api/config`** always returns **200** and **`GET /api/config`** reflects the new **`piDrivesChat`**, **`orchestratorTools`**, and **`orchestratorBash`** values within one refresh. |
| D2 | With a **stale** Bun on the port, the **shell** warns **before** the user clicks toggles (not only after a **404**). |
| D3 | Any surface that shows **`piDrivesChat`** / orchestrator flags uses the same **`GET /api/config`** path (shared **`useServerConfig`** in `apps/wayofpi-ui`; no second client with different parsing). |
| D4 | Docs and **`apps/wayofpi-ui/README.md`** API table stay aligned when routes or fields change. |

---

### Phase 0 — Operator checklist (no code; fixes most 404s today)

Do these in order when toggles return **404** or values look wrong:

1. **Confirm one listener on `WOP_SERVER_PORT`** (default **3333**).  
   Example: `ss -tlnp | grep 3333` or `lsof -i :3333`. If two processes fight the port, stop extras.

2. **Restart the Way of Pi Bun server** from the same checkout as the UI (same commit / branch).  
   Examples: stop **`npm run dev`** / **`bun run server/index.ts`** / **`just wayofpi-electron`** stack, then start again from **`apps/wayofpi-ui`**.

3. **Smoke-test the API** (replace port if needed):

   ```bash
   curl -sS "http://127.0.0.1:3333/api/config" | head -c 400 && echo
   curl -sS -X POST "http://127.0.0.1:3333/api/config" \
     -H "Content-Type: application/json" \
     -d '{"orchestratorTools":true}' | head -c 200 && echo
   ```

   Second line must return JSON with **`"ok":true`**. If it returns **`{"error":"Not found"}`**, the running server binary is still **too old** for this feature — repeat step 2 from a tree that contains **`POST /api/config`** session handling in **`server/index.ts`**.

4. **Electron dev:** if **Start service** says the port is healthy but toggles **404**, treat it as **stale API** (health answered but route set mismatched). Stop the old Bun on that port, then start again (see **`apps/wayofpi-ui/electron/electron-main.mjs`** and **`vite.config.ts`** “fresh vs stale” health logic — today keyed off **`capabilities.workspaceProblems`**).

5. **Pi drives chat “on” but stays off:** install **`pi`** or set **`WOP_PI_BINARY`**; confirm **`piBinaryResolved`** is **true** in **`GET /api/config`**.

---

### Phase 1 — Stale-server detection (shipped in repo)

**Goal:** satisfy **D2** — fail closed in the product chrome when the Bun API predates **`POST /api/config`** toggles.

| Step | Work | Status |
|------|------|--------|
| 1.1 | Add **`capabilities.configRuntimePost: true`** on **`GET /api/health`** and echo the same object on **`GET /api/config`** in **`apps/wayofpi-ui/server/index.ts`**. | **Done** |
| 1.2 | Update **`apps/wayofpi-ui/vite.config.ts`** and **`apps/wayofpi-ui/electron/electron-main.mjs`** so **“fresh”** Bun requires **`workspaceProblems`** and **`configRuntimePost`** on **`/api/health`**. | **Done** |
| 1.3 | **Extensions** activity: top **help dock** (fix steps, **`curl`** smoke, **Re-check server**, link to **Tool log**, **Pi CLI** notes) when **`configRuntimePost`** is missing or a toggle returned **404**. | **Done** |

**Files:** `server/index.ts`, `vite.config.ts`, `electron/electron-main.mjs`, `TechnicalSidePanels.tsx`, `useServerConfig.ts`, **`apps/wayofpi-ui/README.md`** (API table).

---

### Phase 2 — Persistence and multi-instance (optional product decision)

Session-only overrides **reset on process exit** — that is intentional for security and simplicity. If product needs **100% same flags after restart**:

| Step | Work |
|------|------|
| 2.1 | Define a **single** on-disk source (e.g. **`.wayofpi/runtime.json`** under workspace or under **`WOP_HOME`**) written only when the operator opts in (“Remember toggles”). |
| 2.2 | On Bun boot, **merge** file into in-memory overrides **after** env is read; document precedence: **explicit env** could override file, or file overrides env — pick one rule and document in [WOP_NAMESPACE.md](WOP_NAMESPACE.md). |
| 2.3 | **Multi-workspace / multi-root:** clarify whether flags are **global per server** or **per primary root** (today they are **per server process**, not per folder). |

Until Phase 2 ships, the doc and UI should keep saying **until restart**.

---

### Phase 3 — North star: Pi drives chat without interim forks

**Goal:** satisfy long-term parity (**D4** and product lock): orchestrator tools in Bun shrink as **headless Pi** owns tools.

| Step | Work |
|------|------|
| 3.1 | Track **Phase 2** chat-through-Pi in [WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md) — when done, **`piDrivesChat`** should overwhelmingly be **true** when **`pi`** resolves and engine is **`auto`/`pi`**, and the **Orchestration** row becomes mostly **diagnostics**, not a second tool runtime. |
| 3.2 | Revisit whether **orchestrator Bun toggles** remain user-facing or move behind “Advanced / interim” once Pi tool events stream through the same path as TUI. |
| 3.3 | Keep [WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md) in sync when milestones close. |

---

### Phase 4 — Automated regression (close the loop)

| Step | Work |
|------|------|
| 4.1 | Add a **small script** or **`bun test`** that starts or assumes server on a test port, **`POST`s** each key, **`GET`s** `/api/config`, asserts values — run in CI or **`just`** recipe. |
| 4.2 | Document the command in **`apps/wayofpi-ui/README.md`** next to the API table. |

---

### Phase map (summary)

| Phase | Focus | Unblocks |
|-------|--------|----------|
| **0** | Operator checklist + curl smoke | “404 but I thought it was fine” |
| **1** | Health capability + dev stale detection | Silent UI/server version skew |
| **2** | Optional persisted toggles | Same flags after every restart |
| **3** | Pi backend wiring | Interim Bun row becomes redundant |
| **4** | CI / script | Regressions caught before release |

---

## Pi extensions card (below Orchestration)

- Lists **shim** files and **enabled** extension entries from **`.pi/settings.json`** per workspace folder (same list Pi TUI loads via shims under **`.pi/extensions/`**).
- **Refresh manifest** re-reads disk and **`GET /api/manifest`** data.
- **Toggles** edit the **`extensions[]`** array in **`.pi/settings.json`** (merge/replace behavior is implemented in the client + **`PUT /api/file`**).
- After changing extensions on disk, **restart the Way of Pi server** or run **`/reload`** in the Pi TUI so the next headless Pi turn picks up the list.

Authoring extensions: [EXTENSIONS.md](EXTENSIONS.md). Inventory: [HOW_TO_USE_EXTENSIONS.md](HOW_TO_USE_EXTENSIONS.md).

---

## Workspace card (same panel, lower)

If your build includes it, **Workspace** / **Edit JSON** and related controls are separate from Orchestration; they target workspace files and folders, not chat engine selection.
