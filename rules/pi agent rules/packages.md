# Package Management Rules

**Priority Levels:**
- **Critical**: Must follow - System integrity
- **High**: Production required - Important functionality
- **Medium**: Recommended - Best practices
- **Low**: Optional - Nice to have

---

## Rule P1.1: Package Manifest Structure

**Priority: Critical**

Every package must contain a `package.json` file in the root directory. This manifest defines the package's identity and its integration points within the Pi ecosystem.

### Required Fields

```json
{
  "name": "<package-name>",
  "version": ">=1.0.0",
  "pi-type": ["skill", "prompt", "theme", "extension", "agent"],
  "author": "<author>",
  "license": "MIT",
  "pi-config": {
    "type": "<skill|prompt|theme|extension|agent>",
    "description": "Package description",
    "input_schema": { /* required for skills */ },
    "output_schema": { /* required for skills */ },
    "hooks": {
      "postinstall": "scripts/setup.sh"
    },
    "environment": ["PI_*, <custom_vars>"]
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Package identifier (kebab-case). Must match folder name for skills. |
| `version` | String | ✅ Yes | Semantic versioning with constraint (e.g., `>=1.0.0`). |
| `pi-type` | Array | ✅ Yes | One or more of: skill, prompt, theme, extension, agent. |
| `author` | String | ✅ Yes | Package author name. |
| `license` | String | ✅ Yes | License identifier (MIT, Apache-2.0, etc.). |
| `pi-config.type` | String | ✅ Yes | Primary package type from pi-type array. |
| `pi-config.description` | String | ✅ Yes | Human-readable description. |
| `pi-config.input_schema` | Object | Conditional | Required for skills (JSON Schema). |
| `pi-config.output_schema` | Object | Conditional | Required for skills (JSON Schema). |
| `pi-config.hooks` | Object | Optional | Post-install, pre-remove hooks. |
| `pi-config.environment` | Array | Optional | Environment variables to inject. |

---

## Rule P1.2: Package Types

**Priority: Critical**

The `pi-type` field must contain one or more of the following valid identifiers:

### Valid Types

| Type | Description | Location | Format Required |
|------|-------------|----------|-----------------|
| **skill** | A functional extension providing new logic via `SKILL.md` | `~/.pi/skills/` | `SKILL.md` frontmatter + folder |
| **prompt** | A collection of reusable prompt templates | `~/.pi/prompts/` | `.md` files with `$1`, `$2` variables |
| **theme** | Visual styling configurations | `~/.pi/themes/` | CSS/SASS files + config |
| **extension** | Programmatic hooks and tools via `.ts` files | `~/.pi/extensions/` | Default `activate(api)` function |
| **agent** | Specialized sub-agent definitions | `~/.pi/agents/` | `SYSTEM.md` + `AGENTS.md` |

### Type-Specific Requirements

| Type | Required File | Key Requirements |
|------|---------------|------------------|
| **skill** | `SKILL.md` | Name must match folder, description must include "when to use" |
| **prompt** | `.md` files | Reusable templates with `$1`, `$2`, `$@` variables |
| **theme** | CSS/SCSS | Visual styling for agent interface or skills |
| **extension** | `.ts` files | Default `activate(api)` with tool registration |
| **agent** | `SYSTEM.md` + `AGENTS.md` | Complete persona with sub-specialists |

---

## Rule P1.3: Installation Source Rules

**Priority: Critical**

Valid sources for `pi install`:

### ✅ Valid Sources

| Source | Command Format | Description |
|--------|----------------|-------------|
| **npm registry** | `pi install npm:package-name` | Install from npm registry |
| **git repository** | `pi install git:https://github.com/user/repo.git` | Install from GitHub/GitLab |
| **local path** | `pi install -l /path/to/pkg` | Install from local filesystem |
| **direct URL** | `pi install https://example.com/package.tar.gz` | Install from direct archive |
| **npm scope** | `pi install npm:@scope/package-name` | Install from scoped packages |
| **git branch** | `pi install git:repo.git#branch-name` | Install from specific branch |
| **git tag** | `pi install git:repo.git#v1.0.0` | Install from specific tag |

### ❌ Invalid Sources

- **Local paths without `-l`** - Must specify `-l` for local paths
- **Malformed manifests** - Missing `package.json` or valid `pi-type`
- **Untrusted URLs** - When `STRICT_MODE` is enabled
- **Private repos without authentication** - Requires credentials

### Example Install Patterns

```bash
# Install from npm
pi install npm:@pi-tools/builder

# Install from GitHub
pi install git:https://github.com/badlogic/pi-mono.git

# Install with branch
pi install git:https://github.com/user/pkg.git#main

# Install from local path
pi install -l /home/user/my-packages/foo

# Install from tarball
pi install https://example.com/package.tar.gz

# Install from git tag
pi install git:https://github.com/user/pkg.git#v1.2.3
```

---

## Rule P1.4: Local Installation & Symlinking

**Priority: High**

When using `-l` flag for local installation:

### Symlink Behavior

1. **A symlink is created** from the global registry to the source
2. **Changes in source directory are reflected immediately** (Hot Reloading)
3. **Validation is performed on live symlink** during every session boot

### Example Symlink Structure

```
~/.pi/skills/
├── <symlink-to>/home/user/my-packages/my-skill/
│   ├── SKILL.md
│   ├── package.json
│   └── scripts/
~/.pi/extensions/
├── <symlink-to>/home/user/my-packages/my-ext/
│   ├── index.ts
│   ├── package.json
│   └── tools/
```

### Benefits

- **Immediate updates**: Edit source files → restart Pi → changes active
- **No duplication**: Single source of truth
- **Easy development**: Work on packages directly in source directory

---

## Rule P1.5: Remote Security & Whitelisting

**Priority: High**

For remote installations:

### Security Measures

1. **Verify registry signatures** using GPG or npm verify commands
2. **Whitelisting**: Define whitelist in `config.json` to only allow specific git organizations or npm scopes
3. **Cache to `$XDG_CACHE_HOME/pi/packages/`** for offline reuse

### Whitelist Example

```json
{
  // ~/.config/pi/config.json
  "security": {
    "whitelist": {
      "git": ["badlogic", "pi-ai", "trusted-org"],
      "npm": ["@pi-ai", "@mariozechner", "trusted-scope"]
    }
  }
}
```

### Cache Directory

```
$XDG_CACHE_HOME/pi/packages/
├── npm/@pi-ai/
├── npm/@mariozechner/
├── git/badlogic/.git/
└── git/pi-ai/.git/
```

---

## Rule P1.6: Manifest vs. Frontmatter (Routing)

**Priority: Critical**

There is a strict hierarchy for LLM discovery:

### Discovery Priority Order

1. **Skill discovery**: Description in `SKILL.md` frontmatter (routing)
2. **Input validation**: `input_schema` in `package.json` (technical constraints)
3. **Name synchronization**: Name in `package.json` must match `SKILL.md` and parent folder

### Example: Consistency Check

```json
// package.json
{
  "name": "react-debugging-skill",  // ← JSON name
  "pi-config": {
    "type": "skill",
    "description": "React debugging skill",  // ← must match SKILL.md description
    "input_schema": {...}
  }
}

// SKILL.md (in same folder)
### React Debugging Skill
**when to use**: When you need to debug React issues...
```

### Inconsistency Examples

❌ **Inconsistent (Error)**:

```json
// package.json
{
  "name": "foo",
  "pi-config": {
    "description": "This is a bar skill"  // ← Different!
  }
}

// SKILL.md
### Foo Skill
**when to use**: For foo operations
```

✅ **Consistent (Correct)**:

```json
// package.json
{
  "name": "foo",
  "pi-config": {
    "description": "This is a foo skill"  // ← Matches!
  }
}

// SKILL.md
### Foo Skill
**when to use**: For foo operations
```

---

## Rule P1.7: Post-Install Hooks

**Priority: Medium**

### Hook Configuration

```json
{
  "pi-config": {
    "hooks": {
      "postinstall": "scripts/setup.sh",
      "preremove": "scripts/cleanup.sh",
      "onactivate": "scripts/init.sh"
    }
  }
}
```

### Sandbox Rules

1. **Scripts run in restricted shell environment**
2. **User must explicitly confirm** hook execution via `--allow-scripts`
3. **Used for**:
   - Compiling TypeScript extensions
   - Downloading model weights
   - Running setup scripts
   - Installing dependencies

### Example Hook Script

```bash
#!/bin/bash
# scripts/setup.sh after pi install

# Set up environment
export NODE_ENV=production

# Install runtime dependencies
npm install typescript --save-dev

# Compile TypeScript
npm run build

# Create symlinks if needed
ln -sf "$(realpath .)/scripts" ~/.pi/scripts/react-skill
```

### Consent Flow

```bash
pi install npm:@pi-tools/builder
# Output:
# Package @pi-tools/builder ready (postinstall script will run on first use)
# Running: npm install && npm run build
# Do you want to run postinstall scripts? [Y/n] y
# [Running postinstall script...]
# Done!
```

---

## Rule P1.8: Dependency Graph

**Priority: High**

Pi handles three levels of dependencies:

### Dependency Levels

| Level | Type | Examples | Notes |
|-------|------|----------|-------|
| **System** | Binaries | `git`, `python`, `node` | Check at install time |
| **NPM** | Node modules | `@types/*`, `openai`, `chalk` | Installed to `node_modules` |
| **Pi** | Other packages | `@pi-tools/*`, custom skills | Installed as Pi packages |

### Example Dependency Manifest

```json
{
  "name": "pi-react-debugger",
  "dependencies": {
    "typescript": "^5.0",
    "openai": "^4.5"
  },
  "pi-dependencies": [
    "@pi-tools/utils",
    "@pi-ai/common-skill"
  ],
  "system-dependencies": [
    "git >= 2.0",
    "node >= 18"
  ]
}
```

### Circular Dependency Protection

- **Detected during install**: Pi checks for circular dependencies
- **Error shown**: "Circular dependency detected, refusing install"
- **Resolution**: Reorganize packages to break cycles

---

## Rule P1.9: Removal & Cleanup

**Priority: High**

### Removal Process

**Command**: `pi uninstall <name>`

1. **Checks for dependent packages** before removal
   - Prevents breaking other packages
   - Shows list of dependents

2. **Deletes symlinks (local)**
   - Removes symlink from global registry
   - Leaves source intact

3. **Or directory contents (remote)**
   - Removes from npm/git registry
   - Cleans up cache files

4. **Offers to prune unused NPM dependencies**
   - Clean after uninstall
   - Optional flag `--prune`

### Example Removal

```bash
# Check dependents (no removal)
pi uninstall @pi-tools/builder
# Output:
# Would remove: @pi-tools/builder
# Dependent packages: pi-react-debugger, pi-web-app-builder
# Continue? [y/N] 

# Remove with confirm
pi uninstall @pi-tools/builder --confirm

# Remove and prune
pi uninstall @pi-tools/builder --prune
```

---

## Rule P1.10: Multi-Agent Packaging (agent type)

**Priority: Medium**

### Agent Package Requirements

Packages of type `agent` allow users to distribute fully-formed personas:

#### Must Include:
- **System file**: `SYSTEM.md`

#### May Include:
- **Agents file**: `AGENTS.md` to define sub-specialists
- **Theme directory**: `styles/` or `assets/` for UI customization
- **Prompt templates**: `prompts/` for default conversation patterns

### Installation Location

These are installed into `~/.pi/agents/` and registered as selectable personas in the CLI.

### Example Agent Package

```json
{
  "name": "enterprise-architect",
  "version": "1.0.0",
  "pi-type": ["agent"],
  "author": "enterprise-team",
  "license": "MIT",
  "pi-config": {
    "type": "agent",
    "description": "Enterprise system architect with database, api, and frontend specialists"
  }
}
```

### Agent Structure

```
~/my-packages/enterprise-architect/
├── package.json
├── SYSTEM.md           # Agent personality and rules
├── AGENTS.md           # Sub-specialists (optional)
├── prompts/            # Pre-built prompt templates
├── skills/             # Reusable skills for this agent
└── extensions/         # Custom tools
```

---

## Rule P1.11: Extension Lifecycle Activation

**Priority: High**

### Discovery Process

1. **Scan `extensions/` directories** for `.ts` files
2. **Check if `node_modules` are up to date** (if using npm packages)
3. **Call `activate(api)`** (from default export)
4. **Register tools** to LLM context

### Activation Example

```typescript
// index.ts
export default function activate(api: ExtensionAPI) {
  // Register custom tools
  api.registerTool({
    schema: { type: "object", properties: {...} },
    name: "executeCode",
    description: "Execute code in the current file context"
  });

  // Register event hooks
  api.subscribe('onSessionStart', () => console.log('Session started'));

  // Clean up on deactivation
  api.unsubscribe();
}
```

---

## Advanced Package Template

```json
{
  "name": "pi-github-manager",
  "version": "2.0.1",
  "pi-type": ["extension", "skill"],
  "author": "pi-ai-team",
  "license": "MIT",
  "pi-config": {
    "type": "extension",
    "description": "Full GitHub lifecycle management for CI/CD, PRs, issues",
    "hooks": {
      "postinstall": "npm install && npm run build",
      "preremove": "rm -rf ~/.pi/github-cached/*"
    },
    "input_schema": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["open-pr", "close-issue", "review"] },
        "repo": { "type": "string" },
        "branch": { "type": "string" }
      },
      "required": ["action"]
    },
    "output_schema": {
      "type": "object",
      "properties": {
        "success": "boolean",
        "message": "string",
        "git_operations": "string[]"
      }
    }
  }
}
```

---

## Installation Patterns

```bash
# Install with script execution allowed
pi install npm:@pi-tools/builder --allow-scripts

# Install specific version from a private git
pi install git:[https://github.com/my-org/private-tool.git#v1.0.4](https://github.com/my-org/private-tool.git#v1.0.4)

# Update all packages
pi install --update

# Force reinstall (clear cache)
pi install --force npm:@pi-tools/builder

# Install multiple packages
pi install npm:pkg1 npm:@scope/pkg2 -l /local/path
```

---

## Package Validation Checklist

### Development

- [ ] `package.json` present in root directory
- [ ] `pi-type` is a valid identifier
- [ ] `name` matches folder name (for skills)
- [ ] `SKILL.md` present and consistent (for skills)
- [ ] Post-install scripts are executable and verified (if present)
- [ ] Schema types match JSON Schema primitives
- [ ] No circular Pi-dependencies detected
- [ ] Environment variables documented (if custom)

### Production

- [ ] All required fields present
- [ ] License is valid and documented
- [ ] `input_schema` and `output_schema` are validated against JSON Schema
- [ ] Tests pass (if applicable)
- [ ] No console errors on install
- [ ] Permissions are set correctly (644 for files, 755 for scripts)

### Security

- [ ] No sensitive credentials in package manifest
- [ ] `.env` file used for secrets (not in manifest)
- [ ] Dependencies audited (if applicable)
- [ ] GPG signed commits (for remote installs)

---

## 🔗 References

- **Pi Dev**: https://www.pi.dev
- **Pi Coding Agent**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono

---

## 📝 Last Updated

2025
