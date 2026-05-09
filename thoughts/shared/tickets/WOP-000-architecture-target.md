# Target Architecture — Way of Pi & The pi.dev Platform

> **Date**: 2026-05-08
> **Status**: Target state (not yet implemented)
> **Purpose**: Defines what the new backend and program will be capable of after completing the phased migration outlined in WOP-007.

---

## 1. Architectural Vision

**One-line summary**: Way of Pi is a multi-app UI platform sitting on top of the [pi.dev](https://pi.dev) SDK, consuming `@earendil-works/pi-coding-agent` as a direct TypeScript dependency — not as a subprocess.

```
                   ┌──────────────────────────────────────────────────┐
                   │              apps/ (workspace root)              │
                   │                                                  │
                   │  ┌─────────────────┐  ┌─────────────────┐       │
                   │  │   wayofpi-ui    │  │   another-ui     │  ...  │
                   │  │  (React/Electron)│  │  (React/Web)    │       │
                   │  └──────┬──────────┘  └──────┬──────────┘       │
                   │         │                     │                  │
                   │         └─────────┬───────────┘                  │
                   │                   │                              │
                   │         ┌─────────▼──────────┐                   │
                   │         │  shared package.json │                 │
                   │         │  @earendil-works/    │                 │
                   │         │  pi-coding-agent:    │                 │
                   │         │  0.72.1 (pinned)     │                 │
                   │         └──────────────────────┘                 │
                   └──────────────────────────────────────────────────┘
                                      │
                    imports createAgentSession(), AuthStorage, etc.
                                      │
                   ┌──────────────────▼──────────────────────────────┐
                   │           Bun Server (per-app or shared)        │
                   │                                                  │
                   │  ┌────────────────────────────────────────────┐  │
                   │  │  SDK Integration Layer                      │  │
                   │  │  - createAgentSession() → typed events     │  │
                   │  │  - AuthStorage + ModelRegistry              │  │
                   │  │  - SessionManager + SettingsManager         │  │
                   │  │  - ResourceLoader (extensions, skills)      │  │
                   │  └────────────────────────────────────────────┘  │
                   │                                                  │
                   │  ┌────────────────────────────────────────────┐  │
                   │  │  Application Layer                          │  │
                   │  │  - HTTP API (/api/*)                        │  │
                   │  │  - WebSocket (/ws)                          │  │
                   │  │  - JWT Auth                                 │  │
                   │  │  - SQLite DB                                │  │
                   │  │  - Workspace management                     │  │
                   │  │  - Claw automation                          │  │
                   │  └────────────────────────────────────────────┘  │
                   └──────────────────────────────────────────────────┘
```

### Key architectural properties

| Property | Current (broken) | Target (stable) |
|----------|-----------------|-----------------|
| pi.dev integration | `spawn("pi --mode json")` subprocess | `import { createAgentSession }` SDK |
| Event streaming | Parse JSONL lines from stdout | Typed `AgentSessionEvent` subscription |
| Version pinning | Must check `pi --version` manually | `package.json` exact version + lockfile |
| Build status | 60+ errors, `bun run build` fails | Zero errors, CI-enforced |
| Server location | Inside `apps/wayofpi-ui/server/` | Clean separation (shared lib or standalone) |
| Auth | Inline login forms per page | Unified `/login` + AuthGate for all roles |
| App.tsx | 4826-line monolith | ~200-line coordinator + hooks + page shells |
| Multiple UIs | Not possible | `apps/<name>/` each imports the same pi.dev SDK |
| Kanban | Ported but broken imports | Fully integrated, themed, routed |
| Startup robustness | No version check, ENOENT on missing pi | Version-validated, health-checked, logged |

---

## 2. Backend Architecture (Target)

### 2.1 SDK Integration Layer — Replaces Current Subprocess Bridge

The single most impactful change. Instead of:

```typescript
// CURRENT: spawn pi --mode json, parse stdout line-by-line (fragile)
const proc = Bun.spawn(["pi", "--mode", "json", prompt], ...);
const lines = await new Response(proc.stdout).text();
for (const line of lines.split("\n")) {
  const event = JSON.parse(line); // format changes on pi.dev update → silent breakage
}
```

The target uses the SDK directly:

```typescript
// TARGET: import pi.dev SDK, typed events, no subprocess
import { createAgentSession, AuthStorage, ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent";
import { getModel } from "@earendil-works/pi-ai";

const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);
const model = getModel("anthropic", "claude-sonnet-4-20250514");

const { session } = await createAgentSession({
  model,
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
});

session.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      // typed deltas — no fragile JSON parsing
      break;
    case "tool_execution_start":
      // typed tool events
      break;
  }
});

await session.prompt(userMessage);
```

#### What this eliminates

| Current server file | Lines | Problem | Target |
|-------------------|-------|---------|--------|
| `server/pi-binary.ts` | 108 | Binary discovery, PATH hacks, fallback chain | Deleted — SDK imported directly |
| `server/pi-json-mode-chat.ts` | 245 | JSONL stream parsing, timeout mgmt | Deleted — SDK typed events |
| `server/pi-agent-runtime.ts` | 176 | Chat engine routing (pi vs bun vs auto) | Simplified to one path |
| `server/orchestrator-tools-exec.ts` | 390+ | `executeToolViaPi()` subprocess delegation | Deleted — tools run in-process |

**Net reduction**: ~800+ lines of fragile server code removed.

#### What is retained

| Server file | Purpose | Status |
|-------------|---------|--------|
| `server/index.ts` | HTTP + WebSocket server | Retained |
| `server/auth.ts` | JWT auth | Retained |
| `server/db.ts` | SQLite | Retained |
| `server/chat.ts` | LLM completion fallback | Simplified |
| `server/chat-orchestrator-tools.ts` | Tool loop | SDK replaces this |
| `server/session-prompts.ts` | System prompt composition | Retained (wraps SDK) |
| `server/agents.ts` | Agent .md scanning | Retained |
| `server/workspace-*.ts` | Workspace management | Retained |
| `server/claw-*.ts` | Claw automation | Retained |
| Server WebSocket | Chat streaming proxy | Simplified — SDK events mapped to WS |

### 2.2 Application Layer

The application layer provides Way of Pi-specific features on top of the pi.dev SDK:

#### Authentication & Multi-Tenancy

```
/login (unified)
  ├── JWT token issued by server/auth.ts
  ├── Role determines redirect:
  │   ├── CLIENT       → /client
  │   ├── WORKER/LEADER → /portal
  │   ├── ADMIN        → /admin or /
  │   └── SUPER_ADMIN  → /
  └── AuthGate in App.tsx wraps all routes
```

#### API Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `POST /api/login` | JWT auth | ✅ Exists |
| `GET /api/config` | Server config + pi status | ✅ Exists |
| `POST /api/config` | Toggle piDrivesChat | ✅ Exists |
| `GET /api/client/*` | Client dashboard (multi-tenant) | ✅ Exists |
| `GET /api/worker/*` | Worker portal APIs | ✅ Exists |
| `GET /api/diagnostics/pi` | Pi SDK health check | 🔶 New |
| `GET /api/diagnostics/ws` | WebSocket health | 🔶 New |
| `GET /api/diagnostics/*` | Full system diagnostics | 🔶 New |
| `POST /api/session/*` | Session management via SDK | 🔶 New |

#### WebSocket Protocol

```
Client → Server (/ws):
  { type: "chat", message: "..." }
  { type: "steer", message: "..." }
  { type: "followUp", message: "..." }
  { type: "abort" }

Server → Client (/ws):
  { type: "text_delta", delta: "..." }          // SDK: message_update → text_delta
  { type: "thinking_delta", delta: "..." }      // SDK: thinking_delta
  { type: "tool_start", name: "...", args: {} } // SDK: tool_execution_start
  { type: "tool_delta", delta: "..." }          // SDK: tool_execution_update
  { type: "tool_end", name: "...", result: {} } // SDK: tool_execution_end
  { type: "error", message: "..." }             // SDK: error
  { type: "done" }                              // SDK: agent_end
```

### 2.3 Multi-App Architecture

`apps/` contains independent UIs that all consume the same pi.dev SDK:

```
apps/
├── package.json                    # Shared workspace config
├── tsconfig.base.json              # Shared TypeScript config
│
├── wayofpi-ui/                     # Main desktop app (Electron + React)
│   ├── server/                     # Bun API + WebSocket
│   ├── src/                        # React components
│   ├── electron/                   # Electron shell
│   └── package.json
│
├── wayofpi-server/                 # Standalone Bun server (deployable)
│   ├── src/                        # Server source
│   └── package.json
│
├── workerportal/                   # Worker portal (lighter UI)
│   ├── src/
│   └── package.json
│
└── another-ui/                     # Future app
    ├── src/
    └── package.json
```

Each app imports from `@earendil-works/pi-coding-agent` at the workspace root. One pinned version serves all.

---

## 3. Frontend Architecture (Target)

### 3.1 App.tsx — Thin Coordinator

```
src/
├── App.tsx                         # ~200 lines (was 4826)
│   ├── Calls useAppState()         # → state
│   ├── Calls useAppEffects()       # → effects
│   ├── Calls useAppHandlers()      # → handlers
│   ├── Calls useAppMenus()         # → menus
│   └── switch(uiMode):
│       ├── "claw"    → <ClawPage />
│       ├── "docs"    → <DocsPage />
│       ├── "work"    → <WorkPage />
│       └── "simple"  → <SimplePage />
```

### 3.2 Routing & Auth

```
App.tsx
├── AuthGate: check JWT → redirect to /login if invalid
├── window.location.pathname routing:
│   ├── /login       → <LoginPage /> (no header)
│   ├── /client      → <ClientDashboard /> (Portal Header)
│   ├── /portal      → <WorkerPortal /> (Portal Header)
│   ├── /admin       → <AdminPage /> (Global Header)
│   ├── /super-admin → <SuperAdminPage /> (Global Header)
│   ├── /kanban      → <KanbanPage /> (Global Header, full kanban)
│   └── /*           → IDE Mode (Global Header)
│                       ├── Claw
│                       ├── Docs
│                       ├── Work
│                       └── Simple
└── Header visibility matrix:
    ├── /login       → No header
    ├── /client, /portal → Portal Header (branding + logout)
    └── /*           → Global Header (menus, nav, search, model)
```

### 3.3 Mode Shells (Extracted from App.tsx)

| Page | Lines (current) | Lines (target) | Responsibility |
|------|----------------|----------------|----------------|
| `ClawPage.tsx` | ~213 | ~100 | Claw automation UI |
| `DocsPage.tsx` | ~23 | ~50 | Document browser |
| `WorkPage.tsx` | ~10 | ~50 | WorkBoard integration |
| `SimplePage.tsx` | ~320 | ~150 | Simple chat mode |

### 3.4 Kanban Integration

The full kanban system (ported from external project) is integrated:

```
src/
├── pages/Kanban.tsx                 # Full kanban page (3300 lines)
├── components/kanban/
│   ├── BoardSelector.tsx            # Board selection
│   ├── CardView.tsx                 # Card detail/edit
│   ├── BoardSettingsModal.tsx       # Board configuration
│   ├── BoardMembers.tsx             # Member management
│   ├── BoardDocsView.tsx            # Docs integration
│   ├── BoardDriveView.tsx           # Drive integration
│   ├── PushToKanbanModal.tsx        # Push tasks
│   ├── PushTaskListToKanbanModal.tsx
│   └── PushWorkflowToKanbanModal.tsx
├── components/work/kanban/
│   └── WorkBoard.tsx                # Simplified worker view (stays)
```

Both kanban views share service layer:

```
src/services/
├── kanbanService.ts                 # Canonical kanban service
├── mockKanbanService.ts             # Mock for dev/testing
├── developmentWorkflowService.ts    # Workflow integration
└── workflowsService.ts              # Workflow tracks
```

### 3.5 Modal Components

```
src/components/modals/               # Canonical modals
├── Modal.tsx                        # Base modal wrapper
├── ConfirmationModal.tsx            # Confirm/cancel dialogs
└── HowToUseModal.tsx                # Help/tutorial modal

src/modals/                          # Reference files (from WHN Chat)
├── Modal.tsx                        # Not wired — for future kanban use
├── ConfirmationModal.tsx
├── ErrorModal.tsx
├── InputModal.tsx
├── InternetAccessModal.tsx
└── SuccessModal.tsx
```

---

## 4. Program Capabilities (Target)

### 4.1 AI Chat & Agent Capabilities

| Capability | Description | Backed by |
|-----------|-------------|-----------|
| Multi-provider chat | Anthropic, OpenAI, Google, Groq, OpenRouter, Ollama, etc. | `@earendil-works/pi-ai` |
| Streaming responses | Real-time text + thinking deltas | SDK → WebSocket |
| Tool execution | read, write, edit, bash, grep, find, ls + custom tools | SDK in-process |
| Session persistence | JSONL session files with branching + tree navigation | `SessionManager` |
| Session compaction | Automatic context window management | SDK built-in |
| Agent teams | Dispatcher orchestrator with team roster | `pi-agent-core` |
| Model cycling | Ctrl+P through scoped models | SDK built-in |
| Thinking levels | off → xhigh, per-provider | SDK built-in |
| Extension system | Load .ts extensions with custom tools/commands/UI | `ResourceLoader` |
| Skills system | On-demand SKILL.md packages | `ResourceLoader` |
| Prompt templates | /command → expand reusable prompts | SDK built-in |

### 4.2 Multi-Tenant Portal Capabilities

| Capability | Description | Role |
|-----------|-------------|------|
| Client dashboard | Project list, drawings, team view | CLIENT |
| Worker portal | Task queue, time entries, work board | WORKER/LEADER |
| Kanban (full) | Boards, columns, cards, members, docs, drive | WORKER/LEADER |
| Kanban (worker) | Simplified work view | WORKER |
| Admin panel | User management, system config | ADMIN |
| Super admin | Full system access | SUPER_ADMIN |
| **Financial dashboard** | Budget vs actual, burn rate, expense breakdown (per project + global) | ADMIN, PM |
| **Budget management** | Propose/approve lifecycle, cost calculation from time × rates, alert thresholds | ADMIN, PM |
| **Expense tracking** | Manual line items, receipt upload, approval workflow | Worker, PM, ADMIN |
| **Invoicing** | Generate from billable time + expenses, PDF download, payment tracking | ADMIN, PM |
| **Salary profiles** | Per-worker hourly rate, monthly salary, billing rate, salary allocation | ADMIN, Worker |
| **Financial reports** | Budget report + worker cost report (CSV + PDF export) | ADMIN, PM |

### 4.3 IDE Capabilities (Technical/Simple Modes)

| Capability | Description |
|-----------|-------------|
| File explorer | Workspace tree with expand/collapse |
| Code editor | Monaco-based editor |
| Terminal | PTY-based xterm.js terminal |
| Document viewer | Markdown/code rendering |
| Chat panel | AI chat with history |
| Git integration | Status, commit, push, pull, checkout |
| Problem panel | ESLint/tsc diagnostics |
| Workspace index | Merkle tree fingerprinting |
| Multi-root workspace | Open/close folders |

### 4.4 Claw Automation Capabilities

| Capability | Description |
|-----------|-------------|
| Scheduled automation | Cron-like triggers for AI tasks |
| Webhook integration | Inbound webhook execution |
| Mission events | Event-driven automation |
| Telegram bot | Status notifications |
| Schedule executor | Prompt + agent dispatch |

### 4.5 Developer Experience

| Capability | Description |
|-----------|-------------|
| Clean build | `bun run build` → zero errors |
| Fast dev mode | Vite HMR + Bun server hot reload |
| Version guarantee | `bun install` locks pi.dev version |
| Startup validation | Health check on all pi integration points |
| Startup logging | JSONL log of pi.dev integration status |
| Graceful degradation | Falls back to bundled chat if pi.dev SDK unavailable |
| Extensible | Add new `apps/<name>/` that imports same pi.dev SDK |

---

## 5. Migration Path (from WOP-007)

```
Phase 0: Import audit → clean build         [1 session]
Phase 1: Runtime stability (WS, ENOENT)     [1 session]
Phase 2: Unified auth + routing             [1-2 sessions]
Phase 3: App.tsx refactor                   [1-2 sessions]
Phase 4: Pi.dev version pin (lightweight)   [<1 session, parallel]
Phase 5: Kanban integration                 [1-2 sessions]
Phase 6: SDK migration (eliminate subprocess) [2-3 sessions]
```

### Each phase unlocks:

After Phase 0: `bun run build` works. All subsequent work is on a clean foundation.

After Phase 2: All users enter via `/login`. Role-based redirects. Consistent headers.

After Phase 3: App.tsx is maintainable. Mode shells are independently testable.

After Phase 4: pi.dev updates can't break the system silently.

After Phase 5: Full kanban system operational alongside worker kanban.

After Phase 6: No more `pi --mode json` subprocess. SDK direct. 800+ lines of fragile bridge code deleted. ENOENT eliminated.

---

## 6. Files That Will Be Deleted or Significantly Changed

### Deleted (SDK migration replaces them)

| File | Lines | Replaced by |
|------|-------|-------------|
| `server/pi-binary.ts` | 108 | Direct import |
| `server/pi-json-mode-chat.ts` | 245 | `createAgentSession()` |
| `server/pi-agent-runtime.ts` | 176 | Simplified to one path |
| `server/orchestrator-tools-exec.ts` (`executeToolViaPi` portion) | ~100 | In-process tools |
| `server/pi-ollama-env.ts` | 76 | SDK handles this |

### Significantly Changed

| File | Current | Target |
|------|---------|--------|
| `src/App.tsx` | 4826 lines, monolithic | ~200 lines, coordinator |
| `server/index.ts` | 2921 lines, mixed concerns | Cleaner with SDK integration |
| `server/chat.ts` | Standalone LLM calls | SDK-backed |
| `server/chat-orchestrator-tools.ts` | Custom tool loop | SDK-backed |
| `justfile` | `run-pi` + extension loader | Plus pi-verify, pi-log, pi-fix-version |

### New Files

| File | Purpose |
|------|---------|
| `scripts/pi-version-check.sh` | Validate pi SDK version at startup |
| `scripts/pi-startup-log.sh` | Log all integration point statuses |
| `src/hooks/useAppState.ts` | App.tsx state extraction |
| `src/hooks/useAppEffects.ts` | App.tsx effects extraction |
| `src/hooks/useAppHandlers.ts` | App.tsx handlers extraction |
| `src/hooks/useAppMenus.ts` | App.tsx menus extraction |
| `src/pages/ClawPage.tsx` | Claw mode shell |
| `src/pages/DocsPage.tsx` | Docs mode shell |
| `src/pages/WorkPage.tsx` | Work mode shell |
| `src/pages/SimplePage.tsx` | Simple mode shell |

---

## 7. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| pi.dev SDK API changes | SDK types break at compile time (caught early, unlike JSONL format drift) | Pin exact version in package.json, test update in CI |
| SDK migration is large | Long branch, merge conflicts | Do last (Phase 6), after everything else is stable |
| Electron white screen persists | Desktop app unusable | Fall back to web mode (`start-wayofpi.sh --web`) as working alternative |
| Build audit reveals deeper issues | Phase 0 takes longer | Exclude known-dead code from tsconfig, fix imports progressively |
| Multi-app workspace conflicts | Shared dependency version disagreements | Hoist pi.dev packages to workspace root, apps use `"workspace:*"` protocol |

---

## 8. Summary

The target architecture transforms Way of Pi from a fragile subprocess-based CLI wrapper into a stable SDK-based multi-app platform:

| Before | After |
|--------|-------|
| Spawns `pi --mode json` subprocess | `import { createAgentSession }` — typed, stable |
| 800+ lines of brittle bridge code | ~0 lines — SDK handles it |
| ENOENT if pi binary not found | npm install catches missing deps |
| JSON stream parsing breaks silently | TypeScript catches API changes at compile time |
| One monolithic UI | Multiple apps in `apps/`, shared SDK |
| 4826-line App.tsx | ~200-line coordinator |
| 60+ build errors | Zero errors, CI-enforced |
| No version validation | Pinned + verified at startup |
| Login scattered per page | Unified `/login` + AuthGate |

---

## 9. Hosting & Deployment Architecture

*References: `docs/LOCAL_HOSTING.md`*

The target architecture supports multiple deployment scenarios from the same codebase:

### 9.1 Development (Current)

```
Developer machine:
├── Vite dev server :5173  → React UI with HMR
├── Bun API server  :3333  → All API + WebSocket
└── Vite proxies /api and /ws to Bun
```

### 9.2 Production Web

```
Production server:
├── Bun serves built assets (from vite build)
├── Bun API :3333
├── WebSocket :3333 (same port, path-based upgrade)
└── Single port → simpler ngrok/proxy setup
```

### 9.3 Docker Multi-Tenant

```
Docker host:
├── Container A → :8001 (UI) + :9001 (API)  → Client X data volume
├── Container B → :8002 (UI) + :9002 (API)  → Client Y data volume
├── Container C → :8003 (UI) + :9003 (API)  → Client Z data volume
└── All share same image, differ by env + volume
```

See `docs/LOCAL_HOSTING.md` for the full Docker Compose and ngrok setup.

### 9.4 Electron Desktop

```
Electron app:
├── Vite :5173 (dev) or built assets (prod)
├── Bun server :3333 (bundled in Electron)
├── Electron window wraps the UI
└── Justfile: `just wayofpi-electron`
```

---

## 10. Relationship to Existing Documents

| Existing doc | Incorporated in target? | Notes |
|-------------|------------------------|-------|
| `docs/UI_UX_ROUTING_AND_HEADER.md` | ✅ Section 3.2 | Auth gate, role-based routing, header matrix, Admin Bridge |
| `docs/UI_UX_WORKSPACE_PLAN.md` | ✅ Section 3.3 | Per-role workspace design, navigation architecture, visual tokens |
| `docs/LOCAL_HOSTING.md` | ✅ Section 9 | Docker, ngrok, VM deployment from same codebase |
| `docs/DOCS-MODE-ROUTING-INVESTIGATION.md` | ✅ WOP-001 (completed) | Docs mode routing fixed, DocumentBrowser orphan addressed |
| `docs/STRUCTURE.md` | ✅ Throughout | Project layout reference |
| `plans/old/productionready/reference/PI_VERSION_MANAGEMENT.md` | ✅ Phase 4 | Version pinning strategy adopted |
| `pip/.pi/docs/JUSTFILE-STARTUP-MECHANISM.md` | ✅ Section 2 | Extension loader pattern retained |
| `thoughts/shared/tickets/WOP-007-collective-ticket-evaluation.md` | ✅ Sections 5-6 | Phased migration plan |
| `thoughts/shared/tickets/WOP-006-pi-dev-version-pinning-and-startup-logging.md` | ✅ Phase 4 | Startup validation scripts |
| `issues/prd-financial-system.md` | ✅ Section 4.2, WOP-008 | Financial system PRD (budgets, salaries, invoicing) |
| `issues/001-worker-financial-profiles.md` through `issues/007-financial-reports.md` | ✅ WOP-008 | 7 vertical-slice issues for financial system |

---

## 11. Files Referenced in This Document

### UI Source (`apps/wayofpi-ui/src/`)

| File | Role in target |
|------|---------------|
| `App.tsx` | Thin coordinator (~200 lines, down from 4826) |
| `hooks/useAppState.ts` | New — all state declarations |
| `hooks/useAppEffects.ts` | New — all side effects |
| `hooks/useAppHandlers.ts` | New — all event handlers |
| `hooks/useAppMenus.ts` | New — menu/toolbar logic |
| `pages/ClawPage.tsx` | New — Claw mode shell |
| `pages/DocsPage.tsx` | New — Docs mode shell |
| `pages/WorkPage.tsx` | New — Work mode shell |
| `pages/SimplePage.tsx` | New — Simple mode shell |
| `pages/Kanban.tsx` | Integrated full kanban |
| `components/kanban/*.tsx` | 9 component files, fully wired |
| `components/work/kanban/WorkBoard.tsx` | Simplified worker kanban (unchanged) |
| `components/modals/*.tsx` | Canonical modal components |

### Server (`apps/wayofpi-ui/server/`)

| File | Role in target |
|------|---------------|
| `index.ts` | HTTP + WebSocket server (retained, simplified) |
| `auth.ts` | JWT auth (retained) |
| `db.ts` | SQLite (retained) |
| `chat.ts` | LLM fallback (simplified — SDK is primary) |
| `chat-orchestrator-tools.ts` | SDK replaces tool loop (simplified or removed) |
| — | SDK integration layer (new pattern) |
| `pi-binary.ts` | **Deleted** — SDK import replaces subprocess |
| `pi-json-mode-chat.ts` | **Deleted** — SDK typed events replace JSONL parsing |
| `pi-agent-runtime.ts` | **Deleted** — SDK createAgentSession() replaces routing |
| `orchestrator-tools-exec.ts` | **Deleted** (tool execution portion) — tools run in-process |

### Configuration

| File | Role |
|------|------|
| `package.json` | Pins `@earendil-works/pi-coding-agent` to exact version |
| `.env` | `PI_PINNED_VERSION` — the pinned version (for logging/verification) |
| `justfile` | + `pi-verify`, `pi-log`, `pi-fix-version` targets |
| `scripts/pi-version-check.sh` | New — validate pi SDK version at startup |
| `scripts/pi-startup-log.sh` | New — log all integration point statuses |

---

---

## 12. Community Extension Ecosystem

The pi.dev community publishes **npm packages** that extend the SDK with tools, commands, and UI. These can replace in-app implementations during Phase 6 (SDK migration), eliminating custom code and delegating to well-maintained community packages.

### Extension Mapping

| Community extension | Replaces in-app code | Install | Stars/Downloads |
|---|---|---|---|
| [`pi-web-access`](https://github.com/nicobailon/pi-web-access) (nicobailon) | `src/utils/` web fetch utilities, server-side fetch proxy — web search, URL content extraction, YouTube analysis, GitHub cloning, PDF extraction | `pi install npm:pi-web-access` | 445 ★, npm |
| [`pi-markdown-preview`](https://github.com/omaclaren/pi-markdown-preview) (omaclaren) | `MarkdownPreviewPane.tsx`, `MermaidPreviewPane.tsx` — rendered markdown + LaTeX + Mermaid preview in terminal, browser, or PDF with syntax highlighting | `pi install npm:pi-markdown-preview` | 62 ★, npm |
| [`pi-mermaid`](https://github.com/Gurpartap/pi-mermaid) (Gurpartap) | `MermaidPreviewPane.tsx` (alternative, lighter) — Mermaid diagrams rendered as ASCII art in the TUI | `pi install npm:pi-mermaid` | 56 ★, npm |
| [`@juicesharp/rpiv-ask-user-question`](https://pi.dev/packages/@juicesharp/rpiv-ask-user-question) (juicesharp) | Inline user prompt dialogs — structured multi-question forms with multi-select, preview pane, per-option notes, internationalization | `pi install npm:@juicesharp/rpiv-ask-user-question` | 10.2K/mo, pi.dev |
| [`pi-lens`](https://github.com/apmantza/pi-lens) (apmantza) | In-app lint/format/analysis (ProblemsPanelBody, ESLint, tsc diagnostics) — 37 LSP servers, 26 formatters, 180+ ast-grep rules, tree-sitter rules, read-before-edit guard, secrets scanning | `pi install npm:pi-lens` | 91 ★, npm |

### How These Fit the Architecture

During SDK migration (Phase 6), in-app implementations become pi.dev **extensions** loaded at session start:

```
Before (current):
  React UI
    ├── MarkdownPreviewPane.tsx    ← custom markdown renderer
    ├── MermaidPreviewPane.tsx     ← custom mermaid renderer
    ├── src/utils/webfetch.ts      ← custom web fetch
    ├── ProblemsPanelBody.tsx      ← custom lint display
    └── ChatPanel.tsx              ← inline user prompts

After (target):
  pi.dev SDK (imported as dependency)
    └── ExtensionLoader loads:
        ├── pi-markdown-preview    ← replaces MarkdownPreviewPane + MermaidPreviewPane
        ├── pi-web-access          ← replaces web fetch
        ├── pi-lens                ← replaces ProblemsPanelBody + lint integration
        └── rpiv-ask-user-question ← replaces inline user prompt dialogs
```

The UI still renders results (markdown, diagrams, diagnostics), but the **processing** moves from custom React components to pi.dev extensions running in the agent session. The React layer becomes a thinner display surface.

### Installation Pattern

```bash
# Per-user install (loaded by pi.dev CLI at session start)
pi install npm:pi-markdown-preview
pi install npm:pi-web-access
pi install npm:@juicesharp/rpiv-ask-user-question
pi install npm:pi-mermaid
pi install npm:pi-lens

# Or via package dependency (shared across all UIs)
# root package.json:
"@juicesharp/rpiv-ask-user-question": "1.2.1"
```

### Phase 6 Impact

Replacing in-app implementations with community extensions:

- **Removes** ~2000+ lines of custom code (markdown rendering, mermaid rendering, lint integration, web fetch utilities)
- **Replaces** with maintained community packages that receive upstream fixes
- **Standardizes** on pi.dev extension API — same extensions work in any pi.dev-powered UI
- **Simplifies** the React codebase — components become display-only surfaces for extension results

---

**Created**: 2026-05-08
**Updated**: 2026-05-08
**Status**: Target state (not yet implemented)

**Related documents**:
- `docs/UI_UX_ROUTING_AND_HEADER.md` — Auth and routing architecture
- `docs/UI_UX_WORKSPACE_PLAN.md` — Per-role workspace UI/UX design
- `docs/LOCAL_HOSTING.md` — Hosting and deployment
- `docs/DOCS-MODE-ROUTING-INVESTIGATION.md` — Docs mode investigation
- `docs/STRUCTURE.md` — Current project structure
- `thoughts/shared/tickets/WOP-007-collective-ticket-evaluation.md` — Migration plan
- `thoughts/shared/tickets/WOP-006-pi-dev-version-pinning-and-startup-logging.md` — Startup validation
- `plans/old/productionready/reference/PI_VERSION_MANAGEMENT.md` — Version pinning strategy
- `pip/.pi/docs/JUSTFILE-STARTUP-MECHANISM.md` — Extension loader docs
- `https://pi.dev/docs/latest/sdk` — pi.dev SDK reference
- `https://github.com/earendil-works/pi/tree/main/packages` — pi.dev source packages
- `https://github.com/nicobailon/pi-web-access` — Web access extension
- `https://github.com/omaclaren/pi-markdown-preview` — Markdown preview extension
- `https://github.com/Gurpartap/pi-mermaid` — Mermaid extension
- `https://pi.dev/packages/@juicesharp/rpiv-ask-user-question` — Ask user question extension
- `https://github.com/apmantza/pi-lens` — Code lens extension
- `issues/prd-financial-system.md` — Financial system PRD (budgets, salaries, invoicing)
- `issues/001-worker-financial-profiles.md` through `issues/007-financial-reports.md` — Financial system vertical slices
