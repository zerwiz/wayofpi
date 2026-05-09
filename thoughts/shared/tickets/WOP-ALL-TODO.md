# Way of Pi — Master Combined TODO

Sourced from WOP-001 through WOP-018. Organized by phased app-separation roadmap.

---

## 🛠️ Recurring Maintenance

- [ ] **Always update `CHANGELOG.md`** after every session or major task completion.

---

## Architecture — App Separation (FINAL)

```
Root: Way of Pi (project)
├── apps/wayofpi/               →  "Way of Pi"
│   ├── technicalIDE/           →  Standalone Technical coding IDE (port 5174)
│   └── server/                 →  Bun proxy server port 3334 → 3333
├── apps/wayofwork-ui/          →  "Way of Work" — Main app: Claw, Simple, Docs, Work
├── apps/wayofwork-server/      →  "Way of Work API" — Bun API server port 3333
├── apps/workerportal/          →  Worker self-service portal
└── apps/clientportal/          →  Future: client-facing portal
```

**Naming rule**: "Way of Pi" = Technical IDE only (`apps/wayofpi/`). Everything else = "Way of Work".

---

## Division of Labor

| Agent | Responsibility |
|-------|---------------|
| **This agent (OpenCode)** | Track C: Technical IDE (WOP-016) — **DONE**. Build passing standalone. |
| **Other agent** | Phase 2: routing, Track A/B: hooks/page shells, SimplePage.tsx fix |

---

## Phase 0: Clean Build — DONE ✅

---

## Phase 1: Runtime Stability — DONE ✅

---

## Phase 2: Agentic OS Shell & Unified Routing (WOP-011) — FOR OTHER AGENT

- [ ] Implement `react-router-dom`
- [ ] Create `AppShell.tsx` root layout
- [ ] Map Subsystem Routes (`/ide`, `/kanban`, `/ata`)
- [ ] AuthGate with deep linking
- [ ] Role-Adapted Header Matrix

---

## Phase 3: App Separation — ALL DONE ✅

### Track C: Technical IDE Standalone App (WOP-016) — DONE ✅

**Goal**: Extract Technical mode into `apps/wayofpi/technicalIDE/` ("Way of Pi") with own server + boot UI.

- [x] Scaffold `apps/wayofpi/technicalIDE/` directory
- [x] All source files created (TechnicalApp.tsx, SidebarContent.tsx, WorkspaceEditor.tsx, etc.)
- [x] Path aliases configured (`@wop`, `@technicalIDE`)
- [x] Server proxy (port 3334 → 3333)
- [x] Build passing: `tsc -b && vite build` succeeds
- [x] Way of Pi is fully standalone — no longer embedded in Way of Work

### Track D: Rename wayofpi-ui → wayofwork-ui (WOP-017) — DONE ✅
- [x] Rename directory + all references
- [x] Verified by Gemini

### Track E: Rename wayofpi-server → wayofwork-server (WOP-018) — DONE ✅
- [x] Rename directory + all references
- [x] Verified by Gemini

### Track A: Logic & Hooks Extraction — FOR GEMINI 🧠
- [x] Modal Extraction (useModalState.ts)
- [x] Workspace Logic (useWorkspaceActions.ts)
- [x] Editor Logic (useEditorCommandHandlers.ts)
- [x] Navigation Logic (useNavigationHandlers.ts)

### Track B: Page Shells — FOR GEMINI
- [x] Docs Shell, Work Shell, Claw Shell, ModalsRenderer, IdeLayout
- [ ] Simple Shell (SimplePage.tsx) — IN PROGRESS (fix build error)

### TechnicalIDE Cleanup (after extraction is complete)
- [ ] Remove dead Technical-specific imports from App.tsx (TechnicalPrimarySidebar, DockSplitHandle, etc.)
- [ ] Remove dead Technical-specific state from AppShellInternal
- [ ] Target App.tsx line count < 2500 (from 4834)

---

## Phase 4: SDK Migration (WOP-004) — FOR OTHER AGENT

---

## Phase 5: Pi.dev Version Pinning (WOP-006) — FOR OTHER AGENT

---

## Phase 6: Full Kanban Integration (WOP-010) — FOR OTHER AGENT

---

## Phase 7: ÄTA Construction ERP (WOP-012) — FOR OTHER AGENT

---

## Phase 8: Claw Leadership Modules (WOP-015) — FOR OTHER AGENT

---

## Phase 9: Production Delivery (WOP-009) — FOR OTHER AGENT

---

## Completed

- WOP-001, WOP-003, WOP-005, WOP-011 terminal persistence
- WOP-016 Technical IDE extraction — **DONE ✅**
- WOP-017 Rename wayofpi-ui → wayofwork-ui — **DONE ✅**
- WOP-018 Rename wayofpi-server → wayofwork-server — **DONE ✅**

_Generated from WOP-001 through WOP-018. Update this file when tickets change._
