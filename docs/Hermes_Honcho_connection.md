# Hermes + Honcho — quick bridge

**Hermes** (client) talks to **Honcho** (memory API) for **cross-session** recall. That is separate from **Pi**’s per-session JSONL and extensions in this repo.

Use the **split guides** for detail:

| Doc | Focus |
|-----|--------|
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | `~/.hermes/config.yaml`, toolsets, env vars, `hermes honcho *`, `just hermes-*` |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Docker stack, `~/.honcho/config.json`, API URL, deriver/dreaming, `just honcho-*` |

---

## Minimal happy path

1. **Start Honcho** — `just honcho-up` (from this repo) or `docker compose up -d database redis api deriver` in your **`honcho-server`** directory.
2. **Check API** — `just honcho-status` or `curl http://localhost:18000/`.
3. **Align configs** — Same URL in **`~/.honcho/config.json`** (`baseUrl`) and **`~/.hermes/config.yaml`** (`honcho.base_url`); `toolsets` includes **`honcho`**.
4. **Verify Hermes** — `just hermes-honcho-status`; if broken, `just hermes-honcho-setup`.

---

## Pi vs Hermes/Honcho

- **Pi** (this playground): coding agent, **[AGENT_MEMORY.md](AGENT_MEMORY.md)**.
- **Hermes + Honcho**: optional parallel stack for long-lived memory when using Hermes.

No automatic sync between Pi chats and Honcho unless you add it.

---

## Example values (customize)

These appeared in an earlier snapshot of this doc—**replace** with yours:

- Honcho API: `http://localhost:18000`
- Workspace: e.g. `zerwiz-test-space`
- User peer: e.g. `zerwiz`
- Session id: e.g. `hardware-check`

---

## Related

- **[docs/README.md](README.md)** — full doc index  
- Root **`justfile`** — `honcho-*`, `hermes-*` recipes  
