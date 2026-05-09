# Pi Integration in Docker - Production Plan

## Overview
Integrate `pi` (Pi Coding Agent from `www.pi.dev`) into the Way of Pi Docker setup.
Install via `npm install -g @mariozechner/pi-coding-agent` and run as non-root user.

## 1. Pi Installation Methods

### Method 1: NPM Global (Recommended)
```bash
# Install Pi globally
npm install -g @mariozechner/pi-coding-agent

# Verify installation
pi --version
```

### Method 2: Bun (Alternative)
```bash
# Install via bun
bun add -g @mariozechner/pi-coding-agent

# Or run directly
bunx @mariozechner/pi-coding-agent
```

### Method 3: npx (One-shot)
```bash
npx @mariozechner/pi-coding-agent
```

## 2. Dockerfile Setup (Non-Root User)

### Base Dockerfile with Pi
```dockerfile
# Use oven/bun as base (supports npm + bun)
FROM oven/bun:latest

# Create non-root user
RUN groupadd -r -g 1001 piuser && \
    useradd -r -u 1001 -g piuser -m -s /bin/bash piuser

# Set working directory
WORKDIR /app

# Install Pi globally (as root first)
RUN npm install -g @mariozechner/pi-coding-agent

# Switch to non-root user
USER piuser

# Set up workspace directory
RUN mkdir -p /home/piuser/workspace && \
    chown -R piuser:piuser /home/piuser/workspace

WORKDIR /home/piuser/workspace

# Environment variables
ENV NODE_ENV=production
ENV PI_HOME=/home/piuser/.pi
ENV PI_AGENT_DIR=/home/piuser/.pi/agent

# Expose ports
EXPOSE 3333

# Run as non-root
CMD ["pi", "--help"]
```

### Complete Way of Pi + Pi Dockerfile
```dockerfile
# Build stage
FROM oven/bun:latest as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY apps/wayofwork-ui/package.json ./apps/wayofwork-ui/

# Install dependencies
RUN bun install

# Copy source
COPY . .

# Build UI
WORKDIR /app/apps/wayofwork-ui
RUN bun run build

# Production stage
FROM oven/bun:latest

# Create non-root user
RUN groupadd -r -g 1001 piuser && \
    useradd -r -u 1001 -g piuser -m -s /bin/bash piuser

WORKDIR /app

# Install Pi globally
RUN npm install -g @mariozechner/pi-coding-agent

# Copy built artifacts from builder
COPY --from=builder /app/apps/wayofwork-ui/dist ./apps/wayofwork-ui/dist
COPY --from=builder /app/apps/wayofwork-ui/server ./apps/wayofwork-ui/server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/wayofwork-ui/package.json ./apps/wayofwork-ui/package.json

# Switch to non-root user
USER piuser

# Set up directories
RUN mkdir -p /home/piuser/workspace && \
    mkdir -p /home/piuser/.pi/agent && \
    chown -R piuser:piuser /home/piuser/

WORKDIR /home/piuser/workspace

# Environment
ENV NODE_ENV=production
ENV WOP_SERVER_PORT=3333
ENV PI_HOME=/home/piuser/.pi

EXPOSE 3333

# Run server (not as root)
CMD ["bun", "run", "apps/wayofwork-ui/server/index.ts"]
```

## 3. Verify Pi Installation in Docker

### Test Dockerfile
```bash
# Build image
docker build -t wayofpi-with-pi .

# Run container
docker run --rm -it wayofpi-with-pi pi --version

# Check Pi is installed
docker run --rm -it wayofpi-with-pi which pi
```

### Verify Non-Root
```bash
# Run as non-root
docker run --rm -it --user 1001:1001 wayofpi-with-pi pi --help

# Check user
docker run --rm -it wayofpi-with-pi whoami
# Should output: piuser
```

## 4. Integration with Way of Pi

### Pi as Extension/Backend
Pi can be used in two ways:

#### Option A: Pi as Separate Service
```yaml
# docker-compose.yml
version: '3.8'

services:
  wayofpi:
    build: .
    ports:
      - "3333:3333"
    environment:
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
      - pi

  pi:
    image: mariozechner/pi-coding-agent:latest
    volumes:
      - ./workspace:/workspace
    user: "1001:1001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    user: "1001:1001"

volumes:
  ollama_data:
```

#### Option B: Pi Inside Way of Pi Container
```dockerfile
# Pi is installed in the same container
# Access via extensions: .pi/extensions/pi-integration.ts

FROM oven/bun:latest

# Install Pi
RUN npm install -g @mariozechner/pi-coding-agent

# Create non-root user
RUN useradd -m -s /bin/bash piuser

USER piuser
WORKDIR /home/piuser

CMD ["pi"]
```

## 5. Pi + Work Leader System Integration

### How Workers Use Pi
```
Worker Portal → "Ask Pi a question"
  → Pi runs in Docker container
  → Answers via WhatsApp/Worker Portal

Example:
  Worker: "Pi, explain A-101 foundation blueprint"
  Pi: "The A-101 blueprint shows..."
```

### Pi as Documentation Assistant
```typescript
// .pi/extensions/pi-docs.ts
import { registerTool } from "@mariozechner/pi-coding-agent";

export function activate() {
  registerTool({
    name: "explain_drawing",
    description: "Explain construction drawings to workers",
    async execute(params) {
      // Read PDF/blueprint
      const content = await readFile(params.drawingPath);
      // Send to Pi for explanation
      return await pi.ask(`Explain this drawing: ${content}`);
    }
  });
}
```

### Pi + Automated Workflows
```
Pi monitors workspace for new files:
  1. Leader uploads PRD_v2.pdf
  2. Pi detects new file (file watcher)
  3. Pi generates summary: "PRD_v2 Summary: ..."
  4. Pi sends summary to workers via WhatsApp
```

## 6. Security (Non-Root)

### Why Non-Root?
- ✅ Prevents container breakout
- ✅ Limits damage if container is compromised
- ✅ Follows Docker best practices
- ✅ Pi doesn't need root privileges

### User Setup in Dockerfile
```dockerfile
# Create user with specific UID/GID
RUN groupadd -r -g 1001 piuser && \
    useradd -r -u 1001 -g piuser -m -s /bin/bash piuser

# Set ownership
RUN chown -R piuser:piuser /app /home/piuser

# Switch to user
USER piuser

# Verify (optional)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD pi --version || exit 1
```

## 7. One-Command Install with Pi

### Updated install.sh (Unix)
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "   Way of Pi + Pi Installer (Unix)   "
echo "=========================================="

OS="$(uname -s)"
ARCH="$(uname -m)"

# --- Install Pi ---
if ! command -v pi &> /dev/null; then
  echo "Installing Pi Coding Agent..."
  npm install -g @mariozechner/pi-coding-agent
else
  echo "Pi is already installed."
fi

# --- Verify Installation ---
pi --version

# --- Install Way of Pi ---
echo "Setting up Way of Pi..."

# ... rest of Way of Pi setup
```

### Updated install.ps1 (Windows)
```powershell
# Install Pi
if (-not (Get-Command pi -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Pi Coding Agent..."
  npm install -g @mariozechner/pi-coding-agent
} else {
  Write-Host "Pi is already installed."
}

# Verify
pi --version
```

## 8. Multi-Tenancy + Pi

### Isolated Pi Instances per Tenant
```typescript
// server/pi-manager.ts
import { spawn } from "child_process";

export function createPiInstance(tenantId: string) {
  const piHome = `/home/piuser/.pi/tenants/${tenantId}`;
  const workspace = `/home/piuser/workspace/${tenantId}`;
  
  return spawn("pi", ["--pi-home", piHome], {
    cwd: workspace,
    env: {
      ...process.env,
      PI_HOME: piHome,
    },
    uid: 1001, // Run as piuser
    gid: 1001,
  });
}
```

### Tenant-Specific Pi Config
```
.pi/tenants/
  ├── tenant-001/
  │   ├── agent/
  │   │   └── AGENTS.md
  │   └── settings.json
  ├── tenant-002/
  │   └── ...
  └── default/
      └── ...
```

## 9. Production Deployment

### Full docker-compose.yml
```yaml
version: '3.8'

services:
  wayofpi:
    build:
      context: .
      dockerfile: apps/wayofwork-ui/Dockerfile
    ports:
      - "3333:3333"
    volumes:
      - ./data/workspace:/home/piuser/workspace
      - ./data/pi:/home/piuser/.pi
    environment:
      - NODE_ENV=production
      - WOP_SERVER_PORT=3333
      - WOP_AUTH_SECRET=${WOP_AUTH_SECRET}
      - OLLAMA_HOST=http://ollama:11434
    user: "1001:1001"
    depends_on:
      - ollama
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
      - ./data/models:/models
    user: "1001:1001"
    restart: unless-stopped

  # Optional: Separate Pi service for advanced usage
  pi:
    image: mariozechner/pi-coding-agent:latest
    volumes:
      - ./data/pi:/home/piuser/.pi
      - ./data/workspace:/workspace
    user: "1001:1001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped

volumes:
  ollama_data:
  wayofpi_data:
```

## 10. Quick Start for Non-Technical Users

### One Command (Unix/macOS)
```bash
curl -fsSL https://raw.githubusercontent.com/USER/REPO/main/install-with-pi.sh | bash
```

What it does:
1. ✅ Installs Node.js + npm (if missing)
2. ✅ Installs Pi: `npm install -g @mariozechner/pi-coding-agent`
3. ✅ Installs Way of Pi (Docker or native)
4. ✅ Sets up non-root user
5. ✅ Pulls Ollama + Qwen model
6. ✅ Launches everything

### One Command (Windows)
```powershell
iwr -useb https://raw.githubusercontent.com/USER/REPO/main/install-with-pi.ps1 | iex
```

## 11. Verification Checklist

- [ ] Pi installed via `npm install -g @mariozechner/pi-coding-agent`
- [ ] Docker runs as non-root user (UID 1001)
- [ ] Pi accessible from Way of Pi extensions
- [ ] Multi-tenancy isolates Pi instances
- [ ] Workers can query Pi via Worker Portal
- [ ] Pi can read construction drawings (PDFs, CAD)
- [ ] Ollama runs as non-root
- [ ] All services restart automatically

## 12. Next Steps

1. **Update Dockerfile:** Add Pi installation + non-root user
2. **Update docker-compose.yml:** Add Pi service + user mappings
3. **Create install-with-pi.sh:** Combined installer script
4. **Test:** Fresh VM install with one command
5. **Document:** Update `docs/WOP_PI_INTEGRATION.md`

---

**Status:** 📝 Planning complete, ready for implementation

**Key Points:**
- ✅ Use `npm install -g @mariozechner/pi-coding-agent` (from `www.pi.dev`)
- ✅ Run as non-root (UID 1001, GID 1001)
- ✅ Integrate with Work Leader System (workers query Pi)
- ✅ Support construction drawings (PDF, CAD)
- ✅ One-command install for non-technical users
