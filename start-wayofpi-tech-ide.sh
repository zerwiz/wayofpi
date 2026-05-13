#!/usr/bin/env bash
# Start Way of Pi Technical IDE (standalone Electron)
# This runs the Electron app directly, bypassing the web servers

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ELECTRON_DIR="$ROOT/apps/wayofpi"

if [[ ! -d "$ELECTRON_DIR" ]]; then
	echo "error: missing $ELECTRON_DIR" >&2
	exit 1
fi

cd "$ELECTRON_DIR" 2>/dev/null || exit 1

# Kill any existing Electron/Terminal processes
echo "Cleaning up existing processes..."

pkill -9 -f "wayofpi$" 2>/dev/null || true
pkill -9 -f "electron.*wayofpi" 2>/dev/null || true
pkill -9 -f "node.*3333$" 2>/dev/null || true
pkill -9 -f "node.*3334$" 2>/dev/null || true
sleep 1

# Check bun
if ! command -v bun >/dev/null 2>&1; then
	echo "error: bun is required" >&2
	exit 1
fi

# Install if needed
if [ ! -d node_modules ]; then
	echo "Installing dependencies with bun..."
	bun install
else
	echo "Dependencies up to date."
fi

# Start the standalone Electron app (Terminal and VSCode in Electron)
echo "Starting Way of Pi Technical IDE Electron app..."
exec bun run electron:dev
