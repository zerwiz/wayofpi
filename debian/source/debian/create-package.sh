#!/bin/bash
# create-package.sh - Create and build the Way of Pi .deb package
set -e

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEBIAN="$SOURCE/debian/source"
PKG_VERSION="1.0.1"
PKG_NAME="wayof-pi"
MAINTAINER="Zero <zerwiz@proton.me>"

echo "=== Creating Way of Pi Debian Package ==="
echo "Source: $SOURCE"
echo "Debian dir: $DEBIAN"
echo ""

# Step 1: Check prerequisites
echo "=== Checking Prerequisites ==="
check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "✓ $1 is available"
        return 0
    else
        echo "✗ $1 is missing"
        echo "  Install with: apt install $1"
        return 1
    fi
}

check_command "bun" || exit 1
check_command "npm" || exit 1
check_command "git" || exit 1

# Step 2: Install build dependencies
echo ""
echo "=== Installing Build Dependencies ==="
echo "Run this command:"
echo "  sudo apt update"
echo "  sudo apt install -y debhelper dh-nodejs build-essential jq git"
echo ""

# Step 3: Copy source to debian
echo "=== Copying Source to Debian Directory ==="
mkdir -p "$DEBIAN/codedir/wayofpi"

# Copy all relevant files
if [ -d "$SOURCE/agent" ]; then
    cp -r "$SOURCE/agent" "$DEBIAN/codedir/wayofpi/"
else
    mkdir -p "$DEBIAN/codedir/wayofpi/agent"
fi

if [ -d "$SOURCE/apps" ]; then
    cp -r "$SOURCE/apps" "$DEBIAN/codedir/wayofpi/"
else
    mkdir -p "$DEBIAN/codedir/wayofpi/apps"
fi

if [ -d "$SOURCE/docs" ]; then
    cp -r "$SOURCE/docs" "$DEBIAN/codedir/wayofpi/"
else
    mkdir -p "$DEBIAN/codedir/wayofpi/docs"
fi

if [ -d "$SOURCE/docs" ]; then
    cp -r "$SOURCE/docs" "$DEBIAN/codedir/wayofpi/"
else
    mkdir -p "$DEBIAN/codedir/wayofpi/docs"
fi

if [ -f "$SOURCE/justfile" ]; then
    cp "$SOURCE/justfile" "$DEBIAN/codedir/wayofpi/"
else
    touch "$DEBIAN/codedir/wayofpi/justfile"
fi

if [ -f "$SOURCE/README.md" ]; then
    cp "$SOURCE/README.md" "$DEBIAN/codedir/wayofpi/"
else
    echo "# README" > "$DEBIAN/codedir/wayofpi/README.md"
fi

if [ -f "$SOURCE/LICENSE" ]; then
    cp "$SOURCE/LICENSE" "$DEBIAN/codedir/wayofpi/"
fi

if [ -f "$SOURCE/CHANGELOG.md" ]; then
    cp "$SOURCE/CHANGELOG.md" "$DEBIAN/codedir/wayofpi/"
fi

# Create empty directories for missing files
mkdir -p "$DEBIAN/codedir/wayofpi/extensions"
mkdir -p "$DEBIAN/codedir/wayofpi/scripts"
mkdir -p "$DEBIAN/codedir/wayofpi/agent-sessions"
mkdir -p "$DEBIAN/codedir/wayofpi/agent-teams"
mkdir -p "$DEBIAN/codedir/wayofpi/projects"
mkdir -p "$DEBIAN/codedir/wayofpi/ref"
mkdir -p "$DEBIAN/codedir/wayofpi/storage"
mkdir -p "$DEBIAN/codedir/wayofpi/node_modules"
mkdir -p "$DEBIAN/codedir/wayofpi/.pi"

# Copy .pi
if [ -d "$SOURCE/.pi" ]; then
    mkdir -p "$DEBIAN/codedir/wayofpi/.pi"
    cp -r "$SOURCE/.pi"/* "$DEBIAN/codedir/wayofpi/.pi/" 2>/dev/null || true
else
    mkdir -p "$DEBIAN/codedir/wayofpi/.pi"
    echo "# Pi configuration" > "$DEBIAN/codedir/wayofpi/.pi/settings.json"
fi

# Copy images
if [ -d "$SOURCE/images" ]; then
    cp -r "$SOURCE/images"/* "$DEBIAN/codedir/wayofpi/images/" 2>/dev/null || true
else
    mkdir -p "$DEBIAN/codedir/wayofpi/images"
fi

# Copy .env (or create template)
if [ -f "$SOURCE/.env" ]; then
    cp "$SOURCE/.env" "$DEBIAN/codedir/wayofpi/" 2>/dev/null || echo "No .env found"
else
    echo "# .env" > "$DEBIAN/codedir/wayofpi/.env" || true
fi

# Create .env.example
mkdir -p "$DEBIAN/codedir/wayofpi/.pi"
echo "# .env.example - Copy this file and fill with your API keys" > "$DEBIAN/codedir/wayofpi/.env.example"

# Create desktop file
cat > "$DEBIAN/codedir/wayofpi/deps/wayofpi.desktop" << 'EOF'
[Desktop Entry]
Name=Way of Pi
Comment=Pi Coding Agent Desktop Shell
GenericName=AI Code Assistant
Exec=bun run start-wayofpi-electron.sh %U
TryExec=bun
Icon=wayofpi
Terminal=false
Type=Application
Categories=Development;IDE;Productivity;GTK;
Keywords=bun;coding;ai;agent;assistant;editor;
StartupWMClass=Way of Pi
EOF

# Step 4: Update control file
echo ""
echo "=== Updating Control File ==="
cat > "$DEBIAN/codedir/debian/control" << EOF
Source: wayof-pi
Section: x11
Priority: optional
Maintainer: $MAINTAINER
Build-Depends: debhelper (>= 12), dh-nodejs, dh-python
Standards-Version: 4.7.0
Homepage: https://github.com/zerwiz/wayofpi

Package: wayof-pi
Architecture: any
Depends: \${shlibs:Depends}, \${misc:Depends},
         bun (>= 1.3.2), npm, nodejs, just
         debconf, tzdata, xdg-user-dirs
         xkb-data, at-spi2-core
         libatk-bridge2.0-0
         libgtk-3-0, libnotify4
Provides: coding-agent-ui
Description: Way of Pi — Pi Coding Agent desktop shell

 Way of Pi is a friendly wrapper around the Pi Coding Agent that provides
 a full desktop application for interacting with an AI coding assistant.
 It includes the complete Way of Pi shell with the Pi Coding Agent.

 This is a Bun-based Electron desktop application. It is NOT a pre-built
 binary — you must have bun, npm, git, and just installed on your system.

 See README.md for installation and usage instructions.
EOF

# Create changelog
cat > "$DEBIAN/codedir/debian/changelog" << EOF
wayof-pi ($PKG_VERSION) unstable; urgency=medium

  * Initial release of Way of Pi desktop shell
  * Bun-based Electron desktop application for Pi Coding Agent
  * Supports Ollama, OpenRouter, and various AI models

 -- $MAINTAINER  $(date)
EOF

# Create copyright file
cat > "$DEBIAN/codedir/debian/copyright" << EOF
Format: http://www.debian.org/doc/source/docs/development/copyright format 1.5

Source: wayof-pi
Section: dev
Priority: optional
Maintainer: $MAINTAINER
Upstream-Name: Way of Pi
Upstream-Contact: https://github.com/zerwiz/wayofpi
Bug-Submit: https://github.com/zerwiz/wayofpi/issues

Files: .
Copyright: 2022-2024 Zero
 License: Apache-2.0

Files: apps/wayofpi-ui/*
 Copyright: 2022-2024 Zero
 License: MIT

Files: extensions/*
 Copyright: 2022-2024 Zero
 License: MIT

Files: agent/*
 Copyright: 2022-2024 Zero
 License: CC-BY-SA 4.0

Files: docs/*
 Copyright: 2022-2024 Zero
 License: CC-BY-SA 4.0

Files: scripts/*
 Copyright: 2022-2024 Zero
 License: CC-BY-SA 4.0

Files: images/*
 Copyright: 2022-2024 Zero
 License: Public Domain or CC-BY-SA

Files: node_modules/*
 Copyright: See LICENSE files in that directory

Files: packages/*
 Copyright: See LICENSE files in that directory
EOF

# Create README for package
cat > "$DEBIAN/codedir/debian/README" << EOF
# Way of Pi Debian Package

## Installation

### Install Dependencies

```bash
sudo apt update
sudo apt install -y debhelper dh-nodejs build-essential jq git
```

### Build the Package

```bash
cd $DEBIAN/codedir
debuild -b -us -uc
```

This will create the following files:
- `wayof-pi_$PKG_VERSION_all.deb`
- `wayof-pi_$PKG_VERSION_source.changes`
- `wayof-pi_$PKG_VERSION_source.tar.gz`

## Usage

After installing the package:

```bash
sudo dpkg -i wayof-pi_$PKG_VERSION_all.deb
sudo apt-get install -f  # Fix dependencies

# Run the app
wayofpi
```

See README.md in the package for more details.
EOF

# Create postinst
cat > "$DEBIAN/codedir/debian/postinst" << 'EOF'
#!/bin/sh
# /etc/init.d/postinst

if [ "$1" = "configure" ]; then
    # Create necessary directories
    mkdir -p ~/.pi ~/.local/bin ~/.config/wayofpi
    echo "Created configuration directories."
fi
EOF
chmod +x "$DEBIAN/codedir/debian/postinst"

# Create postrm
cat > "$DEBIAN/codedir/debian/postrm" << 'EOF'
#!/bin/sh
# /etc/init.d/postrm

set -e
status=$1
case "$status" in
  purge)
    # Optionally remove user data
    # This is typically not recommended
    rm -rf ~/.pi/.wayofpi-cache 2>/dev/null || true
    ;;
esac
exit 0
EOF
chmod +x "$DEBIAN/codedir/debian/postrm"

# Create rules
cat > "$DEBIAN/codedir/debian/rules" << 'EOF'
#!/usr/bin/make -f

# Debhelper compatibility level
export DH_MAJOR_VERSION = 13
export DEBHELPER=0

include /usr/share/devscripts/dit/rpms/debhelper.mk

package = wayofpi
binary-packages = wayofpi, wayofpi-dev

package = wayofpi
priority = optional
section = x11
standard = optional
maintainer = Zero <zerwiz@proton.me>
build_depends = debhelper (>= 13), dh-nodejs, dh-python
standards_level = 4.7.0

package = wayofpi-dev
section = devel
standard = optional
maintainer = Zero <zerwiz@proton.me>
build_depends = debhelper (>= 13), dh-nodejs, dh-python, git
depends = wayofpi, pi-coding-agent
standard = optional
priority = optional

override_dh_auto_configure:
	dh_auto_configure

override_dh_auto_install:
	dh_auto_install

override_dh_fixperms:
	dh_fixperms

override_dh_installdeb:
	dh_installdeb

override_dh_installdebvars:
	dh_installdebvars

override_dh_shlibdeps:
	dh_shlibdeps

override_dh_gencontrol:
	dh_gencontrol

override_dh_md5sums:
	dh_md5sums

override_dh_gensymbols:
	dh_gensymbols

override_dh_builddeb:
	dh_builddeb

override_dh_installdocs:
	dh_installdocs

override_dh_installchangelogs:
	dh_installchangelogs

override_dh_strip:
	dh_strip

override_dh_systemd:
	dh_systemd

override_dh_systemd_unit:
	dh_systemd_unit

override_dh_systemd_enable:
	dh_systemd_enable

override_dh_auto_clean:
	dh_auto_clean

override_dh_clean:
	dh_clean
EOF

chmod +x "$DEBIAN/codedir/debian/rules"

# Create Makefile for debuild
cat > "$DEBIAN/codedir/debian/Makefile" << 'EOF'
# Build rules for Way of Pi package
SHELL := /bin/bash
DEB_VERSION ?= $(shell git describe --tags 2>/dev/null || echo 1.0.0)
DEB_ARCH := $(shell dpkg-architecture --query DEB_HOST_ARCH)
DEB_PKG := wayofpi

build:
	mkdir -p debian
	debuild -b -us -uc

test:
	dh_test

clean:
	rm -rf debian/*.deb
	rm -rf .debhelper
	rm -rf debian-source-build

.PHONY: build test clean

EOF

# Copy control file
cp "$DEBIAN/codedir/debian/control" "$SOURCE/debian/control"

# Copy changelog
cp "$DEBIAN/codedir/debian/changelog" "$SOURCE/debian/changelog"

# Copy rules
cp "$DEBIAN/codedir/debian/rules" "$SOURCE/debian/rules"

# Copy copyright
cp "$DEBIAN/codedir/debian/copyright" "$SOURCE/debian/copyright"

echo "=== Packaging Complete ==="
echo ""
echo "Debian package structure created in: $DEBIAN/codedir"
echo ""
echo "To build:"
echo "  cd $DEBIAN/codedir"
echo "  debuild -us -uc"
echo ""
echo "This will create .deb files in: debian/"
echo ""
echo "Or use:"
echo "  make -f debian/Makefile build"
echo ""
echo "Installed packages will be in: packages/"
echo ""
