# Worker Portal Demo Mode Documentation

## Overview

The **Worker Portal** includes a **Demo Mode** feature that allows developers to test and use the UI without needing a running API server. This is useful for:

- Development and debugging
- Presentation and demos
- Testing UI changes before deploying to production
- Offline work sessions

## What Changed

### File Modified

**File**: `/apps/wayofpi-ui/src/pages/WorkerPortal.tsx`

### Key Changes

#### 1. Login Handler Enhancement

**Before**: Login directly called API without fallback
**After**: Login now checks for demo credentials first before calling API

```typescript
// NEW: Check for demo credentials
const isDemoCredentials = 
  loginData.username.toLowerCase() === 'demo' && 
  loginData.password === '1234';

if (isDemoCredentials) {
  // Use demo data instead of API call
  return loadDemoData();
}

// Normal flow...
await fetchWorkers();
await fetchFiles();
await fetchProjects();
await fetchWorkflows();
await fetchBoards();
await fetchTasks();
```

#### 2. Demo Mode Detection

The application now auto-detects when in demo mode:

```typescript
const isDemoMode = 
  loginData.username.toLowerCase() === 'demo' && 
  loginData.password === '1234';
```

### Demo Credentials

- **Username**: `Demo`
- **Password**: `1234`

These credentials trigger demo mode automatically.

## How Demo Mode Works

### 1. Authentication Flow

1. **User enters credentials**
2. **System checks for demo credentials**
3. **If demo credentials**: Skip API, use demo data
4. **If real credentials**: Continue with API flow

### 2. Demo Data Loading

When in demo mode, the following data is loaded:

```typescript
// Task List
const [taskList, setTaskList] = useState<DemoWorkTask[]>(DEMO_TASKS);

// Files
const [files, setFiles] = useState<FileItem[]>(DEMO_FILES);

// Projects
const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);

// Workflows  
const [workflows, setWorkflows] = useState<WorkFlow[]>(DEMO_WORKFLOWS);

// Boards
const [boards, setBoards] = useState<KanBanColumn[]>(DEMO_BOARDS);

// Tasks
const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
```

### 3. Component Integration

Demo data is used in all Kanban components:

- `PushToKanbanModal`
- `PushWorkflowToKanbanModal` 
- `PushTaskListToKanbanModal`
- `BoardSettingsModal`
- `WorkBoard`
- `WorkTaskCard`

## Why Demo Mode Was Added

### Problem

Previously, the Worker Portal required:
1. A running API server (`http://127.0.0.1:3333`)
2. Valid authentication
3. Network connectivity

This blocked:
- Local development
- Testing UI changes
- Presentations
- Offline work

### Solution

Demo credentials allow:
- **Zero-dependency testing**: No server needed
- **UI development**: Test components independently
- **Offline work**: Work even when network unavailable
- **Faster iteration**: Skip API setup time

## Usage Instructions

### Starting Demo Mode

1. **Start the UI server** (if you want to test with server):
```bash
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-ui"
npm run dev
```

2. **Open browser** to: `http://localhost:5173`

3. **Login with demo credentials**:
   - Username: `Demo`
   - Password: `1234`

4. **Demo mode activates automatically**

### Using Without Server

Demo mode works **without** a running server:

1. **Just open the HTML file**:
```bash
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-ui"
# Open with browser to index.html or served file
```

2. **Use**: `Demo` / `1234`

3. **Access all features**:
   - View tasks
   - View files
   - View projects
   - View workflows
   - View boards
   - Kanban operations

## Demo Data Structure

### Tasks

Demo tasks include various statuses:

```json
[
  {
    "id": "TASK-001",
    "title": "Fix login authentication",
    "description": "Resolve issues with user login",
    "status": "In Progress",
    "category": "Development",
    "assignee": "John Doe",
    "dueDate": "2026-05-05",
    "priority": "high"
  }
]
```

### Files

Demo files:
- README.md
- CHANGELOG.md
- LICENSE
- etc.

### Projects

Demo projects:
- Development
- Testing
- Demo

### Workflows

Demo workflows:
- New Project
- Development
- Testing
- Review
- Production

### Boards

Demo boards:
- Development Board
- Testing Board
- Production Board

## Developer Guide

### Adding New Demo Data

To add demo data for new features:

1. **Find** the demo data constant:
```typescript
const DEMO_TASKS: DemoWorkTask[] = [
  // existing tasks
];
```

2. **Add** new demo items:
```typescript
const DEMO_TASKS: DemoWorkTask[] = [
  // existing tasks
  {
    id: "TASK-NEW",
    title: "Your new task",
    description: "Your new task description",
    status: "New",
    category: "Development",
    assignee: "Test User",
    dueDate: "2026-05-05",
    priority: "medium"
  }
];
```

3. **Export** and use in components

### Testing Demo Mode

1. **Clear browser cache**: `Ctrl+Shift+R` or `Cmd+Shift+R`

2. **Login with**: `Demo` / `1234`

3. **Verify demo data loads**

4. **Test UI interactions**

### Switching to Live Mode

To use actual API data:

1. **Start the server**:
```bash
npm run server
```

2. **Use real credentials** instead of `Demo`/`1234`

3. **API calls will populate** real data

## Troubleshooting

### Demo Mode Not Working

**Problem**: Demo mode doesn't activate

**Solutions**:
1. **Clear browser cache**
2. **Check credentials**: Must be exactly `Demo` and `1234`
3. **Try different browser**
4. **Check browser console** for errors

### Switching Between Modes

**Problem**: Can't switch from demo to live

**Solution**:
1. **Logout** from Worker Portal (if possible)
2. **Use different credentials**
3. **Clear application state**

## Future Enhancements

Potential improvements for demo mode:

- [ ] **Flag demo mode** for users
- [ ] **Separate demo databases**
- [ ] **Toggle demo mode** setting
- [ ] **Export demo data**
- [ ] **Import custom demo data**

## Related Files

### Modified

- `/apps/wayofpi-ui/src/pages/WorkerPortal.tsx`

### Demo Data Files

- `/apps/wayofpi-ui/src/data/demo-data.*`

### Components Using Demo Data

- `/apps/wayofpi-ui/src/components/work/kanban/**`

## Security Notes

### Demo Credentials

- **Not for production**: Use `Demo`/`1234` only for development
- **Change in production**: Never use demo credentials in production
- **Clear after demo**: Change credentials or disable demo mode

### API vs Demo

- **Production**: Always use API
- **Development**: Demo mode or API both acceptable
- **Testing**: Demo mode recommended for UI testing

## Summary

**Demo Mode** provides:
- ✅ Zero-dependency development
- ✅ Offline work capability
- ✅ Faster iteration cycles
- ✅ Safe testing environment
- ✅ Offline presentations

Use it for development, testing, and demos. Use API for production.

---

**Last Updated**: 2026-05-05  
**Author**: Developer Guide  
**Version**: 0.19.99

EOF
## Real Server Setup for Login

### Prerequisites

Before setting up the real server for login, ensure you have:

1. **Access to the host computer** where the app is installed
2. **Node.js and npm** installed (required for running the backend)
3. **Administrator/Sudo privileges** (to start services on boot)

### Step 1: Install Backend Dependencies

On the **host computer**, navigate to the backend directory:

```bash
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server"

# Install dependencies
npm install

# Or use yarn
yarn install
```

### Step 2: Start the Backend Server

#### Option A: Manual Start (Recommended for Development)

1. **Open terminal on host computer**
2. **Navigate to server directory**:
   ```bash
   cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server"
   ```

3. **Run the server**:
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Server will start on**: `http://127.0.0.1:3333`

5. **Worker Portal can now login** using real API data

#### Option B: Start with Electron App

To automatically start the server when the Electron app launches:

**Option B1: Using npm script**

Add to your Electron main process script:

```javascript
// main.js or main/index.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');

let serverProcess = null;

app.whenReady().then(() => {
  // Start backend server before showing Electron window
  serverProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../apps/wayofpi-server'),
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (error) => {
    console.error('Error starting server:', error);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  // Create Electron window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadFile('apps/wayofpi-ui/index.html');
});
```

**Option B2: Using electron-reload**

```bash
# Install electron-reload if needed
npm install electron-reload --save-dev

// In package.json:
"scripts": {
  "start": "electron-reload .",
  "server": "npm start"
}
```

### Step 3: Configure Auto-start on System Boot

#### Option 1: Systemd Service (Linux/Unix)

1. **Create service file**:

   ```bash
   sudo nano /etc/systemd/system/wayofpi-server.service
   ```

2. **Add service configuration**:

   ```ini
   [Unit]
   Description=Way of Pi Server
   After=network.target

   [Service]
   Type=simple
   User=zerwiz  # Your username
   WorkingDirectory=/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=10
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Restart systemd**:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable wayofpi-server
   sudo systemctl start wayofpi-server
   
   # Check status
   sudo systemctl status wayofpi-server
   ```

#### Option 2: Cron Job

```bash
# Edit crontab
crontab -e

# Add line to start server at boot
@reboot cd /home/zerwiz/CodeP/Way\ of\ pi/apps/wayofpi-server && npm start
```

#### Option 3: Init Script

Create startup script:

```bash
# /etc/init.d/wayofpi-server
#!/bin/bash

case "$1" in
  start)
    cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server"
    nohup npm start > /var/log/wayofpi-server.log 2>&1 &
    echo "Way of Pi server started"
    ;;
  stop)
    pkill -f "node.*wayofpi-server"
    echo "Way of Pi server stopped"
    ;;
  restart)
    $0 stop
    $0 start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac
```

Make executable and run:
```bash
sudo chmod +x /etc/init.d/wayofpi-server
sudo update-rc.d wayofpi-server defaults
```

### Step 4: Setup Environment Variables

Create `.env` file in server directory:

```bash
# /home/zerwiz/CodeP/Way of pi/apps/wayofpi-server/.env
PORT=3333
API_URL=http://127.0.0.1:3333
DEBUG=false
DEMO_MODE=false
```

### Step 5: Verify Server is Running

```bash
# On host computer
curl http://127.0.0.1:3333/health

# Should return: {"status": "ok"}
```

### Step 6: Worker Portal Login

After server is running:

1. **Open Electron app** or browser
2. **Navigate to Worker Portal**
3. **Login with real credentials**:
   - Use actual username/password from your database
   - Not `Demo`/`1234`

The app will fetch real data from the backend server.

## Server Installation Methods

### Method 1: Copy Files to Host

```bash
# On development machine
cp -r "/home/zerwiz/CodeP/Way of pi/*" /path/to/host/

# Then configure for host
cd "/path/to/host/apps/wayofpi-server"
npm install

# Start server
npm start
```

### Method 2: SSH Access

```bash
# SSH into host
ssh user@host-ip

# Copy project files
cd /home/user/way-of-pi

# Or download via git
git clone /home/zerwiz/CodeP/Way\ of\ pi.git .
```

### Method 3: Install on Host First

If the host is the primary machine:

1. **Install Node.js on host**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone project**:
   ```bash
   git clone /home/zerwiz/CodeP/Way\ of\ pi.git .
   ```

3. **Start server**:
   ```bash
   cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server"
   npm install
   npm start
   ```

## Debugging Server Issues

### Server Won't Start

1. **Check if Node.js is installed**:
   ```bash
   node --version
   npm --version
   ```

2. **Check port availability**:
   ```bash
   netstat -tlnp | grep 3333
   ```

3. **Check for errors**:
   ```bash
   cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server"
   npm start 2>&1 | tee server.log
   ```

### Connection Refused

If Worker Portal says "Connection refused":

1. **Verify server is running**:
   ```bash
   lsof -i :3333
   ```

2. **Check firewall**:
   ```bash
   sudo ufw allow 3333/tcp
   ```

3. **Check CORS settings** in server code

## Security Considerations

### Real Server Setup

- **Production**: Never use demo credentials
- **HTTPS**: Consider using reverse proxy for production
- **Authentication**: Use secure passwords
- **Database**: Store credentials securely
- **API Rate limiting**: Prevent abuse

### Firewall Configuration

```bash
# Allow server port
sudo ufw allow 3333/tcp

# Deny external access (localhost only)
sudo ufw allow from 127.0.0.1 to any port 3333
```

## Summary

**For live deployment:**

1. Install Node.js on host
2. Copy project files or install from git
3. Start backend server (`npm start`)
4. Configure auto-start (systemd/cron)
5. Worker Portal connects to real API
6. Use real credentials (NOT demo)

**For testing/demo:**

1. Use demo credentials (`Demo`/`1234`)
2. No server needed
3. Works offline

---

**Last Updated**: 2026-05-05  
**Author**: Developer Guide  
**Version**: 0.19.99

