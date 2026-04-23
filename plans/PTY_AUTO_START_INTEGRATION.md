# Way of Pi PTY Server Auto-Start Integration

## 🚀 Auto-Start PTY Server

When the main Way of Pi Electron/Vite app starts, the PTY WebSocket server will automatically start in the background.

---

## 📋 Setup

### 1. Install Dependencies

```bash
cd /home/zerwiz/CodeP/Way of pi/apps/wayofpi-server
npm install tsx
```

### 2. Configure Main App

**Option A: Using package.json scripts**

Add to root `package.json`:

```json
{
  "scripts": {
    "start:app": "npm run start:pty && concurrently \"npm run start:app:main\" \"npm run start:pty:watch\"",
    "start:pty": "./apps/wayofpi-server/start-server.ts",
    "start:app:main": "npm run electron:start",
    "start:pty:watch": "sleep 2 && npm run watch"
  }
}
```

---

## 🔧 Implementation

### Files Created

| File | Purpose |
|---|---|
| `start-server.ts` | Auto-start server |
| `auto-start-pty-server.sh` | Legacy bash alternative |
| `src/server/SessionManager.ts` | Server logic |

### Startup Flow

```
┌────────────────────────────────────────────┐
│  User Opens Way of Pi                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│  Electron Main Process Starts              │
│  (or Vite dev server)                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│  package.json: "start:pty" triggers        │
│  start-server.ts                           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│  SessionManager.ts starts on port 3333     │
│  WebSocket server initialized              │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│  PTY WebSocket server running in background│
│  PID stored in .pi/pty-server.pid          │
└────────────────────────────────────────────┘
```

---

## 🎯 Benefits

✅ **Auto-starts** with main app  
✅ **Auto-stops** when app closes  
✅ **No manual terminal** needed  
✅ **Persistent connections**  
✅ **Watch mode** for development  

---

## 🔍 Status Check

### Check if running:

```bash
cat /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.pid
ps -p $(cat /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.pid)
```

### View logs:

```bash
tail -f /home/zerwiz/CodeP/Way\ of\ pi/.pi/pty-server.log
```

---

## 🛡️ Error Handling

The server will:

- Start automatically when main app starts
- Restart if stopped accidentally
- Stop cleanly when main app closes
- Log errors to `.pi/pty-server.log`

---

## 📝 Next Steps

1. **Update root package.json** with auto-start scripts
2. **Test auto-start** - Close and reopen app
3. **Verify PID file** is created
4. **Check terminal** appears in UI

### Commands to add to package.json:

```json
{
  "scripts": {
    "start": "npm run start:app",
    "start:app": "npm run start:pty && npm run start:app:main",
    "start:pty": "tsx apps/wayofpi-server/start-server.ts",
    "start:app:main": "electron .",
    "watch": "ts-node-dev --respawn src/server/SessionManager.ts"
  }
}
```

---

## ✅ Summary

**Status:** Auto-start integration ready!  
**Next:** Update root package.json  
**Result:** PTY server starts with main app automatically! 🚀
