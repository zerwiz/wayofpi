# Plan: Chat UI Enhancement Issues - Handoff to Build Team

**Status:** ready-for-build
**Created:** 2025-03-11
**Revision:** 5
**Session cwd:** /way-of-pi
**Sources:** User request for chat UI enhancement

---

## Executive Summary
Two critical chat UI issues require fix in Way of Pi client repository:

1. **Keep Button Broken:** Button in pane view appears but doesn't respond to clicks
2. **File Revision Stale:** Files auto-appear in panel but show old revision (Revision 1) when latest changes already made

---

## Issue #1: Keep Button Failure

### Problem
- Keep button exists in pane/poll view UI
- Button appears clickable but has no effect when clicked
- No console error visible (potential CSS overlay or disabled state bug)

### Expected Behavior
- Click → button performs expected action (keep session, reset, dismiss)
- Button state updates appropriately (feedback, loading)

### Investigation Steps
1. Locate keep button component in codebase
2. Debug click handlers and state binding
3. Check console for errors on click
4. Verify button is enabled (not disabled by state logic)
5. Check CSS doesn't block click (z-index, parent disabled state)

---

## Issue #2: File Revision Update Not Reflecting

### Problem
- Files created/updated appear in chat panel/selection list immediately
- BUT file picker shows old revision (Revision 1) instead of current (Revision 5)
- User needs to click file → but panel content doesn't refresh to latest
- File system watcher or component refresh not working properly

### Expected Behavior
- Files appear in panel view
- Panel shows latest revision number
- Clicking file opens latest content in editor

### Investigation Steps
1. Find file list picker component (`src/components/**/FilePicker.tsx`)
2. Review file refresh logic (debounce, polling, event-based)
3. Check if directory watch is enabled
4. Identify why revisions display stale (component cache issue)
5. Debug write → refresh pipeline (write → git add/commit → refresh)

---

## Priority Order
1. **Keep button** (user-facing, critical for session management)
2. **File revision refresh** (affects user workflow, visibility)
3. **Image paste** (enhancement, nice-to-have)
4. **New chat button** (if broken, critical; otherwise secondary)
5. **Scroll tracking** (quality of life improvement)

---

## Files to Modify
- `apps/wayofpi-ui/src/components/**/PaneView*.tsx`
- `apps/wayofpi-ui/src/components/**/ChatPanel.tsx`
- `apps/wayofpi-ui/src/components/**/FilePicker.tsx`
- `apps/wayofpi-ui/src/hooks/**`
- Any keep button component location
- Any file refresh/mount hook location

---

## Build Team Handoff Checklist

### Step 1: Clone or access Way of Pi client repository
```bash
git clone [WAYOFPI_CLIENT_REPO_URL]
cd apps/wayofpi-ui
npm install
```

### Step 2: Verify issues in running UI
```bash
ng serve --host
# Or bun run dev
# Reproduce keep button issue
# Reproduce file revision stale issue
```

### Step 3: Debug keep button
- Open browser dev tool → Application → Storage → Clear storage
- Open dev tool → Console
- Click keep button carefully
- Check for: No click handler? Disabled attribute? CSS block?

### Step 4: Debug file revision refresh
- Open dev tool → Sources → break on network/disk IO
- Create file via chat interface
- Watch for git add/commit → refresh sequence
- Check component state (useEffect, useState) for file list

### Step 5: Implement fix
- Keep button: Add click handler, ensure enabled, check CSS
- File refresh: Add debounce, polling, or directory watcher
- Test across browsers (Chrome, Firefox, Safari)

### Step 6: Test integration
- All 5 features together (image paste, buttons, scroll, file view)
- No console errors
- Cross-browser compatible

### Step 7: Commit and sync
```bash
git add .
git commit -m "Fix: keep button + file revision refresh"
git push origin main
```

---

## Verification Checklist

- [ ] Keep button clicks work as expected
- [ ] File picker shows latest revision (no stale Revision 1)
- [ ] Image paste works (screenshots → inline images)
- [ ] New chat button works (opens new session)
- [ ] Scroll tracking works (auto-track when appropriate)
- [ ] No console errors in dev tools
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

---

## Notes for Build Team
- This is a client UI fix, not server-side
- Files created in workspace: `plans/PLAN-20250311-*.md` are documentation ONLY
- Real code changes needed in Way of Pi client repository
- Need access to client repo to implement fixes
- If access issue → open GitHub issue or use Ralph queue ticket

---

## Team Roster Update (For Context)
- **full team:** scout, planner, documenter, reviewer, bowser, builder
- **Recommended parallel agents:**
  - builder (frontend)
  - reviewer (QA)
  - code-documenter (docs)

---

**Ready for build team implementation.**