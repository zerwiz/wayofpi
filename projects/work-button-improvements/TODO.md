# TODO: WORK BUTTON / LOCAL HOSTING IMPLEMENTATION
**CRITICAL:** Host application on developer's computer ASAP for client demos and user testing!

## 🔴 CRITICAL: Hermes Page Visibility Issue
**[ ] URGENT:** Fix Hermes page routing
- Export HermesPage from `apps/wayofpi-ui/src/pages/index.ts`
- Add routing condition in `apps/wayofpi-ui/src/App.tsx`
- Test `/hermes` route works correctly
- See `plans/productionready/investigation/HERMES_PAGE_NOT_VISIBLE.md`
**CRITICAL:** Host application on developer's computer ASAP for client demos and user testing!

## 🔴 CRITICAL: Hermes Page Visibility Issue
**[ ] URGENT:** Fix Hermes page routing
- Export HermesPage from `apps/wayofpi-ui/src/pages/index.ts`
- Add routing condition in `apps/wayofpi-ui/src/App.tsx`
- Test `/hermes` route works correctly
- See `plans/productionready/investigation/HERMES_PAGE_NOT_VISIBLE.md`

This document tracks implementation for **LOCAL HOSTING** capability. Each instance (home, on-site, office) runs **INDEPENDENTLY**.

---

## 🔴 CRITICAL: Hosting Needed for Client Demos
**[ ] URGENT:** Host application on developer's computer ASAP
- Clients need to log in and try out the app
- Demo ready for stakeholder reviews
- User feedback needed before production
- See production hosting plans: `plans/productionready`

## ✅ CURRENT CAPABILITIES

### System Architecture

| Component | Current State | Local Hosting Ready? |
|-----------|----------------|---------------|
| **Backend** | Bun + tsx + WebSocket | ✅ Yes |
| **Frontend** | Vite React TS | ✅ Yes |
| **API** | WebSocket REST API | ✅ Yes |
| **Auth** | Simple PIN check | ✅ Yes (local only) |
| **SSL/TLS** | ngrok tunnel OR self-sign | ✅ Yes (dev or prod) |
| **Database** | SQLite (local file) | ✅ Yes (per-instance) |
| **Host Shell** | `bash` tool | ✅ Yes |

### Multi-Instance Design

- ✅ Each location (home, on-site, office) runs **STANDALONE**
- ✅ No central server needed
- ✅ Each instance has independent data
- ✅ No central auth required
- ✅ Suitable for remote work, multi-site teams

---

## 🔴 Critical (Local Hosting Ready)

### ✅ System Already Works

These capabilities are **CURRENTLY AVAILABLE**:

- [x] **Local hosting**: Runs on any machine independently
- [x] **ngrok tunnel**: External access via tunnel-gate
- [x] **SQLite database**: File-based, per-instance
- [x] **Simple auth**: PIN check for local security
- [x] **PTY WebSocket**: Terminal-like interface
- [x] **Local-only mode**: No central server dependency

### Documentation Updates

- [x] Update file paths to correct locations
- [x] Remove incorrect "multi-tenant" claims
- [x] Clarify single-instance design
- [x] Update "global" to "multi-location" terminology
- [x] Add ngrok tunnel instructions
- [x] Add VPS deployment instructions (DigitalOcean/Linode)

### Security Notes

- [ ] **ngrok**: External access when needed (auto-cert)
- [ ] **Self-signed**: For dev/local testing
- [ ] **SQLite**: Encrypted file for added security
- [ ] **Local auth**: PIN-based for demo/testing
- [ ] **HTTPS**: Via ngrok or Let's Encrypt (if static IP)

---

## 🟠 High Priority

### 📞 DEMO-READY DEPLOYMENT (URGENT)
- [ ] **Deploy to dev machine NOW**
- [ ] Configure demo account for clients
- [ ] Test client login flow
- [ ] Prepare demo presentation
- [ ] Share access with client team

### 🔧 Hermes Page Routing Fix
- [ ] Export HermesPage from `apps/wayofpi-ui/src/pages/index.ts`
- [ ] Add routing condition in `apps/wayofpi-ui/src/App.tsx`
- [ ] Test `/hermes` route visibility
- [ ] See `plans/productionready/investigation/HERMES_PAGE_NOT_VISIBLE.md`

### Local Deployment Steps (if needed)

- [ ] **Step 1**: Install Bun + tsx
- [ ] **Step 2**: Clone repository
- [ ] **Step 3**: Configure `.env` (instance ID, PIN)
- [ ] **Step 4**: Initialize SQLite
- [ ] **Step 5**: Start with `bun run dev`
- [ ] **Step 6**: Optional: ngrok tunnel for external access
- [ ] **Step 7**: Optional: VPS deployment (DigitalOcean)

### Instance Configuration

- [ ] Create `.env` per instance:
  ```env
  INSTANCE_ID=home-001
  PIN=112233
  DB_FILE=.instance.db
  PORT=3333
  NGROK_AUTH=<your-token> (optional)
  ```

- [ ] Each instance has independent `.instance.db`
- [ ] No cross-instance data sharing
- [ ] Each location manages its own data

### ngrok Setup (Optional)

- [ ] Get free ngrok token
- [ ] Run: `ngrok http 3333 --authtoken <your-token>`
- [ ] Tunnel URL: `https://random-id.ngrok-free.app`
- [ ] Share URL with remote users (session-based access)

---

## 🟡 Medium Priority

### VPS Deployment (Optional)

If you want centralized hosting:

- [ ] **DigitalOcean** ($5/mo Droplet)
- [ ] Install: `docker compose up`
- [ ] Or: Native Bun + tsx deployment
- [ ] Configure static IP for Let's Encrypt
- [ ] Set up reverse proxy (Nginx/Caddy)
- [ ] Enable automatic backup (1-2x/week)

### Instance Management

- [ ] Script for easy instance creation
- [ ] `.env.example` template per location
- [ ] One-command deploy helper
- [ ] Backup script for SQLite files

---

## 🟢 Low Priority

### Local Features

- [ ] Add welcome message for new instances
- [ ] Create instance ID generator
- [ ] Add instance health check
- [ ] Create deployment checklist

### Security Hardening (Optional)

- [ ] If VPS deployed: Configure firewall
- [ ] Rate limiting for API endpoints
- [ ] Fail2ban on SSH if VPS hosted
- [ ] SSL certificate rotation (automatic)

---

## 🧪 Local Testing Checklist

- [ ] Install on local machine (home)
- [ ] Install on work machine
- [ ] Test ngrok tunnel from each location
- [ ] Verify each instance has independent data
- [ ] Test session persistence locally
- [ ] Verify no cross-instance data leak

---

## 📋 Definition of Done (Local Hosting)

Each location's instance should meet these criteria:

- [ ] Runs independently (no central server)
- [ ] Has own SQLite database
- [ ] Works with ngrok tunnel (if needed)
- [ ] No external dependencies (offline-capable)
- [ ] Self-contained deployment
- [ ] Security via PIN + ngrok auth (if used)

---

## 🚫 Known Limitations (Local Hosting)

- **Single instance**: No central data store
- **ngrok required**: For external access (free tier limits)
- **PIN auth only**: No advanced auth system
- **Local-only mode**: Best for home/office deployment
- **No cross-instance sync**: Each location independent

---

## ✅ What This Design Enables

- ✅ Remote work from home
- ✅ Multi-site teams (each site independent)
- ✅ Field work (run from laptop)
- ✅ Private deployments (VPS or ngrok)
- ✅ Self-contained instances
- ✅ Offline-first approach
- ✅ Local testing without setup

---

## 🚦 Status

- ✅ **Local hosting**: Ready
- ✅ **Multi-instance**: Supported
- ✅ **ngrok tunnel**: Available when needed
- ✅ **Single instance**: Each location independent

---

## 📚 Related Documentation

- [Local Deployment](./DEPLOYMENT.md) (new)
- [VPS Setup Guide](./VPS-SETUP.md) (new)
- [NGROK Guide](./NGROK-SETUP.md) (new)

---

**Created:** 2024-01-XX  
**Last Updated:** 2024-01-XX  
**Owner:** Way of Pi Development Team
