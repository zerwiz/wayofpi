# Way of Pi - Extensions Directory

This directory contains pi.dev extensions for Way of Pi.

## Location

```
.pi/agent/extensions/
├── subagents/          # Subagent orchestration
│   ├── index.ts       # Auto-discovered agent loader
│   ├── dynamic-loader.ts  # Auto-discovery system
│   ├── coder.ts       # Code Coder subagent (optional)
│   └── researcher.ts  # Researcher subagent (optional)
├── teams/             # Team orchestration
│   ├── index.ts
│   └── teams.yaml
└── orchestrator      # Legacy location (still works)
    └── orchestrator.ts
```

## How It Works

### 1. Subagent Discovery

The system in `.pi/agent/extensions/subagents/` automatically:

- Scans `.pi/agents/*.md` for agent definitions
- Extracts name/description from headers
- Registers each as a subagent tool
- Makes available to teams

### 2. Command Reference

See `../PI-COMMANDS.md` for all commands.

Quick examples:

```bash
# Individual agents
pi -e coder        # Code Coder
pi -e researcher   # Researcher

# Teams
pi -e teams        # All team extensions
pi -e build-orchestra  # Full orchestra
```

### 3. Auto-Discovery

New `.md` agents in `.pi/agents/` are automatically discovered:

```bash
# Add new agent
echo "---
name: my-new-agent
description: My new subagent
---
My agent instructions
" > .pi/agents/my-new-agent.md

# It's automatically available!
pi -e my-new-agent
```

## Team Extensions

Teams defined in `teams.yaml`:

```yaml
name: build-orchestra
members:
  - full
  - architect
  - builder
  - reviewer
  - tester
  - deployer
  - orchestrator
  - planner
  - executor
  - researcher
  - coder
```

## Running Commands

### Individual Agent

```bash
pi -e planner         # Goal decomposition
pi -e researcher      # Knowledge search
pi -e architect       # Architecture
pi -e builder         # Implementation
```

### Teams

```bash
pi -e teams           # Load teams orchestration
pi -e build-orchestra # Full orchestra
```

### All Agents

```bash
pi -e .pi/agents      # Load all .md agents
```

### Reload

```bash
pi /reload            # Reload after adding agents
```

## Best Practices

1. **Add new agents to `.pi/agents/`** - Auto-discovered automatically
2. **Don't modify TypeScript** unless extending orchestration
3. **Use team configurations** for complex workflows
4. **See `PI-COMMANDS.md`** for complete command list

See: https://pi.dev/extensions/
