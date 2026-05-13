# PI Rules Commands

> **Purpose**: User-facing commands to interact with Pi rules system
> **Install**: Already available in `pi run` interface
> **Usage**: Run any rule command directly at CLI or via interface

---

## Rule Commands

### `pi rules list`

**Lists all available rules** in the rules folder.

**Output**:
```json
{
  "success": true,
  "rules": [
    {
      "filename": "architecture.md",
      "location": "global"
    },
    {
      "filename": "extensions.md", 
      "location": "global"
    },
    {
      "filename": "securitypolicy.md",
      "location": "global"
    }
  ]
}
```

**Usage**:
```bash
pi rules list

pi rules list --global
pi rules list --workspace
```

---

### `pi rules read <rule-file>`

**Reads specific rule content**.

**Parameters**:
- `<rule-file>`: Name of rule file (e.g., `extensions.md`, `securitypolicy.md`)

**Usage**:
```bash
pi rules read extensions.md
pi rules read securitypolicy.md
pi rules read architecture.md
```

---

### `pi rules check <asset-path>`

**Validates asset against rules**.

**Checks**:
- Package manifest format (P1.1, P1.5)
- Secret management (S1.1.2)
- Permission scoping (S1.1.1)
- Sandbox execution (S1.1.3)
- Error codes (E1.1-E1.15)

**Output**:
```json
{
  "valid": true,
  "violations": [],
  "message": "Compliant"
}
```

**Usage**:
```bash
pi rules check /path/to/extension.ts
pi rules check /path/to/package.json
```

---

### `pi rules priority`

**Shows rule priority breakdown**:

- **Critical** (must follow): Security, validation
- **High** (should follow): Architecture, packages  
- **Medium** (reference): Documentation
- **Low** (examples): Guides

**Usage**:
```bash
pi rules priority
pi rules priority --critical --high
```

---

### `pi rules alias <name> <command>`

**Creates custom rule command alias**.

**Usage**:
```bash
pi rules alias sec "read securitypolicy.md"
pi rules alias arch "read architecture.md"
```

**Output**:
```json
{
  "success": true,
  "message": "Alias 'sec' created as alias for read securitypolicy.md"
}
```

---

### `pi rules clean-cache`

**Clears cached rule data**.

**Usage**:
```bash
pi rules clean-cache
```

---

## Command Examples

### Quick Rule Access

```bash
# List all rules
pi rules list

# Read security policy
pi rules read securitypolicy.md

# Check an extension
pi rules check ./my-extension.ts

# Create alias for security policy
pi rules alias sec "read securitypolicy.md"
# Then use: pi rules sec
```

### Integration with Extensions

```bash
# Use rules-lookup tool
pi tools list
pi tools get-rule-content filename="extensions.md"
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `list` | List all available rules |
| `read <file>` | Read specific rule |
| `check <path>` | Validate asset against rules |
| `priority` | Show priority breakdown |
| `alias <name> <cmd>` | Create custom alias |
| `clean-cache` | Clear cached rule data |

---

## Integration

These commands integrate with:

1. **Rules lookup extension** (`.pi/extensions/rules-lookup.ts`)
2. **Rules-lookup skill** (`.pi/skills/rules-lookup/`)
3. **Model context** for agent compliance checking

---

## License

MIT License

---

Last Updated: 2025