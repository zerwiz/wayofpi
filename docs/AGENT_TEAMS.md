# Agent teams (`agent-team` extension)

This document describes **how agent teams work** in this playground: **rosters**, **YAML + JSON presets**, the **dispatcher model**, **`dispatch_agent`**, **team management tools**, and **slash commands**.

For general agent file format and other extensions that use agents, see **[AGENTS.md](AGENTS.md)**.

---

## 1. What `agent-team` does

**Extension:** `extensions/agent-team.ts` (load via shim `.pi/extensions/…` or `pi -e extensions/agent-team.ts`).

- The **primary** Pi agent acts as a **dispatcher**: it **`dispatch_agent`**’s **implementation** work to **named specialists**. It also gets **read-only** built-ins (**`read`**, **`ls`**, **`grep`**) so it can **verify** paths and show the user what specialists produced—**not** **`write`**, **`edit`**, or **`bash`** (those stay on specialists).
- Each specialist is a **separate Pi subprocess** with its own **session file** under **`.pi/agent-sessions/`**, so specialists can retain context across dispatches.
- A **grid widget** shows each specialist’s status (idle / running / done / error), **context %** (input vs model window), and **last-run tokens** (**`↓` prompt in**, **`↑` completion out**) parsed from the subprocess JSON stream; the same totals appear in **`dispatch_agent`** tool results and the completion **notify** toast.

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

Built-in rosters also include **`new-project`** (**`project-scanner`** + **`indexer`**) for bootstrapping **`/home/zerwiz/.pi/projects/<slug>/`** from **`projects/_template/`** and for **`INDEX.md`** maps in the target tree; **`full`** and **`info`** include **`project-scanner`** and **`indexer`** as well. Team **`full`** includes **`ralph`** (HTML ticket queue) and does **not** list **`hermes`** or **`red-team`**—use team **`hermes`** (solo) or **`info`** for **`dispatch_agent` `hermes`**, or add **`red-team`** via **`/agents-team-add`** / a saved preset. The **`index`** team is **`indexer`** only—builds **`INDEX.md`** at a requested path as a navigable map. The **`hermes`** team is a **single specialist** (**`hermes`**) that runs the external **Hermes CLI** (`hermes chat -q …`) and returns Hermes’s **stdout** to the dispatcher—see **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** §7. The **`ralph`** team is **Ralph plus helpers** (**`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**) so the dispatcher can delegate exploration, planning, implementation, review, **code-facing docs** (comments / TSDoc), or **prose docs** around HTML ticket work; Ralph may emit **`RALPH_ESCALATE`** when a headless run cannot proceed alone. See **`.pi/agents/teams.yaml`**.

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

The dispatcher’s active tool set includes **`dispatch_agent`**, **team management** tools, and **`DISPATCHER_VERIFY_TOOLS`** (**`read`**, **`ls`**, **`grep`**)—see `setActiveTools` in `extensions/agent-team.ts` for the exact list.

| Tool | Purpose |
|------|---------|
| **`dispatch_agent`** | Run a task on a specialist (`agent` + `task`). |
| **`read`** / **`ls`** / **`grep`** | **Verification only**—confirm files exist, list dirs, search; use after a specialist claims an artifact. |
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
- Instructions to use **`dispatch_agent`** and the **team_*** tools, and when to use **`read`** / **`ls`** / **`grep`** for verification

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

## 8. Grid widget: footer % vs card %

The specialist **grid** and the TUI **footer** both show a small bar and a percentage. They measure **different things** and use **different math**, so seeing **~4% on cards** and **~5% in the footer** at the same time is **normal**.

### 8.1 Per-specialist cards (`[#----] 4%`, `↓1.2k ↑0.3k`)

The line below the context bar shows **prompt** and **completion** token totals for the **last finished** `dispatch_agent` run for that specialist (or live partial counts while running, then final values from **`message_end`** / **`agent_end`** usage fields). If the provider omits usage, the card shows **`tok —`**.

### 8.2 Context use bar (the `[#----] N%` line)

After each subagent run, the extension updates **`contextPct`** from the **JSON stream** of the child `pi` process. When Pi emits **`message_end`** or **`agent_end`** with usage metadata, the code sets:

- **`contextPct` = (that message’s `usage.input` / model `contextWindow`) × 100**

So the number is roughly **“how much of the specialist model’s context window was consumed by input tokens on that run,”** not “percent of the task completed” and not “quality score.”

Rendering details (see `extensions/agent-team.ts`):

- The bar has **5** slots; each `#` represents **20%** of context (`Math.ceil(contextPct / 20)` filled blocks).
- The printed percent uses **`Math.ceil(contextPct)`**.

Several specialists that finished a **short** dispatch can show the **same** rounded percent (e.g. all **4%**) because their runs used a similar small amount of **input** context.

### 8.3 Footer bar (`[--------] 5%`)

The footer is driven by the **primary (dispatcher) session**, not the subprocesses:

- It calls **`getContextUsage()`** on the main session and uses **`usage.percent`**.
- The bar has **10** slots (**10%** per `#`): `Math.round(pct / 10)` filled blocks.
- The label uses **`Math.round(pct)`**.

So the footer reflects **dispatcher** context pressure (your main chat + system prompt + tools), while each card reflects **that specialist’s** last reported usage. **Rounding differs** (`ceil` on cards vs `round` in the footer), which can also nudge numbers apart by one point.

**Takeaway:** Treat these as **context-use hints**, not **task progress**. Idle agents keep their last **`contextPct`** until the next run.

---

## 9. Why dispatches can stop, truncate, or leave no files on disk

These behaviors come up often when using **`dispatch_agent`**; they are expected constraints of the stack, not a single “broken” setting.

| Symptom | What is going on |
|--------|-------------------|
| Reply ends with **`[truncated]`** or mid-sentence cut | **Output length limit** for the model turn; the run ended but the UI/log clipped the text. |
| “Out of context” / vague follow-ups | **Context window** fills; Pi may **compact** or summarize older turns. Injected recaps are **short** and can be **stale**—see **[AGENT_MEMORY.md](AGENT_MEMORY.md)**. |
| **`404` / model not found** | Provider or **`pi.config.json`** model id is wrong; that **turn fails** until the model name is fixed. |
| Dispatcher says **`Tool read/write/bash not found`** | Older setups restricted the dispatcher to **`dispatch_agent`** + team tools only. This repo’s **`agent-team`** also enables **`read`**, **`ls`**, **`grep`** for **verification** (`DISPATCHER_VERIFY_TOOLS` in `extensions/agent-team.ts`). Specialists still own most **write**/**edit**/**bash** work. |
| User asked for a file; nothing appears under **`docs/`** | The specialist **must call the real `write`/`edit` tool**. Pasting a shell heredoc or “`WRITE path << EOF`” **in chat text does not create files**. |
| Specialist returns quickly with a plan but no artifact | One dispatch is **one bounded subprocess**; the model may stop after planning unless the task explicitly requires **tool calls** and follow-through. |
| “Why doesn’t it run until everything is finished?” | There is **no unbounded run-to-completion loop**: each turn has **token/time/step** limits; multi-agent flows are **chained dispatches** you or the model must continue. |

For a concrete session post-mortem (missing **`codereadme`**, widget deps), see **[EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md](EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md)**. For conduct (“run tools before claiming results”), see **[SYSTEM.md](SYSTEM.md)**.

---

## 10. Operational tips

1. After editing **`.md`** agents, run **`/agents-reload`** (or **`team_reload_agents`**) so the dispatcher sees new text without restarting Pi.
2. Use **`/agents-preset-save myteam`** to keep a roster you like; **`/agents-preset-load myteam`** to bring it back.
3. If dispatch fails with “agent not found,” check **`team_list`** and that the **`name`** in YAML matches frontmatter **`name`**.

---

## 11. See also

- **[AGENTS.md](AGENTS.md)** — agent file format and other extensions
- **[EXTENSIONS.md](EXTENSIONS.md)** — shims and loading extensions
- **`extensions/agent-team.ts`** — source of truth for behavior
