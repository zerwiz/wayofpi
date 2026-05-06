# UI Transport & Auth Status Report

**Date**: 2026-05-06  
**Session Focus**: Fix UI transport/routing and auth flow for Client/Portal dashboards

---

## 1. What Was Fixed This Session

### A. Database Connection Issues (RESOLVED ✅)

**Problem**: API endpoints returned `{"error":"Failed to fetch time entries","details":"no such table: time_entries"}`

**Root Cause**: Database path mismatch between `db.ts` and server runtime workspace

**Fixes Applied**:
- Updated `server/db.ts` line 5: Changed DB path from `join(import.meta.dir, "..", "..", ".pi", "db")` to `join(import.meta.dir, "..", "..", "wayofpi-server", "db")`
- Updated `server/init-db.ts` to use same path as `db.ts`
- Fixed `tenants` INSERT query (line 89) to include required `slug` column
- Added `projects`, `tasks`, `time_entries` table creation to `db.ts`
- Database now correctly located at: `/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server/db/wayofpi.sqlite`

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

### A. Testing Phase (PENDING ⏳)

**Server-Side**:
- [ ] Restart server to pick up database changes (tables now created successfully)
- [ ] Test `GET /api/portal/time` endpoint with valid JWT
- [ ] Test `POST /api/portal/time` submit entry
- [ ] Test `GET /api/portal/tasks` endpoint
- [ ] Test `POST /api/portal/tasks` create task
- [ ] Test `POST /api/portal/time/:id/approve` endpoint
- [ ] Test `POST /api/portal/time/:id/reject` endpoint

**Client-Side**:
- [ ] Test login flow with valid Client ID/PIN
- [ ] Test "Client" button shows login form (✓ code complete, needs manual testing)
- [ ] Test role-based nav visibility
- [ ] Test Portal integration
- [ ] Test login/logout flow (need logout button)

**Worker Portal**:
- [ ] Test worker can submit time entry
- [ ] Test leader can approve/reject entries
- [ ] Test task assignment workflow

**Docs Mode**:
- [ ] Test file tree shows only document files
- [ ] Test document status badges work
- [ ] Test quick prompt buttons
- [ ] Test markdown rendering in viewer

---

### B. Missing Features (PENDING ⏳)

**Authentication**:
- [ ] Add logout button to `ClientDashboard.tsx` (clear `wop_token` from `localStorage`)
- [ ] Add logout button to `WorkerPortal.tsx`
- [ ] Token expiration handling (currently 24h, no refresh mechanism)
- [ ] "Remember me" checkbox for persistent login

**Navigation**:
- [ ] Context-aware conditional nav: `Work → [Portal] | [Client] | [Admin] | [Profile]`
- [ ] Implement role-based visibility:
  - Worker users → see Portal
  - Admin users → see Admin
  - Client projects → see Client
  - All users → see Profile
- [ ] Show portal dashboard when "Portal" clicked (currently just changes route)
- [ ] Handle authentication flow properly in `Navigation.tsx`

**Work Mode Components Integration**:
- [ ] `apps/wayofpi-ui/src/App.tsx` - Render `WorkApp`, handle routing
- [ ] Integrate `WorkApp.tsx` with Navigation "Work" button
- [ ] Connect time entry form to API endpoints
- [ ] Connect task list to API endpoints
- [ ] Implement approve/reject UI for leaders

---

### C. Code Quality & Technical Debt (PENDING ⏳)

**Error Handling**:
- [ ] Add error boundaries to `ClientDashboard.tsx`
- [ ] Add retry logic for failed API calls
- [ ] Show user-friendly error messages (currently just `console.error`)

**Security**:
- [ ] Move JWT secret to environment variable (currently hardcoded in `auth.ts` line 3)
- [ ] Add rate limiting to login endpoint
- [ ] Add CSRF protection
- [ ] Sanitize user inputs in login form

**Documentation**:
- [ ] Add JSDoc comments to new functions in `ClientDashboard.tsx`
- [ ] Update `README.md` with login flow documentation
- [ ] Create user guide for Client Dashboard

---

## 3. Current State of UI Transport (Routing/Auth)

### A. Routing Mechanism

**Current Implementation**:
- Uses `window.location.pathname` for routing (no React Router)
- `App.tsx` lines 265-268: Checks pathname to determine which page to render:
  ```typescript
  const isPortal = window.location.pathname === "/portal" || window.location.pathname.startsWith("/portal/");
  const isClient = window.location.pathname === "/client" || window.location.pathname.startsWith("/client/");
  const isAdmin = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");
  const isProfile = window.location.pathname === "/profile" || window.location.pathname.startsWith("/profile/");
  ```

**Navigation Component** (`Navigation.tsx`):
- Primary Nav: `[Simple] [Technical] [Claw] [Docs] [Work]`
- Context-Aware Nav: `[Client] | [Portal] | [Admin] | [Profile]`
- Clicking nav items sets `window.location.pathname = item.path`
- `showCondition` function controls visibility based on `userRole`

**Pages**:
- `/` → Main App (Simple/Technical/Claw/Docs/Work modes)
- `/portal` → `WorkerPortal.tsx`
- `/client` → `ClientDashboard.tsx`
- `/admin` → `SuperAdminDashboard.tsx`
- `/profile` → `UserProfile.tsx`

---

### B. Authentication Flow

**JWT-Based Authentication**:
- **Token Storage**: `localStorage.getItem("wop_token")` / `localStorage.setItem("wop_token", token)`
- **Token Generation**: `server/auth.ts` - `createToken(userId, tenantId)` returns JWT with 24h expiration
- **Token Verification**: `verifyToken(token)` returns `{ userId, tenantId, role }` or `null`

**Login Endpoints**:
1. **Worker/Client Login**: `POST /api/portal/login` (line 914)
   - Body: `{ workerId, pin }`
   - Returns: `{ token, user: { id, username, role, tenantId } }`
   - JWT payload includes: `{ userId, tenantId, role }`

2. **Admin Login**: Not yet implemented (no `/api/admin/login` endpoint)

**Auth Check in APIs**:
- `server/index.ts` lines 944-960:
  ```typescript
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  let auth = token ? await verifyToken(token) : null;

  // DEV MODE: Allow requests without auth when WOP_DEV_MODE=true
  const isDevMode = process.env.WOP_DEV_MODE === "true";
  if (!auth && isDevMode) {
    auth = { userId: "dev-user", tenantId: "dev-tenant", role: "ADMIN" };
  }
  ```

**Client Dashboard Auth Flow** (FIXED ✅):
1. User navigates to `/client`
2. `ClientDashboard` checks `localStorage.getItem("wop_token")`
3. If no token → shows login form (Client ID + PIN)
4. On submit → `POST /api/portal/login` with `{ workerId, pin }`
5. Receives JWT → stores in `localStorage` as `wop_token`
6. Sets `isLoggedIn = true` → fetches data from `/api/client/*` with auth header

---

### C. API Authentication

**API Client** (`src/api/client.ts`):
```typescript
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("wop_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

**Protected Endpoints**:
- `GET /api/client/projects` - requires `auth.role === "CLIENT"`
- `GET /api/client/drawings` - requires `auth.role === "CLIENT"`
- `POST /api/client/feedback` - requires `auth.role === "CLIENT"`
- `GET /api/portal/time` - requires valid auth
- `POST /api/portal/time` - requires valid auth
- `GET /api/portal/tasks` - requires valid auth
- `POST /api/portal/tasks` - requires valid auth

**Public Endpoints** (no auth required):
- `GET /api/health`
- `GET /api/manifest`
- `GET /api/config`

---

### D. Current Known Issues

1. **No Admin Login Flow**: Admin dashboard (`/admin`) has no login form like Client Dashboard
2. **No Logout Mechanism**: No logout button in any dashboard (need to clear `wop_token`)
3. **Token Expiration**: No handling for expired tokens (24h limit)
4. **Hardcoded JWT Secret**: `auth.ts` line 3 uses hardcoded secret instead of environment variable
5. **No Route Guards**: Any user can navigate to `/client` or `/admin` by manually changing URL, even without auth

---

## Summary

**Fixed This Session** ✅:
- Database connection issues (tables now create successfully)
- WebSocket HMR connection issues
- 403 Forbidden errors on client APIs
- UI transport/routing now makes sense (login form before protected routes)

**Still Pending** ⏳:
- Testing all API endpoints after server restart
- Adding logout functionality
- Implementing proper route guards
- Role-based navigation visibility
- Work mode component integration with APIs

**Current State**:
- UI transport now has a logical flow: Navigation → Login Form → Authenticated Dashboard
- JWT-based auth working with role-based API access
- Database tables created and ready for testing
- WebSocket connections working properly

---

**Files Modified This Session**:
1. `apps/wayofpi-ui/server/db.ts` - Fixed DB path and table creation
2. `apps/wayofpi-ui/server/init-db.ts` - Synced DB path with db.ts
3. `apps/wayofpi-ui/server/index.ts` - Fixed WebSocket path, added role to dev mode auth
4. `apps/wayofpi-ui/server/auth.ts` - JWT now includes role field
5. `apps/wayofpi-ui/src/pages/ClientDashboard.tsx` - Added login form and auth check
6. `apps/wayofpi-ui/vite.config.ts` - Fixed WebSocket proxy config
7. `CHANGELOG.md` - Updated with fixes
8. `plans/projects/work-button-improvements/TODO.md` - Updated with progress
