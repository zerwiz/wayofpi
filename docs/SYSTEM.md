# Pi playground: system, memory, and context

This document describes how **this repository** interacts with [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent): what “memory” means here, where configuration lives, and how agents should behave so users do not see hollow promises or fake terminal output.

If you edit behavior, keep this file aligned with **`extensions/session-memory.ts`**, **`.pi/settings.json`**, and **[EXTENSIONS.md](EXTENSIONS.md)**. For a dedicated walkthrough of memory layers, see **[AGENT_MEMORY.md](AGENT_MEMORY.md)**.

---

## 1. What this repo is

| Path (typical) | Role |
|----------------|------|
| **Repository root** (often `~/.../pi-vs-cc` or `~/.pi`) | Pi **project** root when you `cd` here and launch Pi |
| **`extensions/`** | Real extension source (TypeScript) |
| **`.pi/extensions/*.ts`** | One-line shims so Pi auto-loads implementations from `extensions/` |
| **`.pi/settings.json`** | Project theme, prompts, and **ordered extension list** |
| **`specs/`** | Human specifications; some have “status” notes at the top for partial implementations |
| **`docs/`** | This documentation set |
| **`agent/`** (under project or `~/.pi/agent`) | Pi agent install: **`sessions/*.jsonl`**, **`packages`**, global **`AGENTS.md`** if present |

Pi discovers extensions from **project** `.pi/extensions/` and paths in **`.pi/settings.json`**, not from scanning `extensions/` alone. See upstream [extension locations](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#extension-locations).

---

## 2. What “memory” is (and is not)

### 2.1 Session Memory extension (`session-memory`)

**File:** `extensions/session-memory.ts` (loaded via `.pi/extensions/session-memory.ts`).

On each model turn, **`before_agent_start`** appends a **`<session_memory>...</session_memory>`** block to the system prompt. That block can include:

- Path to this chat’s **session JSONL** (Pi’s append-only log on disk), when `getSessionFile()` is available  
- **Session id** and **cwd** from the JSONL header line  
- **Compaction / branch_summary** lines read back from the same file  
- A **dialogue recap** (early + recent turns, size-capped), labeled **`zerwis`** for user turns and **`pi`** for assistant turns (edit constants in **`extensions/chatLabels.ts`**)

There are also **follow-up rules**: bare messages like `1` or `yes` are treated as picking a numbered option from your *previous* assistant message.

**Session memory does not:**

- Run shell commands, `grep`, or `find` for you  
- Spawn subagents by itself (that requires other extensions or Pi features)  
- Store a separate “long-term project memory” file unless another extension does  
- Guarantee the model will obey “use subagents when context is large”—that is **policy** you enforce in `AGENTS.md` or user instructions  

So if the user asks “did you run the search?”, the honest answer depends on **whether tools actually ran**. Session memory only enriches the **prompt** with transcript/state derived from Pi’s session file and in-memory branch.

### 2.2 Session Saver (`session-saver`)

**File:** `extensions/sessions/index.ts`.

Persists **snapshots** (JSON) under `.pi/storage/sessions/` (configurable). Commands: `/save`, `/list`, `/show`, `/load` (`.jsonl` switches session via `switchSession`). This is **export/backup/resume**, not the same as prompt injection.

### 2.3 Skills vs extensions

| Mechanism | Format | Loaded from |
|--------|--------|-------------|
| **Skills** | `SKILL.md` + optional assets | e.g. `.pi/skills/<skill-name>/` (name must match frontmatter `name`) |
| **Extensions** | `.ts` factory `export default function (pi: ExtensionAPI)` | `.pi/extensions/`, `settings.json`, or `pi -e` |

Skills are *documentation / workflow hooks* Pi surfaces to the model; extensions *change runtime* (commands, tools, hooks). Full guide: **[SKILLS.md](SKILLS.md)**.

### 2.4 User vs project packages

Pi can load **npm/git packages** from agent settings. In the TUI you may see **[Extensions] project** vs **user**—project entries come from this repo’s **`.pi/settings.json`**; user entries come from installed Pi packages. Both coexist; order and overlap affect behavior.

---

## 3. Specs (`specs/`) — planning vs code

| Spec | Topic | Implementation note |
|------|--------|---------------------|
| [agent-workflow.md](../specs/agent-workflow.md) | Chronicle / state machine | Phase 1: `extensions/chronicle.ts`; full supervisor/subagent story in spec may be **not** in code—see status banner in file |
| [agent-forge.md](../specs/agent-forge.md) | Evolutionary tools | Phase 1: `extensions/agent-forge.ts`; shim + `/reload` after `forge_create` |
| [damage-control.md](../specs/damage-control.md) | Safety auditing | Implemented: `extensions/damage-control.ts` |
| [pi-pi.md](../specs/pi-pi.md) | Meta-agent | Implemented: `extensions/pi-pi.ts` |
| [fd-intro.md](../specs/fd-intro.md) | Intro / product copy | Doc-only unless linked elsewhere |

Treat **`specs/` as intent**: if the banner or body says “not in v1”, the markdown is ahead of or beside the TypeScript.

---

## 4. Rules for agents working in this project

These reduce friction like “I’ll run grep…” with no results, or answers that ignore injected recap.

1. **Execute, then report** — Run read/grep/bash (or Pi’s equivalents) *before* claiming outputs. Do not fabricate command listings as if they were run.  
2. **Use session recap as one signal** — The `<session_memory>` block may be stale vs disk; if something must be exact, **re-read** the file or tool output.  
3. **Stay concise when the user asks for chunks** — Short plan → tool batch → summarized result; avoid huge speculative command dumps.  
4. **Heavy scans** — For large repo-wide audits, propose splitting work (multiple turns, focused paths, or subagent flows if the user’s stack supports it).  
5. **Respect project conventions** — See root **`CLAUDE.md`**: Bun, `just`, register tools at extension top level, shims only under **`.pi/extensions/`**.

---

## 5. Related docs

- **[CONCEPTS.md](CONCEPTS.md)** — Skills, agents, extensions, and tools (distinctions)  
- **[TOOLS.md](TOOLS.md)** — How Pi tools work; built-ins vs extension tools vs agent allowlists  
- **[EXTENSIONS.md](EXTENSIONS.md)** — Shim pattern, checklist for new extensions, picker behavior  
- **[sessions.md](sessions.md)** — Session Saver (legacy sections may exist; prefer **`extensions/sessions/README.md`**)  
- **Root [README.md](../README.md)** — Extension table, `just` recipes, install  

---

## 6. Changelog habit

When you add or materially change an extension, update **root `README.md`** (table), **`CHANGELOG.md`**, and any spec **status** banner so “planning vs implemented” stays honest.
