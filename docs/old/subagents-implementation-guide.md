# Subagent Orchestration System - Implementation Guide

## Overview

Your `Way of Pi` project already has a comprehensive agent system! This guide explains how to integrate the **pi.dev TypeScript subagent pattern** into your existing architecture.

## Current Agent Inventory

You have **extensive agents** already configured:

### Core Teams (from teams.yaml)

```yaml
full:             # General purpose team
- scout
- ralph
- documenter
- reviewer
- bowser
- builder

hermes:          # Information broker
- indexer

new-project:     # Project initialization
- project-scanner
- indexer
- playground-portal

ralph:           # Ralph workflow
- ralph
- scout
- planner
- builder
- reviewer
- code-documenter
- documenter

// ... and more teams
```

### Domain Specialists

Located in `.pi/agents/domain-specialists/`:
- **01-core-development**: TypeScript, Python, Rust, JS/TS, Java agents
- **02-language-specialists**: Language-specific experts
- **03-infrastructure**: DevOps, Containers, AWS
- **04-quality-security**: Testing, Security, Linting
- **05-data-ai**: ML, Data Science, AI
- **06-developer-experience**: DX tools, LSP, CLI
- **07-specialized-domains**: Domain expertise
- **08-business-product**: Business logic
- **09-meta-orchestration**: Meta-level coordination
- **10-research-analysis**: Research capabilities

## pi.dev Subagent Pattern Integration

### Location

The TypeScript orchestration logic goes here:
```
.pi/extensions/subagents/orchestrator.ts  ← Core orchestration logic
```

Agent definitions stay in your existing location:
```
.pi/agents/                                ← Your agent .md files
.pi/agents/domain-specialists/            → Domain-specified agents
```

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              .pi/extensions/subagents/                   │
│  orchestrator.ts (TypeScript)                           │
│          ↓                                               │
│  ┌───────────────┐    ┌───────────────┐                │
│  │ SubAgent Base │    │ StateObserver │                │
│  └───────────────┘    └───────────────┘                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           .pi/agents/ (Existing Agent Definitions)       │
│  orchestrator.md, planner.md, ralph.md, etc.            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           pi CLI Runtime Management                       │
│  - Team spawning                                          │
│  - Agent lifecycle                                        │
│  - Task orchestration                                     │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **TypeScript for Logic Only**: The `.ts` files in `.pi/extensions/subagents/` define orchestration patterns and types, NOT agent definitions.

2. **Agent Definitions Stay in `.pi/agents/`**: Your existing `.md` agent files remain unchanged. The TypeScript logic just models how they would interact.

3. **Runtime is pi CLI**: Don't run TypeScript directly. Use `pi -e <team>` to spawn subagents.

### Observable Pattern

The TypeScript code demonstrates the **observable pattern** that could power your UI:

```typescript
// Subscribe to agent state changes
orchestrator.subscribe((state) => {
  // Update your gogglable boxes here
  console.log(`Agent ${agent.name}: ${agent.status}`);
});
```

In production, this becomes your UI subscribing to the agent state via WebSocket or similar mechanism.

## Integration Examples

### Example 1: Creating a Subagent Team

You can create a subagent team from your existing agents:

```bash
# Create a team using your existing agent roster
cd /home/zerwiz/CodeP/Way\ of\ pi/
pi -e full  # Spawns agents from teams.yaml
```

### Example 2: Custom Subagent Task

```bash
# Create a new team that combines existing agents into a subagent workflow
pi -e build-orchestra  # Uses your build-orchestra team
```

### Example 3: Adding TypeScript Orchestration Logic

If you want TypeScript-based orchestration for your UI:

1. Add to `.pi/extensions/subagents/orchestrator.ts`:
```typescript
// Import your agent state types
export interface MyAgentState {
  agentId: string;
  status: 'idle' | 'thinking' | 'executing' | 'completed';
  task: string;
}
```

2. Define UI update patterns:
```typescript
export interface OrchestratorState {
  status: AgentStatus;
  mainGoal: string | null;
  logs: LogEntry[];
  agents: Record<string, SubAgentState>;
}
```

3. Your UI can subscribe via WebSocket to get live updates.

## Gogglable Boxes Integration

The subagent state can populate your real-time UI boxes:

```typescript
// UI Box 1: Current Goal
Goal State:
  { mainGoal: string | null }

// UI Box 2: Active Agents
Agents View:
  agents: Record<string, SubAgentState>;

// UI Box 3: Logs
Log View:
  - LogEntry[] with timestamps
  
// UI Box 4: Status Indicator
Status Display:
  status: AgentStatus
```

## Testing with Subagents

### Development Mode

```bash
# Install ts-node for local testing
cd .pi/extensions/subagents
npm install -g ts-node
ts-node orchestrator.ts
```

### This is purely demonstrative

The actual agents run as pi CLI teams, not TypeScript processes.

## Production Usage

For production work, don't use the TypeScript simulation directly. Instead:

1. **Use `pi -e <team>`** - Spawns your existing agent teams
2. **Create tasks** - Use `pi task create <subject>`  
3. **Monitor progress** - Use agent logs and state
4. **Get results** - Agents write to your project files

### Example Production Workflow

```bash
# 1. Create a new project task
pi task create "Implement user authentication"

# 2. The team (build-orchestra) will:
#    - Break it down sub-tasks
#    - Assign to domain specialists
#    - Execute in parallel
#    - Synthesize results

# 3. Monitor via pi's agent logs and gogglable boxes
```

## Advanced: Custom Subagent Workflow

If you want a custom orchestration pattern not covered by teams.yaml:

### Option 1: Dynamic Team Creation

```typescript
// Custom agent roster for a one-off task
const customTeam = [
  { id: 'planner', file: '/pi/agents/planner.md' },
  { id: 'researcher', file: '/pi/agents/researcher.md' },
  { id: 'architect', file: '/pi/agents/architect.md' },
  { id: 'implementer', file: '/pi/agents/implementer.md' }
];
```

### Option 2: Chain Pattern

```typescript
// Sequential pipeline (CHAIN mode)
const chain = [
  { agent: 'planner', task: 'Analyze requirements' },
  { agent: 'architect', task: 'Design solution' },
  { agent: 'implementer', task: 'Write code' },
  { agent: 'reviewer', task: 'Review results' }
];
```

### Option 3: Parallel Mode

```typescript
// Concurrent execution (PARALLEL mode)
const parallelTasks = [
  { agent: 'researcher', task: 'Research auth patterns' },
  { agent: 'architect', task: 'Design database schema' },
  { agent: 'implementer', task: 'Create authentication endpoints' }
];
```

## Best Practices

1. **Keep TypeScript in extensions only** - Don't modify `.pi/agents/` with TS
2. **Use existing agent definitions** - Leverage your full team roster
3. **Teams.yaml is source of truth** - Don't duplicate here
4. **Document custom workflows** - Add to this guide or AGENTS.md
5. **Test with pi CLI** - The simulation is for understanding, not execution

## File Locations Summary

| Location | Purpose | Contents |
|----------|---------|----------|
| `.pi/agents/` | Agent definitions | `.md` files for each agent |
| `.pi/agents/domain-specialists/` | Domain-specified experts | Specialized agent groups |
| `.pi/extensions/subagents/` | TypeScript orchestration | `.ts` files for simulation |
| `.pi/teams.yaml` | Team configurations | Existing team definitions |
| `docs/subagents-*/` | Documentation | This guide + overview |

## Next Steps

1. ✅ **Review existing agents** - See what you already have in `.pi/agents/`
2. ✅ **Use teams.yaml** - Your team rosters are already defined
3. ✅ **Spawn teams with `pi -e <team-name>`** - This is how subagents run
4. 🔄 **Integrate TypeScript UI** - Optional, for real-time visualization
5. 🔄 **Create custom chains** - Using subagent tool for complex workflows

## Conclusion

You have a **fully functional agent system**! The TypeScript subagent pattern is for:

- Understanding orchestration logic
- UI state subscription patterns  
- Simulating agent behavior
- Learning the observable pattern

For actual agent execution, your existing `pi CLI` teams are the production solution.

---

*Integrate with your existing team system, don't replace it!*
