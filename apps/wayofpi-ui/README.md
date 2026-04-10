# Way of Pi — Technical UI

Monorepo: [zerwiz/wayofpi](https://github.com/zerwiz/wayofpi).

Production-oriented web shell: **real workspace tree**, **file read/write**, **streaming chat** via **Ollama** or **OpenRouter** (no mock data).

## Requirements

- [Bun](https://bun.sh) ≥ 1.1 (for the **server** — `Bun.serve`, filesystem, WebSocket)
- [Node](https://nodejs.org) + npm (for installing deps and `vite` / `tsc` if you prefer)
- A running **Ollama** instance (default) or **OpenRouter** API key

Headless **Pi** as the chat/tool engine is planned; this stack already gives a **real** editor, tree, saves, and **streaming LLM** chat against your workspace.

**Gaps and stubs:** **[docs/WAY_OF_PI_OPEN_TODOS.md](../../docs/WAY_OF_PI_OPEN_TODOS.md)** (Technical/Simple UI, server, production).

## Simple vs Technical UI

The top bar includes **Simple** | **Technical**:

- **Simple** (default) — Chat-forward layout: wider chat column, friendly labels (“You”, “Assistant”, “Team helpers”), shorter menu strip, status bar shows connection and workspace only. The file explorer and bottom panel are hidden; switch to **Technical** to browse files or see the tool log.
- **Technical** — IDE-style shell: activity bar, workspace tree, **Tool Log** / Problems / Output panel, full status bar (line/column, encoding, token placeholders).

The choice is stored in **`localStorage`** as **`wayofpi.uiMode`** (`simple` | `technical`). See **[docs/PLAN_WEB_STANDALONE_SYSTEM.md](../../docs/PLAN_WEB_STANDALONE_SYSTEM.md)**.

**Technical layout (components, state, API boundaries):** **[docs/WOP_TECHNICAL_UI.md](../../docs/WOP_TECHNICAL_UI.md)**.

## Setup

```bash
cd apps/wayofpi-ui
npm install
cp .env.sample .env
# Edit .env: set WOP_WORKSPACE to the project folder you want in the explorer
```

## Development

Runs **Bun server** (port `3333`: `/api/*`, `/ws`) and **Vite** (port `5173`) with proxy.

From the **repository root**, **`./start-wayofpi-ui.sh`** runs **`npm run dev`**, waits until the UI is up, and opens **`http://localhost:5173/`** in your default browser.

```bash
npm run dev
```

Requires `bun` on your `PATH`. UI-only build: `npm run build`.

Open `http://127.0.0.1:5173`.

## Production

```bash
npm run build
WOP_WORKSPACE=/path/to/project bun run start
```

The same Bun process serves `dist/` static assets plus `/api` and `/ws`.

## API (real)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness |
| GET | `/api/workspace` | JSON: `root` (primary folder), `folders[]` (`label` + absolute `path`), `switchAllowed`, `initialRoot` |
| POST | `/api/workspace` | Change folders in-memory. Body `{ "op": string, ... }` — see **Workspace ops** below. |
| GET | `/api/config` | LLM provider + model labels |
| GET | `/api/tree` | `root`, `nodes`, `folders`, `switchAllowed`, `initialRoot`. Single-root: paths relative to folder. Multi-root: paths `label/relative/path`. |
| GET | `/api/file?path=` | Read file (2 MiB cap). **Text:** JSON `{ path, content }` (UTF-8). **Image** (`png`, `jpeg`, …): `{ path, encoding: "base64", mimeType, content }`. **Other binary** (e.g. contains `NUL`): same base64 shape with `mimeType: "application/octet-stream"`. |
| PUT | `/api/file` | JSON `{ path, content }` save file |
| POST | `/api/fs/entry` | JSON `{ path, kind: "file" \| "dir" }` create empty file or folder (409 if exists) |
| WS | `/ws` | Chat + server log stream |

### Workspace ops (`POST /api/workspace`)

Disabled when **`WOP_ALLOW_WORKSPACE_SWITCH`** is `0`, `false`, or `no` (default: allowed).

| `op` | Extra fields | Effect |
|------|----------------|--------|
| `open_folder` | `path` (absolute dir) | Replace workspace with a single folder. |
| `add_folder` | `path` (absolute dir) | Append folder (multi-root). |
| `remove_folder` | `label` | Remove one root; if none left, reset to `initialRoot`. |
| `close_workspace` | — | Reset to `initialRoot`. |
| `open_file` | `path` (absolute file) | Open parent as single root; response includes `selectPath` for the editor. |
| `apply_workspace_folders` | `paths` (absolute dirs) | Set multi-root list. |
| `from_code_workspace_file` | `workspaceFilePath`, `json` | Load VS Code–style `folders`; relative paths resolve from the workspace file directory. |

## WebSocket protocol

- Client → server:
  - `{ "type": "chat", "content": "..." }` — user turn; server appends to the in-memory transcript for this WebSocket and streams the model reply.
  - `{ "type": "new_session" }` — clear transcript (and optional `WOP_SYSTEM_PROMPT` re-applied). Not allowed while a reply is streaming.
  - `{ "type": "ping" }` — server replies `{ "type": "pong" }`.
- Server → client: `ready`, `log`, `user_message`, `assistant_delta`, `done`, `error`, `session_reset` (after `new_session`; client clears UI transcript).

## Security notes

- All file paths are **jailed** under the **current workspace folder list** (starts as `WOP_WORKSPACE` or `cwd`). Multi-root paths must use the `label/...` prefix returned in `/api/tree`.
- Chat runs **your** configured LLM (Ollama/OpenRouter). Pi plugins/tools are the next integration step behind the same `/ws` contract.
- Do not expose this server to the public internet without authentication and TLS.
