# PRD: Financial System — Budgets, Salaries, Invoicing

> **Status**: Draft  
> **Date**: 2026-05-08  
> **Actors**: Admin, Project Manager, Worker  

---

## Problem Statement

Admins and project managers have no way to track whether projects are staying within budget. Worker time is tracked in hours but not converted to cost. Material expenses have no system of record. There is no invoicing, no salary tracking, and no way to generate financial reports. Decisions about project profitability are made blind.

## Solution

A financial system that tracks three cost dimensions — **worker salaries** (fixed + hourly), **project budgets** (with proposal/approval workflow), and **invoicing** (time summary + itemized expenses) — surfaced through a unified dashboard with configurable alerts and exportable reports.

---

## User Stories

### Budget Management

1. As an **admin**, I want to set a global reporting currency, so that all financial reports display in my chosen currency regardless of source currency.
2. As an **admin**, I want to configure exchange rates manually or via API fallback, so that multi-currency costs are converted accurately.
3. As a **project manager**, I want to propose a budget for a new project (total + monthly targets), so that admin can review and approve it.
4. As an **admin**, I want to approve or reject proposed project budgets, so that no project starts without financial oversight.
5. As a **project manager**, I want to request a budget adjustment mid-project, so that admin can approve additional funds.
6. As an **admin**, I want to approve or reject mid-project budget adjustments, so that budget changes are controlled.
7. As a **project manager**, I want to set custom budget alert thresholds per project (e.g., warn at 75%, 90%, 100%), so that I'm notified before we exceed the budget.
8. As a **project manager** or **admin**, I want to see budget-overrun alerts on the dashboard, so that I can take corrective action early.

### Salary & Cost Tracking

9. As an **admin**, I want to set a worker's hourly rate in their profile, so that time entries are converted to cost automatically.
10. As an **admin**, I want to set a worker's fixed monthly salary in their profile, so that recurring salary cost is tracked.
11. As an **admin**, I want to choose whether a worker's salary hits budgets as monthly overhead or is prorated across projects based on time allocation, so that cost allocation matches our accounting model.
12. As an **admin**, I want to set separate billing rates per worker (different from their pay rate), so that invoices can reflect a markup.
13. As a **worker**, I want to see my own hourly rate and estimated earnings, so that I understand my compensation.
14. As a **project manager**, I want to see the total cost of time entries against my project (hours × pay rates), so that I understand labour costs.
15. As a **project manager**, I want to mark time entries as billable or non-billable, so that only billable time appears on invoices while all time counts against budget.

### Expense Tracking

16. As a **worker** or **project manager**, I want to add manual expense line items to a project (description, amount, date, currency, category), so that material costs are tracked.
17. As a **worker**, I want to upload receipt images for expense reimbursement, so that I can be reimbursed for out-of-pocket costs.
18. As a **project manager**, I want to review and approve/reject expense receipts submitted by workers, so that spending is controlled.
19. As a **project manager** or **admin**, I want to see all expenses (approved + pending) against a project budget, so that I know total committed costs.

### Invoicing

20. As a **project manager** or **admin**, I want to generate an invoice for a project with a configurable tax rate, so that clients are billed correctly.
21. As a **project manager** or **admin**, I want invoices to include a time summary (hours aggregated by worker/task) plus itemized expense lines, so that clients see what they're paying for.
22. As a **project manager** or **admin**, I want invoices to apply billing rates (not pay rates) to time entries, so that markup is reflected.
23. As a **project manager** or **admin**, I want to set invoice status through a lifecycle (Draft → Sent → Overdue → Partially Paid → Paid → Written Off), so that payment progress is tracked.
24. As a **project manager** or **admin**, I want to record partial payments against an invoice, so that payment tracking is accurate.
25. As a **project manager** or **admin**, I want to download invoices as PDF, so that I can email them to clients.
26. As an **admin**, I want to see all invoices across all projects with status filters, so that I can track overall accounts receivable.

### Dashboard & Reporting

27. As a **project manager**, I want a financial dashboard for my projects showing summary cards (budget allocated, spent, remaining) plus charts (spend over time, budget vs actual) and a detailed budget table, so that I have full visibility into project financial health.
28. As an **admin**, I want a global financial dashboard across all projects, so that I can see the big picture.
29. As a **project manager** or **admin**, I want to export budget reports as CSV and PDF, so that I can share them in meetings or analyze in Excel.
30. As a **project manager** or **admin**, I want to see a project's burn rate (monthly spend vs monthly budget target), so that I can forecast when the budget will be exhausted.
31. As an **admin**, I want to see a worker cost report (total cost per worker across projects), so that I understand workforce costs.

---

## Implementation Decisions

### Modules

#### 1. Worker Financial Profile (deep module)
- Located in the existing worker/user profile system
- Fields: `hourly_rate` (decimal), `monthly_salary` (decimal, nullable), `billing_rate` (decimal, nullable — defaults to hourly_rate × markup), `salary_allocation` (enum: `monthly_overhead` | `prorated_by_time` | `both`)
- Currency field per worker (defaults to tenant/global currency)
- Simple CRUD interface exposed to admin UI

#### 2. Budget Engine (deep module)
- Budget lifecycle: `proposed` → `approved` → `active` → `exhausted` → `closed`
- Budget data per project: `total_allocated` (decimal), `monthly_target` (decimal, nullable), `currency`, `alert_thresholds` (JSON array of percentages), `spent` (computed), `remaining` (computed)
- Budget adjustment requests: `proposed_change` (decimal), `reason`, status tied to approval workflow
- Cost calculation: `SUM(time_entries.duration_hours × worker.hourly_rate) + SUM(expenses.amount)` within the budget period
- Exchange rate conversion applied at query time using stored rates

#### 3. Expense Tracker
- Expense types: `manual` (line item) and `receipt` (with file upload)
- Expense lifecycle: `submitted` → `approved` → `reimbursed` | `rejected`
- Fields: project_id, worker_id, amount, currency, category, description, receipt_file_url, submitted_at, approved_by, approved_at
- File upload endpoint for receipt images (stored on disk or S3-compatible)
- Category taxonomy: materials, travel, software, equipment, subcontractor, other

#### 4. Invoice Engine (deep module)
- Invoice lifecycle state machine: `draft` → `sent` → `overdue` → `partially_paid` → `paid` → `written_off`
- Invoice data: project_id, invoice_number (auto-generated), currency, tax_rate, tax_amount, subtotal, total, due_date, status, notes
- Line items: two sections — time summary (aggregated by worker: name, hours, billing_rate, amount) and expense lines (individual expenses with their amounts)
- Partial payments tracked as separate records: amount, date, method, reference
- PDF generation: server-side, templated layout with company/project info

#### 5. Exchange Rate Service
- Stores exchange rates as `base_currency` → `target_currency` → `rate` with `valid_from`/`valid_to`
- API integration for auto-fetching (e.g., exchangerate-api.com or Open Exchange Rates)
- Manual override via admin UI
- Default rate = 1.0 for same-currency conversions

#### 6. Financial Dashboard
- Reusable dashboard component with role-based data filtering
- Summary cards: total budget allocated, total spent, total remaining, burn rate
- Charts: spend-over-time line chart, budget-vs-actual bar chart, expense breakdown pie chart
- Per-project budget table with sortable columns (project, allocated, spent, remaining, % used, status)
- Global view (admin) vs scoped view (PM sees own projects)
- Worker-cost sub-view (admin only)

#### 7. Report Generator
- PDF report: branded template with summary, charts, per-project breakdown
- CSV export: raw data dump for spreadsheet analysis
- Scheduled or on-demand generation

### Schema Changes

New tables needed:
- `worker_financial_profiles` — hourly_rate, monthly_salary, billing_rate, salary_allocation, currency
- `budgets` — project_id, total_allocated, monthly_target, currency, status, alert_thresholds, proposed_by, approved_by
- `budget_adjustments` — budget_id, requested_amount, reason, status, requested_by, approved_by
- `expenses` — project_id, worker_id, type, amount, currency, category, description, receipt_url, status
- `invoices` — project_id, invoice_number, currency, tax_rate, tax_amount, subtotal, total, due_date, status, notes
- `invoice_payments` — invoice_id, amount, currency, payment_date, method, reference
- `exchange_rates` — base_currency, target_currency, rate, valid_from, valid_to, source

Existing tables to extend:
- `projects` — add budget fields or link to new `budgets` table
- `workers` / `users` — add hourly_rate, monthly_salary, billing_rate (or move to financial_profiles)
- `time_entries` — add `billable` boolean flag

### API Endpoints

Financial API namespace: `/api/financial/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/financial/workers/:id/profile` | GET/PUT | Worker financial profile |
| `/api/financial/budgets` | GET/POST | List/create budgets (filterable by project) |
| `/api/financial/budgets/:id` | GET/PUT | Budget detail/update |
| `/api/financial/budgets/:id/approve` | POST | Approve budget |
| `/api/financial/budgets/:id/adjustments` | GET/POST | Budget adjustment requests |
| `/api/financial/budgets/:id/adjustments/:adj_id/approve` | POST | Approve adjustment |
| `/api/financial/expenses` | GET/POST | List/create expenses |
| `/api/financial/expenses/:id` | GET/PUT | Expense detail/update |
| `/api/financial/expenses/:id/approve` | POST | Approve expense |
| `/api/financial/expenses/:id/receipt` | POST | Upload receipt |
| `/api/financial/invoices` | GET/POST | List/create invoices |
| `/api/financial/invoices/:id` | GET/PUT | Invoice detail/update |
| `/api/financial/invoices/:id/pdf` | GET | Download invoice PDF |
| `/api/financial/invoices/:id/payments` | GET/POST | Invoice payment records |
| `/api/financial/invoices/:id/status` | PUT | Update invoice status |
| `/api/financial/exchange-rates` | GET/PUT | Exchange rate config |
| `/api/financial/reports/budget` | GET | Budget report (query: project_id, period, format=csv|pdf) |
| `/api/financial/reports/worker-cost` | GET | Worker cost report (admin only) |
| `/api/financial/dashboard` | GET | Dashboard data (role-filtered) |

### Key Integration Points

- **Time entries → Cost**: When querying budget spend, `SUM(time_entries.duration_hours × worker_profiles.hourly_rate)` within budget period
- **Time entries → Invoice**: When generating invoice, aggregate billable time entries × billing_rate
- **Worker salary → Budget**: Based on `salary_allocation` setting: monthly_fixed adds a recurring cost entry; prorated splits monthly salary across projects proportionally by hours worked
- **Dashboard → Auth**: Dashboard endpoint filters by role (admin = all, PM = managed projects, worker = own data)

### Multi-Currency Strategy

- Every monetary amount is stored with its original `currency` (ISO 4217: USD, EUR, etc.)
- The system has a `reporting_currency` setting (configurable by admin)
- At query time, amounts are converted to the reporting currency using the stored exchange rate table
- If no exchange rate is found for the required pair, the conversion returns the original amount with a warning flag
- Exchange rates can be entered manually or auto-fetched daily via API

---

## Testing Decisions

### Testing Philosophy
- Test external behaviour (API contracts, budget calculations, invoice totals), not implementation details
- A good test: "Given a project with 10 hours of tracked time at $50/hr worker rate and $200 in approved expenses, the budget spent returns $700."
- A bad test: "The budget engine calls calculateCost() which calls sumTimeEntries()..."

### What to Test

| Module | Test approach | Prior art |
|--------|--------------|-----------|
| **Budget Engine** | Unit tests for cost calculation, proration logic, alert threshold evaluation | Server endpoint tests in `server/` (existing pattern) |
| **Invoice Engine** | Unit tests for line item aggregation, tax calculation, PDF generation validation | No existing PDF tests — new pattern |
| **Exchange Rate Service** | Unit tests for conversion logic, fallback behaviour, rate lookup | Simple pure-function testing |
| **Dashboard API** | Integration tests: seed time + expense + budget data, verify dashboard response | `GET /api/client/projects/:id/progress` endpoint tests |
| **Expense Approval Flow** | Integration tests for lifecycle transitions (submitted → approved → reimbursed) | Approval flow similar to budget approval |
| **API Contract Tests** | Verify all financial endpoints return correct status codes + shapes for happy path and error cases | Existing server route tests |

### Not Tested (initially)
- PDF visual layout (snapshot/render testing — deferred)
- Exchange rate API integration (test with mock)
- Receipt file upload handling

---

## Out of Scope

- **Payroll processing**: The system tracks salary costs and generates reports but does not disburse payments to workers. That remains the domain of external payroll software.
- **Bank/Credit card integration**: No automatic import of bank transactions or credit card feeds.
- **Tax filing**: The system applies tax rates to invoices but does not generate tax filings, VAT returns, or similar compliance documents.
- **Time tracking itself**: Already exists (TimeEntryForm, TimeReport). The financial system reads time entries but does not replace them.
- **Client-facing financial portal**: Invoices are generated and sent by admins/PMs; clients do not log in to see financial data. (Future enhancement.)
- **Mobile app**: Web-only via existing responsive layout.

---

## Further Notes

### Relationship to Existing Code

The financial system is **additive** — it does not change existing time tracking, project management, or kanban functionality. It reads time entries to compute costs but does not modify them. This allows independent rollout without destabilising existing features.

### Phase Plan (Suggested)

| Phase | Scope | Depends on |
|-------|-------|-----------|
| 1 | Worker financial profiles (hourly_rate, monthly_salary, billing_rate) + schema | Phase 0 (clean build) |
| 2 | Budget engine (propose/approve/lifecycle) + cost calculation from time entries | Phase 1 |
| 3 | Expense tracking (manual line items + receipt upload + approval) | Phase 2 |
| 4 | Financial dashboard (summary cards, charts, tables, role-filtered) | Phases 1-3 |
| 5 | Invoicing (generate, PDF, status lifecycle, payments) | Phase 4 |
| 6 | Multi-currency + exchange rate service | Phase 1-5 (parallel) |
| 7 | Reports (CSV + PDF export, worker cost report) | Phase 5 |
| 8 | Budget alerts (notifications, dashboard warnings) | Phase 4 |

### Currency Format

All monetary values stored as `DECIMAL(12, 2)` for precision. The UI displays amounts formatted according to the project/reporting currency locale (e.g., `$1,234.56` for USD, `€1.234,56` for EUR).

### Receipt Storage

Receipt images are stored at `storage/receipts/{tenant_id}/{project_id}/{expense_id}.{ext}`. Accepted formats: PNG, JPG, PDF. Max file size: 10 MB.

---

*Generated 2026-05-08*
