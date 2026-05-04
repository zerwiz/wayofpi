# Way of Pi: One-Click Installer for Windows
# This script installs Way of Pi, Ollama, and the Qwen model.

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      Way of Pi Installer (Windows)       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# --- Ollama Installation ---

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "Downloading and installing Ollama..."
    $ollamaUrl = "https://ollama.com/download/OllamaSetup.exe"
    $ollamaExe = "$env:TEMP\OllamaSetup.exe"
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $ollamaExe
    Start-Process -FilePath $ollamaExe -ArgumentList "/silent" -Wait
} else {
    Write-Host "Ollama is already installed."
}

# --- Model Retrieval ---

Write-Host "Pulling Qwen 2.5 (9B)..."
ollama pull qwen2.5:9b

# --- Way of Pi Installation ---

# Placeholder Release URL
# $releaseUrl = "https://github.com/USER/REPO/releases/latest/download/WayofPi-Setup.exe"

Write-Host "Note: Please download the Way of Pi installer (.exe) from GitHub Releases." -ForegroundColor Yellow
Write-Host "In Phase 3, this script will automatically download and run the installer."

Write-Host "==========================================" -ForegroundColor Green
Write-Host "      Installation Complete!              " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "You can now launch Way of Pi from your Start Menu."
Write-Host "Default Login: admin / admin"
