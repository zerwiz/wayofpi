#!/usr/bin/env bash
#
# Start Way of Pi for local hosting / client demos
# Usage: ./scripts/host-for-demo.sh [--with-ngrok] [--port PORT]
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT/apps/wayofpi-ui"
PORT="${2:-3333}"

WITH_NGROK=0
if [[ "${1:-}" == "--with-ngrok" ]]; then
  WITH_NGROK=1
  shift
fi

echo "=== Way of Pi - Local Hosting for Demos ==="
echo "Instance: ${INSTANCE_ID:-default}"
echo "Port: $PORT"
echo ""

# Load .env if present
if [[ -f "$ROOT/.env" ]]; then
  echo "Loading .env..."
  set -a
  source "$ROOT/.env"
  set +a
fi

# Check Bun
if ! command -v bun >/dev/null 2>&1; then
  echo "ERROR: Bun is not installed. Install from https://bun.sh"
  exit 1
fi

# Start server in background
echo "Starting server on port $PORT..."
cd "$UI_DIR"
BUN_RUNTIME=server PORT=$PORT bun run server/index.ts &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
for i in $(seq 1 30); do
  if curl -s http://localhost:$PORT/api/health >/dev/null 2>&1; then
    echo "Server is ready!"
    break
  fi
  sleep 1
done

if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "ERROR: Server failed to start"
  exit 1
fi

echo ""
echo "=== Server running at http://localhost:$PORT ==="
echo ""

# Start ngrok if requested
if [[ "$WITH_NGROK" == "1" ]]; then
  if command -v ngrok >/dev/null 2>&1; then
    echo "Starting ngrok tunnel..."
    ngrok http $PORT --log=stdout &
    NGROK_PID=$!
    echo ""
    echo "=== ngrok dashboard: http://localhost:4040 ==="
    echo "=== Share the HTTPS URL from ngrok with clients ==="
  else
    echo "WARNING: ngrok not found. Install with:"
    echo "  brew install ngrok/ngrok/ngrok  (macOS)"
    echo "  or see: https://ngrok.com/download"
  fi
fi

echo ""
echo "Press Ctrl+C to stop the server"

# Cleanup on exit
cleanup() {
  echo ""
  echo "Stopping server..."
  kill $SERVER_PID 2>/dev/null || true
  if [[ -n "${NGROK_PID:-}" ]]; then
    kill $NGROK_PID 2>/dev/null || true
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

wait $SERVER_PID
