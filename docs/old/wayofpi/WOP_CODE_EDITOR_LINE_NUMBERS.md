# Way of Pi — code editor line numbers and buffer layout

This document explains **why** the web shell keeps line numbers aligned with source text, **where** that behavior is implemented, and **how** to extend it without regressions. It complements **[WOP_GENERATED_FILES_AND_LINE_PARITY.md](WOP_GENERATED_FILES_AND_LINE_PARITY.md)** (doc ↔ code line citations) and **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** (shell components).

## 1. Why alignment matters

In a text editor, **each printed line number should correspond to one logical line** of the file (a segment between newline characters), and the **vertical rhythm** of the gutter column must match the **body** (textarea + syntax layer) so:

- **Status bar** line/column, **Problems**, **Go to Line**, and **stack traces** (`path:line`) point at what the user sees.
- **Soft wrapping** does not change logical line indices: one logical line can occupy several visual rows; the UI still shows **one number** for that logical line, with the number cell tall enough to cover all wrapped rows (see implementation below).
- Users trust the product the same way they trust **Notepad++**, **VS Code**, or **Cursor**: mismatched gutters read as “broken editor,” not cosmetic polish.

## 2. Conventional wisdom (Notepad++ and similar)

Notepad++ is built on **Scintilla**; its user manual and community threads repeat a few themes that apply to any line-numbered surface:

| Practice | Source / rationale |
|----------|-------------------|
| **Line number margin inherits the main editor font size** unless you intentionally override it. | [Notepad++ User Manual — Preferences → Margins / Line Number](https://npp-user-manual.org/docs/preferences/) — line number display is a **margin** tied to the edit control. |
| **Arbitrary font sizes on “Line number margin” or “Brace highlight” styles** can distort **line spacing** relative to the default style; clearing those sizes so they **inherit** fixes drift. | [Super User — How do I fix line spacing in Notepad++?](https://superuser.com/questions/886166/how-do-i-fix-line-spacing-in-notepad) |
| **Dynamic vs constant width** for the line-number column is a UX tradeoff (narrow until line 1000 vs stable width). | [notepad-plus-plus PR #8822](https://github.com/notepad-plus-plus/notepad-plus-plus/pull/8822) — margin width glitches when digit count changes; Way of Pi uses a **fixed Tailwind width** (`w-9`) plus `tabular-nums` for stable digits. |

Way of Pi is **not** Scintilla-based; we approximate the same expectations with **HTML/CSS** and a **textarea** over a **syntax-highlighted `<pre>`**.

## 3. Canonical implementation (`WorkspaceTextBuffer`)

**File:** `apps/wayofwork-ui/src/components/WorkspaceTextBuffer.tsx`

- **Logical lines** — `content.split("\n")`; the gutter renders **one label per logical line** (`1`, `2`, …).
- **Word wrap on** — `useLayoutEffect` measures each logical line’s **wrapped height** in a hidden div that copies **computed styles from the textarea** (`measureSoftWrappedLineHeightsPx`). Each gutter cell gets `minHeight` in pixels so the number stays vertically associated with that logical line’s wrapped block.
- **Word wrap off** — no per-line measurement; **typographic parity** between gutter and textarea is mandatory: same **font size**, **line height**, and **monospace** stack. If the gutter used `12px` and the body `13px`, numbers would **drift** one pixel at a time per line.
- **Syntax layer** — highlight.js can change **font weight** inside tokens; that can slightly change wrapping vs plain measurement. The buffer still uses **plain text** measurement keyed off the **textarea** (the source of truth for editing).

**Read-only buffers** — `readOnly` disables editing but still shows the gutter. **`fileKey`** for undo grouping is `path` whenever the buffer is loaded (`path && !loading && !error`), including read-only, so **switching files** clears the undo stack correctly.

## 4. Shared chrome constants

**File:** `apps/wayofwork-ui/src/constants/workspaceEditorChrome.ts`

Tailwind class strings for:

- `WOP_WORKSPACE_EDITOR_GUTTER_*` — width, `13px`, `leading-relaxed`, `tabular-nums`, muted color.
- `WOP_WORKSPACE_EDITOR_TEXTAREA_*` — `13px`, `leading-relaxed`, selection colors (dark vs light).
- `WOP_WORKSPACE_EDITOR_SCROLL_*` — scroll region wrapper.
- `WOP_WORKSPACE_EDITOR_FIND_BAR_INACTIVE` — find bar slot when the strip is unused.

**Rule for contributors:** any new **`WorkspaceTextBuffer`** call site should pass gutter + textarea classes from these constants (or extend the constants first), **never** a smaller gutter font than the body.

## 5. Where line numbers are used (inventory)

| Surface | File | Notes |
|---------|------|--------|
| Simple / Claw file panel | `SimpleFilePanel.tsx` | Primary workspace editing. |
| Technical `WorkspacePane` | `WorkspacePane.tsx` | Main cell editor (dark theme constants). |
| Horizontal dock file strip | `StripFilePreview.tsx` | Read-only; same gutter as main editor. |
| Host Doctor — live snapshot | `HostDoctorModal.tsx` | Read-only JSON; synthetic path `host-doctor-live-snapshot.json` for JSON highlighting. |
| Host Doctor — workspace file tabs | `HostDoctorWorkspaceFileEditor.tsx` | Editable JSON/YAML via `/api/file`. |
| My AI Brains (Pi provider JSON) | `ProviderConfigEditor.tsx` | Editable workspace JSON. |

**Intentionally without line gutters** (different UX — snippets, chat, logs, not full-file editing):

- Chat composer (`SimpleChatView`, `ChatPanel`), queue modal, Honcho/settings snippets, tool log excerpts, `ProblemsPanelBody` snippets, `FileChangeReview` hunks, license modal, etc.

If a **new** feature shows **multi-line editable workspace file text**, it should use **`WorkspaceTextBuffer`** (or explicitly document why not, in the same PR).

## 6. Related docs

| Doc | Topic |
|-----|--------|
| **[WOP_GENERATED_FILES_AND_LINE_PARITY.md](WOP_GENERATED_FILES_AND_LINE_PARITY.md)** | Doc ↔ code line citations; binary preview (no gutter). |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | `WorkspacePane`, grid, docks. |
| **`apps/wayofwork-ui/README.md`** | Dev entry and shell overview. |

## 7. External references (editor UX)

- [Notepad++ User Manual — Preferences](https://npp-user-manual.org/docs/preferences/) — Editing, margins, line number display.
- [Notepad++ Community — Line number margin font size](https://community.notepad-plus-plus.org/topic/21313/adjust-line-number-font-size) — inherit vs explicit size.
- [Super User — Notepad++ line spacing / Style Configurator](https://superuser.com/questions/886166/how-do-i-fix-line-spacing-in-notepad) — global styles vs line height.

Last updated: 2026-04-12.
