#!/usr/bin/env bash
# Start Way of Pi application in Electron
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$ROOT/apps/wayofwork-ui"

if [[ ! -d "$UI_DIR" ]]; then
	echo "error: missing $UI_DIR" >&2
	exit 1
fi

cd "$UI_DIR" 2>/dev/null || exit 1

# Kill any processes using our ports before starting
echo "Checking and cleaning up ports..."

# Function to kill process on a port
kill_on_port() {
	local port=$1
	local attempts=0
	local max_attempts=5

	while [[ $attempts -lt $max_attempts ]]; do
		echo "Checking port $port (attempt $((attempts + 1))/$max_attempts)..."

		# Use lsof -t for reliable PID extraction if available
		local pid=""
		if command -v lsof >/dev/null 2>&1; then
			pid=$(lsof -t -i:${port} 2>/dev/null | head -1 || echo "")
		fi

		# Fallback to ss if lsof failed or not found
		if [[ -z "$pid" ]]; then
			local proc=$(ss -tlnp 2>/dev/null | grep ":${port} " || echo "")
			if [[ -n "$proc" ]]; then
				# Extract PID from ss output (users:(("bun",pid=667915,fd=11)))
				pid=$(echo "$proc" | grep -oP 'pid=\K[0-9]+' | head -1)
			fi
		fi

		# Fallback to netstat
		if [[ -z "$pid" ]]; then
			local proc2=$(netstat -tlnp 2>/dev/null | grep ":${port} " || echo "")
			if [[ -n "$proc2" ]]; then
				pid=$(echo "$proc2" | awk '{print $7}' | cut -d'/' -f1 | grep -E '^[0-9]+$' || echo "")
			fi
		fi

		if [[ -n "$pid" ]]; then
			echo "Killing process $pid on port $port..."
			kill -9 "$pid" 2>/dev/null || true
			sleep 1

			# Double check
			if ! lsof -i:${port} >/dev/null 2>&1; then
				echo "Port $port freed"
				return 0
			fi
		else
			echo "Port $port is free"
			return 0
		fi

		attempts=$((attempts + 1))
	done

	# Last attempt: try pkill
	if [[ $attempts -eq $max_attempts ]]; then
		echo "Port $port still in use, trying force kill..."
		pkill -9 -f ":${port}" 2>/dev/null || true
		sleep 1
		echo "Port $port cleanup completed (final check)"
	fi
}

# Kill processes on our ports
for PORT in 3333 5173; do
	kill_on_port "$PORT"
done

# Extra cleanup: kill common app processes
pkill -9 -f "wayofwork-ui" 2>/dev/null || true
pkill -9 -f "concurrently" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "node.*server" 2>/dev/null || true
pkill -9 -f "electron" 2>/dev/null || true
sleep 1

# Pi.dev startup diagnostics (non-blocking — warnings only)
echo "Running pi.dev startup diagnostics..."
./scripts/pi-version-check.sh 2>/dev/null || echo "[WARN] Pi version mismatch — run 'just pi-fix-version'"
./scripts/pi-startup-log.sh 2>/dev/null || echo "[WARN] Pi startup log failed"

echo "Starting Way of Pi Electron..."

# Check bun
if ! command -v bun >/dev/null 2>&1; then
	echo "error: bun is required" >&2
	exit 1
fi

# Install if needed
if [ ! -d node_modules ]; then
	echo "Installing dependencies with bun..."
	bun install
else
	echo "Updating dependencies (if needed)..."
	bun install --frozen-lockfile 2>/dev/null || bun install
fi

# Start Electron (which starts server + vite via concurrently in package.json)
echo "Launching Electron shell..."
set +e
bun run electron:dev
