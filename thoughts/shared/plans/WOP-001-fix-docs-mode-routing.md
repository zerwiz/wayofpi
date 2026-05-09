# Implementation Plan: WOP-001 Fix Docs Mode Routing Issues

**Ticket**: thoughts/shared/tickets/WOP-001-fix-docs-mode-routing-issues.md
**Created**: 2026-05-06
**Status**: In Progress

---

## Overview

Fix 3 major issues in Docs mode UI: FileExplorer not displaying files, ChatPanel not showing conversations, and DocumentBrowser being orphaned.

---

## Phase 1: Fix FileExplorer File Tree Loading

### Step 1.1: Investigate FileExplorer Component
- Read `apps/wayofwork-ui/src/components/docs/FileExplorer.tsx`
- Identify why file tree isn't loading
- Check if `nodes` prop is being passed correctly from DocsApp

### Step 1.2: Wire Up File Loading
- Ensure `docsNodes` is properly computed from `nodes` prop
- Verify TreeNode data structure matches expected format
- Add loading state while files are being fetched

### Step 1.3: Verify Integration
- Check DocsApp passes correct `nodes` to FileExplorer
- Test file tree renders with actual data

---

## Phase 2: Initialize AI Chat with History

### Step 2.1: Investigate ChatPanel/ChatMessages
- Read `ChatPanel.tsx` and `ChatMessages.tsx`
- Identify why `rows` array is empty
- Check if sessions are being initialized

### Step 2.2: Initialize Chat Sessions
- Add session initialization logic
- Populate `rows` with conversation history or default state
- Ensure `connected` state is properly managed

### Step 2.3: Test Chat Display
- Verify messages appear in ChatPanel
- Test sending new messages works correctly

---

## Phase 3: Handle DocumentBrowser Component

### Step 3.1: Decision - Integrate or Remove
- Analyze if DocumentBrowser provides unique value over FileExplorer
- **Option A**: Integrate into DocsApp as alternative browser
- **Option B**: Remove component if redundant

### Step 3.2: If Integrating - Fix loadFiles()
- Implement actual API call in `loadFiles()` function
- Wire up to backend file fetching endpoint
- Populate files state with real data

### Step 3.3: If Integrating - Fix Breadcrumb Navigation
- Implement folder navigation logic
- Update breadcrumb state on folder change
- Add click handlers for breadcrumb items

### Step 3.4: If Integrating - Connect Filter/Search
- Wire up `filterType` state to actual filtering logic
- Implement `searchQuery` filtering
- Test filter and search functionality

### Step 3.5: Fix CSS Issue
- Create `DocumentBrowser.css` with proper styles
- Or remove CSS import if component is removed

### Step 3.6: Integrate into DocsApp
- Import DocumentBrowser in DocsApp
- Add toggle or tab to switch between FileExplorer/DocumentBrowser
- Pass required props and wire up event handlers

---

## Phase 4: Improve Empty States

### Step 4.1: Add Loading Indicators
- Add loading state to FileExplorer while fetching files
- Add loading state to DocumentBrowser if integrated
- Show spinner or skeleton while data loads

### Step 4.2: Better Empty State Messages
- Replace permanent "No files" with context-aware messages
- Add helpful hints for users when no content available
- Ensure empty states don't block UI interaction

---

## Phase 5: Consolidate Routing Logic

### Step 5.1: Review Dual Routing Paths
- Analyze Path A (DocsApp handleSelectFile) and Path B (Context update)
- Identify redundancy in state management

### Step 5.2: Merge if Redundant
- Consolidate file selection logic into single path
- Ensure PreviewModal receives correct file reference
- Test file selection works through consolidated path

---

## Phase 6: Verification

### Step 6.1: Run Tests
```bash
cd apps/wayofwork-ui && bun run test
```

### Step 6.2: Build Check
```bash
cd apps/wayofwork-ui && bun run build
```

### Step 6.3: Manual Testing Checklist
- [ ] FileExplorer displays populated file tree
- [ ] ChatPanel shows conversation history
- [ ] DocumentBrowser integrated or removed
- [ ] Breadcrumb navigation works (if integrated)
- [ ] Search/filter works (if integrated)
- [ ] No CSS errors
- [ ] Empty states show loading/helpful messages
- [ ] File selection opens preview correctly

---

## Files to Modify

1. `apps/wayofwork-ui/src/components/docs/FileExplorer.tsx`
2. `apps/wayofwork-ui/src/components/docs/ChatPanel.tsx`
3. `apps/wayofwork-ui/src/components/docs/ChatMessages.tsx`
4. `apps/wayofwork-ui/src/components/docs/DocumentBrowser.tsx`
5. `apps/wayofwork-ui/src/components/docs/DocsApp.tsx`
6. `apps/wayofwork-ui/src/components/docs/DocumentHandlerContext.tsx`
7. `apps/wayofwork-ui/src/components/docs/DocumentBrowser.css` (create or remove)

---

## Estimated Time

- Phase 1: 1-2 hours
- Phase 2: 1-2 hours
- Phase 3: 2-3 hours
- Phase 4: 30 minutes
- Phase 5: 1 hour
- Phase 6: 30 minutes

**Total**: 6-9 hours
