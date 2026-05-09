# Claw UI plan — interface research and Way of Pi directions

**Purpose:** Define and evolve **Claw mode** as a **deliberate operator shell** for long-running, tool-using, multi-agent work — distinct from both the Technical IDE shell and Simple chat view. This doc collects **what similar products built**, **which UX patterns hold up**, and **how Way of Pi implements** the Claw shell without breaking **Pi-backed parity** (**[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)**, **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**).

**Last updated:** 2026-04-11

---

## 1. Definitions

| Term | Meaning here |
|------|----------------|
| **Claw mode** | Third **`wayofpi.uiMode`** value: dedicated **mission-control shell** with its own nav rail, Mission / Chat / Team / Schedule / Channels / Files / Settings tabs, `.claw/` workspace, and help modal. Visually and structurally distinct from both Technical (IDE grid) and Simple (chat-first). |
| **“Claw-class” UX** | Operator-focused surfaces: **status**, **queues**, **multi-agent visibility**, **schedules**, **approvals**, **memory**—inspired by autonomous-agent stacks in the wider ecosystem, implemented **through Pi + documented bridges**, not a second agent engine in Bun. |
| **OpenClaw-style products** | Popular **self-hosted agent + gateway** stacks (names used as **reference only**; Way of Pi does not require shipping OpenClaw). |

---

## 2. What others built (2025–2026 scan)

Use these as **pattern libraries**, not copy-paste targets.

### 2.1 OpenClaw ecosystem (official + community)

| Surface | What it does well | Reported pain / risk |
|---------|-------------------|----------------------|
| **Gateway + Chat** | Streaming chat, tool cards, agent/session model in TUI ([OpenClaw TUI docs](https://openclaws.io/docs/web/tui)) | N/A for core chat. |
| **Control / dashboard** | Visual config, model switching ([OpenClaw dashboard flow](https://help.apiyi.com/en/openclaw-switch-model-tutorial-claude-sonnet-gpt-mini-guide-en.html)) | Community feedback: **Config / Models / Updates** sections felt **nested, stale, or raw** compared to chat — e.g. [openclaw/openclaw#13142](https://github.com/openclaw/openclaw/issues/13142) (closed; still useful as a **UX audit checklist**). |
| **[ClawPort UI](https://github.com/JohnRiceML/clawport-ui)** (`clawport-ui`, [clawport.dev](https://clawport.dev)) | **Org chart** of agents (React Flow), **Kanban**, **cron monitoring**, **live activity log**, **memory browser**, **cost tracking**, voice/vision chat — “command center” framing. | Depends on a **running OpenClaw gateway**; not a model for duplicating gateway logic inside Way of Pi. |
| **[openclaw-mission-control](https://github.com/robsannaa/openclaw-mission-control)** | **Dashboard** (health, resources), **tasks** board, **agents** org chart, **memory** editor, **models** hub, in-browser **terminal** — “one screen” operator story. | Same: **transparent window** into an existing runtime, not a second brain. |

**Takeaway:** The winning community UIs emphasize **(a)** one-screen **health + who is running**, **(b)** **chat + tool cards** with streaming, **(c)** **org chart / roster** for teams, **(d)** **task or queue** surfaces, **(e)** **memory** and **cost** visibility. Official dashboards that lean **raw YAML/API** without a **“safe vs advanced”** ladder frustrate operators.

### 2.2 IDE-integrated coding agents (Cursor, VS Code Copilot, Codex)

| Pattern | Why it matters for Claw UI |
|---------|---------------------------|
| **Plan → approve → build** | Reduces surprise edits; aligns with Way of Pi **Plan / Build** and **`plans/`** ([Cursor — agent best practices](https://cursor.com/blog/agent-best-practices)). |
| **Review edits / diffs** | Users need **file-level** and **multi-file** review before trust scales ([VS Code — review AI-generated edits](https://code.visualstudio.com/docs/copilot/chat/review-code-edits)). |
| **Sandbox + approvals** | Separate **what the agent can do technically** from **when it must stop and ask** ([Codex — agent approvals and security](https://developers.openai.com/codex/agent-approvals-security)). Claw UI should make **policy state** obvious (read-only vs workspace-write vs “ask”). |
| **Tool approval UI** | Sensitive tools show **Allow / Deny** with **clear args** and **audit-friendly** outcomes (common pattern in [AI SDK tool approval](https://chatbot.ai-sdk.dev/docs/customization/tool-approval), [TanStack AI tool approval](https://tanstack.com/ai/latest/docs/guides/tool-approval)). |

**Takeaway:** Claw should **not** optimize only for “more autonomy”; it should optimize for **visible policy + review + interruptibility**.

---

## 3. Interface principles (ranked)

1. **Truthful status strip** — Model, session, **Pi vs Bun path**, workspace root, **paused** state. Never imply Pi ran a tool when only Bun did (**parity rule**).
2. **Tool-first transparency** — Collapsible **tool cards** (args → streaming partials → result), same mental model as OpenClaw TUI “tool cards” and Mission Control’s activity console.
3. **One primary “mission” column** — Queue / cron / last failure / next wake (Claw Phase D–F in **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)**), docked so it does not fight the editor.
4. **Multi-agent = graph + timelines** — Org chart or **Team Pulse** grid is not decoration; it must eventually bind to **real `dispatch_agent` / WS events** (**[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**).
5. **Progressive disclosure for settings** — **Common** (model, pause, workspace) vs **Advanced** (env, extension paths, orchestrator toggles); avoid the “only Chat tab works” trap from dashboard audits.
6. **Kill switch always reachable** — Global pause + per-workspace cap (future); until then, **banner + Settings** link to **Host doctor** and **`WOP_*`** hints.

---

## 4. Recommended surfaces (map to Way of Pi)

| UI surface | Inspiration | Way of Pi today | Target owner |
|------------|-------------|-----------------|---------------|
| **Overview / health** | Mission Control dashboard | **Host doctor**, **`/api/diagnostics`**, Extensions orchestration card | Extend **diagnostics** + **config** summaries; no fake “all green”. |
| **Chat + tool stream** | OpenClaw TUI, ClawPort chat | **ChatPanel**, tool log dock, slash commands | **Pi JSONL / events** when wired; interim rows must stay **labeled**. |
| **Agent roster / org** | ClawPort org map, Mission Control agents | **Workspace agents**, Team Pulse, **`GET /api/agents`** | **WebSocket contract** + Pi subprocess truth (**[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)**). |
| **Tasks / queue** | Kanban in ClawPort / Mission Control | **Plan** mode, **`plans/`**, Ralph-style queues (Pi playground) | **Mission panel** (Claw Phase F) backed by **disk + server**, not React-only. |
| **Memory** | Memory browser in community UIs | **Session** docs, **`projects/`**, Pi session-memory story | Pi-owned or workspace files; avoid Bun-only secret memory. |
| **Cron / schedules** | ClawPort cron monitoring | Not shipped | Pi extension or **`wop`** sidecar + explicit security doc. |
| **Terminal** | Mission Control | **`/ws/terminal`** (opt-in) | Policy alignment with approvals. |
| **Model picker** | Dashboard tutorials | Models API + Pi when engine is Pi | **Single source of truth** — fix “stale dropdown” class of bugs by reading **live** config from the process that will run the next turn. |

---

## 5. Layout direction (Claw default)

**Recommendation (answers open question 1 in [WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)):** On **first** open of **`uiMode === "claw"`**, apply a **named dock preset** (versioned JSON, e.g. **`wayofpi.claw.dockPreset.v1`**) that:

- Keeps **editor + workspace grid** as the **center of mass** (builders still ship code).
- Opens **right dock**: **chat** (wide enough for tool cards).
- Opens **bottom or secondary strip**: **tool log** + **diagnostics snippet** or link.
- Reserves a **thin persistent strip** or **sidebar page** for **Mission / queue** once Phase F exists (placeholder: **Planning** side panel link until real panel ships).

Technical mode users **keep their layout** when switching **Technical ↔ Claw** unless they opt in to “reset Claw layout” (avoid surprise).

```text
+------------------------------------------------------------------+
|  Claw · Paused OFF · Workspace: … · Engine: Pi | auto | Bun      |
+----------+-------------------------------+-------------------------+
| Explorer |  Editor / multi-pane grid     |  Chat (+ tool cards)  |
|          |                               |                       |
+----------+-------------------------------+-------------------------+
|          |  Tool log / activity          |  (optional) Mission   |
+----------+-------------------------------+-------------------------+
```

---

## 6. Phasing (UI-only vs blocked on Pi)

| Phase | UI work | Blocked on |
|-------|---------|------------|
| **UI-0** | Claw **preset** persistence, **status strip** fields from existing **`/api/config`** + diagnostics | None |
| **UI-1** | **Tool card** presentation parity (expand/collapse, errors, copy args) from WS payload | Stable tool event shape from **orchestrator / Pi** |
| **UI-2** | **Mission / queue** panel shell + empty states | Server contract for queue persistence |
| **UI-3** | **Org chart** or upgraded Team Pulse | **`WOP_MULTI_AGENT_WEBSOCKET.md`** + Pi **`dispatch_agent`** |
| **UI-4** | **Schedule / cron** UI | Scheduler design (Claw Phase D) + security review |

---

## 7. Mode isolation (UI contract)

Claw is a **separate lane**. It shares the same Pi engine and the same workspace on disk, but its UI state, operational files, and documents must never bleed into Technical or Simple modes.

### What Claw owns exclusively

| Asset | Where | Rule |
|-------|-------|------|
| **Mission view** | Claw nav rail tab only | Never rendered in Technical or Simple |
| **Session tabs** | `ClawSessionStrip` | Separate from Technical activity/docks and Simple nav |
| **`.claw/` documents** | `SOUL.md`, `AGENTS.md`, `MEMORY.md`, `HEARTBEAT.md`, etc. | Created only by Claw scaffold; not surfaced in Simple/Technical default panels |
| **Daily memory logs** | `.claw/workspace/memory/YYYY-MM-DD.md` | Written by Claw agent; other modes don’t list automatically |
| **Operational settings** | `wayofpi.claw.*` localStorage keys | Claw reads/writes only |

### What Claw can reach (full Pi tool access)

Claw **can access any workspace file** via the Files tab or Pi tools — this is intentional and required for autonomous tasks. If a task needs to read `src/`, edit `plans/`, or scan configs, the agent must be able to do that. Isolation only governs **where Claw writes its own operational state**, not the agent’s reach.

### Visual separation rules

- Claw uses a **cyan/teal** palette tint, mission-control layout, and nav rail. Technical uses IDE chrome (`zinc/gray`). Simple uses chat-first layout (`indigo/violet`). These must remain visually distinct.
- A user switching Claw → Technical must not see Claw session tabs, memory cards, or agent status strips in the Technical shell.
- Shared inner components (`SimpleChatView`, `SimpleFilePanel`) are wrapped and scoped inside Claw — they do not expose Technical docks or Simple navigation when used there.

---

## 8. Non-goals

- **Rebuilding OpenClaw’s gateway** inside **`apps/wayofwork-ui/server`** as the “real” agent runtime.
- **Shipping a beautiful Claw dashboard** that implies features **not** backed by **`WOP_PI_BINARY`** or documented bridges.
- **Hiding** Bun vs Pi behind vague “AI is working” copy — operator trust requires **engine labels**.
- **Mixing `.claw/` documents into Simple project files** or Technical workspace docks.

---

## 9. Documentation maintenance

When Claw UI ships a preset, panel, or strip:

1. Update **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** (layout keys, screenshots if any).
2. Update **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)** checklist and phases if scope moved.
3. Update **[WOP_PRODUCT_CAPABILITIES.md](WOP_PRODUCT_CAPABILITIES.md)** row for Claw UI.
4. One line in **[CHANGELOG.md](../CHANGELOG.md)** when user-visible.

---

## 10. References (external)

- [OpenClaw TUI — tool cards, sessions](https://openclaws.io/docs/web/tui)
- [OpenClaw Control UI UX discussion — #13142](https://github.com/openclaw/openclaw/issues/13142)
- [ClawPort UI (GitHub)](https://github.com/JohnRiceML/clawport-ui)
- [openclaw-mission-control (GitHub)](https://github.com/robsannaa/openclaw-mission-control)
- [Cursor — best practices for coding with agents](https://cursor.com/blog/agent-best-practices)
- [VS Code — review AI-generated code edits](https://code.visualstudio.com/docs/copilot/chat/review-code-edits)
- [OpenAI Codex — agent approvals and security](https://developers.openai.com/codex/agent-approvals-security)

---

## 11. Related (repo)

| Doc | Role |
|-----|------|
| **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)** | Product phases, autonomy, channels, Pi ownership. |
| **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** | Where new strips/panes must plug in. |
| **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** | Orchestration event contract. |
| **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** | Process boundary audit. |
| **[WOP_ORCHESTRATION_EXTENSIONS_PANEL.md](WOP_ORCHESTRATION_EXTENSIONS_PANEL.md)** | Orchestration controls today. |
