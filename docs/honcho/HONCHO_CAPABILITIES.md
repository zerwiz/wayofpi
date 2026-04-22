# Honcho — capabilities (from official docs)

This page **summarizes what Honcho can do** as described in **[Honcho’s documentation](https://docs.honcho.dev)** ([full index](https://docs.honcho.dev/llms.txt), [OpenAPI v3](https://docs.honcho.dev/v3/openapi.json)). Use it as a **map**; details, schemas, and behavior can change—always confirm on the official site.

*Last synced with public docs: 2026-03-27.*

**This playground:** **`honcho-up`** / **`honcho-open-*`** ship from **`~/honcho-server`**, not **`.pi`**. See **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#command-namespaces-system-first)**.

---

## Core idea

Honcho is **memory infrastructure** that **stores** interaction data and **reasons** over it in the background to build **representations** of **peers** (users, agents, or other entities). It is positioned as going beyond naive RAG: **logical reasoning** over messages yields **conclusions** and **retrievable context** for agents. See [Overview](https://docs.honcho.dev/v3/documentation/introduction/overview), [Architecture](https://docs.honcho.dev/v3/documentation/core-concepts/architecture), and [Reasoning](https://docs.honcho.dev/v3/documentation/core-concepts/reasoning).

---

## Data model (primitives)

| Primitive | Role |
|-----------|------|
| **Workspace** | Top-level isolation (apps, envs, tenants); auth and defaults often scoped here. |
| **Peer** | Any entity that persists over time (user, agent, profile, etc.); **representations** center on peers. |
| **Session** | Thread / temporal boundary; multiple peers; holds **messages**. |
| **Message** | Unit of content (chat, events, **file-derived** text, etc.); triggers background reasoning. |

Peers and sessions are **many-to-many**. See [Architecture & intuition](https://docs.honcho.dev/v3/documentation/core-concepts/architecture).

---

## How processing works (high level)

- Messages are written (e.g. to Postgres); **reasoning tasks** go to **queues**; **workers** produce **summaries**, **conclusions**, and **representation** updates; **vector** storage supports retrieval.
- **Context** for LLMs can be assembled via **Get context** / session APIs (token budgets, summaries + recent messages, etc.). See [Get context](https://docs.honcho.dev/v3/documentation/features/get-context), [Storing data](https://docs.honcho.dev/v3/documentation/features/storing-data), [Summarizer](https://docs.honcho.dev/v3/documentation/features/advanced/summarizer).
- **Dreaming** = optional autonomous consolidation over time ([Dreaming](https://docs.honcho.dev/v3/documentation/features/advanced/dreaming)); **queue status** exposes processing state ([Queue status](https://docs.honcho.dev/v3/documentation/features/advanced/queue-status)).

---

## API surface (v3) — grouped

Derived from the [API reference index](https://docs.honcho.dev/llms.txt). Exact paths and auth: OpenAPI + your server version.

### Workspaces

- Get or create, list, update, **delete** (async destructive wipe of workspace data).
- **Search** messages across a workspace.
- **Queue status** for processing.
- **Schedule dream** (manual dream task).

### Peers

- Get or create, list, update.
- **Get representation** (curated subset of peer knowledge).
- **Get peer context** (representation + **peer card**).
- **Get / set peer card** (stable biographical-style facts — [Peer card](https://docs.honcho.dev/v3/documentation/features/advanced/peer-card)).
- **Search** peer messages.
- **Chat** — natural-language Q&A over peer representations (**agentic** search/reasoning).
- **Sessions for peer** (list).

### Sessions

- Get or create, list, update, **delete**, **clone** (optionally up to a message).
- **Session peers** — add, remove, set; **per-peer session config**.
- **Get session context** — LLM-ready context with optional token limit.
- **Session summaries**.
- **Search** session.

### Messages

- **Batch create** (e.g. up to 100 per call in many deployments).
- Get / list / update metadata.
- **Create from file upload** (PDFs, text, JSON → chunked messages — [File uploads](https://docs.honcho.dev/v3/documentation/features/advanced/file-uploads)).

### Conclusions

- Create, list, **semantic query**, delete.

### Keys

- **Create key** (JWT / API access patterns depend on deployment).

### Webhooks

- Register endpoints, list, delete, **test emit** — event-driven integrations.

---

## Product / developer features (documentation topics)

- **[Chat endpoint](https://docs.honcho.dev/v3/documentation/features/chat)** — reasoning about users/peers in natural language.
- **[Search](https://docs.honcho.dev/v3/documentation/features/advanced/search)** — workspace, session, peer scopes; filters ([Using filters](https://docs.honcho.dev/v3/documentation/features/advanced/using-filters)).
- **[Representation scopes](https://docs.honcho.dev/v3/documentation/features/advanced/representation-scopes)** — advanced representation query configuration.
- **[Reasoning configuration](https://docs.honcho.dev/v3/documentation/features/advanced/reasoning-configuration)** — tune reasoning depth, perspective, cost/latency tradeoffs.
- **[Streaming responses](https://docs.honcho.dev/v3/documentation/features/advanced/streaming-response)** (SDK-side patterns).
- **Design patterns** — [Design patterns](https://docs.honcho.dev/v3/documentation/core-concepts/design-patterns).
- **Self-hosting** — [Local environment / self-hosting](https://docs.honcho.dev/v3/contributing/self-hosting); configuration — [Configuration guide](https://docs.honcho.dev/v3/contributing/configuration).

---

## Managed platform (“Honcho Cloud”) UI

Official **[Honcho Dashboard](https://docs.honcho.dev/v3/documentation/reference/platform)** describes **[app.honcho.dev](https://app.honcho.dev/)**: orgs, billing/instance status, **API keys** (including scoped keys), **API Playground**, **Explore** (workspaces, peers, sessions), peer/session utilities (search, chat over representations, session logs, get context), **webhooks**, **members**, performance/metrics. This is the **full** operator UI for **hosted** Honcho—not automatically present on a bare self-hosted API (see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §8 for local `/docs` vs cloud).

---

## SDKs and specs

- **Python** — `honcho-ai` (PyPI); **TypeScript** — `@honcho-ai/sdk` (npm). See [SDK reference](https://docs.honcho.dev/v3/documentation/reference/sdk).
- **OpenAPI** — [v3/openapi.json](https://docs.honcho.dev/v3/openapi.json).

---

## Integration guides (examples in official docs)

Non-exhaustive list from [Guides overview](https://docs.honcho.dev/v3/guides/overview) / `llms.txt`:

- **[Hermes + Honcho](https://docs.honcho.dev/v3/guides/integrations/hermes)**
- **MCP** ([Claude Desktop](https://docs.honcho.dev/v3/guides/integrations/mcp)), **LangGraph**, **CrewAI**, **Claude Code**, **OpenClaw**, **n8n**, **Agent Zero**
- **Discord**, **Telegram**, **Gmail**, **Granola**, **Reachy Mini** (voice)
- **Migrating from Mem0**

---

## Evals and research

- [evals.honcho.dev](https://evals.honcho.dev/)
- Benchmarking write-up linked from the [overview](https://docs.honcho.dev/v3/documentation/introduction/overview) (Plastic Labs blog / social announcements).

---

## Related in this repo

| Doc | Use |
|-----|-----|
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Run API locally, Docker, Pi mirror, `/docs`, troubleshooting |
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | Hermes client + Honcho toolset |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | Local AI patterns (Pi + Hermes + Honcho) |
| **[HONCHO_OPERATIONS.md](HONCHO_OPERATIONS.md)** | Practical runbook (workspaces, backups, Documents) |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Minimal Hermes ↔ Honcho bridge |

---

## Keeping docs in sync (this playground)

If you change **this file** or any other **Honcho guide** in **`~/.pi/docs/`**, update the **whole set** together—see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)**.

---

## Disclaimer

Capabilities depend on **Honcho version** (open-source server vs managed), **feature flags**, and **configuration**. This file is a **condensed index**, not a substitute for **security review**, **SLAs**, or **your** `openapi.json` on a running instance.
