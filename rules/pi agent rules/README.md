# Pi Coding Agent: Developer Rules & Guidelines

> **Production Status: ✅ ACTIVE | Version: 2.0 | Last Updated: 2025**
>
> This master documentation governs the Pi Coding Agent (`pi.dev`) extension ecosystem. The Pi agent relies on **three primary extension mechanisms** rather than built-in, monolithic features.
>
> ## 🎯 Core Mechanisms
>
> - **Extensions (`.ts`)**: Deep lifecycle integration
> - **Skills (`.md` + resources)**: Portability & progressive disclosure
> - **Prompt Templates (`.md`)**: Reusable prompt snippets with argument expansion
> - **Agents (`SYSTEM.md` + `AGENTS.md`)**: Multi-specialist personas
> - **Packages (`package.json`)**: Full Pi ecosystem packages
>
> All extensions, skills, prompts, agents, and packages must comply with the rules below. Non-compliance will result in **rejection during install**.

---

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Core Mechanisms](#core-mechanisms)
   - [Extensions (`.ts` Files)](#extensions-ts-files)
   - [Skills (SKILL.md + Resources)](#skills-skillmd-resources)
   - [Prompt Templates (`.md` Files)](#prompt-template-sem-md-files)
   - [Agents (SYSTEM.md + AGENTS.md)](#agents-systemmd-amp-agentsmd)
3. [Package Management](#package-management)
4. [Model Registry](#model-registry)
5. [Mode Behavior](#mode-behavior)
6. [Architecture & Filesystem](#architecture--filesystem)
7. [External Resources](#external-resources)
8. [Error Handling](#error-handling)
9. [Security Policy](#security-policy)
10. [Distribution & Sharing](#distribution--sharing)
11. [Quick Reference Matrix](#quick-reference-matrix)
12. [Priority & Compliance](#priority--compliance)
13. [Validation](#validation)

---

## 🚀 Getting Started

### Architecture Overview

The Pi Coding Agent uses a **modular, plug-in architecture** that prioritizes:

- ✅ **Auto-discovery** of extensions/skills via filesystem scanning
- ✅ **Progressive disclosure** to avoid prompt cache bloat
- ✅ **Type-safe TypeScript** for all extensions
- ✅ **Portable, version-bundled** skills for deployment
- ✅ **Clean separation** between deep integration and declarative knowledge

### Key Directories

| Location | Purpose |
|----------|---------|
| `~/.pi/agent/extensions/` | Global extension registry |
| `~/.pi/agent/skills/` | Global skills registry |
| `./pi/extensions/` | Local project extensions |
| `./pi/skills/` | Local project skills |
| `~/.pi/agent/agents/` | Agent persona storage |
| Prompt template dirs | Reusable prompt snippets |

### Quick Start

```bash
# 1. Initialize new extension
mkdir -p ~/.pi/agent/extensions/my-extension
cd ~/.pi/agent/extensions/my-extension
npm init -y

# 2. Initialize new skill
mkdir -p ~/my-custom-skill
cd ~/my-custom-skill
touch README.md SKILL.md

# 3. Install extensions
pi install -e ./my-extension

# 4. Install skills
pi install -s ~/my-custom-skill
```

---

## 🎯 Core Mechanisms

### Extensions (`.ts` Files)

See **extensions.md** for development rules.

### Skills (SKILL.md + Resources)

See **skills.md** and **SKILL.md Frontmatter Rules**.

### Prompt Templates (`.md` Files)

See **architecture.md** and **Prompt Templates** section.

### Agents (SYSTEM.md + AGENTS.md)

See **packages.md** Rule P1.10 for multi-agent packaging.

---

## 🔧 Extensions (`.ts` Files)

Extensions are **TypeScript modules** that hook directly into the agent's lifecycle. Used for **programmatic capabilities** requiring deep integration.

### When to Use Extensions

- ✅ Registering custom tools callable by the LLM (API fetchers, database connectors)
- ✅ Intercepting events (tool calls, session lifecycle)
- ✅ Adding custom slash commands (e.g., `/mycommand`)
- ✅ Modifying system prompt or context file behaviors
- ✅ Adding custom UI components (powerline footers, status bar elements)
- ✅ State management across conversation turns

### When NOT to Use Extensions

- ❌ Simple domain knowledge → Use **Skills** instead
- ❌ Static prompts → Use **Prompt Templates** instead
- ❌ One-off workflows → Use **Skills** with procedural knowledge

---

### Auto-Discovery & Path Rules

```
| Context              | Path                                    | Discovery Method            |
|---------------------|----------------------------------------|-----------------------------|
| Global Path         | ~/.pi/agent/extensions/                | Auto-discovers *.ts files   |
| Local Project Path  | <project>/.pi/extensions/              | Auto-discovers *.ts files   |
| Manual Loading      | (any)                                  | CLI: -e or --extension flag |
```

**File Matching Rules:**
- Pi auto-discovers all `*.ts` files in the extension root directory
- Pi auto-discovers `*/index.ts` files in subdirectories
- Manual loading via CLI: `pi install -e /path/to/extension`

---

### Development Rules (Extensions)

#### 1. Mandatory Export Function

Extensions **must** export a default function:

```typescript
// ✅ Valid
export default function init(api: ExtensionAPI) { ... }
```

#### 2. Tool Registration

```typescript
import { ExtensionAPI, pi } from 'pi-coding-agent';

export default async function init(api: ExtensionAPI) {
  pi.registerTool('my-tool', {
    name: 'my-tool',
    description: 'Custom API tool',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        context: { type: 'string' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'string' }
      }
    },
    execute: async (args) => {
      return { result: 'response' };
    }
  });
}
```

#### 3. Output Truncation (Required)

```typescript
const MAX_OUTPUT_SIZE = 4096; // 4KB limit
const truncated = truncateString(result, MAX_OUTPUT_SIZE);
```

#### 4. Cancellation Support (Required)

```typescript
try {
  return await api.withCancellation(async () => {
    // ... long operation
  });
} catch (e) {
  if (e.canceled) await cleanup();
  throw e;
}
```

**Extension Best Practices:**
- **Modularity**: One responsibility per extension
- **Fail-Safe**: Handle all errors with proper exit codes
- **Timeouts**: Add timeouts to prevent hanging
- **Memory-Aware**: Monitor for OOM before failing
- **Clean Exit**: Remove stale files when disabled
- **Environment-Aware**: Check `PI_` variables before action
- **Logging**: Log all actions with timestamps

---

## 📦 Skills (SKILL.md + Resources)

Skills are **portable, version-controlled folders** agents load on-demand via progressive disclosure.

### When to Use Skills

- ✅ Multi-step domain workflows (code review protocols, deployment pipelines)
- ✅ Bundling scripts, reference documents, or UI assets
- ✅ Providing procedural knowledge not in baseline training
- ✅ Applying company-specific schemas and templates

### When NOT to Use Skills

- ❌ Simple one-off tasks → Use **Extensions** instead
- ❌ Dynamic tool integration → Use **Extensions** instead
- ❌ Deep lifecycle hooks → Use **Extensions** instead

---

### Auto-Discovery & Path Rules

```
| Context              | Path                                    | Discovery Method            |
|---------------------|----------------------------------------|-----------------------------|
| Global Path         | ~/.pi/agent/skills/                    | Auto-discovers .md files    |
| Local Project Path  | <project>/.pi/skills/                  | Auto-discovers .md files    |
| SKILL.md Location   | <dir>/SKILL.md (recursive search)      | Recursive search            |
| Manual Loading      | (any)                                  | CLI flags                   |
```

---

### SKILL.md Frontmatter Rules (STRICT)

**Every SKILL.md must start with a YAML frontmatter block.**

| Field | Required | Rules |
|-------|--------|-------|
| `name` | ✅ Yes | 1-64 chars, lowercase alphanumeric + hyphens only |
| `description` | ✅ Yes | Max 1024 chars, include "when to use" instructions |
| `license` | ✅ Yes | MIT or license file reference |
| `compatibility` | ❌ No | Environment requirements (e.g., `node>=18`) |
| `metadata` | ❌ No | Arbitrary key-value pairs |

---

## 🎯 Prompt Templates (`.md` Files)

Reusable prompt snippets that allow for argument expansion.

### Argument Expansion Rules

| Syntax | Meaning |
|--------|---------|
| `$1, $2, ...` | Positional arguments |
| `$@` or `$ARGUMENTS` | All arguments joined together |
| `${@:N}` | All arguments starting from Nth position |
| `${@:N:L}` | Length L of arguments starting at position N |

### Example Template

```markdown
# Search for information on {subject}

$1. What information do you need about {subject}?
$2. What specific context or constraints should be considered?
$@ Additional context, if applicable.
```

---

## 📦 Package Management

See **packages.md** for complete package management rules.

**Key Rules:**

- **Rule P1.1**: Package manifest structure
- **Rule P1.2**: Package types (skill, prompt, theme, extension, agent)
- **Rule P1.3**: Installation source rules
- **Rule P1.4**: Local installation & symlinking
- **Rule P1.5**: Remote security & whitelisting
- **Rule P1.6**: Manifest vs. frontmatter routing
- **Rule P1.7**: Post-install hooks
- **Rule P1.8**: Dependency graph
- **Rule P1.9**: Removal & cleanup
- **Rule P1.10**: Multi-agent packaging
- **Rule P1.11**: Extension lifecycle activation
- **Rule P1.12**: Security policy & permission model **(Critical)**

---

## 📦 Model Registry

See **models.json.md** for model management and registry rules.

---

## 👤 Mode Behavior

See **modes.md** for agent behavior and mode handling rules.

---

## 🏗️ Architecture & Filesystem

See **architecture.md** for architecture and filesystem rules.

---

## 🌐 External Resources

See **external-links.md** for external resource handling.

---

## ⚠️ Error Handling

See **errors.md** for error handling and exit codes.

**Key Error Codes:**

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid arguments/configuration |
| 2 | Agent failure |
| 3 | File system error |
| 4 | Network error |
| 5 | Model unavailable |
| 6 | Permission denied |
| 7 | Schema validation failed |

---

## 🔒 Security Policy

**securitypolicy.md** defines the security protocols and permission models.

### Rule S1.1: Security Policy & Permission Model (P1.12)

**Priority: Critical**

### S1.1.1: Tool Permission Scoping (P1.12.1)

Extensions requesting sensitive operations must declare permissions in `package.json`:

| Permission | Risk Level |
|------------|-------------|------------|
| `filesystem` | **High** |
| `network` | **High** |
| `process` | **High** |
| `secrets` | **Critical** |
| `admin` | **Critical** |
| `sudo` | **Critical** |

### S1.1.2: Secret Management (P1.12.2)

Never hardcode API keys or credentials:

```bash
# ✅ Use process.env for dynamic secrets
const apiKey = process.env.OPENAI_API_KEY;
```

### S1.1.3: Sandbox Execution (P1.12.3)

Post-install hooks and tool execution are monitored:
- All scripts run in restricted shell
- Unauthorized access to `$XDG_CONFIG_HOME/pi` triggers session termination

### S1.1.4: Integrity Verification (P1.12.4)

Remote packages are checksum-verified:
- SHA-256 checksums required
- SECURE_BOOT mode for unsigned packages

---

## 🌐 Distribution & Sharing

The Pi ecosystem supports sharing extensions and skills via **npm** or **Git repositories**.

### Installation

```bash
# Install from npm
pi install npm:@your-name/your-extension-name

# Install local package
pi install -l /path/to/package

# Install with version constraint
pi install npm:@your-name/your-extension@>=1.0.0
```

---

## 📊 Quick Reference Matrix

| Topic | File Reference | Priority | Status |
|-------|----------------|----------|--------|
| **Architecture & Setup** | `architecture.md` | **Critical** | ✅ Compliant |
| **Model Registry** | `models.json.md` | High | ✅ Compliant |
| **Mode Rules** | `modes.md` | **Critical** | ✅ Compliant |
| **Package Management** | `packages.md` | High | ✅ Compliant |
| **Extension Development** | `extensions.md` | High | ✅ Compliant |
| **Skills** | `skills.md` | High | ✅ Compliant |
| **Prompt Templates** | `architecture.md` | Medium | ✅ Compliant |
| **Error Handling** | `errors.md` | **Critical** | ✅ Compliant |
| **Security Policy** | `securitypolicy.md` | **Critical** | ✅ **Added** |
| **External Links** | `external-links.md` | Medium | ✅ Compliant |
| **External Resources** | `external-links.md` | Low | ✅ Compliant |
| **Best Practices** | (inline) | Medium | ✅ Compliant |
| **Master Rules** | `master.md` | High | ✅ Compliant |
| **API Usage** | `api.md` | High | ❌ Coming Soon |
| **Multi-session Runtime** | `runtime.md` | Medium | ❌ Coming Soon |
| **RPC Integration** | `rpc.md` | Medium | ❌ Coming Soon |
| **Permissions & Security** | `permissions.md` | **Critical** | ❌ Coming Soon |
| **Platform Limitations** | `limitations.md` | **Critical** | ❌ Coming Soon |

---

## ⚠️ Priority & Compliance

### Priority Levels

- **Critical**: Must be followed without exception
- **High**: Should be followed; violations require justification
- **Medium**: Optional but recommended; best practice guidance
- **Low**: Nice-to-have; documentation recommendations

### Compliance Requirements

- **All Critical rules**: Must be followed
- **All High rules**: Required for production deployments
- **Medium/Low rules**: Recommended for maintainability

### Critical Rules List

1. **Rule M1.1**: Model constraints (model registry)
2. **Rule M1.2**: Mode handling
3. **Rule P1.1**: Package manifest structure
4. **Rule P1.2**: Package types
5. **Rule P1.3**: Installation source rules
6. **Rule P1.6**: Manifest vs. frontmatter routing
7. **Rule P1.11**: Extension lifecycle activation
8. **Rule S1.1.1**: Tool permission scoping
9. **Rule S1.1.2**: Secret management
10. **Rule S1.1.4**: Integrity verification

### High Priority Rules List

1. **Rule P1.4**: Local installation & symlinking
2. **Rule P1.5**: Remote security & whitelisting
3. **Rule P1.7**: Post-install hooks
4. **Rule P1.8**: Dependency graph
5. **Rule P1.9**: Removal & cleanup
16. **Rule P1.10**: Extension lifecycle
17. **Rule E1.1**: Error exit codes
18. **Rule E1.2**: Error message format
19. **Rule E1.3**: Validation error handling
20. **Rule E1.4**: Agent failure handling
21. **Rule E1.5**: File system error handling
22. **Rule E1.6**: Network error handling
23. **Rule E1.7**: Model unavailable error
24. **Rule E1.15**: Error logging rules
25. **Rule S1.1.3**: Sandbox execution
26. **Rule S1.1.4**: Integrity verification

### Medium/Low Priority Rules

- **Rule P1.7**: Post-install hooks
- **Rule P1.10**: Multi-agent packaging
- **Rule E1.8**: Permission denied
- **Rule E1.9**: Schema validation failure
- **Rule E1.10**: Timeout handling
- **Rule E1.13**: Graceful degradation

---

## ✔️ Validation

Run `quick_validate.py` periodically to ensure compliance:

```bash
# Validate a skill
pi validate skill:my-skill

# Validate an extension
pi validate extension:my-extension

# Validate entire registry
pi validate all
```

---

## 🔗 Official References

- **Pi Dev Docs**: https://www.pi.dev
- **Pi Coding Agent (npm)**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono

---

## 📝 File Summary

### Rule Documents (11 files)

These files define the **developer rules and guidelines** for the Pi Coding Agent:

1. **README.md** - This file (comprehensive index)
2. **architecture.md** - Architecture and filesystem rules
3. **modes.md** - Agent mode and behavior rules
4. **packages.md** - Package management rules
5. **extensions.md** - Extension development rules
6. **skills.md** - Skills development rules
7. **errors.md** - Error handling and exit codes
8. **securitypolicy.md** - Security protocols and permissions
9. **master.md** - Master document linking all files
10. **models.json.md** - Model registry rules
11. **external-links.md** - External resource handling
12. **summary.md** - Quick summary

---

### Documentation Files (1 file)

**PI_CODING_AGENT_GUIDE.md** - User guide and reference documentation:

- CLI commands and options
- Interactive mode interface
- Keyboard shortcuts
- Sessions management
- Settings and context files
- Examples and usage patterns
- Programmatic API usage
- Environment variables

> This guide complements the rules by providing usage examples, but **is not a rule file itself**. It documents user-facing features shown in `/help`.

---

**Need Help?**

1. Check this README first
2. Consult topic-specific guides before implementation
3. Review [limitations](limitations.md) before planning features
4. Follow [best practices](bestpractices.md) for maintainable code

---

**Last Updated**: 2025

**Total Rules**: 60+

**Compliance Required**: All critical/high-priority rules must be followed.
