# [WOP-002] Implement Unified Routing/Header Architecture & Fix Build Errors

> 📋 **Task checkboxes migrated to `WOP-ALL-TODO.md`: Phase 0 (Clean Build) + Phase 2 (Auth & Routing) + Phase 5 (Kanban).** Update checkboxes there, not here.

## Problem Statement

Two major work items:
1. **Build Errors**: 60+ TypeScript errors preventing clean builds (missing imports, type mismatches, deprecated properties)
2. **Routing & Header Refactor**: Implement the unified authentication and header architecture defined in `docs/UI_UX_ROUTING_AND_HEADER.md` (blueprint done, implementation pending)

## Desired Outcome

- `bun run build` completes with zero errors
- Unified auth flow: all users enter via `/login`, redirected based on JWT role
- Header visibility matrix implemented (Portal Header vs Global Header)
- Navigation component embedded inside MenuBar
- Logout functionality in Global Header

## Context & Background

### Already Fixed This Session ✅
- **Database**: Connection issues resolved, tables create successfully
- **WebSocket**: HMR connection fixed (`url.pathname.startsWith("/ws")`)
- **Client APIs**: 403 errors fixed, dev mode includes `role: "ADMIN"`
- **ClientDashboard**: Login form implemented with JWT validation
- **Architecture Blueprint**: `docs/UI_UX_ROUTING_AND_HEADER.md` complete

### Current State - Build Errors (60+)
1. **Missing module imports** - shared/, hooks/, types/ not found
2. **ChatRow property mismatches** - `fromUser`/`agentName`/`segments` vs `role`/`assistantPersona`/`content`
3. **Icon import errors** - Wrong heroicons imports
4. **Type mismatches** - Navigation, MenuBar, ViewMenu prop types
5. **Missing props** - Components missing required properties

### Current State - Routing & Header (Planned Refactor)
- `LoginPage.tsx` exists (initial implementation, pending App.tsx integration)
- `ClientDashboard.tsx` has its own login form (should be unified)
- Routing uses `window.location.pathname` (no React Router)
- `App.tsx` needs AuthGate + centralized Layout component
- Navigation not yet embedded in MenuBar
- No logout in Global Header

### Target Architecture (from UI_UX_ROUTING_AND_HEADER.md)
1. **Unified Login Page** (`/login`) - Single entry point for all roles
2. **Role-Based Routing Matrix**:
   - CLIENT → `/client` (Client Dashboard, minimal header)
   - WORKER/LEADER → `/portal` (Worker Portal, task-focused header)
   - ADMIN/SUPER_ADMIN → `/` (IDE Mode, global header)
3. **Header Visibility Matrix**:
   - `/login` → No header
   - `/client`, `/portal` → Portal Header (minimal)
   - `/`, `/admin`, `/super-admin` → Global Header (full menus)
4. **Navigation inside MenuBar** - Center position

## Requirements

### Phase 1: Fix Build Errors (Prerequisite)

#### Category 1: Missing Module Imports (20+ errors)
- [ ] Fix `shared/` imports (claw-automation-status, claw-mission-events, etc.)
- [ ] Fix `hooks/` imports in menus/ (useUiMode, useSimplePreferences, etc.)
- [ ] Fix `@/hooks/` path aliases in MenuBar.tsx
- [ ] Fix `types/` imports (commands, hermes)
- [ ] Fix `utils/` imports (workspace)
- [ ] Fix `constants` import
- [ ] Fix `../../../paths` import in shared/claw-workspace-root.ts

#### Category 2: ChatRow Property Fixes
- [ ] Fix `src/components/documenthandler/Chat.tsx` - Replace `fromUser`→`role`, `agentName`→`assistantPersona`, `segments`→`content`

#### Category 3: Icon Import Errors
- [ ] Fix `DocumentViewer.tsx` - Replace wrong heroicons with correct ones

#### Category 4: Type Mismatches
- [ ] Fix `Navigation.tsx` - Type compatibility issues
- [ ] Fix `ReferenceApp.tsx` - Missing props
- [ ] Fix `ViewMenu.tsx` - Props type mismatch
- [ ] Fix `SimpleApp.tsx` - Missing required props

#### Category 5: Other Errors
- [ ] Fix `HermesTerminalView.tsx` - Missing names, type conversions
- [ ] Fix `HowToUseModal.tsx` - JSX namespace
- [ ] Fix `PMChatPanel.tsx` - Type comparison error
- [ ] Fix implicit any types in various files

### Phase 2: Implement Unified Auth & Routing

- [x] Create `/login` page - **DONE** (LoginPage.tsx exists)
- [ ] Update `App.tsx` to add AuthGate component:
  - Check JWT token on mount
  - Redirect unauthenticated users to `/login`
  - Protect all routes
- [ ] Refactor `ClientDashboard.tsx`:
  - Remove inline login form
  - Rely on unified `/login` flow
  - Check for valid JWT via AuthGate instead
- [ ] Implement role-based redirect after login in LoginPage.tsx:
  - CLIENT → `/client`
  - WORKER/LEADER → `/portal`
  - ADMIN → `/admin` (or `/` for IDE)
  - SUPER_ADMIN → `/`
- [ ] Update `App.tsx` Layout component:
  - Use `window.location.pathname` to determine route
  - Render appropriate page component
  - Conditionally render headers

### Phase 3: Implement Header Visibility Matrix

- [ ] Update `App.tsx` layout logic:
  - `/login` → No header
  - `/client`, `/portal` → Portal Header (minimal: branding + logout)
  - `/`, `/admin`, `/super-admin` → Global Header (full menus)
- [ ] Create/Update Portal Header component (if needed)
- [ ] Ensure Global Header includes MenuBar + Navigation
- [ ] Implement "Admin Bridge" logic:
  - Admin clicks "Portal" in nav → switch to `/portal` path
  - Detect path change → unmount Global Header, mount Portal Header
  - Vice versa when returning to IDE mode
- [ ] Add logout functionality to Global Header

### Phase 4: Refactor Navigation Inside MenuBar

- [ ] Embed `<Navigation />` component inside `<MenuBar />`
- [ ] Position: Center (between Left: Logo/AppMenus and Right: Search/ModelSelector)
- [ ] MenuBar structure:
  ```tsx
  <MenuBar>
    <Left><Logo /><AppMenus /></Left>
    <Center><Navigation /></Center>
    <Right><Search /><ModelSelector /></Right>
  </MenuBar>
  ```
- [ ] Ensure Navigation shows correct items based on role:
  - Primary Nav: Simple, Technical, Claw, Docs, Work
  - Context Nav: Portal, Admin, Super Admin, Profile

### Phase 5: Integrate Full Kanban System

The existing `WorkBoard.tsx` (`src/components/work/kanban/WorkBoard.tsx`) is the **simplified worker-facing kanban view**. A full-featured kanban system exists at `src/pages/Kanban.tsx` (3300 lines) backed by `src/components/kanban/` (9 component files). This kanban was ported from another system and needs integration into Way of Pi.

- [ ] Fix import paths in `Kanban.tsx` and `components/kanban/*` — change `../../` references to match Way of Pi's directory structure
- [ ] Fix service imports — the kanban uses `mock*Service` files (`mockKanbanService`, `mockNotesService`, etc.) that may differ from existing Way of Pi services
- [ ] Migrate color scheme from source system's colors to Way of Pi theme (`bg-[#1e1e1e]`, `text-[#cccccc]`, `border-gray-700`, accent `#ea580c`)
- [ ] Fix context imports — kanban uses `../contexts/ToastContext` and `../contexts/AuthContext`; Way of Pi has `../context/ToastContext` (no 's')
- [ ] Replace `react-router-dom` usage with Way of Pi's `window.location.pathname` routing pattern
- [ ] Replace `lucide-react` icons with equivalent heroicons if needed
- [ ] Add route in `App.tsx` for the full kanban view (e.g., `/kanban` or integrated into Work mode)
- [ ] Wire up `BoardSelector`, `CardView`, `BoardSettingsModal`, `BoardMembers`, etc. into the app
- [ ] Ensure `Kanban.tsx` uses `useToast` from Way of Pi's `ToastContext` (not the other system's)
- [ ] Verify all 9 component files in `src/components/kanban/` compile without errors

## Automated Verification
- [ ] Build completes: `bun run build` (wayofpi-ui) - zero errors
- [ ] Tests pass: `bun run test` (wayofpi-ui)

## Manual Verification
- [ ] Unauthenticated user hitting any protected route → redirected to `/login`
- [ ] Login page at `/login` works for all roles (CLIENT, WORKER, LEADER, ADMIN, SUPER_ADMIN)
- [ ] Login with CLIENT role → lands on `/client` (Portal Header visible)
- [ ] Login with WORKER role → lands on `/portal` (Portal Header visible)
- [ ] Login with ADMIN role → lands on `/` or `/admin` (Global Header visible)
- [ ] Login with SUPER_ADMIN role → lands on `/` (Global Header visible)
- [ ] Admin clicks "Portal" in nav → switches to `/portal` with Portal Header
- [ ] Admin clicks IDE mode → switches to `/` with Global Header
- [ ] Navigation component renders in center of MenuBar
- [ ] Logout button works in Global Header
- [ ] All IDE modes work (Simple, Technical, Claw, Docs, Work)
- [ ] Chat functionality works in all modes
- [ ] Document viewing works (DocumentViewer)

## Technical Notes

### Affected Components (Build Errors)
- `shared/claw-*.ts` - Missing module imports
- `src/components/menus/*.tsx` - Missing hooks, type mismatches
- `src/components/documenthandler/Chat.tsx` - ChatRow property usage
- `src/components/docs/DocumentViewer.tsx` - Icon imports
- `src/components/hermes/*.tsx` - Missing types
- `src/components/simple/SimpleApp.tsx` - Missing props
- `src/AppContainer.tsx`, `src/ReferenceApp.tsx` - Type errors

### Affected Components (Routing & Header)
- `src/App.tsx` - Main router, layout manager, AuthGate
- `src/components/Navigation.tsx` - Embed inside MenuBar
- `src/components/menus/MenuBar.tsx` - Add Navigation in center
- `src/pages/LoginPage.tsx` - Unified authentication (exists, needs integration)
- `src/pages/ClientDashboard.tsx` - Remove inline login, use AuthGate
- `src/pages/WorkerPortal.tsx` - Ensure AuthGate protection
- `src/hooks/useWayOfPiSession.ts` - JWT handling

### Affected Components (Kanban Integration)
- `src/pages/Kanban.tsx` - Full kanban page from external system (3300 lines)
- `src/components/kanban/BoardSelector.tsx` - Board selection modal
- `src/components/kanban/CardView.tsx` - Card detail/edit view
- `src/components/kanban/BoardSettingsModal.tsx` - Board configuration
- `src/components/kanban/BoardMembers.tsx` - Member management
- `src/components/kanban/BoardDocsView.tsx` - Docs integration
- `src/components/kanban/BoardDriveView.tsx` - Drive integration
- `src/components/kanban/PushToKanbanModal.tsx` - Push tasks to kanban
- `src/components/kanban/PushTaskListToKanbanModal.tsx` - Push task lists
- `src/components/kanban/PushWorkflowToKanbanModal.tsx` - Push workflow steps
- `src/components/work/kanban/WorkBoard.tsx` - Stays as simplified worker view

### Related Files
- `docs/UI_UX_ROUTING_AND_HEADER.md` - Architecture specification
- `plans/STATUS-UI-TRANSPORT.md` - Current status & what's fixed
- `tsconfig.json` - Check path aliases
- `vite.config.ts` - Check resolve aliases

---

## Meta

**Created**: 2026-05-06
**Priority**: High
**Estimated Effort**: XL (4-5 sessions, Phase 5 adds ~1 session)
**Status**: Pending
**Depends On**: WOP-001 (completed)
**Related Docs**: 
- `docs/UI_UX_ROUTING_AND_HEADER.md` (architecture blueprint)
- `plans/STATUS-UI-TRANSPORT.md` (current status)
- `src/pages/Kanban.tsx` (full kanban system to integrate)
- `src/components/kanban/` (9 kanban component files)
