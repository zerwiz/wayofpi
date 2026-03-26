# Skills in Pi — how they work and how to use them

**Skills** are **on-disk workflow packages**: mostly a **`SKILL.md`** file (YAML frontmatter + instructions). Pi discovers them at startup, puts **short summaries** into the system prompt, and the model **loads the full file when needed** (usually via the **`read`** tool or a slash command). They are **not** TypeScript extensions and **not** agent persona files.

| Mechanism | What it is | Typical path in this repo |
|-----------|------------|---------------------------|
| **Skill** | Markdown instructions + optional scripts/assets | `.pi/skills/<name>/SKILL.md` |
| **Extension** | `.ts` code: tools, hooks, TUI | `extensions/*.ts` + `.pi/extensions/` shims |
| **Agent** | Persona `.md` for dispatch / `/system` | `.pi/agents/*.md` |

Full comparison including **tools**: **[CONCEPTS.md](CONCEPTS.md)**. Tool-focused guide: **[TOOLS.md](TOOLS.md)**.

For **memory vs skills**, see **[AGENT_MEMORY.md](AGENT_MEMORY.md)** §7. Upstream reference: [Pi skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) and the [Agent Skills specification](https://agentskills.io/specification).

---

## Skills in this repository (`.pi/skills/`)

| `name` | Path | Summary |
| ------ | ---- | ------- |
| **bowser** | [`.pi/skills/bowser/SKILL.md`](../.pi/skills/bowser/SKILL.md) | Playwright CLI — headless browsing, sessions, screenshots, scraping (`allowed-tools: Bash`). |
| **find-skills** | [`.pi/skills/find-skills/SKILL.md`](../.pi/skills/find-skills/SKILL.md) | Audit gaps vs **`.pi/skills/`**, **find + validate** on **[skills.sh](https://skills.sh/)** / **`npx skills`**, then **implement** into **`.pi/skills/`** and update **`docs/SKILLS.md`**. |
| **github** | [`.pi/skills/github/SKILL.md`](../.pi/skills/github/SKILL.md) | **GitHub** remotes, **branches**, **`git worktree`** — parallel agents each in their own path on the same repo. |
| **indexer** | [`.pi/skills/indexer/SKILL.md`](../.pi/skills/indexer/SKILL.md) | Build **`INDEX.md`**: folder map + what each important file does (handoff for other agents). |
| **ralph** | [`.pi/skills/ralph/SKILL.md`](../.pi/skills/ralph/SKILL.md) | **Ralph** queue: `todo/` → `inprogress/` → `done/`, one HTML file per `.txt` ticket; delegation via agent-team. |

Add a folder **`.pi/skills/<name>/SKILL.md`** (frontmatter **`name`** must match the directory) to register another skill. Pi also loads skills from packages and global paths (§2).

---

## 1. How skills work (progressive disclosure)

1. **Discovery** — Pi scans the skill locations (see §2) and collects each skill’s **`name`** and **`description`** from frontmatter.
2. **Prompt** — Available skills are summarized for the model (per the [integrate-skills](https://agentskills.io/integrate-skills) shape used by Pi). **Only metadata** stays in context by default—not the entire `SKILL.md`.
3. **On demand** — When the task fits, the model should **`read`** the skill’s `SKILL.md` and follow it. Models do not always do this automatically; you can **name the skill in your message** or use **`/skill:name`** (see §3).
4. **Assets** — Instructions may point to **`scripts/`**, **`references/`**, or other files **relative to the skill directory**; the model opens those files as needed.

Skills **do not** register new Pi tools by themselves. If a skill says “run this bash,” that uses normal Pi tools (e.g. **Bash**) like any other instruction—which is why you should **review skill content** before use (same warning as upstream).

---

## 2. Where Pi loads skills from

Pi merges skills from several places (first wins on **name collisions**, with a warning). Common locations:

| Scope | Paths |
|-------|--------|
| **Global** | `~/.pi/agent/skills/`, `~/.agents/skills/` |
| **Project** | **`.pi/skills/`** (primary in this playground), `.agents/skills/` under **cwd** and **parent dirs** up to the git repo root (or filesystem root if not in a repo) |
| **Packages** | `skills/` in packages or `pi.skills` in `package.json` |
| **Settings** | `skills` array in **`settings.json`** (files or directories) |
| **CLI** | `pi --skill <path>` (repeatable; still applies if you pass `--no-skills` for discovery) |

**Discovery shape:**

- `.md` files **directly** in a skills root, and  
- **`SKILL.md`** files **anywhere under** a skills tree (recursive).

Disable automatic discovery with **`--no-skills`** (explicit `--skill` paths can still load).

**This repo** includes project skills such as **[`.pi/skills/bowser/SKILL.md`](../.pi/skills/bowser/SKILL.md)** (`bowser`), **[`.pi/skills/find-skills/SKILL.md`](../.pi/skills/find-skills/SKILL.md)** (`find-skills`), **[`.pi/skills/github/SKILL.md`](../.pi/skills/github/SKILL.md)** (`github`), **[`.pi/skills/indexer/SKILL.md`](../.pi/skills/indexer/SKILL.md)** (`indexer`), and **[`.pi/skills/ralph/SKILL.md`](../.pi/skills/ralph/SKILL.md)** (`ralph`).

### 2.1 Skills from Claude / Codex / Gemini layouts

You can point **`settings.json`** `skills` at other trees, e.g.:

```json
{
  "skills": ["~/.claude/skills", "../.claude/skills"]
}
```

With the **`cross-agent`** extension enabled, Pi also **scans** project and home **`.claude/`**, **`.gemini/`**, **`.codex/`** for `skills/` and registers matching slash commands (see §3 and **`extensions/cross-agent.ts`**).

---

## 3. How to use skills (you and the model)

### 3.1 Slash command: `/skill:<name>`

Loads and runs the skill by injecting its content into the flow (exact behavior follows your Pi version). Optional arguments are appended as a user task line.

```text
/skill:bowser
/skill:bowser open https://example.com and snapshot
```

If commands do not appear, check **`enableSkillCommands`** in **`/settings`** or in **`settings.json`**:

```json
{
  "enableSkillCommands": true
}
```

### 3.2 Natural language

Ask for the workflow explicitly, e.g. “Follow the **bowser** skill for this URL” or “Use the PDF skill’s setup steps.” That nudges the model to **`read`** the right `SKILL.md`.

### 3.3 Direct read

You (or the agent) can open **`SKILL.md`** with the editor or **`read`** tool using the path under **`.pi/skills/<name>/SKILL.md`**—useful for debugging or forcing a specific workflow.

---

## 4. Authoring a new skill

### 4.1 Layout

```text
.pi/skills/my-skill/
├── SKILL.md           # required
├── scripts/           # optional helpers
├── references/        # optional deep docs
└── assets/            # optional templates, etc.
```

### 4.2 `SKILL.md` frontmatter (required fields)

Per the [Agent Skills spec](https://agentskills.io/specification#frontmatter-required):

| Field | Required | Notes |
|-------|----------|--------|
| **`name`** | Yes | Lowercase `a-z`, digits, hyphens; **must match the parent folder name**; max 64 chars |
| **`description`** | Yes | Max 1024 chars. **This is the main trigger**—be specific about *when* to use the skill (tools, file types, scenarios). Skills **without** a description are **not** loaded. |

Optional fields Pi may honor include **`license`**, **`compatibility`**, **`metadata`**, **`allowed-tools`** (experimental), **`disable-model-invocation`** (if `true`, skill is not advertised in the system prompt—use **`/skill:name`** only).

### 4.3 Body

Write clear **setup**, **usage**, and **safety** sections. Use **relative links** from the skill directory (e.g. `[details](references/API.md)`).

### 4.4 Validation

Pi validates against the spec; most issues are **warnings** (skill still loads). **Exceptions:** missing **`description`** → skill skipped; **name/folder mismatch** and similar issues → warnings.

---

## 5. Curated skill sources

- **[Anthropic Skills](https://github.com/anthropics/skills)** — Office docs, web dev, and more  
- **[Pi Skills](https://github.com/badlogic/pi-skills)** — Search, browser automation, Google APIs, transcription, etc.

Install or clone into a path Pi scans, or reference that path in **`settings.json`** → **`skills`**.

---

## 6. Related documentation

| Doc | Topic |
|-----|--------|
| **[SYSTEM.md](SYSTEM.md)** | Skills vs extensions (short table) |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Skills are not session transcript memory |
| **[EXTENSIONS.md](EXTENSIONS.md)** | Extension authoring; link to upstream skills doc |
| **[AGENTS.md](AGENTS.md)** | Agents vs skills vs extensions |
| Root **[CLAUDE.md](../CLAUDE.md)** | `.pi/skills/<name>/SKILL.md` convention |

---

## 7. Quick troubleshooting

| Symptom | What to check |
|--------|----------------|
| Skill never triggers | Improve **`description`** with concrete “use when …” phrases; or use **`/skill:name`**. |
| `/skill:…` missing | **`enableSkillCommands`**; Pi version; skill **`name`** spelling. |
| Skill not listed | Missing **`description`**; wrong **`name`** vs folder; run from project **cwd** so **`.pi/skills/`** is visible. |
| “Wrong” skill wins | **Name collision**—first discovered path wins; rename or remove duplicates. |
