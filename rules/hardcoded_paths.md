# 🚫 Never Hard-Coded File Paths

## 🎯 Rule Overview

**Priority:** `Critical`  
**Type:** `Architecture`  
**Status:** `Mandatory`

> **Never** use absolute or relative file paths that are baked into the code. Always use configurable, user-provided, or environment-based paths.

---

## 📋 Why This Matters

Hard-coded file paths cause:

| Issue | Impact |
|-------|--------|
| **Portability** | Code breaks when deployed to new environments |
| **Multi-user** | Fails on shared systems with different directory structures |
| **Testing** | Tests fail in CI/CD pipelines with different working directories |
| **Security** | Exposes internal directory structures if leaked in path traversal |
| **Maintainability** | Future refactoring requires finding and updating all paths |
| **Deployment** | Can't work in containers, cloud functions, or serverless environments |

---

## ✅ What to Do Instead

### 1. **Use Environment Variables**

```typescript
// ❌ BAD: Hard-coded path
const logFile = process.env.LOG_FILE_PATH || 'logs/error.log';

// ✅ GOOD: Environment variable
const logFile = process.env.LOG_FILE_PATH || 'logs/error.log';

// ✅ GOOD: Config file
const config = Config.parse(process.env);
export const logFile = config.logFilePath;
```

### 2. **Use Command-Line Arguments**

```typescript
// ❌ BAD: Hard-coded path
const inputFile = '/home/user/input.json';

// ✅ GOOD: CLI argument
const inputFile = args.input;

// ✅ GOOD: Default fallback
const inputFile = args.input || process.env.INPUT_FILE || 'default/input.json';
```

### 3. **Use Configuration Files**

```typescript
// config.yaml
database:
  connection:
    host: '${HOST:-localhost}'
    port: '${PORT:-5432}'
    path: '${DB_PATH:-local/data/db.sqlite}'

// ✅ GOOD: Load from config
const db = require('sqlite');
const dbPath = config.database.connection.path;
```

### 4. **Use Base + Relative Paths**

```typescript
// ❌ BAD: Hard-coded path
const userDir = '/home/user/data/configs';

// ✅ GOOD: Relative to config location
const configDir = path.join(
  require.main ? require.main.filename : __dirname,
  '..',
  'configs'
);

// ✅ GOOD: Better approach
const configDir = path.resolve(process.cwd(), './configs');
```

### 5. **Use Platform-Agnostic Storage**

```typescript
// ❌ BAD: Hard-coded path
const tempFile = '/tmp/myapp/session.tmp';

// ✅ GOOD: Platform temp directory
import { tmpdir } from 'os';
import { join } from 'path';
import { tmpName } from 'tmp';

const tempDir = tmpdir();
const tempFile = join(tempDir, `session_${randomString()}`);
```

---

## 🗑️ What to Avoid (Anti-Patterns)

### ❌ Absolute Linux Paths

```typescript
// WRONG:
const log = process.env.LOG_PATH || path.join(__dirname, '../logs/');
const db = '/home/user/data/database.db';
const config = '/etc/myapp/config.yaml';

// CORRECT:
const log = process.env.LOG_PATH || path.join(__dirname, '../logs/');
const db = config.dbPath;
```

### ❌ Absolute Windows Paths

```typescript
// WRONG:
const temp = path.join(os.tmpdir(), 'myapp');
const appData = process.env.APPDATA || path.join(process.resources, 'app');

// CORRECT:
const temp = path.join(os.tmpdir(), 'myapp');
const appDir = process.env.APPDATA || path.join(process.resources, 'app');
```

### ❌ Home Directory Assumptions

```typescript
// WRONG:
const userData = '/home/user/.myapp/';
const configs = '$HOME/.config/myapp/';

// CORRECT:
const userData = path.join(os.homedir(), '.myapp');
const configs = path.join(os.homedir(), '.config', 'myapp');
```

### ❌ CI/CD Specific Paths

```typescript
// WRONG:
const build = process.env.BUILD_DIR || path.join(process.cwd(), 'builds');
const cache = process.env.CACHE_DIR || path.join(process.cwd(), '.cache');

// CORRECT:
const buildDir = path.join(process.cwd(), 'build');
const cacheDir = path.join(process.cwd(), '.cache');
```

### ❌ Docker Volume Paths

```typescript
// WRONG:
const data = '/data/myapp/volume';
const logs = process.env.LOGS_PATH || path.join(process.cwd(), 'logs');

// CORRECT:
const data = process.env.DATA_PATH || '/app/data';
const logs = path.join(process.cwd(), '..', 'logs');
```

---

## 🛠️ Path Resolution Best Practices

### 1. **Always Resolve Relative Paths**

```typescript
import { join, dirname } from 'path';

// Get the base project directory
const projectRoot = dirname(
  resolveMainModulePath() || process.cwd()
);

// Build paths relative to project root
const basePath = join(projectRoot, env.DATA_PATH || 'data');
```

### 2. **Validate Paths Exist**

```typescript
import { existsSync } from 'fs';
import { join } from 'path';

const path = join(basePath, config.filename);

if (!existsSync(path)) {
  throw new Error(`Config file not found: ${path}`);
}
```

### 3. **Create Directory First**

```typescript
import { mkdir, existsSync } from 'fs/promises';

async function ensureDir(path: string): Promise<void> {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
}
```

### 4. **Use Constants/Namespaces**

```typescript
// ❌ BAD: Mixed naming
const DB = 'database.db';
const CACHE = '/tmp/cache.db';
const TMP = '/tmp/';

// ✅ GOOD: Clear namespaces
const PATHS = {
  DATA: env.DATA_PATH || './data',
  LOGS: env.LOG_PATH || './logs',
  TEMP: env.TEMP_PATH || './temp',
  CACHE: env.CACHE_PATH || './cache',
};
```

---

## 🧪 Testing Considerations

### 1. **Mock Paths in Tests**

```typescript
// test/setup.ts
import { join } from 'path';

export const TEST_ROOT = join(__filename, '../../test/data/');

export const TEST_DB = join(TEST_ROOT, 'database.db');
export const TEST_CONFIG = join(TEST_ROOT, 'config.yaml');

// test/app.ts
const basePath = TEST_ROOT; // Use test paths
```

### 2. **Isolate Test Files**

```typescript
// ❌ BAD: Mix in test paths with production
const dataDir = process.env.DATA_PATH || '/var/data'; // Production path leaked

// ✅ GOOD: Test-specific paths
const isTest = process.env.NODE_ENV === 'test';
const dataDir = isTest ? './test/data' : './data';
```

### 3. **Cleanup Test Files**

```typescript
import { rm, unlink } from 'fs/promises';

afterEach(async () => {
  await cleanupPaths([
    './test.data',
    './test.logs',
    './test.cache',
  ]);
});
```

---

## ✅ Checklist

- [ ] All file paths come from `process.env`, `args`, `config`, or `const`
- [ ] No absolute paths (except explicitly configured ones like `/var/log` with env prefix)
- [ ] No hardcoded usernames like `/home/zeriz/` or `/Users/`
- [ ] No hardcoded `/app/`, `/data/`, `/data/db` paths
- [ ] Test environment has its own path configuration
- [ ] Production environment paths use explicit env vars
- [ ] Paths are validated to exist before use
- [ ] Temporary files use `tmpdir()` or temp directories
- [ ] Cleanup logic removes test/scratch paths on completion
- [ ] Documentation specifies which env vars control paths (e.g., `DATA_PATH=`)

---

## 📋 Related Files

| File | Purpose | Status |
|------|---------|--------|
| `hardcoded_paths.md` | This document | ✅ New |
| `file_paths.md` | General path guidelines | 🔄 Update needed |
| `config_schema.yaml` | Config structure def | 📖 Reference |

---

## 🤝 Related Rules

- `config_security.md` – Never store secrets in config files
- `env_security.md` – Environment variable best practices
- `deployment_checklist.md` – Deploy-time checklist
- `testing_strategies.md` – Test isolation and path handling

---

**Last Updated:** 2023-11-01  
**Author:** System  
**Version:** 1.0.0