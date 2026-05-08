# URGENT: Client Demo Deployment Guide

## 🚨 CRITICAL STATUS

**Priority: HIGHEST** - This deployment is needed **ASAP** for client demonstrations and user testing.

**Why This Matters:**
- Clients need to **log in** and **try out the app**
- Stakeholder reviews require a **live demo environment**
- User feedback must be collected **before production**
- This is the **gateway to paid contracts**

---

## 🎯 Deployment Goals

| Goal | Timeline |
|------|----------|
| **Docker Deployment** | < 30 minutes |
| **VMS Deployment** | < 60 minutes |
| **Client Access Setup** | < 10 minutes |
| **Demo Testing** | < 5 minutes |

---

## 🔧 Option A: Docker Deployment (RECOMMENDED)

### Prerequisites
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
docker compose up -d
```

### Quick Start Commands
```bash
# 1. Start the demo environment
./start-wayofpi-electron.sh

# 2. Or use docker compose
docker compose up -d

# 3. Access via ngrok for external client access
ngrok http 3333 --authtoken <your-token>
```

### Demo Configuration
```bash
# Create demo-specific environment
cp .env.example .env.demo
echo "WOP_DEV_MODE=true" >> .env.demo
echo "INSTANCE_ID=client-demo-001" >> .env.demo
echo "PORT=3333" >> .env.demo
```

### Docker Compose Setup
```yaml
version: '3.8'

services:
  wayofpi:
    image: mariozechner/wayofpi:latest
    ports:
      - "3333:3333"
    environment:
      - WOP_DEV_MODE=true
      - INSTANCE_ID=client-demo
      - DB_FILE=/app/.pi/db/demo.sqlite
    volumes:
      - ./demo-data:/app/.pi/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

---

## 🖥️ Option B: VMS Deployment

### DigitalOcean Droplet Setup ($5/mo)
```bash
# 1. Create droplet (Ubuntu 22.04, $5/mo)
# 2. SSH in and install Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# 3. Clone repository
git clone https://github.com/your-repo/wayofpi.git
cd wayofpi

# 4. Setup for demo
cp .env.example .env
echo "INSTANCE_ID=client-demo-vm" >> .env
echo "PORT=3333" >> .env

# 5. Start server
bun run dev
```

### VMS Networking Setup
```bash
# Configure firewall (only port 80/443)
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/wayofpi
```

---

## 🎨 Option C: ngrok Tunnel (Quick Demo)

### Free Tier Setup
```bash
# 1. Get ngrok token
# Go to https://ngrok.com/signup

# 2. Start tunnel
ngrok http 3333

# 3. Share URL with clients
# Example: https://random-id.ngrok-free.app
```

### Paid Tier (Recommended for Production Demos)
```bash
# Upgrade to ngrok Cloud for:
# - Custom domain
# - SSL certificates
# - No bandwidth limits
# - Session persistence

# Setup:
ngrok config add-authtoken <your-cloud-token>
ngrok http 3333 --domain=your-domain.com
```

---

## 🔐 Demo Account Setup

### Create Demo Credentials
```bash
# 1. Login with demo credentials
# Username: Demo
# Password: 1234

# 2. Or create new demo user
bun run tsx scripts/create-demo-user.ts
```

### Demo Data Seeding
```typescript
// scripts/demo-seed.ts
import { prisma } from './prisma'

const demoData = {
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'WORKER',
  tenantId: 'demo-tenant',
  isActive: true
}

// Add more demo projects, tasks, files here
```

---

## 🚀 Quick Deploy Checklist

### Pre-Deployment
- [ ] Clone repository
- [ ] Setup `.env.demo`
- [ ] Configure demo credentials
- [ ] Verify ngrok token (if using)

### Deployment Steps
- [ ] `docker compose up -d` OR `bun run dev`
- [ ] Access at `localhost:3333`
- [ ] Login with demo account
- [ ] Test core features
- [ ] Prepare presentation

### Post-Deployment
- [ ] Share ngrok URL with clients
- [ ] Collect user feedback
- [ ] Document issues found
- [ ] Plan improvements

---

## 📞 Client Demo Script

### Pre-Meeting (5 min)
1. Launch demo environment
2. Test all core features
3. Prepare demo presentation
4. Set up ngrok tunnel

### During Demo (30 min)
1. **Login Demo** - Show authentication
2. **Project Overview** - Show active projects
3. **Task Management** - Demonstrate kanban
4. **File Management** - Show file browser
5. **Team Collaboration** - Demonstrate portal
6. **AI Features** - Show predictions

### Post-Meeting (5 min)
1. Collect feedback
2. Document issues
3. Share next steps
4. Schedule follow-up

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Cannot connect to demo server**
```bash
# Check if server is running
curl localhost:3333

# Check logs
docker logs <container-id>
```

**Issue: ngrok tunnel not working**
```bash
# Verify ngrok is running
ngrok status

# Restart tunnel
ngrok http 3333
```

**Issue: Demo login fails**
```bash
# Clear demo database
rm .pi/db/demo.sqlite
# Re-seed demo data
bun run tsx scripts/create-demo-user.ts
```

---

## 📚 Related Documentation

- [Production Ready Guide](../../PRODUCTION_READY_GUIDE.md)
- [Docker Deployment](../../PI_INTEGRATION_DOCKER_PLAN.md)
- [Application Launch](../APPLICATION_LAUNCH_GUIDE.md)
- [Security Guide](../PHASE_1_SECURITY_DATA_GUIDE.md)

---

## ⚠️ Important Notes

1. **Demo Mode**: Ensure `WOP_DEV_MODE=true` is set
2. **Isolation**: Demo environment should be isolated from production
3. **Data Privacy**: Clear demo data before client meetings
4. **Uptime**: Keep demo server running during client hours

---

## 📞 Contact

Need immediate help? Contact:
- **DevOps Team**: devops@wayofpi.dev
- **Emergency**: #emergency channel in team chat

---

**Last Updated**: 2026-05-05  
**Status**: CRITICAL PRIORITY  
**Owner**: Way of Pi Development Team