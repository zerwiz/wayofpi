# Architecture Concepts

> Way of Pi system concepts, patterns, and architectural decisions.

---

## 🏗️ Architecture Overview

**System**: Way of Pi AI coding agent playground

**Components**:

- Core Pi agent (`.pi/agents/wop-agents/pi.agent.yml`)
- Sub-agents (`apps/wayofwork-ui/agent/`)
- Extensions (`.pi/extensions/`)
- Skills (`.pi/skills/`)
- Tools (`.pi/tools/`)
- Team orchestration (`.pi/agents/teams.yaml`)
- Session memory (`extensions/sessions/`)
- Chronicle ledger (`.pi/chronicle/`)
- Hermes/Honcho integration (`docs/hermes/`, `docs/honcho/`)

**Patterns**:

- Agent dispatching
- Tool allowlist filtering
- Progressive disclosure
- Session memory injection
- Chronicle-ledger logging
- Damage control enforcement

---

## 🧠 Agent Memory Model

**Components**:

- **Session Memory**: Active session dialogue
- **Persistent Memory**: Fact storage
- **Lessons**: User corrections
- **Events**: Event logging
- **Ledger**: Chronicle ledger
- **Injections**: Session memory injection

**Flows**:

1. Agent receives prompt
2. Session memory read via `getSessionFile()`
3. Prompt + memory injected to system prompt
4. Agent generates response
5. Response stored in session
6. Memory updated as needed

**Commands**:

- `/remember` — Store memory
- `/memory` — Recall memory
- `/forget` — Remove memory

**File**: `extensions/session-memory.ts`

---

## 🔌 Extension Architecture

**Pattern**: Shim-based extension loading

**Location**: `.pi/extensions/`

**Discovery**: Every `*.ts` file in `.pi/extensions/` is loaded as extension.

**Shim Pattern**:

1. Extension in `.pi/extensions/` is shim
2. Upstream extension in `ref/extensions/`
3. Shim forwards to upstream implementation
4. Pi loads all `*.ts` in `.pi/extensions/`

**Commands**:

- `/extensions` — List extensions
- `/extension-hint` — Extension hint for stacking
- `/extension-preserve` — Preserve state

**Extensions**:

- **agent-team.ts** — Team orchestration
- **chronicle.ts** — Ledger logging
- **damage-control.ts** — Safety checks
- **dynamic-loader.ts** — Dynamic loading
- **extension-picker.ts** — UI picker
- **session-memory.ts** — Memory injection
- **session-replay.ts** — Session replay
- **subagent-widget.ts** — Widget
- **system-select.ts** — Model selector
- **theme-cycler.ts** — Theme cycling

---

## 🧱 Session Memory Components

**File**: `extensions/session-memory.ts`

**Commands**:

- `/sessionmemory` — on|off|status
- `/session-memory` — same as above

**Implementation**:

1. Read current chat's persisted JSONL
2. Inject path and id
3. Include dialogue recap
4. Add compaction/branch summaries

---

## 📜 Chronicle Ledger

**File**: `.pi/extensions/chronicle.ts`

**Purpose**: Ledger and optional workflow graph

**Commands**:

- `/chronicle` — Show ledger
- `/chronicle_status` — Status
- `/chronicle_snapshot` — Snapshot
- `/chronicle_transition` — Transition

---

## 🛡️ Damage Control

**Location**: `.pi/rules/damage-control-rules.yaml`

**Purpose**: Rule enforcement, safety

**Checks**:

- File system safety
- Command validation
- Tool allowlists
- Session limits

---

## 🔄 Dynamic Extension Loading

**File**: `.pi/extensions/dynamic-loader.ts`

**Purpose**: Extensions loaded without restart

**Legacy**: Session commands moved from `dynamic-loader` to `session-saver`

---

## 📋 Extension Picker UI

**File**: `.pi/extensions/extension-picker.ts`

**Commands**: `/extensions`, `/extentions`

**Function**:

1. List `pi.extensions` from `settings.json`
2. Include git and npm packages
3. Include local `extensions/*.ts`
4. Write launch hint to `~/.pi/storage/last-extension.json`

---

## 🧭 Session Memory

**File**: `extensions/sessions/index.ts`

**Auto-save**: On `message_end` event

**Commands**:

- `/save` — Save session
- `/list` — List sessions
- `/show <session>` — Show session
- `/load <session>` — Load session

---

## 🎯 Agent Team Orchestration

**File**: `.pi/agents/teams.yaml`

**Presets**: `.pi/agents/teams-presets.json`

**Commands**:

- `/agents` — List roster
- `/agents-team-add` — Add member
- `/agents-team-remove` — Remove member
- `/agents-preset-*` — Load preset
- `/agents-save-preset` — Save preset

---

## 🧰 Tool Allowlist

**File**: `.pi/settings.json`

```json
{
  "settings": {
    "maxFileSize": 512 * 1024,
    "tools": [
      "bash",
      "curl",
      "grep",
      "find",
      "git",
      "ls",
      "tree",
      "cat",
      "code"
    ]
  }
}
```

---

## 🧠 Skills System

**Location**: `.pi/skills/`

**Progressive Disclosure**: Skills revealed only when needed

**Commands**:

- `/skill:name` — Invoke skill
- `/skills list` — List skills
- `/skills add <skill>` — Add skill package

---

## 🔄 Multi-Agent Communication

**WebSocket**: Core Pi ↔ Sub-agents

**File**: `docs/WOP_MULTI_AGENT_WEBSOCKET.md`

**Pattern**:

1. Core Pi orchestrates
2. Sub-agents execute tasks
3. Results consolidated
4. Context shared

---

## 🧪 Testing & Verification

**File**: `test_agents.ts`

**Purpose**: Agent testing utilities

---

## 🔐 Security

**Damage Control**: Enforced via `damage-control-rules.yaml`

**Session Limits**: 2000 lines max, 50KB per file

**File Safety**: `.gitignored` files excluded

---

## 📄 Documentation Files

| File              | Description         |
| ----------------- | ------------------- |
| `AGENTS.md`       | Agent catalog       |
| `AGENT_MEMORY.md` | Memory model        |
| `AGENT_TEAMS.md`  | Team orchestration  |
| `AGENT_MEMORY.md` | Memory commands     |
| `SKILLS.md`       | Skills catalog      |
| `TOOLS.md`        | Tools catalog       |
| `CONCEPTS.md`     | This file           |
| `SYSTEM.md`       | System architecture |
| `README.md`       | Project overview    |

---

**See also**: [`/AGENTS.md`](../AGENTS.md), [`/agent/AGENTS.md`](../agent/AGENTS.md), [`/docs/TAGGING.md`](./TAGGING.md), [`/docs/GIT_GUIDE.md`](./GIT_GUIDE.md), [`/docs/VIP.md`](./VIP.md)
