# [WOP-003] Fix Electron White Screen, WebSocket ECONNRESET & ENOENT Runtime Errors

> 📋 **Task checkboxes migrated to `WOP-ALL-TODO.md`: Phase 1 (Runtime Stability).** Update checkboxes there, not here.

## Problem

Two runtime errors prevent the app from working in dev mode, plus a persistent white screen in Electron:

1. **Electron White Screen**: The Electron window loads `http://127.0.0.1:5173` (Vite dev server) but shows only a blank white page. No React UI renders.

2. **WebSocket ECONNRESET**: Client connects to `ws://localhost:5173/ws`, Vite proxies to Bun `:3333`, but Bun resets the connection during the WebSocket upgrade. Vite logs `[vite] ws proxy socket error: Error: read ECONNRESET`.

3. **ENOENT pi binary**: Sending a chat message triggers `Bun.spawn` which fails with ENOENT. Error surfaces as a dismissable dialog: *"Failed to spawn Pi process: ENOENT: no such file or directory, posix_spawn '/home/zerwiz/CodeP/Way of pi/apps/wayofpi-ui/node_modules/.bin/pi'"*. Chat is non-functional.

## Root Cause Analysis

### White Screen — Preload Script ESM Syntax Error

**Root Cause**: Electron 35 with `sandbox: true` requires preload scripts to use CommonJS (`require()`). The preload script at `electron/preload.mjs` used ESM syntax:
```javascript
import { contextBridge, ipcRenderer } from "electron";
```
This throws `SyntaxError: Cannot use import statement outside a module` in the sandboxed context. The error is silent — Electron doesn't show a dialog or error page — the window stays white.

**Fix**: 
1. Renamed `preload.mjs` → `preload.cjs`
2. Replaced `import` with `require()`:
   ```javascript
   const { contextBridge, ipcRenderer } = require("electron");
   ```
3. Updated reference in `electron-main.mjs` from `preload.mjs` to `preload.cjs`

**CDP confirmation**: Using `--remote-debugging-port`, the error was captured in the renderer console. After a correct Vite connection and the React DevTools message, the page title was "Way of Pi" and the preload error was the only diagnostic.

### ENOENT — pi binary symlink didn't exist before `bun install`

**Discovery**: The error path is `node_modules/.bin/pi` → `../@mariozechner/pi-coding-agent/dist/cli.js`. This symlink is created by `bun install`. If the user runs `start-wayofpi.sh` (or the Electron app auto-starts) **before** `bun install` completes, the symlink doesn't exist yet and `Bun.spawn` fails with ENOENT.

The symlink chain:
1. `node_modules/.bin/pi` → `../@mariozechner/pi-coding-agent/dist/cli.js`
2. `dist/cli.js` has shebang `#!/usr/bin/env node`, is executable (755)
3. `resolvePiBinaryPath()` in `server/pi-binary.ts` finds this via `Bun.which("pi")` (Bun auto-adds `node_modules/.bin` to PATH)

**Why it fails**: Only because `bun install` hasn't run yet. After `bun install`, the symlink exists and `Bun.spawn` can follow the shebang correctly.

**Secondary issue (already partially fixed)**: Previous version used `realpathSync` to resolve the symlink to `dist/cli.js`, then tried to prepend `/usr/bin/node` to spawn args — that caused ENOENT on `/usr/bin/node` itself. This was addressed in the current code which returns the symlink path as-is.

### WebSocket ECONNRESET — Unhandled errors in WebSocket handlers

**Discovery**: The `WebSocket.open` and `WebSocket.message` handlers in `server/index.ts` had NO try/catch. If any code in these handlers throws (e.g., `applyLeadFromCache()`, workspace index access, model resolution), Bun closes the WebSocket abruptly with ECONNRESET from Vite's proxy perspective.

**React Strict Mode**: The console error "WebSocket is closed before the connection is established" fires during React's `commitHookEffectListUnmount` phase — caused by React 18+ Strict Mode double-invoking effects. The first effect creates a WebSocket, cleanup closes it (before `onopen` fires), second effect creates another. With CONNECTING-state WebSockets, `.close()` triggers this error.

## Status

### Fixed ✅
1. **WebSocket `open` handler**: Wrapped in try/catch — logs errors and closes gracefully with code 1011
2. **WebSocket `message` handler**: Wrapped in try/catch — returns structured error messages to client
3. **React Strict Mode cleanup**: Only closes WebSocket if in OPEN state (not CONNECTING), preventing "closed before connection established" error in console
4. **Node binary resolution**: `resolvePiBinaryPath()` no longer calls `realpathSync` — returns symlink path as-is so Bun.spawn uses the shebang directly
5. **PI cwd ENOENT**: `getPrimaryWorkspacePath("default")` appended `/default` to the base workspace path, creating a non-existent cwd (`/home/zerwiz/CodeP/Way of pi/default/default`). Bun's `posix_spawn` fails with ENOENT when cwd doesn't exist, even for absolute binary paths. Fixed by returning `baseWorkspace` directly for the default tenant — subdirectory isolation only applies to non-default tenants.

### Fixed ✅

6. **White screen in Electron**: ⚠️ Preload fix applied (`preload.mjs` → `preload.cjs`, switched `import` → `require()`) but white screen persists. Preload error is confirmed gone (no more `SyntaxError` in CDP console), React DevTools message appears, Vite connects. The remaining issue after preload fix needs further investigation.

### Still Broken ❌

7. **White screen persists after preload fix**: After fixing the preload ESM issue, the window still shows white. CDP debugging shows:
   - Vite connects successfully ✅
   - No preload errors ✅  
   - React DevTools message appears (React loaded) ✅
   - `document.getElementById("root")` has no children ❌
   - No runtime exception captured via CDP ❓
   
   **Hypotheses to investigate**:
   - **Timing**: Electron might evaluate `document.getElementById("root")` before React finishes rendering. Chrome headless `--dump-dom` shows full content — suggesting it waits for async rendering.
   - **CSS/overflow-hidden**: `body class="m-0 overflow-hidden"` + empty/failed React render = white page.
   - **Runtime error caught by React error boundary**: If a component throws during render, React might render nothing visible.
   - **Wrong route/page**: User suggests "migher be wrong page showing on login" — maybe the app renders a mostly-white login page component.
   
   **Next step**: Open Electron DevTools (Ctrl+Shift+I) and check Console for red errors. If no console errors, check Elements tab to see what's inside `#root`.

8. **Chat not working**: User reports "chat not working". The ENOENT error dialog prevents chat from functioning. Even if pi binary resolves, the chat initialization flow may have other issues (WebSocket, auth, etc.).

## Success Criteria

- [x] WebSocket connection succeeds without ECONNRESET
- [x] `Bun.spawn` for Pi JSON chat works (confirmed from CLI) — when `node_modules/.bin/pi` exists
- [ ] Electron app renders React UI (no white screen)
- [ ] Chat functionality works end-to-end
- [ ] App works on first clone (no `bun install` dependency for critical path)
- [ ] Dismissable ENOENT dialog is not shown after `bun install`

## Proposed Solution

### For White Screen (Remaining)
1. **Short-term**: Open Electron DevTools (Ctrl+Shift+I) → Console tab → look for red errors
2. **If no errors**: Check Elements tab → `#root` content. If empty, add `console.log` in `App.tsx` render to confirm React mounts
3. **If React mounts but white**: Check for `overflow-hidden` CSS on `<body>` with empty content area
4. **If login page shows**: Check `window.location.pathname` at app start — Electron might be loading a different URL than expected
5. **Add error boundary**: Wrap `App` in `main.tsx` with a React error boundary that logs to console

### For ENOENT Timing
1. In `resolvePiBinaryPath()`, after checking `Bun.which("pi")`, add fallback to globally installed pi via `Bun.which("pi")` with enriched PATH (like `prependPathHintsForPiLookup` already does)
2. Ensure `node_modules/.bin/pi` check waits for installation — or skip it until `bun install` is confirmed

### For Overall Robustness
1. Add health check endpoint `/api/diagnostics/pi` that reports whether pi is resolvable
2. Show a more informative error in the dialog: "Pi binary not found. Run `bun install` in the app directory."

## Files Changed

- `apps/wayofpi-ui/server/index.ts` — try/catch on WebSocket open + message handlers ✅
- `apps/wayofpi-ui/server/pi-json-mode-chat.ts` — improved node resolution + spawn error handling ✅
- `apps/wayofpi-ui/server/pi-binary.ts` — removed realpathSync, returns symlink path as-is ✅
- `apps/wayofpi-ui/src/hooks/useWayOfPiSession.ts` — cleanup only closes OPEN WebSockets ✅
- `apps/wayofpi-ui/electron/electron-main.mjs` — updated preload path reference ✅
- `apps/wayofpi-ui/electron/preload.mjs` → `preload.cjs` — renamed & switched to CommonJS ✅
