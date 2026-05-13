# Modular dock shell — plan and TODO

**Purpose:** Single backlog for making the **technical UI** a **modular, movable dock system**: equal chrome between the editor and **other docks** (same **tabs + body** model), drag-and-drop layout, optional **N** horizontal dock instances, **agent** and **primary sidebar** as repositionable docks—not fixed geometry forever.

**Cursor rule (implementation discipline):** [`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc) (applies when editing `apps/wayofwork-ui/**`).

**Rule → what to build:** [WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md) (rebuild / add / extend traceability).

**Architecture context:** [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md) · **Living gaps:** [WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)

---

## Principles (product + engineering)

1. **Peers, not tiers** — Regions that are “tabs + body” (main editor column, horizontal strips, future panes) should share the **same structural chrome** where it makes sense, so nothing feels like a second-class “panel” under a “real” editor unless we document an intentional exception.
2. **Everything is a dock (target)** — **Editor stack**, **horizontal docks** (mixed tabs: files + panels + tools), **agent chat**, **primary sidebar** (Explorer rail) are all **dock nodes** in a layout graph the user can rearrange. There is **not** a product taxonomy of separate “tool dock” vs “file dock” **kinds**—only **one** dock primitive, **many** instances, movable.
3. **Data-driven layout** — Persist **region tree + sizes + tab lists**; avoid JSX trees that hard-code one order with no migration path.
4. **DnD is the interaction model** — Move **tabs** between strips; move **strips** or **major regions** when the layout engine supports it.
5. **No artificial cap on strip count** — **`TechnicalDockLayout`** still carries **`horizontalToolDockHeightsPx.top` / `.bottom`** keys; the **main column** is **`WorkspacePane`** (one stack per cell). The model should generalize to **many** horizontal dock instances and a **pane graph** without renaming the world again.
6. **Splitter pointer parity** — **`DockSplitHandle`** `onDelta`: **+dx** = pointer **right**, **+dy** = **down**. Resize persisted sizes so the **grabbed edge follows the mouse** (see **`docs/WOP_TECHNICAL_UI.md`** § Splitter pointer parity). Avoid inverted vertical/horizontal drag unless documented.
7. **Terminology** — In plans and UX copy, say **dock** / **docks**, not **tool dock** or other **special-case dock names**. Implementation may still use legacy type names (`ToolDockLayout`, …) until migrations land; see **`.cursor/rules/wop-ui-modular-docks.mdc`**.

---

## Zed reference model (center panes vs docks)

Zed (reference UX for “one modular surface”):

| Zed concept | Behavior (see docs) |
|-------------|---------------------|
| **Center / workspace panes** | A **pane** holds a **tab stack**. Tabs can be **files** or a **center terminal**—same chrome (**+**, split, zoom). Command palette: **`workspace: new center terminal`**. Splits: e.g. **`pane::SplitRight`**, **`pane::SplitDown`**. |
| **Docks** (left / right / bottom) | **Project panel**, **terminal panel**, etc. Since the [new panel system](https://zed.dev/blog/new-panel-system), the **terminal panel** dock is **terminals only**; mixed file+terminal tabs belong in **center** panes. Toggles: `workspace::ToggleLeftDock`, … — [Terminal docs](https://zed.dev/docs/terminal.html) (*Terminal Panel vs Center Terminal*). |

**Way of Pi today (gap vs Zed):**

| Zed target | WOP shipped | Remaining gap |
|------------|-------------|----------------|
| One **tab stack** per center pane for **files ∪ tools** | **`WorkspacePane`** + **`PanelDockLayout.v3`** (`tabs` + `activeIndex`) per cell | **Done** for a **single stack**; multi-cell = fixed **grid**, not free splits. |
| Recursive **pane tree** (split grid) | **`TechnicalWorkspaceGrid`** ≤ **3×4**; persistence **`workspaceGrid.v1`**; **resize** **`rowWeights`/`colWeights`**; **edge-grow** + **cross-cell tab** moves (interim) | No **arbitrary** DAG; **Phase E**/**Z** for a full graph + split-from-anywhere. |
| **Zoom / split** on the **same** tab bar as files | Same tab row for files + tools; Zed-style **within-row** DnD hint | **Split** / **zoom** actions vs Zed’s full **`pane::`** model still shallow. |

**Cursor rule:** **`.cursor/rules/wop-ui-modular-docks.mdc`** § *North star* states this explicitly so agents do not confuse **interim** layout with **final** modular design.

---

## Current state (snapshot)

| Area | Shipped | Gaps |
|------|---------|------|
| **Center workspace** | **`WorkspacePane`**: mixed **file + tool** tabs; **`applyPanelTabMove`** within row; **`ToolPanelBody`** / **`WorkspaceTextBuffer`**. | **Phase Z** for **`PaneItem`** graph; full **pane DAG**. |
| **Multi-pane** | **`TechnicalWorkspaceGrid`** (≤ **3×4**); **`workspaceGridStorage`**; flex + **`DockSplitHandle`** between cells. | Fixed **cols×rows** only; **Phase E** for graph + arbitrary split drops. |
| **Legacy strips** | **`PanelDockBand`**, **`StripFilePreview`** still in tree for auxiliary use; **`horizontalToolDockHeightsPx`** in **`dockLayout`**. | **N** strips as first-class **`DockStripInstance[]`** — **Phase C**. |
| **DnD** | Reorder **within** each **`WorkspacePane`** tab row; **cross-cell** **tab** moves + **tab-bar insert**; **files/panes** via **`WorkspaceCellDropSurface`** + edge-grow. | **Explorer file** path to specific **insert index** on tab bar (parity polish); strips vs center **unified** move list — **Phase Z**. |
| **Agent (`ChatPanel`)** | Dock **right** or **bottom**; resize; hide/show; persisted in **`TechnicalDockLayout`**. | **Not** dockable **left**; not a generic node in a grid. |
| **Primary sidebar** | Left only; width persisted; Ctrl/Cmd+B toggle. | **Not** movable to **right**; activity bar not mirrored. |
| **Preview & review chrome** | **`WorkspacePane`:** Markdown **Source / Preview**, **Review Next File** (stub), **Undo File** / **Keep File**, **Ctrl+Enter** — see **CHANGELOG** / **Phase F** partial ship. | **Review queue** wiring; optional parity on **`StripFilePreview`** / **`PanelDockBand`** file tabs — **Phase F**. |

---

## Phases (ordered plan)

Use these as checklists; adjust order when dependencies demand it.

### Phase A — Visual parity (“equal docks”)

Goal: User-visible **alignment** between regions that are **tabs + body** (historically: editor vs horizontal strips). **Today** the **main column** is a single **`WorkspacePane`** stack—Phase A items below are **mostly superseded** for that column; they still apply where **`PanelDockBand`** / legacy strips remain.

- [x] **A1** — *(Historical)* Unified header / tab row family — satisfied for **`WorkspacePane`**; legacy **`UnifiedHorizontalDock`** path removed from **main** column.
- [x] **A2** — *(Historical)* Match **`WorkspacePane`** tab bar styling — **shipped** for center stack.
- [ ] **A3** — For **file** tabs in a strip, add a **breadcrumb / path** sub-row or inline path when the active entry is `file` (mirror editor affordances at minimal cost).
- [ ] **A4** — Document screenshots or short “before/after” in this file when A1–A3 land.

### Phase B — File tab in a dock ≈ editor-class surface (optional but high value)

Goal: A **file** tab inside a **horizontal dock** feels like the **same document surface** as the main editor (read-only OK)—not a different “file dock” product, the same dock with a file body.

- [ ] **B1** — Replace or wrap **`StripFilePreview`** with **`WorkspaceTextBuffer`** **`readOnly`** + same line-number gutter option as **`WorkspacePane`** where feasible.
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

**Partial (shipped):** **`TechnicalWorkspaceGrid`** — up to **3 columns × 4 rows**, each cell = **`WorkspacePane`** + own **`PanelDockLayout`** + (when grid > **1×1**) own **`useFileEditor`**. Layout uses **nested flex** + **`DockSplitHandle`** (**`rowWeights` / `colWeights`** in **`wayofpi.technical.workspaceGrid.v1`**). **View → Editor Layout** presets (**`EditorLayoutPreset`** `workspace_grid_*`). **`WorkspaceCellDropSurface`** per cell: **edge/center snap** overlay; **`growWorkspaceGridForEdgeDrop`** on drop when the implied neighbor was missing (**1×1**, **N×1**, **1×N** outer edges). **Cross-cell** **panel tab** moves (surface + **tab bar** with insert order). Not a **layout graph** yet — see **`docs/WOP_TECHNICAL_UI.md`**, **`apps/wayofwork-ui/src/utils/workspaceGridStorage.ts`**.

- [ ] **E1** — Spec **layout graph** (nodes: region type, children, sizes); version field for migrations.
- [ ] **E2** — **Split drop targets** / DnD that **subdivides** cells beyond the current **edge-grow** rules; generalize beyond fixed **cols×rows**.
- [ ] **E3** — Per-workspace layout override (optional path in server or `localStorage` keyed by workspace id).

### Phase Z — Zed-class workspace pane (target architecture)

Goal: **One** modular **center** surface: **pane tree** + **tab stacks** of **`PaneItem`** (`file` \| `terminal` \| `output` \| …)—not ad-hoc **`App.tsx`** forks. Aligns with Zed **center panes** (mixed tabs, split, **`workspace: new center terminal`**) vs **docked panels** ([Terminal docs](https://zed.dev/docs/terminal.html), [panel system blog](https://zed.dev/blog/new-panel-system)).

- [ ] **Z1** — **`PaneItem`** + **`WorkspacePaneNode`** types (leaf = tab stack, branch = split h/v); persistence + migration from **`selectedPath`** + **`PanelDockLayout`** / **`workspaceGrid.v1`** for the **center** region first. Interim type **`WorkspaceDockBandState`** (`technicalLayoutStorage.ts`) describes **N** identical tab stacks for migration.
- [ ] **Z2** — **Single** tab-row + body host for all **center** items; today **`WorkspacePane`** is that host per cell — evolve toward a **tree** of hosts instead of a fixed **cols×rows** grid only.
- [ ] **Z3** — **DnD**: move **any** center **item** tab between **any** center pane stack; unify payload with strip DnD where possible.
- [ ] **Z4** — **Split** / **new tab** (+) on the **same** chrome for every center item type (files adjacent to terminal tabs, per Zed screenshot).
- [ ] **Z5** — Product copy + settings: distinguish **center pane** stack vs **docked** horizontal strips (Zed: center terminal vs terminal **panel** dock).

### Phase F — Preview & review workflow (editor / dock parity)

Goal: Match **IDE-style** controls for **preview modes**, **queued file review** (agent / team flows), and **accept vs revert** on edited files—implemented as **modular chrome** on the **editor stack** or on a **dock** showing a **file** tab (same “tabs + title + actions” family as Phase A), not a one-off page.

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
4. Keep **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** in sync (short pointer + link here).

---

## Related

| Doc / file | Role |
|------------|------|
| [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md) | Current topology, components, persistence keys |
| [apps/wayofwork-ui/src/utils/technicalLayoutStorage.ts](../apps/wayofwork-ui/src/utils/technicalLayoutStorage.ts) | `ToolDockLayout`, `DockStripEntry`, migrations |
| [WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md) | Product phases, production checklist |
