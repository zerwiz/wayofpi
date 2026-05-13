# Extension Creation Rules

## Overview

This document describes how to **create, register, and distribute programmatic Extensions** for the Pi Coding Agent (`pi.dev`). Unlike Skills (which provide context via Markdown), **Extensions are executable TypeScript modules (`.ts`)** that **hook directly into the agent's lifecycle**, allowing you to:

- ✅ Add custom tools callable by the LLM
- ✅ Integrate external APIs
- ✅ Intercept agent events
- ✅ Perform background tasks
- ✅ Modify state across sessions

---

## Directory Structure

Extensions are automatically discovered in the following locations:

| Context | Path | Purpose |
|---------|------|---|
| **Global Extensions** | `~/.pi/extensions/` | System-wide extension registry |
| **Workspace Extensions** | `./.pi/extensions/` | Project-specific extensions (relative to project root) |
| **Manual Loading** | `(any path)` | Via CLI: `pi run --extension ./ext.ts` |

---

## Extension Anatomy

Every extension **must** export a default `activate` function. This function receives the `ExtensionAPI` instance, which is the **primary bridge** between your code and the Pi agent.

### Required Structure

```typescript
import type { ExtensionAPI } from '@pi/sdk';

export default function activate(api: ExtensionAPI) {
  // 1. Register Tools
  // 2. Attach Event Listeners  
  // 3. Initialize State
  // 4. Handle Cleanup
}
```

---

## Creation Guidelines

### 1. Tool Registration (`api.registerTool`)

Tools are functions that the LLM can call via `api.registerTool()`. They **must** be rigorously defined using **JSON Schema**.

#### Required Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | snake_case (e.g., `fetch_jira_ticket`, `analyze_ast`). Max 64 chars. |
| `description` | String | ✅ Yes | Crucial for LLM routing - explain exactly what the tool does and when the agent should use it |
| `schema` | Object | ✅ Yes | Strict JSON Schema defining expected arguments |
| `execute` | Async Function | ✅ Yes | Receives args and context, returns object |

#### Schema Format

```json
{
  "type": "object",
  "properties": {
    "endpoint": {
      "type": "string",
      "description": "The API endpoint to query"
    },
    "params": {
      "type": "object",
      "description": "Query parameters"
    }
  },
  "required": ["endpoint"]
}
```

#### Execution Rules

1. **Always Return an Object**: Use standard format:
   ```typescript
   return {
     success: true,
     data: any,
     error?: string  // Only if success: false
   };
   ```

2. **Manage Context Size**: Do **not** return massive strings (like entire minified JS files). **Truncate, summarize, or paginate** outputs:
   ```typescript
   const MAX_OUTPUT_SIZE = 4096;
   if (result.length > MAX_OUTPUT_SIZE) {
     return {
       success: true,
       data: result.substring(0, MAX_OUTPUT_SIZE) +
        `\n\n... (truncated, full output available on request)`
     };
   }
   ```

3. **Validate Inputs**: Even if JSON Schema is strict, **LLMs sometimes hallucinate properties**. Validate within your execute block:
   ```typescript
   async function safeExecute(args: any) {
     if (!args.endpoint || typeof args.endpoint !== 'string') {
       return { success: false, error: "Endpoint must be a valid URL string" };
     }
     // ... rest of logic
   }
   ```

---

### 2. Event Hooks

Extensions can listen to the agent's lifecycle to perform background tasks or modify state.

#### Available Events

| Event | Description | When Fired |
|-------|-------------|------------|
| `onSessionStart` | New chat begins | First message of session |
| `onMessage` | Message received | Both user and agent messages |
| `onToolCall` | Tool invocation | Before tool execution |

#### Event Registration

```typescript
api.on('onSessionStart', async (context) => {
  console.log('[Session]', 'New chat initialized');
  // Initialize session memory if needed
});

api.on('onMessage', async (message) => {
  if (message.role === 'user') {
    // Log or process user messages
    await processMessage(message);
  }
});

api.on('onToolCall', async (toolInfo) => {
  // Pre-execution validation
  if (!toolInfo.arguments) {
    return { success: false, error: "No arguments provided" };
  }
});
```

#### Custom Event Handlers

Create event handlers for additional lifecycle events:

```typescript
const handlers = {
  preStart: async () => {
    // Validate environment
    await checkEnvironment();
  },
  postStart: async () => {
    // Register plugins after start
    await loadPlugins();
  },
  cleanup: async () => {
    // Cleanup on session end
    await cleanupResources();
  }
};

await registerAllEvents(handlers);
```

---

### 3. Error Handling

**Never crash the agent.** Wrap your `execute` logic in `try/catch` blocks:

#### Error Handling Pattern

```typescript
async function executeTool(args: any) {
  try {
    // Implementation logic
    const result = await makeApiCall(args.endpoint);
    
    return { 
      success: true, 
      data: formatResult(result) 
    };
  } catch (error) {
    // Return graceful error so LLM can self-correct
    return { 
      success: false, 
      error: `Failed to ${args.action}: ${error.message}` 
    };
  }
}
```

#### Error Response Examples

```typescript
// API rate limit exceeded
return { 
  success: false, 
  error: "API rate limit exceeded. Try again in 60s." 
};

// Missing authentication
return { 
  success: false, 
  error: "API authentication required. Check PI_API_KEY environment variable." 
};

// Invalid response
return { 
  success: false, 
  error: "Response format invalid. Expected JSON, received plain text." 
};
```

---

## 4. Context Management (Required)

All tools **must** implement output truncation to prevent overwhelming the LLM's context window:

```typescript
const truncateOutput = (data: string, maxSize: number = 4096) => {
  if (data.length <= maxSize) return data;
  
  const truncated = data.substring(0, maxSize - 50) +
   `\n\n...(output truncated, see full result in logs)`;
  
  return {
    success: true,
    data: truncated,
    truncated: true
  };
};

async function analyzeProject() {
  const fullOutput = await doAnalysis();
  return truncateOutput(JSON.stringify(fullOutput, null, 2));
}
```

---

## 5. Cancellation Support (Required)

Implement graceful cancellation handling:

```typescript
const cleanup = async () => {
  // Cleanup on cancellation
  await api.stop();
};

async function longOperation() {
  try {
    return await api.withCancellation(async () => {
      // ... long operation with timeout
      return { success: true };
    });
  } catch (e) {
    if (e.canceled) await cleanup();
    throw e;
  }
}
```

---

## Working with Skills

Skills and Extensions are designed to work **seamlessly together** to create powerful workflows:

### Extension = "Brawn" (Raw Capabilities)
- Registers tools the LLM can call
- Handles direct API integrations
- Performs heavy computations

### Skill = "Brains" (Knowledge & Instructions)
- Contains procedural knowledge
- Instructs agent when to use Extension tools
- Provides context and guardrails

### Synergy Example

**Extension** (`jira-extension.ts`):
```typescript
api.registerTool('create_jira_ticket', {
  description: 'Creates a Jira ticket for bug tracking',
  schema: { ... },
  execute: async (args) => {
    return await createJiraTicket(args);
  }
});
```

**Skill** (`SKILL.md`):
```markdown
# Jira Ticket Creation Skill

When a user asks to log a bug, you must:
1. Ask for steps to reproduce
2. Call the `create_jira_ticket` tool
3. Include the reproduction steps in the ticket

Do not create tickets without the reproduction steps.
```

**Result**: The Skill "starts" the Extension by directing the LLM to invoke the Extension's registered tool. Use this pattern to chain complex, multi-step automated workflows.

---

## Full Extension Definition Example

A complete production-ready extension:

```typescript
import type { ExtensionAPI } from '@pi/sdk';
import { MAX_OUTPUT_SIZE } from './config';

export default async function activate(api: ExtensionAPI) {
  // Register cleanup handler
  const cleanup = async () => {
    // Cleanup on cancellation
    await api.stop();
  };

  // Register main tool
  api.registerTool('analyze_project_structure', {
    name: 'analyze_project_structure',
    description: 'Analyzes the specified directory and returns a high-level summary of the project structure and tech stack. Use this when the user asks about the overall architecture of a folder.',
    schema: {
      type: 'object',
      properties: {
        targetPath: { 
          type: 'string', 
          description: 'The relative path to analyze. Defaults to the current working directory.' 
        },
        maxDepth: { 
          type: 'number', 
          description: 'Maximum folder depth to scan. Default is 2.' 
        },
        includeFiles: {
          type: 'boolean',
          description: 'Include file contents in analysis. Default is false.',
          default: false
        }
      },
      required: [] 
    },
    execute: async (args, context) => {
      try {
        // Validate inputs
        const path = args.targetPath || './';
        const depth = args.maxDepth || 2;
        
        // Implement logic (e.g., fs traversal)
        const summary = scanProject(path, depth, args.includeFiles);
        
        // Truncate output if needed
        const output = JSON.stringify(summary, null, 2);
        if (output.length > MAX_OUTPUT_SIZE) {
          return {
            success: true,
            data: output.substring(0, MAX_OUTPUT_SIZE - 50) +
             `\n\n...(output truncated, see full analysis in logs)`
          };
        }

        return { 
          success: true, 
          data: summary 
        };
      } catch (error) {
        return { 
          success: false, 
          error: `Failed to analyze project: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }
  });

  // Register event listeners
  api.on('onSessionStart', async () => {
    console.log('[Session]', 'Project analyzer extension initialized');
  });

  api.on('onMessage', async (message) => {
    if (message.role === 'user' && message.text.includes('analyze')) {
      console.log('[Analyzer]', 'User requested project analysis');
    }
  });

  // Cleanup handler
  api.on('cleanup', async () => {
    await cleanup();
  });
}
```

---

## Distribution & Installation

Extensions are distributed as **standard NPM packages**.

### Packaging

1. **Compile TypeScript** to CommonJS or ESM:
   ```bash
   npm run build
   # or
   tsc
   ```

2. **Publish to npm**:
   ```json
   {
     "name": "@your-username/pi-awesome-tools",
     "version": "1.0.0",
     "pi-type": ["extension"],
     "author": "your-name",
     "license": "MIT"
   }
   ```

### Installation

Users install and run your extension via the CLI:

```bash
# Install globally
pi install npm:@your-username/pi-awesome-tools

# Install with version constraint
pi install npm:@your-username/pi-awesome-tools@>=1.0.0

# Run ad-hoc from local file
pi run --extension ./my-local-ext.ts

# Install local package
pi install -l ../../tools
```

---

## Testing Extensions

### Pre-deployment Checklist

- [ ] `package.json` exists and is valid
- [ ] `pi-type` set to `["extension"]`
- [ ] Version constraint acceptable (>=1.0.0)
- [ ] License specified
- [ ] Author specified
- [ ] No malicious dependencies
- [ ] External registry verified
- [ ] All hooks registered
- [ ] Error handling implemented
- [ ] Context truncation implemented
- [ ] Cancellation support implemented

### Test Commands

```bash
# Validate extension
pi install --validate <extension-name>

# Enable extension
pi install -e <extension-name>

# Check dependencies
pi install --list

# View logs
tail -f ~/.pi/logs/<extension-name>.log
```

---

## Best Practices

### ✅ DO:

- **Use TypeScript** for strict type checking during development
- **Keep tool descriptions concise but highly descriptive** of their purpose
- **Use environment variables** (`process.env`) for API keys; **never hardcode secrets**
- **Validate inputs** within your execute block, even if JSON Schema is strict (LLMs sometimes hallucinate properties)
- **Pair complex extensions with a SKILL.md** to ensure the agent knows exactly how and when to use your new tools
- **Handle errors gracefully** with meaningful messages
- **Log all actions** with timestamps and error codes
- **Implement timeouts** on all async operations

### ❌ DON'T:

- **Block the main thread** with heavy synchronous operations (always use `async/await` for File System or Network calls)
- **Output excessive console logs** - this pollutes the CLI interface for the user. Use `api.logger` if available
- **Register generic tool names** like `do_stuff` - be specific (e.g., `aws_s3_upload`, `fetch_jira_ticket`)
- **Return huge outputs** - always truncate or summarize
- **Auto-recover from crashes** - suggest admin action instead
- **Silently fail** - always log errors

---

## Versioning

Extensions must follow **semantic versioning**:

| Version | Action |
|---------|---|
| **MAJOR** | Incompatible with existing versions |
| **MINOR** | Functional additions |
| **PATCH** | Bug fixes |

### Example Version History

| Version | Notes |
|---------|---|
| 1.0.0 | Initial release |
| 1.1.0 | Add API hooks |
| 1.1.1 | Fix file permissions |
| 2.0.0 | Breaking changes to tool schema |

---

## Quick Reference

| Topic | File Reference |
|-------|-----|
| **Architecture & Setup** | `architecture.md` |
| **Mode Rules** | `modes.md` |
| **Package Management** | `packages.md` |
| **Extensions** | `extensions.md` |
| **Skills** | `skills.md` |
| **Best Practices** | `bestpractices.md` |

---

## 🔗 Official References

- **Pi Dev Docs**: https://www.pi.dev
- **Pi Coding Agent (npm)**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **GitHub**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono

---

## 📝 License

MIT License - See LICENSE file for details

---

## 📝 Last Updated

2025
