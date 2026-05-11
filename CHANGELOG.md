# v1.0.69

## 📦 Kanban Completeness (Phase 10)

### ✨ New Features
- **Mock Kanban Service rewritten** — Now properly persists boards and cards in memory so creating boards actually works. Board list shows real seed data (2 sample boards with 5 cards total) instead of always-empty list.
- **Company Users in BoardMembers** — Board Members modal now shows a "Company Users" section that fetches users from `/api/admin/users` (real API) or falls back to seed users. Admins can add company users directly to boards with one click.
- **Orange shading/depth** — All accent colors changed from purple/pink to orange with proper gradient depth (`from-orange-600 to-orange-700` instead of flat `to-orange-600`).

### 🎨 Color Scheme
- **All purple/pink → orange** — Replaced every `purple-*` and `pink-*` utility across all 10 kanban files with matching `orange-*` utilities.
- **Dark theme colors fixed** — `bg-gray-900` → `bg-[#1e1e1e]`, `bg-gray-800` → `bg-[#252526]`, `bg-gray-700` → `bg-[#333333]`, `bg-gray-600` → `bg-[#444444]`, `text-gray-400` → `text-[#858585]`, etc. across all 10 kanban files.
- **`bg-dark-*` legacy classes fixed** — CardView.tsx had `bg-dark-*` classes from an older theme; replaced with app design system equivalents.

### 🐛 Bug Fixes
- **Claw left sidebar toggle fixed** — PanelLeft button now shows on ALL desktop sizes (not just narrow). Before: if sidebar was closed on wide desktop, there was no way to reopen it. Now: button always visible when nav is closed; click toggles open/closed.
- **Board creation works** — `mockKanbanService.createBoard()` now persists boards in memory instead of returning a one-off object that disappears on next render.
- **`createBoard()` second param preserved** — Fixed TS error where `createBoard(data, templateId)` was called with 2 args but service only accepted 1.

### 🟠 All purple/pink → orange
- Replaced ALL remaining `purple-*`/`pink-*` references across both `components/kanban/` and `components/work/kanban/` directories. Zero purple/pink left in live code.
- Added orange gradient shading: `from-orange-600 to-orange-700` for depth instead of flat same-color gradients.

### 🏗️ Construction Templates
- Added 4 construction board templates: Residential Construction, Commercial Construction, Renovation Project, Construction Punch List
- Added `'construction'` category to `TemplateCategory` type

### 📋 ÄTA Templates
- Added 2 ÄTA (change order) board templates: ÄTA Workflow, ÄTA Change Order Log
- Added `'ata'` category to `TemplateCategory` type

### 📋 Issue
- Created `issues/008-kanban-completeness.md` — full ticket for Phase 10 Kanban work.

# v1.0.68

## 💥 REGRESSIONS from v1.0.66 (Global Header / IdeLayout simplification)

### Content hidden behind global header (all `min-h-screen` pages)
- WorkerPortal "Signed in as Demo Worker" text is hidden behind the global MenuBar
- AdminDashboard "Admin Console / Manage team, clients, and projects" hidden behind header
- UserProfile "User Profile" header hidden behind header
- SuperAdminDashboard "Developer View" header hidden behind header
- ClientDashboard content hidden behind header
- **Root cause**: Pages use `min-h-screen` which doesn't account for the global MenuBar height. The `flex-1` container in App.tsx is (100vh - MenuBar height), but pages try to be 100vh.

### Kanban button not visible for admin role
- **Root cause**: MenuBar header has `overflow-hidden` (line 234). The UiModeToggle now has many buttons (Simple, Claw, Docs, Workboard, Kanban, Admin, DevView, Profile, Logout) that can overflow the header width and get clipped.

### Duplicate UiModeToggle still in WorkApp and DocsApp
- WorkApp.tsx line 106 still renders its own `<UiModeToggle>` (duplicate of global header)
- DocsApp.tsx line 167 still renders its own `<UiModeToggle>` (duplicate of global header)

### Left sidebar missing from Simple page
- **Root cause**: IdeLayout simplification removed layout chrome that SimpleApp depended on

### Right sidebar missing from Claw page
- **Root cause**: IdeLayout simplification removed layout chrome that ClawApp depended on

### "Claw Meny" button placement
- `ClawApp.tsx:549-567` shows a "Claw menu" button only in narrow/mobile viewports. The quick actions (Open Chat, New Plan, My Team, Host Doctor, Schedules, Channels, Help) should be directly visible in the mission view.

## 🔧 Fixes applied (may need rollback of IdeLayout simplification)
- Added Kanban + Logout buttons to UiModeToggle
- Removed duplicate UiModeToggle from AdminDashboard, UserProfile, SuperAdminDashboard
- Removed "Back to App" buttons
- Cleaned up WorkerPortal unused imports
- 🔧 **MenuBar restructured**: Search/model chooser moved inside h-8 top row, `UiModeToggle` moved to its own bottom row
- 🎨 **Claw menu button styled as PanelLeft icon**: Replaced text "Claw menu" button with PanelLeft icon matching Simple's sidebar toggle style
- 🗑️ **Removed "Project files" button from SimpleApp**: Useless narrow-desktop button removed
- 💾 **Sidebar state persisted**: Left/right sidebar open/close state now persisted in localStorage for both SimpleApp and ClawApp (keys: `wayofpi.simple.leftOpen`, `wayofpi.simple.rightOpen`, `wayofpi.claw.navOpen`)
- 🔧 **Claw auto-open removed**: Removed effect that forced ClawNavRail open on wide screens — user's sidebar choice is now respected
- 🧹 **Removed `LayoutDashboard` import from UiModeToggle**: No longer used after Portal button removal


## ⚠️ Pending fixes
- [ ] Restore IdeLayout to full version (left sidebar, right sidebar, layout chrome)
- [ ] Fix `min-h-screen` → `h-full` on all pages inside flex-1 container
- [ ] Remove `overflow-hidden` from MenuBar header (if causing overflow clipping)
- [ ] Remove duplicate UiModeToggle from WorkApp.tsx and DocsApp.tsx
- [ ] Integrate "Claw menu" quick actions into mission view
- [x] Sidebar state persistence (Simple + Claw) — **Done**
- [x] Claw menu button styled as PanelLeft icon — **Done**
- [x] Remove useless "Project files" button from Simple narrow desktop — **Done**

# v1.0.66

## 📦 Updates

- 🏛️ **Global Consistent Header** — All pages now share the same MenuBar header (WAY OF WORK logo, File/Edit/Selection/View/Go/Terminal/Help menus) via App-level `AppLayout`. Removed per-page duplicate headers.
- 🧭 **PageHeaderContext** — Created `PageHeaderContext` to provide menu handlers from pages (SimplePage, ClawPage) to the global MenuBar, while other pages get default stubs.
- 🔧 **IdeLayout simplified** — Removed MenuBar from IdeLayout (now just a container). MenuBar lives at App level.
- 🔤 **Rebranded header** — Changed "WAY OF PI" to "WAY OF WORK" in MenuBar.
- 🚪 **Unified Login** — WelcomePage now has a single "Sign In" button instead of three separate portal logins.
- 🧭 **Role-Based Login Redirect** — ADMIN and SUPER_ADMIN now redirect to `/ata` (Claw/ÄTA) instead of `/admin` or `/super-admin`.
- 🔧 **Fixed crash in SimplePage** — Added missing `workspaceFolders` to `fileMenu` object (was causing `Cannot read properties of undefined (reading 'length')` in FileMenuContent).
- 👤 **Client role fix** — UiModeToggle `isClientRole` corrected to only match `CLIENT`, not admin/super.
- 🧭 **Technical button removed** — Technical mode button removed from UiModeToggle nav.
- 🧭 **UiModeToggle SPA routing** — Replaced `window.location.pathname` with React Router `navigate()`.

# v1.0.65

## 📦 Updates

- 🚪 **Unified Login** — WelcomePage now has a single "Sign In" button instead of three separate portal logins.
- 🧭 **Role-Based Login Redirect** — ADMIN and SUPER_ADMIN now redirect to `/ata` (Claw/ÄTA) instead of `/admin` or `/super-admin`.
- 🔧 **Fixed crash in SimplePage** — Added missing `workspaceFolders` to `fileMenu` object (was causing `Cannot read properties of undefined (reading 'length')` in FileMenuContent).
- 👤 **Client role fix** — UiModeToggle `isClientRole` corrected to only match `CLIENT`, not admin/super.
- 🧭 **Technical button removed** — Technical mode button removed from UiModeToggle nav.
- 🧭 **UiModeToggle SPA routing** — Replaced `window.location.pathname` with React Router `navigate()` for proper SPA navigation.
- 🧭 **WelcomePage** — Consolidated three portal buttons (IDE Login, Worker Portal, Client Portal) into a single "Sign In" button.

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
