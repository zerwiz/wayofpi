#!/bin/bash
# Way of Pi Recovery Script
# Reactivates from backup if build is broken

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default backup location
BACKUP_ROOT="${WAY_OF_PI_BACKUP:-$HOME/.pi/wayofpi-backup}"
REPO_DIR="${WAY_OF_PI_DIR:-$(pwd)}"
REPO_NAME="wayofpi"

usage() {
    cat << USAGE
Usage: $(basename "$0") [options]

Options:
  -h, --help                    Show this help
  -a, --auto                    Auto-detect and try to fix issues
  -l, --list-backups            List available backups
  -r, --restore [name]          Restore from specific backup
  -f, --force                   Force restore (overwrite current state)
  -n, --new-backup              Create new backup before restore
  --reinstall                   Reinstall dependencies after restore
  --full                       Full recovery: restore everything
  --deps                       Just reinstall dependencies
  --env                        Restore .env from backup

Examples:
  # List available backups
  ./wop-recover.sh --list-backups

  # Auto-detect issues and fix
  ./wop-recover.sh --auto

  # Restore from most recent backup
  ./wop-recover.sh --restore latest

  # Full recovery with new backup
  ./wop-recover.sh --full

  # Reinstall dependencies
  ./wop-recover.sh --deps

USAGE
}

# Detect broken build
is_broken() {
    # Check if Way of Pi is running
    if ! command -v bun &> /dev/null && ! command -v node &> /dev/null; then
        echo "Bun/node not found"
        return 0
    fi
    
    # Check if .pi/config.json exists and is valid
    if [ ! -f ".pi/settings.json" ]; then
        echo "Settings file missing"
        return 0
    fi
    
    # Check if apps/wayofwork-ui exists
    if [ ! -d "apps/wayofwork-ui" ]; then
        echo "UI directory missing"
        return 0
    fi
    
    # Check if dependencies are installed
    if [ ! -f "apps/wayofwork-ui/node_modules/.package-lock.json" ]; then
        echo "Dependencies missing"
        return 0
    fi
    
    # Check if .pi/extensions/ has shims
    if [ ! -d ".pi/extensions" ]; then
        echo "Extensions shims missing"
        return 0
    fi
    
    return 1
}

# List backups
list_backups() {
    echo -e "${BLUE}Available backups:${NC}\n"
    
    # Check multiple backup locations
    if [ -d "$BACKUP_ROOT" ]; then
        ls -lth "$BACKUP_ROOT"/*.gz 2>/dev/null || true
        ls -lth "$BACKUP_ROOT"/ 2>/dev/null || true
    fi
    
    # Check global backup location
    if [ -d "$HOME/.pi/wayofpi-backup" ]; then
        ls -lth "$HOME/.pi/wayofpi-backup" 2>/dev/null || true
    fi
    
    # Check any .wop-backup-* in repo
    ls -lth ".wop-backup-*" 2>/dev/null || true
    
    if [ -z "$(ls -A 2>/dev/null)" ]; then
        echo -e "${RED}No backups found${NC}"
        echo -e "${YELLOW}Tip: Run './wop-recover.sh --full' to create one${NC}"
    fi
}

# Create new backup
create_backup() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local new_backup="${BACKUP_ROOT}/wop-backup-${timestamp}"
    
    mkdir -p "$new_backup"
    echo -e "${YELLOW}Creating new backup: ${new_backup}${NC}"
    
    # Copy critical directories
    cp -r .pi/ "$new_backup/" 2>/dev/null || true
    cp -r agent/ "$new_backup/" 2>/dev/null || true
    cp -r extensions/ "$new_backup/" 2>/dev/null || true
    cp -r docs/ "$new_backup/" 2>/dev/null || true
    cp -r scripts/ "$new_backup/" 2>/dev/null || true
    cp -r projects/ "$new_backup/" 2>/dev/null || true
    cp -r apps/wayofwork-ui/ "$new_backup/" 2>/dev/null || true
    
    # Copy configuration files
    [ -f ".env" ] && cp .env "$new_backup/" || true
    [ -f ".env.sample" ] && cp .env.sample "$new_backup/" 2>/dev/null || true
    [ -f ".pi/settings.json" ] && cp .pi/settings.json "$new_backup/" || true
    [ -f ".pi/config.json" ] && cp .pi/config.json "$new_backup/" 2>/dev/null || true
    [ -f ".pi/agents/teams.yaml" ] && cp .pi/agents/teams.yaml "$new_backup/" || true
    
    # Copy customizations
    [ -f "theme.json" ] && cp theme.json "$new_backup/" || true
    [ -f "custom-schemas.json" ] && cp custom-schemas.json "$new_backup/" || true
    
    echo -e "${GREEN}Backup created: ${new_backup}${NC}"
    echo "$new_backup"
}

# Restore from backup
restore_from_backup() {
    local backup="$1"
    
    if [ -z "$backup" ]; then
        # Try to get most recent backup
        local latest_backup=$(ls -t .wop-backup-* 2>/dev/null | head -1 || \
                              ls -t "$BACKUP_ROOT"/* 2>/dev/null | head -1 || \
                              ls -t "$HOME/.pi/wayofpi-backup"* 2>/dev/null | head -1 || \
                              echo "")
        
        if [ -z "$latest_backup" ]; then
            echo -e "${RED}No backups found to restore from${NC}"
            return 1
        fi
        
        backup="$latest_backup"
        echo -e "${BLUE}Using most recent backup: ${backup}${NC}"
    fi
    
    echo -e "${BLUE}Restoring from: ${backup}${NC}"
    
    # Create temporary restore location
    local tmp_restore=".tmp-restore-$$"
    mkdir -p "$tmp_restore"
    
    # Extract backup contents
    if [ -d "$backup" ]; then
        echo -e "${YELLOW}Copying backup files to: ${tmp_restore}${NC}"
        cp -r "$backup"/* "$tmp_restore/" 2>/dev/null || true
    fi
    
    # If backup is gzipped, extract first
    if [ -f "$backup" ]; then
        echo -e "${YELLOW}Backup is gzipped, extracting...${NC}"
        mkdir -p "$tmp_restore"
        echo "$backup" | bun xz -dc > "$tmp_restore/extracted.tar.gz" 2>/dev/null || true
        tar xzf "$tmp_restore/extracted.tar.gz" -C "$tmp_restore/" 2>/dev/null || true
    fi
    
    # Merge into current state
    echo -e "${YELLOW}Merging backup into current state...${NC}"
    
    # Restore extensions (critical!)
    [ -d "$tmp_restore/.pi/extensions" ] && \
        [ -d ".pi" ] && \
        rm -rf .pi/extensions && \
        cp -r "$tmp_restore/.pi/extensions" .pi/ || true
    
    # Restore agent sessions
    [ -d "$tmp_restore/agent" ] && \
        mv -f "$tmp_restore/agent" agent || true
    
    # Restore custom configurations
    [ -f "$tmp_restore/.env" ] && \
        echo "Would restore .env (use --env flag or merge manually)" || true
    
    # Restore agent definitions
    [ -d "$tmp_restore/agent/*" ] && \
        cp -r "$tmp_restore/agent"/* agent/ || true
    
    # Restore projects
    [ -d "$tmp_restore/projects" ] && \
        cp -r "$tmp_restore/projects" projects || true
    
    # Restore docs
    [ -d "$tmp_restore/docs" ] && \
        cp -r "$tmp_restore/docs" docs 2>/dev/null || true
    
    # Restore documentation directory
    [ -d "$tmp_restore/scripts" ] && \
        cp -r "$tmp_restore/scripts" scripts 2>/dev/null || true
    
    echo -e "${GREEN}Restore from backup complete${NC}"
    
    # Cleanup temp
    rm -rf "$tmp_restore"
    
    echo -e "${BLUE}Verify restoration:${NC}"
    echo -e "  1. Run './wop-recover.sh --dependencies'"
    echo -e "  2. Check for errors: git status"
    echo -e "  3. Restart wayofpi-electron.sh"
}

# Reinstall dependencies
reinstall_deps() {
    echo -e "${BLUE}Reinstalling dependencies...${NC}"
    
    # Root dependencies
    bun install
    echo -e "${GREEN}Root dependencies installed${NC}"
    
    # UI dependencies
    cd apps/wayofwork-ui
    npm install
    echo -e "${GREEN}UI dependencies installed${NC}"
    
    # Clean cache
    rm -rf node_modules/.cache 2>/dev/null || true
    
    cd ../..
    
    echo -e "${GREEN}Dependencies reinstalled${NC}"
}

# Auto-detect and fix
auto_fix() {
    echo -e "${BLUE}=== AUTO-DETECT AND FIX ===${NC}"
    echo
    
    local issues=0
    
    # Check Bun
    if ! command -v bun &> /dev/null; then
        echo -e "${RED}Bun not found${NC}"
        curl -fsSL https://bun.sh/install | bun install
        ((issues++))
    fi
    
    # Check git repo
    if [ ! -d ".git" ]; then
        echo -e "${RED}Not a git repository${NC}"
        return 1
    fi
    
    # Check .env
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}.env not found, creating from sample${NC}"
        cp .env.sample .env
    fi
    
    # Check dependencies
    if [ ! -f "apps/wayofwork-ui/node_modules/.package-lock.json" ]; then
        echo -e "${YELLOW}Dependencies missing, installing...${NC}"
        cd apps/wayofwork-ui && npm install && cd ..
    fi
    
    # Check extensions shims
    if [ ! -d ".pi/extensions" ]; then
        echo -e "${YELLOW}Extensions shims missing, creating...${NC}"
        mkdir -p .pi/extensions
        ln -sf ../../extensions/*.ts .pi/extensions/ 2>/dev/null || \
            (echo "No extensions or symlinks failed")
    fi
    
    # Check agent config
    if [ ! -f ".pi/settings.json" ]; then
        echo -e "${YELLOW}Settings.json missing, creating...${NC}"
        echo '{"extensions": [], "theme": "default"}' > .pi/settings.json
    fi
    
    echo
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}No critical issues found${NC}"
        echo -e "${YELLOW}Running dependency check...${NC}"
        bun check
    else
        echo -e "${YELLOW}Found and fixed $issues issue(s)${NC}"
    fi
    
    echo
    echo -e "${BLUE}=== Auto-fix complete ===${NC}"
}

# Full recovery
full_recovery() {
    echo -e "${BLUE}=== FULL RECOVERY MODE ===${NC}"
    echo
    
    # Create new backup first
    create_backup
    
    # List current backups
    list_backups
    echo
    
    read -p "Restore from latest backup? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        restore_from_backup
        
        # Reinstall dependencies
        if [ "$FORCE" != true ]; then
            reinstall_deps
        fi
        
        echo
        echo -e "${GREEN}=== Full recovery complete ===${NC}"
        echo
        echo -e "${BLUE}Next steps:${NC}"
        echo -e "  1. Apply your API keys if changed:"
        echo -e "     nano .env"
        echo -e "  2. Restart Way of Pi:"
        echo -e "     ./start-wayofpi-electron.sh"
        echo
        echo -e "${YELLOW}Tip: Keep backups in: ${BACKUP_ROOT}${NC}"
    fi
}

# Main
case "${1:-}" in
    --help|-h)
        usage
        ;;
    --list-backups|-l)
        list_backups
        ;;
    --restore)
        restore_from_backup "${2:-}"
        ;;
    --full)
        full_recovery
        ;;
    --deps|--dependencies)
        reinstall_deps
        ;;
    --env)
        echo -e "${BLUE}Restoring .env from backup...${NC}"
        LATEST=$(ls -t .wop-backup-* 2>/dev/null | head -1 || \
                  ls -t "$BACKUP_ROOT"/.env 2>/dev/null | head -1 || \
                  ls -t "$HOME/.pi/wayofpi-backup"/* 2>/dev/null | head -1 || \
                  echo "")
        if [ -n "$LATEST" ]; then
            cp "$LATEST" .env
            echo -e "${GREEN}.env restored${NC}"
        else
            echo -e "${RED}No .env backup found${NC}"
        fi
        ;;
    --auto|-a)
        auto_fix
        ;;
    *)
        # Default: just check for broken build
        echo -e "${BLUE}=== Way of Pi Recovery Checker ===${NC}"
        echo
    
        if is_broken; then
            echo -e "${RED}Build is broken!${NC}"
            echo
            echo -e "${YELLOW}Options:${NC}"
            echo -e "  --list-backups    List available backups"
            echo -e "  --full            Full recovery with new backup"
            echo -e "  --auto            Auto-fix known issues"
            echo -e "  --deps            Reinstall dependencies"
            echo -e "  --help            Show this help"
            echo
            echo -e "${YELLOW}Or restore manually:${NC}"
            echo -e "  ./wop-recover.sh --full"
            exit 1
        else
            echo -e "${GREEN}Build appears healthy${NC}"
            echo
            echo -e "${BLUE}Tip: Run './wop-recover.sh --list-backups' to see your backups${NC}"
        fi
        ;;
esac
