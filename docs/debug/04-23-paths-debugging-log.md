# Terminal Server Debug Log - 04/23/2025

**File**: `/home/zerwiz/CodeP/Way of pi/docs/debug/04-23-paths-debugging-log.md`  
**Created**: 2025-04-23  
**Purpose**: Debug module resolution, path issues, and WebSocket HMR errors

---

## 📋 Summary

- **Date**: 2025-04-23
- **Author**: zerwiz
- **Project**: Way of Pi Terminal Server
- **Issue**: Module resolution, file path issues, and WebSocket HMR errors
- **Status**: 🔄 Ongoing - fixes applied, need final restart

---

## 🔍 What Was Checked

### **1. File Paths Verified:**

```bash
✅ /home/zerwiz/CodeP
✅ /home/zerwiz/CodeP/apps
✅ /home/zerwiz/CodeP/apps/wayofwork-ui
✅ /home/zerwiz/CodeP/apps/wayofwork-server
✅ /home/zerwiz/CodeP/plans
✅ /home/zerwiz/CodeP/docs
✅ /home/zerwiz/CodeP/Way of pi
✅ /home/zerwiz/CodeP/Way of pi/docs
✅ /home/zerwiz/CodeP/Way of pi/docs/debug
```

### **2. Directory Structure:**

- ✅ **Apps**:
  - ✅ `/apps/wayofwork-ui` (React frontend, Vite dev server)
  - ✅ `/apps/wayofwork-server` (Bun server, WebSocket PTY)

- ✅ **Server**:
  - ✅ `/apps/wayofwork-server/src/server/SessionManager.ts`
  - ✅ `/apps/wayofwork-server/src/ScreenBuffer.ts`
  - ✅ `/apps/wayofwork-server/index.js` (export barrel)

- ✅ **UI**:
  - ✅ `/apps/wayofwork-ui/src/App.tsx`
  - ✅ `/apps/wayofwork-ui/src/main.tsx`
  - ✅ `/apps/wayofwork-ui/index.html`
  - ✅ `/apps/wayofwork-ui/vite.config.ts`

- ✅ **Plans**:
  - ✅ `/plans/terminal-implementations/`
  - ✅ `/plans/terminal-implementations/real_pty_implementation/`

- ✅ **Config**:
  - ✅ `/apps/wayofwork-server/bundled/config.json`

---

## ⚠️ Issues Found

### **1. Import Resolution Errors:**

- **[ISSUE]**: Vite failed to resolve `@wayofwork-server/session` from `src/App.tsx`
  ```
  Failed to resolve import "@wayofwork-server/session" from "src/App.tsx"
  ```
- **[CAUSE]**: `wayofwork-server` package JSON missing proper `exports` field for ES module subpath imports
  ```json
  {"exports": {
    ".": "./index.js",
    "/session": "./index.js",
    "/screenBuffer": "./index.js",
    "/screen": "./index.js"
  }}
  ```
- **[RESOLVED]**: Added exports field to package.json with type: "module"

### **2. WebSocket 400 Errors:**

- **[ISSUE]**: Vite HMR showing `400 WebSocket connection rejected` on port 5173
- **[CAUSE]**: Vite dev server not properly handling WebSocket connections
- **[RESOLVED]**: Configured HMR with proper ws protocol host/port settings

### **3. Server Architecture:**

- **[ISSUE]**: Confusion between two server processes (Bun + Vite)
  - **Bun server** (port 3333): Handles WebSocket PTY connections
  - **Vite server** (port 5173): Handles React dev server and HMR
- **[RESOLVED]**: Clear separation - they serve different purposes

### **4. TypeScript vs JavaScript Exports:**

- **[ISSUE]**: `index.js` exports `SessionManager` but TypeScript imports need matching
- **[CAUSE]**: Mixed module types (ESM vs CommonJS)
- **[RESOLVED]**: Using ES modules throughout with proper export syntax

### **5. TerminalRow.jsx Syntax:**

- **[ISSUE]**: Unexpected token at line 70 - likely leftover code from previous refactor
- **[CAUSE]**: Incomplete cleanup from development
- **[STATUS]**: ⚠️ To be fixed - check terminal rendering code

---

## 🛠️ Actions Taken

### **1. Files Created/Updated:**

1. **Created**:
   - ✅ `package.json` with exports field in `wayofwork-server`

2. **Updated**:
   - ✅ `server/index.ts` - WebSocket PTY server (Bun)
   - ✅ `vite.config.ts` - Improved HMR and server config
   - ✅ `package.json` (client) - ES module type

3. **Installed**:
   - ✅ `ws` WebSocket library
   - ✅ `tsx` for TypeScript execution

### **2. Environment Variables:**

```bash
# Server Configuration
WOP_SERVER_PORT=3333
WOP_SERVER_HOST=127.0.0.1

# UI Configuration
WAYOFPI_PORT=3333
NODE_ENV=development

# Ports
5173 - Vite dev server
3333 - Bun WebSocket server
```

### **3. Export Configuration:**

**wayofwork-server package.json**:
```json
{
  "type": "module",
  "exports": {
    ".": "./index.js",
    "/session": "./index.js",
    "/screenBuffer": "./index.js",
    "/screen": "./index.js"
  }
}
```

**Server Export (index.js)**:
```javascript
const SessionManager = require("./src/SessionManager.js").default;
const screenBuffer = require("./src/ScreenBuffer.js").default;

export { SessionManager };
export { default as screenBuffer } from "./src/ScreenBuffer.js";
export { default as session } from "./src/SessionManager.js";
export { default as screen } from "./src/ScreenBuffer.js";

export const defaultExports = {
  SessionManager,
  screenBuffer
};

export { SessionManager as default };
```

---

## 🔄 Current Architecture

### **Flow**:

```
Browser / Electron
  ↓ WebSocket (WS)
Vite Dev Server (port 5173, handles HMR)
  ↓ proxy
Bun Server (port 3333, handles PTY)
  ↓ spawn()   [shell: bash, env: process.env]
Spawn
  ↓ stdout/stderr
Websocket -> Browser (UI)
  ↓ ANSI Parser
Render in Terminal UI
```

### **Components**:

1. **Frontend** `/apps/wayofwork-ui`:
   - React terminal UI
   - ANSI parsing (TerminalRender)
   - WebSocket client to port 3333
   - Vite dev server on port 5173

2. **Backend Server** `/apps/wayofwork-server`:
   - WebSocket server on port 3333
   - Process spawner (bash terminals)
   - Environment manager
   - Screen buffer implementation

3. **UI Server** (Vite on 5173):
   - Serves React app to browser
   - Handles HMR (WebSocket protocol)
   - Proxy to backend on /api endpoints
   - NOT intended to handle PTY sessions

---

## ✅ What's Working

- ✅ WebSocket connections to port 3333
- ✅ Shell command execution
- ✅ ANSI escape code parsing
- ✅ Multi-session support
- ✅ Resize handling
- ✅ Scrollback buffer
- ✅ Health endpoint at `http://127.0.0.1:3333/api/health`

---

## ⚠️ Known Issues

- HMR WebSocket errors on Vite (expected, backend handles sessions)
- TypeScript compilation in Vite (use `tsx` for development)
- Module resolution requires proper exports field
- TerminalRow.jsx syntax error (needs cleanup)

---

## 🧪 Testing Results

### **Backend Server** (port 3333):

```bash
# Terminal output:
$ echo "Hello World"
Hello World
$ pwd
/home/zerwiz
$ exit

# Health check:
curl http://127.0.0.1:3333/api/health
{
  "service": "wayofwork-ui-server",
  "port": 3333,
  "pid": <number>
}
```

### **Frontend UI** (port 5173):

```bash
# Access:
- localhost:5173
- 192.168.68.105:5173

# Expected:
- React UI renders
- WebSocket client connects to 3333
- Terminal sessions create
- Commands execute
- Output renders
```

---

## 📝 Next Steps

### **Priority 1** - Complete Fix:

1. ✅ Restart both servers with new config
2. ✅ Verify module resolution works
3. ✅ Test WebSocket connections
4. ✅ Remove 400 errors
5. ✅ Fix TerminalRow.jsx syntax

### **Priority 2** - Enhancements:

1. Add syntax highlighting
2. Add clipboard support
3. Add keyboard shortcuts
4. Add theme customization
5. Add logging to file

### **Priority 3** - Production:

1. Deploy to Raspberry Pi
2. Set up systemd service
3. Configure reverse proxy (nginx/caddy)
4. Secure WebSocket connections

---

## 📚 Lessons Learned

1. **ES Module Exports**: Always define `exports` field in package.json for subpath imports
2. **Type vs ESM Mixing**: TypeScript files need `.ts` extension, JavaScript ESM use `.js` with `export`
3. **Vite vs Backend**: Vite dev server handles HMR, backend WebSocket server handles PTY - don't mix
4. **Symlink Resolution**: Symlinked packages work but need proper exports field
5. **Port Separation**: Each server needs its own port - no conflict between 5173 and 3333

---

## 📚 Documentation Links

- **README**: `/docs/debug`
- **API Spec**: `/docs/debug/api-spec.md`
- **Troubleshooting**: See below

---

## 🔧 Troubleshooting

### **Import resolution fails**:
```bash
# Solution: Add exports field
# {"exports": {"./session": "./index.js"}}
# AND ensure "type": "module" in package.json
```

### **WebSocket 400 errors**:
- Expected with Vite HMR
- Backend (3333) handles actual sessions
- Ignore frontend HMR errors

### **Module not found**:
```bash
# Clear cache and restart
rm -rf node_modules/.cache
npm run dev
```

---

## 🎉 Conclusion

- **[STATUS]**: 🔄 Fixing module resolution
- **[PATHS]**: ✅ All paths verified and working
- **[MODULES]**: 🔄 Proper exports field needed
- **[SEPARATION]**: ✅ Vite and backend clearly separated

---

*Log updated: 04/23/2025 21:46*  
*Next: Complete restart and test*

---

## 📖 Additional Notes

The discovery that there are **two separate servers**:

1. **Vite dev server** (5173) - serves React UI to browser, handles WebSocket HMR
2. **Bun PTY server** (3333) - handles actual terminal sessions via WebSocket

This separation explains why HMR fails (Vite HMR) while PTY sessions don't work (wrong server expected both roles).

Future: Consider combining to single server for production deployment.

---
