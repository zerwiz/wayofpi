# Pi for local AI — playground agent, memory, and Honcho

This note is **Pi-first**: how you run **Pi** (this repo’s coding agent), what it remembers **on its own**, how it **feeds Honcho**, and how that sits next to **Hermes**. For the **Hermes ↔ Honcho wire-up only** (no Pi), use **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** — the same role that document plays, but **Hermes-centric**.

For the **whole-stack** story (all three pieces, Honcho “why”), see **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)**.

**Editing:** Update **every** Honcho-related doc in one go when something changes—**[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)**.

**Official Honcho reference:** [docs.honcho.dev](https://docs.honcho.dev) · **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)**

| Layer | Where to read |
|-------|----------------|
| **Why / patterns / ideas (Pi side)** | *This page* |
| **Pi-native memory (JSONL, recap, /remember)** | **[AGENT_MEMORY.md](AGENT_MEMORY.md)** |
| **Extensions, shims, `settings.json`** | **[EXTENSIONS.md](EXTENSIONS.md)**, **[HOW_TO_USE_EXTENSIONS.md](HOW_TO_USE_EXTENSIONS.md)** |
| **Playground vs other repos (`pi-e`, env)** | **[PLAYGROUND.md](PLAYGROUND.md)** |
| **Honcho server + Pi → Honcho mirror** | **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §8–9 |
| **Hermes client + Honcho (not Pi internals)** | **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)**, **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** |
| **Stack-wide local AI (Pi + Hermes + Honcho)** | **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** |
| **Day-to-day runbook** | **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** |
| **`just` / global launchers** | Root **`justfile`**, **[`scripts/README.md`](../scripts/README.md)** |
| **Docs in Documents** | **`~/Documents/Honcho/`** (example) — symlinks **`PI_LOCAL_AI.md`**, **`HONCHO_INTEGRATION.md`**, **`HONCHO_CAPABILITIES.md`** → **`~/.pi/docs/`** |

---

## One-sentence picture (Pi)

- **Pi** is the **TUI coding agent** loaded from this playground: **models**, **tools**, **extensions** (under **`.pi/extensions/`** + **`settings.json`**), **session JSONL**, **session-memory** recap, **`/remember`**, etc. — see **[AGENT_MEMORY.md](AGENT_MEMORY.md)**.
- **Honcho** does **not** replace that. The **honcho-mirror** extension (default **on** here) **POSTs** finished user/assistant **turns** to your local Honcho API so **Hermes**, **search**, and **deriver** can share one **workspace** with your coding chats.
- **Hermes** is a **separate CLI**; inside Pi you can **`dispatch_agent` `hermes`** per **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** §7 — that runs **shell `hermes chat`**, not Pi’s own transcript merged into Hermes automatically.

---

## What Pi stores vs what Honcho gets

**Rule:** Pi **always** drives the model from **[AGENT_MEMORY.md](AGENT_MEMORY.md)** layers (JSONL, session-memory, `/remember`, …). **Honcho does not replace or bypass that** when connected — mirror is **write-only** to the API unless you build something else.

| Path | What it is |
|------|------------|
| **Session file / JSONL** | Pi’s **append-only** session log on disk — primary **per-chat** history. |
| **session-memory / compaction** | Re-injected **context** from that log + recap rules — **still active** with Honcho. |
| **honcho-mirror** | On **`message_end`**, text from the turn → Honcho **`/v3/.../messages`** (copy for Hermes / search / deriver). **No mirror** if **`PI_HONCHO_MIRROR=0`** / **`HONCHO_MIRROR_DISABLED=1`** or extension removed. |

If Honcho is **down**, Pi **keeps working**; you typically see **one** mirror warning.

---

## Pi + Hermes + Honcho — Pi’s column

| Piece | Pi’s relationship |
|-------|-------------------|
| **Pi** | **AGENT_MEMORY** + extensions + **`just pi`** / **`ppi-pi`** / **`pg-pi`**. |
| **Honcho** | **Mirror on by default**; align **`HONCHO_WORKSPACE`**, **`HONCHO_USER_PEER`**, **`HONCHO_AI_PEER`** with Hermes/`~/.honcho/config.json`. |
| **Hermes** | Optional **bridge agent** in **agent-team**; for **Hermes↔Honcho** config see **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**. |

---

## Minimal happy path (Pi developer)

1. **Playground** — from this repo: **`just pi`** / **`ppi-pi`** loads **`.env`** and **`pi`**; **`pi-e`** from your **app repo** sets **`PI_E_PROJECT_DIR`** (see **[PLAYGROUND.md](PLAYGROUND.md)**).
2. **Honcho API** — running or mirror warns once: **`cd ~/honcho-server && just honcho-up`** / **`hermes honcho server`**; **`HONCHO_BASE_URL`** if not `http://127.0.0.1:18000`.
3. **Reload** — after changing **`.pi/settings.json`** or env: **`/reload`** in Pi.
4. **Opt out of mirror** — **`PI_HONCHO_MIRROR=0`** in **`.env`** or drop **`.pi/extensions/honcho-mirror.ts`** from **`extensions[]`**.

---

## What you can use Pi + Honcho for

- **Coding sessions** that still **accumulate** in Honcho for **Hermes** or **API search** later.
- **One workspace** for “everything I told an AI today” across **Pi** and **Hermes** (with aligned peer ids).
- **Debugging mirror** — Swagger **`/docs`**, **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §8.

---

## Ideas (incremental)

1. **Separate workspaces** for **work** vs **play** — set **`HONCHO_WORKSPACE`** before **`just pi`** or in **`.env`**.
2. **`hermes` agent in team** — quick questions to Hermes from Pi without leaving TUI — **[AGENTS.md](AGENTS.md)**, **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** §7.
3. **`PI_HONCHO_MIRROR=0`** on air-gapped machines.
4. **Symlink** **`PI_LOCAL_AI.md`** into **`~/Documents/Honcho/`** like the Honcho guides — `ln -sfn ~/.pi/docs/PI_LOCAL_AI.md ~/Documents/Honcho/`.

---

## Example env (mirror + keys)

| Var | Role |
|-----|------|
| **`HONCHO_BASE_URL`** | e.g. `http://127.0.0.1:18000` |
| `HONCHO_WORKSPACE` | Match Hermes / **`~/.honcho/config.json`** when sharing memory |
| `PI_HONCHO_MIRROR` | **`0`** to disable mirror |
| `HONCHO_JWT` | If Honcho **`AUTH_USE_AUTH=true`** |

---

## Related

| Resource | Notes |
|----------|--------|
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | **Hermes-only** bridge — not Pi setup |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | Full **local AI** narrative (all three) |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Server + mirror + UI |
| **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** | Runbook (workspaces, **`/reload`**, Documents) |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Pi session memory |
| **[docs/README.md](README.md)** | Index |

*Last updated: 2026-03-27*
