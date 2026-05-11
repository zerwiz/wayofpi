# Way of Pi — Master Combined TODO

Sourced from WOP-001 through WOP-018. Organized by phased app-separation roadmap.

---

## 🛠️ Recurring Maintenance

- [x] **Always update `CHANGELOG.md`** after every session or major task completion.

---

## Architecture — App Separation (FINAL)

```
Root: Way of Pi (project)
├── apps/wayofpi/               →  "Way of Pi"
│   ├── technicalIDE/           →  Standalone Technical coding IDE (port 5174)
│   └── server/                 →  Bun proxy server port 3334 → 3333
├── apps/wayofwork-ui/          →  "Way of Work" — Main app: Claw, Simple, Docs, Work (includes API server at server/)
├── apps/workerportal/          →  Worker self-service portal
└── apps/clientportal/          →  Future: client-facing portal
```

**Naming rule**: "Way of Pi" = Technical IDE only (`apps/wayofpi/`). Everything else = "Way of Work".

**Note**: `apps/wayofwork-server/` was removed — it was a stale bun bundle cache from an older architecture. The server lives at `apps/wayofwork-ui/server/`.

---

## Division of Labor

| Agent | Responsibility |
|-------|---------------|
| **OpenCode agent** | Track C: Technical IDE (WOP-016), Phase 2 routing (WOP-011), wiring, App.tsx thinning, Phase 4 SDK Migration, Phase 5 Version Pinning, Phase 6 Kanban Integration, Phase 7 ÄTA Tickets, Phase 8 Claw Leadership |

---

## Phase 0: Clean Build — DONE ✅

---

## Phase 1: Runtime Stability — DONE ✅

---

## Phase 2: Agentic OS Shell & Unified Routing (WOP-011) — DONE ✅

- [x] Implement `react-router-dom` in `main.tsx`
- [x] Create `AppShell.tsx` root layout (Initial version created)
- [x] Map Subsystem Routes (`/ide`, `/kanban`, `/ata`)
- [x] AuthGate with deep linking
- [x] Role-Adapted Header Matrix

---

## Phase 3: App Separation — ALL DONE ✅

### Track C: Technical IDE Standalone App (WOP-016) — DONE ✅
- [x] Scaffold `apps/wayofpi/technicalIDE/` directory
- [x] All source files created
- [x] Path aliases configured
- [x] Server proxy (port 3334 → 3333)
- [x] Build passing
- [x] Way of Pi is fully standalone

### Track D: Rename wayofpi-ui → wayofwork-ui (WOP-017) — DONE ✅
- [x] Rename directory + all references

### Track E: Rename wayofpi-server → wayofwork-server (WOP-018) — DONE ✅
- [x] Rename directory + all references

### Track A: Logic & Hooks Extraction — DONE ✅
- [x] Modal Extraction (useModalState.ts)
- [x] Workspace Logic (useWorkspaceActions.ts)
- [x] Editor Logic (useEditorCommandHandlers.ts)
- [x] Navigation Logic (useNavigationHandlers.ts)

### Track B: Page Shells — DONE ✅
- [x] Docs Shell, Work Shell, Claw Shell, ModalsRenderer, IdeLayout
- [x] Simple Shell (SimplePage.tsx) stabilized and build fixed.

### TechnicalIDE Cleanup — DONE ✅
- [x] Remove dead Technical-specific imports from App.tsx
- [x] Remove dead Technical-specific state from AppShellInternal
- [x] App.tsx thinned to 53 lines! 🎯

---

## Phase 4: SDK Migration (WOP-004) — DONE ✅ (OpenCode)

- [x] `pi-sdk-runtime.ts` existed and was already wired (SDK imported via `@earendil-works/pi-coding-agent`)
- [x] `WOP_CHAT_ENGINE=sdk` set in `.env` (was `auto`, now SDK is default)
- [x] Legacy subprocess files (`pi-json-mode-chat.ts`, `pi-binary.ts`, original `pi-agent-runtime.ts`) moved to `ref/server/`
- [x] `pi-agent-runtime.ts` simplified — SDK-only, no subprocess fallback
- [x] `diagnostics.ts` no longer depends on `pi-binary.ts` (inlined probe logic)
- [x] `ngrok-binary.ts` inlines tilde expansion instead of importing from `pi-binary.ts`
- [x] Stale `apps/wayofwork-server/` bun cache directory removed
- [x] `bun run build` passes ✅

---

## Phase 5: Pi.dev Version Pinning (WOP-006) — DONE ✅ (OpenCode)

- [x] `scripts/pi-startup-log.sh` created — checks 10 integration points (binary, version, SDK, ExtensionAPI, JSON mode, PI_STACK, pi-loader, agents, sessions, engine mode)
- [x] `just pi-log` target added to justfile
- [x] `logs/` dir added to `.gitignore`
- [x] Wired into `start-wayofpi.sh` and `start-wayofpi-electron.sh` (non-blocking warnings)
- [x] `scripts/pi-version-check.sh` already existed (Phase 1)
- [x] `PI_PINNED_VERSION=0.74.0` already in `.env` (Phase 1)

---

## Phase 6: Full Kanban Integration (WOP-010) — DONE ✅ (OpenCode)

- [x] Fixed 550 TS errors across 19 kanban files
- [x] Extended type definitions (Board, BoardCard, BoardColumn, DriveFile, CardCover)
- [x] Created mock services (mockNotesService, mockDriveService, mockTasksService, mockCalendarService, mockProjectsService, mockDevelopmentWorkflowService, mockWorkflowsService)
- [x] Created contexts (ToastContext, AuthContext)
- [x] Created missing type files (projects, workflows, nsrCompliance) and component stubs (NSRFolderBadge, NSRComplianceBadge)
- [x] Fixed source files: await, implicit any, import paths, ConfirmationModal imports
- [x] Removed kanban from tsconfig.app.json exclude list
- [x] `bun run build` passes ✅

---

## Phase 7: ÄTA Construction ERP (WOP-012) — DONE ✅ (OpenCode)

- [x] `shared/ticket-types.ts` already existed (TypeScript interfaces)
- [x] `tickets`, `time_blocks`, `time_sessions`, `price_lists` tables added to `db.ts`
- [x] `server/tickets-api.ts` — 20+ API endpoints: CRUD tickets, submit/review/approve/reject/lock/invoice workflow, time-blocks CRUD, time-sessions check-in/out, price-lists CRUD, reports (weekly-summary, project-budget, ticket-status), approved-tickets listing
- [x] Wired into `server/index.ts` `handleApi()` as a modular route handler
- [x] `src/hooks/useTicketApi.ts` — frontend API hook for all ticket endpoints
- [x] DB path fixed from stale `wayofwork-server/db/` to `data/`
- [x] `bun run build` passes ✅

---

## Phase 8: Claw Leadership Modules (WOP-015) — DONE ✅ (OpenCode)

- [x] Module stubs already existed in `clawUserUiModules.tsx`
- [x] **Review module** wired: fetches `pending_review` tickets via API, approve/reject buttons, status stats counts
- [x] **Financials module** wired: fetches `/api/reports/project-budget`, shows active project count + total hours breakdown
- [x] **Office module** wired: fetches `/api/invoices/approved-tickets`, lists tickets ready for invoicing
- [x] **Compliance module** wired: fetches `/api/time-sessions/active`, shows currently checked-in workers
- [x] All modules use `useTicketApi.ts` hook for API calls
- [x] `bun run build` passes ✅

---

## Phase 9: Production Delivery (WOP-009) — IN PROGRESS

- [x] **Unified Login** — WelcomePage single Sign In button replaces three separate portal logins.
- [x] **Role-Based Redirect** — ADMIN/SUPER_ADMIN → `/ata`, WORKER → `/portal`, CLIENT → `/client`.
- [x] **Fixed SimplePage crash** — Added missing `workspaceFolders` to fileMenu (fixes FileMenuContent `.length` error).
- [x] **Nav consistency** — WorkerPortal and ClientDashboard now show UiModeToggle nav bar.
- [x] **Client role visibility** — UiModeToggle client button only shows for CLIENT role.
- [x] **Technical button removed** — Technical mode removed from nav (standalone app now).
- [x] **UiModeToggle SPA navigation** — Uses React Router `navigate()` instead of `window.location.pathname`.

---

## Completed

- WOP-001, WOP-003, WOP-005 — terminal persistence
- WOP-011 — Agentic OS Shell & Unified Routing — **DONE ✅**
- WOP-016 Technical IDE extraction — **DONE ✅**
- WOP-017 Rename wayofpi-ui → wayofwork-ui — **DONE ✅**
- WOP-018 Rename wayofpi-server → wayofwork-server — **DONE ✅**
- WOP-004 Phase 4 SDK Migration — **DONE ✅** (OpenCode)
- WOP-006 Phase 5 Pi.dev Version Pinning & Startup Logging — **DONE ✅** (OpenCode)
- WOP-012 Phase 7 ÄTA Ticket System — **DONE ✅** (OpenCode)
- WOP-015 Phase 8 Claw Leadership Modules — **DONE ✅** (OpenCode)
- WOP-010 Phase 6 Full Kanban Integration — **DONE ✅** (OpenCode)

---

## Phase 9: Global Header & UI Consistency — 8/10 FIXED ✅ 2 LEFT

### Context
- `IdeLayout` simplification (removing MenuBar + layout chrome) was **CORRECT for Way of Work** — this is a work portal app, not an IDE. The full `IdeLayout` with file tree, activity bar, etc. belongs in the **standalone IDE app** at `apps/wayofpi/technicalIDE/`.
- However, SimplePage's **left sidebar** and ClawPage's **right sidebar** were **CUSTOM-MADE for those pages**, not part of the IDE. They were lost when IdeLayout was stripped. They must be restored.

### ✅ Fixed (8/10)

| # | Fix | Files Changed |
|---|-----|-------------|
| 1+10 | Route collision fixed: separated `/workboard` (WorkPage) from `/kanban` (KanbanPage) | `App.tsx`, `pages/index.ts` |
| 2 | `min-h-screen` → `h-full` on all pages inside flex-1 | WorkerPortal, AdminDashboard, UserProfile, SuperAdminDashboard, ClientDashboard, DocsApp |
| 5 | Removed duplicate `<UiModeToggle>` from WorkApp header | `WorkApp.tsx` |
| 6 | Removed duplicate `<UiModeToggle>` from DocsApp header | `DocsApp.tsx` |
| 8 | Changed `h-screen` → `h-full` in IdeLayout | `IdeLayout.tsx` |
| 9 | Added `defaultMenuStubs` at App-level PageHeaderProvider (all menu handlers with no-ops) | `App.tsx` |
| — | MenuBar restructured (search/model on top row, UiModeToggle in bottom row) | `MenuBar.tsx` |
| — | Claw menu button styled as PanelLeft icon (matching Simple toggle) | `ClawApp.tsx` |
| — | Sidebar state persisted in localStorage (Simple left/right, Claw nav) | `SimpleApp.tsx`, `ClawApp.tsx` |
| — | Removed useless "Project files" button from Simple narrow desktop | `SimpleApp.tsx` |
| — | KanbanPage exported and wired to `/kanban` route (was orphaned file) | `pages/index.ts`, `App.tsx` |
| — | `ToastProvider` added to App component tree (required by Kanban) | `App.tsx` |

### 🔴 Still Needs Work (2/10)

| # | Issue | File | Notes |
|---|-------|------|-------|
| 3 | Left sidebar for Simple page | `SimpleApp.tsx` | Sidebar state persisted. Needs verification if layout works. |
| 7 | Docs chat in middle column | `DocsApp.tsx` | Need to move ChatPanel from middle column into right preview column |

### 💡 Investigation Results
- **SimpleApp** already renders `SimpleNavRail` (left sidebar) and `SimpleRightPanel` (right sidebar) within itself — they are NOT dependent on IdeLayout. The sidebars should work now that `min-h-screen`/`h-screen` is fixed.
- **ClawApp** renders `ClawNavRail` (left sidebar) within itself. Claw nav state persisted; "Claw menu" button fixed.

---

## Phase 10: Kanban Feature Completeness — ✅ DONE

### Context
The Kanban page (`src/pages/Kanban.tsx`) was ported from `ref/kanban/Kanban.tsx` with the full component tree. During Phase 10 the following was completed:

### ✅ Done
- [x] Main Kanban page ported (3300 lines, complete)
- [x] All 9 sub-components ported (CardView, BoardSettingsModal, BoardMembers, BoardSelector, BoardDocsView, BoardDriveView, PushToKanbanModal, PushWorkflowToKanbanModal, PushTaskListToKanbanModal)
- [x] Mock services created (mockKanbanService, mockNotesService, mockTasksService, mockDriveService, mockCalendarService, mockProjectsService, mockDevelopmentWorkflowService, mockWorkflowsService)
- [x] Type definitions created (kanban, developmentWorkflow, workflows, nsrCompliance, drive, projects)
- [x] Contexts created (ToastContext, AuthContext)
- [x] Type errors fixed (550+ TS errors resolved)
- [x] Route wired: `/kanban` → `KanbanPage` (separated from `/workboard` → `WorkPage`)
- [x] `ToastProvider` added to App component tree
- [x] `BOARD_TEMPLATES` populated with 19 real template definitions across 7 categories (incl. construction + ata)
- [x] **Color scheme fixed** — All `bg-gray-*`, `text-gray-*`, `border-gray-*`, `placeholder-gray-*` replaced with app design system (`bg-[#1e1e1e]`, `text-[#cccccc]`, `text-[#858585]`, `border-[#333333]`)
- [x] **Purple/pink → orange accent** — All `purple-*` and `pink-*` utilities replaced with `orange-*` across all 10 kanban files
- [x] **Orange shading/depth** — Flat `from-orange-600 to-orange-600` gradients fixed to `from-orange-600 to-orange-700` for visual depth
- [x] **`bg-dark-*` legacy classes** in CardView.tsx replaced with app design system
- [x] **Mock service rewritten** — `mockKanbanService.ts` now persists boards and cards in memory. Board creation works. Seed data with 2 boards, 5 cards, and members.
- [x] **Company Users in BoardMembers** — Fetches company users from `/api/admin/users` API with fallback seed users. "Add" button to add company users directly to boards.
- [x] **Claw left sidebar toggle fixed** — PanelLeft button shows on all desktop sizes when nav is closed (was only showing on narrow desktop). Click toggles open/closed.
- [x] **Build passes** ✅
- [x] **Issue created** — `issues/008-kanban-completeness.md`

### Remaining (low priority / future)
- [ ] Card attachments (Drive/Docs views) — BoardDriveView and BoardDocsView need real Drive/Docs integration
- [ ] Workflow push modals — PushToKanbanModal/PushWorkflowToKanbanModal/PushTaskListToKanbanModal need real workflow integration

---

## Completed

- WOP-001, WOP-003, WOP-005 — terminal persistence
- WOP-011 — Agentic OS Shell & Unified Routing — **DONE ✅**
- WOP-016 Technical IDE extraction — **DONE ✅**
- WOP-017 Rename wayofpi-ui → wayofwork-ui — **DONE ✅**
- WOP-018 Rename wayofpi-server → wayofwork-server — **DONE ✅**
- WOP-004 Phase 4 SDK Migration — **DONE ✅** (OpenCode)
- WOP-006 Phase 5 Pi.dev Version Pinning & Startup Logging — **DONE ✅** (OpenCode)
- WOP-012 Phase 7 ÄTA Ticket System — **DONE ✅** (OpenCode)
- WOP-015 Phase 8 Claw Leadership Modules — **DONE ✅** (OpenCode)
- WOP-010 Phase 6 Full Kanban Integration — **DONE ✅** (OpenCode) — File structure ported, routing still needed fixing

_Last updated: 2026-05-11. Update this file when tickets change._
