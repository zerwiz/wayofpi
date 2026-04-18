# Plan: Way of Pi Chat UI Enhancement Issues - Build Team Handoff

**Status:** ready-for-build
**Created:** 2025-03-11
**Revision:** 8
**Session cwd:** /way-of-pi
**Sources:** User request for chat UI enhancements

---

## Executive Summary
Multiple chat UI issues require fixes in Way of Pi client repository, plus Git workflow rule update.

---

## Critical Issues (Priority 1-2)

### Issue #1: Keep Button Broken
- Keep button in pane view doesn't respond to clicks
- No visible error, likely disabled state or CSS issue

### Issue #2: File Revision Stale
- Files show old revision (Revision 1) despite latest changes made
- File picker/panel doesn't auto-refresh correctly

### Issue #3: Git Branch Workflow Rule
**NEW:** Always create a new branch before pushing to GitHub
- **Current behavior:** Users push directly to main
- **Required behavior:** `git checkout -b issue/keep-button`, `git add .`, `git commit`, `git push` (creates upstream), merge to main
- **Rationale:** Prevents breaking changes on main branch, enables review workflow

---

## Issue #4: Image Paste (Enhancement)
- Enable pasting screenshots into technical view chat box
- Process clipboard images to inline rendering

### Issue #5: New Chat Button Broken
- New chat button doesn't open new session
- Investigate event handlers, component state

### Issue #6: Scroll Tracking Failure
- Latest text doesn't auto-track when typing
- Should auto-track to bottom, but preserve user scroll position
- If user scrolls up, respect their position (don't override)

### Issue #7: File Explorer Reset
- When file explorer updates, user's folder position resets
- Should preserve current folder position during file changes
- Only reset when user explicitly navigates

### Issue #8: File Link Navigation
- Click file link in panel preview → should navigate to file in tree view
- Show user where file lives in file system

### Issue #9: Context Meter Display Bug
- Context meter stuck at 100% despite chat working
- Context usage fluctuates (100% → down → up again)
- Display not matching actual usage

### Issue #10: Message Under Ongoing Agent Work
- When user is typing a message while agent is working
- Message should **only** go to queue (correct behavior)
- Message should **NOT** immediately appear in chat interface (bug)
- Expected: Message waits until agent finishes, then goes to chat
- Current: Message appears in chat prematurely or doesn't go to queue
- Files to check: `ChatPanel.tsx`, Message queuing logic, `AgentMessageQueue*`

### Issue #11: Remove Orange Bottom View Text
- **Issue:** Orange bottom view shows text "= zed style diagnosis strip"
- **Action:** Remove this text entirely
- **Reason:** Should not mention Zed style (branding/compatibility issue?)
- **Files to check:** `src/components/**/*StatusBar*.tsx`, `src/components/**/*Footer*.tsx`, `src/components/**/*BottomView*.tsx`, `src/components/**/*StatusStrip*.tsx`

---

## Context Meter Issue (NEW)

### Problem
- Context meter shows 100% usage consistently
- Chat still works normally
- Usage appears to fluctuate but meter doesn't reflect accurately

### Investigation Steps
1. Find context meter component (`src/components/**/ContextMeter*`, `TokenUsage*`, `TokenUsageViewer`*)
2. Check context calculation formula (input tokens / limit)
3. Review real-time counting (is it counting correctly?)
   - Are we double-counting?
   - Is context limit updated correctly?
   - Is usage reset properly?
4. Debug: Check tokens in/out vs displayed percentage
5. Fix: Ensure accurate calculation, smooth updates

### Expected Behavior
- Context meter reflects actual token usage
- Updates smoothly as user type/receive messages
- Shows percentage and remaining percentage
- Resets properly on new session/context window

### Files to modify
- Context meter component (likely `src/components/.../ContextMeter*.tsx`)
- Token counting logic
- Display update logic

---

## Files to Modify
```bash
apps/wayofpi-ui/src/components/**/PaneView*.tsx
apps/wayofpi-ui/src/components/**/ChatPanel.tsx
apps/wayofpi-ui/src/components/**/FilePicker.tsx
apps/wayofpi-ui/src/components/**/ContextMeter*.tsx
apps/wayofpi-ui/src/components/**/FileTree*.tsx
apps/wayofpi-ui/src/components/**/PreviewButton*.tsx
apps/wayofpi-ui/src/components/**/MessageQueue*.tsx
apps/wayofpi-ui/src/components/**/AgentWorkIndicator*.tsx
apps/wayofpi-ui/src/components/**/StatusBar*.tsx
apps/wayofpi-ui/src/components/**/StatusStrip*.tsx
apps/wayofpi-ui/src/components/**/BottomView*.tsx
apps/wayofpi-ui/src/components/**/Footer*.tsx
apps/wayofpi-ui/src/hooks/**
```

---

## Git Workflow Rule Update (CRITICAL)

### Step 8: Commit and sync
```bash
git add .
git commit -m "Fix: keep button + file revision refresh + context meter + scroll tracking + image paste + file navigation + file explorer reset + message queue routing + zed strip removal"
BROKEN: git push origin main  # ❌ DO NOT PUSH TO MAIN DIRECTLY
```

**CORRECTED Git workflow:**

```bash
git add .
git commit -m "Fix: keep button + file revision refresh + context meter"
git push -u origin main  # First push creates upstream
git checkout -b feature/chat-ui-fixes  # Create feature branch
git push -u origin feature/chat-ui-fixes  # Push feature branch
# Merge feature branch to main (or pull in feature branch)
git checkout main
git pull origin main
git merge feature/chat-ui-fixes  # Or use pull request
```

**Workflow rule update needed:** Add to `.github/PULL_REQUEST_TEMPLATE.md` or `.gitmessage` if exists, or document in `/docs/GIT-WORKFLOW.md`

### Step 8 (Corrected): Commit and sync
```bash
# 1. Create feature branch (or checkout existing)
git checkout -b feature/chat-ui-fixes

# 2. Make changes
git add .

# 3. Commit with descriptive message
git commit -m "Fix: keep button + file revision refresh + context meter + scroll tracking + image paste"

# 4. Push feature branch (upstream link created automatically)
git push -u origin feature/chat-ui-fixes

# 5. Merge via Pull Request or
```

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
git clone [WAYOFPI_CLIENT_REPO_URL]
cd apps/wayofpi-ui
npm install
ng serve --host
```

### Step 3-9: Debug and implement each issue
(See individual debug steps above)

### Step 9: Git Workflow Compliance Checklist
- [ ] Feature branch created before committing changes
- [ ] `git push -u origin <branch-name>` (not `main` for features)
- [ ] Merge via pull request (not direct push to main)
- [ ] Rebase conflicts resolved before merge
- [ ] Review completed before merge

### Step 10: Commit and sync
```bash
git add .
git commit -m "Fix: keep button + file revision refresh + context meter + scroll tracking + image paste"
git push -u origin feature/chat-ui-fixes  # ✓ Correct way
# Merge via PR or rebase
```

---

## Verification Checklist

- [ ] Keep button clicks work
- [ ] File picker shows latest revision
- [ ] Image paste works
- [ ] New chat button works
- [ ] Scroll tracking works
- [ ] File explorer doesn't reset
- [ ] File link navigation works
- [ ] Context meter displays accurate usage
- [ ] Messages go to queue (not chat) during agent work
- [ ] Orange bottom view text removed (no Zed branding)
- [ ] No console errors
- [ ] Cross-browser compatible
- [ ] Git workflow follows branch policy

---

## Notes for Build Team

### Git Workflow Rule Change
**All PRs must use feature branches:**
1. Create feature branch from main
2. Push feature branch (not push to main directly)
3. Merge via pull request
4. Only approved changes from feature branches merge to main

**Rationale:**
- Prevents accidental breaks to main
- Enables proper code review
- Enables rollbacks if needed
- Follows Git best practices

### Client Access
- Real code changes needed in Way of Pi client repository
- Plan files in workspace are documentation ONLY
- Need access to client repo to implement

---

## Team Roster Update
**full team:** scout, planner, documenter, reviewer, bowser, builder, ralph
**Recommended:** builder, reviewer, code-documenter

---

**Ready for build team implementation.**