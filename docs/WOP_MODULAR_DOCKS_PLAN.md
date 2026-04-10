# Modular dock shell — plan and TODO

**Purpose:** Single backlog for making the **technical UI** a **modular, movable dock system**: equal chrome between editor and tool/file strips, drag-and-drop layout, optional **N** horizontal strips, **agent** and **primary sidebar** as repositionable docks—not fixed geometry forever.

**Cursor rule (implementation discipline):** [`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc) (applies when editing `apps/wayofpi-ui/**`).

**Rule → what to build:** [WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md) (rebuild / add / extend traceability).

**Architecture context:** [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md) · **Living gaps:** [WAY_OF_PI_OPEN_TODOS.md](WAY_OF_PI_OPEN_TODOS.md)

---

## Principles (product + engineering)

1. **Peers, not tiers** — Regions that are “tabs + body” (main editor column, horizontal strips, future panes) should share the **same structural chrome** where it makes sense, so nothing feels like a second-class “panel” under a “real” editor unless we document an intentional exception.
2. **Everything is a dock (target)** — **Editor stack**, **tool/file strips**, **agent chat**, **primary sidebar** (Explorer rail) are all **dock nodes** in a layout graph the user can rearrange.
3. **Data-driven layout** — Persist **region tree + sizes + tab lists**; avoid JSX trees that hard-code one order with no migration path.
4. **DnD is the interaction model** — Move **tabs** between strips; move **strips** or **major regions** when the layout engine supports it.
5. **No artificial cap on strip count** — Today we have **two** persisted slots (`top` / `bottom`); the model should generalize to **many** strips (side-by-side or stacked) without renaming the world again.

---

## Current state (snapshot)

| Area | Shipped | Gaps |
|------|---------|------|
| **Horizontal strips** | **UI:** one band (**`bottom`**, under editor). **`ToolDockLayout.strips`** still has **`top` / `bottom`** keys for persistence; **`top`** is cleared and merged into **`bottom`** on read/write. | Strips are **not** yet arbitrary N; **upper** band was removed (can be reintroduced via Phase C). |
| **DnD** | Tab drag **reorders** within the bottom strip (and legacy payloads normalize to **`bottom`**). | No second strip to drag **between** until multi-strip work lands. |
| **File in strip** | **`StripFilePreview`** (read-only fetch) for **`file`** entries; **+** menu adds new/open file **into the slot** where + was used. | Parity with **main editor** (breadcrumbs, **`WorkspaceTextBuffer`** read-only, shared chrome) is **partial** — see Phase B. |
| **Main editor** | Single **`EditorPanel`** + **`selectedPath`**; empty state uses same chrome as open file. | **Not** yet “just another dock leaf” in a graph; **multi-file** as multiple columns is not shipped. |
| **Agent (`ChatPanel`)** | Dock **right** or **bottom**; resize; hide/show; persisted in **`TechnicalDockLayout`**. | **Not** dockable **left**; not a generic node in a grid. |
| **Primary sidebar** | Left only; width persisted; Ctrl/Cmd+B toggle. | **Not** movable to **right**; activity bar not mirrored. |
| **Preview & review chrome** | — | No **Preview** bar, **Markdown** view toggle, **Review Next File**, or **Undo File** / **Keep File** (+ **Ctrl+Enter**) as first-class editor/dock actions — see **Phase F**. |

---

## Phases (ordered plan)

Use these as checklists; adjust order when dependencies demand it.

### Phase A — Visual parity (“equal docks”)

Goal: User-visible **alignment** between **editor column** and **horizontal dock** chrome (per screenshots / UX complaints: one row vs “TOOL DOCK” + tabs).

- [ ] **A1** — Merge **title row + tab row** for **`UnifiedHorizontalDock`** into **one** header row (grip + band label + **+** + tabs), or match **EditorPanel** tab row styling so both feel like the same family.
- [ ] **A2** — Align typography, borders, and **accent** (active tab underline) between **`EditorPanel`** tab bar and **`DockableToolStrip`** tab bar.
- [ ] **A3** — For **file** tabs in a strip, add a **breadcrumb / path** sub-row or inline path when the active entry is `file` (mirror editor affordances at minimal cost).
- [ ] **A4** — Document screenshots or short “before/after” in this file when A1–A3 land.

### Phase B — File dock = editor-class surface (optional but high value)

Goal: Pinned file in a strip feels like the **same document surface** as the main editor (read-only OK).

- [ ] **B1** — Replace or wrap **`StripFilePreview`** with **`WorkspaceTextBuffer`** **`readOnly`** + same line-number gutter option as **`EditorPanel`** where feasible.
- [ ] **B2** — Explicit **“Open in main editor”** control on file strip body (keyboard shortcut optional).
- [ ] **B3** — Decide **single source of truth** for dirty buffers when the same path is open in main + strip (today: strip is read-only snapshot — document or evolve).

### Phase C — Layout model: N strips (data + UI)

Goal: User can have **multiple** horizontal dock areas (e.g. 4–8 tabs groups), not only top/bottom.

- [ ] **C1** — Design **`DockStripInstance`**: `id`, `placement` (enum or string), `entries[]`, `activeIndex`, `height` or flex weight.
- [ ] **C2** — Migrate **`wayofpi.technical.toolDock`** JSON: `strips: { top: [], bottom: [] }` → `strips: DockStripInstance[]` with migration from legacy keys.
- [ ] **C3** — **`App.tsx`** (or new **`TechnicalDockLayoutRoot`**) renders **from array** instead of two hard-coded **`UnifiedHorizontalDock`** sites.
- [ ] **C4** — **Split / new strip** UX: drag tab to screen edge or “New strip below” drop target; persist new instance.
- [ ] **C5** — Command palette / View menu: “Add horizontal dock strip”, “Remove strip” (non-destructive confirm if non-empty).

### Phase D — Major regions as docks (agent + sidebar)

Goal: **ChatPanel** and **primary sidebar** become **movable dock regions**, not fixed left/right in one tree.

- [ ] **D1** — **`ChatDockRegion`** extend to **`left` \| `right` \| `bottom`** (and validate resize semantics for each).
- [ ] **D2** — Refactor **`App.tsx`** center row so **agent** insertion point is **data-driven** (swap order of children).
- [ ] **D3** — **Primary sidebar**: support **`sidebarEdge: "left" \| "right"`** in layout; mirror **`ActivityBar`** + splitters; persist.
- [ ] **D4** — DnD or explicit commands to **move agent** / **flip sidebar** (start with commands if DnD is too heavy).

### Phase E — Full pane grid (stretch)

Goal: Zed/VS Code–class **arbitrary splits** (editor + tools + chat in one grid).

- [ ] **E1** — Spec **layout graph** (nodes: region type, children, sizes); version field for migrations.
- [ ] **E2** — Implement minimal **2×2** or **split drop targets** on editor edges; then generalize.
- [ ] **E3** — Per-workspace layout override (optional path in server or `localStorage` keyed by workspace id).

### Phase F — Preview & review workflow (editor / dock parity)

Goal: Match **IDE-style** controls for **preview modes**, **queued file review** (agent / team flows), and **accept vs revert** on edited files—implemented as **modular chrome** on the **editor stack** or **file dock** (same “tabs + title + actions” family as Phase A), not a one-off page.

**Reference UI (product target):**

| Control | Function |
|---------|----------|
| **Preview** (section label) | Indicates the active pane is a **preview** surface (vs raw buffer). |
| **Markdown** | **View mode** toggle: switch rendering for the current document (e.g. Markdown **rendered preview** vs source)—extensible to other format previews by file type / dock context. |
| **Review Next File** | **Workflow navigation**: advance to the **next** item in a **review queue** (sequential review of files/tasks from agents, checklist, or diff pipeline). Ties to **Team Pulse** / multi-agent flows when **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** (or server queue API) exists; until then, can stub with local queue state. |
| **Undo File** | **Secondary** action: revert or discard the **current file** change set (last write / generated patch)—destructive path; ghost/outline button style. |
| **Keep File** | **Primary** action: **confirm** current changes (save / accept patch). Show keyboard hint **`Ctrl+Enter`** (document **⌘↩** on macOS in UI copy); implement **`keydown`** handler on the editor/review dock scope for accessibility and speed. |

Checklist:

- [ ] **F1** — **Editor / file-dock title row** (or shared **`DockRegionTitleBar`** extension) hosts **Preview** + **Markdown** + **Review Next File** when context applies (file type, review session active, or feature flag).
- [ ] **F2** — **Markdown** mode: wired to real preview pipeline (rendered HTML or iframe-safe subset) for `.md` / workspace policy; persist last mode per path or session as needed.
- [ ] **F3** — **Review queue** model: ordered list of paths (or URIs) + cursor; **Review Next File** loads next, updates queue; optional integration with agent-team / WebSocket events later.
- [ ] **F4** — **Undo File** / **Keep File** bar: visible in **review** or **post-edit** state (dirty / patch pending); **Keep** triggers save or accept; **Undo** restores disk baseline or rejects patch; match primary vs secondary button styling from reference.
- [ ] **F5** — **Keyboard**: **Ctrl+Enter** (and **Cmd+Enter** on macOS) bound to **Keep File** when the review bar is focused or when the editor has pending keepable changes (document conflict with “send chat” if both visible—define focus scope).

---

## Dependencies and risks

- **Scope creep:** Phases C–E touch almost every layout line in **`App.tsx`**; prefer **extracting** a layout component **before** C3.
- **Persistence:** Every schema change needs **`readToolDockLayout` / `readDockLayout`** style migration and a **fallback** for corrupt JSON.
- **Performance:** Many **`WorkspaceTextBuffer`** instances (B + C) — consider **virtualize** or **mount one** buffer by active tab.
- **Phase F shortcuts:** **Ctrl+Enter** may overlap global chat “send” or palette; scope handlers to **editor / review dock** focus or explicit **review mode** flag.

---

## When you ship something

1. Check boxes above (or split into PR-sized sub-items).  
2. Update **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** “Shipped / Next” tables.  
3. Note user-visible changes in **[CHANGELOG.md](../CHANGELOG.md)** if applicable.  
4. Keep **[WAY_OF_PI_OPEN_TODOS.md](WAY_OF_PI_OPEN_TODOS.md)** in sync (short pointer + link here).

---

## Related

| Doc / file | Role |
|------------|------|
| [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md) | Current topology, components, persistence keys |
| [apps/wayofpi-ui/src/utils/technicalLayoutStorage.ts](../apps/wayofpi-ui/src/utils/technicalLayoutStorage.ts) | `ToolDockLayout`, `DockStripEntry`, migrations |
| [PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md) | Product phases, production checklist |
