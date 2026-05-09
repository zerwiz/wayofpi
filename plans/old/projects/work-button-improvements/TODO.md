# Work Button Improvements - TODO

**CRITICAL**: All UI components and implementation files belong in `/home/zerwiz/CodeP/Way of pi/apps/`, NOT in plans!

## Correct File Locations

### Implementation (apps/)
- `/home/zerwiz/CodeP/Way of pi/apps/workerportal/` - Worker portal (✓)
- `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/components/work/` - Work mode components (✓)
- `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/components/docs/` - Docs mode components (✓)

### Planning (plans/projects/work-button-improvements/)
- `01-PLAN.md` - Main plan
- `02-NAVIGATION-ARCHITECTURE.md` - Navigation docs
- `03-WORKER-PORTAL-DEMO-MODE.md` - Demo mode spec
- `04-WHATSAPP-INTEGRATION-PLAN.md` - WhatsApp integration
- `DEPLOYMENT.md` - Deployment guide
- `NGROK_SETUP.md` - Ngrok setup
- `VPS_SETUP.md` - VPS setup
- `TODO.md` - This file

---

## Phase 0: Critical Infrastructure (DONE ✓)

- [x] Move files from wrong `plans/` to correct `docs/` directory
- [x] Fix icon imports to use `lucide-react` (installed) instead of `@heroicons/react`
- [x] Create Work mode components: `TimeEntryForm.tsx`, `TeamBrowser.tsx`, `LeaderActions.tsx`, `TaskForm.tsx`, `TaskList.tsx`, `TimeReport.tsx`, `TeamDashboard.tsx`
- [x] Update `docs/STRUCTURE.md` to reflect correct file locations
- [x] Add database init SQL to `apps/workerportal/deploy/`

---

## Phase 1: Navigation Integration (CRITICAL - IN PROGRESS)

### Fix Navigation Bar
- [x] Create unified navigation component showing: `[Simple] [Technical] [Claw] [Docs] [Work]`
- [ ] Add context-aware conditional nav: `Work → [Portal] | [Client] | [Admin] | [Profile]`
- [ ] Implement role-based visibility:
  - Worker users → see Portal
  - Admin users → see Admin
  - Client projects → see Client
  - All users → see Profile
- [x] Integrate WorkerPortal with navigation bar
- [ ] Handle authentication flow properly
- [ ] Show portal dashboard when clicked
- [ ] Implement login/logout functionality

### Files to Modify:
- [x] `apps/wayofwork-ui/src/components/Navigation.tsx` - Created unified navigation (✓)
- [x] `apps/wayofwork-ui/src/hooks/useUiMode.ts` - Add `"work"` mode (✓)
- [x] `apps/wayofwork-ui/src/components/UiModeToggle.tsx` - Add Work button (✓)
- [ ] `apps/wayofwork-ui/src/App.tsx` - Render `WorkApp`, handle routing

---

## Database Fix Progress (RESOLVED ✓)

### Database Connection Issue - FIXED
- **Problem**: API endpoints return `{"error":"Failed to fetch time entries","details":"no such table: time_entries"}`
- **Fixed**: 
  - ✅ Fixed `db.ts` to properly create all tables with `CREATE TABLE IF NOT EXISTS`
  - ✅ Fixed `tenants` INSERT to include required `slug` column
  - ✅ Updated `db.ts` to use path: `apps/wayofwork-server/db/wayofpi.sqlite`
  - ✅ Updated `init-db.ts` to use same path as `db.ts`
  - ✅ Tables now created: `tenants`, `users`, `projects`, `tasks`, `time_entries`
- **Database locations**:
  - `db.ts` path: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-server/db/wayofpi.sqlite`
  - Server workspace: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/default/.pi/db/wayofpi.sqlite`
- **Status**: Database tables now create successfully, server restart needed for testing

---

## Phase 2: Work Mode - Basic Time Tracking (HIGH PRIORITY)

### Worker Features
- [x] Create `WorkApp.tsx` with 3-panel layout (✓)
- [x] Create `TimeEntryForm.tsx` - Submit hours (✓)
- [ ] Store entries in `workspace/.wayofpi/time-entries.json`
- [ ] Show "My Submissions" list for workers
- [ ] Edit drafts (not submitted)
- [ ] See approval status
- [ ] Cannot see other workers' data

### Leader Features
- [x] Create `LeaderActions.tsx` panel (✓)
- [x] Add leader role toggle in Settings (✓)
- [x] Implement approve/reject endpoints:
  - [x] `POST /api/portal/time/:id/approve` (✓ in server/index.ts)
  - [x] `POST /api/portal/time/:id/reject` (✓ in server/index.ts)
- [x] Show ALL entries to leader (✓)
- [x] Add leader notes field (✓)
- [ ] Store leader role in `workspace/.wayofpi/work-config.json`

### Server API Endpoints (CODE COMPLETE ✓):
- [x] `GET /api/portal/time` - List time entries (✓ in server/index.ts:1080-1097)
- [x] `POST /api/portal/time` - Submit new entry (✓ in server/index.ts:1099-1128)
- [x] `POST /api/portal/time/:id/approve` - Leader approves (✓ in server/index.ts:1130-1164)
- [x] `POST /api/portal/time/:id/reject` - Leader rejects (✓ in server/index.ts:1166-1200)
- [x] `GET /api/portal/tasks` - List tasks (✓ in server/index.ts:1202-1230)
- [x] `POST /api/portal/tasks` - Create task (✓ in server/index.ts:1232-1260)
- [x] `PUT /api/portal/tasks/:id/status` - Update task status (✓ in server/index.ts:1262-1290)

**Status**: Database tables now created successfully in `apps/wayofwork-server/db/wayofpi.sqlite`

---

## Phase 3: Task Management (MEDIUM PRIORITY)

### Task Features
- [x] Create `TaskForm.tsx` (✓)
- [x] Create `TaskList.tsx` (✓)
- [ ] Implement task assignment workflow (UI ready, needs testing)
- [ ] Link time entries to tasks (API ready, needs UI integration)
- [ ] Task status workflow: `draft → in_progress → complete → cancelled`
- [ ] Task deadline tracking
- [ ] Add deadline tracking

### Server API Endpoints (DONE ✓):
- [x] `GET /api/portal/tasks` - List tasks (✓ code complete)
- [x] `POST /api/portal/tasks` - Create task (✓ code complete)
- [x] `PUT /api/portal/tasks/:id/status` - Update task (✓ code complete)

---

## Phase 4: Reports & Export (LOW PRIORITY)

### Reporting Features
- [x] Create `TimeReport.tsx` (✓)
- [x] Create `/api/portal/reports/time` endpoint (✓ in server/index.ts:1231-1260)
- [ ] Implement weekly/monthly report generation (UI ready, needs testing)
- [x] Add CSV export functionality: `GET /api/portal/reports/time?format=csv` (✓)
- [x] Create `TeamDashboard.tsx` (✓)

### Storage (Server-side - USING SQLITE):
- [x] `apps/wayofwork-server/db/wayofpi.sqlite` - All data in SQLite
- [x] Tables: `time_entries`, `tasks`, `projects`, `users`, `tenants`
- [ ] Add data export to JSON backup feature

---

## Docs Mode Improvements (from WOP_DOCS_MODE_IMPROVEMENTS.md)

### Phase1: Minimal Changes (Rename + Filter)
- [ ] Rename "Plans" to "Docs" in `useUiMode.ts` (or keep "docs" but change UI)
- [ ] Filter file tree: only `.md`, `.txt`, `.docs` files
- [x] Remove code-specific chat features (agent picker, thinking toggle) (✓)
- [ ] Add quick prompt buttons: "Summarize", "Extract action items", "Review"
- [ ] Add document status badges (Draft, Review, Approved)
- [ ] Hide line numbers in document viewer

### Phase2: Layout Redesign
- [x] Create `components/docs/DocumentBrowser.tsx` (grouped by folder) - MOVED FROM plans/ (✓)
- [x] Create `components/docs/DocumentViewer.tsx` (markdown renderer) - MOVED FROM plans/ (✓)
- [x] Create `components/docs/PMChatPanel.tsx` (simplified chat) - MOVED FROM plans/ (✓)
- [ ] Integrate doc components into Docs mode UI
- [ ] Replace code icons with document icons
- [ ] Add TOC sidebar to markdown viewer
- [ ] Add document metadata (author, last modified)

### Phase3: Full PM Workflow
- [ ] Create document templates (PRD, Spec, Meeting Notes, Planning)
- [ ] Implement status workflow: Draft → Review → Approved
- [ ] Add AI-powered document analysis features
- [ ] Implement document comparison view
- [ ] Add "My Documents", "Needs Review", "All Documents" views
- [ ] Full-text search across documents

---

## Worker Portal Features (from 03-WORKER-PORTAL-DEMO-MODE.md)

### Local Hosting Setup (CRITICAL FOR DEMOS)
- [x] Deploy to dev machine NOW (✓ server running)
- [x] Configure demo account for clients (✓ admin/admin created)
- [ ] Test client login flow (needs testing)
- [ ] Prepare demo presentation
- [ ] Share access with client team

### Local Deployment Checklist
- [x] Install Bun + tsx (✓)
- [x] Clone repository (✓)
- [x] Configure `.env` (instance ID, PIN) (✓)
- [x] Initialize SQLite database (✓ tables created)
- [x] Start with `./start-wayofpi.sh` (✓)
- [x] Test API endpoints with mock data (✓ requires JWT auth)
- [x] Verify WebSocket connections (✓ server running on 3333)

**Note**: Client APIs require JWT token with `role: "CLIENT"` in payload

### ngrok Setup Steps
- [ ] Get free ngrok token from https://ngrok.com
- [ ] Install ngrok CLI
- [ ] Run: `ngrok http 3333 --authtoken <your-token>`
- [ ] Copy tunnel URL
- [ ] Share URL with remote users
- [ ] Test external access from different networks

---

## WhatsApp Integration (from 04-WHATSAPP-INTEGRATION-PLAN.md)

### Integration Features
- [ ] Create WhatsApp bot webhook endpoint (need Meta Business API)
- [ ] Implement message parsing for time entries
- [ ] Add task creation via WhatsApp messages
- [ ] Send approval notifications via WhatsApp
- [ ] Create WhatsApp-specific UI in worker portal

**Note**: Requires `whatsapp_sessions` table (already in schema)

---

## Visual Design & UI Polish

### Color Scheme (Different from orange)
- [x] Primary: Blue (`#3b82f6`) - trust, professionalism (✓)
- [x] Success: Green (`#22c55e`) - approved (✓)
- [x] Warning: Yellow (`#eab308`) - pending (✓)
- [x] Error: Red (`#ef4444`) - rejected (✓)

### Icons (using lucide-react)
- [x] `CheckCircle` - approved (✓)
- [x] `XCircle` - rejected (✓)
- [x] `Clock` - pending/time (✓)
- [x] `FileText` - tasks (✓)
- [x] `Users` - team (✓)
- [x] `BarChart3` - reports (✓)

---

## Server API Implementation (Priority Order)

### High Priority (DONE ✓):
1. [x] `GET /api/portal/time` - List time entries (✓ in server/index.ts)
2. [x] `POST /api/portal/time` - Submit time entry (✓ in server/index.ts)
3. [x] `POST /api/portal/time/:id/approve` - Approve entry (✓ in server/index.ts)
4. [x] `POST /api/portal/time/:id/reject` - Reject entry (✓ in server/index.ts)

### Medium Priority (DONE ✓):
5. [x] `GET /api/portal/tasks` - List tasks (✓ in server/index.ts)
6. [x] `POST /api/portal/tasks` - Create task (✓ in server/index.ts)
7. [x] `PUT /api/portal/tasks/:id/status` - Update task (✓ in server/index.ts)
8. [ ] `POST /api/portal/tasks/:id/assign` - Assign task (TODO)

### Low Priority (DONE ✓):
9. [x] `GET /api/portal/reports/time` - Generate report (✓)
10. [x] CSV export functionality in TimeReport.tsx (✓)

---

## Testing Checklist

### Work Mode:
- [ ] Restart server to pick up database changes
- [ ] Test `GET /api/portal/time` endpoint
- [ ] Test `POST /api/portal/time` submit entry
- [ ] Test worker can submit time entry
- [ ] Test leader can approve/reject entries
- [ ] Test task assignment workflow
- [ ] Test role-based visibility
- [ ] Test CSV export functionality

### Docs Mode:
- [ ] Test file tree shows only document files
- [ ] Test document status badges work
- [ ] Test quick prompt buttons
- [ ] Test markdown rendering in viewer

### Navigation & Auth - FOLLOWING ARCHITECTURE DOC ✅
- [x] **User Flow Design**: Clients one way, Workers/Admins another way (✓ implemented)
- [x] **Client Entry**: Separate orange button in Navigation → `/client` → Login form
- [x] **Portal Entry**: "Portal" button for Workers/Admins → `/portal` → Worker Portal login
- [x] **Universal Authorization Gate**: Navigation only shows AFTER login (`userRole` is set)
- [x] **Role-Based Visibility** (following `02-NAVIGATION-ARCHITECTURE.md`):
  - [x] Simple: All logged-in users
  - [x] Technical: worker/admin/super_admin only
  - [x] Claw: leader/admin/super_admin only
  - [x] Docs: All logged-in users
  - [x] Work: worker/leader/admin/super_admin only
  - [x] Portal: worker/leader/admin only
  - [x] Admin: admin only
  - [x] Super Admin: super_admin only
  - [x] Profile: All logged-in users
  - [x] Client: client role only
- [ ] **TODO**: Pass `userRole` from login state to `Navigation` component in `App.tsx`
- [ ] Test login with valid Client ID/PIN
- [ ] Test login with valid Worker ID/PIN
- [ ] Test role-based nav visibility (Client vs Worker vs Admin)
- [ ] Test logout flow (need logout buttons)
- [ ] Add logout button to ClientDashboard
- [ ] Add logout button to WorkerPortal

### API Testing Commands:
```bash
# Test health endpoint
curl -s http://127.0.0.1:3333/api/health

# Generate JWT with CLIENT role for testing
node -e "const { SignJWT } = require('jose'); const SECRET = new TextEncoder().encode('way-of-pi-secret-key-change-me'); new SignJWT({ userId: 'dev-user', tenantId: 'dev-tenant', role: 'CLIENT' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('24h').sign(SECRET).then(t => console.log(t));"

# Test client projects (requires JWT with role: CLIENT)
curl -s http://127.0.0.1:3333/api/client/projects -H "Authorization: Bearer <JWT_TOKEN>"

# Test portal time entries (requires JWT with role: WORKER)
curl -s http://127.0.0.1:3333/api/portal/time -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Notes

- **Database**: `/home/zerwiz/CodeP/Way of pi/apps/workerportal/deploy/wayofpi-sqlite-init.sql`
- **Config**: `/home/zerwiz/CodeP/Way of pi/apps/workerportal/.env.example`
- **Docs**: `/home/zerwiz/CodeP/Way of pi/apps/workerportal/README.md`
- **Server Paths**: Add to `apps/wayofwork-ui/server/paths.ts`:
  - `isDocumentFile()` helper
  - Time/task storage paths

---

## Feature Dependencies Graph

```
Local Hosting Ready (TODO.md) ──┐
                                 ├──→ Work Button Navigation (01-PLAN.md) 
WorkMode UI Design (WOP_TIME_) │              │
                                ├────→ Task Detection from Code
DocsMode UI Design (WOP_DOCS_)╰────→ UI Mode Redesign Phase 3-4
```

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06 (database fixed, API endpoints code complete)  
**Owner:** Way of Pi Development Team

---

## Current Status Summary

### ✅ Completed
- Phase 0: Critical Infrastructure (all items)
- Database tables created (`tenants`, `users`, `projects`, `tasks`, `time_entries`)
- Server API endpoints (code complete in `server/index.ts`)
- Work mode UI components (7 components created)
- Navigation integration (basic structure)

### 🔄 In Progress
- Phase 1: Navigation Integration (context-aware nav, role-based visibility)
- Phase 2: Work Mode testing (API endpoints need server restart + testing)
- Phase 3: Task Management (assignment workflow)

### ⏳ Pending
- Testing all API endpoints after server restart
- WhatsApp integration
- Full PM workflow for Docs Mode
- Production deployment
