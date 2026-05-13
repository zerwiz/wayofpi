# Way of Pi Application Specifications

## 📐 System Overview

**Way of Pi** is a multi-instance, self-contained terminal-like application built for local deployment at multiple locations (home, on-site, office). Each instance runs **independently** without shared data or central server dependency.

### Core Design Principles

1. **Multi-Instance Architecture**: Each location runs its own independent instance
2. **Local-First**: Primary design for local deployment at home, site, office
3. **No Central Dependency**: Each instance has its own SQLite database
4. **ngrok Optional**: External access via tunnel (when needed)
5. **Single-Session Access**: Each device has its own session (no multi-device sync)

### Target Use Cases

- ✅ **Remote work**: Run from home independently
- ✅ **Field work**: Deploy to laptops/field devices
- ✅ **Multi-site teams**: Each site hosts own instance
- ✅ **Private VPS**: Centralized deployment (optional)
- ✅ **Offline capability**: Works when ngrok tunnel down

---

## 🏗️ Architecture

### Instance Design

```
┌─────────────────────────────────────┐
│          WAY OF PI INSTANCE          │
├─────────────────────────────────────┤
│  - SQLite Database (.instance.db)   │
│  - Local Session Storage            │
│  - ngrok Client (optional)          │
│  - Bun + TypeScript Runtime         │
├─────────────────────────────────────┤
│  External Access:                   │
│    - localhost:3333 (local)         │
│    - ngrok tunnel (remote)          │
│    - VPS IP (optional)              │
└─────────────────────────────────────┘
```

### Key Characteristics

- **Independent**: Each instance has own data
- **No Auth**: No central authentication (local PIN only)
- **SQLite-First**: File-based database per instance
- **WebSocket-Driven**: PTY API via WebSocket
- **Single-User Access**: One session per device

---

## ⚙️ Core Components

### 1. WebSocket Gateway (PTY API)

**Purpose**: Terminal-like interface with WebSocket protocol

**Endpoints**:
- `/ws` - WebSocket connection entry point
- `/login` - Simple PIN authentication
- `/ws` - Main API (terminal commands)

**Protocol**:
```
Client: [id]\x1f{type}\n{message}
Server: {type}\n{status}\n{message}\n{session_id}\n
```

**Features**:
- PTY-like terminal interface
- Real-time WebSocket streaming
- Session-based access
- File upload/download (base64)
- Time logging commands
- Document management

### 2. SQLite Database (File-Based)

**Location**: `data/.instance.db` (instance-local)

**Schema**:
```sql
-- SQLite file database
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires DATETIME
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  timestamp DATETIME,
  message TEXT
);

-- No centralized schema
-- Each instance independent
```

**Characteristics**:
- File-based (no SQL server needed)
- Single-instance storage
- No cross-instance queries
- Simple schema for demo/testing

### 3. ngrok Tunnel (Optional)

**Purpose**: External access to local instance

**Configuration**:
```env
NGROK_AUTH=<your-token>
NGROK_DOMAIN=your-alias.ngrok-free.app
```

**Usage**:
```bash
ngrok http 3333 -address 0.0.0.0 --authtoken <token>
```

**Tunnel URL**: `https://<random-id>.ngrok-free.app`

### 4. Local Authentication

**Purpose**: Simple PIN-based auth for local access

**Flow**:
1. Client sends PIN to `/login`
2. Server validates PIN (local check)
3. Session created (if valid)
4. WebSocket connection established

**Security Notes**:
- PIN validation is local-only
- No password hashing (demo mode)
- Session expires after inactivity
- No cross-instance auth sharing

---

## 📋 File Structure (Per Instance)

```
/apps/wayofpi-api/
├── index.ts              # Main server entry
├── services/
│   ├── index.ts          # API routes
│   ├── authentication.ts # PIN validation
│   ├── terminal.ts       # PTY protocol handler
│   └── file-handling.ts  # File upload/download
├── .env                  # Instance config
├── data/
│   └── .instance.db      # SQLite database (local)
└── routes/
    └── index.ts          # WebSocket routing
```

**Key Files**:
- `apps/wayofpi-api/index.ts` - Server entry
- `apps/wayofpi-api/services/authentication.ts` - PIN check
- `apps/wayofpi-api/routes/index.ts` - WebSocket routes
- `apps/wayofwork-server/typings/protocol.d.ts` - WebSocket protocol

---

## 🔐 Security Model

### Current Security (Local-Only)

| Aspect | Implementation | Security Level |
|--------|---|---|
| **Authentication** | Local PIN check | Low |
| **Encrypted Comm** | ngrok auto-SSL | Medium |
| **Database** | SQLite file | Local only |
| **Self-Signed** | Self-signed or none | Dev only |
| **ngrok Auth** | Optional tunnel-gate | Medium |

### Security Recommendations

**For Production (VPS)**:
1. Get static IP for Let's Encrypt
2. Configure Nginx reverse proxy
3. Enable firewall rules (UFW/firewalld)
4. Set up rate limiting
5. Enable automatic backup

**For Local Testing**:
1. Self-signed certificate (OK)
2. ngrok tunnel (OK, but has limits)
3. No external access (recommended)
4. PIN auth sufficient

**Limitations**:
❌ No central authentication
❌ No password hashing (demo)
❌ No session synchronization
❌ Single instance only

---

## 🚀 Deployment Scenarios

### Scenario 1: Local Home Deployment

**Setup**:
```bash
# Install on home machine
cd /apps/wayofpi-api
bun install
bun run dev
```

**Access**:
- Local: `http://localhost:3333`
- Remote: `ngrok http 3333`

**Data**:
- SQLite in `data/.instance.db`
- No external sync

### Scenario 2: Multi-Site Teams

**Setup**:
- Each site installs its own instance
- No central server
- Each site manages own data

**Example**:
- Home: Home instance (home-db.sqlite)
- Office: Office instance (office-db.sqlite)
- Field: Laptop instance (field-db.sqlite)

**Characteristics**:
- ✅ Independent data (per site)
- ✅ No cross-site sync needed
- ✅ Each site self-managed

### Scenario 3: VPS Deployment (Optional)

**If you want centralized hosting**:

```bash
# Deploy to DigitalOcean ($5/mo)
1. Get Droplet (Ubuntu 22.04)
2. Install: bun, docker (optional)
3. Clone repo
4. Configure .env (VPS instance)
5. Deploy: bun run build
6. Enable: bun start
```

**VPS Characteristics**:
- Centralized storage (optional)
- Static IP for SSL
- Managed via SSH
- Can host multiple instances

---

## 🧪 Testing Checklist

- [ ] Run on local machine
- [ ] Test ngrok tunnel
- [ ] Verify session persistence
- [ ] Test file upload/download
- [ ] Test time logging
- [ ] Test document management
- [ ] Verify local-only mode
- [ ] Test offline capability

---

## 📐 API Protocol Overview

### WebSocket Messages

**Client sends**:
```
{id}\x1f{type}\n{message}
```

**Server responds**:
```
{type}\n{status}\n{message}\n{session_id}\n
```

**Supported Types**:
- `terminal` - PTY commands
- `file` - File operations
- `time` - Time logging
- `session` - Login/logout

---

## 📚 Related Documentation

- [Deployment Guide](../work-button-improvements/DEPLOYMENT.md)
- [NGROK Setup](../work-button-improvements/NGROK-SETUP.md)
- [Local Features](../work-button-improvements/LOCAL-FEATURES.md)
- [VPS Guide](../work-button-improvements/VPS-SETUP.md) (new)

---

## ⚠️ Important Notes

1. **No Central Server**: Each instance independent
2. **ngrok Required**: For external access (free tier)
3. **PIN Auth Only**: No advanced auth system
4. **Local-First Design**: Primary for home/site/office use
5. **SQLite-Only**: No central database

---

## 🚦 Status

- ✅ **Local hosting**: Ready
- ✅ **Multi-instance**: Supported
- ✅ **ngrok tunnel**: Available
- ✅ **Single instance**: Each location independent
- ❌ **Central auth**: Not implemented
- ❌ **Multi-device sync**: Not supported

---

**Created:** 2024-01-XX  
**Last Updated:** 2024-01-XX  
**Owner:** Way of Pi Development Team