# Scripts (local dev helpers)

| File | Purpose |
|------|--------|
| **`honcho-open-ui.sh`** | Open local **`/docs`**, **`/redoc`**, **`/metrics`**, and **[app.honcho.dev](https://app.honcho.dev)** URLs (uses **`HONCHO_BASE_URL`** from repo **`.env`** when set). |
| **`install-honcho-bin.sh`** | Writes **`honcho-up`**, **`honcho-down`**, **`honcho-status`**, **`honcho-open-*`** into **`${USER_HOME}/.local/bin`** (paths pinned to this clone). |

From the **honcho-server** repo root:

```bash
./scripts/install-honcho-bin.sh
# or: just install-bin
```

Stack and openers are also **`just`** recipes in the repo **`justfile`**.
