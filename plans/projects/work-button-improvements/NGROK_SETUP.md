# NGROK TUNNEL SETUP GUIDE

## 🚀 What is ngrok?

ngrok provides a public tunnel to your local development server. This allows:
- External access from any device
- Client testing without deploying
- Secure HTTPS connections
- Free tier available

---

## 📋 Prerequisites

### 1. Install Node.js/npm

```bash
# Check if Node.js is installed
node --version

# If not installed:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install ngrok CLI

```bash
# Via npm
npm install -g ngrok

# Or via homebrew (macOS)
brew install ngrok

# Or download binary directly
# https://ngrok.com/download
```

### 3. Get Authentication Token

```bash
# Visit: https://ngrok.com/signup
# Sign up for free account
# Go to: https://dashboard.ngrok.com
# Copy your auth token
```

---

## 🎯 Basic Setup

### Step 1: Install ngrok (if not already)

```bash
npm install -g ngrok
```

### Step 2: Add Authentication Token

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

Replace `YOUR_AUTH_TOKEN_HERE` with your actual token from ngrok dashboard.

### Step 3: Start Local Server

```bash
cd /home/zerwiz/CodeP/Way of pi/projects/work-button-improvements
bun run dev
```

Server should be running on `http://localhost:3333`

### Step 4: Create Tunnel

```bash
ngrok http 3333

# With auth token:
ngrok http 3333 --authtoken YOUR_TOKEN

# With auto HTTPS:
ngrok http 3333 --http-interface :3333
```

### Step 5: Copy Your URL

```
ngrok forwarding tunnel https://abc123def456.ngrok.io forward 3333 -> http://localhost:3333 -> abc123def456.ngrok.io
```

Copy this URL and share with clients!

---

## 🏠 Multi-Instance Setup

Each location (home, office, field) can have its own tunnel.

### Instance 1: Home

```bash
INSTANCE_ID="home-001"
PORT=3333

bun run dev
ngrok http 3333 --authtoken YOUR_TOKEN
```

### Instance 2: Office

```bash
INSTANCE_ID="office-001"
PORT=3334

bun run dev
ngrok http 3334 --authtoken YOUR_TOKEN
```

### Instance 3: Field Work

```bash
INSTANCE_ID="field-001"
PORT=3335

bun run dev
ngrok http 3335 --authtoken YOUR_TOKEN
```

Each instance gets a unique tunnel URL.

---

## 📱 Mobile Testing

### From Phone/Remote Device

```bash
# Share tunnel URL via WhatsApp, email
# Or use QR code

# Example URL:
# https://abc123def456.ngrok.io
```

### Access from Any Device

1. Get tunnel URL from ngrok
2. Open URL on any device
3. Login with PIN
4. Use app remotely

---

## 🔒 Security Considerations

### Free Tier Limits

- 12 hours max (renews daily)
- ~300 connections/min
- ngrok.com branding
- Not suitable for production

### Pro Tier (Recommended for Demo)

- Unlimited tunnels
- No branding
- Custom subdomains
- Better performance

Upgrade if needed for client demos.

### Best Practices

- Use unique PIN per instance
- Don't expose production tunnel
- Rotate tunnel URL per session
- Use HTTPS via auto-cert

---

## ⚡ Performance Tuning

### Bandwidth Limits

- Free: ~800MB/month
- Pro: Unlimited

### Connection Pooling

```bash
# Increase connection limit
ngrok http 3333 --region authtoken
```

### Region Selection

```bash
# Use closest ngrok edge
ngrok http 3333 --region nearest
```

---

## 🧪 Troubleshooting

### Common Issues

**Issue**: "Error: ngrok: command not found"

```bash
# Solution
npm install -g ngrok
```

**Issue**: Tunnel doesn't start

```bash
# Check if port in use
lsof -i :3333

# Solution: Kill process or change port
```

**Issue**: Can't access from external network

```bash
# Ensure ngrok is running
ngrok status

# Re-establish tunnel
ngrok http 3333
```

**Issue**: SSL certificate errors

```bash
# Use ngrok auto HTTPS (default)
# Or configure custom certificate
```

### Verify Tunnel is Working

```bash
# In another terminal:
curl https://your-tunnel-url.ngrok.io
# Should return HTML response
```

---

## 📝 Sample Configuration

### .env with ngrok

```bash
cat > .env << ENVEOF
INSTANCE_ID=home-001
PORT=3333
PIN=123456
DB_FILE=.instance.db
NGROK_ENABLED=true
NGROK_AUTHTOKEN=your-token-here
ENVEOF
```

### Auto-Start Tunnel (Optional)

Create script:

```bash
#!/bin/bash

# Start server
bun run dev &

# Start ngrok
sleep 2
ngrok http 3333 --authtoken $(cat ~/.ngrok/ngrok.conf | grep token | cut -d= -f2)
```

---

## 📞 Next Steps

1. Sign up for ngrok account
2. Copy your auth token
3. Configure `.env` file
4. Start local server
5. Create tunnel
6. Share URL with team

---

**END OF NGROK SETUP GUIDE**
