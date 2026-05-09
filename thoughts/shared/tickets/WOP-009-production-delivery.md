# [WOP-009] Production Delivery — Desktop, Cloud & Self-Hosted Deployment

> 📋 **Task checkboxes migrated to `WOP-ALL-TODO.md`: Phase 8 (Production Delivery — Desktop, Cloud, Self-Host, Domain).** Update checkboxes there, not here.

## Executive Summary

Deliver Way of Pi to clients through 3 channels: signed desktop installers (Windows/macOS/Linux), multi-tenant cloud SaaS (Docker/PostgreSQL), and self-hosted via tunnel (ngrok/Cloudflare). Currently electron-builder config exists but is unsigned, Dockerfile exists but is not production-hardened, and self-hosting works ad-hoc via ngrok with no automation.

| Channel | Current State | Target State |
|---------|--------------|--------------|
| Desktop | `electron-builder` configured, no signing, no CI | Signed `.dmg`, `.exe`, `.AppImage` built & published by CI |
| Cloud | Basic Dockerfile, no PostgreSQL, no multi-tenant | Production Docker Compose with PostgreSQL, Traefik/Caddy, per-client subdomains |
| Self-Host | `start-wayofpi.sh --web` + manual ngrok | systemd service + Cloudflare Tunnel one-liner + docs |

---

## Section 1: Desktop Release (Weeks 1-2)

### Problem
`bun run pack` produces unsigned installers. No CI matrix. No auto-update. macOS notarization and Windows code signing never configured.

### Success Criteria
- [ ] `bun run pack` produces a working unsigned installer on all 3 platforms (dev machine)
- [ ] GitHub Actions matrix builds Linux (AppImage + deb), macOS (dmg, notarized), Windows (exe, signed)
- [ ] Auto-update wired via `electron-updater` + GitHub Releases
- [ ] `wayofpi.com/download` redirects to latest GitHub Release

### Tasks
1. **Fix build first**: `bun run build` must pass (blocked on WOP-002 for full TS fix; use `--noEmit` workaround if needed for CI)
2. **Configure code signing**:
   - macOS: Apple Developer Program ($99/yr), `hardenedRuntime` + `gatekeeper-assess` in electron-builder, `afterSign` notarization hook
   - Windows: Authenticode cert (DigiCert/Sectigo ~$200-400/yr), `certificateFile` + `certificatePassword` in `package.json`
3. **Set up GitHub Actions build matrix**:
   - `ubuntu-24.04` → AppImage + deb
   - `macos-14` → dmg
   - `windows-2022` → nsis .exe
   - All: `bun run pack` on tag push
4. **Wire auto-update**:
   - Add `electron-updater`, configure `publish.provider: github`
   - Check for update on launch, download delta, prompt restart
5. **Create release workflow**: tag `v*` → build matrix → sign → create GitHub Release → upload artifacts

---

## Section 2: Cloud Hosting (Weeks 3-4)

### Problem
Dockerfile exists but has no health checks, runs as root, uses SQLite. No multi-tenant provisioning, no reverse proxy, no backups.

### Success Criteria
- [ ] Production Dockerfile (non-root user, health check, multi-stage build working)
- [ ] Docker Compose with PostgreSQL + Caddy/Traefik reverse proxy
- [ ] Deployed on Railway or Fly.io with persistent volume
- [ ] Per-client subdomain provisioning (`clientx.wayofpi.com`)
- [ ] Nightly automated backups to Backblaze B2
- [ ] Uptime monitoring active (Better Uptime / UptimeRobot)

### Tasks
1. **Harden Dockerfile**:
   - Switch to non-root user
   - Add `HEALTHCHECK` using `/api/health`
   - Set resource limits (CPU/Memory)
2. **Production Docker Compose**:
   - PostgreSQL service with persistent volume
   - Caddy reverse proxy with auto Let's Encrypt
   - Per-client override with env vars + port mapping
3. **Deploy to cloud**:
   - Sign up Railway/Fly.io
   - Connect GitHub repo → auto-deploy on main
   - Point `app.wayofpi.com` DNS
4. **Multi-tenant onboarding**:
   - Script to provision new client: create DB, run migration, assign subdomain, send welcome email
   - Store client metadata (DB URL, subdomain, plan tier)
5. **Backup automation**:
   - Daily `pg_dump` → Backblaze B2 via `rclone`
   - 30-day retention
   - Test restore procedure
6. **Monitoring**:
   - Set up uptime monitor on `/api/health`
   - Structured logging (pino/bunyan) in Bun API

---

## Section 3: Self-Hosted Portal (Weeks 5-6)

### Problem
Self-hosting works via `start-wayofpi.sh --web` but requires manual steps. No systemd service, no Cloudflare Tunnel automation, no client docs.

### Success Criteria
- [ ] systemd service file that auto-starts Way of Pi on boot
- [ ] One-liner Cloudflare Tunnel setup (or documented ngrok alternative)
- [ ] Client-facing self-hosting guide with step-by-step instructions
- [ ] Smoke test: fresh Ubuntu 22.04 VM → Way of Pi accessible via public URL in under 30 min

### Tasks
1. **systemd service**:
   - Create `linux/wayofpi.service` (non-root user, restart on failure, env vars)
   - `just install-systemd-service` convenience target
2. **Cloudflare Tunnel wrapper**:
   - Script: `tunnel-wayofpi.sh` that installs cloudflared (if missing), logs in, creates tunnel, routes domain, starts tunnel
   - Or document equivalent ngrok steps
3. **Client documentation**:
   - Write `docs/SELF_HOSTING_GUIDE.md` (prerequisites, install steps, tunnel setup, maintenance)
   - Include hardware requirements table
   - Security notes (firewall, env vars, secrets)
4. **Smoke test**: Run through the full self-hosting flow on a clean VM, record timing

---

## Section 4: Domain & Polish (Week 6+)

### Problem
No domain registered. No pricing model implemented. No admin dashboard for client management.

### Success Criteria
- [ ] `wayofpi.com` registered on Cloudflare
- [ ] `app.wayofpi.com` resolves to cloud deployment
- [ ] `download.wayofpi.com` redirects to GitHub Releases
- [ ] Pricing page on landing site (optional, can be static)
- [ ] Admin dashboard showing active clients, resource usage (minimal v1)

### Tasks
1. **Register domain** via Cloudflare (~$10/yr)
2. **Set up DNS**: `app.wayofpi.com` → cloud provider, `download.wayofpi.com` → GitHub
3. **Landing page**: Minimal static site at `wayofpi.com` (product description + download + pricing)
4. **Admin dashboard (v1)**: List active clients, uptime status, basic resource usage

---

## Dependency Graph

```
WOP-002 (fix build errors)
  └── BLOCKS: WOP-009 Section 1 (desktop — needs clean build for dist/)
  └── BLOCKS: WOP-009 Docker build (needs tsc clean for dist/)

WOP-006 (pi.dev version pinning)
  └── RECOMMENDED before Section 1 production build (pin pi version for deterministic server behavior)

WOP-005 (App.tsx refactor)
  └── NO BLOCKER — desktop ships current App.tsx, cloud too

WOP-009 Sections 1-4
  └── Section 1, 2 independent (can run in parallel)
  └── Section 3 depends on Section 2 Docker knowledge
  └── Section 4 depends on Section 2 (hosting running) + domain purchase
```

---

## Effort Estimate

| Section | Estimated Sessions | Complexity |
|---------|-------------------|------------|
| 1. Desktop Release | 3-4 sessions | Medium (signing certs + CI matrix) |
| 2. Cloud Hosting | 3-4 sessions | Medium (Docker + PostgreSQL + multi-tenant) |
| 3. Self-Hosted Portal | 2-3 sessions | Low (systemd + docs + tunnel script) |
| 4. Domain & Polish | 1-2 sessions | Low (domain + DNS + minimal dashboard) |
| **Total** | **9-13 sessions** | |

---

## Related Documents

- `docs/PRODUCTION_DELIVERY_PLAN.md` — Full plan with cost estimation, architecture, and roadmap
- `docs/LOCAL_HOSTING.md` — Existing guide (ngrok, Docker, VMs)
- `docs/STARTUP_GUIDE.md` — Current startup instructions
- `apps/wayofwork-ui/package.json` — electron-builder config (lines 22-51)
- `apps/wayofwork-ui/Dockerfile` — Current Dockerfile (needs hardening)
- `apps/wayofwork-ui/electron/electron-main.mjs` — Electron main process
