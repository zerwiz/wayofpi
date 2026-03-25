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

## 3. Extension-registered tools

Extensions call **`pi.registerTool({ … })`** to add **LLM-callable** tools (name, description, parameters, handler). Examples in this repo include **`agent-team`** (`dispatch_agent`, `team_*`, …), **`chronicle`**, **`agent-forge`**, etc.

- **Lifecycle:** Registered when the extension loads; available while that extension is active.
- **Discovery:** The model only sees tools Pi attaches to the **active tool set** for the session.

Authoring details: **[EXTENSIONS.md](EXTENSIONS.md)** (table under “Through `ExtensionAPI`”).

---

## 4. Restricting tools (agents)

**Agent** markdown can list allowed tools in frontmatter, for example:

```yaml
tools: read,grep,find,ls
```

Orchestration extensions (**`agent-team`**, **`agent-chain`**, **`system-select`**, …) use this to spawn or switch sessions so a specialist **cannot** call tools outside that set (pattern varies by extension; see **[AGENTS.md](AGENTS.md)**).

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
