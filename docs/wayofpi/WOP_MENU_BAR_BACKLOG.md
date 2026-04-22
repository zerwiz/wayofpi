# Way of Pi — menu bar & shell command parity (backlog)

**Purpose:** Track **every command family** exposed from a typical **modern AI-integrated editor shell** (top-level **File → … Help** menus, command palette, sidebars, panels) and map each item to **Way of Pi** behavior: **web UI**, **Bun server**, and **headless Pi** (`WOP_*`, workspace agents, tools, extensions).

**No third-party product names** — this doc speaks only in terms of **capabilities** and **Way of Pi** implementation.

**Living implementation:** `apps/wayofpi-ui/src/components/MenuBar.tsx`, `App.tsx` (handlers, shortcuts), `CommandPalette.tsx`, `types/workspaceEditor.ts` (`*MenuHandlers`).

**Related:** **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** · **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** · **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** · **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)**

---

## Status legend

| Tag | Meaning |
|-----|---------|
| **Shipped** | Wired in UI; meaningful action today. |
| **Partial** | Menu or shortcut exists; behavior is stub, palette-only, or needs server/Pi. |
| **Planned** | Not in UI; requires design + backend. |
| **Pi** | Depends on **headless Pi** subprocess (or equivalent API): tools, slash commands, extensions. |
| **API** | Depends on **new/extended HTTP or WebSocket** on the Way of Pi server. |

---

## File

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| New text file | Workspace-relative create via `/api/fs` + open | **Shipped** |
| New file (typed) / template | Templates from workspace or Pi skill | **Planned** |
| New window / duplicate workspace | Multi-window or second browser tab with session | **Planned** |
| Open file / folder | Native picker + `postWorkspaceOp` / path prompt | **Partial** |
| Open recent | `workspaceRecent` + palette entries | **Partial** |
| Save / Save As / Save All | `useFileEditor`; multi-file save-all | **Partial** (all-of-workspace not done) |
| Revert / close editor | Reload from disk; clear selection | **Shipped** / **Partial** |
| Auto save | Preference + `useFileEditor` | **Shipped** |
| Preferences / settings | Settings side panel + server config | **Partial** |
| Keyboard shortcuts | Editable bindings, export/import | **Planned** |
| Close folder / workspace | `postWorkspaceOp` + clear state | **Shipped** |

---

## Edit

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Undo / redo | Editor history (debounced stack) | **Shipped** |
| Cut / copy / paste | `WorkspaceTextBuffer` | **Shipped** |
| Find / replace | In-buffer find bar | **Shipped** |
| Find / replace in files | Search side panel + future content index | **Partial** |
| Format document / selection | Formatter service or Pi tool | **Planned** + **Pi** |
| Comment toggles | Line / block comment | **Shipped** |
| Emmet / expand | Textarea abbreviation expand | **Shipped** (subset) |
| Multi-cursor (full) | Monaco or advanced textarea | **Planned** |

---

## Selection

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Select all / expand / shrink selection | `WorkspaceEditorRef` | **Shipped** |
| Copy/move line, duplicate | Selection helpers | **Shipped** |
| Multi-cursor / column mode | Toggles; limited vs native multi-caret | **Partial** |
| Add next/previous occurrence | Implemented | **Shipped** |

---

## View

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Command palette | `CommandPalette` + `App` items | **Shipped** |
| Explorer / Search / SCM / Extensions / Settings | `TechnicalActivity` + side panels | **Partial** (SCM/Extensions shallow) |
| Appearance (status bar, menu bar, zen, fullscreen, zoom, word wrap, breadcrumbs) | Chrome prefs + `MenuBar` | **Shipped** / **Partial** |
| Editor layout presets | Agent dock (**`technicalLayoutStorage`**) + **workspace grid** (**`workspaceGridStorage`**, up to **3×4** **`WorkspacePane`** cells, resizable splits, edge-grow + cross-cell tab DnD) | **Shipped** (subset) |
| Primary sidebar toggle | Ctrl+B, persistence | **Shipped** |
| Agent chat dock (right/bottom) | `ChatPanel` + `technicalLayoutStorage` | **Shipped** |
| Problems / output / terminal panel | Bottom panel tabs | **Partial** (Problems/Terminal depth) |
| Outline / timeline | Explorer placeholders | **Planned** |
| Simple mode: views catalog | `.wayofpi/ui-views.json` + API | **Partial** |

---

## Go

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Back / forward (file history) | In-app navigation stack | **Shipped** |
| Last edit location | Cross-file edit stack | **Planned** |
| Switch editor / group | Multi-editor groups, tab strip | **Partial** — **technical:** click a **workspace grid** cell to focus; **1×1** = single stack. No editor groups beyond grid yet. |
| Go to file | Quick open → Search activity | **Shipped** |
| Symbol in workspace / editor | **API** + index or **Pi** symbol tool | **Partial** (palette stub) |
| Definition / declaration / type / impl / references | **LSP** or **Pi** “resolve symbol” | **Planned** + **Pi** |
| Go to line/column | `goToLineColumn` | **Shipped** |
| Go to bracket | `goToMatchingBracket` | **Shipped** (textual) |
| Next/previous problem | Focus Problems + future list | **Partial** |
| Next/previous change (diff/SCM) | Integrate with `FileChangeReview` / git **API** | **Planned** |
| Add symbol to chat | Inject selection into `ChatPanel` input | **Planned** |

---

## Run

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Start debugging / run without debugging | Run active file in PTY when allowed | **Shipped** / **Partial** |
| Stop / restart / step / continue | Debug adapter or Pi-run wrapper | **Planned** + **API** |
| Breakpoints (UI + persistence) | Gutter + workspace state | **Partial** (in-memory only) |
| `launch.json` | Open/create `.vscode/launch.json` | **Shipped** |
| Install debuggers | External marketplace link (informational) | **Shipped** |

---

## Terminal

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| New / split terminal | PTY WebSocket + dock zones | **Shipped** / **Partial** |
| Run task / build / active file / selection | Inject input; `tasks.json` | **Shipped** / **Partial** |
| Task runner (list/run tasks.json) | Parse tasks + **API** process host | **Planned** |
| Running tasks UI | Process registry on server | **Planned** + **API** |
| Configure tasks | `tasks.json` | **Shipped** |

---

## Help

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Show all commands | Command palette | **Shipped** |
| How to use Way of Pi | **`HowToUseModal`** + Help menu + palette; links to GitHub docs | **Shipped** |
| Editor / accessibility docs | Links + in-repo docs | **Shipped** |
| Feedback / license / releases | Repository links | **Shipped** |
| Toggle developer tools | Electron/Tauri only; browser uses F12 | **Partial** (disabled in web) |
| Process explorer | Host process list | **Planned** (desktop shell) |
| About | In-app dialog + upstream Pi attribution | **Shipped** / **Partial** |

---

## Command palette (cross-cutting)

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Fuzzy scoring / recent commands | Client-side ranking + `localStorage` | **Planned** |
| Dynamic commands from Pi | **`/api/manifest`** or runtime introspection | **Planned** · **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** |
| “Run Pi slash command” | Bridge palette → session or headless Pi | **Planned** + **Pi** |

---

## AI session (not always a top menu, but parity with AI shells)

| Capability | Target in Way of Pi | Status |
|------------|---------------------|--------|
| Plan vs build mode | `ChatSessionMode` + planner system prompt | **Shipped** (Planning side panel) |
| Agent picker | Workspace `.pi/agents/*.md` | **Shipped** |
| Composer / multi-file apply | Tool approvals + patch application | **Planned** + **Pi** |
| Rules / memories / docs @-mentions | Hermes/Honcho + workspace docs | **Planned** · product docs |
| Background agents / orchestration grid | WebSocket contract | **Planned** · **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** |

---

## Implementation phases (suggested)

1. **Server & Pi spine** — Headless Pi for chat/tools; manifest endpoint; approvals for file/shell tools.  
2. **Workspace intelligence** — Problems from diagnostics; symbol index or LSP proxy; SCM actions beyond placeholder.  
3. **Run/debug depth** — Task runner; debug session state; breakpoint persistence; optional DAP bridge.  
4. **Editor upgrade** — Monaco or embedded LSP client; outline/timeline; multi-cursor parity.  
5. **Product hardening** — Auth, rate limits, logging, update channel (see **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)**).

---

## Maintenance

When a row moves to **Shipped**, update this table and **[CHANGELOG.md](../CHANGELOG.md)** if user-visible. Prefer linking new specs instead of duplicating design here.
