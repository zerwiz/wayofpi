# Way of Pi — UI manifest strategy (commands, tools, extensions)

How **slash commands**, **tools**, and **extension capabilities** reach the web UI without duplicating Pi’s TUI-only menus.

## Problem

- **[docs/commands/REFERENCE.md](commands/REFERENCE.md)** mixes core and extension commands; not every build exposes every command.
- **Tools** are registered at runtime by Pi and extensions (`registerTool`).
- **Extensions** add hooks, widgets, and commands—surface area changes per `extensions[]` and Pi version.

## Recommended approach (hybrid)

### 1. Runtime introspection (source of truth)

The **Way of Pi server** runs **headless Pi** (or a thin probe process) and collects:

- **Tool list** — names, JSON Schema parameters, descriptions (as Pi exposes them).
- **Slash commands** — if Pi exposes a machine-readable command registry; otherwise **parse** from documented API or extension registration events when available.
- **Extension metadata** — from loaded extensions (name, version) and from **`pi list`** for npm/git packages.

**UI uses this** for: command palette, tool log column headers, approval dialogs (“this tool does X”), and Diagnostics (“enabled extensions”).

### 2. Static manifest (fallback + UX polish)

Generate at **build time** or **release time** from this repo:

- **Curated labels** and **grouping** (Navigate vs Actions vs Session).
- **Icons** and **help URLs** per command.
- **Deprecation** notices when upstream renames a command.

Ship as **`manifest.json`** (or embedded in server bundle). **Merge** with runtime introspection: runtime wins for **existence**; static wins for **display strings** when keys match.

### 3. Versioning and drift

- Pin **supported Pi versions** in Way of Pi release notes.
- If introspection fails, fall back to static manifest and show **“Partial; upgrade Pi or Way of Pi”** in Diagnostics.

## WebSocket / API shape (sketch)

- **`GET /api/manifest`** — merged snapshot: `{ tools: [...], commands: [...], extensions: [...] }`.
- **`manifest_updated`** event on WebSocket when user applies **Reload** after config change.

## Non-goals

- Reimplementing Pi’s full slash parser in the browser.
- Trusting static REFERENCE.md as the only source without runtime verification.

## Related

- **[WOP_SIMPLE_UI_VIEWS.md](WOP_SIMPLE_UI_VIEWS.md)** — Simple UI **View → Workspace views** catalog (editable `.wayofpi/ui-views.json`; extension and doc shortcuts).
- **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** — full product plan.
- **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** — streaming events beyond manifest.
