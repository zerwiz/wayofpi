# [WOP-010] Full Kanban System Integration

## Problem Statement

The project contains a ported 3,300-line Kanban system (`src/pages/Kanban.tsx` and `src/components/kanban/`) that is currently disconnected from the main application. It produces over 500 TypeScript errors due to:
1.  **Missing Dependencies**: References to `react-router-dom` (project uses path-based routing).
2.  **Missing Services**: References to `mockNotesService`, `mockTasksService`, etc.
3.  **Type Mismatches**: Incompatible `Board` and `Card` interfaces between the ported code and Way of Pi types.
4.  **Thematic Inconsistency**: Uses external CSS/colors instead of the Way of Pi theme.

## Desired Outcome

-   `Kanban.tsx` and all 9 components in `src/components/kanban/` compile without errors.
-   The full Kanban system is accessible via a `/kanban` route or integrated into "Work" mode.
-   The UI matches the Way of Pi theme (`#1e1e1e` backgrounds, `#ea580c` accents).
-   Services are wired to actual Way of Pi backends (where available) or cleaned-up mock services.

## Prerequisites

-   [ ] Phase 0: Core IDE build passes (Kanban excluded).
-   [ ] Phase 2: Unified Auth & Routing (provides the `/kanban` route entry point).
-   [ ] Phase 3: App.tsx Refactor (provides a clean `WorkPage.tsx` to host the board).

## Implementation Plan

### Phase 1: Dependency & Routing Cleanup
- [ ] Remove all `react-router-dom` imports and hooks (`useNavigate`, `useSearchParams`).
- [ ] Replace with `window.location.pathname` and URL parsing consistent with `App.tsx`.
- [ ] Fix `ToastContext` imports (change `../contexts/ToastContext` to `../context/ToastContext`).

### Phase 2: Service & Type Alignment
- [ ] **Type Audit**: Align `Board`, `KanbanBoard`, `BoardCard`, and `KanbanCard` interfaces.
- [ ] **Service Stubs**: Create or update `src/services/` to include missing methods used by Kanban:
    - `kanbanService`: `updateBoard`, `getBoards`, `getBoard`
    - `notesService`, `tasksService`, `driveService`: Ensure basic CRUD methods exist.
- [ ] Fix the `Promise` vs `SetStateAction` errors in `setAllBoards` and `setBoard` calls.

### Phase 3: Component Fixes
- [ ] Fix `ConfirmationModal` import — align with `src/components/modals/ConfirmationModal.tsx` (ensure it's a default vs named export match).
- [ ] Fix missing `createdBy`, `tags`, `stats`, `color`, `icon` property errors on `Board` and `Card` types.
- [ ] Replace `lucide-react` icons with `heroicons` where mismatches exist in `DocumentViewer.tsx` or Kanban views.

### Phase 4: Theming & UX
- [ ] Replace all hardcoded light-mode or external hex codes with Way of Pi Tailwind classes:
    - `bg-[#1e1e1e]` (Main background)
    - `bg-[#252525]` (Card/Panel background)
    - `text-[#cccccc]` (Secondary text)
    - `border-gray-800` (Borders)
    - `accent-[#ea580c]` (Active states)
- [ ] Ensure `useToast` is correctly wired to the global toast provider.

### Phase 5: Integration & Verification
- [ ] Remove `src/pages/Kanban.tsx` and `src/components/kanban/` from `tsconfig.app.json` exclude list.
- [ ] Add `/kanban` route to `App.tsx` (or integrate into `WorkPage.tsx`).
- [ ] Verify `bun run build` succeeds with Kanban included.
- [ ] Manual test: Create a board, add a card, move a card, open card details.

## Success Criteria
- [ ] `bun run build` passes with zero errors.
- [ ] Kanban UI is responsive and themed correctly.
- [ ] No "implicit any" errors in Kanban files.
- [ ] All 500+ Kanban-specific errors are resolved.

---
**Status**: Pending
**Priority**: Medium (Deferred until Core Stability)
**Estimated Effort**: L (1-2 dedicated sessions)
