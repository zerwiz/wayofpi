# [WOP-006] Pi.dev Version Pinning & Startup Logging

> 📋 **Task checkboxes migrated to `WOP-ALL-TODO.md`: Phase 4 (Pi.dev Version Pinning).** Update checkboxes there, not here.

## Problem

`pi.dev` (www.pi.dev) ships frequent updates that introduce breaking changes. Way of Pi integrates with pi.dev at **14+ points** (npm package, JSON mode event stream, binary discovery, tool delegation, extension API, agent format, session format, PI_STACK, surface mapping, etc.). Each upstream update risks breaking one or more of these without warning.

Currently:
- No startup-time version validation — if pi updates overnight, nothing catches it until runtime errors appear
- No logging of which pi version + integration points are active at startup
- `PI_VERSION_MANAGEMENT.md` exists but is not wired into any script or justfile target
- The justfile's `run-pi` target loads extensions but does not validate pi version

## Context

### Integration Points at Risk

| Point | File | Risk |
|-------|------|------|
| npm pkg | `@earendil-works/pi-coding-agent@0.74.0` | CLI interface changes |
| JSON mode | `pi-json-mode-chat.ts` parses `pi --mode json` stream | Event format breaks streaming |
| Binary discovery | `pi-binary.ts` resolves `pi` executable | Path changes |
| Tool delegation | `orchestrator-tools-exec.ts:49` | Tool interface changes |
| Extension API | `pi-loader.ts` imports `ExtensionAPI` | API type changes |
| Agent format | `agents.ts` parses `.md` agent files | Frontmatter format changes |
| Session format | `wop-session-jsonl.ts` | Log format changes |
| PI_STACK | `justfile run-pi` + `pi-loader.ts` | Extension resolution changes |
| Surface mapping | `pi-agent-runtime.ts:150` | Extension names change |

### Existing Reference

- `plans/old/productionready/reference/PI_VERSION_MANAGEMENT.md` — Documents version pinning strategy (never use `@latest`, pin exact version, commit lockfile, rollback procedure)
- `pip/.pi/docs/JUSTFILE-STARTUP-MECHANISM.md` — Documents the extension loader pattern in justfile + `pi-loader.ts`

## Architecture Plan

```
scripts/
├── pi-version-check.sh          # Checks installed pi version vs pinned version
└── pi-startup-log.sh            # Logs all pi integration point statuses

justfile targets:
├── pi-verify                    # Runs pi-version-check.sh
├── pi-log                       # Runs pi-startup-log.sh
├── run-pi-with-check            # run-pi + version check + logging
└── pi-fix-version               # Re-pins pi to the pinned version

.env:
├── PI_PINNED_VERSION=0.74.0     # The exact version we test against

Startup log output (JSONL or human-readable):
├── timestamp, pi version, pinned version, match?
├── binary resolved path, exists?
├── ExtensionAPI type importable?
├── PI_STACK loaded extensions
├── JSON mode test (--mode json --version)
└── All 14+ integration points: OK/FAIL
```

## Success Criteria

### Phase 1: Version Pin + Justfile Target (Completed)
- [x] `.env` gains `PI_PINNED_VERSION` (set to current `0.74.0`)
- [x] `scripts/pi-version-check.sh` — validates `pi --version` matches `PI_PINNED_VERSION` at startup
- [x] `just pi-verify` — runs the check
- [x] `just pi-fix-version` — runs `bun install` to restore project-local Pi
- [x] `run-pi` target runs version check before loading extensions
- [x] `package.json` pins `@earendil-works/pi-coding-agent` to exact version `0.74.0`
- [x] **Decoupling**: All WOP `pi` commands now use `node_modules/.bin/pi` and isolated `PI_CODING_AGENT_DIR=".pi/agent"`.

### Phase 2: Startup Logging
- [ ] `scripts/pi-startup-log.sh` — logs all 14+ integration point statuses
- [ ] `just pi-log` — runs the logging script
- [ ] Output written to `logs/pi-startup-<timestamp>.jsonl`
- [ ] Log includes: version match, binary path, ExtensionAPI import test, JSON mode test, PI_STACK resolution, each integration point status

### Phase 3: Integration & Verification
- [ ] `start-wayofpi.sh` runs version check + logging before launching UI
- [ ] `start-wayofpi-electron.sh` runs version check + logging before launching Electron
- [ ] Failure when version mismatch is non-fatal warning (not a hard block), logged prominently
- [ ] `bun run build` succeeds
- [ ] Both web and Electron modes start and log correctly

## Risk Mitigation

- **Non-blocking warning**: Version mismatch logs a WARNING but does not prevent startup — the system may still work with newer pi versions
- **Graceful degradation**: If pi binary isn't found at all, logging still captures that and the system can fall back to bundled/Bun chat engine
- **Test in isolation**: Start with just the script + justfile target before wiring into startup scripts
- **No behavior changes to existing code**: Only adds validation/logging around existing paths

## Affected Components

- `.env` — New `PI_PINNED_VERSION` variable
- `scripts/pi-version-check.sh` — New file
- `scripts/pi-startup-log.sh` — New file
- `justfile` — New targets: `pi-verify`, `pi-log`, `pi-fix-version`
- `start-wayofpi.sh` — Wire in version check + logging
- `start-wayofpi-electron.sh` — Wire in version check + logging
- `package.json` — Pin `@mariozechner/pi-coding-agent` to exact version
- `logs/` — New directory for startup logs (gitignored)

## Estimated Effort

M (1 session)
- Phase 1 (version pin + script): 30 min
- Phase 2 (startup logging): 30 min
- Phase 3 (integration): 30 min

## Related

- `plans/old/productionready/reference/PI_VERSION_MANAGEMENT.md` — Existing version pinning strategy doc
- `pip/.pi/docs/JUSTFILE-STARTUP-MECHANISM.md` — Existing extension loader docs
- WOP-002: Build errors (prerequisite for clean builds)
- WOP-005: App.tsx refactor

---

**Created**: 2026-05-08
**Priority**: High
**Status**: Pending
**Depends On**: None
