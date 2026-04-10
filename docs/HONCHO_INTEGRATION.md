# Honcho integration (API, Docker, SDK)

**Honcho** is a **memory / context service** with an HTTP API. Clients such as **Hermes** call that API (via tools like `honcho_search`, `honcho_context`, …) to store and retrieve **cross-session** structured memory. This doc is about running and configuring **Honcho** itself—not Pi’s chat JSONL.

For **Hermes** client configuration (`config.yaml`, toolsets, `hermes honcho status`), see **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)**. For a short end-to-end view, see **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**. For **why / what you can do with local AI + Pi + Hermes + Honcho** (recording, continuity, ideas), see **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)**. For **everything Honcho supports** (official docs digest), see **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)**. For a **day-to-day runbook** (workspaces, anchors, cost, backups, Documents), see **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)**.

---

## Keeping Honcho documentation in sync

**Rule:** If you **update one** Honcho-related doc in this repo, **check the others** in the same pass so behavior, links, env vars, and ports stay aligned.

| Doc | Purpose |
|-----|---------|
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | API, Docker, mirror, local UI vs cloud (this file) |
| **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** | Official Honcho feature map + external links |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | Stack-wide local AI (Pi + Hermes + Honcho) |
| **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** | Pi-first: AGENT_MEMORY, mirror, launchers |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Hermes ↔ Honcho bridge only |
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | Hermes config, toolsets, `hermes` agent in Pi |
| **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** | Runbook: workspaces, anchors, cost, Pi, backups, Documents |

**Also refresh:** **[docs/README.md](README.md)** (index row), **[REPO_INDEX.md](REPO_INDEX.md)**, root **[README.md](../README.md)** (doc table), **`~/Documents/Honcho/README.md`**, and any **symlinks** under **`~/Documents/Honcho/`** if filenames or canonical paths change.

The same rule applies when editing **`extensions/honcho-mirror.ts`** or **`.pi/settings.json`** mirror defaults—mirror **§9** here and **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** / **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)**.

---

## Command namespaces (system-first)

**Pi**, **Honcho**, and **Hermes** are **different systems**. Each has its **own** commands, configuration, and documentation. They can **compose** (Hermes calls Honcho’s HTTP API; Pi’s **honcho-mirror** posts turns into Honcho; aligned **`HONCHO_WORKSPACE`** keeps one store), but when you name tools or read help, put the **parent service first** (each service owns its commands; integration does not merge the namespaces):

| System | Owns (mental model) | Typical entrypoints |
|--------|---------------------|---------------------|
| **Pi** | Coding-agent TUI, extensions, in-session memory (**[AGENT_MEMORY.md](AGENT_MEMORY.md)**) | **`pi`**, **`ppi-pi`**, **`ppi ext-…`**, **`pi-e`** — see **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** |
| **Honcho** | Memory API, workspaces, Compose stack, browser UIs | **`~/honcho-server`** **`justfile`** + **`scripts/honcho-open-ui.sh`**; **`./scripts/install-honcho-bin.sh`** → **`~/.local/bin`** **`honcho-up`**, **`honcho-open-*`** — also **`~/.honcho/config.json`**, **`HONCHO_*`** |
| **Hermes** | CLI agent, toolsets, Honcho client wire-up | **`hermes …`**, **`hermes honcho status`**, **`hermes-honcho-status`** (installed from **this** playground via **`install-ppi-global`**) — **`~/.hermes/config.yaml`** |

**Pi** does **not** ship Honcho stack or UI scripts. Hermes bridge recipes stay in the Pi **`justfile`** only because they invoke the **`hermes`** binary, not the Honcho repo.

---

## 1. What Honcho provides

- **HTTP API** — Hermes (and other clients) connect to **`baseUrl`** (e.g. `http://localhost:18000`).
- **Workspace** — Logical partition for memory (e.g. a project or environment name).
- **Peers** — Identities such as **user** and **ai** (`userPeer`, `aiPeer` in SDK config) so Honcho can attribute data.
- **Sessions** — Optional mapping from paths or contexts to session ids for continuity.
- **Background processing** — A **deriver** worker (and related jobs) can build representations/summaries; “dreaming” can trigger extra LLM work unless disabled.

---

## 2. SDK config: `~/.honcho/config.json`

The Honcho SDK (used by integrations) commonly includes:

| Field | Role |
|-------|------|
| **`baseUrl`** | Honcho API root; **must** match the running container port. |
| **`defaultWorkspace`** | Default workspace id. |
| **`userPeer`** | Human/user peer id. |
| **`aiPeer`** | Assistant id (e.g. `hermes` when Hermes is the client). |
| **`sessions`** | Optional map (e.g. repo path → session id) for stable session labels. |

If **`baseUrl`** is set here, treat it as authoritative for SDK-based clients and **keep it in sync** with Hermes **`honcho.base_url`** in **`~/.hermes/config.yaml`**.

### Example (replace values)

```json
{
  "baseUrl": "http://localhost:18000",
  "defaultWorkspace": "your-workspace",
  "userPeer": "your-user-id",
  "aiPeer": "hermes",
  "sessions": {
    "/home/you/honcho-server": "your-session-id"
  }
}
```

---

## 3. Typical stack (“full Honcho application”)

For local development, people often run these services via Docker Compose (example layout: **`$HOME/honcho-server/docker-compose.yml`**):

| Service | Role |
|---------|------|
| **`database`** | Postgres (often with **pgvector**) for storage. |
| **`redis`** | Queues / caching (depends on Honcho version). |
| **`api`** | Honcho **HTTP API** — what Hermes calls at **`baseUrl`**. |
| **`deriver`** | Background worker for embeddings/summaries/representations. |

Without **`api`**, clients get **`connection refused`**. Without **`deriver`**, memory may update more slowly or lack derived fields until you add it back.

---

## 4. Start, stop, verify

### Start (API + worker)

```bash
cd ~/honcho-server
docker compose up -d database redis api deriver
```

From **`~/honcho-server`** (Honcho’s **own** **`justfile`**):

```bash
cd ~/honcho-server
just honcho-up
```

### API-only (lighter; less background LLM / derivation)

```bash
cd ~/honcho-server && just honcho-up-api
```

### Check API responds

```bash
cd ~/honcho-server && just honcho-status
# or
curl -v --connect-timeout 2 http://localhost:18000/
```

### Stop

```bash
cd ~/honcho-server && just honcho-down
```

---

## 5. Reducing background LLM usage (optional)

If Honcho triggers an LLM too often in the background:

1. Set **`DREAM_ENABLED=false`** in **`~/honcho-server/.env`** (or your stack’s env file—confirm key name for your Honcho version).
2. Run **`api`** without **`deriver`** if you only need basic API behavior (**`cd ~/honcho-server && just honcho-up-api`**).

Tradeoff: slower or thinner automatic memory enrichment.

---

## 6. Port changes

If you change the published API port in **`docker-compose.yml`**, update **all** of:

- **`~/.honcho/config.json`** → **`baseUrl`**
- **`~/.hermes/config.yaml`** → **`honcho.base_url`**
- Shell **`HONCHO_BASE_URL`** (if you use it)

Otherwise Hermes may still target the old port.

---

## 7. Troubleshooting

| Issue | What to check |
|-------|----------------|
| **`connection refused`** | `docker compose ps`; API healthy; firewall; correct host/port. |
| **SDK vs Hermes mismatch** | **`baseUrl`** equals **`honcho.base_url`**. |
| **Too many Honcho/LLM calls** | **`DREAM_ENABLED`**, whether **`deriver`** is running. |
| **Wrong session/workspace** | **`defaultWorkspace`**, **`sessions`** map, Hermes **`honcho.session_id`**. |

Hermes can often re-run **`hermes honcho setup`** after you fix URLs; from this repo: **`just hermes-honcho-setup`**.

---

## 8. UI — seeing data, derived memory, and “what Honcho came up with”

**What Honcho can do** (API areas, reasoning, integrations) is summarized from official docs in **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** — always verify at **[docs.honcho.dev](https://docs.honcho.dev)**.

The **open-source Honcho API** you run locally (e.g. **`~/honcho-server`**) is a **headless service**: **FastAPI** + background workers. There is **no** bundled first-party **dashboard** in that repo like **[app.honcho.dev](https://app.honcho.dev/)** Explore/Playground—rich views and operators’ tooling are documented for **Honcho Cloud**; locally, inspection is mostly **API + DB**.

### What you get out of the box (local API)

| URL (replace host/port) | What it is |
|---------------------------|------------|
| **`http://127.0.0.1:18000/docs`** | **Swagger UI** — full OpenAPI schema, “try it” for **`/v3/workspaces/.../sessions/.../messages`**, peers, conclusions, etc. Best **built-in** way to **inspect** and **experiment** with what’s stored. |
| **`http://127.0.0.1:18000/redoc`** | **ReDoc** — same API, alternate layout. |
| **`http://127.0.0.1:18000/metrics`** | **Prometheus** metrics (when enabled) — throughput/queues, **not** a human-readable memory browser. |

Use the interactive docs to **list sessions**, **fetch messages**, and call read endpoints that return **context** / **representations** (exact path names depend on your Honcho version—search the schema for *session*, *message*, *representation*, *peer*, *conclusion*).

**Open from the terminal:** use **`~/honcho-server`** — **`scripts/honcho-open-ui.sh`** and **`just honcho-open-*`**, or **`./scripts/install-honcho-bin.sh`** for **`~/.local/bin`** **`honcho-open-*`**. Reads **`~/honcho-server/.env`** for **`HONCHO_BASE_URL`**. **Pi does not ship these;** see **`~/honcho-server/scripts/README.md`**.

### Managed Honcho (Honcho Cloud — full UI)

**[app.honcho.dev](https://app.honcho.dev/)** is the **managed** product: orgs, billing, instance status, **API keys** (admin- or **workspace / peer / session**-scoped), **API Playground**, **Explore** (workspaces → peers, sessions), peer utilities (message search, **chat over representations**, session logs), session utilities (messages, search, **Get context**), **webhooks**, members, performance/metrics. See official **[Honcho Dashboard](https://docs.honcho.dev/v3/documentation/reference/platform)**. This does **not** ship alongside a typical **self-hosted** `docker compose` API-only stack; local devs use **`/docs`** (above) or build their own UI on **`/v3`**.

### Conversational “UI”: Hermes (and Pi)

- **Hermes** with the **`honcho`** toolset is the main **interactive** way to ask “what do we know?”, run **`honcho_search`** / **`honcho_context`** / **`honcho_profile`**, and see **conclusions** in the chat loop—not a separate browser pane.
- **Pi** does not embed a Honcho dashboard; **`honcho-mirror`** only **sends** turns into Honcho. Pi **still** uses **[AGENT_MEMORY.md](AGENT_MEMORY.md)** for in-session context — mirror is not a substitute. Inspect Honcho via **Swagger**, **Hermes**, or a custom tool.

### If you want a richer UI (directions, not one-click here)

These are **patterns** you can add; none are required for Hermes/Pi to work.

1. **Lean on `/docs`** — bookmark it; use **Authorize** if your API uses JWT; explore **POST list** endpoints with filters.
2. **Small custom dashboard** — static page or local app that calls **`/v3/...`** with your **Bearer** token; poll or refresh to show latest messages and queue status.
3. **Read-only SQL** — connect to Honcho’s Postgres with a desktop client **only** if you accept schema drift risk; prefer the API for stability.
4. **`/metrics` + Grafana** — observe deriver/queue health and “is work happening?”, not prose memory.
5. **Upstream / community** — watch [Honcho docs](https://docs.honcho.dev), Discord, and releases for an official explorer or reference UI for self-hosted.

**Summary:** For **self-hosted** Honcho, treat **`/docs`** as the default **UI** for inspection; use **Hermes** for **natural-language** inspection of what Honcho derived; use **Honcho Cloud** if you want the **dashboard** described in the platform doc; see **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** for the full capability map.

---

## 9. Pi → Honcho mirror (standard in this playground)

This repo **`honcho-mirror`** extension (**`extensions/honcho-mirror.ts`**, shim under **`.pi/extensions/`**) is listed in **`.pi/settings.json`**: completed Pi turns are **posted to Honcho by default** so local AI memory can include Pi work alongside Hermes.

**Pi session memory is unchanged.** With Honcho up or down, Pi still uses **JSONL**, **session-memory**, **session-saver**, **`/remember`**, and the rest of **[AGENT_MEMORY.md](AGENT_MEMORY.md)** as the **primary** context for the model. The mirror only **copies** finished turns to the Honcho API; it does **not** swap in Honcho context for Pi’s prompt unless you add a separate integration that reads Honcho back into Pi.

**What it does:** On each completed user or assistant turn (`message_end`), it ensures a workspace, two peers (`user` + assistant), and a Honcho session (derived from Pi’s session id), then **POSTs** the turn text to **`/v3/workspaces/…/sessions/…/messages`** — the same API Hermes uses — with metadata `source: "pi"`, `cwd`, and model id.

**Requirements / opt-out**

1. Run Honcho API (e.g. `hermes honcho server` or `cd ~/honcho-server && just honcho-up` with DB reachable from the host — fix **`DB_CONNECTION_URI`** if the hostname `database` only resolves inside Compose).
2. To **disable** mirroring: **`PI_HONCHO_MIRROR=0`** (or `false` / `no` / `off`) or **`HONCHO_MIRROR_DISABLED=1`**. Remove **`.pi/extensions/honcho-mirror.ts`** from **`settings.json`** if you do not want the extension loaded at all.
3. If Honcho is down, Pi continues normally; you get a **one-time** warning in the TUI. **`/reload`** after env or Honcho URL changes.

**Configuration (optional)**

| Env | Role |
|-----|------|
| **`PI_HONCHO_MIRROR`** | Set **`0`** / **`false`** / **`no`** / **`off`** to disable mirroring (default: mirror **on**) |
| **`HONCHO_MIRROR_DISABLED`** | **`1`** / **`true`** / **`yes`** — alternate opt-out |
| **`HONCHO_BASE_URL`** | API root (default `http://127.0.0.1:18000`) |
| **`HONCHO_WORKSPACE`** | Workspace id (else **`defaultWorkspace`** from **`~/.honcho/config.json`**, else `pi-mirror`) |
| **`HONCHO_USER_PEER`** / **`HONCHO_AI_PEER`** | Peer ids for user vs assistant turns (else config file, else `user` / `pi`) |
| **`HONCHO_JWT`** | Bearer token when **`AUTH_USE_AUTH=true`** on Honcho |

Assistant/user content is flattened from Pi message parts; very long text is truncated (~24k chars) to stay under Honcho limits.

---

## 10. Related docs

| Doc | Topic |
|-----|--------|
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | Hermes `config.yaml`, toolsets, env, `just hermes-*` |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Hermes ↔ Honcho bridge only |
| **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** | Pi-first: memory, mirror, launchers |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Pi-native memory (separate from Honcho) |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | Stack-wide local AI patterns |
| **[HONCHO_CAPABILITIES.md](HONCHO_CAPABILITIES.md)** | Official-feature summary: model, API groups, cloud UI, SDKs, integrations |
| **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** | Runbook: workspaces, anchors, cost, backups, Documents |
| §**9** above | Pi **honcho-mirror** extension |
