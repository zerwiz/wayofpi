# .pi Agent Rules - Master Document

**Version:** 1.0.0
**Author:** @zerwiz
**License:** MIT

---

## Document Structure

This master document combines all rules from:
- [/home/zerwiz/.pi/agent/rules/modes.md](modes.md) - Mode handling
- [/home/zerwiz/.pi/agent/rules/packages.md](packages.md) - Package management
- [/home/zerwiz/.pi/agent/rules/errors.md](errors.md) - Error handling

**Read order:**
1. master.md (this file)
2. modes.md (model & mode)
3. packages.md (package install)
4. errors.md (error codes)

---

## Quick Reference

| Section | File | Purpose |
|---------|------|---------|
| Model Rules | modes.md | `.model` handling |
| Mode Rules | modes.md | `--mode`, `.mode` |
| Package Install | packages.md | `pi install` validation |
| Error Codes | errors.md | Exit codes |

---

## Priority Levels

| Priority | Rules |
|----------|-------|
| **Critical** | Model constraints, validation, error codes |
| **High** | Package install, mode handling |
| **Medium** | Extension config, prompts |
| **Low** | Optional features |

---

### Quick Commands

```bash
# Check modes
pi install --mode

# Validate package
pi install --validate

# Install from npm
pi install npm:openai

# Install from git
pi install git:https://github.com/repo

# List packages
pi install --list
```

---

## Summary

This ruleset ensures:
- Models validate against constraints
- Packages install with full validation
- Errors have proper codes & messages
- Clean error handling

---

**End of Master Rules**
