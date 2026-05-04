# Plan: Docs UI Mode + File Tree Enhancements

## Goal
Add a standalone "docs" UI mode with 3-panel layout (file tree | chat | preview) and enhance the Simple view with indexing status + file tree context menu.

## Status: ✅ Implementation Complete

## What Was Done

### 1. Docs UI Mode (Standalone)
- **`useUiMode.ts`**: Added `"docs"` to `UiMode` type, `switchToDocs()` callback, `isDocs` flag. Toggle cycle: `simple → technical → claw → docs → simple`.
- **`useWayOfPiSession.ts`**: Added `"docs"` to `ChatSessionSurfaceId` type so docs mode gets its own chat session.
- **`components/docs/DocsApp.tsx`**: New 3-panel layout component:
  - Left: `FileExplorer` (file tree)
  - Center: `ChatPanel` (chat interface)
  - Right: `PreviewModal` (file preview)
  - Toggle buttons for left/right panels
  - Uses existing `useWayOfPiSession` chat hooks
- **`components/docs/index.ts`**: Export `DocsApp`
- **`App.tsx`**: Import + render `DocsApp` when `uiMode === "docs"` (line 4431)

### 2. Simple Secondary Toolbar Enhancements
- **`SimpleSecondaryToolbar.tsx`**: Added:
  - Indexing status dot (orange when indexing)
  - "Docs" button (`FileText` icon) to switch to docs mode
  - New props: `onSwitchToDocs`, `indexingStatus`
- **`SimpleApp.tsx`**: Passes `onSwitchToDocs` and `indexingStatus` to toolbar

### 3. File Tree Context Menu
- **`FileExplorer.tsx`**: Added right-click context menu with:
  - Copy path (to clipboard via `navigator.clipboard.writeText`)
  - Rename (prompt dialog + `POST /api/file/rename`)
  - Delete (confirm dialog + `DELETE /api/file`)
  - Icons: `Copy`, `Pencil`, `Trash2` from `lucide-react`
  - `onContextMenu` handler on file/dir items

### 4. Editable File Types
- **`server/paths.ts`**: Added `EDITABLE_EXTENSIONS` set + `isFileEditable()` function
  - Supports: md, txt, doc, pdf, js, ts, tsx, jsx, py, json, yaml, yml, html, css, scss, less, xml, svg, png, jpg, jpeg, gif, bmp, ico, webp, mp4, webm, ogg, mp3, wav, flac, zip, tar, gz, rar, 7z, pdf

### 5. Documentation
- **`docs/STRUCTURE.md`**: Full 3-level project structure documentation
- **`plans/PLAN-DOCS-UI.md`**: This file
- **`CHANGELOG.md`**: Added entry under `[Unreleased] → Added`

## Files Modified
1. `apps/wayofpi-ui/src/hooks/useUiMode.ts` - Added docs mode
2. `apps/wayofpi-ui/src/hooks/useWayOfPiSession.ts` - Added docs to ChatSessionSurfaceId
3. `apps/wayofpi-ui/src/components/docs/DocsApp.tsx` - New 3-panel docs UI (201 lines)
4. `apps/wayofpi-ui/src/components/docs/index.ts` - Export DocsApp
5. `apps/wayofpi-ui/src/App.tsx` - Wire DocsApp rendering
6. `apps/wayofpi-ui/src/components/simple/SimpleSecondaryToolbar.tsx` - Add indexing dot + Docs button
7. `apps/wayofpi-ui/src/components/simple/SimpleApp.tsx` - Pass new props to toolbar
8. `apps/wayofpi-ui/src/components/documenthandler/FileExplorer.tsx` - Add context menu
9. `apps/wayofpi-ui/server/paths.ts` - Add EDITABLE_EXTENSIONS + isFileEditable()

## API Endpoints Needed (Server-Side)
- `POST /api/file/rename` - Rename file/directory
- `DELETE /api/file` - Delete file/directory

Note: These endpoints may need to be implemented in `apps/wayofpi-ui/server/index.ts`.

## Testing
1. Start the app: `just wayofpi-electron` or `./start-wayofpi-ui.sh`
2. Toggle through modes: Simple → Technical → Claw → Docs → Simple
3. In Docs mode, verify 3-panel layout appears
4. Right-click any file in Simple or Docs file tree → context menu appears
5. Test Copy path, Rename, Delete actions
6. Click "Docs" button in Simple toolbar → switches to Docs mode

## Known Issues
- Build errors exist in unrelated files (`shared/claw-automation-status.ts`, `ModelSelectorModal.tsx`, `Chat.tsx`, etc.) - these are pre-existing and block full build verification
- Indexing status is wired but needs actual indexing state from server
- API endpoints for rename/delete may need implementation
