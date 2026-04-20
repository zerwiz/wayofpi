## GitHub Management Extension (ghm) — Spec Snapshot

**Status:** PR workflow MVP (**typed tools** + **`/ghm`**)  
**Entrypoints:** `extensions/github-management.ts`, `.pi/extensions/github-management.ts`, `scripts/github-management-cli.js`

### Purpose

- **Inside Pi:** typed **`github_pr_*`** tools for list/view/diff/checks/review and **inline comments** (including GitHub **suggested edits** via a **`suggestion`-labeled markdown code fence in **`body`**).
- **Slash:** **`/ghm`** — `help`, `status`, `pr-list`, `pr-view [N]`, `pr-diff [--stat|--name-only|--patch] [N]`, `pr-checks [N]`.
- **Legacy:** **`ghm_exec`** forwards to the same subcommands and returns **stdout as tool result** (not notify-only).

### Requirements

- [GitHub CLI](https://cli.github.com/) **`gh`** on `PATH`, authenticated (`gh auth login`).

### Inline / suggestion comments

- **`github_pr_review_inline`** → `gh api repos/{owner}/{repo}/pulls/{n}/comments` with JSON **`commit_id`**, **`path`**, **`line`**, optional **`side`** (`RIGHT` default).
- **`owner/repo`** from `gh repo view --json nameWithOwner` (session **`cwd`** must be the git repo).

### Shell shim

- `scripts/github-management-cli.js` — help + optional spawn of `pi -e …` (experimental).

### Planned / not in scope

- Full product parity with IDE-native PR UI (inline diff widgets) — terminal remains the surface; tools wrap **`gh`** / **REST**.
- Rich standalone **`ghm` Node CLI** without Pi (see installer stub **`scripts/ghm-install.js`**).
