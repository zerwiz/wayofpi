---
description: Analyze codebase for unused imports, functions, and files using grep and find
---
Perform a comprehensive code review of $1 (directory or file) focusing on:

# 1. Unused Code Detection
## Check for unused imports
```bash
echo "=== Checking for unused imports ==="
$1
```

## Check for unused functions
```bash
echo "=== Checking for unused functions ==="
grep -rn "^[^/]*function \|^[^/]*const \|^[^/]*let " $1 --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | head -50
```

## Check for dead code
```bash
echo "=== Checking for commented-out code ==="
grep -rn "^//.*function\|^//.*const\|^//.*let\|^/\*" $1 --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | head -30
```

# 2. File Analysis - Empty or Small Files
```bash
echo "=== Finding empty or small files ==="
find $1 -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.json" \) -size -10c 2>/dev/null
find $1 -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.json" -size +500c 2>/dev/null
```

# 3. Import Analysis
```bash
echo "=== Analyzing imports ==="
grep -rh "^import\|^from '.*'\|^from \\"" $1 --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | cut -d'"' -f2 | cut -d"'" -f2 | sort -u
echo "=== Finding circular dependencies ==="
```

# 4. Code Quality Issues
```bash
echo "=== Checking for TODO/FIXME comments ==="
grep -rn "TODO\|FIXME\|XXX\|@deprecated" $1 --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | head -20
```

# 5. Unused Dependencies
```bash
echo "=== Package.json vs actual usage ==="
if [ -f "$1/package.json" ]; then
  grep -A 50 '"dependencies"' $1/package.json | grep '"' || true
fi
```

# 6. Duplicate Code Patterns
```bash
echo "=== Looking for similar function signatures ==="
grep -rn "function \|const \|let \|export " $1 --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | awk '{print $1":"$2}' | head -40
```

