# Scripts

## `ppi` — global Pi playground commands

This repo’s workflows are defined in the root **`justfile`**. **`scripts/ppi`** resolves its **real path** (symlinks in **`~/.local/bin`** are followed), **`cd`**s to the repo root, **sources `.env` at the repo root if present** (so **`OPENROUTER_API_KEY`** and other secrets reach **`pi`**), then runs **`just`**.

| Action | Command |
|--------|---------|
| List recipes | `ppi` (no arguments) |
| Run a recipe | `ppi ext-agent-team`, `ppi pi-cycle-or-free-first`, `ppi honcho-status`, … |
| Interactive extension stacker | `pi-e` or `ppi pi-e` |

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

- **`ppi`** — dispatcher (`ppi …` → `just …`)
- **`pi-e`** — same as `ppi pi-e`
- **`ppi-<recipe>`** — one symlink per `justfile` recipe (e.g. **`ppi-ext-minimal`**, **`ppi-honcho-up`**)

The real **`pi`** binary is **not** replaced; use **`ppi-pi`** for the **`just pi`** recipe.

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

If you want any project to be able to use the **agents/skills/extensions/prompts** from this playground **only when you choose**:

- Enable (writes `<project>/.pi/settings.json` or `.pi/settings.playground.json`):

```bash
~/.pi/scripts/enable-playground-in-project /abs/path/to/project
```

- Disable (removes the generated settings file when safe):

```bash
~/.pi/scripts/disable-playground-in-project /abs/path/to/project
```

## Other

- **`quick-start.sh`** — Ollama-oriented Pi quick start (legacy/helper).
