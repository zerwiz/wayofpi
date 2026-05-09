# Way of Pi — Hosting Plans

All current options for deploying and accessing Way of Pi.

---

## Plan A: Desktop App (Electron)

**What it is:** A native desktop application for Windows, macOS, and Linux. The app bundles the Bun API server + built React frontend in an Electron shell.

**How it works:**
- `apps/wayofwork-ui/electron/electron-main.mjs` loads the UI from the Vite dev server (dev) or from `dist/` (production)
- Bun API server auto-starts when health check fails
- Preload script bridges IPC

**Commands:**
```bash
cd apps/wayofwork-ui
bun run electron:dev        # Dev mode (Vite hot reload + Electron)
bun run pack                # Build unsigned installer
bun run electron:prod       # Production (build + serve static)
```

**Targets (electron-builder):**
| Platform | Format | Signing |
|----------|--------|---------|
| macOS    | .dmg   | Apple Developer ($99/yr) |
| Windows  | .exe (NSIS) | Authenticode ($200-400/yr) |
| Linux    | .AppImage, .deb | Optional GPG |

**Auto-update:** `electron-updater` with GitHub Releases.

**Files:** `apps/wayofwork-ui/package.json` (electron-builder config), `electron/electron-main.mjs`, `electron/preload.cjs`

---

## Plan B: Local Dev Server (Browser)

**What it is:** Run the Vite dev server + Bun API on your machine, access via `http://localhost:5173`.

**Commands:**
```bash
./start-wayofpi.sh           # Starts both Vite (:5173) + Bun API (:3333)
./start-wayofpi.sh --web     # Forces browser mode (no Electron)
just wayofpi-full             # Via justfile (same as above)
bun run dev                   # From apps/wayofwork-ui/
```

**Architecture:**
```
Browser → Vite :5173 → proxy → Bun API :3333
  (serves UI modules)          (API + WebSocket)
```

**Files:** `start-wayofpi.sh`, `apps/wayofwork-ui/vite.config.ts`

---

## Plan C: Local + ngrok Tunnel (Public URL)

**What it is:** Expose the local dev server to the internet via ngrok for client demos or remote access.

**Setup:**
```bash
# Start the app
./start-wayofpi.sh --web

# In another terminal, add authtoken and tunnel
ngrok config add-authtoken <your-token>
ngrok http 5173

# → https://<random>.ngrok-free.dev
```

**Built-in ngrok integration (Settings → ngrok):**
- Install ngrok via apt/Homebrew or bundled npm package
- Save authtoken
- Start/stop managed tunnel from UI
- Optional HTTP Basic Auth for tunnel visitors
- Configurable via env vars: `WOP_ALLOW_NGROK_SPAWN`, `WOP_NGROK_BINARY`, `WOP_NGROK_WEB_ADDR`

**Server endpoints:** `/api/dev/ngrok-tunnel`, `/api/dev/tunnel-gate`, `/api/dev/share-url-hints`

**Files:** `docs/old/wayofpi/WOP_NGROK.md`, `server/ngrok-tunnel-manager.ts`, `server/ngrok-binary.ts`, `server/ngrok-inspector.ts`, `server/tunnel-gate.ts`, `scripts/install-ngrok-optional.sh`

**Limitations (ngrok free tier):** 1 tunnel, ~40 conn/min, throttled bandwidth. Use Cloudflare Tunnel for production.

---

## Plan D: Docker (Containerized)

**What it is:** Single Way of Pi instance in a Docker container. Can be extended to multi-tenant with docker-compose.

**Dockerfile** (`apps/wayofwork-ui/Dockerfile`):
- Multi-stage: `oven/bun:latest` → build UI → copy dist/ + server/ to production image
- Exposes port 3333
- `NODE_ENV=production`

```bash
cd apps/wayofwork-ui
docker compose up -d        # Starts Way of Pi + Ollama
docker build -t wayofpi .   # Or build manually
```

**docker-compose.yml** (`apps/wayofwork-ui/docker-compose.yml`):
```yaml
services:
  wayofpi:
    build: ../../
    ports: ["3333:3333"]
    depends_on: [ollama]
  ollama:
    image: ollama/ollama:latest
    volumes: [ollama_data:/root/.ollama]
```

**Multi-tenant pattern** (per `docs/LOCAL_HOSTING.md`):
```yaml
services:
  client-a:
    build: .
    ports: ["8001:5173", "9001:3333"]
    volumes: [./client-a-data:/app/data]
  client-b:
    build: .
    ports: ["8002:5173", "9002:3333"]
    volumes: [./client-b-data:/app/data]
```

---

## Plan E: Cloud Hosting (SaaS)

**What it is:** Deploy to cloud providers for always-on multi-tenant access.

**Recommended providers:**
| Provider | Compute/month | Database | Est. cost/client |
|----------|--------------|----------|-----------------|
| Railway  | $5-20        | PostgreSQL $5 | $12-27/mo |
| Fly.io   | $2-20        | PostgreSQL $5 | $9-27/mo |
| Hetzner  | $4-30 (VPS)  | Self-managed | $6-32/mo |

**Deployment flow:**
1. Build Docker image → push to registry
2. Deploy to Railway/Fly.io (Docker-native, built-in PostgreSQL)
3. Configure subdomain per client
4. Set up nightly backups

**Production Docker Compose** (planned):
- PostgreSQL (per-client or schema-per-tenant)
- Caddy/Traefik reverse proxy with auto Let's Encrypt TLS
- Resource limits (2 CPU, 2GB RAM per container)
- Health checks

**Files:** `docs/PRODUCTION_DELIVERY_PLAN.md`, `thoughts/shared/tickets/WOP-009-production-delivery.md`

---

## Plan F: VM / Hypervisor

**What it is:** Full OS-level isolation via virtual machines for strict security requirements.

**Tools:** Proxmox VE (recommended), Hyper-V, VirtualBox

**Workflow:**
1. Create "Golden Image" (Ubuntu + Bun + Way of Pi pre-installed)
2. Clone VM per client
3. Assign static LAN IP
4. Auto-start via systemd
5. Reverse proxy (nginx/Cloudflare Tunnel) maps `clientx.yourdomain.com` → VM IP

**systemd service:**
```ini
[Service]
User=wayofpi
WorkingDirectory=/home/wayofpi/Way of pi
ExecStart=/home/wayofpi/.bun/bin/bun run apps/wayofwork-ui/server/index.ts
Restart=on-failure
```

**Files:** `docs/LOCAL_HOSTING.md`, `linux/wayofpi.service` (planned)

---

## Plan G: Cloudflare Tunnel (Production Self-Hosted)

**What it is:** Expose a self-hosted instance via Cloudflare's `cloudflared` tunnel — faster, custom domain, built-in Zero Trust auth, no bandwidth limits.

**Why Cloudflare over ngrok:**
| Feature | ngrok (free) | Cloudflare Tunnel |
|---------|-------------|-------------------|
| Bandwidth | Throttled (~1-2 Mbps) | Unlimited |
| Connections | ~40/min | Unlimited |
| Custom domain | No (free tier) | Yes |
| Auth | Basic Auth | Zero Trust / Access policies |
| Speed | Moderate (via ngrok relay) | Fast (direct Cloudflare edge) |

**Setup:**
```bash
# Install cloudflared
sudo apt install cloudflared   # Linux
brew install cloudflared        # macOS

# Authenticate with Cloudflare
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create wayofpi

# Route your domain to the tunnel
cloudflared tunnel route dns wayofpi clientx.yourdomain.com

# Run tunnel pointing at local Way of Pi
cloudflared tunnel run wayofpi --url http://localhost:3333
```

**Planned automation** (`scripts/tunnel-cloudflare.sh`):
- [ ] Check/install `cloudflared`
- [ ] `cloudflared tunnel login`
- [ ] Create named tunnel if missing
- [ ] Route DNS to tunnel
- [ ] Start tunnel with `--url http://localhost:3333`
- [ ] Register as systemd service for auto-start on boot

**Domain strategy:**
```
wayofpi.com              → Marketing / landing page (Cloudflare DNS)
app.wayofpi.com          → Our hosted SaaS (Cloudflare proxy)
clientx.wayofpi.com      → Self-hosted client instance (Cloudflare Tunnel)
```

**Prerequisites:**
- Cloudflare account (free tier for DNS + tunnel)
- Domain registered via Cloudflare (~$10/yr) or any registrar with NS pointing to Cloudflare
- Ubuntu 22.04+/Debian 12+, 4 CPU, 8GB RAM, 50GB SSD
- Bun, Git, cloudflared
- 50+ Mbps upload

## Plan H: Self-Hosted (On-Premise, General)

**What it is:** Client runs Way of Pi on their own machine, exposed via any tunnel method.

**Steps:**
1. Clone repo + `bun install`
2. Set up `.env`
3. Start service (`just self-host`)
4. Expose via tunnel (Cloudflare, ngrok, or bore)

**Files:** `docs/PRODUCTION_DELIVERY_PLAN.md`, `scripts/install-ngrok-optional.sh`

---

## Comparison Matrix

| Plan | Setup Time | Access | Security | Cost | Best For |
|------|-----------|--------|----------|------|----------|
| **A. Desktop** | 5 min | Local only | Full | Free (open source) | Individual users |
| **B. Local Dev** | 2 min | LAN | None | Free | Development |
| **C. ngrok Tunnel** | 5 min | Public URL | Basic Auth opt | Free tier | Demos, testing |
| **D. Docker** | 15 min | LAN/Port-mapped | Container isolation | Free | Multi-instance, CI |
| **E. Cloud SaaS** | 30 min | Public URL (custom domain) | TLS, VPN | $9-60/mo/per client | Production multi-tenant |
| **F. VM** | 60 min | LAN/Reverse proxy | OS-level isolation | Hosting cost | High-security clients |
| **G. Cloudflare Tunnel** | 20 min | Public URL (custom domain) | Zero Trust, TLS | Free tier | Production self-hosted |
| **H. Self-Hosted** | 30 min | Public URL (tunnel) | Tunnel auth | $11-32/mo | Client-managed infra |

---

---

---

## S3 Object Storage Plan

### Why S3

Currently all file storage is **local filesystem + SQLite BLOBs**. As the system scales to multiple tenants, object storage is needed for:
- **Client uploads:** CAD files (.dwg, .rvt), PDFs, images, documents
- **Workspace files:** Tenant workspace data that should persist across container restarts
- **Database backups:** Automated daily snapshots stored off-server
- **Multi-instance sharing:** Same file accessible from multiple app instances

### Storage Architecture (Planned)

```
App Instance                    Object Store
┌──────────────┐               ┌──────────────┐
│ Way of Pi    │  GET/PUT      │  S3 Bucket   │
│ Server       │──────────────>│              │
│              │               │  /uploads/   │
│ Local cache  │  <────────────│  /workspaces/ │
│ (hot files)  │   signed URL  │  /backups/   │
└──────────────┘               │  /static/    │
                               └──────────────┘
```

### Implementation Plan

**Phase 1 — Backups (immediate):**
- [ ] Install `rclone`, configure S3-compatible endpoint
- [ ] Write `scripts/backup.sh`: `pg_dump` + `rclone copy` to bucket
- [ ] Daily cron: `0 3 * * * /path/to/scripts/backup.sh`
- [ ] Write `scripts/restore.sh`: restore from S3 bucket

**Phase 2 — File Uploads (medium-term):**
- [ ] Add S3 client SDK to server (`@aws-sdk/client-s3` or Bun-native HTTP)
- [ ] Config: `WOP_STORAGE_BACKEND=local|s3`, `WOP_S3_BUCKET`, `WOP_S3_REGION`, `WOP_S3_ENDPOINT`
- [ ] Upload endpoint: `POST /api/files/upload` → PUT to S3, store metadata in SQLite
- [ ] Serve via signed URLs: `GET /api/files/:id/download` → generate presigned GET URL
- [ ] Cache hot files locally via `WOP_STORAGE_CACHE_DIR`

**Phase 3 — Workspace Migration (long-term):**
- [ ] Migrate tenant workspaces from filesystem to S3 prefix (`/workspaces/<tenant_id>/`)
- [ ] Abstract filesystem access behind a `StorageProvider` interface
- [ ] Lazy migration: fetch on first access, cache locally

### S3-Compatible Providers

| Provider | Free Tier | Cost | S3 Compatible | Notes |
|----------|-----------|------|---------------|-------|
| **AWS S3** | 5GB, 20k GET/mo | $0.023/GB/mo | Native | Global, expensive egress |
| **Cloudflare R2** | 10GB, 1M GET/mo | $0.015/GB/mo, no egress fees | Yes | No egress charges, fast edge |
| **Backblaze B2** | 10GB free | $0.006/GB/mo + $0.01/GB egress | Yes | Cheapest, good for backups |
| **DigitalOcean Spaces** | 250GB, 1TB egress | $5/mo flat | Yes | Simple pricing |
| **MinIO** (self-hosted) | Unlimited | Your infra cost | Full API | Self-managed, no egress |

**Recommendation:** Start with **Backblaze B2** for backups (cheapest), use **Cloudflare R2** for file upload serving (no egress fees, fast via Cloudflare edge).

### Env Vars (Planned)

```
WOP_STORAGE_BACKEND=s3           # "local" or "s3"
WOP_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com  # or R2/B2 endpoint
WOP_S3_REGION=us-east-1
WOP_S3_BUCKET=wayofpi-production
WOP_S3_ACCESS_KEY_ID=...
WOP_S3_SECRET_ACCESS_KEY=...
WOP_STORAGE_CACHE_DIR=/tmp/wop-cache  # local cache for hot files
```

### Files (Planned)

| File | Purpose |
|------|---------|
| `scripts/backup.sh` | Daily DB backup to S3 bucket |
| `scripts/restore.sh` | Restore from S3 backup |
| `server/storage/s3-provider.ts` | S3 upload/download/signed-url |
| `server/storage/local-provider.ts` | Local filesystem fallback |
| `server/storage/provider.ts` | Abstract StorageProvider interface |

### Related TODO Items

From `thoughts/shared/tickets/WOP-ALL-TODO.md:470-478`:
- [ ] Install `rclone`, configure Backblaze B2
- [ ] Write `scripts/backup.sh`: `pg_dump` + `rclone copy` to B2 bucket
- [ ] Delete backups older than 30 days
- [ ] Add daily cron
- [ ] Write `scripts/restore.sh`

---

## Security Plan (Cross-Cutting)

### 1. Authentication & Identity

| Plan | Auth Method | Notes |
|------|-------------|-------|
| A. Desktop | None (local app) | Bun API auto-starts on localhost only |
| B. Local Dev | None (LAN) | Vite `host: 0.0.0.0` — accessible to LAN |
| C. ngrok Tunnel | Optional HTTP Basic Auth | scrypt-hashed passwords via tunnel-gate |
| D. Docker | Per-container | Depends on deployment network setup |
| E. Cloud SaaS | JWT + password | `WOP_AUTH_SECRET` required in production |
| F. VM | Network-level | VLAN/firewall per VM |
| G. Cloudflare Tunnel | Zero Trust / Access policies | Cloudflare auth before reaching app |
| H. Self-Hosted | Depends on tunnel | Tunnel auth + app JWT |

**JWT credentials:** `server/auth.ts` uses HS256 with 24h expiry. Default fallback secret `"way-of-pi-secret-key-change-me"` — **must** override with `WOP_AUTH_SECRET` env var in production.

### 2. Network Security

**Vite dev server:**
- `host: 0.0.0.0` — binds to all interfaces (LAN accessible)
- `cors: true` — permissive CORS (dev only; Bun API handles CORS headers in production)

**Bun API server:**
- No built-in TLS (intended to sit behind Vite proxy in dev, or Caddy/nginx in production)
- Rate limiting: **not implemented** (planned for cloud deployment)
- DDoS protection: Cloudflare proxy (orange cloud) recommended for public endpoints

**Production recommendations:**
- Deploy behind Caddy or nginx reverse proxy with auto TLS
- Cloudflare proxy in front of cloud deployments for DDoS + CDN
- Never expose Bun API directly to the internet without tunnel gate auth

### 3. Execution Safety Gates

| Env Var | What It Controls | Default | Security Impact |
|---------|-----------------|---------|-----------------|
| `WOP_ALLOW_TERMINAL` | Terminal access in UI | Disabled in prod | Prevents arbitrary shell access |
| `WOP_ALLOW_RUN` | npm/bun script execution | Disabled | Prevents running arbitrary scripts |
| `WOP_ALLOW_SERVER_RESTART` | HTTP server restart | — | Prevents denial-of-service |
| `WOP_ALLOW_MOCK_AUTH` | Bypass auth (planned) | Must be false in prod | Prevents auth bypass |
| `WOP_ALLOW_NGROK_SPAWN` | ngrok managed start/stop | Allowed | Prevents unauthorized tunnel creation |

### 4. Tunnel Security

**ngrok tunnels (Plan C):**
- Free tier: no custom domain, 40 conn/min limit provides basic DoS protection
- Optional HTTP Basic Auth via tunnel-gate (scrypt-hashed, constant-time comparison)
- Tunnel gate credentials stored under `WOP_HOME` as `tunnel-gate.v1.json`
- Detection via `Host` / `X-Forwarded-Host` containing `ngrok` or custom markers

**Cloudflare Tunnel (Plan G):**
- Zero Trust / Access policies: authenticate before traffic reaches your server
- Custom domain with TLS termination at Cloudflare edge
- No bandwidth throttling
- Recommended for production self-hosting

### 5. Docker Security

**Current state:**
- Dockerfile runs as root (needs hardening)
- No HEALTHCHECK configured
- No resource limits

**Planned hardening (`docs/PRODUCTION_DELIVERY_PLAN.md`):**
- [ ] Add non-root user (`USER wayofpi`)
- [ ] Add `HEALTHCHECK --interval=30s`
- [ ] Resource limits (`--cpus=2 --memory=2g`)
- [ ] Read-only root filesystem where possible
- [ ] No privileged containers
- [ ] `--cap-drop ALL` for agent containers

### 6. Damage Control & Agent Safety

Comprehensive damage control rules at `apps/wayofwork-ui/src/extentions/damage-control-rules.yaml` (279 lines):
- 44 bash patterns blocking: `rm -rf`, `chmod 777`, `git push --force`, cloud provider destructive commands
- 42 zero-access paths: `.env`, secrets, SSH keys, kubeconfig
- 42 read-only config files: package.json, tsconfig.json
- 31 no-delete protected files: `.git/`, LICENSE, env files
- SQL injection protection: DROP TABLE, DELETE FROM without WHERE

### 7. Secrets & Environment Variables

**Keep out of version control:**
- `.env` files (in `.gitignore`)
- ngrok authtokens (`~/.config/ngrok/ngrok.yml`)
- Cloudflare API tokens
- `WOP_AUTH_SECRET` (fallback in code but must be overridden)

**Stored on disk:**
- Tunnel gate credentials: `.wayofpi/tunnel-gate.v1.json` under WOP_HOME
- Pi agent config: `.pi/` directory

**Planned:**
- Centralized secret management (HashiCorp Vault for cloud deploys)
- Log redaction for sensitive fields (`pin`, `password`, `token`, `authorization`)
- Per-deployment `.env` template with all secrets documented in `.env.sample`

### 8. Audit Logging

**Current:** `audit_logs` DB table logs file downloads and client feedback with `tenant_id`, `user_id`, `action`, `resource_type`.

**Planned:** Expand to cover login attempts, tenant creation, settings changes, and all sensitive API operations across all hosting plans.

### 9. Security Reference Files

| File | Content |
|------|---------|
| `plans/old/productionready/reference/PHASE_1_SECURITY_DATA_GUIDE.md` | Database multi-tenancy, RBAC, path hardening, secrets guide |
| `apps/wayofwork-ui/src/extentions/damage-control-rules.yaml` | Agent execution safety (279 lines) |
| `.pi/rules/securitypolicy.md` | Pi agent permission scoping, secret handling, sandbox |
| `.pi/damage-control-rules.yaml` | Agent damage control (92 lines) |
| `server/auth.ts` | JWT creation and verification |
| `server/tunnel-gate.ts` | scrypt-hashed tunnel Basic Auth |
| `server/workspace-state.ts` | Path traversal prevention |
| `docs/old/specs/damage-control.md` | Damage control extension specification |
| `rules/pi agent rules/securitypolicy.md` | Extended security policy (571 lines) |
| `pip/.pi/agents/wayofpiagents/wayofpi-security-developer.md` | Security developer agent template |

---

## Related Files

| File | Content |
|------|---------|
| `docs/PRODUCTION_DELIVERY_PLAN.md` | Full delivery plan (desktop, cloud, self-host, CI/CD) |
| `docs/LOCAL_HOSTING.md` | Local deployment guide (Docker, ngrok, VMs) |
| `docs/old/wayofpi/WOP_NGROK.md` | ngrok integration details |
| `thoughts/shared/hosting/hosting-architecture.md` | **WOP-012 hosting architecture** — SaaS/on-prem/hybrid with Strix Halo premium tier, cost breakdowns, AI inference hosting |
| `thoughts/shared/tickets/WOP-009-production-delivery.md` | Active delivery ticket |
| `thoughts/shared/tickets/WOP-ALL-TODO.md` (Phase 8) | Granular hosting task list |
| `apps/wayofwork-ui/Dockerfile` | Production Docker build |
| `apps/wayofwork-ui/docker-compose.yml` | Docker Compose (Way of Pi + Ollama) |
| `apps/wayofwork-ui/package.json` | Electron-builder config |
| `scripts/install-ngrok-optional.sh` | ngrok system installer |
| `scripts/host-for-demo.sh` | Quick demo hosting script |
| `plans/old/productionready/hosting/URGENT_DEPLOY_CLIENT_DEMO.md` | Urgent demo deployment |
| `plans/old/productionready/reference/PI_INTEGRATION_DOCKER_PLAN.md` | Pi in Docker plan |
