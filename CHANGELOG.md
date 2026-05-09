# v1.0.61

## 📦 Updates

- 🏷️ **Rebranding** - Formally renamed `wayofpi-ui` → `wayofwork-ui` and `wayofpi-server` → `wayofwork-server`. Updated all package names, Electron branding, and internal references.
- 🧠 **Monolith Deconstruction** - Successfully thinned `App.tsx` from 4,800 lines to **53 lines**.
- 🛠️ **Logic Extraction** - Extracted all core logic handlers into dedicated hooks (`useWorkspaceActions.ts`, `useEditorCommandHandlers.ts`, `useNavigationHandlers.ts`, `useCommandItems.ts`).
- 📄 **Page Shell Synchronization** - Standardized `SimplePage`, `ClawPage`, `DocsPage`, and `WorkPage` to consume global state via `RefactorContext.tsx`, resolving runtime crashes and prop-drilling issues.
- ✅ **Core Stability** - Achieved zero-error build and resolved the accidental monolithic restoration regression.

# v1.0.60

## 📦 Updates

- ✅ **Claw Shell** - Removed unused `SimpleApp` component (cleanup)
- 🎯 **Claw Shell** - Reorganized `onNewPage` logic into modular handlers (`handleNewPage`, `handleNewPlanFile`, `handleNewClient`, etc.)
- 🎨 **Claw Shell** - Refactored sidebar menu logic to use conditional rendering (improved)
- 🎯 **Claw Shell** - Removed unused `SimpleApp` component reference (cleanup)
- 🔧 **Architecture** - Refactored `App.tsx` dead code from multiple conditional branches into `AppShellInternal` with early returns

## 🔧 Technical Improvements

- 🔧 **Refactoring** - All Technical-specific imports removed from `App.tsx`:
  - Removed `TechnicalPrimarySidebar` import
  - Removed `DockSplitHandle` import
  - Removed `TechnicalWorkspaceGrid` import
  - Removed all Technical-only `use*` hooks imports
- 🔧 **Clean Code** - Split `App.tsx` into `AppShellInternal` wrapper (main logic) + early returns for `claw`. Reduced file size from 4819 lines to ~1946 lines.
- 🔧 **Architecture** - App.tsx now purely renders `SimpleApp` with conditional sidebar, all Technical UI logic eliminated.

## Completed Milestones

- WOP-016 Technical IDE extraction — ✅ **DONE**
- WOP-017 Rename wayofpi-ui → wayofwork-ui — ✅ **DONE**
- WOP-018 Rename wayofpi-server → wayofwork-server — ✅ **DONE**
- WOP-**\* App.tsx Technical dead code removal — ✅ **DONE\*\*
