# Way of Pi — workspace agents in the web UI (plan)

**Goal:** **Simple** and **technical** **`wayofwork-ui`** surfaces should use the same **workspace agent** definitions as Pi (**`.pi/agents/*.md`**, **`teams.yaml`**, Pi-style scan roots) so the user can **pick a persona** reliably, understand **teams**, and (longer term) align **organizer / dispatcher** behavior with **`agent-team`** — without confusing **browser chat** with **full Pi tool runtime**.

**Problem seen in UI (screenshots):** Red banners like **`404: {"error":"Not found"}`** on **My AI Team** and **AI Brains** when **`GET /api/agents`** or **`GET /api/llm/models`** fail. That is almost always **no API server** in front of the SPA (static hosting or wrong port), not “no agents on disk.”

---

## Current implementation (baseline)

| Layer | Responsibility |
|--------|------------------|
| **`apps/wayofwork-ui/server/agents.ts`** | **`loadWorkspaceAgents()`** — recursive `*.md` under Pi scan roots; first `name` wins; loads **`.pi/agents/teams.yaml`** from the **primary** workspace folder. |
| **`GET /api/agents`** | JSON: **`agents`**, **`teams`**, **`teamsPath`**. |
| **`useAgents()`** | Client hook; **shared** by simple + technical flows. |
| **WebSocket** (`server/index.ts`) | User selects **`name`** → **`getAgentBodyByName`** → **`cachedAgentBody`** + **`applyLeadSystem`**. |
| **`session-prompts.ts`** | Composes **env prompt** + **agent body** + optional **Plan mode** (`planner.md` or fallback). Appends **web session** note: **no Pi tools** in browser from frontmatter `tools:`. |

**Implication:** The web UI already behaves like **`system-select`** (one merged system prompt per chat), **not** like **`agent-team`** `dispatch_agent` (separate Pi processes, tool allowlists, grid). The plan below keeps that distinction explicit while improving parity and UX.

---

## Phase A — Reliability and operator clarity (fixes 404 class errors)

1. **Document the runtime contract** in **`apps/wayofwork-ui/README.md`** (and root README if needed): the SPA expects the **Bun server** for **`/api/*`** and **`/ws`**; **`just` / dev** uses Vite proxy to **`127.0.0.1:3333`** (see **`vite.config.ts`**).
2. **User-visible diagnostics:** On **`/api/agents`** or **`/api/llm/models`** failure, show a short message: e.g. “API unreachable — run the Way of Pi server” and link **`GET /api/health`** when useful (optional **health poll** on app mount).
3. **Multi-root workspaces:** Confirm **`loadWorkspaceAgents`** labeling and **`teams.yaml`** path match product expectations when multiple folders are open (already partially handled; verify edge cases).

**Exit criteria:** Opening the app via documented dev/prod paths yields **non-404** APIs when the server is up; static-only hosting is explained, not mistaken for a code bug.

---

## Phase B — Simple ↔ technical parity

1. **Single catalog path:** Any new agent UI (badges, filters, search) must consume **`useAgents()`** / **`AgentsResponse`**, not duplicate fetch logic.
2. **Workspace agent dropdown:** **Simple** (`SimpleChatView`) and **technical** (`ChatPanel`) stay aligned: same options, same disabled rules during **`streaming`**, same **`agentsLoading`** behavior.
3. **My AI Team:** Keep copy consistent with **[docs/AGENTS.md](AGENTS.md)** scan order; surface **`teams.yaml`** path and roster names; optional deep link to open an agent file in the editor (already partially present).

**Exit criteria:** Switching **UI mode** does not change which agents appear or which **`name`** is sent to the server.

---

## Phase C — Teams and “organizer” semantics (product, still single-connection)

**Intent:** Users think in **teams** (dispatcher + specialists) per **[docs/AGENT_TEAMS.md](AGENT_TEAMS.md)**. The web stack should **surface** that model even before true dispatch exists.

1. **Team-aware UX (non-breaking):** Optional **filter or subsection** in **My AI Team**: group agents by **`teams.yaml`** membership; show unlisted agents under **“Unassigned”** or **“All agents”**.
2. **Preset picker (optional):** Choosing a **team preset** might set a **session hint** (stored client-side or in server state): e.g. preferred specialist order or a short system addendum (“you are coordinating team **full**”). Must not claim **`dispatch_agent`** runs in the browser.
3. **Organizer agent content:** If **`agents/default.md`** (or a dedicated **dispatcher** agent) describes delegating to named specialists, the **workspace agent** dropdown can select that agent so the **model** reads the same instructions as in Pi — still subject to **Phase A** web note about tools.

**Exit criteria:** Users see **teams** and **rosters** consistently; organizer-style **markdown** is selectable like any other agent.

---

## Phase D — True `dispatch_agent` / multi-agent parity (major)

**Intent:** Match **Python/Pi `agent-team`**: organizer spawns **separate** specialist sessions with **tool allowlists** and live streams.

1. **Protocol:** Implement or adopt **`docs/WOP_MULTI_AGENT_WEBSOCKET.md`** — multiplex **`agentId`**, tool events, per-agent transcripts.
2. **Runtime:** Bridge to **Pi CLI** (or embedded runtime) from the server with strict **workspace root** and **WOP_*** isolation — see **`docs/WOP_STANDALONE_SYSTEM_PLAN.md`** for naming and security boundaries.
3. **UI:** Technical **Team Pulse** / grid + simple **Focus** flows; **workspace agent** might become **“session lead”** while dispatches create **child** cards.

**Exit criteria:** A dispatch to **`scout`** (example) runs in an environment where **`read`/`grep`** (per agent frontmatter) is actually available, not only described in the prompt.

---

## Phase E — Docs and rules (maintenance)

- **Cursor rule:** **`.cursor/rules/wop-ui-workspace-agents.mdc`** — keep in sync when changing **`server/agents.ts`**, **`session-prompts.ts`**, or agent-related UI.
- **Cross-links:** **[docs/AGENTS.md](AGENTS.md)**, **[docs/AGENT_TEAMS.md](AGENT_TEAMS.md)**, **[docs/WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**, **[docs/WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**.

---

## Open questions

1. Should **teams.yaml** drive a **default** workspace agent when the user picks a **team** (client-only) vs always starting at **Orchestrator** (no `.md` agent)?
2. For **Phase D**, is the supported bridge **spawn Pi per specialist** only, or a **long-lived Pi multiplexer**?
3. Do we expose **skills** (`skills:` in frontmatter) in the web catalog read-only, or hide until a skill runner exists?

---

## Related

| Doc | Role |
|-----|------|
| **[AGENTS.md](AGENTS.md)** | Agent file format and inventory |
| **[AGENT_TEAMS.md](AGENT_TEAMS.md)** | `teams.yaml`, `dispatch_agent`, presets |
| **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** | Future multi-agent event contract |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | Technical shell components |
| **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** | Web + headless Pi product boundaries |

**Implementation entrypoints:** `apps/wayofwork-ui/server/agents.ts`, `apps/wayofwork-ui/server/index.ts`, `apps/wayofwork-ui/server/session-prompts.ts`, `apps/wayofwork-ui/src/hooks/useAgents.ts`, `apps/wayofwork-ui/src/components/simple/SimpleTeamView.tsx`, `apps/wayofwork-ui/src/components/simple/SimpleChatView.tsx`, `apps/wayofwork-ui/src/components/ChatPanel.tsx`.
