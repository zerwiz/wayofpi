# v1.0.58

## 📦 Updates

- ✅ **Claw Shell** - Removed unused `SimpleApp` component (cleanup)
- 🎯 **Claw Shell** - Reorganized `onNewPage` logic into modular handlers (`handleNewPage`, `handleNewPlanFile`, `handleNewClient`, etc.)
- 🎨 **Claw Shell** - Refactored sidebar menu logic to use conditional rendering (improved)
- 🎯 **Claw Shell** - Removed unused `SimpleApp` component reference (cleanup)
- 🔧 **Architecture** - Refactored `App.tsx` dead code from multiple conditional branches into `AppShellInternal` with early returns

## 🔧 Technical Improvements

- 🔧 **Refactoring** - Split `App.tsx` into `AppShellInternal` wrapper (main logic) + dead code branch (early returns for `claw`). Reduced complexity by isolating concerns.
