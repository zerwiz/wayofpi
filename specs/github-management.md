## GitHub Management Extension (ghm) — Spec Snapshot

**Status:** draft / partial implementation  
**Entrypoints:** `extensions/github-management.ts`, `.pi/extensions/github-management.ts`, `.pi/tools/github-management.js`

### Purpose

- Provide a unified **GitHub management helper** for Pi sessions.
- Wrap common `git`/`gh` flows with a friendlier interface (`/ghm` command, `ghm_exec` tool, future standalone `ghm` CLI).

### Current scope

- **Inside Pi**
  - `/ghm help` — show high-level help text.
  - `/ghm status` — run `git status -sb` in the current `ctx.cwd` and surface the result via `ctx.ui.notify`.
  - `ghm_exec` tool — run the same commands from tools (arguments are forwarded to the same dispatcher).
- **Shell shim**
  - `.pi/tools/github-management.js` — prints usage and, if `pi` is on `PATH`, attempts to spawn `pi -e extensions/github-management.ts --cmd "<args>"`.

### Planned scope (from PLAN-20260326-gh-management-tool.md)

- Rich command set: `login`, `logout`, `repo list`, `clone`, `push`, `pull`, `status`, `branch *`, `pr *`, `fork`, `help`.
- Retry-aware handlers with structured error types and exit codes.
- Shared output formatting (`chalk`, `ora`, table helpers).
- Authentication helpers built on top of `gh auth status` / `gh auth token` and an `Octokit` client.
- Test suite under `test/` plus documentation and troubleshooting notes.

### Usage

- **From Pi chat:** run `/ghm help` or `/ghm status`.
- **From tools:** invoke `ghm_exec` with `{ "args": "status" }`.
- **From shell (experimental):**
  - Ensure `pi` is installed and on `PATH`.
  - Run `node .pi/tools/github-management.js --help`.

