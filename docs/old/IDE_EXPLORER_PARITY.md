# IDE shell parity: Explorer and related UI (Cursor, Zed, Way of Pi)

This document compares how **Cursor** (VS Code–family), **Zed**, and the **Way of Pi** web technical shell (`apps/wayofwork-ui`) handle the file explorer and adjacent IDE affordances. It is meant for product and implementation planning, not as a license of any vendor’s UI.

## Reference: Cursor and VS Code

Cursor is built on VS Code. The **Explorer** is the first activity-bar view: a **tree of workspace folders**, with sections such as **Open Editors**, **Folders**, **Outline**, and **Timeline** (depending on layout and enabled views).

Typical Explorer behaviors and controls:

| Area | Behavior |
|------|----------|
| **Workspace / folder header** | Collapses or expands the **Folders** tree; the chevron reflects open/closed state. |
| **Toolbar** | **New File**, **New Folder**, **Refresh**, **Collapse Folders in Explorer** (and context-dependent actions). |
| **Tree** | **Directories first**, then files (default sort). Collapsing a folder **hides all descendants**. Root-level files are **siblings** of top-level folders, not “inside” a collapsed folder. |
| **Selection** | Clicking a folder selects it and toggles expand; creating a new file/folder targets the **selected** folder (or an implicit context). |
| **Context menu** | New file/folder, rename, delete, reveal in explorer, copy path, etc. |
| **Dnd** | Drag-and-drop move/copy within the tree (where the workbench allows). |
| **Keyboard** | **Ctrl/Cmd+B** toggles sidebar visibility; **Ctrl/Cmd+Shift+E** focuses Explorer; **Ctrl/Cmd+P** quick-open file. |

Sources: VS Code–style navigation is described in many Cursor-oriented guides (e.g. sidebar = Explorer + Search + SCM; Explorer = tree + create/rename/delete/move). Community threads also document Explorer sections (Folders vs Outline) when the tree appears “missing” — usually a **view layout** or **Folders** visibility issue.

## Reference: Zed

Zed’s project browser is the **Project Panel** (left dock):

| Area | Behavior |
|------|----------|
| **Toggle** | **Ctrl/Cmd+B** toggles the dock; **Ctrl/Cmd+Shift+E** focuses the project panel (bindings evolved toward VS Code parity in recent releases). |
| **Tree** | Directory tree for the project; **Ctrl/Cmd+P** opens the **file finder** (fuzzy open), which is often faster than the tree. |
| **New file** | Supported from the project panel; users coming from VS Code sometimes add **custom key sequences** until defaults match muscle memory. |
| **Related** | **Outline** and **project search** are separate surfaces (e.g. outline panel, **Ctrl/Cmd+Shift+H** project search per Zed docs). |

Sources: [Zed features](https://zed.dev/features), [Finding & Navigating](https://zed.dev/docs/finding-navigating.html), and Zed GitHub discussions on **project_panel::NewFile** vs VS Code’s `explorer.newFile`.

## Way of Pi technical shell (current)

Implemented in `apps/wayofwork-ui` (technical layout). When **View → Editor Layout** uses a **workspace grid** (multiple **`WorkspacePane`** cells), **Open** from the explorer targets the **focused** cell (orange ring); click a cell first to choose where files open. **Dragging** a file onto a **workspace cell edge** can **grow** the grid when it was still **1×1** (or an **N×1** / **1×N** outer edge) so the drop lands in a new neighbor pane — see **`docs/WOP_TECHNICAL_UI.md`**.

| Feature | Status |
|---------|--------|
| Activity bar → Explorer / Search / SCM / Extensions / Settings | Partial (stubs for some views). |
| Explorer **Folders** tree from workspace API | Yes (`GET /api/tree`). |
| **Collapse workspace root** (hide entire Folders list) | Yes — workspace header toggles tree + toolbar. |
| **Sort: folders first, then files** | Yes (client-side `sortTreeNodes`). |
| **Collapse folder hides children** | Yes (nested render); root files remain visible when all **top-level** folders are collapsed (same as VS Code). |
| **New File / New Folder** toolbar | Yes; creates via `POST /api/fs/entry`; **New File** opens the file in the editor after refresh. |
| **Context directory** for new items | Click a folder to set context; opening a file sets context to its parent. |
| **Open Editors** section | Not implemented. |
| **Outline** | Placeholder section only. |
| **Timeline** | Placeholder section only. |
| **Right-click context menu** on tree | Not implemented. |
| **Rename / delete / duplicate** | Not implemented in tree (use host tools or extend API). |
| **Drag-and-drop** in tree | Not implemented. |
| **Reveal active file in explorer** | Not implemented. |
| **Multi-root workspaces** | Single `WOP_WORKSPACE` root only. |
| **Simple mode** file list | Flat “Project Files” list (`SimpleRightPanel`) — intentional for density, not a full tree. |

## Gaps and mis-mappings (priority notes)

1. **“Folders won’t fully close” confusion** — In VS Code/Cursor, **files at the repository root** stay visible when every **folder** is collapsed; they are not children of those folders. Way of Pi now **sorts** folders first then files to match that mental model. **Collapsing the workspace row** hides the entire Folders tree for users who want a minimal sidebar.

2. **New file must open** — Implemented: after `POST /api/fs/entry` with `kind: "file"`, the client sets `selectedPath` and refreshes the tree so `useFileEditor` loads the new file.

3. **Missing VS Code/Cursor parity** — High-value next steps: context menu (new/reveal/rename/delete), **Collapse All**, **Refresh** on the Explorer toolbar, **Open Editors**, and **reveal active file** when the selection changes.

4. **Missing Zed-like flows** — Dedicated **fuzzy file finder** (Ctrl+P) as a first-class modal; optional **keyboard-first** project panel bindings aligned with Zed/VS Code keymaps.

5. **API surface** — `PUT /api/file` still **overwrites** without an existence check; creation for empty files should go through **`POST /api/fs/entry`** (or add `if-none-match` / explicit flags) to avoid accidental clobber.

## Related repo docs

- **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** — product plan and UI phases.  
- **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** — backlog and stubs.  
- **`apps/wayofwork-ui/README.md`** — running the UI server and workspace env vars.
