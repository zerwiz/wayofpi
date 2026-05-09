# Plan: Docs UI - Document Management Interface

## Goal

Create a **Docs** interface for managing documentation files with a 3-panel layout:
- **Left**: File tree (browse docs/files)
- **Middle**: Chat (discuss docs with AI)
- **Right**: Document preview

---

## Current State

### What Exists
1. **Simple view** - tab-based: Chat, My Team, AI Brains, Projects, Documents, Settings
2. **Documents tab** (`documenthandler/ChatExplorer.tsx`) - basic file tree + chat (2-panel, no preview)
3. **`DocsApp.tsx`** - created but not properly wired (has 3-panel layout code)
4. **UI modes**: `simple`, `technical`, `claw` (defined in `useUiMode.ts`)

### Issues
- "docs" was incorrectly added as a SimpleNavRail tab (it should be its own UI mode like simple/technical/claw)
- Build errors with missing CSS files
- Unclear whether Docs should be a mode or a view

---

## Decision: Docs as Standalone UI Mode

Add **`docs`** as a 4th UI mode (like `simple`, `technical`, `claw`):

```
UiMode = "simple" | "technical" | "claw" | "docs"
```

### Why?
- Docs needs its own full-screen 3-panel layout
- Should be accessible via mode toggle (Shift+Tab cycle) and settings
- Separate from Simple view's tab system

---

## Implementation Plan

### 1. Fix Current Errors
- [x] Fix `Chat.tsx` CSS import (done: changed to `./styles/ChatExplorer.css`)
- [ ] Revert `SimpleNavRail.tsx` - remove "Docs" tab (keep only: Chat, My Team, AI Brains, Projects, Documents, Settings)
- [ ] Revert `SimpleApp.tsx` - remove DocsApp import and rendering

### 2. Create `DocsApp.tsx` as Standalone Mode
Location: `apps/wayofwork-ui/src/components/docs/DocsApp.tsx`

**Layout** (3-panel, responsive):
```
┌─────────────────────────────────────────────────────┐
│  Header: "DOCS" mode indicator + workspace info     │
├──────────┬───────────────────┬────────────────────┤
│          │                   │                    │
│  File   │      Chat        │    Preview        │
│  Tree   │  (discuss       │   (view selected │
│  (browse │   documents)    │    document)      │
│  docs)  │                   │                    │
│          │                   │                    │
├──────────┴───────────────────┴────────────────────┤
│  Status bar (same as other modes)                  │
└─────────────────────────────────────────────────────┘
```

**Props interface**:
```typescript
interface DocsAppProps {
  uiMode: UiMode;
  setUiMode: (m: UiMode) => void;
  root: string | null;
  rootLabel: string;
  nodes: TreeNode[];
  treeLoading: boolean;
  treeError: string | null;
  refreshTree: () => void;
  selectedPath: string | null;
  setSelectedPath: (p: string | null) => void;
  content: string;
  setContent: (s: string) => void;
  fileMimeType: string | null;
  fileLoading: boolean;
  fileError: string | null;
  rows: ChatRow[];
  streaming: boolean;
  connected: boolean;
  sendChat: (t: string) => void;
  stop: () => void;
  // ... other props matching SimpleApp/ClawApp pattern
}
```

### 3. Wire Into `App.tsx`
- Import `DocsApp` in `App.tsx`
- Add rendering condition: `mode === "docs" && <DocsApp ... />`
- Follow same pattern as `SimpleApp` and `ClawApp` rendering (lines 3886, 4099)

### 4. Update `useUiMode.ts`
Current state (done):
```typescript
export type UiMode = "simple" | "technical" | "claw" | "docs";
```
- [x] Toggle cycle: simple → technical → claw → docs → simple

### 5. Add to Settings View
- Add "Docs" option in SimpleSettingsView "Switch to mode" section
- Allow switching from simple/technical/claw to docs

### 6. Mobile Support
- Add "Docs" tab to `SimpleMobileTabBar` create `DocsMobileTabBar`
- Responsive: stack panels vertically on small screens

---

## File Changes Checklist

### Core Files
- [x] `hooks/useUiMode.ts` - add "docs" to UiMode type
- [ ] `components/docs/DocsApp.tsx` - create standalone docs mode (NEW FILE)
- [ ] `App.tsx` - import + render DocsApp
- [ ] `components/docs/index.ts` - export DocsApp

### Revert/Remove
- [ ] `SimpleNavRail.tsx` - remove "Docs" tab (keep 6 tabs)
- [ ] `SimpleApp.tsx` - remove DocsApp import/rendering
- [ ] `documenthandler/DocsApp.tsx` - either remove or repurpose

### Existing Files to Reuse
- `documenthandler/FileExplorer.tsx` - file tree component
- `documenthandler/ChatPanel.tsx` - chat component
- `documenthandler/PreviewModal.tsx` - preview component
- `documenthandler/PreviewContent.tsx` - content renderer

---

## Success Criteria

1. **Mode toggle works**: Shift+Tab cycles through simple → technical → claw → docs
2. **3-panel layout**: File tree | Chat | Preview (resizable)
3. **File browsing**: Click file in tree → opens preview in right panel
4. **Chat works**: Can discuss selected document with AI
5. **Preview works**: Shows document content (markdown, code, PDF, etc.)
6. **No build errors**: `bun run dev` works clean
7. **Mobile responsive**: Panels stack vertically on small screens

---

## Questions to Align

1. Should "Docs" mode use the same workspace as other modes, or have its own workspace root?
2. Should the "Documents" tab in Simple view be removed, or kept as a quick-access version?
3. Should file edits be allowed in Docs mode, or is it view-only?
4. Should we support drag-and-drop file upload into the docs interface?

---

*Created: 2026-05-04*
*Status: Planning phase - need alignment before implementation*
