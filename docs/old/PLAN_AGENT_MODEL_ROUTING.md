# Plan: Skill + system for automatic agent / model routing

**Goal:** Let the **system** pick **agents** and **models** that fit the **current task** better than a single fixed session default—without requiring a **`model:`** field in every **`.pi/agents/*.md`** (Pi still has no standard per-agent model in frontmatter today).

**Constraints (today):**

- **Main Pi session** model is chosen via **Ctrl+L**, **`agent/settings.json`**, and the catalog in **`agent/models.json`** — not per agent file.
- **`dispatch_agent`** (see **`extensions/agent-team.ts`**) spawns a subprocess **`pi`** with **`--model`** set from **`ctx.model`** (the **dispatcher’s** current model), **not** from the target agent’s `.md` file.
- **Skills** are instructions only; they do **not** call Pi APIs unless combined with an **extension** that exposes tools.

**Related:** **[`docs/PLAN_AWESOME_CODEX_SUBAGENTS.md`](PLAN_AWESOME_CODEX_SUBAGENTS.md)** (many agents; same routing problem at scale).

---

## 0. Model fields — what to use for routing (single contract)

Use the same identifiers Pi already uses; **do not invent parallel field names** in agent `.md` for model (optional prose note **“Prefer …”** in body is fine; it is **not** a structured route).

| Location | Fields | Role for routing |
|----------|--------|------------------|
| **`agent/settings.json`** | **`defaultProvider`** (e.g. `ollama`), **`defaultModel`** (**model id only**, e.g. `qwen3.5:9b-32k`) | **Session default** after restart / **Ctrl+L**; **not** per agent. |
| **`agent/models.json`** | **`providers.<provider>.models[]`** each with **`id`** (API id, e.g. `qwen2.5-coder:14b-instruct`) and **`name`** (display) | **Allowlist**: every routed model must **`id`**-match an entry under the chosen **`provider`**, or Pi may reject or fail at runtime. |
| **`dispatch_agent` subprocess** | **`--model`** = **`${provider}/${id}`** (see **`agent-team.ts`**: `ctx.model.provider` + `ctx.model.id`) | **This is the wire format** automated routing must produce for **B**. |
| **`.pi/agent-model-routes.yaml` (planned)** | Map **agent name** → **`model`** string **`provider/id`** (same as **`--model`**) | **Overrides** session default for that subagent only; ids must exist in **`models.json`** for that provider. |

**Summary:** **Routing config** stores **`provider/modelId`** (matches **`--model`**). **Validation** compares **`modelId`** to **`agent/models.json`** → **`providers.<provider>.models[].id`**. Session UI still uses **`defaultProvider`** + **`defaultModel`** from **`settings.json`**.

---

## 0b. “Intelligent” routing: skill vs tool vs extension (what fits best)

| Mechanism | Best for | Automatic? |
|-----------|----------|------------|
| **Skill** (`model-routing`) | Policy, decision trees, when to use **Ctrl+L**, how to read **`agent-model-routes.yaml`**, optional **“Prefer `ollama/…` for …”** in agent copy | **No** — guides the user and the **dispatcher LLM**; no code execution. |
| **Extension** (patch **`agent-team.ts`** + optional rules/classifier) | **Apply** **`provider/id`** when spawning **`dispatch_agent`**; optional keyword/router logic (**D**) | **Yes** for **B** (deterministic map); **yes** for **D** if implemented in TS. |
| **New LLM tool** (e.g. `suggest_model`) | Rarely needed: the dispatcher already chooses **`dispatch_agent`**; a separate tool duplicates that unless you want **structured** “route suggestions” logged | **Only if** you explicitly want tool-call-shaped outputs; **not** the default. |

**Recommendation:** **Skill** = human + dispatcher **documentation** and alignment with **`models.json`**. **Extension** = **actual** subprocess **`--model`** override and any **intelligent** automation. Skip a dedicated routing **tool** unless a concrete workflow needs it.

---

## 1. Desired behaviors (pick any subset for v1)

| Level | Behavior |
|-------|----------|
| **A — Advisory** | Skill tells the user (or dispatcher) which **agent** + **model** to use; user presses **Ctrl+L** or uses **`/system`** manually. |
| **B — Subagent model map** | **`dispatch_agent`** passes **`--model provider/id`** per **target agent name** from a **repo config file**, independent of the main session model. |
| **C — Main session auto-switch** | Before each turn (or on keyword), **change the session’s active model** via Pi **Extension API** — **only if** upstream exposes a safe `setModel` / provider switch (must be verified against your Pi version). |
| **D — Task classifier** | Small model or rules classify the user message → route to **B** or **C**. |

**Recommendation:** Implement **B** first (clear win for agent-team), then **A** (skill) for documentation and fallbacks, then investigate **C** against **[pi-mono](https://github.com/badlogic/pi-mono)** / your installed Pi.

---

## 2. Current code anchor

In **`extensions/agent-team.ts`**, **`dispatchAgent`** builds:

```text
--model ${ctx.model.provider}/${ctx.model.id}
```

**Change for B:** resolve `model` with precedence:

1. **`agent-model-routes.yaml`** (or `.json`) entry for **`state.def.name`**
2. else optional frontmatter in agent `.md` (non-standard — only if we add a convention like `preferredModel: ollama/qwen2.5-coder:latest` **documented for Pi fork**)
3. else **`ctx.model`** (current behavior)

Subprocess already supports **`--model`**; only the **source** of the string changes.

---

## 3. Proposed artifacts

| Artifact | Role |
|----------|------|
| **`.pi/agent-model-routes.yaml`** | Map **`agent:`** → **`model:`** as **`provider/modelId`** (e.g. **`ollama/qwen2.5-coder:14b-instruct`**) matching **`agent/models.json`**. |
| **`.pi/skills/model-routing/SKILL.md`** | When to prefer which model (long context, fast cheap, code-heavy, reasoning); points to routes file; **advisory** if **C** unavailable. |
| **Patch `extensions/agent-team.ts`** (or small companion extension) | Read routes file; override **`--model`** in **`dispatchAgent`**. |
| **Optional: `extensions/model-router.ts`** | Listen to **`user_message`** / **`before_agent_start`**; if Pi API allows, set session model (**C**). |

---

## 4. Example routing policy (Ollama, this playground)

Align with **`agent/models.json`** entries. Example **defaults** (tune to taste):

| Task signal | Suggested model (id) | Rationale |
|-------------|----------------------|-----------|
| Long file / big context | **`qwen3.5:9b-32k`** | 32K context in name |
| General coding | **`qwen2.5-coder:14b-instruct`** or **`qwen2.5-coder:latest`** | Strong coder personas |
| Fast/cheap triage | **`nemotron-3-nano:4b`** | Small |
| Reasoning-heavy / “think step by step” | **`unsloth-r1-8b:latest`** or **`ds-r1-8b:latest`** | R1-style |
| Very large reasoning | **`unsloth-qwen3-30b:latest`** | Heavier GPU |

**Agent-type mapping (illustrative):**

| Agent class | Default route |
|-------------|----------------|
| **`reviewer`**, **`plan-reviewer`** | Strong coder or R1 for critique |
| **`scout`** | Faster model OK |
| **`builder`** | **`qwen2.5-coder:14b-instruct`** |
| **`hermes`** | N/A (external CLI) |

Encode these in **`agent-model-routes.yaml`**, not only in prose.

---

## 5. Implementation phases

### Phase 0 — Design lock

1. Confirm **`pi --model`** accepts **`ollama/qwen3.5:9b-32k`** (provider/id) as used in **agent-team** today.
2. Read **[packages/coding-agent docs](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs)** for **session model** APIs (**C**).

### Phase 1 — Config + agent-team ( **B** )

1. Add **`.pi/agent-model-routes.yaml`** schema (document in this plan + **`docs/AGENTS.md`** snippet).
2. Patch **`dispatchAgent`** to merge routes; **fallback** to **`ctx.model`**.
3. Manual test: **`dispatch_agent builder`** uses route; **`dispatch_agent scout`** uses another.

### Phase 2 — Skill ( **A** )

1. Add **`.pi/skills/model-routing/SKILL.md`** (`name: model-routing`).
2. Register in **`docs/SKILLS.md`** table.
3. Content: decision tree + “if routing file missing, use Ctrl+L”.

### Phase 3 — Optional classifier ( **D** )

1. Lightweight keyword / regex in extension, or one **`dispatch_agent`** to a **tiny** model that outputs **`{ "agent": "...", "model": "..." }`** JSON.
2. **Guardrails:** never switch to a model not in **`agent/models.json`**; log choice in footer.

### Phase 4 — Main session ( **C** )

1. If Pi exposes **`ctx.setModel`** or event: prototype in **`extensions/model-router.ts`**.
2. If **not** exposed: document **C** as blocked; stay at **A+B**.

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| Wrong model for task | Keep **override**: user **Ctrl+L**; routes file easy to edit |
| Subagent OOM / slow | Map heavy agents to **14B** only when GPU allows |
| Drift from **`models.json`** | CI or script: validate route ids ⊆ **`ollama list`** |
| Two sources of truth | **Single** **`agent-model-routes.yaml`** for automation; skill only describes policy |

---

## 7. Success criteria

- [ ] **`dispatch_agent`** can run a specialist with a **different** model than the main chat ( **B** ).
- [ ] **`/skill:model-routing`** documents policy for humans and dispatchers.
- [ ] **`CHANGELOG.md`** notes behavior change for agent-team users.

---

## 8. Related docs

- **[AGENTS.md](AGENTS.md)** — agent definitions  
- **[AGENT_TEAMS.md](AGENT_TEAMS.md)** — `dispatch_agent`  
- **[SKILLS.md](SKILLS.md)** — skills vs extensions  
- **[EXTENSIONS.md](EXTENSIONS.md)** — patching **`agent-team.ts`**  

---

## 9. Effort estimate

| Phase | Effort |
|-------|--------|
| 1 | ~0.5–1 day |
| 2 | ~0.25 day |
| 3–4 | 0.5–2 days (depends on Pi API for **C**) |
