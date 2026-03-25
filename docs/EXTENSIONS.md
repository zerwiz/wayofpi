# Pi extensions in this repository

This document explains how **Pi Coding Agent extensions** work upstream, how **this playground** wires them, and how you (or an agent) can **author new extensions** or **pull in community extensions**.

Upstream canonical docs:

- [packages.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) — npm/git Pi packages
- [extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) — extension API, events, examples

Related: [skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) (skills differ from extensions; skills are markdown/workflows, extensions are TypeScript).

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

---

## Integrating community or third-party extensions

### From Pi packages (`npm:` / `git:`)

Declared under `agent/settings.json` → `packages`. Each package’s `package.json` should include a `pi.extensions` array (relative paths). Pi installs/clones under the agent directory; see **`extensions/extension-picker.ts`** for how this repo discovers those paths and builds `pi -e` launch hints.

### From another repo or a single `.ts` file

- **Vendor:** copy the file (and any local imports) under `extensions/`, fix imports, add a shim + settings entry.
- **Absolute path:** add the file path to `extensions` in settings (upstream-supported).
- **Symlink:** possible for the **real** file under `extensions/`; avoid symlinks under `.pi/extensions/` unless you know Pi will only see shims (helpers must not be in `.pi/extensions/`).

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
