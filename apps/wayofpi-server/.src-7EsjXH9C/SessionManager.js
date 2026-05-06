/**
 * Session Manager - Background server for terminal sessions
 * Implements PTY-based architecture with session persistence
 */
import net from 'net';
import { posix_openpt, forkpty, kill } from 'node:pty';
import WebSocket from 'ws';

const PORT = 3333;

class SessionManager {
  constructor() {
    this.server = net.createServer();
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws) => {
      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('close', () => console.log('Client disconnected'));
    });
    
    this.server.listen(PORT, () => {
      console.log(`Terminal server listening on port ${PORT}`);
    });
  }

  handleMessage(ws, data) {
    const output = this.server.emit('message', ws, data);
    if (output) ws.send(JSON.stringify({ output }));
  }

  createSession() {
    return this.server.emit('session', crypto.randomUUID());
  }
}

export default SessionManager;
