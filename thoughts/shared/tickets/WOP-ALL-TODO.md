# Way of Pi — Master Combined TODO

Sourced from WOP-001 through WOP-018. Organized by phased app-separation roadmap.

---

## 🛠️ Recurring Maintenance

- [ ] **Always update `CHANGELOG.md`** after every session or major task completion.

---

## Architecture — App Separation

```
Root: Way of Pi (project)
├── apps/wayofpi/
│   ├── technicalIDE/       →  "Way of Pi"        — Technical coding IDE (this agent)
│   └── server/              →  "Way of Pi API"    — Bun proxy server port 3334 → 3333
├── apps/wayofwork-ui/       →  "Way of Work"      — Main app: ÄTA tickets, portals (RENAMED from wayofpi-ui)
├── apps/wayofwork-server/   →  "Way of Work API"  — Backend API server (RENAMED from wayofpi-server)
├── apps/workerportal/       →  "Worker Portal"    — Worker self-service portal (exists)
└── apps/clientportal/       →  "Client Portal"    — Future: client-facing portal
```

**Naming rule**: "Way of Pi" = Technical IDE only (`apps/wayofpi/`). Everything else = "Way of Work".

---

## Division of Labor

| Agent | Responsibility |
|-------|---------------|
| **This agent (OpenCode)** | Track C: Technical IDE (WOP-016), wiring, App.tsx thinning |
| **Other agent** | Track D/E: Renaming (WOP-017, WOP-018), Track A/B: hooks/page shells, Phase 2: routing |

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

## Phase 3: App Separation ⭐ THIS AGENT

### Track C: Technical IDE Standalone App (WOP-016) — THIS AGENT 🔧

**Goal**: Extract Technical mode into `apps/wayofpi/technicalIDE/` ("Way of Pi") with own server + boot UI. Removes ~1000+ lines from App.tsx.

- [x] Scaffold `apps/wayofpi/technicalIDE/` directory
- [x] Create `src/main.tsx` with boot screen entry
- [x] Create `src/boot/BootScreen.tsx`
- [x] Create `src/App.tsx` — ErrorBoundary wrapper
- [x] Create `apps/wayofpi/server/index.ts` — port 3334, WS+HTTP proxy
- [x] Create `src/layout/SidebarContent.tsx`, `WorkspaceEditor.tsx`
- [x] Path aliases: `@technicalIDE`, `@wop`
- [x] TechnicalApp.tsx — state hooks, handlers, menu definitions, debug, keyboard handler (~1475 lines)
- [ ] TechnicalApp.tsx — remaining dock/git/explorer/zebstrip/commandItems handlers
- [ ] TechnicalApp.tsx — return/render JSX block (~500 lines)
- [ ] Wire TechnicalApp into App.tsx — replace inline Technical return block
- [ ] Verify build passes in both apps

### Step 4: Final Thinning — THIS AGENT
- [ ] Wire TechnicalApp into App.tsx
- [ ] Remove dead logic and unused imports from App.tsx
- [ ] Target line count < 250 lines

---

## Phase 3b: Renaming — FOR OTHER AGENT

### Track D: Rename wayofpi-ui → wayofwork-ui (WOP-017)
- [ ] Rename directory `apps/wayofpi-ui/` → `apps/wayofwork-ui/`
- [ ] Update all references (~50-60 files)
- [ ] Verify build passes

### Track E: Rename wayofpi-server → wayofwork-server (WOP-018)
- [ ] Rename directory `apps/wayofpi-server/` → `apps/wayofwork-server/`
- [ ] Update all references (~10-15 files)
- [ ] Verify build passes

### Track A: Logic & Hooks Extraction — FOR OTHER AGENT 🧠
- [x] Modal Extraction (useModalState.ts)
- [x] Workspace Logic (useWorkspaceActions.ts)
- [ ] Editor Logic (useEditorCommandHandlers.ts)
- [ ] Navigation Logic (useNavigationHandlers.ts)

### Track B: Page Shells — FOR OTHER AGENT
- [x] Docs Shell, Work Shell, Claw Shell, ModalsRenderer, IdeLayout
- [ ] Simple Shell (SimplePage.tsx)

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

_Generated from WOP-001 through WOP-018. Update this file when tickets change._
