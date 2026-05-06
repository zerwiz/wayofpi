#!/usr/bin/env node
/**
 * SessionManager - Way of Pi Terminal Server
 * Handles WebSocket connections and PTY-based terminal sessions
 */

import WebSocket, { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

const PORT = Number(process.env.WOP_SERVER_PORT) || 3333;
const HOST = process.env.WOP_SERVER_HOST || 'localhost';
const MAX_HISTORY = 256;

interface Session {
  id: string;
  ws: WebSocket;
  child: ReturnType<typeof spawn> | null;
  history: string[MAX_HISTORY];
  historyIndex: number;
}

// Create a new terminal session
const createSession = (): Session => {
  const sessionId = `session_${Date.now()}`;
  
  // Create a Bash shell process
  const child = spawn('bash', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
    cwd: process.cwd(),
  });

  return {
    id: sessionId,
    ws: null! as WebSocket,
    child,
    history: new Array(MAX_HISTORY).fill(''),
    historyIndex: -1,
  };
};

// Main server setup
const sessions = new Map<string, Session>();

const wss = new WebSocketServer({ 
  port: PORT,
  host: HOST,
});

wss.on('connection', (ws: WebSocket) => {
  const session = createSession();
  sessions.set(session.id, session);
  
  console.log(`[SESSION] Connected: ${session.id}`);

  // Send welcome message
  setTimeout(() => {
    const prompt = `$\x1b[0m $ `;
    ws.send(`\x1b[?25h${prompt}`); // Show cursor
  }, 100);

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const input = data.toString().trim();
      
      if (input.startsWith('\x1b[1;3')) {
        // Skip styling codes
        return;
      }

      if (input === '') return;

      console.log(`[${session.id}] Command: ${input}`);

      // Send to shell
      session.child?.stdin.write(input + '\n');

      // Capture output
      (process.stdout as any).read();
      session.child?.stdout.read((chunk: string) => {
        if (chunk) ws.send(chunk);
      });

      // History management
      if (input.startsWith('^\x1b')) {
        // Keyboard shortcut - update history
      }
    } catch (err) {
      console.error(`[${session.id}] Error:`, err);
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log(`[SESSION] Disconnected: ${session.id}`);
    cleanup(session);
  });

  // Handle errors
  ws.on('error', (err: Error) => {
    console.error(`[${session.id}] WebSocket error:`, err.message);
  });
});

const cleanup = (session: Session) => {
  if (session.child) {
    session.child.kill();
  }
  sessions.delete(session.id);
};

// Graceful shutdown
const shutdown = () => {
  console.log('\n[SIGNAL] Shutting down gracefully...');
  for (const [, session] of sessions) {
    session.child?.kill();
  }
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Health check endpoint
const healthHandler = () => {
  const response = JSON.stringify({
    service: 'wayofpi-ui-server',
    uptime: process.uptime(),
    sessions: sessions.size,
  });
  return response;
};

wss.on('listening', () => {
  console.log(`\n=== Way of Pi Server ===`);
  console.log(`[INFO] Listening on ws://${HOST}:${PORT}/`);
  console.log(`[INFO] Health: http://${HOST}:${PORT}/api/health`);
  console.log(`[INFO] Max History: ${MAX_HISTORY} lines\n`);
});

// API health endpoint
wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[ERROR] Port ${PORT} is in use. Check existing processes.`);
    // Health check still works via HTTP server on same port
    const http = require('http');
    const httpServer = http.createServer((req, res) => {
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    httpServer.listen(PORT);
  } else {
    console.error(`[ERROR] Server error:`, err);
  }
});


