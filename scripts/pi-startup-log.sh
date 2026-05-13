#!/usr/bin/env bash
# Way of Pi — Startup diagnostics log: checks all pi.dev integration points
#
# Writes JSONL to logs/pi-startup-<timestamp>.jsonl and prints human-readable summary.
# Non-blocking: always exits 0 (warnings/errors are logged, not fatal).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="$LOG_DIR/pi-startup-$(date -u +%Y%m%d-%H%M%S).jsonl"
PI_BIN=""
PI_VERSION=""
PI_PINNED=""
SDK_AVAILABLE="no"
EXTENSIONAPI_AVAILABLE="no"
BINARY_RESOLVED=""
BINARY_EXISTS="no"
JSON_MODE_OK="no"
PI_STACK_VALUE="${PI_STACK:-}"

mkdir -p "$LOG_DIR"

log_jsonl() {
  local level="$1"
  local check="$2"
  local status="$3"
  local detail="${4:-}"
  echo "{\"timestamp\":\"$TIMESTAMP\",\"level\":\"$level\",\"check\":\"$check\",\"status\":\"$status\",\"detail\":\"$detail\"}" >> "$LOG_FILE"
}

echo ""
echo "=== Way of Pi — Startup Diagnostics ==="
echo ""

# 1. Pi binary discovery
log_jsonl "info" "binary_discovery" "started"
BINARY_RESOLVED=""
if command -v node_modules/.bin/pi &>/dev/null; then
  PI_BIN="$ROOT/node_modules/.bin/pi"
  BINARY_RESOLVED="project-local"
elif command -v ./node_modules/.bin/pi &>/dev/null; then
  PI_BIN="$(pwd)/node_modules/.bin/pi"
  BINARY_RESOLVED="project-local"
elif command -v pi &>/dev/null; then
  PI_BIN="$(which pi 2>/dev/null || echo "")"
  BINARY_RESOLVED="path"
else
  PI_BIN=""
  BINARY_RESOLVED="not-found"
fi

if [[ -n "$PI_BIN" && -x "$PI_BIN" ]]; then
  BINARY_EXISTS="yes"
  log_jsonl "ok" "binary_discovery" "found" "$PI_BIN ($BINARY_RESOLVED)"
  echo "  [OK] pi binary: $PI_BIN ($BINARY_RESOLVED)"
else
  log_jsonl "warn" "binary_discovery" "not_found" "pi binary not resolved"
  echo "  [WARN] pi binary: not found"
fi

# 2. Version check
log_jsonl "info" "version_check" "started"
PI_PINNED="${PI_PINNED_VERSION:-0.74.0}"
if [[ "$BINARY_EXISTS" == "yes" ]]; then
  PI_VERSION=$("$PI_BIN" --version 2>/dev/null | head -n1 | xargs || echo "unknown")
  if [[ "$PI_VERSION" == "$PI_PINNED" ]]; then
    log_jsonl "ok" "version_check" "match" "installed=$PI_VERSION pinned=$PI_PINNED"
    echo "  [OK] pi version: $PI_VERSION (matches pinned $PI_PINNED)"
  else
    log_jsonl "warn" "version_check" "mismatch" "installed=$PI_VERSION pinned=$PI_PINNED"
    echo "  [WARN] pi version: $PI_VERSION (pinned: $PI_PINNED)"
  fi
else
  log_jsonl "warn" "version_check" "skipped" "pi binary not available"
  echo "  [SKIP] pi version: cannot check (binary not found)"
fi

# 3. SDK availability (try importing pi SDK packages)
log_jsonl "info" "sdk_check" "started"
if [[ -d "$ROOT/node_modules/@earendil-works/pi-coding-agent" ]]; then
  SDK_AVAILABLE="yes"
  local_sdk_ver="$(cat "$ROOT/node_modules/@earendil-works/pi-coding-agent/package.json" 2>/dev/null | grep '"version"' | head -1 | sed 's/.*: *"\(.*\)".*/\1/' || echo "unknown")"
  log_jsonl "ok" "sdk_check" "available" "@earendil-works/pi-coding-agent@$local_sdk_ver"
  echo "  [OK] SDK @earendil-works/pi-coding-agent: $local_sdk_ver"
else
  log_jsonl "warn" "sdk_check" "not_found" "@earendil-works/pi-coding-agent not installed"
  echo "  [WARN] SDK @earendil-works/pi-coding-agent: not installed"
fi

# 4. ExtensionAPI import check (from pi-loader.ts dependency)
log_jsonl "info" "extension_api_check" "started"
if [[ -d "$ROOT/node_modules/@mariozechner/pi-coding-agent" ]]; then
  EXTENSIONAPI_AVAILABLE="yes"
  ext_api_ver="$(cat "$ROOT/node_modules/@mariozechner/pi-coding-agent/package.json" 2>/dev/null | grep '"version"' | head -1 | sed 's/.*: *"\(.*\)".*/\1/' || echo "unknown")"
  log_jsonl "ok" "extension_api_check" "available" "@mariozechner/pi-coding-agent@$ext_api_ver"
  echo "  [OK] ExtensionAPI @mariozechner/pi-coding-agent: $ext_api_ver"
else
  log_jsonl "warn" "extension_api_check" "not_found" "@mariozechner/pi-coding-agent not installed"
  echo "  [WARN] ExtensionAPI @mariozechner/pi-coding-agent: not installed"
fi

# 5. JSON mode test
log_jsonl "info" "json_mode_test" "started"
if [[ "$BINARY_EXISTS" == "yes" ]]; then
  json_test=$("$PI_BIN" --mode json --version 2>/dev/null | head -n1 || echo "")
  if [[ -n "$json_test" ]]; then
    JSON_MODE_OK="yes"
    log_jsonl "ok" "json_mode_test" "passed" "pi --mode json --version responded"
    echo "  [OK] JSON mode: pi --mode json --version responds"
  else
    log_jsonl "warn" "json_mode_test" "failed" "pi --mode json --version produced no output"
    echo "  [WARN] JSON mode: no response from pi --mode json --version"
  fi
else
  log_jsonl "warn" "json_mode_test" "skipped" "pi binary not available"
  echo "  [SKIP] JSON mode test: skipped (binary not found)"
fi

# 6. PI_STACK extensions check
log_jsonl "info" "pi_stack_check" "started"
if [[ -n "$PI_STACK_VALUE" ]]; then
  log_jsonl "ok" "pi_stack_check" "configured" "PI_STACK=$PI_STACK_VALUE"
  echo "  [OK] PI_STACK: $PI_STACK_VALUE"
else
  log_jsonl "ok" "pi_stack_check" "unset" "PI_STACK not configured (will use default)"
  echo "  [INFO] PI_STACK: not set (will use default)"
fi

# 7. pi-loader.ts check
log_jsonl "info" "pi_loader_check" "started"
if [[ -f "$ROOT/.pi/extensions/util/pi-loader.ts" ]]; then
  log_jsonl "ok" "pi_loader_check" "found" ".pi/extensions/util/pi-loader.ts exists"
  echo "  [OK] Pi loader: .pi/extensions/util/pi-loader.ts"
else
  log_jsonl "warn" "pi_loader_check" "not_found" ".pi/extensions/util/pi-loader.ts missing"
  echo "  [WARN] Pi loader: .pi/extensions/util/pi-loader.ts not found"
fi

# 8. Agent files check
log_jsonl "info" "agents_check" "started"
agent_count=0
for agent_dir in "$ROOT/agents" "$ROOT/.pi/agents" "$ROOT/.claude/agents"; do
  if [[ -d "$agent_dir" ]]; then
    count=$(find "$agent_dir" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
    agent_count=$((agent_count + count))
  fi
done
log_jsonl "info" "agents_check" "done" "found $agent_count agent .md files"
echo "  [INFO] Agents: $agent_count .md agent files found"

# 9. Session JSONL format (check workspace sessions dir)
log_jsonl "info" "session_check" "started"
session_dir="$ROOT/agent/sessions"
if [[ -d "$session_dir" ]]; then
  session_count=$(find "$session_dir" -name "wayofpi-chat-*.jsonl" 2>/dev/null | wc -l)
  log_jsonl "info" "session_check" "found" "$session_count session files in $session_dir"
  echo "  [INFO] Sessions: $session_count files in agent/sessions/"
else
  log_jsonl "info" "session_check" "empty" "no agent/sessions/ directory yet"
  echo "  [INFO] Sessions: no session directory yet"
fi

# 10. Engine mode check
log_jsonl "info" "engine_check" "started"
ENGINE_MODE="${WOP_CHAT_ENGINE:-auto}"
log_jsonl "info" "engine_check" "configured" "WOP_CHAT_ENGINE=$ENGINE_MODE"
echo "  [INFO] Chat engine: $ENGINE_MODE"

echo ""
echo "--- Summary ---"
echo "  Log written to: $LOG_FILE"
echo "  Binary: $BINARY_EXISTS | Version: ${PI_VERSION:-N/A} | SDK: $SDK_AVAILABLE | ExtAPI: $EXTENSIONAPI_AVAILABLE | JSON: $JSON_MODE_OK"
echo ""

# Always exit 0 — this is advisory, not a gate
exit 0
