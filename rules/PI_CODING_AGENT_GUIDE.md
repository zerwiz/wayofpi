# PI Codging Agent - Documentation

> A minimal terminal coding harness. Adapt Pi to your workflows.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Providers & Models](#providers--models)
- [Interactive Mode](#interactive-mode)
- [Editor](#editor)
- [Commands](#commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Message Queue](#message-queue)
- [Sessions](#sessions)
- [Settings](#settings)
- [Context Files](#context-files)
- [Customization](#customization)
  - [Prompt Templates](#prompt-templates)
  - [Skills](#skills)
  - [Extensions](#extensions)
  - [Themes](#themes)
  - [Pi Packages](#pi-packages)
- [Programmatic Usage](#programmatic-usage)
- [Philosophy](#philosophy)
- [CLI Reference](#cli-reference)
- [Environment Variables](#environment-variables)

---

## Quick Start

Way of Pi uses a **project-local** Pi installation decoupled from your global `pi` command.

```bash
# Install (done automatically by bun install)
bun add @earendil-works/pi-coding-agent@0.74.0

# Run via just (recommended)
just pi

# Run via local binary
./node_modules/.bin/pi
```

### Authentication

```bash
# Using API key
export ANTHROPIC_API_KEY=sk-ant-...
pi

# Or use subscription
pi
/login  # Then select provider
```

### Usage

Just talk to Pi. By default, Pi gives the model four tools: `read`, `write`, `edit`, and `bash`. The model uses these to fulfill your requests.

---

## Providers & Models

### Subscriptions

- Anthropic Claude Pro/Max
- OpenAI ChatGPT Plus/Pro (Codex)
- GitHub Copilot
- Google Gemini CLI
- Google Antigravity

### API Keys

- Anthropic
- OpenAI
- Azure OpenAI
- Google Gemini
- Google Vertex
- Amazon Bedrock
- Mistral
- Groq
- Cerebras
- xAI
- OpenRouter
- Vercel AI Gateway
- ZAI
- OpenCode Zen
- OpenCode Go
- Hugging Face
- Kimi For Coding
- MiniMax

Use `/model` (or `Ctrl+L`) to switch models after authentication.

### Custom Providers

Add custom providers via `~/.pi/agent/models.json`. See [docs/models.md](docs/models.md) for details.

---

## Interactive Mode

### Interface Structure

```
┌─────────────────────────────────────────┐
│ Startup header                          │
│   - Shortcuts (/hotkeys)                │
│   - Loaded AGENTS.md, templates, skills │
├─────────────────────────────────────────┤
│ Messages                                │
│   - Your messages                       │
│   - Assistant responses                 │
│   - Tool calls & results                │
│   - Notifications, errors               │
├─────────────────────────────────────────┤
│ Editor                                  │
│   - Where you type                      │
│   - Border color indicates thinking lvl │
├─────────────────────────────────────────┤
│ Footer                                  │
│   - Working directory                   │
│   - Session name                        │
│   - Token/cache usage                   │
│   - Cost                                │
│   - Context usage                       │
│   - Current model                       │
└─────────────────────────────────────────┘
```

---

## Editor

### Features

| Feature | How |
|---------|-----|
| **File reference** | Type `@` to fuzzy-search project files |
| **Path completion** | Tab to complete paths |
| **Multi-line** | Shift+Enter (or Ctrl+Enter on Windows Terminal) |
| **Images** | Ctrl+V to paste (Alt+V on Windows), or drag onto terminal |
| **Bash commands** | `!command` runs and sends output to LLM, `!!command` runs without sending |

---

## Commands

Type `/` in the editor to trigger commands.

| Command | Description |
|---------|-------------|
| `/login` | OAuth authentication |
| `/logout` | Logout |
| `/model` | Switch models |
| `/scoped-models` | Enable/disable models for Ctrl+P cycling |
| `/settings` | Thinking level, theme, message delivery, transport |
| `/resume` | Pick from previous sessions |
| `/new` | Start a new session |
| `/name <name>` | Set session display name |
| `/session` | Show session info |
| `/tree` | Jump to any point in session |
| `/fork` | Create new session from current branch |
| `/compact [prompt]` | Manually compact context |
| `/copy` | Copy last assistant message |
| `/export [file]` | Export session to HTML |
| `/share` | Upload as GitHub gist |
| `/reload` | Reload keybindings, extensions, etc. |
| `/hotkeys` | Show all keyboard shortcuts |
| `/changelog` | Display version history |
| `/quit` | Quit Pi |

### Custom Commands

Extensions can register custom commands:
```typescript
pi.registerCommand("myCommand", { ... });
```

---

## Keyboard Shortcuts

See `/hotkeys` for the full list. Customize via `~/.pi/agent/keybindings.json`.

### Common Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+C` | Clear editor |
| `Ctrl+C` (twice) | Quit |
| `Escape` | Cancel/abort |
| `Escape` (twice) | Open `/tree` |
| `Ctrl+L` | Open model selector |
| `Ctrl+P` / `Shift+Ctrl+P` | Cycle scoped models |
| `Shift+Tab` | Cycle thinking level |
| `Ctrl+O` | Collapse/expand tool output |
| `Ctrl+T` | Collapse/expand thinking blocks |

---

## Message Queue

Submit messages while the agent is working:

- **Enter**: Queues a steering message (delivered after current turn)
- **Alt+Enter**: Queues a follow-up message (delivered after all work)
- **Escape**: Aborts and restores queued messages to editor
- **Alt+Up**: Retrieves queued messages back to editor

### Windows Terminal Note

`Alt+Enter` is fullscreen by default. Remap it in [docs/terminal-setup.md](docs/terminal-setup.md).

### Settings

Configure delivery in settings:
- `steeringMode`: `"one-at-a-time"` (default) or `"all"`
- `followUpMode`: `"one-at-a-time"` or `"all"`
- `transport`: `"sse"`, `"websocket"`, or `"auto"`

---

## Sessions

Sessions are stored as JSONL files with a tree structure. Each entry has `id` and `parentId`, enabling in-place branching.

### Storage

```
~/.pi/agent/sessions/
└── <working_directory>/
    └── session.<timestamp>.jsonl
```

### Management

```bash
pi -c              # Continue most recent session
pi -r              # Browse and select from past sessions
pi --no-session    # Ephemeral mode (don't save)
pi --session <path>    # Use specific session file
pi --fork <path>     # Fork specific session
```

### Branching

```bash
/tree    # Navigate the session tree in-place
```

**Tree View Features:**
- Search by typing
- Fold/unfold and jump between branches with `Ctrl+←/Ctrl+→` or `Alt+←/Alt+→`
- Page with `←/→`
- Filter modes (Ctrl+O): `default → no-tools → user-only → labeled-only → all`
- Press `Shift+L` to label entries as bookmarks
- `Shift+T` to toggle label timestamps

### Forking

```bash
/fork             # Create new session from current branch
--fork <path|id>  # Fork from CLI
```

---

## Settings

### Locations

| Location | Scope |
|----------|-------|
| `~/.pi/agent/settings.json` | Global (all projects) |
| `.pi/settings.json` | Project (overrides global) |

### Telemetry

To opt out of anonymous install/update telemetry:

```json
// In ~/.pi/agent/settings.json
{
  "enableInstallTelemetry": false
}
```

Or set `PI_TELEMETRY=0`

---

## Context Files

Pi loads `AGENTS.md` (or `CLAUDE.md`) at startup from:

1. `~/.pi/agent/AGENTS.md` (global)
2. Parent directories (walking up from cwd)
3. Current directory

**Use for:**
- Project instructions
- Conventions
- Common commands

**Disable with:** `--no-context-files` (or `-nc`)

---

## System Prompt

| File | Purpose |
|------|---------|
| `.pi/SYSTEM.md` | Replace default (project) |
| `~/.pi/agent/SYSTEM.md` | Replace default (global) |
| `APPEND_SYSTEM.md` | Append without replacing |

---

## Customization

### Prompt Templates

Reusable prompts as Markdown files. Type `/name` to expand.

**Location:**
- `~/.pi/agent/prompts/`
- `.pi/prompts/`
- `~/.pi/packages/<package>/prompts/`

**Example:**
```markdown
<!-- ~/.pi/agent/prompts/review.md -->
Review this code for bugs, security issues, and performance problems.
Focus on: {{focus}}
```

---

### Skills

On-demand capability packages following the Agent Skills standard.

**Location:**
- `~/.pi/agent/skills/`
- `~/.agents/skills/`
- `.pi/skills/`
- `.agents/skills/` (from cwd up through parent directories)

**Example:**
```markdown
# My Skill
Use this skill when the user asks about X.

## Steps
1. Do this
2. Then that
```

Invoke via `/skill:name` or let the agent load them automatically.

---

### Extensions

TypeScript modules that extend Pi with custom tools, commands, keyboard shortcuts, event handlers, and UI components.

**Location:**
- `~/.pi/agent/extensions/`
- `.pi/extensions/`
- `~/.pi/packages/<package>/extensions/`

**Example:**
```typescript
export default function (pi: ExtensionAPI) {
  pi.registerTool({ name: "deploy", ... });
  pi.registerCommand("stats", { ... });
  pi.on("tool_call", async (event, ctx) => { ... });
}
```

**What's Possible:**
- Custom tools (or replace built-in tools entirely)
- Sub-agents and plan mode
- Custom compaction and summarization
- Permission gates and path protection
- Custom editors and UI components
- Status lines, headers, footers
- Git checkpointing and auto-commit
- SSH and sandbox execution
- MCP server integration
- Games while waiting
- Anything you can dream up

---

### Themes

**Built-in:** `dark`, `light`

Themes hot-reload: modify the active theme file and Pi immediately applies changes.

**Location:**
- `~/.pi/agent/themes/`
- `.pi/themes/`

---

### Pi Packages

Bundle and share extensions, skills, prompts, and themes via npm or git.

#### Installation

```bash
pi install npm:@foo/pi-tools
pi install npm:@foo/pi-tools@1.2.3      # pinned version
pi install git:github.com/user/repo
pi install git:github.com/user/repo@v1  # tag or commit
pi install https://github.com/user/repo
pi install git@github.com:user/repo
pi remove npm:@foo/pi-tools
pi uninstall npm:@foo/pi-tools          # alias for remove
```

#### Project-Local Installs

```bash
pi install npm:@foo/pi-tools -l         # -l for project-local
```

#### Package Manifest

```json
{
  "name": "my-pi-package",
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

#### Package Locations

```
# System-wide
~/.pi/agent/git/          # git packages
~/.pi/npm/                # npm packages

# Project-local (-l flag)
.project/.pi/git/
.project/.pi/npm/
```

---

## Programmatic Usage

### SDK

```typescript
import { 
  AuthStorage, 
  createAgentSession, 
  ModelRegistry, 
  SessionManager 
} from "@mariozechner/pi-coding-agent";

const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
});

await session.prompt("What files are in the current directory?");
```

### Runtime

For advanced multi-session runtime replacement, use `createAgentSessionRuntime()` and `AgentSessionRuntime`.

### RPC Mode

For non-Node.js integrations:

```bash
pi --mode rpc
```

RPC mode uses strict LF-delimited JSONL framing.
**Note:** Do not use generic line readers like Node `readline` which split on Unicode separators inside JSON payloads.

---

## Philosophy

Pi is aggressively extensible so it doesn't have to dictate your workflow:

- **No MCP**: Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support.
- **No sub-agents**: Spawn Pi instances via tmux, or build your own with extensions.
- **No permission popups**: Run in a container, or build your own confirmation flow.
- **No plan mode**: Write plans to files, or build it with extensions.
- **No built-in to-dos**: They confuse models. Use a `TODO.md` file.
- **No background bash**: Use tmux. Full observability.

---

## CLI Reference

### Basic Usage

```bash
pi [options] [@files...] [messages.

.[.]
```

### Package Commands

```bash
pi install <source> [-l]     # Install package
pi remove <source> [-l]      # Remove package
pi uninstall <source> [-l]   # Alias for remove
pi update [source]           # Update packages
pi list                      # List installed packages
pi config                    # Enable/disable package resources
```

### Modes

| Flag | Description |
|------|-------------|
| (default) | Interactive mode |
| `-p, --print` | Print response and exit |
| `--mode json` | Output all events as JSON lines |
| `--mode rpc` | RPC mode for process integration |
| `--export <in> [out]` | Export session to HTML |

### Model Options

```bash
--provider <name>           # Provider
--model <pattern>           # Model pattern or ID
--api-key <key>             # API key
--thinking <level>          # off, minimal, low, medium, high, xhigh
--models <patterns>         # Comma-separated patterns for Ctrl+P cycling
--list-models [search]      # List available models
```

### Session Options

```bash
-c, --continue              # Continue most recent session
-r, --resume                # Browse and select session
--session <path>            # Use specific session file
--fork <path>               # Fork specific session
--session-dir <dir>         # Custom session storage directory
--no-session                # Ephemeral mode
```

### Tool Options

```bash
--tools <list>              # Enable specific built-in tools
--no-tools                  # Disable all built-in tools
```

**Available built-in tools:** `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`

### Resource Options

```bash
-e, --extension <source>    # Load extension
--no-extensions             # Disable extension discovery
--skill <path>              # Load skill
--no-skills                 # Disable skill discovery
--prompt-template <path>    # Load prompt template
--no-prompt-templates       # Disable prompt template discovery
--theme <path>              # Load theme
--no-themes                 # Disable theme discovery
--no-context-files, -nc     # Disable context file discovery
```

### Other Options

```bash
--system-prompt <text>      # Replace default prompt
--append-system-prompt <text>  # Append to system prompt
--verbose                   # Force verbose startup
-h, --help                  # Show help
-v, --version               # Show version
```

### File Arguments

Prefix files with `@` to include in the message:

```bash
pi @prompt.md "Answer this"
pi -p @screenshot.png "What's in this image?"
pi @code.ts @test.ts "Review these files"
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | Override config directory (default: `~/.pi/agent`) |
| `PI_PACKAGE_DIR` | Override package directory |
| `PI_SKIP_VERSION_CHECK` | Skip version check at startup |
| `PI_TELEMETRY` | Override install telemetry (`1/true/yes` enable, `0/false/no` disable) |
| `PI_CACHE_RETENTION` | Set to long for extended prompt cache |
| `VISUAL, EDITOR` | External editor for Ctrl+G |

---

## Examples

```bash
# Interactive with initial prompt
pi "List all .ts files in src/"

# Non-interactive
pi -p "Summarize this codebase"

# Non-interactive with piped stdin
cat README.md | pi -p "Summarize this text"

# Different model
pi --provider openai --model gpt-4o "Help me refactor"

# Model with provider prefix
pi --model openai/gpt-4o "Help me refactor"

# Model with thinking level shorthand
pi --model sonnet:high "Solve this complex problem"

# Limit model cycling
pi --models "claude-*,gpt-4o"

# Read-only mode
pi --tools read,grep,find,ls -p "Review the code"

# High thinking level
pi --thinking high "Solve this complex problem"
```

---



- [@mariozechner/pi-ai](https://github.com/badlogic/pi-mono): Core LLM toolkit
- [@mariozechner/pi-agent](https://github.com/badlogic/pi-mono): Agent framework
- [@mariozechner/pi-tui](https://github.com/badlogic/pi-mono): Terminal UI components

---

## Repository Information

- **Package:** `@mariozechner/pi-coding-agent`
- **Version:** 0.67.6
- **License:** MIT
- **Homepage:** github.com/badlogic/pi-mono
- **Repository:** github.com/badlogic/pi-mono

---

*Documentation extracted from npm package documentation*
