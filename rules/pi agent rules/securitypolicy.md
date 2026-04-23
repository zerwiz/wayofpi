# Security Policy (securitypolicy.md)

## Overview

**securitypolicy.md** defines the **security protocols and permission models** for the Pi Coding Agent ecosystem. All packages (extensions, skills, packages) must adhere to these security rules to protect host systems and user data.

---

## Rule S1.1: Security Policy & Permission Model (P1.12)

**Priority: Critical**

To protect the host system, all packages must adhere to the following security protocols:

### S1.1.1: Tool Permission Scoping (**P1.12.1**)

Extensions requesting sensitive operations must declare permissions in `package.json`:

**Permitted Permission Types:**

| Permission | Description | Risk Level |
|------------|-------------|------------|
| `filesystem` | Access to files outside the workspace | **High** |
| `network` | Ability to make outbound API calls | **High** |
| `process` | Ability to spawn child processes | **High** |
| `secrets` | Access to environment variables/secrets | **Critical** |
| `admin` | System administration commands | **Critical** |
| `sudo` | Elevation privileges | **Critical** |

```json
{
  "name": "pi-github-manager",
  "version": "2.0.1",
  "pi-type": ["extension", "skill"],
  "author": "pi-ai-team",
  "license": "MIT",
  "pi-config": {
    "description": "Full GitHub lifecycle management",
    "permissions": ["network", "filesystem"],  // ✅ Must declare
    "hooks": {
      "postinstall": "npm install && npm run build"
    },
    "input_schema": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["open-pr", "close-issue"] }
      }
    }
  }
}
```

**Failure to declare permissions** triggers:
- Return code 6 (Permission denied)
- Immediate rejection during `pi install`

---

### S1.1.2: Secret Management (**P1.12.2**)

Never hardcode API keys or credentials in any package file:

**Prohibited:**
```bash
# ❌ NEVER do this:
const apiKey = "sk-proj-12345...";  // Hardcoded secrets

export default function init(api) {
  // API key exposed!
  api.fetch("https://api.openai.com/v1/...", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
}
```

**Required:**
```bash
# ✅ Use process.env for dynamic secrets
const apiKey = process.env.OPENAI_API_KEY;  // Environment variable

// Or reference ~/.config/pi/.env for local configuration
```

**Security Checklist:**
- [ ] All secrets use `process.env`
- [ ] Default values are never hardcoded
- [ ] No secrets in `package.json` or `config.json`
- [ ] `.piignore` includes `.env` and `*.key` files

---

### S1.1.3: Sandbox Execution (**P1.12.3**)

Post-install hooks and tool execution are monitored by the Pi supervisor:

**Monitoring Rules:**

1. **Supervisor Oversight**: All postinstall scripts run in restricted shell environment
2. **Path Restrictions**: Unauthorized attempts to access `$XDG_CONFIG_HOME/pi` or other sensitive system directories trigger immediate session termination
3. **Command Sandboxing**: All command output is verified for security implications
4. **Timeout Enforcement**: Scripts timeout after 60 seconds (configurable via `PI_HOOK_TIMEOUT`)

**Sandbox Rules:**

```bash
# Restricted environment variables
export PATH="/usr/bin:/bin"
export SHELL="/bin/sh"

# Sandboxed directories
$XDG_CACHE_HOME/pi/packages/
$HOME/.pi/agent/
/workspace/
```

**Unauthorized Access Triggers:**
- Path: `~/.config/pi/.env`
- Path: `$XDG_CONFIG_HOME/pi/`
- Path: `~/.ssh/`
- Path: `/etc/shadow`

**Action**: Immediate session termination + Return code 2 (Agent failure)

---

### S1.1.4: Integrity Verification (**P1.12.4**)

Remote packages from git or npm are checksum-verified against the manifest:

**Verification Rules:**

1. **SHA-256 Checksums**: All remote packages must include checksums
2. **Manifest Signatures**: Packages must be signed by trusted developer keys
3. **SECURE_BOOT Mode**: Users can enable `SECURE_BOOT` in `config.json` to reject unsigned packages

**Example Manifest with Checksums:**

```json
{
  "name": "pi-secure-extension",
  "version": "1.0.0",
  "pi-type": ["extension"],
  "checksums": {
    "sha256": "abc123def456...",
    "gpg": "pubkey-id"
  },
  "authorized-by": "pi-security-team"
}
```

**SECURE_BOOT Configuration:**

```bash
# config.json
{
  "SECURE_BOOT": true,  // Reject unsigned packages
  "trusted-keys": [
    "pi-security-team.pub",
    "organization-123.pub"
  ]
}
```

---

## Rule S2.1: Package Manifest Requirements (P1.1)

**Priority: Critical**

Every package must contain a `package.json` file in the root directory:

```json
{
  "name": "<package-name>",
  "version": ">=1.0.0",
  "pi-type": ["skill", "prompt", "theme", "extension", "agent"],
  "author": "<author>",
  "license": "MIT",
  "pi-config": {
    "type": "skill",
    "description": "Package description",
    "input_schema": { /* required for skills */ },
    "output_schema": { /* required for skills */ },
    "hooks": {
      "postinstall": "scripts/setup.sh"
    }
  }
}
```

**Required Fields:**
- `name`: Unique package identifier
- `version`: Semantic versioning (MAJOR.MINOR.PATCH)
- `pi-type`: Valid Pi package type identifier
- `pi-config`: Type-specific configuration
- `author`: Package author (for attribution)
- `license`: MIT (required)

**Optional Fields:**
- `checksums`: Verification checksums
- `authorized-by`: Trusted developer signature

---

## Rule S2.2: Package Types (P1.2)

**Priority: Critical**

The `pi-type` field must contain one or more of the following valid identifiers:

| Type | Description | Security Level |
|------|-------------|----------------|
| `skill` | Functional extension providing new logic via SKILL.md | Low (declarative) |
| `prompt` | Collection of reusable prompt templates | Low (static) |
| `theme` | Visual styling configurations | Low (cosmetic) |
| `extension` | Programmatic hooks and tools via `.ts` files | **High** (runtime code) |
| `agent` | Specialized sub-agent definitions | **Critical** (multi-agent) |

**Extension Security:**
- All extensions must export default function
- All tools must have input/output schemas
- All tools must support cancellation
- All tools must implement output truncation

**Agent Security:**
- All agents must include `SYSTEM.md`
- Agents may include `AGENTS.md` for sub-specialists
- Agents run in isolated sandbox environments

---

## Rule S2.3: Installation Source Rules (P1.3)

**Priority: Critical**

Valid sources for `pi install`:

| Source | Command | Validation |
|--------|---------|------------|
| npm registry | `pi install npm:package-name` | Signature verification |
| git repository | `pi install git:https://github.com/user/repo.git` | Checksum verification |
| local path | `pi install -l /path/to/pkg` | Symlink validation |
| direct URL | `pi install https://example.com/package.tar.gz` | URL whitelist required |

**Invalid Sources:**
- Local paths without `-l` flag
- Malformed manifests
- Untrusted URLs when `STRICT_MODE` is enabled

---

## Rule S2.4: Local Installation & Symlinking (P1.4)

**Priority: High**

When using `-l`:

```bash
pi install -l /path/to/pkg
```

**Symlink Rules:**

1. **Symlink Creation**: Creates symlink from global registry to source
2. **Hot Reloading**: Changes in source directory are reflected immediately
3. **Validation**: Validation performed on live symlink during every session boot
4. **Atomic Updates**: Symlinks updated atomically (no stale references)

---

## Rule S2.5: Remote Security & Whitelisting (P1.5)

**Priority: High**

For remote installations:

1. **Signature Verification**: Verify registry signatures before install
2. **Whitelisting**: Users can define whitelist in `config.json` to allow specific git organizations or npm scopes
3. **Cache Directory**: Cache to `$XDG_CACHE_HOME/pi/packages/`

**Example Whitelist Configuration:**

```bash
# config.json
{
  "whitelist": {
    "git": ["github.com/pi-tools/*"],
    "npm": ["@pi-tools/*", "@organization/*"]
  }
}
```

---

## Rule S2.6: Manifest vs. Frontmatter (P1.6)

**Priority: Critical**

Strict hierarchy for LLM discovery:

1. **Routing**: LLM discovers skills primarily via description in `SKILL.md` frontmatter
2. **Validation**: `input_schema` in `package.json` provides technical constraints for tool execution
3. **Synchronization**: Name in `package.json` must match name in `SKILL.md` and parent folder name

---

## Rule S2.7: Post-Install Hooks (P1.7)

**Priority: Medium**

Packages can define a postinstall script in `pi-config.hooks`:

```json
{
  "pi-config": {
    "hooks": {
      "postinstall": "npm install && npm run build"
    }
  }
}
```

**Sandbox Execution:**
- These scripts run in restricted shell environment
- Timeout after 60 seconds (configurable via `PI_HOOK_TIMEOUT`)
- User must explicitly confirm via `--allow-scripts` flag

**Example:**
```bash
# User command
pi install npm:@pi-tools/builder --allow-scripts

# Output shows postinstall execution confirmation
```

---

## Rule S2.8: Dependency Graph (P1.8)

**Priority: High**

Pi handles three levels of dependencies:

| Level | Description | Examples |
|-------|-------------|----------|
| System | Binaries required | `git`, `python` |
| NPM | Node modules required | `@babel/*`, `typescript` |
| Pi | Other Pi skills/extensions required | `pi-github-manager` |

**Circular Dependency Detection:**
- All dependency graphs are validated for circular references
- Circular dependencies reject with code 7 (Schema validation failed)

---

## Rule S2.9: Removal & Cleanup (P1.9)

**Priority: High**

`pi uninstall <name>`. Actions:

1. **Dependency Check**: Checks for dependent packages before removal
2. **Symlink Deletion**: Deletes symlinks (local) or directory contents (remote)
3. **Prune Unused**: Offers to prune unused NPM dependencies

**Cleanup Sequence:**
```
1. Validate no dependents
2. Delete symlinks
3. Remove from registry
4. Offer to prune unused NPM
```

---

## Rule S2.10: Multi-Agent Packaging (P1.10)

**Priority: Medium**

Packages of type `agent` allow users to distribute fully-formed personas:

1. **SYSTEM.md Required**: Must include `SYSTEM.md` with system prompt and capabilities
2. **AGENTS.md Optional**: May include `AGENTS.md` to define sub-specialists
3. **Install Path**: Installed into `~/.pi/agents/`
4. **Registration**: Registered as selectable personas in CLI

**Example Agent Package:**

```json
{
  "name": "pi-data-science-agent",
  "version": "1.0.0",
  "pi-type": ["agent"],
  "pi-config": {
    "description": "Data science specialized agent",
    "agents": [
      {
        "name": "data-analyst",
        "skills": ["pandas", "numpy", "matplotlib"]
      },
      {
        "name": "ml-scientist",
        "skills": ["scikit-learn", "tensorflow"]
      }
    ]
  }
}
```

---

## Rule S2.11: Extension Lifecycle Activation (P1.11)

**Priority: High**

Extension activation sequence:

1. **Discovery**: Scan `extensions/` directories
2. **NPM Check**: Verify if `node_modules` are up to date
3. **Activation**: Call `export default activate(api)`
4. **Registration**: Tools are added to active LLM context

**Lifecycle Hooks:**
- `preActivate`: Validate dependencies
- `activate`: Register tools, set up event listeners
- `deactivate`: Cleanup, cancel operations
- `postDeactivate`: Final cleanup

---

## Installation Patterns

### Pattern P4.1: Install with Script Execution

```bash
# Install with script execution allowed
pi install npm:@pi-tools/builder --allow-scripts

# Validate checksums
pi install npm:@pi-tools/builder --check-checksums

# Enable secure boot
pi install git:https://github.com/my-org/private-tool.git --secure-boot
```

### Pattern P4.2: Install Specific Version from Private Git

```bash
pi install git:https://github.com/my-org/private-tool.git#v1.0.4
```

### Pattern P4.3: Update All Packages

```bash
pi install --update
# Updates all packages, respects whitelists and checksums
```

---

## Security Policy & Permission Model (Complete)

### P1.12: Security Policy Summary

To protect the host system, all packages must adhere to the following security protocols:

| Protocol | Description | Enforcement |
|----------|-------------|--------------|
| **P1.12.1** | Tool Permission Scoping | ❌ Reject if not declared |
| **P1.12.2** | Secret Management | ⚠️ Warn on hardcoding |
| **P1.12.3** | Sandbox Execution | ✅ Always enforced |
| **P1.12.4** | Integrity Verification | ⚠️ Warn if unsigned |

**Enforcement Mechanisms:**

1. **Pre-Install Validation**: All rules enforced before package install
2. **Runtime Monitoring**: Supervisor monitors package execution
3. **Post-Install Verification**: Checksum verification after install
4. **Session Termination**: Unauthorized actions trigger immediate termination

---

## Package Validation Checklist

Use `pi validate <package>` or check manually:

- [ ] `package.json` present
- [ ] `pi-type` is a valid identifier
- [ ] Permissions explicitly declared (if sensitive operations)
- [ ] Postinstall scripts are verified (if present)
- [ ] Schema types match JSON Schema primitives
- [ ] No circular Pi-dependencies detected
- [ ] All secrets managed via environment variables
- [ ] Checksums verified (for remote packages)
- [ ] Package is in whitelist (if whitelisting enabled)

---

## Error Codes for Security Violations

| Code | Description | Trigger |
|------|-------------|---------|
| 1 | Invalid arguments/configuration | Malformed manifest |
| 5 | Model unavailable | Model not in registry |
| 6 | Permission denied | Missing/unauthorized permissions |
| 7 | Schema validation failed | Invalid schema types |
| 2 | Agent failure | Unauthorized system access attempt |

---

## Security Best Practices

### B5.1: Never Commit Secrets

```bash
# .piignore
.env
*.key
*.pem
~/.pi/agent/keys.json
~/.pi/agent/keys.json.enc
```

### B5.2: Use Environment Variables

```bash
# .env file (not in git)
OPENAI_API_KEY=sk-proj-...
GITHUB_TOKEN=${GITHUB_TOKEN}
```

### B5.3: Rotate Keys Monthly

Set calendar reminder to rotate all API keys and credentials.

### B5.4: Audit Access

Review who has access to keys:
```bash
# List all packages with permissions
pi list --permissions

# Check for sensitive operations
pi audit --type=sensitive
```

---

## References

- **Pi Dev Security Docs**: https://www.pi.dev/security
- **Pi Coding Agent (npm)**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub Security**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono

---

## Last Updated

2025

**Compliance Required**: All critical/high-priority rules must be followed for production deployments.

**Priority Summary:**
- **Critical** (6 rules): S1.1.1, S1.1.2, S1.2, S1.3, S2.1, S2.3
- **High** (7 rules): S1.1.1, S1.4, S1.5, S1.8, S2.2, S2.3, S2.4
- **Medium** (2 rules): S1.7, S2.10

---

**End of Security Policy Document**
