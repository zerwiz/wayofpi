# Way of Pi — generated files, indexing, and line-number parity

This document ties together how **Cursor**, **Zed**, and **GitHub** treat **generated / binary / large** files, and how **`wayofwork-ui`** should keep **editor line numbers** aligned with **documentation** references. For the technical shell layout, see **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**.

## 1. Cursor: AI context vs indexing

Cursor documents two ignore mechanisms (both use **`.gitignore`-style** patterns):

| File | Effect |
|------|--------|
| **`.cursorignore`** | **Best-effort** exclusion from **AI features** and **indexing** — use for secrets and anything the model must not see. |
| **`.cursorindexingignore`** | Excludes paths from **automatic indexing** only; files can still be attached manually. Use for **large generated** trees, **lockfiles**, **build output**, **binaries**. |

Official reference: [Ignore File \| Cursor Docs](https://cursor.com/docs/reference/ignore-file).

**Practical split (matches common community guidance):**

- **`.cursorignore`** — `.env`, keys, credentials, private config.
- **`.cursorindexingignore`** — `node_modules/`, `dist/`, `*.lock`, generated `*.json` / `*.md` that are **tool output**, large assets (`*.png`, etc.) when they are noise for code search.

Generated **source** you still edit (e.g. a committed `schema.d.ts`) usually belongs in **neither** file.

## 2. Zed and repo metadata

Zed itself is configured via **`settings.json`** (languages, LSP, **`file_types`** associations). It does not replace repo-level rules for **generated** artifacts.

**Git / GitHub** conventions still matter for **reviews** and **stats**:

| Mechanism | Purpose |
|-----------|---------|
| **`.gitattributes`** + `linguist-generated=true` | Marks generated paths so **GitHub** can **collapse diffs** in PRs (generated files still appear; diffs are de-emphasized). See [GitHub Linguist overrides](https://github.com/github/linguist/blob/master/docs/overrides.md). |
| **`linguist-language`** | Fixes language detection (example from Zed’s own repo: `*.json linguist-language=JSON-with-Comments` in [zed `.gitattributes`](https://github.com/zed-industries/zed/blob/main/.gitattributes) so GitHub does not flag JSON-with-comments as broken JSON). |

**VS Code / Cursor-style read-only generated files:** project **`.vscode/settings.json`** can set `files.readonlyInclude` for generated globs so editors warn before editing files that a generator will overwrite (see community write-ups such as [Mark Generated Files with gitattributes](https://brianschiller.com/blog/2025/10/14/read-only-and-generated-files/)).

## 3. Line-number parity (docs ↔ code)

When docs say “see line 42” or cite `path:line`:

1. **Prefer stable anchors** — symbol names, headings, or small code citations with **line ranges**, not a single fragile line.
2. **After edits** — re-check citations; CI or a doc lint can grep for `path:line` patterns.
3. **Generated files** — do not cite volatile line numbers inside generated output; cite the **generator** or **source** instead.

**`wayofwork-ui`** text editor shows **one line number per logical newline** in the buffer (`WorkspaceTextBuffer`), matching the file on disk for UTF-8 text. **Binary** and **raster images** use a **preview** path (no line gutter) so we do not pretend a PNG is text.

Implementation detail (gutter vs body font metrics, soft wrap measurement, and all call sites): **[WOP_CODE_EDITOR_LINE_NUMBERS.md](WOP_CODE_EDITOR_LINE_NUMBERS.md)**.

## 4. Behavior in `wayofwork-ui` (implementation)

| Case | Server `GET /api/file` | UI |
|------|-------------------------|-----|
| UTF-8 text | JSON `{ path, content }` | Line gutter + textarea buffer; wheel over the textarea scrolls the shared scroll region. |
| Known images (`png`, `jpeg`, …) | `{ encoding: "base64", mimeType, content }` | Scrollable **image** preview (`object-contain`, full image scrollable when larger than viewport). |
| Other binary (e.g. contains `NUL`) | `base64` + `application/octet-stream` | Read-only **binary** notice; no save. |

See **`apps/wayofwork-ui/README.md`** for the API table.

## 5. Related docs

| Doc | Topic |
|-----|--------|
| **[IDE_EXPLORER_PARITY.md](IDE_EXPLORER_PARITY.md)** | Explorer vs Cursor/Zed |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | Technical shell components |
