# Session Saver Extension Documentation

> **This playground:** Canonical, up-to-date behavior is **[`extensions/sessions/README.md`](../extensions/sessions/README.md)** and **[`extensions/sessions/index.ts`](../extensions/sessions/index.ts)**. The text below is generic / legacy; paths like `~/.pi/extensions/` may not match this repo (which uses **`extensions/`** + **`.pi/extensions/`** shims).

The **Session Saver** extension automatically stores chat sessions to separate files after each user and AI input, enabling you to review, analyze, or export conversations later.

---

## Features

- **Auto-save**: Automatically saves each message to a JSON file after sending
- **Manual save**: Trigger save manually with `/save` command
- **List sessions**: View all saved sessions with `/list` command
- **Load sessions**: Load a saved message back into current branch with `/load <filename>`
- **Show viewer**: Preview saved messages with `/show <filename>`
- **Configurable**: Enable/disable auto-save, set storage location, adjust file format

---

## Installation

The extension is included by default in Pi. No additional installation required.

---

## Usage

### Commands

#### `/save`

Manually save the current session branch to a file.

```bash
# Save current branch
/save

# Manual save after conversation
/save
```

#### `/list`

List all saved sessions in the storage directory.

```bash
# List all saved sessions
/list
```

Example output:
```
Saved Sessions:
=============
  2025-01-15/vm-arch-ai/branch-1.msg  (2025-01-15)
  2025-01-15/vm-arch-ai/branch-2.msg  (2025-01-15)
  (2 date folders)
```

#### `/load <filename>`

Load a saved message into the current branch.

```bash
# Load a specific message
/load 2025-01-15/vm-arch-ai/branch-1.msg

# Load all messages from a branch
/load 2025-01-15/vm-arch-ai/*.msg
```

#### `/show <filename>`

Open a TUI viewer to preview a saved message.

```bash
# Preview a message
/show 2025-01-15/vm-arch-ai/branch-1.msg

# Navigate: q=quit, u=prev, d=next, s=save as new
```

---

## Configuration

### Storage Directory

Messages are stored in: `~/.pi/storage/sessions/<date>/<branch>/<message>.msg`

Directory structure:
```
.pi/storage/sessions/
├── 2025-01-15/
│   ├── vm-arch-ai/
│   │   ├── branch-1.msg
│   │   ├── branch-10.msg
│   │   └── branch-2.msg
│   └── your-branch/
│       └── branch-1.msg
└── 2025-01-16/
    └── ...
```

### Config File

Edit `~/.pi/storage/config.json` to customize behavior:

```json
{
  "sessions": {
    "autoSave": true,                // Enable/disable auto-save
    "storagePath": ".pi/storage/sessions",
    "fileFormat": "json",            // Storage format: json (future: yaml, toml)
    "maxFileSize": 10000,            // Max file size in bytes
    "compression": false,            // Compress large files
    "dateFormat": "ISO",             // Date format: ISO, epoch
    "includeMetadata": true,         // Store model, branch, index info
    "pruneOlderThan": "30d",         // Auto-delete files older than this
    "notificationOnSave": true,      // Show notification after save
    "logLevel": "info"               // Verbose: info, debug
  }
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoSave` | boolean | `true` | Auto-save each message after input |
| `storagePath` | string | `~/.pi/storage/sessions` | Base directory for storage |
| `fileFormat` | string | `json` | Storage format |
| `maxFileSize` | number | `10000` | Max file size in bytes |
| `compression` | boolean | `false` | Compress large files |
| `dateFormat` | string | `ISO` | Date format for filenames |
| `includeMetadata` | boolean | `true` | Include model/branch metadata |
| `pruneOlderThan` | string | `30d` | Auto-delete older files |
| `notificationOnSave` | boolean | `true` | Notify after each save |
| `logLevel` | string | `info` | Verbosity level |

---

## Message Format

Each saved message is stored as a JSON file with the following structure:

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

### Field Descriptions

- `id`: Unique identifier for the message
- `type`: Message type: `user`, `assistant`, or `tool`
- `content`: Message content (text, code, etc.)
- `timestamp`: ISO 8601 timestamp
- `model`: Model name used for this conversation
- `branch`: Branch name (if applicable)
- `index`: Message index in the branch

---

## Tips and Tricks

### 1. Batch Review Sessions

Review your saved sessions at the end of the day:

```bash
# List all sessions
/list

# Show latest messages from today
/show 2025-01-15/vm-arch-ai/*.msg
```

### 2. Export Sessions

Save conversations for later analysis:

```bash
# Copy a session to your documents folder
cp ~/.pi/storage/sessions/2025-01-15/vm-arch-ai/*.msg ~/documents/conversations/
```

### 3. Analyze Conversations

Use external tools to analyze your conversations:

```bash
# Count messages per day
find ~/.pi/storage/sessions -name "*.msg" | \
  xargs -I {} basename {} .msg | \
  cut -d'-' -f1 | \
  sort | uniq -c | sort -rn

# Find longest conversation
find ~/.pi/storage/sessions -name "*.msg" -exec basename {} \; | \
  sort | uniq -c | sort -rn | head
```

### 4. Disable Auto-save for Privacy

If you don't want auto-save for certain sessions:

```json
{
  "autoSave": false
}
```

Then manually trigger save when needed: `/save`

---

## Privacy Notes

- Messages are stored locally on your machine only
- No messages are uploaded to any server
- Files are stored in plain JSON (not encrypted)
- Consider enabling compression for sensitive conversations
- Set `includeMetadata: false` if you want to avoid storing model names
- Use external encrypted storage for sensitive conversations

---

## Troubleshooting

### Messages not saving

1. Check storage directory exists: `ls -la ~/.pi/storage/sessions/`
2. Verify auto-save is enabled in config: `"autoSave": true`
3. Check for file permission issues: `ls -l ~/.pi/storage/sessions/`
4. Enable debug logging: Set `"logLevel": "debug"` in config

### Storage directory permissions

If you get permission errors:

```bash
# Fix permissions
chmod 755 ~/.pi/storage/sessions
chmod 644 ~/.pi/storage/sessions/*
```

### Clean up old sessions

Remove old sessions to free space:

```bash
# Delete sessions older than 30 days
find ~/.pi/storage/sessions -type f -mtime +30 -delete

# Or manually prune
rm -rf ~/.pi/storage/sessions/*
```

---

## API Reference

### Message Interface

```typescript
interface SavedMessage {
  id: string;
  type: "user" | "assistant" | "tool";
  content: string;
  timestamp: string; // ISO 8601
  model: string;
  branch: string;
  index: number;
}
```

### Context Interface

```typescript
interface ExtensionContext {
  model: { id: string };
  sessionManager: { getBranch(): string };
  history: { getBranchMessages(): SavedMessage[] };
  cwd: string;
  ui: {
    notify(message: string, type: string): void;
    custom(tui: any, theme: any, kb: any, done: any): any;
    setFooter(...): any;
  };
}
```

---

## Extending Functionality

To add custom storage backends (e.g., cloud storage, database), create a module in `~/.pi/storage/` and configure it in your config:

```json
{
  "storage": {
    "backend": "local", // options: local, aws-s3, gcs, azure-blob
    "region": "us-east-1",
    "bucket": "my-pi-backups"
  }
}
```

In this repo, see **`extensions/dynamic-loader.ts`** (`/extension-hint`) for stacked `pi -e` examples — not a storage backend.

---

## Related Extensions

- `session-replay.ts` - TUI viewer for session history
- `minimal.ts` - Compact footer with model info
- `tilldone.ts` - Task-driven discipline with session tracking

---

## License

This extension is part of the Pi Coding Agent project and is available under the same license as the main project.

---

## Support

For issues or feature requests, open an issue in the Pi repository or see the README.md in `~/.pi/`.