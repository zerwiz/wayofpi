# Claw mode plan (`docs/WOP_CLAW_MODE_PLAN.md`)

**Claw** is a third **UI mode** in **`apps/wayofpi-ui`** (alongside **Simple** and **Technical**). It has its own dedicated shell — a mission-control layout with a left nav rail, session tabs, file panel, and agent workspace — completely separate from both the Technical IDE shell and the Simple chat view.

This document is the **product and engineering plan** for growing **Claw-class** capabilities: persistent, tool-using agents with optional **channels** (messengers, email), **schedules**, and **clear operator control**—in the same spirit as popular **"open claw"**-style autonomous agent stacks, without forking Pi into a second runtime in Bun (see **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**).

**Interface and UX deep dive** (market scan, layout presets, UI phasing): **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)**.

---

## Principles (non-negotiable)

1. **Pi owns agent behavior** — tools, extensions, `dispatch_agent`, sessions, and model routing run in **headless Pi** (`WOP_PI_BINARY`), not a parallel Way-of-Pi-only agent loop.
2. **Way of Pi owns the shell** — layout, file tree, WebSocket glue, workspace I/O, and **explicit** stubs when a feature is not wired.
3. **Capability-driven roadmap** — integrate **patterns** (scheduler, inbox bridge, long-lived session) through documented phases; treat external product names as **reference inspiration**, not hard dependencies, unless we explicitly add an adapter doc.
4. **Mode isolation** — Claw's workspace, sessions, and UI state do not bleed into Technical or Simple mode. Each mode is its own lane. See **§ Workspace isolation** below.

---

## Workspace isolation (critical design rule)

### Why isolation matters

Three UI modes share the same **workspace on disk** and the same **WebSocket / Pi session**, but they serve fundamentally different audiences with different expectations:

| Mode | Who uses it | What they expect to see |
|------|-------------|------------------------|
| **Simple** | Casual users, onboarding | Clean chat + project files. No operator clutter. |
| **Technical** | Developers | IDE grid, diffs, tool log, all workspace files. |
| **Claw** | Autonomous-agent operators | Mission control, agent memory, schedules, sessions. |

Mixing Claw's operational artifacts (`.claw/workspace/HEARTBEAT.md`, session logs, agent identity files) into the Technical file tree or Simple project view would confuse users in those modes. Mixing Technical workspace state (editor tabs, dock layout, active git diff) into Claw would confuse operators running long-horizon tasks.

### The `.claw/` folder is Claw's private workspace

On disk under the **Way of Pi checkout** (host repo), not the opened `WOP_WORKSPACE` project:

```text
<way-of-pi-repo>/
├── .claw/
│   ├── telegram.json    ← optional; Telegram bot token (gitignored)
│   └── workspace/       ← Claw bundle (seven files + memory/)
│       ├── SOUL.md          ← Claw agent identity and tone
│       ├── AGENTS.md        ← Claw startup procedures and memory rules
│       ├── USER.md          ← User context for Claw sessions
│       ├── MEMORY.md        ← Long-term memory index (keep ≤ 2 KB)
│       ├── HEARTBEAT.md     ← Proactive task checklist
│       ├── TOOLS.md         ← Tool config (pi-telegram, extensions…)
│       ├── SECURITY.md      ← File access and secret policy
│       └── memory/
│           └── YYYY-MM-DD.md  ← Daily session logs (auto-created by agent)
├── .pi/                 ← Pi runtime (agents, extensions, sessions)
├── plans/               ← Shared plan files (all modes can read)
└── <your project files>
```

**Rules:**

- `.claw/` (including `workspace/`) is created and managed by the **Claw UI** on the host checkout. Simple and Technical modes do not show `.claw/` in their default panels or toolbars.
- When Claw saves a session log, it goes to `.claw/workspace/memory/YYYY-MM-DD.md` — **not** to `.pi/agent-sessions/` (Pi CLI's own space) or to any Technical-mode workspace state.
- Simple and Technical modes may **read** `.claw/` files if the user explicitly navigates to them, but they never write to `.claw/` automatically.
- Shared files (`plans/`, `.pi/agents/`, workspace code) remain accessible to all modes — Claw can reach any workspace file when its tasks require it.

### Pi tool access — full, but operationally scoped

Claw **can and should** use the full Pi tool set (read, write, grep, bash, dispatch\_agent, etc.) via `pi --mode json`. The isolation principle does **not** restrict tool capability. It only governs **where Claw writes its own operational state**:

| Artifact | Where it lands | Visible to other modes |
|----------|----------------|------------------------|
| Agent memory / session log | `.claw/workspace/memory/YYYY-MM-DD.md` | No (Claw convention) |
| Code edits, task output | Target path in workspace (e.g. `src/`) | Yes — it's project content |
| Pi session transcript | `.pi/agent-sessions/` (Pi runtime) | Pi CLI / Technical if same engine |
| Claw agent identity | `.claw/workspace/SOUL.md`, `.claw/workspace/AGENTS.md` | No |
| Plan files | `plans/PLAN-*.md` | Yes — intentionally shared |
| Telegram config | `.claw/telegram.json` or `~/.pi/agent/telegram.json` | No — secret, gitignored |

### UI-level isolation rules (implemented today, must not regress)

| Concern | Rule |
|---------|------|
| **Session tabs** | Claw has its own `ClawSessionStrip`. Switching to Technical or Simple does not expose or clear Claw sessions. |
| **File tree defaults** | Claw's Files tab shows the workspace tree. Mission view defaults to `.claw/workspace/` context cards — not the full IDE tree. |
| **Layout / dock state** | Claw uses `clawTab` (React state, to be persisted under `wayofpi.claw.tab`); Technical uses `activity` + `panelDock`; Simple uses `simpleTab`. **Never share.** |
| **Settings keys** | Claw shares `useSimplePreferences` (dark/light) but its own operational settings live under `wayofpi.claw.*` localStorage keys. |
| **`.claw/` writes** | Only `ClawWorkspaceCard.scaffold()` and explicit user edits create files under **`.claw/workspace/`** (and optional `.claw/telegram.json`). No Technical or Simple code path writes there. |
| **Mission view** | Claw-only. It reads `.claw/workspace/` file states and agent workspace health. Never shown in Technical or Simple. |
| **`.gitignore`** | `.claw/telegram.json`, `.claw/workspace/` (or the whole `.claw/` at operator discretion) should be listed in the Way of Pi checkout `.gitignore`. Template should suggest this. |

### Future: `WOP_CLAW_HOME` for full path isolation (Phase C)

For multi-project use or stricter isolation, a `WOP_CLAW_HOME` env var can redirect Claw's operational workspace to a path outside the project (e.g. `~/.claw/<workspace-hash>/`). This is planned in **Phase C** and must not be built until the `.claw/` convention is stable. Any new env name must be registered in **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**.

---

## What ships today

| Item | Status |
|------|--------|
| **`UiMode`: `claw`** | Persisted in `wayofpi.uiMode`; toggle + Settings entry |
| **Shell** | Dedicated `ClawApp` — separate from Technical + Simple; own nav rail + tab routing |
| **Mission tab** | Health strip, quick actions (incl. New Plan → opens Files tab), agent roster, activity feed, `.claw/workspace/` bundle card |
| **Chat tab** | `ClawSessionStrip` (tabs, new session, `.claw/workspace/` toggle), file panel with workspace tree + editor |
| **Team tab** | `SimpleTeamView` (agent catalog) |
| **Files tab** | Tree + `SimpleFilePanel` — Markdown opens in **Preview** mode by default; images, SVG, Mermaid also preview |
| **Settings tab** | `SimpleSettingsView` + link to Technical mode |
| **`.claw/workspace/` scaffold** | `ClawWorkspaceCard` — checks and creates all 7 template files on demand |
| **Help modal** | `ClawHelpModal` — 7-section operator guide (Overview, Navigation, `.claw/workspace/`, Schedules, Channels, Files, Tips), triggered from `?` button in nav rail |
| **Telegram plan** | `docs/WOP_TELEGRAM_PLAN.md` — `pi-telegram` extension (Phase T-0) |
| **Schedule tab** | `ClawSchedulesView` — cron / once-off Pi turns; definitions under **`<host>/.claw/schedule/claw-schedules.v1.json`** (synced from UI); server runs them when **`WOP_CLAW_SCHEDULER=1`** and Pi drives chat |
| **Channels tab** | `ClawChannelsView` — Telegram setup + **`GET /api/claw/telegram/status`**; **POST `/api/claw/inbound`** (Bearer secret; webhook secret file under **`WOP_WORKSPACE/.wayofpi/`** per **`claw-webhook-store`**) for headless Pi turns; Email still planned |
| **New Plan** | `NewPlanFileModal` wired in Claw block; after creation stays in Claw and opens the plan in the Files tab |

---

## Target capabilities (phased)

Aligned with existing repo plans: **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**, **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**, **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)**, **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)**.

### Phase A — Pi-backed turns (foundation)

- **`WOP_CHAT_ENGINE=pi` / `auto`** with resolved **`pi`**: every chat turn and persona runs **`pi --mode json`** so **skills**, **tools**, and **extensions[]** match the TUI. This is what gives Claw its tool capability — not a Bun-side reimplementation.
- **Session continuity** — same session file semantics as Pi; UI surfaces **resume / fork** without inventing a second transcript format.
- **`.claw/workspace/` as Pi context** — Phase A should load `SOUL.md`, `AGENTS.md`, and `MEMORY.md` from that bundle as Pi context at session start (via `AGENTS.md`-style injection), so the agent knows its identity and memory without manual copy-paste.

### Phase B — Multi-agent and orchestration UI

- **`dispatch_agent`** and specialist streams: implement **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** contract; Claw can default **dock presets** that emphasize **orchestration** (e.g. agent grid, tool log, plan panel).
- **Operator visibility** — which subprocess ran which tool; no "fake tool" rows from Bun-only paths.
- **Isolation**: orchestration events are Claw-only; they do not appear in Simple or Technical tool logs unless the user switches mode.

### Phase C — Persistence and memory (Claw-shaped)

- **Long-horizon context** — workspace-visible memory artifacts under `.claw/workspace/memory/` (aligned with Pi **session-memory** / project docs), not hidden state in the web server alone.
- **`WOP_CLAW_HOME`** env var (see isolation §above).
- **Honcho (optional cross-session store)** — align **`HONCHO_WORKSPACE`** (and mirror defaults) with operator context; surface **health** and **transparency** in Claw (Mission / Channels), not a Bun-only Honcho client pretending to be the agent—backlog **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md#honcho-and-way-of-pi-ui)**, stack notes **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §8–9.
- **Optional vector / search** — only if Pi or an approved sidecar owns retrieval; avoid a Bun-only "mini RAG" that bypasses Pi policy.

### Phase D — Autonomy controls (heartbeat / schedules) — **partially shipped**

**Shipped in Way of Pi today**

- **Schedule definitions + run metadata** — persisted on the **host checkout** under **`.claw/schedule/`** (not the opened `WOP_WORKSPACE` project). UI syncs via **`GET` / `PUT /api/claw/schedules`**; last-run fields merge from **`claw-schedule-runs.v1.json`**.
- **Opt-in timer runner** — set **`WOP_CLAW_SCHEDULER=1`** (or `true` / `on`) on the Bun server. The process runs an interval tick (~45s), evaluates enabled **cron** and **one-shot** schedules, and invokes **headless `pi --mode json`** via **`executeClawAutomation`** when **Pi drives chat** (`WOP_CHAT_ENGINE=pi` or `auto` with **`pi`** resolving). Schedule output and memory follow existing Pi / Claw conventions (e.g. **`.claw/workspace/memory/`**).
- **Lightweight mission log** — append-only events under **`.claw/mission-events/claw-mission-events.v1.json`** for Mission / diagnostics.

**Still planned (remainder of Phase D)**

- **Heartbeat-driven wakes** — explicit **HEARTBEAT.md**-driven runner beyond the current schedule form (may share the same executor).
- **Rich audit UX** — dedicated per-schedule history UI (beyond last-run + mission log).
- **Rate limits and kill switch** — global pause and caps; surface in Claw banner / settings.

### Phase E — Channels (inbound / outbound)

- **Inbound webhooks or messaging bridges** — separate doc for threat model (auth, sandbox, secrets in `WOP_*` only). Config stored in `.claw/` (not workspace root or `.pi/`).
- **Outbound notifications** — same Pi tool or extension surface; no duplicate registry in Bun.
- **Telegram** — Phase T-1 onward in **[WOP_TELEGRAM_PLAN.md](WOP_TELEGRAM_PLAN.md)**; token stored in `.claw/telegram.json`, gitignored.

### Phase F — Claw-specific UX

- **Mission / queue panel** — standing tasks, last run, failures (backed by server + Pi logs, not React-only state). Data source: `.claw/workspace/memory/` + server queue API.
- **Workflow library** — optional curated prompts or `plans/` templates; stored in `.claw/workflows/` or repo `plans/`.
- **Layout and panels** — default dock preset, status strip, tool-card parity, non-goals: **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)** sections 5–7.

---

## Engineering checklist (add when starting each phase)

- [ ] Update **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** milestone table if chat or WS contracts change.
- [ ] Update **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** if Claw introduces new docks or persistence keys.
- [ ] Add **`WOP_*`** / **`wayofpi.claw.*`** names to **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** for any new env toggles or localStorage keys.
- [ ] One-line **[CHANGELOG.md](../CHANGELOG.md)** under **[Unreleased]** for user-visible behavior.
- [ ] Verify that any new `.claw/` write path is **not** accessible from Simple or Technical code without explicit user intent.

---

## Open questions

1. **Default dock preset for Claw** — fork from Technical grid JSON or share one layout with a `uiMode`-aware default on first open?
2. **Scheduler process** — child of Bun server vs separate `wop` subcommand vs Pi extension hook; security boundary must be explicit.
3. **Channel adapters** — which first integration (e.g. generic **webhook** only) proves the model before optional third-party APIs?
4. **`.claw/` gitignore recommendation** — should the scaffold write a `.claw/.gitignore` that excludes `telegram.json` and `memory/`? Or leave it to the user?
5. **Session tab persistence** — should `ClawSessionStrip` tabs be persisted to `wayofpi.claw.sessions` localStorage so they survive a reload?

---

## Related

- **Planning hub:** **[WOP_PLANNING.md](WOP_PLANNING.md)**
- **Claw UI (interfaces):** **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)**
- **Telegram bot agent:** **[WOP_TELEGRAM_PLAN.md](WOP_TELEGRAM_PLAN.md)**
- **Product capabilities:** **[WOP_PRODUCT_CAPABILITIES.md](WOP_PRODUCT_CAPABILITIES.md)**
- **Namespace:** **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**

**Last updated:** 2026-04-12 (Phase D schedule runner shipped — doc + help copy aligned)
