# Agent Integration Guides

> Integration guides for Way of Pi agents, extending capabilities, and agent-team orchestration.

---

## 🤖 Agent Types

### 1. Core Pi Agent

**Location**: `.pi/agents/wop-agents/pi.agent.yml`

**Purpose**: Main orchestrator agent with full filesystem access, tool execution, and multi-agent coordination.

**Capabilities**:

- File read/write
- Code execution
- Tool dispatch
- Agent orchestration
- Session memory
- Cross-agent communication

**Rules**: See [`/AGENTS.md`](../AGENTS.md) for agent conduct rules.

---

### 2. Sub-Agents

**Location**: `apps/wayofwork-ui/agent/`

**Purpose**: UI-specific agents for specialized tasks (editor, file explorer, terminal, chat, etc.)

**Implementation**: Located in `apps/wayofwork-ui/agent/*.yml`

**Integration**: Connected to core Pi via WebSocket and shared context.

---

### 3. Agent Teams

**Location**: `.pi/agents/teams.yaml`

**Purpose**: Grouped agents for coordinated task execution (rosters, presets, multi-agent workflows)

**Commands**:

- `/agents` — List team rosters
- `/agents-team-add` — Add team member
- `/agents-team-remove` — Remove team member
- `/agents-preset-*` — Load saved team preset

---

## 🔌 Agent Integration Checklist

- [ ] **Core Agent Setup**
  - [ ] Create `.pi/agents/wop-agents/pi.agent.yml`
  - [ ] Configure tool allowlist
  - [ ] Set session memory persistence
  - [ ] Define damage control rules

- [ ] **Sub-Agent Integration**
  - [ ] Create `apps/wayofwork-ui/agent/*.yml`
  - [ ] Wire WebSocket connections
  - [ ] Share context between agents
  - [ ] Handle multi-agent routing

- [ ] **Team Orchestration**
  - [ ] Create `.pi/agents/teams.yaml`
  - [ ] Configure team presets
  - [ ] Set up dispatcher logic
  - [ ] Handle team tool execution

- [ ] **Extensions Integration**
  - [ ] Install `/extension-hint` extension
  - [ ] Configure dynamic loader
  - [ ] Enable extension picker

- [ ] **Skills Integration**
  - [ ] Create skill packages (`.pi/skills/`)
  - [ ] Register skills in settings
  - [ ] Configure progressive disclosure

- [ ] **Tools Integration**
  - [ ] Set up built-in tools (`.pi/tools/`)
  - [ ] Configure agent allowlists
  - [ ] Handle tool results properly
  - [ ] Implement safety checks

---

## 📦 Agent Packages

### Core Package

**Contents**:

- `.pi/agents/wop-agents/*.yml`
- `.pi/agents/teams.yaml`
- `.pi/rules/*.md`
- `.pi/tools/`
- `.pi/extensions/`
- `.pi/skills/`

### Extension Packages

**Location**: `.pi/extensions/`

**Discovery**: Every `*.ts` file in `.pi/extensions/` is loaded as an extension.

**Shim Pattern**: Extensions in `.pi/extensions/` are shims for upstream extensions in `ref/extensions/`.

---

## 🔗 Agent Communication

### WebSocket Multi-Agent

**File**: `docs/WOP_MULTI_AGENT_WEBSOCKET.md`

**Purpose**: Real-time multi-agent communication via WebSocket

**Implementation**: Core Pi ↔ Sub-agents via shared context

### Session Memory

**File**: `.pi/agents/wop-agents/session-memory.md.jinja`

**Purpose**: Cross-session memory persistence for all agents

**Commands**:

- `/remember` — Store memory
- `/memory` — Recall memory
- `/forget` — Remove memory

---

## 🧠 Agent Memory Model

**File**: `docs/AGENT_MEMORY.md`

**Components**:

- **Session Memory**: Active session dialogue
- **Persistent Memory**: Fact storage (`.pi/memory/`)
- **Lessons**: User corrections and learned patterns
- **Ledger**: Chronicle ledger for all agent actions

---

## 🎯 Agent Orchestration

### Damage Control

**File**: `.pi/rules/damage-control-rules.yaml`

**Purpose**: Rule enforcement, safety checks, error handling

### Chronicle

**File**: `.pi/extensions/chronicle.ts`

**Purpose**: Ledger and optional workflow graph for agent actions

### Dynamic Loader

**File**: `.pi/extensions/dynamic-loader.ts`

**Purpose**: Dynamic extension loading without restart

### Extension Picker

**File**: `.pi/extensions/extension-picker.ts`

**Purpose**: UI for selecting and installing extensions

---

## 🧪 Agent Testing

See `test_agents.ts` for agent testing utilities.

---

## 📝 Agent Documentation

- [`/AGENTS.md`](../AGENTS.md) — Main agent catalog (`.pi/agents/wop-agents/`)
- [`/agent/AGENTS.md`](../agent/AGENTS.md) — Agent reference implementation
- [`/docs/AGENT_TEAMS.md`](./AGENT_TEAMS.md) — Team orchestration guides
- [`/docs/AGENT_MEMORY.md`](./AGENT_MEMORY.md) — Memory model documentation

---

**See also**: [`/docs/CONCEPTS.md`](./CONCEPTS.md), [`/docs/EXTENSIONS.md`](./EXTENSIONS.md), [`/docs/SKILLS.md`](./SKILLS.md), [`/docs/TOOLS.md`](./TOOLS.md)
