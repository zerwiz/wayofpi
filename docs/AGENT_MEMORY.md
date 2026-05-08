# Agent Memory Guide

> Complete guide to agent memory, session persistence, and cross-session knowledge management.

---

## 🧠 Memory Overview

**Purpose**: Store persistent knowledge across Pi agent sessions.

**Components**:

- **Session Memory**: Active session dialogue (JSONL)
- **Persistent Memory**: Fact storage (key-value)
- **Lessons**: User corrections and learned patterns
- **Ledger**: Chronicle ledger for all actions

**Commands**:

- `/remember` — Store memory
- `/memory` — Recall memory
- `/forget` — Remove memory
- `/sessionmemory` — Session memory on|off|status
- `/memory list` — List persistent memory
- `/memory add` — Add key-value fact
- `/memory forget` — Remove memory
- `/memory save` — Save and export
- `/memory load` — Load from file
- `/memory clear` — Clear all memory

---

## 📂 Memory Locations

### Active Session Memory

**File**: `~/.pi/storage/session-memory.md`

**Usage**: Active session dialogue, JSONL format

**Access**: `/memory view`

---

### Persistent Memory (Facts)

**File**: `~/.pi/memory/facts.json`

**Format**: JSON

**Example**:

```json
{
  "pref.editor": "VSCode",
  "pref.theme": "tokyo-night",
  "project.repo": "my-project",
  "project.repo.url": "github.com/user/my-project.git"
}
```

**Access**: `/memory get <key>`

---

### Persistent Memory (Lessons)

**File**: `~/.pi/memory/lessons.json`

**Format**: JSON array

**Example**:

```json
[
  {
    "id": "lesson-1",
    "rule": "Never execute commands with eval()",
    "category": "security",
    "negative": true
  }
]
```

**Access**: `/memory lesson list`

---

### Session History

**Files**: `~/.pi/agents/sessions/*.jsonl`

**Format**: JSONL (one message per line)

**Access**: `/sessionmemory` command

---

## 📝 Memory Commands

### Store Memory

```
/remember <text>
```

**Example**:

```
/remember My editor is VSCode with tokyo-night theme
```

**Behavior**: Stored as fact or lesson based on content

---

### Recall Memory

```
/memory <query>
```

**Example**:

```
/memory tokyo-night
/memory editor settings
```

---

### Forget Memory

```
/memory forget <key>
```

**Example**:

```
/memory forget editor_theme
```

---

### Session Memory Commands

```
/sessionmemory on   # Enable session memory
/sessionmemory off  # Disable session memory
/sessionmemory status  # Check status
```

---

### Memory Management

```
/memory list        # List all facts and lessons
/memory save        # Export to file
/memory load <file> # Import from file
/memory clear       # Clear all memory
```

---

## 🔐 Memory Security

### Damage Control Rules

```yaml
- File system safety: .gitignored files, no /proc, no /sys
- Command validation: No eval(), proper escaping
- Tool allowlists: Only approved tools allowed
- Session limits: Max 2000 lines or 50KB per file
```

### Session Memory Injection

**Timing**: After `message_end` event  
**Location**: `extensions/session-memory.ts`  
**Purpose**: Reinject recent USER/ASSISTANT turns

---

## 🧪 Memory Examples

### Example 1: Editor Preference

```
/remember I use VSCode with the tokyo-night theme
```

**Stored**:

```json
{
  "pref.editor": "VSCode",
  "pref.theme": "tokyo-night"
}
```

---

### Example 2: Project Knowledge

```
/remember Project my-app uses React 18
```

**Stored**:

```json
{
  "project.my-app": "React 18 + TypeScript"
}
```

---

### Example 3: Lesson Learned

```
/remember Never execute commands with eval() without sanitization
```

**Stored as lesson** (negative = true):

```json
{
  "rule": "Never execute commands with eval()",
  "category": "security",
  "negative": true
}
```

---

## 🗂️ Memory Categories

### General Category

Default category for all memory items.

---

### Security Category

Lessons about security and damage control.

---

### Project Category

Project-specific knowledge.

---

### Agent Category

Agent-specific rules and preferences.

---

## 🔄 Memory Persistence

### Auto-Save

**Trigger**: On `message_end` event  
**File**: `~/.pi/storage/agent-memory.md`

---

### Manual Save

```
/memory save ~
```

---

### Backup

```
/memory save ~/.pi/memory-backup.json
```

---

## 🧠 Memory Model

### Fact Storage

**Key**: Dotted key notation  
**Value**: String value  
**Example**: `pref.editor: VSCode`

---

### Lesson Storage

**Rule**: Rule text  
**Category**: Category name  
**Negative**: True/false flag  
**Example**: `Never execute commands with eval()`

---

### Event Storage

**Type**: Event  
**Data**: Event data  
**Example**: Session start, config change, etc.

---

## 📋 Memory Query

### Query by Keyword

```
/memory python
/memory tokyo
/memory theme
```

---

### Query by Category

```
/memory list category:security
/memory list category:project
```

---

### Query by Type

```
/memory list type:fact
/memory list type:lesson
/memory list type:event
```

---

## 🎯 Memory Best Practices

### Do

- Use descriptive keys (e.g., `pref.editor`)
- Store facts for preferences
- Store lessons for corrections
- Export and version-control memory files

### Don't

- Store sensitive data (API keys, secrets)
- Store temporary information
- Exceed session memory limits

---

## 🔗 Memory Integration

### Session Saver

**File**: `extensions/sessions/index.ts`  
**Purpose**: Auto-save on `message_end`

---

### Chronicle

**File**: `.pi/extensions/chronicle.ts`  
**Purpose**: Ledger for all agent actions

---

### Agent Team

**Integration**: Team members share session memory  
**File**: `.pi/agents/session-memory.md.jinja`

---

## 📝 Memory API

### Facts

| Method                      | Description     |
| --------------------------- | --------------- |
| `/memory get <key>`         | Get fact by key |
| `/memory set <key> <value>` | Set fact        |
| `/memory list`              | List all facts  |

---

### Lessons

| Method                       | Description      |
| ---------------------------- | ---------------- |
| `/memory lesson list`        | List all lessons |
| `/memory lesson add <rule>`  | Add lesson       |
| `/memory lesson remove <id>` | Remove lesson    |

---

### Events

| Method               | Description    |
| -------------------- | -------------- |
| `/memory event log`  | View event log |
| `/memory event list` | List events    |

---

**See also**: [`/docs/AGENTS.md`](./AGENTS.md), [`/docs/AGENT_TEAMS.md`](./AGENT_TEAMS.md), [`/docs/EXTENSIONS.md`](./EXTENSIONS.md)
