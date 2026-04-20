# Extension Development Guidelines

## Overview

Extensions are `pi-type: ["extension"]` packages that provide custom tools and integrations within the PI framework. They are distinct from skills (which have input/output schemas) and run in a special lifecycle after all skills are installed.

---

## Package Structure

### Required Fields (package.json)

```json
{
  "name": "<extension-name>",
  "version": ">=1.0.0",
  "pi-type": ["extension"],
  "author": "<author>",
  "license": "MIT",
  "pi-config": {
    "type": "extension",
    "description": "Description of extension functionality",
    "hooks": ["pre-start", "post-start"],
    "integrations": ["integration1", "integration2"],
    "environment": ["PI_*, <custom_vars>"]
  },
  "scripts": {
    "init": "initialize extension",
    "hooks": "register hooks",
    "clean": "cleanup resources"
  },
  "dependencies": {
    "external-package": "^1.0.0",
    "@internal/pack": ">=1.2.0"
  }
}
```

---

## Installation Location

Extensions are installed to:

```
/home/zerwiz/.pi/agent/rules/<extension-name>/
```

---

## Lifecycle & Activation

### Rule P1.11: Extension Activation

1. **Load After Skills**: Extensions are loaded after all skills are installed
2. **Initialize Hooks**: All registered hooks must be initialized
3. **Register with Registry**: Extension must register itself with the PI registry
4. **Enable/Disable**: Can be enabled or disabled via CLI

### Hook Registration

```json
// pi-config.hooks example
"hooks": {
  "pre-start": {
    "action": "validate_environment",
    "args": ["env-check"],
    "enabled": true
  },
  "post-start": {
    "action": "load_plugins",
    "args": ["plugin-list"]
  }
}
```

---

## Development Workflow

### Step 1: Create Directory

```bash
mkdir -p /home/zerwiz/.pi/agent/rules/<extension-name>
cd /home/zerwiz/.pi/agent/rules/<extension-name>
```

### Step 2: Initialize package.json

```bash
{
  "name": "tools-extension",
  "version": "1.0.0",
  "pi-type": ["extension"],
  "author": "zerwiz",
  "license": "MIT",
  "pi-config": {
    "type": "extension",
    "description": "Custom extension tools"
  }
}
```

### Step 3: Implement Scripts

```javascript
// scripts/init.js
const fs = require('fs');

function initialize() {
  // Load configuration
  const config = require('../config');
  
  // Setup hooks
  hooks.add('pre-start', () => {
    // Pre-start logic
  });
  
  hooks.add('post-start', () => {
    // Post-start logic
  });
  
  // Register with PI registry
  registry.register(config.name);
  
  return config;
}
```

### Step 4: Install Dependencies

```bash
# Install from npm
pi install npm:openai

# Install from git
pi install git:https://github.com/user/repo

# Install local package
pi install -l ../../tools

# Install with version constraints
pi install npm:@openai/python>=1.0.0
```

### Step 5: Validate Schema

```bash
pi install --validate <extension-name>
```

---

## Error Handling for Extensions

### Rule E1.1-E1.16 Apply: All errors must follow these rules

| Error Type | Return Code | Action Required |
|------------|-------------|-----------------|
| Invalid extension type | 1 | Correct `pi-type` array |
| Schema validation failed | 7 | Fix `package.json` fields |
| No `input_schema` | 7 | Add schemas for skills |
| Agent failed to start | 2 | Check dependencies and init |
| Module not found | 6 | Verify dependencies installed |
| Hook failed to execute | 2 | Review hook registration |

### Error Example Output

```json
{
  "code": {
    "error_code": "E1.11",
    "title": "Missing Schema Field"
  },
  "message": "extension 'tools-extension' is missing required field: input_schema",
  "detail": "Expected: { \"type\": \"object\", \"properties\": {...} }",
  "suggestion": "Add `input_schema` to package.json for validation"
}
```

---

## Extension Capabilities

### Allowed Functions

- **File system**: Read/write with permission checks
- **Network operations**: With timeout and retry limits
- **Memory management**: Monitor for OOM conditions
- **Agent hooks**: Pre-start and post-start events
- **Registry management**: Enable/disable extensions
- **Validation**: Schema verification before activation

### Forbidden Actions

- **Auto-recovery**: Do not auto-recover from crashes (Rule E1.14)
- **Silent failures**: All errors must be logged (Rule E1.15)
- **Model spawning without hooks**: Only after extension init
- **Bypassing validation**: Always return proper error codes

---

## Testing Extensions

### Pre-deployment Checklist

- [ ] `package.json` exists and is valid
- [ ] `pi-type` set to `["extension"]`
- [ ] Version constraint acceptable (>=1.0.0)
- [ ] License specified
- [ ] Author specified
- [ ] No malicious dependencies
- [ ] External registry verified
- [ ] All hooks registered
- [ ] Error handling implemented

### Test Commands

```bash
# Validate extension
pi install --validate <extension-name>

# Enable extension
pi install -e <extension-name>

# Check dependencies
pi install --list

# View logs
tail -f /home/zerwiz/.pi/logs/<extension-name>.log
```

---

## Logging Requirements

All extension activities must be logged with:

```
{
  "timestamp": <unix-timestamp>,
  "error_code": <code>,
  "stack_trace": <debug mode enabled>,
  "environment": {
    "PI_MODEL": "<model>",
    "PI_VERSION": "<version>"
  },
  "action": "<action>",
  "level": "debug|info|warn|error"
}
```

---

## Recovery Protocols

When extensions fail:

1. **Log the error**: Include timestamp and error code
2. **Trigger alert**: If critical (return code 2 or higher)
3. **Disable operation**: Stop the extension
4. **Suggest admin action**: Don't auto-recover
5. **Continue operation**: Allow other extensions to work

---

## Best Practices

1. **Modular Design**: Each extension should be self-contained
2. **Fail-safe**: Always handle errors with proper exit codes
3. **Timeout-aware**: Add timeouts to prevent hanging
4. **Memory-conscious**: Monitor for OOM before failing
5. **Clean on Exit**: Remove stale files when disabled
6. **Environment-aware**: Check PI_ variables before action

---

## Examples

### Example 1: File System Extension

```json
{
  "name": "file-tools",
  "version": "1.0.0",
  "pi-type": ["extension"],
  "author": "zerwiz",
  "license": "MIT",
  "pi-config": {
    "type": "extension",
    "description": "File system operations"
  }
}
```

### Example 2: Network Extension

```json
{
  "name": "network-api",
  "version": "1.0.0",
  "pi-type": ["extension"],
  "author": "zerwiz",
  "license": "Apache-2.0",
  "pi-config": {
    "type": "extension",
    "description": "External API integrations",
    "environment": ["HTTP_TIMEOUT=30"]
  }
}
```

---

## Versioning

Extensions must follow semantic versioning:

- **Major**: Incompatible with existing versions
- **Minor**: Functional additions
- **Patch**: Bug fixes

**Example:**

| Version | Notes |
|---------|-------|
| 1.0.0 | Initial release |
| 1.1.0 | Add API hooks |
| 1.1.1 | Fix file permissions |

---

## Final Notes

Extensions must:

- Follow all Package Management Rules (Rule P1.1-E1.13)
- Implement proper error handling (Rule E1.1-E1.16)
- Respect the agent lifecycle (Rule P1.11)
- Log all actions (Rule E1.15)
- Not auto-recover from crashes (Rule E1.14)

**Remember**: Extensions are powerful, so handle failures gracefully!