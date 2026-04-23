# Way of Pi - Quick Command Reference

## Main Commands

```bash
# === Individual Subagents ===
pi -e coder        # Code generation
pi -e researcher   # Knowledge search
pi -e architect    # Architecture design
pi -e builder      # Implementation
pi -e analyzer     # Code analysis
pi -e monitor      # Monitoring
pi -e orchestrator # Team coordination
pi -e planner      # Goal decomposition
pi -e executor     # Command execution
pi -e validator    # Code validation
pi -e refiner      # Code refinement
pi -e runner       # Test runner
pi -e way          # Main Way of Pi orchestrator agent
```

## Team Commands

```bash
# === Teams ===
pi -e teams        # All team extensions
pi -e build-orchestra  # Full orchestra
pi -e architect    # System architecture team
pi -e builder      # Implementation team
pi -e reviewer     # Code review team
pi -e tester       # Testing team
pi -e deployer     # Deployment team
pi -e orchestrator # Orchestration team
```

## Development Commands

```bash
# === Development ===
pi /reload     # Reload extensions
pi --watch     # Watch mode (dev)
pi -e full     # Full development mode
```

## Location Reference

```bash
# === Locations ===
.pi/agents/                 # Markdown agent definitions
.pi/agent/extensions/       # Extension folder
  ├── subagents/           # Subagent extensions
  └── teams/              # Team configurations
.pi/agent/extensions/*.yaml  # YAML team definitions
```

## Quick Start

```bash
# Start Way of Pi
pi -e way              # Main Way of Pi orchestrator

# Work with subagents
pi -e coder                  # New feature development
pi -e researcher             # Research a feature
pi -e architect              # Design system architecture
pi -e builder                # Write implementation
```
