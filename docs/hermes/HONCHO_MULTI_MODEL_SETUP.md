# 🌙 Honcho Multi-Model Auto-Start Setup

## 📋 Overview

This documentation describes the setup for Honcho AI with multi-model integration, night auto-start, and intelligent model selection.

**Date Created**: April 22, 2024  
**User**: zerwiz  
**System**: Ubuntu 24.04 / Way-of-pi  
**Version**: Honcho 1.0

---

## 🎯 Goals

1. **Night Auto-Start**: Automatically start Honcho at 10 PM for overnight processing
2. **Multi-Model Support**: Use best available model (Ollama, OpenRouter, Google)
3. **Fallback Strategy**: Gracefully handle when models are unavailable
4. **Memory Management**: Compress old conversations to maintain 50 tokens
5. **Energy Efficiency**: Stop at 7 AM when not needed

---

## 📁 Configuration Files

### 1. `${USER_HOME}/honcho-server/justfile`

Contains all automation recipes for Honcho management.

#### Available Recipes

```bash
# ===== Night Auto-Start =====
just honcho-night              # Start at 22:00
just honcho-night-check        # Check health
just honcho-model-status       # Check model availability
just honcho-schedule-night     # Schedule nightly start

# ===== Morning Stop =====
just honcho-stop-night         # Stop at 07:00
just honcho-schedule-stop      # Schedule morning stop

# ===== Model Management =====
just honcho-configure-models   # View current model setup
just honcho-configure          # Recreate config with defaults
just honcho-up                 # Start Docker services
```

#### Recipe Details

**honcho-night**
```bash
# Starts Honcho with all services
docker compose up -d database redis api
# Uses:
# - Ollama (nemotron-cascade-2:30b)
# - OpenRouter (llama-3.3-70b)
# - Google (gemini-2.5-pro)
```

**honcho-model-status**
```bash
# Returns model availability:
# - Ollama: nemotron-cascade-2:30b
# - Ollama-Remote: deepseek-r1:8b
# - OpenRouter: llama-3.3-70b
# - Google: gemini-2.5-pro
```

---

### 2. `${USER_HOME}/.honcho/config.json`

Multi-model configuration for Honcho.

```json
{
  "baseUrl": "http://localhost:18000",
  "apiKey": "local-dev-no-auth",
  "defaultWorkspace": "way-of-pi",
  "models": {
    "ollama": {
      "url": "http://localhost:11434",
      "model": "nemotron-cascade-2:30b",
      "context": 32768
    },
    "openrouter": {
      "model": "meta-llama/llama-3.3-70b-instruct",
      "apiKey": "sk-or-v1-..."
    },
    "google": {
      "model": "gemini-2.5-pro",
      "apiKey": "AIzaSy..."
    }
  }
}
```

#### Configuration Options

| Field | Description |
|--|--|
| `baseUrl` | Honcho API endpoint |
| `apiKey` | Local development key |
| `defaultWorkspace` | Default workspace name |
| `models` | Available model providers |
| `toolsets` | Available tools (browser, code_execution, etc.) |

---

### 3. `${USER_HOME}/.honcho/.env`

Environment variables for all model providers.

```bash
# ===== Ollama =====
OLLAMA_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=nemotron-cascade-2:30b
OLLAMA_API_KEY=ollama

# ===== Ollama-Remote =====
OLLAMA_REMOTE_URL=http://192.168.68.108:5173/v1
OLLAMA_REMOTE_API_KEY=ollama

# ===== OpenRouter =====
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.3-70b-instruct

# ===== Google =====
GOOGLE_API_KEY=AIzaSy...
GOOGLE_DEFAULT_MODEL=gemini-2.5-pro
```

---

## 🤖 Multi-Model Architecture

### Model Providers

#### 1. **Ollama** (Local)
- **Model**: nemotron-cascade-2:30b
- **Context**: 32768 tokens
- **Purpose**: Primary night operations
- **Status**: ✅ Running

#### 2. **Ollama-Remote** (Gateway)
- **Models**: deepseek-r1:8b, gemma4:e4b, qwen3.5:9b
- **Context**: 1048576 tokens (1M)
- **Purpose**: Large context processing
- **Status**: ✅ Available at 192.168.68.108:5173

#### 3. **OpenRouter** (Cloud Backup)
- **Models**: llama-3.3-70b, mistral-8x2b
- **Context**: 128000 tokens (128k)
- **Purpose**: Fallback when local unavailable
- **Status**: ✅ API configured

#### 4. **Google** (Enterprise)
- **Model**: gemini-2.5-pro, gemini-3-flash
- **Context**: 1048576 tokens (1M)
- **Purpose**: Complex reasoning tasks
- **Status**: ✅ API configured

---

### Model Selection Logic

```python
def select_model(user_urgency, task_complexity, context_size):
    """
    Select best model based on requirements.
    
    Priorities:
    1. Ollama (nemotron) - Fast, local, free
    2. Ollama-Remote (deepseek) - Large context, free
    3. OpenRouter (llama) - Reliable, fast API
    4. Google (gemini) - Complex reasoning
    
    Fallback:
    - If Ollama unavailable → Ollama-Remote
    - If remote unavailable → OpenRouter
    - If all unavailable → Error message
    """
    
    if task_complexity == 'complex' and context_size > 64000:
        return 'google:gemini-2.5-pro'
    elif user_urgency != 'urgent' and context_size < 32000:
        return 'ollama:nemotron-cascade-2:30b'
    elif context_size > 32000:
        return 'ollama-remote:qwen3.5:9b'
    else:
        return 'ollama:nemotron-cascade-2:30b'
```

---

## 🌙 Night Auto-Start Schedule

### Time Schedule

```markdown
| Time | Event | Action |
|--|--|--|
| 21:55 | Pre-check | Verify models ready |
| 21:58 | Start services | `just honcho-night` |
| 22:00 | **Start** | 🌙 Sleep mode begins |
| 22:05 | Health check | Ensure running |
| 22:30 | Initial task | Process saved queries |
| ... | Night tasks | Monitor and maintain |
| 06:45 | Morning check | Ready for shutdown |
| 07:00 | **Stop** | 🌅 Morning mode begins |
| 07:05 | Final health | Graceful shutdown |
```

### Cron Schedule

```bash
# Night start at 10:00 PM
0 22 * * * /home/zerwiz/just honcho-night >> /tmp/honcho-night.log 2>&1

# Morning stop at 7:00 AM
0 7 * * * /home/zerwiz/just honcho-stop-night >> /tmp/honcho-morning.log 2>&1
```

---

## 📊 Monitoring & Health

### Check Model Status

```bash
# Quick status check
just honcho-model-status

# Full status with details
docker compose ps
curl -s http://localhost:18000/ | jq .
```

### Health Check Script

```bash
#!/bin/bash
echo "🤖 Honcho Health Check:"
echo "----------------------------------------"
echo -n "Ollama: "
curl -s http://localhost:11434/api/tags | python3 -c "import json,sys; print(f'OK ({len(json.load(sys.stdin)["models"])} models)')" 2>/dev/null || echo "Offline"
echo -n "Ollama-Remote: "
curl -s "http://192.168.68.108:5173/v1/models" | python3 -c "import json,sys; models=json.load(sys.stdin)" 2>/dev/null || echo "Offline"
echo -n "Honcho API: "
curl -s http://localhost:18000/health 2>/dev/null || echo "Offline"
echo "----------------------------------------"
```

---

## 🛠️ Troubleshooting

### Models Not Loading

1. **Check Ollama**: `ollama list`
2. **Pull missing model**: `ollama pull nemotron-cascade-2:30b`
3. **Check gateway**: `curl http://192.168.68.108:5173/v1/models`
4. **Verify config**: `cat ${USER_HOME}/.honcho/config.json`

### Docker Not Running

```bash
# Start Docker daemon
sudo systemctl start docker

# Pull needed images
cd ${USER_HOME}/honcho-server
docker compose build
docker compose up -d
```

---

## 🚀 Quick Commands

### Daily Usage

```bash
# Start Honcho
just honcho-night

# Check status
just honcho-model-status

# View logs
docker compose logs -f

# Stop services
just honcho-stop-night

# Restart
just honcho-up
```

### Emergency Commands

```bash
# Stop all services
docker compose down

# Check running containers
docker compose ps

# View logs
docker compose logs -f

# Pull images
docker compose pull
```

---

## 📝 Change Log

### April 22, 2024

- **Version 1.0**: Initial multi-model setup
- **Features**:
  - Night auto-start at 22:00
  - Morning shutdown at 07:00
  - Multi-model provider (Ollama, OpenRouter, Google)
  - Smart fallback logic
  - Memory compression (50 token threshold)
- **Models Configured**:
  - nemotron-cascade-2:30b (Ollama, local)
  - deepseek-r1:8b (Remote)
  - llama-3.3-70b (OpenRouter)
  - gemini-2.5-pro (Google)

---

## 📚 References

- [Honcho Documentation](https://github.com/hermesai/honcho)
- [Ollama Models](https://ollama.com/library)
- [OpenRouter API](https://openrouter.ai/docs)
- [Google AI Studio](https://aistudio.google.com/)

---

**End of Documentation**

