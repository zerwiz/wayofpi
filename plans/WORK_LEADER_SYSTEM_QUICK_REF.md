# Work Leader System - Quick Reference

## 🎯 OVERVIEW

**Complete ecosystem for managing teams** - from office workers to construction sites.

```
WORK LEADER DASHBOARD
┌───────────────────────────────────────┐
│  [Docs] [Work/Time] [WhatsApp] [Claw]   │
└───────────────────────────────────────┘
       ↓            ↓            ↓          ↓
  Document     Time         WhatsApp    Automation
  Evaluation   Tracking      Bots        Hub
       ↓            ↓            ↓          ↓
        └───────────┴──────────┴──────────┘
                         ↓
                [Shared Info Folder]
                (leader→worker docs)
                         ↓
                  Workers' Phones
                  (WhatsApp/Telegram)
```

---

## 📚 TWO WHATSAPP BOTS (NOT ONE!)

### Bot 1: @WorkTimeBot (For Workers)
- **Phone:** Dedicated number for workers
- **Tools:** 6 simple tools (time, tasks, docs)
- **Commands:**
  - "log 4.5h on PRD_v2" → creates time entry
  - "what tasks today?" → shows assigned work
  - "send me A-101" → sends PDF/drawing
  - "my time this week" → shows hours

### Bot 2: @WorkLeaderClaw (For Leader)
- **Phone:** Leader's personal number
- **Tools:** 50+ full Claw tools
- **Commands:**
  - "approve John's 4.5h entry" → approves time
  - "share PRD_v2 with team" → copies to shared-info/
  - "send morning tasks" → triggers timed message
  - Full Claw access (plan, build, schedule, etc.)

**Why TWO bots?**
- ✅ Workers only see simple commands (no Claw complexity)
- ✅ Leader has full power on their phone
- ✅ Different phone numbers = clear role separation
- ✅ Worker bot is faster (fewer tools to load)

---

## 🏗️ CONSTRUCTION WORKERS SUPPORT

### Supported File Types
- **PDFs:** Blueprints, site plans, spec sheets
- **CAD Files:** .dwg, .dxf (AutoCAD), .rvt, .rfa (Revit)
- **Images:** .png, .jpg, .webp (site photos)
- **Documents:** .pdf, .doc, .txt, .md

### Construction Workflow
```
Work Leader:
  1. Uploads A-101_Foundation.pdf to shared-info/
  2. Clicks "Share with Construction Team"
  3. Selects: ☑ John (Foreman), ☑ Mike (Electrician)
  4. Message: "Updated foundation plan - use this version"

Workers get WhatsApp:
  "📐 New drawing: A-101_Foundation.pdf
   Updated: May 5th
   Reply 'send A-101' to get it"

Worker (John) replies:
  "send A-101"

Worker Bot sends:
  [PDF attached: A-101_Foundation.pdf, 2.4MB]
  
  📋 Related tasks:
    1. Pour foundation (8h) - 50% done
    2. Install rebar (4h) - not started
  
  Log time: 'log 4h on A-101'"
```

### Time Entry with Drawing Reference
```
John: "log 6h on A-101 foundation"

Worker Bot: "✅ Time entry created:
  Worker: John Doe (Foreman)
  Hours: 6h
  Drawing: A-101_Foundation.pdf
  Phase: Foundation
  Progress: 50% complete
  Description: Poured north section
  
  Leader will be notified."
```

---

## 📄 DOCUMENT EVALUATION (Docs Mode)

### Work Leader Evaluates Documents
```
Docs Mode → Select PRD_v2.md → "Evaluate"
```

**Evaluation Panel:**
```
┌───────────────────────────────────────┐
│  Document Evaluation: PRD_v2.md      │
├───────────────────────────────────────┤
│  Status: [📝 Draft ▼]                │
│                                     │
│  Review Checklist:                    │
│    ☑ Clear objectives                │
│    ☑ Measurable outcomes             │
│    ☑ Timeline realistic             │
│    ☐ Resource allocation            │
│                                     │
│  Leader Notes:                      │
│    [Text area...]                     │
│                                     │
│  Approval:                          │
│    [✅ Approve] [📝 Request Changes] │
│    [❌ Reject]                        │
│                                     │
│  Share with Workers:                │
│    ☑ John Doe (Developer)          │
│    ☑ Jane Smith (Designer)         │
│    ☐ Bob Wilson (QA)               │
│    [Send via WhatsApp]              │
└───────────────────────────────────────┘
```

### Auto-Share on Approval
1. Leader approves PRD_v2.md
2. Document auto-copied to `shared-info/`
3. Workers notified via WhatsApp
4. Workers can request: "send me PRD"

---

## ⏰ TIME MANAGEMENT (Work Mode)

### Workers Submit Time
- Via Worker Bot: "log 4.5h on PRD_v2"
- Via Work Mode UI: Form with date, hours, project
- Status: 🕐 Pending → ✅ Approved | ❌ Rejected

### Leader Approves Time
```
Work Mode → Time Entries → Select John's entry
  → [✅ Approve] or [❌ Reject with reason]
```

### Timed Messages (Automated Daily Tasks)
```
Leader sets up: "Morning Tasks" 
  → Daily at 8:00 AM
  → Pulls tasks from Work Mode
  → Sends to workers via WhatsApp

Example message sent to John:
  "Good morning John! 🌅
   Today's tasks (2026-05-05):
   ✅ Review PR #123
   🚀 Implement Docs UI mode
   📝 Update CHANGELOG
   
   Sent by Project Manager via Way of Pi"
```

---

## 🤖 CLAW AUTOMATION

### Workers Chat with Claw (via Worker Bot)
```
John: "send me PRD"
Claw: "📄 Sending PRD_v2.md..."
      [file attached]
      
      Your tasks from this document:
      1. Implement auth (5h)
      2. Review API specs (3h)

Jane: "what tasks do I have today?"
Claw: "📋 Your tasks for May 5th:
       1. Design UI mockups (8h) - from PRD_v2.md
       2. Review component library (2h)
       
       Time entries: 0h logged today
       [Log Time] [View PRD]"
```

### Auto-Notifications (Claw Orchestrates)
1. Leader approves time → Worker gets WhatsApp: "✅ Your time entry approved"
2. Leader shares doc → Workers get: "📄 New document available"
3. Leader rejects time → Worker gets: "❌ Time entry rejected: [reason]"

---

## 📂 SHARED INFO FOLDER

### Location
```
workspace/.wayofpi/shared-info/
  ├── README.md              (how to use)
  ├── PRD_v2.md            (product requirements)
  ├── A-101_Foundation.pdf (construction drawing)
  ├── API_SPECS.md
  └── COMPANY_POLICY.pdf
```

### How It Works
1. Leader uploads/shares document in Docs Mode
2. System copies to `shared-info/`
3. Workers message Worker Bot: "send me PRD"
4. Worker Bot sends file via WhatsApp
5. Workers can also say: "list available docs"

---

## 📱 WORKFLOW EXAMPLE (Full Cycle)

### Scenario: Leader shares new drawing with construction team

1. **Leader in Docs Mode:**
   - Uploads `A-101_Foundation.pdf`
   - Clicks "Evaluate" → Status: "Approved"
   - Checks workers: ☑ John, ☑ Mike
   - Clicks "Share with Workers"

2. **System Automatically:**
   - Copies to `shared-info/`
   - Updates document status
   - Triggers Claw automation

3. **Workers get WhatsApp:**
   ```
   📐 New drawing: A-101_Foundation.pdf
      Status: Approved ✅
      Reply "send A-101" to get it
   ```

4. **John (Foreman) replies:**
   ```
   John: "send A-101"
   
   Worker Bot: "📐 Sending A-101_Foundation.pdf..."
                [PDF attached: 2.4MB]
                
                📋 Related tasks:
                  1. Pour foundation (8h) - 50% done
                  2. Install rebar (4h) - not started
                
                Log time: 'log 4h on A-101'"
   ```

5. **John logs time:**
   ```
   John: "log 6h on A-101 foundation"
   
   Worker Bot: "✅ Time entry created:
                 Worker: John Doe
                 Hours: 6h
                 Drawing: A-101
                 Progress: 60% done
                 
                 Leader will be notified."
   ```

6. **Leader gets WhatsApp (via Leader Bot):**
   ```
   @WorkLeaderClaw: "📊 New time entry:
                       Worker: John Doe
                       Hours: 6h
                       Drawing: A-101_Foundation.pdf
                       Progress: 60% done
                       
                       Reply 'approve John 6h' to approve
                       or 'reject John 6h: [reason]'"
   ```

7. **Leader approves:**
   ```
   Leader: "approve John 6h"
   
   Leader Bot: "✅ Time entry approved:
                    Worker: John Doe
                    Hours: 6h
                    Drawing: A-101
                    
                    Notifying John via WhatsApp..."
   ```

8. **John gets confirmation:**
   ```
   Worker Bot: "✅ Your time entry approved:
                    6h on A-101_Foundation.pdf
                    Approved by: Project Manager
                    
                    Remaining tasks:
                    1. Install rebar (4h) - not started"
   ```

---

## 📋 RELATED DOCUMENTS

| Document | Path | Description |
|----------|------|-------------|
| **Master Plan** | `plans/WORK_LEADER_SYSTEM_PLAN.md` | Complete system overview |
| **WhatsApp Spec** | `plans/WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md` | Two-bot architecture |
| **Time Management** | `plans/WOP_TIME_MANAGEMENT_PLAN.md` | Work mode details |
| **Docs Mode** | `plans/WOP_DOCS_MODE_IMPROVEMENTS.md` | PM-focused redesign |
| **WhatsApp Plan** | `docs/wayofpi/WOP_WHATSAPP_PLAN.md` | Detailed setup |

---

## 🚀 IMPLEMENTATION STATUS

### ✅ Done (Phase 0)
- [x] Added "docs" mode to UiMode
- [x] Created DocsApp.tsx (3-panel)
- [x] Added "Docs" button to UiModeToggle
- [x] File tree context menu (copy, rename, delete)
- [x] Created planning documents (6 docs)
- [x] Defined two-bot WhatsApp architecture
- [x] Added construction workers support (PDFs, drawings)

### 📝 To Do (Phase 1-4)
- [ ] Create WorkApp.tsx (Time Management UI)
- [ ] Enhance Docs Mode with evaluation panel
- [ ] Set up shared-info/ folder
- [ ] Implement Worker Bot (@WorkTimeBot)
- [ ] Implement Leader Bot (@WorkLeaderClaw)
- [ ] Add timed messages to WhatsApp
- [ ] Connect plan → tasks → time entries
- [ ] Full automation workflows

---

## 🎯 KEY BENEFITS

### For Work Leaders:
- ✅ Single dashboard for everything
- ✅ Automated notifications (no manual "send email")
- ✅ Document evaluation + sharing in one place
- ✅ Time tracking + approval workflow
- ✅ Workers get info on phones automatically
- ✅ Separate bot for simple worker commands
- ✅ Full Claw power on personal phone

### For Workers (Office & Construction):
- ✅ Get tasks/drawings on WhatsApp
- ✅ Log time via chat ("log 4h on X")
- ✅ Request documents: "send me X"
- ✅ See assigned tasks with due dates
- ✅ Simple bot (not overwhelmed by Claw complexity)
- ✅ Get PDFs/drawings directly on phone
- ✅ Log time with drawing reference

### For the Business:
- ✅ Reduced communication overhead
- ✅ Documented approval workflows
- ✅ Accurate time tracking
- ✅ Workers always know what to do
- ✅ Everything automated via Claw
- ✅ Supports ALL worker types (office + construction)

---

**Status:** 📝 Planning complete, ready for implementation

**Next Step:** Start Phase 1 - Create WorkApp.tsx and enhance Docs Mode
