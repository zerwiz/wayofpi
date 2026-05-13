#!/usr/bin/env bash
# Script to detect hardcoded absolute file paths in the repository
set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")
echo "Scanning $REPO_ROOT for hardcoded paths..."

PATTERNS=(
  '/home/'
  '/var/log/'
  '/etc/'
  '/usr/'
  'C:\\\\'
  'C:/'
)

for pattern in "${PATTERNS[@]}"; do
  echo "Checking for $pattern"
  grep -RInE "$pattern" "$REPO_ROOT" --exclude-dir=.git --exclude="*.lock" || true
done

echo "Done."