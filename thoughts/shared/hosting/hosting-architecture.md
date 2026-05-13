# WOP-012 Hosting Architecture — SaaS + On-Premise Hybrid

> Two deployment models: cloud-hosted SaaS for remote access, and preloaded mini PC for on-site/office local use.

---

## 1. The Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │           Way of Pi Cloud (SaaS)              │
                      │                                              │
                      │  ┌──────────┐   ┌──────────┐   ┌─────────┐   │
                      │  │ Railway  │   │   S3     │   │ Fortnox │   │
                      │  │ (Bun +   │   │ (photos  │   │ API     │   │
                      │  │  SQLite) │   │  + docs) │   │ sync    │   │
                      │  └────┬─────┘   └────┬─────┘   └────┬────┘   │
                      │       │              │              │        │
                      │  ┌────┴──────────────┴──────────────┴────┐   │
                      │  │     Cloudflare Tunnel (ingress)       │   │
                      │  └────────────────┬──────────────────────┘   │
                      └───────────────────┼──────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                          │
              │  ┌────────────────────────┴────────────────────┐     │
              │  │         Tailscale Mesh Network              │     │
              │  │  (zero-config WireGuard VPN between sites)  │     │
              │  └──────┬───────────────────────────┬──────────┘     │
              │         │                           │                │
     ┌────────┴─────────┐              ┌────────────┴──────────┐     │
     │  Office/Cloud    │              │  On-Site (Client)     │     │
     │  (Admin use)     │              │  (Field use)          │     │
     │                  │              │                       │     │
     │  Browser → WOP   │              │  Local Wi-Fi → WOP    │     │
     │  via cloud URL   │              │  OR Tunnel → Cloud    │     │
     │                  │              │                       │     │
     │  OR: direct to   │              │  Preloaded Mini PC    │     │
     │  on-prem box     │              │  (Intel NUC / Pi 5)   │     │
     └──────────────────┘              └───────────────────────┘
```

### Two Modes of Operation

**Mode A: SaaS (Cloud-First)**
- WOP runs on Railway/Fly.io with persistent SQLite volume
- Workers/clients access via browser at `https://app.wayofpi.se`
- Photos uploaded to S3-compatible storage
- Fortnox sync via webhook
- Monthly subscription per tenant

**Mode B: On-Premise (Local-First)**
- Client receives preloaded mini PC (e.g., Intel NUC, ASUS NUC 15 Pro)
- Bun server + SQLite runs locally, zero external dependencies for core operation
- Workers access via local Wi-Fi (no internet needed for time tracking)
- Optional: Cloudflare Tunnel for remote admin access + Fortnox sync
- Tailscale for secure site-to-site connection to cloud (if hybrid)

**Mode C: Hybrid (Best of Both)**
- On-prem box runs the app locally (fast, works offline)
- Cloud instance acts as backup/sync hub
- Tailscale bridges the two — data syncs automatically when internet is available
- Admin can access both cloud and on-prem via single Tailscale mesh

---

## 2. Cloud Hosting Options

### Comparison

| Platform | Bun Support | SQLite | Free Tier | Prod Cost | Scale-to-Zero | Notes |
|----------|-------------|--------|-----------|-----------|---------------|-------|
| **Railway** | ✅ (Dockerfile) | ✅ (persistent volume) | $5 credit | ~$5-25/mo | ✅ | Best DX, GitHub deploy, built-in DB provisioning |
| **Fly.io** | ✅ (Dockerfile) | ✅ (LiteFS + volume) | 3 shared VMs | ~$3-10/mo | ✅ | Global regions, LiteFS for multi-region SQLite |
| **Coolify (self-hosted on VPS)** | ✅ (Docker) | ✅ | $0 (OSS) | ~$5-20/mo VPS | ❌ (always on) | Full control, one-click deploy from Git |
| **Cloudflare Workers** | ❌ (officially unsupported) | ❌ (no SQLite) | ✅ 100k req/day | $0-10/mo | ✅ | NOT suitable — no Bun, no SQLite |
| **AWS EC2** | ✅ (manual setup) | ✅ | 1yr free t2.micro | ~$15-20/mo | ❌ | More ops overhead |
| **Hetzner VPS** | ✅ (manual/Docker) | ✅ | ❌ (no free tier) | ~$4-10/mo | ❌ | Cheapest raw VPS in EU |

### Recommendation: Railway

**Why Railway for SaaS:**
- One-command deploy from GitHub with Dockerfile
- Built-in persistent volume for SQLite (`/data` mount)
- Auto SSL, custom domain, env management
- Scale-to-zero when idle (cost efficient)
- ~$5-25/mo for a production app

**Dockerfile for Railway:**
```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
COPY . .
EXPOSE 3000
ENV PORT=3000 DATABASE_PATH=/data/wayofpi.sqlite
CMD ["bun", "run", "server/index.ts"]
```

**railway.json:**
```json
{
  "build": { "builder": "RAILPACK" },
  "mounts": [
    { "source": "sqlite-data", "destination": "/data" }
  ]
}
```

### Alternative: Coolify on a $5-10/mo VPS

For teams that want full control without per-deploy pricing:
- Install Coolify on a Hetzner VPS (~€4/mo for 2 vCPU, 4GB RAM)
- Connect GitHub repo → one-click deploy
- Built-in reverse proxy (Traefik) + SSL (Let's Encrypt)
- Unlimited apps, databases, services
- Runs on Raspberry Pi too

---

## 3. On-Premise Hardware Options

### Comparison

| Device | CPU | RAM | Storage | Price | Bun Perf | Power | Suitable For |
|--------|-----|-----|---------|-------|----------|-------|-------------|
| **ASUS NUC 15 Pro** | Intel Core Ultra 7 (16C/22T) + NPU | Up to 96GB DDR5 | Up to 8TB NVMe Gen5 | ~$800-1200 | 🔥 Excellent | 65W | Main office server, AI edge |
| **Intel NUC 12 Pro** | i5-1240P (12C/16T) | Up to 64GB DDR4 | Up to 8TB NVMe Gen4 | ~$500-800 | 🔥 Excellent | 35W | Office server |
| **Intel NUC 11** | i7-1165G7 (4C/8T) | Up to 64GB DDR4 | Up to 4TB NVMe | ~$400-600 | ✅ Very good | 28W | Office server (budget) |
| **Raspberry Pi 5** | ARM Cortex-A76 (4C) | Up to 16GB LPDDR4X | Up to 1TB NVMe via HAT | ~$80-200 | ⚠️ Good for 5-10 users | 15W | Small sites, field box |
| **Raspberry Pi 4** | ARM Cortex-A72 (4C) | Up to 8GB | microSD + USB SSD | ~$50-100 | ⚠️ Adequate for 3-5 users | 10W | Very small sites |
| **HP Elite Mini** | Intel i5/i7 | Up to 64GB | Up to 2TB | ~$300-700 | ✅ Very good | 35W | Office, business-grade |
| **Lenovo ThinkCentre M75q** | AMD Ryzen 5/7 | Up to 64GB | Up to 2TB | ~$300-600 | ✅ Very good | 35W | Office, business-grade |
| **AMD Strix Halo AI+ Workstation** | AMD Ryzen AI 9 HX 370 (12C/24T) + XDNA2 NPU | Up to 128GB unified (32GB HBM2e + 96GB DDR5) | Up to 4TB NVMe Gen5 | ~$3,500-4,500 | 🔥🔥 Exceptional | 120W | Premium on-prem, local LLM inference, AI features |

### Recommended: Intel NUC 12 Pro (i5, 32GB, 1TB NVMe)

**Why NUC over Pi:**
- x86 architecture → same binary as cloud, zero cross-compilation issues
- Bun runs natively on x86 (no emulation)
- Handles 20-50 concurrent workers easily
- Small form factor (4.4" × 4.6" × 2") — fits in a toolbox
- VESA mountable behind a monitor
- 24/7 qualified operation
- ~$500-600 fully configured

**When Pi 5 is enough:**
- < 10 workers
- Light usage (time tracking only, no heavy photo uploads)
- Need absolute lowest cost
- Budget: ~$150 (Pi 5 8GB + NVMe HAT + SSD + case + PSU)

### Premium On-Prem: AMD Strix Halo AI+ Workstation

For clients who want local AI features (smart ticket categorization, OCR for receipts, voice-to-text for time logs, predictive budget alerts) without cloud dependency or GPU servers.

**Hardware specs:**
| Component | Spec |
|-----------|------|
| CPU | AMD Ryzen AI 9 HX 370 (12C/24T, 5.1 GHz boost) |
| NPU | XDNA2 — 50+ TOPS for on-device AI inference |
| Memory | 128GB unified (32GB HBM2e @ 1.5 TB/s + 96GB DDR5 @ 60 GB/s) |
| Storage | 2TB NVMe Gen5 SSD |
| Network | Wi-Fi 7, 2.5GbE, Bluetooth 5.4 |
| Power | ~120W peak (idle ~15W) |
| Price | ~$3,500-4,500 (one-time hardware cost) |

**Why Strix Halo over NVIDIA for on-prem LLM:**
- **Unified memory** eliminates PCIe copies between GPU and CPU — no data transfer bottleneck
- **128GB unified pool** fits a 30B parameter 4-bit quantized model (~15GB weights + ~3GB KV cache) entirely in HBM2e
- **No CUDA license costs**, no NVIDIA driver headaches on Linux
- **ROCm support** for popular frameworks (llama.cpp, vLLM, Ollama)
- **Same x86 architecture** as the NUC — reuse same Bun deployment image
- **Full passthrough to VMs** via AMD-Vi for Proxmox setups

**Caveats:**
- ROCm driver stability on Ubuntu 24.04 LTS is improving but not yet NVIDIA-grade — requires a tested driver freeze list
- For workloads above 30B parameters (e.g., 70B+ models), an NVIDIA A4000 or used RTX 4090 node is still recommended
- 120W TDP requires adequate cooling — not fanless, needs ventilation

**Cost comparison vs cloud GPU inference:**
| Scenario | Strix Halo (on-prem) | Cloud GPU (RunPod/AWS) |
|----------|---------------------|----------------------|
| Upfront HW cost | $4,200 | $0 |
| Monthly inference cost | ~$10 (electricity) | ~$300-800 (A100 40GB @ $1-2/hr) |
| Latency | ~2.2 tokens/s (30B 4-bit) | ~20-50 tokens/s (A100) |
| Data privacy | ✅ Fully local | ❌ Data leaves premises |
| Internet required | ❌ No | ✅ Yes |
| Break-even | ~6-14 months | — |
| Max concurrent clients | 2-3 (30B model) | 10+ (A100) |

### Preloaded Computer — What We Ship

```
┌─────────────────────────────────────────────┐
│           WAY OF PI — TURNKEY BOX            │
│─────────────────────────────────────────────│
│                                              │
│  Hardware: ASUS NUC 15 Pro / Intel NUC 12    │
│  RAM: 32GB DDR4/5                            │
│  Storage: 1TB NVMe SSD                       │
│  OS: Ubuntu Server 24.04 LTS                 │
│                                              │
│  Pre-installed:                              │
│  ├─ Bun runtime (latest)                     │
│  ├─ Way of Pi server (auto-start on boot)    │
│  ├─ SQLite database (pre-initialized)        │
│  ├─ Cloudflare Tunnel (cloudflared)          │
│  ├─ Tailscale (pre-authorized to tenant)     │
│  ├─ Auto-update system (cron)                │
│  └─ Monitoring dashboard (Cockpit)           │
│                                              │
│  Plug in: power + ethernet → wait 60s →     │
│  workers connect via local Wi-Fi or URL      │
│                                              │
│  Price: $599-999 (one-time hardware cost)    │
│  + $0/mo (no cloud fees if offline-only)     │
│  OR $19/mo (hybrid: auto-sync to cloud)      │
└─────────────────────────────────────────────┘
```

---

## 4. Connectivity & Tunneling

### Option A: Cloudflare Tunnel (Recommended for SaaS access)

| Feature | Cloudflare Tunnel | ngrok |
|---------|------------------|-------|
| **Free tier** | ✅ Unlimited tunnels, no rate limit | ❌ 20 req/min, 4 tunnels/mo |
| **Custom domain** | ✅ (your domain) | ❌ (random subdomain on free) |
| **Auth** | ✅ Cloudflare Access (SSO, email OTP) | ❌ Basic auth only on free |
| **DDoS protection** | ✅ Built-in | ❌ |
| **Production ready** | ✅ Yes | ⚠️ Limited on free |
| **Setup** | `cloudflared tunnel run` | `ngrok http 3000` |

**Cloudflare Tunnel setup:**
```bash
# Install
sudo apt install cloudflared

# Authenticate (one-time)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create wayofpi

# Route domain
cloudflared tunnel route dns wayofpi pi.byggfirma.se

# Run
cloudflared tunnel run wayofpi
```

**As system service (auto-start on boot):**
```bash
sudo cloudflared service install
```

### Option B: Tailscale (Site-to-site mesh VPN)

| Feature | Tailscale |
|---------|-----------|
| **Free tier** | ✅ Up to 3 users, unlimited devices |
| **Paid** | $6/user/mo for teams |
| **Latency** | Direct peer-to-peer (no central relay) |
| **Protocol** | WireGuard (end-to-end encrypted) |
| **Setup** | Zero-config: install → login → connected |

**Why Tailscale for hybrid mode:**
- On-prem box + cloud server appear on same private network
- Workers on-site connect to local box directly (zero latency)
- Admin can SSH into any on-prem box from anywhere
- No open ports needed on client firewall (outbound-only)
- Replaces traditional VPN with zero config

**Architecture:**
```
┌──────────────┐     Tailscale     ┌──────────────┐
│  Cloud WOP   │◄────────────────►│  On-Prem NUC │
│  (Railway)   │   mesh network   │  (client site)│
└──────┬───────┘                  └──────┬───────┘
       │                                 │
       │  Sync DB (hourly cron)          │  Local Wi-Fi
       │  Photo upload (S3)              │  10.0.0.x
       │  Fortnox push (cloud)           │
       │                                 │
       │  ┌──────────────┐               │
       │  │ Admin laptop │               │
       │  │ (anywhere)   │               │
       │  └──────────────┘               │
       │  SSH directly to NUC            │
       │  via Tailscale IP               │
```

### Option C: Offline Mode (No Internet)

For sites with unreliable or no internet:
- On-prem box runs fully independently
- Workers check in/out, create tickets, log time — all local
- Data stored in SQLite on NVMe SSD
- When internet is available: one-click sync to cloud
- Sync mechanism: Tailscale tunnel → rsync SQLite + S3 upload photos

---

## 5. Cost Breakdown

### Scenario A: Pure SaaS (Cloud Only)

| Item | Cost |
|------|------|
| Railway hosting (1 app + SQLite volume) | ~$10-25/mo |
| Cloudflare Tunnel (free) | $0/mo |
| S3 storage (photos, 10GB) | ~$0.50/mo |
| Fortnox API (customer license) | ~$79-199/mo (customer side) |
| **Total per tenant** | **~$10-25/mo** |

### Scenario B: On-Premise Only (No Cloud)

| Item | Cost |
|------|------|
| Intel NUC 12 Pro (one-time) | ~$599 |
| Preinstallation + configuration (one-time) | ~$200 |
| Electricity (15W × 24h × 365d) | ~$30/year |
| **First year total** | **~$829** |
| **Year 2+** | **~$30/year** (electricity) |

### Scenario C: Hybrid (On-Premise + Cloud Sync)

| Item | Cost |
|------|------|
| Intel NUC 12 Pro (one-time) | ~$599 |
| Preinstallation + configuration (one-time) | ~$200 |
| Railway hosting (sync hub) | ~$5-10/mo |
| Tailscale (3 users free OR $6/user/mo) | $0-18/mo |
| Cloudflare Tunnel (free) | $0/mo |
| S3 storage | ~$0.50/mo |
| **First year total** | **~$799 + ~$5-28/mo** |
| **Year 2+** | **~$60-336/year** |

### Scenario D: Raspberry Pi On-Premise (Budget)

| Item | Cost |
|------|------|
| Raspberry Pi 5 8GB + NVMe HAT + 256GB SSD + case + PSU | ~$180 |
| Preinstallation + configuration (one-time) | ~$100 |
| Electricity (10W × 24h × 365d) | ~$20/year |
| **First year total** | **~$300** |
| **Year 2+** | **~$20/year** |

---

## 6. Recommended Architecture

### Phase 1 (MVP): Pure Cloud SaaS

```
Clients → Cloudflare Tunnel → Railway (Bun + SQLite volume)
                               ↓
                          S3 (photos)
                               ↓
                          Fortnox API
```

- One deployment, all tenants share cloud infra
- Workers access via web browser on phone/laptop
- Cost: ~$10-25/mo per tenant (or less if multi-tenant)

### Phase 2: On-Premise Option

```
Site workers → Local Wi-Fi → NUC (Bun + SQLite)
                               │
                          [optional]
                               ↓
                          Cloudflare Tunnel → Cloud backup
```

- Ship preloaded NUC to clients who want local-only
- Same codebase, same SQLite, same UI
- No internet required for time tracking
- Optional: tunnel for remote admin + Fortnox sync

### Phase 3: Hybrid Sync

```
On-prem NUC ←── Tailscale ──→ Cloud Railway
  (primary)                     (backup/sync hub)
     │                              │
     │  Hourly:                      │
     │  - rsync SQLite to cloud      │
     │  - upload new photos to S3    │
     │  - pull Fortnox status        │
     │  - push approved tickets      │
     │                              │
     │  Admin can manage from either │
     ▼                              ▼
  Workers (local)              Remote workers / client
```

- Best of both worlds: speed of local + accessibility of cloud
- Sync is periodic (not real-time) to keep complexity low
- If cloud goes down: on-prem still works
- If on-prem goes down: cloud has last sync

---

## 7. Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Runtime** | Bun (not Node.js) | Native SQLite, faster cold start, smaller binary for on-prem |
| **Database** | SQLite (not Postgres) | Single file, no daemon, perfect for on-prem, Bun-native |
| **SQLite sync** | File-level rsync (not LiteFS) | Simpler, no multi-writer needed, periodic sync is fine |
| **Tunnel** | Cloudflare Tunnel (not ngrok) | Unlimited free, custom domain, DDoS protection, production-grade |
| **Mesh VPN** | Tailscale (not WireGuard directly) | Zero config, auto key rotation, ACLs, SSO |
| **Cloud host** | Railway (not Fly.io) | Better DX, simpler config, no Firecracker VMs to debug |
| **On-prem HW** | Intel NUC (not Pi 5 default) | x86 native, same binaries, more headroom, 24/7 qualified |
| **Photo storage** | S3-compatible (Backblaze B2 or Cloudflare R2) | Cheaper than AWS S3, R2 has no egress fees |
| **Container** | Bare metal (not Docker on NUC) | Simpler for on-prem, fewer moving parts, one binary |

---

## 8. Implementation Checklist

### For SaaS deployment (Railway)
- [ ] Create Dockerfile with Bun + SQLite volume mount
- [ ] Create railway.json with persistent volume config
- [ ] Set up Cloudflare domain + Tunnel
- [ ] Configure auto-deploy from GitHub
- [ ] Set up S3-compatible storage (Backblaze B2 / Cloudflare R2)
- [ ] Configure backups (weekly SQLite dump → S3)
- [ ] Set up monitoring (health check, uptime alert)

### For on-premise deployment (NUC/RPi)
- [ ] Create preinstallation image (Ubuntu + Bun + WOP server)
- [ ] Create auto-start systemd service
- [ ] Create first-boot setup wizard (tenant ID, admin account, Wi-Fi config)
- [ ] Pre-configure Cloudflare Tunnel token
- [ ] Pre-authorize Tailscale to tenant's tailnet
- [ ] Create one-click sync script (local → cloud)
- [ ] Create hardware test + burn-in procedure
- [ ] Create shipping checklist + quick-start guide (Swedish)

### For hybrid mode
- [ ] Implement sync endpoint in API (`/api/sync/push`, `/api/sync/pull`)
- [ ] Create conflict resolution strategy (last-write-wins with timestamp)
- [ ] Add sync status indicator in UI ("Last synced: 5 min ago")
- [ ] Create cron sync script (runs every 15-60 min)
- [ ] Handle offline queue for photo uploads

---

## 9. Quick Reference — URLs

| Service | URL |
|---------|-----|
| Railway | https://railway.com |
| Coolify | https://coolify.io |
| Cloudflare Tunnel | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks |
| Tailscale | https://tailscale.com |
| ASUS NUC 15 Pro | https://www.asus.com/us/business/blog/nuc-15-pro-mini-pc-business-ai-performance/ |
| Intel NUC (now ASUS) | https://www.asus.com/nuc/ |
| Raspberry Pi 5 | https://www.raspberrypi.com/products/raspberry-pi-5/ |
| Backblaze B2 (S3) | https://www.backblaze.com/cloud-storage |
| Cloudflare R2 (S3) | https://www.cloudflare.com/developer-platform/r2/ |
| AMD Strix Halo | https://www.amd.com/en/products/processors/ryzen-ai-300-series.html |

---

## 10. AI Inference Hosting — Cloud vs On-Prem Model Serving

WOP-012 clients may want AI features: smart ticket categorization, OCR for scanned receipts, voice-to-text for time logs, and predictive budget alerts. These require LLM inference.

### Option A: Cloud Inference (API-based)

| Provider | Model Access | Cost | Latency | Data Privacy | Notes |
|----------|-------------|------|---------|-------------|-------|
| **OpenAI API** | GPT-4o, GPT-4o-mini | $2.50-10/1M input tokens | ~500ms-2s | ❌ Data leaves premises | No GPU management |
| **Anthropic API** | Claude 3.5 Sonnet/Haiku | $3-15/1M input tokens | ~500ms-3s | ❌ Data leaves premises | Best for construction contract analysis |
| **Azure OpenAI** | Same as OpenAI + EU region | ~20% premium | Same | ⚠️ EU data region | GDPR-compliant option |
| **Groq** | Llama 3 70B (LPU) | $0.59/1M tokens | ~200ms (fastest) | ❌ Data leaves premises | Great for classification tasks |
| **Together AI** | Mixtral, Llama, Qwen | $0.10-0.50/1M tokens | ~500ms-2s | ❌ Data leaves premises | Broadest model selection |

**When to choose cloud:**
- Clients without on-prem AI hardware
- Low latency requirements (< 1s response)
- Willing to send construction data to third-party APIs
- Subscription model: ~$10-50/mo per tenant for light AI usage

### Option B: On-Prem Inference (Local Model)

| Hardware | Models Supported | Performance | Cost | Power |
|----------|-----------------|-------------|------|-------|
| **Strix Halo (128GB unified)** | Up to 30B 4-bit (Q4_K_M) | ~2.2 tok/s, 2-3 concurrent | $4,200 HW | 120W |
| **NVIDIA RTX 4090 (24GB VRAM)** | Up to 13B Q8 / 30B Q4_K_S | ~30-50 tok/s, 1 client | $1,600 GPU | 450W |
| **NVIDIA RTX 6000 Ada (48GB VRAM)** | Up to 30B Q8 / 70B Q4_K_M | ~25-40 tok/s, 2-3 clients | $6,800 GPU | 300W |
| **CPU-only (NUC 128GB RAM)** | Up to 8B Q4_K_M via llama.cpp | ~1-3 tok/s, 1 client | $0 (existing HW) | 35W |
| **Apple Mac Studio M3 Ultra (192GB)** | Up to 70B Q4_K_M | ~5-10 tok/s, 3-5 clients | $8,000 | 120W |

**Software stack for on-prem inference:**
```
┌──────────────────────────────────────────┐
│          Way of Pi Server (Bun)          │
│  POST /api/ai/classify-ticket            │
│  POST /api/ai/ocr-receipt                │
│  POST /api/ai/summarize-timelog          │
│  POST /api/ai/predict-budget             │
├──────────────────────────────────────────┤
│        AI Proxy Layer (Bun/TypeScript)   │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Ollama   │  │ llama.cpp│  │ OpenAI │  │
│  │ (HTTP)   │  │ (subproc)│  │ SDK    │  │
│  └────┬─────┘  └────┬─────┘  └────┬───┘  │
│       │              │             │      │
│  ┌────┴────┐   ┌─────┴────┐  ┌────┴────┐ │
│  │ Strix   │   │ CPU      │  │ Cloud   │ │
│  │ Halo    │   │ (NUC)    │  │ API     │ │
│  └─────────┘   └──────────┘  └─────────┘ │
└──────────────────────────────────────────┘
```

**When to choose on-prem:**
- Construction firms with strict data privacy policies
- No internet requirement (on-site, offline)
- Predictable monthly cost (no API token burn)
- Clients with > 3 concurrent users needing AI features
- 30B 4-bit model is sufficient for Swedish construction domain tasks

### Option C: Hybrid AI (Cloud fallback, on-prem primary)

```
Normal operation:
  Strix Halo (local) ← classification/OCR queries
  ↓ success → cached locally
  ↓ fail/timeout → Cloud API fallback (OpenAI/Groq)

Offline mode:
  Strix Halo (local) ← all queries
  ↓ model not loaded → queue for later
  ↓ heavy query → simplified on-device model
```

**Recommended for WOP-012:**
- Start with **cloud inference** (OpenAI or Groq) for MVP — no HW commitment
- Offer **Strix Halo on-prem upgrade** for clients who hit $100+/mo API bills or have privacy requirements
- Use a **unified AI proxy layer** in Bun server so switching between cloud/on-prem is a config change

### AI Inference Implementation Checklist
- [ ] Create AI proxy layer in server (`server/ai/proxy.ts`) with cloud provider SDKs
- [ ] Implement ticket classification endpoint (`POST /api/ai/classify-ticket`)
- [ ] Implement receipt OCR endpoint (`POST /api/ai/ocr-receipt`)
- [ ] Implement time log summarization (`POST /api/ai/summarize-timelog`)
- [ ] Implement budget prediction (`POST /api/ai/predict-budget`)
- [ ] Add Ollama integration for local inference (Strix Halo / CPU)
- [ ] Add config switching: `WOP_AI_BACKEND=cloud|local|hybrid`
- [ ] Add usage tracking per tenant (token count, cost estimation)
- [ ] Document model fine-tuning workflow for Swedish construction terminology
