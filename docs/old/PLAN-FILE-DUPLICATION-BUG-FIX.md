# Plan File Duplication Bug Fix

**Created:** 2026-01-04  
**Issue:** Plan files appearing in all multi-cell preview panes when viewing resolved files  
**Status:** 🟢 FIXED

---

## 🐛 Problem Description

When viewing a **resolved** `.md` file in multi-cell (grid mode), if that file was the latest plan:

1. On clicking, `openPlanFileForReview()` was called
2. In multi-cell mode, it used `setWorkspaceOpenSignal()` 
3. This signal broadcasts to **all cell preview panes**
4. Result: Plan file duplicated across all columns/rows

This caused unwanted duplication because plan files should only appear in ONE place - the main workspace tab.

---

## 🔍 Root Cause

The `openPlanFileForReview()` function had conditional logic similar to `onExplorerSelectFile()`:

```typescript
// BUG: In multi-cell mode, setWorkspaceOpenSignal broadcasts to ALL cells
if (uiMode === "technical" && (workspaceGrid.cols > 1 || workspaceGrid.rows > 1)) {
    setWorkspaceOpenSignal((s) => ({ path: p, rev: (s?.rev ?? 0) + 1 }));
} else {
    // Single tab management approach
    setExplorerContextDir(posixDirname(p));
    setSelectedPath(p);
    if (uiMode === "technical") {
        setPanelDock((prev) => applyAddFileTab(prev, p));
    }
}
```

**Difference from regular files:**

- `onExplorerSelectFile()` uses single-tab management for regular files (WORKS)
- `openPlanFileForReview()` incorrectly used broadcast approach for plans (BROKEN)

---

## ✅ Solution

Always use **single-panel docking approach** for plan files in `openPlanFileForReview()`, even in multi-cell mode:

```typescript
// ALWAYS USE THIS (no conditionals)
setExplorerContextDir(posixDirname(p));
setSelectedPath(p);
if (uiMode === "technical") {
    setPanelDock((prev) => applyAddFileTab(prev, p));
}
```

This ensures:
- Plan file appears in **ONE tab** (the main workspace)
- No duplication across cells
- Consistent behavior with regular file opening

---

## 📝 Key Points

1. **Plan files should NOT use `setWorkspaceOpenSignal()`** in multi-cell mode
2. **Always use single-tab management** (`setExplorerContextDir` + `setSelectedPath` + `applyAddFileTab`)
3. This applies to plan files specifically (resolved `.md` plans)
4. Regular file selection already uses correct approach

---

## 🧪 Testing

- Open a resolved plan file in technical mode
- Check it appears in only ONE tab (main workspace), not all preview cells
- File is accessible via "File → Plans → PLAN-..." (single tab)

---

## 📌 References

- Similar code pattern in `onExplorerSelectFile()` - uses same single-tab approach
- `onShowAgentChat()` has dual mode handling (broadcast in multi-cell, single tab otherwise)

---

## 🔗 Files

- Location: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/App.tsx`
- Function: `openPlanFileForReview()` (line 3136)
- Related: `onExplorerSelectFile()` (line 3157) - works correctly

---

**END**
