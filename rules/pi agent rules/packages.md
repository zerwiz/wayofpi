# Package Management Rules

## Rule P1.1: Package Manifest Structure
**Priority: Critical**

Every package must have `package.json`:
```json
{
  "name": "<package-name>",
  "version": ">=1.0.0",
  "pi-type": ["skill", "prompt", "theme", "extension"],
  "author": "<author>",
  "license": "MIT",
  "pi-config": {
    "type": "skill",
    "description": "Package description",
    "input_schema": { /* required for skills */ },
    "output_schema": { /* required for skills */ }
  }
}
```

## Rule P1.2: Package Types
**Priority: Critical**

Supported `pi-type` values:
- **`skill`**: CLI command/function extension
- **`prompt`**: Pre-built prompt templates
- **`theme`**: Visual styling configurations
- **`extension`**: Custom tool/integration
- **`agent`**: Sub-agent definitions (external only)

Invalid type: Reject install, warn user

## Rule P1.3: Installation Source Rules
**Priority: Critical**

Valid sources for `pi install`:
1. **npm registry**: `pi install npm:pkg`
2. **git repo**: `pi install git:<url>`
3. **local path**: `pi install -l <path>`
4. **url**: `pi install <url>`
5. **name only**: auto resolves npm

Invalid sources:
- Local files without `-l` flag
- Untrusted registry without whitelist
- Missing package.json

## Rule P1.4: Local Installation Requirement
**Priority: High**

For `pi install -l`:
- Path must be absolute or relative to workspace
- Must read package.json
- Validate schema before install
- Create symlink to registry
- No recursive install from local

## Rule P1.5: Remote Installation Sources
**Priority: High**

For `pi install npm:pkg`:
- Must verify registry signature
- Check version constraints
- Download to cache first
- Validate against schema
- Warn on untrusted registry

## Rule P1.6: Schema Validation Rules
**Priority: Critical**

For skill packages:
- `input_schema` required
- `output_schema` required
- Types: object, string, number, boolean, array
- Validate with JSON Schema (strict mode)
- Reject invalid schema on install

## Rule P1.7: Version Constraint Rules
**Priority: High**

For `>=version` format:
- Accept: `>=1.0.0`, `^1.2.3`, `~2.0.0`
- Reject: `<version>` (use `pi install` without constraints)
- Validate against registry versions
- Warn on pinned old versions

## Rule P1.8: Dependency Handling
**Priority: High**

Packages depend on:
- Other pi packages (via `dependencies` field)
- External npm packages (standard deps)
- Environment variables (PI_*)
- Workspaces (relative paths)

Install order:
1. External dependencies
2. Pi packages (by dep graph)
3. Configuration
4. Schema validation

## Rule P1.9: Removal Rules
**Priority: High**

`pi uninstall`:
- Validate package exists
- Remove registry symlink
- Remove installed files
- Update workspace tree
- Warn on shared packages

## Rule P1.10: Cache Management
**Priority: Medium**

Package cache locations:
- `$XDG_CACHE_HOME/pi/packages/<pkg>/`
- Cleanup on uninstall
- Max 10GB cache size
- Prune old versions

## Rule P1.11: Extension Activation
**Priority: High**

For extension packages:
- Load after all skills installed
- Initialize hooks
- Register with registry
- Enable/disable via CLI

## Rule P1.12: Prompt/Theme Package Rules
**Priority: Medium**

For prompt/theme:
- Store in prompt/themes/ folder
- No CLI invocation
- Apply at startup
- Version-locked

---

### Package Specification Template
```json
{
  "name": "my-awesome-skill",
  "version": ">=1.0.0",
  "pi-type": ["skill"],
  "author": "zerwiz",
  "license": "MIT",
  "pi-config": {
    "type": "skill",
    "description": "My awesome skill",
    "input_schema": {
      "type": "object",
      "properties": {
        "question": {
          "type": "string",
          "description": "The question"
        }
      },
      "required": ["question"]
    },
    "output_schema": {
      "type": "object",
      "properties": {
        "answer": {
          "type": "string",
          "description": "The answer"
        }
      },
      "required": ["answer"]
    }
  }
}
```

---

### Common Installation Patterns
```bash
# Install from npm
pi install npm:openai

# Install from git
pi install git:https://github.com/zerwiz/tools

# Install local package
pi install -l ../../tools

# Install with version constraint
pi install npm:@openai/python>=1.0.0

# Validate schema only
pi install --validate my-skill

# List installed packages
pi install --list
```

---

### Package Validation Checklist
- [ ] package.json exists
- [ ] pi-type is valid
- [ ] version constraint acceptable
- [ ] input_schema present (for skills)
- [ ] output_schema present (for skills)
- [ ] License specified
- [ ] Author specified
- [ ] No malicious dependencies
- [ ] External registry verified
