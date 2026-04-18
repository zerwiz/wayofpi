#!/bin/bash
# copy-release.sh - Copy Way of Pi source tree into debian directory
set -e

SOURCE=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
DEBIAN="$SOURCE/debian/source/debian"

echo "=== Copying Way of Pi to Release Directory =="

# Copy main project files to debian
mkdir -p "$DEBIAN/wayofpi"
cp -r . "$DEBIAN/wayofpi/"

# Copy all directories
for dir in $SOURCE/{agent,docs,extensions,projects,specs,scripts,inprogress,ref,themes,plans,images,storage,linux,theme-lib,prompts,todo,done,global-agents,prompt,ref,linux,docker,node_modules,packages} ; do
    if [ -d "$dir" ]; then
        rel_path=${dir#$SOURCE}
        mkdir -p "$DEBIAN/wayofpi/$rel_path"
        cp -r "$dir"/* "$DEBIAN/wayofpi/$rel_path/" 2>/dev/null || true
    fi
done

# Copy apps subdirectory
cp -r "$SOURCE/apps" "$DEBIAN/wayofpi/"

# Copy .env file (or create if not exists)
if [ -f "$SOURCE/.env" ]; then
    cp "$SOURCE/.env" "$DEBIAN/wayofpi/" 2>/dev/null || true
fi

# Copy node_modules if exists
if [ -d "$SOURCE/node_modules" ]; then
    mkdir -p "$DEBIAN/wayofpi/node_modules"
    cp -r "$SOURCE/node_modules"/* "$DEBIAN/wayofpi/node_modules/" 2>/dev/null || true
fi

# Copy .pi directory
if [ -d "$SOURCE/.pi" ]; then
    mkdir -p "$DEBIAN/wayofpi/.pi"
    cp -r "$SOURCE/.pi"/* "$DEBIAN/wayofpi/.pi/" 2>/dev/null || true
else
    mkdir -p "$DEBIAN/wayofpi/.pi"
    cp "$SOURCE/.pi/settings.json" "$DEBIAN/wayofpi/.pi/" 2>/dev/null || true
fi

# Copy agent directory
if [ -d "$SOURCE/agent" ]; then
    mkdir -p "$DEBIAN/wayofpi/agent"
    cp -r "$SOURCE/agent"/* "$DEBIAN/wayofpi/agent/" 2>/dev/null || true
else
    mkdir -p "$DEBIAN/wayofpi/agent"
fi

# Copy docs
if [ -d "$SOURCE/docs" ]; then
    mkdir -p "$DEBIAN/wayofpi/docs"
    cp -r "$SOURCE/docs"/* "$DEBIAN/wayofpi/docs/" 2>/dev/null || true
fi

# Copy images
if [ -d "$SOURCE/images" ]; then
    mkdir -p "$DEBIAN/wayofpi/images"
    cp -r "$SOURCE/images"/* "$DEBIAN/wayofpi/images/" 2>/dev/null || true
fi

# Copy scripts
if [ -d "$SOURCE/scripts" ]; then
    mkdir -p "$DEBIAN/wayofpi/scripts"
    cp -r "$SOURCE/scripts"/* "$DEBIAN/wayofpi/scripts/" 2>/dev/null || true
fi

# Copy justfile
if [ -f "$SOURCE/justfile" ]; then
    cp "$SOURCE/justfile" "$DEBIAN/wayofpi/"
fi

# Copy LICENSE
if [ -f "$SOURCE/LICENSE" ]; then
    cp "$SOURCE/LICENSE" "$DEBIAN/wayofpi/"
fi

# Set permissions
echo "=== Setting Permissions ===="
chmod -R a+rX "$DEBIAN/wayofpi/"
chmod 644 "$DEBIAN/wayofpi/debian/control"
chmod 644 "$DEBIAN/wayofpi/debian/changelog"
chmod 644 "$DEBIAN/wayofpi/debian/copyright"

echo "=== Release Directory Ready ===="
echo "Source:"
ls -la "$DEBIAN/wayofpi/" | head -50

echo ""
echo "=== Build Ready ===="
echo "To build:"
echo "  cd $DEBIAN/wayofpi"
echo "  debuild -us -uc"
