#!/bin/bash
# Command: pi rules list
# Purpose: List all available developer rules

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULES_DIR="$SCRIPT_DIR/.."

echo "=== PI Rules: Available Documents ==="
echo ""

# Function to format rule info
format_rule() {
    local filename="$1"
    local path="${RULES_DIR}/${filename}"
    
    if [[ -f "$path" ]]; then
        local description=$(head -n 5 "$path" | grep -oP "name: .+" | head -1 | sed 's/name: //')
        echo "  - 📄 $filename"
    else
        echo "  - ❌ $filename (not found)"
    fi
}

# List all markdown files in rules directory
if [[ -d "$RULES_DIR" ]]; then
    cd "$RULES_DIR"
    
    # Show critical rules first
    echo "🔴 Critical Priority:"
    for f in ../architecture.md ../securitypolicy.md ../validation.md 2>/dev/null; do
        if [[ -f "$f" ]]; then
            format_rule "$(basename $f)"
        fi
    done
    
    echo ""
    echo "🟠 High Priority:"
    for f in ../extensions.md ../skills.md ../packages.md 2>/dev/null; do
        if [[ -f "$f" ]]; then
            format_rule "$(basename $f)"
        fi
    done
    
    echo ""
    echo "🔵 Medium Priority:"
    for f in ../modes.md ../errors.md 2>/dev/null; do
        if [[ -f "$f" ]]; then
            format_rule "$(basename $f)"
        fi
    done
    
    echo ""
    count=$(find "$RULES_DIR" -maxdepth 1 -name "*.md" | wc -l)
    echo ""
    echo "Total: $count rule documents"
else
    echo "Rules directory not found at $RULES_DIR"
fi