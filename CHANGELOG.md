# Changelog

Notable changes to this Pi extension playground are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Earlier work is not backfilled; entries start from when this file was added.

## [Unreleased]

### Added

- **README (GitHub)** — Overview of docs hub, `projects/` + scanner, Ralph, Hermes/Honcho `just` recipes, expanded tree, Cursor rules, **`CHANGELOG`** link; **`just ext-ralph`** + **`all-open`** includes **ralph**.

- **Ralph team** — **`teams.yaml` `ralph`**: added **`scout`**, **`planner`**, **`reviewer`**; **`ralph` agent** + **`SKILL.md`** document **`RALPH_ESCALATE`** and dispatcher handoff; **`extensions/ralph.ts`** help text; README + **`docs/AGENT_TEAMS.md`**.

- **Ralph** — **`.pi/skills/ralph/SKILL.md`**, **`.pi/agents/ralph.md`**, **`extensions/ralph.ts`** + shim (**`ralph_queue_status`**, **`/ralph`**); team **`ralph`** in **`teams.yaml`**; **`settings.json`** + README + **`docs/AGENTS.md`** / **`AGENT_TEAMS.md`** + **`agent/AGENTS.md`** + **`dynamic-loader`** list.

- **`project-scanner`** agent (`.pi/agents/project-scanner.md`) — scans a workspace and writes **`/home/zerwiz/.pi/projects/<slug>/`** from **`projects/_template/`**; teams **`new-project`**, **`full`**, **`info`** updated in **`teams.yaml`**. **`pi-projects-docs.mdc`**, **`agent/AGENTS.md`**, **`projects/README.md`**, **`docs/AGENTS.md`**, **`docs/REPO_INDEX.md`** — every new project: read **`REPO_INDEX.md`**, bootstrap from **`_template`**, use scanner or manual fill.

- **`.cursor/rules/pi-docs-core.mdc`** — File-scoped rule when editing **`docs/TOOLS.md`**, **`SKILLS.md`**, **`AGENTS.md`**, **`AGENT_TEAMS.md`**. **`pi-extensions.mdc`** + **`pi-extensions-context.mdc`** updated to link CONCEPTS + those guides.

- **`docs/REPO_INDEX.md`** — Index of repo folders/files (extensions, `.pi/`, `agent/`, `projects/` + `_template/`, `docs/`, ephemeral paths); linked from `docs/README.md`, `projects/README.md`, root README.

- **`docs/HERMES_INTEGRATION.md`** + **`docs/HONCHO_INTEGRATION.md`** — Split guides for Hermes client vs Honcho server/Docker/SDK; **`Hermes_Honcho_connection.md`** slimmed to a bridge + quick path; indexed in `docs/README.md`.

- **`docs/CONCEPTS.md`** + **`docs/TOOLS.md`** — Skills vs agents vs extensions vs tools; Pi tools (built-ins, extensions, agent allowlists, safety). Linked from `docs/README.md`, `SYSTEM.md`, `EXTENSIONS.md`, `AGENTS.md`, `SKILLS.md`, `agent/AGENTS.md`, root README; root **`TOOLS.md`** points at `docs/TOOLS.md` / `CONCEPTS.md`.

- **`docs/SKILLS.md`** — Skills guide: discovery, progressive disclosure, `/skill:name`, `settings.json` / CLI, authoring, cross-agent; linked from `docs/README.md`, `SYSTEM.md`, `EXTENSIONS.md`, `AGENT_MEMORY.md`, `agent/AGENTS.md`.

- **`projects/`** — On-disk docs for work Pi does on specific codebases: **`projects/README.md`**, **`projects/_template/`** (copy to `projects/<slug>/`). Cursor rule **`.cursor/rules/pi-projects-docs.mdc`**; **`agent/AGENTS.md`** + **`docs/README.md`** + root README project tree link.

- **`docs/AGENTS.md`** + **`docs/AGENT_TEAMS.md`** — Agents (definitions, integration) and agent-team (rosters, presets, dispatch); indexed in `docs/README.md` + README Extension Author Reference.

- **`session-saver`**: `extensions/sessions/index.ts` — auto-save on `message_end`, `/save` / `/list` / `/show` / `/load`; config `extensions/sessions/config.json`; README in `extensions/sessions/README.md`.
- **`dynamic-loader`**: `extensions/dynamic-loader.ts` — `/extension-hint` for stacked `pi -e` launches (session commands moved to session-saver).
- **`agent-forge`**: `extensions/agent-forge.ts` — `forge_list`, `forge_create`; `extensions/forge-registry.json`.
- **`chronicle`**: `extensions/chronicle.ts` — ledger + optional workflow graph; `chronicle_status`, `chronicle_snapshot`, `chronicle_transition`, `/chronicle`.
- Shims in `.pi/extensions/` for the above + `settings.json` entries; `specs/agent-forge.md` and `specs/agent-workflow.md` status banners aligned with v1 behavior.
- **Follow-up:** `extensions/sessions/config.json` — drop unused settings keys; remove `maxFileSize` override that capped saves at 10k (code default is 512 KiB). `.gitignore` — `.pi/storage/sessions/`, `.pi/chronicle/ledger.json`. `justfile` — `ext-session-saver`, `ext-chronicle`, `ext-agent-forge`, `ext-dynamic-loader` + `all` entries. `docs/sessions.md` — playground banner + fixed dynamic-loader pointer. `specs/agent-workflow.md` — ledger path note for v1 vs full spec.
- **`docs/SYSTEM.md`** + **`docs/README.md`** — Project/system doc: what session memory does and does not do, specs vs implementation, and agent rules (execute tools, avoid fabricated terminal output). README link under Extension Author Reference.
- **`agent/AGENTS.md`** — Short Pi context rules (tools vs invented output, session memory limits, chunked replies); points to `docs/SYSTEM.md`.
- **`extensions/chatLabels.ts`** — Display labels **`zerwis`** (user) / **`pi`** (assistant) in `session-memory` recaps and `session-replay` titles; edit one file to rename.
- **`docs/AGENT_MEMORY.md`** — Agent memory guide (JSONL, session-memory, session-saver, `/remember`, AGENTS.md, skills); indexed in `docs/README.md` + root README.
- `docs/Hermes_Honcho_connection.md` — Hermes + Honcho local setup doc (cross-session memory) for your Pi workflows.
- **`agent-team`**: `team_list`, `team_member_add/remove`, `team_member_replace`, `team_reload_agents`, `team_activate`, `team_save_preset`, `team_load_preset`, `team_delete_preset`; saved rosters in `.pi/agents/teams-presets.json`; slash `/agents-team-replace`, `/agents-reload`, `/agents-preset-*`, etc.; dispatcher `setActiveTools` includes team tools.
- `pi-e` (standalone) — Interactive multi-select script in `~/.local/bin/` to start stacked `pi -e` runs without requiring `just`.
- `.cursor/rules/pi-extensions.mdc` — File-scoped rule when editing `extensions/` or `.pi/extensions/`.
- `.cursor/rules/pi-extensions-context.mdc` — Always-on pointer to `docs/EXTENSIONS.md`.
- `docs/EXTENSIONS.md` — Extension guide (upstream + local shim pattern + integration checklist).
- README link under Extension Author Reference.
- Root `CHANGELOG.md` for tracking future playground changes.
- `extensions/session-memory.ts` and `just ext-session-memory`: reinject recent USER/ASSISTANT turns into the system prompt; `/sessionmemory` on|off|status.
- README row for **session-memory**.
- **Auto-load:** `.pi/extensions/` shims + `extensions` list in `.pi/settings.json` so Pi discovers this playground without `pi -e` (repo-root `extensions/` alone is not scanned by Pi).

### Fixed

- `.pi/extensions/`: replace symlinks + `themeMap.ts` with **re-export shims** only. Pi loads every `*.ts` in that folder as an extension; `themeMap.ts` is a helper and must not live there (was error: “does not export a valid factory function”).
- Bowser skill path: `.pi/skills/bowser/SKILL.md` (Pi requires parent directory to match skill `name`).

### Changed

- `extension-picker`: single slash command **`/extensions`** only; removed `/ext`, `/extention`, `/extentions` duplicates (prefix `/ex` still narrows the menu).
- `extension-picker`: clearer post-pick instructions (quit Pi, new terminal, TUI = terminal); default saved command stacks **`extensions/minimal.ts`** when present; `docs/EXTENSIONS.md` FAQ for “picker didn’t open another app”.
- `session-memory` extension: read current chat’s persisted JSONL via `getSessionFile()`, inject path/id and dialogue recap; compaction/branch summaries included; explicit rules so replies like `1` select the prior numbered option.

## [2026-03-25]

### Added

- `extensions/extension-picker.ts`: slash commands `/extensions` and `/extentions` to list `pi.extensions` from agent `settings.json` packages (git and npm) plus project `extensions/*.ts`; writes launch hint to `~/.pi/storage/last-extension.json`. Commands `/remember` and `/memory` plus one-time-per-session injection from `~/.pi/storage/agent-memory.md`.
- `just ext-extension-picker` recipe and `just all` entry for the picker stacked with `minimal`.
- README table row for **extension-picker**.
