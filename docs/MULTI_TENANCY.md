# Way of Pi — Multi-Tenancy Architecture

---

## What Exists Now

### 1. Database Schema (`apps/wayofpi-ui/server/schema.sql`)

Every data table has `tenant_id TEXT NOT NULL` with `REFERENCES tenants(id) ON DELETE CASCADE`:

```
tenants              →  id, name, slug, subscription_tier, active
users                →  tenant_id, UNIQUE(tenant_id, username), UNIQUE(tenant_id, email)
projects             →  tenant_id, idx_projects_tenant
tasks                →  tenant_id, idx_tasks_tenant, idx_tasks_project, idx_tasks_assignee
time_entries         →  tenant_id, idx_time_user_date
workspace_files      →  tenant_id, UNIQUE(tenant_id, file_path)
whatsapp_sessions    →  tenant_id, UNIQUE(tenant_id, phone_number)
audit_logs           →  tenant_id, idx_audit_tenant_time
```

A simplified runtime schema also exists in `server/db.ts` with the same `tenant_id` columns.

### 2. Tenant Scoping via JWT

**`server/auth.ts`** — `createToken(userId, tenantId)` embeds `tenantId` in JWT payload. `verifyToken(token)` returns `{ userId, tenantId }`.

**`server/index.ts`** — all endpoints extract `tenantId` from auth and use it in SQL queries:
- `auth.tenantId` passed into every DB query WHERE clause
- WebSocket upgrade passes `tenantId` into `ChatWsData`
- Dev mode fallback: `auth = { userId: "dev-user", tenantId: "dev-tenant", role: "SUPER_ADMIN" }`

### 3. Tenant-Scoped API Endpoints

| Endpoint | Method | Role | Tenant Filter |
|----------|--------|------|---------------|
| `/api/portal/tasks` | GET | WORKER | `WHERE t.tenant_id = ? AND t.assigned_to = ?` |
| `/api/portal/files` | GET | WORKER | `WHERE tenant_id = ?` |
| `/api/portal/time` | GET/POST | WORKER | `WHERE te.tenant_id = ? AND te.user_id = ?` |
| `/api/portal/time/:id/approve` | POST | LEADER | `WHERE id = ? AND tenant_id = ?` |
| `/api/portal/tasks` | POST | LEADER | `INSERT INTO tasks (..., tenant_id, ...)` |
| `/api/portal/download/:fileId` | GET | ANY | `WHERE id = ? AND tenant_id = ?` + path validation |
| `/api/client/projects` | GET | CLIENT | `WHERE tenant_id = ? AND status != 'draft'` |
| `/api/client/drawings` | GET | CLIENT | `WHERE tenant_id = ?` |
| `/api/client/feedback` | POST | CLIENT | `INSERT INTO audit_logs (..., tenant_id, ...)` |
| `/api/admin/tenants` | GET/POST | SUPER_ADMIN | List/create tenants (system-wide) |
| `/api/admin/stats` | GET | SUPER_ADMIN | Cross-tenant counts |
| `/api/admin/users` | GET | SUPER_ADMIN | All users with tenant names |

### 4. Workspace Path Isolation

**`server/workspace-state.ts`** uses `Map<string, WorkspaceFolderEntry[]>` keyed by `tenantId`:

| Function | Behavior |
|----------|----------|
| `getPrimaryWorkspacePath(tenantId)` | Validates tenantId (rejects `..`, `/`); default tenant → base workspace; non-default → `baseWorkspace/<tenantId>/` subdirectory |
| `resolveUnderWorkspace(relRaw, tenantId)` | Resolves relative paths within tenant's workspace |
| `listWorkspaceFolders(tenantId)` | Returns folders for tenant, falls back to initial path |
| `setWorkspaceFoldersAbs(paths, tenantId)` | Sets folders scoped by tenant |
| `openFolder(absDir, tenantId)` | Opens folder for a specific tenant |

Path traversal prevention implemented at lines 69-71 and 88-91.

### 5. Admin UI for Tenant Management

**`src/pages/SuperAdminDashboard.tsx`** — FULL tenant CRUD:
- Lists all tenants with name, slug, tier, user count, status
- Create tenant form (name, slug, subscription tier: free/pro/enterprise)
- Calls `GET/POST /api/admin/tenants`, `GET /api/admin/stats`
- SUPER_ADMIN role required

### 6. RBAC Role System

| Role | Scope | Authenticated In |
|------|-------|-----------------|
| SUPER_ADMIN | System-wide | JWT (password) |
| ADMIN | Per-tenant | JWT (password) |
| LEADER | Project/team | JWT (password) |
| WORKER | Individual | PIN or JWT |
| CLIENT | Stakeholder | JWT (password) |

Role checks are per-endpoint (`!auth || auth.role !== "SUPER_ADMIN"`). No centralized middleware exists yet.

### 7. Feature Flag

`/api/manifest` returns `features: { multi_tenancy: isAdmin }` — only Admin+ users see multi-tenancy UI.

---

## What Is Planned

### 1. Centralized RBAC Middleware

Currently role checks are scattered per-endpoint. Planned: a middleware layer that checks role hierarchy before route handlers, reducing duplication and preventing missed checks.

Reference: `plans/old/productionready/reference/PHASE1_IMPLEMENTATION.md` (lines 119-148)

### 2. PostgreSQL Migration

Current database is SQLite. Production multi-tenancy requires PostgreSQL for:
- Connection pooling across tenants
- Concurrent write scalability
- Per-client databases or schema-per-tenant

Schema is designed for PostgreSQL compatibility (`schema.sql`). No migration script exists yet.

### 3. Multi-Tenant Cloud Deployment

From `docs/PRODUCTION_DELIVERY_PLAN.md` and `WOP-009`:
```
Client A (container)        Client B (container)
  Way of Pi :3333             Way of Pi :3333
  Volume A (data)             Volume B (data)
  Subdomain A                 Subdomain B
```
- Production Docker Compose with PostgreSQL, Caddy/Traefik reverse proxy
- Per-client subdomain provisioning (e.g., `clientx.app.wayofpi.com`)
- Resource limits per container (2 CPU, 2GB RAM)
- Planned onboarding script `scripts/provision-client.sh`:
  - Create PostgreSQL database
  - Run migration
  - Insert tenant record
  - Configure Caddy subdomain
  - Send welcome email

### 4. Multi-Tenant Onboarding Automation

From `thoughts/shared/tickets/WOP-009-production-delivery.md`:
- [ ] Script to provision new client (DB + subdomain + welcome email)
- [ ] Deprovisioning script
- [ ] Documented onboarding flow in `docs/CLOUD_ONBOARDING.md`

### 5. White-Label Custom Domains

From `docs/PRODUCTION_DELIVERY_PLAN.md`:
- [ ] Allow clients to use their own domain (e.g., `wayofpi.acmecorp.com`)
- [ ] Per-tenant branding (logo, colors via `settings_json`)

### 6. Usage-Based Billing Metering

From `docs/PRODUCTION_DELIVERY_PLAN.md`:
- [ ] Track active users, storage, requests per tenant
- [ ] Integrate with Stripe or similar
- [ ] Subscription tiers from `tenants.subscription_tier`

---

## Architecture Diagram (Planned Production)

```
                          Cloudflare (DNS + CDN)
                                │
                          Caddy/Traefik
                        (auto TLS, routing)
                        ┌──────┴──────┐
                        │             │
              clientx.wayofpi.com    clienty.wayofpi.com
                        │             │
                  ┌─────┴─────┐  ┌─────┴─────┐
                  │ Client A  │  │ Client B  │
                  │ (Docker)  │  │ (Docker)  │
                  │ :3333     │  │ :3333     │
                  │ 2 CPU/2GB │  │ 2 CPU/2GB │
                  └─────┬─────┘  └─────┬─────┘
                        │             │
                  ┌─────┴─────┐  ┌─────┴─────┐
                  │Volume A   │  │Volume B   │
                  │(data)     │  │(data)     │
                  └───────────┘  └───────────┘
                        │             │
                  ┌─────┴─────────────┴─────┐
                  │   PostgreSQL            │
                  │   (per-client DB or     │
                  │    schema-per-tenant)   │
                  └─────────────────────────┘
```

---

## Key Files

| File | Role |
|------|------|
| `server/schema.sql` | Authoritative multi-tenant schema |
| `server/db.ts` | Runtime schema + seed |
| `server/auth.ts` | JWT token with tenantId |
| `server/index.ts` | All tenant-scoped API endpoints |
| `server/workspace-state.ts` | File system isolation per tenant |
| `server/agents.ts` | Agent scanning scoped by tenant |
| `server/tree.ts` | File tree scoped by tenant |
| `src/pages/SuperAdminDashboard.tsx` | Tenant management UI |
| `src/pages/LoginPage.tsx` | Login with tenantId |
| `docs/PRODUCTION_DELIVERY_PLAN.md` | Cloud multi-tenant plan |
| `thoughts/shared/tickets/WOP-009-production-delivery.md` | Active multi-tenant ticket |
| `thoughts/shared/tickets/WOP-ALL-TODO.md` (Phase 8) | Task list |
| `plans/old/productionready/reference/PRODUCTION_AUTH_TENANCY_WORKLEADER_ALIGNMENT.md` | Multi-tenancy design doc |
