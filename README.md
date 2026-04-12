# Way of Pi — Pi extension playground

**Source repository:** [github.com/zerwiz/wayofpi](https://github.com/zerwiz/wayofpi)

## Introduction

### Start here (plain English)

Picture a **really good tutor for computer projects**. That tutor is **Pi** — short for **[Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent)**, software that can read your files, suggest edits, and answer questions. A lot of people talk to Pi inside a **terminal**: green or white text on a black screen, like a chat in a movie from the 1980s.

**Way of Pi** is the **friendly wrapper** around the same idea. Instead of only typing in a tiny box, you get a **normal app**: a **chat** on one side, a **list of folders and files** on the other, and a **place to type code** — a bit like Google Docs, but for a whole programming folder you **chose to open**. The app is careful to work **inside that folder** (your **workspace**), not everywhere on your computer, so you stay in control.

The **same project** is also a **playground** for people who like to **tune** how Pi works. You can add **extensions** (small programs that teach Pi new tricks), **skills** (checklist-style recipes you run on purpose, often with **`/skill:name`**), and **agents** (different “job hats” — planner, builder, safety checker, and more). A team can put those files in **git** so everyone gets the **same playbook**.

### Two pieces that work together

Think of a **game console**: the **TV** is not the same thing as the **computer inside the box**, but you need both.

| Piece | Easy name | What it does |
| ----- | --------- | ------------- |
| **Pi** | the **engine** | Does the thinking: reads your question, looks at files when allowed, and can run **tools** (read, edit, commands) **when your setup turns that on**. |
| **Way of Pi** | the **shell** | What you **click and see**: tabs, panes, the file tree, the editor, and buttons. It also runs a small **server** that safely serves **your opened folder** to the UI. |

When people say **“headless Pi”**, they mean Pi running **without** the old full-screen terminal UI — still the real Pi program, driven by the Way of Pi app.

### Words you might see once

- **Workspace** — The **one project folder** you opened. Not “any file on the disk,” and not “whatever random tab is open.”
- **Extension** — A **TypeScript** file that **hooks into Pi** to add tools, commands, or UI behavior.
- **Skill** — A **written recipe** (often under **`.pi/skills/`**) you trigger with something like **`/skill:name`**.
- **Agent** — A **saved personality** (markdown under **`.pi/agents/`**) with a name, a short job description, and rules for which tools it may use.
- **Electron** — A way to run the app as a **desktop window** on your laptop (recommended here), instead of only inside a browser tab.

### What you can do with it

- **Work with your real project open** — You pick a folder; chat and file actions stay **tied to that folder** (through the server and Pi settings), instead of copying code into a random website that never saw your files.
- **Teach Pi new habits** — Turn on **extensions**, **skills**, **agents**, and **teams** from **`.pi/`** and **`extensions/`**. Put the repo in **git** so teammates share the same agents and docs — see **[docs/CONCEPTS.md](docs/CONCEPTS.md)** and **[docs/EXTENSIONS.md](docs/EXTENSIONS.md)**.
- **Chain specialists** — One flow can **hand work off**: plan, then build, then review; or use helpers like **project-scanner**, **Ralph** tickets, **`/skill:github`**, and **git worktrees** — see **[docs/AGENTS.md](docs/AGENTS.md)** and **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)**.
- **Choose how busy the screen is** — **Simple** keeps the layout calm. **Technical** adds IDE-style panels and an optional big grid. **Claw** is for an operator-style layout (missions, schedules, channels, and similar tabs). Browser or **Electron** — see **[docs/WOP_PRODUCT_OVERVIEW.md](docs/WOP_PRODUCT_OVERVIEW.md)**. For **what already works vs what is still being wired** (including running chat through the real **`pi`** CLI with **`WOP_CHAT_ENGINE`**), see **[docs/WOP_PRODUCT_CAPABILITIES.md](docs/WOP_PRODUCT_CAPABILITIES.md)**.
- **Optional Honcho memory stack** — Run **[Honcho](https://docs.honcho.dev)** as a separate HTTP **memory / context** service so clients like **Hermes** can store and query structured data across sessions; Pi can **mirror** finished chat turns into Honcho with the **`honcho-mirror`** extension when **`HONCHO_*`** / **`~/.honcho/config.json`** match your stack. Start with **[docs/HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md)** and **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)**. In the Way of Pi shell: **Settings → Honcho (memory API)…** for a short **plain-language + install** sheet; **Help → How to use… → Honcho & memory** for the longer integration notes and how this differs from Pi’s session JSONL.

### A little more detail (same repo, technical view)

**Way of Pi** is this repository: a **desktop or browser shell** for working in a real **project folder** with **Pi** — chat, file tree, editor, and (depending on mode) terminals, docks, and tool visibility — plus the same tree as a **Pi extension playground** (TypeScript **extensions**, **`/skill:…`**, **`.pi/agents/`**, **teams**, and docs) so you can customize **UI**, **orchestration**, **safety / review flows**, and **cross-agent** behavior.

### What this repository contains

**[apps/wayofpi-ui/](apps/wayofpi-ui/)** (the Way of Pi web shell you run in a browser or Electron), **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)** (roadmap hub), a **[full doc index](docs/README.md)**, **`projects/`** for per-codebase notes, **project-scanner** / **ralph** flows, **`/skill:github`** + git worktrees, and **Cursor rules** under **`.cursor/rules/`**.

---

## What lives here (system map)

Treat the repo as **two cooperating products** in one tree:

| Layer | What it is | Where | Read next |
| ----- | ---------- | ----- | --------- |
| **Pi extension playground** | Customize **[Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent)** with TypeScript **extensions**, **`.pi/settings.json`**, **skills**, **`.pi/agents/`**, **`teams.yaml`**, **`just` / `ppi`** recipes | **`extensions/`**, **`.pi/`**, **`agent/`** | **[docs/README.md](docs/README.md)** (master list), **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** (folder map), **[docs/CONCEPTS.md](docs/CONCEPTS.md)** (skills vs agents vs extensions vs tools) |
| **Way of Pi (web shell)** | **Electron** (recommended) or **browser** UI: workspace tree, editor, chat, optional terminal; **`WOP_*`** env for isolation and Pi binary | **`apps/wayofpi-ui/`** | **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)** (boot, ports, APIs), **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)** (layout, docks, grid) |
| **Product truth** | What is **shipped**, **interim**, or **planned**; how the shell **must** converge on **headless Pi** for real tools (no duplicate “mini Pi” in Bun) | **`docs/WOP_*.md`** | **[docs/WOP_PRODUCT_CAPABILITIES.md](docs/WOP_PRODUCT_CAPABILITIES.md)** (status matrix), **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](docs/WOP_PI_BACKEND_WIRING_PLAN.md)** (API map, parity lock) |

**Planning hub** (all Way of Pi roadmaps linked in one place): **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)**. **Living gaps / stubs:** **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)**. **Env and naming** (`WOP_*`, workspace vs install path): **[docs/WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)**.

<p align="center">
  <img src="./images/pi-logo.svg" alt="Way of Pi — Pi extension playground" width="520">
  <br>
  <strong>Way of Pi — Pi extension playground</strong>
</p>

---

## Prerequisites

All three are required:

| Tool            | Purpose                   | Install                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| **Bun** ≥ 1.3.2 | Runtime & package manager | [bun.sh](https://bun.sh)                                   |
| **just**        | Task runner (for `just …` / `ppi …` recipes) | **macOS:** `brew install just` · **Ubuntu/Debian:** `sudo snap install just` or [cargo](https://github.com/casey/just#installation) · See [just releases](https://github.com/casey/just/releases) |
| **pi**          | Pi Coding Agent CLI       | [Pi docs](https://github.com/mariozechner/pi-coding-agent) |

**Automated probe / optional Bun + npm install:** see **[Installation](#installation)** below. Flag reference: **[scripts/README.md](scripts/README.md)**.

---

## API Keys

Pi does **not** auto-load `.env` files — API keys must be present in your shell's environment **before** you launch Pi. A sample file is provided:

```bash
cp .env.sample .env   # copy the template
# open .env and fill in your keys
```

`.env.sample` covers the four most popular providers:

| Provider         | Variable             | Get your key                                                                                               |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| OpenAI           | `OPENAI_API_KEY`     | [platform.openai.com](https://platform.openai.com/api-keys)                                                |
| Anthropic        | `ANTHROPIC_API_KEY`  | [console.anthropic.com](https://console.anthropic.com/settings/keys)                                       |
| Google           | `GEMINI_API_KEY`     | [aistudio.google.com](https://aistudio.google.com/app/apikey)                                              |
| OpenRouter       | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys)                                                                |
| Many Many Others | `***`                | [Pi Providers docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md) |

### Sourcing your keys

Pick whichever approach fits your workflow:

**Option A — Source manually each session:**
```bash
source .env && pi
```

**Option B — One-liner alias (add to `~/.zshrc` or `~/.bashrc`):**
```bash
alias pi='source $(pwd)/.env && pi'
```

**Option C — Use the `just` task runner (auto-wired via `set dotenv-load`):**
```bash
just pi           # .env is loaded automatically for every just recipe
just ext-minimal  # works for all recipes, not just `pi`
```

**Standard Pi (no project extensions):** Upstream Pi’s **minimal harness** skips loading **extensions / skills / themes / prompt templates** from **`settings.json`** when you pass [**`--no-extensions --no-skills --no-themes --no-prompt-templates`**](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) (see *CLI Reference* → *Resource Options*). This repo wraps that as **`scripts/pi-standard`** / **`just pi-standard`** / **`~/.local/bin/pi-standard`** (after **`install-global`**). A leading **`.`** is ignored if you type **`pi-standard .`**. Stock **`pi .`** does not treat **`.`** specially — it is not the same as standard mode.

---

## Installation

**Platforms:** Shell entrypoints (**`./start-*.sh`**, **`just`**) assume **Linux**, **macOS**, or **WSL** with **bash**. On native **Windows**, use **WSL2** for the same flow, or install **[Bun](https://bun.sh)** and **[Node.js](https://nodejs.org)** yourself and follow **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)**.

### 1. Clone the repository

```bash
git clone https://github.com/zerwiz/wayofpi.git
cd wayofpi
```

### 2. Check or install dev tools (recommended)

From the repo root, run the **bootstrap** script. It prints **OS / CPU**, what is already on your **`PATH`**, and **copy-paste** commands for missing tools. It **does not run `sudo`** or package managers unless you ask it to install **Bun** / **npm** deps (see table).

```bash
chmod +x ./scripts/bootstrap-wayofpi-environment.sh
./scripts/bootstrap-wayofpi-environment.sh
```

| Goal | Command |
| ---- | ------- |
| Report only (default) | `./scripts/bootstrap-wayofpi-environment.sh` |
| **CI:** fail if **bun**, **git**, **node**, **npm** missing or Bun too old for the UI | `./scripts/bootstrap-wayofpi-environment.sh --check-only` |
| Install **Bun** (official [bun.sh](https://bun.sh) script) + **`npm install`** in **`apps/wayofpi-ui`** | `./scripts/bootstrap-wayofpi-environment.sh --install -y` |
| Create **`.env`** from **`.env.sample`** if **`.env`** is missing | `./scripts/bootstrap-wayofpi-environment.sh --init-env` |

**`just bootstrap-wayofpi`** runs the same probe **without** extra flags (pass **`--check-only`** / **`--install`** by invoking the script path above). More detail: **[scripts/README.md](scripts/README.md)**.

### 3. Install playground dependencies (root)

```bash
bun install
```

### 4. Install Way of Pi UI dependencies

```bash
cd apps/wayofpi-ui
npm install
cd ../..
```

Skip this if you already ran **`./scripts/bootstrap-wayofpi-environment.sh --install -y`** (it runs **`npm install`** in **`apps/wayofpi-ui`**).

### 5. API keys and run the app

Copy **`.env.sample`** → **`.env`** and add keys (see **[API Keys](#api-keys)** above). Then start the **Electron** shell from the repo root (recommended):

```bash
./start-wayofpi-electron.sh
```

Or **`just wayofpi-electron`**. **Browser dev:** **`./start-wayofpi-ui.sh`**. Ports, **`WOP_*`** env, and production: **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)**.

**Optional — global `ppi` / `pi-e` shims** on your **`PATH`**: **`./scripts/install-ppi-global.sh`** or **`just install-global`** (see **[scripts/README.md](scripts/README.md)**).

### Ollama (this repo’s defaults)

Pi is pointed at **local Ollama** (`http://localhost:11434/v1`) with **`agent/models.json`** listing the chat models pulled on this machine. **Default model:** **`qwen3.5:9b-32k`** (see **`agent/settings.json`**). Change **`defaultModel`** or add/remove entries in **`agent/models.json`** and **`pi.config.json`** to match `ollama list`. **Embedding-only** models (e.g. **`mxbai-embed-large`**) are omitted from the chat picker. For a remote Ollama host, set the base URL in **`agent/models.json`** / [`Pi models docs`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md).

### OpenRouter

Set **`OPENROUTER_API_KEY`** in **`.env`** (see **`.env.sample`**). The **`openrouter`** block in **`agent/models.json`** points at **`https://openrouter.ai/api/v1`** and merges with Pi’s **built-in OpenRouter model list**—use **`/model`** or e.g. **`--model openrouter/google/gemini-3-flash-preview`** (same pattern as **`extensions/agent-team.ts`** defaults). This playground does **not** register the native **`openai`** provider in **`agent/models.json`** or **`pi.config.json`** (no **`OPENAI_API_KEY`** required for the stock picker); add it back if you want **`api.openai.com`** models.

**Why `/model` (Ctrl+L) may not show Ollama first:** The picker sorts by **`provider` name** (see [`model-selector.ts` `sortModels`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/modes/interactive/components/model-selector.ts)), so **`anthropic`**, **`google`**, and any other configured provider whose name sorts **before** **`ollama`** appears **above** your local models. Within one provider, order is the merge order from Pi’s registry (for **OpenRouter**, that is a very large catalog — **`pi.config.json` only adds/overrides entries, it does not reorder the full built-in list** in “all models” mode).

**Ollama → free OpenRouter → paid OpenRouter (scoped picker):** Run **`just pi-picker-ollama-free-or`**, which runs **`pi --models "$(bun scripts/pi-models-scoped-priority.ts)"`**. That limits **`/model`** to models you actually list: all **`ollama/*`** from **`agent/models.json`**, then **`:free`** OpenRouter rows from **`pi.config.json`**, then remaining OpenRouter rows there. Toggle **scoped \| all** with **Tab** in the picker if your Pi build supports it — scoped is the useful mode for this list. **`Ctrl+P`** cycles within the same **`--models`** set.

**Reference ordering in git:** **`pi.config.json`** lists **Ollama** block first, then **OpenRouter `:free`**, then other **OpenRouter**; **`just pi-cycle-or-free-first`** is a hand-written **`--models`** chain (OpenRouter + Ollama; no native OpenAI).

**Loading the key:** **`scripts/ppi`** and **`just`** (from this repo) source **`.env`** before launching **`pi`**, so **`ppi pi`**, **`just pi`**, and **`ppi-<recipe>`** pick up **`OPENROUTER_API_KEY`** automatically. For a bare **`pi`** command, use **`scripts/pi-with-env`** (see **`scripts/README.md`**).

---

## Way of Pi web UI

**Recommended — Electron desktop:** from repo root run **`./start-wayofpi-electron.sh`** or **`just wayofpi-electron`** (same as **`WOP_USE_ELECTRON=1 ./start-wayofpi-ui.sh`**). Starts Bun (**`WOP_SERVER_PORT`**, default **3333**), Vite (**5173**), and opens an **Electron** window on **`WOP_ELECTRON_DEV_URL`** (default **`http://127.0.0.1:5173/`**) so **`/api`**, **`/ws`**, **`/api/manifest`**, and **`/ws/terminal`** use the **same Vite → Bun proxy** as a normal browser session.

**Browser dev:** **`./start-wayofpi-ui.sh`** or **`./start-full-system.sh`** waits for **5173**, then opens your default browser (**`WOP_UI_URL`**, default **`http://localhost:5173/`**).

Scripts prepend **`~/.bun/bin`** to **`PATH`**; install **[Bun](https://bun.sh)** if **`bun`** is missing. They source repo **`.env`** when present and set **`WOP_WORKSPACE`** to the playground root unless already exported. Full setup, API table, production Electron, terminal env: **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)**.

### Honcho (optional cross-session memory)

**Simple picture:** Honcho is a **shared binder** other programs can read and write over the web (HTTP): a **workspace** is which binder, **peers** label you vs an assistant, **sessions** are conversation threads. Pi still uses its normal in-session memory (**[docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md)**); **Honcho** is an **extra** store so **Hermes** (and similar clients) can reuse the same memory across days and tools. The **`honcho-mirror`** extension **copies** finished Pi turns into Honcho when the API is reachable; if Honcho is down, Pi keeps working (you may see one mirror warning).

**Honcho is not installed by cloning Way of Pi.** Install **[Docker](https://docs.docker.com/get-docker/)**, then clone and start the **official** server (folder name is yours; many docs use **`~/honcho-server`**):

```bash
git clone https://github.com/plastic-labs/honcho.git ~/honcho-server
cd ~/honcho-server
cp .env.template .env
cp docker-compose.yml.example docker-compose.yml
# edit .env (keys, DB) — then:
docker compose up -d
```

Set **`HONCHO_BASE_URL`** (and **`~/.honcho/config.json`** → **`baseUrl`**) to **whatever host:port your compose publishes** (upstream may not use **`18000`**). Optional shortcuts **`just honcho-up`** / **`./scripts/install-honcho-bin.sh`** exist only if **your** Honcho checkout defines them. Managed Honcho: **[app.honcho.dev](https://app.honcho.dev)**.

**Mirror and env (quick):** align **`HONCHO_WORKSPACE`**, **`HONCHO_USER_PEER`**, **`HONCHO_AI_PEER`** with **`~/.honcho/config.json`** and Hermes when sharing one store. **`HONCHO_JWT`** when auth is on. Disable mirror: **`PI_HONCHO_MIRROR=0`** or remove **`honcho-mirror`** from **`extensions[]`** in **`.pi/settings.json`**, then **`/reload`** in Pi.

**In the Way of Pi UI:** **Settings → Honcho (memory API)…** — same cheat sheet as above (install, run, links). **Help → How to use… → Honcho & memory** — deeper notes. **Claw Help** also covers Honcho and memory.

**Canonical guide (full detail, related doc index):** **[docs/HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md)**. Hermes client setup: **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)**. Stack context: **[docs/HONCHO_LOCAL_AI.md](docs/HONCHO_LOCAL_AI.md)**, **[docs/Hermes_Honcho_connection.md](docs/Hermes_Honcho_connection.md)**.

### Recent Way of Pi updates (see [CHANGELOG.md](CHANGELOG.md) — Unreleased)

- **Three UI modes** — Top bar: **Simple** | **Technical** | **Claw**. Persisted as **`wayofpi.uiMode`** in **`localStorage`** (`simple`, `technical`, `claw`). **Simple** (default): chat-first layout, friendly “You / agent” labels, lighter chrome; use **Technical** when you need the file tree, bottom panel, or tool log. **Technical**: full IDE shell (activity bar, explorer, **Tool Log** / Problems / Output, dense status bar) plus **View → Editor Layout → Workspace grid** (see next bullet). **Claw**: operator-oriented shell with its own **nav rail** and tabs (**Mission**, **Chat**, **Team**, **Schedule**, **Channels**, **Files**, **Settings**), optional **`.claw/`** workspace docs, and **Claw Help**; same Bun/Pi workspace and chat engine as the other modes (see **[docs/WOP_CLAW_MODE_PLAN.md](docs/WOP_CLAW_MODE_PLAN.md)** and **[docs/WOP_CLAW_UI_PLAN.md](docs/WOP_CLAW_UI_PLAN.md)**). Plan vs build: **[docs/WOP_BUILD_PLAN_MODE.md](docs/WOP_BUILD_PLAN_MODE.md)**.
- **Technical workspace grid** — **`TechnicalWorkspaceGrid`**: up to **3×4** **`WorkspacePane`** cells (columns × rows), each with its own **`PanelDockLayout`** and file buffer; **View → Editor Layout** presets; persistence **`wayofpi.technical.workspaceGrid.v1`**. Explorer open targets the **focused** cell. **Draggable splitters** between panes resize row/column shares (**`rowWeights`** / **`colWeights`** in the same `localStorage` key). Dropping files, tabs, or pane grips on an **edge snap zone** when the grid is still **1×1** (or on the outer edge of an **N×1** / **1×N** strip) **grows the grid** so the implied neighbor cell exists; **cross-cell** tab drops can target another pane’s **tab bar** for insert-before order. Shell map: **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)**.
- **Modular docks** — Single **Dock** tab strip under the editor stack (legacy upper horizontal tool dock merged into **bottom**); shared **Zed-style** tab chrome, **in-pane** tab drag-and-drop, splitter handles that **follow the pointer**. Roadmap: **[docs/WOP_MODULAR_DOCKS_PLAN.md](docs/WOP_MODULAR_DOCKS_PLAN.md)**.
- **Editor and files** — Markdown **Source / Preview** toolbar; **`GET /api/file`** returns **base64** for images and other binary types; preview strip uses **`apiGet`** + **`AbortController`** so fast tab switches do not show stale reads.
- **Workspace agents** — **`GET /api/agents`** mirrors playground agent discovery; chat can merge a chosen agent body into the system prompt (persona parity with TUI **system-select** style, not subprocess **`dispatch_agent`** yet). Team Pulse roster in chat from **`teams.yaml`**. Plans: **[docs/WOP_WORKSPACE_AGENTS_UI_PLAN.md](docs/WOP_WORKSPACE_AGENTS_UI_PLAN.md)**, **[docs/WOP_MULTI_AGENT_WEBSOCKET.md](docs/WOP_MULTI_AGENT_WEBSOCKET.md)**.
- **Pi integration map** — HTTP/WebSocket inventory and phased wiring: **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](docs/WOP_PI_BACKEND_WIRING_PLAN.md)**.
- **Upstream Pi mirror** — **`just wop-upstream-check`**, **`just wop-upstream-sync`**: **[docs/WOP_UPSTREAM_SYNC.md](docs/WOP_UPSTREAM_SYNC.md)**.
- **Docs and naming** — Way of Pi planning entrypoints use the **`WOP_*`** prefix (**[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)** hub, **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)**, **[docs/WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)**). Gaps and stubs: **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)**.
- **Electron desktop (default product)** — **`./start-wayofpi-electron.sh`** / **`just wayofpi-electron`**; **`npm run electron:*`** in **`apps/wayofpi-ui/package.json`** (see app README § Electron first).

---

## Documentation (how to read this repo)

**Canonical index:** every markdown guide under **`docs/`** is listed with a one-line summary in **[docs/README.md](docs/README.md)**. Use that file when you are not sure which **`WOP_*`** or **how-to** doc applies.

### Start here (pick your goal)

| Goal | Read first |
| ---- | ---------- |
| **Plain-language “what is Way of Pi?”** (non-technical intro) | **[docs/WAY_OF_PI_INTRODUCTION.md](docs/WAY_OF_PI_INTRODUCTION.md)** |
| **Product story** — who it is for, journeys, how playground + shell fit | **[docs/WOP_PRODUCT_OVERVIEW.md](docs/WOP_PRODUCT_OVERVIEW.md)** |
| **Capabilities** — shipped vs partial vs planned; boundaries and links | **[docs/WOP_PRODUCT_CAPABILITIES.md](docs/WOP_PRODUCT_CAPABILITIES.md)** |
| **All roadmaps and WOP plans in one hub** | **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)** |
| **Run the app** (Electron, browser, env, `/api`, WebSocket) | **[apps/wayofpi-ui/README.md](apps/wayofpi-ui/README.md)** |
| **Repo layout** (folders, `.pi/`, gitignore, `projects/_template`) | **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** |
| **Pi concepts** (extensions, skills, agents, tools, memory) | **[docs/CONCEPTS.md](docs/CONCEPTS.md)**, then topic guides below |

### Way of Pi — product and engineering docs

| Doc | Use it for |
| --- | ---------- |
| **[WOP_PRODUCT_OVERVIEW.md](docs/WOP_PRODUCT_OVERVIEW.md)** | Narrative onboarding and doc map |
| **[WOP_PRODUCT_CAPABILITIES.md](docs/WOP_PRODUCT_CAPABILITIES.md)** | **Single source** for “what works today” vs interim Bun chat vs Pi-backed path |
| **[WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)** | Long-form product plan: isolation, MVP, production checklist |
| **[WOP_PI_BACKEND_WIRING_PLAN.md](docs/WOP_PI_BACKEND_WIRING_PLAN.md)** | HTTP/WebSocket inventory; **critical parity rule** (Pi owns agent behavior); phased wiring |
| **[WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)** | **`WOP_*`** env; workspace root vs Way of Pi install vs editor-only state |
| **[WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)** | Shell: Simple / Technical / Claw, grid, docks, persistence keys |
| **[WOP_CLAW_MODE_PLAN.md](docs/WOP_CLAW_MODE_PLAN.md)**, **[WOP_CLAW_UI_PLAN.md](docs/WOP_CLAW_UI_PLAN.md)** | Claw operator mode: roadmap and UI research |
| **[WOP_BUILD_PLAN_MODE.md](docs/WOP_BUILD_PLAN_MODE.md)** | Plan vs build chat workflows and **`plans/`** handoffs |
| **[WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)** | Backlog and known stubs |
| **[WOP_UPSTREAM_SYNC.md](docs/WOP_UPSTREAM_SYNC.md)** | **`just wop-upstream-check`**, **`just wop-upstream-sync`** vs upstream Pi |

### Pi playground — reference and how-to

| Topic | Doc |
| ----- | --- |
| **Playground vs other repos** (`pi-e`, opt-in toolbox) | **[docs/PLAYGROUND.md](docs/PLAYGROUND.md)** |
| **TUI** (shortcuts, thinking toggle, tools expand) | **[docs/TUI.md](docs/TUI.md)** |
| **How to use** agents / extensions / skills / tools | **[docs/HOW_TO_USE_AGENTS.md](docs/HOW_TO_USE_AGENTS.md)**, **[docs/HOW_TO_USE_EXTENSIONS.md](docs/HOW_TO_USE_EXTENSIONS.md)**, **[docs/HOW_TO_USE_SKILLS.md](docs/HOW_TO_USE_SKILLS.md)**, **[docs/HOW_TO_USE_TOOLS.md](docs/HOW_TO_USE_TOOLS.md)** |
| **Deep reference** | **[docs/SKILLS.md](docs/SKILLS.md)**, **[docs/TOOLS.md](docs/TOOLS.md)**, **[docs/AGENTS.md](docs/AGENTS.md)**, **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)**, **[docs/EXTENSIONS.md](docs/EXTENSIONS.md)** |
| **Memory** (JSONL, session-memory, saver, `/remember`) | **[docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md)**, **[docs/SYSTEM.md](docs/SYSTEM.md)** |
| **Hermes / Honcho / local AI stack** | **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)**, **[docs/HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md)**, **[docs/HONCHO_CAPABILITIES.md](docs/HONCHO_CAPABILITIES.md)**, **[docs/HONCHO_OPERATIONS.md](docs/HONCHO_OPERATIONS.md)**, **[docs/Hermes_Honcho_connection.md](docs/Hermes_Honcho_connection.md)**, **[docs/PI_LOCAL_AI.md](docs/PI_LOCAL_AI.md)**, **[docs/HONCHO_LOCAL_AI.md](docs/HONCHO_LOCAL_AI.md)** |
| **Per-project notes** | **[projects/README.md](projects/README.md)** |
| **Changes** | **[CHANGELOG.md](CHANGELOG.md)** |
| **Other plans** | **[docs/PLAN_AWESOME_CODEX_SUBAGENTS.md](docs/PLAN_AWESOME_CODEX_SUBAGENTS.md)**, **[docs/PLAN_AGENT_MODEL_ROUTING.md](docs/PLAN_AGENT_MODEL_ROUTING.md)** |

---

## Extensions

| Extension               | File                                | Description                                                                                                                                                |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pure-focus**          | `extensions/pure-focus.ts`          | Removes the footer bar and status line entirely — pure distraction-free mode                                                                               |
| **minimal**             | `extensions/minimal.ts`             | Compact footer showing model name and a 10-block context usage meter `[###-------] 30%`                                                                    |
| **cross-agent**         | `extensions/cross-agent.ts`         | Scans `.claude/`, `.gemini/`, `.codex/` dirs for commands, skills, and agents; also lists **`.pi/agents/`** recursively for `@name` discovery                                           |
| **purpose-gate**        | `extensions/purpose-gate.ts`        | Prompts you to declare session intent on startup; shows a persistent purpose widget and blocks prompts until answered                                      |
| **tool-counter**        | `extensions/tool-counter.ts`        | Rich two-line footer: model + context meter + token/cost stats on line 1, cwd/branch + per-tool call tally on line 2                                       |
| **tool-counter-widget** | `extensions/tool-counter-widget.ts` | Live-updating above-editor widget showing per-tool call counts with background colors                                                                      |
| **subagent-widget**     | `extensions/subagent-widget.ts`     | `/sub <task>` command that spawns background Pi subagents; each gets its own streaming live-progress widget                                                |
| **tilldone**            | `extensions/tilldone.ts`            | Task discipline — **`tilldone`** tool gates other tools; footer + widget; writes **`.pi/tilldone-checklist.md`** (Markdown `- [ ]` / `- [x]`) on each update for handoffs and agent **`read`** |
| **agent-team**          | `extensions/agent-team.ts`          | Dispatcher: `dispatch_agent` + **team_*** tools — add/remove/**replace** members, **reload** nested **`.md`** agent defs (recursive scan of `agents/`, `.claude/agents/`, `.pi/agents/`), switch teams, save/load **`.pi/agents/teams-presets.json`**; grid; **`.pi/agents/teams.yaml`** — initial team = **first** YAML/preset key (e.g. **full**) |
| **agent-team (build-orchestra)** | `extensions/agent-team-build-orchestra.ts` | Same dispatcher as **agent-team**; initial team **`build-orchestra`** (builder-orchestrator roster). Do not load with **agent-team.ts** in one session. |
| **system-select**       | `extensions/system-select.ts`       | **`/system`** — interactive switch between agent personas from `.pi/agents/` (recursive), `.claude/agents/`, `.gemini/agents/`, `.codex/agents/` |
| **damage-control**      | `extensions/damage-control.ts`      | Real-time safety auditing — intercepts dangerous bash patterns and enforces path-based access controls from `.pi/damage-control-rules.yaml`                |
| **agent-chain**         | `extensions/agent-chain.ts`         | Sequential pipeline orchestrator — chains multiple agents where each step's output feeds into the next step's prompt; **recursive** agent `.md` scan; use **`/chain`** to select and run |
| **pi-pi**               | `extensions/pi-pi.ts`               | Meta-agent that builds Pi agents using parallel research experts for documentation                                                                         |
| **pi-doctor**           | `extensions/pi-doctor.ts`           | **`/doctor`** — toolchain and playground health checks (**bun**, **just**, Pi on PATH, **`.env`**, **`agent/`** + **`.pi/`** JSON, extension shims, skills, optional Ollama if configured) |
| **session-replay**      | `extensions/session-replay.ts`      | Scrollable timeline overlay of session history - showcasing customizable dialog UI                                                                         |
| **theme-cycler**        | `extensions/theme-cycler.ts`        | Keyboard shortcuts (Ctrl+X/Ctrl+Q) and `/theme` command to cycle/switch between custom themes                                                              |
| **extension-picker**    | `extensions/extension-picker.ts`    | **`/extensions`** lists `pi.extensions` from settings packages + local `extensions/*.ts`; saves `pi -e` to `~/.pi/storage/`. In the slash menu, **`/ex`** filters to this command. `/remember` and `/memory` for cross-session notes |
| **github-management**   | `extensions/github-management.ts`   | **`github_pr_*`** PR workflows (list/view/diff/checks/review + **inline suggested edits**), **`ghm_exec`**, **`/ghm`** — requires **[GitHub CLI](https://cli.github.com/)** (`gh`). |
| **honcho-mirror**      | `extensions/honcho-mirror.ts`      | Posts finished user/assistant turns to a running **Honcho** HTTP API when **`HONCHO_BASE_URL`** (and optional **`HONCHO_JWT`**) are set; aligns with **`HONCHO_WORKSPACE`** / peer env vars and **`~/.honcho/config.json`**. Pi keeps working if Honcho is down. See **[docs/HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md)** |
| **session-memory**     | `extensions/session-memory.ts`     | Each turn: injects this chat’s **JSONL path**, **session id**, compaction/branch summaries, and a dialogue recap read from disk (`getSessionFile()`). Recap lines use **`zerwis`** (you) / **`pi`** (agent)—change in **`extensions/chatLabels.ts`**. Rules so **`1`** = pick previous numbered option. `/sessionmemory` toggles |
| **session-saver**     | `extensions/sessions/index.ts`     | Auto-save user/assistant turns to JSON; **`/save`**, **`/list`**, **`/show`**, **`/load`** (`.jsonl` uses `switchSession`). See `extensions/sessions/README.md` |
| **dynamic-loader**    | `extensions/dynamic-loader.ts`     | **`/extension-hint`** — prints stacked **`pi -e`** suggestions for this playground (`PLAYGROUND_BASES` optional) |
| **agent-forge**       | `extensions/agent-forge.ts`       | LLM tools **`forge_list`** / **`forge_create`** write `extensions/forge-*.ts` and update **`forge-registry.json`**; shim + **`/reload`** to load new tools |
| **chronicle**         | `extensions/chronicle.ts`         | Workflow ledger **`.pi/chronicle/ledger.json`**, optional **`workflow.json`**; tools **`chronicle_*`** and **`/chronicle`** (phase 1; no sub-agent spawning) |
| **ralph**            | `extensions/ralph.ts`            | **Ralph** queue: **`todo/` → `inprogress/` → `done/`**; tool **`ralph_queue_status`**; **`/ralph`**; skill **`/skill:ralph`**; team **`ralph`** (**`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**) |
| **web-tools**        | `extensions/web-tools.ts`        | Opt-in (**`just ext-web-tools`** or add shim to **`settings.json`**). Omitted from default **`settings`** if you use npm **`pi-web-access`** (same tool names — do not load both). **`web_search`**, **`web_fetch`**. Agent **`web-searcher`**; team **`info`**. |

---


## Usage

### Auto-load (slash commands without `-e`)

Pi discovers extensions only under `~/.pi/agent/extensions/` or **project** `.pi/extensions/`, not the repo-root `extensions/` directory (see [upstream docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#extension-locations)).

This repo keeps implementations in **`extensions/`** and adds **thin `.pi/extensions/*.ts` shims** that `export { default } from "../../extensions/…"`. Shared helpers (e.g. **`extensions/agent-dir-scan.ts`**) stay **outside** **`.pi/extensions/`**—only shims and real extension factories belong there. Entries are listed in **`.pi/settings.json`**. After editing code, run **`/reload`** in Pi. Use **`/extensions`** for the package picker (typing **`/ex`** narrows the menu).

Skills belong in **`.pi/skills/<skill-name>/SKILL.md`** (directory name must match frontmatter **`name`**). Global skills from **`npx skills add`** often land in **`~/.agents/skills/`**—Pi merges those too; see **[docs/SKILLS.md](docs/SKILLS.md)** §2.

### Run a single extension

```bash
pi -e extensions/<name>.ts
```

### Stack multiple extensions

Extensions compose — pass multiple `-e` flags:

```bash
pi -e extensions/minimal.ts -e extensions/cross-agent.ts
```

### Use `just` recipes

`just` wraps the most useful combinations. Run `just` with no arguments to list all available recipes:

```bash
just
```

Common recipes:

```bash
just pi                     # Plain Pi, no extensions
just ext-pure-focus         # Distraction-free mode
just ext-minimal            # Minimal context meter footer
just ext-cross-agent        # Cross-agent command loading + minimal footer
just ext-purpose-gate       # Purpose gate + minimal footer
just ext-tool-counter       # Rich two-line footer with tool tally
just ext-tool-counter-widget # Per-tool widget above the editor
just ext-subagent-widget    # Subagent spawner with live progress widgets
just ext-tilldone           # Task discipline system with live progress tracking
just ext-agent-team         # session-memory + context-local-hints + agent-team.ts (default team = first in teams.yaml, often full)
just ext-builder-team       # same stack but agent-team-build-orchestra.ts → initial team build-orchestra (builder orchestrator roster)
just ext-system-select      # Agent persona switcher via /system command
just ext-damage-control     # Safety auditing + minimal footer
just ext-agent-chain        # session-memory + context-local-hints + sequential pipeline orchestrator
just ext-pi-pi              # Meta-agent that builds Pi agents using parallel experts
just ext-session-replay     # Scrollable timeline overlay of session history
just ext-theme-cycler       # Theme cycler + minimal footer
just ext-extension-picker   # /extensions package picker + minimal
just ext-session-memory     # JSONL recap in system prompt + minimal
just ext-session-saver        # Auto-save snapshots + /save /list /show /load
just ext-chronicle          # Workflow ledger + chronicle_* tools
just ext-agent-forge        # forge_list / forge_create
just ext-dynamic-loader     # /extension-hint for pi -e stacks
just ext-pi-doctor          # /doctor — playground + toolchain health checks
just ext-web-tools          # web_search + web_fetch (Brave key optional)
just ext-ralph              # Ralph queue: ralph_queue_status + /ralph (todo → inprogress → done)
just all                    # Interactive multi-select (just pi-e) to stack extensions
```

### Global commands on `PATH` (Pi playground + Hermes)

**Pi** shortcuts: **`ppi`**, **`ppi-*`**, **`pi-e`**, **`pg-pi`**. **Hermes**: **`hermes-honcho-status`**, etc. (from this repo’s **`install-global`**). **Honcho** **`honcho-up`**, **`honcho-open-*`**: install from **`~/honcho-server/scripts/install-honcho-bin.sh`** — **[HONCHO_INTEGRATION.md](docs/HONCHO_INTEGRATION.md#command-namespaces-system-first)**.

Recipes are **`just`** targets; from outside this repo use **`scripts/ppi`**, which `cd`s here and runs **`just`**. One-time install puts shortcuts on your **`PATH`**:

```bash
cd ~/.pi    # or your clone path
./install-global
```

This does **not** require **`just`** (use it if `just install-global` is not available yet). After linking, commands like **`ppi`** and **`ppi-ext-minimal`** still need **`just`** on your **`PATH`**—install **`just`** using the table in **Prerequisites** above.

Then (with **`~/.local/bin`** on **`PATH`**):

| Command | Effect |
|---------|--------|
| **`ppi`** | `just --list` |
| **`ppi ext-agent-team`** | **`agent-team.ts`** — dispatcher grid; first **`teams.yaml`** team |
| **`ppi ext-builder-team`** | **`agent-team-build-orchestra.ts`** — same UI; starts on **`build-orchestra`** |
| **`ppi-ext-pi-doctor`** | Pi + **pi-doctor** + minimal → run **`/doctor`** in the TUI |
| **`pi-e`** / **`ppi pi-e`** | **1** alone (±**2**) → full **`extensions[]`** from JSON; **1 12** or any menu **3+** → only stacked **`-e`**; **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** merges JSON + **`-e`** — **[docs/PLAYGROUND.md](docs/PLAYGROUND.md)** |
| **`ppi-pi`** | plain Pi (`just pi`) — does **not** replace the real **`pi`** binary |

Hermes **`just`** recipes: **`just hermes-honcho-status`**, **`just hermes-honcho-setup`**, … (or **`ppi-…`** / **`hermes-honcho-*`** on **`PATH`** after **`install-global`**). Details: **[scripts/README.md](scripts/README.md)**.

**Honcho** (optional — not vendored here; clone **[plastic-labs/honcho](https://github.com/plastic-labs/honcho)** to e.g. **`~/honcho-server`**, then **`docker compose up -d`** per that repo’s **`README.md`**). If your checkout ships **`just`** recipes:

```bash
cd ~/honcho-server && just honcho-up    # when defined: database, redis, api, deriver
cd ~/honcho-server && just honcho-status
./scripts/install-honcho-bin.sh         # when present: ~/.local/bin honcho-up, honcho-open-*, …
```

**Hermes ↔ Honcho** check from the Pi repo: **`just hermes-honcho-status`** (expects local Hermes venv path in **`justfile`**).

The `open` recipe allows you to spin up a new terminal window with any combination of stacked extensions (omit `.ts`):

```bash
just open purpose-gate minimal tool-counter-widget
```

---

## Project Structure

Indexed in **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** (paths, purposes, gitignored dirs, **`projects/_template`** files).

```
project/
├── agent/               # Pi agent dir: AGENTS.md (context), sessions/ (gitignored)
├── docs/                # Guides: REPO_INDEX, SKILLS, TOOLS, AGENTS, integrations, …
├── extensions/          # Pi extension source (.ts) — one file per extension
├── projects/            # Per-codebase notes: projects/<slug>/ (copy from _template/)
│   └── _template/       # README + 00–04 markdown for new slugs
├── specs/               # Extension specifications
├── .cursor/rules/       # Cursor rules (extensions, project docs, core docs)
├── scripts/             # ppi, pi-e, import-domain-specialists.cjs, playground scripts — see scripts/README.md
├── .pi/
│   ├── extensions/      # Shims: export from ../../extensions/… (Pi loads these)
│   ├── agent-sessions/  # Ephemeral specialist sessions (gitignored)
│   ├── agents/          # Agent .md, teams.yaml, teams-presets.json, agent-chain.yaml
│   │   ├── domain-specialists/   # Category trees of specialist .md (recursive scan)
│   │   ├── pi-pi/       # Experts for pi-pi meta-agent
│   │   └── …            # e.g. ralph.md, project-scanner.md, planner.md
│   ├── skills/          # SKILL.md trees (bowser/, find-skills/, github/, indexer/, ralph/, …)
│   ├── themes/          # Custom themes (.json)
│   ├── storage/         # Session-saver snapshots (gitignored)
│   ├── chronicle/       # Chronicle ledger (gitignored)
│   ├── damage-control-rules.yaml
│   └── settings.json    # Loaded extensions list + theme + prompts
├── images/
├── justfile
├── CLAUDE.md
├── THEME.md
└── TOOLS.md             # Core built-in tool signatures (see also docs/TOOLS.md)
```

### `projects/` and new codebases

For **every new repo or sustained effort**, Pi agents should read **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)**, then create **`projects/<slug>/`** from **`projects/_template/`** under this playground (paths are **`…/pi/projects/`** on disk). **`project-scanner`** (agent-team team **`new-project`**) can scan a workspace and fill those files. See **`.cursor/rules/pi-projects-docs.mdc`** and **`projects/README.md`**.

### Ralph (HTML queue)

**Ralph** implements **`todo/` → `inprogress/` → `done/`** with **`.txt`** tickets and **one HTML file** per task: extension **`extensions/ralph.ts`** (**`ralph_queue_status`**, **`/ralph`**), skill **`/skill:ralph`**, agent **`ralph`**. Team **`ralph`** lists **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, and **`documenter`** so the **agent-team** dispatcher can **`dispatch_agent`** exploration, planning, extra implementation, review, **code docs**, or **prose docs** (Ralph returns **`RALPH_ESCALATE`** if blocked in headless mode). Use **`just ext-ralph`** with **`minimal`**.

---


## Orchestrating Multi-Agent Workflows

Pi's architecture makes it easy to coordinate multiple autonomous agents. This playground includes several powerful multi-agent extensions:

### Subagent Widget (`/sub`)
The `subagent-widget` extension allows you to offload isolated tasks to background Pi agents while you continue working in the main terminal. Typing `/sub <task>` spawns a headless subagent that reports its streaming progress via a persistent, live-updating UI widget above your editor.

### Agent Teams (`/team`)
The `agent-team` orchestrator operates as a dispatcher. Instead of answering prompts directly, the primary agent reviews your request, selects a specialist from a defined roster, and delegates the work via a `dispatch_agent` tool.
- Teams are configured in `.pi/agents/teams.yaml` where each top-level key is a team name containing a list of agent names (e.g., `frontend: [planner, builder, bowser]`).
- **Built-in teams** include **`new-project`** (**`project-scanner`** only) for bootstrapping **`projects/<slug>/`**, **`hermes`** (solo **Hermes CLI** bridge—see **[docs/HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)** §7), and **`ralph`** (**`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**) for HTML tickets plus helpers; **`full`**, **`plan-build`**, and **`info`** list specialists per **`teams.yaml`**. See **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)**.
- Individual agent personas (e.g., `builder.md`, `reviewer.md`, `project-scanner.md`, `ralph.md`) live in `.pi/agents/`.
- **pi-pi Meta-Agent**: The `pi-pi` team specifically delegates tasks to specialized Pi framework experts (`ext-expert.md`, `theme-expert.md`, `tui-expert.md`) located in `.pi/agents/pi-pi/` to build high-quality Pi extensions using parallel research.
  - **Web Crawling Fallbacks**: To ingest the latest framework documentation dynamically, these experts use `firecrawl` as their default modern page crawler, but are explicitly programmed to safely fall back to the native `curl` baked into their bash toolset if Firecrawl fails or is unavailable.

### Agent Chains (`/chain`)
Unlike the dynamic dispatcher, `agent-chain` acts as a sequential pipeline orchestrator. Workflows are defined in `.pi/agents/agent-chain.yaml` where the output of one agent becomes the input (`$INPUT`) to the next.
- Workflows are defined as a list of `steps`, where each step specifies an `agent` and a `prompt`. 
- The `$INPUT` variable injects the previous step's output (or the user's initial prompt for the first step), and `$ORIGINAL` always contains the user's initial prompt.
- Example: The `plan-build-review` pipeline feeds your prompt to the `planner`, passes the plan to the `builder`, and finally sends the code to the `reviewer`.

---

## Safety Auditing & Damage Control

The `damage-control` extension provides real-time security hooks to prevent catastrophic mistakes when agents execute bash commands or modify files. It uses Pi's `tool_call` event to intercept and evaluate every action against `.pi/damage-control-rules.yaml`.

- **Dangerous Commands**: Uses regex (`bashToolPatterns`) to block destructive commands like `rm -rf`, `git reset --hard`, `aws s3 rm --recursive`, or `DROP DATABASE`. Some rules strictly block execution, while others (`ask: true`) pause execution to prompt you for confirmation.
- **Zero Access Paths**: Prevents the agent from reading or writing sensitive files (e.g., `.env`, `~/.ssh/`, `*.pem`).
- **Read-Only Paths**: Allows reading but blocks modifying system files or lockfiles (`package-lock.json`, `/etc/`).
- **No-Delete Paths**: Allows modifying but prevents deleting critical project configuration (`.git/`, `Dockerfile`, `README.md`).

---

## Extension Author Reference

Companion docs cover the conventions used across all extensions in this repo:

- **[docs/README.md](docs/README.md)** — Master index of all guides in `docs/`.
- **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)** — What lives in each folder (`extensions/`, `.pi/`, `projects/`, `agent/`, …).
- **[docs/AGENTS.md](docs/AGENTS.md)** — Agent markdown definitions, where Pi scans them, and how `system-select`, `agent-team`, and `agent-chain` use them.
- **[docs/AGENT_TEAMS.md](docs/AGENT_TEAMS.md)** — Agent-team dispatcher: `teams.yaml`, `teams-presets.json`, `dispatch_agent`, team tools, slash commands.
- **[docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md)** — How agent memory works: JSONL, session-memory, session-saver, `/remember`, AGENTS.md, troubleshooting.
- **[docs/SYSTEM.md](docs/SYSTEM.md)** — Memory (`session-memory` vs `session-saver`), context, specs vs code, and agent behavior (run tools; don’t invent command output).
- **[docs/EXTENSIONS.md](docs/EXTENSIONS.md)** — How Pi extensions work upstream, how **this repo** uses `extensions/` + `.pi/extensions/` shims, creating new extensions, and integrating npm/git packages (for humans and agents).
- **[docs/SKILLS.md](docs/SKILLS.md)** — Skills (`SKILL.md`): where Pi discovers them, progressive disclosure, `/skill:name`, authoring, and how they differ from extensions and agents.
- **[docs/CONCEPTS.md](docs/CONCEPTS.md)** — Skills vs agents vs extensions vs tools (definitions, table, when to use which).
- **[docs/TOOLS.md](docs/TOOLS.md)** — Tools: built-ins, `registerTool`, agent allowlists, safety; complements root **`TOOLS.md`** signatures.
- **[COMPARISON.md](COMPARISON.md)** — Feature-by-feature comparison of Claude Code vs Pi Agent across 12 categories (design philosophy, tools, hooks, SDK, enterprise, and more).
- **[PI_VS_OPEN_CODE.md](PI_VS_OPEN_CODE.md)** — Architectural comparison of Pi Agent vs OpenCode (open-source Claude Code alternative) focusing on extension capabilities, event lifecycle, and UI customization.
- **[RESERVED_KEYS.md](RESERVED_KEYS.md)** — Pi reserved keybindings, overridable keys, and safe keys for extension authors.
- **[THEME.md](THEME.md)** — Color language: which Pi theme tokens (`success`, `accent`, `warning`, `dim`, `muted`) map to which UI roles, with examples.
- **[TOOLS.md](TOOLS.md)** — Function signatures for the built-in tools available inside extensions (`read`, `bash`, `edit`, `write`). Narrative: **[docs/TOOLS.md](docs/TOOLS.md)**.

**Cursor (this repo):** **`.cursor/rules/`** — `pi-extensions-context.mdc` (always-on), `pi-extensions.mdc` (when editing `extensions/`), `pi-projects-docs.mdc` (project onboarding + `projects/`), `pi-docs-core.mdc` (when editing core concept docs).

---

## Hooks & Events

Side-by-side comparison of lifecycle hooks in [Claude Code](https://docs.anthropic.com/en/docs/claude-code/hooks) vs [Pi Agent](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#events).

| Category            | Claude Code                                                      | Pi Agent                                                                                                                | Available In |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Session**         | `SessionStart`, `SessionEnd`                                     | `session_start`, `session_shutdown`                                                                                     | Both         |
| **Input**           | `UserPromptSubmit`                                               | `input`                                                                                                                 | Both         |
| **Tool**            | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`                | `tool_call`, `tool_result`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`                       | Both         |
| **Bash**            | —                                                                | `BashSpawnHook`, `user_bash`                                                                                            | Pi           |
| **Permission**      | `PermissionRequest`                                              | —                                                                                                                       | CC           |
| **Compact**         | `PreCompact`                                                     | `session_before_compact`, `session_compact`                                                                             | Both         |
| **Branching**       | —                                                                | `session_before_fork`, `session_fork`, `session_before_switch`, `session_switch`, `session_before_tree`, `session_tree` | Pi           |
| **Agent / Turn**    | —                                                                | `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`                                              | Pi           |
| **Message**         | —                                                                | `message_start`, `message_update`, `message_end`                                                                        | Pi           |
| **Model / Context** | —                                                                | `model_select`, `context`                                                                                               | Pi           |
| **Sub-agents**      | `SubagentStart`, `SubagentStop`, `TeammateIdle`, `TaskCompleted` | —                                                                                                                       | CC           |
| **Config**          | `ConfigChange`                                                   | —                                                                                                                       | CC           |
| **Worktree**        | `WorktreeCreate`, `WorktreeRemove`                               | —                                                                                                                       | CC           |
| **System**          | `Stop`, `Notification`                                           | —                                                                                                                       | CC           |



## Resources

### Pi upstream

| Doc                                                                                                     | Description                        |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [Mario's Twitter](https://x.com/badlogicgames)                                                          | Creator of Pi Coding Agent         |
| [README.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)              | Overview and getting started       |
| [sdk.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md)               | TypeScript SDK reference           |
| [rpc.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/rpc.md)               | RPC protocol specification         |
| [json.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/json.md)             | JSON event stream format           |
| [providers.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md)   | API keys and provider setup        |
| [models.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md)         | Custom models (Ollama, vLLM, etc.) |
| [extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) | Extension system                   |
| [skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)         | Skills (Agent Skills standard)     |
| [settings.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/settings.md)     | Configuration                      |
| [compaction.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md) | Context compaction                 |

### Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for notable playground updates (extensions, docs, agents, rules).

### Way of Pi

**Zerwiz** — developer of Way of Pi. **[WhyNot Productions](https://whynotproductions.netlify.app/)** — [**WhyNot Games**](https://whynotproductions.netlify.app/whynot-games/) (browser arcade: Bomber, Asteroids, Tetris, Pac-Man, and more), courses, local AI, projects, contact.

---

## Master Agentic Coding
> Prepare for the future of software engineering

Learn tactical agentic coding patterns with [Tactical Agentic Coding](https://agenticengineer.com/tactical-agentic-coding)

Follow the [IndyDevDan YouTube channel](https://www.youtube.com/@indydevdan) to improve your agentic coding advantage.
