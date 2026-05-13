# Claude Code vs this Pi setup — what they have, what we lack

**Purpose:** A **Pi-centric** gap analysis: what [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) ships as a product vs what **upstream Pi** provides by default vs what **this extension playground** (this repository) adds. For a full side‑by‑side feature matrix, see root **[COMPARISON.md](../COMPARISON.md)** (Pi v0.52.x vs Claude Code narrative).

**Last updated:** 2026-03-27

---

## 1. Scope: three layers


| Layer                      | What it is                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code**            | Anthropic’s proprietary agentic coding product: terminal, IDE plugins, desktop, web, subscription/Console billing, enterprise controls.                               |
| **Upstream Pi**            | Open-source [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent): minimal default tools/prompt; extensions, multi-provider models, RPC, rich TUI hooks. |
| **This repo (playground)** | Project-local `**.pi/`** + `**extensions/**`: agent teams, chains, skills, damage control, session tooling, etc.                                                      |


Gaps below call out **upstream Pi** unless the row says **playground** explicitly.

---

## 2. What Claude Code emphasizes (official surface)

From [Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview) and linked product docs:

- **Surfaces:** Terminal CLI, **VS Code** (incl. Cursor), **JetBrains**, **Desktop app**, **Web** (`claude.ai/code`), **iOS**, session handoff (`/teleport`, remote control, Dispatch).
- **Core loop:** Read/edit codebase, run commands, **git** (commits, branches, PRs), **GitHub / GitLab CI** recipes, **Slack** `@Claude` → PR flows.
- **Integrations:** **MCP** first-class; **Chrome** debugging; **channels** (webhooks, etc.).
- **Customization:** `**CLAUDE.md`** + auto memory; **skills** / custom slash commands; **shell hooks**.
- **Orchestration:** **Sub-agents** with a coordinating lead; **Agent SDK** for custom harnesses.
- **Ops:** **Scheduled tasks** (cloud + desktop); `**/loop`**; permissions / sandboxing (product-managed).
- **Enterprise:** SSO, audit, admin policies, managed marketplaces (see COMPARISON.md).

---

## 3. Gaps: what we do *not* have (or only partially)

Legend: **Missing** = not in upstream Pi / not in this playground without extra work · **Partial** = extension, bash, or workflow substitutes exist · **Different** = Pi does it another way (not necessarily worse).

### 3.1 Product & distribution (Claude Code only)


| Capability                                            | In Pi / playground                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| Official IDE extensions (inline diffs, `@` context)   | **Missing** — Pi is **terminal-first**; IDE integration would be RPC/custom. |
| Desktop / web / mobile apps                           | **Missing**                                                                  |
| Anthropic-hosted cloud sessions & schedules           | **Missing**                                                                  |
| Subscription bundle (Pro / Max / Teams) as product    | **Different** — Pi is BYO keys / OAuth per provider.                         |
| Enterprise SSO / audit dashboards                     | **Missing**                                                                  |
| Remote control / Dispatch / cross-device session sync | **Missing**                                                                  |


### 3.2 Built-in tools & integrations (upstream Pi core)


| Claude Code (typical)                                  | Pi default / playground                                                                                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Glob**, **Grep** as first-class tools                | **Partial** — Pi optional `**grep` / `find` / `ls`** via `--tools` / config; not identical to CC’s glob API.                                                                        |
| **WebSearch**, **WebFetch**                            | **Partial** — **`web-tools`**: Brave / DuckDuckGo; **Gemini** *Google Search* grounding + *URL context* when **`GEMINI_API_KEY`** (+ **`WEB_TOOLS_*`**). |
| **NotebookEdit** (Jupyter)                             | **Missing**                                                                                                                                                                         |
| **MCP** client (lazy load, OAuth)                      | **Missing** in upstream Pi by default; **Partial** in ecosystem (see [COMPARISON.md](../COMPARISON.md) — “available via extensions”; no MCP extension ships in `extensions/` here). |
| Deep **GitHub** PR UI (suggested edits, native review) | **Partial** — **`github-management`**: **`github_pr_view` / `diff` / `checks` / `review_submit` / `review_inline`** (suggestions via API); still no IDE-embedded diff UI like Claude Code in VS Code. |
| **LSP** in agent                                       | **Missing** in Pi core (per [PI_VS_OPEN_CODE.md](../PI_VS_OPEN_CODE.md) style comparisons).                                                                                         |


### 3.3 Safety & permissions


| Topic                                                   | Pi / playground                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Deny-first permission modes, filesystem/network sandbox | **Missing** upstream; **Partial** — `**purpose-gate`**, `**damage-control**`, audit extensions add *policy/visibility*, not CC’s full sandbox product. |
| Haiku pre-screen of bash                                | **Missing** (CC-style)                                                                                                                                 |


### 3.4 Orchestration & “teams”


| Topic                                                           | Pi / playground                                                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native `**Task*`* tool with typed sub-agents inside one process | **Different** — Pi has no built-in Task tool; `**agent-team`** spawns **separate Pi processes** with `**dispatch_agent`** ([AGENT_TEAMS.md](AGENT_TEAMS.md)). |
| Lead + teammate idle hooks, built-in task completion events     | **Partial** — teams/presets in `**.pi/agents/teams.yaml`**; behavior overlaps CC but is **extension-maintained**, not identical API.                          |
| **Plan mode** (read-only explore → plan → code phases)          | **Missing** as a single product mode; **Partial** — planner agents, `**agent-chain`**, manual “plan in files” workflows.                                      |


Root **[COMPARISON.md](../COMPARISON.md)** still says agent teams are “use orchestration scripts” for Pi — that is **out of date for this repo**, which ships `**agent-team`** and related agents.

### 3.5 Memory & project context


| Topic                                                 | Pi / playground                                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Hierarchical `**CLAUDE.md**` auto-merge               | **Different** — Pi uses `**agent/AGENTS.md`**, `**/remember**`, session memory extensions; CC’s exact hierarchy is not duplicated. |
| **Auto memory** (automatic learnings across sessions) | **Partial** — session-memory / chronicle / skills; not necessarily CC’s same automatic extraction.                                 |


### 3.6 Hooks vs extensions


| Topic                            | Pi / playground                                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell **hooks** in JSON settings | **Different** — Pi prefers **TypeScript extension events** ([COMPARISON.md](../COMPARISON.md) hook mapping). You **can** shell out from extensions, but config is not “hooks.json only.” |


---

## 4. What Pi (or this playground) has that Claude Code does not emphasize the same way

Short list (details in **[COMPARISON.md](../COMPARISON.md)**):

- **MIT open source** and **many providers / local models** without a single-vendor gate.
- **RPC mode**, **session tree / fork**, **steer / follow-up** queue semantics, **HTML export** from APIs.
- **In-process** extension power: replace tools, stream lifecycle events, custom TUI.
- This repo: **Ralph** ticket queue, **Hermes/Honcho** docs, **domain specialist** agent library, `**pi-pi`** meta-experts, `**pi-e**` playground wiring.

---

## 5. Suggested priorities if “close the gap” to Claude Code

Ordered by impact for users who want CC-like ergonomics on Pi:

1. **WebSearch / WebFetch** — partly covered by **`web-tools`**; optional Brave API or MCP for heavier integrations.
2. **Notebook / Jupyter** tool — if notebooks are part of daily workflow.
3. **First-class Glob** — optional tool matching CC’s ergonomics (Pi today: `find` + bash).
4. **MCP** — if you depend on Jira/Drive/Slack tool servers; verify which Pi package/extension you trust.
5. **Permission/sandbox story** — tighten `**purpose-gate`** / `**damage-control**` or document a standard “safe stack.”
6. **IDE surface** — out of scope for this repo; would be separate integration work.

---

## 6. Related docs


| Doc                                             | Role                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| **[COMPARISON.md](../COMPARISON.md)**           | Full Claude Code ↔ Pi matrix (tools, hooks, enterprise, ecosystem). |
| **[PI_VS_OPEN_CODE.md](../PI_VS_OPEN_CODE.md)** | Pi vs OpenCode (another “batteries-included” CLI).                  |
| **[docs/CONCEPTS.md](CONCEPTS.md)**             | Tools vs extensions vs agents vs skills.                            |
| **[docs/AGENT_TEAMS.md](AGENT_TEAMS.md)**       | How this repo implements team dispatch.                             |
| **[docs/EXTENSIONS.md](EXTENSIONS.md)**         | Extension inventory and shim pattern.                               |


