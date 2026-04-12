# Tools in Pi

**Tools** are **named, schema-described actions** the language model can **invoke** during a session. Pi receives a **tool call** (name + arguments), runs the implementation (built-in handler or extension-registered function), and returns a **result** to the model. Tools are **not** the same as slash commands (user-initiated), **skills** (markdown workflows), or **agents** (personas)—see **[CONCEPTS.md](CONCEPTS.md)**.

---

## 1. What tools do

1. The model sees a **list of available tools** with short descriptions and parameter shapes (varies by provider transport).
2. It may emit a **tool call** instead of (or before) more text.
3. Pi **executes** the tool in your environment (subject to policy, cwd, and optional restrictions).
4. The **output** (or error) is sent back to the model as a **tool result** message.

Extensions can **observe** tool events (`tool_call`, etc.)—see **[EXTENSIONS.md](EXTENSIONS.md)**.

---

## 2. Built-in tools (core)

The playground’s quick **TypeScript-style signatures** live in the repo root:

**[TOOLS.md](../TOOLS.md)**

That file documents the **core** set used in many sessions:

| Tool | Role |
|------|------|
| **`read`** | Read file contents (text or images); supports limit/offset; output may be truncated. |
| **`bash`** | Run a shell command in the session **cwd**; optional timeout. |
| **`edit`** | Replace an **exact** span of text in a file (whitespace-sensitive). |
| **`write`** | Create or overwrite a file; creates parent directories as needed. |

Your **Pi build** may expose **additional** built-ins (often behind flags or defaults). Common optional tools mentioned in comparisons and agent defs include **`grep`**, **`find`**, and **`ls`**—enable or include them per your Pi version (e.g. CLI **`--tools`** where supported). Treat the live Pi UI / help as the source of truth if root **`TOOLS.md`** lags.

---

## 3. Extension-registered tools (this repo)

Extensions call **`pi.registerTool({ … })`** to add **LLM-callable** tools. They register when the extension loads and only appear if that extension is active.

| Extension module | Tool names |
| ---------------- | ---------- |
| **`extensions/tilldone.ts`** | **`tilldone`** |
| **`extensions/chronicle.ts`** | **`chronicle_status`**, **`chronicle_snapshot`**, **`chronicle_transition`** |
| **`extensions/ralph.ts`** | **`ralph_queue_status`** |
| **`extensions/agent-team.ts`** | **`dispatch_agent`**, **`team_list`**, **`team_member_add`**, **`team_member_remove`**, **`team_member_replace`**, **`team_reload_agents`**, **`team_activate`**, **`team_save_preset`**, **`team_load_preset`**, **`team_delete_preset`** |
| **`extensions/agent-forge.ts`** | **`forge_list`**, **`forge_create`** — forged tools are separate `extensions/forge-*.ts` modules after **`forge_create`** + shim + **`/reload`** (each registers one dynamically named tool). |
| **`extensions/agent-chain.ts`** | **`run_chain`** |
| **`extensions/pi-pi.ts`** | **`query_experts`** |
| **`extensions/subagent-widget.ts`** | **`subagent_create`**, **`subagent_continue`**, **`subagent_remove`**, **`subagent_list`** |
| **`extensions/web-tools.ts`** | **`web_search`**, **`web_fetch`** |
| **`extensions/github-management.ts`** | **`ghm_exec`**, **`github_pr_list`**, **`github_pr_view`**, **`github_pr_diff`**, **`github_pr_checks`**, **`github_pr_review_submit`**, **`github_pr_review_inline`** (requires **`gh`**) |

**Other extension files** in this playground (**`cross-agent`**, **`damage-control`**, **`dynamic-loader`**, **`extension-picker`**, **`minimal`**, **`purpose-gate`**, **`pure-focus`**, **`session-memory`**, **`session-replay`**, **`sessions/index`**, **`system-select`**, **`theme-cycler`**, **`tool-counter`**, **`tool-counter-widget`**) do **not** register additional LLM tools in the current code (commands, hooks, UI, or policy only).

*When you add **`registerTool`** to an extension, update this table.*

Authoring: **[EXTENSIONS.md](EXTENSIONS.md)**.

---

## 4. Restricting tools (agents)

**Agent** markdown can list allowed tools in frontmatter, for example:

```yaml
tools: read,grep,find,ls
```

Orchestration extensions (**`agent-team`**, **`agent-chain`**, **`system-select`**, …) use this to spawn or switch sessions so a specialist **cannot** call tools outside that set (pattern varies by extension; see **[AGENTS.md](AGENTS.md)**). The **`agent-team`** **dispatcher** (main session) additionally gets built-in **`read`**, **`ls`**, and **`grep`** via **`setActiveTools`** for **verification** after a specialist run—see **[AGENT_TEAMS.md](AGENT_TEAMS.md)** §4.

That does **not** define a new tool—it **filters** which existing tools the session may use.

---

## 5. Skills and `allowed-tools`

Skills may declare **`allowed-tools`** in frontmatter (experimental / spec-driven). That is **not** the same as Pi’s built-in allowlist for agents—it signals which tools are **pre-approved** for workflows described in the skill. The model still only uses tools Pi actually exposes. See **[SKILLS.md](SKILLS.md)**.

---

## 6. Safety and policy

- **`damage-control`** (this repo) can **intercept** dangerous bash patterns and enforce path rules from **`.pi/damage-control-rules.yaml`**. That affects **execution**, not the tool list the model sees.
- **Read-only** or **no-delete** paths are policy on top of **`bash`** / file tools.

See root **[README.md](../README.md)** (Damage Control) and **`extensions/damage-control.ts`**.

---

## 7. Practical tips

| Tip | Why |
|-----|-----|
| Prefer **`read`** before claiming file contents | Tool output is ground truth; guessing causes drift. |
| **`edit`** needs an **exact** match | Use **`read`** to copy the precise `oldText`. |
| **`bash`** inherits **cwd** | `cd` in one call does not persist unless the shell session is stateful per your Pi version—check behavior for long pipelines. |
| Custom capabilities belong in **extensions** | New side effects should be **`registerTool`**, not only skill prose. |

---

## 8. Related documentation

| Doc | Topic |
|-----|--------|
| **[CONCEPTS.md](CONCEPTS.md)** | Skills vs agents vs extensions vs tools |
| **[EXTENSIONS.md](EXTENSIONS.md)** | `registerTool`, events |
| **[AGENTS.md](AGENTS.md)** | Agent `tools:` frontmatter |
| **[SKILLS.md](SKILLS.md)** | Skills vs tools |
| **[TOOLS.md](../TOOLS.md)** | Core function signatures (repo root) |
| **[COMPARISON.md](../COMPARISON.md)** | Pi vs Claude Code tool surface (optional tools, etc.) |
| **[WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md](WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md)** | Pi tool catalog + Way of Pi web orchestrator vs Pi **agent-team** dispatcher |
| **[WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md](WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md)** | Short conceptual comparison: headless Pi vs interim Bun path; **`dispatch_agent`** vs broader lead tools |
