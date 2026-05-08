# [WOP-005] Refactor App.tsx Into Custom Hooks and Mode Shells

## Problem

`src/App.tsx` is **4826 lines** with **78 imports** — a monolithic component that handles all UI modes (Simple, Technical, Claw, Docs, Work) in a single file. This causes:

- Poor maintainability — any change risks breaking unrelated modes
- Difficult navigation — logic and render are intertwined across 4.8k lines
- Slow DX — editors struggle with a single file this large
- Hard to test — no isolated units to test individual modes

## Context

The component has clear internal boundaries:
- **Lines 272–620**: State setup (useState, useRef, useMemo, useCallback)
- **Lines 620–1800**: Effects (useEffect blocks for side effects)
- **Lines 1800–2900**: Event handlers and callbacks
- **Lines 2900–3300**: Menu/panel/toolbar logic
- **Lines 3300–3857**: Render helpers
- **Lines 3857–4070**: Claw mode render (`uiMode === "claw"`)
- **Lines 4070–4093**: Docs mode render
- **Lines 4093–4103**: Work mode render
- **Lines 4103–4422**: Simple mode render
- **Lines 4424–4826**: Main return (wraps all modes)

The render already uses separate App components for each mode (`ClawApp`, `SimpleApp`, etc.) but all the wiring lives in App.tsx.

## Architecture Plan

Uses `src/` directories that already exist — no new top-level folders.

```
src/
├── hooks/
│   ├── useAppState.ts          useState/useRef/useMemo — all state declarations
│   ├── useAppEffects.ts        useEffect blocks — side effects, subscriptions
│   ├── useAppHandlers.ts       Event handlers, callbacks, file operations
│   └── useAppMenus.ts          Menu/toolbar/panel state and actions
├── pages/
│   ├── ClawPage.tsx            Claw mode render (extracted from lines 3857–4070)
│   ├── DocsPage.tsx            Docs mode render (lines 4070–4093)
│   ├── WorkPage.tsx            Work mode render (lines 4093–4103)
│   └── SimplePage.tsx          Simple mode render (lines 4103–4422)
│   └── index.ts                Re-export all pages (update existing barrel)
├── components/modals/          Canonical modal components (ConfirmationModal, Modal, HowToUseModal)
└── App.tsx                     Thin coordinator (~200 lines)
```

> **Note on `src/modals/`**: These are reference files from the WHN Chat project. They belong to the future full Kanban integration (tracked in WOP-002 Phase 5). They are NOT used in the App.tsx refactor. Inline modal code in App.tsx will be replaced with existing `src/components/modals/` components or remain inline until the mode shells are extracted. The `src/components/modals/` directory is the canonical location for project modal components.

## Success Criteria

### Phase 1: Extract Custom Hooks
- [ ] `useAppState.ts` — All `useState`, `useRef`, `useMemo` declarations from App() body
- [ ] `useAppEffects.ts` — All `useEffect` blocks extracted, no effect is duplicated
- [ ] `useAppHandlers.ts` — All event handlers, file save/load, workspace ops extracted
- [ ] `useAppMenus.ts` — Menu bar state, toolbar config, panel visibility extracted
- [ ] App.tsx calls all four hooks and destructures what it needs

### Phase 2: Extract Mode Shells (into `src/pages/`)
- [ ] `ClawPage.tsx` — Takes props from hooks, renders Claw mode UI
- [ ] `DocsPage.tsx` — Takes props from hooks, renders Docs mode UI
- [ ] `WorkPage.tsx` — Takes props from hooks, renders Work mode UI  
- [ ] `SimplePage.tsx` — Takes props from hooks, renders Simple mode UI
- [ ] Each shell is a standalone component importable and testable in isolation

### Phase 3: Thin App.tsx
- [ ] App.tsx imports all hooks and shells
- [ ] Main return is a simple `switch(uiMode)` over the four shells
- [ ] App.tsx is under 400 lines
- [ ] `bun run build` succeeds with zero errors
- [ ] All UI modes (Simple, Technical, Claw, Docs, Work) render correctly
- [ ] No runtime regressions in menu, file editing, chat, or navigation

## Affected Components

- `src/App.tsx` — Refactored to thin coordinator
- `src/hooks/useAppState.ts` — New file
- `src/hooks/useAppEffects.ts` — New file
- `src/hooks/useAppHandlers.ts` — New file
- `src/hooks/useAppMenus.ts` — New file
- `src/pages/ClawPage.tsx` — New file (mode shell, not a route page)
- `src/pages/DocsPage.tsx` — New file
- `src/pages/WorkPage.tsx` — New file
- `src/pages/SimplePage.tsx` — New file

## Risk Mitigation

- **Incremental extraction**: Do one hook/shell at a time, verify build after each
- **No behavior changes**: Extraction = pure move/copy, no logic changes
- **Props interfaces**: Define explicit props for each shell so the data flow is clear
- **Keep original file**: Don't delete App.tsx until all extractions are verified

## Estimated Effort

XL (2–3 sessions)
- Hooks extraction: 1 session
- Shell extraction: 1 session
- Cleanup + verification: 1 session

## Related

- WOP-002: Build errors (prerequisite — hooks/shells must compile)
- `src/App.tsx` — The file to refactor
- `docs/STRUCTURE.md` — Update after refactor

---

**Created**: 2026-05-08  
**Updated**: 2026-05-08  
**Priority**: Medium  
**Status**: In Progress  

## Progress

### Done
- Clarified that `src/modals/` are WHN Chat reference files for future Kanban (WOP-002 Phase 5), not part of this refactor
- Confirmed `src/components/modals/` as canonical modal source for the project
- Fixed WorkBoard.tsx `useToast` import, infinite re-render loop, async callers
- Fixed ClientDashboard.tsx 403 by switching to `apiGet()` with auth headers
- Added missing stub methods to `mockKanbanService.ts`, `developmentWorkflowService.ts`
- Created `workflowsService.ts`
- Updated CHANGELOG.md for v0.21.08

### Next
- Phase 1: Extract hooks from App.tsx
- Phase 2: Extract mode shells into `src/pages/`
- Phase 3: Thin App.tsx to ~200 lines

**Depends On**: WOP-002 (clean build required before refactor)
