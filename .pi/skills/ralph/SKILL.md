---
name: ralph
description: Ralph Wiggum file-queue batch workflow for HTML tasks — todo to inprogress to done, one .txt ticket at a time, only the target HTML file may be created or edited. Use when working through todo/inprogress/done folders or when the user says Ralph, Ralph Wiggum, batch HTML, or ticket queue.
allowed-tools: read write edit bash grep find ls
---

# Ralph Wiggum (queue worker)

Repeatable checklist for **one task per turn**. Works in the **current working directory** where **`todo/`**, **`inprogress/`**, and **`done/`** live.

## Setup

- Ensure three folders exist: **`todo/`**, **`inprogress/`**, **`done/`** (the **ralph** extension creates them on session start if missing).
- Each ticket is a **`.txt`** file in **`todo/`** containing instructions to produce **one HTML file** at an explicit path.

## Steps (single task — do not batch)

1. **Queue check** — Call tool **`ralph_queue_status`** or list **`todo/*.txt`**. If **`todo/`** has no `.txt` files, reply **`COMPLETE`** and stop.
2. **Claim** — Choose **one** file in **`todo/`**. Move it immediately:
   ```bash
   mv todo/<that-file>.txt inprogress/
   ```
3. **Read** — Read **`inprogress/<that-file>.txt`** and follow it **exactly** (output path, content requirements).
4. **Write** — Create or update **only** the **one HTML file** the ticket names. **Do not** edit unrelated files, configs, or other HTML unless the ticket explicitly requires it.
5. **Finish** — Move the ticket to done:
   ```bash
   mv inprogress/<that-file>.txt done/
   ```

## Rules

- **One ticket per response cycle** unless the user explicitly asks for more.
- **No secrets** from tickets into logs; redact if needed.
- If **`inprogress/`** already holds a `.txt`, either complete that ticket first or ask the user (stale run).

## Delegation (agent-team)

Team **`ralph`** in **`.pi/agents/teams.yaml`** includes **`ralph`**, **`scout`**, **`planner`**, **`builder`**, **`reviewer`**, **`code-documenter`**, **`documenter`**.

- **Dispatcher** (primary in **`agent-team`**): For each HTML ticket, usually **`dispatch_agent` `ralph`**. If the task needs exploration, planning, or extra implementation beyond one HTML file, **`dispatch_agent` `scout`**, **`planner`**, or **`builder`** as needed, then **`ralph`** with a clear handoff. **`planner`** writes **`plans/PLAN-*.md`**—pass that path to **`builder`** or **`ralph`** in the task text. For post-build review, **`dispatch_agent` `reviewer`** with a narrow task (single file path). For **doc comments / TSDoc / code-adjacent `.md`** only (no logic edits), **`dispatch_agent` `code-documenter`** with source paths. For **README / `docs/` guides / prose drift**, **`dispatch_agent` `documenter`** with explicit paths: **`read`** current docs, reconcile with code, then **`edit`**/**`write`**.
- **Ralph Wiggum** (headless Pi specialist, no **`dispatch_agent`**): If you are blocked, output **`RALPH_ESCALATE`** (see **`ralph` agent** `.md`) so the dispatcher can run another agent and retry.

## Pi helpers

- **Skill:** `/skill:ralph` (this file).
- **Agent:** **`ralph`** — same constraints; orchestration via **`dispatch_agent`** from the dispatcher.
- **Commands:** `/ralph prompt` injects the one-task system message; `/ralph status` shows counts.

## External loop (optional)

To process many tickets unattended, run **Pi** repeatedly from the same cwd (or a host script), each time consuming one ticket—**do not** use `bypassPermissions`-style blind automation unless the user accepts the risk.
