# Documentation (`docs/`)

Purpose: onboarding and **accurate** descriptions of how this Pi extension playground is wired—especially **memory**, **extensions**, and **specs vs implementation**.

**Cursor:** When editing these markdown files, follow **`.cursor/rules/pi-documentation-consistency.mdc`** (terminology, links, index updates). **Core** guides (**TOOLS**, **SKILLS**, **AGENTS**, **AGENT_TEAMS**, **TUI**) also follow **`.cursor/rules/pi-docs-core.mdc`**.

| Document | Contents |
|----------|-----------|
| **[REPO_INDEX.md](REPO_INDEX.md)** | **Repo map:** what each top-level folder and **`.pi/`** subtree is for; **`projects/_template`** file list; gitignored paths; path cheatsheet (`/home/zerwiz/.pi/...`) |
| **[PLAYGROUND.md](PLAYGROUND.md)** | What “the playground” is — reusable Pi toolbox vs per-project config; how to opt-in from other repos |
| **[AGENTS.md](AGENTS.md)** | Agent **definitions** (`.md` + frontmatter), scan paths, integration: `system-select`, `agent-team`, `agent-chain`, sessions |
| **[HOW_TO_USE_AGENTS.md](HOW_TO_USE_AGENTS.md)** | **Practical agent usage guide** — which agent to use when, commands (`/system`, `agent-team` teams, `/ralph`), and example workflows |
| **[AGENT_TEAMS.md](AGENT_TEAMS.md)** | **Agent-team** extension: `teams.yaml`, presets, `dispatch_agent`, team tools, slash commands; **grid vs footer context %**; **limits / truncation / missing files** |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | **Agent memory guide:** JSONL sessions, session-memory vs session-saver vs `/remember`, AGENTS.md, skills, privacy, troubleshooting |
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | **Hermes** client: `~/.hermes/config.yaml`, Honcho toolset, env, `just hermes-*`, relation to Pi |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | **Honcho** server: Docker stack, `~/.honcho/config.json`, API URL, deriver/dreaming, `just honcho-*` |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Short **bridge** + minimal happy path; links to the two integration guides above |
| **[SYSTEM.md](SYSTEM.md)** | Session memory vs session saver, skills vs extensions, project layout, rules for agents (execute tools; don’t fake output), specs summary |
| **[TUI.md](TUI.md)** | Terminal UI: **Ctrl+T** thinking toggle, **Shift+Tab** thinking level, **Ctrl+O** tools, links to **[`RESERVED_KEYS.md`](../RESERVED_KEYS.md)** |
| **[EXTENSIONS.md](EXTENSIONS.md)** | Upstream extension model, shim pattern, **inventory** of `extensions/*.ts` + `.pi/extensions/` shims, new-extension checklist, picker FAQ |
| **[HOW_TO_USE_EXTENSIONS.md](HOW_TO_USE_EXTENSIONS.md)** | **Practical extensions usage guide** — what each extension does (agent-team, ralph, tilldone, session-memory, etc.), stacks, and when to enable/disable them |
| **[SKILLS.md](SKILLS.md)** | **Skills:** **inventory** of `.pi/skills/`, discovery, `/skill:name`, authoring, cross-agent + settings |
| **[HOW_TO_USE_SKILLS.md](HOW_TO_USE_SKILLS.md)** | **Practical skills usage guide** — when to use `bowser`, `find-skills`, `github`, `indexer`, `ralph`, how to call `/skill:name`, and example flows |
| **[EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md](EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md)** | Post-mortem: agent-team session — what worked, what failed, **`docs/codereadme.md`** myth, **`files-widget`** deps, recommendations |
| **[CONCEPTS.md](CONCEPTS.md)** | **Skills vs agents vs extensions vs tools** — definitions, distinctions, when to use which |
| **[TOOLS.md](TOOLS.md)** | **Tools:** built-ins, **inventory** of extension-registered tool names, agent `tools:` allowlists, safety, root `TOOLS.md` signatures |
| **[HOW_TO_USE_TOOLS.md](HOW_TO_USE_TOOLS.md)** | **Practical tools usage guide** — how to use `read`, `bash`, `edit`, `write`, and the key extension tools like `dispatch_agent`, `tilldone`, `ralph_queue_status`, `run_chain` |
| **[sessions.md](sessions.md)** | Older session-saver-oriented doc; canonical behavior for saver: **`../extensions/sessions/README.md`** |
| **[commands/REFERENCE.md](commands/REFERENCE.md)** | Slash-command reference (may mix generic Pi concepts—verify against your Pi version) |
| **[SUPERPOWERS_BUILD_MAP.md](SUPERPOWERS_BUILD_MAP.md)** | Mapping Superpowers skills/workflows into Pi extension + agent components |
| **[SUPERPOWERS_TODO.md](SUPERPOWERS_TODO.md)** | Checkbox TODO for implementing Superpowers-like workflow in this Pi repo |
| **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** | Plan to port **[awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents)** (Codex `.toml`) into Pi **`.md`** agents |
| **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** | Auto **agent/model** fit: skill + **`agent-model-routes.yaml`** + **`agent-team`** subprocess **`--model`** override; optional main-session switch |
| **[../projects/README.md](../projects/README.md)** | **Per-project docs** Pi uses while working on a codebase: layout, slug naming, template under `projects/_template/` |

Repo boot notes: root **[README.md](../README.md)** and **[CLAUDE.md](../CLAUDE.md)**.
