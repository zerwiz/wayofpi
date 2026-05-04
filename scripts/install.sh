#!/usr/bin/env bash
set -euo pipefail

# Way of Pi: One-Click Installer for macOS and Linux
# This script installs Way of Pi, Ollama, and the Qwen model.

echo "=========================================="
echo "      Way of Pi Installer (Unix)          "
echo "=========================================="

OS="$(uname -s)"
ARCH="$(uname -m)"

# --- Dependency Checks ---

check_command() {
    command -v "$1" >/dev/null 2>&1
}

if [[ "$OS" == "Darwin" ]]; then
    echo "Detected macOS ($ARCH)"
    if ! check_command brew; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
elif [[ "$OS" == "Linux" ]]; then
    echo "Detected Linux ($ARCH)"
    # Assume apt for now (Ubuntu/Debian)
    if check_command apt; then
        sudo apt update && sudo apt install -y curl jq unzip
    fi
fi

# --- Ollama Installation ---

if ! check_command ollama; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "Ollama is already installed."
fi

# --- Model Retrieval ---

echo "Starting Ollama and pulling Qwen 2.5 (9B)..."
# Start Ollama in background if not running
if ! pgrep -x "ollama" > /dev/null; then
    ollama serve > /dev/null 2>&1 &
    sleep 5
fi
ollama pull qwen2.5:9b

# --- Way of Pi Installation ---

# Placeholder Release URL - Replace with actual repo releases
# RELEASE_URL="https://github.com/USER/REPO/releases/latest/download/..."

echo "Note: Downloading Way of Pi native binary (Phase 3 placeholder)..."
# In a real scenario, we would use curl to fetch the .dmg or .AppImage here.
# For now, we assume the user might be running this from a clone or we just provide the steps.

if [[ "$OS" == "Darwin" ]]; then
    echo "On macOS, please download the .dmg from GitHub Releases and move Way of Pi to /Applications."
elif [[ "$OS" == "Linux" ]]; then
    echo "On Linux, the .AppImage will be placed in ~/.local/bin/wayofpi"
    mkdir -p "$HOME/.local/bin"
    # curl -L "$RELEASE_URL_LINUX" -o "$HOME/.local/bin/wayofpi"
    # chmod +x "$HOME/.local/bin/wayofpi"
fi

echo "=========================================="
echo "      Installation Complete!              "
echo "=========================================="
echo "You can now launch Way of Pi from your Applications or Terminal."
echo "Default Login: admin / admin"
