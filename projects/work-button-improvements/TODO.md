# TODO: WORK BUTTON / LOCAL HOSTING IMPLEMENTATION
**CRITICAL:** Host application on developer's computer ASAP for client demos and user testing!

## 🎯 Overview

This document tracks implementation for **LOCAL HOSTING** capability. Each instance (home, on-site, office) runs **INDEPENDENTLY**.

---

## 🔴 CRITICAL: Hosting Needed for Client Demos
**[ ] URGENT:** Host application on developer's computer ASAP
- Clients need to log in and try out the app
- Demo ready for stakeholder reviews
- User feedback needed before production
- See production hosting plans: `plans/productionready`

## ✅ CURRENT CAPABILITIES

### System Architecture

| Component | Current State | Local Hosting Ready? |
|-----------|----------------|---------------|
| **Backend** | Bun + tsx + WebSocket | ✅ Yes |
| **Frontend** | Vite React TS | ✅ Yes |
| **API** | WebSocket REST API | ✅ Yes |
| **Auth** | Simple PIN check | ✅ Yes (local only) |
| **SSL/TLS** | ngrok tunnel OR self-sign | ✅ Yes (dev or prod) |
| **Database** | SQLite (local file) | ✅ Yes (per-instance) |
| **Host Shell** | `bash` tool | ✅ Yes |

### Multi-Instance Design

- ✅ Each location (home, on-site, office) runs **STANDALONE**
- ✅ No central server needed
- ✅ Each instance has independent data
- ✅ No central auth required
- ✅ Suitable for remote work, multi-site teams

---

## 🔴 Critical (Local Hosting Ready)

### ✅ System Already Works

These capabilities are **CURRENTLY AVAILABLE**:

- [x] **Local hosting**: Runs on any machine independently
- [x] **ngrok tunnel**: External access via tunnel-gate
- [x] **SQLite database**: File-based, per-instance
- [x] **Simple auth**: PIN check for local security
- [x] **PTY WebSocket**: Terminal-like interface
- [x] **Local-only mode**: No central server dependency

### Documentation Updates

- [x] Update file paths to correct locations
- [x] Remove incorrect "multi-tenant" claims
- [x] Clarify single-instance design
- [x] Update "global" to "multi-location" terminology
- [x] Add ngrok tunnel instructions
- [x] Add VPS deployment instructions (DigitalOcean/Linode)

### Security Notes

- [ ] **ngrok**: External access when needed (auto-cert)
- [ ] **Self-signed**: For dev/local testing
- [ ] **SQLite**: Encrypted file for added security
- [ ] **Local auth**: PIN-based for demo/testing
- [ ] **HTTPS**: Via ngrok or Let's Encrypt (if static IP)

---

## 🟠 High Priority

### 📞 DEMO-READY DEPLOYMENT (URGENT)
- [ ] **Deploy to dev machine NOW**
- [ ] Configure demo account for clients
- [ ] Test client login flow
- [ ] Prepare demo presentation
- [ ] Share access with client team

### 🛠 Local Deployment Checklist
- [x] Install Bun + tsx
- [x] Clone repository
- [x] Configure `.env` (instance ID, PIN)
- [x] Initialize SQLite database
- [ ] Start with `bun run dev`
- [ ] Test with mock data
- [ ] Verify WebSocket connections

### 🔧 Instance Configuration Steps
- [ ] Create `.env.example` template
- [ ] Generate unique `.env` per instance
- [ ] Set `INSTANCE_ID` per location (home-001, office-001)
- [ ] Set `PIN` for demo/testing
- [ ] Configure `DB_FILE=.instance.db`
- [ ] Set `PORT=3333` or higher

### 🔌 ngrok Setup Steps
- [ ] Get free ngrok token from https://ngrok.com
- [ ] Install ngrok CLI
- [ ] Run: `ngrok http 3333 --authtoken <your-token>`
- [ ] Copy tunnel URL
- [ ] Share URL with remote users
- [ ] Test external access from different networks

### 💾 Database Initialization
- [ ] Create server-side init script
- [ ] Ensure SQLite creates on first run
- [ ] Add schema: time_entries, tasks, workers tables
- [ ] Seed initial data if needed

### 🔐 Security Setup
- [ ] If VPS: Configure firewall (ufw/firewalld)
- [ ] If VPS: Set up rate limiting
- [ ] If VPS: Install Fail2ban
- [ ] Configure Let's Encrypt for HTTPS
- [ ] Set up automatic SSL rotation
- [ ] Test PIN auth locally
- [ ] Test ngrok auth (if using tunnel)

---

## 🟡 Medium Priority

### VPS Deployment (Optional)

If you want centralized hosting:

- [ ] **DigitalOcean** ($5/mo Droplet)
- [ ] Install: `docker compose up`
- [ ] Or: Native Bun + tsx deployment
- [ ] Configure static IP for Let's Encrypt
- [ ] Set up reverse proxy (Nginx/Caddy)
- [ ] Enable automatic backup (1-2x/week)

### Instance Management

- [ ] Script for easy instance creation
- [ ] `.env.example` template per location
- [ ] One-command deploy helper
- [ ] Backup script for SQLite files

---

## 🟢 Low Priority

### Local Features

- [ ] Add welcome message for new instances
- [ ] Create instance ID generator
- [ ] Add instance health check
- [ ] Create deployment checklist

### Security Hardening (Optional)

- [ ] If VPS deployed: Configure firewall
- [ ] Rate limiting for API endpoints
- [ ] Fail2ban on SSH if VPS hosted
- [ ] SSL certificate rotation (automatic)

---

## 🧪 Local Testing Checklist

- [ ] Install on local machine (home)
- [ ] Install on work machine
- [ ] Test ngrok tunnel from each location
- [ ] Verify each instance has independent data
- [ ] Test session persistence locally
- [ ] Verify no cross-instance data leak

---

## 📋 Definition of Done (Local Hosting)

Each location's instance should meet these criteria:

- [ ] Runs independently (no central server)
- [ ] Has own SQLite database
- [ ] Works with ngrok tunnel (if needed)
- [ ] No external dependencies (offline-capable)
- [ ] Self-contained deployment
- [ ] Security via PIN + ngrok auth (if used)

---

## 🚫 Known Limitations (Local Hosting)

- **Single instance**: No central data store
- **ngrok required**: For external access (free tier limits)
- **PIN auth only**: No advanced auth system
- **Local-only mode**: Best for home/office deployment
- **No cross-instance sync**: Each location independent

---

## ✅ What This Design Enables

- ✅ Remote work from home
- ✅ Multi-site teams (each site independent)
- ✅ Field work (run from laptop)
- ✅ Private deployments (VPS or ngrok)
- ✅ Self-contained instances
- ✅ Offline-first approach
- ✅ Local testing without setup

---

## 🚦 Status

- ✅ **Local hosting**: Ready
- ✅ **Multi-instance**: Supported
- ✅ **ngrok tunnel**: Available when needed
- ✅ **Single instance**: Each location independent

---

## 📚 Related Documentation

### Infrastructure & Deployment
- [Local Deployment](./DEPLOYMENT.md) (new)
- [VPS Setup Guide](./VPS-SETUP.md) (new)
- [NGROK Guide](./NGROK-SETUP.md) (new)

### UI Mode Improvement Capabilities (Aligned)

#### Docs → Plans Redesign
**Aligned With:** [WOP_DOCS_MODE_IMPROVEMENTS.md](./ref/WOP_DOCS_MODE_IMPROVEMENTS.md)

**Current Capability:** Basic document file listing with code icons

**Target Capability:** 
- Document-only file tree filter (.md, .txt, .doc)
- Folder grouping (Plans, Docs, Specs, Projects)
- Document status badges
- Markdown rendered viewer with TOC
- Simplified PM chat with document-specific prompts

**Implementation Task:** [ ] Implement Phase 1 changes (rename, filter, simplify chat)
**Depends On:** Work button navigation integration completing

#### Work Mode - Time & Task Management
**Aligned With:** [WOP_TIME_MANAGEMENT_PLAN.md](./ref/WOP_TIME_MANAGEMENT_PLAN.md)

**Current Capability:** Basic time tracking form (pending)

**Target Capability:**
- 3-panel layout: Team Browser | Time/Tasks View | Leader Actions
- Worker and Leader role toggle
- Time entry submission and approval workflow
- Task creation, assignment, status tracking
- Weekly/monthly report generation
- CSV export

**Implementation Task:** [ ] Implement Phase 1 (basic time tracking in Work mode)
**Depends On:** Navigation integration, local hosting stable

### Feature Dependencies Graph

```
Local Hosting Ready (TODO.md) ──┐
                                 ├──→ Work Button Navigation (01-PLAN.md) 
WorkMode UI Design (WOP_TIME_) │             
                                ├────→ Task Detection from Code
DocsMode UI Design (WOP_DOCS_)╰────→ UI Mode Redesign Phase 3-4
```

### Implementation Queue (Aligned with Both Docs)

1. **🔴 CRITICAL:** Complete 01-PLAN.md Phase 1 (navigation integration)
2. **🟠 HIGH:** Complete TODO.md local hosting deployment
3. **🟡 MEDIUM:** Complete DOC IMPROVEMENTS Phase 1 below
4. **🟢 LOW:** Complete WORK MODE Phase 1 below

### 📋 DOC IMPROVEMENTS TASKS (from WOP_DOCS_MODE_IMPROVEMENTS.md)

#### Phase 1: Minimal Changes (Rename + Filter)
- [ ] Rename "Plans" to "Docs" in `useUiMode.ts`
- [ ] Filter file tree: only `.md`, `.txt`, `.docs` files
- [x] Remove code-specific chat features (agent picker, thinking toggle)
- [ ] Add quick prompt buttons: "Summarize", "Extract action items", "Review"
- [ ] Add document status badges (Draft, Review, Approved)
- [ ] Hide line numbers in document viewer

#### Phase 2: Layout Redesign
- [ ] Create `components/plans/DocumentBrowser.tsx` (grouped by folder)
- [ ] Create `components/plans/DocumentViewer.tsx` (markdown renderer)
- [ ] Create `components/plans/PMChatPanel.tsx` (simplified chat)
- [ ] Replace code icons with document icons
- [ ] Add TOC sidebar to markdown viewer
- [ ] Add document metadata (author, last modified)

#### Phase 3: Full PM Workflow
- [ ] Create document templates (PRD, Spec, Meeting Notes, Planning)
- [ ] Implement status workflow: Draft → Review → Approved
- [ ] Add AI-powered document analysis features
- [ ] Implement document comparison view
- [ ] Add "My Documents", "Needs Review", "All Documents" views
- [ ] Full-text search across documents

### 📋 WORK MODE TASKS (from WOP_TIME_MANAGEMENT_PLAN.md)

#### Phase 1: Basic Time Tracking (Workers and admin  Only)
- [ ] Add `"work"` to `useUiMode.ts` type
- [ ] Create `apps/wayofpi-ui/src/components/work/WorkApp.tsx`
- [ ] Create `TimeEntryForm.tsx` component
- [ ] Implement basic 3-panel layout (Team Browser | Entries | Leader Actions)
- [ ] Create data storage: `workspace/.wayofpi/time-entries.json`
- [ ] Build "My Submissions" list for workers
- [ ] Create `apps/wayofpi-ui/src/components/work/TeamBrowser.tsx`
- [ ] Create `apps/wayofpi-ui/src/components/work/LeaderActions.tsx`

#### Phase 2: Leader Review
- [ ] Add leader toggle to Settings
- [ ] Store leader role in `workspace/.wayofpi/work-config.json`
- [ ] Create approve/reject endpoints: `/api/time-entries/:id/approve`
- [ ] Create `/api/time-entries/:id/reject` endpoint
- [ ] Show ALL entries to leader (not just their own)
- [ ] Add leader notes field to time entries
- [ ] Create `apps/wayofpi-ui/src/components/work/LeaderReviewPanel.tsx`

#### Phase 3: Task Management
- [ ] Create `apps/wayofpi-ui/src/components/work/TaskForm.tsx`
- [ ] Implement task assignment workflow
- [ ] Link time entries to tasks
- [ ] Create task status workflow: Draft → In Progress → Complete
- [ ] Add deadline tracking
- [ ] Create `apps/wayofpi-ui/src/components/work/TaskList.tsx`

#### Phase 4: Reports & Export
- [ ] Create `/api/time-reports` endpoint
- [ ] Implement weekly/monthly report generation
- [ ] Add CSV export functionality
- [ ] Create `apps/wayofpi-ui/src/components/work/TimeReport.tsx`
- [ ] Create `apps/wayofpi-ui/src/components/work/TeamDashboard.tsx`

#### Visual Design
- [ ] Use CheckCircle (`#22c55e`), XCircle (`#ef4444`), Clock icons
- [ ] Create `TeamBrowser` component with worker list
- [ ] Create `TimeTaskView` component with tabs

---

**Created:** 2024-01-XX  
**Last Updated:** 2024-01-XX  
**Owner:** Way of Pi Development Team
