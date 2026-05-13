# [WOP-007] Collective Ticket Evaluation — Root Causes & Unified Path Forward

> 📋 **This ticket defines the phased roadmap. All task checkboxes are consolidated in `WOP-ALL-TODO.md`.** Update checkboxes there, not here.

## Executive Summary

We have **6 active tickets** tracking distinct problems. Despite their separate labels, they share **a single root cause**: code was imported from multiple external projects (server, kanban, modals, pi extensions) without systematic import path audit, and build was never enforced clean.

| Ticket | Status | Priority |
|--------|--------|----------|
| WOP-001 Docs mode routing | ✅ Done | — |
| WOP-002 Build errors + routing + kanban | 🔴 Pending | High |
| WOP-003 WS/Electron/ENOENT runtime | 🟡 Partial | High |
| WOP-004 Server architecture evaluation | 🔴 Open | Critical |
| WOP-005 App.tsx refactor | 🟡 In Progress | Medium |
| WOP-006 Pi.dev version pinning | 🟡 Pending | High |
| WOP-008 Financial system (budgets, salaries, invoicing) | 🟡 Planned (docs) | Medium |
| WOP-009 Production delivery (desktop, cloud, self-host) | 🟡 Planned (docs) | High |

---

## 1. Root Cause Analysis

### Root Cause #1: Imports Not Audited After Project Merges

Code was brought in from at least **3 external sources** without fixing import paths:

| Source | What was imported | Broken patterns |
|--------|-----------------|-----------------|
| External server project | `server/` files with `shared/`, `hooks/` refs | `shared/claw-*`, `hooks/useUiMode` don't exist in this project |
| External kanban system | `src/pages/Kanban.tsx` + `src/components/kanban/` | `../contexts/ToastContext` (with 's'), `react-router-dom`, wrong color tokens |
| WHN Chat project | `src/modals/` (Modal, ConfirmationModal, etc.) | Not wired in at all — sitting as reference files |

**Result**: 60+ TypeScript errors where the compiler can't resolve imports.

### Root Cause #2: No Build Enforcement

`bun run build` produces 60+ errors, yet development continues via `bun run dev` (which uses Vite's per-file transpilation, not `tsc`). Errors accumulated silently because nobody ran the full build.

### Root Cause #3: Server in Client Repo

`apps/wayofwork-ui/server/` is a full Bun backend living inside the frontend project. This causes:
- Shared types between server and client (broken `shared/` path)
- Vite proxy complexity for WebSocket
- Build process confusion (what does `bun run build` even build?)
- Electron preload issues from server needing Node.js in Electron renderer

### Root Cause #4: No pi.dev Version Validation

`@mariozechner/pi-coding-agent@0.72.1` is in package.json but there's no startup check. The justfile's `run-pi` target loads extensions via `pi-loader.ts` without ever verifying the pi version. When pi.dev updates and breaks the CLI interface, JSON event format, or extension API, it fails at runtime with cryptic errors.

---

## 2. Ticket Dependency Graph

```
WOP-006 (pi.dev versioning)
  └── Independent — no deps, can start now

WOP-002 Phase 1 (fix build errors)
  ├── B LOCKS: WOP-002 Phase 2-5 (routing, kanban)
  ├── B LOCKS: WOP-005 (App.tsx refactor — needs clean build)
  └── B LOCKS: WOP-004 verification (can't evaluate server until it builds)

WOP-003 (runtime: WS/ENOENT/Electron)
  ├── Partially fixed already
  └── Remaining: Electron white screen, graceful ENOENT

WOP-002 Phase 2-4 (auth + routing + header)
  └── Depends on: WOP-002 Phase 1 (build passing)

WOP-005 (App.tsx refactor)
  └── Depends on: WOP-002 Phase 1-4 (clean build + routing settled)

WOP-002 Phase 5 (kanban integration)
  └── Depends on: WOP-002 Phase 1 (build), routing, WOP-005

WOP-004 (server migration)
  └── Depends on: stabilization via WOP-002 Phase 1 + WOP-003

WOP-008 (financial system)
  ├── Depends on: Phase 0 (clean build) — needs schema + API compilation
  └── Independent of: Phases 1-6 — can run as parallel track
```

**Critical path**: Fix build errors → stabilize runtime → auth/routing → everything else.

---

## 3. Collective Solution — Unified Path Forward

### Phase 0: Import Audit & Clean Build (1 session)

**Goal**: Make `bun run build` pass with zero errors.

**Systematic approach** — not fixing individual files, but fixing the *patterns*:

1. **Audit all import paths across the project** using a script or manual pass:
   - `shared/` → find where these files actually live, update imports
   - `hooks/` → check if hooks exist or need creation
   - `types/` → check if types exist or need creation
   - `@/` → verify path alias resolves in vite.config.ts + tsconfig.json
   - `../../contexts/` (with 's') vs `../../context/` (without 's') — pick one

2. **Fix path aliases** in `vite.config.ts` and `tsconfig.json` to match reality

3. **Delete or isolate** the 3 external project remnants that aren't wired in:
   - `src/modals/` (WHN Chat refs) — keep as reference but exclude from tsconfig
   - Ported kanban files — mark as excluded until Phase 5
   - Dead server imports — fix or delete

4. **Add build check to CI** — prevent future silent accumulation

**Mark complete when**: `bun run build` emits zero errors.

---

### Phase 1: Runtime Stability (1 session)

**Goal**: App starts and chat works reliably.

1. **Wire WOP-003 fixes** that are already identified:
   - Graceful ENOENT dialog for missing pi binary
   - Better error messages in WebSocket handlers  
   - Electron white screen investigation (check React mount, CSS overflow)

2. **Add server-side health endpoint** already planned in WOP-003:
   - `GET /api/diagnostics/pi` — reports pi binary status
   - `GET /api/diagnostics/ws` — WebSocket health

**Mark complete when**: App starts without crashes, chat works, Electron renders.

---

### Phase 2: Unified Auth & Routing (1-2 sessions)

**Goal**: All users enter via `/login`, role-based routing, consistent headers.

1. **Wire `LoginPage.tsx` into `App.tsx`** with AuthGate (WOP-002 Phase 2)
2. **Role-based redirect** after login
3. **Header visibility matrix** (WOP-002 Phase 3)
4. **Navigation inside MenuBar** (WOP-002 Phase 4)

**Mark complete when**: Auth flow works for all 5 roles, headers consistent per route.

---

### Phase 3: App.tsx Refactor (1-2 sessions)

**Goal**: App.tsx reduced from 4826 to ~200 lines.

1. Extract 4 hooks (`useAppState`, `useAppEffects`, `useAppHandlers`, `useAppMenus`)
2. Extract 4 page shells (`ClawPage`, `DocsPage`, `WorkPage`, `SimplePage`)
3. Thin App.tsx to coordinator with `switch(uiMode)`

**Note**: This is now SAFER because:
- Build passes (Phase 0) → extracted files compile
- Auth/routing is settled (Phase 2) → App.tsx's routing logic won't change underneath the extraction

---

### Phase 4: Pi.dev Version Pinning & Startup Logging (1 session, parallel-safe)

**Goal**: Never get surprised by a pi.dev update breaking the system.

1. `scripts/pi-version-check.sh` — validates `pi --version` against `PI_PINNED_VERSION`
2. `scripts/pi-startup-log.sh` — logs all 14+ integration points
3. `just pi-verify`, `just pi-log`, `just pi-fix-version` justfile targets
4. Wire into `start-wayofpi.sh` and `start-wayofpi-electron.sh`

**Parallel-safe**: Can start alongside any phase since it only adds validation, doesn't change existing code.

---

### Phase 5: Full Kanban Integration (1-2 sessions)

**Goal**: The full-featured Kanban system works alongside the simplified WorkBoard.

1. Fix import paths in `src/pages/Kanban.tsx` and `src/components/kanban/`
2. Migrate color scheme to Way of Pi theme
3. Replace `react-router-dom` with `window.location.pathname`
4. Wire into App.tsx routing

**Last phase**: Kanban is additive — it doesn't fix any existing broken functionality. Do it last.

---

### Phase 6: SDK-Based Architecture — Eliminate Subprocess Layer (Future)

**Community Extensions**: During SDK migration, also replace in-app implementations with pi.dev community extensions. See `docs/ARCHITECTURE_TARGET.md §12` for the full mapping:

| In-app code | Replacement | Lines saved |
|---|---|---|
| `MarkdownPreviewPane.tsx` + `MermaidPreviewPane.tsx` | `pi-markdown-preview` (omaclaren) or `pi-mermaid` (Gurpartap) | ~600 |
| Web fetch utilities in `src/utils/` + server proxy | `pi-web-access` (nicobailon) — web search, URL extract, YouTube, GitHub clone | ~500 |
| Inline user prompt dialogs | `@juicesharp/rpiv-ask-user-question` — structured multi-question forms | ~300 |
| `ProblemsPanelBody.tsx` + lint/format integration | `pi-lens` (apmantza) — 37 LSP servers, 26 formatters, 180+ rules | ~600+ |
| **Total** | | **~2000+** |

Install via `pi install npm:<name>`. These extensions run in the pi.dev agent session, not in React — the UI becomes a thinner display surface.

**Architectural Insight**: pi.dev isn't just a CLI — it provides an **SDK** that can be imported directly:

```
@earendil-works/pi-coding-agent   → createAgentSession(), AuthStorage, ModelRegistry, tools
@earendil-works/pi-ai             → stream(), complete(), getModel(), Context — LLM toolkit
@earendil-works/pi-agent-core     → Agent, AgentState, agentLoop() — agent framework
```

**Current architecture** (subprocess-based):
```
React UI → Bun server → spawn pi --mode json → parse JSON stream → ENOENT, format drift, fragile
```

**Target architecture** (SDK-based):
```
React UI → Bun server → import createAgentSession() → typed events → stable, no subprocess

Shared "root" dependency:
apps/
├── wayofwork-ui/         → imports @earendil-works/pi-coding-agent
├── another-ui/         → imports @earendil-works/pi-coding-agent (same version, same root)
└── package.json        → "@earendil-works/pi-coding-agent": "0.74.0" (single source of truth)
```

**Benefits**:
- No `pi --mode json` subprocess → no ENOENT, no JSON stream format drift
- Typed event stream (`AgentSessionEvent`) instead of fragile line-by-line JSON parsing
- Version pinning is just `package.json` — no separate install script needed
- Multiple UIs share the same pi.dev version at workspace root
- Eliminates the entire `pi-binary.ts`, `pi-json-mode-chat.ts`, `pi-agent-runtime.ts` surface area

**When to do this**: After Phases 0-3 stabilize the existing code. The SDK migration replaces the fragile parts of the server without changing the UI. It's a refactor of `server/pi-*-.ts` files, not the frontend.

**This changes the WOP-006 (pi.dev versioning) approach**: Instead of a shell script that checks `pi --version`, the version is pinned in `package.json` and enforced by the lockfile — exactly how npm dependencies are supposed to work.

---

## 4. Effort Summary

| Phase | Name | Sessions | Parallel |
|-------|------|----------|----------|
| 0 | Import audit & clean build | 1 | No — prerequisite |
| 1 | Runtime stability | 1 | No — after build passes |
| 2 | Unified auth & routing | 1-2 | No — after runtime stable |
| 3 | App.tsx refactor | 1-2 | No — after auth settled |
| 4 | Pi.dev version pin (lightweight) | <1 | **Yes** — can run parallel |
| 5 | Kanban integration | 1-2 | No — last of core |
| 6 | SDK migration (eliminate subprocess) | 2-3 | No — after 0-3 stable |
| 7 | **Financial system** (7 slices) | 4-6 | **Yes** — parallel track can start after Phase 0 |

**Total**: 6-9 sessions for core path + 4-6 for financial system (parallel). Phase 4 can overlap with any phase.

> **Note on Phase 4 vs Phase 6**: Phase 4 is the fast safety net — pin version in `package.json`, add lockfile enforcement, done. Phase 6 is the deeper architectural fix — switch from `pi --mode json` subprocess to `import { createAgentSession }` from the SDK, which eliminates the entire fragile subprocess layer and makes version pinning automatic through npm.

---

## 5. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Phase 0 takes longer than expected | Focus on most-impactful errors first, exclude dead code from build |
| Electron white screen needs deep Electron expertise | Fall back to web-only mode (`start-wayofpi.sh --web`) as working alternative |
| Auth refactor breaks existing pages | Keep old routing paths working during transition (dual-mode routing) |
| Pi.dev ships another breaking update during work | Phase 4 (version pin) can be implemented in one sitting and protects against this |
| Server extraction (Phase 6) never happens | The in-place architecture is workable if build passes and runtime is stable — migration is optional |
| Financial system scope creep | 7 well-defined slices in `issues/`, each demoable independently — prevents unbounded expansion |
| Financial system conflicts with Phase 2-3 refactors | Additive by design — reads existing data, doesn't modify time tracking or project structure |

---

## 6. Recommendation

**Start with Phase 0 (import audit + clean build) immediately.** It unblocks every other ticket. Currently WOP-002, WOP-005, WOP-004, and WOP-008 (financial system) all depend on a clean build, and every session so far has included "fix import paths" as incidental work that should be systematic.

**Run Phase 4 (pi.dev versioning) in parallel** — it's independent, high-impact, and takes one session. Without it, tomorrow's pi.dev update could undo all other progress.

**Start financial system (WOP-008) after Phase 0** as a parallel track — it's additive, doesn't depend on auth/routing/App.tsx refactors, and can be demoed incrementally slice by slice.

---

---

## 7. Financial System — Budgets, Salaries, Invoicing (Future)

> **PRD**: `issues/prd-financial-system.md`
> **Issues**: `issues/001-worker-financial-profiles.md` through `issues/007-financial-reports.md`

A parallel workstream that adds financial tracking to the existing project/time tracking system. Designed as **additive** — it reads but never modifies existing time entries, projects, or kanban data.

### Architecture at a Glance

```
Worker Profiles (hourly_rate, monthly_salary, billing_rate)
  └── feeds into →
        Budget Engine (propose/approve lifecycle, cost calc from time × rate + expenses)
          └── feeds into →
                Dashboard (summary cards, charts, burn rate, role-filtered)
                Invoice System (aggregate billable time × billing_rate + expenses → PDF)
                Reports (CSV + PDF export)
```

### 7 Slices (from PRD)

| # | Slice | Depends on | Key user stories |
|---|-------|-----------|-----------------|
| 1 | **Worker Financial Profiles** — hourly_rate, monthly_salary, billing_rate, salary_allocation per worker | Phase 0 (clean build) | Admin sets rates, worker views own |
| 2 | **Budget Engine** — propose/approve lifecycle, cost calc, alert thresholds | 1 | PM proposes, admin approves, spend auto-calculates |
| 3 | **Expense Tracking** — manual line items + receipt upload + PM approval | 2 | Worker submits, PM approves, cost hits budget |
| 4 | **Financial Dashboard** — summary cards, charts, burn rate, role-filtered | 2, 3 | PM/admin see budget health at a glance |
| 5 | **Invoice System** — generation, PDF, lifecycle (Draft→Paid), partial payments | 2, 3 | Bill clients from time × billing_rate + expenses |
| 6 | **Multi-Currency** — exchange rates (manual + API), reporting currency | 1, 2, 3, 5 (currency fields) | Global reporting currency conversion |
| 7 | **Financial Reports** — budget + worker-cost CSV/PDF export | 4 | Export for meetings/analysis |

### When to Start

After Phase 0 (clean build). The financial system is **additive** — it doesn't depend on auth/routing refactors (Phase 2), App.tsx refactor (Phase 3), or SDK migration (Phase 6). It can run in parallel with Phases 1–6.

### Effort

~4-6 sessions total across all 7 slices. Slices 1-3 are foundational; 4-7 build on them. Multi-currency (slice 6) is cross-cutting and can be woven in during earlier slices.

### Schema

New tables: `worker_financial_profiles`, `budgets`, `budget_adjustments`, `expenses`, `invoices`, `invoice_payments`, `exchange_rates`

Extended tables: `projects` (link to budgets), `time_entries` (add `billable` flag), `users` (link to financial profile)

---

**Created**: 2026-05-08
**Updated**: 2026-05-08
**Status**: Evaluation complete — financial system scoped in Section 7
