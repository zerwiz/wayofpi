#!/bin/bash
# Command: pi rules read <rule-file>
# Purpose: Read content of specific rule file

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "$1" ]]; then
    echo "Usage: pi rules read <rule-file>"
    echo "  Example: pi rules read securitypolicy.md"
    exit 1
fi

RULE_FILE="$1"

echo "=== PI Rules: Read $RULE_FILE ==="
echo ""

# Try global rules first
if [[ -f "$SCRIPT_DIR/../$RULE_FILE" ]]; then
    cat "$SCRIPT_DIR/../$RULE_FILE"
    exit 0
fi

# Try workspace rules
WORKSPACE_RULES="$SCRIPT_DIR/../../.pi/rules/$RULE_FILE"
if [[ -f "$WORKSPACE_RULES" ]]; then
    cat "$WORKSPACE_RULES"
    exit 0
fi

echo "Error: Rule file not found:"
echo "  - ~/.pi/rules/$RULE_FILE (global)"
echo "  - ./.pi/rules/$RULE_FILE (workspace)"
echo ""
echo "Available rules:"
pi rules list 2>/dev/null || echo "  (no rules found)"