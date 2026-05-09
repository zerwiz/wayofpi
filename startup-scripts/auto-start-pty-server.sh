#!/bin/bash
# Auto-start PTY WebSocket server for Way of Pi
# Runs in background when main app starts

# Configuration
APP_ROOT="/home/zerwiz/CodeP/Way of pi/apps/wayofwork-server"
PORT=3333
PID_FILE="/home/zerwiz/CodeP/Way of pi/.pi/pty-server.pid"
LOG_FILE="/home/zerwiz/CodeP/Way of pi/.pi/pty-server.log"

# Create log directory
mkdir -p /home/zerwiz/CodeP/Way of pi/.pi

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "PTY server already running with PID $OLD_PID"
        exit 0
    else
        rm -f "$PID_FILE"
        echo "Stale PID file removed"
    fi
fi

# Start PTY server in background
cd "$APP_ROOT"
node src/server/SessionManager.ts > "$LOG_FILE" 2>&1 &

# Save PID
echo $! > "$PID_FILE"

# Get actual PID (node may fork)
NEW_PID=$(cat "$PID_FILE")

# Wait a moment for server to start
sleep 2

# Check if it's running
if ps -p "$NEW_PID" > /dev/null 2>&1; then
    echo "✓ PTY server started on port $PORT"
    echo "  PID: $NEW_PID"
    echo "  Log: $LOG_FILE"
    
    # Start watch mode so it restarts if stopped
    tail -f "$LOG_FILE"
else
    echo "✗ Failed to start PTY server"
    tail -n 20 "$LOG_FILE"
    
    # Fallback: let main app handle errors
    exit 1
fi

# Auto-kill if main process stops
trap '
    echo "Main app stopping. Killing PTY server..."
    kill $NEW_PID 2>/dev/null
    rm -f "$PID_FILE"
' SIGINT SIGTERM EXIT

echo "PTY server will auto-kill when main app stops"
echo "Press Ctrl+C to stop"
