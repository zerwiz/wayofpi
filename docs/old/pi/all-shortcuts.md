# PI Shortcuts & Commands Reference

This document catalogs all known shortcuts, slash commands, and keyboard shortcuts used in pi-coding-agent.

> **Last updated:** 2025-04-24

---

## Table of Contents

- [Bash Prefix Commands](#bash-prefix-commands)
- [Slash Commands](#slash-commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Built-in Tools](#built-in-tools)
- [Extension Tools](#extension-tools)
- [Skills Commands](#skills-commands)

---

## Bash Prefix Commands

Commands typed in bash prefix (with `!`, `!!`, or backtick prefix):

| Command | Purpose | Example |
|---------|---------|---------|
| `!git status` | Execute bash command | `! ls -la` |
| `!!` | Re-run last command | Just press `!!` |
| `!<N>` | Execute Nth last command | `!-50` (last 50 commands) |
| `![git]` (backticks) | Complete list of recent commands | `![git]` |
| `` `` `` (backtick) | Execute command directly | `` `git status` `` |

---

## Slash Commands

Commands prefixed with `/` that provide functionality without going through the LLM.

### Session Management

| Command | Description | Usage |
|---------|-------------|-------|
| `/model [model]` | Select model or cycle through available models | `/model openai/gpt-4o` |
| `/settings` | View and edit global settings | Opens settings file |
| `/compact [option]` | Compact the conversation history | `/compact` |
| `/tree` | Show session navigation tree | Shows conversation tree |
| `/fork` | Fork current session | `/fork` |
| `/clone <entry>` | Clone from specific conversation entry | `/clone <name>` |
| `/resume <id>` | Switch back to previous session | `/resume <id>` |
| `/new` | Start new session | `/new` |
| `/exit` | Exit pi session | Pressing exit |
| `/reload` | Reload extensions, skills, prompts, themes | `/reload` |
| `/help` | Show help for slash commands | `/help` |
| `/clear` | Clear conversation history | `/clear` (if allowed) |
| `/history` | Show command history | `/history` |
| `/toggle` | Toggle features or settings | `/toggle <feature>` |
| `/stats` | Show session and model statistics | `/stats` |

### Team & Agent Commands (from agent-team extension)

| Command | Description | Usage |
|---------|-------------|-------|
| `/agents-reload` | Rescan agent files and reload agent-models | `/agents-reload` |
| `/agents-models` | Print resolved agent model map | `/agents-models` |
| `/team_list` | List teams (yaml vs preset), active roster | `/team_list` |
| `/team_activate <name>` | Switch active team | `/team_activate my-team` |
| `/team_load_preset <name>` | Load preset roster | `/team_load_preset scout,reviewer` |
| `/team_save_preset` | Persist current roster under name |
| `/team_delete_preset <name>` | Remove preset |

### System & Mode Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/system` | Edit system prompt | `/system` (opens file) |
| `/append <text>` | Append text to system prompt for next turn |
| `/undo` | Undo last turn (with confirmation) | `/undo` |

### Session & Memory Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/remember <text>` | Add to persistent session memory | `/remember I prefer TypeScript` |
| `/forget <id>` | Remove from memory | `/forget <id>` |
| `/new-tag` | Create new session tag |
| `/tags` | Show session tags |
| `/search <text>` | Search within session |
| `/summary` | Request session summary |

### File Operations

| Command | Description | Usage |
|---------|-------------|-------|
| `/read <path>` | Read file at given path | `/read AGENTS.md` |
| `/write <path> <text>` | Write file with text |
| `/edit <path> <line-numbers> <new-contents>` | Edit file |
| `/delete <path>` | Delete file (with confirmation) |

### Navigation

| Command | Description | Usage |
|---------|-------------|-------|
| `/navigate <path>` | Show file at given path | `/navigate .pi/agents` |
| `/jump <path>` | Jump to file |
| `/open <path>` | Open file in editor |

---

## Keyboard Shortcuts

| Shortcut | Description |
|----------|-----------|
| `Ctrl+P` / `Ctrl+K` | Cycle models |
| `Ctrl+L` | Focus chat input |
| `Ctrl+Q` | Clear input and execute |
| `Ctrl+U` | Undo (clear current input) |
| `Ctrl+Z` | Redo (after undo) |
| `Ctrl+S` | Save session (if extension enabled) |
| `Ctrl+F` | Focus input (TUI mode) |
| `Ctrl+D` | Exit or close |
| `Ctrl+C` | Cancel current operation |
| `Tab` | Complete model name or tool arguments |
| `Shift+Tab` | Cycle thinking levels (effort) |
| `Up` / `Down` | Browse model list |

---

## Built-in Tools

These tools are registered by pi-coding-agent core and available in most sessions.

| Tool | Purpose | Typical Usage |
|------|---------|----------------|
| `read` | Read file contents | `read AGENTS.md` |
| `write` | Create or overwrite file | `write FILE.md` |
| `edit` | Replace text span | `edit` with range selection |
| `bash` | Run shell command | `bash: ls -la` |

### Optional Tools (from `--tools` flag)

| Tool | Purpose |
|------|---------|
| `grep` | Search files |
| `find` | Find files by pattern |
| `ls` | List directory contents |
| `web_search` | Search web (web-tools extension) |
| `web_fetch` | Fetch URLs (web-tools extension) |

---

## Extension Tools

Tools registered by extensions in `~/.pi/agent/extensions/` and `.pi/extensions/`.

### Agent-Team Extension Tools

| Tool | Purpose |
|------|---------|
| `dispatch_agent` | Run task on specialist agent |
| `team_list` | List teams, active roster, scanned agents |
| `team_member_add` | Add member to active team |
| `team_member_remove` | Remove member from active team |
| `team_member_replace` | Replace one roster slot |
| `team_reload_agents` | Rescan agent files from disk |
| `team_activate` | Switch active team |
| `team_load_preset` | Load preset roster from JSON |
| `team_save_preset` | Save current roster as preset |
| `team_delete_preset` | Remove preset from JSON |
| `/agents-reload` | Rescan agent files (command alias) |
| `/agents-models` | Print resolved agent model map |

### Agent-Chain Extension Tools

| Tool | Purpose |
|------|---------|
| `run_chain` | Run step in chain sequence |
| `chain_status` | Show chain progress |

### Chronicle Extension Tools

| Tool | Purpose |
|------|---------|
| `chronicle_status` | Show chronicle timeline status |
| `chronicle_snapshot` | Snapshot chronicle timeline |
| `chronicle_transition` | Transition between timeline events |

### Ralph Extension Tools

| Tool | Purpose |
|------|---------|
| `ralph_queue_status` | Show ralph queue state |

### Forge Extension Tools

| Tool | Purpose |
|------|---------|
| `forge_list` | List forged tools |
| `forge_create` | Create forged tool |
| (dynamic tools) | Forged tools with names like `ghm_exec`, `subagent_...` |

### GitHub-Management Extension Tools

| Tool | Purpose |
|------|---------|
| `ghm_exec` | Run gh command |
| `github_pr_list` | List PRs |
| `github_pr_view` | View PR UI |
| `github_pr_diff` | View PR diff |
| `github_pr_checks` | View PR checks |
| `github_pr_review_submit` | Submit PR review |
| `github_pr_review_inline` | Submit inline review |

### Web-Tools Extension Tools

| Tool | Purpose |
|------|---------|
| `web_search` | Search web |
| `web_fetch` | Fetch URL content |

### Pi-Pi Extension Tools

| Tool | Purpose |
|------|---------|
| `query_experts` | Query multi-agent experts |

### Sub-agent Widget Tools

| Tool | Purpose |
|------|---------|
| `subagent_create` | Create subagent |
| `subagent_continue` | Continue subagent |
| `subagent_remove` | Remove subagent |
| `subagent_list` | List subagents |

### TillDone Extension Tool

| Tool | Purpose |
|------|---------|
| `tilldone` | Run task with dependency tracking |

### Session Memory Extension Tools

| Tool | Purpose |
|------|---------|
| `agent_memory` | Show agent memory layers |
| `agent_memory_summary` | Summarize memory content |
| `remember` | Store memory entry |
| `forget` | Remove memory entry |

### Honcho Mirror Extension Tools

| Tool | Purpose |
|------|---------|
| (write-only) | POST turns to Honcho API (no user-visible tools) |

### Agent Forge Extension

| Tool | Purpose |
|------|---------|
| `forge_create` | Create forged tool |
| (dynamic tools) | Creates tools like `ghm_*`, `subagent_*` |

### Damage Control Extension

| Tool | Purpose |
|------|---------|
| (intercepts) | Blocks dangerous patterns |

### Cross-Agent Extension

| Tool | Purpose |
|------|---------|
| (registers) | Registers commands from `.claude/`, `.gemini/`, `.codex/` skills |

---

## Skills Commands

Skills can be invoked via slash commands (if enabled):

| Command | Description |
|---------|-------------|
| `/skill:<name>` | Load and run skill by name |
| Usage examples: | |
| `/skill:bowser` | Use bowser Playwright skill |
| `/skill:find-skills` | Audit gaps vs skills.sh |
| `/skill:github` | Use GitHub workflow skill |
| `/skill:indexer` | Build INDEX.md folder map |
| `/skill:ralph` | Use ralph queue workflow |

---

## Additional Notes

### Shortcuts in Bash Prefix

- `!git status` - Execute git status
- `!!` - Re-run last command
- `!(git status)` - See list of command history

### Command Categories

1. **Session management**: `/new`, `/compact`, `/tree`, `/fork`, `/resume`
2. **Model management**: `/model`
3. **Settings**: `/settings`, `/reload`
4. **Memory**: `/remember`, `/forget`, `/search`
5. **System**: `/system`, `/append`, `/undo`
6. **Tools**: `read`, `write`, `edit`, `bash`
7. **Teams**: `/team_...` (from agent-team extension)
8. **Agents**: `/agents-...` (from agent-team extension)
9. **Skills**: `/skill:<name>`

### Custom Shortcuts

To add custom shortcuts, create an extension:

```typescript
// ~/.pi/agent/extensions/my-shortcuts.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Key } from "@mariozechner/pi-tui";

export default function (pi: ExtensionAPI) {
  pi.registerShortcut("ctrl+k", {
    description: "Open file picker",
    handler: async (ctx) => {
      // Custom action
    },
  });
}
```

### See Also

- **[CONCEPTS.md](CONCEPTS.md)** - Pi terms and concepts
- **[TOOLS.md](TOOLS.md)** - Built-in tools documentation
- **[EXTENSIONS.md](EXTENSIONS.md)** - Creating and using extensions
- **[SKILLS.md](SKILLS.md)** - Skills documentation
- **[AGENT_TEAMS.md](AGENT_TEAMS.md)** - Agent teams and dispatcher

---

[Generated from documentation in pi-coding-agent playground]
