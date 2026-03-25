# Session Saver Extension

Implementation: **`extensions/sessions/index.ts`** (Pi `ExtensionAPI`).

## Features

- **Auto-save** (default on): on each **`message_end`** for `user` / `assistant`, writes a JSON snapshot under the configured storage directory (`settings.storagePath`, default `.pi/storage/sessions`).
- **Manual snapshot**: **`/save`** writes a branch index (entry ids/types, session file path, last 800 entries in index).
- **`/list`**: JSON files in storage.
- **`/show <file>`**: Prints file contents (truncated) in a notify panel.
- **`/load <path>`**: If the path ends with **`.jsonl`**, calls **`ctx.switchSession`** to resume that Pi session file; otherwise shows a short preview.

Configuration: **`extensions/sessions/config.json`** → `settings` keys:

| Key | Default | Meaning |
|-----|---------|--------|
| `autoSave` | `true` | Fire auto-save on message_end |
| `storagePath` | `.pi/storage/sessions` | Relative to project cwd |
| `maxFileSize` | `524288` (`512 * 1024`) if omitted | Max characters for written JSON (truncation marker appended) |
| `includeMetadata` | `true` | Include model id in auto-save payload |
| `notificationOnSave` | `true` | Toast each auto-save |

Other keys may exist in `config.json` for packaging or future use; **`index.ts` only reads the keys above**.

## Install / run

```bash
pi -e extensions/sessions/index.ts -e extensions/minimal.ts
```

Or load via **`.pi/settings.json`** → `".pi/extensions/session-saver.ts"` (shim in this repo).

## Commands

| Command | Description |
|---------|-------------|
| `/save` | Manual branch index snapshot |
| `/list` | List `*.json` in storage |
| `/show file` | Preview snapshot by name or path |
| `/load path` | If `path` ends in `.jsonl`, switch Pi session to that file |

## Auto-save filenames

`auto-<sessionPrefix>-<role>-<iso-timestamp>.json`

## Privacy

Storage may contain conversation content. This repo’s **`.gitignore`** includes **`.pi/storage/sessions/`** and **`.pi/chronicle/ledger.json`** (local state).
