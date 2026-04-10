#!/usr/bin/env bash
# Symlink Pi playground `just` recipes into ~/.local/bin (or $PREFIX/bin).
#
# Coexistence:
#   • Never install a global name `pi` → ppi (would make `just pi` → `exec pi` recurse into ppi).
#   • Use ppi-pi, pg-pi, or ppi ext-minimal … — real `pi` stays your upstream CLI earlier on PATH.
#   • Honcho stack / browser openers are **not** installed here — use `~/honcho-server/scripts/install-honcho-bin.sh`.
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
	pi-standard
	pi-cycle-or-free-first
	pi-picker-ollama-free-or
	ext-pure-focus
	ext-minimal
	ext-cross-agent
	ext-purpose-gate
	ext-tool-counter
	ext-tool-counter-widget
	ext-subagent-widget
	ext-tilldone
	ext-agent-team
	ext-builder-team
	ext-system-select
	ext-damage-control
	ext-agent-chain
	ext-pi-pi
	ext-session-replay
	ext-theme-cycler
	ext-extension-picker
	ext-session-memory
	ext-context-local-hints
	ext-session-saver
	ext-chronicle
	ext-agent-forge
	ext-dynamic-loader
	ext-pi-doctor
	ext-web-tools
	ext-ralph
	normalize-pi-config-models
	install-global
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
STD="$ROOT/scripts/pi-standard"
if [[ -f "$STD" ]]; then
	chmod +x "$STD" 2>/dev/null || true
	ln -sf "$STD" "$BIN_DIR/pi-standard"
fi

for r in "${recipes[@]}"; do
	[[ "$r" == "pi-e" ]] && continue
	ln -sf "$PPI" "$BIN_DIR/ppi-$r"
done

# Legacy Pi install artifacts (Honcho now lives under ~/honcho-server).
for _legacy in ppi-honcho-up ppi-honcho-up-api ppi-honcho-down ppi-honcho-status \
	ppi-honcho-open-docs ppi-honcho-open-redoc ppi-honcho-open-metrics \
	ppi-honcho-open-cloud ppi-honcho-open-cloud-playground ppi-honcho-open-cloud-explore \
	ppi-honcho-open-docs-web ppi-honcho-open-cloud-billing ppi-honcho-open-cloud-status \
	ppi-honcho-open-cloud-performance ppi-honcho-open-cloud-api-keys \
	ppi-honcho-open-cloud-webhooks ppi-honcho-open-cloud-members \
	ppi-honcho-open-docs-platform ppi-honcho-open-ui-list; do
	rm -f "$BIN_DIR/$_legacy"
done

for _gone in honcho-up honcho-up-api honcho-down honcho-status \
	honcho-open-docs honcho-open-redoc honcho-open-metrics \
	honcho-open-cloud honcho-open-cloud-playground honcho-open-cloud-explore \
	honcho-open-docs-web honcho-open-cloud-billing honcho-open-cloud-status \
	honcho-open-cloud-performance honcho-open-cloud-api-keys \
	honcho-open-cloud-webhooks honcho-open-cloud-members \
	honcho-open-docs-platform; do
	rm -f "$BIN_DIR/$_gone"
done

write_delegate_wrapper() {
	local name=$1 target=$2
	{
		echo '#!/usr/bin/env bash'
		echo 'set -euo pipefail'
		echo '_bin="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"'
		echo 'exec "$_bin/'"$target"'" "$@"'
	} >"$BIN_DIR/$name"
	chmod +x "$BIN_DIR/$name"
}

write_delegate_wrapper hermes-status ppi-hermes-status
write_delegate_wrapper hermes-honcho-status ppi-hermes-honcho-status
write_delegate_wrapper hermes-honcho-setup ppi-hermes-honcho-setup

# Short Pi playground aliases (do not use plain `pi` — see header).
write_delegate_wrapper pg-pi ppi-pi
write_delegate_wrapper pg-pi-standard ppi-pi-standard

echo "Linked Pi playground launchers into $BIN_DIR"
echo "  Pi:     ppi [recipe] [args…] — cd $ROOT && just …; pi-e; ppi-pi / pg-pi; ppi-ext-* / pi-standard"
echo "  Hermes: hermes-honcho-status | hermes-honcho-setup | … — bridge (wrapper → ppi-hermes-*)"
echo "  Honcho: install from ~/honcho-server — ./scripts/install-honcho-bin.sh (just honcho-up, honcho-open-*, …)"
echo ""
echo "Ensure $BIN_DIR is on your PATH."
if ! command -v just >/dev/null 2>&1; then
	echo ""
	echo "Note: 'ppi' and 'ppi-*' run 'just' internally. Install just (e.g. sudo snap install just) so those commands work."
fi
