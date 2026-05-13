# Kanban Feature Completeness (Phase 10)

## Status
**Ticket**: WOP-019 (Phase 10)  
**Priority**: High  
**Dependencies**: None (all components and routes already exist)  
**Build**: Currently passing

## Summary

The Kanban board page (`src/pages/Kanban.tsx`) and its 9 sub-components were ported from `ref/kanban/` with all features intact, but the UI colors do not match the app design system. Instead of using the app's dark theme (`bg-[#1e1e1e]`, `text-[#cccccc]`), the Kanban uses raw Tailwind `bg-gray-900`, `text-white`, and `purple-600` accent colors.

The Toast notification system has a provider and context but needs verification that toasts render visually.

## Vertical Slices (in dependency order)

### Slice 1: Color Scheme — Kanban.tsx Board List View
**Files**: `src/pages/Kanban.tsx` (lines 1020–1324)  
**Description**: Replace all Tailwind color classes in the board list view (shown when no board is selected) with app design system colors.

Color mapping:
| Old | New | Usage |
|-----|-----|-------|
| `bg-gray-900` | `bg-[#1e1e1e]` | Main page background |
| `bg-gray-800` | `bg-[#252526]` | Card/panel backgrounds |
| `bg-gray-700` | `bg-[#333333]` | Hover states, borders |
| `text-white` | `text-[#cccccc]` | Primary text (h1, h2, labels) |
| `text-gray-400` | `text-[#858585]` | Secondary/muted text |
| `text-gray-500` | `text-[#6e6e6e]` | Placeholder text |
| `text-gray-300` | `text-[#a0a0a0]` | Tertiary text |
| `border-gray-700` | `border-[#333333]` | Borders, dividers |
| `purple-600` | `#ea580c` (orange) or `#007acc` (blue) | Accent buttons, active states |
| `purple-500`/`pink-500` | `#ea580c` | Gradient accents |
| `hover:border-purple-600/50` | `hover:border-[#ea580c]/50` | Hover accent borders |
| `shadow-purple-500/20` | `shadow-[#ea580c]/20` | Hover shadows |

### Slice 2: Color Scheme — Kanban.tsx Board View
**Files**: `src/pages/Kanban.tsx` (lines 1325–3302)  
**Description**: Replace all Tailwind color classes in the main board view (columns, cards, drag-drop, header, stats, timeline, search, filter) with app design system colors. Same mapping as Slice 1.

### Slice 3: Color Scheme — Kanban Sub-Components
**Files**: `src/components/kanban/CardView.tsx`, `src/components/kanban/BoardSettingsModal.tsx`, `src/components/kanban/BoardMembers.tsx`, `src/components/kanban/BoardSelector.tsx`, `src/components/kanban/BoardDocsView.tsx`, `src/components/kanban/BoardDriveView.tsx`, `src/components/kanban/PushToKanbanModal.tsx`, `src/components/kanban/PushWorkflowToKanbanModal.tsx`, `src/components/kanban/PushTaskListToKanbanModal.tsx`  
**Description**: Replace all Tailwind color classes across all 9 sub-components with app design system colors. Same mapping as Slice 1.

### Slice 4: Toast Visual Rendering
**Files**: `src/contexts/ToastContext.tsx`  
**Description**: Verify that the Toast visual renderer (the `fixed bottom-4 right-4 z-[100]` div at lines 32–47) renders correctly. The component exists but may need styling to match the app design system. Change toast colors from raw red-600/green-600 to app-compatible colors.

### Slice 5: Verification
**Files**: All modified files  
**Description**: Run `bun run build` and verify no TS errors. Verify all 7 views (Kanban, Timeline, Calendar, Docs, Drive, List, Board Select), 6 modals (Create/Edit Card, Board Settings, Board Members, Board Selector, Templates, Confirmation Modals), and 30+ features work correctly after color changes.

## Implementation Notes

- Use exact hex values: `bg-[#1e1e1e]`, `bg-[#252526]`, `bg-[#333333]`, `text-[#cccccc]`, `text-[#858585]`, `text-[#6e6e6e]`
- Accent: `#ea580c` (orange) for interactive elements, `#007acc` (blue) for info/links
- Keep emoji icons, icon colors, and semantic colors (red for urgent, green for done, yellow for medium priority) as-is
- Confirmation modals (`confirmDeleteCard`, `confirmDeleteColumn`, `confirmDeleteBoard`) use `ConfirmationModal` component — ensure its styling is also app-compatible
- Some `bg-gradient-to-r` elements use purple/pink — these should become orange accents

## Acceptance Criteria

1. [ ] Board list view uses `bg-[#1e1e1e]`, `text-[#cccccc]` instead of `bg-gray-900`, `text-white`
2. [ ] Board view (columns, cards) uses app design system colors
3. [ ] All 9 sub-components use app design system colors
4. [ ] Toast notifications render visually with app-compatible colors
5. [ ] `bun run build` passes with no TS errors
6. [ ] All 7 views render correctly
7. [ ] All 6 modals open/close/function correctly
