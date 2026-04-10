# Way of Pi — web UI + headless Pi (namespace-isolated)

**Canonical product plan** for evolving this Pi extension playground into **Way of Pi**: a **web-operated** product with a **headless Pi** backend, **strict CLI/config isolation** from upstream `pi`, and **no collision** with a user-installed Pi unless explicitly configured.

**Supporting specs (deep links):**

| Topic | Document |
|-------|----------|
| CLI, `WOP_*` env, `WOP_HOME`, `WOP_PI_BINARY` | **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)** |
| Commands / tools / extensions → UI | **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)** |
| Multi-agent WebSocket events | **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)** |
| Safe skills, extensions, packages, updates | **[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)** |
| Current technical UI increment (Bun server + Vite React) | **[../apps/wayofpi-ui/README.md](../apps/wayofpi-ui/README.md)** |
| **Upstream check + sync** | **[WOP_UPSTREAM_SYNC.md](WOP_UPSTREAM_SYNC.md)**, **`scripts/wop-pi-upstream.ts`**, **`just wop-upstream-check`** |
| **Living backlog (missing work)** | **[WAY_OF_PI_OPEN_TODOS.md](WAY_OF_PI_OPEN_TODOS.md)** |

**Planning hub:** **[PLANNING.md](PLANNING.md)** links here and other roadmaps.

---

## Executive summary (non-technical)

**Why:** Many workflows today use a **terminal** and Pi’s **TUI** (text UI). That is powerful but hard to discover.

**What:** Way of Pi adds a **normal web app**—menus, buttons, chat—while keeping the **same engine** underneath (**headless Pi**) so extensions and packages keep working.

**Sandbox:** Way of Pi uses its **own name**, **folders** (`WOP_HOME`, e.g. `~/.wayofpi`), and **environment prefix** (`WOP_*`). It does **not** replace or overwrite another **Pi** install on the same machine unless you deliberately share paths.

**Headless** means the engine runs **without** forcing everyone through the old full-screen terminal UI; the **browser** is the main control room.

### Day in the life

You open Way of Pi in the browser, pick a **workspace** folder, and chat: *“Add a small Python game.”* You see **files** appear on the side, can **preview** changes, and get **asked before** risky commands. You can **save** a **session** and come back later. If you use **teams** of specialists, a **dashboard** shows who is working and what tools they use **live**.

### Jargon buster

| Term | Meaning |
|------|---------|
| **Terminal** | Text-only command window; not required for normal Way of Pi use. |
| **Web UI** | The clickable app in the browser (or wrapped window). |
| **Headless Pi** | Pi running as a **backend** process driven by the server, not the TUI. |
| **Model** | Which AI **brain** answers (local or cloud). |
| **Session** | Saved chapter of chat/work you can reload. |
| **Orchestration** | Several specialist agents working in parallel, visible in one UI. |

### Fears and FAQs

| Worry | Answer |
|-------|--------|
| Will it break my existing Pi? | **No by design** — separate `WOP_HOME` and CLI names; Pi binary is **`WOP_PI_BINARY`**, not “whatever is on PATH.” |
| Do I need to code? | **No** for basic chat and approvals; coding helps to **review** AI output. |
| Will it delete files silently? | Plan: **show file changes**, **approvals** for risky tools, workspace scoped to a chosen root. |
| Is data sent online? | **Depends on the model** (local vs provider); document privacy per provider. |

### Low-fidelity wireframe (general audience)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Way of Pi   [Simple | Technical]    Workspace: My Project          Settings │
├──────────────┬─────────────────────────────────────────┬──────────────────┤
│  MENU        │  MAIN (Chat / editor)                   │  FILES / DETAILS │
│  Chat        │                                           │  Edited today…   │
│  Models      │  [ conversation + code blocks ]           │                  │
│  Sessions    │  [ type message… ]              Send      │                  │
└──────────────┴─────────────────────────────────────────┴──────────────────┘
```

On small screens, the right column becomes a **drawer**.

---

*From here on, this document is for engineers and contributors.*

## Architecture (locked)

| Layer | Choice |
|-------|--------|
| **Agent runtime** | **Headless Pi** — same `extensions[]`, skills, themes, npm/git Pi packages as today. |
| **UX** | **Web UI** + optional **`wop`** CLI — no dependency on Pi TUI for end users. |
| **Playground glue** | **Way of Pi server** reproduces `ppi` / `pi-e` *behavior* (cwd, `.env`, profile semantics) while **invoking Pi** via **resolved binary** (`WOP_PI_BINARY` / bundled), not `which pi` alone. |

**Deployment model**

- **Local single-user (MVP):** one machine, one server process, browser on `localhost`; optional desktop wrapper later.
- **Hosted / multi-tenant:** future — requires **authn**, workspace allowlists, sandboxing; call out as non-MVP risk.

**Out of scope for plugin-compat v1:** Rewriting the backend without Pi subprocess.

## Command and namespace remap

See **[WOP_NAMESPACE.md](WOP_NAMESPACE.md)**. Summary: user-facing **`wop`**; env **`WOP_*`**; state **`WOP_HOME`**; child Pi only via **`WOP_PI_BINARY`**.

## Critical: rename Way of Pi backend files and identifiers (no `pi` confusion)

**Priority: critical.** Way of Pi’s **own** server, packages, scripts, and on-disk layout must **not** use bare names like **`pi`**, **`ppi`**, or ambiguous **`pi-*`** for *our* code or services. Those strings read as **upstream Pi Coding Agent** or the **`pi` CLI** and cause **support, docs, and engineering mistakes** (“which `pi`?”, “is this our binary or theirs?”).

**Do this:**

- Name **Way of Pi backend** entrypoints, directories, npm/workspace packages, systemd units, container images, and **log `service` / process titles** with **`wop`**, **`wayofpi`**, or **neutral** names (`gateway`, `api-server`) — never a standalone **`pi`** that could mean the product server.
- Keep **`pi`** / **Pi** only where you **explicitly mean upstream**: e.g. **`WOP_PI_BINARY`**, “headless **Pi** subprocess”, links to Pi docs.

**Backlog (examples):** audit **`apps/wayofpi-ui/server`**, package **`name`**, API **`service` fields**, scripts, and future **`wop serve`** implementation; rename files/modules and strings so **Way of Pi** and **upstream Pi** are always distinguishable. Full rules: **[WOP_NAMESPACE.md — Backend naming](WOP_NAMESPACE.md#backend-code-files-and-identifiers-critical)**.

## Information architecture (sitemap)

1. **Workspace** — root path, playground vs project boundary.  
2. **Files & tree** — edited-this-session + optional tree + git hints.  
3. **Chat** — streaming, stop, attachments (phased).  
4. **Models** — picker, scoped lists, defaults.  
5. **Sessions** — list/load/save/delete, storage path, retention.  
6. **Orchestration** — live per-agent cards (WebSocket contract: **WOP_MULTI_AGENT_WEBSOCKET.md**).  
7. **Pipelines** — agent-chain YAML (if productized).  
8. **Personas** — agents browser, apply persona.  
9. **Skills** — discover, invoke.  
10. **Extensions / profiles** — toggles = `pi-e` stack + `settings.json` extensions.  
11. **Themes** — preview + apply.  
12. **Tools & runs** — timeline, approvals for bash/run.  
13. **Playground link** — wizard vs scripts.  
14. **Projects docs** — `projects/<slug>/`.  
15. **Integrations** — Hermes/Honcho, GitHub keys (masked), web search.  
16. **Diagnostics** — doctor-equivalent checks.  
17. **Settings** — merged JSON, reload.

## Simple vs Technical UI mode

| Aspect | **Simple** (default) | **Technical** |
|--------|----------------------|----------------|
| **Chrome** | Calmer layout: less IDE chrome; chat-forward. | Full IDE-style: activity bar, explorer, bottom panel, dense status. |
| **Labels** | Short friendly names (“Chat”, “Team helpers”). | Names aligned with docs (`Session Chat`, `Team Pulse`, panel ids). |
| **Tool / logs** | Human summaries; panels optional or hidden. | Raw tool log tabs, monospace detail. |
| **Density** | Comfortable spacing. | Compact padding / smaller UI where applicable. |

**Persistence:** UI stores **`wayofpi.uiMode`** in `localStorage` (`simple` | `technical`). **Technical** does **not** bypass **approval** policies.

**Implementation:** [apps/wayofpi-ui](../apps/wayofpi-ui/) ships a first **toggle** in the shell; full IDE parity is phased.

## UI visual spec (tokens and breakpoints)

- **Theme:** dark-first (`#1e1e1e` surfaces), light option later; optional sync with Pi theme JSON.  
- **Typography:** one **sans** for UI, one **mono** for code, paths, JSON, logs. Sizes: **12 / 13 / 14** px base; titles **16–20** px.  
- **Color:** neutral grays + **accent** `#007acc`; semantic **success / warning / error** for status and orchestration cards.  
- **Motion:** subtle streaming indicator; avoid heavy page transitions.  
- **Breakpoints:** **≥1280px** — three-column shell when applicable; **1024–1279** — collapse sidebars to drawers; **&lt;1024** — hamburger + bottom nav pattern (chat priority).  
- **Accessibility:** focus rings, `aria-live` for streaming completion, modal focus traps.

**Component inventory (shell + MVP):** app shell (**MenuBar**, primary **nav**, **workspace** selector), **Chat** transcript + **composer**, **Models** picker, **Sessions** list, **Diagnostics** checklist, **Settings** (including UI mode), **Files** tree / edited list, **Orchestration** card grid + **Focus** drawer, **Tools** timeline + approval modal, **Command palette**, **StatusBar** / optional **bottom panel** (Technical). The reference implementation in **[apps/wayofpi-ui](../apps/wayofpi-ui/)** currently ships **MenuBar**, **ActivityBar**, **ExplorerSidebar**, **EditorPanel**, **ChatPanel**, **BottomPanel**, **StatusBar** plus **Simple / Technical** toggle.

## Control inventory (by area)

**Global:** workspace root, env profile (masked secrets), connection status, UI mode toggle, command palette (`⌘K`).  
**Chat:** send, stop, model, thinking, attach, export.  
**Orchestration:** team, grid columns, feed density, roster, presets, reload agents, per-card focus.  
**Sessions:** list, load, preview, delete, storage path, retention cleanup.  
**Extensions:** profile dropdown, module checklist, “stack only” banner mapping `PIE_CLEAR_SETTINGS_EXTENSIONS` semantics.  
**Tools:** log filter, run command approval modal, policy.  
**Diagnostics:** run all checks, export support bundle.  

(Full mirror of TUI shortcuts lives in manifest + docs, not duplicated here.)

## Functional backlog (today → web)

| Today | Web |
|-------|-----|
| `just pi` / `ppi` | `wop serve` / Start in UI |
| `pi-e` | Profiles + Extensions screen |
| TUI chat | Chat view |
| Ctrl+L/P, model files | Models view |
| Slash commands | Command palette + routes |
| Agent-team grid | Orchestration + WebSocket |
| `pi-doctor` | Diagnostics |
| `/reload` | Settings → Apply & reload |

## Phase 1 MVP (scope)

**In MVP before** orchestration grid polish and playground-link automation:

- **Chat** (streaming, stop, connection state).  
- **Models** (display current provider/model; picker wiring can follow server config).  
- **Sessions** (persistence spec + minimal UI or stub with API contract).  
- **Profiles** (extension stack selection persisted; maps to future `wop session`).  
- **Diagnostics** (health endpoint + checklist UI).  
- **Simple / Technical** toggle + persisted layout preference.  

**Later:** full orchestration multiplex, playground wizard, theme preview, git/diff polish.

## Multi-agent realtime

Normative event list: **[WOP_MULTI_AGENT_WEBSOCKET.md](WOP_MULTI_AGENT_WEBSOCKET.md)**.

## Manifest and introspection

Strategy: **[WOP_UI_MANIFEST.md](WOP_UI_MANIFEST.md)**.

## Safe customization

Pipeline and collisions: **[WOP_SAFE_CUSTOMIZATION.md](WOP_SAFE_CUSTOMIZATION.md)**.

## Production readiness (checklist)

Before calling a build “production ready” for **hosted** or **non-technical** users:

- [ ] **Authn** for the web UI (session, API keys, or SSO — product choice).  
- [ ] **Workspace allowlist** or jail: server only reads/writes under approved roots; no symlink escape.  
- [ ] **Secrets:** never log API keys; env UI masked; `.env` not committed.  
- [ ] **Rate limits** and **payload caps** on WebSocket and HTTP (chat, tree, file read).  
- [ ] **CORS** and **CSRF** policy documented for non-localhost deploys.  
- [ ] **Structured logging** (request id, workspace id) without raw prompts by default.  
- [ ] **Graceful shutdown** of headless Pi children; **timeout** on hung tools.  
- [ ] **Backup/rollback** for settings changes (**WOP_SAFE_CUSTOMIZATION.md**).  
- [ ] **Pinned Pi versions** and upgrade path documented.  
- [ ] **License / attribution** for embedded Pi (upstream notice in About).  
- [ ] **Backend naming audit** — no ambiguous **`pi`** / **`ppi`** on *our* server artifacts (see **Critical: rename Way of Pi backend files** above).

**Local single-user MVP** may ship with a subset (e.g. bind to `127.0.0.1` only, no auth) if explicitly documented.

## Non-goals and risks

- macOS `just open` Terminal workflows → browser tabs / multi-workspace.  
- **REFERENCE.md** alone as UI source — prefer **runtime manifest**.  
- **Headless API drift** — pin Pi versions; adapter in Way of Pi server.  
- **Large workspaces** — lazy tree, ignores, timeouts.  
- **Many streaming agents** — throttle, virtualize, compact default.

## Open questions

- Single-user vs multi-tenant hosting model.  
- Exact Pi CLI for `pi install` / `pi update` per pinned version.  
- Subprocess sandbox policy (same user vs restricted).  
- Session storage format shared with Pi JSONL or separate.  
- Concrete rename map for existing repo paths (e.g. server layout under **`apps/wayofpi-ui`**) vs semver / import churn — schedule with the **backend naming** milestone.

---

**Last updated:** 2026-04-10 (repo doc; keep **CHANGELOG** / **README** in sync when behavior ships).
