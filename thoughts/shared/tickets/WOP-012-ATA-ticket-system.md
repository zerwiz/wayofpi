# [WOP-012] Swedish ÄTA Ticket System — Bygglet-Class Digital Time Block Approvals

> **Epic:** Phase 7 (Financial System) / Work Leader System
> **Status:** IN PROGRESS (Phase 1 — types complete, tables + API next)
> **Priority:** Medium

---

## Problem

Swedish construction projects follow standard contracts (AB 04, ABT 06) that require strict documentation and approval of extra work (*Ändringar, Tillägg, och Avgående arbeten* — ÄTA). Currently Way of Pi has time entries but no structured ticket/approval workflow that maps to Swedish legal requirements or matches the capabilities of popular tools like **Bygglet**, **Next**, or **Fieldly**.

Without a digital ticket system, contractors risk:
- Inability to bill for extra hours due to missing client approval
- Payment disputes under the Swedish Payment Act (30-day rule pushed back)
- No audit trail for the "documentation duty" required by Swedish law
- Falling behind competitors who use Bygglet-class digital tools

---

## Vision

A Bygglet-class digital ÄTA system built into Way of Pi — workers check in/out of projects, log time blocks and materials against structured tickets, leaders review internally, clients digitally approve, and approved tickets flow directly into invoicing (Fortnox/Visma).

**Core principle:** Digitize the handshake — turn a verbal on-site agreement into a documented ticket the client must approve before it reaches accounting.

---

## Workflow

```
Worker (Mobile)             Project Leader           Client
  │                              │                     │
  ├─ Check in to project ───────>│                     │
  │  (clock in / out)            │                     │
  │                              │                     │
  ├─ Create ÄTA ticket ─────────>│                     │
  │  (title, category, photo,    │                     │
  │   material receipts)         │                     │
  │                              │                     │
  ├─ Log time blocks ───────────>│                     │
  │  (hours per task, OT flag,   │                     │
  │   description)               │                     │
  │                              │                     │
  │                    [Internal Attestation]
  │                              │                     │
  │                         [Leader reviews]
  │                         (verify hours, notes,
  │                          adjust if needed)
  │                              │                     │
  │                         [Customer Access]
  │                              ├── Send summary ────>│
  │                              │                     │
  │                              │            [Client reviews time blocks]
  │                              │                     │
  │                              │<── Approve / Reject─│
  │                              │    (digital sign-off)
  │                              │                     │
  │                  ⬇ [LOCKED for invoicing]          │
  │                        "Underlag för fakturering"
  │                              │
  │                  [Pull approved tickets]
  │                  [Generate invoice draft]
  │                  [Send via Fortnox/Visma]
```

---

## Data Model

### tickets (ÄTA-arbeten)
```sql
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,                         -- "ticket_xxx"
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id),
    title TEXT NOT NULL,                         -- "Oväntad berg vid schaktning"
    description TEXT,
    category TEXT NOT NULL DEFAULT 'tillägg',    -- 'ändring', 'tillägg', 'avgående'
    status TEXT NOT NULL DEFAULT 'draft',        -- 'draft'
                                                 -- → 'pending_review' (submitted to leader)
                                                 -- → 'pending_approval' (sent to client)
                                                 -- → 'approved' (client signed)
                                                 -- → 'rejected'
                                                 -- → 'invoiced'
    priority TEXT DEFAULT 'medium',              -- 'low', 'medium', 'high', 'critical'
    cost_estimate REAL,                          -- Calculated real-time cost
    cost_actual REAL,                            -- Final cost after approval
    created_by TEXT REFERENCES users(id),
    reviewed_by TEXT REFERENCES users(id),       -- Leader who reviewed
    assigned_to TEXT REFERENCES users(id),       -- Kontrollansvarig (client rep)
    approved_by TEXT REFERENCES users(id),       -- Who approved
    approved_at TEXT,
    rejected_reason TEXT,
    locked_at TEXT,                              -- When approved → locked for invoicing
    invoiced_at TEXT,
    invoice_ref TEXT,                            -- Fortnox/Visma invoice number
    materials_json TEXT DEFAULT '[]',            -- [{name, quantity, unit, unit_price, total, receipt_photo}]
    photos_json TEXT DEFAULT '[]',               -- [{url, caption, uploaded_at}]
    kmal_json TEXT DEFAULT '{}',                 -- {quality: [], environment: [], safety: []} — KMA docs
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### time_blocks (Tid per ticket)
```sql
CREATE TABLE IF NOT EXISTS time_blocks (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    check_in TEXT,                               -- "07:30"
    check_out TEXT,                              -- "16:00"
    hours REAL NOT NULL,                         -- Computed or manual
    break_hours REAL DEFAULT 0,                  -- Rast
    description TEXT,                             -- "Borttagning av berg 2h"
    hourly_rate REAL,                             -- Overridable per block
    overtime BOOLEAN DEFAULT 0,                  -- OB-tillägg
    overtime_hours REAL DEFAULT 0,               -- Hours at OT rate
    overtime_rate REAL,                          -- OT multiplier (e.g. 1.5x, 2x)
    approved BOOLEAN DEFAULT 0,                  -- Individual block approval
    approved_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);
```

### time_sessions (Check-in/Check-out)
```sql
CREATE TABLE IF NOT EXISTS time_sessions (
    id TEXT PRIMARY KEY,                         -- "session_xxx"
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    project_id TEXT REFERENCES projects(id),
    check_in TEXT NOT NULL,                      -- "2026-05-09T07:30:00Z"
    check_out TEXT,                              -- null if still checked in
    total_hours REAL,                            -- Computed on check-out
    break_minutes INTEGER DEFAULT 0,
    notes TEXT,
    location_json TEXT,                          -- GPS coordinates at check-in/out
    created_at TEXT DEFAULT (datetime('now'))
);
```

### price_lists (Pre-loaded material rates)
```sql
CREATE TABLE IF NOT EXISTS price_lists (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                          -- "Grundprislista 2026"
    items_json TEXT DEFAULT '[]',                -- [{name, unit, unit_price, category}]
    active BOOLEAN DEFAULT 1,
    valid_from TEXT,
    valid_to TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
```

---

## API Endpoints

### Tickets
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/tickets` | WORKER+ | List tickets (tenant + role scoped) |
| POST | `/api/tickets` | WORKER+ | Create ticket |
| GET | `/api/tickets/:id` | ANY | Get ticket with all blocks |
| PUT | `/api/tickets/:id` | LEADER+ | Update ticket metadata |
| POST | `/api/tickets/:id/submit` | WORKER | Submit for leader review |
| POST | `/api/tickets/:id/review` | LEADER | Approve internally, send to client |
| POST | `/api/tickets/:id/reject-internal` | LEADER | Send back to worker with notes |
| POST | `/api/tickets/:id/approve` | CLIENT | Digital sign-off |
| POST | `/api/tickets/:id/reject` | CLIENT | Reject with reason |
| POST | `/api/tickets/:id/lock` | SYSTEM | Auto-lock on approval |
| POST | `/api/tickets/:id/invoice` | LEADER | Mark as invoiced + ref number |

### Time Blocks
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/:id/time-blocks` | ANY | List time blocks |
| POST | `/api/tickets/:id/time-blocks` | WORKER | Add time block |
| PUT | `/api/tickets/:id/time-blocks/:blockId` | WORKER | Edit own block |
| DELETE | `/api/tickets/:id/time-blocks/:blockId` | LEADER | Remove block |

### Time Sessions (Check-in/out)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/time-sessions/check-in` | WORKER | Check in to project |
| POST | `/api/time-sessions/check-out` | WORKER | Check out (computes hours) |
| GET | `/api/time-sessions/active` | WORKER+ | Currently checked-in workers |
| GET | `/api/time-sessions/report` | LEADER | Time report for date range |

### Price Lists
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/price-lists` | WORKER+ | List active price lists |
| POST | `/api/price-lists` | LEADER+ | Create price list |
| PUT | `/api/price-lists/:id` | LEADER+ | Update items |
| DELETE | `/api/price-lists/:id` | ADMIN | Deactivate |

### Invoicing
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/invoices/approved-tickets` | LEADER+ | List approved tickets ready for invoicing |
| POST | `/api/invoices/export-csv` | LEADER+ | Export to Fortnox/Visma CSV |
| POST | `/api/invoices/export-fortnox` | LEADER+ | Push to Fortnox API |
| POST | `/api/invoices/export-visma` | LEADER+ | Push to Visma API |

### Reports
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/reports/weekly-summary` | WORKER | Own weekly hours by project |
| GET | `/api/reports/project-budget` | LEADER | Time blocks vs quote |
| GET | `/api/reports/ticket-status` | LEADER+ | Dashboard of all tickets by status |
| GET | `/api/reports/electronic-staff-ledger` | ADMIN | Skatteverket-compliant staff ledger export |

---

## UI Changes

### Worker Portal (Mobile-First)

| Feature | Details |
|---------|---------|
| **Check-in/out** | Big button: "Check in to [project]" → GPS-stamped timestamp |
| **My Tickets** | List of own tickets with color-coded status badges |
| **Create Ticket** | Form: title, category (ändring/tillägg/avgående), photo, attach from price list |
| **Add Time Block** | Date, hours, OT toggle, description, task reference |
| **Add Material** | Search from price list or add custom; photo receipt |
| **Weekly Summary** | "Send this week's tickets" button — standard Friday/Monday practice |
| **Photo Upload** | Camera integration for evidence + receipts |
| **Notifications** | Ticket approved/rejected/inquiry from leader |

### Project Leader View

| Feature | Details |
|---------|---------|
| **Review Queue** | Incoming tickets from workers — verify hours, materials, photos |
| **Internal Attestation** | Approve/reject with notes; adjusted hours before client sees |
| **Customer Access** | Generate client summary and send for approval |
| **Budget Tracking** | Real-time: "Time blocks vs original quote — 65% consumed" |
| **Resource Planner** | Drag-and-drop calendar showing which worker is at which site |
| **KMA Documents** | Attach quality/env/safety docs to tickets |
| **Invoice Prep** | Gather approved tickets into invoice draft, export to Fortnox/Visma |

### Client Dashboard

| Feature | Details |
|---------|---------|
| **Pending Approvals** | "3 tickets awaiting your review" |
| **Ticket Detail** | See time blocks, photos, materials, total cost |
| **Digital Sign-off** | One-click approve, timestamped + locked |
| **Reject** | Structured reason dropdown + free text |
| **History** | All approved/rejected tickets with timestamps |
| **Customer Access** | Dedicated client login to review without needing the full app |

### Admin / Office

| Feature | Details |
|---------|---------|
| **Electronic Staff Ledger** | Skatteverket-compliant export of all time sessions |
| **Project Budget Overview** | All projects, budget consumed, ticket totals |
| **Price List Manager** | Create/edit material price lists with standard rates |
| **Invoice Integration** | Connect Fortnox/Visma API keys |
| **KMA Dashboard** | All quality/env/safety docs across projects |

---

## Implementation Phases

### Phase 1: Core Data Model + API (Week 1)

**Data layer:**
- [ ] Create `tickets` table in `schema.sql` + `db.ts`
- [ ] Create `time_blocks` table in `schema.sql` + `db.ts`
- [ ] Create `time_sessions` table (check-in/check-out)
- [ ] Create `price_lists` table (material rates)
- [x] Create `shared/ticket-types.ts` with TypeScript interfaces (includes FortnoxConnection)

**API:**
- [ ] `GET/POST /api/tickets` — list/create, tenant-scoped
- [ ] `GET/PUT /api/tickets/:id` — read/update single ticket
- [ ] `POST /api/tickets/:id/submit` — submit for leader review
- [ ] `POST /api/tickets/:id/approve` — client sign-off
- [ ] `POST /api/tickets/:id/reject` — reject with reason
- [ ] `POST /api/tickets/:id/lock` — lock for invoicing
- [ ] CRUD for time_blocks, time_sessions, price_lists

### Phase 2: Worker Mobile Portal (Week 2)

- [ ] Check-in/check-out UI with project selector
- [ ] "My Tickets" list with status badges (draft/pending/approved/rejected)
- [ ] Create ticket form: title, category, description, photo upload
- [ ] Add time blocks: date, hours, OT toggle, check-in/out times
- [ ] Add materials: search from price list or custom, receipt photo
- [ ] Weekly summary view with "Send week's tickets" button
- [ ] Photo upload via phone camera

### Phase 3: Internal Attestation + Leader Review (Week 2-3)

- [ ] Leader review queue: list submitted tickets with worker info
- [ ] Ticket detail view with time blocks, materials, photos
- [ ] Internal approve/reject with notes
- [ ] Adjust hours/materials before forwarding to client
- [ ] "Send to client for approval" action
- [ ] Notifications back to worker on review decision

### Phase 4: Client Sign-Off + Customer Access (Week 3)

- [ ] Client dashboard: pending approvals list with total costs
- [ ] Ticket detail view for client (time blocks, photos, materials)
- [ ] Digital sign-off (one-click approve with timestamp)
- [ ] Reject with structured reason (wrong hours, not approved, other)
- [ ] "Locked" state after approval — no edits allowed
- [ ] "Underlag för fakturering" status badge
- [ ] Customer Access: dedicated client login (limited to their tickets)

### Phase 5: Invoicing + Accounting Integration (Week 4)

- [ ] "Approved tickets ready for invoicing" view
- [ ] CSV export in Fortnox-compatible format
- [ ] CSV export in Visma-compatible format
- [ ] Mark as invoiced with invoice reference number
- [ ] Fortnox API integration (push invoice draft)
- [ ] Visma API integration (push invoice draft)

### Phase 6: Reporting + Ledger + KMA (Week 5)

- [ ] Electronic Staff Ledger export (Skatteverket-compliant)
- [ ] Project budget tracking: time blocks vs original quote
- [ ] Real-time costing: hours × rate + materials
- [ ] Ticket status dashboard (all tickets by status)
- [ ] KMA document attachment per ticket
- [ ] Resource planner: drag-and-drop worker calendar

---

## Feature Comparison: Way of Pi vs Bygglet

| Feature | Bygglet | WOP-012 |
|---------|---------|---------|
| Mobile check-in/out | ✅ | ✅ Phase 2 |
| ÄTA tickets | ✅ | ✅ Phase 1 |
| Time blocks per ticket | ✅ | ✅ Phase 1 |
| Material tracking + price lists | ✅ | ✅ Phase 1-2 |
| Photo evidence | ✅ | ✅ Phase 2 |
| Real-time costing | ✅ | ✅ Phase 6 |
| Internal attestation (leader review) | ✅ | ✅ Phase 3 |
| Customer Access (client login) | ✅ | ✅ Phase 4 |
| Digital sign-off / lock | ✅ | ✅ Phase 4 |
| Fortnox integration | ✅ | ✅ Phase 5 |
| Visma integration | ✅ | ✅ Phase 5 |
| Electronic Staff Ledger | ✅ (Skatteverket) | ✅ Phase 6 |
| Project budget vs quote | ✅ | ✅ Phase 6 |
| KMA (Quality/Env/Safety) | ✅ | ✅ Phase 6 |
| Resource planning calendar | ✅ | ✅ Phase 6 |
| Drag-and-drop scheduling | ✅ | ✅ Phase 6 |

---

## Swedish Legal Compliance

| Requirement | How WOP-012 Addresses It |
|-------------|--------------------------|
| **Dokumentationsplikt** (Documentation duty) | Structured ticket with timestamped time blocks, photos, GPS check-in/out |
| **Godkännande** (Client approval) | Digital sign-off + lock — no edits after approval |
| **AB 04 / ABT 06 compliance** | Status workflow matches contract phases |
| **30-day payment rule** | Approval timestamp starts the payment clock |
| **Weekly reporting practice** | Weekly summary + bulk send for Friday/Monday |
| **Skatteverket staff ledger** | Electronic Staff Ledger export with all time sessions |
| **Receipt documentation** | Photo upload for material receipts |
| **Audit trail** | Full status history with timestamps, actors, decisions |

---

## Key Files

| File | Purpose |
|------|---------|
| `server/schema.sql` | All new tables (tickets, time_blocks, time_sessions, price_lists) |
| `server/db.ts` | Runtime schema creation |
| `server/index.ts` | All ticket/block/session/price-list API endpoints |
| `shared/ticket-types.ts` | TypeScript interfaces for all entities |
| `src/pages/WorkerPortal.tsx` | Mobile-first check-in/out + ticket creation |
| `src/components/work/WorkApp.tsx` | Leader review queue + resource planner |
| `src/pages/ClientDashboard.tsx` | Client approval + Customer Access |
| `src/pages/AdminDashboard.tsx` | Price list manager, ledger export, invoice integration |
| `src/components/work/KmaPanel.tsx` | KMA documentation panel |

---

## Dependencies

- **Phase 0** (Clean Build): Prerequisite for any new code
- **Phase 7** (Financial System): WOP-008 — budget engine, invoicing patterns
- **Worker Portal**: Already exists — extend with tickets tab
- **Client Dashboard**: Already exists — extend with approval flow
- **File uploads**: S3 object storage for photos/receipts (see `docs/HOSTING_PLANS.md`)
- **Multi-tenancy**: All data tenant-scoped (see `docs/MULTI_TENANCY.md`)

---

*See also: `docs/HOSTING_PLANS.md` (S3 for photo/file storage), `docs/MULTI_TENANCY.md` (tenant isolation)*

---

## Appendix A: Bygglet vs Next — Competitive Landscape

| Area | Bygglet | Next (Next Project) | Way of Pi (WOP-012) |
|------|---------|---------------------|---------------------|
| **Target user** | Small to medium (1–50 emp) | Medium to large (20–500+ emp) | Small to medium (1–50 emp) |
| **Ease of use** | Very high. "WYSIWYG" | Steeper learning curve, more "pro" features | Very high (target) |
| **ÄTA management** | Simple, ticket-based approvals | Complex, multi-stage change order workflows | Simple, ticket-based approvals |
| **Pricing** | ~795 SEK/month | Custom pricing (usually more expensive) | TBD |
| **Best for** | Firms that want to get paid fast without complex setup | Firms with complex sub-contractor layers and deep project planning | Firms that want to get paid fast |
| **Fortnox integration** | Deep, seamless, native | ✅ but less seamless | Phase 5 (target: deep + seamless) |
| **Visma integration** | V Administration deep; eEkonomi limited/third-party | ✅ | Phase 5 (V Administration focus) |

**Key insight from the field:** Bygglet is a *cash-flow engine* — it digitizes the handshake so small firms don't go bankrupt waiting for clients to remember what work was done three weeks ago. Next is a *project management suite*. We target the Bygglet niche.

---

## Appendix B: Integration Strategy — Fortnox & Visma

### The "One-Button" Sync Flow

Most Swedish construction firms use **Bygglet for the "dirty work"** (field data) and **Fortnox or Visma for the "clean work"** (bookkeeping). Bygglet acts as the source of truth — work is performed, time blocks are logged, client approves inside Bygglet, then one button pushes to accounting.

### Architecture

```
Ticket status → "approved" or "locked"
       ↓
[System webhook trigger: push-to-accounting]
       ↓
┌─────────────────────────────────────────┐
│         Integration Router              │
│                                         │
│  Read tenant config:                    │
│    → Which accounting system?           │
│    → API keys valid?                    │
│    → Sync enabled?                      │
└─────────────────────────────────────────┘
       ↓
┌──────────────────┐   ┌──────────────────┐
│   Fortnox API     │   │   Visma          │
│   (REST, sandbox) │   │   Administration │
│   [preferred]     │   │   / eEkonomi     │
└──────────────────┘   └──────────────────┘
```

### Fortnox Payload Example
```json
{
  "CustomerNumber": "<matched from tenant config>",
  "InvoiceRows": [
    {
      "ArticleNumber": "ARBETE_TIM",
      "Description": "ÄTA: Bergschaktning 4h (ticket_abc123)",
      "Quantity": 4,
      "Price": 650,
      "ProjectNumber": "<project_ref>",
      "ExternalLink": "https://app.wayofpi.se/evidence/ticket_abc123"
    },
    {
      "ArticleNumber": "MATR_CEMENT",
      "Description": "Cement 25kg x 3 (ticket_abc123)",
      "Quantity": 3,
      "Price": 189
    }
  ],
  "InvoiceDate": "2026-05-09",
  "DueDate": "2026-06-08",
  "YourReference": "Project: Nya Badrum Kungsgatan",
  "RotRut": {
    "Type": "ROT",
    "Amount": 700.00,
    "Description": "Arbete borttagning berg (30% ROT-avdrag)"
  }
}
```

### Integration Components
| Component | Description |
|-----------|-------------|
| **ArticleNumber mapping** | Tenant-configurable mapping (e.g., "ARBETE_TIM" → labor, "MATR_*" → materials) |
| **ProjectNumber sync** | Critical for Resultatenheter (profit centers) in Swedish bookkeeping |
| **ExternalLink** | Public URL to signed PDF/evidence on the invoice row — prevents "what is this?" calls |
| **Webhook retry** | 3 retries with exponential backoff on API failure, stored in sync_log table |
| **Sync log table** | `sync_log(ticket_id, system, direction, status, payload, response, error, retry_count, created_at)` |
| **No double entry** | Customer info, article numbers, VAT codes sync automatically |
| **Payment status sync** | If client pays in Fortnox, status syncs back so PM knows the block is fully cleared |

### Visma Notes
- **Visma Administration**: Deep integration (article sync, customer sync) — fully supported
- **Visma eEkonomi**: Historically more limited — may require third-party connector or CSV fallback

---

## Appendix C: Swedish Legal Requirements — Deep Dive

### Unpaid Time Block — Legal Defense
If a client refuses to approve a time block, the system provides a defensible paper trail:
1. **The log**: Exact check-in/check-out timestamps (GPS-stamped if enabled)
2. **The photo**: Worker snapshot of the completed block attached to the time block
3. **The notification**: Proof the client received the approval request (delivery receipt)
4. **Conclusive consent** (konkludent handlande): In Swedish law, if a client doesn't respond to an ÄTA ticket but allows work to continue, they can be seen as having given consent — though digital signature is 100% safer

### ROT/RUT Tax Deduction
For private clients (not companies), Swedish tax law allows:
- **ROT** (Renovering, Ombyggnad, Tillbyggnad): 30% deduction on labor
- **RUT** (Rengöring, Underhåll, Tvätt): 50% deduction on labor

Implementation required:
- **Ticket-level flag**: `is_private_client BOOLEAN` — enables ROT/RUT split
- **Invoice split**: Labor hours sent as two rows — full price + negative ROT deduction
- **ArticleNumber**: Two separate codes for pre-ROT and ROT-deducted amounts
- **Config**: Tenant-level toggle for which deduction types they handle

### Offline Resilience (Connectivity in the Field)
Construction sites often have poor connectivity. The system must ensure data integrity:
- **Check-in Queuing**: Mobile app must queue check-in/out events locally if offline.
- **Sync Conflict Resolution**: Server-side timestamps (GPS-verified) are the source of truth if device clock differs.
- **Form Persistence**: Ticket drafts saved to localStorage before submission.

### Personalliggare (Electronic Staff Ledger)
Skatteverket requires all construction sites to maintain a staff ledger. Fines for non-compliance are heavy.

| Requirement | Implementation |
|-------------|----------------|
| Check-in event | Logged to digital ledger with timestamp + worker identity + site |
| Check-out event | Logged with total hours |
| Worker must be checked in to the **site ledger**, not just the ticket | `time_sessions` table links to `project_id` (the site), not ticket |
| Export format | JSON/CSV in Skatteverket's specified format |
| Inspection readiness | One-click export for on-site inspection |

---

## Appendix D: Integration-Readiness Checklist for Phase 5

| Requirement | Status | Notes |
|-------------|--------|-------|
| Fortnox Developer Portal sandbox tested | Planned | Clean REST API, free sandbox |
| ArticleNumber mapping per tenant | Planned | Configurable in Settings |
| ProjectNumber sync on all rows | Planned | Maps to Resultatenhet |
| ExternalLink (Secure Signed URL) | Planned | S3 short-lived signed URL for bookkeeping |
| ROT/RUT row splitting | Planned | 30% labor deduction |
| Webhook retry with sync_log | Planned | 3 retries, exponential backoff |
| Payment status callback | Planned | Webhook from Fortnox back to WOP |
| Visma Administration API | Planned | Deep integration path |
| Visma eEkonomi fallback (CSV) | Planned | Third-party connector or manual |
| Electronic Staff Ledger export | Planned | Skatteverket format |
| Offline check-in queuing | Planned | LocalStorage queue with retry logic |
