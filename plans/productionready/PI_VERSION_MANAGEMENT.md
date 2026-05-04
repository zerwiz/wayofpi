# Pi Version Management - Way of Pi

## ⚠️ CRITICAL: Never Use `@latest` in Production

Pi (`www.pi.dev`) updates frequently. Auto-updates **WILL break** your system.

---

## 1. Version Pinning Strategy

### ❌ WRONG (Breaks on Updates)
```bash
npm install -g @mariozechner/pi-coding-agent          # Uses latest
npm install -g @mariozechner/pi-coding-agent@latest  # Explicit latest
bun add -g @mariozechner/pi-coding-agent             # Uses latest
```

### ✅ CORRECT (Pinned Versions)
```bash
# Pin to specific version
npm install -g @mariozechner/pi-coding-agent@2026.4.30
bun add -g @mariozechner/pi-coding-agent@2026.4.30

# Verify
pi --version  # Should output: 2026.4.30
```

---

## 2. Check Available Versions

### NPM Registry
```bash
# List all versions
npm view @mariozechner/pi-coding-agent versions --json

# Check specific version
npm view @mariozechner/pi-coding-agent@2026.4.30

# Get latest stable (for testing only)
npm view @mariozechner/pi-coding-agent version
```

### Recommended Stable Versions
| Version | Date | Stability | Notes |
|---------|------|-----------|-------|
| **2026.4.30** | 2026-04-30 | ✅ Stable | Recommended for production |
| 2026.5.1 | 2026-05-01 | ⚠️ New | Test before production |
| latest | Daily | ❌ Unstable | NEVER use in production |

---

## 3. Lockfile Management

### package.json (Root)
```json
{
  "name": "way-of-pi",
  "dependencies": {
    // ❌ WRONG
    "@mariozechner/pi-coding-agent": "^2026.4.30",
    
    // ✅ CORRECT (exact)
    "@mariozechner/pi-coding-agent": "2026.4.30"
  },
  "overrides": {
    // Force exact version even if dependencies conflict
    "@mariozechner/pi-coding-agent": "2026.4.30"
  }
}
```

### .npmrc (Prevent ^ and ~ Prefixes)
```
# Project root .npmrc
save-exact=true
save-prefix=
```

---

## 4. Docker Version Pinning

### ✅ CORRECT Dockerfile
```dockerfile
FROM oven/bun:1.2.9  # ← Pin bun version too!

# Install Pi with EXACT version
RUN npm install -g @mariozechner/pi-coding-agent@2026.4.30

# Verify installation
RUN pi --version  # Should print: 2026.4.30
```

### ❌ WRONG Dockerfile
```dockerfile
FROM oven/bun:latest              # ← Breaks on bun updates
RUN npm install -g @mariozechner/pi-coding-agent@latest  # ← Breaks on Pi updates
```

---

## 5. Update Procedure (Controlled Updates)

### Step 1: Test New Version (Development)
```bash
# Create test branch
git checkout -b test-pi-update

# Install new version
npm install -g @mariozechner/pi-coding-agent@2026.5.1

# Test thoroughly
cd /path/to/test/workspace
pi "Test this feature"

# If works, update package.json
```

### Step 2: Update package.json
```json
{
  "dependencies": {
    "@mariozechner/pi-coding-agent": "2026.5.1"  // Updated from 2026.4.30
  }
}
```

### Step 3: Commit with Changelog
```bash
git add package.json
git commit -m "chore: pin Pi to 2026.5.1 (from 2026.4.30)

# Update CHANGELOG.md
# Add: "- **Pi Update:** Pinned to 2026.5.1 (from 2026.4.30)"
```

### Step 4: Update Dockerfile
```dockerfile
# Update version in Dockerfile
RUN npm install -g @mariozechner/pi-coding-agent@2026.5.1
```

---

## 6. Freeze Dependencies (Reproducible Builds)

### Create package-lock.json (npm)
```bash
# Generate lockfile
npm install

# This creates package-lock.json with EXACT versions
# Commit this file!
git add package-lock.json
git commit -m "chore: add package-lock.json for reproducible builds"
```

### Bun (bun.lockb)
```bash
# Bun generates bun.lockb automatically
# Commit this file too!
git add bun.lockb
git commit -m "chore: pin dependencies with bun.lockb"
```

---

## 7. Verify Installation

### Check Pi Version in Runtime
```bash
# In Docker container
docker run --rm wayofpi-check pi --version

# Should output exact version (e.g., 2026.4.30)
# NOT: "latest" or "unknown"
```

### Check All Dependencies
```bash
# List installed versions
npm list -g --depth=0

# Should show:
# @mariozechner/pi-coding-agent@2026.4.30
```

---

## 8. Rollback Procedure

### If Update Breaks System
```bash
# Revert to previous version
npm install -g @mariozechner/pi-coding-agent@2026.4.30

# Update package.json
# Change "2026.5.1" back to "2026.4.30"

# Rebuild Docker image
docker build --build-arg PI_VERSION=2026.4.30 -t wayofpi .
```

---

## 9. Integration with Way of Pi

### install.sh (Unix) - UPDATED
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Way of Pi Installer (Unix) ==="

# Pin Pi version
PI_VERSION="2026.4.30"

# Install Pi with exact version
if ! command -v pi &> /dev/null; then
  echo "Installing Pi Coding Agent (v${PI_VERSION})..."
  npm install -g @mariozechner/pi-coding-agent@${PI_VERSION}
else
  INSTALLED=$(pi --version)
  echo "Pi is already installed: v${INSTALLED}"
  if [ "$INSTALLED" != "$PI_VERSION" ]; then
    echo "WARNING: Installed version ($INSTALLED) differs from pinned ($PI_VERSION)"
    echo "Run: npm install -g @mariozechner/pi-coding-agent@${PI_VERSION}"
  fi
fi

# Verify
pi --version
```

### install.ps1 (Windows) - UPDATED
```powershell
# Pin Pi version
$PI_VERSION = "2026.4.30"

# Install Pi
if (-not (Get-Command pi -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Pi Coding Agent (v$PI_VERSION)..."
  npm install -g @mariozechner/pi-coding-agent@$PI_VERSION
} else {
  $installed = (pi --version).Trim()
  Write-Host "Pi is already installed: v$installed"
  if ($installed -ne $PI_VERSION) {
    Write-Host "WARNING: Installed version ($installed) differs from pinned ($PI_VERSION)"
  }
}
```

---

## 10. .env Configuration

### .env.sample (Root)
```
# Pi Version (PIN THIS!)
PI_VERSION=2026.4.30

# Prevent auto-updates
PI_AUTO_UPDATE=false

# Lock to specific version
NPM_CONFIG_SAVE_EXACT=true
```

---

## 11. CI/CD Checks

### GitHub Actions (Example)
```yaml
name: Verify Pi Version

on: [push, pull_request]

jobs:
  check-versions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check Pi version in package.json
        run: |
          PI_VERSION=$(jq -r '.dependencies["@mariozechner/pi-coding-agent"]' package.json)
          echo "Pi version: $PI_VERSION"
          
          # Fail if using @latest or ^/~
          if [[ "$PI_VERSION" == *"latest"* ]] || [[ "$PI_VERSION" == ^* ]] || [[ "$PI_VERSION" == ~* ]]; then
            echo "ERROR: Pi version must be pinned (no ^, ~, or latest)"
            exit 1
          fi
```

---

## 12. Quick Reference

### Do's ✅
- ✅ Always pin: `@mariozechner/pi-coding-agent@2026.4.30`
- ✅ Commit `package-lock.json` / `bun.lockb`
- ✅ Test updates in development FIRST
- ✅ Use `.npmrc` with `save-exact=true`
- ✅ Document version changes in CHANGELOG.md

### Dont's ❌
- ❌ Never use `@latest`
- ❌ Never use `^` or `~` prefixes
- ❌ Never skip testing before production update
- ❌ Never commit without lockfile

---

## 13. Current Pinned Versions (Way of Pi)

| Package | Pinned Version | Source |
|---------|----------------|--------|
| **Bun** | `1.2.9` | `Dockerfile` |
| **Pi** | `2026.4.30` | `package.json`, `install.sh` |
| **Node.js** | `22.x` | `install.sh`, `install.ps1` |
| **Ollama** | `latest` (stable) | `install.sh` |

---

**Status:** ✅ Version pinning strategy documented.

**Next Step:** Update all install scripts to use pinned versions.
