# Changelog

Notable changes to this Pi extension playground are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Earlier work is not backfilled; entries start from when this file was added.

## [Unreleased]

### Changed

- **Docs + Cursor** — **`docs/PLAYGROUND.md`** adds a canonical **`pi-e`** modes table; **`docs/EXTENSIONS.md`**, **`docs/README.md`**, **`docs/REPO_INDEX.md`**, and **`pi-extensions-context.mdc`** cross-link **``.cursor/rules/pi-pi-e-playground-modes.mdc`** (always-on rule for FULL vs project-scoped **`pi-e`**).

### Fixed

- **GitHub** — default branch is **`main`** (was **`feat/playground-updates`**, which blocked branch deletes and confused PR banners). Historical feature branches **`feat/agents-skills-and-scan-2026-03-26`**, **`feat/rebrand-pi-extension-playground`**, **`feat/playground-ralph-docs`**, and **`feat/playground-updates`** are **restored on the remote** at their original tip commits for anyone who wants them alongside **`main`**.

### Added

- **`playground-portal`** agent (**.pi/agents/playground-portal.md**), teams **`playground-portal`** (solo) + roster entries on **`new-project`**, **`full`**, **`info`** — ports extensions/skills from **`PI_PLAYGROUND`** into the **app repo**; pairs with **`pi-e` option 2** / **`scripts/init-project-local-pi-env.sh`**.

- **`scripts/init-project-local-pi-env.sh`** + **`pi-e` option 2** — scaffolds **project-local** **`<project>/.pi/`** (empty **`extensions[]`**, **skills** dir, marker **`.project-local-pi`**).

- **`scripts/render-playground-project-settings.py`** — **`enable-playground-in-project`** uses it to mirror the playground **`.pi/settings.json`** into another project with **absolute paths**, **`skills`**, and **`themes`** dirs.

- **`pi-doctor`** extension (**`extensions/pi-doctor.ts`**, shim **`.pi/extensions/pi-doctor.ts`**) — slash **`/doctor`** reports toolchain and config health (bun, just, Pi on PATH, **`agent/`** / **`.pi/`** JSON, extension paths from settings, skills, optional Ollama when **`models.json`** uses it). Recipe **`just ext-pi-doctor`**; global **`ppi-ext-pi-doctor`** after **`./install-global`**; **`pi-e`** / **`ppi pi-e`** includes **pi-doctor**; **`dynamic-loader`** **`/extension-hint pi-doctor`**.

- **`scripts/pi-with-env`** — runs **`pi`** after sourcing repo **`.env`** (for launches that bypass **`ppi`** / **`just`**).

- **OpenRouter** — **`agent/models.json`** **`openrouter`** provider (**`OPENROUTER_API_KEY`**, OpenAI-compatible **`https://openrouter.ai/api/v1`**); sample models in **`pi.config.json`**; README **OpenRouter** subsection; **`.env.sample`** note; **`docs/REPO_INDEX.md`** **`agent/models.json`** row.

### Added

- **`workspace-boundary`** extension — **`before_agent_start`** injects **`<workspace_boundary>`** (user app vs **`~/.pi/agent`** vs **`PI_PLAYGROUND`**); **`session_start`** **notify** if **`PI_USER_PROJECT_DIR`** ≠ **`ctx.cwd`**. Shim in **`.pi/extensions/`**; listed first in **`.pi/settings.json`**. **`PI_USER_PROJECT_DIR`** set by **`ppi`** and **`pi-launch-from-project.sh`** (canonical abs path).

### Changed

- **`just pi-e`** — **Option 1 (FULL)** keeps **`extensions[]`** from **`settings.json`** (full playground). **Option 2** or menu **`3+` / `all`** clears **`extensions[]`** for that run (**`PIE_KEEP_SETTINGS_EXTENSIONS=1`** overrides). Greedy digit split (**`scripts/pi-e-expand-selection.py`**). **Option 2** uses **`init-project-local-pi-env.sh <project> <playground>`** (wired agents/skills); auto **`minimal`** skipped when **option 1** ran (JSON stack already complete).

- **`scripts/init-project-local-pi-env.sh`** — Optional second argument **`<playground-root>`** ( **`pi-e` option 2**): **`link-playground-agent-trees.sh`**, **`render-project-wired-playground-settings.py`**, **`.playground-from`**. One-arg CLI unchanged (local-only).

- **`scripts/enable-playground-in-project`** — Shares **`link-playground-agent-trees.sh`** with wired init.

- **`scripts/sanitize-linked-playground-settings.py`** + **`pi-launch-from-project.sh`** — When extensions are **not** cleared, if **`.pi/.playground-from`** exists, strip **`pi-pi.ts`** ( **`PI_SKIP_LINKED_SETTINGS_SANITIZE=1`** to skip).

- **`render-playground-project-settings.py`** — **FULL** merge no longer auto-adds **`pi-pi.ts`** (opt in via **`just ext-pi-pi`** or **`pi-e`**). Re-run **enable** or trim **`settings.json`** in linked apps that still list it.

- **`pi-e`** — Menu **2** is **wired project-local** (LEAN removed from **`pi-e`**; use **`PLAYGROUND_LINK_LEAN=1`** with **`enable-playground-in-project`** for a lighter full-settings link). Option **1** remains **FULL**.

- **`just pi-e`** — Launches **`scripts/pi-launch-from-project.sh`**: **`cwd`** = **`PI_E_PROJECT_DIR`**, **`-e`** paths absolute to the playground; if **option 1** or **2** ran (`LINK_SELECTED`), defaults **`PI_SHADOW_LEGACY_PROJECT_TOOLS=1`** for **`./tools`** (restored on exit; **0** to disable).

- **`scripts/render-playground-project-settings.py`** — **Option 1 / enable** now emits the **full** extension list: **`.pi/settings.json`** paths + all **`.pi/extensions/*.ts`** + **`extensions/*.ts`** factories (no duplicate shim/root), so every playground extension is loadable in a linked project.

- **`scripts/enable-playground-in-project`** — Resolves the playground from the script location; **`pi`** on PATH is optional (warning only). After writing **`settings.json`**, symlinks **`.pi/agents`**, **`.claude/commands`**, **`.pi/damage-control-rules.yaml`** when missing. Writes **`<project>/.pi/.playground-from`**.

- **`scripts/disable-playground-in-project`** — Removes those symlinks when they resolve under the recorded playground root; **`.playground-from`** + **rg** legacy fallback unchanged.

- **`scripts/ppi`** — Sets **`PI_E_PROJECT_DIR`** to the pre-**`cd`** working directory so **`just pi-e`** setup options (**1–2**) and **`enable-playground-in-project`** target the user’s app repo, not the playground root.

- **`justfile`** **`pi-e`** — Menu: **1** playground **FULL**, **2** project-local init, **3+** extensions; **`all`** skips pseudo-options; playground opt-in scripts invoked with **`PLAYGROUND_ROOT`** and **`PROJECT_DIR`**.

- **`agent/models.json`** — Provider order **`ollama`** → **`openrouter`** → **`openai`** (native **`OPENAI_API_KEY`** merge only).

- **`pi.config.json`** — OpenRouter **`:free`** models first, then other OpenRouter, **Ollama**, then native **OpenAI** **`gpt-4o-mini`**.

- **`justfile`** — Recipe **`pi-cycle-or-free-first`**: **`--models`** order matches “free OpenRouter → OpenRouter → Ollama → OpenAI” for Ctrl+P (Pi **`/model`** still sorts **`openai`** before **`openrouter`** alphabetically).

- **`scripts/ppi`** — sources **`.env`** at the repo root after **`cd`** so **`OPENROUTER_API_KEY`** (and other vars) reach **`just`** and **`pi`** without embedding secrets in tracked config.

- **`.pi/agents/teams.yaml`** — Team **`full`**: removed **`hermes`** and **`red-team`**; added **`ralph`**. Hermes remains on **`info`** and solo **`hermes`**; **`red-team`** is still defined and can be added via preset or **`/agents-team-add`**. **`docs/AGENT_TEAMS.md`**, **`docs/AGENTS.md`**, **`docs/HERMES_INTEGRATION.md`** §7, **`agent/AGENTS.md`** updated.

- **`docs/PLAN_AGENT_MODEL_ROUTING.md`** — **§0** documents **model field contract** (`settings.json` **`defaultProvider`** / **`defaultModel`**, **`models.json`** **`providers.*.models[].id`**, **`--model`** = **`provider/id`**); **§0b** clarifies **skill** (policy) vs **extension** (automatic **`--model`**) vs optional **tool**.

- **Ollama models** — **`agent/models.json`** and **`pi.config.json`** aligned with local `ollama list` (Qwen 3.5 9B / 32K, Qwen 2.5 Coder variants, Llama 3.1, Nemotron nano, R1 8B, etc.); **`agent/settings.json`** default **`qwen3.5:9b-32k`**. README Ollama subsection; **`.env.sample`** `OLLAMA_HOST` note.

### Added

- **`extensions/agent-team.ts`** — Per-specialist **token usage** (prompt **`↓`**, completion **`↑`**) from subprocess **`message_end`** / **`agent_end`** usage fields: **grid card** line, **`dispatch_agent`** tool summary + **`details.usage`**, collapsed result header, and **notify** toast. **`docs/AGENT_TEAMS.md`** §1, §8.

- **`docs/AGENT_TEAMS.md`** — **§8** explains **grid card %** vs **footer %** (subagent `usage.input` / `contextWindow` with 5-slot bar vs dispatcher `getContextUsage().percent` with 10-slot bar; `ceil` vs `round`). **§9** documents **stops, truncation, missing files**, and dispatcher **verify** tools (`read`/`ls`/`grep`). Indexed in **`docs/README.md`**.

- **`docs/PLAN_AGENT_MODEL_ROUTING.md`** — Plan for **model-routing** skill + **`.pi/agent-model-routes.yaml`** + **`agent-team`** override; levels A–D (advisory → subprocess model → main session API); linked from **`docs/README.md`**, **`REPO_INDEX.md`**, root **`README.md`**, **[`PLAN_AWESOME_CODEX_SUBAGENTS.md`](docs/PLAN_AWESOME_CODEX_SUBAGENTS.md)**.

- **`docs/PLAN_AWESOME_CODEX_SUBAGENTS.md`** — Phased plan to port **[zerwiz/awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents)** into Pi; **§8** adds **10-category** implementation order, per-folder checklist, overlap/risk notes, preset naming.

- **`.cursor/rules/pi-documentation-consistency.mdc`** — Documentation consistency (terminology, links, tables, CHANGELOG, index); **`docs/README.md`** points to it alongside **`pi-docs-core.mdc`**.

- **`docs/TUI.md`** — Pi terminal UI: **Ctrl+T** / **Shift+Tab** / **Ctrl+O**, themes, links to **`RESERVED_KEYS.md`**; indexed in **`docs/README.md`** and root **`README.md`**; **`pi-docs-core.mdc`** glob.

- **`docs/EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md`** — Session evaluation (Pi 0.62.0, team **full**): Hermes/scout OK, **`files-widget`** deps, missing **`docs/codereadme.md`**, invalid **`dispatch_agent read`**, recommendations; indexed in **`docs/README.md`**.

- **`indexer`** agent ([`.pi/agents/indexer.md`](.pi/agents/indexer.md)) + skill **`/skill:indexer`** ([`.pi/skills/indexer/SKILL.md`](.pi/skills/indexer/SKILL.md)) — Writes **`INDEX.md`** (tree + per-file roles) at a scoped path; teams **`index`**, **`full`**, **`info`**, **`new-project`**. **`docs/AGENTS.md`**, **`docs/SKILLS.md`**, **`docs/AGENT_TEAMS.md`**, **`agent/AGENTS.md`**, **`docs/REPO_INDEX.md`**.

### Fixed

- **`extensions/agent-team.ts`** — Dispatcher **`setActiveTools`** includes **`read`**, **`ls`**, and **`grep`** (**`DISPATCHER_VERIFY_TOOLS`**) so the primary agent can verify specialist artifacts (avoids **Tool read not found**); system prompt updated accordingly. **`docs/AGENT_TEAMS.md`** §1, §4, §6 and **`docs/TOOLS.md`** §4 note the verify built-ins.

- **`/theme` after `/reload`** — **`theme-cycler`** was not in **`.pi/settings.json`**, so **`/reload`** (which reapplies that list) removed the extension if it had only been loaded via extra **`-e`** flags. Added shim **`.pi/extensions/theme-cycler.ts`** and registered it in **`.pi/settings.json`**. **`docs/TUI.md`** §5 notes this behavior.

- **`scripts/ppi`** — Follow symlinks to the real **`scripts/ppi`** path before computing repo root, so **`~/.local/bin/pi-e`** and **`ppi-*`** no longer run **`just`** from **`~/.local/bin`** (“No justfile found”).

### Changed

- **`code-documenter`** agent ([`.pi/agents/code-documenter.md`](.pi/agents/code-documenter.md)) — Reads/reviews source; writes **comments / TSDoc / technical `.md` only** (no logic/tests). On teams **`full`**, **`ralph`**, **`plan-build`**, **`info`**; **`RALPH_ESCALATE`** + Ralph skill/README/**`docs/AGENTS.md`**/**`AGENT_TEAMS.md`** updated. **`documenter`** points to **`code-documenter`** for inline/API doc passes.

- **`documenter`** agent — Read-first workflow: reconcile **`README.md`**, **`docs/`**, plans, etc. with the codebase; prefer **`edit`** to fix drift; summary of reads/edits in the reply.

- **`planner`** agent — Must persist structured plans as **`plans/PLAN-YYYYMMDD-<slug>.md`** (template + handoff); tools **`write`/`edit`/`bash`**. **`builder`** and **`plan-reviewer`** updated to **`read`** those paths; **`ralph`** skill/agent mention **`plans/`**; **`docs/AGENTS.md`** inventory.

- **Team `ralph`** — Roster includes **`builder`** and **`documenter`** (**`teams.yaml`**); **`RALPH_ESCALATE`** and docs (README, **`agent/AGENTS.md`**, **`docs/AGENTS.md`**, **`AGENT_TEAMS.md`**, **`ralph` agent/skill**, **`extensions/ralph.ts`**) updated.

### Added

- **`install-global`** (repo root) — Runs **`scripts/install-ppi-global.sh`** without **`just`**; install script prints a hint if **`just`** is missing. README prerequisites list **Linux** **`just`** install options.

- **`scripts/ppi`** + **`install-ppi-global.sh`** — Run any **`justfile`** recipe from any cwd; symlinks **`ppi`**, **`pi-e`**, and **`ppi-<recipe>`** into **`~/.local/bin`**. **`scripts/README.md`**, README + **`docs/REPO_INDEX.md`**. Does not shadow the **`pi`** binary (**`ppi-pi`** = vanilla stack).

- **`github`** skill ([`.pi/skills/github/SKILL.md`](.pi/skills/github/SKILL.md)) — Branches, **`git worktree`**, GitHub push/PR patterns, multi-agent cwd handoffs; indexed in **`docs/SKILLS.md`** + **`docs/REPO_INDEX.md`**.

- **`hermes`** agent ([`.pi/agents/hermes.md`](.pi/agents/hermes.md)) — Runs **`hermes chat -q … -Q`** via **`bash`**, relays **stdout** (Hermes’s reply); optional **`--resume`**. Team **`hermes`** + roster on **`full`**/**`info`**; **[HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)** §7.

- **`docs/SKILLS.md`**, **`docs/TOOLS.md`**, **`docs/EXTENSIONS.md`** — Inventory tables: all **`.pi/skills/`** skills, all **`registerTool`** tools by extension, all **`extensions/*.ts`** modules + **`.pi/settings.json`** shims.

- **TillDone** — Writes **`.pi/tilldone-checklist.md`** on every UI refresh (task add/toggle/clear, session reconstruct): GitHub-style checklists + summary table for agent **`read`** and handoffs. README + **`docs/REPO_INDEX.md`**.

- **README (GitHub)** — Overview of docs hub, `projects/` + scanner, Ralph, Hermes/Honcho `just` recipes, expanded tree, Cursor rules, **`CHANGELOG`** link; **`just ext-ralph`** + **`all-open`** includes **ralph**.

- **Ralph team** — **`teams.yaml` `ralph`**: **`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**; **`ralph` agent** + **`SKILL.md`** document **`RALPH_ESCALATE`** and dispatcher handoff; **`extensions/ralph.ts`** help text; README + **`docs/AGENT_TEAMS.md`**.

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
