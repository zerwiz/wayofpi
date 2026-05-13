# Pi Coding Agent (pi.dev) Developer Rules

## Overview

The **Pi Coding Agent (`pi.dev`)** is built for aggressive extensibility. Unlike systems that use static YAML configurations for agent personalities, Pi relies on **three core extension mechanisms** to build dynamic, context-aware agents:

1. **Extensions (TypeScript)**: Programmatic hooks, custom tools, and event listeners.
2. **Skills (Markdown)**: Domain-specific workflows, contextual knowledge, and procedural instructions.
3. **Prompt Templates**: Reusable prompt snippets with argument expansion.

This document outlines the official rules, directory structures, and implementation guidelines for developing within the pi.dev ecosystem.

---

## Directory Structure

Extensions and skills are automatically discovered in the following locations:

| Context | Path | Purpose |
|---------|------|---------|
| **Global Extensions** | `~/.pi/extensions/` | System-wide extension registry |
| **Local Workspace Extensions** | `./.pi/extensions/` | Project-specific extensions |
| **Global Skills** | `~/.pi/skills/` | System-wide skills registry |
| **Local Workspace Skills** | `./.pi/skills/` | Project-specific skills |
| **Global Prompt Templates** | `~/.pi/prompts/` | System-wide templates |
| **Local Workspace Templates** | `./.pi/prompts/` | Project-specific templates |

---

## 1. Extensions (`.ts` Files)

Extensions are **executable TypeScript modules** that integrate directly into the Pi agent's lifecycle. They provide deep integration capabilities that skills and prompt templates cannot.

### Development Rules

#### Entry Point Requirement
Extensions **must** export a default initialization function that accepts the `ExtensionAPI` object:

```typescript
import type { ExtensionAPI } from '@pi/sdk';

export default function activate(api: ExtensionAPI) {
  // Initialization logic
}
```

#### Tool Registration
Use `api.registerTool()` to add capabilities callable by the LLM. You **must** provide a valid JSON Schema for the tool's parameters:

```typescript
api.registerTool({
  name: 'fetch_internal_data',
  description: 'Fetches data from the internal corporate API.',
  schema: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        description: 'The API endpoint to query'
      }
    },
    required: ['endpoint']
  },
  execute: async (args, context) => {
    // Implementation logic here
    return { result: `Data from ${args.endpoint}` };
  }
});
```

#### Context Management (Required)
Tools **must** implement output truncation or pagination to avoid overwhelming the LLM's context window:

```typescript
const MAX_OUTPUT_SIZE = 4096; // 4KB limit

async function fetchWithTruncation(endpoint: string) {
  const result = await fetch(endpoint);
  const text = await result.text();
  
  // ✅ Truncate to prevent context window blowup
  const truncated = text.length > MAX_OUTPUT_SIZE 
    ? text.substring(0, MAX_OUTPUT_SIZE) + `\n\n... (truncated, full output available on request)`
    : text;
  
  return { result: truncated };
}
```

#### Event Hooks
Extensions can listen to agent events like:
- `onToolCall` - Called when a tool is invoked
- `onSessionStart` - Session initialization
- `onMessage` - New message received

#### Cancellation Support (Required)
Implement graceful cancellation handling:

```typescript
const cleanup = async () => {
  // Cleanup on cancellation
  await api.stop();
};

api.registerTool('long-operation', {
  execute: async (input) => {
    try {
      return await api.withCancellation(async () => {
        // ... long operation with timeout
        return { success: true };
      });
    } catch (e) {
      if (e.canceled) await cleanup();
      throw e;
    }
  }
});
```

---

## 2. Skills (`SKILL.md`)

Skills are **portable, version-controlled directories** that provide procedural knowledge to the agent via **progressive disclosure**. They do **not run arbitrary code** instead, they inject highly specific instructions into the LLM context only when needed.

### Directory Structure

| Context | Path |
|---------|------|
| **Global** | `~/.pi/skills/` |
| **Local Workspace** | `./.pi/skills/` |

A Skill is defined by a folder containing a `SKILL.md` file.

### SKILL.md Frontmatter Rules

**Every `SKILL.md` must begin with a YAML frontmatter block** containing metadata, followed by the Markdown instructions.

**Required Fields:**

| Field | Required | Rules |
|-------|----------|-----|
| `name` | ✅ Yes | 1-64 chars, lowercase alphanumeric + hyphens only (a-z0-9-). **Must exactly match** parent folder name |
| `description` | ✅ Yes | Max 1024 chars. **Crucial for Pi's routing engine** - must clearly state when the agent should load this skill |
| `version` | Optional | Semantic versioning (MAJOR.MINOR.PATCH) |
| `compatibility` | Optional | Environment requirements (e.g., `node>=18`) |
| `license` | Optional | License name (e.g., MIT) |
| `metadata` | Optional | Arbitrary key-value pairs |

**Strict Validation:**
- Failure to comply with frontmatter rules results in validation errors (e.g., during `quick_validate.py`)
- Name field must exactly match the parent folder name

### Example: SKILL.md

```yaml
---
name: react-component-generator
description: "Use this skill when asked to create a new React component with Tailwind CSS and custom hooks standards."
version: "1.2.0"
compatibility: "node>=18"
license: MIT
---

# React Component Standards

When generating a React component, you must:
1. Use functional components with `const` and hooks.
2. Use Tailwind CSS for all styling.
3. Place interfaces in a separate `types.ts` file if they exceed 10 lines.
4. Include error boundaries for production components.
5. Use TypeScript strict mode.

## Usage

Invoke this skill when requests involve:
- Creating new React components
- Refactoring legacy React code
- Adding animations or interactivity

## Files

- `scripts/cleanup.sh` - Cleanup utility
- `references/guidelines.md` - Style guide
- `templates/react-component.hbs` - React component template
```

### Validation Requirements

- **name**: Must be lowercase, alphanumeric with hyphens, and exactly match the parent folder name.
- **description**: Crucial for Pi's routing engine. It must clearly state when the agent should load this skill ("**when to use**").

### Example SKILL.md Structure

```
my-custom-skill/
├── SKILL.md       # ✅ Required: Frontmatter + LLM instructions
├── scripts/       # Optional: Executable bash/python/node scripts
├── references/    # Optional: Context documentation  
└── assets/        # Optional: Templates and other resources
```

---

## 3. Prompt Templates (`.md` Files)

Prompt templates allow you to define **standard queries with variable expansion**, saving time on repetitive tasks (like standardized code reviews or refactoring instructions).

### Discovery & Usage

**Stored in:**
- Global: `~/.pi/prompts/`
- Local: `./.pi/prompts/`

**Called via the Pi CLI:**
```bash
pi run --template code-review.md ./src/index.ts
```

### Argument Expansion

Use **bash-style variables** in your templates:

| Syntax | Meaning |
|--------|---------|
| `$1, $2` | Positional arguments passed via CLI |
| `$@` or `$ARGUMENTS` | All arguments joined together |
| `${@:N}` | All arguments starting from Nth position |
| `${@:N:L}` | Length L of arguments starting at position N |

### Example Template

```markdown
# Code Review for {target-file}

Please review the following code:

$1. What are the main issues or bugs?
$2. What improvements can be made?
$@ Any additional context or constraints.

Provide a structured review with:
1. Critical issues (must fix)
2. Warnings (should address)
3. Suggestions (nice to have)
```

---

## 4. Distribution and Installation

Extensions and Skills are distributed using **standard package managers** (npm or Git).

### Publishing

Package your Extensions and Skills as **standard NPM packages**:

```json
{
  "name": "@your-org/custom-pi-tools",
  "version": "1.0.0",
  "pi-type": ["extension"],
  "author": "your-name",
  "license": "MIT"
}
```

**Prefix the package name or use an organizational scope** (e.g., `@your-org/pi-aws-tools`).

### Installation

Users install your packages using the Pi CLI:

```bash
# Install an extension globally
pi install npm:@my-org/custom-pi-tools

# Install with version constraint
pi install npm:@my-org/custom-pi-tools@>=1.0.0

# Run pi with a specific local extension
pi run --extension ./my-local-ext.ts

# Install local package
pi install -l ../../tools

# Install from git
pi install git:https://github.com/user/repo
```

---

## Best Practices

### ✅ DO:

- **Build small, composable extensions** rather than monolithic plugins.
- **Provide clear, trigger-focused descriptions** in your SKILL.md frontmatter so Pi knows when to use them.
- **Handle API rate limits and errors gracefully** within your TypeScript extensions.
- **Use output truncation** for all tool responses (4KB limit recommended).
- **Version all changes** using semantic versioning.
- **Test locally before publishing** to npm.
- **Include comprehensive documentation** in SKILL.md and README files.

### ❌ DON'T:

- **Store secrets in SKILL.md** - Use environment variables read by `.ts` extensions.
- **Dump huge amounts of text** into tool return values (always truncate or summarize).
- **Rely on YAML to define complex runtime logic** - use TypeScript extensions instead.
- **Create overly broad/general skills** - keep them focused and composable.
- **Skip version control** for all agent changes.
- **Use deprecated tool versions**.

---

## Quick Reference

| Mechanism | File Type | Location | Auto-Discovery |
|------------|---------------|------|-------|
| Extensions | `*.ts` | `~/.pi/extensions/` | Yes (*, index.ts) |
| Skills | `SKILL.md` | `~/.pi/skills/` | Yes (recursive) |
| Prompt Templates | `*.md` | `~/.pi/prompts/` | Yes (non-recursive) |

---

## 🔗 Official References

- **Pi Dev Docs**: https://www.pi.dev
- **Pi Coding Agent (npm)**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono

---

## 📝 Version Info

- **Last Updated**: 2025
- **Version**: 1.0
- **Status**: Production Ready
