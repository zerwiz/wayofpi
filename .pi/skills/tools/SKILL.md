---
name: tools
description: This skill provides documentation for the built-in Pi tools (read, bash, edit, write) and references core documentation files.
---

# Tools Skill

**Description:** This skill provides documentation for the built‑in Pi tools (read, bash, edit, write) and references core documentation files.

## Usage

- Refer to `docs/TOOLS.md` and `docs/CONCEPTS.md` for detailed information.
- The skill registers tool signatures for read, bash, edit, and write.

```ts
// Read the contents of a file. Supports text files and images. Output is truncated to 2000 lines or 50KB.
function read(
  path: string,
  limit?: number,
  offset?: number
): string;

// Execute a bash command in the current working directory. Returns stdout and stderr.
function bash(
  command: string,
  timeout?: number
): string;

// Edit a file by replacing exact text. The oldText must match exactly (including whitespace).
function edit(
  path: string,
  oldText: string,
  newText: string
): void;

// Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.
function write(
  path: string,
  content: string
): void;
```