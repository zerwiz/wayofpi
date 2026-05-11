# v1.0.64

## 📦 Updates

- 🎯 **Phase 6: Full Kanban Integration (WOP-010)** — Fixed 550 TypeScript errors across 19 kanban files and removed them from `tsconfig.app.json` exclude list. Type definitions extended (Board, BoardCard, BoardColumn, DriveFile, CardCover), mock services created (mockNotesService, mockDriveService, mockTasksService, mockCalendarService, mockProjectsService, mockDevelopmentWorkflowService, mockWorkflowsService), contexts created (ToastContext, AuthContext). Missing type files and component stubs created (workflows, nsrCompliance, NSRFolderBadge, NSRComplianceBadge). All source files fixed: `await` added to async calls, implicit `any` params typed, import paths corrected, ConfirmationModal import style fixed. `bun run build` passes cleanly.

# v1.0.63

## 📦 Updates

- 🎯 **Phase 4: SDK Migration (WOP-004)** — Switched default chat engine from `auto` to `sdk` (`WOP_CHAT_ENGINE=sdk`). Chat now uses `@earendil-works/pi-coding-agent` SDK directly instead of `pi --mode json` subprocess. Legacy files (`pi-json-mode-chat.ts`, `pi-binary.ts`, original `pi-agent-runtime.ts`) saved to `ref/server/` for reference.
- 🎯 **Phase 5: Pi.dev Version Pinning (WOP-006)** — Created `scripts/pi-startup-log.sh` with 10-point integration diagnostic, added `just pi-log` target, wired non-blocking version check + startup log into `start-wayofpi.sh` and `start-wayofpi-electron.sh`.
- 🧹 **Cleanup** — Removed stale `apps/wayofwork-server/` bun cache directory (orphaned artifact).
- 🔧 **Server refactor** — `pi-agent-runtime.ts` simplified to SDK-only (removed subprocess fallback). `diagnostics.ts` no longer depends on `pi-binary.ts`. `ngrok-binary.ts` inlines tilde expansion.
- 🎯 **Phase 7: ÄTA Ticket System (WOP-012)** — Full backend: `tickets`, `time_blocks`, `time_sessions`, `price_lists` tables in SQLite schema; 20+ API endpoints (CRUD, submit/review/approve/reject/lock/invoice workflow, time tracking, price lists, reports) in `server/tickets-api.ts` wired into `handleApi()`; frontend API hook at `src/hooks/useTicketApi.ts`.
- 🎯 **Phase 8: Claw Leadership Modules (WOP-015)** — Review, Financials, Office, Compliance modules in `clawUserUiModules.tsx` wired to live API: Review shows pending tickets with approve/reject buttons and status stats; Financials shows project budget breakdown with total hours; Office lists approved tickets ready for invoicing; Compliance shows active worker sessions. All modules auto-fetch from Phase 7 endpoints.
- 🗄️ **DB path fix** — Changed `db.ts` data directory from `wayofwork-server/db/` (removed in Phase 4) to `data/`.

# v1.0.62

## 📦 Updates

- 🧭 **Phase 2 Routing** - Implemented `react-router-dom` v7 in `main.tsx` with `BrowserRouter` + public/protected route split.
- 🔐 **AuthGate** - `RequireAuth` component wraps protected routes, redirects unauthenticated users to `/login` with deep-link redirect back after successful auth.
- 🔗 **Route Sync** - Bidirectional sync between URL paths and `uiMode` context state via `RouteSync` (URL → uiMode) and `UiModeWatcher` (uiMode → URL).
- 🗺️ **Subsystem Routes** - Mapped `/ide` → `SimplePage`, `/kanban` → `WorkPage`, `/ata` → `ClawPage`, `/docs` → `DocsPage`, plus `/portal`, `/admin`, `/super-admin`, `/client`, `/profile`.
- 🎯 **Deep Linking** - `LoginPage` reads `location.state.from` on successful auth and redirects to the originally requested URL instead of role-based default.
- 🏷️ **Role-Adapted Header** - Created `useUserRole` hook + `UserRoleBadge` component for role-based UI adaptation. Role badge shown in bottom-right corner of protected pages.

# v1.0.61

## 📦 Updates

- 🏷️ **Rebranding** - Formally renamed `wayofpi-ui` → `wayofwork-ui` and `wayofpi-server` → `wayofwork-server`. Updated all package names, Electron branding, and internal references.
- 🧠 **Monolith Deconstruction** - Successfully thinned `App.tsx` from 4,800 lines to **53 lines**.
- 🛠️ **Logic Extraction** - Extracted all core logic handlers into dedicated hooks (`useWorkspaceActions.ts`, `useEditorCommandHandlers.ts`, `useNavigationHandlers.ts`, `useCommandItems.ts`).
- 📄 **Page Shell Synchronization** - Standardized `SimplePage`, `ClawPage`, `DocsPage`, and `WorkPage` to consume global state via `RefactorContext.tsx`, resolving runtime crashes and prop-drilling issues.
- ✅ **Core Stability** - Achieved zero-error build and resolved the 500 error on `/api/portal/tasks` by fixing a `due_date` vs `deadline` schema mismatch.
- 🔌 **Technical IDE Separation** - Formally separated "Way of Pi" from "Way of Work." The "Technical" button now opens the standalone app on port 5174.

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
