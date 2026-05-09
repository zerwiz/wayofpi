// Barrel export file for @wayofpi-server module resolution
// Supports: @wayofpi-server, @wayofpi-server/session, @wayofpi-server/screenBuffer

import SessionManager from "./src/SessionManager.js";
import screenBuffer from "./src/ScreenBuffer.js";

// Export with package exports map for subpath imports
export { SessionManager };
export { screenBuffer };
export { default as session } from "./src/SessionManager.js";
export { default as screen } from "./src/ScreenBuffer.js";

// Also export at root for direct imports
export const defaultExports = {
  SessionManager,
  screenBuffer
};

// Main export for @wayofpi-server
export { SessionManager as default };
