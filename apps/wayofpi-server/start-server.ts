#!/usr/bin/env -S tsx

/**
 * Auto-start PTY WebSocket Server for Way of Pi
 * 
 * This script starts when the main Electron/Vite app launches.
 * Runs in the background and persists until the app stops.
 */

import { fork, spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Configuration
const PORT = 3333;
const SESSION_PORT = 4000;
const PID_FILE = join(process.env.HOME || '', '.pi', 'pty-server.pid');
const LOG_DIR = join(process.env.HOME || '', '.pi');

// Ensure log directory exists
mkdirSync(LogDir, { recursive: true });

// Start function
export function startPTYServer() {
  console.log('[PTY Server] Starting PTY WebSocket server...');
  console.log(`[PTY Server] Port: ${PORT}`);
  
  // Write PID file
  writeFileSync(PID_FILE, String(process.pid));

  // Create server
  const server = fork(
    join(__dirname, 'src', 'server', 'SessionManager.ts'),
    ['-p', String(PORT)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        PTY_SERVER: 'true',
      },
    }
  );

  // Handle server events
  server.on('exit', (code) => {
    console.log(`[PTY Server] Server exited with code ${code}`);
    try {
      writeFileSync(PID_FILE, '');
    } catch (e) {
      // Ignore errors
    }
  });

  // Start watch mode if not in production
  if (!process.env.PRODUCTION) {
    console.log('[PTY Server] Starting watch mode...');
    execSync('sleep 2 && tsc -w && node dist/Server.js', {
      cwd: join(__dirname, 'src', 'server'),
      stdio: 'inherit',
      env: { ...process.env, PRODUCTION: 'false' },
    });
  }
}

// Start server
startPTYServer();
