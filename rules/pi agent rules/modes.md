# Mode Rules

## Rule M1.1: Mode Definition
**Priority: Critical**

Valid modes for Pi agent:

| Mode | Use Case | Flags |
|------|----------|-------|
| `interactive` | Default CLI session | `-i`, none |
| `rpc` | Programmatic calls | `--mode rpc` |
| `print` | Batch processing | `-p` |
| `stream` | Event-driven output | `--stream` |

## Rule M1.2: Mode Mutually Exclusive
**Priority: Critical**
```
❌ pi --mode rpc -p
    ❌ pi --mode interactive --stream
✅ pi --mode rpc
✅ pi -p
✅ pi (defaults to interactive)
```

## Rule M1.3: RPC Mode Requirements
**Priority: Critical**

When `--mode rpc` is set:
- Return JSON responses only
- Exit immediately after response
- No prompt handling
- Validate input schema
- Timeout after 30 seconds

## Rule M1.4: Print Mode Handling
**Priority: High**

When `-p` flag is set:
- Print to stdout, not interact
- No wait states
- Process arguments as batch
- Support piping/redirecting
- Exit after last input

## Rule M1.5: Stream Mode Behavior
**Priority: High**

When `--stream` flag is set:
- Emit events incrementally
- Support partial responses
- Don't buffer full output
- Flush per-message or per-logic-unit
- Preserve ordering guarantees

## Rule M1.6: Model Selection Rule
**Priority: High**

Model selection order:
1. `--model` explicit flag (highest priority)
2. `PI_MODEL` environment variable
3. Default model from config
4. Fallback to registered default

**Invalid model error:**
- Return error code 1
- Suggest available models
- Exit cleanly

## Rule M1.7: Thinking Level Protocol
**Priority: Medium**

Thinking levels (1-5):
- Level 1: Minimal, direct answers
- Level 2: Short reasoning
- Level 3: Standard (default)
- Level 4: Extended analysis
- Level 5: Deep chain-of-thought

CLI: `--think <level>`
Env: `PI_THINK_LEVEL`
Default: 3

## Rule M1.8: Session Duration Limit
**Priority: Medium**

- Max runtime: 24 hours
- Auto-save every 30 minutes
- Warn before 1 hour mark
- Graceful shutdown after timeout

## Rule M1.9: Interactive Input Handling
**Priority: High**

For interactive mode:
- Detect terminal capabilities
- Handle Ctrl+C (SIGINT)
- Support multi-line input
- Buffer for context window
- Escape sequences supported

## Rule M1.10: Non-Interactive Detection
**Priority: High**

Detect when NOT interactive:
- No TTY attached
- stdin is pipe
- STDOUT is pipe
- In CI/CD environment

Auto-switch to appropriate mode
Exit with error if forced

---

### Mode Switching Examples
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

## 🔗 References

- **Pi Dev**: https://www.pi.dev
- **Pi Coding Agent**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent#settings
- **GitHub**: https://github.com/badlogic
- **Pi-Mono**: https://github.com/badlogic/pi-mono
