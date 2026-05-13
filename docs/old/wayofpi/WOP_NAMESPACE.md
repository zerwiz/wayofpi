# Way of Pi — command and environment namespace

This document defines **user-facing names** and **environment variables** for Way of Pi so it **never collides** with an upstream **[Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent)** install. Canonical product plan: **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)**.

## Workspace (project) vs Way of Pi system files

**They are not the same thing** — treat the distinction as mandatory in code and docs.

| Term | Meaning |
|------|--------|
| **Workspace (project root)** | The folder(s) the **Bun server** is serving: **`WOP_WORKSPACE`** (if set) or **`process.cwd()`** when the server starts, then any roots from **Open Folder** / `.code-workspace` / workspace APIs (`listWorkspaceFolders()` in **`apps/wayofwork-ui/server/workspace-state.ts`**). All jailed **`/api/file`**, **`/api/tree`**, agent markdown scans, and chat/Pi **cwd** use **these** paths. |
| **Way of Pi system / product files** | The **Way of Pi** application checkout (e.g. **`apps/wayofwork-ui/`**), **`WOP_HOME`**, scripts, and bundled UI — the **product** on disk, not the user’s target repo unless they opened it as their workspace. |
| **Editor / UI shell state** | Which file tab is active (`selectedPath`), dock layout, etc. — **client-only**. It must **not** redefine the server workspace; switching tabs does **not** change **`WOP_WORKSPACE`**. |

Do **not** read project config (e.g. **`agent/settings.json`**) from the playground repo when the user has opened a **different** workspace — resolve paths only under **`listWorkspaceFolders()`** (see **`server/pi-ollama-env.ts`** and **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**).

## Principles

1. **Do not** ship global binaries named `pi`, `ppi`, or `pi-e` from Way of Pi.
2. **Do not** use `PI_*` / `PIE_*` for Way of Pi–owned configuration visible to users; use **`WOP_*`**.
3. Resolve the **Pi binary** for headless subprocesses with **`WOP_PI_BINARY`** (or bundled path)—**never** assume `which pi` is “ours.”
4. Default **state directory** is **`WOP_HOME`** (e.g. `~/.wayofpi`), not `~/.pi`.

## Backend code, files, and identifiers (critical)

**Way of Pi must not name *its own* backend** as if it were upstream Pi. Using **`pi`**, **`ppi`**, or vague **`pi-*`** for **our** server code, repos, packages, or process names **confuses** everyone with the **Pi Coding Agent `pi` binary** and Pi’s config dirs.

| Area | Rule |
|------|------|
| **Repos / workspace packages** | Use **`wayofpi-*`**, **`wop-*`**, or domain-neutral names — not a package literally named **`pi`** for the gateway server. |
| **Scripts & binaries we ship** | **`wop`**, **`wop-*`** only — already in [Principles](#principles). |
| **Source dirs & modules** | Prefer **`wop/`**, **`wayofpi/`**, or descriptive names (`server`, `api`) — avoid **`pi/`** for *our* implementation tree. |
| **Logs, metrics, `service` fields** | Identify the process as **`wayofwork-server`**, **`wop-api`**, etc., not **`pi`**. |
| **Containers / systemd** | Same — no unit named **`pi.service`** for Way of Pi. |

**Allowed uses of “Pi”:** subprocess invocation (**`WOP_PI_BINARY`**), documentation (“headless Pi”), and user-facing explanation of upstream — always **explicit**.

## User-facing CLI (planned / illustrative)

| Legacy playground habit | Way of Pi name | Role |
|-------------------------|----------------|------|
| `ppi`, `just …` recipes | **`wop`** | Dispatcher: `wop doctor`, `wop serve`, … |
| `pi-e` menu | **`wop session`** or UI **Profiles** | Extension stacks + playground link |
| `just pi` / `ppi-pi` | **`wop serve`** | Start Way of Pi server + open web UI |
| `install-global` → `ppi-*` | **`wop install`** | Symlink **`wop`**, `wop-*` only |

Final spelling (`wop` vs `wayofpi`) is a product decision; this repo uses **`wop`** in examples until renamed.

## Environment variables (`WOP_*`)

| Variable | Purpose |
|----------|---------|
| **`WOP_HOME`** | Way of Pi data: logs, backups, packaged playground clone path (default e.g. `~/.wayofpi`). Optional **tunnel-gate.v1.json** (HTTP Basic Auth when the request `Host` / `X-Forwarded-Host` looks like a public tunnel — e.g. ngrok) is read by the Bun server and Vite dev; configure from **Settings → ngrok → Tunnel login**. |
| **`WOP_TUNNEL_GATE_HOST_MARKERS`** | Optional comma-separated substrings (case-insensitive). If the effective hostname contains any marker, tunnel login may apply when enabled — in addition to hostnames containing **`ngrok`**. |
| **`WOP_WORKSPACE`** | Active project root the web UI / server may read and write (jailed I/O). Used by **[apps/wayofwork-ui](../apps/wayofwork-ui/)** server today. |
| **`WOP_SERVER_PORT`** | HTTP + WebSocket port (default `3333` in wayofwork-ui). |
| **`WOP_PI_BINARY`** | Absolute path to **Pi** executable used **only inside** Way of Pi’s child processes. |
| **`WOP_PLAYGROUND_ROOT`** | Path to this playground clone when linking extensions/skills into app repos. Also used as fallback for the **host** Way of Pi checkout root where **`.claw/`** lives when **`WOP_CLAW_HOST_ROOT`** is unset. |
| **`WOP_CLAW_HOST_ROOT`** | Optional absolute path to the Way of Pi **checkout root** (parent of **`.claw/`**). Claw’s seven workspace files and **`memory/`** live under **`<root>/.claw/workspace/`**; optional **`telegram.json`** may live at **`<root>/.claw/telegram.json`**. **Not** under **`WOP_WORKSPACE`**. Default: inferred from `apps/wayofwork-ui/server` layout (repo root). |
| **`WOP_CLAW_SCHEDULER`** | When **`1`** / **`true`** / **`on`**, the Bun server runs an interval job that executes enabled Claw schedules as headless **`pi --mode json`** turns (definitions under **`<host>/.claw/schedule/claw-schedules.v1.json`** on the Way of Pi checkout). See **`docs/WOP_CLAW_MODE_PLAN.md`** (Phase D). |
| **`WOP_CLAW_INBOUND`** | When **`0`** / **`false`** / **`off`**, **POST `/api/claw/inbound`** is rejected even if **`.wayofpi/claw-webhook.v1.json`** exists. Unset = inbound allowed when a secret is configured. |
| **`WOP_LLM_PROVIDER`** | Until headless Pi owns chat: `ollama` \| `openrouter` (see wayofwork-ui `.env.sample`). |
| **`WOP_SYSTEM_PROMPT`** | Optional system message prepended to chat sessions (WebSocket). |
| **`WOP_CHAT_CONTEXT_BUDGET`** | When unset or truthy, the Way of Pi server **trims** older chat rows before each model request on the **bundled Bun** path (and before building the headless Pi prompt) so transcripts cannot grow without bound. Set to **0**, **false**, **no**, or **off** to disable. See **`docs/WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md`**. |
| **`WOP_CHAT_MAX_MESSAGES`** | With the context budget on: max **non-system** messages kept after trim (default **120**). |
| **`WOP_CHAT_MAX_INPUT_CHARS`** | With the context budget on: approximate max **characters** (content + tool JSON) in the **non-system** tail (default **120000**). |
| **`WOP_OPENROUTER_REFERER`** | HTTP Referer for OpenRouter API (optional). |

**Inside** a headless Pi child process only, the server may map selected vars to whatever Pi expects (document per integration version)—**never** export fake `PI_*` into the user’s interactive shell by default.

## Isolation checklist

- [ ] Two installs: upstream **`pi`** on PATH + Way of Pi — no file or config overlap without opt-in.
- [ ] Docs and installers say **Way of Pi**, not “run `pi`” for product workflows.
- [ ] Diagnostics show resolved **`WOP_PI_BINARY`** and **`WOP_HOME`**, not ambiguous `~/.pi`.
- [ ] **Backend rename pass:** no Way of Pi–owned server file, package, or log identity uses ambiguous **`pi`** naming (see **Backend code, files, and identifiers** above).

## Related

- **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** — full architecture and UI plan.
- **[apps/wayofwork-ui/README.md](../apps/wayofwork-ui/README.md)** — current server env vars for the technical UI increment.
