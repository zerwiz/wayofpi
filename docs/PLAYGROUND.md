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

#### `pi-e` modes (canonical)

| | **Option 1 — FULL** | **Option 2 — project-scoped** |
|--|---------------------|--------------------------------|
| **Intent** | Full Pi / full merged playground in that app repo. | Only the extensions you pick from the menu; agents + skills still tied to the playground clone. |
| **`settings.json`** | Written by **`enable-playground-in-project`** — fat **`extensions[]`**. | Written by **`init-project-local-pi-env.sh <app> <playground>`** — **`extensions": []`**, absolute **skills / themes / prompts** + symlinks. |
| **At `pi` launch** | **`extensions[]` is used** (not cleared). No auto-**`minimal`** (JSON stack already complete). | **`extensions[]` cleared for this run only** (restored on exit); only **`-e`** stack loads (**`PIE_CLEAR_SETTINGS_EXTENSIONS=1`**). |
| **Escape hatch** | N/A for full behavior. | **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** keeps JSON **`extensions[]`** even in scoped mode. |

Rule for editors/agents: **`.cursor/rules/pi-pi-e-playground-modes.mdc`**.

---

**`ppi pi-e` → option 1 (FULL)** applies to the directory you launched **`ppi`** from (**`PI_E_PROJECT_DIR`**). It merges **every** playground extension (shims + `extensions/*.ts` factories) **except** **`pi-pi`** (meta-agent grid — use **`just ext-pi-pi`** or an explicit **`pi-e`** line). You still get a **large** stack (purpose-gate, cross-agent, …) **plus** global **`~/.pi/agent`** packages.

**`PLAYGROUND_LINK_LEAN=1`** with **`scripts/enable-playground-in-project`** links **skills**, **themes**, **prompts**, **agents** symlinks, and **damage-control**, but only merges extension paths **already listed** in the playground **`.pi/settings.json`** (no auto-scan of every **`extensions/*.ts`** factory). There is **no** separate **`pi-e`** menu line for this — run the script with that env var from your app repo when you want a lighter link than **FULL**.

**`pi-e` option 1 (FULL):** Pi loads **`extensions[]` from** **`<project>/.pi/settings.json`** (full merged playground list) — **full Pi power** for that app. You can still add extra **`-e`** lines from the menu; optional **`minimal`** is **not** auto-appended (the JSON stack already includes it). **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** is only needed if you want to force merging JSON extensions in other modes.

**`pi-e` option 2 (project-scoped):** **`extensions[]` is cleared for that Pi run only** (restored on exit) so only the **`-e`** modules you picked load (plus auto **`minimal`** when you omit pure-focus / agent-team). **`settings.json`** still carries **skills**, **themes**, **prompts**, and **symlinked agents** from the wired playground so **agent-team** and skills behave like the main repo without pulling in every TS extension. Concatenated digits split greedily (e.g. **`112`** → **11** then **2**); use spaces for **`1`** + **12** (agent-team).

**`ppi pi-e` → option 2** creates **`<project>/.pi/`** via **`init-project-local-pi-env.sh <project> <playground>`**: symlinks **`.pi/agents`**, **`.claude/commands`**, **`.pi/damage-control-rules.yaml`**, **`.playground-from`**, and **`settings.json`** with **`extensions": []`** plus absolute playground **skills / themes / prompts** and **`<project>/.pi/skills`**. Standalone **`init-project-local-pi-env.sh` /abs/project** (one argument) is **local-only** (no playground symlinks).

**`pi-e` after option 1 or 2** launches Pi via **`scripts/pi-launch-from-project.sh`**: session **cwd** is your app repo, **`-e`** paths resolve to the playground clone, and **by default** root **`tools/`** is **moved aside** for that run only (restored on exit) so Pi does not treat it as legacy custom tools — set **`PI_SHADOW_LEGACY_PROJECT_TOOLS=0`** if you must keep **`tools/`** visible to Pi during the session.

**Option 1** gives that project the **full playground extension set** (every shim + every factory under **`extensions/`**), plus **skills**, **themes**, and **prompts**, via absolute paths. When **`settings.json`** is created (not the merge-only **`settings.playground.json`** case), it also adds **symlinks** if missing: **`<project>/.pi/agents`**, **`<project>/.claude/commands`**, **`<project>/.pi/damage-control-rules.yaml`** → the playground clone so **agent-team**, **cross-agent**, and **damage-control** see the same trees as in the playground. **`disable-playground-in-project`** removes those symlinks when they point into that clone.

Enable it from the app directory:

```bash
cd /abs/path/to/your/project
~/.pi/scripts/enable-playground-in-project
```

This writes **`<project>/.pi/settings.json`** (or **`settings.playground.json`** only if **`settings.json`** already exists — merge by hand). Contents mirror the playground **`.pi/settings.json`** with **absolute paths** into the clone, and add **`.pi/skills`** / **`.pi/themes`** when present. **`<project>/.pi/.playground-from`** records the clone root for **`disable-playground-in-project`**.

**Agents:** extensions such as **agent-team** still scan **`<project>/.pi/agents`**. To use the playground’s agent library in another repo, work from the playground directory, merge agent paths if your Pi version supports it, or symlink **`<project>/.pi/agents`** to the playground’s **`.pi/agents`** (only if you accept sharing that tree).

Disable it later:

```bash
~/.pi/scripts/disable-playground-in-project
```

---

## How this relates to “project-specific tools”

Some projects may have their own **project-local** Pi config under `<project>/.pi/`.

This playground adds opt-in helpers:

- **Playground-linked resources** (extensions/skills/prompts) via `enable-playground-in-project` / **`pi-e` 1**
- **Wired project-local `.pi/`** via **`pi-e` 2** ( **`init-project-local-pi-env.sh <app> <playground>`** ) or standalone one-arg init for **local-only** template + **`playground-portal`**
- **Legacy project-root `tools/`** (only when you choose) via `pi-with-project-tools`  
  See `scripts/README.md`.

So you can pick per project:

- **pure project-local behavior**, or
- **playground-provided toolbox**, or
- **both** (by merging settings if needed).

