#!/bin/bash
# Simple Way of Pi update script
# Usage: ./wop-update-simple.sh [force]

set -euo pipefail

REPO_URL="https://github.com/zerwiz/wayofpi.git"

usage() {
    echo "Usage: $(basename "$0") [options]"
    echo "Options:"
    echo "  --force  Force update (discard local changes)"
    echo "  --backup Create backup before update"
    echo "  --help   Show this help"
}

FORCE=false
BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force) FORCE=true; shift ;;
        --backup) BACKUP=true; shift ;;
        --help) usage; exit 0 ;;
        *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
done

# Check git repo
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository"
    exit 1
fi

# Backup
if [ "$BACKUP" = true ]; then
    BACKUP_DIR=".wop-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r .pi agent extensions docs scripts apps/wayofwork-ui .env .env.sample "$BACKUP_DIR/" 2>/dev/null || true
    echo "Backup created: $BACKUP_DIR"
fi

# Pull changes
if [ "$FORCE" = true ]; then
    git fetch origin
    git reset --hard origin/main
    echo "Hard reset completed"
else
    git pull --rebase origin main
    echo "Changes rebased"
fi

# Install dependencies
echo "Installing dependencies..."
bun install
cd apps/wayofwork-ui && npm install && cd ../..

# Restore from backup if needed
if [ "$BACKUP" = true ] && [ "$FORCE" != true ]; then
    LATEST_BACKUP=$(ls -t .wop-backup-* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        echo "Restoring from backup: $LATEST_BACKUP"
        rm -rf .env .pi agent extensions docs scripts apps/wayofwork-ui
        cp -r "$LATEST_BACKUP"/* . 2>/dev/null || true
    fi
fi

echo "Update completed!"
echo "Next: Apply your .env file if needed"
