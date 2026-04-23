/**
 * Session Manager - Background server for terminal sessions
 * Implements PTY-based architecture with session persistence
 */

import net from 'net';
import WebSocket from 'ws';
import { posix_openpt, forkpty, readlink, kill } from 'node:pty';

type SocketConnection = net.Socket & { peerAddress: string };

/**
 * Terminal Session - One PTY instance per session
 */
interface TerminalSession {
  id: string;
  ptyMasterFd: number;
  ptySlaveFd: number;
  shellProcess: ReturnType<typeof forkpty>;
  buffer: string[];
  connected: boolean;
  createdAt: number;
}

/**
 * Session Manager - Background server
 * Stays alive even when all clients disconnect
 */
class SessionManager {
  private sessions = new Map<string, TerminalSession>();
  private readonly PORT = 3333; // WebSocket port
  private server: net.Server;
  private wss: WebSocket.Server;
  private screenBuffers = new Map<string, ScreenBuffer>();

  constructor() {
    // Create WebSocket server for client connections
    this.server = net.createServer();
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (socket) => {
      console.log(`Client connected from ${socket.remoteAddress}`);
      
      socket.on('message', (data, websocket) => {
        this.handleMessage(data, websocket);
      });
      
      socket.on('close', () => {
        console.log(`Client disconnected. Sessions remain active.`);
      });
    });
    
    // Start server
    this.server.listen(this.PORT, () => {
      console.log(`Terminal server listening on port ${this.PORT}`);
    });
  }

  /**
   * Create new terminal session
   */
  createSession(prompt = 'bash'): string {
    // Open PTY pair (PTY Master/Slave)
    const ptyMasterFd = posix_openpt();
    const ptySlaveFd = ptyMasterFd; // Simplified for TypeScript
    
    // Fork shell process on PTY slave
    const shellProcess = forkpty(ptySlaveFd, prompt, {
      cwd: '/home/user',
      env: process.env,
      columns: 80,
      rows: 24,
    });
    
    // Create buffer for this session
    const screenBuffer = new ScreenBuffer(80, 24);
    this.screenBuffers.set(ptyMasterFd, screenBuffer);
    
    const session: TerminalSession = {
      id: crypto.randomUUID(),
      ptyMasterFd,
      ptySlaveFd,
      shellProcess,
      buffer: [],
      connected: true,
      createdAt: Date.now(),
    };
    
    this.sessions.set(session.id, session);
    console.log(`Created new session: ${session.id}`);
    
    return session.id;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TerminalSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Handle incoming client message
   */
  handleMessage(data: string | Buffer, websocket: WebSocket): void {
    // Parse and handle command
    const sessionId = websocket.socket;
    const session = this.sessions.get(sessionId as string);
    
    if (!session) {
      websocket.send(JSON.stringify({
        error: 'Session not found',
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // Send message to PTY master (echoes to shell)
    session.ptySlaveFd.write(data);
    
    // Read PTY output
    let output = '';
    try {
      output = session.ptyMasterFd.read();
    } catch (err) {
      console.error('Error reading PTY output:', err);
    }
    
    websocket.send(JSON.stringify({
      output,
      sessionId,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Handle session creation requests
   */
  handleSessionCreate(): { session: string; output: string } {
    const sessionId = this.createSession('bash');
    const session = this.sessions.get(sessionId);
    
    return {
      session: sessionId,
      output: session?.ptyMasterFd.read() || '',
    };
  }

  /**
   * Handle window resize
   */
  handleResize(sessionId: string, newRows: number, cols: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Send window size change to shell
    const ws = new winsize({
      ws_row: newRows,
      ws_col: cols,
      ws_xpixel: 0,
      ws_ypixel: 0,
    });
    
    write(session.ptySlaveFd, '\x1b[?25 h  // Show cursor');
  }

  /**
   * Handle SIGWINCH (window resize signal)
   */
  handleSIGWINCH(sessionId: string, newRows: number, cols: number): void {
    // Program like htop/top will auto-resize based on new size
    this.handleResize(sessionId, newRows, cols);
  }

  /**
   * Handle SIGHUP (send hangup signal)
   */
  handleSIGHUP(sessionId: string): void {
    // Mask SIGHUP to keep sessions alive
    // Sessions don't die when client disconnects
  }

  /**
   * Terminate session
   */
  terminateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.sessions.delete(sessionId);
    if (shellProcess) {
      kill(shellProcess);
    }
  }
}

// Export for use
export default SessionManager;
export { TerminalSession };
