# Changelog

Notable changes to this Pi extension playground are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Earlier work is not backfilled; entries start from when this file was added.

## [Unreleased]

### Added

- **Work Leader Integrations (Phase 3):**
  - **Kanban System Integration**: Migrated and adapted a comprehensive Kanban board from reference projects to `apps/wayofpi-ui/src/components/work/kanban/`.
  - **Theme Alignment**: Reskinned all Kanban components (Board, Cards, Modals) with Way of Pi brand colors (`bg-[#252526]`, `border-[#ea580c]`, `text-[#cccccc]`).
  - **Work Board**: Integrated `WorkBoard.tsx` into the `WorkApp` Tasks tab, enabling drag-and-drop task management.
  - **Task Detail View**: Refactored `WorkTaskCard.tsx` (2244 lines) to support the new theme and interface with `mockKanbanService`, `mockTasksService`, and `mockDriveService`.
  - **Docs & Team Views**: Adapted `WorkDocsView.tsx` for planning document management and `WorkTeamView.tsx` for worker roster and role management within the board.

- **Headless Pi Spine (Phase 2):** Transition tool execution to authoritative Pi CLI (`--mode json`):
  - **Pi Tool Execution** (`orchestrator-tools-exec.ts`):
    - Added `executeToolViaPi()` - runs tools via `pi --mode json --tool <name> --args '<json>'`.
    - Added `isPiToolExecutionEnabled()` - checks `WOP_CHAT_ENGINE` env var (`pi` = always, `auto` = check PATH, `bundled`/`bun` = never).
    - Modified `executeOrchestratorTool()` to delegate to Pi CLI when headless mode is enabled.
  - **Behavior:**
    - `WOP_CHAT_ENGINE=pi`: Always use Pi CLI for tool execution.
    - `WOP_CHAT_ENGINE=auto` (default): Use Pi if `pi` resolves on PATH, else fall back to Bun-native tools.
    - `WOP_CHAT_ENGINE=bundled`/`bun`: Always use Bun-native tools (no Pi dependency).
  - **Benefits:** Pi becomes authoritative tool executor with `registerTool`, `dispatch_agent`, extensions, and slash commands working inside Pi subprocess.

- **Manifest-Driven UI (Phase 2):** Fetch command palette and tool lists dynamically via `GET /api/manifest`:
  - **API Endpoint** (`server/index.ts`): Returns dynamic UI configuration based on user role (ANONYMOUS, WORKER, LEADER, CLIENT, SUPER_ADMIN):
    - `ui_modes`: Available UI modes (simple, technical, claw, docs, work) filtered by role.
    - `commands`: Command palette items (chat, agents, workspace, settings, tasks, time, files, team, projects, etc.) filtered by role.
    - `tools`: Tool lists (read_file, edit_file, bash, web_search, whatsapp_send, time_log, task_create, ai_predict, etc.) filtered by role.
    - `features`: Feature flags (whatsapp_bot, cad_support, ai_predictions, multi_tenancy, client_portal, etc.).
    - `navigation`: Navigation items for main, portal, admin, client sections based on role.
  - **Role-Based Filtering**: ANONYMOUS sees core commands only; WORKER sees work-related; LEADER sees leadership tools; CLIENT sees client views; SUPER_ADMIN sees admin tools.

- **Client Role UI (Phase 2):** Stakeholder view for project progress, drawings, and feedback reporting:
  - **API Endpoints** (`server/index.ts`):
    - `GET /api/client/projects` - List projects for client's tenant (read-only, excludes drafts).
    - `GET /api/client/projects/:id/progress` - Get project progress (tasks summary, hours, budget, completion %).
    - `GET /api/client/drawings` - List drawings/documents (CAD files: .dwg, .rvt, .pdf, images).
    - `POST /api/client/feedback` - Submit feedback (rating, comment, category) logged to audit_logs.
  - **UI Page** (`pages/ClientDashboard.tsx`):
    - Project selector with progress overview (completion %, budget spent, hours, tasks).
    - Drawings tab with file listing (type badges: dwg=blue, rvt=purple, pdf=red).
    - Feedback tab with star rating (1-5), category selector, comment form.
    - Way of Pi color scheme (`bg-[#252526]`, `border-[#ea580c]`, `text-[#cccccc]`).

- **Mobile UI Verification Section (TODO.md):** Added comprehensive mobile UI verification checklist to `plans/productionready/TODO.md`:
  - References `plans/mobile/README.md` and `plans/mobile/Comprehensive-Mobile-Implementation-Plan.md` (1255 lines).
  - Covers all Phase 1-4 features requiring mobile UI support.
  - 5 Tracks overview: Shared foundations, Claw mobile, Simple mobile, Technical mobile, PWA + offline, Polish + performance.
  - Mobile testing checklist from `plans/mobile/README.md` (entry via `?shell=mobile` or `/m` path).
  - Current mobile state: `MobileChrome.tsx`, `ClawMobileTabBar.tsx`, `SimpleMobileTabBar.tsx`, `MobileTechnicalShell.tsx` (stub).

- **Database Optimization (Phase 4):** Verified production-ready SQLite configuration in `schema.sql`:
  - WAL mode enabled (`PRAGMA journal_mode = WAL;`) for concurrent reads (line 5).
  - 8 performance indexes added: `idx_users_tenant_role`, `idx_users_phone`, `idx_projects_tenant`, `idx_tasks_tenant`, `idx_tasks_project`, `idx_tasks_assignee`, `idx_tasks_status`, `idx_time_user_date`, `idx_time_status`, `idx_audit_tenant_time`.
  - Foreign key constraints enabled (`PRAGMA foreign_keys = ON;`).
  - Synchronous mode set to NORMAL for balance of safety and speed.

- **Super Admin Dashboard (Phase 2):** System-wide management console for SUPER_ADMIN users:
  - **API Endpoints** (`server/index.ts`):
    - `GET /api/admin/tenants` - List all tenants with user counts (requires SUPER_ADMIN role).
    - `POST /api/admin/tenants` - Create new tenant (name, slug, subscription_tier).
    - `GET /api/admin/stats` - System statistics (tenants, users, projects, tasks, time entries).
    - `GET /api/admin/users` - List all users system-wide with tenant names.
  - **UI Page** (`pages/SuperAdminDashboard.tsx`):
    - System statistics cards (5 metrics).
    - Tenant management tab (create, view, subscription tiers).
    - Users overview tab (all users with roles, tenant names, status).
    - Stats tab with visual icons.
    - Way of Pi color scheme (`bg-[#252526]`, `border-[#ea580c]`, `text-[#cccccc]`).

- **Worker Portal APIs (Phase 2):** Implemented real database queries for all Worker Portal endpoints in `server/index.ts`:
  - `/api/portal/tasks` - Fetches tasks assigned to worker with project names (tenant-scoped, ordered by due date).
  - `/api/portal/files` - Lists workspace files from `workspace_files` table (tenant-scoped, created_at DESC).
  - `/api/portal/time` GET - Retrieves worker's time entries with task/project info (limit 100, ordered by date DESC).
  - `/api/portal/time` POST - Saves new time entries to DB (validates required fields, supports task/drawing references).
  - `/api/portal/download/:fileId` - Secure file downloads with path validation (ensures files stay within tenant workspace), updates download count, logs audit entry.
  - `/api/portal/me` - Returns authenticated user details (id, username, role, tenantId) from users table.

- **User Profile Page:** Added requirement for personalized profile management where users can update details, change security credentials (PIN/password), and manage preferences.
- **Production Distribution Plan:** Created `plans/PRODUCTION_AUTH_TENANCY_WORKLEADER_ALIGNMENT.md` - a comprehensive roadmap for one-click cross-platform installation, multi-tenancy, and cloud/host deployment options.
- **Multi-Tenancy Core:** Refactored server-side workspace state to support isolated `tenantId` mappings. All file and agent operations are now scoped by organization.
- **JWT Authentication:** Implemented secure login/registration system using `jose`. Added middleware to protect REST and WebSocket endpoints.
- **Flexible Deployment:** Added production `Dockerfile` and `docker-compose.yml` for cloud deployments. Refactored server to run either locally (SQLite/Ollama) or in the cloud (PostgreSQL/Centralized AI).
- **Desktop Packaging:** Integrated `electron-builder` into `apps/wayofpi-ui/package.json` to generate native `.dmg`, `.exe`, and `.AppImage` binaries. Added `npm run pack` script.
- **One-Click Installers:** Created `scripts/install.sh` (Unix) and `scripts/install.ps1` (Windows) to automate the entire setup process for non-technical users, including Ollama and model retrieval.
- **Two-Tier Login System:** Defined "Simple Login" (ID + PIN) for Workers and "Secure Login" (JWT) for Project Leaders, aligned with the Work Leader System.

### Added

- **Docs UI mode:** New standalone `"docs"` UI mode (3-panel layout: file tree | chat | preview) with `docs/DocsApp.tsx`, added to `UiMode` and `ChatSessionSurfaceId` types. Toggle cycle: `simple → technical → claw → docs → simple`. Docs button added to `UiModeToggle` header.
- **WhatsApp/Telegram separation:** Moved `plans/WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md` to `plans/` root. Added **Timed Messages** feature for project managers: automated daily messages to employees' phones via WhatsApp/Telegram with "what to do today" (pulls from Work mode). Claw Contacts tab gets "Timed Messages" section.
- **Work Leader System:** Created `plans/WORK_LEADER_SYSTEM_PLAN.md` - unified ecosystem connecting:
  - Docs Mode (document evaluation + sharing to workers via shared-info/ folder)
  - Time Management (Work mode: time tracking, task assignment, approval workflow)
  - WhatsApp/Telegram automation (timed messages, document notifications, Claw chat from phones)
  - **Two WhatsApp Bots:** @WorkTimeBot (workers) + @WorkLeaderClaw (leader) - separate numbers, different toolsets
  - **Construction Workers Support:** PDF/blueprint viewing, CAD files (.dwg, .rvt), drawing-linked time entries
  - **Worker Portal (Login System):** Web portal where workers login with ID+PIN, download files/folders, log time (alternative to WhatsApp)
  - Claw integration (workers request docs via chat, leader shares info in specialized folder)
  - Full workflow automations (plan → tasks → time entries → notifications)
- **Time Management View:** `plans/WOP_TIME_MANAGEMENT_PLAN.md` - new `"work"` UI mode for workers to submit time/tasks, leaders to approve/manage.
- **Docs Mode Improvements:** `plans/WOP_DOCS_MODE_IMPROVEMENTS.md` - redesign Docs mode for project managers (document browser, markdown viewer, PM-focused chat).
- **WhatsApp Plan:** `plans/WOP_WHATSAPP_PLAN.md` (in `docs/wayofpi/`) - detailed WhatsApp integration with `whatsapp-pi` extension.
- **Pi Integration in Docker:** `plans/PI_INTEGRATION_DOCKER_PLAN.md` - install Pi (`www.pi.dev`) via `npm install -g @mariozechner/pi-coding-agent` in Docker, run as non-root user (UID 1001), integrate with Work Leader System.
- **Production Readiness:** `plans/PRODUCTION_READINESS_PLAN.md` - complete cross-platform distribution (curl | bash, Electron Builder, Docker/VM) with multi-tenancy + auth.
- **UI Components Created:**
  - `pages/WorkerPortal.tsx` - Worker login (ID+PIN) + dashboard (tasks, files, time entries)
  - `components/work/WorkApp.tsx` - Time management UI (time entries, tasks, contacts, leader/worker toggle)
  - `components/docs/DocumentEvaluationPanel.tsx` - Document evaluation (checklist, notes, approval/rejection, share to workers)
- **Simple secondary toolbar:** Indexing status dot + "Docs" button (`FileText` icon) to switch to docs mode. `SimpleSecondaryToolbar` now accepts `onSwitchToDocs` and `indexingStatus` props.
- **File tree context menu:** Right-click menu in `FileExplorer` with Copy path (clipboard), Rename (`POST /api/fs/move`), Delete (`POST /api/fs/delete`). Imports: `Copy, Pencil, Trash2` from `lucide-react`.
- **Editable file types:** `EDITABLE_EXTENSIONS` set + `isFileEditable()` in `server/paths.ts` (supports md, txt, doc, pdf, js, ts, py, json, etc.).
- **Docs UI plan:** `plans/PLAN-DOCS-UI.md` with full specification.
- **Docs mode improvements plan:** `docs/WOP_DOCS_MODE_IMPROVEMENTS.md` - redesign Docs mode for project managers (document browser, markdown viewer, simplified PM chat).
- **Time management view plan:** `docs/WOP_TIME_MANAGEMENT_PLAN.md` - new `"work"` UI mode for time tracking and task management (workers submit time/tasks, leaders approve/manage).
- **Project structure doc:** `docs/STRUCTURE.md` with 3-level project structure and descriptions.

### Fixed

- **System Startup (`start-wayofpi.sh`):** Fixed a critical PID extraction bug where the script incorrectly attempted to kill file descriptors (e.g., `11`) instead of process IDs when clearing ports 3333 and 5173. 
- **System Persistence (`start-wayofpi.sh`):** Added `wait "$DEV_PID"` to prevent background servers from being terminated by `SIGHUP` when the startup script finishes.
- **Justfile Targets:** Restored the missing `wayofpi-full` target name and updated both `wayofpi-full` and `wayofpi-electron` to use the correct startup commands and scripts.
- **Linux Launcher (`linux/wayofpi-launch.sh`):** Removed a redundant port check that was blocking the app from starting when stale processes were present; `start-wayofpi.sh` now handles all cleanup automatically.
- **UI Code Editor:** Fixed `highlight.js` deprecation warnings by removing `.js` extensions from language imports.

### Added

- **Electron-First Startup:** Refactored `start-wayofpi.sh` to default to Electron mode for a native desktop experience. Added a `--web` flag for the optional browser view.
- **Dedicated Electron Script:** Created `start-wayofpi-electron.sh` to explicitly launch the Electron shell.
- **Startup & Connectivity Guide:** Added **[docs/STARTUP_GUIDE.md](docs/STARTUP_GUIDE.md)** covering local startup, LAN access, and internet reachability via ngrok.
- **Diagnostic Documentation:** Added **[docs/debug/SYSTEM_STARTUP_FIX_2026-05-04.md](docs/debug/SYSTEM_STARTUP_FIX_2026-05-04.md)** detailing the root cause and resolution of the system startup failures.

### Removed

- **Legacy Logs:** Cleaned up several stale/temporary log files from the root directory (`startup.log`, `startup_test.log`, `restore_test.log`, etc.) that were cluttering the workspace.

### Added

- **Settings → ngrok:** **Terminal** column inject chips call **`sendTerminalInput`** (`terminalInputBridge`) to paste **`ngrok config add-authtoken `**, **`ngrok http <port>`**, run **http** / **version**, or **`cd apps/wayofpi-ui && bun run server/index.ts`** into the modal terminal.

- **Settings → ngrok:** **Terminal** column mounts the same **`EmbeddedTerminal`** as the bottom-dock **Terminal** (`/ws/terminal`, workspace cwd) on the **right** so instructions stay **scrollable** on the left (stacks below on narrow viewports).

- **Root [README.md](README.md):** **Way of Pi web UI** subsection **Public HTTPS URL (ngrok, optional)** plus **Documentation** tables link to **[docs/WOP_NGROK.md](docs/WOP_NGROK.md)**; **[docs/README.md](docs/README.md)** indexes **WOP_NGROK**.

- **`docs/WOP_NGROK.md`** — ngrok with Way of Pi: Settings flow, ports, env vars, HTTP APIs, tunnel login, security; linked from **`docs/WAY_OF_PI_INTRODUCTION.md`**, **`docs/REPO_INDEX.md`**, **`apps/wayofpi-ui/README.md`**.

- **Settings → ngrok:** **`POST /api/dev/ngrok-tunnel`** **`action: "install-bundled"`** runs **`bun install`** or **`npm install`** in **`apps/wayofpi-ui`** so the optional **`ngrok`** package can download the agent; UI primary **Install ngrok into this app** + **Start tunnel now** instead of terminal-first copy. **`GET /api/dev/ngrok-tunnel`** adds **`installBundledAllowed`**.

- **Tunnel login (ngrok-style hosts):** HTTP **Basic Auth** when **`Host`** / **`X-Forwarded-Host`** looks like a public tunnel (hostname contains **`ngrok`**, or **`WOP_TUNNEL_GATE_HOST_MARKERS`**). Credentials stored as **`tunnel-gate.v1.json`** under **`WOP_HOME`** (scrypt password hash). **Bun** (`server/index.ts`) and **Vite dev** (`vite.config.ts` middleware + **`X-Forwarded-Host`** on `/api` / `/ws` proxy) share the same file. **Settings → ngrok → section 4** + **`GET`/`POST /api/dev/tunnel-gate`**.
- **`scripts/install-ngrok-optional.sh`** (+ **`just install-ngrok-optional`**) — optional ngrok agent: prints official **apt** / **Homebrew** install lines; **`--install`** runs **Debian/Ubuntu** **`sudo apt`** when requested. **Bootstrap** probe lists **ngrok** and hints when missing.
- **Settings → ngrok:** **`GET /api/dev/share-url-hints`** (Bun) — best-effort **LAN** URL for same-Wi‑Fi phones and **public** `https://…` from the ngrok local inspector when an ngrok agent is running. **`apps/wayofpi-ui/server/share-url-hints.ts`**, **`apps/wayofpi-ui/server/ngrok-inspector.ts`**.
- **Settings → ngrok:** **`GET` / `POST /api/dev/ngrok-tunnel`** (Bun) — CLI resolution **`WOP_NGROK_BINARY`** → PATH → bundled **`node_modules/ngrok/bin`** from **optionalDependency** **`ngrok`** (**`apps/wayofpi-ui/package.json`** — skip with **`npm install --omit=optional`**); **`POST`** **`set-authtoken`** / **`start`** / **`stop`** (**`WOP_ALLOW_NGROK_SPAWN`** gates **`start`**/**`stop`** only). **`apps/wayofpi-ui/server/ngrok-binary.ts`**, **`ngrok-tunnel-manager.ts`**. **Stop** only kills the process this server started.

- **Way of Pi UI — mobile shell (Track 0 + Claw mobile + Simple mobile):** **`?shell=mobile`**, **`/m`**, **`localStorage`** **`wayofpi.shell.mobile`**, **`MobileChrome`**, **`ClawMobileTabBar`**, **`SimpleMobileTabBar`**. **Claw chat** stacks the transcript column; **Sessions** bottom sheet + **Workspace** full-screen overlay; **Files** tab stacks tree over editor; **`ClawHelpModal`** **`layout="mobile"`** (**`100dvh`**, horizontal section chips, safe-area). **Simple** uses **`SimpleApp`** **`layoutVariant="mobile"`** (file sheet, editor overlay, bottom tabs) with **`MobileChrome`** instead of a separate placeholder shell. **Technical** remains a stub (**`MobileTechnicalShell`**). Mobile-only code lives under **`apps/wayofpi-ui/src/components/mobile/`**; **`App.tsx`** imports **`./components/mobile`**. **`apps/wayofpi-ui/src/components/mobile/README.md`** — tree map. **[docs/WOP_MOBILE_UI_PLAN.md](docs/WOP_MOBILE_UI_PLAN.md)**.

### Changed

- **Electron dev (`ELECTRON_DEV=1`):** **`app.whenReady`** runs the same **Bun API** bootstrap as **Start service** (spawn **`bun run server/index.ts`** from **`apps/wayofpi-ui`** when **`/api/health`** is absent or stale). Opt out with **`WOP_ELECTRON_SKIP_BUN_AUTOSTART=1`**. **`electron/electron-main.mjs`**, **`apps/wayofpi-ui/README.md`**, **`apps/wayofpi-ui/.env.sample`**.

- **Settings → ngrok:** When **`GET /api/dev/ngrok-tunnel`** fails (**404** / no Bun), the dialog now explains why the **authtoken** field and **tunnel switch** are missing and gives **Bun + Vite** fix steps plus a **CLI-only** fallback (`ngrok config` + `ngrok http`).

- **Settings → ngrok:** Managed **`start`** refuses to run until **TCP accepts** on **`127.0.0.1:`** + tunnel port (default Vite **5173**); **`GET /api/dev/ngrok-tunnel`** adds **`backendListening`**, **`inspectorUrl`**, and optional **`WOP_NGROK_WEB_ADDR`** (inspector **`/api/tunnels`** + **`--web-addr`** when spawning). UI warns on **ERR_NGROK_3200** / stale URLs. **`docs/WOP_NGROK.md`**, **`apps/wayofpi-ui/.env.sample`**.

- **Settings → ngrok:** **`/api/dev/ngrok-tunnel`**, **`/api/dev/share-url-hints`**, and **`/api/dev/tunnel-gate`** are served in **`NODE_ENV=production`** the same as in development (no **404** from Way of Pi for that reason). **`install-bundled`**, **`set-authtoken`**, and managed **`start`**/**`stop`** no longer depend on **`NODE_ENV`**; **`WOP_ALLOW_NGROK_SPAWN`** remains the opt-out for managed spawn/stop only.

- **Settings → ngrok:** **`POST set-authtoken`** is **not** gated on **`WOP_ALLOW_NGROK_SPAWN`** (spawn/start/stop remain gated by that flag). **`GET /api/dev/ngrok-tunnel`** includes **`authtokenSaveAllowed`**. Inspector **`fetchNgrokPublicUrl`** default timeout **3s**, filters **HTTP/HTTPS** tunnels only, **`share-url-hints`** / status use longer reads; managed start polls up to **~20s**.

- **Menu bar — Electron:** closing menus on **`document`** now listens for **`click`** instead of **`mousedown`**, so the same gesture that opens **File** / **Edit** / … is not dismissed before React commits **`openMenu`** (which could hide dropdowns in Electron).

- **Menu bar — Electron / desktop chrome:** **File** … **Settings**, **command palette**, **model** strip, **sidebar** toggle, and **mobile** menu controls run their toggle on **primary `pointerdown`** and skip the following **`click`** (dedupe ref) so **`document`** **`mousedown`** dismiss layers elsewhere in the shell cannot eat the gesture before **`click`** fires. **`UiModeToggle`** uses the same pattern for **Simple** / **Technical** / **Claw**.

- **Menu bar — layout / hit-testing:** the bar is rendered with **`createPortal(..., document.body)`** and **`position: fixed`** (**`z-[95]`**) so it is not covered by nested workspace stacking (**`zoom`**, overflow, high **`z-index`** panes). A **`h-8`** in-flow spacer (**`data-wop-menu-bar-layout-spacer`**) keeps the shell layout unchanged. **`CommandPalette`** overlay **`z-index`** is raised to **`z-[200]`** so it still stacks above the portaled menu.

- **Menu bar — desktop dropdowns:** **`overflow-x-auto`** on the same row as **`absolute top-full`** menus forced the used **`overflow-y`** to clip, so **File** / **Edit** / … could show the open state with no visible panel. Horizontal scroll now wraps **only** the wordmark strip; **nav**, **mobile activity**, **hamburger**, and **UiModeToggle** sit in an **`overflow-x-visible`** sibling so dropdowns paint below the bar.

- **Menu bar — alignment:** the wordmark scroll strip no longer uses **`flex-1`**, which had stretched that strip across the whole left region and pushed **File … Settings** and **UiModeToggle** to the right; it is **`shrink-0`** again so menus sit directly after the logo cluster.

- **Way of Pi UI — mobile header:** **`MenuBar`** hides the **WAY OF PI** wordmark below the **`md`** breakpoint (keeps the blue terminal icon; group has **`title="Way of Pi"`**). **`SimpleNavRail`** hides the same label on small viewports so the narrow nav drawer stays compact.

- **Technical UI — narrow panels (`md` and below):** **`WorkspacePane`** stacks **Open file**, **Agent chat**, **Split**, **Maximize**, and **Close cell** behind a **⋯** menu instead of a crowded icon row; **`ChatPanel`** does the same for **dock side**, **thinking** toggle, and **New chat**. Tab-strip right padding is smaller on small screens so session tabs stay in view. The workspace tab-strip **left** chrome (back/forward, add, grid picker) can scroll horizontally when needed.

- **Technical UI — mobile tab history:** **`WorkspacePane`** hides **Back** / **Forward** chevrons below **`md`** and exposes the same actions at the top of the **⋯** pane menu.

- **Technical UI — editor grid in pane menu:** **`WorkspaceGridLayoutPicker`** is **`md:flex`** in the tab strip only; below **`md`** the **LayoutGrid** control lives in the same **⋯** menu (after Back / Forward) via a **`menu`** variant so narrow layouts do not overflow.

- **Technical UI — activity bar on narrow viewports:** the vertical **ActivityBar** is hidden below the **`md`** breakpoint (**App** wraps it with **`md:contents`**). **MenuBar** adds a **`md:hidden`** **panel** control that opens the same six views (**Explorer**, **Search**, **Source control**, **Run and extensions**, **Plan mode**, **Settings**), driven by **`technicalActivity`** from **App**.

- **Menu bar — narrow viewports:** the **File** … **Settings** strip is **desktop-only** (**`md:flex`** on **nav**). Below **`md`**, a **hamburger** (**`Menu`**) opens a sheet: pick a menu name, then the same submenu as desktop (**`renderMenuPanels`**); **Back** returns to the name list. **`FileMenuContent`** supports **`embed`** for in-sheet layout. Outside clicks and **`closeMenus`** dismiss the sheet like other menu surfaces.

- **Menu bar — model strip on narrow viewports:** the server **model** control keeps only the **green status dot** and **chevron** in the header below **`md`**; the monospaced label shows again from **`md`** upward and remains in the model **dropdown** panel. **`title`** and **`aria-label`** include the full label when the text is header-collapsed.

- **Menu bar — command palette on narrow viewports:** the **Search** control is always visible; below **`md`** it is **icon-only** (magnifying glass), with placeholder copy and **⌘K** from **`md`** up. **`title`** / **`aria-label`** carry the shortcut when the label is collapsed.

- **Technical UI — footer + composer overflow:** **`StatusBar`** uses **`w-full min-w-0`**, **`flex-1`**, and **horizontal scroll** on the primary (left) cluster with **`ml-auto`** on the right meta column so the orange strip does not push off-screen. **`ChatPanel`** composer uses **`min-w-0`**, a **scrollable** control row, **shorter agent picker** on small widths, **“Pane”** vs **“Pane team”** label, **full-width** alignment for **Build/Plan + Send** when wrapped, and **`flex-wrap`** on the plan handoff row.

- **Status bar — narrow viewports:** the **footer** uses **`overflow-x-auto`** (with **hidden scrollbar** + **`touch-pan-x`**) instead of clipping, **`md:justify-between`** keeps the wide layout, Zed / tool clusters use **`shrink-0 flex-nowrap`**, and the **language** / **workspace path** controls use **`whitespace-nowrap`** (tighter **`max-w`** on the path on small screens) so icons and text do not stack on top of each other.

- **Chat panel — narrow Technical / embedded layouts:** the session header row no longer uses **`overflow-hidden`**, so the **⋯** actions menu is not clipped. Below **`md`**, **Expand chat over workspace** in that menu (when docked or embedded in the grid) fixes the panel under the menu bar (**`top: 32px`**) with a dim backdrop (**`Escape`** or backdrop tap exits); **`document.body`** overflow locks while expanded.

- **Claw workspace file navigation (`App.tsx`):** duplicated **Chat + `clawMenuFileFocusRev` bump** vs **Files** tab logic is centralized in **`focusClawTabAfterWorkspaceFileSelect`** (same behavior as before; easier to keep menu, palette, history, and save flows aligned).

- **Way of Pi UI — per-shell chat:** **Simple**, **Technical**, and **Claw** each keep separate session tabs, transcripts, persisted plan/build + agent picks, and **`activate_session`** / JSONL keys (**`useWayOfPiSession`** `surfaceId` + **`wireSessionKeyForSurface`**). Technical defaults to orchestrator; only Claw auto-selects the **`claw`** agent when present.

- **Chat engine default:** when **`WOP_CHAT_ENGINE`** is **unset**, the Way of Pi Bun server now behaves like **`auto`** (headless **`pi --mode json`** when the **`pi`** CLI resolves, otherwise the interim Bun provider). Set **`WOP_CHAT_ENGINE=bundled`** or **`bun`** to force Bun-only. **Non-keyword values** (e.g. mistaken **`WOP_CHAT_ENGINE=ollama`**) are treated as **`auto`**, not Bun-only — use **`WOP_LLM_PROVIDER`** for ollama vs openrouter. Docs and Mission copy updated (**`server/pi-agent-runtime.ts`**, **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**, **`apps/wayofpi-ui/README.md`**, **`.env.sample`**).

- **Claw help + product doc:** Schedule **Phase D** messaging updated — definitions and runs use host **`.claw/schedule/`**, **`WOP_CLAW_SCHEDULER=1`** runs headless Pi turns when Pi drives chat; help modal / **`docs/WOP_CLAW_MODE_PLAN.md`** no longer describe schedules as browser-only or “Phase D stub.”

- **Claw Schedule tab UX:** **`GET/PUT /api/claw/schedules`** and **`GET /api/claw/mission-events`** are registered early in the Bun API router (fewer stale-route 404s). The tab shows **loading** until the first server sync, surfaces **sync errors**, and replaces the always-orange “Server execution” strip with **contextual** status (green when Pi + scheduler are on, blue info when only env/setup is missing). **`apps/wayofpi-ui/.env.sample`** comment for **`WOP_CLAW_SCHEDULER`** points at **`.claw/schedule/`**.

### Changed

- **Claw Mission → Engine status:** With **`WOP_CHAT_ENGINE=auto`** or **unset**, missing **`pi`** is shown as a **neutral / OK** “Bun chat — Pi optional” row (expected fallback), not an error. **Orange** remains for **`WOP_CHAT_ENGINE=pi`** without a CLI, Bun-only **`bundled`/`bun`**, or Pi installed but JSON off.

- **Claw Mission — overall “healthy” chrome:** the top status strip is **red** when disconnected, **orange** only when the engine row is a real problem (not loading / not planned OK), and **subtle green** when connected and the engine is OK or planned. **Orchestrator tools** uses a warning icon only while config loads; with **`piDrivesChat`** it states Pi-owned tools; with interim Bun chat and tools off it is **OK + planned** (plain completions) instead of an error.

### Changed

- **`GET /api/config`** adds **`workspaceDotPiPresent`** when the opened workspace contains a **`.pi/`** directory (config only). Claw Mission uses it to explain that **`.pi/`** is not the Pi **executable**.

- **Engine messaging (Mission + status model label):** Clarifies that Technical **Orchestrator** + streamed **thinking** can run on **Bun → LLM** while Mission’s “Pi” row refers to resolving the **`pi`** CLI for **`pi --mode json`**. Model strip shows **`Bun · …`** when not **`piDrivesChat`** so it is not mistaken for the Pi engine.

### Fixed

- **Simple / Claw — MIT license modal in light Appearance:** **`MitLicenseModal`** accepts **`appearanceDark`** (default unchanged); **App** passes **`llmFixModalAppearanceDark`** so **Help → View License** matches other modals in **light** Simple and Claw.

- **Simple / Claw — workspace + Run modals in light Appearance:** **`NewWorkspaceFileModal`**, **`LaunchConfigAddModal`**, and **`InstallDebuggersModal`** accept **`appearanceDark`** (default unchanged). **App** passes **`llmFixModalAppearanceDark`** so **light** Simple and Claw match **`NewPlanFileModal`** / **`LlmFixModal`** instead of always using the dark VS Code–style panel.

- **Simple — New plan document:** **`NewPlanFileModal`** was never mounted in the **Simple** shell, so **File → New plan markdown** (and **`handleNewPlanFile`**) opened state with **no dialog**. The modal is now rendered next to **`NewWorkspaceFileModal`**. **`NewPlanFileModal`** accepts **`appearanceDark`** (defaults unchanged) so **Simple / Claw / Technical** can match **`llmFixModalAppearanceDark`** / light **Appearance** like other modals.

- **Claw — Run / workspace modals:** **`NewWorkspaceFileModal`**, **`LaunchConfigAddModal`**, and **`InstallDebuggersModal`** are now mounted in the **Claw** shell (same **`MenuBar`** **`runMenu`** / shared state as Simple and Technical). Previously **Run → Add Configuration** / **Install Additional Debuggers** could flip **`open`** with **no dialog** in Claw.

- **Claw — StatusBar:** footer no longer treats **`uiMode === "claw"`** as the Technical IDE — **Zed** strip, **tool dock**, and ESLint/tsc **Problems** counts stay **Technical-only**; Claw keeps **Connected** / **Offline** (not **live** / **offline**). The **Problems** control is **omitted** in Claw (no Technical Problems panel); Simple and Technical keep their previous behavior. **`ChatPanel`** dock width / embedded split / plan-handoff wiring use **`uiMode === "technical"`** so a future Claw embed cannot inherit Technical dock layout by mistake.

- **Claw — chrome copy:** **`MenuBar`** primary-sidebar chevron only shows in **`uiMode === "technical"`** (not merely non-Simple). **`LlmFixModal`** footer hint for non-Simple is split: Technical keeps the status-bar note; Claw gets a **Settings / model strip** pointer instead of implying a Technical-only footer.

- **Claw — LLM fix modal theme:** **`LlmFixModal`** **`appearanceDark`** no longer follows **`uiMode !== "simple"`** (which forced a dark modal in **light** Claw). It now uses **`simpleIsDark`** for Simple and Claw (shared **`useSimplePreferences`** with **`ClawApp`**) and stays dark-only when **`uiMode === "technical"`**.

- **Claw — Pi model / provider files from global chrome:** **`openPiModelConfigInEditor`** now matches **`focusWorkspaceFileFromMenu`** on narrow / **`?shell=mobile`**: **Chat** + **`clawMenuFileFocusRev`** bump so the **`.claw/`** file sheet opens; wide Claw still jumps to the **Files** tab.

- **Claw — wide desktop workspace file opens:** **`handleOpenFilePrompt`**, **`handleNewTextFile`**, **`performCreateNewWorkspaceFile`**, **`handleOpenFileInDock`**, **`handleSaveAs`**, **`openPlanFileForReview`**, command palette **Open: …**, **View** catalog **openFile**, and **Go → Back / Forward** now use the same rule as **`focusWorkspaceFileFromMenu`**: **Chat** + file-focus bump only when **`shouldBumpClawMenuFileFocus`**; otherwise **Files** (workspace tree + editor) instead of leaving a wide layout on **Chat** without the editor surface.

- **Claw — Agent / team menu:** **Agent setup** (**`openAgentSetupFromMenu`**) now opens **Claw → Team** instead of forcing **Simple**. **Workspace grid** picker and **Team pulse → agent dock** only attach in **`uiMode === "technical"`** (no stray dock updates in Claw).

- **Claw — View / Settings menus:** **View → workspace views catalog** (and catalog/schema file actions) now works in **Claw** (`viewSimpleMenu` when **`uiMode === "claw"`**, with **`setClawTab`**, **`focusWorkspaceFileFromMenu`**, and narrow/mobile file-focus bumps). **Settings → Simple app settings / AI Brains / Projects** stays on Claw (**Settings** / **Files** tabs) instead of forcing **Simple** mode. **New plan file** after save no longer treats Claw as “technical” for the post-create navigation branch.

- **Simple UI — headers in view:** chat **“Chat with …”** hero is **outside** the transcript scroll (same idea as compact chrome), so session titles stay visible while messages scroll. Simple shell uses **`100dvh` + `min-h-0`** instead of **`h-screen`** so the column height matches the dynamic viewport. Side-by-side chat column drops a **`min(36vh,280px)`** floor that could squeeze chrome on short viewports. **Claw** shell and **Technical** root column use the same **`100dvh` / `min-h-0`** pattern for consistent viewport fitting.

- **`handleSaveAs` (Simple):** dependency list now tracks **`shouldBumpSimpleMenuFileFocus`** (not **`shellMobile`**) so **Save as** on a **narrow** Simple viewport still runs the file-focus bump and opens the **narrow editor** sheet when appropriate.

- **Simple — narrow phone browser (≤767px, no `?shell=mobile`):** primary nav defaults **closed** with a **left drawer** (backdrop, **Escape**); **StatusBar** hidden until **`md`**. Chat avoids **`side_by_side`** on narrow (no empty **“edit here”** column under the transcript). **Project files** strip under the secondary toolbar opens the tree as a **right-edge sheet**; **`rightOpen`** defaults **closed** on narrow; opening a file does not force **`side_by_side`**. With a file open, the editor is a **left slide-over** over the chat (**Open file** / tree pick / agent file / plan review), not a second in-flow column. **`simpleMobileMenuFileFocusRev`** from **App** (menu, palette, history, new file, views catalog, etc.) now bumps on narrow Simple as well as **`?shell=mobile`**, so those opens raise the **narrow editor** sheet automatically.

- **Mobile shell — headers vs viewport:** **Simple** project-file and editor sheets and **Claw** session / workspace sheets are **`absolute`** inside the chat column (not **`fixed`** + **`100dvh`**) so sheet headers sit in the app column below **`MobileChrome`** instead of aligning to the browser viewport top. **`SimpleChatView`** **`compactChrome`** title row is **outside** the transcript scroll so it stays visible.

- **Claw — narrow desktop browser (≤767px):** same pattern as Simple — **Claw** nav defaults **closed**, **Claw menu** strip opens a **left drawer** (backdrop, **Escape**), **StatusBar** hidden until **`md`**.

- **Chat mobile UX:** **`SimpleChatView`** **`compactChrome`** — smaller **Mode / Stream / Thinking** controls, compact composer, slim header on **`?shell=mobile`** and **narrow Simple**; **Project files** opens as a **right-edge sheet**; **file editor** opens as a **left-edge sheet** over the chat column (dimmed backdrop) so the transcript stays usable. **Claw** workspace file panel uses a **right-edge sheet** on mobile; **ClawSessionStrip** touch targets tightened.

- **Claw mobile Files tab:** **Hide tree** / **Show .claw tree** toggles the upper **`.claw/`** file tree so the document panel can use **full height** when the tree is collapsed.

- **Simple mobile — file from global chrome:** opening a workspace file via **menu** (**Teams YAML**, **Edit workspace views catalog**), **View** catalog actions, or command palette **Open:** now raises **`simpleMobileMenuFileFocusRev`** so **`SimpleApp`** opens the **editor overlay** (same as in-app tree picks), not only the chat strip with **Open file**. Same **`setSimpleTab("chat")` + bump** for **`openPlanFileForReview`** (plan review / compose), **Save as** to a new path, **back/forward** navigation, **New file**, **Create workspace file** / **Open file** prompts, **Open file in workspace** from the dock, **new plan** creation, and **Pi model config** opened as a file in Simple.

- **Claw — narrow / mobile menu file opens:** **`clawMenuFileFocusRev`** from **App** on **`?shell=mobile`** or **Claw** at **≤767px** (same **`setClawTab("chat")` + bump** paths as workspace file focus elsewhere). **`ClawChatView`** **`menuFileFocusRev`** opens the **`.claw/`** file panel and closes the **Sessions** sheet on mobile, matching **Simple** global-open behavior.

- **Claw — command palette:** **Insert Build / review prompt from latest plan** now switches to **`setClawTab("chat")`** in Claw (was only **`setSimpleTab("chat")`**, which did nothing visible). **Simple: Chat / Team / …** jumpers use **Claw** tab ids and labels when **`uiMode === "claw"`**.

- **Claw — global chrome was flipping to Simple by mistake:** **`technical`** is **`uiMode !== "simple"`**, so Claw was lumped with Technical. **Pi model** menu/palette (**`openPiModelConfigInSimpleBrains`**) and **LLM fix → AI Brains** (**`openLlmFixSimpleBrains`**) now branch on **`uiMode === "claw"`** (Claw **Files** / **Settings** respectively). **Settings → Edit workspace views catalog** in Claw uses **`focusWorkspaceFileFromMenu`** instead of forcing Simple.

- **Claw vs Technical (shared `technical` flag):** workspace **static analysis**, **StatusBar** diagnostics strip, **Edit/Selection** menu **`canEdit`**, **Go to line** / **breakpoints** (F9, Run menu), **Go → problems**, and **Technical-only** keyboard shortcuts (sidebar, Zen, dock, terminal, etc.) now key off **`uiMode === "technical"`** or a dedicated **`clawWorkspaceEditorSurface`** (Claw **Chat** / **Files** only). Claw no longer runs the Technical static-analysis hook, and the menu bar enables cut/copy when the Claw workspace editor is actually mounted.

- **Pi resolution + playground `.env` (ppi-style):** when bare **`pi`** is not on the Bun process PATH but is exported from the repo **`.env`**, **`resolvePiBinaryPath()`** can fall back to **`scripts/wop-headless-pi`** (sources playground `.env`, preserves workspace cwd, **`exec pi`**). Same “load `.env` then Pi” idea as **`ppi` → `just pi`**, without **`cd`** to the playground root.

- **Claw Mission vs Chat Pi:** Schedules / channels row now prefers **`clawAutomation` embedded in the same `GET /api/config` as Engine**, and treats **`config.piDrivesChat`** as Pi-ready for Claw so the UI cannot show “Pi not ready for automations” while Engine already shows Pi driving chat.

- **Pi CLI resolution under thin PATH:** **`resolvePiBinaryPath()`** now checks common install locations after **`Bun.which("pi")`** (**`~/.local/bin`**, **`~/.cargo/bin`**, **`/opt/homebrew/bin`** on macOS, **`/usr/local/bin`**). Electron dev’s **“Start service”** Bun spawn prepends the same PATH prefixes as **`start-wayofpi-ui.sh`**, so headless Pi is found more often without **`WOP_PI_BINARY`**.

- **`WOP_PI_BINARY` tilde:** **`~/…`** (and lone **`~`**) in **`WOP_PI_BINARY`** is expanded to the server user’s home directory before **`existsSync`** / spawns, matching shell expectations (**`server/pi-binary.ts`**, **`server/diagnostics.ts`** probe).

- **`GET /api/config` client normalization:** **`piChatEngineRequested`** is no longer forced to **`false`** when the server omits the field (undefined). Legacy payloads that paired **`piChatEngineRequested: false`** with **`chatEngine: ollama`** / **`openrouter`** (old mis-mapping of provider into **`WOP_CHAT_ENGINE`**) are treated as Pi/auto intent so Mission does not show the misleading “bundled or bun” engine row.

- **Claw Channels — Telegram integration hints:** **`GET /api/config`** / **`GET /api/claw/telegram/status`** now treat **`pi-telegram`** as present when it appears in the **Way of Pi host checkout** **`.pi/settings.json`**, not only in opened **`WOP_WORKSPACE`** roots (common when Claw runs against another project folder). Channels phase notice copy cleaned up.

- **Claw Channels — Telegram UI:** when the Bun API is missing the Telegram snapshot (usually an old process on the dev port), the card shows **“Update Bun API”** and an amber explainer instead of **“Not configured”**, which implied Telegram itself was broken. Phase E banner copy now states what is already shipped vs later items.

- **Way of Pi web UI — line-numbered code surfaces:** workspace file editing (`WorkspaceTextBuffer`), horizontal **strip** file preview, **Host Doctor** live snapshot + workspace JSON editors, and **My AI Brains** Pi JSON editors now share the same gutter/textarea typography (**`apps/wayofpi-ui/src/constants/workspaceEditorChrome.ts`**) so line numbers stay aligned with text. See **`docs/WOP_CODE_EDITOR_LINE_NUMBERS.md`**.

### Changed

- **`apps/wayofpi-ui`** — **Settings → Restart Way of Pi** opens **`RestartServerModal`**: non-technical wording (turn off / open again), optional **build from source** steps under **details**; operator text under **More information (for support or IT)**. Replaces **`window.alert`**.
- **`POST /api/server/restart`** — **Settings → Restart server** is **on by default** when **`NODE_ENV` is not `production`** and **`WOP_ALLOW_SERVER_RESTART`** is unset; production still requires an explicit allow (**`1`** / **`true`** / **`yes`** / **`on`**). Set **`WOP_ALLOW_SERVER_RESTART`** to **`0`** / **`false`** / **`no`** / **`off`** to disable in dev. Docs: **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**, **`apps/wayofpi-ui/README.md`**, **`.env.sample`**.

- **Claw host paths:** the seven scaffold files and **`memory/`** live under **`.claw/workspace/`** on the Way of Pi checkout (default: repo root inferred from `apps/wayofpi-ui/server`), **not** under **`WOP_WORKSPACE`**. Optional **`telegram.json`** stays at **`.claw/telegram.json`**. **`GET /api/config`** exposes **`clawHostRepoRoot`**, **`clawDotDirAbs`**, and **`clawWorkspaceDirAbs`**; override with **`WOP_CLAW_HOST_ROOT`** or **`WOP_PLAYGROUND_ROOT`**. **`/api/file`** and **`/api/fs/*`** resolve `.claw/…` on that host tree.

- **Claw schedules on disk:** schedule definitions and run metadata are stored under **`<host>/.claw/schedule/`** (`claw-schedules.v1.json`, `claw-schedule-runs.v1.json`) instead of **`WOP_WORKSPACE/.wayofpi/`**. On first read, if the new definitions file is missing but the legacy **`.wayofpi/`** files exist, the server copies them into **`.claw/schedule/`**.

- **Claw host file tree / stale Bun:** **`GET /api/health`** and **`GET /api/config`** now advertise **`capabilities.clawHostTreeGet: true`**; Vite and Electron “fresh” API checks require it so an older Bun on **`WOP_SERVER_PORT`** is not treated as healthy. **`GET /api/claw/tree`** is registered early in the API router; **`GET /api/config?clawTree=1`** embeds **`clawHostTree`** as a fallback when the dedicated path returns **404**. **`OPTIONS`** under **`/api/*`** returns **204** with permissive CORS headers for strict browser setups.

- **Claw automation + mission log on disk:** **`GET /api/config`** always includes **`clawAutomation`** (same payload as **`GET /api/claw/automation`**); the Claw automation hook falls back to config when the dedicated route returns **404**. **`GET /api/claw/automation`** is registered early with **`/api/claw/tree`**. Mission automation events are stored under **`<host>/.claw/mission-events/claw-mission-events.v1.json`** (with one-time copy from legacy **`WOP_WORKSPACE/.wayofpi/`**). Schedule tab copy updated accordingly.

- **Root `README.md` — Installation:** expanded GitHub-facing steps (clone, bootstrap script table, **`bun install`**, **`npm install`** in **`apps/wayofpi-ui`**, API keys pointer, **`start-wayofpi-electron.sh`**, optional **`install-global`**); platform note for Linux / macOS / WSL vs Windows. Prerequisites now link to this section.

### Added

- **`apps/wayofpi-ui/server/chat-context-budget.ts`** — before each chat turn, trims oldest **full user turns** after the **`system`** prefix when **`WOP_CHAT_CONTEXT_BUDGET`** is on (defaults **`WOP_CHAT_MAX_MESSAGES`**, **`WOP_CHAT_MAX_INPUT_CHARS`**); syncs session JSONL when rows drop. Documented in **`docs/WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md`** (repo enforcement) and **`docs/WOP_NAMESPACE.md`**.

- **`docs/WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md`** — why upstream Pi keeps context lean (compaction, minimal tools, MCP token cost), citations to **pi-mono** `compaction.md` and Mario Zechner’s Pi post, operator checklist, and Way of Pi vs **`WOP_CHAT_ENGINE`** gaps; linked from **`docs/README.md`** and **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**.

- **`docs/WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md`** — compares Way of Pi orchestration to Pi **`agent-team`** dispatcher (**headless Pi** vs interim **Bun** tool loop, **`dispatch_agent`** vs broader lead tools); indexed from **`docs/README.md`**, **`docs/TOOLS.md`**, and **`docs/WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md`**.

- **`scripts/bootstrap-wayofpi-environment.sh`** — probes **OS** / **CPU**, **PATH** tools (**bun**, **node**, **npm**, **git**, **just**, **pi**, **rg**, **ollama**) and Ollama HTTP reachability; prints distro-specific install hints (no silent **sudo**). Flags: **`--check-only`** (CI), **`--install -y`** (official Bun installer + **`npm install`** in **`apps/wayofpi-ui`**), **`--init-env`**. **`just bootstrap-wayofpi`** runs the probe; documented in **`scripts/README.md`** and root **`README.md`**.

- **Claw UI — pluggable modules**: `registerClawUiModule` / `listClawUiModules` in `apps/wayofpi-ui/src/claw/clawUiModules.ts`; optional registrations in `apps/wayofpi-ui/src/claw/clawUserUiModules.ts` (imported from `App.tsx`). Extra nav icons appear after **Files**; each module renders in the main column with context (workspace root, theme, server config, tab/file helpers). Unknown tab ids fall back to **Mission**.

- **`apps/wayofpi-ui` server** — Bun orchestrator **Git workflow tools** (same **`WOP_ORCHESTRATOR_GIT_TOOLS`** gate as existing Git tools): **`git_branches`**, **`git_checkout`** (create/switch branch), **`git_merge`**, **`git_add`**, **`git_commit`** — so the agent can branch, commit, push to GitHub, and merge into **`main`** without relying on **`bash`** alone. Session prompts note PAT scope for push.

- **Claw UI — Help modal (`ClawHelpModal`)**: dedicated 7-section operator guide triggered from the `?` **Help** button at the bottom of the Claw nav rail. Sections: **Overview** (what Claw is, how it relates to Pi, three-mode comparison), **Navigation** (all 7 tabs with icon + description), **.claw/ Workspace** (all 7 template files, isolation rules, scaffold), **Schedules** (step-by-step creation, cron cheatsheet, Phase D note), **Channels** (Telegram 5-step setup, Phase E note, link to `WOP_TELEGRAM_PLAN.md`), **Files & Preview** (all preview modes, editing workflow), **Tips** (6 quick-tip cards: sessions, agent context, scaffold, schedule planning, mode switching, Pi engine indicator). Sidebar navigation with orange accent; separate from the generic `HowToUseModal`.

- **Claw UI — New Plan button wired**: `NewPlanFileModal` is now rendered inside the Claw return block (previously only rendered in the Technical block, so the dialog never appeared in Claw). `handleNewPlanFileCreate` now detects `uiMode === "claw"` and switches to the **Files tab** with the new plan file open, instead of switching to Technical mode.

- **Way of Pi Help Center — Claw description updated**: Layout Modes page now correctly describes Claw as a **mission-control shell** with its own nav rail, tabs (Mission / Chat / Team / Schedule / Channels / Files / Settings), `.claw/` workspace, and operator features. Removed the inaccurate "Identical to Technical for day-to-day use" copy.

### Fixed

- **Claw Mission View — layout overflow**: long text ("Set up .claw/ workspace (7 missing files)" button and roadmap notice with `docs/WOP_*.md` paths) was escaping the grid column and bleeding across the full screen width. Fixes: left and center grid columns now have `min-w-0`; outer scroll container adds `w-full overflow-x-hidden`; roadmap notice gets `w-full min-w-0 break-words`; setup button uses `flex-wrap` + `break-words`; file description labels drop `shrink-0`.

- **Claw UI — Schedules tab (Phase D stub)**: new `ClawSchedulesView` component + `useClawSchedules` hook. Operators can define named cron-triggered Pi turns (stored in `wayofpi.claw.schedules` localStorage). Cards show name, cron + human-readable label, agent, prompt preview, enabled/disabled badge, and last-run. Inline create/edit form with preset frequency selector, agent, prompt textarea, and enabled toggle. Phase D notice explains execution is not yet wired.

- **Claw UI — Channels tab (Phase E stub)**: new `ClawChannelsView` component with Telegram, Webhook, and Email channel cards. Telegram card includes full step-by-step setup guide (`@BotFather` → token → `.claw/workspace/TOOLS.md` → `pi-telegram` extension → `/reload`), "Open TOOLS.md" button, and link to `WOP_TELEGRAM_PLAN.md`. Webhook card has a disabled "Generate webhook URL" button labeled Phase E. Email card is labeled planned later.

- **Claw UI — nav rail expanded**: `ClawNavRail` adds **Schedule** (`CalendarDays`) and **Channels** (`Radio`) tabs between Team and Files. `ClawTabId` type updated to include `"schedule" | "channels"`.

- **Claw UI — Mission quick actions**: two new `QuickBtn` entries (Schedules, Channels) in the Quick Actions card; StatusRow updated to "UI ready · execution Phase D–F".

- **`docs/WOP_CLAW_MODE_PLAN.md`** — **Workspace isolation** section: `.claw/` as Claw's private workspace, Pi tool access policy (full reach, operationally scoped writes), UI-level isolation rules (session tabs, layout keys, default file panel), `WOP_CLAW_HOME` future isolation path; updated principle #4 and "What ships today" table. **`docs/WOP_CLAW_UI_PLAN.md`** — new **§7 Mode isolation** (owns/can-reach table, visual separation rules); non-goals updated with `.claw/` mixing rule; sections renumbered.

- **`apps/wayofpi-ui`** — **Help → How to use Way of Pi…** opens **`HowToUseModal`** (workspace, layouts, chat, palette, doc links). Command palette: **Help: How to use Way of Pi** (Simple + Technical lists). Types: **`HelpMenuHandlers.onHowToUse`**.

- **`docs/WOP_CLAW_MODE_PLAN.md`** — **Claw UI mode** roadmap (Pi-backed autonomy, orchestration, schedules, channels); linked from **`docs/WOP_PLANNING.md`**, **`docs/README.md`**. **`apps/wayofpi-ui`** — third layout mode **`claw`** (IDE shell + banner), **`UiModeToggle`**, Settings layout command, command palette entries.

- **`docs/WOP_CLAW_UI_PLAN.md`** — **Claw UI** planning doc: ecosystem interface scan (OpenClaw TUI, ClawPort, Mission Control, dashboard UX lessons), IDE-style approvals, recommended Way of Pi dock preset + status strip, UI-only vs Pi-blocked phases; cross-links **`docs/WOP_CLAW_MODE_PLAN.md`**, hub indexes, **`docs/WOP_PRODUCT_CAPABILITIES.md`**. **`apps/wayofpi-ui`** — Claw **banner**, command palette rows, and **View** tooltips mention **`docs/WOP_CLAW_UI_PLAN.md`** alongside **`WOP_CLAW_MODE_PLAN.md`**.

- **`docs/WOP_PRODUCT_OVERVIEW.md`** — **product overview** (narrative onboarding: pitch, journeys, mermaid component map); cross-linked from **`docs/WOP_PRODUCT_CAPABILITIES.md`**, **`docs/README.md`**, **`docs/WOP_PLANNING.md`**, root **`README.md`**.

- **`docs/WOP_PRODUCT_CAPABILITIES.md`** — stakeholder **capability** summary (tables, shipped vs partial vs planned, boundaries); **§1** adds **“The simplest version”** story explainer (console metaphor, extensions/teams, Claw, docs, audiences); indexed from **`docs/README.md`** and **`docs/WOP_PLANNING.md`**.

- **`docs/WOP_ORCHESTRATION_EXTENSIONS_PANEL.md`** — guide for **Extensions → Orchestration** (Plan/Build, **`GET`/`POST /api/config`**, runtime toggles, 404 troubleshooting) and **Pi extensions**; linked from **`apps/wayofpi-ui`** panel, **`docs/README.md`**, **`docs/WOP_TECHNICAL_UI.md`**, **`docs/REPO_INDEX.md`**, **`apps/wayofpi-ui/README.md`**.

- **`apps/wayofpi-ui` server** — Bun orchestrator **Git / GitHub tools**: **`git_status`**, **`git_remote`**, **`git_fetch`**, **`git_pull`**, **`git_push`** (optional PAT from Settings → GitHub, **`orchestrator-git-tools.ts`**). Env **`WOP_ORCHESTRATOR_GIT_TOOLS`** (default on with **`WOP_ORCHESTRATOR_TOOLS`**). Session prompt explains worktree vs “No Git repository detected”.

- **`apps/wayofpi-ui`** — **Plan / Build workflow:** **`GET /api/plans`** (latest **`plans/PLAN-*.md`** + Markdown checkbox counts), **`Shift+Tab`** in chat to toggle mode, post-send **Plan nudge** for long Build messages, **`/plan-interview`** slash reply, **From plan** / **Review plan** composer buttons + command palette injectors (**`chatComposerInjectBus`**), **Planning** side panel notes. Docs: **`docs/WOP_BUILD_PLAN_MODE.md`**, **`apps/wayofpi-ui/README.md`**.

- **Repo root** — **`LICENSE`**: MIT (copyright zerwiz). **Help → View License** in **`apps/wayofpi-ui`** opens **`MitLicenseModal`** with the same text as **`apps/wayofpi-ui/src/constants/mitLicenseText.ts`** (keep file and constant in sync).

- **`apps/wayofpi-ui` server** — **Pi-style chat slash commands** on **`/ws`**: recognized **single-line** **`/…`** messages are handled in **`server/chat-slash-commands.ts`** before the LLM (e.g. **`/models`**, **`/help`**, **`/model <id>`**, **`/plan`** / **`/build`**, **`/plan-interview`**, **`/agent`**, **`/clear`**, **`/reload`**). Docs: **`apps/wayofpi-ui/README.md`**, **`docs/WOP_TECHNICAL_UI.md`**.

- **`apps/wayofpi-ui` server** — **`GET /api/manifest`** (**`server/web-manifest.ts`**) static v1: per workspace root, **`.pi/settings.json`** `extensions[]` + **`.pi/extensions/*.ts`**; empty **`tools`** / **`slashCommands`** until Pi introspection. **`GET /api/config`** adds **`chatEngine`**, **`piDrivesChat`** (always false until Phase 2), **`manifestUrl`**. Boot log mentions **`chatEngine`** / manifest. **`GET /api/diagnostics`** includes **`manifestStatic`** counts. **`WOP_CHAT_ENGINE`** reserved in **`.env.sample`**. Docs: **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**, **`docs/WOP_OPEN_TODOS.md`**, **`apps/wayofpi-ui/README.md`**.

- **`apps/wayofpi-ui`** — **Settings → Restart server…** calls **`POST /api/server/restart`** when **`WOP_ALLOW_SERVER_RESTART=1`** (Bun exits; restart dev from the terminal); otherwise explains opt-in. Nudges chat WebSocket reconnect when the server does not self-exit. **`apps/wayofpi-ui/.env.sample`** documents the variable.

- **`apps/wayofpi-ui` server** — **`GET /api/diagnostics`** (workspace, **`WOP_*`**, Ollama reachability when provider is Ollama, Pi binary **`--version`** probe) and **`GET /api/upstream`** (read-only **`wop.upstream.lock.json`** + **`scripts/wop-upstream/config.json`**). **`fetchOllamaTags`** accepts an optional **`AbortSignal`**. Docs: **`apps/wayofpi-ui/README.md`**, **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**, **`docs/WOP_OPEN_TODOS.md`**.

- **Repo root** — **`start-wayofpi-electron.sh`** starts the full Way of Pi desktop stack (Bun + Vite + Electron); **`just wayofpi-electron`** runs it. Documented in root **`README.md`**, **`apps/wayofpi-ui/README.md`**, **`docs/REPO_INDEX.md`**, **`docs/WOP_TECHNICAL_UI.md`**, **`docs/README.md`**, **`CLAUDE.md`**.

- **`apps/wayofpi-ui`** — **Workspace grid resize:** **`DockSplitHandle`** splitters between workspace **rows** and **columns**; optional **`rowWeights`** / **`colWeights`** persisted in **`wayofpi.technical.workspaceGrid.v1`**. **`TechnicalWorkspaceGrid`** uses **nested flex** (not a bare CSS `grid` only) so splitters sit between **`WorkspacePane`** cells.
- **`apps/wayofpi-ui`** — **Implicit grid growth on drop:** **`growWorkspaceGridForEdgeDrop`** — dropping a **file**, **panel tab**, or **pane swap** on an **edge snap zone** when the layout is **1×1** or on the **outer edge** of an **N×1** / **1×N** strip **adds** the neighbor cell before applying the drop (**`workspaceGridStorage.ts`**, **`App.tsx`** **`onWorkspaceSurfaceDrop`** with **`surfaceCellIndex` + zone**).
- **`apps/wayofpi-ui`** — **Cross-cell tab moves:** another pane’s **tab bar** (**`data-wop-workspace-tab-bar`**) accepts **insert-before** drops; **`WorkspaceCellDropSurface`** hides the orange snap overlay while the pointer is over the tab bar so insert hints stay readable.

- **`apps/wayofpi-ui`** — **Technical workspace grid** (**`TechnicalWorkspaceGrid`**): up to **3×4** (**columns × rows**) **`WorkspacePane`** cells, each with its own **`PanelDockLayout`** and (when grid > **1×1**) **`useFileEditor`**. **View → Editor Layout** presets (**workspace grid 2×2**, **3×4**, three columns/rows). Persistence **`wayofpi.technical.workspaceGrid.v1`** (**`workspaceGridStorage.ts`**). Explorer / open-file actions target the **focused** cell. Docs: **`docs/WOP_TECHNICAL_UI.md`**, **`apps/wayofpi-ui/README.md`**, root **`README.md`**, **`docs/README.md`**; agent pointers **`agent/AGENTS.md`**; rule **`.cursor/rules/wop-ui-modular-docks.mdc`**; plans **`docs/WOP_MODULAR_DOCKS_PLAN.md`** (Phase E partial), **`docs/WOP_OPEN_TODOS.md`**, **`docs/WOP_MENU_BAR_BACKLOG.md`**, **`docs/IDE_EXPLORER_PARITY.md`**, **`docs/WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md`**, **`docs/WOP_COMBINED_BUILD_TODO.md`** (Z2 wording).

### Fixed

- **`apps/wayofpi-ui` server** — Orchestrator tool loop: if the model answered with an **intent-only** preamble (no **`tool_calls`**) on turns about repo/Git/files, the server now **nudges** (up to 2) so the model must call tools instead of ending the turn early; slightly higher **`MAX_ORCHESTRATOR_TOOL_STEPS`**. Prompt note: do not stop without tool calls when facts are needed.

- **`apps/wayofpi-ui` server** — After **tool results** that look like errors or non-success, a **failure-summary nudge** (up to 2 per turn) asks the model to explain what broke and how to fix it; orchestrator / headless Pi prompts now require clear **success vs failure** outcomes for the user.

- **`apps/wayofpi-ui`** — **`StripFilePreview`** uses **`apiGet`** (same as **`useFileEditor`**) and **`AbortController`** so fast tab switches do not apply stale **`/api/file`** responses.

### Changed

- **`apps/wayofpi-ui` server** — Orchestrator system prompts (**`session-prompts.ts`**) now constrain **“what is Way of Pi”** / product overviews: **≤5 bullets**, **no emoji** unless the user used emoji, **no wide tables** unless asked, and explicit separation of **shell + Bun server**, **interim orchestrator tools**, and **Pi** / **headless Pi** so replies do not blur runtimes.

- **`apps/wayofpi-ui`** — **Help → About Way of Pi** expands plain-language bullets (code, docs/plans, learning, shared team playbooks) and notes that file/command automation depends on settings and Pi-backed chat.

- **`docs/WOP_PRODUCT_CAPABILITIES.md`** — simple-language intro: accurate **workspace tools** explanation (no informal “Claw” metaphor), **what people use it for** table, link to gaps.

- **`docs/WAY_OF_PI_INTRODUCTION.md`** — same **workspace tools** wording instead of “Claw.”

- **`apps/wayofpi-ui`** — **`GET /api/health`** and **`GET /api/config`** expose **`capabilities.configRuntimePost`** (with **`workspaceProblems`**) so Vite/Electron treat an old Bun on the port as **stale**; **Extensions** activity shows a **help dock** (restart steps, **`curl`** smoke, **Re-check server**, tool log link, Pi **`PATH` / `WOP_PI_BINARY`**). **`useServerConfig`** normalizes **`capabilities`**.

- **Docs** — **[`docs/WOP_ORCHESTRATION_EXTENSIONS_PANEL.md`](docs/WOP_ORCHESTRATION_EXTENSIONS_PANEL.md)**: added **Plan: toward 100% reliable Orchestration** (acceptance criteria, operator Phase 0 checklist + curl smoke, Phases 1–4 for stale detection, optional persistence, Pi parity, CI).

- **`apps/wayofpi-ui` server + Host doctor** — **`GET /api/diagnostics`** exposes **`wayOfPiBundleRoot`** (same value as **`playgroundRoot`**) and checklist copy that separates **project workspace** (tree / `/api/file` / chat cwd) from **Way of Pi app checkout**; **info** row when the two paths differ. **`getWayOfPiBundleRepoRoot()`** in **`server/pi-ollama-env.ts`**; **`server/workspace-state.ts`** module banner.

- **Docs / rules** — Documented that **workspace (project roots)** served by the Bun server, **Way of Pi system / product files**, and **editor shell state** (`selectedPath`, layout) are **not** the same thing: **[docs/WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)** new section, **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)** state table row, **[docs/README.md](docs/README.md)** index; **`.cursor/rules/wop-ui-pi-backend-parity.mdc`** table + rule line.

- **Docs** — **[WOP_BUILD_PLAN_MODE.md](docs/WOP_BUILD_PLAN_MODE.md)**: **section 7** backlog plus **shipped** UI notes (**Shift+Tab**, **`/api/plans`**, palette injectors); related-doc links to **[WOP_SIMPLE_UI_VIEWS.md](docs/WOP_SIMPLE_UI_VIEWS.md)** and **[WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)**. **[docs/README.md](docs/README.md)** index line updated.

- **Ralph** persona — docs, **`.pi/agents/ralph.md`**, **`.pi/skills/ralph/SKILL.md`**, and **`extensions/ralph.ts`** now use the full name **Ralph Wiggum** where the queue worker is introduced; agent id **`ralph`** and **`RALPH_ESCALATE`** unchanged. **Way of Pi** agent picker / pulse grid / status bar / command palette show **Ralph Wiggum** for roster id **`ralph`** (**`workspaceAgentDisplay.ts`**); Pi **`agent-team`** card titles match.

- **Docs** — **Electron-first** Way of Pi: **`apps/wayofpi-ui/README.md`** (new §), **`docs/WOP_TECHNICAL_UI.md`** (runtime + boot table), **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`** (Electron operational note), **`docs/REPO_INDEX.md`**, root **`README.md`**, **`CLAUDE.md`**, **`start-wayofpi-ui.sh`** / **`start-wayofpi-electron.sh`** comments, **`electron/electron-main.mjs`** header — same Vite→Bun **`/api`** / **`/ws`** in Electron dev as in the browser.

- **Docs** — **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`** **§2.5** audit table (Bun server: what hits Pi process vs not); cross-links from **`docs/README.md`**, **`docs/WOP_OPEN_TODOS.md`**, **`CLAUDE.md`**.

- **`apps/wayofpi-ui` server** — Ollama defaults follow **Pi** startup: **`OLLAMA_BASE_URL`** when **`OLLAMA_HOST`** is unset; default model from **`OLLAMA_MODEL`** else **`agent/settings.json`**. **`server/pi-ollama-env.ts`**; diagnostics env snapshot; **`.env.sample`** notes. Client: drop stale **`wayofpi.activeLlmModel`** **`qwen3.5:latest`** before reconnect.

- **`apps/wayofpi-ui`** — Chat persona when no workspace `.md` is selected is labeled **Orchestrator** (Technical + Simple UI, status bar, command palette). The server injects a Pi-shaped **orchestrator** system prompt for that case; specialist agents still merge from **`/api/agents`** when chosen.

- **`apps/wayofpi-ui`** — **Phase A dock parity:** **`EditorPanel`** and **`DockableToolStrip`** share the same **tab chrome** (orange active top border, **`h-9`**, **13px** labels, **Lucide** icons per panel / **`FileCode2`** for files, hover-reveal close). **Editor** + **Panels** region labels (grip + title) mirror each other; user-facing copy favors **Panels** over “tool dock”. Docs: **`docs/WOP_MODULAR_DOCKS_PLAN.md`**, **`docs/WOP_TECHNICAL_UI.md`**.

- **Docs** — Renamed planning entrypoints to **`WOP_*`**: **`docs/PLAN_WEB_STANDALONE_SYSTEM.md`** → **`docs/WOP_STANDALONE_SYSTEM_PLAN.md`**, **`docs/PLANNING.md`** → **`docs/WOP_PLANNING.md`**, **`docs/WAY_OF_PI_OPEN_TODOS.md`** → **`docs/WOP_OPEN_TODOS.md`**. All in-repo links updated (root **`README.md`**, **`docs/README.md`**, **`docs/REPO_INDEX.md`**, **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**, and cross-references).

### Fixed

- **`apps/wayofpi-ui`** — **Splitter drag** now **follows the pointer** for the **editor ↔ agent (vertical)** split and the **editor stack ↔ bottom tool dock (horizontal)** split (corrected delta sign). Documented in **`docs/WOP_TECHNICAL_UI.md`** and **`.cursor/rules/wop-ui-modular-docks.mdc`**.

### Changed

- **`apps/wayofpi-ui`** — **Upper horizontal tool dock removed**; a single **tool/file strip** remains **under the editor stack**. Legacy **`strips.top`** is merged into **`bottom`** (`collapseTopToolDockIntoBottom` in **`technicalLayoutStorage.ts`**). Docs: **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)**, **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)**, **[docs/WOP_MODULAR_DOCKS_PLAN.md](docs/WOP_MODULAR_DOCKS_PLAN.md)**.

### Added

- **`apps/wayofpi-ui`** — **Phase F (partial):** **Markdown** `.md` files get a **Preview** toolbar (**Source** ↔ **rendered** via **`marked`** + **`DOMPurify`**), **Review Next File** (disabled until a queue is wired), and when dirty **Undo File** / **Keep File** plus **Ctrl+Enter** / **⌘↩** (when focus is outside the editor textarea). **`useFileEditor.discardUnsavedChanges`**, **`MarkdownPreviewPane.tsx`**.

- **`apps/wayofpi-ui`** — **Team Pulse** tab (**`ChatPanel`**) shows an **agent-team–style** roster grid (Pi TUI card parity: status, context bar, tokens, optional stream lines) from **`teams.yaml`** + **`/api/agents`**; live multi-agent streams still planned per **[docs/WOP_MULTI_AGENT_WEBSOCKET.md](docs/WOP_MULTI_AGENT_WEBSOCKET.md)**. **`AgentTeamPulseGrid.tsx`**.

- **Docs** — **[docs/WOP_MODULAR_DOCKS_PLAN.md](docs/WOP_MODULAR_DOCKS_PLAN.md)** (phased TODO: dock parity, **N** strips, movable agent + primary sidebar, layout graph); **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)** updated for **`DockStripEntry`** / **`activeIndexBySlot`**; **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)**, **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)**, **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)**, **[docs/README.md](docs/README.md)** cross-links.

- **Docs** — **[docs/WOP_GENERATED_FILES_AND_LINE_PARITY.md](docs/WOP_GENERATED_FILES_AND_LINE_PARITY.md)** (Cursor `.cursorignore` / `.cursorindexingignore`, Zed/Git `linguist-*`, doc ↔ code line parity, `wayofpi-ui` binary/image handling); indexed from **[docs/README.md](docs/README.md)** and linked from **[docs/WOP_TECHNICAL_UI.md](docs/WOP_TECHNICAL_UI.md)**.

- **Way of Pi planning docs** — **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)** (canonical web + headless Pi plan), **[docs/WOP_PLANNING.md](docs/WOP_PLANNING.md)** (hub), **[docs/WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)**, **[docs/WOP_UI_MANIFEST.md](docs/WOP_UI_MANIFEST.md)**, **[docs/WOP_MULTI_AGENT_WEBSOCKET.md](docs/WOP_MULTI_AGENT_WEBSOCKET.md)**, **[docs/WOP_SAFE_CUSTOMIZATION.md](docs/WOP_SAFE_CUSTOMIZATION.md)**; indexed from **[docs/README.md](docs/README.md)** and **[docs/REPO_INDEX.md](docs/REPO_INDEX.md)**.

- **`apps/wayofpi-ui`** — **Simple** vs **Technical** UI toggle (top bar); **`wayofpi.uiMode`** in `localStorage` (default **Simple**). Technical restores activity bar, explorer, bottom panel, and dense status details.

- **`./start-wayofpi-ui.sh`** (repo root) — Starts **`apps/wayofpi-ui`** dev servers and opens the default browser when Vite is ready; sources repo **`.env`**, defaults **`WOP_WORKSPACE`** to the playground root, prepends **`~/.bun/bin`** to **`PATH`**. **`README.md`**, **`apps/wayofpi-ui/README.md`**.

- **Planning** — **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](docs/WOP_STANDALONE_SYSTEM_PLAN.md)** and **[docs/WOP_NAMESPACE.md](docs/WOP_NAMESPACE.md)**: **critical** requirement to **rename Way of Pi backend** files, packages, and log/service identifiers so they are **not** named **`pi`** / **`ppi`** in ways that confuse them with **upstream Pi**; production checklist + backlog note.

- **Way of Pi upstream sync** — **`scripts/wop-pi-upstream.ts`**: **`check`** queries **`badlogic/pi-mono`** tags and **`@mariozechner/pi-coding-agent`** npm **`latest`** vs **`wop.upstream.lock.json`**; **`sync --apply`** downloads a tag and copies configured subtrees into **`vendor/wop-upstream/`** with **`pathRewrites`** (gitignored). **`just wop-upstream-check`**, **`just wop-upstream-sync`**. Docs **[docs/WOP_UPSTREAM_SYNC.md](docs/WOP_UPSTREAM_SYNC.md)**, **`scripts/wop-upstream/README.md`**, **`scripts/README.md`**.

- **Docs** — **[docs/WOP_OPEN_TODOS.md](docs/WOP_OPEN_TODOS.md)** aggregates missing Way of Pi / **`apps/wayofpi-ui`** / script work; indexed from **`docs/README.md`**, **`docs/WOP_PLANNING.md`**, **`docs/REPO_INDEX.md`**, root **`README.md`**.

### Fixed

- **`scripts/render-playground-project-settings.py`** — Full playground merge **no longer** auto-adds **`agent-team.ts`** / **`agent-team-build-orchestra.ts`** to linked app **`settings.json`**; use **`just ext-agent-team`** / **`ext-builder-team`** / **`pi-e`**. Remove those paths from an existing linked project’s **`.pi/settings.json`** once if they were merged earlier.

- **`.pi/extensions/agent-team-build-orchestra.ts`** shim **removed** — Pi scans **`.pi/extensions/*.ts`** and was loading the builder roster on plain **`pi`** / **`just pi`** even when it was omitted from **`extensions[]`**. Builder orchestration remains via **`just ext-builder-team`** / **`pi-e`**. **`docs/EXTENSIONS.md`** (shim table + note about not auto-shimming agent-team).

### Changed

- **`apps/wayofpi-ui`** — Shell **accent color** shifted from VS Code blue to **orange** (`#ea580c` / `#c2410c` hover). **`GET /api/file`** returns **base64** for **images** and other **binary** files; UI shows a **scrollable image preview** or a binary notice. Text editor: **wheel events** on the textarea **scroll** the shared gutter+editor region (fixes scroll when the pointer is over the buffer).

- **Project origin** — Canonical upstream is **[zerwiz/wayofpi](https://github.com/zerwiz/wayofpi)** (`git` **`origin`**, root **`package.json`** **`repository`**, **`README.md`**, **`docs/WOP_PLANNING.md`**, **`docs/REPO_INDEX.md`**).

- **`just pi`** — Bash wrapper **sources playground `.env`** before **`exec pi`** so **`OPENROUTER_API_KEY`** is always set when launching via **`just`**. **`agent/auth.json`** (gitignored) may also hold an **`openrouter`** API key for bare **`pi`** / Pi auth storage. **`docs/REPO_INDEX.md`**.

- **`scripts/normalize-pi-config-model-order.py`** + **`just normalize-pi-config-models`** — Keep OpenRouter **`:free`** rows before other OpenRouter in **`pi.config.json`** (repair interleaving). **`scripts/README.md`**.

- **`agent/models.json`**, **`pi.config.json`**, **`just pi-cycle-or-free-first`** — Dropped native **`openai`** provider and all **`openai/*`** OpenRouter rows so **`/model`** stays Ollama + OpenRouter-only without **`OPENAI_API_KEY`**. **`README.md`**.

### Added

- **`scripts/pi-standard`**, **`just pi-standard`**, **`install-global`** → **`~/.local/bin/pi-standard`**, **`ppi-pi-standard`** — Runs Pi with **`--no-extensions --no-skills --no-themes --no-prompt-templates`** (upstream [CLI Reference](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)); sources playground **`.env`**; optional leading **`.`** dropped. **`scripts/README.md`**, **`README.md`**.

- **`scripts/ppi`** — **`pi-e backup`** and **`pi-e restore`** recover an interrupted **`pi-e`** / **`pi-launch-from-project`** session: restore **`.pi/settings.json`** from **`.pi/.settings.json.pi-e-restore`**, and **`./tools`** from a single **`.pi/.pi-tools-shadow.*`** if **`./tools`** is missing; then run **`just pi-e`**. **`pi-e help`** lists usage. **`scripts/README.md`**, **`pi-launch-from-project.sh`** header comment.

- **`extensions/context-local-hints.ts`** — For **Ollama** / **`PI_CONTEXT_HINT_PROVIDERS`** / localhost **`:11434`**, injects **`<context_awareness>`** each turn; **`/context-hint`**. Shim **`.pi/extensions/context-local-hints.ts`**, default **`.pi/settings.json`**. Docs **`AGENT_MEMORY.md`**, **`EXTENSIONS.md`**; **`just ext-context-local-hints`**.
- **`extensions/agent-team-build-orchestra.ts`** + shim — separate **`pi -e`** from **`agent-team.ts`**; initial team **`build-orchestra`**. **`just ext-builder-team`**, **`pi-e`** **agent-team (build-orchestra)**. Do **not** load both agent-team variants in one session. **`docs/AGENT_TEAMS.md`**, **`EXTENSIONS.md`**, **`PLAYGROUND.md`**, **`README.md`**.

### Changed

- **`extensions/agent-team.ts`** — optional **`PI_AGENT_TEAM_DEFAULT`** for **`agent-team.ts`** only; builder default moved to **`agent-team-build-orchestra.ts`**. **`docs/AGENT_TEAMS.md`**, **`HOW_TO_USE_AGENTS.md`**, **`README.md`**.

- **`justfile`** — **`ext-builder-team`** uses **`agent-team-build-orchestra.ts`**; **`pi-e`** new menu line; prepend **session-memory** + **context-local-hints** when **agent-team**, **agent-team-build-orchestra**, or **agent-chain** is chosen; **`all-open`** includes builder stack. **`docs/PLAYGROUND.md`**, **`HOW_TO_USE_EXTENSIONS.md`**, **`README.md`**.

- **`pi.config.json`** — **Ollama** first, then OpenRouter (**all `:free` ids** from a live API sync — **26** at generation time — then curated **paid/preview**: Gemini 2.5/3.1, Claude Sonnet/Opus, GPT‑4o/4.1, DeepSeek, Mistral Large, Qwen, Llama 3.1 70B, Grok 4 fast), then **OpenAI** direct. Order is for humans / **`pi-models-scoped-priority.ts`**; **`/model`** global sort unchanged. Re-sync free ids occasionally via [OpenRouter `/api/v1/models`](https://openrouter.ai/api/v1/models) (`:free` in `id`).
- **`just pi-picker-ollama-free-or`** + **`scripts/pi-models-scoped-priority.ts`** — Scoped **`pi --models`** list: Ollama from **`agent/models.json`**, then OpenRouter free / rest from **`pi.config.json`**, then OpenAI. **`README.md`**, **`docs/TUI.md`**, **`scripts/README.md`** explain why **`/model`** shows other providers before **ollama**.

- **`extensions/agent-team.ts`** — Per-subagent **`--model`** (**`model:`** frontmatter, **`.pi/agents/agent-models.json`**, optional **`dispatch_agent`** **`model`**); grid **`⎆`** line + rounded cards + **`◆`** team header; **`/agents-models`**; **`build-orchestra`** Builder-orchestrator prompt. Example **`.pi/agents/agent-models.example.json`**. **`docs/AGENT_TEAMS.md`**.
- **`.pi/agents/teams.yaml`** — Team **`build-orchestra`** ( **`builder`**, **`planner`**, **`reviewer`**, **`documenter`**, plus domain specialists). **`docs/AGENT_TEAMS.md`**.
- **`extensions/cross-agent.ts`** — Do not register **`/<name>`** from **`.claude`/`…`/commands** if **`extensions/<name>.ts`** exists (fixes duplicate **`/ralph`** when **`~/.claude/commands/ralph.md`** is present). Skip **`/skill:<name>`** if **`.pi/skills/<name>/SKILL.md`** exists. **`docs/EXTENSIONS.md`**.

- **`extensions/system-select.ts`** — **`/agent`**: two-step UI to pick **`domain-specialists/<category>/`** then a specialist, or core / flat list; agents carry **`domainCategory`** from path. **`/system`** unchanged (flat). Docs **`AGENTS.md`**, **`docs/commands/REFERENCE.md`**.

- **Footer context readout** — **`extensions/footer-context-stats.ts`**; **`minimal`**, **`agent-team`**, **`agent-chain`**, **`pi-pi`** append **`used/contextWindow ctx`** (best-effort from **`getContextUsage()`**) and **`↓` / `↑`** session token totals after the **`[###---] N%`** bar. **`docs/AGENT_TEAMS.md`**, **`docs/TUI.md`**.

- **`extensions/github-management.ts`** — PR-focused **`github_pr_list`**, **`github_pr_view`**, **`github_pr_diff`**, **`github_pr_checks`**, **`github_pr_review_submit`**, **`github_pr_review_inline`** (REST inline + suggested edits); **`ghm_exec`** returns text; **`/ghm`** adds **`pr-*`** subcommands. Docs **`TOOLS.md`**, **`EXTENSIONS.md`**, **`README.md`**, **`specs/github-management.md`**, **`.pi/skills/github/SKILL.md`**, **`CLAUDE_CODE_VS_PI_GAPS.md`**; **`reviewer`** agent **`tools:`** updated.

- **`extensions/web-tools.ts`** — **`web_search`** tries providers in **`WEB_TOOLS_SEARCH_ORDER`** (default `gemini,brave,duckduckgo`): Gemini *Grounding with Google Search* when **`GEMINI_API_KEY`** is set (**`WEB_TOOLS_GEMINI_MODEL`**, default **`gemini-2.0-flash`**), then Brave, then DuckDuckGo. **`web_fetch`**: **`WEB_TOOLS_FETCH_BACKEND`** `http` (default) \| `gemini` \| `fallback`. **`.env.sample`**, **`web-searcher`** agent, **`README`**, **`docs/EXTENSIONS.md`**.

- **`extensions/agent-team.ts`** — Grid **stream detail** (**thinking + tool** lines) **ON by default**; **`/agents-stream off`** or **`ctrl+shift+v`** to hide. **`docs/AGENT_TEAMS.md`**.

- **`.pi/agents/teams.yaml`** — Team **`full`** no longer includes **`indexer`** (smaller default squad; use **`index`**, **`info`**, or **`new-project`** for **`INDEX.md`**). Docs **`AGENT_TEAMS.md`**, **`AGENTS.md`**, **`agent/AGENTS.md`** updated.

- **Docs + Cursor** — **`docs/PLAYGROUND.md`** adds a canonical **`pi-e`** modes table; **`docs/EXTENSIONS.md`**, **`docs/README.md`**, **`docs/REPO_INDEX.md`**, and **`pi-extensions-context.mdc`** cross-link **``.cursor/rules/pi-pi-e-playground-modes.mdc`** (always-on rule for FULL vs project-scoped **`pi-e`**).

### Fixed

- **`just pi-e`** — **`1 12`** no longer loads the whole merged **`extensions[]`**; picks on menu **3+** force **`PIE_CLEAR_SETTINGS_EXTENSIONS=1`**. Removed **`if ! \$PLAYGROUND_FULL_ENABLE`** (**`1: command not found`**). **Option 1** (±**2**) **only** still uses full JSON.

- **GitHub** — default branch is **`main`** (was **`feat/playground-updates`**, which blocked branch deletes and confused PR banners). Historical feature branches **`feat/agents-skills-and-scan-2026-03-26`**, **`feat/rebrand-pi-extension-playground`**, **`feat/playground-ralph-docs`**, and **`feat/playground-updates`** are **restored on the remote** at their original tip commits for anyone who wants them alongside **`main`**.

### Added

- **`extensions/web-tools.ts`** + shim **`.pi/extensions/web-tools.ts`** — tools **`web_search`** (Brave API if **`BRAVE_SEARCH_API_KEY`** / **`BRAVE_API_KEY`**, else DuckDuckGo HTML) and **`web_fetch`**; agent **`.pi/agents/web-searcher.md`**; team **`info`** roster; **`.pi/settings.json`**, **`just ext-web-tools`**, **`.env.sample`**. Docs: **`EXTENSIONS.md`**, **`TOOLS.md`**, **`AGENTS.md`**, **`AGENT_TEAMS.md`**, **`README.md`**.

- **`docs/CLAUDE_CODE_VS_PI_GAPS.md`** — Pi-centric gap analysis vs [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview); links **[COMPARISON.md](COMPARISON.md)** (multi-agent rows updated for **`agent-team`** / **`.pi/agents/teams.yaml`**).

- **`playground-portal`** agent (**.pi/agents/playground-portal.md**), teams **`playground-portal`** (solo) + roster entries on **`new-project`**, **`full`**, **`info`** — ports extensions/skills from **`PI_PLAYGROUND`** into the **app repo**; pairs with **`pi-e` option 2** / **`scripts/init-project-local-pi-env.sh`**.

- **`scripts/init-project-local-pi-env.sh`** + **`pi-e` option 2** — scaffolds **project-local** **`<project>/.pi/`** (empty **`extensions[]`**, **skills** dir, marker **`.project-local-pi`**).

- **`scripts/render-playground-project-settings.py`** — **`enable-playground-in-project`** uses it to mirror the playground **`.pi/settings.json`** into another project with **absolute paths**, **`skills`**, and **`themes`** dirs.

- **`pi-doctor`** extension (**`extensions/pi-doctor.ts`**, shim **`.pi/extensions/pi-doctor.ts`**) — slash **`/doctor`** reports toolchain and config health (bun, just, Pi on PATH, **`agent/`** / **`.pi/`** JSON, extension paths from settings, skills, optional Ollama when **`models.json`** uses it). Recipe **`just ext-pi-doctor`**; global **`ppi-ext-pi-doctor`** after **`./install-global`**; **`pi-e`** / **`ppi pi-e`** includes **pi-doctor**; **`dynamic-loader`** **`/extension-hint pi-doctor`**.

- **`scripts/pi-with-env`** — runs **`pi`** after sourcing repo **`.env`** (for launches that bypass **`ppi`** / **`just`**).

- **OpenRouter** — **`agent/models.json`** **`openrouter`** provider (**`OPENROUTER_API_KEY`**, OpenAI-compatible **`https://openrouter.ai/api/v1`**); sample models in **`pi.config.json`**; README **OpenRouter** subsection; **`.env.sample`** note; **`docs/REPO_INDEX.md`** **`agent/models.json`** row.

### Added

- **`workspace-boundary`** extension — **`before_agent_start`** injects **`<workspace_boundary>`** (user app vs **`~/.pi/agent`** vs **`PI_PLAYGROUND`**); **`session_start`** **notify** if **`PI_USER_PROJECT_DIR`** ≠ **`ctx.cwd`**. Shim in **`.pi/extensions/`**; listed first in **`.pi/settings.json`**. **`PI_USER_PROJECT_DIR`** set by **`ppi`** and **`pi-launch-from-project.sh`** (canonical abs path).

### Changed

- **`just pi-e`** — **Option 1 (FULL)** keeps **`extensions[]`** from **`settings.json`** (full playground). **Option 2** or menu **`3+` / `all`** clears **`extensions[]`** for that run (**`PIE_KEEP_SETTINGS_EXTENSIONS=1`** overrides). Greedy digit split (**`scripts/pi-e-expand-selection.py`**). **Option 2** uses **`init-project-local-pi-env.sh <project> <playground>`** (wired agents/skills); auto **`minimal`** skipped when **option 1** ran (JSON stack already complete).

- **`scripts/init-project-local-pi-env.sh`** — Optional second argument **`<playground-root>`** ( **`pi-e` option 2**): **`link-playground-agent-trees.sh`**, **`render-project-wired-playground-settings.py`**, **`.playground-from`**. One-arg CLI unchanged (local-only).

- **`scripts/enable-playground-in-project`** — Shares **`link-playground-agent-trees.sh`** with wired init.

- **`scripts/sanitize-linked-playground-settings.py`** + **`pi-launch-from-project.sh`** — When extensions are **not** cleared, if **`.pi/.playground-from`** exists, strip **`pi-pi.ts`** ( **`PI_SKIP_LINKED_SETTINGS_SANITIZE=1`** to skip).

- **`render-playground-project-settings.py`** — **FULL** merge no longer auto-adds **`pi-pi.ts`** (opt in via **`just ext-pi-pi`** or **`pi-e`**). Re-run **enable** or trim **`settings.json`** in linked apps that still list it.

- **`pi-e`** — Menu **2** is **wired project-local** (LEAN removed from **`pi-e`**; use **`PLAYGROUND_LINK_LEAN=1`** with **`enable-playground-in-project`** for a lighter full-settings link). Option **1** remains **FULL**.

- **`just pi-e`** — Launches **`scripts/pi-launch-from-project.sh`**: **`cwd`** = **`PI_E_PROJECT_DIR`**, **`-e`** paths absolute to the playground; if **option 1** or **2** ran (`LINK_SELECTED`), defaults **`PI_SHADOW_LEGACY_PROJECT_TOOLS=1`** for **`./tools`** (restored on exit; **0** to disable).

- **`scripts/render-playground-project-settings.py`** — **Option 1 / enable** now emits the **full** extension list: **`.pi/settings.json`** paths + all **`.pi/extensions/*.ts`** + **`extensions/*.ts`** factories (no duplicate shim/root), so every playground extension is loadable in a linked project.

- **`scripts/enable-playground-in-project`** — Resolves the playground from the script location; **`pi`** on PATH is optional (warning only). After writing **`settings.json`**, symlinks **`.pi/agents`**, **`.claude/commands`**, **`.pi/damage-control-rules.yaml`** when missing. Writes **`<project>/.pi/.playground-from`**.

- **`scripts/disable-playground-in-project`** — Removes those symlinks when they resolve under the recorded playground root; **`.playground-from`** + **rg** legacy fallback unchanged.

- **`scripts/ppi`** — Sets **`PI_E_PROJECT_DIR`** to the pre-**`cd`** working directory so **`just pi-e`** setup options (**1–2**) and **`enable-playground-in-project`** target the user’s app repo, not the playground root.

- **`justfile`** **`pi-e`** — Menu: **1** playground **FULL**, **2** project-local init, **3+** extensions; **`all`** skips pseudo-options; playground opt-in scripts invoked with **`PLAYGROUND_ROOT`** and **`PROJECT_DIR`**.

- **`agent/models.json`** — Provider order **`ollama`** → **`openrouter`** → **`openai`** (native **`OPENAI_API_KEY`** merge only).

- **`pi.config.json`** — OpenRouter **`:free`** models first, then other OpenRouter, **Ollama**, then native **OpenAI** **`gpt-4o-mini`**.

- **`justfile`** — Recipe **`pi-cycle-or-free-first`**: **`--models`** order matches “free OpenRouter → OpenRouter → Ollama → OpenAI” for Ctrl+P (Pi **`/model`** still sorts **`openai`** before **`openrouter`** alphabetically).

- **`scripts/ppi`** — sources **`.env`** at the repo root after **`cd`** so **`OPENROUTER_API_KEY`** (and other vars) reach **`just`** and **`pi`** without embedding secrets in tracked config.

- **`.pi/agents/teams.yaml`** — Team **`full`**: removed **`hermes`** and **`red-team`**; added **`ralph`**. Hermes remains on **`info`** and solo **`hermes`**; **`red-team`** is still defined and can be added via preset or **`/agents-team-add`**. **`docs/AGENT_TEAMS.md`**, **`docs/AGENTS.md`**, **`docs/HERMES_INTEGRATION.md`** §7, **`agent/AGENTS.md`** updated.

- **`docs/PLAN_AGENT_MODEL_ROUTING.md`** — **§0** documents **model field contract** (`settings.json` **`defaultProvider`** / **`defaultModel`**, **`models.json`** **`providers.*.models[].id`**, **`--model`** = **`provider/id`**); **§0b** clarifies **skill** (policy) vs **extension** (automatic **`--model`**) vs optional **tool**.

- **Ollama models** — **`agent/models.json`** and **`pi.config.json`** aligned with local `ollama list` (Qwen 3.5 9B / 32K, Qwen 2.5 Coder variants, Llama 3.1, Nemotron nano, R1 8B, etc.); **`agent/settings.json`** default **`qwen3.5:9b-32k`**. README Ollama subsection; **`.env.sample`** `OLLAMA_HOST` note.

### Added

- **`extensions/agent-team.ts`** — Per-specialist **token usage** (prompt **`↓`**, completion **`↑`**) from subprocess **`message_end`** / **`agent_end`** usage fields: **grid card** line, **`dispatch_agent`** tool summary + **`details.usage`**, collapsed result header, and **notify** toast. **`docs/AGENT_TEAMS.md`** §1, §8.

- **`docs/AGENT_TEAMS.md`** — **§8** explains **grid card %** vs **footer %** (subagent `usage.input` / `contextWindow` with 5-slot bar vs dispatcher `getContextUsage().percent` with 10-slot bar; `ceil` vs `round`). **§9** documents **stops, truncation, missing files**, and dispatcher **verify** tools (`read`/`ls`/`grep`). Indexed in **`docs/README.md`**.

- **`docs/PLAN_AGENT_MODEL_ROUTING.md`** — Plan for **model-routing** skill + **`.pi/agent-model-routes.yaml`** + **`agent-team`** override; levels A–D (advisory → subprocess model → main session API); linked from **`docs/README.md`**, **`REPO_INDEX.md`**, root **`README.md`**, **[`PLAN_AWESOME_CODEX_SUBAGENTS.md`](docs/PLAN_AWESOME_CODEX_SUBAGENTS.md)**.

- **`docs/PLAN_AWESOME_CODEX_SUBAGENTS.md`** — Phased plan to port **[zerwiz/awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents)** into Pi; **§8** adds **10-category** implementation order, per-folder checklist, overlap/risk notes, preset naming.

- **`.cursor/rules/pi-documentation-consistency.mdc`** — Documentation consistency (terminology, links, tables, CHANGELOG, index); **`docs/README.md`** points to it alongside **`pi-docs-core.mdc`**.

- **`docs/TUI.md`** — Pi terminal UI: **Ctrl+T** / **Shift+Tab** / **Ctrl+O**, themes, links to **`RESERVED_KEYS.md`**; indexed in **`docs/README.md`** and root **`README.md`**; **`pi-docs-core.mdc`** glob.

- **`docs/EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md`** — Session evaluation (Pi 0.62.0, team **full**): Hermes/scout OK, **`files-widget`** deps, missing **`docs/codereadme.md`**, invalid **`dispatch_agent read`**, recommendations; indexed in **`docs/README.md`**.

- **`indexer`** agent ([`.pi/agents/indexer.md`](.pi/agents/indexer.md)) + skill **`/skill:indexer`** ([`.pi/skills/indexer/SKILL.md`](.pi/skills/indexer/SKILL.md)) — Writes **`INDEX.md`** (tree + per-file roles) at a scoped path; teams **`index`**, **`full`**, **`info`**, **`new-project`**. **`docs/AGENTS.md`**, **`docs/SKILLS.md`**, **`docs/AGENT_TEAMS.md`**, **`agent/AGENTS.md`**, **`docs/REPO_INDEX.md`**.

### Fixed

- **`extensions/agent-team.ts`** — Dispatcher **`setActiveTools`** includes **`read`**, **`ls`**, and **`grep`** (**`DISPATCHER_VERIFY_TOOLS`**) so the primary agent can verify specialist artifacts (avoids **Tool read not found**); system prompt updated accordingly. **`docs/AGENT_TEAMS.md`** §1, §4, §6 and **`docs/TOOLS.md`** §4 note the verify built-ins.

- **`/theme` after `/reload`** — **`theme-cycler`** was not in **`.pi/settings.json`**, so **`/reload`** (which reapplies that list) removed the extension if it had only been loaded via extra **`-e`** flags. Added shim **`.pi/extensions/theme-cycler.ts`** and registered it in **`.pi/settings.json`**. **`docs/TUI.md`** §5 notes this behavior.

- **`scripts/ppi`** — Follow symlinks to the real **`scripts/ppi`** path before computing repo root, so **`~/.local/bin/pi-e`** and **`ppi-*`** no longer run **`just`** from **`~/.local/bin`** (“No justfile found”).

### Changed

- **`code-documenter`** agent ([`.pi/agents/code-documenter.md`](.pi/agents/code-documenter.md)) — Reads/reviews source; writes **comments / TSDoc / technical `.md` only** (no logic/tests). On teams **`full`**, **`ralph`**, **`plan-build`**, **`info`**; **`RALPH_ESCALATE`** + Ralph skill/README/**`docs/AGENTS.md`**/**`AGENT_TEAMS.md`** updated. **`documenter`** points to **`code-documenter`** for inline/API doc passes.

- **`documenter`** agent — Read-first workflow: reconcile **`README.md`**, **`docs/`**, plans, etc. with the codebase; prefer **`edit`** to fix drift; summary of reads/edits in the reply.

- **`planner`** agent — Must persist structured plans as **`plans/PLAN-YYYYMMDD-<slug>.md`** (template + handoff); tools **`write`/`edit`/`bash`**. **`builder`** and **`plan-reviewer`** updated to **`read`** those paths; **`ralph`** skill/agent mention **`plans/`**; **`docs/AGENTS.md`** inventory.

- **Team `ralph`** — Roster includes **`builder`** and **`documenter`** (**`teams.yaml`**); **`RALPH_ESCALATE`** and docs (README, **`agent/AGENTS.md`**, **`docs/AGENTS.md`**, **`AGENT_TEAMS.md`**, **`ralph` agent/skill**, **`extensions/ralph.ts`**) updated.

### Added

- **`install-global`** (repo root) — Runs **`scripts/install-ppi-global.sh`** without **`just`**; install script prints a hint if **`just`** is missing. README prerequisites list **Linux** **`just`** install options.

- **`scripts/ppi`** + **`install-ppi-global.sh`** — Run any **`justfile`** recipe from any cwd; symlinks **`ppi`**, **`pi-e`**, and **`ppi-<recipe>`** into **`~/.local/bin`**. **`scripts/README.md`**, README + **`docs/REPO_INDEX.md`**. Does not shadow the **`pi`** binary (**`ppi-pi`** = vanilla stack).

- **`github`** skill ([`.pi/skills/github/SKILL.md`](.pi/skills/github/SKILL.md)) — Branches, **`git worktree`**, GitHub push/PR patterns, multi-agent cwd handoffs; indexed in **`docs/SKILLS.md`** + **`docs/REPO_INDEX.md`**.

- **`hermes`** agent ([`.pi/agents/hermes.md`](.pi/agents/hermes.md)) — Runs **`hermes chat -q … -Q`** via **`bash`**, relays **stdout** (Hermes’s reply); optional **`--resume`**. Team **`hermes`** + roster on **`full`**/**`info`**; **[HERMES_INTEGRATION.md](docs/HERMES_INTEGRATION.md)** §7.

- **`docs/SKILLS.md`**, **`docs/TOOLS.md`**, **`docs/EXTENSIONS.md`** — Inventory tables: all **`.pi/skills/`** skills, all **`registerTool`** tools by extension, all **`extensions/*.ts`** modules + **`.pi/settings.json`** shims.

- **TillDone** — Writes **`.pi/tilldone-checklist.md`** on every UI refresh (task add/toggle/clear, session reconstruct): GitHub-style checklists + summary table for agent **`read`** and handoffs. README + **`docs/REPO_INDEX.md`**.

- **README (GitHub)** — Overview of docs hub, `projects/` + scanner, Ralph, Hermes/Honcho `just` recipes, expanded tree, Cursor rules, **`CHANGELOG`** link; **`just ext-ralph`** + **`all-open`** includes **ralph**.

- **Ralph team** — **`teams.yaml` `ralph`**: **`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**; **`ralph` agent** + **`SKILL.md`** document **`RALPH_ESCALATE`** and dispatcher handoff; **`extensions/ralph.ts`** help text; README + **`docs/AGENT_TEAMS.md`**.

- **Ralph** — **`.pi/skills/ralph/SKILL.md`**, **`.pi/agents/ralph.md`**, **`extensions/ralph.ts`** + shim (**`ralph_queue_status`**, **`/ralph`**); team **`ralph`** in **`teams.yaml`**; **`settings.json`** + README + **`docs/AGENTS.md`** / **`AGENT_TEAMS.md`** + **`agent/AGENTS.md`** + **`dynamic-loader`** list.

- **`project-scanner`** agent (`.pi/agents/project-scanner.md`) — scans a workspace and writes **`projects/<slug>/`** from **`projects/_template/`**; teams **`new-project`**, **`full`**, **`info`** updated in **`teams.yaml`**. **`pi-projects-docs.mdc`**, **`agent/AGENTS.md`**, **`projects/README.md`**, **`docs/AGENTS.md`**, **`docs/REPO_INDEX.md`** — every new project: read **`REPO_INDEX.md`**, bootstrap from **`_template`**, use scanner or manual fill.

- **`.cursor/rules/pi-docs-core.mdc`** — File-scoped rule when editing **`docs/TOOLS.md`**, **`SKILLS.md`**, **`AGENTS.md`**, **`AGENT_TEAMS.md`**. **`pi-extensions.mdc`** + **`pi-extensions-context.mdc`** updated to link CONCEPTS + those guides.

- **`docs/REPO_INDEX.md`** — Index of repo folders/files (extensions, `.pi/`, `agent/`, `projects/` + `_template/`, `docs/`, ephemeral paths); linked from `docs/README.md`, `projects/README.md`, root README.

- **`docs/HERMES_INTEGRATION.md`** + **`docs/HONCHO_INTEGRATION.md`** — Split guides for Hermes client vs Honcho server/Docker/SDK; **`Hermes_Honcho_connection.md`** slimmed to a bridge + quick path; indexed in `docs/README.md`.

- **`docs/CONCEPTS.md`** + **`docs/TOOLS.md`** — Skills vs agents vs extensions vs tools; Pi tools (built-ins, extensions, agent allowlists, safety). Linked from `docs/README.md`, `SYSTEM.md`, `EXTENSIONS.md`, `AGENTS.md`, `SKILLS.md`, `agent/AGENTS.md`, root README; root **`TOOLS.md`** points at `docs/TOOLS.md` / `CONCEPTS.md`.

- **`docs/SKILLS.md`** — Skills guide: discovery, progressive disclosure, `/skill:name`, `settings.json` / CLI, authoring, cross-agent; linked from `docs/README.md`, `SYSTEM.md`, `EXTENSIONS.md`, `AGENT_MEMORY.md`, `agent/AGENTS.md`.

- **`projects/`** — On-disk docs for work Pi does on specific codebases: **`projects/README.md`**, **`projects/_template/`** (copy to `projects/<slug>/`). Cursor rule **`.cursor/rules/pi-projects-docs.mdc`**; **`agent/AGENTS.md`** + **`docs/README.md`** + root README project tree link.

- **`docs/AGENTS.md`** + **`docs/AGENT_TEAMS.md`** — Agents (definitions, integration) and agent-team (rosters, presets, dispatch); indexed in `docs/README.md` + README Extension Author Reference.

- **`session-saver`**: `extensions/sessions/index.ts` — auto-save on `message_end`, `/save` / `/list` / `/show` / `/load`; config `extensions/sessions/config.json`; README in `extensions/sessions/README.md`.
- **`dynamic-loader`**: `extensions/dynamic-loader.ts` — `/extension-hint` for stacked `pi -e` launches (session commands moved to session-saver).
- **`agent-forge`**: `extensions/agent-forge.ts` — `forge_list`, `forge_create`; `extensions/forge-registry.json`.
- **`chronicle`**: `extensions/chronicle.ts` — ledger + optional workflow graph; `chronicle_status`, `chronicle_snapshot`, `chronicle_transition`, `/chronicle`.
- Shims in `.pi/extensions/` for the above + `settings.json` entries; `specs/agent-forge.md` and `specs/agent-workflow.md` status banners aligned with v1 behavior.
- **Follow-up:** `extensions/sessions/config.json` — drop unused settings keys; remove `maxFileSize` override that capped saves at 10k (code default is 512 KiB). `.gitignore` — `.pi/storage/sessions/`, `.pi/chronicle/ledger.json`. `justfile` — `ext-session-saver`, `ext-chronicle`, `ext-agent-forge`, `ext-dynamic-loader` + `all` entries. `docs/sessions.md` — playground banner + fixed dynamic-loader pointer. `specs/agent-workflow.md` — ledger path note for v1 vs full spec.
- **`docs/SYSTEM.md`** + **`docs/README.md`** — Project/system doc: what session memory does and does not do, specs vs implementation, and agent rules (execute tools, avoid fabricated terminal output). README link under Extension Author Reference.
- **`agent/AGENTS.md`** — Short Pi context rules (tools vs invented output, session memory limits, chunked replies); points to `docs/SYSTEM.md`.
- **`extensions/chatLabels.ts`** — Display labels **`zerwis`** (user) / **`pi`** (assistant) in `session-memory` recaps and `session-replay` titles; edit one file to rename.
- **`docs/AGENT_MEMORY.md`** — Agent memory guide (JSONL, session-memory, session-saver, `/remember`, AGENTS.md, skills); indexed in `docs/README.md` + root README.
- `docs/Hermes_Honcho_connection.md` — Hermes + Honcho local setup doc (cross-session memory) for your Pi workflows.
- **`agent-team`**: `team_list`, `team_member_add/remove`, `team_member_replace`, `team_reload_agents`, `team_activate`, `team_save_preset`, `team_load_preset`, `team_delete_preset`; saved rosters in `.pi/agents/teams-presets.json`; slash `/agents-team-replace`, `/agents-reload`, `/agents-preset-*`, etc.; dispatcher `setActiveTools` includes team tools.
- `pi-e` (standalone) — Interactive multi-select script in `~/.local/bin/` to start stacked `pi -e` runs without requiring `just`.
- `.cursor/rules/pi-extensions.mdc` — File-scoped rule when editing `extensions/` or `.pi/extensions/`.
- `.cursor/rules/pi-extensions-context.mdc` — Always-on pointer to `docs/EXTENSIONS.md`.
- `docs/EXTENSIONS.md` — Extension guide (upstream + local shim pattern + integration checklist).
- README link under Extension Author Reference.
- Root `CHANGELOG.md` for tracking future playground changes.
- `extensions/session-memory.ts` and `just ext-session-memory`: reinject recent USER/ASSISTANT turns into the system prompt; `/sessionmemory` on|off|status.
- README row for **session-memory**.
- **Auto-load:** `.pi/extensions/` shims + `extensions` list in `.pi/settings.json` so Pi discovers this playground without `pi -e` (repo-root `extensions/` alone is not scanned by Pi).

### Fixed

- `.pi/extensions/`: replace symlinks + `themeMap.ts` with **re-export shims** only. Pi loads every `*.ts` in that folder as an extension; `themeMap.ts` is a helper and must not live there (was error: “does not export a valid factory function”).
- Bowser skill path: `.pi/skills/bowser/SKILL.md` (Pi requires parent directory to match skill `name`).

### Changed

- `extension-picker`: single slash command **`/extensions`** only; removed `/ext`, `/extention`, `/extentions` duplicates (prefix `/ex` still narrows the menu).
- `extension-picker`: clearer post-pick instructions (quit Pi, new terminal, TUI = terminal); default saved command stacks **`extensions/minimal.ts`** when present; `docs/EXTENSIONS.md` FAQ for “picker didn’t open another app”.
- `session-memory` extension: read current chat’s persisted JSONL via `getSessionFile()`, inject path/id and dialogue recap; compaction/branch summaries included; explicit rules so replies like `1` select the prior numbered option.

## [2026-03-25]

### Added

- `extensions/extension-picker.ts`: slash commands `/extensions` and `/extentions` to list `pi.extensions` from agent `settings.json` packages (git and npm) plus project `extensions/*.ts`; writes launch hint to `~/.pi/storage/last-extension.json`. Commands `/remember` and `/memory` plus one-time-per-session injection from `~/.pi/storage/agent-memory.md`.
- `just ext-extension-picker` recipe and `just all` entry for the picker stacked with `minimal`.
- README table row for **extension-picker**.
