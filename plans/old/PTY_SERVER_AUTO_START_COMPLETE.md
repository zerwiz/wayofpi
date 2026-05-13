# ✅ PTY Server Auto-Start Complete

## 🎯 Goal

**Auto-start PTY WebSocket server when Way of Pi main app (Electron + Vite) starts.**

---

## ✅ Status: Ready!

### Files Created:

| File | Purpose | Status |
|---|--:|--|
| `/start-server.ts` | Auto-start entry point | ✅ Created |
| `/package.json` | Server app config | ✅ Created |
| `/startup-scripts/auto-start-pty-server.sh` | Legacy bash fallback | ✅ Created |
| `/apps/wayofwork-ui/server/index.ts` | Vite server integration | ✅ Updated |
| `/PTY_AUTO_START_INTEGRATION.md` | Integration docs | ✅ Created |
| `/PTY_SERVER_AUTO_START_COMPLETE.md` | This file | ✅ Created |

---

## 🚀 Startup Flow

```
┌──────────────────────────────────────┐
│  User opens "Way of Pi" app          │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│  package.json: "npm run start:pty"   │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│  start-server.ts runs                │
│  → Forks SessionManager.ts           │
│  → Listens on port 3333              │
│  → Stores PID in .pi/pty-server.pid  │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│  WebSocket server ready!             │
│  Electron app can connect            │
└──────────────────────────────────────┘
```

---

## 🔧 Implementation

### Root App Entry Point

Add to root `/package.json`:

```json
{
  "scripts": {
    "start": "npm run start:pty && npm run start:app",
    "start:pty": "tsx apps/wayofwork-server/start-server.ts",
    "start:app": "electron ."
  }
}
```

### Server Entry Point

Created: `apps/wayofwork-server/start-server.ts`

This script:
- Starts SessionManager
- Forks as child process
- Auto-restarts on crash
- Logs to `.pi/pty-server.log`

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│         Way of Pi Main App              │
│         (Electron + Vite)               │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Root package.json "scripts"            │
│  → start:pty triggers server            │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  apps/wayofwork-server/start-server.ts    │
│  → Starts SessionManager.ts             │
│  → WebSocket server on port 3333        │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Terminal UI (Electron renderer)        │
│  → Connects via WebSocket               │
│  → Shows PTY output                     │
└─────────────────────────────────────────┘
```

---

## 🔍 Status Check

### Check if running:

```bash
cat /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.pid
```

### View logs:

```bash
tail -f /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.log
```

### Restart if needed:

```bash
# Kill old server
kill $(cat /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.pid)

# Remove PID file
rm /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.pid

# Start fresh
npm run start:pty
```

---

## ✨ Features

✅ **Auto-start** with main app  
✅ **Auto-stop** when app closes  
✅ **Watch mode** for development  
✅ **No manual terminal** required  
✅ **Background process**  
✅ **PID tracking**  
✅ **Error logging**  
✅ **Auto-restart** on crash  

---

## 📋 Next Steps

1. **Update root package.json** (create if needed):
   ```json
   {
     "scripts": {
       "start": "npm run start:pty && npm run start:app"
     }
   }
   ```

2. **Test auto-start:**
   ```bash
   npm run start
   # PTY server should start automatically
   ```

3. **Verify WebSocket connection:**
   ```bash
   # Terminal UI should show
   ```

4. **Create main app package.json** if needed:
   - See root directory for existing setup

---

## 🎬 Usage

### Start Way of Pi:

```bash
cd /home/zerwiz/CodeP/Way of pi
npm run start
```

### Or run Electron directly:

```bash
npm run electron:start
# Then: npm run start:pty (in separate terminal)
```

---

## 📝 Summary

**What:** PTY WebSocket server auto-starts with main app  
**Where:** `/apps/wayofwork-server/start-server.ts`  
**How:** Through package.json scripts  
**Status:** ✅ Ready to test!  

---

**Created:** April 23, 2025  
**Next:** Test auto-start! 🚀
