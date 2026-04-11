#!/usr/bin/env bash
# Install Freedesktop menu entry + hicolor icon so Way of Pi matches other dock apps.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
APP_DIR="$DATA/applications"
ICON_BASE="$DATA/icons/hicolor"
PNG_SRC="$ROOT/images/wayofpi-icon.png"

if [[ ! -f "$PNG_SRC" ]]; then
	echo "error: missing $PNG_SRC (generate or copy wayofpi-icon.png first)" >&2
	exit 1
fi

mkdir -p "$APP_DIR" "$ICON_BASE/512x512/apps" "$ICON_BASE/256x256/apps" "$ICON_BASE/48x48/apps"
if command -v convert >/dev/null 2>&1; then
	convert "$PNG_SRC" -resize 256x256 "$ICON_BASE/256x256/apps/wayofpi.png"
	convert "$PNG_SRC" -resize 48x48 "$ICON_BASE/48x48/apps/wayofpi.png"
else
	cp "$PNG_SRC" "$ICON_BASE/256x256/apps/wayofpi.png"
	cp "$PNG_SRC" "$ICON_BASE/48x48/apps/wayofpi.png"
fi
cp "$PNG_SRC" "$ICON_BASE/512x512/apps/wayofpi.png"

sed "s|@REPO@|$ROOT|g" "$ROOT/linux/wayofpi.desktop.in" >"$APP_DIR/wayofpi.desktop"
chmod +x "$ROOT/linux/wayofpi-launch.sh"

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
	gtk-update-icon-cache -f -t "$ICON_BASE" >/dev/null 2>&1 || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
	update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

echo "Installed: $APP_DIR/wayofpi.desktop"
echo "Icons: $ICON_BASE/*/apps/wayofpi.png"
echo "Log out of the session or restart the shell if the dock does not pick up the icon yet."
