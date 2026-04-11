# Way of Pi — Build vs Plan chat mode

**Purpose:** How to use the **Build** | **Plan** toggle in **`wayofpi-ui`**, how it relates to **Cursor-style Plan Mode**, and what **Way of Pi** adds or limits today.

**Code:** WebSocket **`set_chat_mode`** and system composition live in **`apps/wayofpi-ui/server/index.ts`** and **`apps/wayofpi-ui/server/session-prompts.ts`**. UI: **`ChatPanel`**, **`SimpleChatView`**, **`PlanningSidePanel`** (`TechnicalSidePanels.tsx`), **Settings** menu (Build/Plan + new plan file), status hint in **`StatusBar`**. Path/template helpers: **`src/utils/planModeArtifacts.ts`**, **`src/utils/planModeWorkspace.ts`**.

---

## 1. What the buttons mean (product)

| Mode | Use it when you want… |
|------|------------------------|
| **Build** | **Execution:** writing and changing code, concrete edits, debugging steps, refactors, “do this in the repo,” explanations tied to implementation. This is the default **maker** posture for the session. |
| **Plan** | **Specification and discovery first:** clarify goals, map **where** work lives (paths, modules), compare trade-offs, sequence work, call out risks and verification — **before** you ask for large code dumps. Output should read like **handoff material** (for you, for **Build** mode, or for another tool), not like a finished patch series unless you explicitly ask for a small illustrative snippet. |

**Way of Pi framing for Plan (vs generic “chat”):**

- Treat Plan as the phase where the system favors **documents and investigation**: structured write-ups, **architecture notes**, **file touch tables**, **milestones**, and explicit **open questions**.
- **Multi-agent “planning army” (intent):** Strategize as if **scout**, **planner**, **plan-reviewer**, or **documenter** roles could contribute — narrow recon, broad plan, critique, docs alignment. **See §4** for what the **web UI actually does today** versus **Pi TUI** **`agent-team`** / **`dispatch_agent`**.

---

## 2. Comparison: Cursor Plan Mode (external reference)

[Cursor’s Plan Mode](https://cursor.com/blog/plan-mode) is positioned as **spec-first** work: the agent **researches** the codebase, asks **clarifying questions**, then produces an **editable Markdown plan** (paths, snippets, to-dos) before implementation; users can **save the plan in the repo** and switch to building from it. Official docs: [Plan Mode | Cursor Docs](https://cursor.com/docs/agent/planning).

**What Way of Pi Plan mode aligns with:**

- Same **workflow habit**: Plan → review artifact → **Build** (or Pi TUI) for execution.
- Same **artifact idea**: durable **`plans/PLAN-…md`** files for handoff and history.

**Where Way of Pi differs today:**

- The **browser session does not run Pi’s file tools** (`read` / `grep` / `bash`, etc.) from chat. The model must **ground** answers in **what you paste**, **open files**, or **prior messages**; it should ask you to **save** `plans/PLAN-YYYYMMDD-<short-slug>.md` locally when that helps. That constraint is spelled out in the injected **Way of Pi web session (Plan mode)** note in **`session-prompts.ts`**.
- **True** codebase-wide recon + parallel subagents belongs in **Pi TUI** with the **`planner`** agent (and **`agent-team`** when you want real **`dispatch_agent`** subprocesses). See **[AGENTS.md](AGENTS.md)** (**`planner`**) and **[AGENT_TEAMS.md](AGENT_TEAMS.md)**.

---

## 3. Behavior in the server (accurate to code)

- **Build:** Standard lead system prompt: optional env prompt (**`WOP_SYSTEM_PROMPT`** when set) + the selected **workspace agent** body from **`GET /api/agents`**. No extra planner block unless that agent **is** already **`planner`**.
- **Plan:** Same base as Build, **plus** either:
  - the workspace’s **`planner.md`** body (Pi-style agent scan), **or**
  - **`PLAN_SESSION_SYSTEM_FALLBACK`** in **`session-prompts.ts`** (structured headings: Goal, Assumptions, Current state, Files to touch, Steps, Risks, Verification, Handoff).
- If the active agent is already named **`planner`**, the server **does not stack** a second copy of **`planner.md`**.
- Switching mode sends **`applyLeadSystem`** so the **next** model call uses the updated system prompt.

Persistence: client stores mode in **`localStorage`** key **`wayofpi.chatMode`**; on connect, client and server reconcile over **`/ws`**.

**Operational rules:**

- You **cannot** switch modes while a reply is **streaming** (buttons disabled; server also guards with **`ws.data.busy`**).

---

## 4. “Planning multi-agent army” — intent vs implementation

| Layer | What happens |
|--------|----------------|
| **Intent (product language)** | Plan mode is where you **design** work: documentation, structure maps, phased tasks, and **delegation patterns** (who would scout, who would review the plan). |
| **Web UI today** | **One** chat stream with a **merged system prompt** — same model connection as Build, with extra planner instructions in Plan. This is **persona + instructions**, not **`dispatch_agent`**. Frontmatter **`tools:`** on agents does **not** enable Pi tools in the browser. See **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)**. |
| **Pi TUI (full parity)** | Use **`planner`** (or **agent-team** rosters) so specialists run with **real tool allowlists** and **separate sessions** as designed. |
| **Future web** | Orchestration and per-agent streams are tracked under **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** and wiring **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**. |

---

## 5. Practical playbook

1. **Start in Plan** for anything multi-file or ambiguous: state the outcome, constraints, and what you already know; paste key files or tree snippets if needed.
2. **Create a plan file** — **Planning** activity → **New plan file…**, **Settings → New plan file (plans/PLAN-…)…**, or the command palette (**File: New plan markdown**). That writes **`plans/PLAN-YYYYMMDD-<slug>.md`** via **`PUT /api/file`** with a structured template (overwrites if the path already exists). Or paste a model reply into **`plans/`** yourself.
3. **Switch to Build** (or a **builder**-oriented workspace agent) and refer to the saved plan: “Implement §3–5 from `plans/PLAN-…md`.”
4. **Settings** (and the command palette) also expose **Chat mode: Build** / **Chat mode: Plan** when the menu bar is available.
5. For **deep repo recon** without pasting everything, run **Pi** in the same workspace with **`planner`** / **`scout`** and optional **agent-team** — then bring summaries back into the web chat if you like.

---

## 6. Related docs

| Doc | Topic |
|-----|--------|
| **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)** | Workspace agents, web vs **`dispatch_agent`** |
| **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** | **`set_chat_mode`** in the WebSocket map |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | Shell components and **Planning** activity |
| **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** | Plan vs build row (shipped baseline) |
| **[AGENTS.md](AGENTS.md)** | **`planner`**, **`scout`**, teams |

**Last updated:** 2026-04-11
