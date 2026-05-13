# Pi Version Management - Way of Pi

## ⚠️ CRITICAL: Decouple from Global Pi

Pi (`www.pi.dev`) updates frequently. To prevent breaking your development environment, Way of Pi uses a **project-local** binary.

---

## 1. Version Pinning Strategy

### ❌ WRONG (Global/Dynamic)
```bash
npm install -g @earendil-works/pi-coding-agent          # Global - affects all projects
npm install -g @earendil-works/pi-coding-agent@latest  # Dynamic - breaks on updates
```

### ✅ CORRECT (Project-Local & Pinned)
```bash
# Pin to specific version in root package.json
bun add @earendil-works/pi-coding-agent@0.74.0

# Run via justfile (which points to node_modules/.bin/pi)
just pi
```

---

## 2. Check Available Versions

### NPM Registry
```bash
# List all versions for the new namespace
npm view @earendil-works/pi-coding-agent versions --json
```

### Recommended Stable Versions
| Version | Namespace | Stability | Notes |
|---------|-----------|-----------|-------|
| **0.74.0** | `@earendil-works` | ✅ Stable | **Current Way of Pi standard** |
| 0.73.1 | `@mariozechner` | ✅ Stable | Old standard |

---

## 3. Decoupling & Isolation

Way of Pi isolates its Pi environment to avoid conflicts with your global setup.

### PI_CODING_AGENT_DIR
All WOP `pi` commands are prefixed with `export PI_CODING_AGENT_DIR="$ROOT/.pi/agent"`. This ensures:
- Sessions are stored in the repo.
- Settings are repo-specific.
- Global `~/.pi/agent` remains untouched.

### Local Binary
WOP uses `"$ROOT/node_modules/.bin/pi"` instead of the global `pi`.

---

## 4. Automation with Justfile

| Target | Command | Purpose |
|--------|---------|---------|
| `just pi` | `node_modules/.bin/pi` | Run local Pi with isolated config |
| `just pi-verify` | `scripts/pi-version-check.sh` | Verify local version matches `.env` |
| `just pi-fix-version` | `bun install` | Reinstall correct local version |

---

## 5. .env Configuration

### .env
```bash
# Pi.dev version pinning (WOP-006)
PI_PINNED_VERSION=0.74.0
```

---

## 6. Update Procedure

1.  Update `PI_PINNED_VERSION` in `.env`.
2.  Update `package.json` with the new version.
3.  Run `bun install`.
4.  Run `just pi-verify` to confirm.
5.  Commit changes.

---

**Status:** ✅ Decoupled version pinning strategy implemented.
