# Way of Pi - Subagent Orchestration System

## Overview

The Way of Pi Subagent System implements multi-agent coordination following **pi.dev** architectural patterns. The system automatically discovers agents and runs them in different execution modes.

## Architecture

### Core Concepts

- **Orchestrator**: Central coordination logic in `.pi/agent/extensions/subagents`
- **SubAgents**: Specialized markdown-based agents discovered from `.pi/agents/`
- **Dynamic Discovery**: System auto-discovers new `.md` agents automatically
- **Execution Modes**: Multiple ways to run subagents

### File Structure

```
.pi/
├── agents/              # Subagent definitions
│   ├── *.md            # Markdown agent prompts
│   ├── teams.yaml      # Team configurations
├── agent/extensions/    # pi.dev extensions
│   └── subagents/
│       ├── index.ts    # Discovered agent loader
│       ├── dynamic-loader.ts  # Auto-discovery system
│       └── orchestrator.ts    # Teams orchestration
└── extensions/          # Legacy extensions (still works)
    ├── teams/          # Team configurations
    └── subagents/      # TypeScript subagents
```

## Subagent Execution Modes

### Mode 1: Markdown Prompt Discovery

Each `.md` agent in `.pi/agents/` becomes automatically available:

```
.pi/agents/
├── coder.md           # Auto-discovered as subagent:coder
├── researcher.md      # Auto-discovered as subagent:researcher
├── architect.md       # Auto-discovered as subagent:architect
├── builder.md         # Auto-discovered as subagent:builder
├── analyzer.md        # Auto-discovered as subagent:analyzer
├── monitor.md         # Auto-discovered as subagent:monitor
├── orchestrator.md    # Auto-discovered as subagent:orchestrator
└── planner.md         # Auto-discovered as subagent:planner
```

**How it works**:
1. System scans `.pi/agents/` for `.md` files
2. Extracts header (name, description)
3. Creates subagent tool with prompt content
4. Registers with pi.dev

### Mode 2: TypeScript Subagents

TypeScript extensions define tools programmatically:

```typescript
// .pi/agent/extensions/subagents/index.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (api: ExtensionAPI) {
  // Register subagent tools
  api.registerTool({
    name: "subagent:executor",
    label: "Executor",
    description: "Execute commands",
    // ...
  });
}
```

### Mode 3: Team Orchestration

Teams orchestrate multiple subagents:

```yaml
# .pi/agent/extensions/teams.yaml
name: build-orchestra
members:
  - coder
  - researcher
  - architect
  - builder
  - analyzer
  - monitor
  - orchestrator
  - planner
  - full
```

Run: `pi -e subagents` or `pi -e full`

## Available Subagents

### coder.md
Code generation and refactoring

### researcher.md
Knowledge research and synthesis

### architect.md
System architecture and design

### builder.md
Implementation and development

### analyzer.md
Code analysis and documentation

### monitor.md
Monitoring and diagnostics

### orchestrator.md
Team coordination and scheduling

### planner.md
Goal decomposition and planning

### executor.md
Command execution

### validator.md
Code validation (added dynamically)

### refiner.md
Code refinement (added dynamically)

### runner.md
Test runner (added dynamically)

### full.md
Main Way of Pi agent

## Subagent Discovery System

### Automatic Discovery

The dynamic loader in `.pi/agent/extensions/subagents/dynamic-loader.ts` automatically:

1. Scans `.pi/agents/` directory
2. Reads each `.md` file
3. Extracts agent name/description
4. Registers as subagent tool
5. Makes available to teams

### Custom Loading

Load specific agents directly:

```bash
pi -e coder         # Load coder subagent
pi -e researcher    # Load researcher subagent
```

Load all from folder:

```bash
pi -e .pi/agents    # Load all .md agents
```

### Team Loading

```bash
pi -e subagents     # Load orchestration
pi -e full          # Load full build orchestra
```

## Implementation Reference

See reference implementation in `.pi/agent/ref/extensions/`:

- `agent-chain.ts` - Chain-based coordination
- `agent-dir-scan.ts` - Directory scanning
- `agent-forge.ts` - Forge agents from prompts
- `dynamic-loader.ts` - Dynamic loading
- `extension-picker.ts` - Extension picker
- `system-select.ts` - System selection
- `subagent-widget.ts` - Widget display

## Usage Examples

### Individual Agent

```bash
# Spawn a specific agent
pi -e planner
pi -e executor
pi -e researcher
```

### Full Orchestra

```bash
# Load full team
pi -e full

# Or from subagents
pi -e .pi/agent/extensions/subagents
```

### With Teams

```bash
# Load team orchestration
pi -e teams

# Or build-orchestra
pi -e build-orchestra
```

### Reload

```bash
# After adding new .md agents
pi /reload
```

## Best Practices

1. **Define agents in .md** - Use markdown for prompt engineering
2. **Keep TypeScript minimal** - Use for orchestration only
3. **Auto-discover new agents** - Don't manually modify loader
4. **Subscribe to state** - Use observable pattern
5. **Log agent activity** - Track progress and errors
6. **Use parallel execution** - Run agents concurrently
7. **Keep prompts concise** - Focus on key instructions
8. **Test individual agents** - Verify before team integration

## Adding New Subagents

1. Create agent `.md` in `.pi/agents/`:
```markdown
---
name: new-agent
description: New subagent function
---
## Your agent instructions
[Detailed behavior]
```

2. System auto-discovers it
3. Available to teams automatically
4. Or register manually in TypeScript

## Testing

```bash
# Test individual agent
pi -e coder
# Check prompts and behavior

# Test with team
pi -e full
# Verify coordination works

# Reload after changes
pi /reload
```

## Production Deployment

In production, use only:

1. Markdown agent definitions
2. Team configurations
3. pi CLI orchestration

Remove TypeScript simulation files.

---

*Last Updated: 2025*
*Author: Way of Pi*
