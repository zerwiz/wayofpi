# Way of Pi — upstream sync (`wop-pi-upstream`)

Checks **Pi’s upstream GitHub** and **npm** for newer versions, and **optionally** pulls a **tagged archive** of **`badlogic/pi-mono`** into **`vendor/wop-upstream/`** with **path names that fit Way of Pi** (no ambiguous top-level `pi` product tree — see **[docs/WOP_NAMESPACE.md](../../docs/WOP_NAMESPACE.md)**).

## Behavior

| Command | What it does |
|---------|----------------|
| **`bun scripts/wop-pi-upstream.ts check`** | Queries GitHub tags for **`pi-mono`**, npm **`latest`** for **`@earendil-works/pi-coding-agent`**,
 compares to **`wop.upstream.lock.json`**, prints whether an update exists, **updates lock metadata** (last seen remote). **Does not** download or change vendor files. |
| **`sync … --dry-run`** | Shows where files would land under **`vendor/wop-upstream/pi-mono/<tag>/…`**. |
| **`sync … --apply`** | Downloads the tag tarball, copies configured subtrees, rewrites paths per **`config.json`**, updates **`pinnedRef`** in the lock. |

Updates are **user-driven**: nothing auto-applies. Run **`check`** on a schedule or from Diagnostics later; run **`sync --apply`** when you choose.

## Configuration

- **`scripts/wop-upstream/config.json`** — sources: `github-archive` (clone tarball + `includePaths` + `pathRewrites`) and `npm-registry` (inform only).
- **`wop.upstream.lock.json`** (repo root) — pinned refs and last-checked versions (safe to commit).

Optional: set **`GITHUB_TOKEN`** for a higher GitHub API rate limit.

## Examples

```bash
# From repo root
bun scripts/wop-pi-upstream.ts check
bun scripts/wop-pi-upstream.ts sync --source pi-mono --ref v0.66.1 --dry-run
bun scripts/wop-pi-upstream.ts sync --source pi-mono --ref v0.66.1 --apply
```

**just:** `just wop-upstream-check` · `just wop-upstream-sync ARGS…`

## Scope

- **In scope:** Reference **docs** (and other listed subtrees) from **`pi-mono`**, stored under **`vendor/wop-upstream/`**, gitignored by default.
- **Out of scope:** Replacing your installed **`pi`** binary or rewriting this repo’s **`extensions/`** — use upstream **`pi update`** / package manager when you want the CLI/SDK.

Canonical planning cross-link: **[docs/WOP_UPSTREAM_SYNC.md](../../docs/WOP_UPSTREAM_SYNC.md)**.
