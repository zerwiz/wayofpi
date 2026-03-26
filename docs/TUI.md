# Pi TUI — thinking, tools, and keyboard shortcuts

This playground documents the **interactive terminal UI** for [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent). Exact labels may vary slightly by **Pi version**; reserved keys are also listed in the repo root **[`RESERVED_KEYS.md`](../RESERVED_KEYS.md)**.

---

## 1. Thinking vs “what the assistant says”

Pi can show **thinking** (internal reasoning) separately from the **assistant reply** (what is spoken to you). They often use different colors; see **`.pi/themes/*.json`** tokens such as **`thinkingText`** vs normal text.

| Shortcut | Action |
|----------|--------|
| **Ctrl+T** | **`toggleThinking`** — show or hide the thinking block (collapse/expand, depending on build). |
| **Shift+Tab** | **`cycleThinkingLevel`** — cycle how much **thinking** is used or shown (e.g. off → minimal → low → …), depending on model support. |

There is **no single switch** in this repo’s docs that hides *everything* except one stream (user / assistant / system / subagent banners); those are mostly layout and theme. **Agent-team** “`dispatch_agent … working`” lines are a separate UI layer.

---

## 2. Tools panel

| Shortcut | Action |
|----------|--------|
| **Ctrl+O** | **`expandTools`** — expand or collapse **tool call** detail (not the same as thinking). |

---

## 3. Models and session

| Shortcut | Action |
|----------|--------|
| **Ctrl+P** / **Ctrl+Shift+P** | Cycle model forward / backward |
| **Ctrl+L** | Open model picker |
| **/** | Command palette (slash commands) |
| **!** / **!!** | Run bash (with / without extra context) |

---

## 4. Other reserved shortcuts (subset)

| Shortcut | Action |
|----------|--------|
| **Escape** | Interrupt |
| **Ctrl+C** | Clear (or copy, context-dependent) |
| **Ctrl+D** | Exit (when input empty) |
| **Ctrl+G** | External editor |
| **Alt+Enter** | Queue follow-up |
| **Alt+Up** | Edit queued messages |
| **Ctrl+V** | Paste image |

Full **reserved** vs **overridable** lists: **[`RESERVED_KEYS.md`](../RESERVED_KEYS.md)**.

---

## 5. Extensions and themes

- Extensions can add widgets and commands; they **cannot** override reserved keys (Pi skips those `registerShortcut` calls).
- Theme JSON under **`.pi/themes/`** controls colors for thinking levels, surfaces, and accents.
- **`/theme`** (picker) and **Ctrl+X** / **Ctrl+Q** (cycle) come from the **`theme-cycler`** extension (`extensions/theme-cycler.ts`). They only exist while that extension is loaded.
- **`/reload`** reapplies **`agent/settings.json`** and project **`.pi/settings.json`** extension lists. If you started Pi with extra **`pi -e …/theme-cycler.ts`** flags but **`theme-cycler` is not listed** under **`extensions`**, reload drops it and **`/theme` stops working**. Fix: add **`.pi/extensions/theme-cycler.ts`** to **`extensions`** in **`.pi/settings.json`** (this repo includes that entry).

---

## 6. Related docs

| Doc | Topic |
|-----|--------|
| **[commands/REFERENCE.md](commands/REFERENCE.md)** | Slash commands (`/save`, `/agents-team`, …) |
| **[EXTENSIONS.md](EXTENSIONS.md)** | Extension model, TUI hooks |
| **[AGENT_TEAMS.md](AGENT_TEAMS.md)** | Agent-team UI and `/agents-*` commands |

Upstream Pi docs (verify against your install): [pi-mono coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent).
