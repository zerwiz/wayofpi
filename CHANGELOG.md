# Changelog

Notable changes to this Pi extension playground are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Earlier work is not backfilled; entries start from when this file was added.

## [Unreleased]

### Added

- `.cursor/rules/pi-extensions.mdc` — File-scoped rule when editing `extensions/` or `.pi/extensions/`.
- `.cursor/rules/pi-extensions-context.mdc` — Always-on pointer to `docs/EXTENSIONS.md`.
- `docs/EXTENSIONS.md` — Extension guide (upstream + local shim pattern + integration checklist).
- README link under Extension Author Reference.
- Root `CHANGELOG.md` for tracking future playground changes.
- `extensions/session-memory.ts` and `just ext-session-memory`: reinject recent USER/ASSISTANT turns into the system prompt; `/sessionmemory` on|off|status.
- README row for **session-memory**.
- **Auto-load:** `.pi/extensions/` shims + `extensions` list in `.pi/settings.json` so Pi discovers this playground without `pi -e` (repo-root `extensions/` alone is not scanned by Pi).

### Fixed

- `.pi/extensions/`: replace symlinks + `themeMap.ts` with **re-export shims** only. Pi loads every `*.ts` in that folder as an extension; `themeMap.ts` is a helper and must not live there (was error: “does not export a valid factory function”).
- Bowser skill path: `.pi/skills/bowser/SKILL.md` (Pi requires parent directory to match skill `name`).

### Changed

- `extension-picker`: single slash command **`/extensions`** only; removed `/ext`, `/extention`, `/extentions` duplicates (prefix `/ex` still narrows the menu).
- `session-memory` extension: read current chat’s persisted JSONL via `getSessionFile()`, inject path/id and dialogue recap; compaction/branch summaries included; explicit rules so replies like `1` select the prior numbered option.

## [2026-03-25]

### Added

- `extensions/extension-picker.ts`: slash commands `/extensions` and `/extentions` to list `pi.extensions` from agent `settings.json` packages (git and npm) plus project `extensions/*.ts`; writes launch hint to `~/.pi/storage/last-extension.json`. Commands `/remember` and `/memory` plus one-time-per-session injection from `~/.pi/storage/agent-memory.md`.
- `just ext-extension-picker` recipe and `just all` entry for the picker stacked with `minimal`.
- README table row for **extension-picker**.
