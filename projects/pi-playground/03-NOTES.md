# Notes

Scratch notes, discoveries, and quick thoughts while scanning the pi-playground repository.

---

## 2026-03-26 — Scan notes

- **Repository:** `/home/zerwiz/.pi`
- **Type:** Pi Coding Agent playground
- **Goal:** Showcase UI customization, agent orchestration, safety auditing, cross-agent integrations
- **Key features:**
  - 23 extension files in `extensions/`
  - 18+ agent definitions in `.pi/agents/` + `agent/`
  - 12 theme JSON configs
  - Ralph queue extension (todo → inprogress → done)
  - Agent teams system (dispatch_agent, agent-chain)
  - Damage-control extension (real-time safety auditing)
  - Session memory & saver
  - Chronicle workflow ledger
  - Hermes/Honcho integration

- **Extensions of interest:**
  - `agent-team.ts` — Dispatcher for multi-agent workflows
  - `tilldone.ts` — Task discipline with checkpoints
  - `ralph.ts` — HTML queue for iterative HTML tasks
  - `subagent-widget.ts` — Background subagents with live widgets
  - `damage-control.ts` — Real-time safety hooks

- **Agents:**
  - `project-scanner.md` — Creates `projects/<slug>/` for new workspaces
  - `indexer.md` — Builds `INDEX.md` for codebase maps
  - `hermes.md` — Hermes CLI bridge
  - `ralph.md` — Ralph queue management
  - `pi-pi/pi-orchestrator.md` — Parallel expert agent orchestration

- **Team presets:**
  - `new-project` — Bootstrapping team (project-scanner only)
  - `ralph` — Ralph workflow (scout, planner, builder, reviewer, code-documenter, documenter)
  - `hermes` — Solo Hermes CLI
  - `pi-pi` — Meta-agent for Pi framework development

- **Skills:**
  - `/skill:github` — Parallel agents via git worktrees
  - `/skill:indexer` — Build project indexes
  - `/skill:ralph` — Ralph queue management
  - `/skill:bowser` — Headless browser automation
  - `/skill:extending-pi` — Guide for extending Pi (upstream skill)

- **Themes:**
  - 12 JSON configs in `.pi/themes/`
  - Theming via `theme-cycler` extension
  - Custom themes for different aesthetics

- **Documentation:**
  - `docs/README.md` — Master index
  - `docs/REPO_INDEX.md` — Folder map with purposes
  - `docs/AGENTS.md` — Agent definitions guide
  - `docs/SKILLS.md` — Skills system
  - `docs/TOOLS.md` — Tool signatures
  - `docs/CONCEPTS.md` — Concepts overview

- **Safety:**
  - `.pi/damage-control-rules.yaml` — Path-based access controls
  - Dangerous bash command blocking
  - Read-only paths for critical files

- **Justfile recipes:**
  - `pi` — Plain Pi
  - `ext-*` — Extension launchers
  - `all` — Interactive extension stacker
  - `open` — New terminal with extensions
  - `honcho-*` — Honcho/Hermes helpers

- **Scripts:**
  - `scripts/pi-with-env` — Sources `.env` before launching Pi
  - `install-global` — Symlink `ppi` / `pi-e` to PATH

- **Gitignored:**
  - `.pi/agent-sessions/` — Ephemeral subagent state
  - `.pi/storage/` — Session-saver snapshots
  - `.pi/chronicle/` — Chronicle ledger
  - `agent/sessions/` — Chat transcripts

---

## Open questions

1. Are all extensions well tested?
2. Which agents are most useful daily?
3. Should we add more theme options?
4. Is the Ralph queue workflow being used?

---

## Ideas for improvement

- Automate `projects/<slug>/` documentation refresh via CI
- Add more agent persona examples to `.pi/agents/`
- Create `docs/` guide for new extension authors
- Build extension showcase website
