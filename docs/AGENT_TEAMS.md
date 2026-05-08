# Agent-Team Orchestration Guide

> Complete guide to agent-team rosters, presets, and multi-agent workflow orchestration.

---

## 🤝 Agent-Teams Overview

**Purpose**: Group agents together for coordinated task execution.

**Features**:

- Team rosters (`.pi/agents/teams.yaml`)
- Team presets (`.pi/agents/teams-presets.json`)
- Multi-agent task dispatching
- Preset activation (`/agents-preset-*`)
- Tool allowlist per team
- Role-based permissions

**Commands**:

- `/agents-team-add <name>` — Add team member
- `/agents-team-remove <name>` — Remove team member
- `/agents-team-replace <name> <new-member>` — Replace member
- `/agents-preset-*` — Load team preset
- `/agents-save-preset <name>` — Save current roster
- `/agents-load-preset <name>` — Load saved preset
- `/agents-delete-preset <name>` — Delete preset

---

## 📂 Agent-Team Files

### Roster File

**Location**: `.pi/agents/teams.yaml`

**Format**: YAML

**Example**:

```yaml
agents:
  - name: pi
    location: .pi/agents/wop-agents/pi.agent.yml
    packages:
      - agent-team.ts
      - damage-control.ts
      - dynamic-loader.ts
      - session-memory.ts
    permissions:
      - read
      - write
      - execute
      - tool

  - name: editor
    location: apps/wayofpi-ui/agent/editor.agent.yml
    packages:
      - damage-control.ts
    permissions:
      - read
      - write

  - name: terminal
    location: apps/wayofpi-ui/agent/terminal.agent.yml
    packages:
      - damage-control.ts
    permissions:
      - read
      - execute
```

---

### Presets File

**Location**: `.pi/agents/teams-presets.json`

**Format**: JSON

**Example**:

```json
{
  "presets": {
    "development": {
      "agents": ["pi", "editor", "terminal", "browser"],
      "tools": ["edit", "read", "bash", "web"],
      "permissions": ["read", "write", "execute"]
    },
    "production": {
      "agents": ["pi", "editor", "terminal"],
      "tools": ["edit", "read", "bash"],
      "permissions": ["read", "write", "execute"]
    },
    "debug": {
      "agents": ["pi", "editor", "terminal", "browser", "debugger"],
      "tools": ["edit", "read", "bash", "web", "debug"],
      "permissions": ["read", "write", "execute", "tool"]
    }
  }
}
```

---

## 🔄 Team Orchestration Flow

### 1. Team Setup

1. Define team roster in `.pi/agents/teams.yaml`
2. Configure tools and permissions
3. Save team presets in `.pi/agents/teams-presets.json`

### 2. Team Activation

```bash
# Activate a team preset
just team-preset-load production

# Manually activate team
just team-preset-load development
```

### 3. Tool Dispatching

1. User gives command
2. Dispatcher routes to team
3. Team members execute with shared context
4. Results consolidated and returned

### 4. State Persistence

- Team state in `.pi/agents/teams-presets.json`
- Session history in `.pi/agents/*.jsonl`
- Chronicle ledger in `.pi/chronicle/ledger.json`

---

## 🧰 Team Commands

### `/agents`

```
Lists current team roster and active presets
```

**Output**:

```
Active Team: development
Members:
  - pi        [edit,read,bash,web,search,web-read]
  - editor    [edit,read,bash,web]
  - terminal  [bash,read,web-read]
  - browser   [web,web-read]
```

### `/agents-preset-<name>`

```
Load saved team preset
Usage: /agents-preset-production
Usage: /agents-preset-development
Usage: /agents-preset-debug
```

### `/agents-save-preset <name>`

```
Save current roster as preset
Usage: /agents-save-preset my-custom-team
```

---

## 🛡️ Team Safety

### Damage Control

Every team member includes damage control:

```yaml
packages:
  - damage-control.ts
```

**Functions**:

- Rule enforcement
- File system safety
- Command validation
- Tool allowlist enforcement
- Error handling

### Permissions Model

```yaml
permissions:
  - read # File read access
  - write # File write access
  - execute # Command execution
  - tool # Built-in tool access
```

---

## 📝 Team Example: Development Team

**Roster**: `.pi/agents/teams.yaml`

```yaml
agents:
  - name: pi
    location: .pi/agents/wop-agents/pi.agent.yml
    packages:
      - agent-team.ts
      - damage-control.ts
      - dynamic-loader.ts
    tools:
      - edit
      - read
      - bash
      - web
      - search
      - web-read
    permissions:
      - read
      - write
      - execute
      - tool
```

**Presets**: Team presets for different modes (dev, prod, debug)

---

## 🎯 Team Use Cases

### 1. Development Mode

**Team**: `["pi", "editor", "terminal", "browser"]`

**Purpose**: Full development with tools, debugging, browsing

### 2. Production Mode

**Team**: `["pi", "editor", "terminal"]`

**Purpose**: Production deployment with limited tools

### 3. Debug Mode

**Team**: `["pi", "editor", "terminal", "browser", "debugger"]`

**Purpose**: Debugging with extended tool access

### 4. Read-Only Mode

**Team**: `["pi", "editor"]`

**Purpose**: Analysis without write access

---

## 🔗 Team Integration

### Session Memory

**Integration**: Team members share session memory via `.pi/agents/session-memory.md.jinja`

### Chronicle

**Integration**: Team actions logged to `.pi/chronicle/ledger.json`

### Extension Picker

**Integration**: Team can install extensions via `/extension-hint`

### Dynamic Loader

**Integration**: Team extensions loaded dynamically without reload

---

## 📊 Team State Management

### File Locations

| File                      | Purpose                   |
| ------------------------- | ------------------------- |
| `teams.yaml`              | Active team roster        |
| `teams-presets.json`      | Team configurations       |
| `session-memory.md.jinja` | Shared memory template    |
| `chronicle/ledger.json`   | Action ledger             |
| `agents/*.jsonl`          | Individual agent sessions |

### Commands Reference

| Command                 | Description                |
| ----------------------- | -------------------------- |
| `/agents`               | List team roster           |
| `/agents-preset-*`      | Load team preset           |
| `/agents-save-preset`   | Save current roster        |
| `/agents-load-preset`   | Load saved preset          |
| `/agents-delete-preset` | Delete preset              |
| `/team-list`            | List teams in project      |
| `/team-`                | (additional team commands) |

---

**See also**: [`/docs/AGENTS.md`](./AGENTS.md), [`/docs/AGENT_MEMORY.md`](./AGENT_MEMORY.md), [`/docs/EXTENSIONS.md`](./EXTENSIONS.md)
