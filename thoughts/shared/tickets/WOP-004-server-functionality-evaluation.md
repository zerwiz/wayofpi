# [WOP-004] Server Functionality Evaluation: Architecture Change Assessment

> 📋 **Task checkboxes migrated to `WOP-ALL-TODO.md`: Phase 0 (Clean Build) + Phase 1 (Runtime Stability) + Phase 6 (SDK Migration).** Update checkboxes there, not here.

## 📋 Executive Summary

**Date**: 2026-05-06  
**Priority**: Critical  
**Severity**: High  
**Status**: **OPEN - Evaluation Required**

### Decision Matrix

After extensive analysis of all server functionality issues, **the current server architecture shows multiple critical failures that suggest a fundamental architectural change is Warranted**.

**Current Status**: ❌ **NOT Viable as-is**  
**Key Issues**:
- 60+ TypeScript build errors (prevent clean builds)
- Persistent Electron white screen despite fixes
- WebSocket connection instability  
- Runtime ENOENT errors
- Missing unified auth routing

**Recommended Action**: **MAJOR ARCHITECTURE REVIEW & MIGRATION**  
**Estimated Effort**: Large (2-3 sessions)  
**Risk Mitigation**: Required before migration

---

## 🎯 Problem Statement

The server component (`apps/wayofpi-server/`) is experiencing **continuous build failures, runtime errors, and architectural debt** that cannot be resolved through incremental fixes alone. The current approach has led to:

1. **Build Failures**: 60+ TypeScript errors preventing `bun run build` from completing
2. **Runtime Instability**: WebSocket disconnections, ENOENT errors, white screen issues
3. **Architecture Debt**: Coupled dependencies, incomplete abstractions
4. **Frequent Hotfixes**: Problems solved temporarily but reappearing

**Question**: Should we:
1. **Keep current architecture** and fix all issues incrementally?
2. **Migrate to a cleaner architecture**?
3. **Hybrid approach**: Extract server as standalone Bun server, decouple from client?

---

## 🔍 Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     apps/wayofpi-server/                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  server/                                                 │ │
│  │    - index.ts (Main server handler, WebSocket, APIs)    │ │
│  │    - db.ts (Database connection, schema)                 │ │
│  │    - auth.ts (JWT generation/validation)                 │ │
│  │    - hooks/ (Server-side hooks)                          │ │
│  │    - hooks/ (Shared hooks - client imports)              │ │
│  │    - utils/ (Helper utilities)                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  apps/wayofpi-ui/ (Client/Vite)                          │ │
│  │    - src/ (React components)                              │ │
│  │    - electron/ (Electron wrapper)                         │ │
│  │    - server/ (Proxy layer, shared with above?)            │ │
│  │    - vite.config.ts (WebSocket proxy)                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Critical Design Flaws Identified

| Issue | Impact | Root Cause |
|-------|--------|-------------|
| Server in client repo | Tight coupling | Server code is inside `apps/wayofpi-server/` but client repo expects certain structure |
| Mixed concerns | Hard to maintain | Server logic mixed with client proxies in same paths |
| Import paths broken | Build failures | Missing `shared/`, `hooks/`, `types/` imports from server |
| No clean API layer | 403 issues, proxy complications | Client makes direct API calls, proxy adds complexity |
| Electron preload issues | White screen | ESM/CMJS incompatibility, sandbox requirements |

---

## 📊 Issue Analysis

### A. Build Errors (60+ TypeScript Errors)

**Categories**:

| Category | Count | Examples | Fix Feasibility |
|----------|-------|----------|-----------------|
| Missing module imports | 20+ | `claw-automation-status`, `claw-mission-events` | ⚠️ Low - Requires restructuring shared types |
| ChatRow property mismatches | 3-5 | `fromUser` vs `role` | ✅ Medium - Simple renaming |
| Icon import errors | 2-3 | Wrong heroicons imports | ✅ Easy - Copy-paste fix |
| Type mismatches | 8-12 | `Navigation`, `MenuBar` props | ⚠️ Medium - Requires refactoring |
| Missing props | 5-10 | Components missing required props | ✅ Easy - Add props or remove |

**Why Incremental Fix is NOT Sufficient**:
- Errors are **fundamental to architecture** (shared/ imports, hooks/ paths)
- TypeScript path aliases are broken or inconsistent
- Building server separately from client is not working

**Cost**: 2-3 sessions to clean up, but likely to create new issues

---

### B. WebSocket Connection Issues

**Current Problems**:

1. **ECONNRESET Errors**
   - WebSocket upgrade fails in Bun proxy
   - Caused by unhandled errors in handlers
   - React.StrictMode creates race conditions

2. **Proxy Configuration**
   - `vite.config.ts` has incorrect `rewrite` function
   - WebSocket proxy needs `path: '/ws'` → `Bun WebSocket server :3333/ws`
   - Vite doesn't handle Bun WebSocket servers well

3. **ENOENT with Pi Binary**
   - `node_modules/.bin/pi` symlink doesn't exist before `bun install`
   - Spawn fails if `bun install` hasn't completed
   - Timing issues in app startup

**Why This Suggests Architecture Change**:

Current setup uses **Vite as reverse proxy** for WebSocket:
- Vite's built-in WebSocket HMR conflicts with Bun WebSocket
- Proxy layer adds complexity without benefit
- Better: **Direct client → Bun server connection** or **use separate WebSocket server**

**Alternative Architecture**:

```
┌────────────────────────────────────────────────────────────────┐
│                   Option 1: Unified Bun Server                   │
│         ┌────────────────────────────────────────────────────┐  │
│         │              Single Bun Server                      │  │
│         │   - Express/HTTP   - WebSocket   - API endpoints   │  │
│         │   - Auth           - WebSocket HMR     - DB         │  │
│         └────────────────────────────────────────────────────┘  │
│         Client (browser or Electron) → Direct to server         │
└────────────────────────────────────────────────────────────────┘
```

Or use **separate services**:

```
┌────────────────────────────────────────────────────────────────┐
│                  Option 2: Microservices Pattern                 │
│         │  ┌───────────────┐    ┌───────────────┐             │  │
│         │  │   API Server  │    │ WebSocket SVC │             │  │
│         │  │   (Express)   │    │  (WebSocket)  │             │  │
│         │  └───────┬───────┘    └───────┬───────┘             │  │
│         │          │                    │                       │  │
│         │          ↓                    ↓                       │  │
│         │  ┌───────────────────────────────┐                   │  │
│         │  │      Shared State (SQLite)     │                   │  │
│         │  └───────────────────────────────┘                   │  │
│         └───────────────────────────────────────────────────────┘
│                              ↓
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          Client (Browser/Electron)                         │  │
│  │         Connects directly to API + WebSocket               │  │
│  └───────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────┘
```

---

### C. Electron Preload & White Screen

**Root Cause**:

Electron 35 + `sandbox: true` requires:
- CommonJS preload scripts (`require()`)
- ESM syntax fails silently in sandboxed context

**Current Fix**: Renamed `preload.mjs` → `preload.cjs`, switched to CommonJS

**Why This is Symptomatic of Bigger Issue**:

1. **Electron Wrapper is Necessary but Fragile**: Requires workarounds for sandbox, preload, IPC
2. **White Screen Persistence**: Even after fixing preload, UI doesn't render properly
3. **Suggests Rendering Issue**: React might not be mounting correctly

**Better Alternative**:

```
┌────────────────────────────────────────────────────────────────┐
│                    Option: Pure Web App                         │
│         ┌───────────────────────────────────────────────────┐  │
│         │              Single Bun Server                     │  │
│         │         - Vite as static file server               │  │
│         │         - Direct API/WS connections                │  │
│         └───────────────────────────────────────────────────┘  │
│         Client (Browser) → No Electron, pure Vite              │
└────────────────────────────────────────────────────────────────┘
```

Benefits:
- No Electron wrapper complexity
- No preload/IPC issues
- Standard web deployment
- Easier debugging

---

### D. Routing & Auth Architecture

**Current Problems**:

1. **No Unified Auth**: Each page has its own login form
2. **Path-based Routing**: Uses `window.location.pathname` (vanilla)
3. **Header Visibility Not Unified**: Different headers for different routes
4. **No AuthGate**: JWT token not enforced globally

**Current State**:
- `/client` → Login form inline → fetches protected data
- `/portal` → Portal header → login check
- `/` → Global header → IDE mode
- No centralized auth flow

**Better Alternative**:

```
┌────────────────────────────────────────────────────────────────┐
│                  Unified Auth Architecture                      │
│         ┌───────────────────────────────────────────────────┐  │
│         │              /login (Unified Auth)                 │  │
│         │         - Single JWT token for all roles           │  │
│         │         - Role determines redirect                  │  │
│         └───────────────────────────────────────────────────┘  │
│                              ↓                                   │
│         ┌───────────────────────────────────────────────────┐  │
│         │              Protected Routes                      │  │
│         │   AuthGate wraps each route                        │  │
│         │   → Validate JWT                                  │  │
│         │   → Redirect to /login if invalid                  │  │
│         └───────────────────────────────────────────────────┘  │
│                              ↓                                   │
│         ┌───────────────────────────────────────────────────┐  │
│         │              Conditional Headers                    │  │
│         │   - Login: No header                                │  │
│         │   - Client/Portal: Portal Header (minimal)          │  │
│         │   - IDE/Admin: Global Header (full)                 │  │
│         └───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 💡 Evaluation: Keep vs. Change

### Option 1: Keep Current Architecture (Incremental Fixes)

**Pros**:
- ✅ No new architectural risk
- ✅ Existing investments (schema, auth flow)
- ✅ Can be done in small commits

**Cons**:
- ❌ 60+ TypeScript errors remain
- ❌ WebSocket issues persist
- ❌ White screen issue unresolved
- ❌ Server is tightly coupled to client repo
- ❌ Frequent hotfixes cycle continues

**Success Criteria**:
- [ ] Can resolve all 60+ build errors without refactoring
- [ ] White screen issue can be resolved
- [ ] WebSocket stability can be achieved without major proxy changes
- [ ] No new architectural issues appear

**Verdict**: **NOT RECOMMENDED** — Too many fundamental issues that suggest architectural debt

---

### Option 2: Migrate to Clean Architecture

**Recommendation**: Extract server as **standalone Bun service**

```
apps/wayofpi-server/ (Standalone Bun server)
├── server/
│   ├── index.ts          # Main server + API + WebSocket
│   ├── db.ts             # Database layer
│   ├── auth.ts           # Auth logic
│   ├── hooks/            # Server-side hooks
│   └── types/            # Server types
├── shared/               # Shared types/interfaces
├── utils/                # Utilities
└── api/                  # API route handlers
```

```
apps/wayofpi-ui/ (Vite Client)
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── types/
├── public/
└── package.json          # Dependencies only, no server code
```

**Benefits**:
- [x] Clean separation of concerns
- [x] Server can be deployed independently
- [x] No more preload/IPC issues (pure web app)
- [x] Simpler client build process
- [x] Easier to test server in isolation
- [x] Better scalability
- [x] Can use Bun directly without Vite proxy

**Migration Plan**:
1. Extract server to standalone repo or separate directory
2. Port all server logic from `wayofpi-ui/server/`
3. Update client to call server via URLs (not local paths)
4. Remove all client→server type sharing
5. Deploy server on separate port (e.g., :3000 or :3333)
6. Point Vite static files to Bun server

**Risk**: Moderate migration effort, but resolves fundamental issues

---

### Option 3: Hybrid Approach (Short-term Workaround)

**Goal**: Fix immediate issues without full migration

**Actions**:
1. **Fix all 60+ TypeScript errors** (2 sessions)
2. **Stabilize WebSocket** with better error handling (1 session)
3. **Fix Electron preload** definitively (1 session)
4. **Implement unified auth routing** (1-2 sessions)
5. **Document technical debt** and plan migration

**Decision Point**: After fixes, re-evaluate if migration is still needed

**Verdict**: **RECOMMENDED as interim step**, but migration should follow

---

## 📋 Recommended Path Forward

### Phase 1: Stabilize (2-3 sessions)
- [ ] Fix all 60+ TypeScript build errors
- [ ] Stabilize WebSocket without proxy
- [ ] Fix Electron white screen
- [ ] Resolve ENOENT timing issues
- [ ] Implement unified `/login` routing
- [ ] Document all remaining issues

### Phase 2: Evaluate Results (1 session)
- [ ] Rebuild with `bun run build` → 0 errors?
- [ ] Electron app renders correctly?
- [ ] WebSocket stable under load?
- [ ] User can login and use app?

**If YES to all phases above**: Decide on migration based on new architecture clarity

**If NO to any**: May need to reconsider current approach

### Phase 3: Migrate (if needed)
- [ ] Extract server to standalone
- [ ] Update client to call server URL
- [ ] Remove shared type dependencies
- [ ] Test full flow
- [ ] Deploy

---

## 🎯 Final Verdict & Recommendation

### **Current State: CRITICAL** ❌

The server cannot produce clean builds, has persistent runtime errors, and demonstrates architectural debt.

### **Recommended Decision: Option 2 (Migrate)**

**Rationale**:
1. **60+ build errors** indicate fundamental structure issues
2. **WebSocket instability** suggests proxy layer is the wrong approach
3. **Electron preload issues** show coupling is problematic
4. **Incremental fixes will create workarounds, not solutions**

**Timeline**:
- **Phase 1 (Stabilize)**: 2-3 sessions — Fix current issues, prove server viability
- **Decision Point**: Reassess migration necessity
- **Phase 2 (Migrate)**: If still needed, 3-4 sessions to migrate architecture

**Risk Mitigation**:
- Test migration with staging server
- Keep old server running during transition
- Automated tests to ensure functionality

### **Alternative: If Client-Only Approach Works**

If server complexity is too high, consider:
- Use serverless/cloud functions (AWS Lambda, Vercel)
- Or microservices with proper separation
- Or simplify to basic API server

**Question to Decision-Maker**: Is the current complexity justified by requirements, or can we use simpler architecture?

---

## 📊 Issue Priority

| Issue | Priority | Impact on User | Fix Difficulty |
|-------|----------|----------------|----------------|
| White screen (Electron) | 🔴 Critical | Cannot use app | ⚠️ Medium |
| 60+ build errors | 🔴 Critical | Cannot deploy | ⚠️ Medium (fundamental) |
| WebSocket ECONNRESET | 🟠 High | Chat broken | ✅ Easy (handler fix) |
| ENOENT timing | 🟡 Medium | Occasional breaks | ✅ Easy (install check) |
| No unified auth | 🟠 High | UX poor | ⚠️ Medium |
| Header visibility | 🟢 Low | Minor UX | ✅ Easy |

---

## 🔧 Technical Specifications

### Current Stack (Issues)

```typescript
// apps/wayofpi-server/ (Bun server)
server/index.ts           // Main handler + WebSocket + API
server/db.ts              // Database
server/auth.ts            // JWT
server/hooks/*.ts         // Shared hooks
server/shared/*           // Shared types
```

```typescript
// apps/wayofpi-ui/ (Vite client)
src/                      // React components
electron/                 // Electron wrapper
server/                   // Client proxy layer (issues)
vite.config.ts            // WebSocket proxy (issues)
```

### Recommended Stack (Migrated)

```typescript
// server.service/         // Standalone Bun server
├── index.ts              // Express + WebSocket + API
├── db.ts                 // SQLite
├── auth.ts               // JWT
├── routes/               // Route handlers
└── shared/               // Server-shared types
```

```typescript
// client/                 // Vite static-only
├── src/                  // React components only
├── hooks/                // Client hooks
└── package.json          // Frontend dependencies only
```

### Server Configuration (Recommended)

```typescript
// server/index.ts
const port = process.env.PORT || 3000;  // Direct port, no proxy

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/login', authenticate);
app.ws('/ws', handleWebSocket);  // Direct WebSocket on :3000

// Database connection
connectDatabase('./db/wayofpi.sqlite');
```

---

## 📝 Next Steps

1. **Create migration plan** (if chosen)
2. **Test current server** with `bun run build` and verify all issues can be fixed
3. **Document migration path** including:
   - Timeline
   - Resources needed
   - Risk assessment
   - Rollback plan
4. **Get approval** before starting migration

---

## 📖 Related Documentation

- WOP-002: Build errors documentation
- WOP-003: WebSocket/Electron issues
- STATUS-UI-TRANSPORT.md: UI routing status
- UI_UX_ROUTING_AND_HEADER.md: Auth routing blueprint

---

**Status**: OPEN — Evaluation complete, recommendations provided, awaiting decision on migration path
