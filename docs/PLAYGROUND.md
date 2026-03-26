# What “the playground” is

In this repo, **“the playground”** means a **self-contained Pi project** you can run Pi from (by `cd`’ing into it) that also serves as a **reusable toolbox** for other projects.

On this machine, the playground root is:

- **`/home/zerwiz/.pi`**

---

## What the playground contains

The playground bundles:

- **Extensions** (TypeScript) under `extensions/`  
  Loaded via `.pi/extensions/` shims and `.pi/settings.json`.
- **Agents** (personas) under `.pi/agents/` and `agents/`  
  Used by `system-select`, `agent-team`, and `agent-chain`.
- **Skills** (workflows) under `.pi/skills/`  
  Invoked via `/skill:<name>`.
- **Docs** under `docs/`  
  Explains how everything is wired (memory, extensions, agents, teams, tools).
- **Scripts** under `scripts/`  
  Helpers to launch Pi and opt-in to special behaviors.

The goal is to keep Pi configuration and reusable automation **out of your application repos**, but still make it easy to opt-in when you want it.

---

## Two ways to use the playground

### 1) Run Pi “inside the playground”

Use this when you’re working on Pi itself (extensions, agents, docs):

```bash
cd /home/zerwiz/.pi
just pi
```

### 2) Use playground resources inside another project (opt-in)

Use this when you want a normal project (e.g. `~/CodeP/MineSweeper`) to be able to use:

- the playground’s **extensions**
- the playground’s **skills**
- the playground’s **prompt templates**

Enable it in that project:

```bash
cd /abs/path/to/your/project
~/.pi/scripts/enable-playground-in-project
```

This writes a project-local config file:

- `<project>/.pi/settings.json` (or `<project>/.pi/settings.playground.json` if one already exists)

Disable it later:

```bash
~/.pi/scripts/disable-playground-in-project
```

---

## How this relates to “project-specific tools”

Some projects may have their own **project-local** Pi config under `<project>/.pi/`.

This playground adds two opt-in helpers:

- **Playground resources** (extensions/skills/prompts) via `enable-playground-in-project`
- **Legacy project-root `tools/`** (only when you choose) via `pi-with-project-tools`  
  See `scripts/README.md`.

So you can pick per project:

- **pure project-local behavior**, or
- **playground-provided toolbox**, or
- **both** (by merging settings if needed).

