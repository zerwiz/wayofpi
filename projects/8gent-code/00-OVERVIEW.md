# Overview

## Problem

What problem does 8gent Code solve?

- **No API caps** — Use local models (Ollama) first, cloud as optional
- **Autonomous execution** — Agents that plan and execute tasks end-to-end
- **Cross-platform** — Works on macOS and Linux with identical CLI
- **Memory persistence** — SQLite + FTS5 for episodic, semantic, procedural memory
- **AST-first** — Parse TypeScript/JavaScript ASTs instead of reading full files, saving 40%+ tokens

## Scope

8gent Code is the kernel of the 8gent ecosystem — an open-source multi-agent system:

| Area | Description |
|------|---|
| **Apps** | 6 products: tui (terminal UI), clui (desktop overlay), dashboard, debugger, demos, installer |
| **Packages** | 50+ packages: memory, orchestration, permissions, music, self-autonomy, tools, validation, etc. |
| **Orchestration** | Worktree pool (max 4) for parallel agent execution |
| **Daemon** | Persistent process on Fly.io Amsterdam (`eight-vessel.fly.dev`) |
| **Memory** | Consolidation, health monitoring, contradiction detection |
| **Fine-tuning** | GRPO pipeline for continuous RL (off by default) |

### Core Files

| File | Purpose |
|------|-----------|
| `packages/eight/agent.ts` | Agent loop, abort, checkpoint restore |
| `packages/eight/prompts/system-prompt.ts` | User context injection for adaptive prompts |
| `packages/permissions/policy-engine.ts` | NemoClaw YAML-based deny-by-default engine |
| `packages/memory/store.ts` | SQLite + FTS5 memory store |
| `packages/self-autonomy/evolution.ts` | Evolution, reflection, consolidation |
| `packages/orchestration/worktree.ts` | Worktree pool (4 max) |
| `packages/tools/tools.ts` | Tool definitions across capabilities |
| `packages/music/music.ts` | DJ, track generation, mixing |
| `packages/voice/voice.ts` | ElevenLabs + VAPI integration |

## Key Files to Inspect

```bash
# Agent core
packages/eight/agent.ts          # agent loop
packages/eight/prompts/          # dynamic prompts
packages/permissions/            # policy engine
packages/memory/                 # SQLite memory store
packages/self-autonomy/          # self-evolution
packages/orchestration/          # worktree pool
packages/tools/                  # tool registry
packages/music/                  # music generation
packages/voice/                  # TTS/STT
```

## Architecture

```
apps/                ─── 6 products
├─ tui/             ── Terminal UI (Ink v6)
├─ clui/            ── Desktop overlay (Tauri)
├─ dashboard/       ── Web UI
├─ debugger/        ── Debug tools
├─ demos/           ── Demos
└─ installer/       ── Install wizard

packages/           ─── 50+ capabilities
├─ ai/              ── AI SDK integration
├─ eight/           ── Agent loop, session management
├─ memory/          ── Episodic + semantic memory
├─ orchestration/   ── Worktree pool
├─ permissions/     ── NemoClaw policy engine
├─ self-autonomy/   ── Evolution, reflection
├─ validation/      ── Checkpoint + rollback
├─ proactive/       ── Opportunity scanner
├─ music/           ── Music generation
├─ pet/             ── Companion generation
└─ tools/           ── Tool definitions

benchmarks/         ─── Efficiency testing
scripts/            ─── CLI utilities
docs/               ─── Documentation
```

## Links

- Main repo: [`github.com/zerwiz/8gent-code`](https://github.com/zerwiz/8gent-code)
- 8gent World: [`8gent.world`](https://8gent.world)
- 8gent OS: [`8gentos.com`](https://8gentos.com)
- Fly.io daemon: [`eight-vessel.fly.dev`](https://eight-vessel.fly.dev)

---

*See [01-CONTEXT.md](./01-CONTEXT.md) for full stack details and CLI reference.*
