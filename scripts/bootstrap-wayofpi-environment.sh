#!/usr/bin/env bash
#
# Way of Pi — detect host software/hardware and install or report what this repo needs.
#
# Design goals (common bootstrap script practice):
#   - set -euo pipefail, quoted variables, idempotent safe steps (mkdir -p, install-if-missing).
#   - Probe before mutate; print a clear summary for humans and CI (--check-only).
#   - Only run network/curl installers when explicitly requested (--install / -y).
#   - Never silently use sudo; print copy-paste commands for OS packages (just, ripgrep, …).
#
# Usage (from repo root):
#   ./scripts/bootstrap-wayofpi-environment.sh              # report only + hints
#   ./scripts/bootstrap-wayofpi-environment.sh --check-only   # exit 1 if bun/git/node/npm missing
#   ./scripts/bootstrap-wayofpi-environment.sh --install -y    # install Bun (if needed) + npm in apps/wayofpi-ui
#
set -euo pipefail

SCRIPT_NAME="bootstrap-wayofpi-environment"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT/apps/wayofpi-ui"

# Minimum Bun for apps/wayofpi-ui server; full playground README recommends ≥1.3.2 for Pi stack.
BUN_MIN_UI="1.1.0"
BUN_MIN_PLAYGROUND="1.3.2"

CHECK_ONLY=0
DO_INSTALL=0
ASSUME_YES=0
INIT_ENV=0

usage() {
	cat <<'EOF'
Way of Pi — bootstrap / environment probe

  ./scripts/bootstrap-wayofpi-environment.sh [--check-only] [--install] [-y] [--init-env]

  --check-only   Exit 1 if bun, git, node, or npm missing, or Bun < UI minimum (CI).
  --install      Offer (or with -y, run) Bun install script and npm install in apps/wayofpi-ui.
  -y, --yes      Non-interactive yes for --install prompts.
  --init-env     Copy .env.sample to .env at repo root if .env does not exist.
EOF
	exit 0
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		-h | --help) usage ;;
		--check-only) CHECK_ONLY=1 ;;
		--install) DO_INSTALL=1 ;;
		-y | --yes) ASSUME_YES=1 ;;
		--init-env) INIT_ENV=1 ;;
		*) echo "Unknown option: $1 (try --help)" >&2; exit 2 ;;
	esac
	shift
done

log() { printf '[%s] %s\n' "$SCRIPT_NAME" "$*"; }
warn() { printf '[%s] WARN: %s\n' "$SCRIPT_NAME" "$*" >&2; }
die() { printf '[%s] ERROR: %s\n' "$SCRIPT_NAME" "$*" >&2; exit 1; }

# True if sort -V considers $1 >= $2 (both x.y.z).
version_ge() {
	local a="$1" b="$2"
	[[ "$(printf '%s\n%s\n' "$b" "$a" | sort -V | head -n1)" == "$b" ]]
}

detect_os() {
	local u
	u="$(uname -s 2>/dev/null || echo unknown)"
	case "$u" in
		Linux*)
			if [[ -r /proc/version ]] && grep -qi microsoft /proc/version 2>/dev/null; then
				echo "linux-wsl"
			else
				echo "linux"
			fi
			;;
		Darwin*) echo "macos" ;;
		FreeBSD*) echo "freebsd" ;;
		MSYS_* | MINGW* | CYGWIN*) echo "windows-msys" ;;
		*) echo "unknown" ;;
	esac
}

distro_id() {
	if [[ -r /etc/os-release ]]; then
		# shellcheck source=/dev/null
		. /etc/os-release
		echo "${ID:-unknown}"
	elif [[ "$(uname -s)" == "Darwin" ]]; then
		echo "macos"
	else
		echo "unknown"
	fi
}

distro_pretty() {
	if [[ -r /etc/os-release ]]; then
		# shellcheck source=/dev/null
		. /etc/os-release
		echo "${PRETTY_NAME:-${ID:-unknown}}"
	elif [[ "$(uname -s)" == "Darwin" ]]; then
		echo "macOS $(sw_vers -productVersion 2>/dev/null || echo '?')"
	else
		echo "unknown"
	fi
}

have_cmd() { command -v "$1" >/dev/null 2>&1; }

bun_version_raw() {
	bun --version 2>/dev/null | head -n1 | tr -d '\r' | sed 's/^v//'
}

node_version_raw() {
	node --version 2>/dev/null | tr -d 'v\r' | head -n1
}

ollama_reachable() {
	curl -fsS -m 1 "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1
}

prompt_yes() {
	local q="$1" x
	[[ "$ASSUME_YES" == 1 ]] && return 0
	if [[ ! -t 0 ]]; then
		warn "Not a TTY and no -y; skipping: $q"
		return 1
	fi
	read -r -p "$q [y/N] " x
	x="$(echo "$x" | tr '[:upper:]' '[:lower:]')"
	[[ "$x" == "y" || "$x" == "yes" ]]
}

print_just_hint() {
	local id
	id="$(distro_id)"
	case "$OS" in
		macos) echo "  brew install just" ;;
		linux | linux-wsl)
			case "$id" in
				ubuntu | debian | pop | linuxmint)
					echo "  sudo apt update && sudo apt install -y just"
					echo "  # or: sudo snap install just --classic"
					;;
				fedora | rhel | centos | rocky | alma)
					echo "  sudo dnf install -y just"
					;;
				arch | manjaro | endeavouros)
					echo "  sudo pacman -S just"
					;;
				*)
					echo "  See https://github.com/casey/just#installation"
					;;
			esac
			;;
		*)
			echo "  See https://github.com/casey/just#installation"
			;;
	esac
}

probe_version() {
	local bin="$1"
	case "$bin" in
		bun) bun_version_raw ;;
		node) node_version_raw ;;
		npm) npm --version 2>/dev/null | tr -d '\r' ;;
		git) git --version 2>/dev/null | sed 's/.* //' ;;
		just) just --version 2>/dev/null | head -n1 ;;
		pi) pi --version 2>/dev/null | head -n1 || echo present ;;
		rg) rg --version 2>/dev/null | head -n1 ;;
		ollama) ollama --version 2>/dev/null | head -n1 ;;
		*) echo "present" ;;
	esac
}

print_row() {
	local name="$1" bin="$2" state ver extra="${3-}"
	if have_cmd "$bin"; then
		state="ok"
		ver="$(probe_version "$bin")"
	else
		state="missing"
		ver="-"
	fi
	if [[ -n "$extra" ]]; then
		ver="$ver $extra"
	fi
	printf "%-12s %-8s %s\n" "$name" "$state" "$ver"
}

# --- main report ---

OS="$(detect_os)"
ARCH="$(uname -m 2>/dev/null || echo unknown)"
DISTRO_PRETTY="$(distro_pretty)"

echo ""
echo "======== Way of Pi — environment probe ========"
echo " OS:       $OS ($DISTRO_PRETTY)"
echo " Machine:  $ARCH  kernel: $(uname -r 2>/dev/null || echo '?')"
echo " Repo:     $ROOT"
echo "=============================================="
echo ""

if [[ "$OS" == "windows-msys" ]]; then
	warn "Git Bash / MSYS detected. This script targets Unix-like shells."
	echo "  Use WSL2 (Ubuntu) and clone the repo there, or follow:"
	echo "  https://bun.sh/docs/installation#windows"
	echo "  Then: cd apps/wayofpi-ui && npm install"
	if [[ "$CHECK_ONLY" == 1 ]]; then exit 1; fi
	exit 0
fi

if [[ "$OS" == "unknown" ]]; then
	warn "Unrecognized OS; probes may be incomplete."
fi

printf "%-12s %-8s %s\n" "TOOL" "STATE" "VERSION / NOTE"
printf "%-12s %-8s %s\n" "----" "-----" "--------------"

OLLAMA_NOTE=""
if ollama_reachable; then OLLAMA_NOTE="(API up on :11434)"; fi

print_row bun bun
print_row node node
print_row npm npm
print_row git git
print_row just just
print_row pi pi
print_row rg rg
print_row ollama ollama "$OLLAMA_NOTE"
echo ""

# --- version gates ---

BUN_VER=""
BUN_OK=0
if have_cmd bun; then
	BUN_VER="$(bun_version_raw)"
	if version_ge "$BUN_VER" "$BUN_MIN_UI"; then
		BUN_OK=1
		log "Bun $BUN_VER meets Way of Pi UI minimum ($BUN_MIN_UI)."
		if ! version_ge "$BUN_VER" "$BUN_MIN_PLAYGROUND"; then
			warn "For full Pi playground parity, README recommends Bun ≥ $BUN_MIN_PLAYGROUND."
		fi
	else
		warn "Bun $BUN_VER is below UI minimum $BUN_MIN_UI; upgrade recommended."
	fi
else
	warn "Bun is missing (required for apps/wayofpi-ui server)."
fi

CRITICAL_OK=1
have_cmd bun || CRITICAL_OK=0
have_cmd git || CRITICAL_OK=0
have_cmd node || CRITICAL_OK=0
have_cmd npm || CRITICAL_OK=0
[[ "$BUN_OK" == 1 ]] || CRITICAL_OK=0

if [[ "$CRITICAL_OK" == 0 ]]; then
	for need in bun git node npm; do
		have_cmd "$need" || warn "Missing: $need"
	done
fi

echo "--- Suggested OS-level installs (not run automatically) ---"
if ! have_cmd just; then
	echo "* just (task runner for ppi / justfile):"
	print_just_hint
	echo ""
fi
if ! have_cmd rg; then
	echo "* ripgrep (orchestrator grep in Bun server):"
	case "$OS" in
		macos) echo "  brew install ripgrep" ;;
		linux | linux-wsl)
			case "$(distro_id)" in
				ubuntu | debian | pop | linuxmint) echo "  sudo apt install -y ripgrep" ;;
				fedora | rhel | centos | rocky | alma) echo "  sudo dnf install -y ripgrep" ;;
				arch | manjaro | endeavouros) echo "  sudo pacman -S ripgrep" ;;
				*) echo "  https://github.com/BurntSushi/ripgrep#installation" ;;
			esac
			;;
		*) echo "  https://github.com/BurntSushi/ripgrep#installation" ;;
	esac
	echo ""
fi
if ! have_cmd pi; then
	echo "* pi (Pi Coding Agent CLI):"
	echo "  https://github.com/mariozechner/pi-coding-agent"
	echo ""
fi
if ! have_cmd ollama && ! ollama_reachable; then
	echo "* LLM: Ollama (https://ollama.com) or OPENROUTER_API_KEY in .env"
	echo ""
fi

# --- optional .env ---

if [[ "$INIT_ENV" == 1 ]]; then
	if [[ ! -f "$ROOT/.env" && -f "$ROOT/.env.sample" ]]; then
		cp "$ROOT/.env.sample" "$ROOT/.env"
		log "Created $ROOT/.env from .env.sample (edit keys before use)."
	elif [[ -f "$ROOT/.env" ]]; then
		log ".env already exists; not overwriting."
	fi
fi

# --- install path (Bun + npm) ---

if [[ "$DO_INSTALL" == 1 ]]; then
	if ! have_cmd bun || [[ "$BUN_OK" == 0 ]]; then
		if prompt_yes "Install or upgrade Bun via https://bun.sh/install ?"; then
			log "Running Bun install script (user prefix, typically ~/.bun) …"
			curl -fsSL https://bun.sh/install | bash
			if [[ -f "${HOME}/.bun/bin/bun" ]]; then
				export PATH="${HOME}/.bun/bin:${PATH}"
			fi
			if have_cmd bun; then
				BUN_VER="$(bun_version_raw)"
				log "Bun is now: $BUN_VER"
				if version_ge "$BUN_VER" "$BUN_MIN_UI"; then
					BUN_OK=1
				else
					warn "Installed Bun is still below $BUN_MIN_UI; check install output."
				fi
			else
				die "Bun install finished but 'bun' not on PATH. Open a new shell or: export PATH=\"\$HOME/.bun/bin:\$PATH\""
			fi
		fi
	fi

	if have_cmd npm && [[ -d "$UI_DIR" ]]; then
		if prompt_yes "Run npm install in apps/wayofpi-ui ?"; then
			(cd "$UI_DIR" && npm install)
			log "npm install completed in apps/wayofpi-ui"
		fi
	else
		if [[ ! -d "$UI_DIR" ]]; then
			warn "Missing $UI_DIR; skipping npm install."
		elif ! have_cmd npm; then
			warn "npm not found; install Node.js (https://nodejs.org) then re-run with --install -y"
		fi
	fi
fi

# Re-evaluate after optional --install (so CI can run --install -y && --check-only in one invocation).
if have_cmd bun; then
	BUN_VER="$(bun_version_raw)"
	if version_ge "$BUN_VER" "$BUN_MIN_UI"; then
		BUN_OK=1
	else
		BUN_OK=0
	fi
else
	BUN_OK=0
fi
CRITICAL_OK=1
have_cmd bun || CRITICAL_OK=0
have_cmd git || CRITICAL_OK=0
have_cmd node || CRITICAL_OK=0
have_cmd npm || CRITICAL_OK=0
[[ "$BUN_OK" == 1 ]] || CRITICAL_OK=0

# --- exit code for CI ---

if [[ "$CHECK_ONLY" == 1 ]]; then
	if [[ "$CRITICAL_OK" == 1 ]]; then
		log "check-only: OK (bun, git, node, npm present; Bun version OK for UI)."
		exit 0
	fi
	die "check-only: FAIL (need bun ≥ $BUN_MIN_UI, git, node, npm — see hints above)."
fi

echo "Next steps:"
echo "  1. Ensure .env exists: cp .env.sample .env && edit (or: $0 --init-env)"
echo "  2. Start desktop shell: ./start-wayofpi-electron.sh"
echo "  3. Optional global ppi symlinks: ./scripts/install-ppi-global.sh"
echo ""
