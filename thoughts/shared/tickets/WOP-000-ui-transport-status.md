# UI Transport & Auth Status Report

**Date**: 2026-05-06  
**Session Focus**: Fix UI transport/routing and auth flow for Client/Portal dashboards

---

## 1. What Was Fixed This Session

### A. Database Connection Issues (RESOLVED ✅)

**Problem**: API endpoints returned `{"error":"Failed to fetch time entries","details":"no such table: time_entries"}`

**Root Cause**: Database path mismatch between `db.ts` and server runtime workspace

**Fixes Applied**:
- Updated `server/db.ts` line 5: Changed DB path from `join(import.meta.dir, "..", "..", ".pi", "db")` to `join(import.meta.dir, "..", "..", "wayofwork-server", "db")`
- Updated `server/init-db.ts` to use same path as `db.ts`
- Fixed `tenants` INSERT query (line 89) to include required `slug` column
- Added `projects`, `tasks`, `time_entries` table creation to `db.ts`
- Database now correctly located at: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-server/db/wayofpi.sqlite`

**Result**: Tables now create successfully: `tenants`, `users`, `projects`, `tasks`, `time_entries`, `workspace_files`, `whatsapp_sessions`, `audit_logs`

---

### B. WebSocket Connection Issue (RESOLVED ✅)

**Problem**: `useWayOfPiSession.ts:963 WebSocket connection to 'ws://localhost:5173/ws' failed: WebSocket is closed before the connection is established.`

**Root Cause**: Vite HMR WebSocket path included query params (e.g., `/ws?session=xyz`), but server checked for exact match `url.pathname === "/ws"`

**Fix Applied**:
- Updated `server/index.ts` line 2547: Changed `url.pathname === "/ws"` to `url.pathname.startsWith("/ws")`
- Updated `vite.config.ts`: Removed incorrect `rewrite` function from WebSocket proxy config

**Result**: WebSocket connections now handle HMR paths with session IDs correctly

---

### C. 403 Forbidden on Client APIs (RESOLVED ✅)

**Problem**: `ClientDashboard.tsx:61 GET http://localhost:5173/api/client/projects 403 (Forbidden)`

**Root Cause**: `/api/client/*` endpoints check `auth.role === "CLIENT"` (line 1392, 1434, 1449 in server/index.ts), but:
1. Dev mode fake auth didn't include `role` field
2. No login flow existed to obtain JWT with correct role

**Fixes Applied**:
- Updated `server/index.ts` line 959: Added `role: "ADMIN"` to dev mode fake auth
- Updated `server/auth.ts`: JWT payload now includes `role` field from database
- Updated `server/index.ts` lines 1391-1449: Client APIs properly check `auth.role === "CLIENT"`

**JWT Token Generation for Testing**:
```bash
node -e "
const { SignJWT } = require('jose');
const SECRET = new TextEncoder().encode('way-of-pi-secret-key-change-me');
const token = await new SignJWT({ userId: 'dev-user', tenantId: 'dev-tenant', role: 'CLIENT' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(SECRET);
console.log(token);
"
```

**Result**: Client APIs now return `[]` instead of 403 when using proper JWT token

---

### D. UI Transport/Routing Fix (RESOLVED ✅)

**Problem**: User noted "the ui and e how the user gets transported done make sence" - the UI transport didn't make sense. When clicking "Client" in Navigation, it set `window.location.pathname = "/client"`, but user had no JWT token, resulting in 403 errors.

**Root Cause**: No login flow existed - user was transported to protected route without authentication

**Fixes Applied**:
- Updated `ClientDashboard.tsx`:
  - Added `isLoggedIn` state that checks `localStorage.getItem("wop_token")` and validates JWT payload has `role: "CLIENT"`
  - Added login form UI with Client ID and PIN fields
  - Added `handleLogin()` function that calls `POST /api/portal/login` and stores JWT in `localStorage` as `wop_token`
  - Modified `useEffect` to only fetch data when `isLoggedIn` is true
  - Shows login form when not authenticated instead of immediately trying to fetch protected APIs

**Login Flow Now**:
1. User clicks "Client" in Navigation → `window.location.pathname = "/client"`
2. `ClientDashboard` loads → checks for valid JWT in `localStorage`
3. If no valid JWT → shows login form (Client ID + PIN)
4. User submits login → `POST /api/portal/login` returns JWT with `role: "CLIENT"`
5. JWT stored in `localStorage` → `setIsLoggedIn(true)` → data fetching begins

**Result**: No more 403 errors - users now see a proper login form before accessing protected dashboards

---

## 2. Technical Debt & Pending Work

### A. Design & Logic Phase (COMPLETED ✅)

**Architecture Defined**:
- [x] Defined Unified Login Flow in `docs/UI_UX_ROUTING_AND_HEADER.md`
- [x] Defined Role-Based Redirection Matrix
- [x] Defined Global Header Visibility Rules
- [x] Designed "Admin Bridge" logic for transitioning between IDE and Portals

---

## 3. Current State of UI Transport (Routing/Auth)

### A. Routing Mechanism (PLANNED REFACTOR)

**Current Implementation**:
- Uses `window.location.pathname` for routing (no React Router)
- `App.tsx` lines 265-268: Checks pathname to determine which page to render.

**Planned Refactor**:
- Move all routing logic into a centralized `Layout` or `AppContent` component.
- Implement a global `AuthGate` that redirects to a unified `/login` page if no token exists.
- Unified header (`MenuBar` + `Navigation`) will be rendered conditionally based on path/role.

---

### B. Authentication Flow (PLANNED REFACTOR)

**Unified Login**:
- Users will no longer have separate login forms on `/client` or `/portal`.
- All auth happens at `/login`.
- JWT payload `role` determines the initial landing page.

---

## Summary

**Fixed This Session** ✅:
- Database connection issues (tables now create successfully)
- WebSocket HMR connection issues
- 403 Forbidden errors on client APIs
- UI Transport Logic & UX Documentation (Completed Blueprint)

**Next Steps** ⏳:
- [ ] Implement Unified `LoginPage.tsx` (Logic already defined)
- [ ] Refactor `App.tsx` to use the new routing/header logic
- [ ] Embed `Navigation` inside `MenuBar` as a single Global Header
- [ ] Add logout functionality to the Global Header

**Current State**:
- We have a clear technical blueprint for the UI/UX overhaul. 
- The logic is documented and ready for implementation.
- All technical blockers (DB, WebSocket) have been resolved.

---

**Files Modified This Session**:
1. `docs/UI_UX_ROUTING_AND_HEADER.md` - Created & Expanded Architecture Blueprint
2. `plans/STATUS-UI-TRANSPORT.md` - Updated with Logic-First status
3. `apps/wayofwork-ui/src/pages/LoginPage.tsx` - Initial implementation (pending App.tsx integration)
4. `apps/wayofwork-ui/src/pages/index.ts` - Exported LoginPage
5. `CHANGELOG.md` - Recorded architectural planning progress
...
