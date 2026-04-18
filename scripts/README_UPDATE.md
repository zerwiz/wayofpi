# Update System Documentation

## Overview

Way of Pi includes several scripts for updating the system and maintaining dependencies.

---

## Updating the System

### Quick Update

Run from the Way of Pi repository root:

```bash
./scripts/wop-update-simple.sh

# Force update (discard local changes)
./scripts/wop-update-simple.sh --force

# Create backup before update
./scripts/wop-update-simple.sh --backup
```

What this does:
- Pulls latest changes from GitHub
- Reinstalls Bun/npm dependencies
- Updates the Electron app
- Optionally backs up your configuration

### Manual Git Update

If you prefer to manage updates directly with git:

```bash
# Fetch latest changes
git fetch origin

# Rebase and merge
git pull --rebase origin main

# OR hard reset (discard local changes)
git reset --hard origin/main
```

---

## System Update Function (from mithub)

The `wop-update-simple.sh` script automates the update flow:

### What it does:

1. **Fetches latest changes** from the Way of Pi GitHub repository
2. **Pulls updates** using git rebase (preserves your local changes)
3. **Installs/upgrades dependencies**:
   - Bun dependencies in root
   - npm dependencies in `apps/wayofpi-ui`
   - Electron build cache
4. **Optional backup**: Saves current state before updating
5. **Force mode**: Discards local changes if local is behind remote

### Usage examples:

```bash
# Normal update (merge changes)
./scripts/wop-update-simple.sh

# Force update (overwrite)
./scripts/wop-update-simple.sh --force

# Update with backup
./scripts/wop-update-simple.sh --backup

# Force update without backup
./scripts/wop-update-simple.sh --force
```

### After updating:

1. Check for merge conflicts if any:
   ```bash
   git status
   git diff
   ```

2. Resolve conflicts if needed:
   ```bash
   git rebase --continue
   ```

3. Apply your `.env` file:
   ```bash
   # If .env was modified, restore it
   cp ~/.pi/.env.backup ~/.pi/.env
   ```

4. Restart the app:
   ```bash
   ./start-wayofpi-electron.sh
   ```

---

## Maintenance Commands

### Clean install (fresh start)

If things get broken:

```bash
# Backup first
mkdir -p ~/.pi/wayofpi-backup
cp -r .pi agent extensions .env .env.sample ~/.pi/wayofpi-backup/

# Fresh install
git fetch origin
git pull

# Reinstall everything
bun install
cd apps/wayofpi-ui && npm install && cd ..
```

### Apply API keys

After any update, ensure your `.env` file is set:

```bash
# Create .env from template
cp .env.sample .env

# Edit with your keys
nano .env
vim .env
# or any other editor
```

### Upgrade Bun / npm

Way of Pi requires specific versions:

```bash
# Upgrade bun (if needed)
curl -fsSL https://bun.sh/install | bash

# Upgrade npm (part of node)
npm install -g npm@latest

# Verify
bun --version
node --version
npm --version
```

---

## Troubleshooting

### Merge conflicts

If you have conflicts after updating:

```bash
git status              # See conflicted files
git diff                # View conflicts
# Edit files to resolve
git add <file>
git rebase --continue
```

### Missing dependencies

If dependencies are missing:

```bash
bun install             # Root
cd apps/wayofpi-ui && npm install
```

### Port already in use

If ports are in use:

```bash
# Check what's using port 5173
lsof -i :5173

# Kill processes
sudo kill -9 <PID>
```

### Reset Way of Pi

Last resort:

```bash
# Backup first!
mkdir -p ~/.pi/wop-reset-backup
cp -r .pi agent extensions docs scripts .env .env.sample ~/.pi/wop-reset-backup/

# Reset
git fetch origin
git reset --hard origin/main

# Reinstall
bun install
cd apps/wayofpi-ui && npm install

# Restore .env
cp ~/.pi/wop-reset-backup/.env .
```

---

## Environment Variables

The update script respects these environment variables:

- `WAY_OF_PI_DIR` - Target directory (default: `$(pwd)`)
- `WAY_OF_PI_LOG` - Log file path (default: `/tmp/wop-update.log`)

---

## Contributing

If you're adding new features to Way of Pi:

1. **Update your local copy** before making changes:
   ```bash
   ./scripts/wop-update-simple.sh
   ```

2. **Make your changes** (features, bugs, improvements)

3. **Test thoroughly**

4. **Submit a PR** to [`zerwiz/wayofpi`](https://github.com/zerwiz/wayofpi)

---

## See Also

- [scripts/README.md](./README.md) - All scripts reference
- [apps/wayofpi-ui/README.md](./apps/wayofpi-ui/README.md) - Electron app docs
- [CHANGELOG.md](./CHANGELOG.md) - What's been updated recently

---

*Last updated: $(date +'%Y-%m-%d %H:%M:%S')*
