# VPS DEPLOYMENT GUIDE

## 🚀 Quick Overview

Deploy Work Button app on a VPS for centralized hosting.

### Provider Options

- **DigitalOcean** ($5/mo - Recommended)
- **Linode** ($5/mo - Recommended)
- **Hetzner** (~$5/mo - Europe)
- **AWS EC2** (More expensive)
- **Google Cloud Compute** (More expensive)

### Minimum Requirements

| Resource | Requirement | Recommended |
|--|--|--|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 2GB | 4GB |
| **Storage** | 10GB SSD | 20GB+ |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04+ |
| **Location** | Region near users | Auto-scale |

---

## 🔧 Step-by-Step Setup

### 1. Create VPS Instance

#### DigitalOcean Example

```bash
# Use marketplace image
# Ubuntu 22.04
# $5/mo Droplet
# SSH access provided
```

#### SSH Connection

```bash
# Copy SSH key from provider portal
# Upload to server:
cat ~/.ssh/id_rsa.pub | ssh root@<VPS_IP> "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Connect:
ssh root@<VPS_IP>
```

---

### 2. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    curl \
    git \
    bun \
    sqlite3 \
    nginx \
    nodejs \
    npm \
    supervisor \
    fail2ban

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

### 3. Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/work-button
cd /var/www/work-button

# Clone repository
git clone https://github.com/YOUR-USER/work-button-improvements.git .

# Install dependencies
bun install --production
```

---

### 4. Configure Environment

```bash
# Create environment file
sudo nano .env
```

```bash
cat > .env << 'ENVEOF'
INSTANCE_ID=vps-main-instance
PORT=3333
DB_FILE=/var/www/work-button/.db
PIN=xxxxxx
NODE_ENV=production
ALLOWED_ORIGINS=*
ENVEOF
```

```bash
sudo chmod 600 .env
```

---

### 5. Build Production

```bash
# Create production build
bun run build

# Check build output
ls -la dist/
```

---

### 6. Configure Nginx

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/work-button
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/work-button /etc/nginx/sites-enabled/
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl restart nginx
```

---

### 7. Set Up SSL (Let's Encrypt)

```bash
# Run certbot
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts (email validation)
# Certificate placed in /etc/letsencrypt/live/yyyyour-domain.com

# Auto-renewal check
sudo certbot renew --dry-run
```

---

### 8. Configure Autostart

```bash
# Create systemd service
sudo nano /etc/systemd/system/work-button.service
```

```ini
[Unit]
Description=Work Button App
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/home/zerwiz/.bun/bin/bun run --no-install start
Restart=always
Environment=NODE_ENV=production
Environment=INSTANCE_ID=vps-main-instance
Environment=DB_FILE=/var/www/work-button/.db

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable work-button
sudo systemctl start work-button

# Check status
sudo systemctl status work-button
```

---

### 9. Security Hardening

```bash
# Install and configure firewall
sudo apt install -y ufw
sudo ufw allow 'Nginx Full'
sudo ufw allow 3333
sudo ufw deny 22 # Only SSH if needed
sudo ufw enable

# Configure fail2ban
sudo apt install -y fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
```

```bash
# Enable SSH brute force protection
sudo nano /etc/fail2ban/jail.local
[ssh]
enabled = true
```

---

### 10. Backup Setup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-work-button.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/backups"
sudo mkdir -p $BACKUP_DIR

# Backup database
sqlite3 /var/www/work-button/.db ".dump" > "/var/www/backups/db_$DATE.sql"

# Backup app files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /var/www/work-button

# Keep last 30 days
find /var/www/backups -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $(ls -lht /var/www/backups | tail -5)"
```

```bash
# Add to crontab (daily)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-work-button.sh
```

---

## 📊 Monitoring

### Setup Monitoring

```bash
# Install Node.js monitoring
sudo npm install -g pm2

# Setup logs viewing
sudo journalctl -u work-button -f
```

### Setup Alerts

```bash
# Configure monitoring alerts
# Use tools like:
# - Uptime Kuma
# - Prometheus/Grafana
# - Email alerts via curl
```

---

## 🔄 Update Procedures

### Minor Updates

```bash
# Pull latest changes
cd /var/www/work-button
git pull

# Install dependencies
bun install --production

# Restart service
sudo systemctl restart work-button

# Verify
curl -I https://your-domain.com
```

### Major Updates

```bash
# Backup first
/usr/local/bin/backup-work-button.sh

# Pull and install
git pull
bun install

# Test locally first
# If ok, deploy to VPS

# Zero-downtime deployment
sudo systemctl stop work-button
mkdir /var/www/work-button-new
git clone . /var/www/work-button-new
cp .env /var/www/work-button-new/.env
sudo cp -r /var/www/work-button-new/* /var/www/work-button/
sudo systemctl start work-button
sudo rm -rf /var/www/work-button-new
```

---

## 🤖 Auto-Scaling (Optional)

For high-traffic deployments:

```bash
# Configure load balancing
# Use nginx upstream config:
# upstream work-button {
#     server backend1:3333;
#     server backend2:3333;
# }
```

---

## 🧪 Testing Checklist

- [ ] Server accessible via HTTPS
- [ ] All routes working
- [ ] Database persists
- [ ] SSL certificate valid
- [ ] Backup working
- [ ] Monitoring alerts active
- [ ] Auto-restart working

---

## 📞 Support

For issues:

- Review nginx logs: `tail -f /var/log/nginx/error.log`
- Review app logs: `journalctl -u work-button -f`
- Review system logs: `dmesg | tail`

---

## 🚀 Production Commands Reference

| Command | Description | User |
|--|--|--|
| `sudo systemctl restart work-button` | Restart app | root |
| `sudo systemctl status work-button` | Check status | root |
| `bun run build` | Build app | any |
| `bun run dev` | Development | anyone |
| `sudo systemctl stop work-button` | Stop app | root |

---

## 🔒 Security Best Practices

1. Change default PIN on first login
2. Enable SSH key authentication only
3. Disable root SSH access (use sudo)
4. Keep system updated regularly
5. Monitor for brute force attempts
6. Use HTTPS everywhere
7. Regular security updates

---

## 📊 Performance Tips

1. Use SSD storage
2. Configure nginx caching
3. Enable gzip compression
4. Use CDN for static assets
5. Monitor resource usage

---

**END OF VPS SETUP GUIDE**
