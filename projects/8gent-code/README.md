# Project: 8gent CODE

**Last updated:** 2026-03-26

## Goal

Terminal-first agentic coding experience. 8gent Code is the kernel of the 8gent ecosystem - a multi-agent system with autonomous task execution, memory persistence, policy enforcement, and cross-platform deployment (macOS/Linux).

**Key Features:**
- AST-first code exploration for 40%+ token savings
- Multi-agent orchestration with 11 default personas
- Persistent daemon on Fly.io Amsterdam (`eight-vessel.fly.dev`)
- Terminal pet (Lil Eight) for macOS dock + Linux terminal
- Memory layer with SQLite + FTS5, consolidation, and self-reflection
- Continuous RL fine-tuning via GRPO (off by default)

See [CLAUDE.md](/home/zerwiz/CodeP/8gent-code-main/CLAUDE.md) for full project context.

## Repo

- Repository: [`github.com/zerwiz/8gent-code`](https://github.com/zerwiz/8gent-code)
- Upstream: [`github.com/PodJamz/8gent-code`](https://github.com/PodJamz/8gent-code)

## Architecture

```
apps/                 # Products
  - tui/             # 8gent TUI (Ink v6)
  - clui/            # Desktop overlay (Tauri)
  - dashboard/       # Web dashboard
  - debugger/        # Debug tools
  - demos/           # Demos
  - lil-eight/       # Dock pet

packages/            # Agent capabilities
  - ai/              # AI SDK integration
  - eight/           # Agent loop, session management
  - memory/          # Episodic + semantic memory
  - orchestration/   # Worktree pool (4 max)
  - permissions/     # NemoClaw policy engine
  - self-autonomy/   # Evolution, reflection
  - validation/      # Checkpoint + rollback
  - proactive/       # Bounty scanner, opportunities
  - music/           # DJ & production
  - pet/             # Companion generation
```

## Monorepo Layout

- **Apps** at `apps/` - 6 products: tui, clui, dashboard, debugger, demos, installer
- **Packages** at `packages/` - 50+ capabilities: memory, orchestration, music, self-autonomy, tools, etc.
- **Benchmarks** at `benchmarks/` - Efficiency testing
- **Scripts** at `scripts/` - CLI utilities

## Installation

```bash
# From binary (recommended)
npm install -g @podjamz/8gent-code
8gent                                     # launches TUI

# From source
cd /home/zerwiz/CodeP/8gent-code-main
bun install
8gent tui                                 # or directly with bun run
```

## Commands

```bash
# Core commands
8gent                              # launch TUI
8gent tui                          # launch TUI
8gent pet start                    # spawn Lil Eight dock pet
8gent pet status                   # pet status
8gent chat "<message>"             # non-interactive chat
8gent session list                 # list recent sessions
8gent session resume <id>          # resume a session

# Multi-agent orchestration
8gent agent spawn winston "Task description"
8gent agent list                   # list active sub-agents
8gent agent message <id> "..."     # send message to agent
8gent agent kill <id>              # kill agent

# Memory
8gent memory recall "<query>"
8gent memory remember "<fact>"

# Utilities
8gent outline <file>               # get symbol outline
8gent symbol <file>::<name>        # get specific symbol
8gent search "<query>"             # search across codebase
8gent init                         # initialize in new dir
```

## Environment

Required env vars (all optional, defaults provided):

| Variable | Default | Purpose |
|----------|---------|---------|
| `TELEGRAM_BOT_TOKEN` | — | Telegram notifications |
| `TELEGRAM_CHAT_ID` | — | Telegram notifications |
| `OPENROUTER_API_KEY` | — | Cloud model access |
| `ANTHROPIC_API_KEY` | — | Claude comparisons |
| `OLLAMA_URL` | `http://localhost:11434` | Local model endpoint |

## Platform Notes

- **macOS**: Lil Eight dock pet (Swift native app)
- **Linux/WSL**: Terminal pet (ANSI escape rendering)
- **Both**: 8gent CLI works identically across platforms

## Absolute Prohibitions (NON-NEGOTIABLE)

1. **No em dashes (—)** - Use hyphens or rephrase
2. **No stat padding** - State what exists, don't invent numbers
3. **Evidence over vibes** - Claims need benchmark score, count, or link
4. **Scope creep detection** - If conversation drifts A→F, ask before proceeding
5. **Default to smallest** - Not flashy - what ships that works

## Links

- **Main README**: [`/home/zerwiz/CodeP/8gent-code-main/README.md`](/home/zerwiz/CodeP/8gent-code-main/README.md)
- **8gent Documentation**: [`8gent.world`](https://8gent.world)
- **8gent OS**: [`8gentos.com`](https://8gentos.com)
- **Fly.io Vessel**: [`eight-vessel.fly.dev`](https://eight-vessel.fly.dev)

See `/home/zerwiz/.pi/projects/8gent-code/00-OVERVIEW.md` for scope details, and `01-CONTEXT.md` for stack/commands.
