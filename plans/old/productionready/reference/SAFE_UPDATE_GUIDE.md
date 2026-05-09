# Way of Pi: Safe Update & Maintenance Guide

This guide provides procedures for updating the Way of Pi system without getting "stuck" or breaking the installation.

## 1. Why Updates Get "Stuck"
Common reasons for update failures in Way of Pi:
- **Port Conflicts:** The `start-wayofwork-ui.sh` script forcefully kills processes on ports 3333 and 5173. If an update is triggered from within the app's terminal, it may kill itself.
- **Dependency Mismatch:** Using `npm install` instead of `bun install` can lead to lockfile conflicts.
- **Breaking Changes:** Recent refactors (e.g., moving `.wayofpi` data to `.claw/workspace`) may require manual migration of old data.
- **Unpinned Pi Version:** If `@mariozechner/pi-coding-agent` updates upstream and introduces breaking changes to the `--mode json` output, the Way of Pi server may fail to parse turns.

## 2. Safe Update Procedure (Recommended)

### Step 1: Backup Data
Always backup your `.pi/` and `.claw/` directories before a major update.
```bash
cp -r .pi .pi.backup-$(date +%Y%m%d)
cp -r .claw .claw.backup-$(date +%Y%m%d)
```

### Step 2: Stop All Processes
Exit the Electron app and stop any background Bun/Vite processes.
```bash
pkill -9 -f "wayofpi"
pkill -9 -f "bun"
pkill -9 -f "vite"
```

### Step 3: Pull Latest Code
```bash
git fetch origin
git pull --rebase origin main
```

### Step 4: Clean Install Dependencies
```bash
# Root (if package.json exists)
bun install

# UI & Server
cd apps/wayofwork-ui
rm -rf node_modules
bun install
```

### Step 5: Run Port Doctor
Ensure no stale processes are hanging onto the ports.
```bash
../../doctor.sh --fix
```

### Step 6: Start System
```bash
cd ../..
./start-wayofpi-electron.sh
```

---

## 3. Automated Update Script
The system includes `scripts/wop-update-system.sh`. To use it safely:
```bash
./scripts/wop-update-system.sh --backup --force
```
*Note: The `--force` flag will overwrite local changes to tracked files. Use with caution.*

## 4. Troubleshooting "Stuck" State

### Symptom: UI loads but Chat says "Unauthorized"
- **Cause:** JWT token expired or `WOP_AUTH_SECRET` changed.
- **Fix:** Clear browser/Electron localStorage and login again at `/api/login` (once the UI login page is implemented) or restart the server to refresh the default admin.

### Symptom: Pi tool calls fail or return raw JSON
- **Cause:** Headless Pi version mismatch.
- **Fix:** Check `pi --version`. Ensure it matches the version in `plans/productionready/PI_VERSION_MANAGEMENT.md`. Reinstall if necessary:
  ```bash
  npm install -g @mariozechner/pi-coding-agent@2026.4.30
  ```

### Symptom: Port 3333 already in use
- **Cause:** A ghost Bun process is still running.
- **Fix:** Run `lsof -i:3333` and `kill -9 <PID>`.

### Symptom: Missing files or broken dependencies after update
- **Cause:** Interrupted `git pull` or `bun install`.
- **Fix:** Use the built-in recovery script:
  ```bash
  ./scripts/wop-recover.sh --auto
  ```
  Or for a full restoration from the latest backup:
  ```bash
  ./scripts/wop-recover.sh --restore latest
  ```

---

## 5. Maintenance Checklist
- [ ] Run `./doctor.sh` weekly to find absolute paths that might have leaked into config.
- [ ] Check `CHANGELOG.md` for breaking change announcements.
- [ ] Ensure `ollama` is running and the `qwen2.5:9b` model is available.
- [ ] Verify `.env` matches `.env.sample` after pull.

**Last Updated:** 2026-05-04
