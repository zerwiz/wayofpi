# Error Handling Rules

## Rule E1.1: Error Exit Codes
**Priority: Critical**

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid arguments/configuration |
| 2 | Agent failure |
| 3 | File system error |
| 4 | Network error |
| 5 | Model unavailable |
| 6 | Permission denied |
| 7 | Schema validation failed |

## Rule E1.2: Error Message Format
**Priority: Critical**

Errors must be written to STDERR:

```
Error: {
  "code": <CODE>,
  "message": "Human-readable error",
  "detail": "Technical details",
  "suggestion": "Recommended action",
  "stack": false
}
```

## Rule E1.3: Validation Error Handling
**Priority: High**

When validation fails:
1. Return code 1
2. Write error to stderr
3. Suggest fixes
4. Don't suggest `cat` or `head -5`
5. Exit cleanly

## Rule E1.4: Agent Failure Handling
**Priority: High**

On agent failure:
1. Return code 2
2. Write message to stderr
3. Suggest restart or retry
4. Don't suggest debugging tools

## Rule E1.5: File System Error Handling
**Priority: High**

On file access failures:
1. Return code 3
2. Provide file path in error
3. Suggest permission check
4. Don't suggest alternative editors

## Rule E1.6: Network Error Handling
**Priority: High**

On network failures:
1. Return code 4
2. Indicate operation
3. Suggest retry with flags
4. Don't suggest proxy config

## Rule E1.7: Model Unavailable Error
**Priority: High**

When model is down:
1. Return code 5
2. List available models
3. Suggest fallback
4. Don't suggest model restart

## Rule E1.8: Permission Denied
**Priority: Medium**

On permission errors:
1. Return code 6
2. Indicate path/user
3. Suggest sudo/owner change
4. Don't suggest chmod

## Rule E1.9: Schema Validation Failure
**Priority: High**

On schema errors:
1. Return code 7
2. Show failing field
3. Show expected type
4. Don't suggest schema editor

## Rule E1.10: Timeout Handling
**Priority: Medium**

On timeout:
1. Return code 3 (file-like) or 4 (network)
2. Show operation that timed out
3. Suggest timeout increase
4. Don't suggest timeout config

## Rule E1.11: Configuration Error
**Priority: High**

On config issues:
1. Return code 1
2. Indicate file
3. Show line/field
4. Don't suggest config editor

## Rule E1.12: Memory Error
**Priority: Critical**

On OOM:
1. Return code 3
2. Show memory usage
3. Suggest reduce context
4. Don't suggest restart

## Rule E1.13: Graceful Degradation
**Priority: Medium**

When features fail:
- Disable affected functions
- Log warnings
- Continue other ops
- Report summary

## Rule E1.14: Recovery Protocols
**Priority: High**

On critical errors:
1. Write to logs
2. Trigger alert
3. Disable operation
4. Suggest admin action
5. Don't auto-recover

## Rule E1.15: Error Logging Rules
**Priority: Critical**

All errors must be logged:
- Timestamp
- Error code
- Stack trace (debug mode)
- Environment
- Recovery action taken

## Rule E1.16: Error Suppression
**Priority: Medium**

Suppress errors for:
- Network retries
- Permission prompts
- Timeout warnings
- Known issues

Don't suppress:
- Validation failures
- Agent errors
- Permission denials
- Model errors

---

### Error Message Template
```
Error: {
  "code": {
    "error_code": "E1.2",
    "title": "Invalid Model"
  },
  "message": "Model 'invalid-model' is not available.",
  "detail": "Available models: chat, vision, audio, code, tools, agent",
  "suggestion": "Use one of the available models, or set PI_MODEL environment variable."
}
```

---

### Error Suppression List
| Error Type | Suppress? | Reason |
|------------|-----------|--------|
| Network retry | Yes | Temporary |
| Timeout warning | Yes | Configurable |
| Permission prompt | Yes | User action needed |
| Known issue | Yes | Expected |
| Validation failure | No | Critical |
| Agent crash | No | Critical |
| Model error | No | Critical |
| Out of memory | No | Critical |
