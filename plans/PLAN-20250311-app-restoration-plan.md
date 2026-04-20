# Way of Pi App Restoration Plan

## Background
The `App copy.tsx` file contains broken/missing functionality that was accidentally deleted when an agent rewrote the entire file. We need to merge these functions FROM the broken `App copy.tsx` TO the working `App.tsx`.

## Goal
Merge missing functions FROM broken `App copy.tsx` TO working `App.tsx` by importing one function at a time and verifying each import works before continuing.

---

## Migration Direction
```
App copy.tsx (broken source) → App.tsx (working target)
```

---

## Source: App copy.tsx (Broken)
- Missing Plan artifact bootstrap functions
- Missing navigation history state
- Missing edit menu handlers

---

## Target: App.tsx (Working)
- Has all functions intact
- Needs selective imports from broken copy

---

## Restoration Phases

### Phase 1: Core Plan Artifact Functions (HIGH PRIORITY)

#### Step 1.1: tryOrchestratorPlanArtifactBootstrap
**Source Lines in App copy.tsx:** ~1289-1315  
**Functionality:** Creates `plans/PLAN-*.md` when workspace is empty in Plan mode  
**Import Order:** FIRST - critical for Plan mode functionality

```tsx
const tryOrchestratorPlanArtifactBootstrap = useCallback(
  (agentName: string | null) => {
    if (agentName != null) return;
    const hasWorkspace = Boolean(root) || folders.length > 0;
    if (!hasWorkspace) return;
    if (orchestratorPlanBootstrapLockRef.current) return;
    orchestratorPlanBootstrapLockRef.current = true;
    void (async () => {
      try {
        const d = await apiGet<{ files: Array<{ path: string }> }>("/api/plans");
        if ((d.files?.length ?? 0) > 0) return;
        const { path } = await createPlanArtifactInWorkspace({
          slugSuggestion: "session",
          title: "Plan",
        });
        setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(path) });
        await refresh();
        setSelectedPath(path);
      } catch {
        /* user can create manually via File: New plan markdown */
      } finally {
        orchestratorPlanBootstrapLockRef.current = false;
      }
    })();
  },
  [folders.length, refresh, root],
);
```

**Dependencies needed:**
- `orchestratorPlanBootstrapLockRef`
- `createPlanArtifactInWorkspace`
- `ancestorDirPaths`
- `apiGet`

---

#### Step 1.2: handleChatModeChange
**Source Lines in App copy.tsx:** ~1329-1351  
**Functionality:** Switches between chat and plan modes, handles seed Plan files

```tsx
const handleChatModeChange = useCallback(
  (m: Parameters<typeof session.setChatMode>[0]) => {
    const agentAtClick = session.chatAgentName;
    session.setChatMode(m);
    if (m === "plan" && (uiMode === "simple" || uiMode === "claw")) {
      setSelectedPath((p) => {
        if (!p) return null;
        const norm = p.replace(/\\/g, "/");
        if (/(^|\/)plans\/plan-[^/]+\.md$/i.test(norm)) return null;
        return p;
      });
    }
    if (m !== "plan") return;
    tryOrchestratorPlanArtifactBootstrap(agentAtClick);
  },
  [
    session.chatAgentName,
    session.setChatMode,
    setSelectedPath,
    uiMode,
    tryOrchestratorPlanArtifactBootstrap,
  ],
);
```

---

#### Step 1.3: prevTechnicalChatModeRef & shellBeforePlanRef
**Source Lines in App copy.tsx:** ~1354-1365  
**Functionality:** Restores shell state when leaving Plan mode

```tsx
const prevTechnicalChatModeRef = useRef<ChatSessionMode | null>(null);
const latestShellForPlanRef = useRef<{ activity: TechnicalActivity; leftSidebarVisible: boolean }>({
  activity: "explorer",
  leftSidebarVisible: true,
});
const shellBeforePlanRef = useRef<{ activity: TechnicalActivity; leftSidebarVisible: boolean } | null>(null);
```

---

#### Step 1.4: useEffect for chat mode transitions
**Source Lines in App copy.tsx:** ~1366-1406  
**Functionality:** Handles Plan mode entry/exit, restores shell state

```tsx
useEffect(() => {
  if (uiMode !== "technical") return;
  const prev = prevTechnicalChatModeRef.current;
  const mode = session.chatMode;
  prevTechnicalChatModeRef.current = mode;

  if (mode === "plan") {
    if (prev !== "plan") {
      shellBeforePlanRef.current = { ...latestShellForPlanRef.current };
      persistLeftSidebar(true);
      setActivity("planning");
    }
    return;
  }

  if (prev === "plan") {
    const snap = shellBeforePlanRef.current;
    shellBeforePlanRef.current = null;
    if (snap) {
      setActivity(snap.activity);
      persistLeftSidebar(snap.leftSidebarVisible);
    }
  } else {
    shellBeforePlanRef.current = null;
  }
}, [persistLeftSidebar, session.chatMode, uiMode]);
```

---

#### Step 1.5: openWorkspaceSearch
**Source Lines in App copy.tsx:** ~1391-1395  
**Functionality:** Opens planning sidebar in Technical mode

```tsx
const openWorkspaceSearch = useCallback(() => {
  setUiMode("technical");
  persistLeftSidebar(true);
  setActivity("search");
}, [persistLeftSidebar]);
```

---

### Phase 2: Navigation History Functions (HIGH PRIORITY)

#### Step 2.1: Navigation History State & Refs
**Source Lines in App copy.tsx:** ~1397-1399  
**Functionality:** Tracks navigation history for Go To menu

```tsx
const navHistoryRef = useRef<{ stack: string[]; idx: number }>({ stack: [], idx: -1 });
const skipHistoryPushRef = useRef(false);
const [navHistoryTick, setNavHistoryTick] = useState(0);
```

---

#### Step 2.2: History Push Effect
**Source Lines in App copy.tsx:** ~1411-1431  
**Functionality:** Pushes current path to history stack

```tsx
useEffect(() => {
  if (skipHistoryPushRef.current) {
    skipHistoryPushRef.current = false;
    setNavHistoryTick((t) => t + 1);
    return;
  }
  if (!selectedPath) {
    setNavHistoryTick((t) => t + 1);
    return;
  }
  const h = navHistoryRef.current;
  const cur = h.stack[h.idx];
  if (cur === selectedPath) {
    setNavHistoryTick((t) => t + 1);
    return;
  }
  const nextStack = h.stack.slice(0, h.idx + 1);
  nextStack.push(selectedPath);
  navHistoryRef.current = { stack: nextStack, idx: nextStack.length - 1 };
  setNavHistoryTick((t) => t + 1);
}, [selectedPath]);
```

---

#### Step 2.3: goHistoryBack
**Source Lines in App copy.tsx:** ~1423-1444  
**Functionality:** Navigate back in history

```tsx
const goHistoryBack = useCallback(() => {
  const h = navHistoryRef.current;
  if (h.idx <= 0) return;
  h.idx -= 1;
  const p = h.stack[h.idx];
  if (!p) return;
  skipHistoryPushRef.current = true;
  setSelectedPath(p);
  setNavHistoryTick((t) => t + 1);
  if (uiMode === "simple") {
    setSimpleTab("chat");
    if (shouldBumpSimpleMenuFileFocus) bumpSimpleMobileMenuFileFocus();
  } else if (uiMode === "claw") {
    focusClawTabAfterWorkspaceFileSelect();
  }
}, [
  uiMode,
  shouldBumpSimpleMenuFileFocus,
  bumpSimpleMobileMenuFileFocus,
  focusClawTabAfterWorkspaceFileSelect,
  setSimpleTab,
]);
```

---

#### Step 2.4: goHistoryForward
**Source Lines in App copy.tsx:** ~1446-1467  
**Functionality:** Navigate forward in history

```tsx
const goHistoryForward = useCallback(() => {
  const h = navHistoryRef.current;
  if (h.idx >= h.stack.length - 1) return;
  h.idx += 1;
  const p = h.stack[h.idx];
  if (!p) return;
  skipHistoryPushRef.current = true;
  setSelectedPath(p);
  setNavHistoryTick((t) => t + 1);
  if (uiMode === "simple") {
    setSimpleTab("chat");
    if (shouldBumpSimpleMenuFileFocus) bumpSimpleMobileMenuFileFocus();
  } else if (uiMode === "claw") {
    focusClawTabAfterWorkspaceFileSelect();
  }
}, [
  uiMode,
  shouldBumpSimpleMenuFileFocus,
  bumpSimpleMobileMenuFileFocus,
  focusClawTabAfterWorkspaceFileSelect,
  setSimpleTab,
]);
```

---

### Phase 3: Edit Menu Handlers (MEDIUM PRIORITY)

#### Step 3.1: editMenu useMemo
**Source Lines in App copy.tsx:** ~1485-1536  
**Functionality:** All Edit menu handlers (Undo, Redo, Cut, Copy, Paste, etc.)

```tsx
const editMenu = useMemo((): EditMenuHandlers => {
  const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
  const inSimpleFileSurface = uiMode === "simple" && simpleTab === "chat";
  const inTechnicalIdeSurface = uiMode === "technical";
  const dockForEditMenu = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;
  const activeDockTab = dockForEditMenu.tabs[dockForEditMenu.activeIndex];
  const fileTabFocusedInPane = activeDockTab?.type === "file";
  const bufferMounted = Boolean(workspaceEditorRef.current);
  const canEdit =
    fileReady &&
    ((inSimpleFileSurface && bufferMounted) ||
      (clawWorkspaceEditorSurface && bufferMounted) ||
      (inTechnicalIdeSurface && fileTabFocusedInPane && bufferMounted));
  return {
    canEdit,
    onUndo: () => { /* implementation */ },
    onRedo: () => { /* implementation */ },
    onCut: () => { /* implementation */ },
    onCopy: () => { /* implementation */ },
    onPaste: () => { /* implementation */ },
    onFind: () => { /* implementation */ },
    onReplace: () => { /* implementation */ },
    onFindInFiles: () => { /* implementation */ },
    onReplaceInFiles: () => { /* implementation */ },
    onToggleLineComment: () => { /* implementation */ },
    onToggleBlockComment: () => { /* implementation */ },
    onEmmetExpand: () => { /* implementation */ },
  };
}, [
  effSelectedPath,
  effFileLoading,
  effFileError,
  simpleTab,
  uiMode,
  clawWorkspaceEditorSurface,
  isWsMulti,
  techWsSnapshot,
  panelDock,
]);
```

---

### Phase 4: Verification & Testing After Each Import

After each import, run these checks:

#### Test Steps:
1. **Syntax Check:**
   ```bash
   bun check apps/wayofpi-ui/src/App.tsx
   ```

2. **Type Check:**
   ```bash
   bun run tsc --noEmit apps/wayofpi-ui/src/App.tsx
   ```

3. **Build Test:**
   ```bash
   bun run build
   ```

4. **Runtime Test:**
   - Open browser dev tools
   - Check console for errors
   - Test the specific functionality

#### If build fails:
- Check TypeScript errors
- Verify dependencies are imported
- Review function signatures
- Ensure no duplicate declarations
- **Local rollback:** Copy backup of App.tsx back from backup folder

---

## Import Order Strategy

### Priority 1: Plan Artifact Functions (Critical for Orchestrator)
1. tryOrchestratorPlanArtifactBootstrap
2. handleChatModeChange
3. prevTechnicalChatModeRef
4. latestShellForPlanRef
5. shellBeforePlanRef
6. useEffect for chat mode
7. openWorkspaceSearch

### Priority 2: Navigation History (Critical for Go To menu)
8. navHistoryRef
9. skipHistoryPushRef
10. navHistoryTick
11. useEffect for history push
12. goHistoryBack
13. goHistoryForward

### Priority 3: Edit Menu (Important for IDE features)
14. editMenu

### Priority 4: Menu Handlers (Verify existing)
15. Verify selectionMenu
16. Verify terminalMenu
17. Verify runMenu
18. Verify goMenu

---

## Dependencies Checklist

Before importing each function, ensure these dependencies exist in target App.tsx:

### Core Dependencies
- [ ] `useCallback`, `useRef`, `useState`, `useLayoutEffect`, `useEffect`, `useMemo`
- [ ] `apiGet`, `apiPutJson`, `apiPostJson`
- [ ] `createPlanArtifactInWorkspace`
- [ ] `ancestorDirPaths`
- [ ] `persistLeftSidebar`
- [ ] `setActivity`
- [ ] `setSelectedPath`
- [ ] `setSimpleTab`
- [ ] `bumpSimpleMobileMenuFileFocus`
- [ ] `focusClawTabAfterWorkspaceFileSelect`

### State Variables
- [ ] `orchestratorPlanBootstrapLockRef`
- [ ] `navHistoryRef`
- [ ] `skipHistoryPushRef`
- [ ] `navHistoryTick`
- [ ] `prevTechnicalChatModeRef`
- [ ] `latestShellForPlanRef`
- [ ] `shellBeforePlanRef`

### UI Mode Variables
- [ ] `uiMode`
- [ ] `session.chatMode`
- [ ] `session.chatAgentName`
- [ ] `session.setChatMode`
- [ ] `simpleTab`
- [ ] `isWsMulti`
- [ ] `techWsSnapshot`
- [ ] `panelDock`

---

## Local Rollback Procedure

If an import breaks the build:

1. **Restore from backup:**
   ```bash
   cp /path/to/backup/App.tsx apps/wayofpi-ui/src/App.tsx
   ```

2. **Verify file is restored**

3. **Debug the specific import**

4. **Fix issues before re-importing**

---

## Success Criteria

After restoration:

- [ ] All Plan mode functionality works
- [ ] Navigation history functions properly
- [ ] Edit menu handlers respond correctly
- [ ] Build passes without errors
- [ ] Runtime errors are resolved
- [ ] All tests pass

---

## Next Steps

1. Create clean working copy of App.tsx from backup
2. Start with Phase 1 (Plan Artifact Functions)
3. Verify each import
4. Proceed through phases sequentially
5. Document any issues encountered

---

## Notes

- Each import should be tested before the next
- Don't skip phases
- If a function fails, debug before continuing
- Keep track of all imports in a changelog
- Review function signatures for compatibility
- Always maintain a backup of App.tsx before each import

---

## Important

- **NEVER restore from git**
- **Use local backup files only**
- **Test each function individually**
- **Verify before proceeding**
- **Keep detailed changelog**
</think>

```markdown
# Way of Pi App Restoration Plan

## Background
The `App copy.tsx` file contains broken/missing functionality that was accidentally deleted when an agent rewrote the entire file. We need to merge these functions FROM the broken `App copy.tsx` TO the working `App.tsx`.

## Goal
Merge missing functions FROM broken `App copy.tsx` TO working `App.tsx` by importing one function at a time and verifying each import works before continuing.

---

## Migration Direction
```
App copy.tsx (broken source) → App.tsx (working target)
```

---

## Source: App copy.tsx (Broken)
- Missing Plan artifact bootstrap functions
- Missing navigation history state
- Missing edit menu handlers

---

## Target: App.tsx (Working)
- Has all functions intact
- Needs selective imports from broken copy

---

## Restoration Phases

### Phase 1: Core Plan Artifact Functions (HIGH PRIORITY)

#### Step 1.1: tryOrchestratorPlanArtifactBootstrap
**Source Lines in App copy.tsx:** ~1289-1315  
**Functionality:** Creates `plans/PLAN-*.md` when workspace is empty in Plan mode  
**Import Order:** FIRST - critical for Plan mode functionality

```tsx
const tryOrchestratorPlanArtifactBootstrap = useCallback(
  (agentName: string | null) => {
    if (agentName != null) return;
    const hasWorkspace = Boolean(root) || folders.length > 0;
    if (!hasWorkspace) return;
    if (orchestratorPlanBootstrapLockRef.current) return;
    orchestratorPlanBootstrapLockRef.current = true;
    void (async () => {
      try {
        const d = await apiGet<{ files: Array<{ path: string }> }>("/api/plans");
        if ((d.files?.length ?? 0) > 0) return;
        const { path } = await createPlanArtifactInWorkspace({
          slugSuggestion: "session",
          title: "Plan",
        });
        setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(path) });
        await refresh();
        setSelectedPath(path);
      } catch {
        /* user can create manually via File: New plan markdown */
      } finally {
        orchestratorPlanBootstrapLockRef.current = false;
      }
    })();
  },
  [folders.length, refresh, root],
);
```

**Dependencies needed:**
- `orchestratorPlanBootstrapLockRef`
- `createPlanArtifactInWorkspace`
- `ancestorDirPaths`
- `apiGet`

---

#### Step 1.2: handleChatModeChange
**Source Lines in App copy.tsx:** ~1329-1351  
**Functionality:** Switches between chat and plan modes, handles seed Plan files

```tsx
const handleChatModeChange = useCallback(
  (m: Parameters<typeof session.setChatMode>[0]) => {
    const agentAtClick = session.chatAgentName;
    session.setChatMode(m);
    if (m === "plan" && (uiMode === "simple" || uiMode === "claw")) {
      setSelectedPath((p) => {
        if (!p) return null;
        const norm = p.replace(/\\/g, "/");
        if (/(^|\/)plans\/plan-[^/]+\.md$/i.test(norm)) return null;
        return p;
      });
    }
    if (m !== "plan") return;
    tryOrchestratorPlanArtifactBootstrap(agentAtClick);
  },
  [
    session.chatAgentName,
    session.setChatMode,
    setSelectedPath,
    uiMode,
    tryOrchestratorPlanArtifactBootstrap,
  ],
);
```

---

#### Step 1.3: prevTechnicalChatModeRef & shellBeforePlanRef
**Source Lines in App copy.tsx:** ~1354-1365  
**Functionality:** Restores shell state when leaving Plan mode

```tsx
const prevTechnicalChatModeRef = useRef<ChatSessionMode | null>(null);
const latestShellForPlanRef = useRef<{ activity: TechnicalActivity; leftSidebarVisible: boolean }>({
  activity: "explorer",
  leftSidebarVisible: true,
});
const shellBeforePlanRef = useRef<{ activity: TechnicalActivity; leftSidebarVisible: boolean } | null>(null);
```

---

#### Step 1.4: useEffect for chat mode transitions
**Source Lines in App copy.tsx:** ~1366-1406  
**Functionality:** Handles Plan mode entry/exit, restores shell state

```tsx
useEffect(() => {
  if (uiMode !== "technical") return;
  const prev = prevTechnicalChatModeRef.current;
  const mode = session.chatMode;
  prevTechnicalChatModeRef.current = mode;

  if (mode === "plan") {
    if (prev !== "plan") {
      shellBeforePlanRef.current = { ...latestShellForPlanRef.current };
      persistLeftSidebar(true);
      setActivity("planning");
    }
    return;
  }

  if (prev === "plan") {
    const snap = shellBeforePlanRef.current;
    shellBeforePlanRef.current = null;
    if (snap) {
      setActivity(snap.activity);
      persistLeftSidebar(snap.leftSidebarVisible);
    }
  } else {
    shellBeforePlanRef.current = null;
  }
}, [persistLeftSidebar, session.chatMode, uiMode]);
```

---

#### Step 1.5: openWorkspaceSearch
**Source Lines in App copy.tsx:** ~1391-1395  
**Functionality:** Opens planning sidebar in Technical mode

```tsx
const openWorkspaceSearch = useCallback(() => {
  setUiMode("technical");
  persistLeftSidebar(true);
  setActivity("search");
}, [persistLeftSidebar]);
```

---

### Phase 2: Navigation History Functions (HIGH PRIORITY)

#### Step 2.1: Navigation History State & Refs
**Source Lines in App copy.tsx:** ~1397-1399  
**Functionality:** Tracks navigation history for Go To menu

```tsx
const navHistoryRef = useRef<{ stack: string[]; idx: number }>({ stack: [], idx: -1 });
const skipHistoryPushRef = useRef(false);
const [navHistoryTick, setNavHistoryTick] = useState(0);
```

---

#### Step 2.2: History Push Effect
**Source Lines in App copy.tsx:** ~1411-1431  
**Functionality:** Pushes current path to history stack

```tsx
useEffect(() => {
  if (skipHistoryPushRef.current) {
    skipHistoryPushRef.current = false;
    setNavHistoryTick((t) => t + 1);
    return;
  }
  if (!selectedPath) {
    setNavHistoryTick((t) => t + 1);
    return;
  }
  const h = navHistoryRef.current;
  const cur = h.stack[h.idx];
  if (cur === selectedPath) {
    setNavHistoryTick((t) => t + 1);
    return;
  }
  const nextStack = h.stack.slice(0, h.idx + 1);
  nextStack.push(selectedPath);
  navHistoryRef.current = { stack: nextStack, idx: nextStack.length - 1 };
  setNavHistoryTick((t) => t + 1);
}, [selectedPath]);
```

---

#### Step 2.3: goHistoryBack
**Source Lines in App copy.tsx:** ~1423-1444  
**Functionality:** Navigate back in history

```tsx
const goHistoryBack = useCallback(() => {
  const h = navHistoryRef.current;
  if (h.idx <= 0) return;
  h.idx -= 1;
  const p = h.stack[h.idx];
  if (!p) return;
  skipHistoryPushRef.current = true;
  setSelectedPath(p);
  setNavHistoryTick((t) => t + 1);
  if (uiMode === "simple") {
    setSimpleTab("chat");
    if (shouldBumpSimpleMenuFileFocus) bumpSimpleMobileMenuFileFocus();
  } else if (uiMode === "claw") {
    focusClawTabAfterWorkspaceFileSelect();
  }
}, [
  uiMode,
  shouldBumpSimpleMenuFileFocus,
  bumpSimpleMobileMenuFileFocus,
  focusClawTabAfterWorkspaceFileSelect,
  setSimpleTab,
]);
```

---

#### Step 2.4: goHistoryForward
**Source Lines in App copy.tsx:** ~1446-1467  
**Functionality:** Navigate forward in history

```tsx
const goHistoryForward = useCallback(() => {
  const h = navHistoryRef.current;
  if (h.idx >= h.stack.length - 1) return;
  h.idx += 1;
  const p = h.stack[h.idx];
  if (!p) return;
  skipHistoryPushRef.current = true;
  setSelectedPath(p);
  setNavHistoryTick((t) => t + 1);
  if (uiMode === "simple") {
    setSimpleTab("chat");
    if (shouldBumpSimpleMenuFileFocus) bumpSimpleMobileMenuFileFocus();
  } else if (uiMode === "claw") {
    focusClawTabAfterWorkspaceFileSelect();
  }
}, [
  uiMode,
  shouldBumpSimpleMenuFileFocus,
  bumpSimpleMobileMenuFileFocus,
  focusClawTabAfterWorkspaceFileSelect,
  setSimpleTab,
]);
```

---

### Phase 3: Edit Menu Handlers (MEDIUM PRIORITY)

#### Step 3.1: editMenu useMemo
**Source Lines in App copy.tsx:** ~1485-1536  
**Functionality:** All Edit menu handlers (Undo, Redo, Cut, Copy, Paste, etc.)

```tsx
const editMenu = useMemo((): EditMenuHandlers => {
  const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
  const inSimpleFileSurface = uiMode === "simple" && simpleTab === "chat";
  const inTechnicalIdeSurface = uiMode === "technical";
  const dockForEditMenu = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;
  const activeDockTab = dockForEditMenu.tabs[dockForEditMenu.activeIndex];
  const fileTabFocusedInPane = activeDockTab?.type === "file";
  const bufferMounted = Boolean(workspaceEditorRef.current);
  const canEdit =
    fileReady &&
    ((inSimpleFileSurface && bufferMounted) ||
      (clawWorkspaceEditorSurface && bufferMounted) ||
      (inTechnicalIdeSurface && fileTabFocusedInPane && bufferMounted));
  return {
    canEdit,
    onUndo: () => { /* implementation */ },
    onRedo: () => { /* implementation */ },
    onCut: () => { /* implementation */ },
    onCopy: () => { /* implementation */ },
    onPaste: () => { /* implementation */ },
    onFind: () => { /* implementation */ },
    onReplace: () => { /* implementation */ },
    onFindInFiles: () => { /* implementation */ },
    onReplaceInFiles: () => { /* implementation */ },
    onToggleLineComment: () => { /* implementation */ },
    onToggleBlockComment: () => { /* implementation */ },
    onEmmetExpand: () => { /* implementation */ },
  };
}, [
  effSelectedPath,
  effFileLoading,
  effFileError,
  simpleTab,
  uiMode,
  clawWorkspaceEditorSurface,
  isWsMulti,
  techWsSnapshot,
  panelDock,
]);
```

---

### Phase 4: Verification & Testing After Each Import

After each import, run these checks:

#### Test Steps:
1. **Syntax Check:**
   ```bash
   bun check apps/wayofpi-ui/src/App.tsx
   ```

2. **Type Check:**
   ```bash
   bun run tsc --noEmit apps/wayofpi-ui/src/App.tsx
   ```

3. **Build Test:**
   ```bash
   bun run build
   ```

4. **Runtime Test:**
   - Open browser dev tools
   - Check console for errors
   - Test the specific functionality

#### If build fails:
- Check TypeScript errors
- Verify dependencies are imported
- Review function signatures
- Ensure no duplicate declarations
- **Local rollback:** Copy backup of App.tsx back from backup folder

---

## Import Order Strategy

### Priority 1: Plan Artifact Functions (Critical for Orchestrator)
1. tryOrchestratorPlanArtifactBootstrap
2. handleChatModeChange
3. prevTechnicalChatModeRef
4. latestShellForPlanRef
5. shellBeforePlanRef
6. useEffect for chat mode
7. openWorkspaceSearch

### Priority 2: Navigation History (Critical for Go To menu)
8. navHistoryRef
9. skipHistoryPushRef
10. navHistoryTick
11. useEffect for history push
12. goHistoryBack
13. goHistoryForward

### Priority 3: Edit Menu (Important for IDE features)
14. editMenu

### Priority 4: Menu Handlers (Verify existing)
15. Verify selectionMenu
16. Verify terminalMenu
17. Verify runMenu
18. Verify goMenu

---

## Dependencies Checklist

Before importing each function, ensure these dependencies exist in target App.tsx:

### Core Dependencies
- [ ] `useCallback`, `useRef`, `useState`, `useLayoutEffect`, `useEffect`, `useMemo`
- [ ] `apiGet`, `apiPutJson`, `apiPostJson`
- [ ] `createPlanArtifactInWorkspace`
- [ ] `ancestorDirPaths`
- [ ] `persistLeftSidebar`
- [ ] `setActivity`
- [ ] `setSelectedPath`
- [ ] `setSimpleTab`
- [ ] `bumpSimpleMobileMenuFileFocus`
- [ ] `focusClawTabAfterWorkspaceFileSelect`

### State Variables
- [ ] `orchestratorPlanBootstrapLockRef`
- [ ] `navHistoryRef`
- [ ] `skipHistoryPushRef`
- [ ] `navHistoryTick`
- [ ] `prevTechnicalChatModeRef`
- [ ] `latestShellForPlanRef`
- [ ] `shellBeforePlanRef`

### UI Mode Variables
- [ ] `uiMode`
- [ ] `session.chatMode`
- [ ] `session.chatAgentName`
- [ ] `session.setChatMode`
- [ ] `simpleTab`
- [ ] `isWsMulti`
- [ ] `techWsSnapshot`
- [ ] `panelDock`

---

## Local Rollback Procedure

If an import breaks the build:

1. **Restore from backup:**
   ```bash
   cp /path/to/backup/App.tsx apps/wayofpi-ui/src/App.tsx
   ```

2. **Verify file is restored**

3. **Debug the specific import**

4. **Fix issues before re-importing**

---

## Success Criteria

After restoration:

- [ ] All Plan mode functionality works
- [ ] Navigation history functions properly
- [ ] Edit menu handlers respond correctly
- [ ] Build passes without errors
- [ ] Runtime errors are resolved
- [ ] All tests pass

---

## Next Steps

1. Create clean working copy of App.tsx from backup
2. Start with Phase 1 (Plan Artifact Functions)
3. Verify each import
4. Proceed through phases sequentially
5. Document any issues encountered

---

## Notes

- Each import should be tested before the next
- Don't skip phases
- If a function fails, debug before continuing
- Keep track of all imports in a changelog
- Review function signatures for compatibility
- Always maintain a backup of App.tsx before each import

---

## Important

- **NEVER restore from git**
- **Use local backup files only**
- **Test each function individually**
- **Verify before proceeding**
- **Keep detailed changelog**
- **Maintain backup of App.tsx at all times**