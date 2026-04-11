# Pi vs CC — Extension Playground

Pi Coding Agent extension examples and experiments.

## Tooling
- **Package manager**: `bun` (not npm/yarn/pnpm)
- **Task runner**: `just` (see justfile)
- **Extensions run via**: `pi -e extensions/<name>.ts`

## Project Structure
- Folder map (what lives where): **`docs/REPO_INDEX.md`**
- **`apps/wayofpi-ui/`** — Way of Pi web shell (Bun + Vite/React); technical UI uses **`WorkspacePane`** (Zed-style tab stack) and optional **`TechnicalWorkspaceGrid`** (up to **3×4**, flex + **`DockSplitHandle`**, persisted **`rowWeights`/`colWeights`**, edge-drop grid grow, cross-cell tab moves). See **`apps/wayofpi-ui/README.md`**, **`docs/WOP_TECHNICAL_UI.md`**, **`.cursor/rules/wop-ui-modular-docks.mdc`**
- `projects/` — Per-project documentation while Pi works on a codebase (`projects/<slug>/`, copy from `projects/_template/`). See `projects/README.md` and `.cursor/rules/pi-projects-docs.mdc`.
- `extensions/` — Pi extension source files (.ts)
- `.pi/extensions/` — Re-export shims (`export { default } from "../../extensions/…"`); do not put `themeMap.ts` here—Pi loads every `*.ts` as an extension. [extension locations](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#extension-locations)
- `.pi/skills/<name>/SKILL.md` — Skills (folder name must match frontmatter `name`)
- `specs/` — Feature specifications
- `.pi/agents/` — Agent definitions for agent-team extension
- `.pi/agent-sessions/` — Ephemeral session files (gitignored)

## Conventions
- Extensions are standalone .ts files loaded by Pi's jiti runtime
- Available imports: `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, `@mariozechner/pi-ai`, `@sinclair/typebox`, plus any deps in package.json
- Register tools at the top level of the extension function (not inside event handlers)
- Use `isToolCallEventType()` for type-safe tool_call event narrowing
