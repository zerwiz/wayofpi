## Parent PRD

`issues/prd-financial-system.md`

## What to build

Multi-currency support for all financial entities. Every monetary amount is stored with its original currency. Exchange rates can be entered manually or auto-fetched from an external API. A global reporting currency setting converts all amounts for dashboard/report display.

## Acceptance criteria

- [ ] `exchange_rates` table: id, base_currency (TEXT ISO 4217), target_currency (TEXT), rate (DECIMAL), valid_from, valid_to, source (TEXT: manual|api), created_at
- [ ] Tenant/global setting: `reporting_currency` (TEXT, default: USD)
- [ ] `GET /api/financial/exchange-rates` — list current exchange rates
- [ ] `PUT /api/financial/exchange-rates` — admin sets/updates exchange rates
- [ ] `POST /api/financial/exchange-rates/fetch` — trigger API auto-fetch (returns rates from external provider)
- [ ] `currency` field added to: `worker_financial_profiles`, `budgets`, `expenses`, `invoices`
- [ ] Dashboard/report queries convert amounts to `reporting_currency` using exchange rate table
- [ ] If no exchange rate found for required pair, return original amount with a `conversion_warning: true` flag
- [ ] UI: Reporting currency selector in admin settings
- [ ] UI: Exchange rate editor (table with base/target/rate, manual override per row)
- [ ] UI: Auto-fetch button with preview of fetched rates before saving
- [ ] UI: Currency selector dropdown on worker profile, budget form, expense form, invoice
- [ ] UI: Dashboard shows converted amounts with currency indicator and optional warning icon if conversion was not possible
- [ ] Exchange rate API integration (e.g., exchangerate-api.com, Open Exchange Rates) — configurable via admin settings

## Blocked by

- Blocked by `issues/001-worker-financial-profiles.md` (adds currency field)
- Blocked by `issues/002-budget-engine.md` (adds currency field)
- Blocked by `issues/003-expense-tracking.md` (adds currency field)
- Blocked by `issues/005-invoice-system.md` (adds currency field)

Can be implemented in parallel with `issues/004-financial-dashboard.md` and `issues/007-financial-reports.md` — the dashboard and reports simply need to handle the conversion flag.

## User stories addressed

- User story 1: Admin sets global reporting currency
- User story 2: Exchange rates configurable manual + API
