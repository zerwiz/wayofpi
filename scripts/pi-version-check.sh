#!/usr/bin/env bash
set -euo pipefail

# Way of Pi — check installed pi version vs pinned version
# 
# Usage:
#   ./scripts/pi-version-check.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load .env if it exists
if [[ -f "$ROOT/.env" ]]; then
    # We use a subshell to avoid polluting the current shell if this script was sourced,
    # but since it has a shebang it's fine.
    set -a
    source "$ROOT/.env"
    set +a
fi

PINNED_VERSION="${PI_PINNED_VERSION:-0.74.0}"

if [[ ! -f "$ROOT/node_modules/.bin/pi" ]]; then
    echo "[ERROR] Project-local 'pi' binary not found. Run 'bun install'."
    exit 1
fi

# Get the first line and trim any whitespace
CURRENT_VERSION=$("$ROOT/node_modules/.bin/pi" --version | head -n1 | xargs)

if [[ "$CURRENT_VERSION" != "$PINNED_VERSION" ]]; then
    echo "[WARN] Pi version mismatch!"
    echo "  Installed: $CURRENT_VERSION"
    echo "  Pinned:    $PINNED_VERSION"
    echo ""
    echo "  Run 'just pi-fix-version' to reinstall the pinned version."
    exit 1
fi

echo "[OK] Pi version matches pinned version ($PINNED_VERSION)."
