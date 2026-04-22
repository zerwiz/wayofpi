# Honcho operations runbook

Practical habits for **Hermes**, **Pi**, and **Honcho** on your machine. This is the **expanded** checklist; context and mental model live in **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** and **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)**.

**Editing:** When you change this file, update the **whole Honcho doc set** — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)**.

---

## 0. Which commands belong to which system

**Pi** **`ppi` / `ppi-*`** are for the **playground coding agent** (extensions, **`pi`**, **`pi-e`**). **Honcho** stack and **`honcho-open-*`** live under **`~/honcho-server`** (`just`, **`scripts/install-honcho-bin.sh`**). **Hermes** use **`hermes …`** and **`hermes-honcho-*`** from Pi’s **`install-global`**. **System-parent first:** **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#command-namespaces-system-first)**.

---

## 1. Workspace per life area or per repo

Use **separate Honcho workspaces** when you switch mental context (e.g. **work-code** vs **home-lab** vs **one repo name**) so embeddings and peer cards do not blur together.

**Do this:**

- Set **`honcho.workspace`** (Hermes) and **`HONCHO_WORKSPACE`** (Pi mirror env) to the same id for that context.
- Keep **`~/.honcho/config.json`** `defaultWorkspace` aligned if you use the SDK path.
- When you jump projects, change workspace **before** the session that should stay isolated.

See **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** and **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §6 (ports) / §9 (mirror env).

---

## 2. Session anchors

End important Hermes (or mixed) sessions with something Honcho can **hang derivations on**: call **`honcho_conclude`** via tools, or ask explicitly for a short **“what to remember”** wrap-up.

**Why:** Background deriver / reasoning has cleaner hooks when the last messages are explicit summaries, not trailing tool noise.

---

## 3. Cost and churn

Honcho can run **LLM-heavy** background work (deriver, dreaming).

**Levers:**

- **`DREAM_ENABLED=false`** (or your stack’s equivalent) in **`~/honcho-server/.env`** when you want less autonomous consolidation.
- Run **API-only** (**`cd ~/honcho-server && just honcho-up-api`**) without **deriver** when you only need ingest + basic API — tradeoffs in **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §5.

---

## 4. Pi and Honcho

- After changing **`.env`**, **`HONCHO_*`**, or **`.pi/settings.json`**, run **`/reload`** in Pi so **honcho-mirror** picks up env and extension list.
- If Honcho uses **`AUTH_USE_AUTH=true`**, set **`HONCHO_JWT`** (or equivalent) for the mirror — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §9.

Pi **still** uses **[AGENT_MEMORY.md](AGENT_MEMORY.md)** for in-session context; the mirror is **additive** only.

---

## 5. Backups

If Honcho Postgres is your **long-term memory**, treat it like production data: **scheduled dumps** or volume snapshots, tested restore, and a retention policy you actually keep.

Operational detail is outside this playbook—match your usual DB backup practice.

---

## 6. Documents stash (`~/Documents/Honcho`)

Use a **personal** folder outside git (e.g. **`~/Documents/Honcho`**) for notes, printouts, and exports that do not belong in the repo.

**Symlinks** there point at **`~/.pi/docs/`** for **`HONCHO_INTEGRATION.md`**, **`HONCHO_CAPABILITIES.md`**, **`PI_LOCAL_AI.md`**, and **`HONCHO_OPERATIONS.md`** (this file)—**one canonical file** with the repo. See **`README.md`** in that folder.

---

## Open Honcho UIs from the terminal

All targets run from **`~/honcho-server`** (`just honcho-open-*`) or **`~/.local/bin`** after **`~/honcho-server/scripts/install-honcho-bin.sh`**. See **`~/honcho-server/scripts/README.md`**.

| Command (from `~/honcho-server`) | Opens |
|---------|--------|
| **`just honcho-open-docs`** | Local **Swagger** (`/docs`) |
| **`just honcho-open-redoc`** | Local **ReDoc** |
| **`just honcho-open-metrics`** | Local **`/metrics`** |
| **`just honcho-open-cloud`** | **[app.honcho.dev](https://app.honcho.dev/)** |
| **`just honcho-open-cloud-playground`** | API Playground |
| **`just honcho-open-cloud-explore`** | Explore |
| **`just honcho-open-docs-web`** | **[docs.honcho.dev](https://docs.honcho.dev)** |
| *…* | Additional cloud/dashboard pages — **`just --list`** in **`~/honcho-server`** |

Uses **`HONCHO_BASE_URL`** from **`~/honcho-server/.env`** when set. **Not** installed by Pi **`install-global`**.

---

## Related

| Doc | Role |
|-----|------|
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Server, §5 cost/deriver, §8 UI, §9 mirror |
| **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** | Official Honcho feature map |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | Stack-wide “why” and patterns |
| **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** | Pi-first: launchers, mirror, AGENT_MEMORY |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Hermes ↔ Honcho bridge |

*Last updated: 2026-03-27*
