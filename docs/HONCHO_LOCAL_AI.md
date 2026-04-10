# Honcho for local AI — observing, recording, and reuse

This note is for **zerwiz’s local stack**: **Hermes** (CLI agent), **Pi** (coding agent in this playground), and **Honcho** (memory API). The goal is **continuity** across sessions—who you are, what you’re building, and what you agreed—without treating each chat window as a silo.

**Official product docs:** [docs.honcho.dev](https://docs.honcho.dev) · digest of API/feature areas: **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)**

**Editing:** Any change here should be reflected across **all Honcho docs** in this repo—see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)**.

| Layer | Where to read |
|-------|----------------|
| **Why / patterns / ideas (stack-wide)** | *This page* |
| **Pi-first** (TUI, AGENT_MEMORY, mirror, `ppi`) | **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** — companion to **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** |
| **Hermes ↔ Honcho (client bridge only)** | **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** — YAML, URLs, `hermes honcho *`, host vs Docker DB |
| **Run Honcho, Pi mirror, local UI** | **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** — Compose, `baseUrl`, **`/docs`** vs **Honcho Cloud** dashboard (§8), mirror **on by default** (§9), `PI_HONCHO_MIRROR=0` to opt out |
| **Day-to-day runbook** | **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** — workspaces, anchors, cost, backups, Documents |
| **Hermes config detail** | **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** |
| **What Honcho can do (v3 API, integrations)** | **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** |
| **Pi memory (always — with or without Honcho)** | **[AGENT_MEMORY.md](AGENT_MEMORY.md)** — primary; Honcho mirror is additive |
| **Docs in your Documents folder** | **`/home/zerwiz/Documents/Honcho/`** — symlinks **`HONCHO_INTEGRATION.md`** & **`HONCHO_CAPABILITIES.md`** → **`~/.pi/docs/`**; see **`README.md`** there |

---

## One-sentence picture

- **Hermes** — CLI agent that can call tools; with the **`honcho`** toolset it reads/writes **cross-session** memory on the API.
- **Honcho** — **Durable memory**: workspaces, peers, sessions, messages; background **reasoning** builds **representations** you can search and pack into **context** (see [architecture](https://docs.honcho.dev/v3/documentation/core-concepts/architecture)).
- **Pi** (this playground) — **Primary memory** stays **[AGENT_MEMORY.md](AGENT_MEMORY.md)** (JSONL, session-memory, `/remember`, …) **whether or not Honcho runs**. **honcho-mirror** (default **on**) only **posts** completed turns to Honcho — it does **not** replace Pi’s built-in session stack. Same **`HONCHO_WORKSPACE`** / peers as Hermes → one Honcho store; **`PI_HONCHO_MIRROR=0`** or remove the extension to stop mirroring — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §9.

---

## What Honcho is “seeing” when things are wired

With Hermes and **`honcho`** against a live API:

1. **Messages** land as Honcho **messages** (peers in a **workspace**).
2. Workers **derive** summaries / **conclusions** / **representation** updates (async).
3. Later turns use tools like **`honcho_search`**, **`honcho_context`**, **`honcho_profile`**, **`honcho_conclude`** (names may match your Hermes build).

**Scope:** Whatever is **written to the API** (Hermes tools, Pi mirror, scripts, uploads) can be stored and retrieved—not a screen recorder; **conversation- and ingestion-centric**.

**Pi** mirrors **user + assistant** turns here by default; empty or failed Honcho calls do not block Pi (one warning TUI).

---

## Pi + Hermes + Honcho — how they fit

| Piece | Role | Memory shape |
|-------|------|----------------|
| **Hermes** | Local CLI; tools + optional **Honcho** toolset | Session + **Honcho** when enabled |
| **Honcho** | HTTP API + DB; derivation / search | Workspaces, peers, sessions, messages, representations |
| **Pi** | TUI coding agent | **[AGENT_MEMORY](AGENT_MEMORY.md)** always (primary); **Honcho** via mirror (default **on**, **additive** copy only) |

**One “thread”:** stable **workspace** + peer ids across Hermes and Pi mirror env.

**Chat + coding in one store:** Hermes + Pi with aligned **`HONCHO_WORKSPACE`**, **`HONCHO_USER_PEER`**, **`HONCHO_AI_PEER`** / Hermes YAML; or **`honcho_conclude`** / paste when mirror is off.

---

## Minimal happy path (local)

1. **Start API** — `cd ~/honcho-server && just honcho-up`, `docker compose …` there, or **`hermes honcho server`** on the host (fix **`DB_CONNECTION_URI`** if `database` only resolves inside Docker).
2. **Probe** — `curl -sS http://127.0.0.1:18000/` (your port).
3. **Align** — **`~/.honcho/config.json`** `baseUrl` = **`~/.hermes/config.yaml`** `honcho.base_url`; **`toolsets`** include **`honcho`**.
4. **Check Hermes** — `hermes honcho status` / **`just hermes-honcho-setup`** if needed.

Hermes-only wire-up: **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**.

---

## What you can use this for

- **Cross-session recall** without dumping whole logs.
- **Profile / project facts** that update as you talk.
- **Semantic search** over past decisions (tools or API).
- **One backend, several clients** — Hermes, Pi mirror, future scripts (**`/v3/...`**).
- **Inspecting output** — **Self-hosted:** Swagger **`/docs`**, Hermes tools, optional custom UI — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §8. **Honcho Cloud:** **[app.honcho.dev](https://app.honcho.dev/)** dashboard (Explore, Playground, peers/sessions)— **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** managed section.

---

## Ideas and setups (incremental)

Expanded step-by-step: **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** (workspaces, session anchors, cost/deriver, Pi **`/reload`** + **`HONCHO_JWT`**, Postgres backups, **`~/Documents/Honcho`** symlinks).

---

## Example values (tune to your machine)

| Item | Example |
|------|---------|
| API | `http://127.0.0.1:18000` |
| Workspace | `zerwiz-local-ai` |
| User peer | `zerwiz` |
| AI peers | e.g. `hermes` vs `pi` if you split attribution |
| Session | Hermes label vs Pi-derived session id in mirror |

---

## Related

| Resource | Notes |
|----------|--------|
| **[docs/README.md](README.md)** | Full playground index |
| **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** | Pi-first companion to **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Server, mirror, troubleshooting |
| **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** | Runbook — workspaces, anchors, cost, Pi, backups, Documents |
| **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** | Official capability map + links |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Hermes ↔ Honcho bridge |
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | Hermes YAML, toolsets |
| **`/home/zerwiz/Documents/Honcho/`** | Local folder + symlinks — see **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** §6 |
| **Pi playground** / **`install-ppi-global`** | **`ppi-*`**, **`pg-pi`**, **`hermes-honcho-*`** |
| **`~/honcho-server`** | **`just honcho-*`**, **`scripts/install-honcho-bin.sh`** → **`honcho-up`**, **`honcho-open-*`** on **`PATH`** — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#command-namespaces-system-first)** |
| Hermes repo (local) | `~/.hermes/hermes-agent/docs/honcho-integration-spec.md` |

URL or port change → sync **`~/.honcho/config.json`**, **`~/.hermes/config.yaml`**, and Pi **`HONCHO_BASE_URL`**.

*Last updated: 2026-03-27*
