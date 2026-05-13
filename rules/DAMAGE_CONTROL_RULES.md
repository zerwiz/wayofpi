# 🔒 Damage Control Rules Documentation

Based on `.pi/damage-control-rules.yaml`

> **Purpose**: Prevent Pi agent and extensions from executing dangerous commands
> **Authority**: System-wide security policy
> **Last Updated**: 2025-04-23

---

## 📋 Rule Categories

| Category | Description | Command Count |
|--------|-----------|-------------|
| **🚫 Dangerous Commands** | Commands that can cause data loss | ~70+ |
| **🔒 Zero Access Paths** | Files that should never be accessed | 60+ |
| **📚 Read-Only Paths** | Files that should only be read | 45+ |
| **🛡️ No-Delete Paths** | Files/directories protected from deletion | 35+ |

---

## 🚀 Dangerous Commands (BLOCKED)

### **File System Destruction**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\brm\s+(-[^\s]*)*-[rRf]` | `rm -rf`, `rm -Rrf`, `rm -f` | 🔴 Critical |
| `\brm\s+--recursive` | `rm --recursive` | 🔴 Critical |
| `\brm\s+--force` | `rm --force` | 🔴 Critical |
| `\bsudo\s+rm\b` | `sudo rm` | 🔴 Critical |
| `\brmdir\s+--ignore-fail-on-non-empty` | `rmdir` force | 🔴 High |
| `\bchmod\s+(-[^\s]+\s+)*777\b` | `chmod 777` | 🟠 Medium |
| `\bchmod\s+-[Rr].*777` | Recursive chmod 777 | 🟠 Medium |

---

### **Permission Escalation**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bchown\s+-[Rr].*\broot\b` | Recursive chown to root | 🟠 Medium |

---

### **Git-Related Destructive Commands**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bgit\s+reset\s+--hard\b` | `git reset --hard` | 🔴 Critical |
| `\bgit\s+clean\s+(-[^\s]*)*-[fd]` | `git clean -fd` | 🔴 Critical |
| `\bgit\s+push\s+.*--force(?!-with-lease)` | `git push --force` | 🔴 High |
| `\bgit\s+push\s+(-[^\s]*)*-f\b` | `git push -f` | 🔴 High |
| `\bgit\s+stash\s+clear\b` | `git stash clear` | 🟠 Medium |
| `\bgit\s+reflog\s+expire\b` | `git reflog expire` | 🟠 Medium |
| `\bgit\s+gc\s+.*--prune=now` | `git gc --prune=now` | 🟠 Medium |
| `\bgit\s+filter-branch\b` | `git filter-branch` | 🟠 Medium |
| `\bgit\s+checkout\s+--\s*\. ` | Discard all changes | 🔴 Critical |
| `\bgit\s+restore\s+\. ` | Discard all changes | 🔴 Critical |
| `\bgit\s+stash\s+drop\b` | Drop all stashes | 🟠 Medium |
| `\bgit\s+branch\s+(-[^\s]*)*-D` | Force delete branch | 🔴 High |
| `\bgit\s+push\s+\S+\s+--delete\b` | Delete remote branch | 🟡 Medium |
| `\bgit\s+push\s+\S+\s+:\S+` | Delete remote branch (old) | 🟡 Medium |

---

### **Hardware & Infrastructure Commands**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bmkfs\.` | Filesystem format | 🔴 Critical |
| `\bdd\s+.*of=/dev/` | Overwrite device | 🔴 Critical |
| `\bkill\s+-9\s+-1\b` | Kill all processes | 🟠 Medium |
| `\bkillall\s+-9\b` | killall -9 | 🟡 Medium |
| `\bpkill\s+-9\b` | pkill -9 | 🟡 Medium |
| `\bhistory\s+-c\b` | Clear shell history | 🟢 Low |

---

### **AWS Commands (Infrastructure Destruction)**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\baws\s+s3\s+rm\s+.*--recursive` | Delete all S3 objects | 🔴 Critical |
| `\baws\s+s3\s+rb\s+.*--force` | Force remove bucket | 🔴 Critical |
| `\baws\s+ec2\s+terminate-instances` | Terminate EC2 instances | 🔴 Critical |
| `\baws\s+rds\s+delete-db-instance` | Delete RDS DB | 🔴 Critical |
| `\baws\s+cloudformation\s+delete-stack` | Delete CloudFormation | 🔴 Critical |
| `\baws\s+dynamodb\s+delete-table` | Delete DynamoDB table | 🔴 Critical |
| `\baws\s+eks\s+delete-cluster` | Delete EKS cluster | 🔴 Critical |
| `\baws\s+lambda\s+delete-function` | Delete Lambda function | 🟠 Medium |
| `\baws\s+iam\s+delete-role` | Delete IAM role | 🔴 Critical |
| `\baws\s+iam\s+delete-user` | Delete IAM user | 🟡 Medium |

---

### **GCP Commands (Infrastructure Destruction)**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bgcloud\s+projects\s+delete\b` | Delete entire GCP project | 🔴 Critical |
| `\bgcloud\s+compute\s+instances\s+delete\b` | Delete VM instances | 🔴 Critical |
| `\bgcloud\s+sql\s+instances\s+delete\b` | Delete SQL instances | 🔴 Critical |
| `\bgcloud\s+container\s+clusters\s+delete\b` | Delete GKE cluster | 🔴 Critical |
| `\bgcloud\s+storage\s+rm\s+.*-r` | Delete storage objects | 🔴 High |
| `\bgcloud\s+functions\s+delete\b` | Delete Cloud Functions | 🟠 Medium |
| `\bgcloud\s+iam\s+service-accounts\s+delete\b` | Delete IAM accounts | 🔴 Critical |
| `\bgcloud\s+run\s+services\s+delete\b` | Delete Cloud Run | 🟡 Medium |
| `\bgcloud\s+run\s+jobs\s+delete\b` | Delete Cloud Run jobs | 🟡 Medium |
| `\bgcloud\s+services\s+disable\b` | Disable APIs | 🟡 Medium |
| `\bgcloud\s+iam\s+roles\s+delete\b` | Delete IAM roles | 🔴 Critical |
| `\bgcloud\s+iam\s+policies` | Modify IAM policies | 🟡 Medium |

---

### **Firebase Commands**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bfirebase\s+projects:delete\b` | Delete entire project | 🔴 Critical |
| `\bfirebase\s+firestore:delete\s+.*--all-collections` | Wipe all data | 🔴 Critical |
| `\bfirebase\s+database:remove\b` | Remove Realtime DB | 🔴 Critical |
| `\bfirebase\s+hosting:disable\b` | Disable hosting | 🟡 Medium |
| `\bfirebase\s+functions:delete\b` | Delete functions | 🟡 Medium |

---

### **Vercel Commands**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bvercel\s+remove\s+.*--yes\b` | Remove deployment | 🔴 High |
| `\bvercel\s+projects\s+rm\b` | Remove project | 🔴 High |
| `\bvercel\s+env\s+rm\b` | Remove env variables | 🟡 Medium |
| `\bvercel\s+rm\b` | Remove deployment | 🔴 High |
| `\bvercel\s+remove\b` | Remove deployment | 🔴 High |
| `\bvercel\s+domains\s+rm\b` | Remove domains | 🟠 Medium |

---

### **Netlify Commands**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bnetlify\s+sites:delete\b` | Delete entire site | 🔴 Critical |
| `\bnetlify\s+functions:delete\b` | Delete functions | 🟡 Medium |

---

### **Cloudflare Workers**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `\bwrangler\s+delete\b` | Delete Worker | 🔴 High |
| `\bwrangler\s+r2\s+bucket\s+delete\b` | Delete R2 bucket | 🔴 High |
| `\bwrangler\s+kv:namespace\s+delete\b` | Delete KV namespace | 🟠 Medium |
| `\bwrangler\s+d1\s+delete\b` | Delete database | 🔴 High |
| `\bwrangler\s+queues\s+delete\b` | Delete queues | 🟡 Medium |

---

### **SQL Destructive Commands**

| Pattern | Description | Risk Level |
|---------|------------|----------|
| `DELETE\s+FROM\s+\w+\s*;$` | Delete without WHERE | 🔴 Critical |
| `DELETE\s+\*\s+FROM` | Delete all rows | 🔴 Critical |
| `\bTRUNCATE\s+TABLE\b` | Truncate table | 🔴 Critical |
| `\bDROP\s+TABLE\b` | Drop table | 🔴 Critical |
| `\bDROP\s+DATABASE\b` | Drop database | 🔴 Critical |
| `\bDROP\s+SCHEMA\b` | Drop schema | 🔴 Critical |
| `\bDELETE\s+FROM\s+\w+\s+WHERE\b.*\bid\s*=` | Delete specific ID | 🟡 Medium |

---

## 🔒 Zero Access Paths

### **Environment Files**

```yaml
- ".env"
- ".env.local"
- ".env.development"
- ".env.production"
- ".env.staging"
- ".env.test"
- ".env.*.local"
- "*.env"
```

### **SSH & Keys**

```yaml
- "~/.ssh/"
- "~/.gnupg/"
- "~/.aws/"
- "~/.config/gcloud/"
- "*-credentials.json"
- "*serviceAccount*.json"
- "*service-account*.json"
- "~/.azure/"
- "~/.kube/"
- "kubeconfig"
- "*-secret.yaml"
- "secrets.yaml"
```

### **Certificates & Keys**

```yaml
- "*.pem"
- "*.key"
- "*.p12"
- "*.pfx"
```

### **Infrastructure State**

```yaml
- "*.tfstate"
- "*.tfstate.backup"
- ".terraform/"
```

### **Platform Specific Paths**

```yaml
- ".vercel/"
- ".netlify/"
- "firebase-adminsdk*.json"
- "serviceAccountKey.json"
- ".supabase/"
- "~/.netrc"
- "~/.npmrc"
- "~/.pypirc"
- "~/.git-credentials"
- ".git-credentials"
- "dump.sql"
- "backup.sql"
- "*.dump"
```

---

## 📚 Read-Only Paths

### **System Directories**

```yaml
- /etc/
- /usr/
- /bin/
- /sbin/
- /boot/
- /root/
```

### **Shell History**

```yaml
- ~/.bash_history
- ~/.zsh_history
- ~/.node_repl_history
```

### **Shell Config**

```yaml
- ~/.bashrc
- ~/.zshrc
- ~/.profile
- ~/.bash_profile
```

### **Lock Files**

```yaml
- package-lock.json
- yarn.lock
- pnpm-lock.yaml
- Gemfile.lock
- poetry.lock
- Pipfile.lock
- composer.lock
- Cargo.lock
- go.sum
- flake.lock
- bun.lockb
- uv.lock
- npm-shrinkwrap.json
- "*.lock"
- "*.lockb"
- "*.min.js"
- "*.min.css"
- "*.bundle.js"
- "*.chunk.js"
- dist/
- build/
- .next/
- .nuxt/
- .output/
- node_modules/
- __pycache__/
- .venv/
- venv/
- target/
- *.min.js
- *.min.css
- *.bundle.js
```

---

## 🛡️ No-Delete Paths (Protected)

### **Documentation**

```yaml
- LICENSE
- LICENSE.*
- COPYING
- COPYING.*
- NOTICE
- PATENTS
- README.md
- README.*
- CONTRIBUTING.md
- CHANGELOG.md
- CODE_OF_CONDUCT.md
- SECURITY.md
```

### **Git**

```yaml
- .git/
- .gitignore
- .gitattributes
- .gitmodules
- .github/
- .gitlab-ci.yml
- .circleci/
- Jenkinsfile
- .travis.yml
- azure-pipelines.yml
```

### **Docker**

```yaml
- Dockerfile
- "Dockerfile.*"
- docker-compose.yml
- "docker-compose.*.yml"
- .dockerignore
```

---

## 🧪 Extension Implementation

### **Validate Extension**

This extension must:
1. Load `.pi/damage-control-rules.yaml`
2. Block dangerous commands
3. Never access zeroAccessPaths
4. Never modify readOnlyPaths
5. Never delete from noDeletePaths

### **Test Cases**

```typescript
// Test case 1: Check dangerous commands are blocked
assert(isBlocked('rm -rf /*'))           // true
assert(isBlocked('git reset --hard'))    // true
assert(isBlocked('git push -f'))         // true

// Test case 2: Check access paths
assert(canAccess('~/.env'))              // false
assert(canAccess('/etc/passwd'))         // false
assert(canAccess('node_modules'))        // false

// Test case 3: Check deletion protection
assert(canDelete('LICENSE'))             // false
assert(canDelete('.git/'))               // false
assert(canDelete('README.md'))           // false
assert(canDelete('.env'))                // false
```

### **Usage Examples**

```javascript
// ✅ Approved: Safe operation
const result = await safeCommand('ls -la /workspace/*');

// ❌ Rejected: Dangerous command
await command('rm -rf /workspace/*'); // Blocked by damage-control-rules.yaml

// ✅ Approved: Reading safe path
const data = await readFile('/workspace/config.json');

// ❌ Rejected: Accessing sensitive path
await readFile('~/.env'); // Blocked by zeroAccessPaths
```

---

## 📊 Risk Levels

| Level | Actions | Description |
|-------|---------|-------------|
| 🔴 **Critical** | Block immediately | Cannot recover (data loss, infrastructure) |
| 🟠 **Medium** | Block with warning | Recoverable but dangerous (history, config) |
| 🟡 **Low** | Block on workspace | Can recover (env files, credentials) |
| 🟢 **Info** | Log only | Safe operations (log cleanup) |

---

Last Updated: 2025-04-23
Version: 1.0.0
