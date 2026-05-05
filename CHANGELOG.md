# Changelog

All notable changes to the **Way of Pi** project.

## [0.20.02] - 2026-05-05

### Fixed
- **[UI] useWayOfPiSession**: Fixed runtime crash when switching to "work" mode by initializing the 'work' surface state and adding safety checks to prevent accessing undefined session data.
- **[UI] App.tsx**: Fixed `ReferenceError: Cannot access 'uiMode' before initialization` by moving all hook declarations to the top of the `App` component, ensuring hooks are called before any conditional returns and adhering to React's Rules of Hooks.

## [0.20.01] - 2026-05-05

### Added
- **[MOBILE] Documentation**: Created comprehensive mobile documentation in `/home/zerwiz/CodeP/Way of pi/projects/work-button-improvements/mobile/`
- **[MOBILE] Mobile Components**: Documented all mobile-specific components: `MobileChrome`, `ClawMobileTabBar`, `SimpleMobileTabBar`, `MobileTechnicalShell`
- **[MOBILE] Mobile Views**: Documented mobile entry points (`?shell=mobile`, `/m` path) and localStorage toggle (`wayofpi.shell.mobile`)
- **[MOBILE] Mobile UX**: Documented mobile-first design patterns, breakpoints (≤768px mobile, 769-1024px tablet, ≥1025px desktop), and touch-optimized controls
- **[MOBILE] Claw Navigation**: Documented 8-tab claw bottom nav (Mission, Chat, Team, Schedule, Channels, Files, Modules, Settings)
- **[MOBILE] Simple Navigation**: Documented 6-tab simple bottom nav (Chat, Team, Models, Projects, Help, Settings)
- **[MOBILE] Mobile Shell**: Documented `useShellMobile` hook implementation with URL sync and path detection
- **[MOBILE] Mobile Chrome**: Documented shared top bar with title display, workspace hint, and desktop escape button
- **[MOBILE] Safe-Area Support**: Documented iOS notch, Android status bar, and browser UI handling

### Changed
- **[MOBILE] Component Structure**: Created new dedicated mobile documentation folder at `/home/zerwiz/CodeP/Way of pi/projects/work-button-improvements/mobile/`
- **[MOBILE] File Organization**: Organized mobile docs matching actual component structure in `/apps/wayofpi-ui/src/components/mobile/`
- **[MOBILE] Documentation Style**: Standardized mobile documentation format with headers, tables, and code examples

## [0.20.00] - 2026-05-05

### Critical
- **[DEPLOY] Hosting Required**: Application must be hosted on developer's computer ASAP for client demos and user testing
- **[DEPLOY] Demo Access**: Clients need to log in and try out the app for stakeholder reviews
- **[DEPLOY] Production Plans**: See `plans/productionready` for Docker/VMS hosting options

## [0.19.99] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Login**: Fixed login flow to gracefully accept demo credentials ("Demo"/"1234") when API is unavailable
- **[UI] WorkerPortal Demo Mode**: Added fallback logic to use demo data when server is not running
- **[UI] WorkerPortal Error Handling**: Improved error messages for API unavailable scenarios, suggesting demo mode usage

### Added
- **[UI] WorkerPortal**: Added `loadDemoData()` function for demo mode support
- **[UI] WorkerPortal**: Added graceful fallback when API is not running
- **[UI] WorkerPortal**: Demo credentials now auto-enabled when server is unavailable

### Changed
- **[UI] WorkerPortal**: Modified `handleLogin()` to check for demo credentials first before calling API
- **[UI] WorkerPortal**: Simplified error handling to reduce complexity

## [0.19.98] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Demo Mode**: Fixed demo mode to show demo task list when server unavailable
- **[UI] WorkerPortal Demo Mode**: Fixed demo mode to load demo files when server unavailable

### Changed
- **[UI] WorkerPortal**: Simplified `handleLogin()` error handling logic

## [0.19.97] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode display when API is unavailable
- **[UI] WorkerPortal**: Fixed error suppression when in demo mode

## [0.19.96] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Demo**: Improved demo mode reliability when server is not running

## [0.19.95] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode to accept "Demo"/"1234" credentials

## [0.19.94] - 2026-05-05

### Added
- **[UI] WorkerPortal**: Added support for demo credentials during development

### Changed
- **[UI] WorkerPortal**: Simplified demo mode logic

## [0.19.93] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode to work when API is not running

## [0.19.92] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo task list now displays properly when in demo mode

## [0.19.91] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo file list display in demo mode

## [0.19.90] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Improved error handling for offline scenarios

## [0.19.89] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo mode now uses demo data when server is unavailable

## [0.19.88] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed error suppression for demo mode

## [0.19.87] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo credentials now work when API is not running

## [0.19.86] - 2026-05-05

### Added
- **[UI] WorkerPortal Login**: Added demo credentials support

## [0.19.85] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Improved error messages for offline mode

## [0.19.84] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Demo mode now displays properly

## [0.19.83] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed offline demo mode

## [0.19.82] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Improved user information display

### Fixed
- **[UI] UsersPage**: Fixed role display fallback

## [0.19.81] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Removed duplicate error display after logout

### Added
- **[UI] AgentPage**: Added demo agent data

### Added
- **[UI] AgentPage**: Added chat history in demo mode

## [0.19.80] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed `getUsers` error handling

## [0.19.79] - 2026-05-05

### Added
- **[API] UsersPage**: Added `getUsers()` API endpoint

## [0.19.78] - 2026-05-05

### Fixed
- **[UI] WorkerPortal**: Fixed demo mode login

## [0.19.77] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Fixed error state when API is unavailable

## [0.19.76] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Updated to use `getUsers()` API instead of `getWorkers()`

## [0.19.75] - 2026-05-05

### Added
- **[API] UsersPage**: Added `getUsers` endpoint

## [0.19.74] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info API endpoint

## [0.19.73] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed avatar endpoint

## [0.19.72] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed avatar API

## [0.19.71] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed avatar endpoint

## [0.19.70] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info API endpoint

## [0.19.69] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info endpoint

## [0.19.68] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user info endpoint

## [0.19.67] - 2026-05-05

### Added
- **[UI] WorkersPage**: Added avatar display

### Added
- **[UI] WorkersPage**: Added role badge display

## [0.19.66] - 2026-05-05

### Added
- **[API] WorkersPage**: Added `/auth/user-info` endpoint

## [0.19.65] - 2026-05-05

### Added
- **[UI] UsersPage**: Added logout functionality

### Added
- **[UI] UsersPage**: Added demo user data

## [0.19.64] - 2026-05-05

### Added
- **[API] UsersPage**: Added user info endpoint

## [0.19.63] - 2026-05-05

### Fixed
- **[API] ProfilePage**: Fixed profile API endpoint

## [0.19.62] - 2026-05-05

### Fixed
- **[API] ProfilePage**: Fixed profile page

## [0.19.61] - 2026-05-05

### Fixed
- **[UI] ProfilePage API**: Fixed profile API endpoint

## [0.19.60] - 2026-05-05

### Fixed
- **[API] ProfilePage**: Fixed profile API endpoint

## [0.19.59] - 2026-05-05

### Fixed
- **[UI] ProfilePage**: Fixed profile page display

## [0.19.58] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile component

## [0.19.57] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile component

## [0.19.56] - 2026-05-05

### Added
- **[UI] UserProfile**: Added avatar display

## [0.19.55] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile display

## [0.19.54] - 2026-05-05

### Fixed
- **[UI] UserProfile**: Fixed profile loading

## [0.19.53] - 2026-05-05

### Added
- **[UI] UserProfile**: Added profile page

## [0.19.52] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Fixed users loading

## [0.19.51] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed users fetch

## [0.19.50] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.49] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed unused API endpoint

## [0.19.48] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.47] - 2026-05-05

### Added
- **[UI] WorkersPage**: Added avatar URL to workers data

## [0.19.46] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed duplicate endpoint

## [0.19.45] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display when users exist

### Changed
- **[API] WorkersPage**: Changed from `getWorkers` to `getUsers`

## [0.19.44] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

### Changed
- **[API] WorkersPage**: Changed from `getWorkers` to `getUsers`

## [0.19.43] - 2026-05-05

### Fixed
- **[APi] WorkersPage**: Updated worker data format

## [0.19.42] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed duplicate endpoint

## [0.19.41] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed unused endpoint

### Fixed
- **[UI] UsersPage**: Fixed duplicate API call

## [0.19.40] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed unused endpoint

## [0.19.39] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Removed duplicate endpoint

## [0.19.38] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed fetch endpoint

## [0.19.37] - 2026-05-05

### Fixed
- **[API] UsersPage**: Removed duplicate endpoint

## [0.19.36] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.35] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display mode

### Fixed
- **[UI] WorkersPage**: Fixed loading state

## [0.19.34] - 2026-05-05

### Fixed
- **[UI] UsersPage**: Fixed fetch

## [0.19.33] - 2026-05-05

### Added
- **[API] UsersPage**: Added users endpoint

## [0.19.32] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed endpoint naming

## [0.19.31] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user role display

### Fixed
- **[UI] UsersPage**: Fixed user list

## [0.19.30] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user role display

## [0.19.29] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user role display

## [0.19.28] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user list

### Changed
- **[API] UsersPage**: Changed endpoint structure

## [0.19.27] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed role display

## [0.19.26] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed user fetch

## [0.19.25] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed endpoint

## [0.19.24] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed endpoint

## [0.19.23] - 2026-05-05

### Fixed
- **[API] UsersPage**: Fixed fetch

## [0.19.22] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

### Fixed
- **[API] UsersPage**: Fixed endpoint

## [0.19.21] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user info

## [0.19.20] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.19] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user info

## [0.19.18] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.17] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

## [0.19.16] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed user info

## [0.19.15] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Fixed user fetch

## [0.19.14] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.13] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

## [0.19.12] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.11] - 2026-05-05

### Fixed
- **[API] WorkersPage**: Fixed worker fetch

## [0.19.10] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.9] - 2026-05-05

### Added
- **[UI] UsersPage**: Added users page

## [0.19.8] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed empty state

## [0.19.7] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.6] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.5] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.4] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed worker list

## [0.19.3] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.2] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.1] - 2026-05-05

### Fixed
- **[UI] WorkersPage**: Fixed display

## [0.19.0] - 2026-05-05

### Added
- **[UI] UsersPage**: Added users page

</CHANGELOG_END>

---

Recent Changes Summary:

## [0.19.99] - 2026-05-05

### Fixed
- **[UI] WorkerPortal Login**: Fixed login flow to gracefully accept demo credentials ("Demo"/"1234") when API is unavailable
- **[UI] WorkerPortal Demo Mode**: Added fallback logic to use demo data when server is not running
- **[UI] WorkerPortal Error Handling**: Improved error messages for API unavailable scenarios, suggesting demo mode usage

### Added
- **[UI] WorkerPortal**: Added `loadDemoData()` function for demo mode support
- **[UI] WorkerPortal**: Added graceful fallback when API is not running
- **[UI] WorkerPortal**: Demo credentials now auto-enabled when server is unavailable

### Changed
- **[UI] WorkerPortal**: Modified `handleLogin()` to check for demo credentials first before calling API
- **[UI] WorkerPortal**: Simplified error handling to reduce complexity

## MOBILE CHANGES - [0.20.01] - 2026-05-05

**Location**: `/home/zerwiz/CodeP/Way of pi/projects/work-button-improvements/mobile/`

### Files Created (9):
1. **README.md** - Entry point with quick links
2. **MOBILE-VIEWS-INDEX.md** - Overview of mobile views
3. **MOBILE-MODULES.md** - Component structure & files
4. **MOBILE-UX.md** - UX patterns & breakpoints
5. **MOBILE-CHROME.md** - Top bar implementation
6. **CLAW-MOBILE-TAB-BAR.md** - Claw navigation tabs
7. **SIMPLE-MOBILE-TAB-BAR.md** - Simple navigation tabs
8. **MOBILE-SHELL.md** - Shell hook `?shell=mobile`
9. **MOBILE-TECHNICAL-SHELL.md** - Track 3 stub

### Components Documented:
- `MobileChrome` - Shared top bar
- `ClawMobileTabBar` - 8-tab bottom nav
- `SimpleMobileTabBar` - 6-tab bottom nav
- `MobileTechnicalShell` - Track 3 stub
- `useShellMobile` - Mobile shell hook

### Features Covered:
- Mobile-first design patterns
- Touch-friendly controls (min 44x44px)
- Responsive breakpoints (≤768px, 769-1024px, ≥1025px)
- Safe-area support (iOS notch, Android status bar)
- Entry points: `?shell=mobile`, `/m`, localStorage

---