# Notes

## 2026-03-26

- Read `bin/8gent.ts` — main CLI entry point for `8gent` command
- Read `packages/eight/index.ts` — barrel exports for agent harness
- Read `packages/ai/` — AI SDK integration (task-router, providers, tools)
- Read `packages/memory/` — SQLite + FTS5, consolidation, promote, recall, health
- Read `packages/orchestration/orchestrator-bus.ts` — multi-agent coordination
- Read `.env` example — env vars for models/cloud
- Read `README.md` — ecosystem overview, quick start
- Read `package.json` — npm scripts for tui, pet, cli

### Observations:

- **No external deps:** `package.json` shows optional cloud keys; 8gent runs fully offline
- **Monorepo:** `bun workspaces` or npm workspaces
- **AST-first:** Token savings (40%+) by parsing instead of reading text
- **Self-evolution:** Consolidation, reflection, checkpoint restore
- **Policy engine:** Deny-by-default via YAML rules
- **Music stack:** Tone.js + ffmpeg.wasm in `packages/music/`
- **Voice stack:** ElevenLabs + VAPI in `packages/voice/`
- **Memory:** Consolidation every X turns, health checks

### Next Steps:

- [ ] Verify `packages/memory/store.ts` schema
- [ ] Check `packages/permissions/policy-engine.ts` rules
- [ ] Inspect `packages/orchestration/worktree.ts` pool
- [ ] Review `packages/self-autonomy/evolution.ts` pipeline

---
