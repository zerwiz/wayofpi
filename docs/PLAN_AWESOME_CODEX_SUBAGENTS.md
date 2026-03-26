# Plan: Import domain specialist agents into Pi

**Goal:** Import the reference **domain specialist agent definitions** into **Pi** (this playground) as **`.pi/agents/*.md` personas that the user can call directly**, without breaking existing **`teams.yaml`** rosters or duplicating work already covered by **`pi-pi/`** experts.

**Source:** Local reference import under `ref/.../categories/` (`.toml` with `name`, `description`, `sandbox_mode`, and `developer_instructions`). **Each Pi agent must preserve the upstream instruction text verbatim**, only adapting formatting to Markdown where needed. The generated agents must be standalone so the `ref/` folder can be deleted.

**Non-goals (for this plan):** Changing Pi’s **`dispatch_agent`** implementation; guaranteeing every upstream subagent is safe for your Ollama models—**review and trim** per agent.

---

## 1. Format gap: reference `.toml` → Pi agent `.md`

| Reference (`.toml`) | Pi (`.md`) |
|-----------------|------------|
| `name` | Frontmatter **`name`** (must match `^[a-z0-9-]+$` for dispatch; avoid collisions with existing **`builder`**, **`reviewer`**, …) |
| `description` | Frontmatter **`description`** |
| `model`, `model_reasoning_effort` | **Pi does not set model per agent file** — use session **Ctrl+L** / **`settings.json`**; optional note in body: “Prefer …” |
| `sandbox_mode` | Map to **`tools:`** allowlist: `read-only` → `read,grep,find,ls`; `workspace-write` → add `write,edit,bash` as appropriate |
| `developer_instructions` | Markdown **body** (same persona text) |

**Naming:** Many agents use generic names (`reviewer`, `planner`, etc.). Pi already has **`reviewer`**, **`documenter`**, etc. **Prefix by category** to avoid collisions, e.g. `infra-azure-infra-engineer`, `lang-erlang-expert`, `quality-code-reviewer`.

---

## 1.1 Domain specialist categories (01–10)

We expose **all imported agents as domain specialists**, grouped by their category so users can call them when needed:

- **01-core-development** – core app and fullstack development specialists
- **02-language-specialists** – language/framework experts (including an **Erlang expert** when we import upstream)
- **03-infrastructure** – DevOps, SRE, cloud, networking
- **04-quality-security** – QA, code review, security, pentest
- **05-data-ai** – data, ML, LLM, Postgres
- **06-developer-experience** – tooling, DX, docs, workflows
- **07-specialized-domains** – niche and industry-specific roles
- **08-business-product** – product, PM, legal, sales, marketing
- **09-meta-orchestration** – coordinators and orchestrators
- **10-research-analysis** – research and analysis experts

Dispatch extensions (`agent-team`, `system-select`, `agent-chain`) should treat these as **named domain specialists** discoverable by category and callable on demand.

---

## 2. Target layout in this repo

```
.pi/agents/
  domain-specialists/
    01-core-development/
    02-language-specialists/
    03-infrastructure/
    ...
    ...
  teams-presets.json       # optional: category presets (see §3 Phase 3)
```

**Alternative:** Flat **`.pi/agents/<prefix>-<name>.md`** — fewer dirs, longer filenames.

---

## 3. Phased implementation

### Phase 0 — Inventory and tooling (1–2 sessions)

1. Clone or submodule the upstream repo beside this workspace (or document **`git clone`** + `rsync` paths).
2. Write a **small script** (Node or Python) that:
   - Walks `categories/**/*.toml`
   - Parses `name`, `description`, `sandbox_mode`, `instructions`
   - Emits **`awesome-codex-<name>.md`** with mapped **`tools:`** and frontmatter
   - **Fails** on duplicate `name` after prefixing
3. **Dry-run** output to **`/tmp/pi-agents-preview/`**; human spot-check 5 files.

### Phase 1 — Pilot (10–15 agents)

1. Pick **one category** (e.g. **04-quality-security** or **01-core-development**) — small overlap with existing **`reviewer`** / **`red-team`**.
2. Generate **`.md`** files; **rename** any collision (`reviewer` → `ac-reviewer` or `codex-codereviewer`).
3. Add **`/agents-reload`** / Pi rescan; verify **`dispatch_agent`** resolves each **`name`**.
4. **Smoke test:** 2–3 dispatches per agent with narrow tasks.

### Phase 2 — Batch import (categories 01–10)

1. Follow **§8.1** for **order** (do not merge **09** before **01** and **04** unless you accept broken orchestration tests).
2. Run the generator on **all** `categories/`; commit in **one PR per category** or **one PR with 10 commits** (easier review).
3. For each category, update **`.pi/agents/awesome-codex/README.md`** (table: agent name, one-line role).

### Phase 3 — Teams and presets

1. **Do not** add 130 names to **`teams.yaml` `full`** — UI and roster become unusable.
2. Add **optional** **`teams-presets.json`** entries per category, e.g. **`awesome-codex-01-core`**, **`awesome-codex-04-quality`**, each listing **only** that category’s agents (see **[AGENT_TEAMS.md](AGENT_TEAMS.md)**).
3. **Meta team:** optional **`awesome-codex-meta`** with only **`agent-organizer`**, **`multi-agent-coordinator`**-style agents if ported—kept small.

### Phase 4 — Documentation and maintenance

1. **[`docs/AGENTS.md`](AGENTS.md)** — New subsection “Awesome Codex (ported)” with link to **`.pi/agents/awesome-codex/README.md`** (not 130 rows in the main table; use index file).
2. **[`docs/REPO_INDEX.md`](REPO_INDEX.md)** — One line under **`.pi/agents/`**.
3. **Upstream sync:** Document **`git remote add upstream`**, **`git fetch`**, re-run generator on diff, **CHANGELOG** note.

---

## 4. `tools:` mapping policy

| Codex `sandbox_mode` | Suggested Pi `tools:` |
|----------------------|------------------------|
| `read-only` | `read,grep,find,ls` |
| `workspace-write` | `read,write,edit,bash,grep,find,ls` |
| (missing) | Default `read,grep,find,ls`; tighten after review |

Add **`bash`** only where the upstream instructions imply shell (tests, scripts). **Security:** subagents that run arbitrary commands should be **documented** and optionally **excluded** from default presets.

---

## 5. Model and provider notes

Upstream references **OpenAI/Codex model ids** (e.g. `gpt-5.3-codex-spark`). **Pi + Ollama** users should use **`agent/settings.json`** and **`agent/models.json`** for defaults; **do not** embed model ids in every agent unless Pi gains per-agent model in **`agents`**.

Optional: one-line in body: *“For this playground, prefer a capable coding model (e.g. `qwen2.5-coder:14b-instruct`).”*

---

## 6. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| 130+ files clutter **`.pi/agents/`** | Subfolder **`awesome-codex/`** + generator |
| Name collision with built-in **`reviewer`** | Prefix **`ac-`** or **`codex-`** |
| Unsafe instructions from upstream | Manual review of high-risk categories (security, penetration); **red-team** overlap |
| **teams.yaml** size / UX | **Presets** only; never default **`full`** to all |
| Drift from upstream | Version pin in **README** + re-run script |

---

## 7. Success criteria

- [ ] Generator script committed under **`scripts/`** (or **`tools/`**) with README usage.
- [ ] ≥1 full category ported and **dispatch-tested**.
- [ ] **`.pi/agents/awesome-codex/README.md`** is the human index.
- [ ] **`docs/AGENTS.md`** + **`REPO_INDEX.md`** updated.
- [ ] At least one **teams preset** for a category (optional but recommended).
- [ ] All **10 categories** processed per **§8** (order, checklist, per-category notes).

---

## 8. Per-category implementation (10 categories)

Upstream layout matches **`categories/<NN>-<slug>/`** in [awesome-codex-subagents](https://github.com/zerwiz/awesome-codex-subagents). Implement **one category per PR** (or one commit per category in a single PR). Each category gets:

- **Output path:** **`.pi/agents/awesome-codex/<category-folder>/`** (mirrors upstream) **or** flat **`awesome-codex-<agent>.md`** — pick one scheme repo-wide.
- **Preset name:** **`awesome-codex-<NN>-<short-slug>`** in **`teams-presets.json`** (optional), e.g. **`awesome-codex-01-core`**.
- **Collision prefix:** **`ac-`** on generated **`name`** when upstream **`name`** conflicts with existing **`.pi/agents/*.md`**.

### 8.1 Recommended implementation order

| Order | Cat | Folder (typical) | Why this order |
|-------|-----|------------------|----------------|
| 1 | **01** | `01-core-development` | Most overlap with daily coding; validates generator on familiar roles (**`backend-developer`**, **`frontend-developer`**). |
| 2 | **04** | `04-quality-security` | Aligns with existing **`reviewer`**, **`red-team`** — force collision policy early (**`code-reviewer`** → **`ac-code-reviewer`**). |
| 3 | **06** | `06-developer-experience` | Tooling/docs/git — safe, high utility; **`documentation-engineer`** near **`documenter`**. |
| 4 | **02** | `02-language-specialists` | Large; many language-specific; import after core patterns proven. |
| 5 | **03** | `03-infrastructure` | Often needs **`bash`** + Docker/K8s language — review **`tools:`** for least privilege. |
| 6 | **05** | `05-data-ai` | ML/data agents may assume cloud APIs — add body note “no external keys unless user provides.” |
| 7 | **10** | `10-research-analysis` | Read-heavy; good for **`read-only`** defaults. |
| 8 | **07** | `07-specialized-domains` | Domain-specific; lower priority unless your work needs fintech/game/etc. |
| 9 | **08** | `08-business-product` | PM/legal/marketing — minimal code **`tools:`**; optional for dev-only teams. |
| 10 | **09** | `09-meta-orchestration` | **Last:** orchestrators (**`multi-agent-coordinator`**) assume other agents exist; test after categories 01–04 are dispatchable. |

### 8.2 Category-by-category checklist

For **each** of the 10 folders, complete before merging:

1. Run generator on **`categories/<folder>/*.toml` only**.
2. Resolve **`name`** collisions (prefix **`ac-`**, document in **`awesome-codex/README.md`**).
3. Spot-check **3 agents**: one `read-only`, one `workspace-write`, one long **`[instructions]`**.
4. Add **one** **`teams-presets.json`** entry listing **only** this category’s **`name`** values (optional but recommended).
5. **`/agents-reload`** and smoke **`dispatch_agent`** twice.

### 8.3 `01-core-development`

- **Focus:** End-to-end app work (API, UI, fullstack, desktop, mobile).
- **Overlap:** **`builder`**, **`planner`**, **`scout`**, **`bowser`** (frontend/browser).
- **Implementation:** Pilot category #1; prioritize **`code-mapper`** + **`fullstack-developer`** for integration tests.
- **Risk:** Low–medium. **`electron-pro`** / **`mobile-developer`** may assume stacks you don’t have — keep **`tools:`** conservative.

### 8.4 `02-language-specialists`

- **Focus:** Language/framework experts (Python, Rust, React, Next.js, …).
- **Overlap:** **`code-documenter`** (docs), not language-specific.
- **Implementation:** Generate in bulk; **fewer collision** renames than 04. Group **preset** by “web” vs “systems” if roster too large (optional split presets).
- **Risk:** Low for read-only reviewers; higher where **`workspace-write`** + package managers (**`bash`**).

### 8.5 `03-infrastructure`

- **Focus:** Cloud, K8s, Terraform, Docker, SRE, networking.
- **Overlap:** Honcho/Docker docs in this repo — **do not** confuse with **`hermes`** agent.
- **Implementation:** After **01**, so “deploy this app” flows exist. Audit each agent for **`bash`** + destructive hints; consider **`read-only`** first pass.
- **Risk:** **High** for agents that suggest production changes — label preset **“advanced”** in README.

### 8.6 `04-quality-security`

- **Focus:** Review, QA, security, pentest, compliance, debugging.
- **Overlap:** **`reviewer`**, **`red-team`**, **`plan-reviewer`**.
- **Implementation:** **Mandatory** rename map: e.g. upstream **`reviewer`** → **`ac-reviewer`** or **`ac-pr-reviewer`**. Cross-link **[`docs/AGENTS.md`](AGENTS.md)** built-ins so users don’t pick the wrong one.
- **Risk:** **Pentest / AD-security** agents — review instructions for legality/ethics boilerplate; optional exclude from default preset.

### 8.7 `05-data-ai`

- **Focus:** ML, MLOps, data pipelines, LLM architecture, Postgres.
- **Overlap:** None native; complements **Indexer** / **project-scanner** for data-heavy repos.
- **Implementation:** Add README note: **GPU/Ollama** is local; cloud training agents may need **`bash`** + env vars.
- **Risk:** Medium — external API assumptions in instructions.

### 8.8 `06-developer-experience`

- **Focus:** Build, CLI, Git workflows, MCP, docs tooling, refactoring.
- **Overlap:** **`documenter`**, **`code-documenter`**, **`github`** skill, **`planner`**.
- **Implementation:** High value early; **`git-workflow-manager`** pairs with **[`/skill:github`](../.pi/skills/github/SKILL.md)** in user docs.
- **Risk:** Low.

### 8.9 `07-specialized-domains`

- **Focus:** Blockchain, games, embedded, M365, payments, SEO, etc.
- **Overlap:** Niche.
- **Implementation:** Lower priority unless product needs; smaller preset or skip preset until requested.
- **Risk:** Domain-specific assumptions; spot-review each.

### 8.10 `08-business-product`

- **Focus:** PM, Scrum, legal, sales, marketing, technical writing.
- **Overlap:** **`planner`**, **`documenter`** — different tone.
- **Implementation:** Prefer **`read-only`** **`tools:`** where possible; legal/sales agents are advisory only.
- **Risk:** Low technical; medium for misleading “legal” advice — add disclaimer in category README.

### 8.11 `09-meta-orchestration`

- **Focus:** Coordinators, installers, workflow orchestration, context management.
- **Overlap:** **`agent-team`** dispatcher conceptually — these are **personas**, not Pi code.
- **Implementation:** **Last category**; keep preset **small** (3–5 agents). Test **`agent-organizer`** + **`task-distributor`** with already-imported agents from **01** and **04**.
- **Risk:** Confusion with built-in **agent-team** — document: “subagent persona only.”

### 8.12 `10-research-analysis`

- **Focus:** Search, docs research, market/competitive analysis.
- **Overlap:** **`scout`**, **`hermes`** (external CLI), **Indexer**.
- **Implementation:** Read-heavy; good defaults **`read,grep,find,ls`**; add **`bash`** only if upstream needs curl/web fetch (align with **[Firecrawl](https://github.com/)** / keys in **`.env.sample`** if used).
- **Risk:** Low.

---

## 9. Related docs

- **[AGENTS.md](AGENTS.md)** — Pi agent file format  
- **[AGENT_TEAMS.md](AGENT_TEAMS.md)** — `teams.yaml`, presets  
- **[CONCEPTS.md](CONCEPTS.md)** — agents vs skills vs extensions  
- **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** — per-task **model** / **agent** fit (`dispatch_agent` **`--model`**, skill, routes file)  

---

## 10. Effort estimate (order of magnitude)

| Phase | Effort |
|-------|--------|
| 0 + 1 | ~0.5–1 day (script + pilot) |
| 2 | ~1–2 days (bulk generate + fix collisions + review spot checks) |
| 3–4 | ~0.5 day (docs + presets) |

**Total:** ~2–4 days of focused work for a single maintainer, plus ongoing upstream sync.
