# 🔐 Security Policy Rules

> Security standards for all extensions, skills, and system components.
> **Location**: `.pi/rules/securitypolicy.md`
> **Last Updated**: 2025-04-23

---

## 🎯 Security Requirements

### **S1.1.1: Permission Scoping**

**Rule**: All extensions must declare required permissions in manifest.

**Manifest Format**:

```typescript
{
  "pi": {
    "s1.1.1": {
      "required-permissions": [
        "fs:readonly",
        "fs:readFile", 
        "fs:writeFile",
        "system:execute"
      ],
      "declared-path-access": {
        "read-only": [
          "/workspace/*",
          "node_modules/*",
          ".github/*"
        ],
        "write-allowed": [
          ".workspace/*",
          ".pi/extensions/*",
          ".pi/rules/*"
        ],
        "never-access": [
          "~/./*",
          "/etc/*", 
          "/usr/*",
          "*.pem",
          "*.key"
        ]
      }
    }
  }
}
```

**Validation**:
- ✅ Must declare ALL required permissions
- ✅ Must define path access categories
- ❌ Never declare access to protected paths

---

### **S1.1.2: Secret Management**

**Rule**: Never use hardcoded secrets or environment variables without sandbox.

**Forbidden**:

```typescript
// ❌ REJECTED: Hardcoded secrets
const apiKey = "sk_live_abc123";
const connectionString = "postgres://user:password@host:5432/db";

// ❌ REJECTED: Direct environment variable access
process.env.API_KEY;

// ❌ REJECTED: Writing secrets to files
fs.writeFileSync('.env', 'SECRET_KEY=my_secret');
```

**Approved**:

```typescript
// ✅ Approved: Use sandboxed config
const config = await loadConfig('/path/to/config', {
  sandbox: true,
  encrypt: true
});

// ✅ Approved: Use secure config
const secret = process.env.SECRET_KEY;
if (!secret) {
  throw new Error('Missing required secret');
}
```

**Environment File Protection**:

```typescript
// ✅ Approved: Config with no sensitive data
{
  "apiEndpoint": "https://api.service.com",
  "timeout": 30000
}
```

---

### **S1.1.3: Sandbox Execution**

**Rule**: All external operations must run in sandbox.

**Sandbox Requirements**:

```typescript
{
  "s1.1.3": {
    "execution-sandbox": true,
    "isolation-level": "process",
    "resource-limits": {
      "memory": "256MB",
      "cpu": "10%",
      "network": "500KBps"
    }
  }
}
```

**Implementation**:

```typescript
// ✅ Approved: Sandbox execution
export async function runSandboxOp(code: string): Promise<Result> {
  const sandbox = new Sandbox({
    permissions: ['read-file', 'write-file'],
    resourceLimits: {
      memory: 256 * 1024 * 1024,
      maxScriptDuration: 5000
    },
    pathAccess: {
      read: ['.workspace/*', 'node_modules/*'],
      write: ['.sandbox/*'],
      deny: ['~/*', '.git/*']
    }
  });
  return await sandbox.run(code);
}
```

---

## 🔒 Zero Access Paths

**Rule**: Never access these paths (see damage-control-rules.yaml)

**Environment Files**:
- `.env`, `.env.local`, `.env.*`
- `*.env`

**Credentials**:
- `~/.ssh/`
- `~/.gnupg/`
- `~/.aws/`
- `~/.azure/`
- `~/.kube/`
- `*.json` (service accounts)

**Keys**:
- `*.pem`, `*.key`, `*.p12`, `*.pfx`

**State Files**:
- `*.tfstate`, `*.tfstate.backup`

**Config Files**:
- `~/.docker/`, `~/.netrc`
- `~/.npmrc`, `~/.pypirc`

---

## 📝 Error Code Definitions (S1.2)

### **Secret Handling**

| Code | Description | Fix |
|------|-------------|-----|
| S1.2.1 | Hardcoded secret | Use config management |
| S1.2.2 | Missing secret validation | Validate all secrets |
| S1.2.3 | Secret in logs | Never log secrets |

### **Permission Errors**

| Code | Description | Fix |
|------|-------------|-----|
| S1.2.4 | Permission denied | Check manifest permissions |
| S1.2.5 | Path not in allowed list | Declare path or remove requirement |

### **Sandbox Errors**

| Code | Description | Fix |
|------|-------------|-----|
| S1.2.6 | Sandbox breach detected | Review permissions |
| S1.2.7 | Resource limit exceeded | Optimize execution |

---

## ✅ Security Checklist

For each deployment:

- [ ] Permissions declared (S1.1.1)
- [ ] No hardcoded secrets (S1.1.2)
- [ ] Sandbox execution enabled (S1.1.3)
- [ ] Error handling defined
- [ ] Protected paths never accessed
- [ ] Secrets never logged

---

Last Updated: 2025-04-23
