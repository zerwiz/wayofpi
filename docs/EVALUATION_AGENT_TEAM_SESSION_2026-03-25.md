# Evaluation: agent-team session (2026-03-25)

**Pi version:** v0.62.0  
**Context:** Interactive session using **Team: full** (dispatcher + specialists). Session id prefix **`auto-47d3ac70`** — auto-saved JSONL under **`.pi/storage/sessions/`** (not the repo root).

This document summarizes **what worked**, **what failed or partially worked**, and **root causes** from the transcript and a **filesystem check** on this repo.

---

## 1. What worked

| Area | Observation |
|------|-------------|
| **Agent-team UI** | Team roster, `/agents-*` commands, grid/thinking controls, session saver paths were visible and usable. |
| **`dispatch_agent hermes`** | Completed (~26s). Hermes CLI ran; the assistant relayed an introduction and capabilities. |
| **`dispatch_agent scout`** | Completed multiple times. Scout reported cwd as the **playground repo** and described read capabilities in principle. |
| **`dispatch_agent code-documenter` / `documenter`** | Tools reported success (~15s / ~31s). *See §3 — output files were not verified on disk by the dispatcher.* |
| **`dispatch_agent reviewer`** | Completed when invoked for a review-style task. |
| **Session saver** | Auto-save to `storage/.../sessions` with predictable filenames. |
| **Extensions / skills** | Rich stack loaded: `agent-team`, `minimal`, `session-*`, external packages, `tmustier/pi-extensions`, etc. |

---

## 2. What did not work or degraded UX

| Issue | Symptom | Likely cause |
|-------|---------|----------------|
| **`files-widget` error** | Startup error: requires **`bat`**, **`glow`** (message suggested `brew install` — macOS-oriented). | Extension dependency not satisfied on Linux; or optional widget should degrade gracefully. |
| **Missing `docs/codereadme.md`** | Assistant claimed **`docs/codereadme.md`** was written; user could not find it. | **No such file** exists in repo under `docs/` (verified 2026-03-26). Subagent or dispatcher **asserted** a path without verifying with **`read`** / **`ls`** after the run. |
| **Invalid `dispatch_agent` target** | `dispatch_agent read` failed immediately (0s). `read` is a **tool**, not an agent name. | Model confusion between **built-in tools** and **agent roster**. |
| **Scout outputs sometimes thin** | Repeated `dispatch_agent scout` for “list docs/” did not always surface a clean `ls`-style listing in the transcript. | Scout may answer generically; **dispatcher** should use its own **`read`**/**`bash`** or **`dispatch_agent`** with a task that forces raw paths. |
| **Role mix-up** | User asked “code reviewer” + documenter together; narrative mixed **Reviewer** vs **code-documenter**. | Personas overlap in user language; need explicit **agent names** + **output paths** in tasks. |
| **Session file path** | User asked to read `auto-47d3ac70-assistant-....json` from repo root; real files live under **`.pi/storage/sessions/`**. | Path confusion; **exact path** is `~/.pi/.pi/storage/sessions/<filename>.json` for this layout. |

---

## 3. Verification (this repo, after the session)

- **`docs/`** (in the playground checkout) contains standard guides (**`REPO_INDEX.md`**, **`TOOLS.md`**, **`AGENTS.md`**, …) — **17 files**; **no** `codereadme.md` and **no** `grep` hits for `codereadme` in the workspace.
- Conclusion: the **“code documentation file”** described in chat was **not** persisted as named, or was **never written** despite the success UI.

---

## 4. Recommendations

1. **After any specialist claims `write`/`edit`:** the **dispatcher** (main session) should **`read`** the path or run **`ls`** on the parent directory and **confirm** before telling the user “done.”
2. **Use explicit output contracts in tasks:** e.g. “Write **`docs/CODE_OVERVIEW.md`** and end with the absolute path.”
3. **Use agent names from `teams.yaml`:** `code-documenter`, `reviewer`, `documenter` — not “read” or “code reviewer” as a dispatch target.
4. **For durable tree maps:** `dispatch_agent indexer` (or **`/skill:indexer`**) to produce **`INDEX.md`** at the repo root — purpose-built for “map of the project.”
5. **Linux / `files-widget`:** install **`bat`** and **`glow`** via distro packages or disable the extension until deps exist; avoid assuming Homebrew-only hints.
6. **Finding session JSONL:** look under **`.pi/storage/sessions/`** (and check **`settings.json`** / Pi docs if your install differs).

---

## 5. Summary

**Strengths:** Hermes and scout dispatches completed; agent-team orchestration and session saving behaved as expected.  
**Main weakness:** **Unverified** claims about files created under **`docs/`**, plus one **invalid** `dispatch_agent` call, which eroded trust and wasted follow-up turns.  

**Rule of thumb:** Treat subagent “success” as **pending** until the main agent **reads the artifact** or lists the directory.
