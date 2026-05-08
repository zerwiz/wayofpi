# Hosting Way of Pi: Local & Remote Deployment Guide

This document outlines the recommended strategies for hosting the Way of Pi system locally and exposing it to external clients or team members. It covers the server requirements, containerization with Docker, secure tunneling via ngrok, and Virtual Machine (VM) deployments.

## 1. System Server Requirements
Way of Pi operates a split architecture:
- **Backend API (Bun):** Runs on port `3333` by default.
- **Frontend UI (Vite/React):** Runs on port `5173` by default (when not running the compiled desktop app).

When deploying for others to test:
- The system uses `start-wayofpi.sh --web` to launch both servers.
- Ensure that firewall rules on the host machine allow inbound traffic on these ports if accessing via a Local Area Network (LAN).

## 2. Docker Containerization (Recommended for Multi-Tenancy)
Docker is the best approach if you want to spin up isolated, contained environments for different clients or team members on the same machine.

### Strategy:
1. **Dockerfile:** Create a Dockerfile that packages Bun, Node.js, and the Way of Pi source code.
2. **Docker Compose:** Use `docker-compose.yml` to define multiple services, where each service represents a client's isolated Way of Pi instance.
3. **Port Mapping:** Map host ports to container ports.
   - Client A: `http://localhost:8001` -> Maps to container's `5173`.
   - Client B: `http://localhost:8002` -> Maps to container's `5173`.

### Example Concept (`docker-compose.yml`):
```yaml
version: '3.8'
services:
  client-a-wayofpi:
    build: .
    ports:
      - "8001:5173" # UI
      - "9001:3333" # API
    environment:
      - WOP_WORKSPACE=/app
      - NODE_ENV=production
    volumes:
      - ./client-a-data:/app/data

  client-b-wayofpi:
    build: .
    ports:
      - "8002:5173"
      - "9002:3333"
    environment:
      - WOP_WORKSPACE=/app
      - NODE_ENV=production
    volumes:
      - ./client-b-data:/app/data
```
*Note: This ensures complete data separation via volumes while reusing the same system image.*

## 3. Exposing Locally Hosted Systems via ngrok
To let external users (clients/team members not on your WiFi) test the system hosted at your home, **ngrok** is the easiest and most secure method to create a temporary public tunnel without opening router ports.

### Setup:
1. Start the Way of Pi server: `./start-wayofpi.sh --web`
2. Start an ngrok tunnel pointing to the frontend port (`5173`):
   ```bash
   ngrok http 5173
   ```
3. Share the generated HTTPS URL (e.g., `https://a1b2c3d4.ngrok-free.app`) with your client.
4. **Important:** If your frontend calls the backend explicitly via `localhost:3333`, you may need to configure the UI's API endpoint (often via Vite proxies or `.env` variables) to route requests correctly through the single ngrok domain, or run a second tunnel for the backend if split routing is required.

## 4. Virtual Machines (VMs)
If you require strict OS-level isolation (e.g., testing native Electron capabilities, system-level file interactions, or isolating potentially unsafe AI operations), Virtual Machines are the way to go.

### Tools:
- **Proxmox VE:** Ideal for a dedicated home server. You can quickly clone lightweight Linux containers (LXC) or full VMs for each client.
- **Hyper-V / VirtualBox:** Ideal for running on a Windows host machine.

### Workflow:
1. Create a "Golden Image" Ubuntu VM with Bun, Node, and Way of Pi pre-installed.
2. Clone the VM for "Client X".
3. Assign a static LAN IP to the cloned VM.
4. Start `./start-wayofpi.sh --web` on boot using systemd.
5. Use a Reverse Proxy (like Nginx Proxy Manager or Cloudflare Tunnels) on your main network router to map domains (e.g., `clientx.yourdomain.com`) to the specific VM's internal IP.

## Conclusion
- **For quick, isolated instances:** Use **Docker**. It is lightweight and perfect for running 5-10 separate instances on a single machine.
- **For remote sharing:** Use **ngrok** (or Cloudflare Tunnels) to safely expose local Docker containers or raw processes to the internet.
- **For OS-level security:** Use **VMs** (Proxmox/Hyper-V) when you need complete isolation and native environment testing.