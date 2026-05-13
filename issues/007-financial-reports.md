## Parent PRD

`issues/prd-financial-system.md`

## What to build

Exportable financial reports in CSV and PDF formats. Two report types: **budget report** (per-project or all projects, with allocated/spent/remaining/burn rate over a date range) and **worker cost report** (total cost per worker across projects over a date range).

## Acceptance criteria

- [ ] `GET /api/financial/reports/budget?project_id=X&date_from=Y&date_to=Z&format=csv` — returns budget data as CSV download
- [ ] `GET /api/financial/reports/budget?project_id=X&date_from=Y&date_to=Z&format=pdf` — returns budget data as PDF download
- [ ] `GET /api/financial/reports/worker-cost?date_from=X&date_to=Y&format=csv` — returns worker cost data as CSV (admin only)
- [ ] `GET /api/financial/reports/worker-cost?date_from=X&date_to=Y&format=pdf` — returns worker cost data as PDF (admin only)
- [ ] Budget report columns: Project, Allocated, Spent, Remaining, % Used, Burn Rate/Month, Period
- [ ] Worker cost report columns: Worker Name, Total Hours, Hourly Rate, Total Cost, Projects Worked On, Period
- [ ] PDF report has a branded template (company name, date range, generated timestamp)
- [ ] CSV reports have proper headers and quoted fields for Excel/Google Sheets compatibility
- [ ] UI: "Export Report" dropdown on financial dashboard with options: Budget CSV, Budget PDF, Worker Cost CSV, Worker Cost PDF
- [ ] UI: Date range picker for report period (default: current month)
- [ ] UI: Project filter for budget report (default: all visible projects)
- [ ] Reports respect role-based visibility (admin = all, PM = own projects)
- [ ] Reports convert amounts to reporting currency (see multi-currency)

## Blocked by

- Blocked by `issues/004-financial-dashboard.md` (dashboard provides the data sources for reports)

## User stories addressed

- User story 29: Export budget reports as CSV and PDF
- User story 31: Worker cost report (admin)
