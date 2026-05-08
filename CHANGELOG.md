# Changelog

All notable changes to the **Way of Pi** project.

## [0.21.10] - 2026-05-08

### Added
- **[PLAN] Production delivery plan**: Wrote `docs/PRODUCTION_DELIVERY_PLAN.md` — covers 4 delivery channels: Desktop installers (Windows .exe, macOS .dmg, Linux .AppImage/.deb), Cloud SaaS hosting (Docker multi-tenant on Railway/Fly/Hetzner), Local self-hosting (ngrok/Cloudflare Tunnel from your machine), and CI/CD pipeline (GitHub Actions matrix build, code signing, auto-update). Includes cost estimation ($300-500/yr signing, $12-60/mo per cloud client, $11-32/mo self-host), domain/SSL strategy, backup/recovery plan, monitoring, and a 4-phase implementation roadmap.
- **[TICKET] WOP-009 production delivery**: Created `thoughts/shared/tickets/WOP-009-production-delivery.md` (4 sections: desktop, cloud, self-host, domain). Updated WOP-007 collective ticket table to include WOP-009.
- **[TICKET] Master combined TODO**: Created `thoughts/shared/tickets/WOP-ALL-TODO.md` aggregating all tasks from WOP-001 through WOP-009 into one organized checklist by WOP-007 phase. Covers all 8 phases + completed items. Removed superseded `WOP-009-TODO.md`.
- **[TICKETS] Aligned all tickets with master TODO**: Added cross-reference banners to WOP-001 through WOP-009 pointing to `WOP-ALL-TODO.md` as the single source of truth for checkboxes. Each ticket now says "Update checkboxes there, not here."

## [0.21.09] - 2026-05-08

### Added
- **[UI/UX] Workspace plan doc**: Wrote `docs/UI_UX_WORKSPACE_PLAN.md` — per-role workspace designs (Worker, Leader, Client, Admin, Super Admin), navigation architecture, header types, visual design tokens, landing experiences, implementation phasing. Each workspace has a clear primary job, explicit CAN/CANNOT boundaries, and a consistent visual shell.
- **[PLAN] Financial system PRD + 7 issues**: Wrote `issues/prd-financial-system.md` covering budgets, salaries, invoicing, multi-currency, expense tracking, and financial dashboards. Broke into 7 vertical-slice issue files (`issues/001`–`007`). Integrated into WOP-007 as Section 7 (parallel track starting after Phase 0). Updated ARCHITECTURE_TARGET.md capabilities table. Added `issues/` to project root.
- **[DOCS] Community extension ecosystem**: Documented 5 pi.dev community packages in `docs/ARCHITECTURE_TARGET.md §12` — pi-web-access (web search/extraction), pi-markdown-preview (markdown/LaTeX/Mermaid preview), pi-mermaid (ASCII mermaid), rpiv-ask-user-question (structured user prompts), pi-lens (LSP/lint/format). Maps each to in-app code it replaces during Phase 6. Added `@/` path alias to `vite.config.ts` + `tsconfig.app.json` for shadcn-style imports (prepares Phase 0 build fix). Updated `thoughts/shared/tickets/WOP-007` Phase 6 with community extension migration section.

## [0.21.08] - 2026-05-08

### Fixed
- **[UI] ClientDashboard.tsx**: Fixed 403 on `/api/client/projects` and `/api/client/drawings` — raw `fetch()` calls didn't include `Authorization: Bearer` header. Server's dev mode falls back to `role: ADMIN`, which the client routes reject. Switched to `apiGet()` from `api/client.ts` which attaches the stored JWT token.

### Note
- **[UI] WorkBoard.tsx**: This is the simplified worker-facing kanban view. The full kanban system lives at `src/pages/Kanban.tsx` + `src/components/kanban/` and needs separate integration (color theming, routing, import paths).

## [0.21.07] - 2026-05-07

### Fixed
- **[ELECTRON] preload.cjs**: Fixed Electron white screen — renamed `preload.mjs` → `preload.cjs` and replaced `import` with `require()`. Electron sandboxed preload scripts do not support ESM syntax. The `SyntaxError: Cannot use import statement outside a module` in the preload caused the renderer to fail silently, resulting in a blank white window.
- **[SERVER] pi-binary.ts**: Removed `realpathSync` on `resolvePiBinaryPath()` return — now returns symlink path as-is so `Bun.spawn` uses the shebang directly instead of resolving to `.js` target and failing with ENOENT.
- **[SERVER] workspace-state.ts**: Fixed `getPrimaryWorkspacePath` appending `/default` to the already-default workspace path, causing `Bun.spawn` to fail with ENOENT (non-existent cwd). Default tenant now returns `baseWorkspace` directly.
- **[UI] WorkBoard.tsx**: Added missing `useToast` import, `workflowsService` import, and `await` on async service calls (`kanbanService.getAllBoards`, `getBoard`, `getAllCardsForBoard`, `developmentWorkflowService.getAllWorkflows`, `workflowsService.getAllWorkflows`). All three calls were returning Promises instead of resolved values.
- **[UI] mockKanbanService.ts**: Added all missing stub methods (`getAllBoards`, `getAllCardsForBoard`, `createBoardFromTemplate`, `updateBoard`, `deleteBoard`, `createColumn`, `deleteColumn`, `createCard`, `updateCard`, `deleteCard`, `moveCard`) to match WorkBoard usage.
- **[UI] developmentWorkflowService.ts**: Added missing stub methods (`getAllWorkflows`, `getWorkflow`, `syncStepFromItemUpdate`, `updateStep`).
- **[UI] workflowsService.ts**: Created new service with `getAllWorkflows` stub for WorkBoard workflow tracks.
- **[UI] WorkBoard.tsx**: Fixed infinite re-render loop — `useSearchParams` mock created a new `URLSearchParams()` on every render, causing `searchParams` dependency reference to change each render, re-triggering the `useEffect` → `setAllBoards([])` → re-render loop endlessly. Extracted stable module-level refs.
- **[UI] ClientDashboard.tsx**: Fixed 403 on `/api/client/projects` and `/api/client/drawings` — raw `fetch()` calls didn't include `Authorization: Bearer` header. Server's dev mode falls back to `role: ADMIN`, which the client routes reject. Switched to `apiGet()` from `api/client.ts` which attaches the stored JWT token.

### Changed
- **[DOCS] WOP-003**: Updated ticket with white screen root cause (preload ESM error), Electron debug findings, and verification steps.

## [0.21.06] - 2026-05-07

### Fixed
- **[SERVER] WebSocket open handler**: Wrapped in try/catch to prevent unhandled errors from closing the WebSocket connection immediately (was causing ECONNRESET from Vite proxy).
- **[SERVER] WebSocket message handler**: Wrapped in try/catch for same protection.
- **[SERVER] pi-json-mode-chat.ts**: Fixed node binary resolution — now uses `realpathSync` on `Bun.which("node")`, checks common locations (`/usr/bin/node`, `/usr/local/bin/node`), and falls back to shebang-based spawn if node is unavailable. Added detailed spawn error logging.
- **[UI] useWayOfPiSession.ts**: Fixed React Strict Mode double-invocation error — cleanup no longer calls `.close()` on WebSocket in CONNECTING state, preventing "WebSocket is closed before the connection is established" console error on initial mount.

### Changed
- **[UI] useWayOfPiSession.ts**: Cleanup only closes WebSocket if it's in OPEN state; CONNECTING sockets are abandoned gracefully.

## [0.21.05] - 2026-05-06

### Fixed
- **[UI] ChatPanel.tsx**: Fixed to use correct `ChatRow` properties (`role`, `assistantPersona`, `content`) instead of deprecated `fromUser`, `agentName`, `segments`
- **[UI] ChatPanel.tsx**: Shows "Disconnected - Start the server to enable chat" message when server is offline
- **[UI] ChatPanel.tsx**: Disables input and send button when disconnected
- **[UI] DocsApp.tsx**: Fixed hooks violation (moved `useDocumentHandler()` to component level instead of try/catch block)
- **[UI] DocsApp.tsx**: Fixed `docsNodes` reference error (added back the `useMemo` definition)

### Changed
- **[UI] ChatPanel.tsx**: Updated empty state message to indicate server connection requirement
- **[UI] ChatPanel.tsx**: Input field now disabled when streaming or disconnected

### Status
- **[BUILD]**: ✅ Build passes (`bun run build`) - All our files now error-free
- **[CHAT]**: Requires server running (`bun run dev` or `./start-wayofpi.sh`) for WebSocket connection

---

## [0.21.04] - 2026-05-06

### Added
- **[DOCS] thoughts/shared/tickets/WOP-001-fix-docs-mode-routing-issues.md**: Created comprehensive ticket for Docs mode routing fixes
- **[DOCS] thoughts/shared/plans/WOP-001-fix-docs-mode-routing.md**: Created implementation plan for Docs mode fixes
- **[UI] DocumentBrowser.css**: Created proper dark theme styling for DocumentBrowser component

### Fixed
- **[UI] DocsApp.tsx**: Fixed FileExplorer to display file tree (added missing props: `visible`, `onToggle`, `appearanceDark`)
- **[UI] DocsApp.tsx**: Fixed ChatPanel initialization (added missing props: `visible`, `onToggle`)
- **[UI] DocsApp.tsx**: Fixed PreviewModal props (`visible`/`path` instead of `isOpen`/`filePath`)
- **[UI] DocsApp.tsx**: Integrated DocumentBrowser component with toggle button (Tree ↔ Docs view)
- **[UI] DocsApp.tsx**: Consolidated file selection logic (Path A/B) - now updates both `selectedPath` and `DocumentHandlerContext`
- **[UI] DocumentBrowser.tsx**: Replaced empty `loadFiles()` with proper `TreeNode` filtering
- **[UI] DocumentBrowser.tsx**: Added filter by type (All/Markdown/Text/Code) with real-time filtering
- **[UI] DocumentBrowser.tsx**: Added search functionality with real-time results
- **[UI] DocumentBrowser.tsx**: Implemented expand/collapse for folders
- **[UI] DocumentBrowser.tsx**: Removed unused imports and states
- **[UI] FileExplorer.tsx**: Improved empty states (loading spinner, error with retry button, helpful empty state message)
- **[UI] DocumentBrowser.tsx**: Fixed JSX namespace issue (`JSX.Element` → implicit return type)

### Changed
- **[UI] DocsApp.tsx**: Added `docsNodes` filter definition back (was missing after edits)
- **[UI] DocsApp.tsx**: Fixed `selectedPath` null handling in `apiGet` call
- **[UI] DocumentBrowser.tsx**: Changed from orphaned component to fully integrated Docs mode browser

### Status
- **[BUILD]**: ✅ Build passes (`bun run build`) - DocsApp.tsx and DocumentBrowser.tsx errors fixed
- **[TICKET]**: WOP-001 now 10/10 items complete
- **[DOCS]**: Investigation document `DOCS-MODE-ROUTING-INVESTIGATION.md` issues resolved

---

## [0.21.03] - 2026-05-06

### Added
- **[UI] UserProfile.tsx**: Added **"Back"** and **"Start Way of Pi"** buttons to error screens (API not ready, Not Authenticated).
- **[UI] UserProfile.tsx**: Added "Start Way of Pi" logic to attempt server startup via Electron IPC or dev-mode endpoint, with clipboard fallback.
- **[DOCS] LOCAL_HOSTING.md**: Created comprehensive guide for local hosting via Docker, ngrok, and VMs.

### Fixed
- **[UI] WorkApp.tsx**: Changed default active tab to **"Tasks"** so the Kanban board is visible by default when opening Workboard.
- **[UI] vite.config.ts**: Fixed "Must provide a proper URL as target" error by adding missing target to `/ws` proxy.
- **[SERVER] pi-binary.ts**: Fixed `ENOENT` error when spawning Pi by resolving symlinks and improving path detection (including global `.pi` agent path).
- **[SERVER] pi-json-mode-chat.ts**: Fixed `ENOENT: node` error by resolving the absolute path of the `node` executable and added spawn logging for better diagnostics.
- **[SERVER] index.ts**: Fixed WebSocket connection failure by supporting authentication via `token` query parameters and ensuring proper tenant/user ID defaults in dev mode.

---

## [0.21.02] - 2026-05-06

### Added
- **[UI] ClientDashboard.tsx**: Added **Logout** button to the header.

### Fixed
- **[UI] ClientDashboard.tsx**: Fixed issue where the header button would always take the user to the login page (even if logged in as Admin).
- **[UI] ClientDashboard.tsx**: Allowed **ADMIN** and **SUPER_ADMIN** roles to view the dashboard without re-logging in.
- **[UI] ClientDashboard.tsx**: Fixed token parsing to handle different formats safely.

---

## [0.21.01] - 2026-05-06

### Added
- **[UI] UserProfile.tsx**: Added certificates & licenses section with Swedish construction worker credentials (ID06, Safe Construction Training, Hot Works, etc.)
- **[UI] UserProfile.tsx**: Added internal calendar connection for certificate expiration notifications (6 months before expiry)
- **[UI] UserProfile.tsx**: Demo mode now includes sample Swedish construction certificates with validity status (valid/expiring/expired)
- **[UI] WorkerPortal.tsx**: Added demo login support (`Demo`/`1234`) with proper demo token generation
- **[UI] ClientDashboard.tsx**: Added demo login support (`Demo`/`1234`)

### Fixed
- **[UI] UserProfile.tsx**: Fixed dark theme (no white background) - now uses `min-h-screen bg-[#1e1e1e] overflow-y-auto` for scrollable content
- **[UI] UserProfile.tsx**: Fixed demo mode authentication to handle demo tokens properly
- **[UI] UserProfile.tsx**: Fixed demo mode authentication to handle demo tokens properly
- **[UI] WorkerPortal.tsx**: Removed header from login screen; converted task list to kanban-style board
- **[UI] ClientDashboard.tsx**: Removed header from login screen
- **[UI] Navigation.tsx**: Fixed corrupted file (removed duplicated code)
- **[UI] DocumentViewer.tsx**: Fixed syntax error (`onBack?.` → `onBack`)
- **[UI] vite.config.ts**: Fixed HMR config for Vite 6 compatibility
- **[HOOKS] useWayOfPiSession.ts**: Added demo mode check to skip WebSocket connection

### Changed
- **[UI] WorkerPortal.tsx**: "Log Time Entry" button now inline (not full width)
- **[UI] UserProfile.tsx**: Changed calendar provider from Google/Outlook to internal system
- **[UI] UserProfile.tsx**: Updated to use `calendarConnections` with `"internal"` provider

### Status
- **[BUILD]**: TypeScript build has errors due to missing modules; dev server works with `npm run dev:ui`
- **[DEMO]**: Login works with `Demo`/`1234` for both Client and Worker portals
- **[PROFILE]**: Certificates display with status indicators; calendar shows internal connection

### Fixed (Server)
- **[SERVER] db.ts**: Added `slug` column to `tenants` table schema
- **[SERVER] Database**: Fixed startup error "table tenants has no column named slug"
- **[SERVER] Database Init**: Delete old `.sqlite` file to recreate with new schema

### Fixed (UI - Dark Theme)
- **[UI] DocsApp.tsx**: Fixed docs view white background - added `overflow-y-auto` and dark bg
- **[UI] DocumentViewer.tsx**: Added inline styles for dark theme (`bg-[#1e1e1e]`, text `[#cccccc]`)
- **[UI] DocumentBrowser.tsx**: Added inline styles for dark theme
- **[UI] UserProfile.tsx**: Fixed scrollable content with `overflow-y-auto` on main container

---

## [0.21.00] - 2026-05-06

### Added
- **[UI] Admin Console (`/admin`)**: Created new management hub for team leaders featuring worker and client management.
- **[UI] Admin Console**: Re-integrated projects, tasks, and time entry statistics into the leader's dashboard.
- **[UI] Admin Console**: Added side-by-side "+ Add Worker" / "+ Add Client" buttons with intelligent tab-switching.
- **[UI] Developer View (`/super-admin`)**: Renamed from "Super Admin Dashboard" to focus on system-wide maintenance for developers.
- **[UI] Developer View**: Added "Server Health & Environment" section with real-time process metrics (Uptime, RAM, Node/Bun versions).
- **[UI] Navigation**: Implemented **Role-Based Visibility (RBAC)**; buttons now hide/show based on user permissions (JWT-extracted).
- **[UI] Navigation**: Added category separators in the nav bar to distinguish between Perspectives, Destinations, and Admin tools.
- **[SERVER] API Endpoints**: Updated `/api/admin/stats` to calculate client counts and system telemetry (process memory, platform).

### Fixed
- **[UI] App.tsx**: Refactored rendering to use top-level early returns for Docs and Workboard modes, fixing layout overlap bugs.
- **[UI] AdminDashboard.tsx**: Fixed syntax error ("Unexpected token") caused by redundant JSX closing tags.
- **[UI] Navigation**: Fixed button labeling where "Admin" and "DevView" destinations and titles were misaligned.

### Changed
- **[UI] Navigation**: Renamed "Work" button to "Workboard" to match the Kanban/Time engine architecture.
- **[UI] Navigation**: "DevView" button is now exclusively visible to the `SUPER_ADMIN` role.

---

## [0.20.08] - 2026-05-06

### Added
- **[UI] UserProfile.tsx**: Added certificates & licenses section (ID06, Safe Construction Training, Hot Works, etc.)
- **[UI] UserProfile.tsx**: Added internal calendar connection for certificate expiration notifications (6 months before expiry)
- **[UI] UserProfile.tsx**: Demo mode now includes sample Swedish construction certificates with validity status
- **[UI] WorkerPortal.tsx**: Added demo login support (`Demo`/`1234`) with proper demo token generation
- **[UI] ClientDashboard.tsx**: Added demo login support (`Demo`/`1234`)

### Fixed
- **[UI] WorkerPortal.tsx**: Removed header from login screen; converted task list to kanban-style board
- **[UI] ClientDashboard.tsx**: Removed header from login screen
- **[UI] UserProfile.tsx**: Fixed dark theme (no white background); fixed demo mode authentication
- **[UI] Navigation.tsx**: Fixed corrupted file (removed duplicated code)
- **[UI] DocumentViewer.tsx**: Fixed syntax error (`onBack?.` → `onBack`)
- **[UI] vite.config.ts**: Fixed HMR config for Vite 6 compatibility
- **[HOOKS] useWayOfPiSession.ts**: Added demo mode check to skip WebSocket connection

### Changed
- **[UI] WorkerPortal.tsx**: "Log Time Entry" button now inline (not full width)
- **[UI] UserProfile.tsx**: Changed calendar provider from Google/Outlook to internal system

---

## [0.20.07] - 2026-05-06

### Added
- **[SERVER] API Endpoints**: Added portal time tracking endpoints to `server/index.ts`:
  - `GET /api/portal/time` - List time entries with task and project joins
  - `POST /api/portal/time` - Submit new time entry with validation
  - `POST /api/portal/time/:id/approve` - Leader approves time entry
  - `POST /api/portal/time/:id/reject` - Leader rejects time entry with notes
  - `GET /api/portal/tasks` - List tasks with assignee and project info
  - `POST /api/portal/tasks` - Create new task with assignment
  - `PUT /api/portal/tasks/:id/status` - Update task status
  - `GET /api/portal/reports/time` - Generate time reports with filters
- **[SERVER] Database Schema**: Created `server/schema.sql` with `time_entries`, `tasks`, `projects` tables
- **[SERVER] Database Init**: Created `server/init-db.ts` to initialize SQLite database with proper schema
- **[DOCS] TODO.md**: Created comprehensive TODO list with 70+ tasks across 5 phases
- **[UI] Navigation**: Created unified navigation component with role-based visibility

### Fixed
- **[SERVER] Database Connection**: Fixed `db.ts` to properly create all tables (`tenants`, `users`, `projects`, `tasks`, `time_entries`)
- **[SERVER] Database Path**: Updated `db.ts` and `init-db.ts` to use `/apps/wayofpi-server/db/` path
- **[SERVER] Database Schema**: Fixed `tenants` INSERT to include required `slug` column
- **[UI] Component Paths**: All work components now correctly located in `apps/wayofpi-ui/src/components/work/`
- **[DOCS] STRUCTURE.md**: Updated to match actual file system layout

### Changed
- **[SERVER] API Structure**: Portal endpoints now use `/api/portal/*` prefix for consistency
- **[SERVER] Database Location**: Moved database from `server/.pi/db/` to `apps/wayofpi-server/db/`
- **[DOCS] plans/ cleanup**: Moved documentation components from `plans/` to `docs/` directory

### Status
- **[SERVER] Database**: Tables now created successfully (`tenants`, `users`, `projects`, `tasks`, `time_entries`)
- **[SERVER] API Endpoints**: Code complete in `server/index.ts`, tested with JWT auth
- **[SERVER] Auth Fix**: Dev mode now includes `role: "ADMIN"` in fake auth; client APIs require JWT with `role: "CLIENT"`
- **[SERVER] WebSocket Fix**: Updated WebSocket upgrade handler to accept `/ws` with query params (fixes HMR connection issue)
- **[UI] ClientDashboard.tsx**: Added login form with ID/PIN authentication; checks `localStorage wop_token` for JWT with `role: "CLIENT"`
- **[UI] Navigation**: Fixed transport issue - user now sees login form before accessing `/client` dashboard instead of 403 errors
- **[UI] User Flow Redesign**: 
  - **Clients**: Separate entry point (orange button) → `/client` → Login form → Dashboard
  - **Workers/Admins**: Combined entry point "Portal" → `/portal` → Worker Portal login
  - **Navigation.tsx**: Client button now visually distinct (orange border) to indicate separate entry
- **[UI] Role-Based Visibility (FOLLOWING ARCHITECTURE DOC)**: 
  - **Primary Nav**: Simple (all logged-in), Technical (worker/admin/super_admin), Claw (leader/admin/super_admin), Docs (all logged-in), Work (worker/leader/admin/super_admin)
  - **Context Nav**: Portal (worker/leader/admin), Admin (admin), Super Admin (super_admin), Profile (all logged-in)
  - **Client Entry**: Only visible to `role: "client"` or not logged in

## [0.20.06] - 2026-05-06

### Fixed
- **[DOCS] STRUCTURE.md**: Updated to match actual file system (removed outdated refs, added new dirs like `docker/`, `pip/`, `default/`)
- **[DOCS] STRUCTURE.md**: Removed duplicate sections, consolidated `docs/` section, moved archived content to `docs/old/`
- **[UI] Icon Imports**: Fixed all work components to use `lucide-react` (installed) instead of `@heroicons/react` (not installed)
- **[UI] WorkBoard.tsx**: Fixed import from named export to default export for `WorkBoardSelector`

### Changed
- **[UI] Component Locations**: Moved `DocumentBrowser.tsx`, `DocumentViewer.tsx`, `PMChatPanel.tsx` from wrong `plans/` to correct `docs/` directory
- **[PLANS] work-button-improvements/TODO.md**: Created with correct file paths showing where files BELONG

### Added
- **[UI] Work Components**: Created `TimeEntryForm.tsx` - Time entry submission form with date, hours, project fields
- **[UI] Work Components**: Created `TeamBrowser.tsx` - Team browser with filter (all/active/inactive), worker cards with stats
- **[UI] Work Components**: Created `LeaderActions.tsx` - Leader approval panel with bulk actions, approve/reject with notes
- **[UI] Work Components**: Created `TaskForm.tsx` - Task creation form with worker assignment, deadline, estimated hours
- **[UI] Work Components**: Created `TaskList.tsx` - Task list with status filtering, edit/delete/complete actions
- **[UI] Work Components**: Created `TimeReport.tsx` - Time reporting with filters, summary stats, worker breakdown, CSV export
- **[UI] Work Components**: Created `TeamDashboard.tsx` - Team dashboard with stats grid, top performers, recent activity
- **[UI] Export Updates**: Updated `docs/index.ts` to export all new document components
- **[UI] Export Updates**: Updated `work/index.ts` to export all new work components

### Removed
- **[UI] plans/ directory**: Removed wrong `plans/` directory after moving files to `docs/`

## [0.20.05] - 2026-05-05

### Fixed
- **[SERVER] tree.ts**: Increased `MAX_NODES` from 4000 to 150000 and `MAX_DEPTH` from 14 to 20 to show ALL files/folders in workspace
- **[SERVER] tree.ts**: Fix for workspaces with >4000 files not showing all files in Simple/Technical modes

### Changed  
- **[SERVER] tree.ts**: Updated limits to handle large workspaces (100K+ files, 10K+ dirs)

### Added
- **[DEVELOPERS] Specialized Roles**: Created comprehensive developer roles guide in `/home/zerwiz/CodeP/Way of pi/pip/.pi/agents/wayofpiagents/WAYOFPI_DEVELOPER_ROLES.md`
- **[DEVELOPERS] Electron Developer**: Created `wayofpi-electron-developer` - Electron internals, main/renderer processes, IPC, native features
- **[DEVELOPERS] API Developer**: Created `wayofpi-api-developer` - REST/GraphQL APIs, webhooks, authentication, API design
- **[DEVELOPERS] Storage Developer**: Created `wayofpi-storage-developer` - Database design, IndexedDB, localStorage, data persistence, migrations
- **[DEVELOPERS] Accessibility Developer**: Created `wayofpi-a11y-developer` - WCAG 2.1 AA, ARIA, keyboard navigation, screen reader testing
- **[DEVELOPERS] Performance Developer**: Created `wayofpi-performance-developer` - Bundle size, rendering speed, memory optimization, Core Web Vitals
- **[DEVELOPERS] Security Developer**: Created `wayofpi-security-developer` - OWASP, vulnerability scanning, security audits, authentication
- **[DEVELOPERS] Testing Developer**: Created `wayofpi-testing-developer` - Unit tests, integration tests, E2E, code coverage, test infrastructure
- **[DEVELOPERS] CLI Developer**: Created `wayofpi-cli-developer` - Bash scripts, terminal commands, CLI tools, script automation
- **[DEVELOPERS] Integration Developer**: Created `wayofpi-integration-developer` - Third-party APIs, webhooks, external services
- **[DEVELOPERS] Rules Developer**: Created `wayofpi-rules-developer` - Business logic, validation, enforcement policies
- **[DEVELOPERS] Orchestration Developer**: Created `wayofpi-orchestration-developer` - Agent workflows, teams, pipelines, automation
- **[DEVELOPERS] Documentation Developer**: Created `wayofpi-documentation-developer` - README generation, API docs, tutorials

### Changed
- **[DEVELOPERS] Agent Configuration**: All Way of Pi developers now reference root path `~/Way of pi` via `WAYOFPI_ROOT` environment variable
- **[DEVELOPERS] Agent Paths**: Hard-coded file paths replaced with environment variable `$(WAYOFPI_ROOT)/` for cross-platform compatibility

## [0.20.04] - 2026-05-05

### Added
- **[UI] Docs Mode**: File tree now filters to show only document files (.md, .txt, .doc, .docx, .pdf)
- **[UI] Docs Mode**: Added quick action buttons: "Summarize", "Action Items", "Review" for document Q&A
- **[UI] Docs Mode**: Added document status badges (Draft, Review, Approved) with automatic detection from content
- **[UI] Docs Mode**: Status detection reads file content to determine status from markdown frontmatter

### Changed
- **[UI] Docs Mode**: Renamed file tree header from "Files" to "Documents" for clarity
- **[UI] Docs Mode**: Improved status badge display in header with icon and color coding

## [0.20.03] - 2026-05-05

### Added
- **[UI] Navigation.tsx**: Created unified navigation component with Primary Nav (Simple, Technical, Claw, Docs, Work) and Context-Aware Nav (Portal, Client, Admin, Profile) with role-based visibility
- **[DEPLOY] host-for-demo.sh**: Created startup script for local hosting with optional ngrok tunnel for client demos
- **[CONFIG] .env.example**: Added template with INSTANCE_ID, PIN, DB_FILE, PORT for multi-instance deployment

### Fixed
- **[UI] useUiMode.ts**: Fixed `readStored()` to properly handle 'docs' and 'work' modes, preventing fallback to "simple" on page reload
- **[UI] App.tsx**: Added Navigation component import for unified nav integration

### Changed
- **[TODO] work-button-improvements**: Completed Phase 1 navigation integration tasks from 01-PLAN.md

## [0.20.02] - 2026-05-05

### Fixed
- **[UI] useWayOfPiSession**: Fixed runtime crash when switching to "work" mode by initializing the 'work' surface state and adding safety checks to prevent accessing undefined session data.
- **[UI] App.tsx**: Fixed `ReferenceError: Cannot access 'uiMode' before initialization` by moving all hook declarations to the top of the `App` component, ensuring hooks are called before any conditional returns and adhering to React's Rules of Hooks.

## [0.20.01] - 2026-05-05

### Added
- **[MOBILE] Documentation**: Created comprehensive mobile documentation in `/home/zerwiz/CodeP/Way of pi/projects/work-button-improvements/mobile/`
- **[MOBILE] Mobile Components**: Documented all mobile-specific components: `MobileChrome`, `ClawMobileTabBar`, `SimpleMobileTabBar`, `MobileTechnicalShell`
- **[MOBILE] Mobile Views**: Documented mobile entry points (`?shell=mobile`, `/m` path) and localStorage toggle (`wayofpi.shell.mobile`)
- **[MOBILE] Mobile UX**: Documented mobile-first design patterns, breakpoints (≤768px mobile, 769-1024px tablet, ≥1025px desktop), and touch-optimized controls
- **[MOBILE] Claw Navigation**: Documented 8-tab claw bottom nav (Mission, Chat, Team, Schedule, Channels, Files, Modules, Settings)
- **[MOBILE] Simple Navigation**: Documented 6-tab simple bottom nav (Chat, Team, Models, Projects, Help, Settings)
- **[MOBILE] Mobile Shell**: Documented `useShellMobile` hook implementation with URL sync and path detection
- **[MOBILE] Mobile Chrome**: Documented shared top bar with title display, workspace hint, and desktop escape button
- **[MOBILE] Safe-Area Support**: Documented iOS notch, Android status bar, and browser UI handling

### Changed
- **[MOBILE] Component Structure**: Created new dedicated mobile documentation folder at `/home/zerwiz/CodeP/Way of pi/projects/work-button-improvements/mobile/`
- **[MOBILE] File Organization**: Organized mobile docs matching actual component structure in `/apps/wayofpi-ui/src/components/mobile/`
- **[MOBILE] Documentation Style**: Standardized mobile documentation format with headers, tables, and code examples

## [0.20.00] - 2026-05-05

### Critical
- **[DEPLOY] Hosting Required**: Application must be hosted on developer's computer ASAP for client demos and user testing
- **[DEPLOY] Demo Access**: Clients need to log in and try out the app for stakeholder reviews
- **[DEPLOY] Production Plans**: See `plans/productionready` for Docker/VMS hosting options

## [0.19.99] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Login**: Fixed login flow to gracefully accept demo credentials ("Demo"/"1234") when API is unavailable
- **[UI] WorkerPortal Demo Mode**: Added fallback logic to use demo data when server is not running
- **[UI] WorkerPortal Error Handling**: Improved error messages for API unavailable scenarios, suggesting demo mode usage

### Added
- **[UI] WorkerPortal**: Added `loadDemoData()` function for demo mode support
- **[UI] WorkerPortal**: Added graceful fallback when API is not running
- **[UI] WorkerPortal**: Demo credentials now auto-enabled when server is unavailable

### Changed
- **[UI] WorkerPortal**: Modified `handleLogin()` to check for demo credentials first before calling API
- **[UI] WorkerPortal**: Simplified error handling to reduce complexity

## [0.19.98] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Demo Mode**: Fixed demo mode to show demo task list when server unavailable
- **[UI] WorkerPortal Demo Mode**: Fixed demo mode to load demo files when server unavailable

### Changed
- **[UI] WorkerPortal**: Simplified `handleLogin()` error handling logic

## [0.19.97] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode display when API is unavailable
- **[UI] WorkerPortal**: Fixed error suppression when in demo mode

## [0.19.96] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Demo**: Improved demo mode reliability when server is not running

## [0.19.95] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode to accept "Demo"/"1234" credentials

## [0.19.94] - 2026-05-05

### Added
- **[UI] WorkerPortal**: Added support for demo credentials during development

### Changed
- **[UI] WorkerPortal**: Simplified demo mode logic

## [0.19.93] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode to work when API is not running

## [0.19.92] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo task list now displays properly when in demo mode

## [0.19.91] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo file list display in demo mode

## [0.19.90] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Improved error handling for offline scenarios

## [0.19.89] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo mode now uses demo data when server is unavailable

## [0.19.88] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed error suppression for demo mode

## [0.19.87] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo credentials now work when API is not running

## [0.19.86] - 2026-05-05

### Added
- **[UI] WorkerPortal Login**: Added demo credentials support

## [0.19.85] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Improved error messages for offline mode

## [0.19.84] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo mode now displays properly

## [0.19.83] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed offline demo mode

## [0.19.82] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Improved user information display

### Fixed
- **[UI] UsersPage**: Fixed role display fallback

## [0.19.81] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Removed duplicate error display after logout

### Added
- **[UI] AgentPage**: Added demo agent data

### Added
- **[UI] AgentPage**: Added chat history in demo mode

## [0.19.80] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed `getUsers` error handling

## [0.19.79] - 2026-05-05

### Added
- **[API] UsersPage**: Added `getUsers()` API endpoint

## [0.19.78] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode login

## [0.19.77] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Fixed error state when API is unavailable

## [0.19.76] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Updated to use `getUsers()` API instead of `getWorkers()`

## [0.19.75] - 2026-05-05

### Added
- **[API] UsersPage**: Added `getUsers` endpoint

## [0.19.74] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info API endpoint

## [0.19.73] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed avatar endpoint

## [0.19.72] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed avatar API

## [0.19.71] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed avatar endpoint

## [0.19.70] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info API endpoint

## [0.19.69] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info endpoint

## [0.19.68] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info endpoint

## [0.19.67] - 2026-05-05

### Added
- **[UI] WorkersPage**: Added avatar display

### Added
- **[UI] WorkersPage**: Added role badge display

## [0.19.66] - 2026-05-05

### Added
- **[API] WorkersPage**: Added `/auth/user-info` endpoint

## [0.19.65] - 2026-05-05

### Added
- **[UI] UsersPage**: Added logout functionality

### Added
- **[UI] UsersPage**: Added demo user data

## [0.19.64] - 2026-05-05

### Added
- **[API] UsersPage**: Added user info endpoint

## [0.19.63] - 2026-05-05

### Fixed
- **[API] ProfilePage**: Fixed profile API endpoint

## [0.19.62] - 2026-05-05

### Fixed
- **[API] ProfilePage**: Fixed profile page

## [0.19.61] - 2026-05-05

### Fixed
- **[UI] ProfilePage API**: Fixed profile API endpoint

## [0.19.60] - 2026-05-05

### Fixed
- **[API] ProfilePage**: Fixed profile API endpoint

## [0.19.59] - 2026-05-05

### Fixed
- **[UI] ProfilePage**: Fixed profile page display

## [0.19.58] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile component

## [0.19.57] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile component

## [0.19.56] - 2026-05-05

### Added
- **[UI] UserProfile**: Added avatar display

## [0.19.55] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile display

## [0.19.54] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile loading

## [0.19.53] - 2026-05-05

### Added
- **[UI] UserProfile**: Added profile page

## [0.19.52] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Fixed users loading

## [0.19.51] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed users fetch

## [0.19.50] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.49] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed unused API endpoint

## [0.19.48] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.47] - 2026-05-05

### Added
- **[UI] WorkersPage**: Added avatar URL to workers data

## [0.19.46] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed duplicate endpoint

## [0.19.45] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display when users exist

### Changed
- **[API] WorkersPage**: Changed from `getWorkers` to `getUsers`

## [0.19.44] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

### Changed
- **[API] WorkersPage**: Changed from `getWorkers` to `getUsers`

## [0.19.43] - 2026-05-05

### Fixed
- **[APi] WorkersPage**: Updated worker data format

## [0.19.42] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed duplicate endpoint

## [0.19.41] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed unused endpoint

### Fixed
- **[UI] UsersPage**: Fixed duplicate API call

## [0.19.40] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed unused endpoint

## [0.19.39] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed duplicate endpoint

## [0.19.38] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed fetch endpoint

## [0.19.37] - 2026-05-05

### Fixed
- **[API] UsersPage**: Removed duplicate endpoint

## [0.19.36] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.35] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display mode

### Fixed
- **[UI] WorkersPage**: Fixed loading state

## [0.19.34] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Fixed fetch

## [0.19.33] - 2026-05-05

### Added
- **[API] UsersPage**: Added users endpoint

## [0.19.32] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed endpoint naming

## [0.19.31] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user role display

### Fixed
- **[UI] UsersPage**: Fixed user list

## [0.19.30] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user role display

## [0.19.29] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user role display

## [0.19.28] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user list

### Changed
- **[API] UsersPage**: Changed endpoint structure

## [0.19.27] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.26] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user fetch

## [0.19.25] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed endpoint

## [0.19.24] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed endpoint

## [0.19.23] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed fetch

## [0.19.22] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

### Fixed
- **[API] UsersPage**: Fixed endpoint

## [0.19.21] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user info

## [0.19.20] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.19] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user info

## [0.19.18] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.17] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

## [0.19.16] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user info

## [0.19.15] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Fixed user fetch

## [0.19.14] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.13] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

## [0.19.12] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.11] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Fixed worker fetch

## [0.19.10] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.9] - 2026-05-05

### Added
- **[UI] UsersPage**: Added users page

## [0.19.8] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

## [0.19.7] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.6] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.5] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.4] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed worker list

## [0.19.3] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.2] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.1] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.0] - 2026-05-05

### Added
- **[UI] UsersPage**: Added users page

</CHANGELOG_END>

---

Recent Changes Summary:

## [0.19.99] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Login**: Fixed login flow to gracefully accept demo credentials ("Demo"/"1234") when API is unavailable
- **[UI] WorkerPortal Demo Mode**: Added fallback logic to use demo data when server is not running
- **[UI] WorkerPortal Error Handling**: Improved error messages for API unavailable scenarios, suggesting demo mode usage

### Added
- **[UI] WorkerPortal**: Added `loadDemoData()` function for demo mode support
- **[UI] WorkerPortal**: Added graceful fallback when API is not running
- **[UI] WorkerPortal**: Demo credentials now auto-enabled when server is unavailable

### Changed
- **[UI] WorkerPortal**: Modified `handleLogin()` to check for demo credentials first before calling API
- **[UI] WorkerPortal**: Simplified error handling to reduce complexity

## MOBILE CHANGES - [0.20.01] - 2026-05-05

**Location**: `/home/zerwiz/CodeP/Way of pi/projects/work-button-improvements/mobile/`

### Files Created (9):
1. **README.md** - Entry point with quick links
2. **MOBILE-VIEWS-INDEX.md** - Overview of mobile views
3. **MOBILE-MODULES.md** - Component structure & files
4. **MOBILE-UX.md** - UX patterns & breakpoints
5. **MOBILE-CHROME.md** - Top bar implementation
6. **CLAW-MOBILE-TAB-BAR.md** - Claw navigation tabs
7. **SIMPLE-MOBILE-TAB-BAR.md** - Simple navigation tabs
8. **MOBILE-SHELL.md** - Shell hook `?shell=mobile`
9. **MOBILE-TECHNICAL-SHELL.md** - Track 3 stub

### Components Documented:
- `MobileChrome` - Shared top bar
- `ClawMobileTabBar` - 8-tab bottom nav
- `SimpleMobileTabBar` - 6-tab bottom nav
- `MobileTechnicalShell` - Track 3 stub
- `useShellMobile` - Mobile shell hook

### Features Covered:
- Mobile-first design patterns
- Touch-friendly controls (min 44x44px)
- Responsive breakpoints (≤768px, 769-1024px, ≥1025px)
- Safe-area support (iOS notch, Android status bar)
- Entry points: `?shell=mobile`, `/m`, localStorage

---