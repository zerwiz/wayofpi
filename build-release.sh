#!/bin/bash
# build-release.sh - Create Way of Pi release package

OUTPUT_DIR="$(dirname "${BASH_SOURCE[0]}")/release/wayofpi-release-v1.0.1-amd64"
SOURCE_DIR="$(dirname "${BASH_SOURCE[0]}")"

# Create release directory
OUTPUT_DIR="$(dirname "${BASH_SOURCE[0]}")/release/wayofpi-release-v1.0.1-amd64"
[ -d "$OUTPUT_DIR" ] && rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Copy essential directories (allowlist)
cp -r "$SOURCE_DIR"/{agent,apps,extensions,scripts,images} "$OUTPUT_DIR/" 2>/dev/null || true

# Copy essential root files (allowlist)
[ -f "$SOURCE_DIR/README.md" ] && cp "$SOURCE_DIR/README.md" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/CHANGELOG.md" ] && cp "$SOURCE_DIR/CHANGELOG.md" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/justfile" ] && cp "$SOURCE_DIR/justfile" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/LICENSE" ] && cp "$SOURCE_DIR/LICENSE" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/pienv" ] && cp "$SOURCE_DIR/pienv" "$OUTPUT_DIR/"

# Copy selective user manuals
mkdir -p "$OUTPUT_DIR/docs"
cp "$SOURCE_DIR/docs"/{HOW_TO_USE_AGENTS.md,HOW_TO_USE_EXTENSIONS.md,HOW_TO_USE_SKILLS.md,HOW_TO_USE_TOOLS.md,STARTUP_GUIDE.md} "$OUTPUT_DIR/docs/" 2>/dev/null || true
[ -f "$SOURCE_DIR/PI-COMMANDS.md" ] && cp "$SOURCE_DIR/PI-COMMANDS.md" "$OUTPUT_DIR/docs/"
[ -f "$SOURCE_DIR/AGENTS.md" ] && cp "$SOURCE_DIR/AGENTS.md" "$OUTPUT_DIR/docs/"
[ -f "$SOURCE_DIR/plans/TERMINAL_USAGE_GUIDE.md" ] && cp "$SOURCE_DIR/plans/TERMINAL_USAGE_GUIDE.md" "$OUTPUT_DIR/docs/"

# Copy .env files
[ -f "$SOURCE_DIR/.env" ] && cp "$SOURCE_DIR/.env" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/.env.sample" ] && cp "$SOURCE_DIR/.env.sample" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/.env.example" ] && cp "$SOURCE_DIR/.env.example" "$OUTPUT_DIR/"

# Create .pi directory with settings
mkdir -p "$OUTPUT_DIR/.pi"
[ ! -f "$OUTPUT_DIR/.pi/settings.json" ] && cat > "$OUTPUT_DIR/.pi/settings.json" << 'SETTINGS'
{
  "settings": {
    "extension": [{"type": "ai", "name": "Ollama Qwen", "enabled": true}],
    "teams": [],
    "prompt": ""
  }
}
SETTINGS
[ -f "$SOURCE_DIR/.pi/settings.json" ] && cp "$SOURCE_DIR/.pi/settings.json" "$OUTPUT_DIR/.pi/settings.json"

# Create start script
cat > "$OUTPUT_DIR/start-wayofpi-electron.sh" << 'STARTER'
#!/bin/bash
set -e

check_deps() {
    if ! command -v bun &>/dev/null; then
        echo "Error: bun is required. Install with:"
        echo "  sudo apt install bun npm nodejs just jq build-essential"
        exit 1
    fi
}
install_deps() {
    [ ! -d "node_modules" ] && bun install || true
}
check_deps
install_deps
echo "Starting Way of Pi..."
bun run start-wayofpi-electron.sh --dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" "$@"
STARTER
chmod +x "$OUTPUT_DIR/start-wayofpi-electron.sh"

# Copy main start scripts
[ -f "$SOURCE_DIR/start-wayofpi-electron.sh" ] && cp "$SOURCE_DIR/start-wayofpi-electron.sh" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/start-wayofpi-ui.sh" ] && cp "$SOURCE_DIR/start-wayofpi-ui.sh" "$OUTPUT_DIR/"
[ -f "$SOURCE_DIR/start-wayofpi.sh" ] && cp "$SOURCE_DIR/start-wayofpi.sh" "$OUTPUT_DIR/"

# Copy LICENSE if exists
[ -f "$SOURCE_DIR/LICENSE" ] && cp "$SOURCE_DIR/LICENSE" "$OUTPUT_DIR/"

# Create release README
cat > "$OUTPUT_DIR/README.release" << 'README'
# Way of Pi Release

This package includes the complete Way of Pi desktop shell for Pi Coding Agent.

## IMPORTANT: Bun-based Electron app (not pre-compiled binary)

You MUST have bun, npm, git, and just installed before first use.

## Quick Installation

### Install system dependencies
```bash
sudo apt update && sudo apt install -y bun npm nodejs just jq build-essential libgtk-3-0 libnotify4 xdg-user-dirs
```

### Copy files
```bash
rsync -a /path/to/release/wayofpi-release-v1.0.1-amd64/ /opt/wayofpi/
cd /opt/chmod +x /opt/wayofpi/start-wayofpi-electron.sh
```

### Edit API keys
```bash
cd /opt/wayofpi
cp ~/.pi/.env.example ~/.pi/.env
nano ~/.pi/.env
```

### Run
```bash
./start-wayofpi-electron.sh
```

## Uninstall
```bash
sudo rm -rf /opt/wayofpi
rm -rf ~/.pi ~/.config/wayofpi
```
README

# Create INSTALL.md
cat > "$OUTPUT_DIR/INSTALL.md" << 'INSTALL'
# Installation Notes

## Required System Packages
Install before first use:
```bash
sudo apt update && sudo apt install -y \
    bun npm nodejs just jq build-essential \
    libgtk-3-0 libnotify4 xdg-user-dirs
```

## API Keys
Create `~/.pi/.env` with your API keys:
```bash
cp ~/.pi/.env.example ~/.pi/.env
```

## Optional: Install to /opt
```bash
sudo rsync -a wayofpi-release-v1.0.1-amd64/ /opt/wayofpi/
```
INSTALL

echo "Release created: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR/"
