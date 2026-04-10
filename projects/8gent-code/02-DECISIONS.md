# Decisions

## 2026-03-26 Initial Scan

### Decisions Made:

1. **Project Scope:** 8gent Code is the kernel of the 8gent ecosystem — an open-source multi-agent system with 6 products and 50+ capabilities.
2. **Architecture:** Multi-agent with AST-first code exploration, worktree pool (4 max), persistence via SQLite, daemon on Fly.io Amsterdam.
3. **Memory Stack:** Episodic (events), semantic (embeddings), procedural (replay/consolidation), contradictions flagged by self-reflection.
4. **Policy Engine:** Deny-by-default via NemoClaw YAML rules; auto-approve trusted patterns.
5. **Monorepo Layout:** apps/ for products, packages/ for capabilities, scripts/ for utilities.
6. **Tech Stack:** Bun runtime, TypeScript v5, SQLite + FTS5, Vercel AI SDK, Ink v6 for TUI.
7. **Cross-Platform:** macOS native pet via Swift, Linux via terminal-rendered pet, identical CLI on both.
8. **No External Deps:** Run fully offline with Ollama; cloud models optional.
9. **Key Files:** `packages/eight/agent.ts` (loop), `packages/permissions/policy-engine.ts` (NemoClaw), `packages/memory/store.ts` (SQLite).
10. **Links:** Main repo at `github.com/zerwiz/8gent-code`, upstream at `github.com/PodJamz/8gent-code`.

### Notes:

- Linux fork by `zerwiz` maintains fixes separately; sync to `PodJamz` when appropriate.
- Fly.io daemon at `eight-vessel.fly.dev` persists state and can handle multiple clients.
- See `packages/eight/agent.ts` and `packages/permissions/policy-engine.ts` for entry points.

---
