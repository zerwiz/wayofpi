# Tasks

## Next Steps

### Priority 1: Verify Core Files

- [ ] Inspect `packages/eight/agent.ts` — understand agent loop
- [ ] Review `packages/permissions/policy-engine.ts` — NemoClaw rules
- [ ] Read `packages/memory/store.ts` — SQLite schema
- [ ] Check `packages/orchestration/orchestrator-bus.ts` — agent mesh

### Priority 2: Stack Verification

- [ ] Verify `bun` vs `npm` for install commands
- [ ] Confirm SQLite FTS5 dependency (`better-sqlite3`)
- [ ] Check Vercel AI SDK packages in `package.json`
- [ ] Validate Ink v6 TUI dependencies

### Priority 3: Commands

- [ ] Test `8gent outline` command
- [ ] Test `8gent symbol` command  
- [ ] Run `8gent --help` to see all CLI options
- [ ] Verify TUI launches with `8gent tui`

### Priority 4: Architecture

- [ ] Map all apps in `apps/` directory
- [ ] List all packages in `packages/` directory
- [ ] Document `scripts/` utilities
- [ ] Create diagram of agent orchestration flow

### Priority 5: Environment

- [ ] Locate `.env` template
- [ ] Document required vars (TELEGRAM, OPENROUTER, etc.)
- [ ] Verify Ollama is running on first launch

---

*Full project at `/home/zerwiz/.pi/projects/8gent-code/`*
