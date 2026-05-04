# Work Leader System - Unified Plan

## Overview
A complete ecosystem for **Project Managers/Work Leaders** to manage teams through interconnected systems:

1. **Docs Mode** - Evaluate documents, share info with workers
2. **Time Management (Work Mode)** - Track hours, approve timesheets, assign tasks
3. **WhatsApp Bot System (TWO Bots)** - Workers report time via chatbot; Work Leader has separate bot for main Claw
4. **Worker Portal (Login System)** - Workers login to web portal, access assigned files/folders, download drawings/PDFs
5. **Claw Integration** - Workers request documents via chat, automated workflows
6. **Document Sharing** - Specialized folder for leader→worker information sharing

**Goal:** A symbiotic system where all pieces connect and automate the work leader's workflow.

---

## 0. Worker Portal (Login System) - NEW

### Overview
Workers get a **web portal** where they login and access their assigned files/folders directly (alternative to WhatsApp for file downloads).

### Features
- **Login:** Workers login with worker ID + PIN (simple, no email needed)
- **Dashboard:** Shows assigned tasks, time entries, pending approvals
- **File Access:** Sees folders assigned by Work Leader
- **Download:** One-click download for PDFs, CAD files, documents
- **Time Logging:** Form to submit hours (alternative to WhatsApp)
- **Mobile Responsive:** Works on phones/tablets (construction sites)

### Worker Portal UI

```
┌─────────────────────────────────┐
│  WAY OF PI - WORKER PORTAL          │
├─────────────────────────────────┤
│  Welcome, John Doe (Foreman)       │
├─────────────────────────────────┤
│  📋 MY TASKS                       │
│    1. Pour foundation (8h) - 50%     │
│    2. Install rebar (4h) - not started│
│    [Log Time] [View Drawing]          │
├─────────────────────────────────┤
│  📐 MY FILES                       │
│    📁 A-101_Foundation.pdf  [DL]  │
│    📁 M-205_Electrical.pdf  [DL]   │
│    📁 Site_Photos.zip  [DL]         │
│    [Upload Photo] (future)             │
├─────────────────────────────────┤
│  ⏰ TIME ENTRIES                    │
│    Today: 6h logged                  │
│    Pending: 2 entries                 │
│    Approved: 32.5h this month       │
│    [New Entry]                        │
└─────────────────────────────────┘
```

### Login System

#### Credentials
```typescript
interface WorkerCredentials {
  workerId: string;    // e.g., "WORKER-001"
  pin: string;             // 4-digit PIN (e.g., "1234")
  name: string;            // "John Doe"
  role: string;            // "Foreman", "Electrician"
  assignedFolders: string[]; // ["shared-info/construction/A-101"]
}
```

#### Login Flow
```
1. Worker visits: http://wayofpi.local:5173/portal
2. Enters: Worker ID + PIN
3. System validates against workers.json
4. Redirects to dashboard
5. Session lasts 8 hours (auto-logout)
```

#### Server API Endpoints
- `POST /api/portal/login` - Validate credentials, return session token
- `GET /api/portal/files` - List assigned files/folders
- `GET /api/portal/download/:file` - Download file (validates access)
- `POST /api/portal/time` - Submit time entry
- `GET /api/portal/tasks` - List assigned tasks
- `POST /api/portal/logout` - End session

### File Access Control

#### Folder Structure (Visible to Workers)
```
shared-info/
  ├── construction/           ← Workers see ONLY this
  │   ├── A-101_Foundation.pdf
  │   ├── M-205_Electrical.pdf
  │   └── site-photos/
  ├── office/                 ← Hidden from construction
  └── plans/                 ← Hidden from construction
```

#### Access Rules
```typescript
// Server-side check
function canAccessFile(workerId: string, filePath: string): boolean {
  const worker = workersDb.get(workerId);
  return worker.assignedFolders.some(folder => 
    filePath.startsWith(folder)
  );
}
```

### Worker Portal vs WhatsApp Bot

| Feature | Worker Portal | WhatsApp Bot |
|---------|----------------|---------------|
| **Access** | Web browser (any device) | Phone (WhatsApp) |
| **Downloads** | ✅ Direct download (large files) | ✅ Via WhatsApp (smaller) |
| **Time Logging** | ✅ Form with date picker | ✅ Via chat ("log 4h") |
| **File Browsing** | ✅ Folder tree UI | ✅ "list files" command |
| **CAD/PDF View** | ✅ In-browser preview | ✅ Thumbnail preview |
| **Offline** | ❌ Needs internet | ✅ Works on basic phones |
| **Construction Site** | ✅ Tablet + signal | ✅ Any phone (no smartphone) |

### Implementation

#### Phase 1: Basic Portal
1. Create `apps/wayofpi-ui/src/pages/WorkerPortal.tsx`
2. Add login form (worker ID + PIN)
3. Create session management (8h timeout)
4. List assigned files in folder tree

#### Phase 2: Downloads + Time
1. Implement file download (with access control)
2. Add time entry form
3. Show task list with progress
4. Mobile responsive design

#### Phase 3: Advanced Features
1. In-browser PDF preview
2. CAD file preview (future)
3. Upload site photos (future)
4. Push notifications (future)

### Example: Worker Downloads Drawing

```
1. John (Foreman) logs into portal
   → http://wayofpi.local:5173/portal
   → Enters: WORKER-001 / 1234

2. Sees dashboard:
   "Welcome John Doe (Foreman)
    My Files:
      📁 A-101_Foundation.pdf  [Download] [Preview]
      📁 M-205_Electrical.pdf  [Download] [Preview]"

3. Clicks "Download" on A-101
   → Server validates: John has access to this folder
   → Downloads: A-101_Foundation.pdf (2.4MB)

4. Or clicks "Preview"
   → Opens in-browser PDF viewer
   → Sees drawing directly on tablet/phone
```

### Security

#### Session Management
- Session token stored in `httpOnly` cookie
- Expires after 8 hours (or logout)
- Rate limiting: 5 login attempts per 15 minutes

#### File Access
- Server validates worker can access file BEFORE serving
- No direct file paths exposed (use UUIDs)
- Example: `/api/portal/download/uuid-123` not `/api/portal/download/shared-info/A-101.pdf`

#### Worker Data
```json
// workers.json (server-side)
{
  "workers": [
    {
      "id": "WORKER-001",
      "name": "John Doe",
      "role": "Foreman",
      "pinHash": "hashed_pin_here",
      "assignedFolders": ["shared-info/construction/"],
      "canUpload": false,
      "canDownload": true
    }
  ]
}
```

---

## 1. WhatsApp Bot Architecture (TWO Separate Bots)

### Bot 1: Worker Bot (`@WorkTimeBot`)
- **Purpose:** Workers report time, request documents, check tasks
- **Phone:** Dedicated number for workers
- **Extension:** `whatsapp-pi-worker` (separate instance)
- **Features:**
  - "log 4.5h on PRD_v2" → creates time entry
  - "what tasks today?" → returns assigned tasks
  - "send me PRD" → sends document via WhatsApp
  - "status" → shows pending/approved time entries

### Bot 2: Leader Bot (`@WorkLeaderClaw`)
- **Purpose:** Work Leader's main Claw interface on phone
- **Phone:** Work Leader's dedicated number
- **Extension:** Main `whatsapp-pi` extension (same as Claw)
- **Features:**
  - "approve John's 4.5h entry" → approves time
  - "share PRD_v2 with team" → copies to shared-info/
  - "send morning tasks" → triggers timed message
  - Full Claw access (plan, build, schedule, etc.)

### Separation Benefits
- ✅ Workers only see worker functions (no Claw complexity)
- ✅ Leader has full Claw power on phone
- ✅ Different phone numbers = clear role separation
- ✅ Worker bot can be simpler/faster (fewer tools)
- ✅ Leader bot has all extensions + orchestration

---

## System Architecture

```
┌───────────────────┐
│           WORK LEADER DASHBOARD                     │
├───────────────────┤
│                   │
│  [Docs Mode]  [Work/Time]  [Claw]  [WhatsApp]  │
│                   │
└───────────────────┘
        ↓            ↓           ↓            ↓
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │Document │  │Time    │  │Automated│  │Worker  │
   │Eval     │  │Tracking│  │Workflows│  │Chat    │
   └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘
        │            │           │           │
        └────────────┴───────────┴───────────┘
                        │
                        ↓
              ┌─────────────────┐
              │  Shared Info     │
              │  Folder          │
              │  (leader→worker)│
              └─────────────────┘
```

---

## 1. Docs Mode (Enhanced for Work Leaders)

### Current State
- 3-panel layout: File Tree | Chat | Preview
- Needs redesign for project managers (see `WOP_DOCS_MODE_IMPROVEMENTS.md`)

### Work Leader Features (NEW)

#### Document Evaluation Workflow
```
Docs Mode → Select Document → "Evaluate" Button
```

**Evaluation Panel (replaces Preview):**
```
┌─────────────────────────────────────┐
│  Document Evaluation: PRD_v2.md    │
├─────────────────────────────────────┤
│  Status: [📝 Draft ▼]              │
│                                   │
│  Review Checklist:                  │
│    ☑ Clear objectives              │
│    ☑ Measurable outcomes           │
│    ☑ Timeline realistic           │
│    ☐ Resource allocation          │
│                                   │
│  Leader Notes:                    │
│    [Text area...]                 │
│                                   │
│  Approval:                        │
│    [✅ Approve] [📝 Request Changes] │
│    [❌ Reject]                    │
│                                   │
│  Share with Workers:              │
│    ☑ John Doe (Developer)        │
│    ☑ Jane Smith (Designer)       │
│    ☐ Bob Wilson (QA)             │
│    [Send via WhatsApp]            │
└─────────────────────────────────────┘
```

#### Document Sharing to Workers
When leader approves a document:
1. Document auto-copied to **Shared Info Folder** (`workspace/.wayofpi/shared-info/`)
2. Workers get notified via WhatsApp: "New document available: PRD_v2.md"
3. Workers can request document via Claw: "Send me PRD_v2.md"

#### planning Connected to Time Management
**In Docs Mode:**
```
┌─────────────────────────────────────┐
│  PRD_v2.md                        │
├─────────────────────────────────────┤
│  📊 Planning → Time Link          │
│                                   │
│  Linked Tasks:                     │
│    • "Implement auth" (5h) → John │
│    • "Design UI" (8h) → Jane     │
│    • "Write tests" (3h) → Bob    │
│                                   │
│  [View in Work Mode] →            │
│  [Create Time Entry] →           │
│  [Auto-send to workers] →        │
└─────────────────────────────────────┘
```

---

## 2. Time Management (Work Mode)

### Current Plan
See `WOP_TIME_MANAGEMENT_PLAN.md` for full spec.

### Construction Workers (NEW - PDF & Drawings Support)

#### Special Requirements
Construction workers need to:
- Receive **PDF blueprints/drawings** on their phones
- View **technical drawings** (CAD files, site plans)
- Report time with **"which drawing worked on"**
- Annotate PDFs (future: mark up changes)
- Get **updated drawings** automatically via WhatsApp

#### File Types for Construction (AUTO-DETECT)
System auto-detects construction files in shared-info/:
```typescript
const CONSTRUCTION_FILES = new Set([
  // PDFs & Blueprints
  'pdf', 'pdf/a',
  
  // CAD Drawings
  'dwg', 'dxf',        // AutoCAD
  'rvt', 'rfa',        // Revit
  'skp',               // SketchUp
  'pln',               // Home Designer
  
  // Images (site photos, sketches)
  'png', 'jpg', 'jpeg', 'webp',
  'tiff', 'bmp',
  
  // Documents
  'doc', 'docx', 'txt', 'md',
]);
```

#### Worker Bot Auto-Detects Construction Context
```
John: "send me A-101"

Worker Bot: "📐 Detected: Construction drawing
  File: A-101_Foundation.pdf (2.4MB)
  
  📋 Related tasks:
     1. Pour foundation (8h) - 50% done
     2. Install rebar (4h) - not started
  
  📸 Site photos (3) available
  
  Options:
  📄 Full PDF (2.4MB)
  🔍 Preview pages 1-3
  📋 Tasks for this drawing
  📸 Site photos"
```

#### File Types for Construction
Supported in shared-info/ folder:
```typescript
const CONSTRUCTION_FILES = new Set([
  // PDFs
  'pdf', 'pdf/a',
  
  // Drawings/Blueprints
  'dwg', 'dxf',        // AutoCAD
  'rvt', 'rfa',        // Revit
  'skp',               // SketchUp
  'pln',               // Home Designer
  'pdf',               // Exported drawings
  
  // Images (site photos, sketches)
  'png', 'jpg', 'jpeg', 'webp',
  'tiff', 'bmp',
  
  // Documents
  'doc', 'docx', 'txt', 'md',
]);
```

#### Worker Bot Commands (Construction)
```
View drawings:
  "send me site plan A-101" → sends PDF/blueprint
  "show me foundation drawings" → lists all foundation files
  "get latest electrical plan" → sends most recent PDF

Log time with drawing reference:
  "log 6h on A-101 foundation" → links time entry to drawing
  "spent 4h on electrical plan" → project=drawing file
  "worked 8h on site A, drawing M-205" → full context

Report site progress:
  "progress: A-101 50% done" → updates task status
  "issue: pipe conflict in M-205" → creates issue report
  "photo: site north wall" → uploads image (future)
```

#### Document Sharing for Construction
```
Work Leader shares drawing:
  1. Uploads A-101_Foundation.pdf to shared-info/
  2. Clicks "Share with Construction Team"
  3. Selects: ☑ John (Foreman), ☑ Mike (Electrician)
  4. Message: "Updated foundation plan - use this version"
  5. Workers get WhatsApp:
     "📐 New drawing: A-101_Foundation.pdf
      Updated: May 5th
      Reply 'send A-101' to get it"
```

#### Worker Views Drawing via WhatsApp
```
John: "send A-101"

Worker Bot: "📐 Sending A-101_Foundation.pdf..."
  [PDF attached: 2.4MB]
  
  📋 Related tasks:
  1. Pour foundation (8h) - 50% done
  2. Install rebar (4h) - not started
  
  Log time: 'log 4h on A-101'"
```

#### Time Entry Linked to Drawing
```typescript
interface TimeEntry {
  // ... existing fields
  drawingRef?: string;      // e.g., "A-101"
  drawingFile?: string;     // e.g., "A-101_Foundation.pdf"
  taskPhase?: string;       // e.g., "foundation", "framing"
  progressPct?: number;     // e.g., 50 (50% done)
}
```

Example:
```
Time Entry:
  Worker: John Doe (Foreman)
  Date: 2026-05-05
  Hours: 6h
  Drawing: A-101_Foundation.pdf
  Phase: Foundation
  Progress: 50% complete
  Description: "Poured north section, waitng on rebar"
```

#### Drawing Management in Docs Mode (For Work Leader)
```
┌─────────────────────────────────────┐
│  Construction Drawings             │
├─────────────────────────────────────┤
│  📐 A-101_Foundation.pdf  (2.4MB)│
│     Status: ✅ Approved           │
│     Shared: ☑ John, ☑ Mike      │
│     [View] [Share] [Version ▼]  │
│                                   │
│  📐 M-205_Electrical.pdf (1.8MB)│
│     Status: 📝 Draft              │
│     Shared: ☑ Mike               │
│     [View] [Share] [New Version] │
│                                   │
│  [+ Upload New Drawing]          │
└─────────────────────────────────────┘
```

#### WhatsApp Bot - Drawing Preview (NEW)
Workers can preview PDFs/drawings directly in WhatsApp:
```
Worker Bot: "📐 A-101_Foundation.pdf"
  [Thumbnail preview: Page 1/12]
  
  Options:
  📄 Full PDF (2.4MB)
  🔍 Page 1-3 (preview)
  📋 Tasks for this drawing
  📊 Site photos (3)
```

### Integration with Docs Mode

#### Auto-Create Time Entries from Plans
Leader in Docs Mode:
1. Opens `plans/PROJECT_PLAN.md`
2. Clicks "Create Tasks from Plan"
3. System parses plan, creates tasks in Work Mode
4. Assigns to workers automatically
5. Sends notification via WhatsApp

#### Time Entry → Document Link
```
Time Entry:
  Worker: John Doe
  Date: 2026-05-05
  Hours: 4.5
  Project: PRD_v2.md (linked)
  Task: "Implement auth"
  
  [View Document] → Opens Docs Mode
  [Send to Worker via WhatsApp]
```

---

## 3. WhatsApp Bot System (TWO Bots)

### Bot Architecture

```
┌──────────────────┐    ┌──────────────────┐
│  Worker Bot     │    │  Leader Bot      │
│  @WorkTimeBot  │    │  @WorkLeaderClaw│
├──────────────────┤    ├──────────────────┤
│  Workers use    │    │  Leader uses     │
│  this bot       │    │  this bot        │
├──────────────────┤    ├──────────────────┤
│  • Log time     │    │  • Approve time  │
│  • Check tasks  │    │  • Share docs   │
│  • Get docs     │    │  • Send alerts  │
│  • See status   │    │  • Full Claw    │
└──────────────────┘    └──────────────────┘
         ↓                        ↓
    [Worker Phone]      [Leader Phone]
         ↓                        ↓
    Simpler tools          All Claw tools
    (time, tasks, docs)   (plan, build, schedule)
```

### Bot 1: Worker Bot (`@WorkTimeBot`)

#### Purpose
Dedicated bot for workers to report time and interact with the system.

#### Phone Number
- Separate WhatsApp Business number
- Workers only have this number
- Extension: `whatsapp-pi-worker` (separate instance from leader's)

#### Worker Commands
```
Log time:
  "log 4.5h on PRD_v2" → creates time entry
  "spent 3h on API specs" → creates time entry
  "add 2h yesterday on auth" → creates with date

Check tasks:
  "what tasks today?" → returns assigned tasks
  "show my tasks" → lists all active tasks
  "task status" → shows completion %

Request documents:
  "send me PRD" → sends from shared-info/
  "get API specs" → sends document
  "list available docs" → shows shared-info/ contents

Check time status:
  "my time this week" → shows total hours
  "pending entries" → shows awaiting approval
  "status" → summary of all entries
```

#### Worker Bot Tools (Limited)
```typescript
const workerBotTools = [
  "time_entry_create",     // Log time
  "time_entry_list",        // View own entries
  "task_list",              // View assigned tasks
  "shared_info_list",       // List available docs
  "shared_info_send",      // Send doc to worker
  "time_entry_status",     // Check approval status
];
```

#### Example Worker Session
```
Worker: "log 4.5h on PRD_v2 today"

Worker Bot: "✅ Time entry created:
  Worker: John Doe
  Date: 2026-05-05
  Hours: 4.5h
  Project: PRD_v2.md
  Status: Pending approval
  
  Leader will be notified."

---

Worker: "what tasks do I have?"

Worker Bot: "📋 Your tasks for today:
  1. Implement auth (5h) - PRD_v2
  2. Review API specs (3h) - PRD_v2
  
  Log time: 'log 5h on auth'"

---

Worker: "send me PRD"

Worker Bot: "📄 Sending PRD_v2.md..."
  [file attached: PRD_v2.md]
```

### Bot 2: Leader Bot (`@WorkLeaderClaw`)

#### Purpose
Work Leader's main Claw interface on their personal phone.

#### Phone Number
- Leader's dedicated WhatsApp Business number
- Full Claw access (all tools + extensions)
- Extension: Main `whatsapp-pi` (same as Claw desktop)

#### Leader Commands
```
Time management:
  "approve John's 4.5h entry" → approves time
  "reject Jane's 3h entry: need more details" → rejects
  "show all pending entries" → lists pending approvals
  "generate weekly report" → sends CSV/summary

Document management:
  "share PRD_v2 with team" → copies to shared-info/
  "evaluate API specs" → opens Docs Mode eval
  "send PRD to John" → sends to specific worker

Team notifications:
  "send morning tasks to all" → triggers timed message
  "notify John: deadline moved to Friday"
  "alert team: meeting at 2pm"

Full Claw access:
  "plan project X" → runs plan mode
  "build feature Y" → runs build mode
  "check schedule" → shows Claw schedules
```

#### Leader Bot Tools (All Claw Tools)
```typescript
const leaderBotTools = [
  // Time management
  "time_entry_approve",
  "time_entry_reject",
  "time_report_generate",
  
  // Document management
  "doc_evaluate",
  "doc_share",
  "shared_info_manage",
  
  // Team communication
  "timed_message_create",
  "whatsapp_send",
  "notification_send",
  
  // Full Claw tools (plan, build, schedule, etc.)
  ...allClawTools,
];
```

#### Example Leader Session
```
Leader: "approve John's 4.5h entry on PRD_v2"

Leader Bot: "✅ Time entry approved:
  Worker: John Doe
  Hours: 4.5h
  Project: PRD_v2.md
  
  Notifying John via WhatsApp..."

---

Leader: "share PRD_v2 with team"

Leader Bot: "📄 Document shared with team:
  File: PRD_v2.md
  Shared to: shared-info/
  
  Notifying John, Jane, Bob via WhatsApp...
  
  They can request it by messaging:
  'send me PRD' to @WorkTimeBot"

---

Leader: "send morning tasks to all workers"

Leader Bot: "✅ Timed message created:
  Name: Morning Tasks - All
  Time: 8:00 AM daily
  Recipients: John, Jane, Bob
  Content: Pulls from Work Mode tasks
  
  Next send: Tomorrow 8:00 AM"
```

### Bot Separation (Why TWO Bots?)

| Feature | Worker Bot | Leader Bot |
|---------|-------------|------------|
| **Users** | Workers only | Leader only |
| **Phone** | Dedicated number | Leader's number |
| **Tools** | 6 (time, tasks, docs) | 50+ (full Claw) |
| **Complexity** | Simple, fast | Full power |
| **Commands** | "log time", "get tasks" | "approve", "plan", "build" |
| **Notifications** | Receives from leader | Sends to workers |
| **Extension** | `whatsapp-pi-worker` | `whatsapp-pi` (main) |

### Server-Side Setup

#### Two Separate WhatsApp Instances
```typescript
// Leader's bot (main Claw)
const leaderWhatsApp = new WhatsAppPi({
  session: 'leader-session',
  phone: process.env.LEADER_WHATSAPP_PHONE,
  extension: 'whatsapp-pi',
});

// Worker bot (separate)
const workerWhatsApp = new WhatsAppPi({
  session: 'worker-session',
  phone: process.env.WORKER_WHATSAPP_PHONE,
  extension: 'whatsapp-pi-worker', // separate instance
  tools: workerTools, // limited tools
});
```

#### API Endpoints
- `GET /api/whatsapp/leader` - Leader bot status
- `GET /api/whatsapp/worker` - Worker bot status
- `POST /api/whatsapp/worker/send` - Leader sends via worker bot
- `POST /api/whatsapp/leader/send` - Send to leader's bot

### Workers Report Time via Chat (NEW Feature)

#### How It Works
1. Worker messages `@WorkTimeBot`: "log 4.5h on PRD_v2"
2. Worker bot parses: hours=4.5, project=PRD_v2
3. Creates time entry via `POST /api/time-entries`
4. Sends confirmation to worker
5. Notifies leader via `@WorkLeaderClaw`: "John logged 4.5h on PRD_v2"

#### Time Entry Formats Workers Can Use
```
"log 4.5h on PRD_v2"
"spent 3 hours on API specs today"
"add 2h yesterday on auth"
"worked 5h on task #123"
"8h on PRD_v2 (overtime)"
```

#### Leader Gets Notified
```
@WorkLeaderClaw:
  "📊 New time entry:
   Worker: John Doe
   Hours: 4.5h
   Project: PRD_v2.md
   Date: 2026-05-05
   
   Reply 'approve John 4.5h' to approve
   or 'reject John 4.5h: [reason]'"
```

### Integration with Work Mode

#### Worker Bot → Work Mode API
```typescript
// Worker logs time via chat
workerBot.on('message', (msg) => {
  if (msg.body.match(/log (\d+\.?\d*)h on (.+)/)) {
    const hours = parseHours(msg.body);
    const project = parseProject(msg.body);
    
    // Create in Work Mode
    await fetch('/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        workerId: msg.from,
        workerName: msg.senderName,
        hours,
        project,
        status: 'pending',
      }),
    });
    
    // Notify leader
    await leaderBot.sendMessage(
      `New time entry: ${msg.senderName} logged ${hours}h on ${project}`
    );
  }
});
```

---

## 4. Claw Integration (Automation Hub)

### Worker → Claw Document Requests

#### Specialized Shared Folder
```
workspace/.wayofpi/
  ├── shared-info/           ← Leader shares docs here
  │   ├── PRD_v2.md
  │   ├── API_SPECS.md
  │   └── COMPANY_POLICY.pdf
  ├── time-entries.json
  ├── tasks.json
  └── whatsapp-contacts.json
```

#### Worker Request Flow
```
1. Worker messages Claw (via WhatsApp/Telegram):
   "Send me the PRD document"
   
2. Claw checks shared-info/ folder
   
3. If found:
   Claw: "📄 Sending PRD_v2.md"
   [file sent via WhatsApp]
   
4. If not found:
   Claw: "❌ Document not found in shared info.
         Available documents:
         • PRD_v2.md
         • API_SPECS.md
         • COMPANY_POLICY.pdf"
         
5. Leader gets notification:
   "John Doe requested PRD_v2.md via Claw"
```

#### Claw Agent Configuration
```typescript
// .pi/agents/work-leader-assistant.ts
export const agent = {
  name: "work-leader-assistant",
  description: "Handles worker document requests and task queries",
  tools: [
    "shared_info_list",      // List files in shared-info/
    "shared_info_send",       // Send file via WhatsApp
    "task_list_worker",       // List worker's tasks
    "time_entry_status",     // Check time entry status
  ],
  prompts: {
    worker_request: `
      You are assisting a worker on behalf of their project manager.
      Available documents in shared-info/: {shared_files}
      Worker's current tasks: {tasks}
      
      If they request a document, send it via their preferred platform.
      If they ask about tasks, show their assigned work.
    `,
  },
};
```

---

## 5. Workflow Automations (Claw Orchestrates)

### Workflow 1: Document Approval → Worker Notification
```
Docs Mode: Leader approves PRD_v2.md
  ↓
Claw detects approval (file watch on shared-info/)
  ↓
Claw reads assigned workers from document metadata
  ↓
Claw sends WhatsApp to each worker:
  "📄 New document: PRD_v2.md
   Review by: Friday
   Reply 'send PRD' to get it"
  ↓
Worker replies: "send PRD"
  ↓
Claw sends file via WhatsApp
```

### Workflow 2: Plan → Tasks → Time Entries
```
Docs Mode: Leader finishes editing PROJECT_PLAN.md
  ↓
Leader clicks "Create Tasks from Plan"
  ↓
Claw parses plan, extracts tasks with estimates
  ↓
Claw creates tasks in Work Mode API
  ↓
Claw assigns to workers based on skills
  ↓
Workers get WhatsApp:
  "📋 New tasks assigned:
   1. Implement auth (5h)
   2. Design UI (8h)"
```

### Workflow 3: Time Approval → Payroll (Future)
```
Work Mode: Leader approves all entries for month
  ↓
Claw generates monthly report
  ↓
Claw sends to payroll system (future API)
  ↓
Workers get WhatsApp:
  "💰 Payslip generated for April 2026"
```

---

## 6. UI Navigation (Unified)

### Work Leader Main View
```
┌────────────────────────────────────────┐
│  WAY OF PI - WORK LEADER              │
├────────────────────────────────────────┤
│  [📚 Docs] [⏰ Work] [📱 WhatsApp]  │
│  [🤖 Claw] [⚙️ Settings]              │
└────────────────────────────────────────┘
```

### Quick Actions (Cross-System)
```
┌────────────────────────────────────────┐
│  Quick Actions                         │
├────────────────────────────────────────┤
│  📝 Evaluate Document → Share → Notify │
│  ⏰ Review Time → Approve → WhatsApp   │
│  📱 Send Task Reminder to All Workers  │
│  🤖 View Claw Automation Logs         │
│  📄 Share New Document to Workers     │
└────────────────────────────────────────┘
```

---

## 7. Data Flow Diagram

```
                    WORK LEADER
                         ↓
        ┌────────────────────────────────┐
        │                                │
        ↓                                ↓
   [Docs Mode]                    [Work Mode]
    • Evaluate docs                • Track time
    • Approve/reject             • Assign tasks
    • Share to workers          • Approve entries
        ↓                                ↓
        └────────────┬───────────────┘
                     ↓
              [Shared Info Folder]
              (docs shared with workers)
                     ↓
              [Claw Automation]
              • Watches shared-info/
              • Handles worker requests
              • Sends via WhatsApp/Telegram
                     ↓
                  [Workers]
                  • Receive docs on phone
                  • Chat with Claw
                  • Get task reminders
                  • Submit time entries
```

---

## 8. Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [x] Add "docs" mode to UiMode
- [x] Create DocsApp.tsx (3-panel)
- [x] Add "work" mode to UiMode (Time Management)
- [ ] Create WorkApp.tsx
- [ ] Create shared-info/ folder structure
- [ ] Basic WhatsApp timed messages

### Phase 2: Document Evaluation (Week 3-4)
- [ ] Enhance Docs Mode with evaluation panel
- [ ] Document approval workflow
- [ ] Share to shared-info/ on approval
- [ ] Notify workers via WhatsApp

### Phase 3: Claw Integration (Week 5-6)
- [ ] Create work-leader-assistant agent
- [ ] Implement shared_info_list/send tools
- [ ] Worker→Claw document requests
- [ ] Auto-respond with file via WhatsApp

### Phase 4: Full Automation (Week 7-8)
- [ ] Plan → Tasks → Time Entries workflow
- [ ] Auto-notifications on all status changes
- [ ] Worker queries via Claw ("What tasks today?")
- [ ] Monthly report generation

---

## 9. File Structure

```
plans/
  ├── WORK_LEADER_SYSTEM_PLAN.md       ← THIS FILE
  ├── WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md
  ├── WOP_TIME_MANAGEMENT_PLAN.md
  ├── WOP_DOCS_MODE_IMPROVEMENTS.md
  └── PLAN-DOCS-UI.md

workspace/.wayofpi/
  ├── shared-info/                     ← New: Leader→Worker docs
  │   ├── README.md                    ← How to use
  │   ├── PRD_v2.md
  │   └── API_SPECS.md
  ├── time-entries.json
  ├── tasks.json
  ├── whatsapp-contacts.json
  └── whatsapp-timed-messages.json

.pi/agents/
  └── work-leader-assistant.ts         ← New: Handles worker requests

apps/wayofpi-ui/src/components/
  ├── docs/
  │   ├── DocsApp.tsx
  │   └── DocumentEvaluationPanel.tsx   ← New
  ├── work/
  │   ├── WorkApp.tsx
  │   ├── TimeEntryForm.tsx
  │   └── LeaderActions.tsx
  └── whatsapp/
      ├── WhatsAppApp.tsx
      ├── ContactManager.tsx
      └── TimedMessageEditor.tsx
```

---

## 10. API Endpoints (New/Modified)

### Shared Info Folder
- `GET /api/shared-info` - List files available to workers
- `POST /api/shared-info/share` - Leader shares document (copies to shared-info/)
- `DELETE /api/shared-info/:file` - Remove from shared-info/
- `GET /api/shared-info/:file` - Worker requests file (returns file content)

### Claw Tools (New)
- `shared_info_list` - List available documents
- `shared_info_send` - Send file to worker via WhatsApp/Telegram
- `worker_task_list` - Show worker their tasks
- `worker_time_status` - Check time entry status

### Cross-System
- `POST /api/docs/:id/share` - Share document + notify workers
- `POST /api/work/plan-to-tasks` - Parse plan, create tasks
- `POST /api/whatsapp/notify-doc` - Send document notification
- `POST /api/whatsapp/notify-time` - Send time approval/rejection

---

## 11. Example: Full Workflow

### Scenario: Leader shares new PRD with team

1. **Leader in Docs Mode:**
   - Opens `plans/PRD_v2.md`
   - Reviews document
   - Clicks "Evaluate" → Status: "Approved"
   - Checks workers to notify: ☑ John, ☑ Jane, ☐ Bob
   - Clicks "Share with Workers"

2. **System Automatically:**
   - Copies `PRD_v2.md` to `shared-info/`
   - Updates document status in Docs Mode
   - Triggers Claw automation

3. **Claw Sends WhatsApp to John & Jane:**
   ```
   📄 New document: PRD_v2.md
   Status: Approved ✅
   Review by: Friday, May 9th
   
   Reply "send PRD" to get the document
   or ask "what tasks from PRD?"
   ```

4. **John Replies:**
   ```
   John: "send PRD"
   
   Claw: "📄 Sending PRD_v2.md..."
         [file attached: PRD_v2.md]
         
         Your tasks from this document:
         1. Implement auth (5h)
         2. Review API specs (3h)"
   ```

5. **Jane Requests Tasks:**
   ```
   Jane: "what tasks do I have today?"
   
   Claw: "📋 Your tasks for May 5th:
         1. Design UI mockups (8h) - from PRD_v2.md
         2. Review component library (2h)
         
         Time entries: 0h logged today
         [Log Time] [View PRD]"
   ```

---

## 12. Benefits

### For Work Leaders:
- ✅ Single dashboard for all team management
- ✅ Automated notifications (no manual "send email")
- ✅ Document evaluation + sharing in one place
- ✅ Time tracking + approval workflow
- ✅ Workers get info on their phones automatically

### For Workers:
- ✅ Get tasks/information directly on WhatsApp/Telegram
- ✅ Request documents via chat ("send me X")
- ✅ See assigned tasks with due dates
- ✅ Submit time entries from phone (future)
- ✅ No need to check multiple systems

### For the Business:
- ✅ Reduced communication overhead
- ✅ Documented approval workflows
- ✅ Accurate time tracking
- ✅ Workers always know what to do
- ✅ Everything automated via Claw

---

## Related Documents

- **`WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md`** - WhatsApp integration spec
- **`WOP_TIME_MANAGEMENT_PLAN.md`** - Time management details
- **`WOP_DOCS_MODE_IMPROVEMENTS.md`** - Docs mode redesign
- **`PLAN-DOCS-UI.md`** - Original docs mode plan

---

**Status:** 📝 Planning complete, ready for Phase 1 implementation

**Next Step:** Start with Phase 1 (Foundation) - enhance Docs Mode with evaluation panel, create Work Mode UI, set up shared-info/ folder.
