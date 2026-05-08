# Skills Catalog

> Complete skills guide for Way of Pi agent discovery, progressive disclosure, and skill authoring.

---

## 🎯 Skills Overview

**Purpose**: Skills enable agents to discover, execute, and manage tools.

**Location**: `.pi/skills/`

**Discovery**: Via `/skill:name` command or `settings.json` configuration.

**Progressive Disclosure**: Skills revealed only when needed.

**Skills Command**: `/skill <name>`

---

## 📂 Skill Structure

Each skill directory contains:

```
.pi/skills/<skill>/
├── SKILL.md          # Skill definition and usage
├── skill.ts          # Skill implementation
└── [other files]     # Optional supporting files
```

---

## 🧰 Skills Catalog

### 1. Bowser Skill

**Location**: `.pi/skills/bowser/`  
**File**: `.pi/skills/bowser/SKILL.md`  
**Purpose**: Headless browser automation for web scraping, testing, automation  
**Commands**:

- `/bowser` — Initialize bowser
- `/bowser-scan` — Scan page
- `/bowser-crawl` — Crawl site
- `/bowser-fetch` — Fetch URL

---

### 2. Context Loader Skill

**Location**: `.pi/skills/context-loader/`  
**File**: `.pi/skills/context-loader/SKILL.md`  
**Purpose**: Load context hints for agent sessions  
**Commands**:

- `/context-load` — Load context
- `/context-save` — Save context
- `/context-clear` — Clear context

---

### 3. Find Skills Utility

**Location**: `.pi/skills/find-skills/`  
**File**: `.pi/skills/find-skills/SKILL.md`  
**Purpose**: Discover available skills  
**Commands**:

- `/skills list` — List all skills
- `/skills info <skill>` — Get skill info
- `/skills add <skill>` — Add skill package

---

### 4. GitHub Skill

**Location**: `.pi/skills/github/`  
**File**: `.pi/skills/github/SKILL.md`  
**Purpose**: GitHub repository management  
**Commands**:

- `/github status` — Current branch/status
- `/github commit message` — Commit message helper
- `/github diff` — Show diff
- `/github pull-request` — Create PR
- `/github issue list` — List issues
- `/github issue create` — Create issue
- `/github search <query>` — Search repos

---

### 5. Indexer Skill

**Location**: `.pi/skills/indexer/`  
**File**: `.pi/skills/indexer/SKILL.md`  
**Purpose**: File indexing for knowledge base  
**Commands**:

- `/index scan` — Scan files
- `/index update` — Update index
- `/index forget <pattern>` — Forget files matching pattern

---

### 6. Ralph Wiggum Skill

**Location**: `.pi/skills/ralph/`  
**File**: `.pi/skills/ralph/SKILL.md`  
**Purpose**: Ralph Wiggum ticket management  
**Commands**:

- `/ralph ticket add` — Add ticket
- `/ralph ticket list` — List tickets
- `/ralph ticket complete` — Complete ticket
- `/ralph todo list` — List todos
- `/ralph todo add` — Add todo
- `/ralph todo complete` — Complete todo

---

### 7. Rules Lookup Skill

**Location**: `.pi/skills/rules-lookup/`  
**File**: `.pi/skills/rules-lookup/SKILL.md`  
**Purpose**: Look up agent rules and conventions  
**Commands**:

- `/rules get` — Get rules
- `/rules list` — List rules
- `/rules validate` — Validate against rules
- `/rules format` — Format output

---

### 8. Tools Skill

**Location**: `.pi/skills/tools/`  
**File**: `.pi/skills/tools/SKILL.md`  
**Purpose**: Built-in tools management  
**Commands**:

- `/tools list` — List available tools
- `/tools info <tool>` — Get tool info
- `/tools enable <tool>` — Enable tool
- `/tools disable <tool>` — Disable tool

---

## 🧠 Skill Discovery

### Method 1: Direct Command

```
/skill <name>
```

**Example**:

```
/skill github
/skill indexer
```

---

### Method 2: Settings Configuration

**File**: `.pi/settings.json`

```json
{
  "extensions": [
    "/skill:built-in",
    "/skill:bushwhacker",
    "/skill:find-skills",
    "/skill:github",
    "/skill:indexer",
    "/skill:ralph",
    "/skill:rules-lookup",
    "/skill:tools"
  ],
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

## 📝 Skill Authoring

### Step 1: Create Skill Directory

```bash
mkdir -p .pi/skills/<skill-name>
```

---

### Step 2: Create SKILL.md

**Location**: `.pi/skills/<skill-name>/SKILL.md`

**Purpose**: Define skill behavior and usage

**Example**:

```markdown
# Skill Name

> Description of what this skill does.

## Commands

- `/command <args>` — Description
```

---

### Step 3: Implement Skill

**File**: `.pi/skills/<skill-name>/skill.ts`

**Purpose**: Actual skill implementation

**Example**:

```typescript
// .pi/skills/my-skill/skill.ts
export type Skill = {
  name: 'my-skill';
  description: 'My skill description';
  commands: {
    help: {
      signature: 'my-skill help';
      description: 'Show help';
      process: async ({ prompt, config, state }) => {
        // Implementation
      };
    };
  };
};
```

---

## 🛡️ Skill Safety

### Damage Control

All skills must include damage control:

```yaml
packages:
  - damage-control.ts
```

**Checks**:

- File system safety
- Command validation
- Tool allowlists
- Error handling

---

## 🔗 Skill Integration

### Session Memory

**Integration**: Skills can read/write session memory

**File**: `extensions/session-memory.ts`

---

### Chronicle

**Integration**: Skill actions logged to ledger

**File**: `.pi/extensions/chronicle.ts`

---

### Extension Picker

**Integration**: Skills available via `/extensions`

**Command**: `/extensions`

---

## 🎯 Skill Use Cases

### Example 1: GitHub Integration

```
/skill github
/github commit message
/github issue list
/github search my-project
```

---

### Example 2: Context Loading

```
/skill context-loader
/context-load my-context.md
```

---

### Example 3: Tool Management

```
/skill tools
/tools list
/tools enable <tool>
```

---

## 🧪 Skill Testing

Test skills in isolation:

```bash
# Test skill manually
.just ext-skill-<name>

# Or use just directly
just ext-skill-<name>
```

---

## 📋 Skill Reference

| Skill            | Commands                           |
| ---------------- | ---------------------------------- |
| `bowser`         | `/bowser`, `/bowser-scan`          |
| `context-loader` | `/context-load`, `/context-save`   |
| `find-skills`    | `/skills list`, `/skills info`     |
| `github`         | `/github status`, `/github commit` |
| `indexer`        | `/index scan`, `/index update`     |
| `ralph`          | `/ralph ticket`, `/ralph todo`     |
| `rules-lookup`   | `/rules get`, `/rules list`        |
| `tools`          | `/tools list`, `/tools enable`     |

---

**See also**: [`/docs/AGENTS.md`](./AGENTS.md), [`/docs/TOOLS.md`](./TOOLS.md), [`/docs/EXTENSIONS.md`](./EXTENSIONS.md)
