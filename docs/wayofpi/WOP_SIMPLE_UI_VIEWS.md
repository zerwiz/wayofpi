# Simple UI — workspace views catalog

The **View → Workspace views** and **View → Appearance** entries in **Simple** mode are driven by a small JSON file in your workspace so you can treat the list as **living documentation**: reorder items, add Pi extension paths, or link to internal docs.

## Catalog file

- **Path:** `.wayofpi/ui-views.json` (under the workspace root Way of Pi is using)
- If the file is **missing**, the server ships a **default** list (Simple tabs, a few `extensions/*.ts` shortcuts, and doc links).
- If the file is **present but invalid**, the server falls back to defaults and may surface a parse warning in the menu.

## Create the file from the template

1. In the app: **View → Appearance → Create views catalog file…**  
   Or `POST /api/ui/views/seed` on the Way of Pi server (writes the file only if it does not exist).

2. Edit `.wayofpi/ui-views.json` in the embedded editor (or any editor).

3. Reload the page or reopen **View → Workspace views** to pick up changes (no server restart required).

## JSON shape

```json
{
  "version": 1,
  "entries": [
    {
      "id": "tab-chat",
      "label": "Chat",
      "kind": "simpleTab",
      "target": "chat",
      "hint": "optional subtitle in menu"
    },
    {
      "id": "open-readme",
      "label": "README",
      "kind": "openFile",
      "target": "README.md"
    },
    {
      "id": "tech-explorer",
      "label": "Technical: Explorer",
      "kind": "technicalActivity",
      "target": "explorer"
    }
  ]
}
```

### `kind` values

| `kind` | `target` |
|--------|----------|
| `simpleTab` | One of: `chat`, `team`, `models`, `projects`, `settings` |
| `openFile` | Workspace-relative path (no `..`, no leading `/`) |
| `technicalActivity` | One of: `explorer`, `search`, `scm`, `extensions`, `planning`, `settings` |

Use **`openFile`** rows to point at **extension sources** (e.g. `extensions/agent-team.ts`) or internal docs so the menu doubles as a navigable map of your Pi setup.

## API

- `GET /api/ui/views` — merged catalog and `source` (`default` | `workspace`).
- `POST /api/ui/views/seed` — write the default template to `.wayofpi/ui-views.json` if missing.

## Related

- [WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md) — broader strategy for tools, commands, and extensions in the web UI.
