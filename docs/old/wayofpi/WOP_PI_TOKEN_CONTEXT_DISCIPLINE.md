# Pi token discipline — why Pi stays lean and how Way of Pi should follow

**Purpose:** Explain **why upstream Pi often reports lower context usage** than heavyweight agent UIs, cite **official Pi sources**, and list **concrete habits and product choices** for this repo (Pi TUI, extensions, Way of Pi shell) so we **do not blast tokens** by accident.

**Related:** **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** (engine ownership) · **[AGENT_MEMORY.md](AGENT_MEMORY.md)** (sessions, `/remember`, compaction in Pi) · **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** (`WOP_MODEL_CONTEXT_TOKENS`) · **`apps/wayofpi-ui/server/chat-usage.ts`** (usage normalization) · **`extensions/context-local-hints.ts`** (local provider hints)

---

## 1. What Pi does upstream (authoritative sources)

These are **not** guesses — they summarize Pi’s own docs and Mario Zechner’s write-up.

| Mechanism | What Pi does | Primary reference |
|-------------|----------------|-------------------|
| **Context compaction** | When estimated context exceeds `contextWindow - reserveTokens`, Pi **summarizes older turns** into a structured handoff, keeps recent messages verbatim (default **~20k** “keep recent”), reserves headroom for the reply (**default ~16k**). Never cuts **mid-turn** (user → assistant → tool results until next user). | [pi-mono `compaction.md`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md), [issue #92](https://github.com/badlogic/pi-mono/issues/92) |
| **Settings** | `compaction.enabled`, `reserveTokens`, `keepRecentTokens` in **`~/.pi/agent/settings.json`** or project **`.pi/settings.json`**. | Same `compaction.md` |
| **Minimal tool surface** | Pi’s **built-in coding tools** are intentionally small (**read / write / edit / bash** style); frontier models are expected to compose with shell. Extra tools cost **system + JSON schema** tokens every turn. | [“What I learned building an opinionated and minimal coding agent”](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) |
| **No MCP in core philosophy** | Large MCP servers ship **many tool definitions into every request** (cited example: tens of thousands of tokens before user work). Pi steers toward **CLI + README**: the agent **reads docs when needed** (progressive disclosure). | Same blog post; see “MCP” section |
| **Context engineering** | **Exactly** controlling what enters the model context; **observability** over prompts and tools; token/cost tracking across providers (best-effort when APIs differ). | Same blog post |
| **Session / branching** | Sessions as **data** (JSONL, branching) so work can be **trimmed, compacted, resumed** instead of growing one immortal blob in a proprietary store. | [pi-mono session / compaction docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md) |

**Takeaway:** Pi’s “low token” feel is mostly **discipline** — small default surface, **compaction**, **no silent fat tool packs**, and **files** (`plans/`, `AGENTS.md`) carrying state instead of endless chat.

---

## 2. Principles to mimic (operator checklist)

Use this in **Pi TUI** and when configuring **Way of Pi + workspace**.

1. **Prefer Pi for real turns** when possible (`WOP_CHAT_ENGINE=pi` or `auto` with `pi` on `PATH`) so **one** engine owns tools, extensions, and **Pi-native compaction** — see **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** §0.
2. **Keep `extensions[]` lean** for everyday work. Every loaded extension can add **commands, hooks, and tool registrations** → more prompt and runtime surface. Enable heavy stacks only when needed (see **`docs/PLAYGROUND.md`** / **`pi-e`** menu rules).
3. **Avoid dumping huge text into chat.** Use **`read`** with ranges, **`grep`**, **`plans/`**, and **`projects/<slug>/`** notes instead of pasting multi‑file dumps.
4. **Use compaction deliberately** in Pi: **`/compact`**, **`/autocompact`**, and compaction settings in **`.pi/settings.json`** (see upstream `compaction.md`). After compaction, the model continues with a **summary + recent tail**, not full history.
5. **Treat MCP and giant tool packs as opt-in budget items.** If you attach them, assume **five–figures of tokens** may disappear before your task starts (order of magnitude from Pi’s public rationale — verify per server).
6. **Align context window metadata** for local models so meters and hints match reality — **`WOP_MODEL_CONTEXT_TOKENS`** (Way of Pi server) and Pi **`agent/models.json`** / model registry; see **`extensions/context-local-hints.ts`**.
7. **Workspace agent bodies** (`.pi/agents/*.md`) are **merged into the prompt** on the Bun path or as persona text — **short, focused personas** beat encyclopedic `.md` files for every session.

---

## 3. Way of Pi today — what already helps vs what gaps remain

| Area | Helps token / context pressure | Gap / follow-up |
|------|--------------------------------|-----------------|
| **`WOP_CHAT_ENGINE=pi` / `auto`** | Turn runs in **`pi --mode json`** — same compaction, tools, extensions as TUI for that workspace. | Long-lived Pi attach + session APIs still roadmap (**WOP_PI_BACKEND_WIRING_PLAN**). |
| **Bundled Bun chat** (`streamChatCompletion` / orchestrator loop) | Sends **streaming usage** when the provider supports it (`stream_options`, etc.); `chat-usage.ts` **approximates** when missing (Pi-style ÷4 hint). Server **`chat-context-budget`** trims old turns before each request (see **§4**). | **Not** Pi compaction (no summary handoff); prefer **`WOP_CHAT_ENGINE=pi`** for long research threads. |
| **`WOP_MODEL_CONTEXT_TOKENS`** | Status / Team pulse **%** uses a real window when set. | Operators must set it to match the **actual** local model. |
| **Workspace index / lead prompts** | Bounded snippets where implemented (server/workspace prompts). | Any new “helpful” injection must stay **bounded** and measurable. |
| **Orchestrator tool loop** | Tools are **workspace-jailed** and finite compared to arbitrary MCP. | Each tool still has **schema + description** cost; do not duplicate Pi’s full tool surface in Bun long term. |

---

## 4. Repo enforcement (Way of Pi server)

Before each chat completion (**`streamChatCompletion`**, orchestrator tool loop, or headless Pi prompt build), **`apps/wayofpi-ui/server/chat-context-budget.ts`** may **drop oldest full user turns** from the in-memory transcript (after the leading **`system`** block) so the **non-system** tail stays within:

- **`WOP_CHAT_MAX_MESSAGES`** (default **120**), and  
- **`WOP_CHAT_MAX_INPUT_CHARS`** (default **120000** approximate chars).

Leading **`system`** rows are always kept. The **last `user` message** (current turn) is never removed. When rows are removed, the server logs a **`chat`** warning and **rewrites** the session JSONL when a session key is active so disk matches RAM.

Disable with **`WOP_CHAT_CONTEXT_BUDGET=0`** (or **`false`** / **`no`** / **`off`**). Env names: **`docs/WOP_NAMESPACE.md`**.

This is **not** Pi compaction (no structured summary handoff); it is a **safety rail** for the Bun path and oversized prompts to Pi JSON. Prefer **`WOP_CHAT_ENGINE=pi`** for Pi-native behavior.

---

## 5. Product direction (Way of Pi)

1. **Maximize Pi as backend** for chat and orchestration so **compaction, session JSONL, and tool counts** stay Pi’s — parity rule **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**.
2. **UI honesty:** surfaces that show “team” or “tokens” should **label data source** (session cumulative vs per-agent subprocess) — see **Team pulse** hints and **`WOP_MULTI_AGENT_WEBSOCKET.md`**.
3. **Documentation:** when adding features that inject context (RAG, summaries, extra system text), add a **token budget note** in the spec and link here.

---

## 6. Quick links (external)

- [Pi compaction design (`compaction.md`)](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md)
- [Context compaction issue #92 (overview + defaults)](https://github.com/badlogic/pi-mono/issues/92)
- [Mario Zechner — “What I learned building an opinionated and minimal coding agent”](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)

**Last updated:** 2026-04-12 (Way of Pi repo; verify upstream paths if `pi-mono` layout changes).
