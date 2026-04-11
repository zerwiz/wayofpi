# Way of Pi — combined build TODO (from planning docs)

**Purpose:** One **organized backlog** of work that is **not done yet**, merged from the sources below. Use it to **sequence implementation**; keep **canonical detail** in the linked originals and **trim this file** when items ship (update **[CHANGELOG.md](../CHANGELOG.md)** and **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** as appropriate).

**Sources merged here**

| Document | Focus |
|----------|--------|
| [WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md) | **Canonical product plan** — architecture, sitemap, Phase 1 MVP, TUI→web parity, production checklist, open questions |
| [WOP_PLANNING.md](WOP_PLANNING.md) | **Planning hub** — index of roadmaps (use to discover docs; §16 lists adjacent plans) |
| [WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md) | Repo-wide gaps, server, Technical/Simple UI stubs |
| [WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md) | `pi-e` appearances → dock presets + Team Pulse |
| [WOP_GENERATED_FILES_AND_LINE_PARITY.md](WOP_GENERATED_FILES_AND_LINE_PARITY.md) | Indexing, line parity, optional repo hygiene |
| [WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md) | Menu / palette / shell parity matrix |
| [WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md) | Dock phases A–F checklists |
| [WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md) | Rule → rebuild/add/extend + verification |
| [WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md) | Orchestration event contract (to implement) |
| [WOP_NAMESPACE.md](WOP_NAMESPACE.md) | `WOP_*`, backend naming, isolation checklist |
| [WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md) | Safe apply pipeline for settings/extensions |
| [WOP_SIMPLE_UI_VIEWS.md](WOP_SIMPLE_UI_VIEWS.md) | Workspace views catalog (shipped file/API; gaps elsewhere) |
| [WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md) | Shell topology; “Next” vs shipped |
| [WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md) | Runtime manifest strategy |
| [WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md) | Upstream check/sync + future Diagnostics hook |
| [WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md) | Agents in web UI through `dispatch_agent` |

**Also:** end-to-end Pi wiring — **[WOP_PI_BACKEND_WIRING_PLAN.md](WOP_PI_BACKEND_WIRING_PLAN.md)** (implements spine of **WOP_STANDALONE_SYSTEM_PLAN**).

---

## How to use

1. Pick a **workstream** below; open the **linked doc** for full tables and design.  
2. After shipping, **check off or delete** items here and sync the **source** doc’s checkboxes/tables.  
3. Do **not** duplicate long menu matrices here — for **File → Help** row-level status, edit **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)**.

---

## 1. Product spine — headless Pi and `wop`

- [ ] User-facing **`wop`** CLI (`wop serve`, `wop doctor`, …) — replace playground-only **`ppi` / `pi-e`** strings for product workflows  
- [ ] **Headless Pi** as chat/tool engine (today: **Ollama/OpenRouter** in `server/chat.ts`, not Pi subprocesses)  
- [ ] **`WOP_HOME`**, isolated install story, **`WOP_PI_BINARY`** resolution **in the server** (see [WOP_NAMESPACE.md](WOP_NAMESPACE.md))  
- [ ] **Phase 1 MVP** — remaining gaps in **§15** ([WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md#phase-1-mvp-scope))  
- [ ] **Playground link** wizard (product form vs scripts only)  
- [ ] **Runtime manifest** — `GET /api/manifest` (tools, commands, extensions) + UI — [WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)  
- [ ] **Palette:** dynamic commands from Pi; “Run Pi slash command” bridge — [WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)  
- [ ] **Open questions** — full list in **§15** ([WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md#open-questions))

---

## 2. Server, API, WebSocket

- [ ] **Pi subprocess** (or official headless API) for chat, tools, extensions, skills  
- [ ] **Tool execution** / **approvals** / bash pipeline from web UI  
- [ ] **`/api/manifest`** (or equivalent)  
- [ ] **`GET /api/upstream`** or **Diagnostics** integrating **`scripts/wop-pi-upstream.ts`** — [WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)  
- [ ] WebSocket **auth**, **message size limits**, **reconnect** UX (production)  
- [ ] **Orchestration** — live multi-agent streams — §4  

---

## 3. Multi-agent orchestration (contract → code)

Per **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** — **not implemented** as a live wire protocol yet:

- [ ] Multiplex **`agentId` / `sessionId`** on events  
- [ ] Emit (minimum): `assistant_delta`, `message_complete`, `thinking_delta`, `tool_start`, `tool_end`, `tool_error`, `status_change`, `token_usage_update`, optional `skill_start` / `skill_end`  
- [ ] **UI:** Team Pulse grid with real state; **Focus** transcript; tool log **filter by agent**; Simple **Expand/Focus** + honest empty states  
- [ ] **Team Pulse** today: idle placeholders until events exist — [WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)

---

## 4. Workspace agents (web)

From **[WOP_WORKSPACE_AGENTS_UI_PLAN.md](WOP_WORKSPACE_AGENTS_UI_PLAN.md)**:

- [ ] **Phase A** — API failure UX (“run Way of Pi server”), optional health poll; multi-root edge cases  
- [ ] **Phase B** — parity checks (single `useAgents()` path; My AI Team copy/links)  
- [ ] **Phase C** — team-aware UX; optional team preset **hints** (no fake `dispatch_agent`)  
- [ ] **Phase D** — true **`dispatch_agent`** + Pi bridge + **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**  
- [ ] **Open questions** in source doc (default agent per team; spawn vs multiplexer; skills in catalog)

---

## 5. Modular docks (phases A–F)

From **[WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md)** — all checkboxes below are **not done** until marked in the source:

**Terminology (north star)** — In plans and UI copy, use **dock** / **docks** only; do **not** introduce product categories like **tool dock** / **file dock**. Target: **one** dock primitive (**tabs + body**, mixed content), **several** instances the user can add and **move**, same chrome and rules everywhere. Legacy code names (`ToolDockLayout`, …) are implementation debt until Phase C renames—see **`.cursor/rules/wop-ui-modular-docks.mdc`** and plan **principle 7**.

**Phase A — Visual parity**

- [ ] A1 — Unified horizontal dock header row vs editor tab row (one family)  
- [ ] A2 — Typography/borders/accent alignment  
- [ ] A3 — File tab breadcrumb/path in strip  
- [ ] A4 — Before/after screenshots in plan doc  

**Phase B — File tab in a dock ≈ editor**

- [ ] B1 — `WorkspaceTextBuffer` read-only in strip (optional replace `StripFilePreview`)  
- [ ] B2 — “Open in main editor” (+ shortcut optional)  
- [ ] B3 — Dirty buffer policy if same path in main + strip  

**Phase C — N strips**

- [ ] C1 — `DockStripInstance` design  
- [ ] C2 — Migrate `toolDock` JSON + legacy `top`/`bottom`  
- [ ] C3 — Render from array (not fixed two slots)  
- [ ] C4 — New strip / cross-strip DnD drop targets  
- [ ] C5 — Palette: add/remove strip  

**Phase D — Movable agent + sidebar**

- [ ] D1 — Chat dock **`left`** \| `right` \| `bottom`  
- [ ] D2 — Data-driven center row (extract layout shell first — [WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md))  
- [ ] D3 — Primary sidebar **`left` \| `right`** + activity bar mirror  
- [ ] D4 — Commands or DnD to move agent / flip sidebar  

**Phase E — Pane grid (stretch)**

- [ ] E1 — Layout graph spec + version field  
- [ ] E2 — Split drop targets (minimal 2×2 → generalize)  
- [ ] E3 — Per-workspace layout override  

**Phase Z — Zed-class workspace pane** (see [WOP_MODULAR_DOCKS_PLAN.md](WOP_MODULAR_DOCKS_PLAN.md) § *Zed reference model*)

- [ ] Z1 — **`PaneItem`** + **`WorkspacePaneNode`** + persistence / migration  
- [ ] Z2 — Evolve **`WorkspacePane`** into a **pane-tree** host (not only fixed **`TechnicalWorkspaceGrid`**); arbitrary splits; **cross-cell panel-tab** DnD + **edge-grow** are interim-shipped — see **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)**  
- [ ] Z3 — DnD across center pane stacks  
- [ ] Z4 — Shared + / split chrome for all center item types  
- [ ] Z5 — Copy: center pane vs docked strips (Zed: center terminal vs terminal panel)  

**Phase F — Preview & review**

- [ ] F1 — Title row: Preview + Markdown + Review Next File when context applies  
- [ ] F2 — Markdown rendered vs source pipeline  
- [ ] F3 — Review queue model + optional WebSocket/agent integration  
- [ ] F4 — Undo File / Keep File bar + styling  
- [ ] F5 — **Ctrl/Cmd+Enter** for Keep — resolve conflict with chat send (focus scope)  

**Rule-functional extras** — [WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md](WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md):

- [ ] **`schemaVersion`** on persisted dock JSON  
- [ ] Extract **`TechnicalShellLayout`** / data-driven row before more C/D churn  
- [ ] DnD **strip-id-aware** (not always `bottom`)  
- [ ] Verification checklist in §7 of rule-functional plan  

---

## 6. Extension appearances → web views

From **[WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md](WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md)**:

- [ ] **P0** — Extension → suggested **dock role** matrix (maintain with manifest)  
- [ ] **P1** — Built-in **`appearanceId`** presets (dense IDE, focus, …) without Pi  
- [ ] **P2** — Map **`pi-e`** selection or `-e` list → `appearanceId` + dock preset (optional read `.pi/settings.json`)  
- [ ] **P3** — Live sync with **actual** loaded Pi extensions (needs headless/session API)  
- [ ] **Open questions** — per-appearance layout storage; which extensions first; pure-focus menu bar; Team Pulse as dock vs route  

---

## 7. Menu bar, editor, run, AI — **Planned / Partial** summary

Detailed rows: **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)**. Condensed **gaps**:

- [ ] **File** — templates; new window / second tab session; Save All workspace-wide; preferences depth; editable keyboard shortcuts  
- [ ] **Edit** — format document; full multi-cursor (Monaco path)  
- [ ] **View** — SCM/Extensions depth; Outline/Timeline (placeholders today); Simple views catalog **polish**  
- [ ] **Go** — last edit location; symbol workspace/editor beyond stubs; definition/refs (**LSP** or Pi); SCM next/prev change; add symbol to chat  
- [ ] **Run** — debug stepping; breakpoint **persistence**; task runner / running tasks registry (**API**)  
- [ ] **Terminal** — task runner integration depth  
- [ ] **Help** — devtools (desktop); process explorer  
- [ ] **Palette** — fuzzy scoring, recent commands, manifest-driven commands  
- [ ] **AI** — composer multi-file apply; rules/@-mentions; orchestration grid (ties to §3)  

**Suggested phases** (menu doc § Implementation): Server & Pi spine → workspace intelligence → run/debug depth → editor upgrade → product hardening.

---

## 8. Technical / Simple UI stubs (from open TODOs)

- [ ] **Editor** — no Monaco/LSP; Outline/Timeline placeholders  
- [ ] **Problems** — no analyzer  
- [ ] **Terminal** — host shell gated; depth tied to approvals  
- [ ] **Chat** — attachments; Team Pulse (see §3)  
- [ ] **Status bar** — problems count, ctx %, tokens (placeholders)  
- [ ] **Header model** popover — read-only vs **runtime switch** story  
- [ ] **Simple** — quick run / project runner; stub views audit under `components/simple/`  

---

## 9. Namespace, production, safe customization

**[WOP_NAMESPACE.md](WOP_NAMESPACE.md) — isolation checklist**

- [ ] Two-install story verified (docs + diagnostics)  
- [ ] Diagnostics show **`WOP_PI_BINARY`**, **`WOP_HOME`** unambiguously  
- [ ] **Backend rename pass** — no Way of Pi server artifacts ambiguously named `pi`  

**[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md) — production (hosted)**

- [ ] Authn; workspace allowlist / symlink hardening audit  
- [ ] **Secrets:** never log API keys; env UI masked; `.env` not committed  
- [ ] Rate limits; payload caps; CORS/CSRF  
- [ ] Structured logging (request id, workspace id; no raw prompts by default)  
- [ ] Graceful shutdown; tool timeouts for Pi children  
- [ ] Settings backup/rollback automation  
- [ ] Pinned Pi versions + upgrade docs  
- [ ] About / license for embedded Pi (beyond minimal Help)  
- [ ] **Local single-user MVP** subset explicitly documented if shipping without auth (e.g. bind `127.0.0.1` only)  

**[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)** — pipeline **not productized**

- [ ] Backup → preflight (throwaway Pi) → apply with diff preview → doctor → rollback  
- [ ] Pi update **only** via **`WOP_PI_BINARY`**; failure must not corrupt **`WOP_HOME`**  
- [ ] Tool-name collision UX; trust copy in UI  

---

## 10. Scripts and upstream

- [ ] **`wop`** entry script — upstream check + UI start + future Pi update  
- [ ] Optional **commit** policy for **`vendor/wop-upstream/`** (gitignored today)  
- [ ] **`wop-pi-upstream`** does not install/upgrade npm Pi — document or extend product choice  
- [ ] Diagnostics UI: **check** result; **apply** stays explicit — [WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)

---

## 11. Simple UI views catalog

**[WOP_SIMPLE_UI_VIEWS.md](WOP_SIMPLE_UI_VIEWS.md)** — file/API **shipped**; remaining work is **product polish** elsewhere:

- [ ] Deeper integration with **manifest**-driven entries when `/api/manifest` exists  
- [ ] Optional: live reload UX without full page refresh (if desired)  

---

## 12. Generated files, indexing, line parity

**[WOP_GENERATED_FILES_AND_LINE_PARITY.md](WOP_GENERATED_FILES_AND_LINE_PARITY.md)** — mostly **guidance**; optional backlog:

- [ ] Repo **`.cursorindexingignore`** / **`.gitattributes`** (`linguist-generated`) where large generated trees warrant it  
- [ ] **`.vscode/settings.json`** `files.readonlyInclude` for generated globs (if team adopts)  
- [ ] Doc **line-number** citations: prefer symbols; optional CI grep for fragile `path:line`  

---

## 13. Documentation hygiene

- [ ] Keep **[WOP_OPEN_TODOS.md](WOP_OPEN_TODOS.md)** aligned when large sections close  
- [ ] Final **`wop`** vs **`wayofpi`** spelling — [WOP_NAMESPACE.md](WOP_NAMESPACE.md)  
- [ ] Update **[WOP_TECHNICAL_UI.md](WOP_TECHNICAL_UI.md)** “Shipped / Next” after each dock or shell milestone  

---

## 14. Suggested merge order (cross-doc)

Single **recommended spine** (adjust per staffing):

1. **Server & Pi** — headless Pi, manifest, tool approvals — unlocks palette, AI row, Team Pulse reality  
2. **Phase A docks** + **extract layout shell** — safer base for C/D  
3. **Multi-agent WebSocket** + **workspace agents Phase D** — orchestration  
4. **Sessions + diagnostics + upstream UI** — product trust  
5. **Safe customization pipeline** — settings/extensions without bricking  
6. **Editor/LSP + menu Partial rows** — depth  
7. **Phase C–F docks** + **appearances P1–P2** — shell maturity  
8. **Production checklist** — when targeting non-localhost  

---

## 15. Canonical product plan ([WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md))

### Architecture / playground glue

- [ ] **Headless Pi** as agent runtime (locked); **no** plugin-compat v1 rewrite without Pi subprocess  
- [ ] Way of Pi **server** reproduces **`ppi` / `pi-e` *behavior*** (cwd, `.env`, profile semantics) while **invoking Pi** via **`WOP_PI_BINARY` / bundled** — not `which pi` alone  
- [ ] **Hosted / multi-tenant** — authn, workspace allowlists, sandboxing (non-MVP risk; track when scope expands)

### Phase 1 MVP — still open or partial

Per [Phase 1 MVP (scope)](WOP_STANDALONE_SYSTEM_PLAN.md#phase-1-mvp-scope):

- [ ] **Sessions** — persistence **spec** + **minimal UI** + **API contract**  
- [ ] **Profiles** — extension stack selection **persisted**; maps to future **`wop session`**  
- [ ] **Diagnostics** — **health** + **checklist UI** (beyond minimal `/api/health`)  
- [ ] **Models** — **picker** / scoped lists / defaults (display exists; depth TBD)  
- [ ] **Chat** — **attachments** (phased in plan); **export** (control inventory)  
- **Shipped (re-audit periodically):** Simple / Technical toggle + persisted layout preference

### “Later” (plan § Phase 1 — before orchestration polish)

- [ ] **Theme preview** + apply; **light** theme option; optional sync with **Pi theme JSON** ([UI visual spec](WOP_STANDALONE_SYSTEM_PLAN.md#ui-visual-spec-tokens-and-breakpoints))  
- [ ] **Git / diff** polish in shell  
- [ ] **Responsive shell** — breakpoints (≥1280 three-column; 1024–1279 drawers; &lt;1024 hamburger + bottom nav, chat priority)  
- [ ] **Accessibility** — `aria-live` streaming completion; modal focus traps (audit vs current UI)

### Sitemap — product surfaces not fully built

From [Information architecture (sitemap)](WOP_STANDALONE_SYSTEM_PLAN.md#information-architecture-sitemap) (cross-ref other sections here):

- [ ] **Workspace** — playground vs **project boundary** UX (ties **Playground link** wizard)  
- [ ] **Files & tree** — **edited-this-session** list; **git** hints in tree  
- [ ] **Pipelines** — **agent-chain** YAML if productized  
- [ ] **Skills** — discover + **invoke** from UI  
- [ ] **Extensions / profiles** — profile dropdown, module checklist, **`PIE_CLEAR_SETTINGS_EXTENSIONS`** semantics banner in web  
- [ ] **Themes** — preview + apply  
- [ ] **Tools & runs** — **timeline**, **approvals** for bash/run (needs Pi tools spine)  
- [ ] **Integrations** — Hermes/Honcho, **GitHub keys** (masked), web search — surfaced in product UI  
- [ ] **Diagnostics** — **run all checks**, **export support bundle**  
- [ ] **Settings** — **merged JSON** editing + **Apply & reload** (Pi **`/reload`** equivalent)

### Functional parity (today TUI → web)

From [Functional backlog (today → web)](WOP_STANDALONE_SYSTEM_PLAN.md#functional-backlog-today--web):

- [ ] **`just pi` / `ppi`** → **`wop serve`** / **Start in UI**  
- [ ] **`pi-e`** → **Profiles + Extensions** screen  
- [ ] **Slash commands** → command palette + routes (**manifest**)  
- [ ] **Agent-team grid** → orchestration + WebSocket (**§3**)  
- [ ] **`pi-doctor`** → Diagnostics  
- [ ] **`/reload`** → Settings → **Apply & reload**

### Critical: backend naming audit (plan § + [WOP_NAMESPACE](WOP_NAMESPACE.md))

- [ ] Audit **`apps/wayofpi-ui/server`**, package **`name`**, API **`service`** fields, scripts, future **`wop serve`** — no ambiguous **`pi`** / **`ppi`** for *our* artifacts  

### Non-goals / risks → engineering mitigations

From [Non-goals and risks](WOP_STANDALONE_SYSTEM_PLAN.md#non-goals-and-risks):

- [ ] **Large workspaces** — lazy tree, **ignore** rules, timeouts  
- [ ] **Many streaming agents** — throttle, virtualize, compact default  
- [ ] **Headless API drift** — pin Pi versions; **adapter** in Way of Pi server  

### Open questions (plan)

- [ ] Single-user vs **multi-tenant** hosting model  
- [ ] Exact Pi CLI for **`pi install` / `pi update`** per pinned version  
- [ ] **Subprocess sandbox** policy (same user vs restricted)  
- [ ] **Session storage** format: shared with Pi JSONL vs separate  
- [ ] **Rename map** for repo paths (e.g. under **`apps/wayofpi-ui`**) vs semver / import churn — schedule with **backend naming** milestone  

---

## 16. Planning hub ([WOP_PLANNING.md](WOP_PLANNING.md))

- [ ] Use **[WOP_PLANNING.md](WOP_PLANNING.md)** as the **table of contents** for roadmaps; add rows when new plans land.  
- [ ] **Adjacent roadmaps** (not duplicated in full above — track separately or spin sub-milestones):  
  - [ ] **[PLAN_AWESOME_CODEX_SUBAGENTS.md](PLAN_AWESOME_CODEX_SUBAGENTS.md)** — Codex subagents → Pi `.md` agents  
  - [ ] **[PLAN_AGENT_MODEL_ROUTING.md](PLAN_AGENT_MODEL_ROUTING.md)** — agent/model routing experiments  
- [ ] Optional hub rows if missing: **[IDE_EXPLORER_PARITY.md](IDE_EXPLORER_PARITY.md)**, **[WOP_MENU_BAR_BACKLOG.md](WOP_MENU_BAR_BACKLOG.md)** (already linked from many docs)

---

**Last updated:** 2026-04-11 (aggregated snapshot; edit sources of truth when behavior changes).
