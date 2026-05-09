# [WOP-015] Claw Leadership Modules — Mission Control for Leaders & Admins

> **Epic:** Phase 2 (Agentic OS Shell)
> **Status:** PLANNING (blocked on WOP-014 App.tsx refactor)
> **Priority:** High

---

## Problem

Work Leaders and Admins currently have no unified interface for managing daily construction operations. They must switch between:
- Worker Portal for tickets/time
- Client Dashboard for approvals  
- Admin Dashboard for user/settings management
- Various IDE screens for system config

This fragmented UX creates friction, slows down on-site decision-making, and makes Way of Pi harder to adopt for non-technical construction managers.

---

## Vision

Transform the Claw ("Mission Control") interface into the primary operational dashboard for Leaders and Admins. Instead of building separate portal pages for each role, we extend Claw's pluggable module system to host leadership tools alongside the existing Claw features (schedules, team, files).

> **Core principle:** A work leader should be able to run their entire day from Claw — approve tickets, check budgets, message workers, and run automations — without ever opening a separate portal page.

---

## Design Philosophy: Locked Down by Default

Work leaders and construction site managers are not developers. The Claw leadership modules must be **safe by default** — pre-built functions that work out of the box, with no way to accidentally damage the system.

### Tiered Access Model

| Tier | Who | What They Can Do | Lockdown Level |
|------|-----|-------------------|----------------|
| **User** | Work Leader, Site Manager | Use pre-built buttons/actions only. No custom code, no raw terminal, no file editing. | 🔒 Full |
| **Power User** | Office Admin, experienced user | Configure price lists, set automation schedules, customize notification templates. | 🔓 Partial |
| **Admin** | System Admin, developer | Build custom functions, write scripts, access terminal, connect new integrations. | 🔑 None |

### Lockdown Mechanisms

1. **Action-based, not code-based**: All module features are pre-registered actions (buttons, forms, wizards). No REPL, no command bar, no arbitrary script execution.
2. **RBAC enforcement in Claw shell**: The nav rail, action buttons, and settings panels are role-gated at render time. Non-admin roles never see the "Build" or "Scripts" tabs.
3. **Audit trail for every action**: All module actions (approve ticket, sync to Fortnox, message worker) are logged to the audit log with user ID, timestamp, and payload.
4. **Confirmation dialogs on destructive actions**: "Sync all to Fortnox?" — requires explicit confirmation. Batch operations show preview before executing.
5. **No filesystem access**: Claw modules operate entirely through the API layer. No direct file read/write from the UI. No terminal access.
6. **Settings isolation**: Module settings (price lists, rate tables, integration keys) are stored in the database with tenant-scoping. No env var or config file editing from Claw.

### Future: User-Built Functions

When Admins/Power Users eventually build custom functions:

- Custom functions run in a **sandboxed executor** (isolated Bun worker thread or subprocess)
- Each function has a declared **permission manifest** (e.g., "can read tickets", "can send messages")
- Functions are **rate-limited** and **timeout-enforced** (max 30s execution)
- A **review queue** for functions before they're published to other users
- Rollback: one-click revert to previous version
- Functions are **never shared across tenants** by default

---

## Proposed Modules

### 1. Review Module
- Ticket approval queue for LEADER role
- View time blocks, photos, materials per ticket
- Adjust hours/materials before forwarding
- Internal approve/reject with notes
- "Send to Client" trigger
- Quick actions: Message Worker, Notify Client

### 2. Financials Module  
- Project budget tracking (burn rate, remaining)
- Material price list editor
- Cost alerts (spend > X% of budget)
- Hourly rate management per worker
- "Recalculate Totals" automation

### 3. Office Module
- Invoice preparation from approved tickets
- Fortnox/Visma sync monitoring & trigger
- PDF summary generation ("Underlag för fakturering")
- ROT/RUT tax deduction splitting controls
- Sync status dashboard

### 4. Compliance Module
- Skatteverket Personalliggare (electronic staff ledger) export
- KMA documentation management
- Audit log viewer
- Certificate/qualification tracking

---

## Messaging & Automation

Leaders and Admins need to communicate directly from Claw without switching context. These capabilities should be integrated across all modules:

### Messaging
- **→ Workers**: Send notifications about ticket status, schedule changes, reminders
- **→ Clients**: Send approval requests, progress updates, invoice notifications
- **→ System**: Trigger notification via existing WhatsApp bot infrastructure
- **Channels**: In-app notifications, WhatsApp (via existing bot), optional email

### Automations
- **Scheduled**: Daily/weekly report generation, budget recalculation, sync triggers
- **Event-driven**: Auto-notify when ticket is pending approval, auto-sync approved tickets to Fortnox
- **Batch**: "Sync all approved tickets", "Recalculate all budgets", "Notify all overdue items"
- Uses existing Claw scheduler infrastructure (`server/claw-scheduler.ts` + `claw-schedule-executor.ts`)

---

## Technical Integration Points

| Area | Existing Infrastructure | Integration |
|------|------------------------|-------------|
| Claw module system | `clawUiModules.ts` (registerClawUiModule) | Register Review/Financials/Office/Compliance modules |
| Claw nav rail | `ClawNavRail.tsx` | Modules appear as nav items for LEADER/ADMIN roles |
| Claw scheduler | `server/claw-scheduler.ts` | Automations scheduled via existing cron system |
| WhatsApp | WhatsApp bot infrastructure | Message workers/clients via existing `/api/whatsapp/*` |
| API | `server/index.ts` handleApi | New endpoints: `/api/tickets/*`, `/api/financials/*`, `/api/compliance/*` |
| RBAC | JWT auth with role checks | Modules hidden/shown based on role (LEADER, ADMIN) |

---

## Technical Implementation Details

### Backend: Database & API

The server-side implementation will reside in `apps/wayofpi-ui/server/` and utilize the existing SQLite infrastructure in `db.ts`.

1.  **Database Extensions (`db.ts`)**:
    *   **Tickets Table**: Track ÄTA requests, categories (ändring, tillägg, avgående), and status (draft → pending_review → pending_approval → approved → invoiced).
    *   **Time Blocks Table**: Granular logging (check-in/out, hours, OT flag) linked to tickets.
    *   **Price Lists Table**: Tenant-scoped material and labor rates.
    *   **Audit Logs Table**: Record `(userId, action, timestamp, payload)` for all administrative actions.

2.  **API Structure (`server/index.ts`)**:
    *   **Review API**: `POST /api/tickets/:id/review` — Internal attestation by leaders.
    *   **Financials API**: `GET /api/financials/budget` — Real-time burn rate and margin calculations.
    *   **Office API**: `POST /api/office/sync/fortnox` — Trigger accounting integration.
    *   **Compliance API**: `GET /api/compliance/ledger/export` — Skatteverket-compliant staff ledger (Personalliggare).
    *   **RBAC Middleware**: Every endpoint must verify `auth.role` (LEADER/ADMIN) before execution.

### Frontend: Claw UI Architecture

The UI utilizes the pluggable module system in `clawUiModules.ts`.

1.  **Role-Gated Navigation**: `ClawNavRail.tsx` will filter `extraModules` based on the user's role (e.g., Office/Compliance modules hidden from LEADER role).
2.  **Functional Module Registration**: Migrate stubs in `clawUserUiModules.ts` to functional components using:
    *   `apiGet`/`apiPostJson` for backend connectivity.
    *   Shared UI primitives: `ModuleHeader`, `StatCard`, `ActionToolbar`.
3.  **Context Integration**: Leverage `ClawUiModuleContext` for workspace root, theme, and cross-module navigation.

---

## Implementation Phases

### Phase 0: Prerequisites (WOP-014 App.tsx Refactor)
- App.tsx must be thinned to ~200 lines before adding new modules
- Claw shell must be formalized as `ClawPage.tsx` (standalone page component)
- Module registration pattern must be stable and tested

### Phase 1: Module Scaffolding (Week 1 post WOP-014)
- Register Review, Financials, Office, Compliance module stubs via `registerClawUiModule`
- Implement RBAC gating (only visible to LEADER/ADMIN/SUPER_ADMIN)
- Create shared UI components (ActionBtn, SectionHeader, ModuleCard)
- Wire module selection into Claw state management

### Phase 2: Review Module (Week 2)
- Connect to `/api/tickets` and `/api/tickets/:id/review` endpoints
- Ticket list with status badges, worker info, total hours
- Detail view: time blocks, materials, photos
- Approve/reject with notes
- Adjust hours before forwarding
- Message Worker quick action

### Phase 3: Office Module (Week 3)
- Invoice preparation UI: select approved tickets, preview totals
- Fortnox sync status dashboard
- "Sync Selected" button → triggers Fortnox API push
- PDF generation for underlag (basis for invoicing)
- ROT/RUT tax split controls

### Phase 4: Financials Module (Week 3-4)
- Project burn rate display (actual vs budget)
- Material price list CRUD
- Cost alert thresholds (UI for setting + backend notification)
- Worker hourly rate management
- "Recalculate Totals" automation

### Phase 5: Compliance Module (Week 4)
- Personalliggare export (Skatteverket format)
- KMA documentation: log quality/env/safety checks per project
- Audit log viewer for admin
- Certificate expiry tracking for workers

### Phase 6: Automation & Scheduling (Week 5)
- Wire Claw scheduler to trigger module actions
- Pre-built automations: "Weekly summary to client", "Auto-sync approved tickets"
- Custom automation builder (advanced, future)

---

## Role-Based Visibility

| Module | Worker | Leader | Admin | Super Admin |
|--------|--------|--------|-------|-------------|
| Review | ❌ | ✅ | ✅ | ✅ |
| Financials | ❌ | ✅ | ✅ | ✅ |
| Office | ❌ | ❌ | ✅ | ✅ |
| Compliance | ❌ | ❌ | ✅ | ✅ |

---

## Open Questions

1. Should messaging go through the existing WhatsApp bot or new in-app notification system (or both)?
2. Should the Office module also handle manual invoice creation (not just sync), or keep invoicing in a separate portal?
3. For Personalliggare (staff ledger) — should we auto-generate from check-in/out data or require manual entry?
4. Should Financials show real-time cost data or cached (updated hourly)?
5. How should "Send to Client" trigger work — via WhatsApp, email, or in-app notification link?

---

## Success Criteria

- [ ] LEADER can approve/reject tickets from Claw without opening Worker Portal
- [ ] ADMIN can sync approved tickets to Fortnox from Claw
- [ ] Leader can message workers directly from ticket detail view
- [ ] Budget status visible in Claw for all active projects
- [ ] Personalliggare export available from Compliance module
- [ ] Claw nav rail only shows modules appropriate to user's role
- [ ] All modules work without requiring IDE/Technical mode

---

## Related Documents

- `WOP-014-app-refactoring-plan.md` — Prerequisite: App.tsx must be refactored first
- `WOP-012-ATA-ticket-system.md` — ÄTA ticket system (Review module depends on this API)
- `WOP-013-role-based-header-matrix.md` — Role-based UI visibility strategy
- `WOP-ALL-TODO.md` — Master roadmap
