# Way of Pi - Subagent System Summary

## What Was Created

### 1. Core Subagent Implementation

**Location**: `.pi/agent/extensions/subagents/`

```
├── index.ts                    # Auto-discovered agent loader
├── dynamic-loader.ts           # Auto-discovers .md agents
├── orchestrator.ts             # Team orchestration
├── coder.ts                    # Code generation subagent
└── researcher.ts               # Knowledge research subagent
```

### 2. Team Configurations

**Location**: `.pi/agent/extensions/teams/`

```
├── index.ts                    # Team manager
└── teams.yaml                  # Team definitions
```

**Contents**:
- `build-orchestra` - Full orchestra with all teams
- `full` - Main Way of Pi team
- Individual team definitions (architect, builder, reviewer, etc.)

### 3. Documentation

```
├── README.md                   # Main documentation
├── SYSTEM-SUMMARY.md           # This file
├── SUBAGENTS-README.md         # Subagent usage guide
├── SUBAGENTS-OVERVIEW.md       # Comprehensive overview
├── PI-COMMANDS.md              # Quick command reference
└── reorganize-pi-dev.sh        # Reorganization script
```

## How Subagents Run

### Three Execution Modes

#### Mode 1: Markdown Discovery

All `.md` files in `.pi/agents/` are automatically discovered:

```
.pi/agents/
├── coder.md                    # Registered as subagent:coder
├── researcher.md               # Registered as subagent:researcher
├── architect.md                # Registered as subagent:architect
├── planner.md                  # Registered as subagent:planner
└── ... + 120+ more .md agents
```

No manual registration needed - **auto-discovery!**

#### Mode 2: Team Orchestration

Teams reference all agents automatically:

```yaml
# .pi/agent/extensions/teams.yaml
name: build-orchestra
members:
  - planner
  - researcher
  - coder
  - executor
  - full
  # + all other .md agents
```

#### Mode 3: TypeScript Extensions

TypeScript files for advanced orchestration (optional):

```typescript
// Each .ts file is an optional extension
.pi/agent/extensions/subagents/coder.ts
.pi/agent/extensions/subagents/researcher.ts
```

## Complete Command List

### Individual Subagents

```bash
pi -e coder              # Code generation
pi -e researcher         # Knowledge research
pi -e architect          # Architecture design
pi -e builder            # Implementation
pi -e analyzer           # Code analysis
pi -e monitor            # Monitoring
pi -e orchestrator       # Team coordination
pi -e planner            # Goal decomposition
pi -e executor           # Command execution
pi -e validator          # Code validation
pi -e refiner            # Code refinement
pi -e runner             # Test runner
```

### Teams

```bash
pi -e teams              # All team extensions
pi -e build-orchestra    # Full orchestration
pi -e architect          # Architecture team
pi -e builder            # Implementation team
pi -e reviewer           # Code review team
```

### Development

```bash
pi /reload               # Reload extensions
pi -e full               # Full build mode
```

## Adding New Subagents

1. Create `.md` in `.pi/agents/`:
```markdown
---
name: my-new-agent
description: My new subagent
---
[Agent instructions and behavior]
```

2. System auto-discovers it
3. Or register in TypeScript extension

## Auto-Discovery Logic

The system scans `.pi/agents/` for:

- Files starting with letters (not `.`)
- Extensions: `.md`, `.yaml`, `.json`, `.txt`
- Extracts name/description from YAML frontmatter
- Falls back to filename as name

## Structure

```
.pi/
├── agents/                    # ALL subagent definitions
│   ├── *.md                   # Markdown prompts
│   └── domain-specialists/    # Domain experts
├── agent/
│   └── extensions/            # pi.dev extensions
│       ├── subagents/         # Subagent orchestration
│       ├── teams/            # Team orchestration
│       └── README.md         # Main documentation
└── extensions/               # Legacy location (still works)
    ├── teams/
    └── subagents/
```

## How It All Works

1. **Agent Creation**: Create `.md` in `.pi/agents/`
2. **Auto-Discovery**: System scans and registers automatically
3. **Team Definition**: Define in `teams.yaml` or auto-discovered
4. **Loading**: Use `pi -e {agent}` or `pi -e {team}`

See `PI-COMMANDS.md` for complete command list.
