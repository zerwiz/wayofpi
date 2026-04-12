# What “the playground” is

In this repo, **“the playground”** means a **self-contained Pi project** you can run Pi from (by `cd`’ing into it) that also serves as a **reusable toolbox** for other projects.

The **playground root** is **whatever directory you cloned** this repository into (it contains **`extensions/`**, **`.pi/`**, **`justfile`**, …). It is **not** a fixed path on disk.

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
cd /path/to/your/wayofpi-clone
just pi
```

### 2) Use playground resources inside another project (opt-in)

#### `pi-e` modes (canonical)

| | **Option 1 — FULL** | **Option 2 — project-scoped** |
|--|---------------------|--------------------------------|
| **Intent** | Writes/merges linked **`settings.json`** (when missing). | Wired **`.pi/`** + playground paths; stack TS from menu. |
| **`settings.json` on disk** | **`enable-playground-in-project`** → fat **`extensions[]`** (or **`settings.playground.json`** if a file already exists). | **`init-project-local-pi-env.sh <app> <playground>`** — **`extensions": []`**, skills/themes/prompts + symlinks. |
| **At `pi` launch** | **Only `1` and/or `2` alone:** keep **`extensions[]`** (full Pi). **`1` or `2` plus any menu line ≥3** (e.g. **`1 12`**): **clear for this run** — only your **`-e`** stack (+ auto **`minimal`** if needed). | Same clear behavior whenever you add menu lines **3+** (or **`all`**). |
| **Escape hatch** | **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** keeps JSON **`extensions[]`** even when you also picked extension lines. | Same. |

Rule for editors/agents: **`.cursor/rules/pi-pi-e-playground-modes.mdc`**.

---

**`ppi pi-e` → option 1 (FULL)** applies to the directory you launched **`ppi`** from (**`PI_E_PROJECT_DIR`**). It merges **every** playground extension (shims + `extensions/*.ts` factories) **except** **`pi-pi`** (meta-agent grid — use **`just ext-pi-pi`** or an explicit **`pi-e`** line). You still get a **large** stack (purpose-gate, cross-agent, …) **plus** global **`~/.pi/agent`** packages.

**`PLAYGROUND_LINK_LEAN=1`** with **`scripts/enable-playground-in-project`** links **skills**, **themes**, **prompts**, **agents** symlinks, and **damage-control**, but only merges extension paths **already listed** in the playground **`.pi/settings.json`** (no auto-scan of every **`extensions/*.ts`** factory). There is **no** separate **`pi-e`** menu line for this — run the script with that env var from your app repo when you want a lighter link than **FULL**.

**`pi-e` option 1 (FULL)** runs **`enable-playground-in-project`**. If your selection is **only** **`1`** (and optionally **`2`**): Pi uses the merged **`extensions[]`** in **`.pi/settings.json`** — **full playground power**. If you add **any menu extension** (line **3+**, e.g. **`1 12`**), that run clears **`extensions[]`** for Pi only (restored on exit) so **only** the **`-e`** modules you chose load — FULL setup still lands on disk for the next session. Use **`PIE_KEEP_SETTINGS_EXTENSIONS=1`** to **merge** JSON extensions **and** your **`-e`** picks in one run.

**`pi-e` option 2** plus menu lines **3+**: same **clear-for-session** behavior; skills/agents paths stay wired. Concatenated digits split greedily (e.g. **`112`** → **11** then **2**); use spaces when stacking setup + extensions (e.g. **`1`** + **`12`**). **agent-team** and **agent-team (build-orchestra)** are separate lines — the latter loads **`agent-team-build-orchestra.ts`** (initial team **`build-orchestra`**). Choosing **either agent-team variant** or **agent-chain** **prepends** **`session-memory`** and **`context-local-hints`** if not already selected.

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

