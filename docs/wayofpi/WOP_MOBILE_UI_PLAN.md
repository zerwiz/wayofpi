# Way of Pi — mobile-friendly UI (Claw, Simple, Technical)

This document plans **mobile-specific layouts** for all three Way of Pi shells — **Claw**, **Simple**, and **Technical** — each **distinct** from its desktop chrome (no squeezed **`TechnicalWorkspaceGrid`**, no desktop **`SimpleApp`** / **Claw** rail jammed into 360px). All variants reuse the **same Bun server, `/api`, and `/ws`** and the same **Pi parity** rules as desktop.

**Implementation order (locked for this roadmap):**

1. **Claw** — mobile Claw UI **first**  
2. **Simple** — mobile Simple UI **second**  
3. **Technical** — mobile Technical UI **last** (largest surface area: grid, editor, terminals, docks)

**Related:** **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** (desktop shells), **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)** (Claw desktop), **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** (Pi lock), **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**, **`.cursor/rules/wop-ui-workspace-agents.mdc`**.

---

## 1. Goals and non-goals

### Goals

| Goal | Detail |
|------|--------|
| **Three mobile UIs** | **Claw**, **Simple**, and **Technical** each get a **dedicated** touch-first layout and navigation; shared **tokens** / shell chrome where it saves duplication. |
| **Same `uiMode`, same session keys** | Keep **`useWayOfPiSession(surfaceId)`** with **`surfaceId`** in **`simple` \| `technical` \| `claw`** so transcripts and **`activate_session`** keys stay aligned with desktop — mobile is a **layout branch**, not a fourth mystery surface (unless we later add an explicit **`mobile`** aggregate — **not** the default in this plan). |
| **Mobile-friendly** | Touch targets ≥ 44px where practical, single-column flows, sheets for secondary actions, safe-area insets; optional PWA later. |
| **Same backend** | Relative **`/api/*`**, **`/ws`**, **`/api/manifest`**; same Vite → Bun dev proxy (**[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** runtime topology). |
| **Honest capability** | Stubs with **not on mobile yet** where a desktop-only feature has no mobile path (**parity rule**). |

### Non-goals

| Non-goal | Reason |
|----------|--------|
| **Second Bun “mini Pi”** | No mobile-only agent loop; chat/tools stay server + **`WOP_PI_BINARY`**. |
| **Technical parity on day one** | Technical mobile ships **after** Claw + Simple; subset + stubs OK until later milestones. |
| **Replacing desktop shells** | Desktop **Simple** / **Technical** / **Claw** stay; mobile is alternate layout when **`shell=mobile`** (or equivalent) is active. |

---

## 2. Entry, routing, and layout model

### 2.1 How mobile attaches to existing modes

| Mechanism | Detail |
|-----------|--------|
| **`?shell=mobile`** (and optional **`/m`**) | Forces **mobile layout** for the **current** **`uiMode`** (Claw / Simple / Technical). Persist in **`localStorage`** so LAN bookmarks behave. |
| **Optional `matchMedia`** | Later: suggest “Switch to mobile layout” when viewport is narrow **without** overriding desktop users who shrink a window (product default stays **opt-in** via URL or Settings until decided). |
| **`App.tsx` branch** | When **`shell=mobile`**: shared **`MobileChrome`**; **Claw** uses **`ClawApp`** **`layoutVariant="mobile"`** (not desktop Claw chrome); **Simple** uses **`SimpleApp`** **`layoutVariant="mobile"`** (not desktop **`SimpleNavRail`** split); **Technical** uses **`MobileTechnicalShell`** (stub) instead of full **`TechnicalWorkspaceGrid`** + **`MenuBar`** until Track 3. |

Desktop **`useUiMode()`** (`simple` \| `technical` \| `claw`) is unchanged; mobile only swaps **presentation**.

### 2.2 Per-shell information architecture (targets)

| Shell | Mobile IA (directional — detail in track phases) |
|-------|---------------------------------------------------|
| **Claw (build first)** | Mission / status / engine row, schedules (read + safe actions), claw chat surface, host **`.claw/`** subset (**`/api/claw/*`**), help/legal entry; **no** desktop-only multi-column Claw chrome. |
| **Simple (build second)** | Chat-first column, agent picker sheet, lightweight workspace tree or “open on desktop” paths, settings strip; mirrors **`SimpleChatView`** flows without desktop **`SimpleNavRail`** density. |
| **Technical (build last)** | Explorer-first or tabbed **Files | Chat | Tools**; **read-only file preview** before any editor; **defer** multi-cell grid, DnD, **`WorkspacePane`** tool tabs, terminal until Pi/server story is clear; **MenuBar** replaced by overflow / sheet. |

---

## 3. Product build sequence (tracks)

Work **strictly** in this order: finish the **exit criteria** for a track before starting the next.

### Track 0 — Shared foundations (short, can overlap start of Track 1)

| Task | Output |
|------|--------|
| **`shell=mobile` + persistence** | Parse query + **`localStorage`**; **`App.tsx`** gate. **`useShellMobile`** lives in **`apps/wayofpi-ui/src/components/mobile/useShellMobile.ts`**. |
| **Shared mobile chrome** | **`apps/wayofpi-ui/src/components/mobile/chrome/MobileChrome.tsx`** (safe area, top bar, “desktop layout” escape). |
| **Hooks unchanged** | **`useWayOfPiSession`**, **`useServerConfig`**, **`useWorkspaceTree`** consumed from mobile leaves — **no** duplicate WS client. |

---

### Track 1 — Claw mobile (**first ship**)

| Phase | Task | Output |
|-------|------|--------|
| **C-M1** | **Claw chat + WS** | **`useWayOfPiSession("claw", …)`** in **`MobileClawShell`**: composer, streaming, **`chatWsErrorHint`** parity, agent/orchestrator picker for Claw. |
| **C-M2** | **Mission + engine status** | Reuse **`ClawMissionView`** data paths or slim **`MobileClawMission`** — same **`/api/config`**, automation status hooks; no fake “healthy” if server disagrees. |
| **C-M3** | **Schedules + mission events** | Mobile list / calendar-friendly views for **`useClawSchedules`** + events; respect read-only vs POST where server allows. |
| **C-M4** | **`.claw` explorer subset** | Tree / file list from existing Claw APIs; tap → preview or download path; align **[WOP_CLAW_UI_PLAN.md](WOP_CLAW_UI_PLAN.md)** for gaps. |
| **C-M5** | **Help + polish** | **`ClawHelpModal`** content reachable on small screens (sheet or full-screen); touch targets. |

**Track 1 exit:** Claw users can run a **full Claw-oriented session** on a phone (chat + mission + schedules + critical Claw APIs) without loading desktop Claw chrome.

---

### Track 2 — Simple mobile (**second ship**)

| Phase | Task | Output |
|-------|------|--------|
| **S-M1** | **Simple chat** | Same session as desktop: **`SimpleApp`** with **`layoutVariant="mobile"`** ( **`useWayOfPiSession("simple", …)`** stays in **`App.tsx`** / **`SimpleChatView`**); plan/build, queue UX as on desktop. |
| **S-M2** | **Agents + models** | Sheets for **`/api/agents`**, model selection; **`set_agent`**, **`set_model`** over WS. |
| **S-M3** | **Workspace (read)** | **`useWorkspaceTree`** mobile tree; **`GET /api/file`** preview optional. |
| **S-M4** | **Settings + Simple-only tabs** | Port **`SimpleSettingsView`** / **`SimpleTeamView`** patterns into mobile sheets where still relevant. |

**Track 2 exit:** Simple-mode workflows (chat + agents + light workspace + settings) usable on phone without the **desktop** **`SimpleApp`** chrome (nav rail + split); mobile uses bottom tabs, file sheet, and editor overlay.

---

### Track 3 — Technical mobile (**last ship**)

| Phase | Task | Output |
|-------|------|--------|
| **T-M1** | **Explorer + single buffer** | One active file path; **`WorkspaceTextBuffer`** or read-only preview; **no** multi-cell grid in v1. |
| **T-M2** | **Chat dock** | **`useWayOfPiSession("technical", …)`** in a bottom sheet or tab “Chat”; orchestrator parity. |
| **T-M3** | **Problems / output** | Read-only lists or stubs with honest labels. |
| **T-M4** | **Terminal** | Only if **`WOP_ALLOW_TERMINAL`** and UX is safe on touch; else **disabled + labeled**. |
| **T-M5** | **Grid + tools (stretch)** | Optional later: simplified **`TechnicalWorkspaceGrid`** or **abandon multi-cell on mobile** in favor of “open on desktop for grid”. |

**Track 3 exit:** Technical users can browse, open a file, chat with orchestrator, and see diagnostics **or** clear stubs — no broken half-IDE.

---

## 4. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **`App.tsx` size** | **`src/components/mobile/`** (**`chrome/`**, **`claw/`**, **`simple/`**, **`technical/`**, **`useShellMobile.ts`**, **`index.ts`**); **`App.tsx`** only switches shells. |
| **Claw / Simple drift** | Shared **`mobile/`** primitives (**`MobileSheet`**, list rows); one **`chatWsErrorHint`** / connection pattern. |
| **Technical infinite scope** | **Track order** keeps Technical last; **T-M5** explicitly deferrable. |
| **Regression on desktop** | Mobile gate **off** by default; CI smoke for all three **`uiMode`** desktop paths. |

---

## 5. Acceptance criteria (summary)

| Track | “Done” means |
|-------|----------------|
| **1 — Claw** | **`shell=mobile`** + **`uiMode=claw`**: mission, chat, schedules, and primary Claw APIs usable; help reachable. |
| **2 — Simple** | **`shell=mobile`** + **`uiMode=simple`**: chat, agents, tree/preview, settings without desktop **`SimpleApp`**. |
| **3 — Technical** | **`shell=mobile`** + **`uiMode=technical`**: explorer + file view + chat; terminal/tools only when honest. |

---

## 6. Documentation and tracking

| When | Update |
|------|--------|
| After Track 0 | **`apps/wayofpi-ui/README.md`** — **`?shell=mobile`**, **`uiMode`** interaction. |
| After Track 1 | **`docs/WOP_CLAW_UI_PLAN.md`** — mobile subsection or pointer here; **`docs/WOP_TECHNICAL_UI.md`** Scope row **Claw mobile**. |
| After Track 2 | **`docs/WOP_TECHNICAL_UI.md`** — **Simple mobile** row. |
| After Track 3 | **`docs/WOP_TECHNICAL_UI.md`** — **Technical mobile** row. |
| Ongoing | **`docs/WOP_OPEN_TODOS.md`** / **`docs/WOP_COMBINED_BUILD_TODO.md`** — per-phase checkboxes. |

---

## 7. Open decisions

1. **Default on narrow viewport:** auto-prompt **Switch to mobile** vs **URL-only** (current bias: URL-only until Track 2).  
2. **Technical multi-cell on mobile:** ship **never** vs **T-M5** only for tablet landscape.  
3. **`ClawHelpModal`:** full-screen on mobile vs paginated sections.  
4. **iOS Safari** — `dvh` + sticky composer checklist for all three shells.

**Last updated:** 2026-04-12 — scope expanded to **Claw + Simple + Technical**; build order **Claw → Simple → Technical**.
