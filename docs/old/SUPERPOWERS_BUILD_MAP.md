# Superpowers Build Map (Skills -> Pi extensions/agents)

Source: [zerwiz/superpowers](https://github.com/zerwiz/superpowers)

This document is a practical “what we could build” mapping from the Superpowers skills/workflows concept into components you can implement in this Pi playground (this repository).

---

## 1. Superpowers in one paragraph

Superpowers is an agent workflow system built from composable “skills”. The agent detects the current phase (design → plan → implement → review → finish) and invokes the corresponding skills automatically. It emphasizes evidence, TDD (RED-GREEN-REFACTOR), and review checkpoints, often using subagent-driven development for implementation work. (See the Superpowers README in the source repo.)

---

## 2. Workflows (phases) Superpowers uses

These are the high-level phases you would implement as Pi “orchestration” logic (either as extensions, tools, or agent dispatch rules).

1. `brainstorming`
2. `using-git-worktrees`
3. `writing-plans`
4. `subagent-driven-development` / `executing-plans`
5. `test-driven-development`
6. `requesting-code-review`
7. `finishing-a-development-branch`

Implementation hint for Pi:

- Each phase should produce a machine-checkable output artifact (markdown plan, test commands, checklist, or a “ready for next phase” gate).
- Each phase boundary should be explicit so you can show the user what’s happening.

---

## 3. Skill inventory (from the Superpowers repo)

### Testing

- `test-driven-development` — RED-GREEN-REFACTOR cycle; writes failing tests first, then minimal code until green.

### Debugging / verification

- `systematic-debugging` — 4-phase root cause process (includes root-cause tracing and defense-in-depth).
- `verification-before-completion` — ensures it is actually fixed (verification gates).

### Collaboration / execution

- `brainstorming` — socratic design refinement; outputs a saved design doc.
- `writing-plans` — detailed implementation plans with file paths and test/verification steps.
- `executing-plans` — batch execution with human checkpoints (when appropriate).
- `subagent-driven-development` — dispatches fresh subagents per task with review gates.
- `dispatching-parallel-agents` — concurrent subagent workflows.
- `requesting-code-review` — reviews work against the plan/spec with severity and blocking issues.
- `receiving-code-review` — responds to feedback and iterates.
- `using-git-worktrees` — isolates work on branches/worktrees and keeps baselines clean.
- `finishing-a-development-branch` — merge/PR decision workflow, then cleanup.

### Meta

- `writing-skills` — create new skills following best practices (including testing methodology).
- `using-superpowers` — introduction / how to trigger the skill system.

---

## 4. What to build in this Pi repo (concrete components)

Below are the Pi building blocks that correspond to the Superpowers phases/skills.

### 4.1 A “Superpowers dispatcher” extension

Purpose: detect phase from conversation + decide which skill-phase to run.
You could implement:

- A slash command like `/superpowers` (or auto-trigger via keywords).
- A tool like `superpowers_phase_detect` that returns `{ phase, confidence, next_actions }`.
- A consistent “phase banner” UI so the user sees what phase is active.

### 4.2 Orchestrator extension for phase boundaries

Purpose: run the phase pipeline and ensure each phase output becomes the next phase input.
You could implement:

- A phase graph executor: `brainstorming -> plan -> implement -> test -> review -> finish`.
- Gates:
  - “Plan must include file paths + test commands”
  - “TDD must show red->green results”
  - “Review severity blocks merge”

### 4.3 Worktree / branch manager extension (mapping `using-git-worktrees`)

Purpose: create isolated worktrees/branches and keep clean baselines.
You could implement:

- Tools:
  - `sp_worktree_create`
  - `sp_worktree_cleanup`
  - `sp_worktree_status`
- Integration with existing repo layout:
  - it can run `git worktree add` and track which worktree is active.

### 4.4 Planner extension (mapping `writing-plans`)

Purpose: generate implementation plans that are precise enough to execute.
You could implement:

- A command like `/sp-plan <goal>`:
  - generates a structured plan (tasks with file paths, commands, expected results).
- A validator tool:
  - ensures every task has “where to edit” and “how to verify”.

### 4.5 Subagent execution extension (mapping `subagent-driven-development` / `executing-plans`)

Purpose: run tasks in batches or via dispatch with checkpoints.
You could implement using Pi features already in this playground:

- An orchestrator command that spawns subagent tasks using Pi subagent support (where available).
- Two-stage review per task:
  - Stage A: spec compliance review
  - Stage B: code quality / test / style review

### 4.6 TDD enforcement extension (mapping `test-driven-development`)

Purpose: ensure “tests first” and verify failures/green.
You could implement:

- Tool wrappers that enforce:
  - run tests once (expected fail)
  - write minimal code
  - rerun tests (expected pass)
- A “verification gate” that blocks moving on until tests are green.

### 4.7 Review extension (mapping `requesting-code-review` / `receiving-code-review`)

Purpose: structured review with severity and blocking rules.
You could implement:

- A code-review command that produces:
  - critical/high/medium/low
  - required changes list
  - suggested follow-ups

### 4.8 Finish/cleanup extension (mapping `finishing-a-development-branch`)

Purpose: decide what happens after tasks complete.
You could implement:

- Commands like `/sp-finish` that:
  - verify test baseline one last time
  - ask merge/PR/keep/discard
  - cleanup worktree/branch

---

## 5. Agent roles you could define (in this Pi repo)

Superpowers often benefits from “specialist personas” even if you still rely on one model provider. In Pi, these roles can be implemented as agent personas or dispatch destinations for `agent-team`.

Suggested roles:

1. `Superpowers Planner` (produces the plan + task checklist)
2. `Engineer Executor` (implements tasks)
3. `Spec Reviewer` (verifies outputs match plan)
4. `QA / TDD Runner` (enforces RED-GREEN and verification)
5. `Code Reviewer` (style + correctness + edge cases)
6. `Integrator / Finisher` (merge/PR decision + cleanup)

Implementation hint for Pi:

- Wire the roles via `agent-team` (grid/dashboard) or via a dedicated orchestrator extension.

---

## 6. Suggested minimal MVP path

If you want to build this incrementally, start with:

1. Dispatcher + phase graph (no subagents yet)
2. Planner phase output + validation gates
3. TDD verification gate (block until green)
4. Review gate (severity blocking)
5. Worktree isolation once the flow is stable

---

## 7. Related docs in this repo

- `docs/AGENT_MEMORY.md` (how chat “memory” works in Pi)
- `docs/EXTENSIONS.md` (how to build Pi extensions + shims)
- `specs/` (place to record status of what you implement)

