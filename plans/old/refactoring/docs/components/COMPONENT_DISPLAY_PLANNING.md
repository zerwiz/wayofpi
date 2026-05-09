# Component Display Planning Document
## Way of Pi Application - All Pages and Components

**File Location:** `/Way of pi/plans/refactoring/docs/components/COMPONENT_DISPLAY_PLANNING.md`  
**Date:** 2026-04-22  
**Status:** Draft - Initial Version  

---

## 📋 Overview

This document outlines all components and pages that need to be displayed in the Way of Pi application according to the reference implementation (`ReferenceApp.tsx`). It serves as a comprehensive guide for rebuilding `App.tsx` with all necessary components properly displayed.

---

## 🏗️ Shell Modes

The application supports three distinct shell modes, each with their own component structure:

1. **Simple Mode** - Basic IDE with file explorer and chat
2. **Claw Mode** - Mission-focused workspace with team agents
3. **Technical Mode** - Full IDE with workspace grid, debugging, and terminal

---

## 📱 Mobile Shell (Responsive Mode)

**Trigger:** `?shell=mobile` or viewport ≤767px

### Components:
- **`ClawMobileTabBar`** - Bottom tab navigation (replaces left rail)
- **`ClawMissionView`** - Mission tab content
- **`ClawChatView`** - Chat tab content (full height when active)
- **`SimpleFilePanel`** - File editor with markdown preview
- **`SimpleFileTree`** - Compact file explorer when open

**Layout:**
- Single column stack
- Tab bar at bottom (not left rail)
- Full-width content area
- No workspace grid (single editor only)

---

## 🖥️ Desktop Shell Modes

### Mode 1: Simple App

**File:** `apps/wayofwork-ui/src/components/simple/SimpleApp.tsx`

#### Left Rail (Activity Bar):
1. **`ActivityBar`** - Shows Simple tabs
2. **`SimpleNavRail`** - Navigation with tab switching

#### Main Content Area:
3. **`SimpleTeamView`** - Agent teams management
4. **`SimpleSettingsView`** - Appearance, server, workspace settings
5. **`SimpleFileTree`** - Host file explorer
6. **`SimpleFilePanel`** - File editor with:
   - Markdown preview pane
   - Source code editor
   - Line numbers, cursor, selection
   - Undo/redo stack
   - Find/replace

#### Chat Dock:
7. **`TechnicalChatPanel`** - Chat session UI with:
   - Agent selection dropdown
   - Chat mode switcher
   - Token meter (down/up)
   - Error handling modal
   - Stream toggle
   - Queue management

#### Terminal:
8. **`EmbeddedTerminal`** - Optional terminal pane with:
   - XTerm integration
   - Split terminal support
   - Command history
   - Debug output

#### Status Bar:
9. **`StatusBar`** - Shows:
   - Workspace path
   - Connected status
   - Current line/col
   - Language (inferred from file path)
   - Token usage

#### Menus:
10. **`MenuBar`** - Top menu bar with:
    - File menu (new file, open, save, etc.)
    - Edit menu (undo, redo, cut/copy/paste)
    - View menu (sidebar, word wrap, breadcrumbs)
    - Run menu (debug, breakpoints)
    - Go menu (navigation, history)
    - Help menu (documentation, support)

#### Modals:
11. **`LlmFixModal`** - LLM fix modal
12. **`AgentPermissionsModal`** - Agent permissions
13. **`HostDoctorModal`** - Host diagnostics
14. **`HonchoSettingsModal`** - Honcho configuration
15. **`NgrokSettingsModal`** - Ngrok tunnel settings
16. **`IndexingDocsModal`** - Indexing documentation
17. **`InstallDebuggersModal`** - Debuggers installation
18. **`MitLicenseModal`** - MIT license notice
19. **`HowToUseModal`** - How to use guide
20. **`ClawHelpModal`** - Claw help documentation

---

### Mode 2: Claw App

**File:** `apps/wayofwork-ui/src/components/claw/ClawApp.tsx`

#### Left Nav Rail:
1. **`ClawNavRail`** - Claw-specific navigation with:
   - Mission tab (default)
   - Chat tab
   - Team tab
   - Schedule tab
   - Channels tab
   - Files tab
   - Settings tab
   - Help button

#### Main Content Area:
2. **`ClawMissionView`** - Mission planning interface with:
   - Agent roster
   - Mission planner
   - Workspace setup
   - New plan file creation
   - Host doctor access

3. **`ClawChatView`** - Chat interface with:
   - Chat session tabs
   - Agent selector
   - Message queue
   - Token meter
   - Stream controls

4. **`ClawSchedulesView`** - Schedule management

5. **`ClawChannelsView`** - Channel listing

6. **`SimpleFileTree`** - `.claw/` file explorer (host checkout only)

7. **`SimpleFilePanel`** - File editor for `.claw/` files

8. **`SimpleSettingsView`** - Claw-specific settings with:
   - Workspace onboarding state
   - Create/delete workspace actions
   - Appearance toggle
   - Server configuration

#### Mobile Tab Bar:
9. **`ClawMobileTabBar`** - Bottom navigation for mobile

#### Modals (shared with Simple):
10. All modals from Simple mode (same as above)

**Key Difference from Simple:**
- Full-height left nav rail (not activity bar)
- Mission tab as default (not file tree)
- No workspace grid
- `.claw/` file explorer only

---

### Mode 3: Technical Mode

**File:** `apps/wayofwork-ui/src/components/technical/TechnicalPrimarySidebar.tsx`

#### Left Sidebar:
1. **`TechnicalPrimarySidebar`** - Full IDE sidebar with:
   - Activity bar icons
   - Explorer (file tree)
   - Search
   - Git
   - Debug
   - Extensions

#### Main Workspace Grid:
2. **`TechnicalWorkspaceGrid`** - Up to 3×4 grid of cells
   - Each cell is a **`WorkspacePane`**
   - Drag-to-resize handles
   - Edge-drop grid grow
   - Cross-cell tab moves
   - Persisted `rowWeights`/`colWeights`

#### Workspace Pane:
3. **`WorkspacePane`** - Individual code editor cell with:
   - Tab bar (multiple files)
   - File editor (source)
   - Markdown preview pane
   - Line numbers
   - Cursor tracking
   - Undo/redo
   - Find/replace
   - Git status badges

#### Right SidePanels:
4. **`TechnicalSidePanels`** - Optional side panels:
   - `ExtensionsSidePanel` - Extensions marketplace
   - `SettingsSidePanel` - IDE settings
   - `WorkspaceCellDropSurface` - Drop zone for file operations

#### Chat Dock:
5. **`TechnicalChatPanel`** - Chat session UI (same as Simple)

#### Terminal:
6. **`EmbeddedTerminal`** - Terminal pane (same as Simple)

#### Status Bar:
7. **`StatusBar`** - Same as Simple but shows:
   - Workspace root
   - File path
   - Language
   - Git branch
   - Git changes count

#### Menus (same as Simple)
#### Modals (same as Simple)

---

## 📦 Component Dependencies

### Shared Components (Used by all modes):

1. **`MenuBar`** - Top menu bar
2. **`StatusBar`** - Status bar
3. **`DockSplitHandle`** - Resizable dock handles
4. **`CommandPalette`** - Command search
5. **`LlmFixModal`** - LLM fix modal
6. **`AgentPermissionsModal`** - Agent permissions
7. **`HostDoctorModal`** - Host diagnostics
8. **`EmbeddedTerminal`** - Terminal
9. **`SimpleFileTree`** - File explorer
10. **`SimpleFilePanel`** - File editor
11. **`TechnicalChatPanel`** - Chat UI

### Simple-Only Components:

12. **`SimpleNavRail`** - Simple mode navigation
13. **`SimpleTeamView`** - Team management
14. **`SimpleSettingsView`** - Simple settings

### Claw-Only Components:

15. **`ClawNavRail`** - Claw navigation
16. **`ClawMissionView`** - Mission planning
17. **`ClawChatView`** - Claw chat
18. **`ClawSchedulesView`** - Schedule view
19. **`ClawChannelsView`** - Channels view
20. **`ClawHelpModal`** - Claw help

### Technical-Only Components:

21. **`TechnicalPrimarySidebar`** - Technical sidebar
22. **`TechnicalWorkspaceGrid`** - Workspace grid
23. **`TechnicalSidePanels`** - Technical side panels
24. **`WorkspacePane`** - Code editor cell
25. **`ExtensionsSidePanel`** - Extensions panel
26. **`SettingsSidePanel`** - Settings panel
27. **`WorkspaceCellDropSurface`** - Drop surface

### Mobile-Only Components:

28. **`ClawMobileTabBar`** - Mobile tab navigation
29. **`MobileChrome`** - Mobile chrome

---

## 🔄 Component Lifecycle

### Component Loading Order:

1. **App initialization** - Load hooks and state
2. **Mode detection** - Read `useUiMode` hook
3. **Shell detection** - Check `?shell=` parameter and mobile state
4. **Component rendering** - Render appropriate component tree
5. **Modals ready** - Ensure all modals are available

### Component Unmounting:

- **Mode switching** - Clean up previous mode components
- **Tab switching** - Update active tab props
- **Modal open/close** - Toggle modal visibility
- **Mobile resize** - Switch between mobile/desktop layout

---

## 📝 Display Rules

### What MUST be displayed:

- ✅ **Mode indicator** - Current shell mode (simple/claw/technical)
- ✅ **Navigation** - Left rail or nav rail based on mode
- ✅ **Main content** - Appropriate view for active tab
- ✅ **Chat dock** - Always visible (unless hidden in mobile)
- ✅ **Terminal** - Visible when active (can be toggled)
- ✅ **Status bar** - Always visible on desktop
- ✅ **Menus** - Always accessible
- ✅ **Workspace grid** - Technical mode only (or grid mode)
- ✅ **File explorer** - Simple/Claw mode only (or side panel in technical)

### What MUST NOT be displayed:

- ❌ **Placeholder content** - No empty UI or TODO comments
- ❌ **Duplicate components** - Only one instance of each type
- ❌ **Hidden imports** - All imports must be used
- ❌ **Broken references** - All component props must match

---

## 🔧 Props Requirements

### Critical Props (Must be passed):

| Prop | Required By | Source |
|------|-------------|--------|
| `uiMode` | All modes | `useUiMode` hook |
| `setUiMode` | All modes | App state |
| `root` | Simple/Claw | `useWorkspaceTree` |
| `nodes` | Simple/Claw | `useWorkspaceTree` |
| `treeLoading` | Simple/Claw | `useWorkspaceTree` |
| `treeError` | Simple/Claw | `useWorkspaceTree` |
| `refreshTree` | Simple/Claw | `useWorkspaceTree` |
| `config` | All modes | `useServerConfig` hook |
| `connected` | Chat | `useWayOfPiSession` |
| `chatAgentName` | Chat | `useWayOfPiSession` |
| `chatMode` | Chat | `useWayOfPiSession` |
| `onTabChange` | Claw/Simple | App state |
| `activeTab` | Claw | App state |

### Optional Props (Guard with ?):

- `onReopenLlmFixModal`
- `onOpenIndexingDocs`
- `onOpenHostDoctor`
- `onConsumeProviderConfigFocus`
- `onMoveFileToDirectory`
- `allowWorkspaceRootDrop`

---

## 🧪 Testing Checklist

### Component Rendering Tests:

- [ ] **Simple mode** - All tabs render correctly
- [ ] **Claw mode** - Mission view displays
- [ ] **Technical mode** - Workspace grid renders
- [ ] **Mobile shell** - Tab bar appears, no left rail
- [ ] **Tab switching** - Correct component mounts
- [ ] **Modal open/close** - Modals appear/disappear
- [ ] **Menu items** - All menu items accessible
- [ ] **Status bar** - Shows correct information
- [ ] **Chat dock** - Stream toggle works
- [ ] **Terminal** - Shows/hides correctly

### Component Interaction Tests:

- [ ] **File open** - File tree highlights selected file
- [ ] **Tab switch** - Previous tab moves to new tab bar
- [ ] **Drag resize** - Handles work in all modes
- [ ] **Drop file** - Correct drop handler activates
- [ ] **Mode switch** - Components cleanup and remount

---

## 📂 Component File Locations

### Already Extracted (Check These First):

- `components/simple/SimpleApp.tsx`
- `components/claw/ClawApp.tsx`
- `components/claw/ClawNavRail.tsx`
- `components/simple/SimpleNavRail.tsx`
- `components/simple/SimpleFileTree.tsx`
- `components/simple/SimpleFilePanel.tsx`
- `components/simple/SimpleTeamView.tsx`
- `components/simple/SimpleSettingsView.tsx`
- `components/claw/ClawMissionView.tsx`
- `components/claw/ClawChatView.tsx`
- `components/claw/ClawSchedulesView.tsx`
- `components/claw/ClawChannelsView.tsx`
- `components/claw/ClawHelpModal.tsx`
- `components/technical/TechnicalPrimarySidebar.tsx`
- `components/technical/TechnicalWorkspaceGrid.tsx`
- `components/technical/TechnicalSidePanels.tsx`
- `components/technical/CommandPalette.tsx`
- `components/WorkspacePane.tsx`
- `components/technical/TechnicalChatPanel.tsx`
- `components/EmbeddedTerminal.tsx`
- `components/ActivityBar.tsx`
- `components/StatusBar.tsx`
- `components/MenuBar.tsx`
- `components/ExplorerSidebar.tsx`
- `components/DockSplitHandle.tsx`
- `components/mobile/ClawMobileTabBar.tsx`
- `components/mobile/MobileChrome.tsx`
- `components/WorkspaceCellDropSurface.tsx`
- `components/WorkspaceGridLayoutPicker.tsx`

### To Extract from ReferenceApp.tsx:

1. **Modals** - All modal components
2. **File operations** - Handle functions
3. **Menu handlers** - All menu click handlers
4. **Utility functions** - Path handling, file ops
5. **State management** - Use hooks

### Hooks to Verify:

- `hooks/useUiMode.ts`
- `hooks/useSimplePreferences.ts`
- `hooks/useShellMobile.ts`
- `hooks/useServerConfig.ts`
- `hooks/useWorkspaceTree.ts`
- `hooks/useAgents.ts`
- `hooks/useUiViewsCatalog.ts`
- `hooks/useWayOfPiSession.ts`
- `hooks/useWorkspaceStaticAnalysis.ts`
- `hooks/useMaxWidthMediaQuery.ts`
- `hooks/useRunMenuDebugState.ts`
- `hooks/useFileEditor.ts`

---

## 🚀 Next Steps

1. **Verify existing components** - Ensure all extracted components compile and work
2. **Extract missing components** - Break out remaining pieces from ReferenceApp.tsx
3. **Create component tests** - Write unit tests for each component
4. **Integrate into App.tsx** - Build App.tsx piece by piece
5. **Test all modes** - Ensure simple, claw, and technical modes work
6. **Mobile testing** - Verify responsive behavior
7. **Performance audit** - Check for memory leaks, unnecessary re-renders
8. **Documentation** - Update README with component usage

---

## 📞 Contact

- **Project:** Way of Pi
- **Location:** `/home/zerwiz/CodeP/Way of pi/`
- **Reference:** `ReferenceApp.tsx`
- **Status:** 2026-04-22 - Phase 8 in progress

---

*Last Updated: 2026-04-22*
*Document Version: 0.1 - Initial Draft*