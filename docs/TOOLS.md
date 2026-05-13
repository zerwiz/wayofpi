# Tools Catalog

> Complete tools catalog for Way of Pi agent: built-in tools, extensions, and agent allowlists.

---

## 🧰 Tools Overview

**Purpose**: Tools enable agents to read, write, execute, and query the environment.

**Location**: `.pi/tools/`

**Built-in Tools**: Pre-installed utilities

**Extensions**: Custom tool extensions

**Allowlists**: Agent-specific tool permissions

**Commands**:

- `/tools list` — List available tools
- `/tools enable <tool>` — Enable tool
- `/tools disable <tool>` — Disable tool

---

## 📂 Tools Structure

```
.pi/tools/
├── build/               # Build tools
├── file-tree/           # File tree tools
├── git/                 # Git tools
├── image/               # Image tools
├── lint/                # Linting tools
├── memory/              # Memory tools
├── network/             # Network tools
├── search/              # Search tools
├── shell/               # Shell tools
├── system/              # System tools
├── textproc/            # Text processing
├── tools/               # Built-in tools
├── web/                 # Web tools
└── xdg/                 # XDG utilities
```

---

## 🧰 Built-in Tools

### Core Shell Tools

| Tool   | Description         | Location                  |
| ------ | ------------------- | ------------------------- |
| `bash` | Shell execution     | `.pi/tools/tools/bash.ts` |
| `curl` | HTTP/HTTPS requests | `.pi/tools/tools/curl.ts` |
| `grep` | Pattern searching   | `.pi/tools/grep.ts`       |
| `find` | File finding        | `.pi/tools/find.ts`       |
| `git`  | Git operations      | `.pi/tools/tools/git.ts`  |
| `ls`   | Directory listing   | Built-in                  |
| `cat`  | File cat            | Built-in                  |

---

### Build Tools

| Tool         | Description       | Location                  |
| ------------ | ----------------- | ------------------------- |
| `bun build`  | Bundle JavaScript | `.pi/tools/build/bun.ts`  |
| `npm run`    | NPM scripts       | `.pi/tools/tools/npm.ts`  |
| `bun build`  | Bun bundler       | `.pi/tools/build/bun.ts`  |
| `vite build` | Vite bundler      | `.pi/tools/build/vite.ts` |

---

### File Operations

| Tool    | Description  | Location             |
| ------- | ------------ | -------------------- |
| `read`  | Read file    | `.pi/tools/read.ts`  |
| `write` | Write file   | `.pi/tools/write.ts` |
| `edit`  | Edit file    | `.pi/tools/edit.ts`  |
| `diff`  | Show diff    | `.pi/tools/diff.ts`  |
| `mv`    | Move files   | `.pi/tools/mv.ts`    |
| `rm`    | Remove files | `.pi/tools/rm.ts`    |

---

### Network Tools

| Tool   | Description         | Location                 |
| ------ | ------------------- | ------------------------ |
| `curl` | HTTP/HTTPS          | `.pi/tools/nocurl.ts`    |
| `wget` | File downloads      | `.pi/tools/wget.ts`      |
| `dig`  | DNS lookups         | `.pi/tools/tools/dig.ts` |
| `ping` | Network diagnostics | Built-in                 |

---

### Linting Tools

| Tool        | Description        | Location                 |
| ----------- | ------------------ | ------------------------ |
| `eslint`    | JavaScript linting | Built-in                 |
| `prettier`  | Code formatting    | Built-in                 |
| `npm audit` | Dependency audit   | `.pi/tools/npm-audit.ts` |

---

### Git Tools

| Tool         | Description       | Location           |
| ------------ | ----------------- | ------------------ |
| `git status` | Repository status | `.pi/tools/git.ts` |
| `git add`    | Stage files       | `.pi/tools/git.ts` |
| `git commit` | Commit changes    | `.pi/tools/git.ts` |
| `git push`   | Push to remote    | `.pi/tools/git.ts` |
| `git pull`   | Pull from remote  | `.pi/tools/git.ts` |

---

### Web Tools

| Tool         | Description   | Location                 |
| ------------ | ------------- | ------------------------ |
| `web-search` | Web search    | `.pi/tools/web-tools.ts` |
| `web-read`   | Web page read | `.pi/tools/web-tools.ts` |
| `web-save`   | Save web page | `.pi/tools/web-tools.ts` |
| `web-curl`   | Web fetch     | `.pi/tools/web-tools.ts` |

---

### Memory Tools

| Tool          | Description     | Location                     |
| ------------- | --------------- | ---------------------------- |
| `sqlite`      | SQLite database | `.pi/tools/memory/sqlite.ts` |
| `memory-read` | Read memory     | `.pi/tools/memory/read.ts`   |
| `/remember`   | Store memory    | `.pi/tools/remember.ts`      |
| `/memory`     | Recall memory   | `.pi/tools/memory.ts`        |

---

### Search Tools

| Tool            | Description   | Location                     |
| --------------- | ------------- | ---------------------------- |
| `code-search`   | Code search   | `.pi/tools/search.ts`        |
| `web-search`    | Web search    | `.pi/tools/web-search.ts`    |
| `memory-search` | Memory search | `.pi/tools/memory-search.ts` |

---

### System Tools

| Tool           | Description  | Location                      |
| -------------- | ------------ | ----------------------------- |
| `system-info`  | System info  | Built-in                      |
| `process-list` | Process list | `.pi/tools/system/process.ts` |
| `network-info` | Network info | `.pi/tools/system/network.ts` |

---

### Image Tools

| Tool       | Description      | Location |
| ---------- | ---------------- | -------- |
| `identify` | Image meta       | Built-in |
| `convert`  | Image conversion | Built-in |
| `ffmpeg`   | Video processing | Built-in |

---

### XDG Utilities

| Tool             | Description | Location                    |
| ---------------- | ----------- | --------------------------- |
| `xdg-open`       | Open file   | `.pi/tools/xdg/xdg-open.ts` |
| `xdg-mime-query` | MIME query  | Built-in                    |

---

## 🔐 Tool Safety

### Damage Control

All tools include damage control:

```yaml
- File system safety: .gitignored files, no /proc, no /sys
- Command validation: No eval(), proper escaping
- Tool allowlists: Only approved tools allowed
- Session limits: Max 2000 lines or 50KB per file
```

### Agent Allowlists

**File**: `.pi/settings.json`

```json
{
  "settings": {
    "maxFileSize": 512 * 1024,
    "tools": [
      "bash",
      "curl",
      "grep",
      "find",
      "git",
      "ls",
      "tree",
      "cat",
      "code"
    ],
    "model_priority": [
      "claude-3-5-sonnet-20240620",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229"
    ]
  }
}
```

---

## 🛠️ Tool Management

### List Tools

```
/tools list
```

**Output**:

```
Available tools:
  bash, curl, grep, find, git, ls, tree, cat, code,
  bundle, npm, prettier, eslint,
  sqlite, memory-read,
  web-search, web-read, web-save, web-curl,
  git-status, git-add, git-commit, git-push, git-pull,
  identify, convert, ffmpeg,
  xdg-open, xdg-mime-query
```

---

### Enable Tool

```
/tools enable <tool>
```

**Example**:

```
/tools enable npm-audit
```

---

### Disable Tool

```
/tools disable <tool>
```

**Example**:

```
/tools disable <unsafe-tool>
```

---

## 🧪 Tool Examples

### Example 1: File Reading

```
read .pi/agents/wop-agents/pi.agent.yml
```

---

### Example 2: Git Operations

```
git status
git add .
git commit -m "Feature: new agent"
```

---

### Example 3: Web Search

```
web-search React vs Vue 2026
```

---

### Example 4: Memory Storage

```
/remember My preferred editor is VSCode
```

---

### Example 5: Code Search

```
code_search async/await patterns
```

---

## 📊 Tool Usage Statistics

**Command**: `/tools stats` (pending implementation)

**File**: `.pi/storage/usage-stats.json`

---

## 🔗 Tool Integration

### Session Memory

**Integration**: Tools interact with session memory

**File**: `extensions/session-memory.ts`

---

### Chronicle

**Integration**: Tool usage logged to ledger

**File**: `.pi/extensions/chronicle.ts`

---

### Extension Picker

**Integration**: Custom tools as extensions

**Command**: `/extensions`

---

## 📝 Tool Authoring

### Create Custom Tool

**Step 1**: Create tool directory

```bash
mkdir -p .pi/tools/custom-tool
```

---

### Step 2: Implement Tool

**File**: `.pi/tools/custom-tool/custom-tool.ts`

**Example**:

```typescript
// .pi/tools/custom-tool/custom-tool.ts
export type Tool = {
  name: 'custom-tool';
  description: 'Custom tool description';
  signature: 'custom-tool <arg>';
  description: 'Does something';
  process: async ({ prompt, files }) => {
    // Tool implementation
    return `Result: ${result}`;
  };
};
```

---

### Step 3: Add to Allowlist

```json
{
  "settings": {
    "tools": ["...", "custom-tool"]
  }
}
```

---

## 🔍 Tool Reference

| Category | Tools                                                         |
| -------- | ------------------------------------------------------------- |
| Shell    | `bash`, `grep`, `find`, `code`, `ls`, `cat`, `tree`           |
| Network  | `curl`, `wget`, `dig`, `ping`                                 |
| File     | `read`, `write`, `edit`, `diff`, `mv`, `rm`                   |
| Build    | `bun build`, `npm`, `vite`                                    |
| Git      | `git status`, `git add`, `git commit`, `git push`, `git pull` |
| Web      | `web-search`, `web-read`, `web-save`, `web-curl`              |
| Memory   | `sqlite`, `memory-read`, `/remember`, `/memory`               |
| Search   | `code-search`, `web-search`, `memory-search`                  |
| System   | `system-info`, `process-list`, `network-info`                 |
| Lint     | `eslint`, `prettier`, `npm audit`                             |
| Image    | `identify`, `convert`, `ffmpeg`                               |
| XDG      | `xdg-open`, `xdg-mime-query`                                  |

---

**See also**: [`/docs/SKILLS.md`](./SKILLS.md), [`/docs/AGENT_MEMORY.md`](./AGENT_MEMORY.md), [`/docs/AGENTS.md`](./AGENTS.md)
