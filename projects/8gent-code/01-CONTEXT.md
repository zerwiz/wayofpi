# Context

## Project Manager

- `package.json` at repo root — standard npm/pnpm/yarn format with `type: "module"`
- Monorepo with `bun workspaces` (or npm workspaces)
- Scripts in `scripts/` for dev/build

## Tech Stack

- **Runtime:** Bun (v1.x) — fast I/O, native for TS/JS
- **TypeScript:** v5.x — strict, noImplicitAny, skipLibCheck
- **Package Manager:** npm (default), pnpm optional
- **Frontend:** React 19 + TS + Ink v6 (TUI library)
- **Storage:** SQLite + FTS5 (via better-sqlite3)
- **AI SDK:** Vercel AI SDK (`@ai-sdk/ollama`, `@ai-sdk/openrouter`, etc.)
- **Audio:** Tone.js, ffmpeg.wasm
- **Web:** Vite, Next.js (dashboard)
- **Desktop:** Tauri (clui app)

## Required Env Vars

| Var | Default | Purpose |
|-----|---------|---------|
| `TELEGRAM_BOT_TOKEN` | — | Telegram notifications |
| `TELEGRAM_CHAT_ID` | — | Telegram notifications |
| `OPENROUTER_API_KEY` | — | Cloud model access (optional) |
| `ANTHROPIC_API_KEY` | — | Claude comparisons (optional) |
| `OLLAMA_URL` | `http://localhost:11434` | Local model endpoint |

All optional — 8gent runs fully offline with Ollama.

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `bun install` | Faster install (Bun) |
| `npm run build` | Build CLI (bin/8gent.ts → dist/cli.js) |
| `npm start` | Launch (runs packages/eight/index.ts) |
| `npm run pet` | Build + open Lil Eight app |
| `npm run pet:build` | Build Lil Eight |
| `npm run cli` | Run CLI directly |
| `npm run dev` | Dev mode (Next.js) |

### CLI Usage

```bash
# Launch TUI
8gent

# Launch specific app
8gent tui                   # TUI
8gent pet start             # Dock pet
8gent chat "message"        # Non-interactive chat
8gent session list          # List sessions
8gent agent spawn role "task"  # Spawn sub-agent
8gent memory recall "topic"  # Recall memories
8gent outline file.ts       # Symbol outline
8gent symbol file.ts::name  # Specific symbol
```

## Key Directories

- `apps/` — 6 product apps (tui, clui, dashboard, debugger, demos, installer)
- `packages/` — 50+ capability packages (ai, eight, memory, orchestration, music, etc.)
- `src/` — Core source (not used; apps/packages have their own paths)
- `config/` — Config files (tsconfig.json, .eslintrc)
- `benchmarks/` — Efficiency tests
- `scripts/` — CLI utilities, build scripts

## Notes

- **Linux:** Some macOS-specific paths don't exist; use `apps/lil-eight/build-linux.sh`
- **Windows:** Not fully supported yet; WSL2 recommended
- **Memory:** SQLite db created on first use, stored in `.8gent/`
- **Infinite mode:** Use `--infinite` flag

---

*Full stack details and commands in [00-OVERVIEW.md](./00-OVERVIEW.md)*
