# Way of Pi — Master Combined TODO

Sourced from WOP-001 through WOP-009. Organized by WOP-007 phased roadmap.

---

## Phase 0: Clean Build (WOP-002 Phase 1, WOP-004)

**Goal**: `bun run build` passes with zero errors. Prerequisite for all other phases.

### Import Audit
- [ ] Audit all import paths across the project:
  - `shared/` — find where files live, update imports
  - `hooks/` — check if hooks exist or need creation
  - `types/` — check if types exist or need creation
  - `@/` — verify path alias resolves in vite.config.ts + tsconfig.json
  - `../../contexts/` (with 's') vs `../../context/` (without 's') — pick one
- [ ] Fix path aliases in `vite.config.ts` and `tsconfig.json` to match reality
- [ ] Delete or isolate 3 external project remnants:
  - `src/modals/` (WHN Chat refs) — keep as reference, exclude from tsconfig
  - Ported kanban files — exclude until Phase 5
  - Dead server imports — fix or delete
- [ ] Add build check to CI (prevent future silent accumulation)

### Category 1: Missing Module Imports (20+ errors)
- [ ] Fix `shared/` imports (claw-automation-status, claw-mission-events, etc.)
- [ ] Fix `hooks/` imports in menus/ (useUiMode, useSimplePreferences, etc.)
- [ ] Fix `@/hooks/` path aliases in MenuBar.tsx
- [ ] Fix `types/` imports (commands, hermes)
- [ ] Fix `utils/` imports (workspace)
- [ ] Fix `constants` import
- [ ] Fix `../../../paths` import in shared/claw-workspace-root.ts

### Category 2: ChatRow Property Fixes
- [ ] Fix `src/components/documenthandler/Chat.tsx` — Replace `fromUser`→`role`, `agentName`→`assistantPersona`, `segments`→`content`

### Category 3: Icon Import Errors
- [ ] Fix `DocumentViewer.tsx` — Replace wrong heroicons with correct ones

### Category 4: Type Mismatches
- [ ] Fix `Navigation.tsx` — Type compatibility issues
- [ ] Fix `ReferenceApp.tsx` — Missing props
- [ ] Fix `ViewMenu.tsx` — Props type mismatch
- [ ] Fix `SimpleApp.tsx` — Missing required props

### Category 5: Other Errors
- [ ] Fix `HermesTerminalView.tsx` — Missing names, type conversions
- [ ] Fix `HowToUseModal.tsx` — JSX namespace
- [ ] Fix `PMChatPanel.tsx` — Type comparison error
- [ ] Fix implicit any types in various files
- [ ] Fix all 60+ remaining TypeScript build errors
- [ ] `bun run build` produces zero errors

---

## Phase 1: Runtime Stability (WOP-003, WOP-004 stabilization)

**Goal**: App starts without crashes, chat works, Electron renders.

### Already Fixed (verify still working)
- [ ] Verify: WebSocket connection succeeds without ECONNRESET
- [ ] Verify: Bun.spawn for Pi JSON chat works when `node_modules/.bin/pi` exists
- [ ] Verify: WebSocket open handler wrapped in try/catch
- [ ] Verify: WebSocket message handler wrapped in try/catch
- [ ] Verify: React Strict Mode cleanup only closes OPEN WebSockets
- [ ] Verify: `resolvePiBinaryPath()` returns symlink path as-is (no realpathSync)
- [ ] Verify: PI cwd ENOENT fix — `getPrimaryWorkspacePath("default")` doesn't append `/default`

### Electron White Screen (Still Broken)
- [ ] Preload fix verified: `preload.cjs` using `require()` (no ESM in sandbox)
- [ ] Open Electron DevTools (Ctrl+Shift+I) → Console tab → look for red errors
- [ ] If no errors: Check Elements tab → `#root` content
- [ ] If React mounts but white: Check for `overflow-hidden` CSS on `<body>` with empty content area
- [ ] If login page shows: Check `window.location.pathname` at app start
- [ ] Add error boundary: Wrap `App` in `main.tsx` with React error boundary that logs to console
- [ ] Electron app renders React UI (no white screen)

### ENOENT / Pi Binary
- [ ] `resolvePiBinaryPath()` — add fallback to globally installed pi via enriched PATH
- [ ] Ensure `node_modules/.bin/pi` check waits for `bun install` completion
- [ ] Add health check endpoint `GET /api/diagnostics/pi` — reports pi binary status
- [ ] Add health check endpoint `GET /api/diagnostics/ws` — WebSocket health
- [ ] Show informative error: "Pi binary not found. Run `bun install` in the app directory."
- [ ] Dismissable ENOENT dialog not shown after `bun install`
- [ ] Chat functionality works end-to-end
- [ ] App works on first clone (no bun install dependency for critical path)

---

## Phase 2: Unified Auth & Routing (WOP-002 Phase 2-4)

**Goal**: All users enter via `/login`, role-based routing, consistent headers.

### AuthGate & Login
- [ ] Update `App.tsx` to add AuthGate component:
  - Check JWT token on mount
  - Redirect unauthenticated users to `/login`
  - Protect all routes
- [ ] Refactor `ClientDashboard.tsx`:
  - Remove inline login form
  - Rely on unified `/login` flow
  - Check for valid JWT via AuthGate instead
- [ ] Implement role-based redirect after login in LoginPage.tsx:
  - CLIENT → `/client`
  - WORKER/LEADER → `/portal`
  - ADMIN → `/admin` (or `/` for IDE)
  - SUPER_ADMIN → `/`
- [ ] Update `App.tsx` Layout component:
  - Use `window.location.pathname` to determine route
  - Render appropriate page component
  - Conditionally render headers

### Header Visibility Matrix
- [ ] Update `App.tsx` layout logic:
  - `/login` → No header
  - `/client`, `/portal` → Portal Header (minimal: branding + logout)
  - `/`, `/admin`, `/super-admin` → Global Header (full menus)
- [ ] Create/Update Portal Header component
- [ ] Ensure Global Header includes MenuBar + Navigation
- [ ] Implement "Admin Bridge" logic (switch between Portal and IDE headers)
- [ ] Add logout functionality to Global Header

### Navigation Inside MenuBar
- [ ] Embed `<Navigation />` component inside `<MenuBar />`
- [ ] Position: Center (between Left: Logo/AppMenus and Right: Search/ModelSelector)
- [ ] Ensure Navigation shows correct items based on role

### Manual Verification
- [ ] Unauthenticated user hitting any protected route → redirected to `/login`
- [ ] Login page at `/login` works for all roles
- [ ] Login with CLIENT role → lands on `/client` (Portal Header visible)
- [ ] Login with WORKER role → lands on `/portal` (Portal Header visible)
- [ ] Login with ADMIN role → lands on `/` or `/admin` (Global Header visible)
- [ ] Login with SUPER_ADMIN role → lands on `/` (Global Header visible)
- [ ] Admin clicks "Portal" in nav → switches to `/portal` with Portal Header
- [ ] Admin clicks IDE mode → switches to `/` with Global Header
- [ ] Navigation component renders in center of MenuBar
- [ ] Logout button works in Global Header
- [ ] All IDE modes work (Simple, Technical, Claw, Docs, Work)

---

## Phase 3: App.tsx Refactor (WOP-005)

**Goal**: App.tsx reduced from 4826 lines to ~200 lines.

### Phase 1: Extract Custom Hooks
- [ ] `useAppState.ts` — All useState, useRef, useMemo declarations from App() body
- [ ] `useAppEffects.ts` — All useEffect blocks extracted, no effect duplicated
- [ ] `useAppHandlers.ts` — All event handlers, file save/load, workspace ops extracted
- [ ] `useAppMenus.ts` — Menu bar state, toolbar config, panel visibility extracted
- [ ] App.tsx calls all four hooks and destructures what it needs

### Phase 2: Extract Mode Shells (into `src/pages/`)
- [ ] `ClawPage.tsx` — Takes props from hooks, renders Claw mode UI
- [ ] `DocsPage.tsx` — Takes props from hooks, renders Docs mode UI
- [ ] `WorkPage.tsx` — Takes props from hooks, renders Work mode UI
- [ ] `SimplePage.tsx` — Takes props from hooks, renders Simple mode UI
- [ ] Each shell is standalone, importable, testable in isolation

### Phase 3: Thin App.tsx
- [ ] App.tsx imports all hooks and shells
- [ ] Main return is simple `switch(uiMode)` over the four shells
- [ ] App.tsx is under 400 lines
- [ ] `bun run build` succeeds with zero errors
- [ ] All UI modes (Simple, Technical, Claw, Docs, Work) render correctly
- [ ] No runtime regressions in menu, file editing, chat, or navigation

---

## Phase 4: Pi.dev Version Pinning & Startup Logging (WOP-006)

**Goal**: Never get surprised by a pi.dev update breaking the system. Parallel-safe.

### Phase 1: Version Pin + Justfile Target
- [ ] `.env` gains `PI_PINNED_VERSION` (set to current `0.72.1`)
- [ ] `scripts/pi-version-check.sh` — validates `pi --version` matches `PI_PINNED_VERSION` at startup
- [ ] `just pi-verify` — runs the check
- [ ] `just pi-fix-version` — runs `npm install -g @mariozechner/pi-coding-agent@${PI_PINNED_VERSION}`
- [ ] `run-pi` target runs version check before loading extensions
- [ ] `package.json` pins `@mariozechner/pi-coding-agent` to exact version (no `^` or `~`)

### Phase 2: Startup Logging
- [ ] `scripts/pi-startup-log.sh` — logs all 14+ integration point statuses
- [ ] `just pi-log` — runs the logging script
- [ ] Output written to `logs/pi-startup-<timestamp>.jsonl`
- [ ] Log includes: version match, binary path, ExtensionAPI import test, JSON mode test, PI_STACK resolution

### Phase 3: Integration & Verification
- [ ] `start-wayofpi.sh` runs version check + logging before launching UI
- [ ] `start-wayofpi-electron.sh` runs version check + logging before launching Electron
- [ ] Failure when version mismatch is non-fatal warning (not a hard block)
- [ ] `bun run build` succeeds
- [ ] Both web and Electron modes start and log correctly

---

## Phase 5: Full Kanban Integration (WOP-002 Phase 5)

**Goal**: Full-featured Kanban system works alongside simplified WorkBoard.

- [ ] Fix import paths in `src/pages/Kanban.tsx` and `src/components/kanban/*`
- [ ] Fix service imports (mock*Service vs existing Way of Pi services)
- [ ] Migrate color scheme to Way of Pi theme (`bg-[#1e1e1e]`, `text-[#cccccc]`, `border-gray-700`, accent `#ea580c`)
- [ ] Fix context imports (`../contexts/ToastContext` → `../context/ToastContext`)
- [ ] Replace `react-router-dom` usage with `window.location.pathname` routing
- [ ] Replace `lucide-react` icons with equivalent heroicons if needed
- [ ] Add route in `App.tsx` for full kanban view (e.g., `/kanban` or Work mode)
- [ ] Wire up `BoardSelector`, `CardView`, `BoardSettingsModal`, `BoardMembers` into app
- [ ] Ensure `Kanban.tsx` uses `useToast` from Way of Pi's `ToastContext`
- [ ] Verify all 9 component files in `src/components/kanban/` compile without errors

---

## Phase 6: SDK Migration — Eliminate Subprocess Layer (WOP-004)

**Goal**: Replace `pi --mode json` subprocess with `import { createAgentSession }` from pi.dev SDK.

### Migration
- [ ] Extract server as standalone Bun service or clean separation
- [ ] Port all server logic from `wayofpi-ui/server/`
- [ ] Update client to call server via URLs (not local paths)
- [ ] Remove all client→server type sharing
- [ ] Deploy server on separate port (e.g., :3000 or :3333)
- [ ] Point Vite static files to Bun server

### SDK Integration
- [ ] Replace `pi --mode json` subprocess with `import { createAgentSession }` from SDK
- [ ] Eliminate `pi-binary.ts`, `pi-json-mode-chat.ts`, `pi-agent-runtime.ts` surface area
- [ ] Typed event stream (`AgentSessionEvent`) instead of line-by-line JSON parsing
- [ ] Version pinning through package.json lockfile only

### Community Extension Migration (replace in-app code)
- [ ] Replace `MarkdownPreviewPane.tsx` + `MermaidPreviewPane.tsx` → `pi-markdown-preview` or `pi-mermaid`
- [ ] Replace web fetch utilities + server proxy → `pi-web-access`
- [ ] Replace inline user prompt dialogs → `@juicesharp/rpiv-ask-user-question`
- [ ] Replace `ProblemsPanelBody.tsx` + lint/format integration → `pi-lens`

---

## Phase 7: Financial System (WOP-008)

**Goal**: Add budgets, salaries, invoicing, multi-currency, dashboards, reports.

**PRD**: `issues/prd-financial-system.md`
**Slices**: `issues/001-worker-financial-profiles.md` through `issues/007-financial-reports.md`

### Slice 1: Worker Financial Profiles
- [ ] Create `worker_financial_profiles` table (hourly_rate, monthly_salary, billing_rate, salary_allocation)
- [ ] API: CRUD for worker profiles
- [ ] UI: Admin sets rates, worker views own profile
- [ ] Extend `users` table with link to financial profile

### Slice 2: Budget Engine
- [ ] Create `budgets` and `budget_adjustments` tables
- [ ] Propose/approve lifecycle (states: draft → proposed → approved → active → closed)
- [ ] Cost calculation from time × rates + expenses
- [ ] Alert thresholds (notify when spend > X% of budget)
- [ ] Extend `projects` table with budget links

### Slice 3: Expense Tracking
- [ ] Create `expenses` table (manual line items + receipt upload)
- [ ] PM approval workflow for expenses
- [ ] Cost hits budget automatically on approval
- [ ] Receipt file upload + storage

### Slice 4: Financial Dashboard
- [ ] Summary cards (budget health, spend rate, remaining)
- [ ] Charts (burn rate over time, category breakdown)
- [ ] Role-filtered views (worker sees own, PM sees team, admin sees all)

### Slice 5: Invoice System
- [ ] Create `invoices` and `invoice_payments` tables
- [ ] Invoice lifecycle: Draft → Sent → Overdue → Partially Paid → Paid → Written Off
- [ ] PDF generation from billable time × billing_rate + expenses
- [ ] Partial payment tracking
- [ ] Auto-generated invoice numbers (INV-YYYY-NNNNN)
- [ ] Configurable tax rate per invoice

### Slice 6: Multi-Currency
- [ ] Create `exchange_rates` table (manual + API fallback)
- [ ] Global reporting currency approach
- [ ] Every amount stored in native currency, reports convert at query time
- [ ] Currency fields in financial profiles, budgets, invoices

### Slice 7: Financial Reports
- [ ] CSV export (budget summary, worker costs, invoice history)
- [ ] PDF export (same reports in document format)
- [ ] Date range filtering
- [ ] Role-based access to reports

---

## Phase 8: Production Delivery — Desktop (WOP-009 §1)

**Goal**: Signed desktop installers for Windows, macOS, Linux with auto-update.

### Prerequisites
- [ ] `bun run build` passes (blocked on Phase 0)
- [ ] Pin pi.dev version (recommended before production build)

### macOS
- [ ] Enroll in Apple Developer Program ($99/yr)
- [ ] Generate Developer ID Application certificate
- [ ] Configure `hardenedRuntime` + `gatekeeper-assess` in electron-builder
- [ ] Add `afterSign` notarization hook (`electron-notarize`)
- [ ] Test unsigned `.dmg` build: `cd apps/wayofpi-ui && bun run pack`
- [ ] Verify notarization: `spctl --assess --verbose /path/to/Way\ of\ Pi.app`

### Windows
- [ ] Purchase Authenticode code signing cert (DigiCert/Sectigo ~$200-400/yr)
- [ ] Export cert to .pfx or configure Azure Key Vault
- [ ] Set `certificateFile` + `certificatePassword` in `package.json` (env vars)
- [ ] Configure NSIS installer (icon, desktop shortcut, Start menu)
- [ ] Support silent install (`/S`) for enterprise deployment

### Linux
- [ ] Test unsigned AppImage locally
- [ ] Test unsigned `.deb` locally
- [ ] (Optional) Set up apt repo with GPG signing

### CI/CD (GitHub Actions)
- [ ] Create `.github/workflows/release.yml`
- [ ] Add build matrix: `[ubuntu-24.04, macos-14, windows-2022]`
- [ ] Add job: `lint + typecheck` (bun run tsc)
- [ ] Add job: `build` (bun run build → dist/)
- [ ] Add job: `docker-build-push` (to ghcr.io)
- [ ] Add job: `electron-pack` (matrix per platform)
- [ ] Add job: `sign` (macOS notarize + Windows Authenticode)
- [ ] Add job: `create-release` (GitHub Release + upload artifacts)
- [ ] Add job: `deploy` (Docker to Railway/Fly)

### Auto-Update
- [ ] Add `electron-updater` to dependencies
- [ ] Configure `publish.provider: github` in `package.json`
- [ ] Wire check-for-update in `electron-main.mjs` on app ready
- [ ] Test update flow: tag → build → install old → verify update prompt

### Release Process
- [ ] `bun run pack` produces working unsigned installer on all 3 platforms
- [ ] GitHub Actions matrix builds Linux + macOS + Windows on tag push
- [ ] Auto-update wired via electron-updater + GitHub Releases
- [ ] `wayofpi.com/download` redirects to latest GitHub Release
- [ ] Release workflow works end-to-end: tag → build → sign → release

---

## Phase 8: Production Delivery — Cloud Hosting (WOP-009 §2)

**Goal**: Multi-tenant Docker deployment on Railway/Fly with PostgreSQL, Caddy, backups.

### Docker Hardening
- [ ] Add non-root user to Dockerfile (`USER wayofpi`)
- [ ] Add `HEALTHCHECK --interval=30s CMD curl -f http://localhost:3333/api/health`
- [ ] Add resource limits (`--cpus=2 --memory=2g`)
- [ ] Build locally: `docker build -t wayofpi:test .`
- [ ] Run locally: `docker run -p 3333:3333 wayofpi:test` → verify `/api/health`

### Production Docker Compose
- [ ] Create `docker-compose.prod.yml`
- [ ] Add PostgreSQL service (persistent volume, init script)
- [ ] Add Caddy reverse proxy (auto Let's Encrypt TLS)
- [ ] Add Way of Pi service (env vars, depends_on postgres)
- [ ] Test: `docker compose -f docker-compose.prod.yml up`
- [ ] Verify end-to-end: browser → Caddy → Way of Pi → PostgreSQL

### Multi-Tenant Provisioning
- [ ] Write `scripts/provision-client.sh`:
  - Create new PostgreSQL database
  - Run `bun run migrate`
  - Insert client record (subdomain, DB URL, plan)
  - Add Caddy subdomain config
- [ ] Write `scripts/deprovision-client.sh`
- [ ] Document onboarding flow in `docs/CLOUD_ONBOARDING.md`

### Cloud Deployment
- [ ] Sign up for Railway (or Fly.io)
- [ ] Connect GitHub repo → auto-deploy on main
- [ ] Set up `app.wayofpi.com` DNS → cloud provider
- [ ] Deploy Docker image
- [ ] Verify production: `https://app.wayofpi.com/api/health`

### Backups
- [ ] Install `rclone`, configure Backblaze B2
- [ ] Write `scripts/backup.sh`:
  - `pg_dump` all client databases
  - `rclone copy` to B2 bucket
  - Delete backups older than 30 days
- [ ] Add daily cron: `0 3 * * * /path/to/scripts/backup.sh`
- [ ] Write `scripts/restore.sh` (restore from B2)
- [ ] Test backup + restore flow end-to-end

### Monitoring
- [ ] Sign up Better Uptime / UptimeRobot
- [ ] Add monitor: `https://app.wayofpi.com/api/health` (5-min interval)
- [ ] Add alert: email/Slack on 2 consecutive failures
- [ ] Add pino to Bun API for structured JSON logging

---

## Phase 8: Production Delivery — Self-Hosted Portal (WOP-009 §3)

**Goal**: Clients can self-host Way of Pi on their own machine with minimal friction.

### systemd Service
- [ ] Create `linux/wayofpi.service`:
  - `User=wayofpi`
  - `WorkingDirectory=/home/wayofpi/Way of pi`
  - `ExecStart=/home/wayofpi/.bun/bin/bun run apps/wayofpi-ui/server/index.ts`
  - `Restart=on-failure`
- [ ] Add `just install-systemd-service` → copies service file, enables, starts
- [ ] Create `wayofpi` system user with restricted home dir

### Tunnel Automation
- [ ] Write `scripts/tunnel-cloudflare.sh`:
  - Check/install `cloudflared`
  - `cloudflared tunnel login`
  - `cloudflared tunnel create wayofpi` (if not exists)
  - `cloudflared tunnel route dns wayofpi clientx.wayofpi.com`
  - `cloudflared tunnel run wayofpi --url http://localhost:3333`
- [ ] Write `scripts/tunnel-ngrok.sh` (fallback)
- [ ] Add `just tunnel` command

### Client Documentation
- [ ] Write `docs/SELF_HOSTING_GUIDE.md`:
  - Hardware requirements (min/recommended)
  - Prerequisites (Bun, Git, cloudflared/ngrok)
  - Step 1: Clone repo + install deps
  - Step 2: Set up environment (.env)
  - Step 3: Start service (`just self-host`)
  - Step 4: Expose via tunnel (`just tunnel`)
  - Step 5: Verify health
  - Maintenance (updates via `git pull` + `bun install`, backup)
  - Security (firewall, env vars, non-root user)

### Smoke Test
- [ ] Provision fresh Ubuntu 22.04 VM (Hetzner/DigitalOcean $4/mo)
- [ ] Follow self-hosting guide from scratch
- [ ] Measure: time from VM boot to public URL responding (target: under 30 min)
- [ ] Fix any issues found in guide

---

## Phase 8: Production Delivery — Domain & Polish (WOP-009 §4)

**Goal**: `wayofpi.com` live, admin dashboard v1, landing page.

### Domain
- [ ] Register `wayofpi.com` via Cloudflare (~$10/yr)
- [ ] Set DNS records:
  - `app.wayofpi.com` → cloud provider IP or CNAME
  - `download.wayofpi.com` → GitHub Pages or redirect
  - `wayofpi.com` → static landing page or redirect to GitHub
- [ ] Enable Cloudflare proxy (orange cloud) for DDoS + CDN

### Admin Dashboard (v1)
- [ ] Add `/admin/clients` API endpoint (list active clients, subdomains, plan tier)
- [ ] Add admin table component (client name, subdomain, uptime, plan tier)
- [ ] Wire to role-based access (super-admin only)

### Landing Page (Minimal)
- [ ] Create `index.html` at root (or GitHub Pages):
  - Product description
  - Download links (Win/Mac/Linux)
  - Cloud hosting CTA
  - Self-hosted docs link
- [ ] Point `wayofpi.com` → landing page

### Pricing & Billing (Future)
- [ ] Define pricing tiers in config or DB
- [ ] Add subscription provider (Stripe) — optional
- [ ] Meter usage per client (active users, storage, requests)

---

## Already Completed (WOP-001, WOP-003 partial)

### WOP-001 — Docs Mode Routing ✅
- [x] FileExplorer displays file tree (added visible, onToggle, appearanceDark props)
- [x] ChatPanel shows conversation history (added visible, onToggle props)
- [x] DocumentBrowser integrated into DocsApp with toggle button
- [x] DocumentBrowser tree filtering (filterType + searchQuery with real-time filtering)
- [x] DocumentBrowser.css with proper dark theme styling
- [x] File tree rendering with expand/collapse
- [x] Empty states with loading indicators
- [x] File selection logic consolidated (Path A/B)
- [x] Build passes (DocsApp.tsx + DocumentBrowser.tsx errors fixed)

### WOP-003 — Already Fixed ✅
- [x] WebSocket open handler wrapped in try/catch
- [x] WebSocket message handler wrapped in try/catch
- [x] React Strict Mode cleanup only closes OPEN WebSockets
- [x] `resolvePiBinaryPath()` no longer calls realpathSync
- [x] PI cwd ENOENT fix for default tenant
- [x] `preload.mjs` → `preload.cjs`, switched to CommonJS

### WOP-005 — Already Done ✅
- [x] Clarified src/modals/ are WHN Chat refs (not part of refactor)
- [x] Fixed WorkBoard.tsx useToast import, infinite re-render loop, async callers
- [x] Fixed ClientDashboard.tsx 403 by switching to apiGet() with auth headers
- [x] Added stub methods to mockKanbanService, developmentWorkflowService
- [x] Created workflowsService.ts

---

## Dependency Quick Reference

```
Phase 0 (clean build)
  └── BLOCKS: Phase 1, 2, 3, 5, 7, 8 desktop/cloud

Phase 1 (runtime stability)
  └── BLOCKS: Phase 2 (working app to test auth)

Phase 2 (auth & routing)
  └── BLOCKS: Phase 3 (routing settled before extracting shells)

Phase 3 (App.tsx refactor)
  └── No blocker for other phases

Phase 4 (pi.dev versioning)
  └── PARALLEL-SAFE — can run anytime

Phase 5 (kanban)
  └── Depends on Phase 0 + Phase 2 + Phase 3

Phase 6 (SDK migration)
  └── Depends on Phase 0, 1, 2, 3 stable

Phase 7 (financial system)
  └── PARALLEL-SAFE after Phase 0 — additive, doesn't modify existing data

Phase 8 (production delivery)
  ├── Desktop: blocked on Phase 0 (needs clean dist/)
  ├── Cloud: blocked on Phase 0 (needs clean dist/)
  ├── Self-host: semi-independent (uses current code)
  └── Domain: independent (just registration + DNS)
```

---

*Generated from WOP-001 through WOP-009. Update this file when tickets change.*
