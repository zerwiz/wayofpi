# Agent teams (`agent-team` extension)

This document describes **how agent teams work** in this playground: **rosters**, **YAML + JSON presets**, the **dispatcher model**, **`dispatch_agent`**, **team management tools**, and **slash commands**.

For general agent file format and other extensions that use agents, see **[AGENTS.md](AGENTS.md)**.

---

## 1. What `agent-team` does

**Extension:** `extensions/agent-team.ts` (load via shim `.pi/extensions/…` or `pi -e extensions/agent-team.ts`).

- The **primary** Pi agent acts as a **dispatcher**: it should **not** use repo tools directly; it **`dispatch_agent`**’s work to **named specialists**.
- Each specialist is a **separate Pi subprocess** with its own **session file** under **`.pi/agent-sessions/`**, so specialists can retain context across dispatches.
- A **grid widget** shows each specialist’s status (idle / running / done / error) and rough context usage.

---

## 2. Where rosters come from

### 2.1 Built-in teams — `teams.yaml`

**Path:** `.pi/agents/teams.yaml`

Simple YAML: each **team name** is a key; members are a list of **`name`** values matching agent frontmatter (e.g. `scout`, `planner`).

```yaml
plan-build:
  - planner
  - builder
  - reviewer
```

Built-in rosters also include **`new-project`** ( **`project-scanner`** only ) for bootstrapping **`/home/zerwiz/.pi/projects/<slug>/`** from **`projects/_template/`**; **`full`** and **`info`** include **`project-scanner`** as well. The **`ralph`** team is **Ralph plus helpers** (**`ralph`**, **`scout`**, **`planner`**, **`reviewer`**) so the dispatcher can delegate exploration, planning, or review around HTML ticket work; Ralph may emit **`RALPH_ESCALATE`** when a headless run cannot proceed alone. See **`.pi/agents/teams.yaml`**.

These teams are **versioned with the repo** and are the **source of truth** for built-in sets. You **cannot** delete a YAML-only team via the **`team_delete_preset`** tool (edit the file instead).

### 2.2 Saved presets — `teams-presets.json`

**Path:** `.pi/agents/teams-presets.json`

JSON shape:

```json
{
  "version": 1,
  "presets": {
    "my-custom-team": ["scout", "reviewer"]
  }
}
```

At load time, teams are merged as:

**`{ ...teamsFromYaml, ...presets }`**

So a preset **key** that matches a YAML team **overrides** the YAML roster for that key (useful for saved tweaks). Deleting a preset restores the YAML definition for that name (if any).

---

## 3. Specialist definitions (who can be on a team)

Member names must match **`name`** in agent markdown scanned from:

- `agents/*.md`
- `.claude/agents/*.md`
- `.pi/agents/*.md`

First duplicate `name` wins across directories (see implementation in `scanAgentDirs`).

---

## 4. Dispatcher tools (LLM)

The dispatcher’s active tool set includes **`dispatch_agent`** plus **team management** tools (names may evolve; check `extensions/agent-team.ts` for the exact list registered in `setActiveTools`).

| Tool | Purpose |
|------|---------|
| **`dispatch_agent`** | Run a task on a specialist (`agent` + `task`). |
| **`team_list`** | List teams (yaml vs preset), active roster, all scanned agents. |
| **`team_member_add`** / **`team_member_remove`** | Edit **active** team in memory. |
| **`team_member_replace`** | Replace one roster slot (`fromAgent` → `toAgent`). |
| **`team_reload_agents`** | Rescan `*.md` agent files from disk (after edits). |
| **`team_activate`** / **`team_load_preset`** | Switch active team or preset by name. |
| **`team_save_preset`** | Persist current active roster under a name (`overwrite` optional). |
| **`team_delete_preset`** | Remove a key from `teams-presets.json` (not pure-YAML teams). |

**Persistence:** Roster edits from **`team_member_*`** are **in memory** until you **`team_save_preset`** (or lose them on restart unless saved).

---

## 5. Slash commands (you)

| Command | Action |
|---------|--------|
| **`/agents-team`** | Pick a team from a dialog. |
| **`/agents-list`** | Active specialists and status. |
| **`/agents-grid N`** | Grid columns (1–6). |
| **`/agents-team-add`** / **`/agents-team-remove`** | Edit active roster. |
| **`/agents-team-replace FROM TO`** | Replace one member with another. |
| **`/agents-reload`** | Rescan agent markdown. |
| **`/agents-preset-save`** / **`load`** / **`list`** / **`delete`** | Manage JSON presets. |

On session start, the extension shows a short help banner listing these.

---

## 6. System prompt behavior

On each turn, **`before_agent_start`** injects a dispatcher system prompt that includes:

- **Active team** name and **member list**
- Per-agent **dispatch name**, description, and **tools** line
- Instructions to use **`dispatch_agent`** and the **team_*** tools

Only agents **on the active team** are valid **`dispatch_agent`** targets.

---

## 7. How this fits the rest of the repo

| Piece | Role |
|-------|------|
| **`.pi/agents/*.md`** | Specialist personas + `pi-pi` experts |
| **`teams.yaml`** | Named rosters for the dispatcher |
| **`teams-presets.json`** | User-saved rosters |
| **`.pi/agent-sessions/`** | Per-specialist Pi session files (often gitignored) |
| **`agent-chain`** | Different model: fixed pipeline in `agent-chain.yaml`, not ad-hoc dispatch |

---

## 8. Operational tips

1. After editing **`.md`** agents, run **`/agents-reload`** (or **`team_reload_agents`**) so the dispatcher sees new text without restarting Pi.
2. Use **`/agents-preset-save myteam`** to keep a roster you like; **`/agents-preset-load myteam`** to bring it back.
3. If dispatch fails with “agent not found,” check **`team_list`** and that the **`name`** in YAML matches frontmatter **`name`**.

---

## 9. See also

- **[AGENTS.md](AGENTS.md)** — agent file format and other extensions
- **[EXTENSIONS.md](EXTENSIONS.md)** — shims and loading extensions
- **`extensions/agent-team.ts`** — source of truth for behavior
