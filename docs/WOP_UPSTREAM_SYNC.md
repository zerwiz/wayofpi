# Way of Pi — upstream Pi sync (GitHub + user-controlled apply)

**Goal:** Know when **upstream Pi** (GitHub **`badlogic/pi-mono`**, npm **`@mariozechner/pi-coding-agent`**) has newer releases, and **pull documentation mirrors** into Way of Pi–namespaced paths **only when the operator chooses**.

## Principles

1. **Check vs apply** — `check` is read-only (plus lock metadata). `sync --apply` writes **`vendor/wop-upstream/`**.
2. **No silent upgrades** — Nothing replaces **`pi`** on disk or mutates **`extensions/`** automatically.
3. **Naming** — Mirrored paths use **`vendor/wop-upstream/`** and **`upstream-coding-agent-docs`** (etc.) per **`scripts/wop-upstream/config.json`**, aligned with **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** (avoid confusing *our* tree with upstream **`pi`**).

## Implementation

| Artifact | Role |
|----------|------|
| **`scripts/wop-pi-upstream.ts`** | CLI: `check`, `sync` |
| **`scripts/wop-upstream/config.json`** | Upstream sources, `includePaths`, `pathRewrites` |
| **`wop.upstream.lock.json`** | Pinned tag, last remote seen, npm last version |
| **`just wop-upstream-check` / `just wop-upstream-sync`** | Thin wrappers |

**Future:** Way of Pi **Diagnostics** UI can call `check` and show “update available”; **Apply** remains explicit.

## Related

- **[scripts/wop-upstream/README.md](../scripts/wop-upstream/README.md)** — usage and examples  
- **[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)** — product context  
