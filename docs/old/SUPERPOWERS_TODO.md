# Superpowers Build TODO (Pi repo)

This TODO is derived from `docs/SUPERPOWERS_BUILD_MAP.md` and specifically covers **Section 4. What to build in this Pi repo (concrete components)**.

## Conventions

- **Goal:** implement a usable MVP that can run a Superpowers-like phased workflow inside Pi.
- **Order matters:** build the dispatcher first, then the phase orchestrator, then per-phase artifacts and gates.
- **Checkpoints:** every phase should output a concrete artifact the next phase can validate.

---

## 0. MVP definition (dependencies for all work)

- [ ] Decide trigger: keyword/command (e.g. `/superpowers`) vs automatic phase detection.
- [ ] Decide artifact format: markdown sections with required headings + JSON summary (optional).
- [ ] Decide “blocking” gates: which phases must not advance until validated.

---

## 1. Dispatcher (Phase entry)

- [ ] Implement `superpowers` dispatcher extension/command:
  - [ ] Determine phase intent from user message or allow user selection
  - [ ] Route to phase handlers
  - [ ] Provide consistent UI (phase banner + “next action”)

**Deliverable:** one command that starts the workflow and can run at least one phase end-to-end.

---

## 2. Phase orchestrator (phase graph)

- [ ] Implement phase orchestrator with explicit graph:
  - `brainstorming -> writing-plans -> implement -> test -> review -> finish`
- [ ] Ensure each phase emits a required artifact:
  - [ ] brainstorming: design draft + questions/assumptions
  - [ ] writing-plans: tasks list with file paths + verification steps
  - [ ] implement: code changes + notes of deviations
  - [ ] test: test run + results
  - [ ] review: severity issues + required changes
  - [ ] finish: final decision + cleanup plan

**Deliverable:** a single run can advance across at least 3 phases in the correct order.

---

## 3. Worktrees / branch manager (isolation)

- [ ] Implement worktree/branch manager tools:
  - [ ] create worktree / branch
  - [ ] list active worktrees
  - [ ] switch worktree
  - [ ] cleanup worktree/branch
- [ ] Wire worktree selection into the orchestrator.

**Deliverable:** implementation work happens in an isolated branch/worktree.

---

## 4. Planner phase (`/sp-plan`)

- [ ] Implement `/sp-plan <goal>`:
  - [ ] outputs structured tasks
  - [ ] each task includes:
    - file paths
    - expected edits
    - verification steps (tests/commands)
    - acceptance criteria
- [ ] Validate plan schema before moving to execution.

**Deliverable:** plan is consistent and machine-parseable enough to drive execution.

---

## 5. Execution phase (plans + checkpoints / subagents)

- [ ] Implement executing plans:
  - [ ] MVP mode: single-agent loop per task with “ready for review” checkpoints
  - [ ] (optional later) subagent-driven execution if your Pi stack supports it
- [ ] Ensure the output of each task is reviewable:
  - [ ] diff summary
  - [ ] test output excerpt (or instructions to rerun)
  - [ ] task status: complete / blocked / needs changes

**Deliverable:** tasks can be run with checkpoints, not just “fire and forget”.

---

## 6. TDD gate

- [ ] Implement a TDD gate that enforces:
  - [ ] red: write failing test first (or locate failing baseline)
  - [ ] green: minimal code to pass
  - [ ] refactor: optional cleanup after green
- [ ] Block phase advancement until tests are green.

**Deliverable:** tests gate is a hard requirement for “move to review/finish”.

---

## 7. Review gate (severity + blocking issues)

- [ ] Implement structured code review:
  - [ ] classify issues by severity (critical/high/medium/low)
  - [ ] mark blocking issues that must be fixed before continuing
  - [ ] require “required changes list” in the review artifact
- [ ] Gate the orchestrator on “blocking issues = zero”.

**Deliverable:** review produces a definitive accept/reject outcome.

---

## 8. Finisher / cleanup

- [ ] Implement finisher:
  - [ ] final verification (tests + key checks)
  - [ ] ask user decision: merge / PR / keep / discard
  - [ ] cleanup worktree/branch according to decision

**Deliverable:** workflow ends cleanly and leaves a consistent repo state.

---

## 9. UI + UX polish

- [ ] Add phase banner/status:
  - [ ] current phase name
  - [ ] what the user should do next (approve, confirm, provide input)
  - [ ] artifact location / summary
- [ ] Ensure tools are registered at top-level in extensions (avoid missing registrations).

---

## 10. Agent roles / personas (optional but recommended)

- [ ] Define specialist roles:
  - Planner
  - Engineer executor
  - Spec reviewer
  - QA / TDD runner
  - Code reviewer
  - Integrator / finisher
- [x] Wire roles via `agent-team` or dispatch targets (baseline: `agent-team` has **team_*** tools + `/agents-preset-*` for saved rosters; see `extensions/agent-team.ts`).

**Deliverable:** roles can be used to improve quality without rewriting everything.

---

## 11. End-to-end MVP wire-up

- [ ] Implement full run path:
  - [ ] pick phase or start at brainstorming
  - [ ] produce artifacts
  - [ ] wait for user approval
  - [ ] continue
- [ ] Add a minimal demo script (or instructions) that proves it works.

---

## 12. Documentation status updates

- [ ] Add implementation status notes under `specs/`
- [ ] Update `docs/SUPERPOWERS_BUILD_MAP.md` with what’s implemented vs planned

