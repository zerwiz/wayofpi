#!/usr/bin/env bash
set -euo pipefail

echo "[ghm] Checking for GitHub CLI (gh)..."

if command -v gh >/dev/null 2>&1; then
  echo "[ghm] gh is already installed: $(gh --version | head -n1)"
else
  echo "[ghm] gh not found. Please install it manually:"
  echo "  - On Debian/Ubuntu:  sudo apt install gh"
  echo "  - On macOS (Homebrew):  brew install gh"
  echo "See: https://github.com/cli/cli#installation"
  exit 1
fi

echo "[ghm] Checking authentication status..."
set +e
gh auth status >/dev/null 2>&1
status=$?
set -e

if [ "$status" -ne 0 ]; then
  echo "[ghm] You are not authenticated with GitHub CLI."
  echo "[ghm] Run: gh auth login"
  exit 1
fi

echo "[ghm] gh CLI is installed and authenticated."

