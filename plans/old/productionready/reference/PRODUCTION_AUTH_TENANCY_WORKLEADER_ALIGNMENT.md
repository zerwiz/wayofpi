# Way of Pi: Production-Ready Platform & Work Leader Alignment

## 1. Executive Summary
This document bridges the **Way of Pi** technical platform (Distribution, Multi-Tenancy, Auth) with the **Work Leader System** (Docs Mode, Work Mode, Worker Portal, Two-Bot WhatsApp System). It defines how the system scales from a personal desktop tool to a professional multi-tenant cloud environment for project managers and their teams (office + construction workers).

---

## 2. Platform Architecture

### 2.1 Multi-Tenancy Models
Way of Pi supports two primary deployment models:

| Feature | **Local Host (Personal)** | **Cloud/On-Prem (Team)** |
|---------|---------------------------|--------------------------|
| **Target** | Single Developer / Project Manager | Organization / Construction Firm |
| **Tenancy** | Single-Tenant | Multi-Tenant (Isolated Workspaces) |
| **Auth** | Simple PIN (Workers) or Auto-Login | Username / Password / MFA (Leaders) |
| **AI Backend** | Local Ollama (Automated Setup) | Cloud LLMs or Centralized Ollama |
| **Database** | Local SQLite | PostgreSQL / Managed DB |
| **Worker Access** | Worker Portal (ID+PIN) | Worker Portal + WhatsApp Bot |
| **File Types** | Office docs (md, pdf, doc) | + CAD files (dwg, rvit, dxf) |

### 2.2 Client-Server Split
- **Main System (Server):** Handles authentication, multi-tenancy logic, file orchestration, WhatsApp bot management, and AI routing. Can run on a user's machine or a remote server.
- **Client (UI):** 
    - **Native Desktop (Electron Builder):** Full IDE experience for Leaders (Docs Mode, Work Mode, Claw).
    - **Worker Portal (Web):** Mobile-responsive portal for Workers (Login via ID + PIN, download PDFs/CAD files).
    - **WhatsApp Bots (TWO):**
        - **@WorkTimeBot:** For workers (simple commands: "log time", "send drawing").
        - **@WorkLeaderClaw:** For leaders (full Claw access on phone).
    - **Telegram:** Alternative to WhatsApp (same two-bot architecture).

---

## 3. Role-Based Access Control (RBAC) & Scale

The system implements a 4-tier hierarchical security model designed to scale for organizations with multiple leaders and 100+ workers.

### 3.1 Role Definitions

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **Super Admin** | System-Wide | Manage Tenants, Global Settings, System Health, Licenses. |
| **Admin** | Tenant-Level | Manage Work Leaders, Billing, Tenant Configuration, Overall Reporting. |
| **Work Leader** | Project/Team-Level | Manage Workers, Approve Time, Assign Tasks, Evaluate Documents. |
| **Worker** | Individual-Level | Log Time, View Assigned Tasks, Download Shared Files. |
| **Client** | Stakeholder-Level | View Progress, Review Shared Drawings, Report Issues/Feedback. |

### 3.2 Workspace & Data Isolation

The system distinguishes between three levels of file access:

1.  **Personal Space:** A private sandbox for each Work Leader and Worker. Files here are NOT shared with others unless explicitly moved.
2.  **Shared/Project Space:** Folders accessible to specific Work Leaders and the Workers assigned to them (e.g., `projects/A-101/`).
3.  **Tenant/Public Space:** A read-only area for general company documents (e.g., safety manuals, general templates).

### 3.3 Scaling for 100+ Workers
To support 100+ workers per tenant without performance degradation:
- **Database Indexing:** Ensure `userId`, `tenantId`, and `projectId` are indexed for fast lookups in time/task tables.
- **Connection Pooling:** Use connection pooling for SQLite/PostgreSQL to handle concurrent worker requests.
- **Pagination & Virtualized Lists:** UI components (Worker Portal lists, Admin dashboards) must use pagination or virtualization.
- **WebSocket Throttling:** Throttle status updates for large worker pools to prevent UI lag.

### 3.3 Authentication Mechanisms

#### Tier 1: Worker Access (Worker Portal / WhatsApp)
- **Mechanism:** Worker ID + 4-6 digit PIN or Phone Number Whitelist.
- **Scope:** Jailed access to `shared-info/` and assigned tasks only.

#### Tier 2: Leadership Access (Work Leader / Admin)
- **Mechanism:** Username + Strong Password + JWT.
- **Scope:** Full control over assigned projects/teams or the entire tenant workspace.

#### Tier 3: Super Admin Access
- **Mechanism:** Secure Admin Dashboard with hardware-key support (optional) or strict IP whitelisting.
- **Scope:** Global system management across all tenants.

---

## 4. Production Distribution

### 4.1 One-Click Native Installer
For non-technical users, a single command handles everything:
- **Unix:** `curl -fsSL https://.../install.sh | bash`
- **Windows:** `iwr -useb https://.../install.ps1 | iex`

**Automation Steps:**
1. Detect OS and architecture.
2. Download pre-compiled **Way of Pi** binary (`.dmg`, `.exe`, or `AppImage`).
3. **AI Bridge:** Silent install of Ollama + Auto-pull of `qwen2.5:9b`.
4. Initialize local SQLite database and setup default admin account.

### 4.2 Professional Cloud (Docker/VM)
- **Docker Compose:** Orchestrates the Way of Pi Server, PostgreSQL, and Ollama/GPU containers.
- **VM Image (.ova):** Pre-configured Ubuntu-based image for air-gapped or high-security on-premise deployments.

---

## 5. Work Leader System Integration

### 5.1 Document Sharing Workflow (Office + Construction)
1. **Leader (Secure Login):** Evaluates a document/blueprint in Docs Mode.
2. **Leader:** Marks as "Approved" and assigns to "Construction Team" or "Office Staff".
3. **Platform:** Multi-tenancy logic copies the file to the tenant's `shared-info/` folder.
4. **Worker (Simple Login):** Receives WhatsApp notification and:
    - **Office Worker:** Logs into Worker Portal, downloads PDF/doc.
    - **Construction Worker:** Replies "send A-101" to @WorkTimeBot, receives CAD drawing/PDF on phone.

### 5.2 Time Management Sync
- **Worker:** Submits hours via:
    - **Worker Portal:** Form with date picker, project, hours.
    - **@WorkTimeBot:** "log 6h on A-101 foundation".
- **Platform:** Records the entry scoped to the Tenant ID and User ID. Includes optional `drawingRef` (e.g., "A-101") for construction.
- **Leader:** Reviews all pending entries in the "Work" tab and approves them, triggering a WhatsApp notification back to the worker.

### 5.3 Two-Bot WhatsApp Architecture (NEW)
- **@WorkTimeBot (Workers):**
    - Separate WhatsApp Business number.
    - Limited tools (6): time tracking, task list, document requests.
    - Commands: "log time", "what tasks?", "send drawing", "my status".
- **@WorkLeaderClaw (Leader):**
    - Leader's personal WhatsApp number.
    - Full Claw access (50+ tools): plan, build, schedule, approve, share.
    - Commands: "approve John's 4.5h", "share PRD with team", "send morning tasks".
- **Why TWO bots?**
    - ✅ Workers see simple interface (no Claw complexity).
    - ✅ Leader has full power on personal phone.
    - ✅ Different numbers = clear role separation.

### 5.4 Construction Workers Support (NEW)
- **File Types:**
    - PDFs: Blueprints, site plans (`.pdf`).
    - CAD Files: AutoCAD (`.dwg`, `.dxf`), Revit (`.rvt`, `.rfa`).
    - Images: Site photos (`.png`, `.jpg`, `.webp`).
- **Workflow:**
    1. Leader uploads `A-101_Foundation.pdf` to `shared-info/construction/`.
    2. Shares with construction team via Docs Mode.
    3. Workers get WhatsApp: "📐 New drawing: A-101".
    4. Foreman replies: "send A-101".
    5. @WorkTimeBot sends PDF (2.4MB) + related tasks.
    6. Foreman logs: "log 6h on A-101, 50% done".

---

## 6. Implementation Roadmap

### Phase 1: Core Platform (STABLE)
- [x] Native binary packaging via `electron-builder`.
- [x] Multi-tenancy database schema (Tenants/Users).
- [x] JWT-based Authentication middleware.
- [x] Support for both Local and Cloud execution modes.

### Phase 2: One-Click Distribution
- [ ] Finalize `install.sh` and `install.ps1` with binary download logic.
- [ ] Docker Compose for Cloud Deployment (optimized for remote access).

### Phase 3: Work Leader Features (IN PROGRESS)
- [ ] **Worker Portal:** Simple ID+PIN UI + file downloads (PDF/CAD).
- [ ] **Docs Evaluation:** PM-specific review panels with approval workflow.
- [ ] **Two-Bot WhatsApp System:**
    - [ ] @WorkTimeBot (workers) - separate instance.
    - [ ] @WorkLeaderClaw (leaders) - full Claw on phone.
- [ ] **Construction Support:** CAD files (.dwg, .rvt), site photos, drawing-linked time entries.

---

## 7. Data Isolation Standards
- Every request is validated against `auth.tenantId`.
- No user can access files or chat history outside their organization.
- Local mode uses the `default` tenant ID for simplified single-user experience.

### 7.1 Worker Data Isolation (NEW)
- Workers can ONLY access folders assigned by their leader (`worker.assignedFolders`).
- Server validates file access BEFORE serving: `canAccessFile(workerId, filePath)`.
- WhatsApp bots filter commands by phone number whitelist.
- Worker Portal uses `httpOnly` cookies + 8-hour session timeout.

### 7.2 Construction Site Considerations (NEW)
- **Offline Support (Future):** Cache drawings on Worker Portal for offline viewing.
- **Large File Handling:** Streaming downloads for CAD files (50MB+).
- **Basic Phones:** @WorkTimeBot works on non-smartphones (SMS fallback for basic phones).
