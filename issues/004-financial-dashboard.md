## Parent PRD

`issues/prd-financial-system.md`

## What to build

A financial dashboard accessible from the main navigation. Shows summary cards (total allocated, spent, remaining, burn rate), a per-project budget table, and charts (spend-over-time, budget-vs-actual, expense breakdown). Role-filtered: admins see all projects, PMs see their projects only.

## Acceptance criteria

- [ ] `GET /api/financial/dashboard` returns dashboard data: summary stats (aggregated), per-project budget rows with computed fields, chart data series
- [ ] Dashboard filters by admin role (all projects) vs PM role (managed projects only)
- [ ] Dashboard summary cards: allocated (total), spent (total), remaining (total), burn rate (monthly avg), projects at risk (count)
- [ ] Per-project budget table: project name, allocated, spent, remaining, % used, status badge (on track / at risk / over budget), alert icon if thresholds triggered
- [ ] Spend-over-time line chart (monthly spend for last 12 months)
- [ ] Budget-vs-actual bar chart (allocated vs spent per project)
- [ ] Expense breakdown pie chart (by category)
- [ ] Dashboard page accessible from main nav for admin/PM roles
- [ ] Loading skeleton while data loads
- [ ] Responsive: cards stack on mobile, table scrolls horizontally
- [ ] Drill-down: clicking a project row navigates to that project's detail with budget/expense tabs

## Blocked by

- Blocked by `issues/002-budget-engine.md` (budget data source)
- Blocked by `issues/003-expense-tracking.md` (expense data source for charts)

## User stories addressed

- User story 27: PM sees financial dashboard for their projects
- User story 28: Admin sees global financial dashboard
- User story 30: Burn rate view (monthly spend vs monthly target)
