# Mode Rules

## Overview

These rules define the **operational modes** available for the Pi Coding Agent. Modes control how the agent processes input, outputs responses, and manages session lifetime. All rules must be followed for proper agent behavior.

---

## Rule M1.1: Mode Definition

**Priority: Critical**

Valid modes for Pi agent:

| Mode | Use Case | Flags | Default |
|------|---------|-------|---------|
| `interactive` | Default CLI session | `-i`, none | ✅ Yes |
| `rpc` | Programmatic calls | `--mode rpc` | ❌ Must specify |
| `print` | Batch processing | `-p` | ❌ Must specify |
| `stream` | Event-driven output | `--stream` | ❌ Must specify |

### Mode Comparison

| Mode | Input Handling | Output Format | Best For |
|------|---------|------------|----------|
| `interactive` | Read from TTY | Text/markdown | Direct user use |
| `rpc` | Parse JSON input | JSON only | Automation/scripting |
| `print` | Read from stdin | Text to stdout | Batch processing |
| `stream` | Read from stdin | Incremental output | Real-time tools |

---

## Rule M1.2: Mode Mutually Exclusive

**Priority: Critical**

Modes **cannot be combined** in conflicting ways:

### ❌ Invalid Combinations (Must Avoid)

```bash
❌ pi --mode rpc -p          # JSON + print violates purpose
❌ pi --mode interactive --stream          # Interactive can't stream
```

### ✅ Valid Combinations

```bash
✅ pi --mode rpc             # Pure RPC mode
✅ pi -p                     # Print/batch mode
✅ pi                        # Defaults to interactive
✅ pi --stream               # Stream mode
✅ pi -p --think 2          # Valid (print mode with thinking level)
```

---

## Rule M1.3: RPC Mode Requirements

**Priority: Critical**

When `--mode rpc` is set:

### Mandatory Behaviors

1. **Return JSON responses only**
   - No text output
   - No markdown formatting
   - Valid JSON structure required

2. **Exit immediately after response**
   - No waiting for additional input
   - Terminate after JSON response

3. **No prompt handling**
   - Never display prompts
   - Never block for input

4. **Validate input schema**
   - Check required fields
   - Validate argument types

5. **Timeout after 30 seconds**
   - Abort operations after 30s
   - Return timeout error

### Example: RPC Response

```json
{
  "success": true,
  "result": "list files",
  "files": ["src/index.ts", "README.md"],
  "timestamp": 1735689600
}
```

---

## Rule M1.4: Print Mode Handling

**Priority: High**

When `-p` flag is set:

### Behaviors

1. **Print to stdout, not interact**
   - All output to STDOUT
   - No interactive prompts

2. **No wait states**
   - Process immediately
   - No blocking

3. **Process arguments as batch**
   - Treat as batch job
   - Handle multiple inputs

4. **Support piping/redirecting**
   - Accept from stdin
   - Output to stdout

5. **Exit after last input**
   - Terminate on EOF
   - No lingering processes

### Example: Batch Processing

```bash
# Process file list
cat input.txt | pi -p

# Process with arguments
echo -e "file1\nfile2" | pi -p
```

---

## Rule M1.5: Stream Mode Behavior

**Priority: High**

When `--stream` flag is set:

### Behaviors

1. **Emit events incrementally**
   - Output per event/message
   - Not all at once

2. **Support partial responses**
   - Stream large outputs
   - Allow early termination

3. **Don't buffer full output**
   - Flush frequently
   - Preserve memory

4. **Flush per-message or per-logic-unit**
   - Stream each response
   - Stream each operation result

5. **Preserve ordering guarantees**
   - Events in sequence
   - Maintain causality

### Stream Events Format

```json
{"event": "user_message", "data": "query", "timestamp": 1234567890}
{"event": "tool_call", "data": "list_files", "timestamp": 1234567890}
{"event": "response", "data": "Result...", "timestamp": 1234567891}
{"event": "stream_end", "timestamp": 1234567895}
```

---

## Rule M1.6: Model Selection Rule

**Priority: High**

### Selection Order (Highest to Lowest Priority)

1. **`--model` explicit flag** (highest priority)
2. **`PI_MODEL` environment variable**
3. **Default model from config**
4. **Fallback to registered default**

### Example Selection Flow

```bash
# Environment override
PI_MODEL=pi-coding-agent-v2 pi ...

# Command line override (bypasses env var)
pi --model pi-coding-agent-v3 ...

# Falls back to config default
pi ...  # Uses ~/.pi/config.json default

# Falls back to registered default
pi ...  # Built-in default model
```

### Invalid Model Error

**When invalid model specified:**

1. **Return error code 1**
2. **Suggest available models**
3. **Exit cleanly**

### Example Error

```
Error: Model 'unknown-model' not found
Available models:
  - pi-coding-agent-v1
  - pi-coding-agent-v2
  - pi-coding-agent-latest

Try: pi --model pi-coding-agent-latest
```

---

## Rule M1.7: Thinking Level Protocol

**Priority: Medium**

### Thinking Levels (1-5)

| Level | Description | Use Case |
|-------|------------|----------|
| 1 | Minimal, direct answers | Simple queries |
| 2 | Short reasoning | Quick analysis |
| 3 | Standard (default) | Normal use |
| 4 | Extended analysis | Complex tasks |
| 5 | Deep chain-of-thought | Critical problems |

### Configuration

**CLI:** `--think <level>`  
**Env:** `PI_THINK_LEVEL`  
**Default:** `3`

### Examples

```bash
# Quick, direct answers
pi --think 1 ...

# Extended analysis
pi --think 4 ...

# Deep thinking
PI_THINK_LEVEL=5 pi ...
```

---

## Rule M1.8: Session Duration Limit

**Priority: Medium**

### Limits & Behavior

- **Max runtime:** 24 hours
- **Auto-save:** Every 30 minutes
- **Warn:** Before 1 hour mark
- **Shutdown:** Graceful after timeout

### Example Timeline

```
Hour 0-23: Normal operation
Hour 23: Warning "Session ending in 1 hour"
Hour 24: Auto-save checkpoint
Hour 24+ : Graceful shutdown
```

---

## Rule M1.9: Interactive Input Handling

**Priority: High**

For interactive mode:

### Behaviors

1. **Detect terminal capabilities**
   - Check for ANSI support
   - Handle escape codes

2. **Handle Ctrl+C (SIGINT)**
   - Interrupt gracefully
   - Allow cancellation

3. **Support multi-line input**
   - Accept multi-line queries
   - Buffer for context

4. **Buffer for context window**
   - Accumulate history
   - Manage size limits

5. **Escape sequences supported**
   - Clear screen
   - Cursor control

### Example: Ctrl+C Handling

```bash
# User presses Ctrl+C
pi ...
[Interrupt] User cancelled current operation

# Agent responds
{"mode": "interactive", "interrupted": true, "message": "Operation cancelled"}
```

---

## Rule M1.10: Non-Interactive Detection

**Priority: High**

### Detect When NOT Interactive

**Detection Criteria:**

1. **No TTY attached**
   - Check `TTY_NAME`
   - No terminal device

2. **stdin is pipe**
   - `isatty(0) == false`
   - Piped input

3. **STDOUT is pipe**
   - `isatty(1) == false`
   - Redirected output

4. **In CI/CD environment**
   - `CI=true` present
   - GitHub Actions, GitLab CI, etc.

### Auto-Switch Behavior

**On non-interactive detection:**

1. **Auto-switch to appropriate mode**
   - Detect from stdin
   - Choose correct mode
   - Example: Switch to RPC or print

2. **Exit with error if forced**
   - If incompatible mode forced
   - Return error with advice
   
```bash
# Example: Auto-switch
detect pipe input → use print mode automatically

# Example: Force incompatible mode
pi --mode interactive  # → Error if no TTY
```

---

## Mode Switching Examples

```bash
# Interactive (default)
pi

# RPC mode for scripts
pi --mode rpc '{"query": "list files"}'

# Batch processing
cat input.txt | pi -p

# Stream events
pi --stream --think 1

# Invalid (violation)
pi --mode rpc -p  # M1.2 violation
```

---

## Best Practices

### ✅ DO:

- **Use `--mode rpc`** for automation scripts
- **Use `-p` for batch processing with piping**
- **Use `--stream` for real-time event output**
- **Specify model explicitly** when possible
- **Set thinking level** for complex tasks
- **Monitor session duration** near 24-hour limit

### ❌ DON'T:

- **Combine conflicting modes** (M1.2 violations)
- **Force incompatible modes** without proper detection
- **Forget about timeout limits** (30s for RPC)
- **Run sessions > 24 hours** without checkpoints
- **Assume default model** in production

---

## 🔗 References

- **Pi Dev**: https://www.pi.dev
- **Pi Coding Agent**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent#settings
- **GitHub**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono

---

## 📝 Last Updated

2025
