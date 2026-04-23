# Electron Start Configuration Debug Log

## Overview

This document tracks the development of the Way of Pi Electron desktop application startup configuration.

## Configuration Progress

### ✅ Completed Changes

1. **Script Renaming**
   - Renamed `start-wayofpi-ui.sh` → `start-wayofpi.sh`
   - Added Electron launch as default behavior
   - Modified to use `WOP_USE_ELECTRON=1` by default (changed from 0)
   - Updated comments to reflect new default behavior

2. **Script Startup Mode**
   - Script now launches Electron desktop window by default
   - Same full stack as `./start-full-system.sh` or `just wayofpi-full`
   - Vite → Bun proxy configuration preserved for `/api`, `/ws`, `/api/manifest`, `/ws/terminal`

3. **Server Module Migration**
   - Converted `SessionManager.js` from CommonJS (`module.exports`) to ES modules (`export default`)
   - Converted `ScreenBuffer.js` from CommonJS to ES modules
   - Created barrel export files for module resolution

### ⚠️ Remaining Issues

1. **Module Resolution**
   - Vite cannot resolve `@wayofpi-server/session` import
   - Server module in `node_modules/@wayofpi-server` may not be properly linked
   - Missing `package.json` exports field or symlink configuration

2. **JSX Loader Issue**
   - File: `src/logs/TerminalInput.js`
   - Contains JSX syntax but has `.js` extension
   - Vite/esbuild expects `.jsx` extension for JSX files
   - Error: "The JSX syntax extension is not currently enabled"

3. **TerminalRow.js Missing**
   - Import: `export { TerminalRow } from './TerminalRow.js';`
   - File doesn't exist at expected path

## Current Status

- **Electron Launch**: ✅ Working (default mode)
- **Vite Server**: ✅ Starts on port 5173
- **Bun API Server**: ✅ Starts on port 3333
- **Module Imports**: ❌ Failing for `@wayofpi-server/session`
- **JSX Files**: ❌ Failing due to extension mismatch

## Known Configuration

### Environment Variables

- `WOP_USE_ELECTRON=1` - Enable Electron window (now default)
- `WOP_SERVER_PORT=3333` - Bun API/WebSocket port
- `NODE_ENV=development` - Vite dev mode

### Scripts

```bash
# Main script (renamed from start-wayofpi-ui.sh)
./start-wayofpi.sh

# Full system (same as before)
just wayofpi-full

# Alternative: start-full-system.sh
```

## Files Modified

- `start-wayofpi.sh` - Main startup script
- `start-wayofpi-debug.sh` - Debug variant
- `wayofpi-server/package.json` - Updated for ES modules
- `wayofpi-server/src/SessionManager.js` - Converted to ES modules
- `wayofpi-server/src/ScreenBuffer.js` - Converted to ES modules
- `wayofpi-ui/package.json` - Updated dependencies (removed problematic exports field)

## Next Steps

1. Fix module resolution by:
   - Properly linking `@wayofpi-server` in `node_modules`
   - Adding exports field to `wayofpi-ui/package.json`
   - Or using absolute path imports

2. Fix JSX files:
   - Rename `TerminalInput.js` → `TerminalInput.jsx`
   - Check for missing `TerminalRow.js`
   - Update imports in `src/logs/index.js`

## Debug Commands

```bash
# Start with debug mode
just debug-full

# Start with Electron (new default)
./start-wayofpi.sh

# Check module resolution
cd apps/wayofpi-ui && npm list @wayofpi-server

# Check file extensions
ls -la src/logs/*.js src/logs/*.jsx
```

## Notes

- The server module uses ES module syntax now (`export default`)
- Vite requires `.jsx` extension for JSX files with esbuild
- The Electron window launches before the Vite UI can build
- This is a development-only configuration; production build uses `electron:prod`

---

