#!/usr/bin/env tsx

/**
 * Vite WebSocket Server with PTY Integration
 * 
 * This server serves the Vite dev server AND auto-starts the PTY server.
 */

import { createServer } from 'vite';
import { fork } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type Server from 'koa';

// __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 4545;
const PTY_PORT = 3333;

// Start PTY server in background
console.log('[Vite Server] Starting PTY server...');

// Fork PTY server in background
const ptyProc = fork('ts-node apps/wayofpi-server/src/server/SessionManager.ts', [
  '-p', String(PTY_PORT),
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PRODUCTION: 'false',
  },
});

console.log(`[Vite Server] PTY server started on port ${PTY_PORT}`);
console.log('[Vite Server] Main server starting...');

let viteServer: Server;

async function startServer() {
  viteServer = await createServer({
    appType:'spa',
  });

  // Add Vite middleware for file serving
  viteServer.middlewares.use(async (req, res, next) => {
    const url = `http://localhost:${PORT}${req.url || ''}`;
    if (req.url?.endsWith('.html')) {
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Way of Pi Terminal</title></head>
        <body style="display:flex;gap:10px">
          <div style="width:100%;height:400px;background:#1e1e1e;overflow:hidden">
            <iframe src="${url}" style="width:100%;height:100%;border:none"></iframe>
          </div>
          <iframe 
            src="ws://localhost:${PTY_PORT}/websocket" 
            style="flex:1;resize:both;border:none"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-top-navigation"
          ></iframe>
        </body>
        </html>
      `);
    }
    next();
  });

  // Add WebSocket proxy
  viteServer.middlewares.use(async (req, res, next) => {
    if (req.url?.startsWith('/ws')) {
      return; // Let main WebSocket handler deal with it
    }
    next();
  });

  await viteServer.listen(PORT, '0.0.0.0');
  console.log(`[Vite Server] Vite dev server running at http://localhost:${PORT}`);
  console.log(`[Vite Server] PTY WebSocket at ws://localhost:${PTY_PORT}/websocket`);
}

startServer().catch((err) => {
  console.error('[Vite Server] Failed to start:', err);
  ptyProc.kill();
  process.exit(1);
});
