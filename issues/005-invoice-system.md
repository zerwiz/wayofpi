## Parent PRD

`issues/prd-financial-system.md`

## What to build

Full invoicing system: generate invoices from billable time entries (aggregated by worker × billing_rate) plus approved expenses, with configurable tax rate per invoice. Full lifecycle state machine, partial payment tracking, and PDF download.

## Acceptance criteria

- [ ] `invoices` table: id, project_id (FK), invoice_number (TEXT auto-generated), currency (TEXT), tax_rate (DECIMAL), tax_amount (DECIMAL), subtotal (DECIMAL), total (DECIMAL), due_date, status (TEXT: draft|sent|overdue|partially_paid|paid|written_off), notes (TEXT), created_at, updated_at
- [ ] `invoice_payments` table: id, invoice_id (FK), amount (DECIMAL), currency (TEXT), payment_date, method (TEXT), reference (TEXT), created_at
- [ ] `POST /api/financial/invoices` — generate invoice for project, auto-aggregates billable time entries × billing_rate + approved expenses, applies tax_rate
- [ ] `GET /api/financial/invoices` — list invoices (admin: all; PM: own projects)
- [ ] `GET /api/financial/invoices/:id` — invoice detail with line items (time summary section + expense section)
- [ ] `PUT /api/financial/invoices/:id/status` — transition status (draft→sent→overdue→partially_paid→paid→written_off)
- [ ] `POST /api/financial/invoices/:id/payments` — record a partial payment
- [ ] `GET /api/financial/invoices/:id/pdf` — download invoice as PDF
- [ ] Invoice time summary section: aggregated rows per worker (name, total hours, billing_rate, amount)
- [ ] Invoice expense section: individual expense line items (description, amount)
- [ ] Invoice auto-calculates: subtotal = time_total + expense_total, tax_amount = subtotal × tax_rate/100, total = subtotal + tax_amount
- [ ] Invoice number auto-generated with format: INV-{YYYY}-{NNNNN}
- [ ] UI: Invoice list page with status badges (color-coded), filterable
- [ ] UI: Invoice detail page showing all line items, payment history, status controls
- [ ] UI: Generate invoice button on project financial section
- [ ] UI: Record payment form (amount, date, method, reference)
- [ ] UI: Download PDF button
- [ ] Server-side PDF generation with branded template

## Blocked by

- Blocked by `issues/002-budget-engine.md` (time × rate for invoice line items)
- Blocked by `issues/003-expense-tracking.md` (expenses for invoice line items)

## User stories addressed

- User story 20: Generate invoice with configurable tax rate
- User story 21: Invoice includes time summary + itemized expenses
- User story 22: Invoice uses billing rates (not pay rates)
- User story 23: Invoice lifecycle with full status tracking
- User story 24: Record partial payments against invoice
- User story 25: Download invoice as PDF
- User story 26: Admin sees all invoices across projects
