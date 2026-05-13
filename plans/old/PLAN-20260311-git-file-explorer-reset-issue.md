# Plan: Fix Git File Explorer Reset Issue

**Status:** draft
**Created:** 2025-03-11
**Revision:** 1
**Session cwd:** /way-of-pi
**Sources:** User complaint about file explorer reset behavior

---

## Issue
When the file explorer/panel updates files, the file tree **resets**. If a user is browsing in one folder and the file explorer auto-refreshes, the view **resets** and user loses their place. User has to:
1. Navigate to folder manually
2. Find folder in new reset view
3. Open folder again
4. Resume browsing

**This should NOT happen.**

---

## Current Behavior
- File explorer auto-refreshes on file changes
- Upon refresh, tree view **resets** to root/previous view
- User's current folder position is **lost**
- User must re-navigate to same location
- Time lost and UX frustration

---

## Expected Behavior
- File explorer should **preserve current folder position** during normal updates
- Only when user explicitly navigates should view change
- Refreshing files should be **silent** (no view reset)
- Tree should remember selected directory
- Only auto-refresh entire tree when user explicitly requests (refresh button)

---

## Assumptions and constraints
- **File Explorer** component exists in Way of Pi client UI
- **Auto-refresh** triggers on file system changes (watcher, git updates)
- **Reset behavior** caused by component re-render or tree refresh logic
- **Memory/Position** not persisted across refreshes
- **UX best practice:** Preserve scroll position and selected paths
- **Performance:** Don't delay refresh, but preserve position

---

## Files to touch
| Path | Action | Notes |
|------|--------|------|
| N/A | N/A | Requires Way of Pi client codebase access |

---

## Implementation steps (ordered)

1. **Locate File Explorer component**
   - Search for file tree component: `src/components/Files*`, `src/components/FileExplorer*`, `FileTree.tsx`, `FilePanel*`
   - Search for refresh logic: `useRefresh`, `autoRefresh`, `watcher`

2. **Identify reset trigger**
   - Find where file state is restored (`useState`, `useMemo`)
   - Check component re-mount logic (is component remounted on refresh?)
   - Search for `reset` behavior, tree reset, path reset

3. **Fix: Preserve current position**
   - **Persist current folder path** in component state
   - On file update, **only re-render file list**, don't reset navigation
   - Add option: `autoRefresh: boolean` for silent refresh vs refresh+reset
   - Use `useEffect` to detect file changes without remounting tree

4. **Fix: Preserve scroll position**
   - Store scroll position or user's view state
   - Don't scroll to top on silent refresh
   - Only auto-scroll when new files appear in current view

5. **User preference (optional)**
   - Add UI toggle: "Auto-refresh tree" on/off
   - When enabled: Silent refresh
   - When disabled: Refresh + reset (current behavior, user control)
   - Document behavior in UI

6. **Test scenarios**
   - Create/edit file in current folder → Tree shows update but view stays
   - User is in subfolder → Editing/refreshing doesn't jump user out
   - User explicitly navigates → Tree updates silently
   - User clicks refresh button → Tree refreshes and keeps position
   - Large file tree → Still preserves position during changes

---

## Verification
- [ ] File explorer doesn't reset when files are edited in same folder
- [ ] Scroll position preserved during silent refresh
- [ ] User can browse subfolder without jumping out
- [ ] Explicit refresh button works, preserves position
- [ ] No console errors on tree render updates
- [ ] User can switch back to same folder quickly after file update

---

## Risks and mitigations
- **Performance concern:** Silent refresh might be slow — *Mitigation:* Lazy update, selective render
- **Complexity increase:** More state management — *Mitigation:* Use existing state patterns
- **User confusion:** Some users expect tree to update — *Mitigation:* Add tooltip about silent refresh
- **Test coverage:** Ensure all refresh paths covered — *Mitigation:* Test all user workflows

---

## Related work
- This affects all file explorer interactions (chat pane, panel view, workspace pane)
- Similar issues may exist in other file viewers (plan panel, project scanner)
- May need to coordinate with file picker refresh logic

---

## Files to modify
- File Explorer component
- Tree navigation state
- Auto-refresh logic
- User preference defaults

---

**Ready for build team implementation.**