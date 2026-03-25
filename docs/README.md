# Documentation (`docs/`)

Purpose: onboarding and **accurate** descriptions of how this Pi extension playground is wired—especially **memory**, **extensions**, and **specs vs implementation**.

| Document | Contents |
|----------|-----------|
| **[REPO_INDEX.md](REPO_INDEX.md)** | **Repo map:** what each top-level folder and **`.pi/`** subtree is for; **`projects/_template`** file list; gitignored paths; path cheatsheet (`/home/zerwiz/.pi/...`) |
| **[AGENTS.md](AGENTS.md)** | Agent **definitions** (`.md` + frontmatter), scan paths, integration: `system-select`, `agent-team`, `agent-chain`, sessions |
| **[AGENT_TEAMS.md](AGENT_TEAMS.md)** | **Agent-team** extension: `teams.yaml`, `teams-presets.json`, `dispatch_agent`, team tools, slash commands |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | **Agent memory guide:** JSONL sessions, session-memory vs session-saver vs `/remember`, AGENTS.md, skills, privacy, troubleshooting |
| **[HERMES_INTEGRATION.md](HERMES_INTEGRATION.md)** | **Hermes** client: `~/.hermes/config.yaml`, Honcho toolset, env, `just hermes-*`, relation to Pi |
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | **Honcho** server: Docker stack, `~/.honcho/config.json`, API URL, deriver/dreaming, `just honcho-*` |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Short **bridge** + minimal happy path; links to the two integration guides above |
| **[SYSTEM.md](SYSTEM.md)** | Session memory vs session saver, skills vs extensions, project layout, rules for agents (execute tools; don’t fake output), specs summary |
| **[EXTENSIONS.md](EXTENSIONS.md)** | Upstream extension model, shim pattern, new-extension checklist, picker FAQ |
| **[SKILLS.md](SKILLS.md)** | **Skills:** discovery paths, progressive disclosure, `/skill:name`, authoring `SKILL.md`, cross-agent + settings |
| **[CONCEPTS.md](CONCEPTS.md)** | **Skills vs agents vs extensions vs tools** — definitions, distinctions, when to use which |
| **[TOOLS.md](TOOLS.md)** | **Tools:** built-ins, extension `registerTool`, agent `tools:` allowlists, safety, links to root `TOOLS.md` signatures |
| **[sessions.md](sessions.md)** | Older session-saver-oriented doc; canonical behavior for saver: **`../extensions/sessions/README.md`** |
| **[commands/REFERENCE.md](commands/REFERENCE.md)** | Slash-command reference (may mix generic Pi concepts—verify against your Pi version) |
| **[SUPERPOWERS_BUILD_MAP.md](SUPERPOWERS_BUILD_MAP.md)** | Mapping Superpowers skills/workflows into Pi extension + agent components |
| **[SUPERPOWERS_TODO.md](SUPERPOWERS_TODO.md)** | Checkbox TODO for implementing Superpowers-like workflow in this Pi repo |
| **[../projects/README.md](../projects/README.md)** | **Per-project docs** Pi uses while working on a codebase: layout, slug naming, template under `projects/_template/` |

Repo boot notes: root **[README.md](../README.md)** and **[CLAUDE.md](../CLAUDE.md)**.
