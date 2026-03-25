# Honcho integration (API, Docker, SDK)

**Honcho** is a **memory / context service** with an HTTP API. Clients such as **Hermes** call that API (via tools like `honcho_search`, `honcho_context`, …) to store and retrieve **cross-session** structured memory. This doc is about running and configuring **Honcho** itself—not Pi’s chat JSONL.

For **Hermes** client configuration (`config.yaml`, toolsets, `hermes honcho status`), see **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)**. For a short end-to-end view, see **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**.

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

This repo also exposes:

```bash
just honcho-up
```

### API-only (lighter; less background LLM / derivation)

```bash
just honcho-up-api
```

### Check API responds

```bash
just honcho-status
# or
curl -v --connect-timeout 2 http://localhost:18000/
```

### Stop

```bash
just honcho-down
```

---

## 5. Reducing background LLM usage (optional)

If Honcho triggers an LLM too often in the background:

1. Set **`DREAM_ENABLED=false`** in **`~/honcho-server/.env`** (or your stack’s env file—confirm key name for your Honcho version).
2. Run **`api`** without **`deriver`** if you only need basic API behavior (**`just honcho-up-api`**).

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

## 8. Related docs

| Doc | Topic |
|-----|--------|
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | Hermes `config.yaml`, toolsets, env, `just hermes-*` |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Combined quick reference |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Pi-native memory (separate from Honcho) |
