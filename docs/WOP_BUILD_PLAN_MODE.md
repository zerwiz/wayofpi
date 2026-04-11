# Way of Pi — Build vs Plan chat mode

**Purpose:** How to use the **Build** | **Plan** toggle in **`wayofpi-ui`**, how it relates to **Cursor-style Plan Mode**, and what **Way of Pi** adds or limits today.

**Code:** WebSocket **`set_chat_mode`** and system composition live in **`apps/wayofpi-ui/server/index.ts`** and **`apps/wayofpi-ui/server/session-prompts.ts`**. UI: **`ChatPanel`**, **`SimpleChatView`**, **`PlanningSidePanel`** (`TechnicalSidePanels.tsx`), **Settings** menu (Build/Plan + new plan file), status hint in **`StatusBar`**. Path/template helpers: **`src/utils/planModeArtifacts.ts`**, **`src/utils/planModeWorkspace.ts`**, **`GET /api/plans`** (`server/plans-catalog.ts`), composer inject bus **`src/utils/chatComposerInjectBus.ts`** (command palette + **From plan** / **Review plan** buttons).

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
| **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** | Plan vs build row (shipped baseline); editor, palette, and AI shell parity rows |
| **[WOP_SIMPLE_UI_VIEWS.md](WOP_SIMPLE_UI_VIEWS.md)** | Simple mode **View → Workspace views** catalog (**`.wayofpi/ui-views.json`**) — add menu rows that open **`plans/`** or **Planning** |
| **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** | Spine work (headless Pi chat, **`/api/manifest`**, tools) that unlocks research-heavy Plan mode in the browser |
| **[AGENTS.md](AGENTS.md)** | **`planner`**, **`scout`**, teams |

---

## 7. Cursor-inspired backlog (document only)

This section records **product ideas** aligned with how **[Cursor Plan Mode](https://cursor.com/blog/plan-mode)** is described publicly (research → clarify → **editable Markdown plan** → build; see also **[Cursor Docs — Agent modes / planning](https://cursor.com/docs/agent/modes)**). Nothing here is a commitment; implementation tickets should stay in **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)**, **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)**, and **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**.

| Idea | Cursor (public framing) | Way of Pi today | Likely direction |
|------|-------------------------|-----------------|------------------|
| **Tool-backed research in Plan** | Agent reads the repo while planning | Browser chat is **prompt-only** for tools; recon is **you paste**, **open files**, or **Pi TUI** | **Headless Pi** chat path so Plan mode can use real **`read` / `grep` / …** with the same safety story as the TUI (**[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**) |
| **Clarifying questions as a phase** | Model asks questions before locking the plan | Same thread; no separate “Q&A round” UI | Optional: structured **pending questions** strip, or a slash template **`/plan-interview`** that posts a checklist the user fills |
| **Dedicated plan surface** | Interactive plan editor alongside chat | Plans are normal workspace **`plans/PLAN-*.md`** files + **Planning** activity / template (**`planModeArtifacts.ts`**) | Split **plan preview** dock pinned to latest **`plans/`** file; or open plan in a **WorkspacePane** while chat stays visible (**[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)**) |
| **Fast mode switch** | **Shift+Tab** in the agent input (per Cursor blog) | **Build / Plan** toggle, **Settings**, slash **`/plan`** / **`/build`** on **`/ws`** | User-chosen keybinding in **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** (keyboard shortcuts row) |
| **Auto-suggest Plan** | Cursor can suggest Plan mode for complex tasks | User chooses mode explicitly | Client heuristic (message length, “implement whole”, multi-file verbs) → toast “Switch to Plan?” |
| **Build from this plan** | One action to start implementation from the saved plan | User types “Implement §… from `plans/…`” | Button or palette command: **inject** plan path + optional outline into the chat input (still **Build** mode + approvals for edits) |
| **Todos inside the plan** | Edit add/remove todos in the plan UI | Markdown **`- [ ]`** in the file only | Optional: parse checkboxes in **`plans/`** for a **progress** chip in the chat header; no second source of truth |
| **Repo-local plan folder** | Team convention (e.g. under **`.cursor/`** in some setups) | Canonical **`plans/PLAN-YYYYMMDD-<slug>.md`** | Keep **`plans/`** as the portable handoff path; document symlink or copy if a team standardizes elsewhere |
| **Plan critique pass** | (Often manual: second agent) | **`plan-reviewer`** exists in **`.pi/agents/`** for **Pi TUI** | Web: pick **`plan-reviewer`** from the workspace agent menu in **Plan** mode, or add palette **“Review open plan”** that loads **`plans/*.md`** into context |

**Shipped (UI, browser shell):** **`Shift+Tab`** in the chat composer toggles **Build / Plan** (when slash completion is not active). **Heuristic nudge** after a long Build-mode send suggests switching to Plan. **`/plan-interview`** returns a fill-in questionnaire (assistant message). **From plan** / **Review plan** inject handoff text for the latest **`plans/PLAN-*.md`** (**`GET /api/plans`**). Command palette: **Chat: Insert Build handoff from latest plan**, **Insert review prompt…**, **Set plan-reviewer + review latest plan** (technical shell). Plan-mode **todo chip** uses Markdown **`- [ ]` / `- [x]`** counts from the latest plan file.

**Simple mode:** **Build / Plan** and the workspace agent picker use the same session wiring as the technical shell; only chrome differs (**`SimpleChatView.tsx`** vs **`ChatPanel.tsx`**). Use **[WOP_SIMPLE_UI_VIEWS.md](WOP_SIMPLE_UI_VIEWS.md)** to surface **Planning** or a pinned **`plans/`** file from **View → Workspace views**.

**Last updated:** 2026-04-11
