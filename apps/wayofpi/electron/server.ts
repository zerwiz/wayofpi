import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Start the Bun proxy server
const server = await import('../server/index.ts');
await server.initializeServer(3334, {
  targetHost: 'localhost',
  targetPort: 3333,
});

console.log('Bun proxy server running on http://localhost:3334');
