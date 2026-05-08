## Parent PRD

`issues/prd-financial-system.md`

## What to build

Expense tracking for projects: manual line items (description, amount, category) and receipt image uploads with an approval workflow. Workers submit expenses, PMs approve/reject. Approved expenses count against the project budget.

## Acceptance criteria

- [ ] `expenses` table exists with columns: id, project_id (FK), worker_id (FK), type (TEXT: manual|receipt), amount (DECIMAL), currency (TEXT), category (TEXT), description (TEXT), receipt_url (TEXT nullable), status (TEXT: submitted|approved|reimbursed|rejected), reviewed_by (FK nullable), reviewed_at, created_at
- [ ] `POST /api/financial/expenses` — create expense (worker or PM, requires project_id)
- [ ] `GET /api/financial/expenses` — list expenses (admin: all; PM: own projects; worker: own)
- [ ] `GET /api/financial/expenses/:id` — expense detail
- [ ] `PUT /api/financial/expenses/:id` — update expense (own or admin)
- [ ] `POST /api/financial/expenses/:id/receipt` — upload receipt image (multipart, max 10MB, accepted: PNG/JPG/PDF)
- [ ] `POST /api/financial/expenses/:id/approve` — PM approves expense
- [ ] `POST /api/financial/expenses/:id/reject` — PM rejects expense with reason
- [ ] Receipt files stored at `storage/receipts/{tenant_id}/{project_id}/{expense_id}.{ext}`
- [ ] UI: Expense list on project page with status badges (submitted=gray, approved=green, rejected=red, reimbursed=blue)
- [ ] UI: Add expense modal/form with type toggle (manual/receipt), category dropdown, amount, currency, description
- [ ] UI: Receipt upload button with file picker
- [ ] UI: Approve/reject buttons for PM on pending expenses
- [ ] Server-side validation: amount > 0, category from defined taxonomy

## Blocked by

- Blocked by `issues/002-budget-engine.md` (expenses count against budget)

## User stories addressed

- User story 16: Add manual expense line items to project
- User story 17: Worker uploads receipt for reimbursement
- User story 18: PM reviews and approves/rejects receipts
- User story 19: See all expenses (approved + pending) against project budget
