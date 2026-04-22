# Hermes + Honcho — quick bridge

**Hermes** (client) talks to **Honcho** (memory API) for **cross-session** recall. **This page is only that Hermes ↔ Honcho link** — not Pi configuration.

**Editing:** Honcho guides are **linked**—if you change this file, update the **rest of the set** too (**[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)**).

Use the **split guides** for detail:

| Doc | Focus |
|-----|--------|
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | `~/.hermes/config.yaml`, toolsets, env vars, `hermes honcho *`, `just hermes-*` |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Docker stack, `~/.honcho/config.json`, API URL, deriver/dreaming, `just honcho-*` |

---

## Minimal happy path

1. **Start Honcho** — `cd ~/honcho-server && just honcho-up` or `docker compose up -d database redis api deriver` in **`~/honcho-server`**.
2. **Check API** — `cd ~/honcho-server && just honcho-status` or `curl http://localhost:18000/`.
3. **Align configs** — Same URL in **`~/.honcho/config.json`** (`baseUrl`) and **`~/.hermes/config.yaml`** (`honcho.base_url`); `toolsets` includes **`honcho`**.
4. **Verify Hermes** — `just hermes-honcho-status`; if broken, `just hermes-honcho-setup`.

---

## Out of scope: Pi

**Pi** does not use *this* Hermes YAML bridge. Pi-first local AI (memory, **honcho-mirror**, launchers) is **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)**. Pi-native memory alone: **[AGENT_MEMORY.md](AGENT_MEMORY.md)**. Honcho **server + mirror**: **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)**. If **Hermes** and **Pi** share one Honcho, keep **`honcho.base_url`** / **`baseUrl`** and **workspace / peers** aligned across **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)**, **`~/.honcho/config.json`**, and Pi **`HONCHO_*`** env.

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
- **Pi agent `hermes`** — **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** §7 (**`dispatch_agent`**, **`hermes chat -q`**)
