# Scripts

## `ppi` — Pi playground dispatcher (**Pi** commands)

This repo’s workflows are defined in the root **`justfile`**. **`scripts/ppi`** resolves its **real path** (symlinks in **`~/.local/bin`** are followed), **`export`s `PI_E_PROJECT_DIR`** and **`PI_USER_PROJECT_DIR`** as the directory you were in **before** the **`cd`** to the playground (so **`just pi-e`** options **1–2** (setup) apply to your app repo, and the **`workspace-boundary`** extension can tell the model your app vs **`~/.pi/agent`** / the playground clone), **`cd`**s to the repo root, **sources `.env` at the repo root if present** (so **`OPENROUTER_API_KEY`** and other secrets reach **`pi`**), then runs **`just`**.

**Naming:** **`ppi` / `ppi-*`** are for **Pi** (TUI, extensions, playground recipes). **Honcho** and **Hermes** have their **own** global names and configs; they may call the same **`just`** targets under the hood, but they are **not** “Pi commands.” See **[HONCHO_INTEGRATION.md](../docs/HONCHO_INTEGRATION.md#command-namespaces-system-first)**.

| Action | Command |
|--------|---------|
| List recipes | `ppi` (no arguments) |
| Run a **Pi** recipe | `ppi ext-agent-team`, `ppi ext-pi-doctor`, `ppi pi-picker-ollama-free-or`, `ppi-pi`, … |
| Interactive extension stacker | `pi-e` or `ppi pi-e` |
| Recover after crash (settings / `tools` shadow) then picker | `pi-e backup` or `pi-e restore` from your **app repo** |

### Install (PATH)

From the repo root ( **`just` not required** ):

```bash
./install-global
# or:
./scripts/install-ppi-global.sh
```

If you already use **`just`**:

```bash
just install-global
```

This symlinks into **`~/.local/bin`** (or **`$PREFIX/bin`** if set):

**Pi (playground):**

- **`ppi`** — dispatcher (`ppi …` → `just …`)
- **`pi-e`** — same as `ppi pi-e`
- **`ppi-<recipe>`** — one symlink per **`justfile`** recipe in **`install-ppi-global.sh`** (Pi + Hermes bridge recipes). Use **`ppi-ext-*`**, **`ppi-pi`**, **`ppi-hermes-honcho-*`**, …
- **`pg-pi`** / **`pg-pi-standard`** — short aliases for **`ppi-pi`** / **`ppi-pi-standard`**

**Hermes (bridge — `just` recipes in this repo):**

- **`hermes-status`**, **`hermes-honcho-status`**, **`hermes-honcho-setup`** — **`exec`** matching **`ppi-hermes-*`**

**Honcho** Docker stack and **`honcho-open-*`** browser helpers are **not** part of this repo — install from **`~/honcho-server/scripts/install-honcho-bin.sh`** (see **`~/honcho-server/scripts/README.md`**).

The real **`pi`** binary is **not** replaced; use **`ppi-pi`** or **`pg-pi`** for the **`just pi`** recipe (playground **`.env`** + normal Pi, loads **`<project>/.pi/settings.json`** extensions).

After **`./install-global`** you also get **`pi-standard`** → **`scripts/pi-standard`**: upstream **minimal harness** — **`--no-extensions --no-skills --no-themes --no-prompt-templates`** per [Pi README — CLI Reference · Resource options](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md). Still uses **`~/.pi/agent`** models / keys / context files; skips linked **extensions[]** from the project. Optional leading **`.`** is ignored (e.g. **`pi-standard .`**). From the repo: **`just pi-standard`** / **`ppi-pi-standard`**.

### Environment

- **`PI_PLAYGROUND`** — set by `ppi` to the repo root for child processes (optional for other tools).
- **`.env`** — loaded by **`ppi`** before **`just`** (never commit; **`OPENROUTER_API_KEY`** etc.).

## `pi-with-env` — `pi` with this repo’s `.env`

If you run the **`pi`** binary directly (not via **`ppi`** / **`just pi`**), it will not see this repo’s **`.env`**. Use:

```bash
./scripts/pi-with-env
# or, from anywhere after chmod +x:
~/.pi/scripts/pi-with-env -e extensions/foo.ts
```

Optional shell alias: `alias pi='~/.pi/scripts/pi-with-env'` (only if you intend every `pi` to use this playground’s keys).

## `pi-launch-from-project.sh` — `pi-e` launcher (cwd + optional `tools/` shadow)

Canonical **`pi-e`** behavior (**FULL vs project-scoped**): **[docs/PLAYGROUND.md](../docs/PLAYGROUND.md)** and **`.cursor/rules/pi-pi-e-playground-modes.mdc`**.

Used by **`just pi-e`**: runs **`pi`** with **`cwd`** = **`PI_E_PROJECT_DIR`**, rewrites relative **`-e`** paths against the playground root, and — when you picked **pi-e option 1** (FULL) **or 2** (wired project-local) — defaults **`PI_SHADOW_LEGACY_PROJECT_TOOLS=1`** so the project’s root **`tools/`** folder is **renamed aside** for that session only (Pi’s legacy custom-tools scanner ignores it; **`./tools`** is restored when Pi exits). Set **`PI_SHADOW_LEGACY_PROJECT_TOOLS=0`** with **`ppi pi-e`** to keep **`tools/`** untouched (you may still see Pi’s migration warning; that check lives in **pi-mono**, not this repo).

**`pi-e`:** **`extensions[]`** is **kept** only when you pick **menu 1 and/or 2 alone** (no line **3+**). **Any extension menu pick** (3+), **`all`**, or **`1 12`**-style combos sets **`PIE_CLEAR_SETTINGS_EXTENSIONS=1`**: **`pi-launch-from-project.sh`** backs up **`.pi/settings.json`**, sets **`extensions`: []** for that run, **restores on exit** — only your stacked **`-e`** list loads as TS. **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** always keeps JSON **`extensions[]`**.

If **`.pi/.playground-from`** exists and **`PIE_CLEAR_SETTINGS_EXTENSIONS=0`**, **`sanitize-linked-playground-settings.py`** may strip **`pi-pi.ts`**. Set **`PI_SKIP_LINKED_SETTINGS_SANITIZE=1`** to skip.

## `pi-with-project-tools` — opt-in legacy `tools/` per project

Newer Pi versions print a warning when a project contains a root `tools/` directory (legacy custom tools were migrated into extensions).

If you still want to keep project-root tools **but only enable them when you choose**:

1. In that project, rename:
   - `tools/` → `tools.off/`
2. Launch Pi via:

```bash
~/.pi/scripts/pi-with-project-tools
```

This wrapper temporarily symlinks `tools/` → `tools.off/` for the lifetime of the Pi process, then removes the symlink on exit.

## Use this playground in another project (opt-in)

If you want any project to use the same **extensions / skills / prompts / themes** as this playground **only when you choose**:

- **Enable** — requires **`python3`**. **Default:** **`<project>/.pi/settings.json`** gets **every** playground extension (full merge). **`PLAYGROUND_LINK_LEAN=1`**: only paths already listed in playground **`.pi/settings.json`** (lighter merge; no **`pi-e`** menu entry — set the env var when running **`enable-playground-in-project`**). Both modes add **skills**, **themes**, **prompts**; first-time writes also symlink **`.pi/agents`**, **`.claude/commands`**, **`.pi/damage-control-rules.yaml`** when absent. Writes **`.pi/.playground-from`**. If **`<project>/.pi/settings.json`** already exists, only **`settings.playground.json`** is written (merge manually — no auto symlinks).

```bash
~/.pi/scripts/enable-playground-in-project /abs/path/to/project
```

**Agents** still resolve from **`<project>/.pi/agents`** (not auto-symlinked). See **[docs/PLAYGROUND.md](../docs/PLAYGROUND.md)**.

- **Project-local** — **`scripts/init-project-local-pi-env.sh <project>`**: local-only template (relative skills path, no playground symlinks). **`pi-e` → option 2** runs **`init-project-local-pi-env.sh <project> <playground-root>`**: symlinks playground **agents** / **commands** / **damage-control**, writes **`.playground-from`**, and **`settings.json`** with **`extensions": []`** and absolute **skills/themes/prompts** from the playground. If **`<project>/.pi/settings.json`** already exists, writes **`settings.project-local-wired.json`** for manual merge. Use **`playground-portal`** to copy extensions into the repo.

- **Disable** — removes **`.playground-from`** and playground-generated **`settings.json`**, and always drops **`settings.playground.json`**. Legacy installs without a marker file are detected heuristically.

```bash
~/.pi/scripts/disable-playground-in-project /abs/path/to/project
```

## `pi-models-scoped-priority.ts`

**`normalize-pi-config-model-order.py`** — rewrites **`pi.config.json`** so every OpenRouter **`:free`** model appears before non-free OpenRouter rows (stable order). **`just normalize-pi-config-models`**.

Emits a comma-separated **`pi --models`** string so **Ctrl+L** / **Ctrl+P** stay within **Ollama → OpenRouter `:free` → other OpenRouter (from `pi.config.json`)** (plus native OpenAI only if you add those rows back). Run from the **playground root** (where **`agent/models.json`** and **`pi.config.json`** live):

```bash
bun scripts/pi-models-scoped-priority.ts
```

**`just pi-picker-ollama-free-or`** runs **`pi --models "$(bun …)"`**. See **`README.md`** § OpenRouter (why the default **`/model`** sort is not “Ollama first”).

## Way of Pi upstream (Pi GitHub / npm)

- **`scripts/wop-pi-upstream.ts`** — **`check`**: compares **`badlogic/pi-mono`** tags and **`@mariozechner/pi-coding-agent`** npm **`latest`** to **`wop.upstream.lock.json`** (no downloads). **`sync`**: optional tarball of a **tag** into **`vendor/wop-upstream/`** with path rewrites (**`--dry-run`** | **`--apply`**). See **`scripts/wop-upstream/README.md`**, **`docs/WOP_UPSTREAM_SYNC.md`**.
- **`just wop-upstream-check`** · **`just wop-upstream-sync --source pi-mono --ref v0.66.1 --dry-run`**

## Other

- **`quick-start.sh`** — Ollama-oriented Pi quick start (legacy/helper).
