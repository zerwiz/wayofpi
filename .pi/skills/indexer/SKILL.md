---
name: indexer
description: Build or refresh INDEX.md in a project root — directory map plus per-file purpose so agents use it as a navigation map. Use when onboarding, after big refactors, or when the user asks for a project index / codebase map.
allowed-tools: read write edit bash grep find ls
---

# Indexer (project map)

Follow the **`indexer`** agent (`.pi/agents/indexer.md`). Short checklist:

1. **Scope** — User names a root path (one tree only).
2. **Discover** — `find` / `ls` / `grep`; skip `node_modules`, `.git`, build artifacts (see agent file).
3. **Read** — Open important files; one–two sentence purpose each.
4. **Write** — **`INDEX.md`** at scope root (or **`docs/INDEX.md`** if user prefers).
5. **Handoff** — Tell other agents to **`read`** **`INDEX.md`** first.

Invoke with **`/skill:indexer`** or **`dispatch_agent` `indexer`**.
