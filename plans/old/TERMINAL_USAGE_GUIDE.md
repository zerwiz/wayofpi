# Terminal Usage Guide - PTY-Based Implementation

## 🚀 Quick Start Guide

### **1. Start the Server**

```bash
cd /home/zerwiz/CodeP/Way\ of\ pi/apps/wayofpi-server
node src/server/SessionManager.ts
```

**Output:**
```
✅ Way of Pi Server
✅ PTY sessions available
✅ WebSocket ready: ws://localhost:3333
```

### **2. Start the UI**

```bash
cd /home/zerwiz/CodeP/Way\ of\ pi/apps/wayofpi-ui
npm install
npm run build
npm start
```

**Output:**
```
✅ React app ready
✅ Served: http://localhost:3000
```

### **3. Open Terminal**

```
http://localhost:3000
```

---

## 💻 First Commands

Once you connect to the terminal, you can run:

### **Basic Commands:**
```bash
# Help
help

# List current directory
ls -la

# Show who you are
whoami

# Show system info
uname -a

# Show time
date

# Show environment
env

# Show working directory
pwd

# Show user info
id

# Show processes
ps aux
```

### **Interactive Commands:**
```bash
# Calculator
expr 5 + 5

# Clear screen
clear

# Open nano editor
nano README.md

# Open top
top

# Open htop
htop
```

### **Python Examples:**
```bash
# Python help
python3 -c "help()"

# Calculator
python3 -c "print(2**16)"

# Fibonacci
python3 -c "print(sum(1/n for n in range(1,1000000)))"
```

---

## 🎨 ANSI Terminal Features

### **Colors:**
```bash
# Basic colors
echo -e "\033[31mRed\033[0m"
echo -e "\033[32mGreen\033[0m"
echo -e "\033[33mYellow\033[0m"
echo -e "\033[34mBlue\033[0m"

# Bright colors
echo -e "\033[91mBright Red\033[0m"
```

### **Special Styles:**
```bash
# Bold
echo -e "\033[1mBold\033[m"

# Underline
echo -e "\033[4mUnderline\033[m"

# Invert
echo -e "\033[7mInvert\033[m"

# Blink (not always supported)
echo -e "\033[5mBlink\033[m"
```

---

## 📜 File Management

### **Create & Edit:**
```bash
# Create file
touch file.txt

# Edit with nano
nano file.txt

# Edit with vim
vim file.txt
```

### **View Files:**
```bash
# View content
cat file.txt

# View line by line
less file.txt

# View with colors
cat -T file.txt
```

### **Copy Data:**
```bash
# Copy to clipboard
xclip -selection clipboard < file.txt
```

---

## 🔧 Debugging Tools

### **Debug Node.js:**
```bash
# Node debug
node debug.js

# Watch files
nodemon debug.js
```

### **View Logs:**
```bash
# View logs
tail -f /var/log/syslog

# View process logs
journalctl -u your-service
```

---

## 🎯 Terminal Features

### **Multi-Window:**
```bash
# Open multiple terminals
# Each has separate PTY session
# Each has own scrollback

Terminal 1: bash
Terminal 2: sh
Terminal 3: zsh
```

### **Scrollback:**
```bash
# View scrollback
# Up to 256 lines visible
# Auto-scroll on new output
```

### **Resize:**
```bash
# Window resizes are handled automatically
# PTY size updates via ioctl
```

---

## 🚨 Common Issues & Solutions

### **"Connection refused":**

**Fix:** Start the server first

```bash
node src/server/SessionManager.ts
```

### **"Command not found":**

**Fix:** Check PATH

```bash
echo $PATH
```

### **"Permission denied":**

**Fix:** Check permissions

```bash
ls -la
sudo file command
```

---

## 🎓 Best Practices

### **Before You Start:**

1. **Clear previous output:**
   ```bash
   clear
   ```

2. **Set prompt:**
   ```bash
   PS1='[$ ]\w# '
   export PS1
   ```

3. **Enable colors:**
   ```bash
   export TERM=xterm-256color
   ```

4. **View history:**
   ```bash
   history
   ```

### **During Session:**

1. **Navigate commands:**
   - `Ctrl+r` - Search history
   - `↑/↓` - Previous commands

2. **Edit commands:**
   - Tab autocomplete
   - Arrows for cursor

3. **Manage scrollback:**
   - View up to 256 lines
   - Clear output with `clear`

### **When Done:**

1. **Exit terminal:**
   ```bash
   exit
   ```

---

## 🎯 Advanced Features

### **Aliases:**
```bash
# Create alias
alias ll='ls -la'

# Show aliases
alias
```

### **Functions:**
```bash
# Create function
myfunc() {
  echo "Hello world"
}

# Use function
myfunc
```

### **Environment:**
```bash
# Show environment
env

# Set variable
export MY_VAR=value

# Source env
source ~/.bashrc
```

---

## 📖 Documentation

- **Files Location:** `/home/zerwiz/CodeP/Way of pi/plans/`
- **Server:** `SessionManager.ts`
- **UI:** `LogsPanel.tsx`
- **Buffer:** `ScreenBuffer.ts`
- **Ansi:** `AnsiParser.ts`

---

**Happy Terminaling! 🚀**