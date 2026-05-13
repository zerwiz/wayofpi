# Way of Pi: Production Delivery Plan

## Goal
Deliver Way of Pi to clients via three channels:
1. **Desktop installers** — Windows (.exe/.msi), macOS (.dmg), Linux (.AppImage/.deb)
2. **Cloud SaaS** — multi-tenant Docker deployment (we host for clients)
3. **Local self-host** — run on this machine, expose via tunnel (we host for them)

---

## Table of Contents

- [1. Desktop Application Delivery](#1-desktop-application-delivery)
- [2. Cloud Hosting (SaaS / Multi-Tenant)](#2-cloud-hosting-saas--multi-tenant)
- [3. Local Self-Hosting (On-Premise)](#3-local-self-hosting-on-premise)
- [4. CI/CD Pipeline](#4-cicd-pipeline)
- [5. Domain & SSL Strategy](#5-domain--ssl-strategy)
- [6. Backup & Disaster Recovery](#6-backup--disaster-recovery)
- [7. Monitoring & Observability](#7-monitoring--observability)
- [8. Cost Estimation](#8-cost-estimation)
- [9. Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Desktop Application Delivery

### 1.1 Current State
- Electron app at `apps/wayofwork-ui/`
- `electron-builder` configured in `package.json` for macOS (dmg), Windows (nsis), Linux (AppImage + deb)
- Output directory: `apps/wayofwork-ui/release/`
- Command: `bun run pack`

### 1.2 What Needs to Ship in the Installer
The Electron app bundles:
- `dist/` — built React frontend (Vite output)
- `electron/` — Electron main process
- `server/` — Bun API server (2921 lines, all routes)
- Platform-specific Node/Bun runtime

### 1.3 Build Requirements Per Platform

| Platform | Build OS | Target Format | Signing Required |
|----------|----------|---------------|-----------------|
| **Windows** | Windows (or cross via Docker) | `.exe` (NSIS), `.msi` (optional) | Authenticode cert ($200-400/yr) |
| **macOS** | macOS (Apple Silicon + Intel) | `.dmg`, `.zip` (for notarization) | Apple Developer account ($99/yr) |
| **Linux** | Any Linux | `.AppImage`, `.deb`, `.rpm` | GPG key (optional, for apt repo) |

### 1.4 Build Flow

```bash
# Local dev build (unsigned, self-test)
cd apps/wayofwork-ui
bun run pack

# CI build (signed, published to GitHub Releases)
# GitHub Actions matrix on ubuntu-latest, macos-latest, windows-latest
```

### 1.5 Signing Strategy

**macOS:**
1. Apple Developer Program ($99/yr)
2. `hardenedRuntime` + `gatekeeper-assess` in electron-builder
3. Notarization via `afterSign` hook

**Windows:**
1. Code signing cert from DigiCert / Sectigo (~$200-400/yr)
2. `certificateFile` + `certificatePassword` in electron-builder config
3. EV signing recommended (reduces SmartScreen warnings)

**Linux:**
1. No mandatory signing for AppImage/deb
2. Optional GPG for custom apt repo

### 1.6 Auto-Update

Use `electron-updater` with GitHub Releases as the update server:

```json
"publish": {
  "provider": "github",
  "owner": "your-org",
  "repo": "wayofpi"
}
```

Update flow:
1. User opens app → checks GitHub Releases for newer tag
2. Downloads delta/small update in background
3. Prompts to restart on next launch

### 1.7 Platform-Specific Considerations

**Windows:**
- NSIS installer: custom icon, desktop shortcut, Start menu entry
- Handle `bun` not being on PATH — bundle Bun binary or use Node.js standalone
- Silent install (`/S`) for enterprise deployment

**macOS:**
- Apple Silicon (arm64) + Intel (x64) — universal binary or separate builds
- Notarization required for Gatekeeper
- `hardenedRuntime` entitlements for file system access

**Linux:**
- AppImage: single-file, no dependencies beyond FUSE
- deb: .deb package for Debian/Ubuntu, apt repo for updates
- Flatpak (future): sandboxed, Flathub distribution

---

## 2. Cloud Hosting (SaaS / Multi-Tenant)

### 2.1 Architecture

```
                         ┌──────────────┐
                         │  Cloudflare   │
                         │  (DNS + CDN)  │
                         └──────┬───────┘
                                │
                         ┌──────┴───────┐
                         │   nginx/caddy │
                         │   (reverse    │
                         │    proxy)     │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────┴───────┐       ┌───────┴───────┐
            │  Client A     │       │  Client B     │
            │  (container)  │       │  (container)  │
            │  :8001→:5173  │       │  :8002→:5173  │
            │  :9001→:3333  │       │  :9002→:3333  │
            └───────────────┘       └───────────────┘
                    │                       │
            ┌───────┴───────┐       ┌───────┴───────┐
            │  Volume A     │       │  Volume B     │
            │  (client data)│       │  (client data)│
            └───────────────┘       └───────────────┘
```

### 2.2 Docker Compose (Current)

The existing `docker-compose.yml` pattern in `docs/LOCAL_HOSTING.md` maps a host port per client. This works for demos but needs hardening for production:

- PostgreSQL instead of SQLite (or SQLite with per-client volume)
- Readiness probes
- Resource limits (CPU/memory per container)
- Logging driver

### 2.3 Production Docker Compose

```yaml
version: '3.8'
services:
  wayofpi:
    image: wayofpi/server:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - WOP_SERVER_PORT=3333
      - WOP_WORKSPACE=/app
      - DATABASE_URL=postgresql://wop:wop@postgres:5432/wayofpi
    volumes:
      - ./data:/app/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.wayofpi.rule=Host(`clientx.wayofpi.com`)"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 2.4 Cloud Provider Options

| Provider | Compute | Database | Storage | Est. Monthly (per client) |
|----------|---------|----------|---------|--------------------------|
| **Railway** | Container ($5-20) | PostgreSQL ($5) | Volume ($2) | $12-27 |
| **Fly.io** | VM ($2-20) | PostgreSQL ($5) | Volume ($2) | $9-27 |
| **Hetzner** | VPS ($4-30) | Self-managed | Volume ($2) | $6-32 |
| **DigitalOcean** | App Platform ($12) | Managed DB ($15) | Volume ($5) | $32+ |
| **AWS** | ECS Fargate ($10+) | RDS ($15+) | EFS ($5+) | $30+ |

**Recommendation:** Start with **Railway** or **Fly.io** for simplicity (Docker-native, built-in PostgreSQL, free tier). Migrate to **Hetzner** for cost efficiency at scale.

### 2.5 Database Strategy

- **Dev/Prototype:** SQLite (per-client `.db` file in volume) — already works
- **Production:** PostgreSQL (per-client database or schema per tenant)
- **Migration path:** SQLite → PostgreSQL via dedicated dump/restore

### 2.6 Onboarding Flow

1. Client signs up on portal (or we provision manually)
2. CI creates a new Docker Compose service entry
3. CI runs database migration for new tenant
4. CI points a subdomain to the new container
5. Client receives Welcome email with URL + credentials

---

## 3. Local Self-Hosting (On-Premise)

### 3.1 Flow

```
[Client Device] ──internet──> [ngrok / Cloudflare Tunnel] ──> [Your Machine]
                                                                   │
                                                            [Way of Pi]
                                                            Port 3333/5173
```

### 3.2 Current Capability

The system already supports this via:
- `start-wayofpi.sh --web` — launches UI + API bound to `0.0.0.0`
- Built-in **ngrok** integration (Settings → ngrok tab)
- `just wayofpi-full` — same as above via justfile

### 3.3 Tunnel Options

| Service | Free Tier | Custom Domain | Auth | Speed |
|---------|-----------|---------------|------|-------|
| **ngrok** | 1 tunnel, 40 conn/min | No (free) | Basic Auth | Moderate |
| **Cloudflare Tunnel** | Unlimited | Yes | Zero Trust | Fast |
| **bore** | Unlimited | No | None | Moderate |
| **FRP** | Unlimited | Yes | Token | Fast |

**Recommendation:** Stick with built-in **ngrok** for ad-hoc demos. Use **Cloudflare Tunnel** (`cloudflared`) for production self-hosting — faster, custom domain, built-in auth.

### 3.4 Cloudflare Tunnel Setup

```bash
# Install cloudflared
sudo apt install cloudflared  # Linux
brew install cloudflared       # macOS

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create wayofpi

# Route domain
cloudflared tunnel route dns wayofpi clientx.yourdomain.com

# Run tunnel pointing to local Way of Pi
cloudflared tunnel run wayofpi --url http://localhost:3333
```

### 3.5 Self-Hosted Hardware Requirements

- **Minimum:** 4 CPU cores, 8GB RAM, 50GB SSD
- **Recommended:** 8 CPU cores, 16GB RAM, 100GB SSD
- **Per active client:** +1 CPU core, +1GB RAM
- **Network:** 50+ Mbps upload (for remote responsiveness)
- **OS:** Ubuntu 22.04+ or Debian 12+

### 3.6 systemd Service (Auto-Start)

```ini
[Unit]
Description=Way of Pi Server
After=network.target

[Service]
Type=simple
User=wayofpi
WorkingDirectory=/home/wayofpi/Way of pi
ExecStart=/home/wayofpi/.bun/bin/bun run apps/wayofwork-ui/server/index.ts
Environment=NODE_ENV=production
Environment=WOP_SERVER_PORT=3333
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions Workflow

```
Triggers:
  - push to main (build + deploy)
  - tag v* (build + sign + publish release)
  - manual dispatch (any branch)

Jobs:
  1. lint + typecheck
  2. build (tsc -b && vite build)
  3. test (bun test)
  4. docker build + push to registry
  5. electron build (matrix: ubuntu, macos, windows)
  6. sign (macOS + Windows)
  7. deploy (Docker to Railway/Fly/Hetzner)
  8. create GitHub Release
```

### 4.2 Build Matrix

```yaml
strategy:
  matrix:
    os: [ubuntu-24.04, macos-14, windows-2022]
    include:
      - os: ubuntu-24.04
        target: linux
        format: AppImage
      - os: macos-14
        target: mac
        format: dmg
      - os: windows-2022
        target: win
        format: nsis
```

### 4.3 Docker Image Build

```dockerfile
# Two-stage build
FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/wayofwork-ui/package.json ./apps/wayofwork-ui/
RUN bun install --frozen-lockfile
COPY . .
WORKDIR /app/apps/wayofwork-ui
RUN bun run build

FROM oven/bun:latest
WORKDIR /app
COPY --from=builder /app/apps/wayofwork-ui/dist ./apps/wayofwork-ui/dist
COPY --from=builder /app/apps/wayofwork-ui/server ./apps/wayofwork-ui/server
COPY --from=builder /app/apps/wayofwork-ui/package.json ./apps/wayofwork-ui/package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3333
ENV NODE_ENV=production
ENV WOP_SERVER_PORT=3333
CMD ["bun", "run", "apps/wayofwork-ui/server/index.ts"]
```

### 4.4 Release Process

```bash
# Cut a release
git tag v0.22.0
git push origin v0.22.0

# CI automatically:
# 1. Builds Docker image → ghcr.io/wayofpi/server:v0.22.0
# 2. Builds Electron installers for all 3 platforms
# 3. Creates GitHub Release with changelog
# 4. Signs + notarizes macOS build
# 5. Signs Windows build
# 6. Uploads amd64 + arm64 Docker tags
```

---

## 5. Domain & SSL Strategy

### 5.1 Domain Structure

```
Production:
  wayofpi.com              → Marketing / landing page
  app.wayofpi.com          → Our hosted SaaS (multi-tenant)
  *.app.wayofpi.com        → Per-client subdomains

Client Self-Hosted:
  clientx.wayofpi.com      → Subdomain for self-hosted instance (DNS CNAME)

Desktop:
  download.wayofpi.com     → Redirect to latest GitHub Release
```

### 5.2 SSL

- **Cloud/self-hosted:** Let's Encrypt via Caddy (auto) or Certbot (nginx)
- **Desktop:** Not applicable (Electron loads localhost)

---

## 6. Backup & Disaster Recovery

### 6.1 What to Back Up

| Asset | Frequency | Retention | Size Estimate |
|-------|-----------|-----------|---------------|
| SQLite/PostgreSQL DB | Daily | 30 days | 10-100 MB per client |
| Volume data (`/data`) | Daily | 30 days | 100 MB - 1 GB per client |
| Docker Compose config | Per change | Git history | Tiny |
| Environment variables | Per change | 1Password/Vault | Tiny |

### 6.2 Backup Strategy

- **SQLite:** `cp` + `sqlite3 .backup` to a daily cron + rsync to S3/Backblaze
- **PostgreSQL:** `pg_dump` to S3/Backblaze
- **Files:** `rclone` to Backblaze B2 (~$0.006/GB/mo)

### 6.3 Recovery Plan

1. Spin up new VPS
2. Clone git repo, checkout stable tag
3. Restore data volume from latest backup
4. Restore database dump
5. Re-run with Docker Compose
6. Health-check endpoint

---

## 7. Monitoring & Observability

### 7.1 Health Check

The Bun API already has `/api/health` returning capability flags:
```json
{
  "status": "ok",
  "capabilities": {
    "workspaceProblems": true,
    "configRuntimePost": true,
    "clawHostTreeGet": true,
    "clawTelegramStatusGet": true
  }
}
```

### 7.2 Uptime Monitoring

- **Better Uptime** (free tier: 3 monitors, 5-min checks)
- **UptimeRobot** (free: 50 monitors, 5-min checks)
- **Checkly** (free tier: browser + API checks)

### 7.3 Logging

- Docker logs → journald or Loki
- Bun API logs → structured JSON (add pino/bunyan)
- Nginx/Caddy access logs → stdout

### 7.4 Metrics (Future)

- Prometheus metrics at `/api/metrics`
- Grafana dashboard for CPU/memory/request rate/error rate

---

## 8. Cost Estimation

### 8.1 Desktop Release (One-Time + Annual)

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | $99/yr | Required for macOS notarization |
| Code Signing Certificate | $200-400/yr | Windows Authenticode |
| GitHub Actions minutes | Free (2000/mo for public repo) | Or $0.008/min for private |
| **Total** | **$300-500/yr** | |

### 8.2 Cloud Hosting Per Client (Monthly)

| Tier | Compute | DB | Storage | Total |
|------|---------|----|---------|-------|
| Small (demo) | $5 | $5 | $2 | **$12/mo** |
| Medium (5 users) | $12 | $12 | $5 | **$29/mo** |
| Large (20+ users) | $25 | $25 | $10 | **$60/mo** |

### 8.3 Self-Hosted (Your Machine, Monthly)

| Item | Cost | Notes |
|------|------|-------|
| Electricity (server) | $10-20 | 100W × 24h × $0.12/kWh |
| Internet (static IP optional) | $0-10 | Include in existing plan |
| Cloudflare Tunnel | Free | Free tier unlimited tunnels |
| Domain | $1-2 | wayofpi.com via Cloudflare registrar |
| **Total** | **$11-32/mo** | |

### 8.4 Pricing Model Suggestion

| Plan | Price | What They Get |
|------|-------|---------------|
| **Self-Hosted** | Free (open source) | Desktop app, you manage infra |
| **Hosted Starter** | $29/mo | 1 workspace, 5 users, 1GB storage |
| **Hosted Business** | $99/mo | 3 workspaces, 20 users, 10GB storage |
| **Enterprise** | Custom | Dedicated VPS, SLA, custom domain |

---

## 9. Implementation Roadmap

### Phase 1: Desktop Release (Week 1-2)
- [ ] Fix TypeScript build errors (666 → 0)
- [ ] Configure code signing certs for macOS + Windows
- [ ] Set up GitHub Actions build matrix
- [ ] Produce first signed `.dmg`, `.exe`, `.AppImage`
- [ ] Set up auto-update via electron-updater

### Phase 2: Cloud Hosting (Week 3-4)
- [ ] Polish Docker file (health checks, non-root user)
- [ ] Set up production Docker Compose (PostgreSQL, Traefik/Caddy)
- [ ] Deploy to Railway / Fly.io
- [ ] Implement multi-tenant onboarding (subdomain per client)
- [ ] Set up nightly backups

### Phase 3: Self-Hosted Portal (Week 5-6)
- [ ] Write client documentation for self-hosting (Docker Compose)
- [ ] Create `start-wayofpi-systemd.sh` wizard
- [ ] Set up Cloudflare Tunnel instructions
- [ ] Add product license key check (optional, for monetization)

### Phase 4: Polish & Scale (Ongoing)
- [ ] Prometheus metrics
- [ ] Admin dashboard (active clients, resource usage, billing)
- [ ] Usage-based billing metering
- [ ] White-label option (custom domain per client)
- [ ] Mobile apps (via Capacitor/Cordova — wraps the same React SPA)
