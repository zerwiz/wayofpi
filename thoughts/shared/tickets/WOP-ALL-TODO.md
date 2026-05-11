# Way of Pi — Master Combined TODO

Sourced from WOP-001 through WOP-018. Organized by phased app-separation roadmap.

---

## 🛠️ Recurring Maintenance

- [x] **Always update `CHANGELOG.md`** after every session or major task completion.

---

## Architecture — App Separation (FINAL)

```
Root: Way of Pi (project)
├── apps/wayofpi/               →  "Way of Pi"
│   ├── technicalIDE/           →  Standalone Technical coding IDE (port 5174)
│   └── server/                 →  Bun proxy server port 3334 → 3333
├── apps/wayofwork-ui/          →  "Way of Work" — Main app: Claw, Simple, Docs, Work (includes API server at server/)
├── apps/workerportal/          →  Worker self-service portal
└── apps/clientportal/          →  Future: client-facing portal
```

**Naming rule**: "Way of Pi" = Technical IDE only (`apps/wayofpi/`). Everything else = "Way of Work".

**Note**: `apps/wayofwork-server/` was removed — it was a stale bun bundle cache from an older architecture. The server lives at `apps/wayofwork-ui/server/`.

---

## Division of Labor

| Agent | Responsibility |
|-------|---------------|
| **OpenCode agent** | Track C: Technical IDE (WOP-016), Phase 2 routing (WOP-011), wiring, App.tsx thinning, Phase 4 SDK Migration, Phase 5 Version Pinning, Phase 6 Kanban Integration, Phase 7 ÄTA Tickets, Phase 8 Claw Leadership |

---

## Phase 0: Clean Build — DONE ✅

---

## Phase 1: Runtime Stability — DONE ✅

---

## Phase 2: Agentic OS Shell & Unified Routing (WOP-011) — DONE ✅

- [x] Implement `react-router-dom` in `main.tsx`
- [x] Create `AppShell.tsx` root layout (Initial version created)
- [x] Map Subsystem Routes (`/ide`, `/kanban`, `/ata`)
- [x] AuthGate with deep linking
- [x] Role-Adapted Header Matrix

---

## Phase 3: App Separation — ALL DONE ✅

### Track C: Technical IDE Standalone App (WOP-016) — DONE ✅
- [x] Scaffold `apps/wayofpi/technicalIDE/` directory
- [x] All source files created
- [x] Path aliases configured
- [x] Server proxy (port 3334 → 3333)
- [x] Build passing
- [x] Way of Pi is fully standalone

### Track D: Rename wayofpi-ui → wayofwork-ui (WOP-017) — DONE ✅
- [x] Rename directory + all references

### Track E: Rename wayofpi-server → wayofwork-server (WOP-018) — DONE ✅
- [x] Rename directory + all references

### Track A: Logic & Hooks Extraction — DONE ✅
- [x] Modal Extraction (useModalState.ts)
- [x] Workspace Logic (useWorkspaceActions.ts)
- [x] Editor Logic (useEditorCommandHandlers.ts)
- [x] Navigation Logic (useNavigationHandlers.ts)

### Track B: Page Shells — DONE ✅
- [x] Docs Shell, Work Shell, Claw Shell, ModalsRenderer, IdeLayout
- [x] Simple Shell (SimplePage.tsx) stabilized and build fixed.

### TechnicalIDE Cleanup — DONE ✅
- [x] Remove dead Technical-specific imports from App.tsx
- [x] Remove dead Technical-specific state from AppShellInternal
- [x] App.tsx thinned to 53 lines! 🎯

---

## Phase 4: SDK Migration (WOP-004) — DONE ✅ (OpenCode)

- [x] `pi-sdk-runtime.ts` existed and was already wired (SDK imported via `@earendil-works/pi-coding-agent`)
- [x] `WOP_CHAT_ENGINE=sdk` set in `.env` (was `auto`, now SDK is default)
- [x] Legacy subprocess files (`pi-json-mode-chat.ts`, `pi-binary.ts`, original `pi-agent-runtime.ts`) moved to `ref/server/`
- [x] `pi-agent-runtime.ts` simplified — SDK-only, no subprocess fallback
- [x] `diagnostics.ts` no longer depends on `pi-binary.ts` (inlined probe logic)
- [x] `ngrok-binary.ts` inlines tilde expansion instead of importing from `pi-binary.ts`
- [x] Stale `apps/wayofwork-server/` bun cache directory removed
- [x] `bun run build` passes ✅

---

## Phase 5: Pi.dev Version Pinning (WOP-006) — DONE ✅ (OpenCode)

- [x] `scripts/pi-startup-log.sh` created — checks 10 integration points (binary, version, SDK, ExtensionAPI, JSON mode, PI_STACK, pi-loader, agents, sessions, engine mode)
- [x] `just pi-log` target added to justfile
- [x] `logs/` dir added to `.gitignore`
- [x] Wired into `start-wayofpi.sh` and `start-wayofpi-electron.sh` (non-blocking warnings)
- [x] `scripts/pi-version-check.sh` already existed (Phase 1)
- [x] `PI_PINNED_VERSION=0.74.0` already in `.env` (Phase 1)

---

## Phase 6: Full Kanban Integration (WOP-010) — DONE ✅ (OpenCode)

- [x] Fixed 550 TS errors across 19 kanban files
- [x] Extended type definitions (Board, BoardCard, BoardColumn, DriveFile, CardCover)
- [x] Created mock services (mockNotesService, mockDriveService, mockTasksService, mockCalendarService, mockProjectsService, mockDevelopmentWorkflowService, mockWorkflowsService)
- [x] Created contexts (ToastContext, AuthContext)
- [x] Created missing type files (projects, workflows, nsrCompliance) and component stubs (NSRFolderBadge, NSRComplianceBadge)
- [x] Fixed source files: await, implicit any, import paths, ConfirmationModal imports
- [x] Removed kanban from tsconfig.app.json exclude list
- [x] `bun run build` passes ✅

---

## Phase 7: ÄTA Construction ERP (WOP-012) — DONE ✅ (OpenCode)

- [x] `shared/ticket-types.ts` already existed (TypeScript interfaces)
- [x] `tickets`, `time_blocks`, `time_sessions`, `price_lists` tables added to `db.ts`
- [x] `server/tickets-api.ts` — 20+ API endpoints: CRUD tickets, submit/review/approve/reject/lock/invoice workflow, time-blocks CRUD, time-sessions check-in/out, price-lists CRUD, reports (weekly-summary, project-budget, ticket-status), approved-tickets listing
- [x] Wired into `server/index.ts` `handleApi()` as a modular route handler
- [x] `src/hooks/useTicketApi.ts` — frontend API hook for all ticket endpoints
- [x] DB path fixed from stale `wayofwork-server/db/` to `data/`
- [x] `bun run build` passes ✅

---

## Phase 8: Claw Leadership Modules (WOP-015) — DONE ✅ (OpenCode)

- [x] Module stubs already existed in `clawUserUiModules.tsx`
- [x] **Review module** wired: fetches `pending_review` tickets via API, approve/reject buttons, status stats counts
- [x] **Financials module** wired: fetches `/api/reports/project-budget`, shows active project count + total hours breakdown
- [x] **Office module** wired: fetches `/api/invoices/approved-tickets`, lists tickets ready for invoicing
- [x] **Compliance module** wired: fetches `/api/time-sessions/active`, shows currently checked-in workers
- [x] All modules use `useTicketApi.ts` hook for API calls
- [x] `bun run build` passes ✅

---

## Phase 9: Production Delivery (WOP-009) — FOR OTHER AGENT

---

## Completed

- WOP-001, WOP-003, WOP-005 — terminal persistence
- WOP-011 — Agentic OS Shell & Unified Routing — **DONE ✅**
- WOP-016 Technical IDE extraction — **DONE ✅**
- WOP-017 Rename wayofpi-ui → wayofwork-ui — **DONE ✅**
- WOP-018 Rename wayofpi-server → wayofwork-server — **DONE ✅**
- WOP-004 Phase 4 SDK Migration — **DONE ✅** (OpenCode)
- WOP-006 Phase 5 Pi.dev Version Pinning & Startup Logging — **DONE ✅** (OpenCode)
- WOP-012 Phase 7 ÄTA Ticket System — **DONE ✅** (OpenCode)
- WOP-015 Phase 8 Claw Leadership Modules — **DONE ✅** (OpenCode)
- WOP-010 Phase 6 Full Kanban Integration — **DONE ✅** (OpenCode)

_Generated from WOP-001 through WOP-018. Update this file when tickets change._
