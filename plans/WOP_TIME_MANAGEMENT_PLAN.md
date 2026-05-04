# Time Management View - Project Plan

## Overview
A new UI mode (like "docs") for **time tracking and task management**. Workers submit their time and tasks; a "Work Leader" reviews and manages them.

**Proposed name:** `"work"` or `"time"` mode

## Target Users

### Workers (Team Members)
- Submit time logs (hours worked, date, project/task)
- Submit work tasks (description, status, linked time)
- View their own submissions
- See approval status from Work Leader

### Work Leader (Manager)
- View ALL worker submissions (time + tasks)
- Approve/reject time entries
- Assign/modify tasks
- Generate time reports
- See team overview dashboard

## UI Layout (3-Panel Design)

```
[Team Browser] | [Time/Tasks View] | [Leader Actions]
```

### Left Panel - Team Browser
**For Workers:**
- "My Submissions" (time + tasks)
- "Pending Approval"
- "Approved"
- "Rejected"

**For Work Leader:**
- Worker list (with status indicators)
- Filter by: All, This Week, This Month
- Quick stats: Total hours, Active tasks
- "Export Report" button

### Center Panel - Time & Tasks View
**Time Entries Tab:**
- Date picker
- Hours worked (with validation)
- Project/task dropdown
- Description field
- Status: 🕐 Pending | ✅ Approved | ❌ Rejected

**Tasks Tab:**
- Task name + description
- Assigned to (worker)
- Estimated hours
- Linked time entries
- Status: 📝 Draft | 🚀 In Progress | ✅ Complete | ❌ Cancelled

**Submit Form:**
```
Date: [2026-05-04]
Project: [plans/PLAN-DOCS-UI.md ▼]
Hours: [4.5]
Description: [Implemented docs UI mode]
[Submit to Leader]
```

### Right Panel - Leader Actions (Leader Only)
**When viewing a worker's submission:**

**Time Entry Review:**
- Worker: John Doe
- Date: 2026-05-04
- Hours: 4.5
- Project: plans/PLAN-DOCS-UI.md
- Description: "Implemented docs UI mode"
- **[Approve ✅] [Reject ❌] [Request Changes 📝]**

**Task Management:**
- Assign task to worker
- Set deadline
- Modify estimated hours
- Add leader notes
- Mark complete

**Quick Actions:**
- "Approve All Pending"
- "Generate Weekly Report"
- "Export to CSV"
- "Send Team Summary"

## Data Model

### Time Entry
```typescript
interface TimeEntry {
  id: string;
  workerId: string;
  workerName: string;
  date: string; // ISO date
  project: string; // path or project name
  hours: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  leaderNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}
```

### Work Task
```typescript
interface WorkTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // workerId
  assignedBy: string; // leaderId
  estimatedHours?: number;
  linkedTimeEntries: string[]; // TimeEntry ids
  status: 'draft' | 'in-progress' | 'complete' | 'cancelled';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Worker Profile
```typescript
interface Worker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'leader';
  totalHours: number;
  activeTasks: number;
  joinedAt: string;
}
```

## Server API Endpoints

### Time Entries
- `GET /api/time-entries` - List entries (filter by worker, date, status)
- `POST /api/time-entries` - Submit new entry
- `PUT /api/time-entries/:id` - Update entry (worker)
- `POST /api/time-entries/:id/approve` - Leader approves (leader)
- `POST /api/time-entries/:id/reject` - Leader rejects (leader)

### Tasks
- `GET /api/tasks` - List tasks (filter by assignee, status)
- `POST /api/tasks` - Create task (leader)
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/assign` - Assign to worker (leader)

### Reports
- `GET /api/time-reports?start=...&end=...` - Generate report
- `GET /api/time-reports/export?format=csv` - Export to CSV

## Storage (Server-Side)

### Files
- `workspace/.wayofpi/time-entries.json` - All time entries
- `workspace/.wayofpi/tasks.json` - All work tasks
- `workspace/.wayofpi/workers.json` - Worker profiles

### Schema
```json
// time-entries.json
{
  "entries": [
    {
      "id": "time-001",
      "workerId": "worker-123",
      "workerName": "John Doe",
      "date": "2026-05-04",
      "project": "plans/PLAN-DOCS-UI.md",
      "hours": 4.5,
      "description": "Implemented docs UI mode",
      "status": "pending",
      "submittedAt": "2026-05-04T10:30:00Z"
    }
  ]
}
```

## UI Mode Integration

### Add to `useUiMode.ts`
```typescript
export type UiMode = "simple" | "technical" | "claw" | "docs" | "work";
```

### Add to `UiModeToggle.tsx`
```tsx
<button onClick={() => onUiModeChange("work")}>
  <Clock size={12} />
  Work
</button>
```

### Create `components/work/WorkApp.tsx`
New 3-panel layout:
- Left: `TeamBrowser`
- Center: `TimeTaskView`
- Right: `LeaderActions` (visible only to leaders)

## Worker vs Leader Views

### Worker View (Default)
- Can only see THEIR submissions
- Submit new time/tasks
- Edit drafts (not submitted)
- See approval status
- Cannot see other workers' data

### Leader View (Special)
- Sees ALL workers' submissions
- Can approve/reject any entry
- Assign tasks to workers
- Generate team reports
- Set as leader via: Settings → Work Mode → "I am a Work Leader"

## Implementation Phases

### Phase 1: Basic Time Tracking (Workers)
1. Add `"work"` to `UiMode`
2. Create `WorkApp.tsx` (basic 3-panel)
3. Create `TimeEntryForm.tsx` (submit hours)
4. Store entries in `workspace/.wayofpi/time-entries.json`
5. Show "My Submissions" list

### Phase 2: Leader Review
1. Add leader role toggle (Settings)
2. Create `LeaderActions.tsx` panel
3. Implement approve/reject endpoints
4. Show all workers' entries to leader
5. Add leader notes field

### Phase 3: Task Management
1. Create `TaskForm.tsx`
2. Implement task assignment
3. Link time entries to tasks
4. Task status workflow
5. Task deadline tracking

### Phase 4: Reports & Export
1. Create `TimeReport.tsx`
2. Weekly/monthly report generation
3. CSV export
4. Team summary email (future)

## Visual Design

### Color Scheme (Different from orange)
- Primary: Blue (`#3b82f6`) - trust, professionalism
- Success: Green (`#22c55e`) - approved
- Warning: Yellow (`#eab308`) - pending
- Error: Red (`#ef4444`) - rejected

### Icons
- Clock (`Clock`) - time entries
- CheckCircle (`CheckCircle2`) - approved
- XCircle (`XCircle`) - rejected
- FileText (`FileText`) - tasks
- Users (`Users`) - team
- BarChart (`BarChart3`) - reports

## Example Workflow

### Worker Submits Time:
1. Switch to "Work" mode (header toggle)
2. Click "New Time Entry"
3. Fill form: Date, Project, Hours, Description
4. Click "Submit to Leader"
5. Entry appears in "Pending Approval" list

### Leader Reviews:
1. Switch to "Work" mode
2. Toggle "Leader View" (or auto-detect leader role)
3. See all pending entries from team
4. Click entry → review in right panel
5. Click "Approve ✅" or "Reject ❌" with notes
6. Worker sees status update

## Files to Create/Modify

### New Files:
1. `apps/wayofpi-ui/src/components/work/WorkApp.tsx`
2. `apps/wayofpi-ui/src/components/work/TeamBrowser.tsx`
3. `apps/wayofpi-ui/src/components/work/TimeTaskView.tsx`
4. `apps/wayofpi-ui/src/components/work/LeaderActions.tsx`
5. `apps/wayofpi-ui/src/components/work/TimeEntryForm.tsx`
6. `apps/wayofpi-ui/src/components/work/TaskForm.tsx`

### Modify:
1. `apps/wayofpi-ui/src/hooks/useUiMode.ts` - Add `"work"` mode
2. `apps/wayofpi-ui/src/components/UiModeToggle.tsx` - Add Work button
3. `apps/wayofpi-ui/src/App.tsx` - Render `WorkApp`
4. `apps/wayofpi-ui/server/index.ts` - Add `/api/time-entries`, `/api/tasks` endpoints
5. `apps/wayofpi-ui/server/paths.ts` - Add time/task storage paths

## Questions to Decide

1. **Naming:** `"work"`, `"time"`, `"tasks"`, or `"team"`?
   - Recommendation: **`"work"`** (covers time + tasks)

2. **Leader detection:** How to know if user is a leader?
   - Settings toggle: "I am a Work Leader"
   - Store in `workspace/.wayofpi/work-config.json`

3. **Real-time updates:** Should workers see approvals instantly?
   - Phase 1: Manual refresh
   - Phase 2: WebSocket updates

4. **Integration with Docs mode:**
   - Link time entries to specific docs/plans (already in data model)
   - "Log time to this plan" button in Docs mode

## Next Steps

1. **Decide on naming** (`"work"` vs `"time"` vs `"tasks"`)
2. **Implement Phase 1** (basic time tracking)
3. **Test with 2-3 mock workers**
4. **Add leader features (Phase 2)**
5. **Polish UI and add reports (Phase 3-4)**

## Example `WorkApp.tsx` Structure

```tsx
export function WorkApp({ uiMode, setUiMode, ... }) {
  const [selectedView, setSelectedView] = useState<'time' | 'tasks'>('time');
  const [isLeader, setIsLeader] = useState(false); // from settings/config
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  return (
    <div className="work-mode flex h-full">
      {/* Left: Team Browser */}
      <TeamBrowser
        isLeader={isLeader}
        onSelectEntry={setSelectedEntry}
        view={selectedView}
      />

      {/* Center: Time/Tasks View */}
      <TimeTaskView
        view={selectedView}
        selectedEntry={selectedEntry}
        isLeader={isLeader}
        onSubmitNew={() => setShowForm(true)}
      />

      {/* Right: Leader Actions (only if leader) */}
      {isLeader && selectedEntry && (
        <LeaderActions
          entry={selectedEntry}
          onApprove={() => { /* ... */ }}
          onReject={() => { /* ... */ }}
        />
      )}
    </div>
  );
}
```

---

**Status:** 📝 Planning phase (ready for Phase 1 implementation)

**Related Documents:**
- `docs/WOP_DOCS_MODE_IMPROVEMENTS.md` (similar UI mode concept)
- `plans/PLAN-DOCS-UI.md` (reference for adding new UI modes)
