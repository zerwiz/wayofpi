# Session Saver Extension

Automatically saves chat sessions to separate files after each user and AI input.

## Features

- **Auto-save**: Each message is automatically saved to a JSON file after you send it
- **Manual save**: Trigger save manually with `/save` command
- **List sessions**: View all saved sessions with `/list` command
- **Load/Show**: Preview and load saved messages with `/load` and `/show` commands
- **Configurable**: Enable/disable auto-save, set storage location, adjust file format

## Installation

The extension is included by default in Pi. No additional installation required.

```bash
# Enable session saver
just open +session-saver

# Or manually load the extension
pi -e extensions/sessions/index.ts
```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `/save` | Manually save current session branch |
| `/list` | List all saved sessions |
| `/load <file>` | Load a saved message |
| `/show <file>` | Preview a saved message in TUI viewer |

### Auto-save Behavior

By default, every time you send a message (or receive a reply), the system automatically saves it to:

```
.pi/storage/sessions/<date>/<branch>/<message-id>.msg
```

Example path:
```
.pi/storage/sessions/2025-01-15/vm-arch-ai/branch-3.msg
```

### Configuration

Edit `~/.pi/extensions/sessions/config.json` or `~/.pi/storage/config.json`:

```json
{
  "sessions": {
    "autoSave": true,
    "storagePath": ".pi/storage/sessions",
    "fileFormat": "json",
    "maxFileSize": 10000,
    "includeMetadata": true,
    "pruneOlderThan": "30d"
  }
}
```

### File Format

Each saved message is stored as JSON:

```json
{
  "id": "vm-arch-ai-3",
  "type": "user",
  "content": "How do I create a new Rust project with Cargo?",
  "timestamp": "2025-01-15T14:23:45.123Z",
  "model": "qwen3.5:9b",
  "branch": "vm-arch-ai",
  "index": 3
}
```

## Tips

1. **Batch Review**: Review sessions at end of day: `/list`
2. **Export**: Copy sessions to your documents: `cp ~/.pi/storage/sessions/* ~/documents/`
3. **Privacy**: Set `autoSave: false` to disable auto-save for sensitive conversations
4. **Cleanup**: Remove old sessions: `find ~/.pi/storage/sessions -mtime +30 -delete`

## Privacy

- Messages stored locally only
- No messages uploaded to servers
- Plain JSON format (not encrypted)
- Set `includeMetadata: false` to avoid storing model names

## See Also

- [Documentation](../../docs/sessions.md)
- [Session Replay](../session-replay.ts) - TUI viewer for session history
- [Config File](./config.json) - Extension settings

## License

Part of the Pi Coding Agent project.