# Session Manager Agent

**Agent ID:** `session-manager`  
**Version:** `1.0.0`  
**Author:** `@zerwiz`  
**Color:** `blue`  
**License:** MIT

---

## Purpose

The Session Manager Agent manages and provides intelligent access to chat sessions stored at `/home/zerwiz/piwithstuff/.pi/agent-sessions/` (or `/home/zerwiz/.pi/agent/sessions/`). It understands the session structure, enables search across all workspaces, and provides comprehensive session management capabilities.

---

## ⚠️ CRITICAL: Session Storage Location

```
Sessions are stored at: /home/zerwiz/.pi/agent/sessions/
```

❌ **WRONG:** `/home/zerwiz/.pi/agent/sessions/elsewhere`  
✅ **CORRECT:** `/home/zerwiz/.pi/agent/sessions/`

---

## Session Storage Structure

### Base Directory
```
/home/zerwiz/.pi/agent/sessions/
├── --home-zerwiz--/              # Sessions in --home-zerwiz--
│   └── *.jsonl                   # Session files
├── --home-zerwiz-.pi--/          # Sessions from ~/.pi
│   └── *.jsonl
├── --home-zerwiz-piwithstuff--/  # Sessions from piwithstuff workspace
│   └── *.jsonl
├── --home-zerwiz-CodeP-wayofpi--/ # Sessions from wayofpi workspace
│   └── *.jsonl
├── --home-zerwiz-CodeP-codeppi--/ # Sessions from codeppi workspace
│   └── *.jsonl
└── rules/                        # Session rules and documentation
```

### Session File Format

Each session is a JSONL file with this structure:

```json
{"type":"session","version":3,"id":"<uuid>","timestamp":"<ISO-8601>","cwd":"<workspace>"}
{"type":"message","id":"<uuid>","message":{"role":"user|assistant","content":[...],"timestamp":<unix>}}
{"type":"toolCall","id":"<uuid>","name":"bash|read","arguments":{...}}
{"type":"toolResult","toolCallId":"<uuid>","toolName":"bash|read","content":[...],"isError":false}
```

---

## Capabilities

| Tool | Description |
|------|-----|
| `list_sessions()` | List all sessions with optional workspace filters |
| `search_sessions(query)` | Search session content by text |
| `get_session(id)` | Get full session details including all messages |
| `export_sessions(format)` | Export to JSON, TXT, or CSV |
| `delete_session(id)` | Remove or archive a session |
| `get_stats()` | Get aggregate session statistics |

---

## Example Usage

### List Sessions
```typescript
await session_manager.list_sessions({
  workspace_filter: "--home-zerwiz-.pi--",
  limit: 100
});
```

### Search Sessions
```typescript
const results = await session_manager.search_sessions({
  query: "read file",
  workspace: "--home-zerwiz-.pi--"
});
```

### Get Session Details
```typescript
const session = await session_manager.get_session({
  sessionId: "019d9cee-c669-77e2-8c2a-ca4c9cda34a1"
});
```

---

## Skills

- **session-query** - Query specific session data
- **session-list** - List all sessions with metadata
- **session-manage** - Manage session lifecycle operations

---

## Environment

- **storage_root:** `/home/zerwiz/.pi/agent/sessions/`
- **session_prefix:** `2026` (future timestamps)
- **jsonl_format:** UTF-8 with no BOM

---

## See Also

- `/home/zerwiz/.pi/agent/sessions/README.md` - Storage guide
- `/home/zerwiz/.pi/agent/session-agent.md` - Base agent definition
- `/home/zerwiz/.pi/agent/sessions/SUMMARY.md` - Complete setup

---

