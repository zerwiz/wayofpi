# @pi/damage-control-core

Pi framework core provides base classes for creating extensions.

## Portability

**Important:** Damage control should be **PORTABLE between projects**, NOT globally installed.

- Copy the entire `damage-control-core/` directory to the `.pi/` folder of any Pi project
- Don't install via `npm install @pi/damage-control-core` globally
- Keep it local to each project so rules remain project-specific

## Installation

Copy the `damage-control-core/` directory to your project's `.pi/` folder:

```bash
# From the Way of pi project (recommended)
cp -r damage-control-core/ ~/.pi/

# Then from any project, copy it to your `.pi/` folder:
cp -r /path/to/Way%20of%20pi/.pi/damage-control-core/ ~/.pi/
```

## Usage

```typescript
import { Extension } from "@pi/damage-control-core";

export class DamageControlExtension extends Extension {
  async initialize() {
    // Extend the core functionality
  }
}
```

## Available Extension Types

- **LANGUAJE**: Language-related extensions
- **PREVIEW**: Preview panel extensions
- **RULES**: Rule-based extensions

## Core Features

- File system operations with damage control
- Extension lifecycle management
- Context management
- Rule validation infrastructure

## Project-Specific Customization

1. Copy `damage-control-core/` to your project's `.pi/` folder
2. Create/edit `damage-control-rules.yaml` in your project's `.pi/` for project-specific rules
3. The extension will automatically pick up your project-specific rules

> Note: Keep damage control extensions local to projects to avoid conflicts between projects.
