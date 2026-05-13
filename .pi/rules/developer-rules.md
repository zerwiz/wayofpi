# 📜 Pi Developer Rules

> Essential rules for building safe extensions, skills, and system modifications.
> **Location**: `.pi/rules/developer-rules.md`
> **Priority**: Critical - Must be followed

---

## 📋 Rule Categories

| Category | Description | Files |
|----------|-------------|-------|
| **Validation** | Asset and package validation | `validation.md` |
| **Security** | Permission and secret management | `securitypolicy.md` |
| **Architecture** | Type safety and declarations | `architecture.md` |
| **Permissions** | Sandbox and capability rules | `permissions.md` |
| **Error Codes** | Error handling standards | `errors.md` |
| **Safety** | System protection rules | `safety.md` |

---

## 🛑 Critical Rules (Must Follow)

### **CRITICAL-1: Validation Required**

**Rule**: All assets must pass validation before execution.

**Checks**:
1. Package manifest format (P1.1, P1.5)
2. TypeScript declarations (M1.1)
3. Permission declaration (S1.1.1)
4. No hardcoded secrets (S1.1.2)
5. Sandbox execution (S1.1.3)
6. Error codes (E1.1-E1.15)

**Implementation**:

```typescript
// ✅ VALID: Proper package with manifest
{
  "pi": {
    "name": "@user/extension",
    "version": "1.0.0",
    "p1.1": "file-system-access",
    "p1.5": ["read-directory", "write-file"],
    "m1.1": ["extension.ts", "index.ts"],
    "s1.1.1": {"read-directory": true, "write-file": true},
    "s1.1.2": [],
    "s1.1.3": true,
    "e1.1": ["E1.001: Invalid extension"]
  }
}
```

**❌ REJECTED**: No manifest

```typescript
{
  "name": "@user/extension"  // Missing P1.1, P1.5, M1.1, etc.
}
```

---

### **CRITICAL-2: Security Policy**

**Rule**: All extensions must declare permissions and handle errors properly.

**Requirements**:
1. Declare all capabilities in manifest
2. Handle errors with defined error codes (E1.1-E1.15)
3. Use error-first callbacks or reject-promise
4. Never expose secrets in logs
5. Use sandbox for all external operations

**Error Handling**:

```typescript
// ✅ VALID: Uses error codes
handleFile: async (path: string) => {
  try {
    return await fileOperation(path);
  } catch (error) {
    if (isError(error, 'E1.001')) {
      logError('Invalid extension');
    } else if (isError(error, 'E1.002')) {
      logError('Missing extension manifest');
    }
    // ... other error codes
  }
}
```

---

### **CRITICAL-3: Architecture Standards**

**Rule**: Use TypeScript with proper declarations.

**Requirements**:
1. TypeScript `declare` module for Node.js APIs
2. Proper type declarations for all APIs
3. Async/await patterns
4. No direct Node.js API calls without declaration

**Example**:

```typescript
// ✅ VALID: Proper type declaration
declare module 'some-external-api' {
  interface Result {
    data: any;
    error?: any;
  }
  export function fetchData(): Promise<Result>;
}
```

---

## ⚠️ Safety Rules (High Priority)

### **CRITICAL-4: Damage Control**

**Rule**: Never execute dangerous commands without validation.

**Protected Commands**:
- `rm -rf`, `rm -r`, `rm --recursive`
- `rm -f`, `rm --force`
- `sudo rm`
- `chmod 777`
- `git reset --hard`
- `git clean -fd`
- `git push --force`
- `git stash clear`
- `git checkout .`
- `DROP TABLE`, `DELETE FROM ...`
- AWS/GCP delete commands
- `mkfs.`, `dd /dev/`
- `kill -9`, `pkill -9`
- Environment file modifications

**Allowed Actions**:
- Copy operations (`cp`, `rsync`)
- Read-only operations
- Safe modifications in workspace
- Version-controlled changes with git commit

**Zero Access Paths**:
- `~/.env.*`
- `.ssh/*`
- `.gnupg/*`
- `*.pem`, `*.key`
- `*.tfstate`
- `~/.aws/*`
- `~/.azure/*`
- `*.json` (credentials)

---

### **CRITICAL-5: Read-Only Paths**

**Rule**: Never modify system directories or lockfiles.

**Protected**:
- `/etc/`, `/usr/`, `/bin/`, `/boot/`
- `~/.bash_history`, `~/.zsh_history`
- `~/.node_repl_history`
- `node_modules/`
- `dist/`, `build/`
- `*.lock`, `*.lockb`
- `*.min.js`, `*.bundle.js`

---

### **CRITICAL-6: No-Delete Paths**

**Rule**: Never delete these directories or files.

**Protected**:
- `.cursor/`, `.vscode/`, `.hermes/`
- `.pi/`, `.claue/`, `.wayofpi/`
- `agent/`, `agents/`, `.kilotools/`, `.kiloagent/`
- `.git/`, `.gitignore`, `.github/`
- `~/.claude/`, `CLAUDE.md`

**Special Files**:
- `LICENSE`, `COPYING`, `NOTICE`, `PATENTS`
- `README.md`, `CHANGELOG.md`
- `SECURITY.md`, `CODE_OF_CONDUCT.md`
- `Dockerfile`, `*.yml` (docker-compose)

---

## 🎯 Implementation Guidelines

### **1. Validation Flow**

```
User Request
    ↓
Validate Asset (pi rules check)
    ↓
Pass Validation
    ↓
Declare Capabilities (manifest)
    ↓
Sandbox Execution
    ↓
Error Handling (error codes)
    ↓
Log/Report
```

### **2. Permission Declaration**

```typescript
// Before execution, always declare
declareModule('file-system-access'): {
  read: ['/workspace/*'],
  write: ['.workspace/*'],
  neverReadWrite: ['~/./*'],
  sandbox: true,
  capabilities: ['fs:readonly', 'fs:readFile', 'fs:writeFile']
}
```

### **3. Error Handling Strategy**

```typescript
// Must use error codes E1.1-E1.15
function handleOperation(ops) {
  try {
    const result = await ops();
    return result;
  } catch (error) {
    const errorCode = extractError(error);
    // Map to E1.1-E1.15
    if (errorCode.startsWith('E1.')) {
      log('Error handled', errorCode);
      throw error;
    }
    // Unknown error - escalate
    throw new UnknownError(error);
  }
}
```

---

## 📜 Rule Commands

### Check Asset Validity

```bash
pi rules check /path/to/asset
```

**Output**:
```json
{
  "valid": true,
  "violations": [],
  "checks": {
    "P1.1": "Passed",
    "P1.5": "Passed",
    "S1.1.1": "Passed",
    "M1.1": "Passed",
    "S1.1.2": "Passed"
  }
}
```

---

## 🚨 Violation Examples

### **Violation: Missing Manifest**

**Error**: `P1.5 violation - Missing package manifest`

**Fix**: Add complete manifest with P1.1, P1.5, M1.1, S1.1.1, S1.1.2, S1.1.3, E1.1

---

### **Violation: Hardcoded Secret**

**Error**: `S1.1.2 violation - Hardcoded secret detected`

**Fix**: Use environment variables or config management

---

### **Violation: Direct Node.js API**

**Error**: `M1.1 violation - Missing TypeScript declaration`

**Fix**: Add `declare module` for Node.js APIs

---

## ✅ Compliance Checklist

For each extension/asset, verify:

- [ ] Package manifest present (P1.1, P1.5)
- [ ] TypeScript declarations (M1.1)
- [ ] Permission declaration (S1.1.1)
- [ ] No hardcoded secrets (S1.1.2)
- [ ] Sandbox execution (S1.1.3)
- [ ] Error codes defined (E1.1-E1.15)
- [ ] No dangerous commands
- [ ] No protected paths modified/deleted

---

## 📝 Updates

**Last Updated**: 2025-04-23

**Version**: 1.0.0

**Contact**: System rules management

---

**END OF DEVELOPER RULES**