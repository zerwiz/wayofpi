# Way of Pi Subagent System

This folder implements the subagent orchestration system for pi.dev.

## Location and Structure

```
.pi/agent/extensions/subagents/
├── index.ts                # Auto-discovered extension for subagents
└── *.ts                    # Optional subagent definitions
```

## Agent Discovery

The system automatically discovers agents from **two sources**:

1. **TypeScript extensions**: `.pi/agent/extensions/subagents/*.ts`
2. **Markdown agents**: `.pi/agents/*.md` - converted to prompts

### TypeScript Subagents

Run TypeScript-defined subagents:

```bash
# Load from pi/agent/extensions
pi -e .pi/agent/extensions/subagents
```

Or load specific subagents:

```bash
# Planner subagent
pi -e .pi/agent/extensions/planner.ts

# Researcher subagent  
pi -e .pi/agent/extensions/researcher.ts
```

### Markdown Agents (Discovery)

The system supports discovering **existing .md agents** from `.pi/agents/` and converting them to prompts:

```bash
# Agent discovery from .pi/agents/
find .pi/agents/*.md        # Lists all available agents
```

Each `.md` agent file can be:
- **Loaded directly** - The .md content becomes the agent's system prompt
- **Referenced by team** - Teams define subagents that reference .md files
- **Wrapped by TypeScript** - TypeScript extensions can wrap existing .md agents

## Running Modes

Subagents can run in different modes:

### 1. Direct Mode - .md Files as Prompts

Each `.md` agent in `.pi/agents/` automatically becomes available as a subagent prompt. The content:
- Is extracted from the .md file header (name, description)
- Becomes the system prompt / instructions when activated
- Can be used by teams and orchestrators

**Example**:

```
.pi/agents/coder.md
  ---  
  # Code Coder
  # Generate, refactor, and execute code
---
  ## Code Coder Agent
  
  You are the Code Coder subagent...
  ```

When the agent runs:
1. System extracts the header (name, description)
2. Loads the .md content as instructions
3. Activates as a subagent

### 2. TypeScript Subagent Mode

TypeScript extensions that define tools and state:

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (api: ExtensionAPI) {
  // Define tools and behavior
  api.registerTool(...)
}
```

### 3. Team Mode

Teams orchestrate multiple subagents:

```bash
pi -e teams
# Loads:
# - Planner
# - Researcher  
# - Coder
# - Executor
# + all available .md agents
```

### 4. Orchestrator Mode

The orchestrator spawns subagents as needed:

```bash
pi -e subagents
# Spawns subagents on-demand
```

## Agent Lifecycle

Each subagent has these lifecycle states:

```typescript
type SubAgentState =
  | { status: 'idle' }
  | { status: 'thinking' }
  | { status: 'executing'; task: string }
  | { status: 'completed' }
  | { status: 'error'; error: string }
```

### State Management

Subagents persist state in tool result details:

```typescript
api.on("tool_result", (event) => {
  // Store state in details
  return {
    content: [...],
    details: {
      state: {
        status,
        task,
        progress: 50
      }
    }
  }
})
```

## Example: Creating a Subagent

### 1. As Markdown (Simple)

```
.pi/agents/validator.md

---
name: validator
description: Code quality validation

---

You are the Code Validator subagent...

## Your Responsibilities

1. Check for bugs and issues
2. Validate code quality
3. Suggest improvements
```

When loaded:
- `.md` content becomes the prompt
- Agent name from header
- Available to teams

### 2. As TypeScript (Advanced)

```typescript
.pi/agent/extensions/caller/index.ts

export default function (api: ExtensionAPI) {
  api.registerTool({
    name: "subagent:caller",
    label: "Caller",
    description: "Execute subagent tasks",
    parameters: Type.Object({
      tool: Type.String({ description: "Subagent tool name" }),
      call: Type.String({ description: "Tool call / input" }),
    }),
    async execute(...) {
      // Execute the subagent logic
      // Return results
    }
  });
}
```

## Team Integration

Teams reference subagents:

```yaml
# .pi/agents/teams.yaml
name: build-orchestra
members:
  - planner        # subagent
  - researcher     # subagent
  - coder         # subagent
  - executor      # subagent
  - full          # main agent
```

Or from markdown definitions:

```
.pi/agents/*.md         # All .md agents are available
```

## Loading Subagents

### Individual

```bash
pi -e planner          # Load planner subagent
pi -e researcher       # Load researcher subagent
```

### Teams

```bash
pi -e teams            # Load team with all subagents
```

### All Agents (Discovery)

```bash
# Auto-discover all .md agents
pi -e .pi/agents

# Or load specific agents
pi -e .pi/agents/*.md
```

### Orchestrator

```bash
pi -e orchestrator     # Spawn subagents as needed
```

## Available Subagents (from .md files)

The following subagents are defined in `.pi/agents/*`:

- [coder.md](coder.md) - Code generation
- [executer.md](executer.md) - Command execution  
- [researcher.md](researcher.md) - Knowledge research
- [reviewer.md](reviewer.md) - Code review
- [analyzer.md](analyzer.md) - Code analysis
- [monitor.md](monitor.md) - Monitoring
- [orchestrator.md](orchestrator.md) - Coordination
- [planner.md](planner.md) - Goal decomposition
- [runner.md](runner.md) - Test execution
- [validator.md](validator.md) - Validation
- [refiner.md](refiner.md) - Code refinement
- [architect.md](architect.md) - Architecture design
- [builder.md](builder.md) - Implementation
- [full.md](full.md) - Main agent

## Implementation

Each subagent:

1. **Has a .md file** in `.pi/agents/`
2. **Contains** name/description in header
3. **Provides** detailed instructions in body
4. **Can be referenced** by teams

## Reference Files

See reference implementation:

```.pi/agent/ref/
├── agent-chain.ts            # Chain-based subagent
├── agent-dir-scan.ts         # Directory scanning
├── agent-forge.ts           # Tool creation from prompts
├── dynamic-loader.ts        # Dynamic loading
├── extension-picker.ts      # Extension picker
├── system-select.ts         # System selection
├── subagent-widget.ts       # UI widget
└── ...
```

These show alternative patterns for subagent orchestration.

## Extending the System

Add new subagents:

1. Create `.md` in `.pi/agents/`
2. The system auto-discovers it
3. Add to team configuration

Modify existing subagents:

1. Edit the `.md` file
2. System uses new content
3. Restart agent if needed

See the reference files in `/ref/extensions/` for alternative implementation patterns:

- [agent-chain.ts](agent-chain.ts) - Chain-based orchestration
- [agent-dir-scan.ts](agent-dir-scan.ts) - Auto-discovery
- [agent-forge.ts](agent-forge.ts) - Forge agents from prompts
- [dynamic-loader.ts](dynamic-loader.ts) - Dynamic loading
- [extension-picker.ts](extension-picker.ts) - Extension picker
