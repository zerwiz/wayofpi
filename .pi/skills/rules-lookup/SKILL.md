---
name: rules-lookup
version: "1.0.0"
description: Use this skill to consult developer rules and system architecture when building new extensions, skills, or modifying system configuration. Always verify against rules before creating new assets.
license: MIT
---

## Rule Navigation Protocol

### Step 1: Verify First
Before creating/modifying assets, consult rules folder:
- Extensions → `extensions.md`
- Skills/Maroworkflows → `skills.md`  
- CLI behavior → `modes.md` or `architecture.md`
- Model configs → `models.json.md`
- Packages → `packages.md`

### Step 2: Consult Rules
Use available tools to read specific rule files as needed.

### Step 3: Validate Compliance
Cross-check user requests against documented standards.

---

## Triggers

- `consult rules` - List all available rules
- `check compliance` - Verify asset against standards
- `verify architecture` - Check system specs before creating

---

## Usage Examples

```bash
pi run --skill ./rules-lookup/ "show all rules"

pi run --skill ./rules-lookup/ "check packages.md"

pi run --skill ./rules-lookup/ "read securitypolicy.md"
```

---

## Tools

Available tools:
- `list_developer_rules` - List index of rule documents
- `get_rule_content` - Read specific rule file