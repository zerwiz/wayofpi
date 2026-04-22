# Architecture & CLI Rules

## Rule A1.1: Process Isolation
**Priority: Critical**
- Each Pi session runs as discrete process in tmux or container
- No shared memory between sessions except explicitly mounted
- Clean process tree on each startup

## Rule A1.2: CLI Argument Precedence
**Priority: Critical**
```
--mode rpc > -p print > --model specific > --think level
```
Order matters; later flags override earlier ones.

## Rule A1.3: Environment Variable Binding
**Priority: Critical**
- `PI_MODEL` - Default model selection
- `PI_THINK_LEVEL` - Reasoning depth (1-5 default)
- `PI_WORKSPACE` - Project workspace path
- Do not use shell aliases before `pi` invocation
- Extensions override environment config

## Rule A1.4: State Directory Location
**Priority: High**
- Session state: `$XDG_STATE_HOME/pi/`
- Cache: `$XDG_CACHE_HOME/pi/`
- Logs: `$XDG_STATE_HOME/pi/logs/`
- Config: `$XDG_CONFIG_HOME/pi/`

## Rule A1.5: File I/O Constraints
**Priority: Critical**
- All file reads/writes go through agent filesystem
- No direct shell access to agent state files
- Binary files must be base64-encoded
- Max file size: 50KB (use offset/limit for larger)

## Rule A1.6: Error Handling Protocol
**Priority: High**
- Capture all stdout/stderr
- Exit codes: 0 (success), 1 (parse), 2 (agent), 3 (file)
- Write errors to stderr, not stdout
- Include line numbers on read errors (offset/limit)

## Rule A1.7: Initialization Sequence
**Priority: Critical**
1. Check for existing session state
2. Load environment config
3. Validate model availability
4. Apply permission gates
5. Initialize extensions
6. Enter wait-for-input loop

## Rule A1.8: Shutdown Protocol
**Priority: High**
- Graceful termination on Ctrl+C or --quit
- Flush pending writes (max 5 attempts)
- Save active session state
- Clean up temporary files
- Exit with appropriate code

---

### Compliant Implementation Example
```bash
# Correct usage
pi --mode rpc --workspace /project

# Incorrect - violates A1.3
alias pi='PI_MODEL=custom pi'  # Use --model flag instead
```

### Checklist for New Integrations
- [ ] Session isolated from others
- [ ] Environment vars not hardcoded
- [ ] File operations through agent API
- [ ] Proper exit codes implemented
- [ ] All errors logged to stderr
- [ ] Graceful shutdown handled
