# Way of Pi — Technical UI

Monorepo: [zerwiz/wayofpi](https://github.com/zerwiz/wayofpi).

Production-oriented web shell: **real workspace tree**, **file read/write**, **streaming chat** via **Ollama** or **OpenRouter** (no mock data).

## Requirements

- [Bun](https://bun.sh) ≥ 1.1 (for the **server** — `Bun.serve`, filesystem, WebSocket)
- [Node](https://nodejs.org) + npm (for installing deps and `vite` / `tsc` if you prefer)
- A running **Ollama** instance (default) or **OpenRouter** API key

Headless **Pi** as the chat/tool engine is planned; this stack already gives a **real** editor, tree, saves, and **streaming LLM** chat against your workspace.

**Gaps and stubs:** **[docs/WOP_OPEN_TODOS.md](../../docs/WOP_OPEN_TODOS.md)** (Technical/Simple UI, server, production).

## Simple vs Technical UI

The top bar includes **Simple** | **Technical**:

- **Simple** (default) — Chat-forward layout: wider chat column, friendly labels (“You”, “Assistant”, “Team helpers”), shorter menu strip, status bar shows connection and workspace only. The file explorer and bottom panel are hidden; switch to **Technical** to browse files or see the tool log.
- **Technical** — IDE-style shell: activity bar, workspace tree, **Tool Log** / Problems / Output panel, full status bar (line/column, encoding, token placeholders). **View → Editor Layout → Workspace grid** can split the main editor into up to **3×4** panes (columns × rows) (each pane has its own tab stack and file buffer). **Drag the orange-accent splitters** between panes to resize row/column shares; sizes persist with **`wayofpi.technical.workspaceGrid.v1`** in `localStorage` (`rowWeights` / `colWeights` when you resize). **Drag files, tabs, or the pane grip** onto **edge snap zones** to **auto-expand** a **1×1** (or the outer edge of an **N×1** / **1×N** strip) into a split; **cross-cell** **tabs** can be dropped on another pane’s **tab bar** for insert order. Details: **[docs/WOP_TECHNICAL_UI.md](../../docs/WOP_TECHNICAL_UI.md)**.

The choice is stored in **`localStorage`** as **`wayofpi.uiMode`** (`simple` | `technical`). See **[docs/WOP_STANDALONE_SYSTEM_PLAN.md](../../docs/WOP_STANDALONE_SYSTEM_PLAN.md)**.

**Technical layout (components, state, API boundaries):** **[docs/WOP_TECHNICAL_UI.md](../../docs/WOP_TECHNICAL_UI.md)**.

**Chat: Build vs Plan:** **[docs/WOP_BUILD_PLAN_MODE.md](../../docs/WOP_BUILD_PLAN_MODE.md)** — execution vs specification-first mode, `plans/PLAN-…md` handoff, and how this compares to Cursor Plan Mode and Pi TUI agents.

## Setup

```bash
cd apps/wayofpi-ui
npm install
cp .env.sample .env
# Edit .env: set WOP_WORKSPACE to the project folder you want in the explorer
```

## Development

Runs **Bun server** (port `3333`: `/api/*`, `/ws`) and **Vite** (port `5173`) with proxy.

From the **repository root**, **`./start-wayofpi-ui.sh`** runs **`npm run dev`**, waits until the UI is up, and opens **`http://localhost:5173/`** in your default browser. To use a **desktop window** instead of a browser tab, set **`WOP_USE_ELECTRON=1`** (same stack: Bun server + Vite + Electron), or from repo root run **`just wayofpi-electron`**.

```bash
npm run dev
```

**Electron (optional):** after `npm install`, from `apps/wayofpi-ui`:

- **`npm run electron:dev`** — Bun API (`:3333`) + Vite (`:5173`) + Electron loading the dev server (no manual browser).
- **`npm run electron:only`** — Electron only; use when **`npm run dev`** is already running (avoids **EADDRINUSE** on **3333**).
- **`npm run electron:prod`** — `vite build`, then Bun serves `dist/` on **`WOP_SERVER_PORT`** (default `3333`) and Electron opens that origin.

On **Linux** and **Windows**, the shell calls **`Menu.setApplicationMenu(null)` before `app` is ready** (Electron otherwise installs its default **File / Edit / View …** bar at ready — see [electron#35512](https://github.com/electron/electron/issues/35512)), then strips the window menu again on create. Your menus live only in the in-app bar (`MenuBar.tsx`). **macOS** still gets a minimal system menu (**Way of Pi** → About, Hide, Quit) above the window.

In the Electron build, **`electron/preload.mjs`** exposes **`window.wopShell`** so **View → Reload window** / **Reload (ignore cache)** and **Help → Toggle Developer Tools** replace the old Chromium **View** menu behavior (browser dev still uses **F12** / normal reload).

Environment:

- **`WOP_ELECTRON_DEV_URL`** — override dev load URL (default `http://127.0.0.1:5173`).
- **`WOP_ELECTRON_PROD_URL`** — override production load URL (default `http://127.0.0.1:${WOP_SERVER_PORT}/`).

Requires `bun` on your `PATH`. UI-only build: `npm run build`.

Open `http://127.0.0.1:5173` in a browser when not using Electron.

**Integrated terminal:** the UI connects to **`/ws/terminal`** (xterm + WebSocket). With **`npm run dev`**, the Bun server runs as **`NODE_ENV=development`** (even if your shell inherited `production`) and sets **`WOP_ALLOW_TERMINAL=1` by default** when the variable is unset, so you get a real shell in the workspace folder. Set **`WOP_ALLOW_TERMINAL=0`**, **`false`**, **`no`**, or **`off`** to turn it off. **`npm start`** uses **`NODE_ENV=production`**, where the terminal stays **off** unless you set **`WOP_ALLOW_TERMINAL`** to a truthy value (**`1`**, **`true`**, **`yes`**, **`on`**) — host shell; trusted machines only.

## Production

```bash
npm run build
WOP_WORKSPACE=/path/to/project WOP_ALLOW_TERMINAL=1 bun run start
```

Omit **`WOP_ALLOW_TERMINAL=1`** if you do not want the integrated host shell in production.

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
| WS | `/ws/terminal` | Interactive shell (JSON messages); **dev:** on by default when `WOP_ALLOW_TERMINAL` unset; **production:** requires `WOP_ALLOW_TERMINAL=1` |

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
| *(File menu)* **Save Workspace As…** | — | Downloads a `.code-workspace` JSON: optional parent-folder prompt emits **relative** `folders[].path` values (same rules as VS Code/Cursor); leave the prompt empty for **absolute** paths only. |

## WebSocket protocol

- Client → server:
  - `{ "type": "chat", "content": "..." }` — user turn; server appends to the in-memory transcript for this WebSocket and streams the model reply.
  - `{ "type": "new_session" }` — clear transcript (and optional `WOP_SYSTEM_PROMPT` re-applied). Not allowed while a reply is streaming.
  - `{ "type": "activate_session", "transcript": [ { "role": "user"|"assistant", "content": "..." }, ... ] }` — restore the server transcript for the active stacked chat tab (or after reconnect). Not allowed while streaming.
  - `{ "type": "ping" }` — server replies `{ "type": "pong" }`.
- Server → client: `ready`, `log`, `user_message`, `assistant_delta`, `done`, `error`, `session_reset` (after `new_session`; client clears UI transcript).

## Security notes

- **`/ws/terminal`** runs a **host shell** with cwd under the workspace. Development defaults it on when `WOP_ALLOW_TERMINAL` is unset; production requires an explicit `1`.
- All file paths are **jailed** under the **current workspace folder list** (starts as `WOP_WORKSPACE` or `cwd`). Multi-root paths must use the `label/...` prefix returned in `/api/tree`.
- Chat runs **your** configured LLM (Ollama/OpenRouter). Pi plugins/tools are the next integration step behind the same `/ws` contract.
- Do not expose this server to the public internet without authentication and TLS.
