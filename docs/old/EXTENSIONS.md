# Pi extensions in this repository

This document explains how **Pi Coding Agent extensions** work upstream, how **this playground** wires them, and how you (or an agent) can **author new extensions** or **pull in community extensions**.

Upstream canonical docs:

- [packages.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) — npm/git Pi packages
- [extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) — extension API, events, examples

Related: **[SKILLS.md](SKILLS.md)**, **[CONCEPTS.md](CONCEPTS.md)** (skills vs agents vs extensions vs tools), **[TOOLS.md](TOOLS.md)** (built-ins + `registerTool`). Upstream: [skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) — skills differ from extensions (markdown/workflows vs TypeScript).

---

## What is an extension?

An extension is a **TypeScript module** that Pi loads with [jiti](https://github.com/unjs/jiti). It must export:

```ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // register hooks, tools, commands, etc.
}
```

Through `ExtensionAPI` you can:

| Capability | Typical API |
|------------|-------------|
| React to lifecycle / agent / tool events | `pi.on("event_name", handler)` |
| Slash commands | `pi.registerCommand("name", { description, handler })` |
| LLM-callable tools | `pi.registerTool({ … })` |
| Keyboard shortcuts | `pi.registerShortcut(…)` |
| TUI prompts / widgets | `ctx.ui.select`, `confirm`, `notify`, `custom`, … |
| Tweak system prompt before a turn | `before_agent_start` return `{ systemPrompt: … }` |

Extensions run **in-process** with full access to session state (`ctx.sessionManager`, etc.) and the filesystem.

---

## Where Pi loads extensions from (upstream)

| Location | Scope |
|----------|--------|
| `~/.pi/agent/extensions/*.ts` | Global |
| `~/.pi/agent/extensions/*/index.ts` | Global, folder package |
| `<project>/.pi/extensions/*.ts` | Project-local |
| `<project>/.pi/extensions/*/index.ts` | Project-local, folder |

Additional paths can be listed in **`settings.json`**:

```json
{
  "extensions": ["/absolute/path/to/extension.ts"]
}
```

**Hot reload:** extensions in discovered paths can be reloaded with **`/reload`** in the Pi TUI.

Using **`pi -e ./path/to/ext.ts`** is for ad-hoc runs; discovery + `.pi/settings.json` is for day-to-day use.

---

## How this repo is structured

| Path | Role |
|------|------|
| `extensions/*.ts` | **Real implementations** (and `themeMap.ts` helper). Edit these. |
| `.pi/extensions/*.ts` | **Shims only** — one line re-export so Pi auto-loads without treating helpers as extensions. |
| `.pi/settings.json` | Lists `".pi/extensions/…"` entries to load with the project. |
| `agent/settings.json` | Model, **`packages`** (`npm:…`, `git:…`) for community Pi packages. |

### Extension modules in `extensions/` (inventory)

Each row is a **`export default function (pi: ExtensionAPI)`** entrypoint unless noted. Load with **`pi -e extensions/<file>.ts`** (or nested path); use **`just ext-<name>`** / **`just open …`** where defined in the **`justfile`**.

| File | Role |
| ---- | ---- |
| **`agent-chain.ts`** | Sequential pipelines from **`.pi/agents/agent-chain.yaml`**; tool **`run_chain`**, **`/chain`**. |
| **`agent-forge.ts`** | **`forge_list`**, **`forge_create`** → writes **`extensions/forge-*.ts`** + **`forge-registry.json`**. |
| **`agent-team.ts`** | Dispatcher + **`dispatch_agent`** + **`team_*`** tools; grid UI; **`/agents-*`** commands (default team = first **`teams.yaml`** key). |
| **`agent-team-build-orchestra.ts`** | Wrapper: same as **`agent-team`** but initial team **`build-orchestra`** (builder-orchestrator roster). |
| **`context-local-hints.ts`** | **`<context_awareness>`** for Ollama / local **`baseUrl`** (turn count, rough token hint, recovery steps); **`/context-hint`**. Env **`PI_CONTEXT_HINT_PROVIDERS`**. |
| **`chronicle.ts`** | Workflow ledger **`.pi/chronicle/`**; **`chronicle_*`** tools, **`/chronicle`**. |
| **`cross-agent.ts`** | Discovers **`.claude/`**, **`.gemini/`**, **`.codex/`** commands, skills, agents. Skips names that collide with **`extensions/<name>.ts`** or **`.pi/skills/<name>/SKILL.md`** (playground wins). |
| **`damage-control.ts`** | Bash/file policy from **`.pi/damage-control-rules.yaml`**. |
| **`dynamic-loader.ts`** | **`/extension-hint`** for stacked **`pi -e`** lines. |
| **`extension-picker.ts`** | **`/extensions`**, **`/remember`**, **`/memory`**. |
| **`github-management.ts`** | **`ghm_exec`**, **`github_pr_*`** (list/view/diff/checks/review/inline suggestion), **`/ghm`** — GitHub CLI (`gh`) PR workflows. |
| **`minimal.ts`** | Compact footer (model + context meter). |
| **`pi-pi.ts`** | Meta-agent; **`query_experts`**. |
| **`pi-doctor.ts`** | **`/doctor`** — health checks (toolchain, **`agent/`**, **`.pi/`**, extensions, skills). |
| **`purpose-gate.ts`** | Session intent gate + widget. |
| **`pure-focus.ts`** | Hides footer / status chrome. |
| **`ralph.ts`** | **Ralph** queue dirs + **`ralph_queue_status`**, **`/ralph`**. |
| **`workspace-boundary.ts`** | **`<workspace_boundary>`** — user app (**`PI_USER_PROJECT_DIR`**) vs tool **cwd** vs **`PI_PLAYGROUND`** / global **`~/.pi/agent`**. |
| **`session-memory.ts`** | Injects **`<session_memory>`** recap; **`/sessionmemory`**. |
| **`session-replay.ts`** | Session timeline overlay. |
| **`sessions/index.ts`** | **Session saver** — auto-save, **`/save`** **`/list`** **`/show`** **`/load`**. |
| **`subagent-widget.ts`** | **`subagent_*`** tools, **`/sub`**, background widgets. |
| **`system-select.ts`** | **`/system`** agent persona picker. |
| **`theme-cycler.ts`** | **`/theme`**, Ctrl+X / Ctrl+Q. |
| **`tilldone.ts`** | **`tilldone`** tool (gates other tools), footer/widget, **`.pi/tilldone-checklist.md`**. |
| **`web-tools.ts`** | **`web_search`**, **`web_fetch`** (Gemini / Brave / DuckDuckGo — see **`.env.sample`**). **Not** in default **`.pi/settings.json`**: the npm **`pi-web-access`** user extension registers the same tool names; loading both causes a conflict. Use one or the other. Add **`.pi/extensions/web-tools.ts`** back to **`extensions[]`** only if **`pi-web-access`** is disabled, or run **`just ext-web-tools`** for a one-off stack. Pair with **`.pi/agents/web-searcher.md`**. |
| **`tool-counter.ts`** | Rich footer (tokens, costs, tool counts). |
| **`tool-counter-widget.ts`** | Above-editor tool-count widget. |

**Not** Pi extension factories (helpers / submodules): **`themeMap.ts`**, **`chatLabels.ts`**, **`footer-context-stats.ts`**, **`agent-dir-scan.ts`**, **`sessions/batch-runner.ts`**, **`sessions/theme-lib/`**.

### Shims under `.pi/extensions/` (project auto-load)

Listed in **`.pi/settings.json`** → **`extensions`** (paths relative to repo root). *Current repo snapshot:*

| Shim | Loads |
| ---- | ----- |
| **`workspace-boundary.ts`** | **`extensions/workspace-boundary.ts`** |
| **`minimal.ts`** | **`extensions/minimal.ts`** |
| **`theme-cycler.ts`** | **`extensions/theme-cycler.ts`** (**`/theme`**, Ctrl+X / Ctrl+Q) |
| **`session-memory.ts`** | **`extensions/session-memory.ts`** |
| **`context-local-hints.ts`** | **`extensions/context-local-hints.ts`** |
| **`extension-picker.ts`** | **`extensions/extension-picker.ts`** |
| **`session-saver.ts`** | **`extensions/sessions/index.ts`** |
| **`chronicle.ts`** | **`extensions/chronicle.ts`** |
| **`agent-forge.ts`** | **`extensions/agent-forge.ts`** |
| **`dynamic-loader.ts`** | **`extensions/dynamic-loader.ts`** |
| **`github-management.ts`** | **`extensions/github-management.ts`** |
| **`pi-doctor.ts`** | **`extensions/pi-doctor.ts`** |
| **`ralph.ts`** | **`extensions/ralph.ts`** |

**`agent-team.ts`** / **`agent-team-build-orchestra.ts`** — Do **not** add shims under **`.pi/extensions/`** for these unless you want the team grid on **every** default **`pi`** launch; Pi auto-loads every **`*.ts`** in **`.pi/extensions/`**. Use **`just ext-agent-team`**, **`just ext-builder-team`**, or **`pi-e`** instead.

Other modules in **`extensions/`** may still be used via **`just`** recipes or manual **`pi -e`** stacks if they are not shimmed. After adding a shim entry, run **`/reload`** in Pi.

### Why shims exist

Pi scans **every** `*.ts` file under `.pi/extensions/` and expects each file to be a **valid extension** (default export factory).

Files like `themeMap.ts` are **not** extensions. If placed under `.pi/extensions/`, Pi fails with errors such as “does not export a valid factory function”.

So this repo uses:

```text
.pi/extensions/my-ext.ts   ->  export { default } from "../../extensions/my-ext.ts";
```

The **real** module lives in `extensions/`, so imports like `./themeMap.ts` resolve next to the implementation on disk.

### Conventions (see also `CLAUDE.md`)

- Register **`registerTool` / `registerCommand` / `registerShortcut`** at the **top level** of the default function (not inside `session_start` or other async-only paths), or registration may be ignored.
- Prefer **`isToolCallEventType()`** when narrowing `tool_call` events (pattern used in this repo).
- Use **`applyExtensionDefaults(import.meta.url, ctx)`** from `./themeMap.ts` in `session_start` when you want per-extension theme defaults (optional).

---

## Creating a new extension (checklist)

1. Add `extensions/my-feature.ts` with `export default function (pi: ExtensionAPI) { … }`.
2. Add `.pi/extensions/my-feature.ts`:
   ```ts
   export { default } from "../../extensions/my-feature.ts";
   ```
3. Append `".pi/extensions/my-feature.ts"` to `.pi/settings.json` → `extensions` array (order can matter for composability).
4. Run Pi from repo root and **`/reload`**, or test with  
   `pi -e extensions/my-feature.ts`
5. Update `README.md` extension table and `CHANGELOG.md` if the feature is user-facing.

### Deep dives

| Topic | Location |
| ----- | -------- |
| Session saver | **`extensions/sessions/README.md`**, **`config.json`** |
| Agent forge | **`forge-registry.json`**, shim + **`/reload`** after **`forge_create`** |
| Chronicle / workflow spec | **`specs/agent-workflow.md`**, **`.pi/chronicle/`** |

---

## Integrating community or third-party extensions

### From Pi packages (`npm:` / `git:`)

Declared under `agent/settings.json` → `packages`. Each package’s `package.json` should include a `pi.extensions` array (relative paths). Pi installs/clones under the agent directory; see **`extensions/extension-picker.ts`** for how this repo discovers those paths and builds `pi -e` launch hints.

### From another repo or a single `.ts` file

- **Vendor:** copy the file (and any local imports) under `extensions/`, fix imports, add a shim + settings entry.
- **Absolute path:** add the file path to `extensions` in settings (upstream-supported).
- **Symlink:** possible for the **real** file under `extensions/`; avoid symlinks under `.pi/extensions/` unless you know Pi will only see shims (helpers must not be in `.pi/extensions/`).

### From another repo via this playground (`pi-e`)

**`ppi pi-e`** / **`just pi-e`** runs Pi with **cwd** in your app repo while **`-e`** paths resolve to this clone. **`extensions[]`** is kept only if you pick **menu 1 and/or 2 alone**; **any line 3+** (e.g. **`1 12`**) clears **`extensions[]`** for that run so only the stacked **`-e`** list loads — see **[PLAYGROUND.md](PLAYGROUND.md)** and **`.cursor/rules/pi-pi-e-playground-modes.mdc`**.

---

## Extension picker (`/extensions`): what it does not do

The **picker does not open a second UI** and cannot switch your *current* Pi session to another extension.

1. You choose an entry; Pi shows a **notify** with a **`pi -e …` shell command** (and saves `storage/last-extension.json`).
2. **Quit Pi**, use a **new terminal tab**, run that command. The **terminal becomes Pi** (TUI). There is no separate desktop window.
3. If you run `pi -e …` **while Pi is still running** or from a broken TTY, you may see no interface—quit Pi first.

The picker prefers **`pi -e extensions/minimal.ts -e …/your-extension.ts`** when this repo’s `extensions/minimal.ts` exists so the new session has a normal footer.

---

## Security and trust

Extensions are arbitrary code with your user privileges. Only install or vendor extensions from sources you trust.

---

## Cursor rule

A short rule for the AI when editing extension files lives in:

`.cursor/rules/pi-extensions.mdc`
