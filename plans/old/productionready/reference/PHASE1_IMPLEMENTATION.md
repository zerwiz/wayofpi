# Phase 1 Implementation Guide (Step-by-Step)

## Correct Paths
- **Server root**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/`
- **Database**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/wayofpi.sqlite`
- **UI src**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/`

---

## Step 1: Database Foundation (SQLite Setup)

### 1.1 Update DB Path in Server
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/index.ts`

```typescript
// At top of index.ts, replace any .pi references:
const DB_PATH = import.meta.dir + "/wayofpi.sqlite";  // NOT .pi/db/wayofpi.sqlite

import { Database } from "bun:sqlite";
const db = new Database(DB_PATH);

// Enable WAL mode for concurrent reads
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA synchronous = NORMAL");
db.run("PRAGMA foreign_keys = ON");
```

### 1.2 Initialize Schema
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/schema.sql` (already created)

Run:
```bash
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server"
bun init-db.ts
```

**Verify**:
```bash
sqlite3 wayofpi.sqlite ".tables"
# Should show: audit_logs, projects, tasks, tenants, time_entries, users, workspace_files, whatsapp_sessions
```

---

## Step 2: Tenant Isolation (getPrimaryWorkspacePath Hardening)

### 2.1 Fix Path Traversal in `paths.ts`
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/paths.ts`

```typescript
import { resolve, normalize, sep } from "node:path";

// SECURE: Tenant-scoped workspace root
export function getPrimaryWorkspacePath(tenantId: string = "default"): string {
  // 1. Validate tenantId (no path traversal)
  if (!tenantId || tenantId.includes("..") || tenantId.includes(sep)) {
    throw new Error("Invalid tenant ID");
  }
  
  // 2. Get base workspace from env or default
  const baseWorkspace = process.env.WOP_WORKSPACE_ROOT 
    || "/home/zerwiz/CodeP/Way of pi/workspace";
  
  // 3. Tenant isolation: each tenant gets subdirectory
  const tenantWorkspace = resolve(baseWorkspace, tenantId);
  
  // 4. Ensure path stays within base (double-check)
  if (!tenantWorkspace.startsWith(resolve(baseWorkspace) + sep)) {
    throw new Error("Path traversal detected");
  }
  
  return tenantWorkspace;
}

// SECURE: Resolve file under tenant workspace only
export function resolveUnderWorkspace(relPath: string, tenantId: string = "default"): string | null {
  // 1. Reject null bytes and absolute paths
  if (!relPath || relPath.includes("\0") || relPath.startsWith("/")) {
    return null;
  }
  
  // 2. Normalize and reject ..
  const normalized = normalize(relPath).replace(/\\/g, sep);
  if (normalized.includes("..")) {
    return null;
  }
  
  // 3. Resolve under tenant workspace
  const workspaceRoot = getPrimaryWorkspacePath(tenantId);
  const resolved = resolve(workspaceRoot, normalized);
  
  // 4. Boundary check (trailing sep is critical!)
  if (!resolved.startsWith(workspaceRoot + sep) && resolved !== workspaceRoot) {
    return null;  // Path traversal attempt
  }
  
  return resolved;
}
```

### 2.2 Update `workspace-state.ts`
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/workspace-state.ts`

Find `getPrimaryWorkspacePath` calls and add `tenantId` parameter:
```typescript
// OLD: const root = getPrimaryWorkspacePath();
// NEW:
const root = getPrimaryWorkspacePath(auth?.tenantId || "default");
```

---

## Step 3: RBAC Engine (4-Tier Role System)

### 3.1 Add Role Checks to Server
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/index.ts`

Add after auth verification (around line 942):
```typescript
// Helper: Check user role
function hasRole(userRole: string, requiredRoles: string[]): boolean {
  const roleHierarchy = {
    "SUPER_ADMIN": 4,
    "ADMIN": 3,
    "LEADER": 2,
    "WORKER": 1,
    "CLIENT": 0,
  };
  const userLevel = roleHierarchy[userRole] ?? -1;
  return requiredRoles.some(r => (roleHierarchy[r] ?? -1) <= userLevel);
}

// In the fetch handler, after `const auth = ...`:
if (auth) {
  const user = db.query("SELECT role FROM users WHERE id = ?").get(auth.userId) as any;
  auth.role = user?.role || "WORKER";
}

// Protect leader endpoints:
if (p.startsWith("/api/portal/leader") && !hasRole(auth?.role, ["SUPER_ADMIN", "ADMIN", "LEADER"])) {
  return json({ error: "Forbidden: Leader access required" }, 403);
}

// Protect admin endpoints:
if (p.startsWith("/api/admin") && !hasRole(auth?.role, ["SUPER_ADMIN", "ADMIN"])) {
  return json({ error: "Forbidden: Admin access required" }, 403);
}
```

### 3.2 Update Login to Return Role
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/index.ts`

In `/api/login` and `/api/portal/login` handlers, ensure response includes role:
```typescript
return json({
  token,
  user: {
    id: user.id,
    username: user.username,
    role: user.role,        // ← ADDED
    tenantId: user.tenant_id,
  },
});
```

---

## Step 4: Remove Mock Auth & Wire Real APIs

### 4.1 Update UI to Store User Info
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/api/client.ts`

Already done (sends JWT in Authorization header).

### 4.2 Update Worker Portal to Use Real Data
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/pages/WorkerPortal.tsx`

Replace TODO placeholders with real API calls:
```typescript
async function loadPortalData() {
  try {
    setLoading(true);
    const token = localStorage.getItem("wop_token");
    const headers = { Authorization: `Bearer ${token}` };
    
    const [meRes, tasksRes, filesRes] = await Promise.all([
      fetch("/api/portal/me", { headers }),
      fetch("/api/portal/tasks", { headers }),
      fetch("/api/portal/files", { headers }),
    ]);
    
    if (meRes.ok) {
      const data = await meRes.json();
      setWorkerName(data.full_name || data.username);
    }
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (filesRes.ok) setFiles(await filesRes.json());
    
    setLoadError("");
  } catch (e) {
    setLoadError(e instanceof Error ? e.message : "Failed to load data");
  } finally {
    setLoading(false);
  }
}
```

### 4.3 Implement Real API Endpoints
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/index.ts`

Update the stub endpoints (already added earlier):
```typescript
if (p === "/api/portal/me" && req.method === "GET") {
  if (!auth) return json({ error: "Unauthorized" }, 401);
  const user = db.query("SELECT id, username, full_name, role, phone, job_title FROM users WHERE id = ?").get(auth.userId) as any;
  if (!user) return json({ error: "User not found" }, 404);
  return json({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    phone: user.phone,
    jobTitle: user.job_title,
    tenantId: auth.tenantId,
  });
}

if (p === "/api/portal/tasks" && req.method === "GET") {
  if (!auth) return json({ error: "Unauthorized" }, 401);
  const tasks = db.query(`
    SELECT t.*, u.full_name as assigned_name 
    FROM tasks t 
    LEFT JOIN users u ON t.assigned_to = u.id 
    WHERE t.tenant_id = ? AND (t.assigned_to = ? OR ? IN ('LEADER', 'ADMIN'))
  `).all(auth.tenantId, auth.userId, auth.role) as any[];
  return json(tasks);
}
```

---

## Step 5: Audit Log (Security)

### 5.1 Add Audit Logging
**File**: `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server/index.ts`

```typescript
function auditLog(tenantId: string | null, userId: string | null, action: string, resourceType: string, resourceId: string, details: object) {
  try {
    // Mask secrets before logging
    const maskedDetails = JSON.stringify(details, (key, value) => {
      if (["password", "pin", "token", "authorization"].includes(key.toLowerCase())) {
        return "***MASKED***";
      }
      return value;
    });
    
    db.run(`
      INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [tenantId, userId, action, resourceType, resourceId, maskedDetails]);
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

// Usage in endpoints:
if (p === "/api/portal/time" && req.method === "POST") {
  // ... after successful insert:
  auditLog(auth.tenantId, auth.userId, "TIME_ENTRY_CREATE", "time_entry", newId, { hours, project });
}
```

---

## Verification Checklist

After each step, verify:

### Step 1: DB Foundation ✅
- [ ] `bun init-db.ts` runs without errors
- [ ] `sqlite3 wayofpi.sqlite ".tables"` shows all tables
- [ ] WAL mode enabled: `sqlite3 wayofpi.sqlite "PRAGMA journal_mode"` → `wal`

### Step 2: Path Hardening ✅
- [ ] `getPrimaryWorkspacePath("..")` throws error
- [ ] `resolveUnderWorkspace("../../../etc/passwd", "tenant1")` returns null
- [ ] `resolveUnderWorkspace("valid/file.txt", "tenant1")` returns valid path within workspace

### Step 3: RBAC ✅
- [ ] Worker role cannot access `/api/portal/leader/*` (403)
- [ ] Leader role can access worker endpoints
- [ ] Admin role can access all endpoints

### Step 4: Real APIs ✅
- [ ] Worker Portal loads real data (no more "API not implemented" errors)
- [ ] Login returns JWT with role info
- [ ] All `/api/portal/*` endpoints return real DB data

### Step 5: Audit ✅
- [ ] `SELECT * FROM audit_logs` shows masked secrets
- [ ] Sensitive fields (password, pin, token) show as `***MASKED***`

---

## Quick Start Commands

```bash
# 1. Navigate to server directory
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/server"

# 2. Initialize database
bun init-db.ts

# 3. Start server in dev mode (no auth required)
WOP_DEV_MODE=true bun index.ts

# 4. In another terminal, test API
curl http://localhost:3333/api/health
curl http://localhost:3333/api/portal/me -H "Authorization: Bearer test"

# 5. Start UI dev server
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui"
npm run dev
```

---

## Next Phase Preview

After Phase 1 complete:
- **Phase 2**: Multi-tenant architecture enforcement
- **Phase 3**: Kanban reuse + Work Leader Claw + AI predictions
- **Phase 4**: Docker, testing, production deploy

**Focus on Phase 1 first** - everything else builds on this foundation.
