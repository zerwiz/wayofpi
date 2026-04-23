const { WebSocketServer } = require('ws');
const fs = require('fs');

class PTYManager {
  constructor(port = 3333) {
    this.server = new WebSocketServer({ port });
  }
  
  handle() {
    return new Promise((resolve) => {
      this.server.on('listening', () => {
        console.log('PTY server listening on port 3333');
        // Create a simple echo client
        const ws = new WebSocket('ws://localhost:3333');
        ws.on('open', () => {
          ws.send('ping');
          ws.on('message', data => {
            console.log('Received:', data.toString());
          });
        });
        resolve();
      }).on('error', console.error);
    });
  }
}

PTYManager.prototype.handle = (() => {
  console.log('PTY server handling connections...');
})();

PTYManager.prototype.close = ((self) => () => {
  self.server.close();
})({});

PTYManager;

(async () => {
  const pty = new PTYManager(3333);
  await pty.handle();
  process.on('SIGTERM',pty.close);
  process.on('SIGINT',pty.close);
  console.log('PTY server running...');
})().catch(console.error);
