## How to use extensions in this Pi playground

This guide is for **using** the extensions that are already wired into this repo: which ones exist, what they do, and how to turn stacks on/off. For authoring and internals, see **`EXTENSIONS.md`**.

---

## 1. Where extensions live and how they load

- **Source**: `extensions/*.ts` — real implementations.
- **Shims**: `.pi/extensions/*.ts` — one-line exports like:

  ```ts
  export { default } from "../../extensions/minimal.ts";
  ```

- **Settings**: `.pi/settings.json` → `"extensions"` lists which shims Pi loads **by default** when you run Pi from **this repo’s root** (your clone path).

You can also run ad-hoc stacks with:

```bash
pi -e extensions/minimal.ts -e extensions/agent-team.ts
```

or use the `just` recipes (see root `README.md` and `justfile`) like:

```bash
just ext-minimal
just ext-agent-team
```

---

## 2. Extension cheat sheet (what to use when)

These are the most important extensions in this playground and how you normally invoke them.

### 2.1 `minimal.ts` — compact footer

- **What it does**:
  - Replaces Pi’s default footer with a **minimal bar**: model name + 10-block context meter.
- **Use when**: you want less visual noise.
- **How to run**:
  - `just ext-minimal`
  - or: `pi -e extensions/minimal.ts`

### 2.2 `theme-cycler.ts` — theme switching

- **What it does**:
  - Adds `/theme` command and keyboard shortcuts (Ctrl+X / Ctrl+Q) to **cycle terminal themes** defined in `.pi/themes/`.
- **Use when**: you want to quickly change the look of Pi without restarting.
- **How to run**:

  ```bash
  just ext-theme-cycler
  # or
  pi -e extensions/theme-cycler.ts -e extensions/minimal.ts
  ```

### 2.3 `extension-picker.ts` — `/extensions`, `/remember`, `/memory`

- **What it does**:
  - `/extensions`: interactive picker that scans Pi packages and this repo for extension entrypoints and prints a ready-to-run `pi -e …` command.
  - `/remember`: append text to cross-session memory.
  - `/memory`: show recent memory snippets.
- **Use when**: you want to discover available extension stacks and quickly boot into them.
- **How to run**:
  - `just ext-extension-picker`
  - or: `pi -e extensions/extension-picker.ts -e extensions/minimal.ts`

### 2.4 `session-memory.ts` — inject recent context

- **What it does**:
  - Maintains a `<session_memory>` recap and injects it into the system prompt so the model can recall previous turns without you pasting them.
- **Use when**: you have **long sessions** and want the model to remember earlier work.
- **How to run**:
  - `just ext-session-memory`
  - or: `pi -e extensions/session-memory.ts -e extensions/minimal.ts`

### 2.5 `sessions/index.ts` — session saver (`/save`, `/load`)

- **What it does**:
  - Adds `/save`, `/list`, `/show`, `/load` commands to manage **session snapshots** under `.pi/storage/sessions/`.
- **Use when**: you want to checkpoint work and come back later.
- **How to run**:
  - `just ext-session-saver`
  - or: `pi -e extensions/sessions/index.ts -e extensions/minimal.ts`

### 2.6 `chronicle.ts` — workflow ledger

- **What it does**:
  - Writes a **chronicle ledger** to `.pi/chronicle/` summarizing important events, tools, and decisions.
- **Use when**: you want a durable history of what happened in a session or across sessions.
- **How to run**:
  - `just ext-chronicle`
  - or: `pi -e extensions/chronicle.ts -e extensions/minimal.ts`

### 2.7 `agent-team.ts` — multi-agent dispatcher

- **What it does**:
  - Turns Pi into a **multi-agent dispatcher** with a grid UI.
  - Provides `dispatch_agent` tool and `/agents` commands.
  - Uses `.pi/agents/teams.yaml` presets like `full`, `plan-build`, `ralph`, `info`, `pi-pi`.
- **Use when**:
  - You want **scout → planner → builder → reviewer** flows.
  - You want Ralph plus specialists around a ticket queue.
- **How to run**:

  ```bash
  # See root README for the exact stack; typical:
  pi -e extensions/minimal.ts -e extensions/agent-team.ts
  ```

### 2.8 `agent-chain.ts` — fixed pipelines

- **What it does**:
  - Reads `.pi/agents/agent-chain.yaml` and exposes a tool/command to run **named chains**.
- **Use when**:
  - You want a **repeatable pipeline** (e.g. “plan → implement → review → document”) driven by a single command.

### 2.9 `ralph.ts` — Ralph queue helper

- **What it does**:
  - Ensures `todo/`, `inprogress/`, `done/` exist.
  - Registers the `ralph_queue_status` tool.
  - Adds `/ralph help | status | prompt` commands.
- **Use when**:
  - You want Ralph to supervise on-disk tickets in this repo (see `HOW_TO_USE_AGENTS.md` §4 and `HOW_TO_USE_SKILLS.md` for the `ralph` skill).
- **How to run**:
  - `just ext-ralph`
  - or: `pi -e extensions/ralph.ts -e extensions/minimal.ts`

### 2.10 `tilldone.ts` — task discipline (now opt-in gate)

- **What it does**:
  - Provides a `tilldone` tool and `/tilldone` overlay to track **task lists**.
  - Shows progress in the footer and writes `.pi/tilldone-checklist.md`.
  - Optionally **blocks tools until tasks are defined and one is in progress** (see below).
- **Use when**:
  - You want a **strict “work till it’s done” discipline** for yourself or agents.
- **Gate (blocking) behavior**:
  - By default in this playground, the blocking gate is **disabled**:
    - Tools (like `read`, `ls`, git) are allowed even without TillDone tasks.
  - To **enforce** the gate, set:

    ```bash
    export TILLDONE_ENFORCE=1
    ```

    before launching Pi with `tilldone` enabled.

---

## 3. How to combine extensions (stacks)

The **`justfile`** defines helpful stacks, for example:

- `just ext-minimal` → `pi -e extensions/minimal.ts`
- `just ext-agent-team` → session-memory + context-local-hints + **`agent-team.ts`** + theme-cycler (**no** minimal — grid has its own footer)
- `just ext-builder-team` → same except **`agent-team-build-orchestra.ts`** (initial roster **`build-orchestra`**, not the first YAML team)
- `just ext-agent-chain` → session-memory + context-local-hints + agent-chain + theme-cycler
- **`just pi-e`**: **agent-team** vs **agent-team (build-orchestra)** are **different** menu lines, **immediately consecutive** — with the current **`pi-e`** list, **12** = agent-team and **13** = builder (**1–2** are setup). Greedy digit split accepts **`1213`** for both. Do not load both `.ts` entrypoints in one session.
- `just ext-ralph` → minimal footer + Ralph queue
- `just ext-theme-cycler` → minimal footer + theme cycler

You can also use the **extension picker**:

1. Run `just ext-extension-picker` (or `pi -e extensions/extension-picker.ts -e extensions/minimal.ts`).
2. Use `/extensions` to pick a stack.
3. Copy the suggested `pi -e …` command into a new terminal to launch that stack.

---

## 4. Quick “which extension do I need?”

- “**I want a simpler UI footer.**” → `minimal.ts` (stacked with others).
- “**Cycle themes quickly.**” → `theme-cycler.ts`.
- “**See which extensions/skills are installed and generate pi -e commands.**” → `extension-picker.ts` (`/extensions`).
- “**Have multiple agents (planner, builder, reviewer, Ralph) work together.**” → `agent-team.ts`.
- “**Run a fixed plan → build → review pipeline.**” → `agent-chain.ts`.
- “**Track tasks with a checklist.**” → `tilldone.ts` (with or without the enforced gate).
- “**Chronicle what happened in this session.**” → `chronicle.ts`.
- “**Save/restore sessions across restarts.**” → `sessions/index.ts` via `ext-session-saver`.

For more detail on any of these, cross-check **`EXTENSIONS.md`** (structure, shim pattern, authoring) while using this quick-usage guide.

