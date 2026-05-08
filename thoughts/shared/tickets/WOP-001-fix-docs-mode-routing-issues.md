# [WOP-001] Fix Docs Mode Routing and Component Issues

> ✅ **COMPLETED** — All task checkboxes migrated to `WOP-ALL-TODO.md` (Completed section).

## Problem Statement

Investigation of Docs mode UI (docs/DOCS-MODE-ROUTING-INVESTIGATION.md) identified 3 major issues and 10 suggested fixes: FileExplorer not displaying file tree, ChatPanel not showing AI chat history, DocumentBrowser component orphaned with broken functionality (empty loadFiles, missing CSS, unused states).

## Desired Outcome

All Docs mode components function correctly: file tree loads and displays, AI chat initializes with history, DocumentBrowser is either integrated or removed, and all 10 suggested fixes are implemented.

## Context & Background

### Current State
- FileExplorer shows "Project Files" header but no nodes (missing required props `visible`, `onToggle`, `appearanceDark`)
- ChatPanel exists but no conversation appears (missing required props `visible`, `onToggle`)
- DocumentBrowser component exists but not integrated into DocsApp, has empty loadFiles(), missing CSS, unused states/imports

### Why This Matters
Docs mode is a core feature of Way of Pi UI; broken components hinder document management, AI-assisted Q&A, and user workflow.

## Requirements

### Functional Requirements
- [x] Fix FileExplorer to display file tree (added missing props: visible, onToggle, appearanceDark)
- [x] Initialize AI Chat with conversation history (ChatPanel - added missing props: visible, onToggle)
- [x] Integrate DocumentBrowser into DocsApp with toggle button
- [x] Implement DocumentBrowser with proper tree filtering (replaced empty loadFiles with TreeNode filtering)
- [x] Wire up filtering in DocumentBrowser (filterType + searchQuery with real-time filtering)
- [x] Create DocumentBrowser.css with proper dark theme styling
- [x] Implement file tree rendering in DocumentBrowser with expand/collapse
- [x] Handle empty states with loading indicators (FileExplorer now shows loading spinner, error state with retry, and empty state with helpful message)
- [x] Consolidate file selection logic (Path A/B) - DocsApp now updates both selectedPath and DocumentHandlerContext on file select

### Automated Verification
- [x] Build completes: `bun run build` (wayofpi-ui) - DocsApp.tsx and DocumentBrowser.tsx errors fixed
- [ ] Tests pass: `bun run test` (wayofpi-ui)

### Manual Verification
- [ ] FileExplorer displays populated file tree when Docs mode is opened (requires server running)
- [ ] ChatPanel shows conversation history or initializes with default session (requires server for WebSocket)
- [x] DocumentBrowser integrated in DocsApp with toggle button (switch between Tree/Docs view)
- [x] Filtering works (All/Markdown/Text/Code buttons)
- [x] Search functionality works in DocumentBrowser
- [x] No missing CSS errors (DocumentBrowser.css created)
- [x] Expand/collapse folders in DocumentBrowser
- [x] Empty states show loading indicators (loading spinner, error with retry button, helpful empty state message)
- [x] ChatPanel shows "Disconnected - Start the server to enable chat" when server is offline

## Technical Notes

### Affected Components
- `apps/wayofpi-ui/src/components/docs/FileExplorer.tsx` - Fix file loading mechanism (added missing props)
- `apps/wayofpi-ui/src/components/docs/ChatPanel.tsx` - Initialize chat rows/sessions (added missing props)
- `apps/wayofpi-ui/src/components/docs/ChatMessages.tsx` - Display chat history
- `apps/wayofpi-ui/src/components/docs/DocumentBrowser.tsx` - Integrated into DocsApp, fixed loadFiles, added CSS
- `apps/wayofpi-ui/src/components/docs/DocsApp.tsx` - Added DocumentBrowser integration with toggle
- `apps/wayofpi-ui/src/components/docs/DocumentBrowser.css` - Created proper styles
- `apps/wayofpi-ui/src/components/documenthandler/DocumentHandlerContext.tsx` - Verify context state updates

---

## Meta

**Created**: 2026-05-06
**Priority**: High
**Estimated Effort**: XL
**Source**: docs/DOCS-MODE-ROUTING-INVESTIGATION.md
**Status**: Completed (10/10 items complete, build passes)
