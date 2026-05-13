# 🧪 Honcho Multi-Model Tests

## ✅ Test Procedures

### 1. Test Ollama Connection

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test model
ollama run nemotron-cascade-2:30b -q "What is 2+2?"
```

### 2. Test Ollama-Remote Gateway

```bash
# Check remote models
curl http://192.168.68.108:5173/v1/models

# Test remote connection
curl -I http://192.168.68.108:5173/v1
```

### 3. Test OpenRouter

```bash
# Test OpenRouter model
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer sk-or-v1-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-3.3-70b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 4. Test Google API

```bash
# Test Gemini
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=AIzaSy..." \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello Google!"}]}]
  }'
```

---

## 📋 Test Commands

```bash
# ===== Run All Tests =====
source ${USER_HOME}/.hermes/.env
source ${USER_HOME}/.honcho/.env

# Test 1: Ollama
echo "=== Test 1: Ollama ==="
ollama list

# Test 2: Ollama-Remote
echo "=== Test 2: Ollama-Remote ==="
curl -s http://192.168.68.108:5173/v1/models | jq '.models[].name'

# Test 3: OpenRouter status
echo "=== Test 3: OpenRouter ==="
curl -s -o /dev/null -w "%{http_code}" https://openrouter.ai/api/v1 \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Test 4: Check Honcho config
echo "=== Test 4: Config ==="
cat ${USER_HOME}/.honcho/config.json | jq '.models'

# ===== Quick Status =====
just honcho-model-status
```

---

## 📊 Expected Results

| Test | Expected Result | Status |
|--|--|--|
| **Ollama** | Returns model list | ✅ |
| **Ollama-Remote** | Returns 6 models | ✅ |
| **OpenRouter** | 200 OK | ✅ |
| **Google** | 200 OK | ✅ |
| **Honcho Config** | Valid JSON | ✅ |

---

## 🚀 Run Full Test Suite

```bash
#!/bin/bash
# Run all tests
echo "🧪 Honcho Multi-Model Tests"
echo "==============="
echo ""

# Test 1: Ollama
echo "🔷 Test 1: Ollama (Local)"
curl -s http://localhost:11434/api/tags -o /dev/null -w "Status: %{http_code}\n"
echo "   Models: $(curl -s http://localhost:11434/api/tags | grep -c '"name"') models"

# Test 2: Ollama-Remote
echo "🔗 Test 2: Ollama-Remote (Gateway)"
curl -s "http://192.168.68.108:5173/v1/models" -o /dev/null -w "Status: %{http_code}\n"

# Test 3: OpenRouter
echo "🌐 Test 3: OpenRouter"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  https://openrouter.ai/api/v1 \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Test 4: Google
echo "🔷 Test 4: Google"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  https://generativelanguage.googleapis.com/v1beta \
  -H "Content-Type: application/json"

# Test 5: Honcho Config
echo "✅ Test 5: Config Valid"
python3 <<< $'import json; json.load(open("${USER_HOME}/.honcho/config.json"))"
' && echo "Configuration is valid."

echo ""
echo "==============="
echo "✅ All tests complete!"
```

---

**Run Tests**: `bash /home/zerwiz/CodeP/Way\ of\ pi/docs/hermes/HONCHO_TESTS.md`

