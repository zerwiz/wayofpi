# Pi Agent — Main Agent Persona Catalog

> Principal agent definitions for the Pi coding agent ecosystem. This is the source of truth for Pi agent behavior, capabilities, and integration rules.

---

## 🤖 Pi Agent Definitions

### Core Pi Agent

Located at `.pi/agents/wop-agents/`

| Property         | Value                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| **Name**         | `pi`                                                                            |
| **Model**        | Claude Code (default model)                                                     |
| **Role**         | Coding agent, orchestrator                                                      |
| **Capabilities** | Edit files, read files, debug, write, search, web tools, agent dispatch         |
| **Location**     | `.pi/agents/wop-agents/pi.agent.yml`                                            |
| **Description**  | Main Pi coding agent: reads files, writes code, debugs, orchestrates sub-agents |

---

## 📂 Agent Location

```
.pi/agents/wop-agents/
├── pi.agent.yml            # Main Pi agent definition
├── agent-dir-scan/         # Agent directory scanning
├── agent-forge/            # Agent forging (creation/deletion)
├── agent-team.ts           # Team orchestration
├── agent-team-build-orchestra.ts
├── chronicle.ts            # Chronicle ledger
├── cross-agent.ts          # Cross-agent communication
├── damage-control.ts       # Damage control (rules enforcement)
├── dynamic-loader.ts       # Dynamic extension loader
├── extension-picker.ts     # Extension picker UI
├── footer-context-stats.ts # Footer stats display
├── minimal.ts              # Minimal extension template
├── session-memory.ts       # Session memory injection
├── session-replay.ts       # Session replay extension
├── subagent-widget.ts      # Sub-agent widget
├── system-select.ts        # System/model selector
├── theme-cycler.ts         # Theme cycling
├── themeMap.ts             # Theme mapping
├── tilldone.ts             # TillDone checklist
├── tool-counter.ts         # Tool usage counter
└── workspace-boundary.ts   # Workspace boundary enforcement
```

---

## 🧠 Agent Memory

**File**: `.pi/agents/wop-agents/agent-memory.md`  
**Purpose**: Cross-session memory injection, fact storage, lesson persistence  
**Status**: ✅ **Implemented**

---

## 🛠️ Agent Skills

Located at `.pi/skills/` — each skill must contain a `SKILL.md` file

```
.pi/skills/
├── bowser/                # Bowser skill: headless browser automation
│   └── SKILL.md
├── context-loader/        # Context loader skill
│   └── SKILL.md
├── find-skills/           # Find skills utility
│   └── SKILL.md
├── github/                # GitHub skill: repo management
│   └── SKILL.md
├── indexer/               # Indexer skill: file indexing
│   └── SKILL.md
├── ralph/                 # Ralph Wiggum skill: ticket management
│   └── SKILL.md
├── rules-lookup/          # Rules lookup skill
│   └── SKILL.md
└── tools/                 # Tools skill: built-in tool management
    └── SKILL.md
```

---

## 🧰 Agent Tools

Located at `.pi/tools/` — built-in tools Pi can use

```
.pi/tools/
├── build/                 # Build tools (bun build, etc.)
├── file-tree/             # File tree tools (tree, find)
├── git/                   # Git tools
├── image/                 # Image tools
├── lint/                  # Linting tools
├── memory/                # Memory tools (sqlite)
├── network/               # Network tools (curl, dig)
├── search/                # Search tools
├── shell/                 # Shell tools
├── system/                # System tools
├── textproc/              # Text processing tools
├── tools/                 # Built-in tools (curl, grep, etc.)
├── web/                   # Web tools
└── xdg/                   # XDG utilities
```

---

## 🔌 Agent Extensions

Located at `.pi/extensions/` — third-party and custom extensions

```
.pi/extensions/
├── fluent/                # Fluent extensions
├── local/                 # Local extensions
├── protected/             # Protected extensions
└── util/                  # Utility extensions
```

---

## 🏗️ Agent Teams

Located at `.pi/agents/teams.yaml` — agent team definitions

```yaml
# .pi/agents/teams.yaml
agents:
  - name: pi
    location: .pi/agents/wop-agents/pi.agent.yml
    packages:
      - agent-team.ts
      - chronicle.ts
      - damage-control.ts
      - dynamic-loader.ts
      - extension-picker.ts
      - session-memory.ts
      - session-replay.ts
      - subagent-widget.ts
      - system-select.ts
      - theme-cycler.ts
```

---

## 📜 Agent Rules

Main rules located at:

- `.pi/rules/rules-commands.md` — Command execution rules
- `.pi/rules/modes.md` — Model/mode configuration
- `.pi/rules/errors.md` — Error handling definitions
- `.pi/rules/securitypolicy.md` — Security policy
- `.pi/rules/skills.md` — Tool skills document

---

## 🎯 Agent Conduct

See `/SYSTEM.md` for agent conduct rules and memory model.

---

## 📝 Agent Catalog Entries

### Standard Pi Agent (wop-agents/)

- **Location**: `.pi/agents/wop-agents/pi.agent.yml`
- **Name**: `pi`
- **Description**: Coding agent with full file system access, tool execution, multi-agent orchestration, and session memory persistence

---

### Agent Location Summary

```
Main agent:   .pi/agents/wop-agents/pi.agent.yml
Skills:       .pi/skills/
Tools:        .pi/tools/
Extensions:   .pi/extensions/
Teams:        .pi/agents/teams.yaml
Memory:       .pi/agents/wop-agents/agent-memory.md
Rules:        .pi/rules/
```

---

## 🔗 Integration

- **Hermes/Honcho**: Cross-session memory and distributed agent execution
- **Claw**: Mission-control shell for agent scheduling and team management
- **Extensions**: Dynamic loading via `/extension-hint` and `just ext-*`
- **Skills**: Progressive disclosure via `/skill:name`
- **Tools**: Built-in tools and agent allowlists

---

**See also**: [`/docs/AGENTS.md`](../docs/AGENTS.md), [`/docs/CONCEPTS.md`](../docs/CONCEPTS.md), [`/docs/SKILLS.md`](../docs/SKILLS.md), [`/docs/TOOLS.md`](../docs/TOOLS.md)
