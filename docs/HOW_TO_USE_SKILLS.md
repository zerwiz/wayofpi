## How to use skills in this Pi playground

This guide is for **using** skills, not authoring them. For the full spec and layout, keep **`SKILLS.md`** open; this file focuses on **“which skill do I call and how?”**.

---

## 1. What is a skill (in practice)?

- A **skill** is a **named workflow** stored as `.pi/skills/<name>/SKILL.md`.
- Pi summarizes each skill’s **`name`** + **`description`** into the system prompt so the model knows **when** it’s appropriate.
- When a task fits, you (or the model) can:
  - Run **`/skill:<name>`** to pull in the full instructions, or
  - Ask in natural language “Follow the `<name>` skill for this.”

Skills are **not** TypeScript extensions and **not** agents:

- **Extensions** add tools, hooks, TUI.  
- **Agents** are personas (`.md`) that become system prompts.  
- **Skills** are *workflows* the model can choose to follow.

---

## 2. Project skills you can use

These live under **`.pi/skills/`** in this repo.

### 2.1 `bowser` — headless browser / Playwright

- **Use when**: you need to browse a website, click through flows, or take screenshots using **Playwright CLI**.
- **Typical tasks**:
  - “Open this URL and capture a screenshot.”
  - “Walk through the login flow and report failures.”
- **How to call**:
  - Slash command:
    ```text
    /skill:bowser open https://example.com and snapshot
    ```
  - Or: “Use the **bowser** skill to explore `<url>`.”

### 2.2 `github` — branches / worktrees / parallel agents

- **Use when**: you’re working against a **GitHub repo** and want:
  - Dedicated branches per task.
  - **`git worktree`** per agent or sub-session.
- **Typical tasks**:
  - “Set up a new branch/worktree for feature X and route agents there.”
  - “Prepare a clean worktree for refactor Y.”
- **How to call**:
  - Slash command:
    ```text
    /skill:github
    /skill:github prepare branch feature/awesome-thing
    ```
  - Or: “Follow the **github** skill to create a worktree and branch for this task.”

### 2.3 `indexer` — generate an `INDEX.md` map

- **Use when**: you need a **human-readable map** of a project directory.
- **Artifacts**:
  - Writes **`INDEX.md`** at a path you choose (tree view + per-file purpose).
- **How to call**:
  - Slash command:
    ```text
    /skill:indexer
    /skill:indexer index ./systems/frontend
    ```
  - Or: “Use the **indexer** skill to write an INDEX.md for `<path>`.”

### 2.4 `find-skills` — audit, discover, validate, implement

- **Use when**: you want to know if a **new skill** is justified, **search** the ecosystem, **validate** trust/risk, and **drop the skill into** **`.pi/skills/<name>/`** (plus update **`docs/SKILLS.md`** when adding to this repo).
- **Typical tasks**:
  - Compare the request against existing **`.pi/skills/`** so you don’t duplicate **`/skill:<name>`** coverage.
  - Run `npx skills find "<query>"` (and skills.sh) then implement the chosen package or copy from **`~/.agents/skills/`** into **`.pi/skills/`**.
- **How to call**:
  - Slash command:
    ```text
    /skill:find-skills
    /skill:find-skills find something for playwright e2e smoke tests
    ```
  - Or: “Use the **find-skills** skill to search for a changelog / PR review skill.”

### 2.5 `ralph` — Ralph queue helper

- **Use when**: you want help running the **Ralph ticket queue** workflow.
- **Typical usage**:
  - Explain how to format tickets (`todo/`, `inprogress/`, `done/`).
  - Show how to use `/ralph status`, `/ralph prompt`, and `ralph_queue_status`.
- **How to call**:
  - Slash command:
    ```text
    /skill:ralph
    /skill:ralph help me set up tickets for feature-x
    ```
  - Or: “Follow the **ralph** skill to configure the queue for this repo.”

---

## 3. How to run a skill

There are three main ways to *use* a skill.

### 3.1 Slash command `/skill:<name>`

- Syntax:
  ```text
  /skill:<name> [optional free-text task]
  ```
- Examples:
  ```text
  /skill:bowser
  /skill:bowser open https://example.com and snapshot

  /skill:github prepare branch feature/ralph-supervisor
  /skill:indexer index ./systems/auth-service
  /skill:ralph prepare tickets for feature-x
  /skill:find-skills search for nextjs performance skills
  ```
- Requirements:
  - **`enableSkillCommands`** must be `true` in settings:
    ```json
    {
      "enableSkillCommands": true
    }
    ```

### 3.2 Natural language trigger

- Mention the skill **by name** and what you want:
  - “Use the **bowser** skill to test the deployed app at `<url>`.”
  - “Follow the **indexer** skill to scan `src/` and write `INDEX.md`.”
  - “Use the **github** skill to set up a branch and worktree.”
- This nudges the model to:
  - `read` the right `SKILL.md`.
  - Follow the steps (including shell commands) using normal tools.

### 3.3 Direct `read` (for you / debugging)

- You can always open a skill file to see exactly what it will do:
  ```bash
  pi
  # inside Pi:
  read .pi/skills/indexer/SKILL.md
  ```
- Use this when:
  - You want to verify shell commands / safety.
  - You want to follow the skill manually as a human.

---

## 4. Example skill workflows

### 4.1 Scan a codebase and map it

1. In Pi, cd to your target project (or set cwd via `pi-e` stack).
2. Run:
   ```text
   /skill:indexer index .
   ```
3. The indexer skill will:
   - Inspect the tree.
   - Write an `INDEX.md` summarizing layout and per-file roles.
4. You (or other agents) can then read `INDEX.md` for faster navigation.

### 4.2 Use bowser + agents to debug a web flow

1. Start Pi with a stack that includes both **`bowser`** (skill) and an **agent-team** preset (e.g. **full**).
2. In chat:
   ```text
   /skill:bowser open https://your-app/login and snapshot
   ```
3. Have **`scout`** or **`builder`** read the bowser output and adjust frontend/backend code accordingly.

### 4.3 Prepare a GitHub worktree for a feature

1. From the repo root:
   ```text
   /skill:github prepare branch feature/awesome-thing
   ```
2. Follow the skill’s instructions to:
   - Create branch.
   - Add `git worktree` for that branch.
3. Point further Pi sessions (or agent-team subprocesses) at the new worktree path.

---

## 5. Quick “which skill should I reach for?”

- “**Drive a browser / take screenshots**” → **`bowser`**
- “**Set up branches and worktrees for multiple agents**” → **`github`**
- “**Build a human-readable map of this project**” → **`indexer`**
- “**Configure and operate the Ralph ticket queue**” → **`ralph`**

For deeper details (discovery paths, authoring, troubleshooting), use **`SKILLS.md`** alongside this quick-use guide.

