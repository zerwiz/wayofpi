# Pi Command Reference Guide

## Overview

This document provides a comprehensive reference for all available commands in the Pi Coding Agent terminal. Commands are invoked by typing `/` followed by the command name and optional arguments.

---

## Quick Start

Type `/` to see a list of available commands. Some commands accept arguments separated by spaces.

---

## Core Commands

### `/save`
Manually save the current session branch to a file.

```bash
/save
```

**Description**: Trigger immediate save of all messages in the current branch.

**When to use**: After completing a conversation you want to preserve.

**Example**:
```bash
// Discussed a Rust project setup
/save
// Saved to: .pi/storage/sessions/2025-01-15/vm-arch-ai/branch-3.msg
```

---

### `/list`
List all saved sessions in storage.

```bash
/list
```

**Description**: Show all saved session files grouped by date.

**When to use**: Review what you've saved today or find specific conversations.

**Output**:
```
Saved Sessions:
===============
  2025-01-15/vm-arch-ai/branch-1.msg  (2025-01-15)
  2025-01-15/vm-arch-ai/branch-2.msg  (2025-01-15)
  2025-01-15/vm-arch-ai/branch-10.msg (2025-01-15)
  (3 date folders)
```

---

### `/load <filename>`
Load a saved message into the current branch.

```bash
/load 2025-01-15/vm-arch-ai/branch-1.msg
```

**Description**: Load a previously saved message back into your current session.

**When to use**: Resume a previous conversation or review specific messages.

**Arguments**:
- `filename`: Path relative to `.pi/storage/sessions/`

---

### `/show <filename>`
Open a TUI viewer to preview a saved message.

```bash
/show 2025-01-15/vm-arch-ai/branch-1.msg
```

**Description**: Open an interactive viewer to examine saved message content.

**Keybindings in Viewer**:
- `q` - Quit viewer
- `u` - Previous message
- `d` - Next message
- `s` - Save current as new file

**When to use**: Preview messages before loading or sharing.

---

### `/replay`
Show a scrollable timeline of the current session.

```bash
/replay
```

**Description**: Open an overlay timeline showing all messages in the current branch.

**Keybindings**:
- `↑` - Navigate up (older messages)
- `↓` - Navigate down (newer messages)
- `Enter` - Expand/collapse selected message
- `g` - Scroll to top
- `Escape` - Close overlay

**When to use**: Quick review of conversation history during active session.

---

## Storage & Configuration Commands

### `/storage path`
Set custom storage directory path.

```bash
/storage /home/user/documents/sessions
```

**Description**: Change where sessions are stored (defaults to `.pi/storage/sessions`).

**Arguments**: Absolute or relative path.

**Note**: Creates directory if it doesn't exist.

---

### `/storage config`
Show current storage configuration.

```bash
/storage config
```

**Description**: Display current settings from config files.

**Output**:
```
Storage Config:
===============
  Path: .pi/storage/sessions
  Auto-save: enabled
  Format: JSON
  Max File Size: 10000 bytes
  Compress: disabled
  Retention: 30 days
```

---

### `/storage cleanup`
Remove old session files.

```bash
/storage cleanup
```

**Description**: Delete session files older than configured retention period (default: 30 days).

**Safety**: Only removes files, never messages. Use with caution.

**Options**:
```bash
/storage cleanup 7d      # Keep only 7 days
/storage cleanup 90d     # Keep 90 days
/storage cleanup all     # Delete everything
```

---

## System Monitoring Commands

### `/health`
Check system health and status.

```bash
/health
```

**Description**: Report on all running Pi services and their status.

**Output**:
```
System Health Check
====================
  Model Service: online (qwen3.5:9b)
  Editor Service: online
  Notes Service: online
  Code Service: online
  Storage Service: online
  Orchestrator: active
  Memory Usage: 2.1GB / 16GB
  CPU Usage: 12%
```

---

### `/health detail`
Show detailed health information.

```bash
/health detail
```

**Description**: Show per-service diagnostics including queue depths, latencies, and error counts.

**Output**:
```
Service: qwen3.5:9b
  Queue: 3 messages pending
  Latency: 250ms
  Errors: 0
  Last Activity: 30s ago

Service: Code Generator
  Files Modified: 2
  Build Status: success
  Last Error: none
```

---

### `/orchestrator status`
Show orchestrator current tasks.

```bash
/orchestrator status
```

**Description**: List all active tasks and which services are handling them.

**Output**:
```
Active Tasks:
=============
  [CODE] Generate Rust project structure
    - Service: unsloth-qwen2.5-coder-7b
    - Progress: 65%
    - ETA: ~30s

  [NOTES] Document project setup
    - Service: qwen3.5:9b
    - Progress: 45%
    - ETA: ~60s

  [REVIEW] Check for missed tasks
    - Service: qwen2.5-coder-7b
    - Status: pending
    - Priority: high
```

---

### `/orchestrator switch <service>`
Switch orchestration to a different model.

```bash
/orchestrator switch qwen2.5-coder-7b
```

**Description**: Assign orchestration duties to a different model.

**Arguments**: Model ID (see `ollama list` for available models).

**When to use**: When you want a different model to coordinate tasks.

---

### `/orchestrator add <task> <service>`
Add a new task to orchestrator queue.

```bash
/orchestrator add refactor code unsloth-qwen2.5-coder-7b
```

**Description**: Queue a new task for orchestration.

**Arguments**:
- `task`: Task description/name
- `service`: Model to handle this task

---

### `/orchestrator remove <id>`
Remove a task from the queue.

```bash
/orchestrator remove task-123
```

**Description**: Cancel a queued or running task.

**Arguments**: Task ID or name.

---

### `/orchestrator complete <id>`
Mark a task as complete.

```bash
/orchestrator complete task-123
```

**Description**: Tell orchestrator a task is done (e.g., after manual completion).

**When to use**: After you've completed a task the orchestrator was tracking.

---

## Task & Note Management Commands

### `/todo add <description>`
Add a new task to your to-do list.

```bash
/todo add Refactor authentication module
```

**Description**: Create a new to-do item.

**Output**:
```
✅ Added to-do: Refactor authentication module
  Priority: high (default)
  Due: tomorrow (default)
  ID: todo-145
```

---

### `/todo list`
Show all to-do items.

```bash
/todo list
```

**Description**: Display all active tasks.

**Options**:
```bash
/todo list              # Show all
/todo list high         # Show only high priority
/todo list active       # Show active (not completed)
/todo list completed    # Show completed tasks
/todo list pending      # Show tasks not yet started
```

**Output**:
```
Active Tasks:
=============
  [ ] todo-145 Refactor authentication module (high, due: tomorrow)
  [ ] todo-142 Write API documentation (medium, due: next week)
  [x] todo-140 Set up CI/CD pipeline (completed, 2h ago)
```

---

### `/todo toggle <id>`
Toggle task completion status.

```bash
/todo toggle todo-145
```

**Description**: Mark a task as complete or incomplete.

**Shortcut**: Press `space` in todo viewer to toggle.

---

### `/todo edit <id>`
Edit a task description.

```bash
/todo edit todo-145 "Updated description"
```

**Description**: Modify an existing task.

**Arguments**:
- `id`: Task ID
- `description`: New description (or empty to clear)

---

### `/todo due <id> <date>`
Set a due date for a task.

```bash
/todo due todo-145 2025-01-20
```

**Description**: Set due date for a task.

**Arguments**:
- `id`: Task ID
- `date`: YYYY-MM-DD or "tomorrow", "next week", etc.

---

### `/todo priority <id> <level>`
Set task priority.

```bash
/todo priority todo-145 high
```

**Description**: Set task priority level.

**Arguments**:
- `id`: Task ID
- `level`: high | medium | low | critical

**Values**:
- `critical`: Must be done immediately
- `high`: Do soon
- `medium`: Do when convenient
- `low`: Do eventually

---

### `/todo remove <id>`
Remove a task.

```bash
/todo remove todo-145
```

**Description**: Delete a task from the list.

---

### `/notes add <text>`
Add a note for later reference.

```bash
/notes add Remember to test with production data
```

**Description**: Create a new note.

**Output**:
```
✅ Note saved: Remember to test with production data
  ID: note-321
  Category: general
```

---

### `/notes list`
Show all notes.

```bash
/notes list
```

**Description**: Display all saved notes.

**Output**:
```
Notes:
======
  [note-321] Remember to test with production data (2025-01-15 14:30)
  [note-320] API key expires in 30 days (2025-01-15 11:45)
  [note-319] Don't forget to run migrations (2025-01-14 16:20)
```

---

### `/notes search <query>`
Search notes by keyword.

```bash
/notes search production
```

**Description**: Search through note content.

**Arguments**: Search term.

**Output**:
```
Results for "production":
=========================
  [note-321] Remember to test with production data
  [note-298] Production deployment checklist
  [note-245] Backups before production changes
```

---

### `/notes view <id>`
View a specific note.

```bash
/notes view note-321
```

**Description**: Show full note content.

---

### `/notes delete <id>`
Delete a note.

```bash
/notes delete note-321
```

---

### `/notes edit <id>`
Edit a note.

```bash
/notes edit note-321 "Updated description"
```

---

## Session Reviewer Commands

### `/review`
Run the chat session storage reviewer.

```bash
/review
```

**Description**: Start a review process to check for missed tasks between user and AI exchanges.

**Output**:
```
Session Reviewer
=================
Scanning sessions for incomplete tasks...

Session: vm-arch-ai/2025-01-15

Missed Tasks Found:
===================
  User Request: "Implement authentication with OAuth2"
    - Status: incomplete
    - Reason: No implementation code generated
    - Assign to: AI

  AI Response: "I'll create a Rust auth service"
    - Status: claimed but not started
    - Priority: high

  User Reminder: "Don't forget to add tests"
    - Status: noted but not acted on
    - Assign to: AI

  Task Queue Generated:
    [AI] Create OAuth2 auth service
    [AI] Add authentication tests
    [USER] Review PR before merging
```

---

### `/review session <branch>`
Review a specific session branch.

```bash
/review session vm-arch-ai
```

**Description**: Review all sessions in a specific branch.

**Arguments**: Branch name.

---

### `/review all`
Review all active sessions.

```bash
/review all
```

**Description**: Scan all current branches for incomplete tasks.

**Output**: Generates a comprehensive task list across all sessions.

---

### `/review clear <id>`
Clear a review finding.

```bash
/review clear finding-142
```

**Description**: Mark a finding as resolved.

**When to use**: After completing the task mentioned in a review finding.

---

### `/review export`
Export review findings to file.

```bash
/review export
```

**Description**: Save all review findings to a report file.

**Output**: Creates `/home/zerwiz/.pi/reviews/session-review-YYYY-MM-DD.json`

---

### `/review import <file>`
Import review findings from a file.

```bash
/review import /home/user/todos/auth-tasks.json
```

**Description**: Load previously exported review findings.

---

### `/review status`
Show current review status.

```bash
/review status
```

**Description**: Show pending review findings.

**Output**:
```
Review Queue:
=============
  Session: vm-arch-ai
    - Missed Tasks: 3
    - Completed: 12
    - Status: ongoing
  Session: system-setup
    - Missed Tasks: 1
    - Status: pending
```

---

## System Commands

### `/help`
Show help information.

```bash
/help
```

**Description**: Display available commands.

**Options**:
```bash
/help all          # Show all commands
/help <command>    # Show help for specific command
```

---

### `/settings`
Show current settings.

```bash
/settings
```

**Description**: Display all extension settings.

**Output**:
```
Settings:
=========
  Auto-save: enabled
  Session Storage: .pi/storage/sessions
  File Format: JSON
  Max File Size: 10000 bytes
  Notifications: enabled
  Theme: dark
  Language: en
```

---

### `/settings set <key> <value>`
Change a setting.

```bash
/settings set autoSave false
```

**Description**: Modify a runtime setting.

**Available Settings**:
- `autoSave`: Enable/disable auto-save
- `notifications`: Enable/disable notifications
- `theme`: dark | light | system
- `language`: Language code
- `fontSize`: Font size (10-24)

---

### `/settings reset`
Reset all settings to defaults.

```bash
/settings reset
```

**Description**: Restore default settings.

**Warning**: This clears all custom settings.

---

### `/clear`
Clear current branch.

```bash
/clear
```

**Description**: Remove messages from current session.

**Warning**: This cannot be undone unless you have `/save` called first.

---

### `/exit`
Exit Pi terminal.

```bash
/exit
```

**Description**: Close the Pi terminal application.

---

### `/quit`
Alias for `/exit`.

```bash
/quit
```

**Description**: Same as `/exit`.

---

### `/cancel`
Cancel current operation.

```bash
/cancel
```

**Description**: Cancel an ongoing operation (e.g., generation, save).

---

### `/undo`
Undo last action.

```bash
/undo
```

**Description**: Reverse the last operation if supported.

**Note**: Not all commands can be undone. Use `/save` before important operations.

---

### `/redo`
Redo undone action.

```bash
/redo
```

**Description**: Redo an action previously undone.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Show help menu |
| `/` | Open command list |
| `Tab` | Command autocomplete |
| `Space` | Toggle todo completion (in viewer) |
| `↑` | Navigate up (in replay viewer) |
| `↓` | Navigate down (in replay viewer) |
| `Enter` | Expand/collapse (in replay viewer) |
| `g` | Scroll to top (in replay viewer) |
| `Escape` | Close overlay (in replay viewer) |

---

## Tips

1. **Always `/save` before exiting**: Auto-save may not trigger on application exit
2. **Use `/review` regularly**: Catch incomplete tasks before they become problems
3. **Export reviews**: `/review export` for later reference or documentation
4. **Keep notes**: Use `/notes` for things that don't belong in to-dos
5. **Monitor health**: `/health detail` helps catch issues early

---

## Error Messages

### "No active branch"
```
Error: No active branch to save.
```
**Cause**: No messages have been exchanged yet.
**Fix**: Send a message first, then try again.

---

### "File not found"
```
Error: File not found: /path/to/file.msg
```
**Cause**: The file doesn't exist or path is incorrect.
**Fix**: Use `/list` to find existing files, then correct the path.

---

### "Permission denied"
```
Error: Permission denied writing to storage directory
```
**Cause**: Storage directory has restricted permissions.
**Fix**: `chmod 755 ~/.pi/storage/sessions`

---

### "Storage full"
```
Error: No space left on device
```
**Cause**: Storage directory has reached capacity.
**Fix**: `/storage cleanup all` or increase max file size in config.

---

## Additional Resources

- **Documentation**: See `/home/zerwiz/.pi/docs/` for detailed guides
- **Configuration**: Edit `/home/zerwiz/.pi/storage/config.json` for custom settings
- **Session Replay**: See `ext-session-replay` for timeline overlay

---

## License

This command reference is part of the Pi Coding Agent project and is available under the same license as the main project.

---

## Support

For issues with commands or this reference, check:
- Error messages in the terminal
- Documentation in `/home/zerwiz/.pi/docs/`
- The README.md in your project directory
</think>

# Pi Command Reference Documentation