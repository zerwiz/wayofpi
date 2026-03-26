# Hermes integration (with Honcho memory)

**Hermes** is a separate agent/CLI stack from **Pi**. This doc covers how **Hermes** is configured to use **Honcho** as a **cross-session memory** backend (profiles, search, context, conclusions)—so Hermes can recall structured notes across runs. It does **not** replace Pi’s per-chat **JSONL** transcript; it complements it when you work in Hermes.

For the **Honcho server** (Docker, API, SDK config), see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)**. For a one-page overview of both sides, see **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**.

---

## 1. What Hermes gains from Honcho

With the **`honcho`** toolset enabled, Hermes can call Honcho-backed tools (names may match your Hermes build), for example:

| Tool (typical) | Purpose |
|----------------|---------|
| `honcho_profile` | User/session profile material |
| `honcho_search` | Semantic search over stored memory |
| `honcho_context` | Pull relevant context for the current task |
| `honcho_conclude` | Record summaries / wrap-up |

If Honcho is down, Hermes often reports something like **`Honcho init failed: Connection refused`**.

---

## 2. Configuration: `~/.hermes/config.yaml`

Hermes reads project/user config from **`~/.hermes/`**. The pieces that matter for Honcho usually include:

| Key / section | Role |
|---------------|------|
| **`model.*`** | LLM provider Hermes uses for its own reasoning (independent of Honcho’s internal LLM usage). |
| **`honcho.enabled`** | Turn Honcho integration on or off. |
| **`honcho.base_url`** | Honcho HTTP API base (must match the running API, e.g. `http://localhost:18000`). |
| **`honcho.workspace`** | Honcho workspace id (isolates memory namespaces). |
| **`honcho.user_peer`** | Stable id for the human/user peer in Honcho. |
| **`honcho.session_id`** | Session id Hermes uses when talking to Honcho (may tie to a project or machine). |
| **`toolsets`** | Must include **`honcho`** (and whatever else you use, e.g. **`hermes-cli`**). |

**Precedence note:** If **`~/.honcho/config.json`** sets **`baseUrl`**, it can override or shadow what Hermes YAML says for the SDK path Hermes uses—keep them aligned. See **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §2.

### Example snippet (adjust all values)

```yaml
honcho:
  enabled: true
  base_url: http://localhost:18000
  workspace: your-workspace
  user_peer: your-user-id
  session_id: your-session-id

toolsets: [honcho, hermes-cli]
```

---

## 3. Shell environment (optional but common)

Your shell may export variables consumed by Hermes or helper scripts, for example:

| Variable | Typical use |
|----------|-------------|
| `HONCHO_BASE_URL` | Match Honcho API URL if tools read env. |
| `HONCHO_WORKSPACE` | Default workspace name. |
| `HONCHO_PEER_ID` | User peer id. |
| `HERMES_TOOL_PARSER` | Parser mode (e.g. `hermes`)—set per your install docs. |

After changing **`~/.bashrc`** (or similar), reload the shell or re-source the file.

---

## 4. Commands and `just` recipes (this repo)

From the playground **`justfile`** (paths assume Hermes venv under **`~/.hermes/hermes-agent/venv/`**—edit if yours differs):

| Recipe | What it does |
|--------|----------------|
| **`just hermes-status`** | `hermes status` |
| **`just hermes-honcho-status`** | `hermes honcho status` — good sanity check that Hermes sees Honcho |
| **`just hermes-honcho-setup`** | `hermes honcho setup` — repair / re-init path when connection or config drift |

Start Honcho before expecting these to succeed: **`just honcho-up`** or **`just honcho-up-api`**.

---

## 5. Relationship to Pi (this repository)

| System | Memory style |
|--------|----------------|
| **Pi** | Session **JSONL**, optional **session-memory** / **session-saver** / **`/remember`**—see **[AGENT_MEMORY.md](AGENT_MEMORY.md)**. |
| **Hermes + Honcho** | **Cross-session** structured memory via Honcho API. |

You can use both: Pi for coding-agent sessions in this repo, Hermes for flows where you want Honcho-backed recall. There is no automatic sync between Pi transcripts and Honcho unless you build one.

---

## 6. Troubleshooting (Hermes-side)

| Symptom | Check |
|---------|--------|
| `Connection refused` | Honcho API not running — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §4–5. |
| Wrong workspace / peer | `honcho.*` keys in **`config.yaml`** vs **`~/.honcho/config.json`**. |
| Toolset missing | `toolsets` includes **`honcho`**. |
| Stale URL | Port changed in Docker — update YAML, SDK JSON, and env vars together. |

---

## 7. Pi agent `hermes` (talk to Hermes from Pi)

This repo defines a Pi specialist **`hermes`** ([`.pi/agents/hermes.md`](../.pi/agents/hermes.md)) for **agent-team** / **`dispatch_agent`**. It runs the **Hermes CLI** in **non-interactive** mode:

```bash
"$HOME/.hermes/hermes-agent/venv/bin/hermes" chat -q 'Your message' -Q
```

Hermes prints its **reply on stdout** (and often a **`session_id:`** line). The Pi agent relays that output to the user. For a **continued** Hermes thread, pass **`--resume SESSION_ID`** from the prior run.

Teams: **`hermes`** (solo), and **`hermes`** is on team **`info`** in **`.pi/agents/teams.yaml`**. Team **`full`** uses **`ralph`** instead of **`hermes`**; switch to **`hermes`** or **`info`** to **`dispatch_agent` `hermes`**, or add **`hermes`** to the active roster. Hermes must be installed and configured separately; this does not embed Hermes inside Pi.

---

## 8. Related docs

| Doc | Topic |
|-----|--------|
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Server, Docker, SDK config, dreaming/deriver |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Short combined quick reference |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Pi memory layers |
| **[AGENTS.md](AGENTS.md)** | Agent inventory including **`hermes`** |
