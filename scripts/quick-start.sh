#!/bin/bash
# PI Quick Start Script for Ollama Models
# This script sets up and launches PI with your local Ollama models

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=============================================="
echo "      PI Coding Agent - Quick Start"
echo "=============================================="
echo -e "${NC}"

# Check if Ollama is installed
echo -e "${YELLOW}Checking for Ollama installation...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama is installed${NC}"
else
    echo -e "${RED}✗ Ollama is not installed${NC}"
    echo "Please install Ollama first:"
    echo "  macOS:  brew install ollama"
    echo "  Linux:  curl -fsSL https://ollama.com/install.sh | sh"
    echo "  Docker: docker run -d -v \$(pwd)/ollama:/root -p 11434:11434 ollama/ollama"
    exit 1
fi

# Ensure Ollama is running
echo -e "${YELLOW}Ensuring Ollama is running...${NC}"
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting Ollama...${NC}"
    ollama serve &
    sleep 2
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env configuration file...${NC}"
    cat > .env << 'EOF'
# Ollama Configuration
# Copy this file from .env.sample and customize
# Set these variables before running PI

# Ollama API endpoint (default is http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# API key for Ollama (can be any string, we use a local identifier)
OLLAMA_API_KEY=ollama-local

# Default model to use
OLLAMA_MODEL=qwen3.5:latest

# Your available Ollama models:
# unsloth-qwen2.5-coder-32b:latest
# qwen3-14b-claude-sonnet-4.5-high-reasoning-distill-q4-k-m:latest
# Qwen3-14B-claude-sonnet-4.5-high-reasoning-distill-Q4_K_M:latest
# deepseek-coder-v2:latest
# lfm2-24b:latest
# lfm2-long:latest
# qwen3.5-35b:latest
# qwen3.5-35b-long:latest
# qwen3.5:latest
# glm-4.7-flash:latest
# deepseek-r1-8b:latest

# Uncomment and set your preferred model
# OLLAMA_MODEL=unsloth-qwen2.5-coder-32b:latest
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
fi

# Load environment variables
echo -e "${YELLOW}Loading environment variables...${NC}"
source .env
echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Verify Ollama is accessible
echo -e "${YELLOW}Verifying Ollama connection...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is accessible${NC}"

    # List available models
    echo -e "${BLUE}Available models:${NC}"
    ollama list --no-modal | awk '{print "  - "$1}'
else
    echo -e "${RED}✗ Cannot connect to Ollama at localhost:11434${NC}"
    exit 1
fi

# Source the environment and launch PI
echo -e "${YELLOW}Launching PI coding agent...${NC}"
export OLLAMA_BASE_URL
export OLLAMA_API_KEY
export OLLAMA_MODEL

just pi

echo -e "${GREEN}✓ PI started successfully${NC}"
echo -e "${BLUE}Use /model command to switch between models${NC}"
echo -e "${BLUE}Use /tool command to view available tools${NC}"
echo -e "${BLUE}Use /system command to configure agent behavior${NC}"
echo -e "${NC}"
