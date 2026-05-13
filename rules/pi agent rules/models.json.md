# Model Registry (models.json)

## Overview

**models.json** serves as the **primary model registry** for the Pi AI architecture. It acts as a centralized database that:

- ✅ Defines available AI models across various providers
- ✅ Specifies technical capabilities (context windows, tool use, vision, reasoning)
- ✅ Stores runtime configurations and default settings
- ✅ Enables automatic model selection via `defaultModelPerProvider` fallback
- ✅ Separates credentials (`config.json`) from capabilities (`models.json`)

---

## File Location

### Standard Path

```
~/.pi/agent/models.json
```

### Alternative Paths (for testing)

```
~/.config/pi/models.json    # Legacy path (deprecated)
~/.pi/models.json           # Alternative location
```

**Note**: The standard path is `~/.pi/agent/models.json`. All references assume this location.

---

## File Structure

The registry is **structured by providers**, each containing a list of models and shared API configurations:

```json
{
  "providers": {
    "<provider-name>": {
      "api": "openai-completions|gemini-chat|gemini-web",
      "apiKey": "<api-key-or-credential>",
      "baseUrl": "https://<endpoint>/v1",
      "models": [
        {
          "_launch": true,           // Whether PI should load this model
          "_system": false,          // Whether this is a primary system model
          "api": "...",              // Overrides provider-level API if needed
          "id": "<model-id>",       // Provider-specific model ID
          "name": "<display-name>", // Human-readable name
          "contextWindow": 128000,  // Context size in tokens
          "reasoning": false,       // Supports thinking/reasoning blocks
          "vision": false,          // Supports image analysis
          "toolUse": false,         // Supports function calling/tool use
          "imageGen": false,        // Supports image generation
          "native": false,          // Built-in to PI's core logic
          "maxTokens": 4096,        // Maximum output token limit
          "cost": 0.002,            // Optional: Cost per 1M tokens
          "compat": false           // Compatibility flags (legacy support)
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 128000,
        "maxTokens": 4096
      }
    }
  }
}
```

### Schema Validation

**Required Fields:**
- `providers` → object with provider keys
- `providers.<name>` → object with `models` array
- `models[].id` → required for each model

**Optional Fields:**
- All other fields have defaults or are optional

---

## Provider Types

### 1. Provider Names (Keys)

| Provider Name | Description | API Type | Example |
|---------------|----------|----|-- -----|
| `ollama-local` | Local Ollama instance | `openai-completions` | `ollama run qwen3.5:9b-32k` |
| `ollama-remote` | Remote Ollama server | `openai-completions` | `https://ollama.ai/remote` |
| `openai` | OpenAI API | `openai-completions` | `gpt-4o`, `gpt-4o-mini` |
| `anthropic` | Anthropic Claude API | `openai-completions` | `claude-3-7-sonnet` |
| `google-gemini-cli` | Google Vertex AI CLI | `gemini-chat` | `gemini-1.5-pro` |
| `google-antigravity` | Google Vertex AI web | `gemini-web` | `gemini-1.5-flash` |
| `openrouter` | Aggregator service | `openai-completions` | `anthropic/claude-3.5-sonnet:latest` |
| `groq` | Groq Cloud (LPU inference) | `openai-completions` | `mixtral-8x7b-32768` |
| `aws-bedrock` | AWS Bedrock | `openai-completions` | `anthropic.claude-v3` |
| `azure-openai` | Azure OpenAI Service | `openai-completions` | `azure/gpt-4o` |
| `cohere` | Cohere API | `openai-completions` | `command-r-plus` |

**Note**: Provider keys are registered by Pi's core and cannot be arbitrary strings.

---

### 2. API Types

| API Type | Description | Compatible Providers |
|------|------|--|- |
| `openai-completions` | Standard chat/completions logic | Most providers (OpenAI, Ollama, Anthropic, etc.) |
| `gemini-chat` | Google Vertex/Gemini chat structures | `google-gemini-cli`, `google-antigravity` |
| `gemini-web` | Web-based Vertex integrations | `google-antigravity` |

**API Override**: Individual models can specify a different `api` type to override provider-level setting.

---

## Key Model Properties

### Property Details

| Property | Type | Description | Default |
|----------|----|--|----|
| `_launch` | boolean | If `true`, PI attempts to verify availability and load metadata on startup | `false` |
| `_system` | boolean | If `true`, designates the model as a primary assistant for core tasks | `false` |
| `api` | string | Overrides provider-level API setting if needed | Provider's default |
| `id` | string | The exact string passed to the provider's API (e.g., `gpt-4o`, `claude-3-7-sonnet`) | Required |
| `name` | string | Human-readable name for display in UI | Auto-generated from `id` |
| `contextWindow` | number | Context size in tokens (1k–128k) | `4096` |
| `reasoning` | boolean | Supports `--think` CLI flags and reasoning-specific prompts | `false` |
| `vision` | boolean | Supports image analysis/multimodal input | `false` |
| `toolUse` | boolean | Supports function calling/tool use capabilities | `false` |
| `imageGen` | boolean | Supports image generation | `false` |
| `native` | boolean | Model is a first-class citizen in PI core | `false` |
| `maxTokens` | number | Maximum output token limit (1k–8k) | `4096` |
| `cost` | number | Cost per 1M tokens (in USD, optional) | `null` |
| `compat` | boolean | Compatibility flags for legacy support | `false` |

### Model Capabilities Matrix

| Capability | Description | Example Models |
|-----------|-------------|----------------|
| **Reasoning** | `--think` flags enabled | `o1`, `o3`, `gpt-4o-reasoning` |
| **Vision** | Image input/analysis | `gpt-4o`, `claude-3.5` |
| **Tool Use** | Function calling | `claude-3.5`, `gpt-4o` |
| **Image Generation** | DALL-E / stable diffusion | `dall-e-3` (via plugin) |
| **Native** | PI core integration | `pi-coding-agent-v1` |

---

## Example models.json

### Complete Example

```json
{
  "providers": {
    "ollama-local": {
      "api": "openai-completions",
      "apiKey": null,
      "baseUrl": "http://localhost:11434/v1",
      "models": [
        {
          "_launch": true,
          "_system": true,
          "id": "qwen3.5:9b-32k",
          "name": "Qwen 3.5 9B (32K)",
          "contextWindow": 32768,
          "reasoning": false,
          "vision": true,
          "toolUse": false,
          "imageGen": false,
          "native": false,
          "maxTokens": 8192,
          "cost": null
        },
        {
          "_launch": false,
          "id": "llama3.2:3b",
          "name": "Llama 3.2 3B",
          "contextWindow": 8192,
          "maxTokens": 4096
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 32768,
        "maxTokens": 8192
      }
    },

    "openai": {
      "api": "openai-completions",
      "apiKey": "sk-proj-...",
      "baseUrl": "https://api.openai.com/v1",
      "models": [
        {
          "_launch": false,
          "_system": false,
          "id": "gpt-4o",
          "name": "GPT-4o",
          "contextWindow": 128000,
          "reasoning": true,
          "vision": true,
          "toolUse": true,
          "maxTokens": 4096,
          "cost": 2.50
        },
        {
          "_launch": false,
          "id": "gpt-4o-mini",
          "name": "GPT-4o Mini",
          "contextWindow": 128000,
          "maxTokens": 4096,
          "cost": 0.15
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 128000,
        "maxTokens": 4096
      }
    },

    "anthropic": {
      "api": "openai-completions",
      "apiKey": "anthropic-...",
      "baseUrl": "https://api.anthropic.com/v1",
      "models": [
        {
          "_launch": false,
          "_system": false,
          "id": "claude-3-7-sonnet",
          "name": "Claude 3.7 Sonnet",
          "contextWindow": 200000,
          "reasoning": true,
          "vision": true,
          "toolUse": true,
          "maxTokens": 8192,
          "cost": 3.00
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 200000,
        "maxTokens": 8192
      }
    },

    "openrouter": {
      "api": "openai-completions",
      "apiKey": "orr-...",
      "baseUrl": "https://openrouter.ai/api/v1",
      "models": [
        {
          "_launch": false,
          "id": "anthropic/claude-3.5-sonnet:latest",
          "name": "Anthropic Claude 3.5 (OpenRouter)",
          "contextWindow": 200000,
          "maxTokens": 8192,
          "cost": 3.00
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 200000,
        "maxTokens": 8192
      }
    }
  }
}
```

---

## Usage: How models.json Works

### 1. Model Selection Resolution

When a user sets a model in `settings.json` (e.g., `"defaultModel": "qwen3.5:9b-32k"`):

1. **Resolve defaultProvider**: Extract provider name from model ID (e.g., `ollama-local`)
2. **Look up entry in models.json**: Find matching provider key
3. **Search models array**: Find model with matching `id`
4. **Load metadata**: Extract context window, capabilities, etc.
5. **Activate in session**: Use during inference

### Model ID Resolution Example

```json
// settings.json
{
  "defaultProvider": "ollama-local",
  "defaultModel": "qwen3.5:9b-32k"
}

// models.json
{
  "providers": {
    "ollama-local": {
      "models": [
        {
          "id": "qwen3.5:9b-32k",
          "name": "Qwen 3.5 9B"
        }
      ]
    }
  }
}
```

**Result**: Both settings files must align. Pi resolves `qwen3.5:9b-32k` to the registered model entry.

---

### 2. Provider Auto-Discovery (Fallback)

Pi uses a built-in table (**`defaultModelPerProvider`**) to map provider names to their most stable models. If a user defines a new provider without a specific model ID, Pi references this table for fallback:

```json
// Built-in fallback models (Pi registry)
{
  "ollama-local": ["qwen3.5:9b-32k", "llama3.3", "mistral-nemo"],
  "openai": ["gpt-4o", "gpt-4o-mini"],
  "anthropic": ["claude-3-7-sonnet"],
  "groq": ["llama-3.1-8b", "mixtral-8x7b-32768"],
  "aws-bedrock": ["anthropic.claude-v3", "meta.llama3-70b"]
}
```

**Fallback Behavior**:
1. User specifies model ID not in `models.json`
2. Pi searches built-in `defaultModelPerProvider` table
3. If found, uses fallback model
4. Otherwise, returns error "Model not available"

---

## Configuration Files Location

### Standard Location

```
~/.pi/agent/models.json   # Primary registry (recommended)
```

### Legacy Location

```
~/.config/pi/config.json  # Deprecated (credentials + models mixed)
```

### Recommended Migration (2025)

**Before 2025**: Models stored in `config.json` (mixed credentials)

**After 2025**: 
- `~/.pi/agent/models.json` → Models registry (capabilities only)
- `~/.pi/agent/config.json` → Configuration (provider names, fallback settings)
- `~/.pi/agent/config.json` → Credentials (via environment variables or secure storage)

**Migration Command**:
```bash
pi migrate-models
# Moves models from config.json to agent/models.json
# Converts credentials to environment variables
```

---

## Best Practices

### 1. Accuracy (Context Windows)

**Keep `contextWindow` values accurate**:
- Prevents context overflows
- Avoids API errors
- Enables proper history truncation

**Example**:

```json
{
  "id": "gpt-4o",
  "contextWindow": 128000,  // ✅ Accurate (256K / 2 from system tokens)
  "name": "GPT-4o"
}
```

❌ **Error**: `"contextWindow": 4096` for a 128K model → Context overflow

---

### 2. Safety (Launch Flags)

**Use `_launch: false`** for models you're testing:

```json
{
  "id": "experimental-model",
  "_launch": false,  // ✅ Don't load on startup
  "name": "Experimental Model",
  "reasoning": true
}
```

**Enable with flag**: `PI_FORCE_LOAD=true` or CLI flag `--load`

---

### 3. Naming (UX)

**Always provide `name` for UI display**:

```json
{
  "id": "qwen3.5:9b-32k",
  "name": "Qwen 3.5 9B (32K Context)",  // ✅ Clear, descriptive
  "contextWindow": 32768
}
```

**Avoid generic names** like `"model-1"` → Users can't distinguish

---

### 4. Credits (Cost Tracking)

**Optional `cost` field**: Track costs across models

```json
{
  "id": "claude-3-7-sonnet",
  "cost": 3.00,  // $3.00 per 1M tokens
  "name": "Claude 3.7"
}
```

---

### 5. Validation

**Before deployment**:

1. All `id` fields are unique per provider
2. `_launch` flags are correct
3. `contextWindow` values are accurate
4. Environment variables set for API keys

---

## Secrets Management

### Security Best Practices

1. **Never store secrets in git**: Remove `apiKey` from versioned configs
2. **Use environment variables**: Read APIs from `~/.pi/keys/<provider>`
3. **Use secure storage**: `~/.pi/agent/keys.json.enc` (encrypted)
4. **Rotate regularly**: Update keys in `config.json` (not `models.json`)

### Example with ENV Variables

```json
{
  "openai": {
    "apiKey": "$PI_OPENAI_API_KEY",  // Read from environment
    "baseUrl": "https://api.openai.com/v1"
  }
}
```

**Set environment variable**:
```bash
export PI_OPENAI_API_KEY="sk-proj-..."
```

---

## Troubleshooting

### Error: Model not available

**Cause**:
- The `id` is missing from `models.json` array
- `_launch` is set to `false`
- API is unreachable or rate-limited

**Fix**:
1. Verify `id` string in `models.json`
2. Set `_launch: true` for production models
3. Check provider API connectivity

**Command**:
```bash
# Verify model
pi models list ollama-local

# Load model manually
ollama run qwen3.5:9b-32k
```

---

### Error: Unknown provider

**Cause**:
- The key in `providers` object doesn't match the request
- Provider name changed in latest model version

**Fix**:
1. Ensure `settings.json` references existing provider key
2. Check `models.json` providers list

**Example**:

```json
// settings.json
"defaultProvider": "ollama-local"  // ✅ Exists

// models.json
{
  "providers": {
    "ollama-local": { ... }  // ✅ Exists
  }
}
```

---

### Error: Context overflow

**Cause**:
- `contextWindow` value too small
- History not being truncated properly

**Fix**:
1. Update `contextWindow` to match provider spec
2. Enable history chunking: `pi settings --history-truncate`

---

### Error: API key invalid

**Cause**:
- Key expired or revoked
- Provider rate-limited

**Fix**:
1. Regenerate API key
2. Check provider dashboard for rate limits
3. Use `_launch: false` while troubleshooting

---

## Migration Guide

### From config.json (Legacy)

```bash
# Auto-migration
pi migrate-models
```

**What it does**:
1. Extracts models from `config.json` `api.models`
2. Creates `~/.pi/agent/models.json`
3. Moves API keys to `~/.pi/agent/keys.json.enc`
4. Converts legacy field names

**Manual steps**:

```bash
# Copy old models
cp ~/.config/pi/config.json ~/.pi/agent/models-backup.json

# Create new registry
pi init-models registry
```

---

## Version Compatibility

| Version | API Type | Supported providers |
|---------|----------|---------------------|
| 1.x | Legacy (mixed) | All providers |
| 2.0 (2025) | `openai-completions` | Standard |
| 2.1+ | `gemini-*` | Google Vertex |

**Migration note**: Always ensure `models.json` version compatibility with Pi CLI version.

---

## Security

### Key Security Rules

1. **Never commit keys to git**: Use `.piignore` or gitignore
2. **Encrypt sensitive configs**: `pi encrypt ~/.config/pi/config.json`
3. **Rotate keys monthly**: Set calendar reminder
4. **Audit access**: Review who has access to keys

### Example: `.piignore`

```
.env.*
*.key
*.pem
~/.pi/agent/keys.json
~/.pi/agent/keys.json.enc
```

---

## 🔗 References

- **Pi Dev**: https://www.pi.dev
- **Pi Coding Agent**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub**: https://github.com/badlogic
- **Model Context Protocol**: https://modelcontextprotocol.io/

---

## 📝 Last Updated

2025

**Target Ecosystem**: pi.dev
