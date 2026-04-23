# Security Guidelines for Pi Agents

## Overview

This agent follows all security rules from **securitypolicy.md**. Read this before deploying or modifying any agent.

---

## Rule P1.12.1: Tool Permission Scoping

### Sensitive Operations

Before declaring any permission in package.json, check:

| Permission | Risk | When to Declare |
|------------|------|-----------------|
| `filesystem` | High | Required for file access |
| `network` | High | Required for API calls |
| `process` | High | Required for command execution |
| `secrets` | Critical | Never hardcode - use process.env |
| `admin` | Critical | Never without explicit consent |
| `sudo` | Critical | Never without security team approval |

### Best Practice

Always declare **minimum permissions required**:

```json
{
  "permissions": {
    "filesystem": true,
    "network": true,
    "process": true
  }
}
```

**Never** include `admin`, `sudo`, `secrets` without critical justification.

---

## Rule P1.12.2: Secret Management

### Secure Practices

✅ **Always use**: `process.env.*` for secrets
```typescript
const apiKey = process.env.OPENAI_API_KEY;
```

❌ **Never**: Hardcode keys or credentials
```typescript
// ❌ BAD
const apiKey = "sk-ant-123456789";
```

### Environment Variables

Use these standard variables:

```bash
# API Keys
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export GITHUB_TOKEN=...

# Local secrets
export PI_SECRET_KEY=...
```

**Location**: `~/.pi/config/.env` (not committed to git)

---

## Rule P1.12.3: Sandbox Execution

### Post-Install Hooks

All scripts run in:
- Restricted shell
- Chrooted environment
- Resource-limited sandbox

**Unauthorized access** to `$XDG_CONFIG_HOME/pi` triggers session termination.

---

## Rule P1.12.4: Integrity Verification

### Package Security

For remote packages:
- SHA-256 checksums **required**
- SECURE_BOOT mode for unsigned packages
- Verify before install

---

## Common Vulnerabilities to Avoid

### CVE-001: Hardcoded Secrets

**Vulnerability**: API keys in source code
**Risk**: Critical
**Fix**: Always use `process.env.*`

### CVE-002: Unsafe File Access

**Vulnerability**: Reading from arbitrary filesystem paths
**Risk**: High
**Fix**: Use path scanning and whitelist

### CVE-003: Command Injection

**Vulnerability**: User input to `bash()` tool
**Risk**: High
**Fix**: Sanitize all inputs before command execution

### CVE-004: Permission Bypass

**Vulnerability**: Missing permission declarations
**Risk**: High
**Fix**: Always declare sensitive operation permissions

### CVE-005: Network Abuse

**Vulnerability**: Network access without declaration
**Risk**: High
**Fix**: Declare network permission before use

---

## Security Checklist

Pre-deployment checklist:

- [ ] No hardcoded secrets
- [ ] All permissions declared
- [ ] Filesystem access whitelisted
- [ ] Network requests authenticated
- [ ] Exit codes properly used (0-7)
- [ ] Error messages to stderr
- [ ] Sandbox isolation enabled
- [ ] Chksum verified for remote packages
- [ ] No admin/sudo without approval
- [ ] Follows securitypolicy.md

---

## Reporting Security Issues

Found a security issue?

1. **Close the terminal**
2. **Save current state**
3. **Report immediately**
4. **Do not continue use**

---

**Security Priority**: Critical

**Last Updated**: 2025-06-15
