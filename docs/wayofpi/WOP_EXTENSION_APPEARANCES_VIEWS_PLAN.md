# Planning: extension appearances → web UI views (`wayofpi-ui`)

**Purpose:** Plan how **Pi playground appearance choices** (the `just pi-e` menu and equivalent extension stacks) map to **different views** in **`apps/wayofpi-ui/`** using the **modular dock shell**, instead of one fixed layout or a forked component tree per profile.

**Last updated:** 2026-04-11

---

## Pi `agent-team` TUI → **Team Pulse** (web)

Pi’s **`extensions/agent-team.ts`** draws a **footer widget** (`setWidget("agent-team", …)`) with:

- Title **`◆ <activeTeamName>`** and a rule line  
- A **grid** of boxed **cards** (column count follows roster size: ≤3 → N cols, 4 → 2, else 3)  
- Per card: **display name**, **`⎆` resolved model**, **status** (○ idle / ● running / ✓ done / ✗ error) + elapsed, **`[#---]` context %**, **token** in/out, optional **stream detail** (`⚙` last tool, `τ` last thinking), **wrapped work** lines (task/lastWork or agent description)

**`wayofpi-ui`** mirrors that **layout and fields** on the **Team Pulse** tab inside **`ChatPanel`**, using **`teams.yaml`** rosters and scanned agents from **`GET /api/agents`** (`AgentTeamPulseGrid.tsx`). **Idle** placeholders are shown until **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** (or equivalent) feeds real **`AgentTeamPulseMember`** state. **Stream detail** toggles like Pi **`/agents-stream`** (default on).

---

## 1. Problem

Today:

- **Pi (TUI)** loads a session with **`extensions[]` from `.pi/settings.json`** and/or a **stacked `-e` list** from the **`pi-e`** menu (see **[PLAYGROUND.md](PLAYGROUND.md)** and **`.cursor/rules/pi-pi-e-playground-modes.mdc`**).
- **`wayofpi-ui`** has **simple** vs **technical** mode ([`useUiMode.ts`](../apps/wayofpi-ui/src/hooks/useUiMode.ts)) and persisted technical layout ([`technicalLayoutStorage.ts`](../apps/wayofpi-ui/src/utils/technicalLayoutStorage.ts)), but **no first-class “appearance”** that mirrors the **`pi-e`** inventory.

**Goal:** Treat each **appearance** (aggregate setup + optional extension stack) as a **composition of docks**—default visibility, default strip tabs, chat placement—so “busy playground” vs “minimal + agent-team” vs “pure-focus” are **presets** on one shell, per **[`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc)**.

---

## 2. Source of truth for menu appearances

The **canonical** label → path mapping for interactive **`just pi-e`** lives in the repo **`justfile`** (`recipe pi-e`, `options=(...)`). If this document and the **`justfile`** disagree, **trust the `justfile`** and update this table.

| # | Menu label (summary) | Resolves to |
|---|----------------------|-------------|
| 1 | enable-playground FULL | `__ENABLE_PLAYGROUND__` (writes merged settings; full `extensions[]` when no line 3+) |
| 2 | project-local `.pi` + playground agents/skills/themes | `__PROJECT_LOCAL_PI__` (`extensions[]` empty; stack via menu) |
| 3 | pure-focus | `extensions/pure-focus.ts` |
| 4 | minimal | `extensions/minimal.ts` |
| 5 | theme-cycler | `extensions/theme-cycler.ts` |
| 6 | cross-agent | `extensions/cross-agent.ts` |
| 7 | purpose-gate | `extensions/purpose-gate.ts` |
| 8 | tool-counter | `extensions/tool-counter.ts` |
| 9 | tool-counter-widget | `extensions/tool-counter-widget.ts` |
| 10 | subagent-widget | `extensions/subagent-widget.ts` |
| 11 | tilldone | `extensions/tilldone.ts` |
| 12 | agent-team | `extensions/agent-team.ts` |
| 13 | agent-team (build-orchestra) | `extensions/agent-team-build-orchestra.ts` |
| 14 | system-select | `extensions/system-select.ts` |
| 15 | damage-control | `extensions/damage-control.ts` |
| 16 | agent-chain | `extensions/agent-chain.ts` |
| 17 | pi-pi | `extensions/pi-pi.ts` |
| 18 | session-replay | `extensions/session-replay.ts` |
| 19 | extension-picker | `extensions/extension-picker.ts` |
| 20 | session-memory | `extensions/session-memory.ts` |
| 21 | session-saver | `extensions/sessions/index.ts` |
| 22 | chronicle | `extensions/chronicle.ts` |
| 23 | agent-forge | `extensions/agent-forge.ts` |
| 24 | dynamic-loader | `extensions/dynamic-loader.ts` |
| 25 | pi-doctor | `extensions/pi-doctor.ts` |

**Note:** **`all`** in **`pi-e`** stacks every **non-pseudo** line (skips `__…__`). **`pi-e`** may **auto-prepend** `session-memory` + `context-local-hints` when **agent-team** / **build-orchestra** / **agent-chain** is selected, and may **auto-append** `minimal` unless **pure-focus** or **agent-team** variants are present—mirror these rules in any web “recommended stack” helper.

**Out of menu:** Some **`extensions/*.ts`** files are loaded only via **`.pi/settings.json`** or manual **`-e`** (e.g. **ralph**, **github-management**, **honcho-mirror**, **web-tools**). The web appearance model should allow **ad-hoc** or **settings-driven** extensions without requiring a **`pi-e`** line number.

---

## 3. Appearance categories (for the web)

| Category | Examples | Web intent |
|----------|----------|------------|
| **Aggregate / pseudo** | Option **1** (FULL), **2** (project-local) | **Density presets**: how many default docks, how much chrome; not a different React root. |
| **Chrome / layout extensions** | `minimal`, `pure-focus`, `agent-team` | Strong effect on **visible regions** and **footer/grid**—map to **dock presets** and **optional “hide menu bar”** flags. |
| **Tool / widget extensions** | `tool-counter`, `tilldone`, `extension-picker`, … | Surface as **dock strip tabs** or **sidebar panels** when the web shell exposes parity UIs. |
| **Session / memory extensions** | `session-memory`, `session-saver`, `chronicle` | Map to **session UI** (history, save/restore) in **chat dock** or dedicated **bottom** region. |

---

## 4. Proposed data model (sketch)

Versioned JSON (aligned with **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** and **`technicalLayoutStorage`**):

- **`appearanceId`** — stable string, e.g. `pi-e-full`, `pi-e-project-local`, `stack:pure-focus+minimal`, or hash of sorted `-e` paths.
- **`dockPreset`** — which regions exist by default, order, split fractions; references shared **region IDs** (editor, primarySidebar, chat, horizontalStripN, …).
- **`defaultStripEntries`** — optional seed list of **dock** tabs per strip (**`DockStripEntry`** — mixed tools + files; see **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**).
- **`flags`** — e.g. `hideMainMenu`, `agentGridLayout`, `focusMode` (parallel **pure-focus** / **agent-team** semantics).

User overrides remain **per-appearance or global** (product decision); document choice in **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** when implemented.

---

## 5. Phased roadmap

| Phase | Deliverable | Notes |
|-------|-------------|--------|
| **P0 — Inventory** | Table above + extension → “suggested dock role” matrix | Maintain **one** canonical table; link from **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** if manifest lists tools per extension. |
| **P1 — Presets without Pi** | Built-in **`appearanceId`** presets in **`wayofpi-ui`** (simple / technical / “dense IDE” / “focus”) | Validates **dock JSON** schema; no Pi process required. |
| **P2 — Pi-e parity** | Optional UI: “load preset from **`pi-e`** selection” or paste **`-e`** list → maps to **`appearanceId`** + dock preset | May read **`.pi/settings.json`** locally via existing server for **FULL** vs **empty `extensions[]`**. |
| **P3 — Live session sync** | Web reflects **actual** loaded Pi extensions (future headless/session API) | Depends on **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** / agent bridge. |

---

## 6. Open questions

1. **Single global layout vs per-appearance storage** — migrate existing **`technicalLayoutStorage`** keys when switching appearances?
2. **Which extensions get web UI first** — prioritize widgets that already have TUI analogs (e.g. tilldone, tool counters) vs orchestration (agent-team grid).
3. **Menu bar** — should **pure-focus** hide the web **MenuBar** the same way it hides TUI chrome (policy + accessibility)?
4. **Agent-team grid** — is it a **dock region** (preferred) or a temporary **full-workbench** route?

---

## 7. Related documentation

| Doc | Relevance |
|-----|-----------|
| **[`.cursor/rules/wop-ui-modular-docks.mdc`](../.cursor/rules/wop-ui-modular-docks.mdc)** | **Appearances and dock composition** rule for implementers |
| **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** | Dock phases (N strips, movable chat/sidebar) |
| **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** | Current shell components and layout storage |
| **[PLAYGROUND.md](PLAYGROUND.md)** | **`pi-e`** modes 1–2 and `extensions[]` clearing behavior |
| **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** | Runtime vs static manifest for tools/extensions |
