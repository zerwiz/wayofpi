# Pi Architecture & Filesystem Map

## Overview

The **pi.dev ecosystem** separates files into **three distinct layers**:

1. **System State** - Runtime data, logs, config (XDG standard paths)
2. **Global Assets** - Extensions, skills, prompts shared across all projects
3. **Workspace Assets** - Project-specific overrides (local paths take precedence)

---

## Directory Structure Map

### 1. System & State Directories (XDG Standard)

Pi adheres strictly to the **XDG Base Directory Specification** for core system operations:

```
~/.config/pi/                  # ($XDG_CONFIG_HOME/pi/)
├── config.json                # Core settings, default model, MCP server registry
├── aliases.json               # Custom command mappings
├── mcp-servers.json           # Configuration for third-party Model Context Protocol servers
├── .env                       # (Optional) Local secrets/API keys for Extensions
└── ...

~/.local/state/pi/             # ($XDG_STATE_HOME/pi/)
├── sessions/                  # Active and suspended session state data
│   ├── session-abc12.json     # Serialized LLM context and history
│   └── session-xyz89.json
├── logs/                      # System and error logs
│   ├── pi-daemon.log          # Background process logs for RPC/Daemon mode
│   └── errors.log             # Stderr captures (Exit codes 1-3)
└── ...

~/.cache/pi/                   # ($XDG_CACHE_HOME/pi/)
├── npm/                       # Cached NPM packages for Extensions
├── models/                    # Cached model schemas or local weights
└── ...
```

### Directory Purpose

| Path | Purpose | Auto-Cleanup |
|------|--------|--------------|
| `~/.config/pi/` | User configuration files | No (manual delete) |
| `~/.local/state/pi/` | Runtime state, sessions, logs | No (manual delete) |
| `~/.cache/pi/` | Temporary data, NPM cache | Yes (periodic) |

---

### 2. Global Agent Assets (The "Agent Profile")

These files define the **core identity** of the agent:

```
~/.pi/                         # Global Pi Profile
├── SYSTEM.md                  # Core identity instructions (The Agent's "Soul")
├── AGENTS.md                  # Registry of specialized sub-agents and their triggers
├── rules/                     # Custom Rule Documents (Reference for developers/LLM)
│   ├── extensions.md          # Rules for building Extensions
│   ├── skills.md              # Rules for building Skills
│   ├── architecture.md        # Architecture & CLI Rules
│   └── ...
├── extensions/                # Programmatic hooks (Brawn)
│   ├── github-tools.ts
│   ├── database-connector/
│   └── ...
├── skills/                    # Domain workflows (Brains)
│   ├── react-generator/
│   │   ├── SKILL.md
│   │   └── templates/
│   ├── jira-ticketing/
│   │   ├── SKILL.md
│   │   └── scripts/
│   └── ...
└── prompts/                   # Reusable user inputs (Shortcuts)
    ├── refactor.md
    ├── write-tests.md
    ├── code-review.md
    └── ...
```

### Global Assets Rules

- **SYSTEM.md**: Always exists; defines core personality and system rules
- **AGENTS.md**: Defines available sub-agents and triggers
- **rules/**: Developer reference; read-only for end users
- **extensions/**: Auto-discovered `*.ts` files (extensions)
- **skills/**: Auto-discovered `SKILL.md` files (skills)
- **prompts/**: Reusable prompt templates

---

### 3. Workspace-Level Assets (Local Overrides)

Local assets **always take precedence** over global assets with the same name:

```
/your-project-workspace/
├── src/
├── tsconfig.json
├── package.json
└── .pi/                       # Project-specific Pi configuration
    ├── SYSTEM.md              # Override personality for this specific repo
    ├── AGENTS.md              # Define repo-specific specialists (e.g., "db-admin", "frontend-dev")
    ├── rules/                 # Repo-specific rule overrides
    ├── extensions/            # Custom tools just for this repo
    ├── skills/                # Repo-specific coding guidelines
    └── prompts/               # Project-specific shortcuts
```

### Workspace Rules

- `.pi/SYSTEM.md`: Overrides global SYSTEM.md for this workspace only
- `.pi/AGENTS.md`: Defines project-specific sub-agents
- `.pi/rules/`: Can override or supplement global rules
- `.pi/extensions/`: Project-specific extension overrides
- `.pi/skills/`: Project-specific skills (local context)
- `.pi/prompts/`: Project-specific prompt templates

---

## 4. Binary & Runtime Execution

```
/usr/local/bin/pi              # Standard location for the Pi CLI binary
/tmp/                          # Host temporary directory
└── pi-run-<pid>/              # Ephemeral folder for current session (auto-cleaned)
    ├── .sock                  # IPC socket for RPC mode (Editor/Daemon comms)
    ├── ipc_buffer.b64         # Base64 encoded binary file buffer
    └── stream.out             # Standard output capture (captured during run)
```

### Runtime Behavior

- **PID folders**: Created when `pi run` command executes
- **IPC socket**: Enables communication with external editors/IDE plugins
- **Buffer file**: Temporary file handling for large payloads
- **Auto-cleanup**: PID folder removed on session end

---

## Quick Reference: Where does it go?

### Asset Type | File/Ext | Description | Where to put it (Global)

| Asset Type | File/Type | Description | Where to put it (Global) |
|------------|-----------|-------------|--------------------------|
| **System Rules** | `SYSTEM.md` | Core instructions/identity | `~/.pi/SYSTEM.md` |
| **Sub-Agents** | `AGENTS.md` | Registry of specialists | `~/.pi/AGENTS.md` |
| **Rule Docs** | `*.md` | Developer reference rules | `~/.pi/rules/` |
| **Extension** | `*.ts` | Custom code/Tools | `~/.pi/extensions/` |
| **Skill** | `SKILL.md` | Workflow/Knowledge | `~/.pi/skills/<name>/` |
| **Prompt** | `*.md` | CLI template | `~/.pi/prompts/` |
| **MCP Config** | `*.json` | Third-party tool servers | `~/.config/pi/mcp-servers.json` |

### Local Override Paths

| Asset Type | File/Type | Where to put it (Local/Workspace) |
|------------|-----------|-----------------------------------|
| **System Override** | `SYSTEM.md` | `./.pi/SYSTEM.md` |
| **Agent Override** | `AGENTS.md` | `./.pi/AGENTS.md` |
| **Rule Override** | `*.md` | `./.pi/rules/` |
| **Local Extension** | `*.ts` | `./.pi/extensions/` |
| **Local Skill** | `SKILL.md` | `./.pi/skills/<name>/` |
| **Local Prompt** | `*.md` | `./.pi/prompts/` |

---

## File Precedence Rules

### Priority Order

1. **Local Workspace** (`.pi/` in project root) - **Highest priority**
2. **Global Assets** (`~/.pi/`)
3. **System Defaults** (built-in)

### Override Behavior

```bash
# Example: Workspace skill overrides global skill
pi run --skill ./local-react-skill/
# -> Loads: .pi/skills/react-skill/ > ~/.pi/skills/react-skill/
```

### Discovery Rules

| Mechanism | Global Auto-Discovery | Local Auto-Discovery |
|------------|----------------|----|
| Extensions | `~/.pi/extensions/` | `./.pi/extensions/` |
| Skills | `~/.pi/skills/` (recursive) | `./.pi/skills/` (recursive) |
| Prompts | `~/.pi/prompts/` (non-recursive) | `./.pi/prompts/` (non-recursive) |

---

## System Layer Details

### System State (`~/.config/pi/`)

```json
{
  "config": {
    "defaultModel": "pi-coding-agent-latest",
    "maxContext": 128000,
    "timeout": 7200
  },
  "aliases": {
    "review": "pi run --mode code-review",
    "build": "pi run --mode build"
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "gh-cli"]
    }
  }
}
```

### Session State (`~/.local/state/pi/sessions/`)

```json
// Example session file
{
  "sessionId": "abc-123-def-456",
  "model": "pi-coding-agent-v2",
  "messages": [...],
  "tools": ["github-tools", "database-connector"],
  "startTime": 1735689600,
  "lastActive": 1735693200
}
```

### Logs (`~/.local/state/pi/logs/`)

```
pi-daemon.log          # Daemon/RPC process logs
errors.log             # Error captures (exit codes 1-3)
extensions.log         # Extension lifecycle logs
skills.log             # Skill activation logs
```

---

## Best Practices

### ✅ DO:

- **Use XDG paths** (`~/.config/`, `~/.local/state/`, `~/.cache/`) for system files
- **Place skills** in `~/.pi/skills/` or `./.pi/skills/` for domain workflows
- **Place extensions** in `~/.pi/extensions/` or `./.pi/extensions/` for custom tools
- **Use `.env`** in `~/.config/pi/` for secrets (never in SYSTEM.md)
- **Create local overrides** in `.pi/` for project-specific customization

### ❌ DON'T:

- **Store config** in workspace root - use `.pi/` subdirectory
- **Mix system and workspace** files in the same path
- **Use global paths** for secrets - use `.env` with proper permissions
- **Edit system rules** directly - create custom files in `rules/`

---

## 🔗 Related Documentation

- **Architecture**: `https://www.pi.dev/architecture`
- **Extensions**: `https://www.pi.dev/extensions`
- **Skills**: `https://www.pi.dev/skills`
- **Pi-Mono**: `https://github.com/badlogic/pi-mono`

---

## 📝 License

MIT License

---

## 📝 Last Updated

2025
