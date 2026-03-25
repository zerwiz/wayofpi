# Pi project documentation (`projects/`)

Full playground layout (including **`projects/_template/`**): **[../docs/REPO_INDEX.md](../docs/REPO_INDEX.md)**.

**Agent:** **`project-scanner`** (`.pi/agents/project-scanner.md`) scans the **target workspace** and writes fills under **`/home/zerwiz/.pi/projects/<slug>/`**. Team **`new-project`** in **`teams.yaml`** is scanner-only; **`info`** / **`full`** also include the scanner. Primary agent should pass the codebase **absolute path** when dispatching.

This directory is the **canonical place** for documentation about **work Pi is doing on a specific codebase or effort**. Agents and humans should **create or update** these files when work spans more than a single chat, when assumptions change, or when handoff matters.

---

## 1. When to use

- Starting sustained work on a repo or subfolder (feature, migration, investigation).
- Capturing **constraints**, **URLs**, **commands**, and **open questions** the model should not forget.
- Recording **decisions** (ADRs-lite) so future sessions do not re-litigate.

Do **not** duplicate the whole repo README here—link to it. Use `projects/` for **session-relevant** and **agent-relevant** context.

---

## 2. Folder layout

Each **project** is a **slug directory** under `projects/`:

```text
projects/
├── README.md                 ← This file (rules + layout)
├── _template/                ← Copy to start a new project folder
│   ├── README.md
│   ├── 00-OVERVIEW.md
│   ├── 01-CONTEXT.md
│   ├── 02-DECISIONS.md
│   ├── 03-NOTES.md
│   └── 04-TASKS.md
└── <slug>/                   ← One folder per project (see naming below)
    ├── README.md             ← Index: goal, links, last updated
    ├── 00-OVERVIEW.md        ← What this effort is (1–2 screens)
    ├── 01-CONTEXT.md         ← Paths, stack, env, how to run/build/test
    ├── 02-DECISIONS.md       ← Dated decisions + rationale
    ├── 03-NOTES.md           ← Freeform log / scratch
    ├── 04-TASKS.md           ← Checklist / next steps (optional)
    └── attachments/        ← Optional: pasted snippets, exports (no secrets)
```

### 2.1 Slug naming (`<slug>`)

Prefer a **short, stable** id derived from the work:

- Repo: `my-app`, `pi-playground`
- Path-based: `codep-ona`, `home-dot-pi` (replace `/` and odd chars with `-`)
- Feature: `auth-migration-2026`

Use **lowercase**, **hyphens**, no spaces.

---

## 3. File purposes (quick reference)

| File | Purpose |
|------|---------|
| **`README.md`** | Entry point: goal, owner, links to repo root README, **last updated** date. |
| **`00-OVERVIEW.md`** | Problem statement, scope, non-goals, success criteria. |
| **`01-CONTEXT.md`** | Tech stack, important paths, env vars, commands (`bun`, `just`, `pi -e …`), ports. |
| **`02-DECISIONS.md`** | `YYYY-MM-DD` entries: decision, alternatives, why. |
| **`03-NOTES.md`** | Discoveries, meeting notes, copy-paste from tools (redact secrets). |
| **`04-TASKS.md`** | Ordered tasks, blockers, done items (optional). |
| **`attachments/`** | Large excerpts, diagrams description, exports—**never** commit API keys or `.env`. |

---

## 4. Agent behavior (summary)

1. **Create** `projects/<slug>/` from `_template/` when beginning non-trivial project work.
2. **Update** `01-CONTEXT.md` when run commands, paths, or stack facts change.
3. **Append** `02-DECISIONS.md` when choosing between real alternatives.
4. **Refresh** `README.md` “Last updated” when making substantive edits.

Full rule: **`.cursor/rules/pi-projects-docs.mdc`**.

---

## 5. Git and privacy

- Prefer **not** to store secrets in `projects/`; use placeholders and local-only files if needed.
- Teams may **gitignore** `projects/*/attachments/` if those files are sensitive—add a line in root `.gitignore` only if you adopt that convention.

---

## 6. Related docs

- **[../docs/AGENTS.md](../docs/AGENTS.md)** — Agent definitions and orchestration.
- **[../docs/SYSTEM.md](../docs/SYSTEM.md)** — Repo context and conduct.
- **[../docs/AGENT_MEMORY.md](../docs/AGENT_MEMORY.md)** — Chat memory vs files on disk.
