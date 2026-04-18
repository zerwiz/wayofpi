#!/usr/bin/env bash
#
# Optional: install the ngrok agent on the host (Debian/Ubuntu apt) or print copy-paste hints.
# Way of Pi does not require ngrok for local use — Settings → ngrok can still use the npm
# optionalDependency in apps/wayofpi-ui after `npm install` there.
#
# Usage (from repo root):
#   ./scripts/install-ngrok-optional.sh              # print apt + brew + next steps (no sudo)
#   ./scripts/install-ngrok-optional.sh --install    # run apt install on Linux with apt-get (needs sudo; confirm)
#   ./scripts/install-ngrok-optional.sh --install -y   # same, non-interactive (you must trust this script)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT/apps/wayofpi-ui"

INSTALL=0
YES=0
usage() {
	cat <<'EOF'
Usage:
  ./scripts/install-ngrok-optional.sh              Print apt / brew commands and next steps (no sudo).
  ./scripts/install-ngrok-optional.sh --install    Debian/Ubuntu: run apt install (needs sudo; confirm).
  ./scripts/install-ngrok-optional.sh --install -y   Same, non-interactive.
EOF
	exit 0
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		-h | --help) usage ;;
		--install) INSTALL=1 ;;
		-y | --yes) YES=1 ;;
		*) echo "Unknown option: $1 (try --help)" >&2; exit 2 ;;
	esac
	shift
done

print_apt_block() {
	local codename="${1:-bookworm}"
	cat <<EOF
# Debian / Ubuntu — official ngrok apt repository (requires sudo).
# Replace the codename if needed; \`VERSION_CODENAME\` comes from /etc/os-release on Debian-based distros.

curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \\
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \\
  && echo "deb https://ngrok-agent.s3.amazonaws.com ${codename} main" \\
  | sudo tee /etc/apt/sources.list.d/ngrok.list \\
  && sudo apt update && sudo apt install -y ngrok
EOF
}

if [[ "$INSTALL" != "1" ]]; then
	codename="bookworm"
	if [[ -r /etc/os-release ]]; then
		# shellcheck source=/dev/null
		. /etc/os-release
		codename="${VERSION_CODENAME:-bookworm}"
	fi
	echo "=== Optional ngrok (public https URL to your machine) ==="
	echo ""
	echo "--- Linux (Debian / Ubuntu family, apt) ---"
	print_apt_block "$codename"
	echo ""
	echo "--- macOS (Homebrew) ---"
	echo "brew install ngrok/ngrok/ngrok"
	echo ""
	echo "--- After install ---"
	echo "1. Verify: ngrok version"
	echo "2. Way of Pi → Settings → ngrok (optional) → paste Your Authtoken from:"
	echo "   https://dashboard.ngrok.com/get-started/your-authtoken"
	echo "3. Start the tunnel from that dialog (dev), or run: ngrok http <port>"
	echo ""
	echo "Without system ngrok: (cd apps/wayofpi-ui && npm install) installs optional npm package ngrok → node_modules/ngrok/bin"
	echo ""
	echo "To run the apt commands automatically on this Linux host: $0 --install   (add -y to skip confirm)"
	exit 0
fi

# --install
if [[ "$(uname -s)" != "Linux" ]]; then
	echo "error: --install only runs apt here. On macOS use: brew install ngrok/ngrok/ngrok" >&2
	exit 1
fi
if ! command -v apt-get >/dev/null 2>&1; then
	echo "error: apt-get not found. Use manual install: https://ngrok.com/download" >&2
	exit 1
fi

if [[ "$YES" != "1" ]]; then
	read -r -p "This will use sudo to add the ngrok apt repo and install ngrok. Continue? [y/N] " ans
	case "${ans,,}" in
		y | yes) ;;
		*) echo "Aborted."; exit 1 ;;
	esac
fi

codename="bookworm"
if [[ -r /etc/os-release ]]; then
	# shellcheck source=/dev/null
	. /etc/os-release
	codename="${VERSION_CODENAME:-bookworm}"
fi

curl -fsSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com ${codename} main" | sudo tee /etc/apt/sources.list.d/ngrok.list >/dev/null
sudo apt-get update -qq
sudo apt-get install -y ngrok

echo ""
echo "Done. ngrok version:"
ngrok version || true
echo ""
echo "Next: open Way of Pi → Settings → ngrok (optional) → authtoken → start tunnel."
