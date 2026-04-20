# Pi Coder Agent Rules Directory

## Purpose

This directory contains the core rule files that define Pi Coder Agent behavior, tools, and constraints.

## Structure

```
.pi/agent/rules/
├── README.md              # This file - directory documentation
└── pi agent rules/        # Active agent rules (space in name for compatibility)
    ├── master.md          # Main rule document
    ├── modes.md           # Model and mode configuration
    ├── packages.md        # Package installation rules
    ├── errors.md          # Error handling definitions
    ├── skills.md          # Tool skills document
    ├── agents.md          # Agent workflow definitions
    ├── architecture.md    # System architecture patterns
    ├── external-links.md  # External API documentation
    └── ...                # Additional rule files
```

## Key Files

| File | Purpose |
|------|----------|
| `master.md` | Central index of all rules |
| `models.json.md` | API endpoint definitions |
| `packages.md` | Installation/usage constraints |
| `modes.md` | Model specification rules |
| `hardcoded_paths.md` | Directory structure definitions |

## Usage

The Pi Coder Agent loads rules from this directory when starting. All tool capabilities, model constraints, and system behaviors are defined here.

## Notes

- Rule files follow a strict Markdown format
- All paths are relative or absolute within .pi/user/
- Hardcoded paths prevent accidental environment changes
