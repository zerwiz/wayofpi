import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

const PORT = Number(process.env.WOP_SERVER_PORT) || 3333;
const HOST = process.env.WOP_SERVER_HOST || '127.0.0.1';

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      service: 'wayofpi-ui-server',
      port: PORT,
      pid: process.pid,
    }, null, 2));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const wss = new WebSocketServer({ 
  server: httpServer,
  path: '/api/session',
});

const terminals = new Map<string, ReturnType<typeof spawn> | null>();

httpServer.listen(PORT, HOST, () => {
  console.log(`[Server] Running on ws://${HOST}:${PORT}/api/session`);
  console.log(`[Server] Health: http://${HOST}:${PORT}/api/health`);
  console.log(`[Server] PID: ${process.pid}\n`);
});

function spawnShell() {
  return spawn('bash', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });
}

wss.on('connection', async (ws) => {
  const sessionId = Date.now().toString().slice(-6);
  const shell = spawnShell();
  terminals.set(sessionId, shell);

  setTimeout(() => {
    const prompt = `$\x1b[0m $ `;
    ws.send(prompt + '\n');
  }, 100);

  ws.on('message', (data: Buffer) => {
    let input = data.toString().trim();
    if (input.startsWith('\x1b[')) return;
    if (input) {
      console.log(`[${sessionId}] ${input}`);
      shell.stdin?.write(input + '\n');
    }
  });

  shell.stdout.on('data', (chunk: Buffer) => {
    ws.send(chunk.toString());
  });

  shell.stderr.on('data', (chunk: Buffer) => {
    ws.send(chunk.toString());
  });

  ws.on('close', () => {
    console.log(`[${sessionId}] Disconnected`);
    terminals.delete(sessionId);
    shell.kill();
  });
});

process.on('SIGINT', signal => {
  console.log(`\n[SIGNAL] Shutdown requested (${signal})`);
  for (const shell of terminals.values()) shell?.kill();
  httpServer.close(() => process.exit(0));
});
