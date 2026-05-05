# Work Button Deployment Guide

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USER/work-button-improvements.git
cd work-button-improvements
```

### 2. Create Instance

Each location (home, office, on-site) gets its own instance.

#### Option A: Home Instance

```bash
# Set environment variables
INSTANCE_ID="home-001"
PORT=3333
DB_FILE=".instance.db"
PIN="123456"

# Create env file
cat > .env << ENVEOF
INSTANCE_ID=${INSTANCE_ID}
PORT=${PORT}
DB_FILE=${DB_FILE}
PIN=${PIN}
NGROK_AUTHTOKEN="your-ngrok-token"
ENVEOF

# Start instance
./deploy-home.sh
```

#### Option B: Office Instance

```bash
INSTANCE_ID="office-001"
PORT=3334

cat > .env << ENVEOF
INSTANCE_ID=${INSTANCE_ID}
PORT=${PORT}
ENVEOF

./deploy-office.sh
```

---

## 📋 Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `INSTANCE_ID` | Unique instance identifier | auto-generated | No |
| `PORT` | Server port | 3333 | No |
| `DB_FILE` | SQLite database path | `.instance.db` | No |
| `PIN` | Access PIN for local mode | `123456` | Yes |
| `NGROK_AUTHTOKEN` | ngrok auth token | null | Optional |
| `SSL_CERT_PATH` | SSL certificate path | null | Optional |

---

## 🏗️ Production Deployment

### Step 1: Set Up Build Environment

```bash
# Install Bun (recommended)
curl -fsSL https://bun.sh/install | bash

# Clone repository
git clone .

# Install dependencies
bun install

# Create production build
bun build --target production
```

### Step 2: Configure Environment

```bash
cp .env.example .env

# Fill in required values:
# INSTANCE_ID=your-instance-id
# PORT=3333
# PIN=xxxxxx
```

### Step 3: Start Server

```bash
bun run dev
# or for production
bun run start
```

### Step 4: Access Application

- **Local**: http://localhost:3333
- **ngrok**: https://your-tunnel.ngrok.io
- **VPS**: https://your-domain.com

---

## 🌐 NGROK SETUP

### Get Authentication Token

```bash
# Visit https://ngrok.com and get your free token
# Copy the token to a secure location
```

### Create Tunnel

```bash
# Start ngrok
ngrok http 3333 --authtoken YOUR_TOKEN

# Copy URL
# https://abc123def456.ngrok.io
```

### Auto-Cert (Optional)

```bash
# Request auto SSL certificate
ngrok config add-authtoken YOUR_TOKEN
ngrok http 3333 --http-interface :3333
```

---

## 🖥️ VPS DEPLOYMENT

### Requirements

- **CPU**: 2+ cores
- **RAM**: 2GB minimum
- **Storage**: 10GB+
- **OS**: Ubuntu 22.04+
- **Network**: Static IP or DNS

### Step-by-step

1. **Create Droplet** (DigitalOcean/Linode)
2. **Install Dependencies**

```bash
sudo apt update
sudo apt install -y bun sqlite3 nginx
```

3. **Copy Application**

```bash
git clone https://your-repo.git /var/www/work-button
cd /var/www/work-button
bun install
```

4. **Set Environment**

```bash
cp .env.example .env
nano .env
```

5. **Configure Nginx**

```bash
sudo nano /etc/nginx/sites-enabled/work-button
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **Enable HTTPS** (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security Checklist

### Local Instance

- [ ] Change default PIN
- [ ] Use strong PIN (6+ digits)
- [ ] Enable ngrok for external access
- [ ] Keep instance files private

### Production Instance

- [ ] Enable HTTPS
- [ ] Set up firewall (ufw/firewalld)
- [ ] Configure rate limiting
- [ ] Regular backup schedule
- [ ] Monitor logs

---

## 📦 Build Commands Reference

| Command | Description |
|--|---|
| `bun install` | Install dependencies |
| `bun run dev` | Development server |
| `bun build` | Production build |
| `ngrok http` | Start tunnel |
| `npm run start` | Production start |
| `docker compose up` | Docker deployment |

---

## 🧪 Testing Checklist

- [ ] Instance starts without errors
- [ ] SQLite database created
- [ ] Login works with PIN
- [ ] Work button functions
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] External access via ngrok
- [ ] HTTPS working (if production)

---

## 📞 Support

For deployment issues:

- Check `.env` configuration
- Verify port is not in use
- Ensure Bun is installed
- Review error logs

---

**END OF DEPLOYMENT GUIDE**
