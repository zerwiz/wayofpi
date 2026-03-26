#!/usr/bin/env bash
# Symlink Pi playground `just` recipes into ~/.local/bin (or $PREFIX/bin).
# Safe: does not shadow the real `pi` binary — use `ppi-pi` for vanilla `just pi`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PPI="$ROOT/scripts/ppi"
BIN_DIR="${PREFIX:+$PREFIX/bin}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

if [[ ! -x "$PPI" ]]; then
	chmod +x "$PPI" 2>/dev/null || true
fi

recipes=(
	pi
	ext-pure-focus
	ext-minimal
	ext-cross-agent
	ext-purpose-gate
	ext-tool-counter
	ext-tool-counter-widget
	ext-subagent-widget
	ext-tilldone
	ext-agent-team
	ext-system-select
	ext-damage-control
	ext-agent-chain
	ext-pi-pi
	ext-session-replay
	ext-theme-cycler
	ext-extension-picker
	ext-session-memory
	ext-session-saver
	ext-chronicle
	ext-agent-forge
	ext-dynamic-loader
	ext-ralph
	honcho-up
	honcho-up-api
	honcho-down
	honcho-status
	hermes-status
	hermes-honcho-status
	hermes-honcho-setup
	pi-e
	open
	all
	all-open
)

mkdir -p "$BIN_DIR"

ln -sf "$PPI" "$BIN_DIR/ppi"
ln -sf "$PPI" "$BIN_DIR/pi-e"

for r in "${recipes[@]}"; do
	[[ "$r" == "pi-e" ]] && continue
	ln -sf "$PPI" "$BIN_DIR/ppi-$r"
done

echo "Linked Pi playground launchers into $BIN_DIR"
echo "  ppi [recipe] [args…]   — same as: cd $ROOT && just …"
echo "  pi-e                   — extension picker"
echo "  ppi-ext-minimal        — example shortcut"
echo "  ppi-pi                 — vanilla Pi (just pi)"
echo ""
echo "Ensure $BIN_DIR is on your PATH."
if ! command -v just >/dev/null 2>&1; then
	echo ""
	echo "Note: 'ppi' and 'ppi-*' run 'just' internally. Install just (e.g. sudo snap install just) so those commands work."
fi
