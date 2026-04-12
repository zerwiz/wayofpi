# Way of Pi “orchestrator” vs Pi `agent-team` dispatcher

**Purpose:** One place to answer whether the Way of Pi web shell’s orchestration is the **same** as, or **strictly more capable** than, the **Pi TUI** dispatcher in **`extensions/agent-team.ts`** (often run as **`ppi`** / **`pi`** with that extension loaded).

**Detail tables and tool inventories:** **[WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md](WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md)**.

**Product lock and phased wiring:** **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** (especially section 0 and section 2.5).

**Pi-side behavior:** **[AGENT_TEAMS.md](AGENT_TEAMS.md)**.

---

## 1. Short answer

**No — Way of Pi is not a strict superset of Pi’s dispatcher in every sense.**

- **Pi’s `agent-team` dispatcher** is built around **`dispatch_agent`**: each specialist runs as a **real separate `pi --mode json` subprocess**, with its own **session file**, **tool allowlist** from that agent’s **`.md` frontmatter**, and full Pi runtime for that child. The dispatcher itself is intentionally **narrow**: **`read`**, **`ls`**, **`grep`**, plus **`team_*`** tools — **not** **`write` / `edit` / `bash`** on the lead session; implementation is delegated.
- **Way of Pi** can run chat in **two different ways**. They are **mutually exclusive per turn** in the server: when **headless Pi** owns the turn, the **Bun** “orchestrator tools” loop is **not** used.

So “more capable” depends on **which engine** is answering and **what you count** (breadth of tools on one model vs true multi-agent Pi subprocesses).

---

## 2. Two engines in Way of Pi (critical split)

**Code:** `apps/wayofpi-ui/server/index.ts` — `usePiChat` vs `useOrchestratorTools`.

| Mode | When it applies | What runs the tools |
|------|-----------------|---------------------|
| **Headless Pi** | `WOP_CHAT_ENGINE` is **`pi`** or **`auto`**, and a **`pi`** executable is resolved (`PATH` or **`WOP_PI_BINARY`**) | **`runPiChatTurn`** → **`pi --mode json`**. Tool surface = Pi’s loaded **`extensions[]`** for that workspace (same family as TUI). **`dispatch_agent`** exists **only if** Pi loads **`agent-team`** (or equivalent) for that session. |
| **Interim Bun orchestrator** | Pi JSON chat is **not** used for that turn, and **`WOP_ORCHESTRATOR_TOOLS`** (and runtime gates) allow it | **`runOrchestratorToolLoop`** + **`orchestrator-tools-exec.ts`**: workspace-jailed **`read`**, **`list_dir`**, **`grep`**, **`write`**, optional **`bash`**, optional **Git**-shaped tools, **`team_member_*`** / **`team_list`** that hit the **Bun server** — **not** child Pi specialists. |

**Important:** The Bun orchestrator path is explicitly **interim** (see the file header on **`orchestrator-tools-exec.ts`**). The product direction is to **maximize headless Pi** and avoid growing a permanent second agent runtime in Bun — see **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**.

---

## 3. “Same capabilities and more?” — axis by axis

### 3.1 True multi-agent delegation (`dispatch_agent`)

| System | `dispatch_agent` behavior |
|--------|---------------------------|
| **Pi `agent-team`** | **Yes** — subprocess Pi per specialist. |
| **Way of Pi, Bun path** | **No** — there is no server implementation that spawns per-agent **`pi`** children for tool calls. |
| **Way of Pi, Pi path** | **Yes, when Pi’s session includes `agent-team`** — same mechanism as TUI for that turn. |

So Way of Pi does **not** “add” **`dispatch_agent`** on top of Pi; on the Pi path it **is** Pi. On the Bun path it **lacks** that capability.

### 3.2 Tools on the *lead* model (dispatcher posture)

| System | Typical lead tools |
|--------|-------------------|
| **Pi dispatcher** | **`read`**, **`ls`**, **`grep`**, **`dispatch_agent`**, **`team_*`** — **not** **`write` / `edit` / `bash`** on the dispatcher (by design). |
| **Way of Pi Bun orchestrator** | Can expose **`write`**, **`bash`**, **Git** helpers, etc., to the **same** chat role — **broader** than the Pi dispatcher’s *allowed* tool set. |

That is “more” only in the sense of **more host-side power in one LLM loop** — not “more **`dispatch_agent`**.”

### 3.3 Team roster editing

Both surfaces expose **team-shaped** operations, but **persistence and semantics differ** (Pi: in-memory roster + presets; Bun: can rewrite **`teams.yaml`** immediately). See the comparison table in **[WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md](WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md)** section 5.

### 3.4 Extensions, skills, slash commands

Anything that exists **only inside Pi** (extension **`registerTool`**, **`/skill:`**, TUI slash commands, etc.) is available on the **headless Pi** path **only when** that Pi process loads the right **`extensions[]`**. The **Bun** orchestrator path does **not** execute Pi extensions.

---

## 4. Mental model for readers

1. **If you need real `dispatch_agent` and per-specialist Pi sessions:** use **headless Pi** for chat in Way of Pi (and ensure **`agent-team`** is in workspace **`.pi/settings.json`** for that project), or use **Pi TUI** directly.
2. **If you are on the Bun orchestrator path:** treat it as a **workspace tool bridge** for one model loop — useful, but **not** a substitute for Pi’s multi-process **`agent-team`** semantics.
3. **Do not equate** “the orchestrator can **write** files in the web UI” with “Way of Pi replaced Pi’s dispatcher with something strictly stronger.” The **strongest** multi-agent behavior in this repo is still **`dispatch_agent`** inside **Pi**.

---

## 5. Code map (quick)

| Topic | Location |
|-------|----------|
| Turn routing (Pi vs Bun tools vs plain completion) | `apps/wayofpi-ui/server/index.ts` (`runChatTurn`, `usePiChat`, `useOrchestratorTools`) |
| Bun tool loop | `apps/wayofpi-ui/server/chat-orchestrator-tools.ts` |
| Bun tool execution | `apps/wayofpi-ui/server/orchestrator-tools-exec.ts` |
| Headless Pi turn | `apps/wayofpi-ui/server/pi-json-mode-chat.ts` (and callers) |
| Pi dispatcher + `dispatch_agent` | `extensions/agent-team.ts` |

---

Last updated: 2026-04-12.
