# Way of Pi — Hosting Plans

All current options for deploying and accessing Way of Pi.

---

## Plan A: Desktop App (Electron)

**What it is:** A native desktop application for Windows, macOS, and Linux. The app bundles the Bun API server + built React frontend in an Electron shell.

**How it works:**
- `apps/wayofpi-ui/electron/electron-main.mjs` loads the UI from the Vite dev server (dev) or from `dist/` (production)
- Bun API server auto-starts when health check fails
- Preload script bridges IPC

**Commands:**
```bash
cd apps/wayofpi-ui
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

**Files:** `apps/wayofpi-ui/package.json` (electron-builder config), `electron/electron-main.mjs`, `electron/preload.cjs`

---

## Plan B: Local Dev Server (Browser)

**What it is:** Run the Vite dev server + Bun API on your machine, access via `http://localhost:5173`.

**Commands:**
```bash
./start-wayofpi.sh           # Starts both Vite (:5173) + Bun API (:3333)
./start-wayofpi.sh --web     # Forces browser mode (no Electron)
just wayofpi-full             # Via justfile (same as above)
bun run dev                   # From apps/wayofpi-ui/
```

**Architecture:**
```
Browser → Vite :5173 → proxy → Bun API :3333
  (serves UI modules)          (API + WebSocket)
```

**Files:** `start-wayofpi.sh`, `apps/wayofpi-ui/vite.config.ts`

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

**Dockerfile** (`apps/wayofpi-ui/Dockerfile`):
- Multi-stage: `oven/bun:latest` → build UI → copy dist/ + server/ to production image
- Exposes port 3333
- `NODE_ENV=production`

```bash
cd apps/wayofpi-ui
docker compose up -d        # Starts Way of Pi + Ollama
docker build -t wayofpi .   # Or build manually
```

**docker-compose.yml** (`apps/wayofpi-ui/docker-compose.yml`):
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
ExecStart=/home/wayofpi/.bun/bin/bun run apps/wayofpi-ui/server/index.ts
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

## Related Files

| File | Content |
|------|---------|
| `docs/PRODUCTION_DELIVERY_PLAN.md` | Full delivery plan (desktop, cloud, self-host, CI/CD) |
| `docs/LOCAL_HOSTING.md` | Local deployment guide (Docker, ngrok, VMs) |
| `docs/old/wayofpi/WOP_NGROK.md` | ngrok integration details |
| `thoughts/shared/tickets/WOP-009-production-delivery.md` | Active delivery ticket |
| `thoughts/shared/tickets/WOP-ALL-TODO.md` (Phase 8) | Granular hosting task list |
| `apps/wayofpi-ui/Dockerfile` | Production Docker build |
| `apps/wayofpi-ui/docker-compose.yml` | Docker Compose (Way of Pi + Ollama) |
| `apps/wayofpi-ui/package.json` | Electron-builder config |
| `scripts/install-ngrok-optional.sh` | ngrok system installer |
| `scripts/host-for-demo.sh` | Quick demo hosting script |
| `plans/old/productionready/hosting/URGENT_DEPLOY_CLIENT_DEMO.md` | Urgent demo deployment |
| `plans/old/productionready/reference/PI_INTEGRATION_DOCKER_PLAN.md` | Pi in Docker plan |
