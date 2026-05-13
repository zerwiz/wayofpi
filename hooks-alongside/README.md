# Hooks Alongside - Phase 1 Hook Extraction Documentation

## 📋 Overview

This directory contains custom React hooks extracted from the monolithic `App.tsx` component as part of **Phase 1** of the Way of Pi App refactoring plan.

**Purpose:** Move custom logic out of components into reusable hooks to reduce App.tsx from 6000+ lines to a clean container architecture.

---

## 🎯 Phase 1 Strategy

### Goal
Extract all custom `use*` hooks from `apps/wayofwork-ui/src/App.tsx` and place them alongside the original file for incremental development.

### Current State
- ✅ All hook signatures identified in original App.tsx
- ✅ Hook directory structure created
- ⏳ Implementations need to be ported from App.tsx inline logic

### Next Steps
1. Review each hook in this directory
2. Compare with original App.tsx usage
3. Implement complete logic for each hook
4. Test each hook independently
5. Replace imports in App.tsx one by one

---

## 📦 Hook Inventory

### UI State Hooks
- ✅ `useMaxWidthMediaQuery()` - Responsive breakpoints (COMPLETE)
- ✅ `useShellMobile()` - Mobile detection state (COMPLETE)
- ✅ `useUiMode()` - UI mode switching (COMPLETE)
- ✅ `useSimplePreferences()` - Simple mode color preferences (COMPLETE)
- ⏳ `useWorkspaceTree()` - File/folder tree, git operations, refresh (PENDING)
- ⏳ `useServerConfig()` - Server configuration state (PENDING)
- ⏳ `useUiViewsCatalog()` - Views catalog state (PENDING)
- ⏳ `useAgents()` - Agent API, catalog, team management (PENDING)

### Workspace Management Hooks
- ⏳ `useWorkspaceTree()` - File/folder tree, git operations, refresh (PENDING)
- ⏳ `useServerConfig()` - Server configuration state (PENDING)

### Chat & Agents Hooks
- ⏳ `useAgents()` - Agent API, catalog, team management (PENDING)
- ✅ `useSimplePreferences()` - Simple mode color preferences (COMPLETE)

### Views Catalog Hook
- ⏳ `useUiViewsCatalog()` - Views catalog state (PENDING)

---

## 🛠️ Implementation Guidelines

### Porting Rules:
1. **Never modify original App.tsx** until all hooks are validated
2. **Extract inline logic** from App.tsx into hook files
3. **Maintain backward compatibility** during transition
4. **Test each hook** before replacing App.tsx imports
5. **Keep detailed logs** of what was extracted and where

### Test Strategy:
- Run `bun run tsc` after each hook implementation
- Test each hook in isolation
- Verify App.tsx still works with new imports
- Only after full validation, update App.tsx to use new hooks

---

## 📁 Directory Structure

```
hooks-alongside/
├── README.md                    # This file
├── useAgents.ts                 # Agent management hook
├── useShellMobile.ts            # Mobile detection hook
├── useUiMode.ts                 # UI mode hook
├── useUiViewsCatalog.ts         # Views catalog hook
├── useMaxWidthMediaQuery.ts     # Responsive breakpoint hook
├── useServerConfig.ts           # Server config hook
├── useSimplePreferences.ts      # Simple preferences hook
├── useWorkspaceTree.ts          # Workspace tree hook
└── simple/                      # Simple mode hooks
    └── ...                      # Additional simple-specific hooks
```

---

## ⚠️ Important Notes

### DO:
- ✅ Make small changes (1-5 lines at a time)
- ✅ Test after each change
- ✅ Fix one issue at a time
- ✅ Verify build passes
- ✅ Use hooks alongside original App.tsx for testing

### DO NOT:
- ❌ Modify original App.tsx until hooks are ready
- ❌ Skip testing after hook implementation
- ❌ Use git restore on App.tsx
- ❌ Copy from backup files
- ❌ Batch fix multiple errors

---

## 🚨 Risk Management

### Primary Risks:
1. **Breaking Existing Functionality**
   - *Mitigation:* Test each hook before replacing imports in App.tsx
   
2. **State Management Complexity**
   - *Mitigation:* Use Context API for shared state where needed
   
3. **Type Safety Loss**
   - *Mitigation:* Add types as hooks are extracted and tested
   
4. **Performance Degradation**
   - *Mitigation:* Profile before and after refactoring

### Contingency Plan:
If refactoring introduces critical bugs:
1. Stop immediately
2. Rollback affected hooks to last working version
3. Debug the specific issue
4. Incrementally fix the problem
5. Resume refactoring from stable point

---

## ✅ Success Criteria

After Phase 1 completion:
- [ ] All hooks work independently
- [ ] App.tsx reduced from 6000+ lines to <1000 lines
- [ ] No new bugs introduced
- [ ] Build passes without errors
- [ ] TypeScript check passes
- [ ] All components are properly typed

---

## 📝 Contributing

When adding a new hook:
1. Create file in hooks-alongside/
2. Implement complete logic (not partial)
3. Add JSDoc comments where needed
4. Test thoroughly before committing
5. Update this README if needed

---

*Created: 2025-03-11*
*Phase: 1 (Hooks Extraction)*
*Status: In Progress*
*Next: Implement first hook and validate*
*Author: Pi Coding Agent*