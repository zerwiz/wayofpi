# Plan: Build Ralph Ticket Function for Way of Pi

**Status:** draft
**Created:** 2025-03-11
**Revision:** 1
**Session cwd:** /way-of-pi
**Sources:** User request for Ralph ticket functionality

---

## Goal
Implement a **Ralph ticket function** that allows agents to:
- Create structured queue tickets for tasks/issues
- Assign tickets to appropriate agents or teams
- Include ticket metadata (priority, deadline, owner)
- Display tickets in queue view for review
- Track ticket status (pending, in-progress, done)

---

## Background
Currently, tickets/tasks are created manually via write operations to `.pi/agents/teams.yaml` or workspace files. Need to build a **structured ticket system** so that:
- Build tasks can be queued automatically
- Tasks can be assigned by agent teams
- Progress can be tracked
- Deadlines/urgency can be set
- Notifications/alerts can trigger when tickets are created or updated

---

## Assumptions and constraints
- **Ralph system** exists in Way of Pi as a build/queue management mechanism
- **Ticket system** should integrate with existing agent/roster system
- **Storage**: Tickets stored in `.pi/tickets/` or database
- **Agents**: Scout research current Ralph system, Planner builds implementation plan
- **Timeline**: Research phase → Planning phase → Build phase
- **Priority**: High (affects all future task submissions)
- **Teams**: Full team (scout, planner, documenter, reviewer, bowser, builder, ralph)

---

## Deliverables
1. **Research document**: `plans/RESEARCH-RALPH-TICKET.md` (scout to complete)
2. **Implementation plan**: `plans/PLAN-RALPH-TICKET-IMPLEMENTATION.md` (planner to complete)
3. **Code artifacts**:
   - Ticket definition schema
   - Ticket UI components
   - Ralph queue handler
   - Ticket display view
4. **Documentation**: `/docs/RALPH-TICKETS.md`

---

## Research Phase (Scout Agent)

### Task: Scout current Ralph system in Pi

1. **Search Ralph integration code:**
   ```bash
   grep -r "ralph" . --include="*.ts" --include="*.js" --include="*.md" 2>/dev/null | head -100
   grep -r "queue\|ticket\|issue\|task" . --include="*.ts" --include="*.js" | wc -l
   ```

2. **Check teams.yaml:**
   - Examine `.pi/agents/teams.yaml`
   - Document Ralph agent's capabilities
   - Look for existing ticket/queue code

3. **Search for ticket-related code:**
   ```bash
   find . -name "*ticket*" -o -name "*queue*" -o -name "*issue*" 2>/dev/null
   grep -rR "queue" . --include="*.ts" --include="*.js" --include="*.yaml" 2>/dev/null
   ```

4. **Document findings:**
   - Where does Ralph live? (agent, extension, component)
   - Does Ralph already have ticket-like functionality?
   - Where is Ralph's build queue mechanism?
   - What format does Ralph's queue currently use?

5. **Report back:** Document current Ralph capabilities and gaps

---

## Implementation Phase (Planner Agent)

### Task: Plan Ralph ticket function build

#### Step 1: Define Ticket Schema
```typescript
interface RalphTicket {
  id: string; // Unique ID (UUID)
  title: string; // Short description
  description?: string; // Full description
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled';
  createdAt: string; // ISO timestamp
  deadline?: string; // ISO timestamp
  assignee?: string; // Agent name
  team?: string; // Team name (e.g., "full")
  tags: string[]; // e.g., ["build", "chat-ui", "ui-bug"]
  owner?: string; // Agent who created ticket
  parentId?: string; // Link to parent/rational ticket
  dependencies: string[]; // Ticket IDs that must complete first
  attachments: string[]; // File paths (markdown plans, etc.)
  progress?: number; // 0-100 completion percentage
  estimateHours?: number; // Estimated hours
  actualHours?: number; // Actual hours spent
  notes?: string[]; // Progress notes
}
```

#### Step 2: File Storage Structure
```
.pi/tickets/
  ├── tickets.jsonl (JSON lines file, append-only)
  ├── queue-pending/      # Tickets pending review
  ├── queue-in-progress/  # Tickets being worked on
  ├── queue-done/         # Completed tickets
  └── .pi/tickets/index.md  # Ticket listing by team
```

#### Step 3: Ralph Agent Function
- `pi ticket create --team full --priority medium --title "Fix chat scroll tracking"`
- `pi ticket assign --id <id> --assignee builder`
- `pi ticket status` (list active tickets)
- `pi ticket details --id <id>`

#### Step 4: Ticket UI Components
- `src/components/TicketQueueView.tsx` - Queue list with filters
- `src/components/TicketItem.tsx` - Individual ticket card
- `src/components/TicketForm.tsx` - Create/edit ticket form
- `src/components/TicketModal.tsx` - Details view

#### Step 5: Integration Points
- **Agent CLI:** `pi ticket <command>` wrapper
- **Chat:** `/ticket create`, `/ticket assign` commands
- **Notifications:** Alert when assigned ticket created
- **Dashboard:** Overview of team tickets
- **Progress:** Link to ticket in agent workspace

#### Step 6: Example Tickets (Current Build Issues)
```json
{
  "id": "TALK-001",
  "title": "Fix broken new chat button",
  "team": "full",
  "priority": "high",
  "status": "pending"
}
```

#### Step 7: Ticket Lifecycle
```
Created → Pending → Assigned → In-Progress → Review → Done
```

#### Step 8: Progress Tracking
- Check-in notes
- Time tracking (if supported)
- Estimate vs actual hours
- Dependency tracking

---

## Risks and mitigations
- **Complexity:** Ticket system adds overhead — *Mitigation:* Start simple, iterate
- **Database requirement:** May need SQLite for tickets — *Mitigation:* JSONL file-based first
- **Agent load:** Ticket tracking adds context-switching — *Mitigation:* Auto-expire old tickets
- **Scout research delay:** If Ralph code already exists — *Mitigation:* Adapt to existing, don't rebuild
- **Planner capacity:** Need bandwidth for detailed planning — *Mitigation:* Parallelize with other tasks

---

## Verification
- [ ] Scout completes research document
- [ ] Planner creates implementation plan
- [ ] Ticket schema validated
- [ ] Ticket commands work via CLI
- [ ] Tickets appear in UI queue view
- [ ] Assign/reject actions work
- [ ] Status updates reflect correctly
- [ ] Ticket notifications work (if applicable)
- [ ] Existing tickets (chat UI, build issues) migrated to new system

---

## Team Assignments
- **Scout:** Research current Ralph system, document existing capabilities
- **Planner:** Create implementation plan, schema, and build specs
- **Builder:** Implement ticket system (Phase 2)
- **Reviewer:** Review code for usability and edge cases
- **Bowser:** QA testing, edge case coverage

---

## Next Steps
1. **Scout research** → Locate Ralph code, document queue system
2. **Review findings** → Adapt plan or simplify based on existing
3. **Planner builds** → Detailed schema, file structure, UI components
4. **Builder implements** → Ticket system code
5. **Integration** → Connect with agent CLI, chat commands, queue UI

---

**Ready for scout agent to begin research.**