# Repository index — systems, folders, and key files

This is a **map** of the Pi extension playground: **what each area is for** and **where it lives**.

**Canonical GitHub:** [zerwiz/wayofpi](https://github.com/zerwiz/wayofpi)

**Playground root** on this machine: **`/home/zerwiz/.pi`** (same as the Git repo root when you `cd` here).

For narrative docs, start at **[README.md](README.md)** (this folder) or root **[README.md](../README.md)**. For an explanation of what “the playground” means here, see **[PLAYGROUND.md](PLAYGROUND.md)**.

---

## 1. Top-level layout (repo root)

| Path (under `/home/zerwiz/.pi/`) | Purpose |
|----------------------------------|---------|
| **`extensions/`** | **Source** for Pi extensions (TypeScript, one main file per extension). Pi does **not** auto-load from here alone—see **`.pi/extensions/`** shims. |
| **`.pi/`** | **Project-local Pi workspace**: settings, shims, agents, skills, themes, rules consumed when you run Pi from this directory. |
| **`agent/`** | Pi **agent install** slice next to the project: **`AGENTS.md`** (context for the model), optional **`settings.json`**, **`sessions/`** (JSONL chats—**gitignored**). |
| **`projects/`** | **Per-effort documentation** Pi maintains while working on other codebases or long tasks. See **`projects/README.md`**. |
| **`projects/_template/`** | **Copy contents** into `projects/<slug>/` when starting a new tracked effort. **`project-scanner`** agent automates scan + fill (see **`.pi/agents/project-scanner.md`**, team **`new-project`**). |
| **`docs/`** | Human-written guides (memory, extensions, agents, integrations, **this index**). |
| **`apps/wayofpi-ui/`** | **Way of Pi** technical UI preview: Bun **HTTP + WebSocket** server, Vite + React IDE-style shell — see **`apps/wayofpi-ui/README.md`**, **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**, modular dock **TODO** **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)**. |
| **`specs/`** | Feature **specifications** for extensions; may be ahead of or beside the code—check status banners in each file. |
| **`.cursor/rules/`** | Cursor rules: **`pi-extensions-context.mdc`** (always-on), **`pi-pi-e-playground-modes.mdc`** (**`pi-e`** option **1** vs **2**, env flags), **`pi-extensions.mdc`** (extension `*.ts`), **`pi-projects-docs.mdc`** (project docs), **`pi-docs-core.mdc`** (core concept docs), **`pi-documentation-consistency.mdc`** (`docs/**/*.md`, README, CHANGELOG, etc.), **`wop-ui-modular-docks.mdc`** (`apps/wayofpi-ui/**` — movable dock shell discipline). |
| **`justfile`** | **`just`** recipes: Pi stacks, Honcho/Hermes helpers, extension launchers. |
| **`install-global`** | Executable: symlinks **`ppi`** / **`pi-e`** / **`ppi-*`** into **`~/.local/bin`** — **no `just` required** (same as **`scripts/install-ppi-global.sh`**). |
| **`scripts/`** | **`ppi`** launcher + **`install-ppi-global.sh`** → global **`PATH`** shortcuts for all `just` recipes; **`wop-pi-upstream.ts`** + **`wop-upstream/`** (Pi GitHub/npm check + optional mirror); see **[scripts/README.md](../scripts/README.md)**. |
| **`package.json`** / **`bun.lock`** | Node/Bun dependencies for the repo (extensions dev). |
| **`wop.upstream.lock.json`** | Way of Pi upstream: last-seen **`pi-mono`** tag / npm version; **`bun scripts/wop-pi-upstream.ts`** updates it. |
| **`CLAUDE.md`** | Short **agent conventions** (Bun, `just`, shim pattern). |
| **`README.md`** | Main **boot doc**: prerequisites, extension table, structure overview. |
| **`start-wayofpi-ui.sh`** | Starts **`apps/wayofpi-ui`** dev (Bun + Vite) and opens the browser — see root **`README.md`** § Way of Pi web UI. |
| **[`TOOLS.md`](../TOOLS.md)** (repo root) | TypeScript-style signatures for **core built-in tools**; narrative: **[TOOLS.md](TOOLS.md)**. |
| **`THEME.md`**, **`TOOLS.md`**, **`COMPARISON.md`**, etc. | Reference / comparison markdown at repo root. |
| **`images/`** | Static assets (e.g. README logo). |
| **`storage/`** | Local extension picker / state (**`last-extension.json`**); some subtrees **gitignored**. |
| **`tmp/`** | Scratch (typically gitignored or empty). |

---

## 2. `.pi/` — Pi workspace (project)

| Path | Purpose |
|------|---------|
| **`.pi/settings.json`** | Theme, extension list, prompts, packages—**what Pi loads** for this project. |
| **`.pi/extensions/*.ts`** | **Shims** only: `export { default } from "../../extensions/…"`. Pi loads **these** as extensions. **Do not** put non-extensions (e.g. `themeMap.ts`) here. |
| **`.pi/agents/`** | **Agent definitions** (`.md` personas), **`teams.yaml`**, **`agent-chain.yaml`**, **`teams-presets.json`**, **`pi-pi/`** experts. |
| **`.pi/skills/`** | **Skills** (`<name>/SKILL.md`), e.g. **`bowser/`**, **`github/`**, **`indexer/`**, **`ralph/`**. Discovered by Pi per **[SKILLS.md](SKILLS.md)**. |
| **`.pi/themes/`** | JSON themes (e.g. for **theme-cycler**). |
| **`.pi/damage-control-rules.yaml`** | Rules for **damage-control** extension (paths / bash patterns). |
| **`.pi/agent-sessions/`** | Ephemeral state for **subagent / team** sessions (**gitignored**). |
| **`.pi/storage/sessions/`** | **Session-saver** JSON snapshots (**gitignored**). |
| **`.pi/chronicle/ledger.json`** | **Chronicle** workflow ledger (**gitignored** in default setup). |
| **`.pi/tilldone-checklist.md`** | **TillDone** extension: auto-generated task checklist (checkbox markdown). **Overwritten** when the **`tilldone`** tool changes state; tool state is authoritative. |

---

## 3. `projects/` and `projects/_template/`

**Role:** On-disk **documentation** for work Pi does on a **named effort** (not Pi runtime config).

| Path | Purpose |
|------|---------|
| **`/home/zerwiz/.pi/projects/README.md`** | Rules: when to create `projects/<slug>/`, slug naming, agent behavior pointers. |
| **`/home/zerwiz/.pi/projects/_template/README.md`** | Template **index** for a new slug (goal, links, file table). |
| **`.../_template/00-OVERVIEW.md`** | Scope, success criteria. |
| **`.../_template/01-CONTEXT.md`** | Paths, stack, commands, env. |
| **`.../_template/02-DECISIONS.md`** | Dated decisions log. |
| **`.../_template/03-NOTES.md`** | Scratch notes. |
| **`.../_template/04-TASKS.md`** | Checklist / next steps. |
| **`projects/<slug>/`** | **Your copies** after duplicating `_template/`; optional **`attachments/`** per **`projects/README.md`**. |

Rule file: **`.cursor/rules/pi-projects-docs.mdc`**.

---

## 4. `agent/` (next to repo)

| Path | Purpose |
|------|---------|
| **`agent/AGENTS.md`** | Injected into Pi **[Context]** for this agent dir—policy, pointers to **`docs/`**. |
| **`agent/sessions/`** | **Chat JSONL** and session data (**gitignored**—do not commit transcripts). |
| **`agent/settings.json`** | May override or extend Pi settings for this install (if present). |
| **`agent/models.json`** | **Ollama** (`ollama list`) + merged **OpenRouter** (`OPENROUTER_API_KEY`); see [`models.md`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md). |
| **`agent/auth.json`** | Credentials (**gitignored**). Optional **`openrouter`** `api_key` entry so **`pi`** sees a key when `.env` is not sourced; still prefer **`OPENROUTER_API_KEY`** in **`.env`** + **`just pi`**. |

---

## 5. `docs/` — documentation index

All guides are listed in **`docs/README.md`**. Highlights:

| Area | Doc |
|------|-----|
| Memory | **[AGENT_MEMORY.md](AGENT_MEMORY.md)**, **[SYSTEM.md](SYSTEM.md)** |
| Extensions | **[EXTENSIONS.md](EXTENSIONS.md)** |
| Agents / teams | **[AGENTS.md](AGENTS.md)**, **[AGENT_TEAMS.md](AGENT_TEAMS.md)**, **[HOW_TO_USE_AGENTS.md](HOW_TO_USE_AGENTS.md)** |
| Planning | **[PLANNING.md](PLANNING.md)** (hub), **[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)** (Way of Pi web + headless Pi), **[WAY_OF_PI_OPEN_TODOS.md](WAY_OF_PI_OPEN_TODOS.md)** (open backlog), **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**, **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**, **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**, **[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)**, **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)** (Pi GitHub/npm check + mirror), **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** (Codex subagents → Pi), **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** (model routing) |
| Skills / tools / concepts | **[SKILLS.md](SKILLS.md)**, **[TOOLS.md](TOOLS.md)**, **[CONCEPTS.md](CONCEPTS.md)** |
| Hermes / Honcho / Pi local AI | **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)**, **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)**, **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)**, **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** (runbook), **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**, **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)**, **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** |

---

## 6. Ephemeral or sensitive (typical gitignore)

Do not assume these are in Git; they are **local runtime** or private:

- **`agent/sessions/`**, **`agent/run-history.jsonl`**, **`agent/bin/`**
- **`.pi/agent-sessions/`**
- **`.pi/storage/sessions/`**
- **`.pi/chronicle/ledger.json`**
- **`storage/sessions/`** (under repo root)
- **`.env`**, **`agent/auth.json`**

See **`.gitignore`** for the authoritative list.

---

## 7. Quick path cheatsheet

```text
/home/zerwiz/.pi/extensions/<name>.ts     # extension source
/home/zerwiz/.pi/.pi/extensions/<name>.ts # shim Pi loads
/home/zerwiz/.pi/.pi/settings.json        # Pi project settings
/home/zerwiz/.pi/.pi/agents/              # agent .md + YAML
/home/zerwiz/.pi/.pi/skills/<skill>/SKILL.md
/home/zerwiz/.pi/projects/_template/      # copy → projects/<slug>/
/home/zerwiz/.pi/docs/                    # guides + REPO_INDEX.md
/home/zerwiz/.pi/specs/                   # extension specs
/home/zerwiz/.pi/agent/AGENTS.md          # Pi context file
```

If this repo is checked out elsewhere, replace **`/home/zerwiz/.pi`** with your clone path.
