# Pi tools reference and Way of Pi orchestrator parity

This document (1) catalogs **Pi’s LLM-callable tools** as used in this playground, (2) maps them to **Way of Pi** (`apps/wayofpi-ui/server/`), and (3) lists **orchestrator UX/runtime differences** between **Pi TUI + agent-team** and the **web shell**.

Canonical Pi narrative: **[docs/TOOLS.md](TOOLS.md)**. Agent-team dispatcher and specialists: **[docs/AGENT_TEAMS.md](AGENT_TEAMS.md)**. Core built-in signatures (repo root): **[TOOLS.md](../TOOLS.md)**. Way of Pi server tools implementation: **`apps/wayofpi-ui/server/orchestrator-tools-exec.ts`**. Pi vs Bun wiring: **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**.

---

## 1. Pi core built-in tools (typical session)

These are the **function-shaped** tools many Pi sessions expose (exact set depends on Pi build, **`--tools`**, and policy). Signatures in **[TOOLS.md](../TOOLS.md)**.

| Tool | Purpose |
|------|---------|
| **`read`** | Read a file (text/images); optional line offset/limit; output may truncate. |
| **`write`** | Create or overwrite a file; creates parent directories. |
| **`edit`** | Replace an **exact** span of text in a file (whitespace-sensitive). |
| **`bash`** | Run a shell command in session **cwd**; optional timeout. |

Common **optional** built-ins (Pi / playground comparisons): **`grep`**, **`find`**, **`ls`** — availability depends on Pi version and flags; treat the live Pi UI as source of truth if this doc lags.

---

## 2. Pi `agent-team` dispatcher (orchestrator) tool set

Source: **`extensions/agent-team.ts`** — `setActiveTools` combines **`dispatch_agent`**, **`TEAM_TOOLS`**, and **`DISPATCHER_VERIFY_TOOLS`**.

### 2.1 `dispatch_agent` (primary delegation)

| Parameter | Role |
|-----------|------|
| **`agent`** | Roster specialist name (matches agent `.md` `name:`). |
| **`task`** | Task string for that specialist. |
| **`model`** (optional) | One-shot **`pi --model`** override for that subprocess only. |

**Behavior:** Runs a **separate `pi --mode json` subprocess** with that agent’s system prompt, tools from frontmatter, and a per-agent session file under **`.pi/agent-sessions/`**. Returns stdout/summary + usage to the dispatcher.

### 2.2 Team management tools (dispatcher)

| Tool | Purpose |
|------|---------|
| **`team_list`** | All teams (YAML + merged presets), **active** team roster, scanned agent catalog (+ model hints in Pi). |
| **`team_member_add`** | Add member to **active** team (**in memory** until preset save / restart policy per Pi). |
| **`team_member_remove`** | Remove member from active team (not last member). |
| **`team_member_replace`** | Swap one roster slot `fromAgent` → `toAgent`. |
| **`team_reload_agents`** | Rescan agent `*.md` + **`agent-models.json`**. |
| **`team_activate`** | Switch **active** team by YAML or preset key. |
| **`team_save_preset`** | Save current active roster to **`.pi/agents/teams-presets.json`**. |
| **`team_load_preset`** | Same as activate by preset name. |
| **`team_delete_preset`** | Delete a preset key (not YAML-only teams). |

**Persistence (Pi):** **`team_member_*`** mutate the **in-memory** active roster; **`team_save_preset`** persists to JSON presets; built-in teams live in **`.pi/agents/teams.yaml`** (edit file to change YAML-only teams).

### 2.3 Dispatcher verification built-ins (read-only in agent-team)

Per **[docs/AGENT_TEAMS.md](AGENT_TEAMS.md)** §4, the dispatcher also gets **`read`**, **`ls`**, **`grep`** under the name **`DISPATCHER_VERIFY_TOOLS`** — **not** **`write`**, **`edit`**, or **`bash`** on the dispatcher (implementation work is meant to go through **`dispatch_agent`**).

**Note:** Pi’s tool is often exposed as **`ls`**; Way of Pi’s Bun orchestrator exposes **`list_dir`** (same role, different name for the LLM schema).

---

## 3. Other extension-registered tools in this playground

From **[docs/TOOLS.md](TOOLS.md)** §3 (not all are loaded in every Pi session — depends on **`.pi/settings.json`** extensions):

| Extension | Tool names |
|-----------|------------|
| **`extensions/tilldone.ts`** | **`tilldone`** |
| **`extensions/chronicle.ts`** | **`chronicle_status`**, **`chronicle_snapshot`**, **`chronicle_transition`** |
| **`extensions/ralph.ts`** | **`ralph_queue_status`** |
| **`extensions/agent-team.ts`** | (see §2) |
| **`extensions/agent-forge.ts`** | **`forge_list`**, **`forge_create`** (+ dynamic forge tools) |
| **`extensions/agent-chain.ts`** | **`run_chain`** |
| **`extensions/pi-pi.ts`** | **`query_experts`** |
| **`extensions/subagent-widget.ts`** | **`subagent_create`**, **`subagent_continue`**, **`subagent_remove`**, **`subagent_list`** |
| **`extensions/web-tools.ts`** | **`web_search`**, **`web_fetch`** |
| **`extensions/github-management.ts`** | **`ghm_exec`**, **`github_pr_*`**, … |

---

## 4. Way of Pi orchestrator tools (Bun / `WOP_ORCHESTRATOR_TOOLS`)

When chat runs on the **Bun** path with **`WOP_ORCHESTRATOR_TOOLS`** enabled (and not owned by headless Pi for that turn), the model sees the tools in **`orchestratorToolsForLlm()`** inside **`apps/wayofpi-ui/server/orchestrator-tools-exec.ts`**.

| Tool | Pi analogue | Notes |
|------|----------------|-------|
| **`read`** | **`read`** | Workspace-jailed; line offset/limit. |
| **`list_dir`** | **`ls`** | One-level listing; different name from Pi. |
| **`grep`** | **`grep`** | Uses host **`rg`** (ripgrep). |
| **`write`** | **`write`** | Full-file write; no **`edit`** tool in Way of Pi Bun path. |
| **`bash`** | **`bash`** | On by default; disable with **`WOP_ORCHESTRATOR_BASH=0`** (or `false`/`no`/`off`). |
| **`git_status`**, **`git_remote`**, **`git_fetch`**, **`git_pull`**, **`git_push`** | (subset of host **`bash`** + Git) | **`apps/wayofpi-ui/server/orchestrator-git-tools.ts`**. Local status/remote listing without PAT; fetch/pull/push use optional **`.wayofpi/github-credentials.json`** PAT for **github.com** HTTPS (`http.…extraheader`). Disable with **`WOP_ORCHESTRATOR_GIT_TOOLS=0`**. |
| **`team_list`** | **`team_list`** | Primary workspace **`.pi/agents/teams.yaml`** + scanned agents (no preset merge details in output beyond what **`loadWorkspaceAgents`** returns). |
| **`team_member_add`** | **`team_member_add`** | Writes **`teams.yaml` on disk** immediately (not in-memory-only like Pi). Optional **`team`** key; if omitted, first team key **alphabetically**. |
| **`team_member_remove`** | **`team_member_remove`** | Same persistence rules; cannot remove last member. |
| **`team_member_replace`** | **`team_member_replace`** | Same. |

**Not implemented on the Bun orchestrator path (vs Pi agent-team dispatcher):**

- **`dispatch_agent`**
- **`edit`**
- **`team_reload_agents`**, **`team_activate`**, **`team_save_preset`**, **`team_load_preset`**, **`team_delete_preset`**

Those either require **Pi runtime** ( **`dispatch_agent`** ) or additional server work (preset/active-team model in the web shell).

### 4.1 Headless Pi path (`WOP_CHAT_ENGINE=pi` / `auto`)

When the server runs the turn via **`pi --mode json`** (**`apps/wayofpi-ui/server/pi-json-mode-chat.ts`**), the model gets Pi’s **real** tool surface from **`.pi/settings.json`** extensions (including **`dispatch_agent`** when **agent-team** is loaded there) — not the Bun table in §4. See **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**.

---

## 5. Orchestrator: Pi TUI vs Way of Pi UI (behavioral differences)

| Topic | Pi TUI (`agent-team`) | Way of Pi web shell |
|-------|------------------------|----------------------|
| **Delegation** | **`dispatch_agent`** → child **`pi`** subprocess per specialist, own session file. | Bun path: **phrase-dispatch** merges specialist **`.md`** system text **for one reply only**; **`dispatch_turn`** WS event drives pulse label; **no** child Pi process. Headless Pi path: real **`dispatch_agent`** when extension loaded in Pi. |
| **Dispatcher file tools** | **`read`**, **`ls`**, **`grep`** only on dispatcher. | Bun path: **`read`**, **`list_dir`**, **`grep`**, **`write`**, optional **`bash`**, **`team_*`** — broader than Pi dispatcher by design (interim bridge). |
| **Active team** | Single **active** team in extension state; **`team_member_*`** apply to it; **`/agents-team`** switches. | **No server-side active team.** Chat **Team** dropdown + pulse use **client state** (`pulseTeam`). **`team_member_*`** take optional **`team`** or default alphabetically first YAML key. |
| **Roster persistence** | In-memory edits until **`team_save_preset`** / YAML edit. | **`team_member_*`** rewrite **`.pi/agents/teams.yaml`** immediately; client gets **`agents_catalog_changed`** to refetch **`/api/agents`**. |
| **Presets** | **`teams-presets.json`** merge + **`team_*_preset`** tools. | Not implemented in Bun tools (edit JSON manually or extend server later). |
| **Pulse / grid** | Live subprocess stream: tools, thinking, tokens, per-card context. | Session-persona + **`dispatch_turn`** overlay + **`chat_usage`**; not full per-subagent Pi JSON stream (see **[docs/WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**). |
| **Persona picker** | Dispatcher identity is the **primary** Pi session; specialists are never “the main picker”. | Picker = persisted **`set_agent`** / **`chatAgentName`**; phrase-dispatch does **not** persist picker (orchestrator posture). |
| **Slash commands** | **`/agents-*`** roster, grid, stream detail, reload, presets. | **My Team** view, menu **Edit team rosters**, **`GET /api/agents`** reload — different surface, same files on disk. |

---

## 6. Closing the gap (engineering direction)

Per **`.cursor/rules/wop-ui-pi-backend-parity.mdc`** and **[docs/WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)**:

1. Prefer **headless Pi** for turns that need **`dispatch_agent`**, **`edit`**, and extension tools not replicated in Bun.
2. Extend Bun orchestrator only where it is a **documented interim** bridge; add missing **`team_*`** parity and **`edit`** only if product asks for Bun-first behavior before Pi owns the turn.
3. Keep this table updated when **`ORCHESTRATOR_TOOLS_OPENAI`** or Pi **`setActiveTools`** changes.

Last updated: 2026-04-11.
