# Plan: Extension Loading and Tool Conflict Resolution

## Problem Statement
The current environment faces two primary issues:
1. **Tool Conflict:** The `web_search` tool from the npm package `pi-web-access` conflicts with the local `.pi/extensions/web-tools.ts` extension.
2. **Missing Paths:** The `justfile` and other scripts reference an `extensions/` directory and files like `ext-agent-team.ts` which do not exist in the root directory (they are located in `.pi/extensions/` or have different names like `agent-team.ts`).

## Proposed Solutions

### 1. Resolve `web_search` Conflict
The local `.pi/extensions/web-tools.ts` provides a superset of functionality (including Gemini grounding) but conflicts with the npm-installed `pi-web-access`.
*   **Action:** Update `.pi/settings.json` to remove `.pi/extensions/web-tools.ts` if the user prefers the npm package, OR keep the local one and suppress the npm package (if possible by environment variable). 
*   **Recommended Action:** Since the local `web-tools.ts` header specifically warns about this, we will remove it from the `extensions` array in `.pi/settings.json` to favor the cleaner npm integration, unless custom Gemini grounding is required.

### 2. Fix Directory Path Mismatch
The `justfile` expects extensions in `extensions/`, but they are in `.pi/extensions/`.
*   **Action A (Symlink):** Create a symbolic link `extensions` pointing to `.pi/extensions`. This is the most surgical fix to make all `justfile` commands work without editing the large `justfile`.
*   **Action B (Update justfile):** Update all `extensions/` references in `justfile` to `.pi/extensions/`.
*   **Recommended Action:** **Action A** (Symlink) is preferred for immediate compatibility and simplicity.

### 3. Resolve Filename Inconsistencies
The `justfile` references `ext-agent-team.ts`, but the file is named `agent-team.ts` in `.pi/extensions/`.
*   **Action:** Create a symbolic link `.pi/extensions/ext-agent-team.ts -> agent-team.ts` OR update `justfile` to use the correct name.
*   **Recommended Action:** Update the `justfile` entry for `ext-agent-team` to use `.pi/extensions/agent-team.ts`.

## Execution Steps

1. **Conflict Resolution:**
    - Edit `.pi/settings.json` and remove `.pi/extensions/web-tools.ts`.
2. **Path Resolution:**
    - `ln -s .pi/extensions extensions` (Create root-level symlink).
3. **Naming Alignment:**
    - Verify if `ext-agent-team.ts` exists in any other location. If not, update `justfile` to point to `extensions/agent-team.ts` (which will work after step 2).

## Verification Plan
1. Run `pi` to confirm no more tool conflicts.
2. Run `just ext-agent-team` to confirm the extension loads correctly.
3. Verify that `/agents-list` and other commands work as expected.
