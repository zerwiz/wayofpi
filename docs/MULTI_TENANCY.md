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

### 6. S3 Object Storage for Tenant Data

File storage currently lives on the local filesystem, which doesn't scale across containers or deployments. Planned migration to S3-compatible object storage:

**Why S3 for multi-tenancy:**
- Each tenant's files isolated via bucket prefix (`/workspaces/<tenant_id>/`)
- Shared files across app instances (no local volume dependency)
- Backup all tenant data to durable off-server storage
- Tenant-level storage quotas and billing

**Planned phases:**
1. **Backups:** `rclone` + cron → S3 bucket for DB snapshots (Backblaze B2)
2. **Uploads:** Replace local file serving with S3 signed URLs
3. **Workspaces:** Migrate tenant workspace storage behind `StorageProvider` abstraction

**Providers considered:** AWS S3, Cloudflare R2 (no egress fees), Backblaze B2 (cheapest), MinIO (self-hosted).

**Planned env vars:** `WOP_STORAGE_BACKEND`, `WOP_S3_BUCKET`, `WOP_S3_ENDPOINT`, `WOP_S3_REGION`, `WOP_S3_ACCESS_KEY_ID`, `WOP_S3_SECRET_ACCESS_KEY`.

**Files (planned):** `server/storage/provider.ts`, `server/storage/s3-provider.ts`, `server/storage/local-provider.ts`, `scripts/backup.sh`, `scripts/restore.sh`.

### 7. Usage-Based Billing Metering

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

---

## Security Plan

### 1. Multi-Tenant Isolation Principles

Every table containing user-generated or tenant-specific data **must** have a `tenant_id` column — this is already enforced in `schema.sql`. Compound unique constraints (`UNIQUE(tenant_id, username)`) prevent cross-tenant collisions.

**Planned:** Drizzle ORM for type-safe query building that verifies `tenant_id` inclusion at compile time.

### 2. RBAC & Authorization

**Current:** Role checks are per-endpoint (`!auth || auth.role !== "SUPER_ADMIN"`). Five roles exist: SUPER_ADMIN > ADMIN > LEADER > WORKER > CLIENT.

**Planned:** Centralized RBAC middleware that enforces role hierarchy before route handlers, rejecting unauthorized requests (403) before reaching business logic. Reference: `plans/old/productionready/reference/PHASE1_IMPLEMENTATION.md:119-148`.

### 3. Path Traversal Prevention

Already implemented in `server/workspace-state.ts`:
- `getPrimaryWorkspacePath(tenantId)` rejects `..` and `/` in tenant IDs (line 70)
- Path resolution checks that resolved path stays within the base directory (lines 87-90)
- Non-default tenants get isolated subdirectories (`baseWorkspace/<tenantId>/`)

### 4. Authentication

| Mechanism | Where | Details |
|-----------|-------|---------|
| JWT (HS256) | `server/auth.ts` | 24-hour expiry, `{ userId, tenantId }` in payload |
| Password hash | `server/db.ts:96` | `Bun.password.hash()` (bcrypt/scrypt) |
| Worker PIN | `server/index.ts:913` | 4-digit PIN for portal login |
| Tunnel gate | `server/tunnel-gate.ts` | scrypt-hashed HTTP Basic Auth for public tunnels |

**Security concerns:**
- Fallback JWT secret `"way-of-pi-secret-key-change-me"` in `auth.ts:3` — **must** be overridden via `WOP_AUTH_SECRET` in production
- Default admin credentials seeded in `db.ts` — requires first-login password change

### 5. Audit Logging

**Current:** `audit_logs` table logs file downloads (`index.ts:1295`) and client feedback (`index.ts:1469`) with `tenant_id`, `user_id`, `action`, `resource_type`, `details_json`.

**Planned:** Expand audit logging to cover all sensitive actions (login, task create/approve/reject, tenant create, settings changes). Configure log redaction for sensitive fields (`pin`, `password`, `token`, `authorization`).

### 6. Damage Control Rules (Agent Safety)

**`apps/wayofpi-ui/src/extentions/damage-control-rules.yaml`** blocks destructive operations:
- 44 bash patterns (rm -rf, chmod 777, git push --force, cloud provider deletes)
- 42 zero-access paths (`.env`, secrets, keys)
- 42 read-only config files
- 31 no-delete protected files
- SQL injection protections (DROP TABLE, DELETE FROM without WHERE)

### 7. Execution Gating

| Env Var | Purpose | Default |
|---------|---------|---------|
| `WOP_ALLOW_TERMINAL` | Gates terminal access | Disabled in production |
| `WOP_ALLOW_RUN` | Gates npm/bun script execution | Disabled |
| `WOP_ALLOW_SERVER_RESTART` | Gates server restart endpoint | — |
| `WOP_ALLOW_MOCK_AUTH` | Mock auth for dev (planned) | Must never be true in production |

### 8. Secrets Management

**Current:**
- `WOP_AUTH_SECRET` env var for JWT signing
- Tunnel gate credentials stored under `WOP_HOME` as `tunnel-gate.v1.json`
- Webhook secrets verified with constant-time comparison (`crypto.timingSafeEqual`)

**Planned:**
- Never commit secrets to git (enforced via `.gitignore` + damage control rules)
- Rotate JWT signing keys monthly
- Environment variable `.env` files excluded from version control
- Use HashiCorp Vault or similar for production secret storage

### 9. Key Security Files

| File | What It Covers |
|------|---------------|
| `.pi/rules/securitypolicy.md` | Pi agent security policy (permissions, secrets, sandbox) |
| `.pi/damage-control-rules.yaml` | Agent execution safety rules |
| `apps/wayofpi-ui/src/extentions/damage-control-rules.yaml` | Comprehensive damage control (279 lines) |
| `server/auth.ts` | JWT creation and verification |
| `server/tunnel-gate.ts` | scrypt-hashed tunnel Basic Auth |
| `server/workspace-state.ts` | Path traversal prevention |
| `server/index.ts` | Tenant-scoped queries, audit logging, role checks |
| `plans/old/productionready/reference/PHASE_1_SECURITY_DATA_GUIDE.md` | Security hardening guide |

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
