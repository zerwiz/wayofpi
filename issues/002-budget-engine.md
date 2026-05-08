## Parent PRD

`issues/prd-financial-system.md`

## What to build

The budget system for projects: a proposal/approval lifecycle, cost calculation from time entries × worker rates, and configurable alert thresholds.

PMs propose a budget (total + monthly target), admins approve. Once active, the system computes `spent` from `SUM(time_entries.duration_hours × worker_profiles.hourly_rate)` plus approved expenses. `remaining = total_allocated - spent`. Configurable alert thresholds (e.g., 75%, 90%, 100%) trigger visual warnings.

## Acceptance criteria

- [ ] `budgets` table exists with columns: id, project_id (FK), total_allocated (DECIMAL), monthly_target (DECIMAL nullable), currency (TEXT), status (TEXT: proposed|approved|active|exhausted|closed), alert_thresholds (JSON array of percentages), proposed_by (FK to user), approved_by (FK to user nullable), created_at, approved_at, closed_at
- [ ] `budget_adjustments` table: id, budget_id (FK), requested_amount (DECIMAL), reason (TEXT), status (TEXT: requested|approved|rejected), requested_by (FK), approved_by (FK nullable)
- [ ] `POST /api/financial/budgets` — PM proposes budget for a project
- [ ] `GET /api/financial/budgets` — list budgets (admin: all; PM: own projects)
- [ ] `GET /api/financial/budgets/:id` — budget detail with computed `spent`, `remaining`, `burn_rate`
- [ ] `POST /api/financial/budgets/:id/approve` — admin approves budget (status → approved)
- [ ] `POST /api/financial/budgets/:id/reject` — admin rejects budget
- [ ] `POST /api/financial/budgets/:id/adjustments` — PM requests budget increase
- [ ] `POST /api/financial/budgets/:id/adjustments/:adj_id/approve` — admin approves adjustment
- [ ] Budget `spent` is computed as: SUM of time entry costs (hours × worker hourly_rate within budget period) + SUM of approved expenses
- [ ] Budget `remaining` is `total_allocated - spent`
- [ ] Budget `burn_rate` is `spent / months_since_start` or similar
- [ ] Alert thresholds evaluated on every budget read — returns `alerts` array with triggered threshold levels
- [ ] UI: Budget section on project detail page with proposal form, approval/reject buttons (admin), adjustment request, current status badge, spent/remaining bar, alert indicators
- [ ] Server-side validation: total_allocated > 0, alert_thresholds values 0-100

## Blocked by

- Blocked by `issues/001-worker-financial-profiles.md` (needs hourly_rate for cost calculation)

## User stories addressed

- User story 3: PM proposes budget
- User story 4: Admin approves/rejects proposed budget
- User story 5: PM requests mid-project budget adjustment
- User story 6: Admin approves/rejects adjustment
- User story 7: PM sets custom alert thresholds
- User story 8: Dashboard shows budget alerts
- User story 14: PM sees time-based labour costs
- User story 15: Billable/non-billable toggle on time entries
