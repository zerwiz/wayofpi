# [WOP-014] App.tsx Monolith Refactoring — Dual-Agent Coordination

## Problem
`apps/wayofwork-ui/src/App.tsx` is ~4820 lines. Two agents need to refactor it in parallel without merge conflicts.

## Goal
App.tsx → ~200 lines. Agents split by territory (not file ownership).

---

## Territory Split (DO NOT CROSS)

```
App.tsx lines:
  1-180     Imports                     → Agent A moves imports to hooks
  181-273   Helper functions            → Agent A moves to utils/
  274-1792  Function body & state       → Agent A territory (hooks extraction)
  1793-1843 Modal state declarations    → Agent A: useModalState.ts
  1844-3850 Handler/menu definitions    → Agent A: useWorkspaceActions, useEditorHandlers, etc.
  3851-4060 Claw mode return block      → Agent B: ClawPage.tsx (DONE ✅)
  4063-4084 Docs mode return block      → Agent B: DocsPage.tsx (DONE ✅)
  4086-4094 Work mode return block      → Agent B: WorkPage.tsx (DONE ✅)
  4096-4309 Simple mode return block    → Agent B: SimplePage.tsx (TODO)
  4311-4415 Technical workspace body    → Agent B: TechnicalPage.tsx content
  4417-4819 Technical mode return       → Agent B: TechnicalPage.tsx shell
```

## The Handshake Contract

Both agents agree on these interfaces. Created files must match.

### 1. RefactorContext (Agent A creates, Agent B consumes)

```tsx
// src/context/RefactorContext.tsx
interface RefactorContextValue {
  // Shell
  uiMode: string;
  setUiMode: (m: string) => void;
  modelLabel: string;
  config: Record<string, any> | null;
  workspaceOperational: boolean;
  
  // Tree
  root: string; rootLabel: string;
  nodes: TreeNode[]; folders: { label: string; path: string }[];
  treeLoading: boolean; treeError: string | null;
  refreshTree: () => Promise<void>;
  refreshTreeQuietShell: () => Promise<void>;
  
  // Session
  session: {...}; // useWayOfPiSession return
  
  // Editor
  selectedPath: string | null; setSelectedPath: (p: string | null) => void;
  content: string; setContent: (c: string) => void;
  dirty: boolean; save: () => Promise<boolean>;
  // ... full editor state
  
  // Modal state (from useModalState)
  modals: {...};
  
  // Menu handlers
  menus: { fileMenu, editMenu, ... };
}
```

### 2. Page Component Props (Agent B creates the interface, Agent A feeds via context)

Agent B's pages accept grouped prop objects:
- `<ClawPage shell={} tree={} editor={} session={} menus={} modals={} ... />` (DONE ✅)
- `<SimplePage shell={} tree={} editor={} session={} menus={} modals={} ... />` (TODO - same shape)
- `<TechnicalPage ... />` (TODO - same shape + extra Technical props)
- `<DocsPage uiMode setUiMode nodes treeLoading treeError refreshTree selectedPath setSelectedPath rows streaming connected sendChat stop />` (DONE ✅)
- `<WorkPage uiMode setUiMode />` (DONE ✅)

---

## Agent A Tasks (Logic & Hooks — top 3850 lines)

### Priority 1: RefactorContext.tsx
Create `src/context/RefactorContext.tsx` with provider that wraps:
- `useUiMode()` → uiMode, setUiMode
- `useWorkspaceTree()` → root, nodes, folders, treeLoading, treeError, refresh, refreshQuiet
- `useWayOfPiSession()` → full session object
- `useServerConfig()` → config
- `useAgents()` → agentsApi
- `useSimplePreferences()` → simpleChatStreamUiEnabled
- `useUiViewsCatalog()` → uiViewsCatalog
- `useWorkspaceStaticAnalysis()` → workspaceStaticAnalysisApi

This is the BRIDGE. Both agents depend on it. Do it first.

### Priority 2: useModalState.ts
Extract from App.tsx lines 676, 1146, 1793-1803, 1847-1849:
```
commandPaletteOpen, hostDoctorOpen, indexingDocsOpen, honchoSettingsOpen,
agentPermissionsOpen, launchConfigAddOpen, installDebuggersModalOpen,
mitLicenseModalOpen, restartServerModalOpen, howToUseModalOpen,
clawHelpOpen, clawHelpDefaultSection, newPlanFileModalOpen,
llmFixModalDismissed, showLlmFixModal (derived from session.error)
```
Return: `{ commandPaletteOpen, setCommandPaletteOpen, ..., modals: { all pairs } }`

### Priority 3: useWorkspaceActions.ts
Extract from App.tsx:
- `handleNewFile`, `handleNewFolder`, `handleExplorerMoveFile`
- `handleExplorerRenameNode`, `handleExplorerDeleteNode`
- `handleNewPlanFile`, `handleNewPlanFileCreate`

### Priority 4: useEditorCommandHandlers.ts
Extract from App.tsx:
- `saveAndRefresh`, `reloadFocusedOrMain`, `discardUnsavedChanges`
- `save`, `reload` (the core save/reload from useFileEditor)

### Priority 5: useNavigationHandlers.ts
Extract from App.tsx:
- `goHistoryBack`, `goHistoryForward`, `focusWorkspaceFileFromMenu`

### Conflict-Free Zones for Agent A:
- `src/context/` — new files only
- `src/hooks/` — new files only
- App.tsx lines 1-3850 — existing code you may extract from
- **NEVER touch lines 3851-4819** (those are the return blocks — Agent B's territory)
- **NEVER create or modify files in `src/pages/` or `src/components/`** (Agent B's territory)

---

## Agent B Tasks (Page Shells — bottom 1000 lines)

### Done ✅
- `src/pages/DocsPage.tsx` — Docs mode from lines 4063-4084
- `src/pages/WorkPage.tsx` — Work mode from lines 4086-4094
- `src/components/IdeLayout.tsx` — Shared MenuBar + file input wrapper
- `src/components/ModalsRenderer.tsx` — All 12 shared modals in one component
- `src/pages/ClawPage.tsx` — Claw mode from lines 3851-4060 (accepts grouped props)

### Next
- [ ] `src/pages/SimplePage.tsx` — Extract lines 4096-4309
- [ ] `src/pages/TechnicalPage.tsx` — Extract lines 4311-4819
- [ ] Wire IdeLayout + ModalsRenderer into App.tsx (replace inline return blocks)
- [ ] Thin App.tsx to switch statement

### Conflict-Free Zones for Agent B:
- `src/pages/` — new page files
- `src/components/IdeLayout.tsx` — already created
- `src/components/ModalsRenderer.tsx` — already created
- App.tsx lines 3851-4819 — existing return blocks to extract from
- **NEVER touch App.tsx lines 1-3850** (function body — Agent A's territory)
- **NEVER modify existing hooks or contexts** (Agent A's territory)

---

## Communication Rules

1. **Check WOP-ALL-TODO.md before starting** — mark what you're working on
2. **Update WOP-014 doc** with progress after each completed task
3. **If you need a prop/interface from the other agent's territory**, add it to this doc's "Handshake Contract" section, don't create it yourself
4. **If the other agent's file doesn't exist yet**, stub it with a TODO comment — don't wait
5. **Build check** after every 3 changes — both agents should run `bun run build` to catch mismatches early

---

## Current Status

| What | Who | Status |
|------|-----|--------|
| DocsPage.tsx | Agent B | ✅ Done |
| WorkPage.tsx | Agent B | ✅ Done |
| IdeLayout.tsx | Agent B | ✅ Done |
| ModalsRenderer.tsx | Agent B | ✅ Done |
| ClawPage.tsx | Agent B | ✅ Done |
| RefactorContext.tsx | Agent A | ✅ Done |
| useModalState.ts | Agent A | ✅ Done |
| useWorkspaceActions.ts | Agent A | ✅ Done |
| useEditorCommandHandlers.ts | Agent A | ⬜ Todo |
| useNavigationHandlers.ts | Agent A | ⬜ Todo |
| SimplePage.tsx | Agent B | ⬜ Todo |
| TechnicalPage.tsx | Agent B | ⬜ Todo |
| Wire pages into App.tsx | Agent B | ⬜ Todo |
| Thin App.tsx | Both | ⬜ Todo (final merge) |
