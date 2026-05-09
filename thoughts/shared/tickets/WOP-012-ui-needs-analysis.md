# WOP-012 UI Needs Analysis

> What exists, what's missing, and what needs updating in the UI for the full ÄTA Ticket System.

---

## 1. Inventory of Existing UI Code

### Routing (App.tsx)
| Route | Component | Status |
|-------|-----------|--------|
| `/portal` → | `WorkerPortal` | EXISTS — basic shell, needs overhaul |
| `/client` → | `ClientDashboard` | EXISTS — basic shell, needs extension |
| `/admin` → | `AdminDashboard` | EXISTS — basic shell, needs extension |
| `/super-admin` → | `SuperAdminDashboard` | EXISTS — separate concern |
| `/profile` → | `UserProfile` | EXISTS — separate concern |
| `/work` → | `WorkApp` | EXISTS — IDE work mode, needs extension |

**Note:** No `/customer-access` route exists yet (needed for Phase 4 dedicated client login).

### Existing Page Components
| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/WorkerPortal.tsx` | 482 | Worker login + 4 tabs: Tasks, Files, Time, Profile |
| `src/pages/ClientDashboard.tsx` | 462 | Client login + project KPI + 3 tabs: Projects, Drawings, Feedback |
| `src/pages/AdminDashboard.tsx` | 390 | Users table + stats + add worker/client forms |
| `src/components/work/WorkApp.tsx` | 270 | Time entries list + approve/reject + contacts (IDE mode) |

### API Client (`src/api/client.ts`)
- `apiGet<T>(path)` — GET with JWT auth
- `apiPostJson<T>(path, body)` — POST with JWT auth
- `apiPutJson<T>(path, body)` — PUT with JWT auth
- `apiDeleteJson<T>(path)` — DELETE with JWT auth ✅ **added**

### What DOESN'T Exist (checklist)
- `shared/ticket-types.ts` — shared types: Ticket, TimeBlock, TimeSession, PriceList, PriceListItem, SyncLog, FortnoxConnection ✅ **created**
- `src/pages/admin/SettingsPage.tsx` — no settings page
- `src/components/work/KmaPanel.tsx` — no KMA panel
- No ticket components at all (list, detail, create, approve)
- No time session/check-in-out UI
- No material/price list UI
- No weekly summary UI
- No invoice preparation UI
- No staff ledger export UI
- No budget tracking dashboard
- No resource planner calendar
- No Customer Access dedicated portal

---

## 2. Phase-by-Phase UI Requirements

### Phase 1: Core Data Model + API (Backend only)
**UI impact:** Minimal — shared types need creating. No new UI components yet.

| What's needed | Status |
|---------------|--------|
| `shared/ticket-types.ts` | ⬜ NEW — all TypeScript interfaces |
| `apiDeleteJson` helper | ⬜ NEW — needed for DELETE endpoints |

### Phase 2: Worker Mobile Portal (HEAVY UI WORK)

| Feature | Where | What to build | Status |
|---------|-------|---------------|--------|
| Check-in/out button | WorkerPortal (new tab/top bar) | Big button "Check in to [project]" → GPS timestamp | ⬜ NEW |
| My Tickets list | WorkerPortal (new "Tickets" tab) | List with status badges (draft/pending_*/approved/rejected) | ⬜ NEW |
| Create Ticket form | WorkerPortal (new modal/page) | Title, category dropdown (ändring/tillägg/avgående), description textarea, photo upload | ⬜ NEW |
| Add Time Block form | WorkerPortal (modal) | Date picker, hours input, OT toggle, start/end time, description, task reference | ⬜ NEW |
| Add Material form | WorkerPortal (modal) | Search from price list OR custom: name, qty, unit, price, receipt photo | ⬜ NEW |
| Weekly Summary | WorkerPortal (new "Summary" tab) | Week's tickets grouped, total hours, "Send to Office" button | ⬜ NEW |
| Photo Upload | WorkerPortal (integrated in forms) | Camera capture, preview, upload to S3 | ⬜ NEW |
| Notifications | WorkerPortal (badge/toast) | Toast/badge when ticket status changes | ⬜ NEW |
| Time Sessions active indicator | WorkerPortal (top bar) | "You are checked in to [project] since 07:30" | ⬜ NEW |

**File changes needed in WorkerPortal.tsx:**
- Add "Tickets" and "Summary" tabs to existing tab bar
- Add active session indicator bar at top
- Replace static mock stats with live API data
- New modals for create ticket, time block, material

### Phase 3: Internal Attestation + Leader Review

| Feature | Where | What to build | Status |
|---------|-------|---------------|--------|
| Review Queue | WorkApp (new "Review" tab) | Incoming tickets from workers, filterable by status/project | ⬜ NEW |
| Ticket Detail view | WorkApp (new component) | Time blocks, materials, photos, worker info | ⬜ NEW |
| Internal approve/reject | WorkApp (buttons on detail) | Approve/Reject with notes textarea | ⬜ NEW |
| Adjust hours | WorkApp (inline edit) | Editable hours field with audit trail indicator | ⬜ NEW |
| Send to client | WorkApp (button) | "Send selected tickets for client approval" | ⬜ NEW |
| Budget tracking | WorkApp (new "Budget" tab) | Real-time: "Time blocks vs original quote — 65% consumed" | ⬜ NEW |
| Price list editor | WorkApp or AdminDashboard | CRUD table for material rates | ⬜ NEW |
| Resource planner | WorkApp (new "Resources" tab) | Drag-and-drop calendar (future) | ⬜ FUTURE |
| KMA attachment | WorkApp (new "KMA" tab) | KmaPanel component + document upload | ⬜ NEW |
| Invoice prep | WorkApp (new "Invoicing" tab) | List approved tickets, select for export, push to Fortnox | ⬜ NEW |

**File changes needed:**
- `WorkApp.tsx` — add tabs: Review, Budget, KMA, Invoicing, Resources
- **NEW** `src/components/work/TicketReviewPanel.tsx` — review queue + approve/reject
- **NEW** `src/components/work/TicketDetailView.tsx` — full ticket detail
- **NEW** `src/components/work/BudgetDashboard.tsx` — budget vs actual
- **NEW** `src/components/work/KmaPanel.tsx` — KMA document tab
- **NEW** `src/components/work/InvoicePrepPanel.tsx` — invoice export
- **NEW** `src/components/work/PriceListEditor.tsx` — price list CRUD

### Phase 4: Client Sign-Off + Customer Access

| Feature | Where | What to build | Status |
|---------|-------|---------------|--------|
| Pending Approvals list | ClientDashboard (new default tab) | "3 tickets awaiting your review" with total cost | ⬜ NEW |
| Ticket Detail for client | ClientDashboard (new component) | Same as Phase 3 but client-safe: time blocks, photos, materials, total cost | ⬜ NEW |
| Digital sign-off | ClientDashboard (button) | One-click approve, timestamped, locked | ⬜ NEW |
| Structured rejection | ClientDashboard (modal) | Dropdown (wrong hours, not approved, other) + free text | ⬜ NEW |
| "Locked" status badge | ClientDashboard (display) | "Underlag för fakturering" badge | ⬜ NEW |
| Customer Access portal | **NEW** `/customer-access` route | Dedicated client login (simpler, only ticket approval) | ⬜ NEW |
| Approval history | ClientDashboard (new tab) | All approved/rejected tickets with timestamps | ⬜ NEW |

**File changes needed:**
- `ClientDashboard.tsx` — replace current tabs with: Approvals, History, Projects, Drawings
- **NEW** `src/pages/CustomerAccess.tsx` — lightweight client portal
- `App.tsx` — add `/customer-access` route

### Phase 5: Invoicing + Accounting Integration

| Feature | Where | What to build | Status |
|---------|-------|---------------|--------|
| Approved tickets ready | WorkApp InvoicePrep tab | List filtered by status=approved | ⬜ NEW |
| CSV export | WorkApp InvoicePrep tab | Download CSV in Fortnox/Visma format | ⬜ NEW |
| Fortnox push | WorkApp InvoicePrep tab | "Push to Fortnox" button + status indicator | ⬜ NEW |
| Visma push | WorkApp InvoicePrep tab | "Push to Visma" button + status indicator | ⬜ NEW |
| Mark invoiced | WorkApp InvoicePrep tab | Input invoice ref number, mark ticket as invoiced | ⬜ NEW |
| Integration settings | Admin page (new Settings tab) | Fortnox API keys, article mapping, ROT toggle | ⬜ NEW |

**File changes needed:**
- Reinforces Phase 3 InvoicePrep work
- **NEW** `src/pages/admin/SettingsPage.tsx` — integration config + price list editor

### Phase 6: Reporting + Ledger + KMA

| Feature | Where | What to build | Status |
|---------|-------|---------------|--------|
| Electronic Staff Ledger | Admin dashboard (new tab) | Table of all time sessions, Skatteverket format export | ⬜ NEW |
| Project budget overview | Admin dashboard (new tab) | All projects, budget consumed, ticket totals | ⬜ NEW |
| Ticket status dashboard | Admin dashboard (new tab) | All tickets by status (pie/donut chart or table) | ⬜ NEW |
| Real-time costing | Ticket detail everywhere | hours × rate + materials = total | ⬜ NEW |
| KMA docs per ticket | WorkApp KmaPanel | Quality/env/safety document upload per ticket | ⬜ NEW |
| Resource planner | WorkApp Resources tab | Drag-and-drop calendar | ⬜ FUTURE |

**File changes needed:**
- `AdminDashboard.tsx` — add tabs: Ledger, Budget, Tickets, Settings
- Most features reuse components from earlier phases

---

## 3. New Files Required (Summary)

| File | Phase | Purpose |
|------|-------|---------|
| `shared/ticket-types.ts` | 1 | All TypeScript interfaces for tickets, time_blocks, time_sessions, price_lists, sync_log |
| `src/components/work/TicketCard.tsx` | 2 | Reusable ticket card with status badge |
| `src/components/work/TicketCreateModal.tsx` | 2 | Create ticket form (title, category, description, photo) |
| `src/components/work/TimeBlockForm.tsx` | 2 | Add time block form (date, hours, OT, start/end) |
| `src/components/work/MaterialForm.tsx` | 2 | Add material form (search price list, custom, receipt photo) |
| `src/components/work/WeeklySummaryPanel.tsx` | 2 | Weekly summary with send button |
| `src/components/work/CheckInOutButton.tsx` | 2 | Big check-in/out button with project selector |
| `src/components/work/PhotoUpload.tsx` | 2 | Camera capture + preview + upload |
| `src/components/work/TicketReviewPanel.tsx` | 3 | Leader review queue + approve/reject |
| `src/components/work/TicketDetailView.tsx` | 3 | Full ticket detail (blocks, materials, photos, cost) |
| `src/components/work/BudgetDashboard.tsx` | 3 | Budget vs actual charts |
| `src/components/work/KmaPanel.tsx` | 3/6 | KMA document attachment |
| `src/components/work/InvoicePrepPanel.tsx` | 3/5 | Invoice export + push to Fortnox/Visma |
| `src/components/work/PriceListEditor.tsx` | 3 | CRUD material price list |
| `src/pages/CustomerAccess.tsx` | 4 | Lightweight client approval portal |
| `src/pages/admin/SettingsPage.tsx` | 5 | Integration config (Fortnox keys, article mapping, ROT) |
| `src/components/admin/StaffLedgerTable.tsx` | 6 | Electronic staff ledger export |

---

## 4. Existing Files That Need Modification

| File | Changes Needed |
|------|----------------|
| `App.tsx` (~4819 lines) | Add `/customer-access` route (1 line + import) |
| `WorkerPortal.tsx` (482 lines) | **Major**: Replace mock data with API, add tickets/summary tabs, add check-in-out bar, add modals, camera integration |
| `ClientDashboard.tsx` (462 lines) | **Major**: Replace current tabs with approval workflow, add ticket detail, sign-off, rejection, history |
| `AdminDashboard.tsx` (390 lines) | **Major**: Add Ledger/Budget/Tickets/Settings tabs |
| `WorkApp.tsx` (270 lines) | **Major**: Add 6+ new tabs, integrate all ticket review components |
| `api/client.ts` (42 lines) | Add `apiDeleteJson` helper |
| `src/pages/index.ts` (barrel) | Add exports for new pages |

---

## 5. Code Reuse Opportunities

| Existing | Reuse for |
|----------|-----------|
| `ClientDashboard.tsx` login form → | `CustomerAccess.tsx` login (same PIN model) |
| `WorkApp.tsx` time entry list → | Ticket detail time blocks list |
| `AdminDashboard.tsx` table pattern → | Price list table, staff ledger table |
| API client `getAuthHeaders()` → | All new components (already shared) |
| WorkerPortal tab bar pattern → | All page tabs (consistent UX) |

---

## 6. Recommended Implementation Order (UI)

```
Phase 2 (Week 1-2):
  1. Create shared/ticket-types.ts
  2. Add apiDeleteJson to api/client.ts
  3. Build reusable: TicketCard, CheckInOutButton, PhotoUpload
  4. Build WorkerPortal: new tabs + check-in bar + modals
  5. Add TicketCreateModal, TimeBlockForm, MaterialForm
  6. Add WeeklySummaryPanel

Phase 3 (Week 2-3):
  7. Build TicketDetailView (reused everywhere)
  8. Build TicketReviewPanel + add Review tab to WorkApp
  9. Build BudgetDashboard + add Budget tab to WorkApp
  10. Build PriceListEditor + add to WorkApp/Admin
  11. Build KmaPanel + add KMA tab to WorkApp

Phase 4 (Week 3):
  12. Refactor ClientDashboard: replace tabs with approval flow
  13. Build CustomerAccess.tsx + add route in App.tsx

Phase 5 (Week 4):
  14. Build InvoicePrepPanel + add Invoicing tab to WorkApp
  15. Build SettingsPage.tsx for Fortnox config

Phase 6 (Week 5):
  16. Build StaffLedgerTable + add Ledger tab to Admin
  17. Add budget overview + ticket status to Admin
```

---

## 7. Key Architectural Decisions

1. **Shared types** must be importable from both frontend and backend — place in `apps/wayofpi-ui/shared/` (not `src/shared/`, since server code may need them too)
2. **Photo upload** needs S3 integration — UI component should abstract the upload (show preview, call `/api/upload`, display progress)
3. **Check-in/out** needs real-time state — poll `GET /api/time-sessions/active` or use WebSocket push
4. **Status badges** should be a reusable `TicketStatusBadge` component since they appear in 4+ places
5. **All new components** should follow the existing dark theme pattern (`bg-[#1e1e1e]`, `border-[#3c3c3c]`, `text-[#cccccc]`, accent `#ea580c`)
6. **Offline Resilience**: WorkerPortal must implement a local storage queue for check-in/out events and ticket drafts to handle site connectivity issues.
