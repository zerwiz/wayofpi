#!/bin/bash
# Way of Pi System Update Script
# Updates Way of Pi from the main GitHub repository
# Usage: ./wop-update-system.sh [options]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/zerwiz/wayofpi.git"
REPO_DIR="${WAY_OF_PI_DIR:-$(pwd)}"
LOG_FILE="${WAY_OF_PI_LOG:-/tmp/wop-update.log}"

# Default options
UPDATE_ONLY=false
SYNC_ONLY=false
FORCE=false
DRY_RUN=false
BACKUP=false

usage() {
    cat << USAGE
Usage: $(basename "$0") [OPTIONS]

Options:
  -h, --help           Show this help message
  -u, --update         Update Way of Pi from main repository (default)
  -s, --sync           Sync only: merge changes without forcing updates
  -f, --force          Force update: overwrite local changes
  -b, --backup         Backup before update
  -d, --dry-run        Show what would be done without making changes
  --repo URL           Git repository URL (default: ${REPO_URL})
  --target DIR         Target directory (default: repo root)

Examples:
  # Update with backup
  ./wop-update-system.sh --backup

  # Force update (overwrite local changes)
  ./wop-update-system.sh --force

  # Sync only (merge changes)
  ./wop-update-system.sh --sync

  # Dry run (preview changes)
  ./wop-update-system.sh --dry-run

  # Custom repository
  ./wop-update-system.sh --repo https://github.com/yourname/wayofpi.git

USAGE
}

# Check prerequisites
check_prerequisites() {
    local missing=()
    
    # Check bun
    if ! command -v bun &> /dev/null; then
        missing+=("bun")
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        missing+=("git")
    fi
    
    # Check node/npm (for extensions)
    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        printf "${RED}Error: Missing prerequisites: "
        printf "%s," "${missing[@]}"
        printf "${NC}\n"
        printf "${YELLOW}Please install: "
        
        for tool in "${missing[@]}"; do
            echo "$tool"
        done
        
        printf "\n"
        exit 1
    fi
}

# Backup current state
do_backup() {
    local backup_dir="${REPO_DIR}/.wop-backup-$(date +%Y%m%d-%H%M%S)"
    
    if [ "$FORCE" != true ]; then
        if [ -d "$backup_dir" ]; then
            printf "${RED}Error: Backup directory already exists: %s\n" "$backup_dir"
            exit 1
        fi
    fi
    
    printf "${YELLOW}Creating backup at: %s\n" "$backup_dir"
    
    if [ "$DRY_RUN" != true ]; then
        mkdir -p "$backup_dir"
        cp -r .pi/ "$backup_dir/" 2>/dev/null || true
        cp -r agent/ "$backup_dir/" 2>/dev/null || true
        cp -r extensions/ "$backup_dir/" 2>/dev/null || true
        cp -r docs/ "$backup_dir/" 2>/dev/null || true
        cp -r scripts/ "$backup_dir/" 2>/dev/null || true
        cp -r projects/ "$backup_dir/" 2>/dev/null || true
        cp -r images/ "$backup_dir/" 2>/dev/null || true
        cp -r apps/wayofpi-ui/ "$backup_dir/" 2>/dev/null || true
        cp -r specs/ "$backup_dir/" 2>/dev/null || true
        cp -r tools/ "$backup_dir/" 2>/dev/null || true
    fi
    
    if [ "$FORCE" != true ]; then
        printf "${GREEN}Backup created: %s\n" "$backup_dir"
    fi
}

# Pull latest changes
pull_changes() {
    local git_dir="${WAY_OF_PI_DIR}"
    
    if [ "$DRY_RUN" != true ]; then
        cd "$git_dir"
        git fetch origin
        printf "${BLUE}Fetching latest changes from %s...\n" "origin"
        
        # Determine if we should hard reset or merge
        if [ "$FORCE" = true ]; then
            # Hard reset - discard all local changes
            git reset --hard origin/main
            printf "${GREEN}Hard reset to origin/main (discarded local changes)\n"
        else
            # Try to merge
            git pull --rebase origin main
            printf "${GREEN}Rebased and merged changes\n"
        fi
        
        # If merge conflicts exist
        if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
            printf "${YELLOW}Rebase in progress with conflicts\n"
            printf "${YELLOW}Please resolve conflicts and run: git rebase --continue\n"
            return 1
        fi
    fi
}

# Rebuild dependencies
rebuild_deps() {
    if [ "$SYNC_ONLY" = true ]; then
        return 0
    fi
    
    printf "${BLUE}Installing/updating dependencies...\n"
    
    # Install Bun dependencies (root)
    if [ -f package.json ]; then
        bun install || bnpm install
        printf "${GREEN}Root dependencies installed\n"
    fi
    
    # Install UI dependencies
    if [ -f "apps/wayofpi-ui/package.json" ]; then
        cd apps/wayofpi-ui
        bun install || npm install
        printf "${GREEN}UI dependencies installed\n"
        cd ../..
    fi
}

# Update Electron app
update_electron() {
    if [ ! -d "apps/wayofpi-ui/node_modules" ]; then
        printf "${YELLOW}Electron dependencies not installed yet\n"
        return
    fi
    
    if [ "$FORCE" = true ]; then
        printf "${YELLOW}Removing old Electron app...\n"
        rm -rf apps/wayofpi-ui/node_modules/.cache/
    fi
    
    printf "${BLUE}Electron app is up to date on this commit\n"
}

# Restore backups if needed
restore_on_failure() {
    if [ "$FORCE" != true ] && [ -n "$BACKUP" ]; then
        local latest_backup="${REPO_DIR}/.wop-backup-*"
        local latest_backup=$(ls -t "$latest_backup" 2>/dev/null | head -1)
        
        if [ -n "$latest_backup" ]; then
            printf "${YELLOW}Restore from backup: %s\n" "$latest_backup"
            
            if [ "$DRY_RUN" != true ]; then
                rm -rf "${REPO_DIR}/.wop-upgrade-*"
                cp -r "$latest_backup"/* "$REPO_DIR/"
                printf "${GREEN}Restored from backup\n"
            fi
        fi
    fi
}

# Main update function
main() {
    local git_dir="${WAY_OF_PI_DIR}"
    
    printf "${GREEN}========================================\n"
    printf "  Way of Pi System Updator\n"
    printf "${GREEN}========================================\n\n"
    
    # Check if repository exists
    if [ ! -d ".git" ]; then
        printf "${RED}Error: Not a git repository\n"
        exit 1
    fi
    
    # Check current branch
    local current_branch=$(git branch | grep \* | sed 's/\* //')
    printf "${BLUE}Current branch: %s\n" "$current_branch"
    
    # Get current commit
    local current_commit=$(git rev-parse HEAD)
    printf "${BLUE}Current commit: %s\n\n" "$current_commit"
    
    # Check prerequisites
    check_prerequisites
    
    # Dry run check
    if [ "$DRY_RUN" = true ]; then
        printf "${YELLOW}=== DRY RUN MODE ===\n"
        printf "${YELLOW}This will not make any changes to your system\n\n"
    fi
    
    # Backup if requested
    if [ "$BACKUP" = true ]; then
        do_backup
        printf "\n"
    fi
    
    # Pull latest changes
    pull_changes
    
    # Rebuild dependencies
    rebuild_deps
    
    # Update Electron
    update_electron
    
    # Get latest commit
    local latest_commit=$(git rev-parse HEAD)
    printf "${BLUE}Latest commit: %s\n" "$latest_commit"
    
    # Show updated package version if available
    if [ -f "package.json" ]; then
        local new_version=$(jq -r '.version' package.json)
        printf "${BLUE}New version: %s\n\n" "$new_version"
    fi
    
    # Success message
    printf "${GREEN}========================================\n"
    printf "  Update completed successfully!\n"
    printf "${GREEN}========================================\n\n"
    
    # Restore on failure if needed
    restore_on_failure
    
    # Show next steps
    printf "${BLUE}Next steps:\n"
    printf "  1. Check for any merge conflicts:\n"
    printf "     git status\n"
    printf "     git diff\n\n"
    
    printf "  2. If conflicts exist, resolve them and run:\n"
    printf "     git rebase --continue\n\n"
    
    printf "  3. Apply API keys:\n"
    printf "     cp .env.sample .env\n"
    printf "     nano .env  # Add your keys\n\n"
    
    printf "  4. Restart Way of Pi:\n"
    printf "     ./start-wayofpi-electron.sh\n\n"
    
    printf "========================================\n"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -u|--update)
            UPDATE_ONLY=true
            shift
            ;;
        -s|--sync)
            SYNC_ONLY=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --repo)
            REPO_URL="$2"
            shift 2
            ;;
        --target)
            REPO_DIR="$2"
            shift 2
            ;;
        *)
            printf "${RED}Unknown option: %s\n" "$1"
            usage
            exit 1
            ;;
    esac
done

# Default to update mode
if [ "$SYNC_ONLY" != true ]; then
    UPDATE_ONLY=true
fi

# Execute main function
main
