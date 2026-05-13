# Way of Pi

IDE-style extension system for [Pi.dev](https://pi.dev) — a visual shell around the Pi coding agent with a VSCode-inspired workspace, multi-cell editor grid, embedded terminal, chat panel, and debug support.

## Architecture

```
apps/wayofpi/
├── technicalIDE/    — React frontend (Vite + React 19 + Tailwind 3)
└── server/          — Bun proxy server (port 3334 → 3333)
```

- **Frontend**: Port 5174 (dev), connects to shared backend API on port 3333
- **Server**: Bun.serve on port 3334, proxies HTTP + WebSocket to main API
- **Terminal**: WebSocket proxied to main server — PTY context persists across sessions
- **Shared code**: Reuses components from `apps/wayofwork-ui/src/` via `@wop` alias

## Quick Start

```bash
cd apps/wayofpi/technicalIDE
bun install
bun run dev         # Vite dev on :5174
```

Requires the main API server running on port 3333 (`apps/wayofwork-ui/server/`).

## Features

- File explorer with workspace tree
- Multi-cell editor grid (split editor, drag-and-drop tabs)
- Embedded terminal (bash, PTY via Bun)
- Chat panel (Pi.dev agent integration)
- File menu, edit menu, selection, go, run/debug, terminal, help
- Keyboard shortcuts (VSCode-compatible)
- Zen mode, centered layout, editor word wrap
- Static analysis / problems panel
- Git integration (stage, review, SCM panel)
- Extensions and agent team management
- Plan/build/review workflow with Pi.dev agents

## Stack

- **Runtime**: Bun
- **Frontend**: React 19, TypeScript, Tailwind CSS 3, Vite
- **Editor**: CodeMirror / Monaco-based workspace pane
- **Terminal**: xterm.js with PTY via Bun.spawn
- **State**: React hooks + localStorage persistence
