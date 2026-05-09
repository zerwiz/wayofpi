# Way of Work API (née Way of Pi Server)

Backend API server shared by all frontend apps. Handles file operations, Git, terminal WebSocket, AI chat sessions, and SQLite database.

**Note**: Will be renamed from `wayofwork-server` to `wayofwork-server` to match the "Way of Work" branding.

## What it does

- **File System**: Read/write files, tree navigation, move/rename/delete
- **Git**: Stage, commit, diff, status
- **Terminal**: PTY-based shell via WebSocket (Bun.spawn)
- **Chat**: AI agent chat via Pi.dev SDK with WebSocket streaming
- **Database**: SQLite for workspace state, user data, sessions
- **Diagnostics**: Health checks, environment probes, ngrok tunnel management

## Tech Stack

- **Runtime**: Bun
- **Database**: SQLite (via `bun:sqlite`)
- **WebSocket**: Native Bun.serve WebSocket handler
- **AI**: Pi.dev coding agent SDK

## Quick Start

```bash
cd apps/wayofwork-server
bun install
bun run dev          # Starts on port 3333
```

## Environment

- `WOP_ALLOW_TERMINAL=1` — enable embedded terminal
- `WOP_WORKSPACE=/path` — set workspace root
- `WOP_ALLOW_SERVER_RESTART=1` — allow API restart from UI

## Dependencies

Serves all frontends: `wayofwork-ui`, `wayofpi/technicalIDE`, `workerportal`.
