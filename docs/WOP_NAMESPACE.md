# Way of Pi — command and environment namespace

This document defines **user-facing names** and **environment variables** for Way of Pi so it **never collides** with an upstream **[Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent)** install. Canonical product plan: **[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)**.

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
| **Logs, metrics, `service` fields** | Identify the process as **`wayofpi-server`**, **`wop-api`**, etc., not **`pi`**. |
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
| **`WOP_HOME`** | Way of Pi data: logs, backups, packaged playground clone path (default e.g. `~/.wayofpi`). |
| **`WOP_WORKSPACE`** | Active project root the web UI / server may read and write (jailed I/O). Used by **[apps/wayofpi-ui](../apps/wayofpi-ui/)** server today. |
| **`WOP_SERVER_PORT`** | HTTP + WebSocket port (default `3333` in wayofpi-ui). |
| **`WOP_PI_BINARY`** | Absolute path to **Pi** executable used **only inside** Way of Pi’s child processes. |
| **`WOP_PLAYGROUND_ROOT`** | Path to this playground clone when linking extensions/skills into app repos. |
| **`WOP_LLM_PROVIDER`** | Until headless Pi owns chat: `ollama` \| `openrouter` (see wayofpi-ui `.env.sample`). |
| **`WOP_SYSTEM_PROMPT`** | Optional system message prepended to chat sessions (WebSocket). |
| **`WOP_OPENROUTER_REFERER`** | HTTP Referer for OpenRouter API (optional). |

**Inside** a headless Pi child process only, the server may map selected vars to whatever Pi expects (document per integration version)—**never** export fake `PI_*` into the user’s interactive shell by default.

## Isolation checklist

- [ ] Two installs: upstream **`pi`** on PATH + Way of Pi — no file or config overlap without opt-in.
- [ ] Docs and installers say **Way of Pi**, not “run `pi`” for product workflows.
- [ ] Diagnostics show resolved **`WOP_PI_BINARY`** and **`WOP_HOME`**, not ambiguous `~/.pi`.
- [ ] **Backend rename pass:** no Way of Pi–owned server file, package, or log identity uses ambiguous **`pi`** naming (see **Backend code, files, and identifiers** above).

## Related

- **[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)** — full architecture and UI plan.
- **[apps/wayofpi-ui/README.md](../apps/wayofpi-ui/README.md)** — current server env vars for the technical UI increment.
