---
name: find-skills
description: Audit whether a new skill is needed, discover and validate ecosystem skills (skills.sh, npx skills), then implement them into the repo (.pi/skills/) and docs. Use for recurring workflows, "find a skill for X", or extending Pi with vetted packages.
allowed-tools: read write edit bash grep find ls
---

# Find, validate, and implement skills

You **proactively** help determine if a **skill** is the right tool (vs one-off answers), **find** candidates in the open ecosystem, **validate** quality and fit, and **implement** approved skills so Pi can load them—not only suggest install commands.

## When to use this skill

- User asks for capabilities that might exist as a **published skill** (or wants “the best practice” workflow for a domain)
- Same class of task **recurs** and would benefit from a **repeatable** packaged workflow
- User says **find / install / add a skill** for X
- You notice you are **repeating long ad-hoc instructions** where a skill would be safer and clearer

## Phase 0 — Audit this repo before anything else

**Goal:** Avoid duplicate skills and avoid unnecessary installs.

1. **List project skills** — scan **`.pi/skills/`** (each subfolder should contain `SKILL.md`).
2. **Read frontmatter** — for each skill, note `name` and `description` (use **`read`**; do not load entire large bodies unless needed).
3. **Decide:**
   - **Already covered** → Tell the user which existing **`/skill:<name>`** fits; offer to refine that skill instead of installing new.
   - **Partially covered** → Propose extending an existing `SKILL.md` rather than adding a second package.
   - **Gap** → Proceed to Phase 1.

Also quick-check **`~/.agents/skills/`** (and **`~/.pi/agent/skills/`** if present) for a **`name`** that already satisfies the need globally—then recommend **`/skill:<name>`** without copying into the repo unless the user wants the project pinned.

## Phase 1 — Do we need a *new* skill?

Recommend a **new** (or newly imported) skill only if **several** of these hold:

| Criterion | Question |
|-----------|----------|
| **Repeatability** | Will this workflow run again in similar form? |
| **Stability** | Is the approach stable enough to document as steps (not churn every week)? |
| **Safety** | Is it safer as explicit instructions than ad-hoc improvisation (deploy, auth, deletes)? |
| **Scope** | Is it bigger than a single chat answer but smaller than a full app feature? |

If **no** — solve the task directly without a new skill, or add a short section to an existing skill / **`docs/`** note.

## Phase 2 — Discover candidates

1. **Leaderboard / directory** — Check **[skills.sh](https://skills.sh/)** for the domain (installs, maintainer, audit hints).
2. **CLI search** (non-interactive where possible):

```bash
npx skills find "<specific keywords>"
```

Use **concrete** queries (`playwright e2e smoke`, not `testing`). Try synonyms if empty.

## Phase 3 — Validate (mandatory before implement)

Do **not** implement based on title alone.

1. **Fit** — Does the skill’s stated purpose match the user’s **task and stack**?
2. **Trust** — Prefer known maintainers and higher adoption when metrics exist; **flag** unknown authors or very low usage.
3. **Risk** — Note skills.sh / CLI **security hints** (e.g. Snyk). Call out **Med/High** risk and let the user **confirm** before install.
4. **Maintenance** — Skim repo or skills.sh page: last activity, issue tone, whether it’s a thin wrapper.

Present **1–3 options** with: **name**, **one-line value**, **install identifier**, **link**, **risk caveats**, and **your recommendation**.

## Phase 4 — Implement in the Pi playground repo

**Goal:** Skill is loadable under **`.pi/skills/<name>/SKILL.md`** with **`name`** matching the folder, and the inventory stays honest.

### 4.1 Install or obtain files

Pick one path (prefer project-local for team repos):

**A) Skills CLI (from repo root)**

```bash
cd /path/to/project/root
npx skills add "<https://github.com/owner/repo>" --skill "<skill-subpath-or-name>" -y
```

Use **project** scope when the CLI offers it so files land under the repo. If the CLI only offers **global**, files may appear under **`~/.agents/skills/<name>/`** — then use **B**.

**B) Copy from global install**

If the skill already exists at **`~/.agents/skills/<name>/`** (or **`~/.pi/agent/skills/`**):

1. Create **`.pi/skills/<name>/`** in the project (`<name>` must match frontmatter **`name`** in `SKILL.md`).
2. Copy **`SKILL.md`** and any **`scripts/`**, **`references/`**, or assets the skill relies on (preserve relative paths).

Use **`bash`** (`cp -r` or `rsync`) or **`read`** + **`write`** for small files—keep tree intact.

### 4.2 Normalize for Pi

1. Open **`SKILL.md`** — ensure YAML frontmatter includes at least **`name`**, **`description`** ([spec](https://agentskills.io/specification)); add **`allowed-tools`** if the workflow needs it (match Pi tool names).
2. Folder name **must equal** frontmatter **`name`**.
3. Fix **broken links** or paths that assumed a different install root.

### 4.3 Update documentation (this playground)

When the skill is **new to this repository**:

1. Add a row to **`docs/SKILLS.md`** → “Skills in this repository” table (path: **`.pi/skills/<name>/SKILL.md`**, one-line summary).
2. If the skill is user-facing, add a short subsection to **`docs/HOW_TO_USE_SKILLS.md`** (when to use, **`/skill:<name>`** example).

Do **not** duplicate long READMEs; link to **`docs/SKILLS.md`**.

### 4.4 Handoff

Tell the user:

- **`/reload`** in Pi (or restart) so discovery picks up the new skill
- **`/skill:<name>`** to invoke
- If they decline doc updates, still implement under **`.pi/skills/`** but say the **inventory is stale** until they update docs

## Phase 5 — After implementation

1. **`read`** the installed **`SKILL.md`** once more (sanity check).
2. Confirm **`grep`** / list shows the folder under **`.pi/skills/`**.
3. If **`npx skills`** had no project target, confirm whether **`.gitignore`** should exclude vendor blobs (usually **commit** skill `.md` and small assets; **don’t** commit secrets).

## If nothing fits

- State clearly that **no suitable skill** was found after search + validation
- Offer **direct help** with the task
- Offer **`npx skills init`** or authoring a **minimal** **`.pi/skills/<name>/SKILL.md`** from scratch (follow **`docs/SKILLS.md`**)

## Skills CLI reference

| Command | Purpose |
|--------|---------|
| `npx skills find [query]` | Search by keyword |
| `npx skills add <package>` | Install (use `--skill` when repo has multiple skills) |
| `npx skills check` / `update` | Maintenance |

Browse: [skills.sh](https://skills.sh/)

## Category hints (search queries)

| Category | Example queries |
|----------|-----------------|
| Web | `react`, `nextjs`, `typescript`, `tailwind` |
| Testing | `jest`, `playwright`, `e2e` |
| DevOps | `docker`, `kubernetes`, `ci` |
| Docs | `readme`, `changelog`, `api` |
| Quality | `review`, `lint`, `refactor` |
| Design / a11y | `ui`, `design-system`, `accessibility` |
