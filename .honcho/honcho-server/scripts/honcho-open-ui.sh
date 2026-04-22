#!/usr/bin/env bash
# Open local Honcho API docs/metrics and Honcho Cloud / docs URLs in the default browser.
# Sources this repo root .env when present (e.g. HONCHO_BASE_URL for local API port).
# Install PATH helpers: ./scripts/install-honcho-bin.sh (from honcho-server root).
#
# Usage: honcho-open-ui.sh <target> | list | help
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
	set -a
	# shellcheck source=/dev/null
	source "$ROOT/.env"
	set +a
fi

open_url() {
	local url=$1
	printf 'Opening %s\n' "$url" >&2
	if command -v xdg-open >/dev/null 2>&1; then
		xdg-open "$url" >/dev/null 2>&1 &
	elif command -v open >/dev/null 2>&1; then
		open "$url" &
	else
		printf 'No xdg-open/open; open manually: %s\n' "$url" >&2
	fi
}

base="${HONCHO_BASE_URL:-http://127.0.0.1:18000}"
base="${base%/}"

usage() {
	printf 'Usage: %s <target> | list\n' "$(basename "$0")" >&2
	printf '\nLocal (uses HONCHO_BASE_URL, default %s):\n' "$base" >&2
	printf '  docs redoc metrics\n' >&2
	printf '\nHoncho Cloud (https://app.honcho.dev):\n' >&2
	printf '  cloud cloud-billing cloud-status cloud-performance cloud-api-keys\n' >&2
	printf '  cloud-playground cloud-explore cloud-webhooks cloud-members\n' >&2
	printf '\nDocumentation:\n' >&2
	printf '  docs-web docs-platform\n' >&2
}

print_list() {
	printf 'Local API (HONCHO_BASE_URL=%s):\n' "$base"
	printf '  docs redoc metrics\n'
	printf 'Honcho Cloud: see targets above; run "%s help"\n' "$(basename "$0")"
}

case "${1:-}" in
list | ls) print_list ;;
help | -h | --help) usage ;;

docs) open_url "$base/docs" ;;
redoc) open_url "$base/redoc" ;;
metrics) open_url "$base/metrics" ;;

cloud) open_url "https://app.honcho.dev/" ;;
cloud-billing) open_url "https://app.honcho.dev/billing" ;;
cloud-status) open_url "https://app.honcho.dev/status" ;;
cloud-performance) open_url "https://app.honcho.dev/performance" ;;
cloud-api-keys) open_url "https://app.honcho.dev/api-keys" ;;
cloud-playground) open_url "https://app.honcho.dev/playground" ;;
cloud-explore) open_url "https://app.honcho.dev/explore" ;;
cloud-webhooks) open_url "https://app.honcho.dev/webhooks" ;;
cloud-members) open_url "https://app.honcho.dev/members" ;;

docs-web) open_url "https://docs.honcho.dev" ;;
docs-platform) open_url "https://docs.honcho.dev/v3/documentation/reference/platform" ;;
*)
	usage >&2
	exit 1
	;;
esac
