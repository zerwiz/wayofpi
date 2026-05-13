#!/usr/bin/env bash
# Install ${USER_HOME}/.local/bin helpers for this Honcho repo (stack + browser openers).
# Does not touch Pi. Requires `just` on PATH for honcho-up / honcho-status delegates.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HS="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="${PREFIX:+$PREFIX/bin}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
mkdir -p "$BIN_DIR"

chmod +x "$SCRIPT_DIR/honcho-open-ui.sh" 2>/dev/null || true

write_open() {
	local name=$1 kind=$2
	cat >"$BIN_DIR/$name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec bash "$HS/scripts/honcho-open-ui.sh" "$kind"
EOF
	chmod +x "$BIN_DIR/$name"
}

write_just_delegate() {
	local name=$1 recipe=$2
	cat >"$BIN_DIR/$name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$HS" && exec just "$recipe" "\$@"
EOF
	chmod +x "$BIN_DIR/$name"
}

write_open honcho-open-docs docs
write_open honcho-open-redoc redoc
write_open honcho-open-metrics metrics
write_open honcho-open-cloud cloud
write_open honcho-open-cloud-playground cloud-playground
write_open honcho-open-cloud-explore cloud-explore
write_open honcho-open-docs-web docs-web
write_open honcho-open-cloud-billing cloud-billing
write_open honcho-open-cloud-status cloud-status
write_open honcho-open-cloud-performance cloud-performance
write_open honcho-open-cloud-api-keys cloud-api-keys
write_open honcho-open-cloud-webhooks cloud-webhooks
write_open honcho-open-cloud-members cloud-members
write_open honcho-open-docs-platform docs-platform

write_just_delegate honcho-up honcho-up
write_just_delegate honcho-up-api honcho-up-api
write_just_delegate honcho-down honcho-down
write_just_delegate honcho-status honcho-status

echo "Installed Honcho helpers into $BIN_DIR (repo: $HS)"
echo "  honcho-up | honcho-down | honcho-status — Docker stack (just, this repo)"
echo "  honcho-open-* — browser (honcho-open-ui.sh)"
echo "Ensure $BIN_DIR is on PATH and install https://github.com/casey/just#installation if needed."
