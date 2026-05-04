#!/bin/bash
# Command: pi rules check <asset-path>
# Purpose: Validate asset against Pi rules

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATION_DIR="$SCRIPT_DIR/../../../.pi/agent/rules/validation"

if [[ -z "$1" ]]; then
    echo "Usage: pi rules check <asset-path>"
    echo "  Example: pi rules check ./my-extension.ts"
    exit 1
fi

ASSET_PATH="$1"

if [[ ! -f "$ASSET_PATH" ]]; then
    echo "Error: File not found: $ASSET_PATH"
    exit 1
fi

echo "=== PI Rules: Checking $ASSET_PATH ==="
echo ""

# Quick visual check - look for common issues
echo "Checking compliance..."

# 1. Check package.json for permissions
if [[ "$ASSET_PATH" == *"package.json"* ]]; then
    HAS_PERMS=$(grep -c "permissions" "$ASSET_PATH" 2>/dev/null || echo 0)
    SECRET_COUNT=$(grep -cE "(password=|password:|secret=)" "$ASSET_PATH" 2>/dev/null || echo 0)
    
    if [[ $HAS_PERMS -eq 0 ]]; then
        echo "❗ S1.1.1: Missing permissions declaration"
    else
        echo "✅ S1.1.1: Permissions declared"
    fi
    
    if [[ $SECRET_COUNT -gt 0 ]]; then
        echo "❗ S1.1.2: Hardcoded secrets detected"
    fi
fi

# 2. Check TypeScript files for type declarations
if [[ "$ASSET_PATH" == *.ts ]]; then
    TYPE_DECL=$(grep -c "declare" "$ASSET_PATH" 2>/dev/null || echo 0)
    if [[ $TYPE_DECL -eq 0 ]]; then
        echo "❗ M1.1: Missing TypeScript declarations"
    else
        echo "✅ M1.1: TypeScript declarations present"
    fi
fi

echo ""
echo "Total checks: 2"
echo ""
echo "To run full validation:"
echo "  pi run --validation $ASSET_PATH"