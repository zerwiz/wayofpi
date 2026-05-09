# Way of Pi — product capabilities

**Purpose:** A single, readable map of **what the product can do today**, what is **partially wired**, and where **deeper Pi parity** is planned. For implementation detail, follow the links; this file stays summary-sized. For a **narrative onboarding** (vision, journeys, doc map), see **[WOP_PRODUCT_OVERVIEW.md](WOP_PRODUCT_OVERVIEW.md)**.

**Repository:** [github.com/zerwiz/wayofpi](https://github.com/zerwiz/wayofpi)

**Last updated:** 2026-04-11

---

## 1. What is Way of Pi? (simple words)

**Pi Coding Agent** is a coding assistant you usually meet in a **terminal** (text screen). It can **read**, **edit**, and **write** files and run **shell** commands in a project, and you can grow it with **extensions**, **skills**, and **agents** (see upstream docs for the full story).

**Way of Pi** is a **desktop or browser app** built around the same ideas: you **open a folder** (your **workspace**), you **chat**, and you get a **file tree and editor** next to the conversation. The app is meant to **wire to Pi** for real tool and extension runs when you enable that path — not to replace Pi with a hidden copy. Details: **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**.

### Two parts (like a game console)

| Part | Plain explanation |
|------|-------------------|
| **Pi (the engine)** | The "brain" that follows instructions, calls tools, and can load extensions — today often the **`pi`** CLI or headless **`pi --mode json`**. |
| **Way of Pi (the shell)** | The "screen" you click around in: panes, docks, chat, and safe **workspace file APIs** on the server. |

### When the assistant can "touch" your project

Sometimes the model only **talks**. Other times it can **use tools** to read or change files **inside the workspace folder you opened** (for example when **orchestrator tools** are on in the Bun server, or when **`WOP_CHAT_ENGINE`** is **`pi`** / **`auto`** and the **Pi** CLI is installed so the turn runs in Pi). That is powerful: treat the workspace like a **sandbox** you chose, read prompts before approving risky steps, and keep secrets out of the repo.

### What people use it for (examples)

| Who | Example uses |
|-----|----------------|
| **Students and learners** | Walk through a small program, fix errors, and read explanations with the project open beside chat. |
| **Solo developers** | Build features, refactor, and keep **`plans/`** or **`README`** files updated next to the code. |
| **Teams and companies** | Share one **git** playbook repo: same **`.pi/agents`**, **`teams.yaml`**, extensions, and internal docs so everyone follows the same rules (each person still uses their own machine and API keys). |
| **Pi authors** | Try extensions and skills in the **playground**, then use Way of Pi to **edit and chat** in the same tree. |

These are **patterns**, not guarantees: always match behavior to your **settings**, **environment**, and **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** for current gaps.

### What is Way of Pi? (The simplest version)

Imagine you have a super-smart robot named **Pi** that is amazing at writing computer code. Usually, to talk to this robot, you have to type commands into a boring black box with green text (the **terminal**).

**Way of Pi** is like giving that robot a **control center** with buttons, windows, and a file browser so it is much easier to work with.

#### 1. The two main parts

Think of Way of Pi like a **video game console**:

| Piece | What it is |
|-------|----------------|
| **The brains (Pi agent)** | The part that does the actual thinking. It knows how to code, fix errors, and follow instructions. In this repo that is the **Pi Coding Agent** (often the **`pi`** CLI). |
| **The screen (Way of Pi shell)** | The app you see on your computer: a **chat** window, a place to look at your **folders**, and controls for how the agent behaves. |

#### 2. What can you do with it?

**Build “superpowers” for your AI**

If you were playing Minecraft, you might install **mods** to get new items. In Way of Pi, you can write **extensions** — like mods for your AI helper that teach it new **tools** or workflows. See **[EXTENSIONS.md](EXTENSIONS.md)** and **[CONCEPTS.md](CONCEPTS.md)**.

**Hire a “team” of bots**

Instead of just one AI, you can set up a **team**: one persona for finding issues, another for planning, and so on. They are defined as **agents** and **teams** in your workspace (for example **`.pi/agents/`** and **`teams.yaml`**). See **[AGENTS.md](AGENTS.md)** and **[AGENT_TEAMS.md](AGENT_TEAMS.md)**.

**A better way to code**

Often people copy code into a website chat. With Way of Pi, the AI is already **inside the folder you opened** as the **workspace**, so it can see how files fit together (within **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** rules: the server exposes the workspace roots you chose, not random paths).

#### 3. Special feature: “Claw” capabilities

Think of the **Claw** like a **robotic arm** attached to your AI. Without tools, the model might only **talk**. With real **tools** (read, edit, bash, extensions, and — when enabled — **Pi** driving the turn), it can **act** on your project: organize files, apply edits where it found a problem, and run multi-step work you approve.

*Today:* **Claw** is also a **UI mode** in the app (same IDE-style shell as **Technical**, plus a roadmap banner). *Tomorrow:* more **autonomous** and scheduled flows are planned without bypassing Pi — see **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)** and **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**.

#### 4. Keeping track of everything (documentation)

Way of Pi is not only for writing code; it fits a workflow where you **explain how things work**.

- **For you (user / project docs):** Keep **effort** and handoff notes (for example under **`projects/<slug>/`** from **`projects/_template/`** — see **`projects/README.md`**).
- **For teams (shared playbook):** A **git** repo can hold the same **`.pi/`** agents, extensions, and guides so everyone shares **rules** and setups (each machine still uses its own keys; see **§1** table above).

#### 5. Who uses this?

| In plain words | Who they are |
|----------------|--------------|
| **The creators** | People experimenting with the **next** AI-assisted workflows and extensions. |
| **The builders** | People shipping apps or sites who want a helper that **sees the whole project**. |
| **The tech wizards** | People who love a **fast, customizable** desktop setup. |

For a shorter **operator-focused** audience list, see **Section 3** below.

#### 6. Why is it helpful?

- **Easier to see:** Files and chat **side by side** instead of only a text stream.
- **Fast:** The shell talks to your workspace through **local** APIs (`/api`, `/ws`) on your machine.
- **Private when you want it:** You can use **local models** (for example **Ollama**) so sensitive work stays on your hardware; match that to your **env** and **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**.

**In short:** Way of Pi turns a **command-line** coding agent into a **point-and-click** workspace for building software — with a clear path toward **full Pi parity** when you turn on the right engine settings.

---

## 2. Capability matrix (summary)

Legend: **Shipped** = usable end-to-end in normal setup · **Partial** = works with constraints or interim path · **Planned** = documented roadmap, not a promise of date.

### 2.1 Pi playground (CLI / TUI)

| Capability | Status | Notes |
|------------|--------|--------|
| Custom **extensions** (`extensions/` + **`.pi/extensions/`** shims) | **Shipped** | Loaded per **`.pi/settings.json`** when you run Pi from the workspace. |
| **Skills** (`SKILL.md` under **`.pi/skills/`**) | **Shipped** | **`/skill:name`** and agent integration; see **[SKILLS.md](SKILLS.md)**. |
| **Agents** (`.md` under **`.pi/agents/`**, **`teams.yaml`**) | **Shipped** | **`system-select`**, **`agent-team`**, **`agent-chain`**, domain specialists; see **[AGENTS.md](AGENTS.md)**, **[AGENT_TEAMS.md](AGENT_TEAMS.md)**. |
| **`just` / `ppi` launchers**, global **`install-global`** | **Shipped** | **[scripts/README.md](../scripts/README.md)**, root **[README.md](../README.md)**. |
| **`projects/<slug>/`** effort docs | **Shipped** | Template under **`projects/_template/`**; see **`projects/README.md`**. |
| **Hermes / Honcho** integration docs and recipes | **Shipped** | **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)**, **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)**. |

### 2.2 Way of Pi shell (UI + server)

| Capability | Status | Notes |
|------------|--------|--------|
| **Electron desktop** (recommended dev flow) | **Shipped** | **`./start-wayofpi-electron.sh`**, **`just wayofpi-electron`** — same **`/api`** / **`/ws`** as browser via Vite proxy. **[apps/wayofwork-ui/README.md](../apps/wayofwork-ui/README.md)**. |
| **Browser dev** | **Shipped** | **`./start-wayofwork-ui.sh`**. |
| **Simple / Technical / Claw UI** toggle | **Shipped** | Chat-first vs IDE-style chrome; **Claw** reuses Technical shell with a roadmap banner — **[WOP_CLAW_MODE_PLAN.md](WOP_CLAW_MODE_PLAN.md)**, **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)** (interface plan), **[WOP_SIMPLE_UI_VIEWS.md](WOP_SIMPLE_UI_VIEWS.md)**, **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**. |
| **Technical workspace grid** (up to 3×4 panes, persistence, DnD) | **Shipped** | **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**. |
| **Workspace file tree + editor** (text + markdown preview, binary read via base64) | **Shipped** | Jailed **`/api/tree`**, **`/api/file`**; workspace roots from **`WOP_WORKSPACE`** / folder pick — not "active tab = root." **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**. |
| **Chat** with **local Ollama / OpenRouter** (Bun path) | **Shipped** | Interim direct-LLM bridge; tools/orchestrator shims optional. **`WOP_CHAT_ENGINE`** unset or provider-only paths. |
| **Chat** routed through **`pi --mode json`** | **Partial** | **`WOP_CHAT_ENGINE=pi`** or **`auto`** when **`pi`** resolves — full Pi **extensions**, **tools**, **`dispatch_agent`** for that turn. Missing: long-lived Pi + WebSocket tunnel (roadmap). **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** section 2.5. |
| **Workspace agents catalog** (`GET /api/agents`) | **Shipped** | Filesystem parity with Pi-style scan + **`teams.yaml`**. |
| **Merge agent persona into chat system prompt** | **Partial** | Parity with TUI "pick a persona" style; **not** subprocess **`dispatch_agent`** from the UI yet. **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)**. |
| **Static manifest** (`GET /api/manifest`) | **Partial** | Lists **`extensions[]`** paths from disk; **empty** tool/slash lists until runtime Pi introspection ships. **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**. |
| **Host shell terminal** (`/ws/terminal`) | **Partial** | Opt-in **`WOP_ALLOW_TERMINAL`**; policy alignment with Pi approvals is ongoing. |
| **Diagnostics / health** | **Shipped** | **`/api/diagnostics`**, **`/api/health`** — workspace, env, Ollama probe, **`pi`** version when available. |
| **Upstream Pi version lock / sync scripts** | **Shipped** | **`just wop-upstream-check`**, **`just wop-upstream-sync`**; **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)**. |
| **Multi-agent orchestration in the browser** (per-agent streams, real **`dispatch_agent`** from UI) | **Planned** | Contract: **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**; gaps: **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)**. |

---

## 3. Who this is for

| Audience | Typical use |
|----------|-------------|
| **Extension and Pi authors** | Iterate on **`extensions/*.ts`**, **`.pi/settings.json`**, agents, and skills; use TUI or **`WOP_CHAT_ENGINE=pi`** to validate real Pi behavior. |
| **Application developers** | Open a **project folder** as workspace; edit, search, chat, and (when enabled) run scripts/terminals with clear **host vs Pi** boundaries. |
| **Operators / integrators** | Tune **`WOP_*`**, **`WOP_PI_BINARY`**, **`WOP_HOME`**, Ollama/OpenRouter env; read **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** and **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** for isolation and packaging notes. |

---

## 4. Boundaries and non-goals (today)

- The Bun server **does not** fully replace Pi’s runtime: interim **`server/chat.ts`** paths are **not** feature parity with **`registerTool`**, extension hooks, or **`dispatch_agent`** unless **`WOP_CHAT_ENGINE`** routes the turn through **`pi`**. **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**.
- **Workspace root** is defined by server **`listWorkspaceFolders()`** / **`WOP_WORKSPACE`**, not by whichever file tab is focused. **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**.
- UI controls that imply Pi ran a tool **must** be backed by Pi (or labeled stub). Rule: **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**.

---

## 5. Where to go next

| Need | Document |
|------|----------|
| Planning hub and roadmap links | **[WOP_PLANNING.md](WOP_PLANNING.md)** |
| Phased Pi wiring (API/WS matrices) | **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** |
| Living backlog and stubs | **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** |
| Shell layout, grids, docks | **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**, **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** |
| Repo folder map | **[REPO_INDEX.md](REPO_INDEX.md)** |
| Concepts (extension vs skill vs agent vs tool) | **[CONCEPTS.md](CONCEPTS.md)** |

---

## 6. Maintenance

When a capability **ships** or a **gap** closes, update **this file's tables** in the same change as **[CHANGELOG.md](../CHANGELOG.md)** (if user-visible) and adjust **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** so the three stay aligned.

### 7. Governance (CABA)

The **CABA** framework (Capability Assurance & Boundedness Architecture) governs how new capabilities are introduced and reviewed. Ensure that any new capability added to this repository is documented in the CABA checklist and logged in `CABA.md`. This provides traceability and consistency across the product roadmap.