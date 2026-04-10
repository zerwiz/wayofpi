# Modular docks — rule → functional build plan

**Purpose:** Map **[`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc)** to **what must be rebuilt, extended, or newly built** so the **Way of Pi web UI** actually satisfies the rule—not only stylistically, but as a **data-driven, migratable dock system**.

**Pairs with:** **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** (phased checklists A–E) · **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** (today’s topology) · **`apps/wayofpi-ui/src/utils/technicalLayoutStorage.ts`**

**Last updated:** 2026-04-11

---

## 1. Definition of “functional” (per rule)

The rule is **satisfied for real** when:

1. **One shell** — Editor, horizontal tool/file bands, session/agent chat, and primary sidebar are **the same class of dock** in code and persistence, not unrelated layout branches.
2. **User-movable major regions** (product target): tool bands vs editor stack, **chat on left/right/bottom**, **primary sidebar left/right**, without rewriting `App.tsx` from scratch.
3. **N horizontal strips** (product target): not permanently capped at **one** visible band or **two** legacy keys; **DnD** moves tabs **between** peer strips with **one `DockStripEntry` model**.
4. **Appearances** (playground / `pi-e` / simple vs technical) apply **presets** (visibility + default tabs + geometry) on that shell—see **[WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)**.
5. **Persisted layout** is **versioned or migratable** JSON (`localStorage` and/or server); schema changes ship with **read-time migrations** and safe fallbacks.

Until (2)–(3) land, the rule’s **implementation discipline** still applies: **do not** add layout that **blocks** future moves (document **current limits** in **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** / code comments).

---

## 2. Rule clause → gap → work type

| Rule topic | Requirement (summary) | Today (snapshot) | **Rebuild** (structural) | **Add** (new capability) | **Extend** (incremental) | Phase ([WOP_MODULAR_DOCKS_PLAN](WOP_MODULAR_DOCKS_PLAN.md)) |
|------------|------------------------|------------------|---------------------------|----------------------------|---------------------------|----------------------------------------------------------------|
| **North star — peers** | All major regions are docks; no single sacred geometry | `App.tsx` owns a **fixed** flex tree (activity + left sidebar + main column + optional chat column/band) | **Extract** a layout root that can **reorder** children from data (precursor to D1–E1) | **Layout graph / region registry** type and renderer | Pass more props through extracted components | D2, E1 |
| **Appearances** | Presets only; no duplicate shell trees | **Simple** vs **technical** toggles subtrees; no `appearanceId` or dock preset JSON | Optional: **single** coordinator component with **preset** injection | **`appearanceId`**, default **`ToolDockLayout`** + **`TechnicalDockLayout`** slices, UI to pick preset | Wire **[WOP_EXTENSION_APPEARANCES_VIEWS_PLAN](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)** P1–P2 | P1 + [appearances plan](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md) |
| **Visual parity** | Same “tabs + body” pattern for editor vs strips | Editor vs **`DockableToolStrip`** chrome **differs** (separate header rows / styling) | Unify header **composition** (shared primitives) | Shared **tab row** / **title row** components | A1–A3 styling alignment | **Phase A** |
| **Movability — tool bands** | Bands can sit above/below editor (and more) | **Upper band removed** from UI; **`normalizeToolDockZone`** forces **`top` → `bottom`**; only **one** band rendered under editor stack | **Re-enable** second (or Nth) attachment point **from data**, not ad-hoc JSX | **Placement** field per strip instance; render loop over instances | Stop merging **`strips.top`** into **`bottom`** when C2 ships (with migration) | **Phase C** |
| **Movability — agent chat** | Left / right / bottom | **`ChatDockRegion`** = **`right` \| `bottom`** only | **`App.tsx` row** refactor so chat can mount **left** of editor | **`left`** in type, clamps, persistence read/write, resize splitters | Palette / View commands “Dock chat left” | **Phase D1–D2** |
| **Movability — primary sidebar** | Left or right + activity bar follow | Sidebar **always left**; width persisted only | **Mirror tree**: activity + sidebar order swap from **`sidebarEdge`** | Persist **`sidebarEdge`**, keyboard parity, splitter semantics | Activity bar **mirror** layout | **Phase D3** |
| **Multiplicity — N strips** | Arbitrary count; names don’t freeze “top/bottom only” | **`ToolDockLayout.strips`** is **`Record<"top"\|"bottom", …>`**; **top** cleared on read | **Replace** strip model with **`DockStripInstance[]`** + migration | **New strip**, **delete strip**, **move tab to other strip** targets | Keep **`DockStripEntry`** as tab payload (rule: single model) | **Phase C** |
| **Drag-and-drop** | Tabs move between **peer** strips; one payload model | Reorder **within** bottom strip; cross-slot drops **normalize to bottom** | DnD layer must target **strip id**, not hard-coded slot | **Drop targets** between strips; **payload** already **`DockStripEntry`** — preserve | Remove “always bottom” normalization when multi-strip exists | **Phase C4** + DnD updates |
| **Implementation discipline** | Versioned / migratable JSON | **`readToolDockLayout` / `writeToolDockLayout`** + **`foldTopStripIntoBottom`** migration path; **`readDockLayout`** for chat/sidebar | Add **`schemaVersion`** (or bump wrapper key) on next breaking change | **Migration functions** per version; tests or manual checklist | Document limits in **WOP_TECHNICAL_UI** after each ship | All phases + **WOP_TECHNICAL_UI** |
| **File in strip = peer surface** (parity goal) | Strip file body matches editor-class UX | **`StripFilePreview`** read-only fetch; lighter chrome | Optional swap to **`WorkspaceTextBuffer`** read-only | “Open in main editor”, dirty policy | B1–B3 | **Phase B** |
| **Preview & review chrome** | Modular **Preview** / **Markdown** / **Review Next File** + **Undo File** / **Keep File** (**Ctrl+Enter**) on editor or file dock | Not shipped | Shared **title/action row** component (with Phase A) | Queue model, preview renderer, keyboard scope | **`EditorPanel`** / dock frames | **Phase F** ([WOP_MODULAR_DOCKS_PLAN](WOP_MODULAR_DOCKS_PLAN.md)) |

**Legend:** **Rebuild** = change structure or data model so old assumptions no longer hold. **Add** = new types, UI, or APIs. **Extend** = improve existing paths without replacing the model.

---

## 3. What to rebuild (high impact)

These are **not** one-file tweaks; they unlock the rule.

1. **`App.tsx` technical layout tree** — Today it **embeds** chat and sidebar positions. For **left chat**, **right sidebar**, and **N strips**, the center row must become **data-driven** (which child goes where). **Plan:** extract **`TechnicalShellLayout`** (or similar) **before** stuffing more conditionals (see **WOP_MODULAR_DOCKS_PLAN** risks).

2. **`ToolDockLayout` strip storage** — **`strips.top` / `strips.bottom`** and **`foldTopStripIntoBottom`** are a **temporary** consolidation. **Functional** N-strip support **replaces** this with an **array** + migrations (**Phase C2**).

3. **`ChatDockRegion` and `TechnicalDockLayout`** — Extend union and **all** readers (clamp width/height, splitters, `ChatPanel` outer styles) for **`left`**; add **`sidebarEdge`** (or equivalent) for primary sidebar.

4. **DnD handlers** — Any code that **forces** target slot **`bottom`** must become **strip-id-aware** when multiple strips exist.

---

## 4. What to add (new pieces)

| Piece | Why (rule link) |
|-------|------------------|
| **`schemaVersion`** on persisted dock JSON | Implementation discipline — forward migrations |
| **`DockStripInstance`** (`id`, `placement` or `anchor`, `entries`, `activeIndex`, height/weight) | Multiplicity + movability |
| **Commands / palette** — “New horizontal strip”, “Flip sidebar”, “Dock chat left” | Movability without requiring DnD on day one |
| **Appearance preset bundle** — maps `appearanceId` → default dock + strip entries | Appearances section of rule |
| **Optional server-side layout** (per workspace) | Same discipline when multi-device or shared layout matters (**[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)**) |
| **Review queue state** (paths + cursor) + API/WebSocket hooks | **Review Next File** + agent-team alignment (**[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**) |
| **Preview / view-mode** state (e.g. Markdown rendered vs source) | **Preview** + **Markdown** toggle; per-path or session persistence |
| **Undo / Keep** actions + **Ctrl+Enter** / **Cmd+Enter** | **Phase F** decision bar; avoid shortcut clash with chat send (focus scope) |

---

## 5. What to extend (keep, but evolve)

| Piece | Extension |
|-------|-----------|
| **`DockStripEntry`** | Keep as **single** tab payload; add fields only if Pi/tool manifest needs them |
| **`UnifiedHorizontalDock` + `DockableToolStrip`** | Render **per** `DockStripInstance` instead of **one** global bottom host |
| **`readDockLayout` / `writeDockLayout`** | New keys: `sidebarEdge`, optional `layoutVersion` |
| **`ChatPanel`** | Already docked right/bottom; **left** docking + shared frame metrics |
| **`EditorPanel`** / **`DockRegionTitleBar`** | Host **Phase F** controls when file is previewable or review session active |
| **`WOP_TECHNICAL_UI.md`** | After each phase: update **Shipped / Next** and **current limitations** |

---

## 6. Suggested order (dependencies)

1. **Phase A** (parity) — Low risk; aligns UX with “equal docks” **before** big moves.  
2. **Extract layout shell** (no behavior change) — Reduces `App.tsx` risk **before** C/D.  
3. **Phase C** (N strips + persistence migration) — Unblocks real **cross-strip DnD** and removes **`top`→`bottom` fold** as the only story.  
4. **Phase D** (chat left + sidebar right) — Easier when the **row** is data-driven.  
5. **Phase B** (file strip ≈ editor) — Can parallelize after A if needed.  
6. **Phase E** (full grid) — Optional stretch.  
7. **Appearance presets** — Can start **after** `schemaVersion` + minimal preset object exists (even with 1–2 strips).  
8. **Phase F** (preview + review queue + Keep/Undo) — Can overlap **Phase A/B** once editor title row is unified; resolve **Ctrl+Enter** vs chat **Enter** by focus or mode.

---

## 7. Verification checklist (when claiming “rule-aligned”)

- [ ] New UI work does not **hard-code** a single order of editor / chat / strips without a **persisted** alternative.  
- [ ] Persisted JSON has a **version** or **migration** path documented.  
- [ ] **DnD** (where present) uses **`DockStripEntry`** only; no parallel ad-hoc tab type.  
- [ ] **WOP_TECHNICAL_UI.md** states **current** limits (e.g. “chat: right | bottom only”) until D lands.  
- [ ] **[CHANGELOG.md](../CHANGELOG.md)** notes user-visible dock changes.

---

## 8. Preview & review controls (product reference)

Planned **buttons and behavior** (editor / file-dock chrome, modular shell):

- **Preview** — Label for preview context.  
- **Markdown** — Toggle **rendered Markdown** vs **source** (extensible preview modes).  
- **Review Next File** — Advance **sequential review queue** (agent output, checklist, diffs).  
- **Undo File** — Revert / discard pending changes (secondary control).  
- **Keep File** — Accept / save (primary); **Ctrl+Enter** and **Cmd+Enter** on macOS.  

Full checklist: **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** **Phase F**.

---

## 9. Related documents

| Document | Role |
|----------|------|
| [`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc) | Source rule |
| [WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md) | Phases A–F checklists |
| [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md) | Current components and keys |
| [WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md) | Presets vs `pi-e` appearances |
| [WAY_OF_PI_OPEN_TODOS.md](WAY_OF_PI_OPEN_TODOS.md) | Cross-repo backlog pointers |
| [WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md) | Live agent streams; **Review Next File** queue integration later |
