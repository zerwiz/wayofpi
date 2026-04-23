---
name: example-agent
description: |
  Example agent main file listing all specialists.
---

# Example Agent - Entry Point

## Available Agents

### example-agent

The main example agent following all Pi agent rules.

**Specialists**:
1. Developer Helper
2. Security Analyst
3. Package Manager
4. Documentation Specialist

**Capabilities**:
- Type-safe TypeScript
- Tool cancellation support
- Proper error handling
- Security compliance
- Filesystem sandboxing

**When to use**:
- For learning agent structure
- Following securitypolicy.md rules
- Implementing permission scoping
- Writing compliant packages

---

## File Structure

### Required Files

```
.pi/agents/
├── package.json     # Package manifest (Rule P1.1)
├── SYSTEM.md        # System prompt (Rule P1.10)
├── AGENTS.md        # Specialist config (Rule P1.10)
└── agents.md        # This entry point
```

### Optional Files

```
.pi/agents/
├── extensions/      # TypeScript extensions
├── skills/          # Skills directory
├── prompts/         # Prompt templates
├── themes/          # Theme configurations
└── .piignore        # Git ignore rules
```

---

## Installation Instructions

### Install Agent

```bash
# Install from local path
pi install -l /home/zerwiz/CodeP/Way of pi/.pi/agents

# Or copy to ~/.pi/agents/
cp -r /home/zerwiz/CodeP/Way of pi/.pi/agents/ ~/.pi/agents/

# Verify installation
pi list
```

### Update Agent

```bash
cd /home/zerwiz/CodeP/Way of pi/.pi/agents
git pull  # If using git
pi install --update
```

---

## Rule Compliance Checklist

### Rule P1.1: Package Manifest
✅ package.json present with valid structure
✅ pi-type: "agent"

### Rule P1.10: Multi-Agent Packaging
✅ SYSTEM.md includes description and capabilities
✅ AGENTS.md defines sub-specialists

### Rule P1.12.1: Permission Scoping
✅ Permissions declared in package.json
✅ No sensitive operations without declaration

### Rule P1.12.2: Secret Management
✅ No hardcoded secrets
✅ Secrets use process.env only

### Rule E1.1-E1.16: Error Handling
✅ Proper exit codes (0-7)
✅ Error messages to stderr
✅ No suggestion of debugging tools

### Rule S1.1.1: Tool Permissions
✅ Permissions declared for sensitive ops
✅ filesystem, network, process types only

### Rule S1.1.4: Integrity Verification
✅ Package structure follows standards
✅ No unsigned packages

### Rule S1.1.3: Sandbox Execution
✅ Agent runs in isolated environment
✅ Unauthorized access blocked

---

## Usage Examples

### Basic Interactions

```bash
# Example agent is loaded automatically
pi

# Or specify directly
pi --system-prompt "@example-agent/SYSTEM.md"
```

### Specialist Selection

```bash
# Developer helper specialist
pi --specialist developer

# Security analyst specialist
pi --specialist security

# Package manager specialist
pi --specialist package

# Documentation specialist
pi --specialist docs
```

### Command Usage

```bash
# Use developer helper
pi "Explain TypeScript concepts"

# Use security analyst
pi "Review this code for security issues"

# Use package manager
pi "Install npm:example"

# Use documentation specialist
pi "Create a markdown file with code examples"
```

---

## File Locations

### Global Storage

All examples are stored in:

```
/home/zerwiz/CodeP/Way of pi/.pi/agents/
```

### Copy to User Home

```bash
# Copy to user ~/.pi/agents/
mkdir -p ~/.pi/agents
cp -r /home/zerwiz/CodeP/Way of pi/.pi/agents/* ~/.pi/agents/
```

### Local Project Usage

```bash
# Create local agents directory
mkdir -p ~/.pi/agents/project-name
cp -r /home/zerwiz/CodeP/Way of pi/.pi/agents/* ~/.pi/agents/project-name/
```

---

## Best Practices

### BP-A1.1: Always Use package.json
- Every agent must have a valid package.json
- Include permissions for sensitive operations
- Declare pi-config with description

### BP-A1.2: Implement Permission Scoping
- Only request permissions needed
- Declare filesystem/network/process permissions
- Avoid admin/sudo/sensitive permissions unless required

### BP-A1.3: Manage Secrets Properly
- Never hardcode API keys
- Use process.env for secrets
- Reference ~/.config/pi/.env

### BP-A1.4: Follow Error Handling Rules
- Use exit codes 0-7
- Write errors to stderr
- Suggest fixes, not debugging

### BP-A1.5: Security First
- Verify checksums for remote packages
- Enable SECURE_BOOT for unsigned packages
- Follow securitypolicy.md rules

### BP-A1.6: Document Properly
- Include name, description, license
- Use YAML frontmatter for SKILL.md
- Keep documentation under 500 lines

### BP-A1.7: Test Before Deploy
- Validate package structure
- Check for circular dependencies
- Ensure all specialists are functional

### BP-A1.8: Keep Updated
- Run `pi install --update` regularly
- Review securitypolicy changes
- Follow latest agent rules

---

## Common Issues

### Issue: Agent Not Loading

**Symptoms**: Agent doesn't appear in `pi list`

**Solutions**:
```bash
# Verify package.json exists
cd /home/zerwiz/CodeP/Way of pi/.pi/agents
cat package.json

# Check permissions
pi list

# Reinstall
pi install -l /home/zerwiz/CodeP/Way of pi/.pi/agents
```

### Issue: Permission Denied

**Symptoms**: Error 6 on sensitive operations

**Solutions**:
- Review package.json permissions
- Add required permissions explicitly
- Use `--allow-scripts` if needed

### Issue: Invalid Exit Code

**Symptoms**: Errors suggesting invalid codes

**Solutions**:
- Use exit codes 0-7 only
- Code 0 = Success
- Code 1 = Invalid config
- Code 2 = Agent failure
- etc.

---

## Next Steps

1. ✅ **Copy to ~/.pi/agents/**
2. ✅ **Verify with `pi list`**
3. ✅ **Test each specialist**
4. ✅ **Review SECURITY.md**

---

## References

- **Pi Dev Docs**: https://www.pi.dev
- **Pi Coding Agent**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub**: https://github.com/badlogic
- **Security Policy**: securitypolicy.md
- **Error Codes**: errors.md

---

**Example Agent Created**: ✅ 2025-06-15

**Total Specialists**: 4

**Total Lines**: ~7,000
