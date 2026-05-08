## Parent PRD

`issues/prd-financial-system.md`

## What to build

A per-worker financial profile that stores `hourly_rate`, `monthly_salary`, `billing_rate`, and `salary_allocation` (enum: `monthly_overhead` | `prorated_by_time` | `both`). Admins set these values via a form on the worker profile page. Workers see their own financial profile (read-only).

This is the foundation for all cost calculations and invoicing — every downstream slice reads rates from here.

## Acceptance criteria

- [ ] `worker_financial_profiles` table exists with columns: worker_id (PK/FK), hourly_rate (DECIMAL(12,2)), monthly_salary (DECIMAL(12,2) nullable), billing_rate (DECIMAL(12,2) nullable), salary_allocation (TEXT), currency (TEXT default tenant currency), created_at, updated_at
- [ ] Existing `users`/`workers` table gets a `financial_profile_id` FK or a 1:1 relation is established
- [ ] `GET /api/financial/workers/:id/profile` returns the worker's financial profile (admin: all workers; worker: own only)
- [ ] `PUT /api/financial/workers/:id/profile` updates the profile (admin only)
- [ ] Admin UI: financial profile form on worker detail page with fields for hourly_rate, monthly_salary, billing_rate, salary_allocation selector, currency selector
- [ ] Worker UI: read-only view of own financial profile
- [ ] Server-side validation: hourly_rate > 0, billing_rate >= 0, monthly_salary >= 0

## Blocked by

None — can start immediately (depends only on Phase 0 build being clean).

## User stories addressed

- User story 9: Admin sets worker hourly rate
- User story 10: Admin sets worker fixed monthly salary
- User story 11: Admin chooses salary allocation model
- User story 12: Admin sets separate billing rate
- User story 13: Worker sees own rate and earnings
