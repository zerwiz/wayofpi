# Way of Pi and ngrok — public URL to your dev machine

This document explains how **ngrok** fits into Way of Pi: optional **HTTPS** links to the machine where the app runs, **without** replacing normal local use (`http://localhost:…`).

**Official ngrok docs:** [https://ngrok.com/docs](https://ngrok.com/docs)

---

## What you get

- A temporary **`https://…`** URL that forwards to your **Vite dev port** (usually **5173**) or, if you run Bun-only static, to **`WOP_SERVER_PORT`** (default **3333**).
- Same-origin **`/api`** and **`/ws`** in dev (Vite proxies to Bun), so chat and tools keep working through the tunnel.
- **Optional HTTP Basic Auth** for tunnel-style hostnames so random visitors cannot use your dev host without a login you set in Settings.

---

## In the app (recommended path)

Open **Settings → ngrok (optional)** (from the menu bar, often under **File** or **Help**, depending on shell). The dialog uses a **two-column** layout on wide screens: scrollable help on the left and a **Terminal** column on the **right** (same integrated PTY as the bottom panel — `/ws/terminal`, workspace cwd); on narrow widths it stacks below.

### 1. Install the agent

- **Install ngrok into this app** runs **`bun install`** or **`npm install`** in **`apps/wayofwork-ui`** so the optional **`ngrok`** npm package can download the platform binary into **`node_modules/ngrok/bin`**.  
  Available whenever the Bun server serves these Settings routes (including **`npm start`** / **`NODE_ENV=production`**).
- If you prefer a **system-wide** binary on `PATH`, use the collapsible **system install (apt / Homebrew)** block in that dialog, or from the repo root: **`./scripts/install-ngrok-optional.sh`** (see **[scripts/README.md](../scripts/README.md)**).

### 2. Authtoken

- Copy **Your Authtoken** from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).
- Paste it in section 2 and save. The server runs **`ngrok config add-authtoken`** on the **host** (not in the browser). **This is allowed even when `WOP_ALLOW_NGROK_SPAWN` is off** so you can configure the agent and run **`ngrok http`** yourself.

### 3. Start the tunnel

- Turn the **managed tunnel** on when the CLI is detected and **`WOP_ALLOW_NGROK_SPAWN`** is not disabled. Way of Pi runs **`ngrok http <tunnelPort>`** for you, where **`tunnelPort`** comes from **`WOP_VITE_PORT`** / **`VITE_DEV_SERVER_PORT`** (default **5173**). For Bun-only static on **3333**, set **`WOP_VITE_PORT=3333`** so the managed command matches the port you open in the browser.

### 4. Tunnel login (optional)

- Set a **login name** and **password** and enable **Require login** so browsers hitting an **ngrok-style** hostname must pass **HTTP Basic Auth** before any page, API, or WebSocket traffic.
- Credentials are stored under **`WOP_HOME`** as **`tunnel-gate.v1.json`** (password is hashed). See **[WOP_NAMESPACE.md](./WOP_NAMESPACE.md)** for **`WOP_HOME`** and **`WOP_TUNNEL_GATE_HOST_MARKERS`**.

### Copy addresses

- Use **Refresh** to reload **LAN** hints and the **public** URL (from the local ngrok inspector when a tunnel is up).
- Inspector on the host: [http://127.0.0.1:4040](http://127.0.0.1:4040).

---

## Ports and proxies

| How you run | Typical tunnel target | Notes |
|-------------|----------------------|--------|
| **`npm run dev`** / Vite + Bun | **`ngrok http 5173`** (or your **`WOP_VITE_PORT`**) | Vite serves the UI; **`/api`** and **`/ws`** proxy to Bun on **3333**. Match ngrok to the **browser origin** port. |
| Bun only (static + API) | **`ngrok http 3333`** (or **`WOP_SERVER_PORT`**) | No Vite in front. |

---

## Environment variables (summary)

| Variable | Role |
|----------|------|
| **`WOP_ALLOW_NGROK_SPAWN`** | When **`0`** / **`false`** / **`no`** / **`off`**, Way of Pi does not **start** or **stop** the managed **`ngrok http`** child from the UI. **Authtoken save** (section 2) and **`install-bundled`** are **not** blocked by this flag. Unset defaults to **spawn allowed**. |
| **`WOP_NGROK_BINARY`** | Absolute path to the **`ngrok`** executable (overrides PATH and bundled **`node_modules`**). |
| **`WOP_VITE_PORT`** / **`VITE_DEV_SERVER_PORT`** | Dev UI port; used as the managed tunnel target port. |
| **`WOP_SERVER_PORT`** | Bun API + WebSocket port (default **3333**). |
| **`WOP_HOME`** | Data dir; **`tunnel-gate.v1.json`** for tunnel Basic Auth lives here. |
| **`WOP_TUNNEL_GATE_HOST_MARKERS`** | Optional comma-separated substrings; if the request hostname contains any, tunnel login may apply (in addition to hostnames containing **`ngrok`**). |
| **`WOP_NGROK_WEB_ADDR`** | Optional host/port (e.g. **`127.0.0.1:4040`**) or **`http://…`** for the ngrok agent’s local inspector. Must match **`web_addr`** in your ngrok config if you changed it; Way of Pi uses it for **`/api/tunnels`** and passes **`--web-addr`** when starting the managed tunnel. |

Full server env list: **[apps/wayofwork-ui/README.md](../apps/wayofwork-ui/README.md)** and **`apps/wayofwork-ui/.env.sample`**.

---

## ERR_NGROK_3200 (“endpoint offline”)

Usually means there is **no active tunnel** for that **`https://…ngrok…`** hostname (tunnel stopped, or you bookmarked an old URL). Start **`ngrok http …`** again and copy the **new** public URL from the inspector (**`WOP_NGROK_WEB_ADDR`**, default **`http://127.0.0.1:4040`**) on the **same machine** that runs ngrok — not from your phone’s **`127.0.0.1`**.

Way of Pi also checks that **something is listening** on **`127.0.0.1:`** + the tunnel target port (default Vite **5173**) before starting the managed tunnel, so ngrok is not pointed at an idle port.

---

## HTTP API (`/api/dev/…` paths)

These routes are served by the Way of Pi Bun server in **all** **`NODE_ENV`** values (including **`production`**). If you see **404**, the request is not reaching this server (for example a reverse proxy that omits **`/api/dev/*`**).

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | **`/api/dev/ngrok-tunnel`** | Status: CLI resolution, managed tunnel, **`tunnelPort`**, best-effort **`publicUrl`**, **`installBundledAllowed`**, **`authtokenSaveAllowed`**. |
| **POST** | **`/api/dev/ngrok-tunnel`** | **`action`**: **`start`**, **`stop`**, **`install-bundled`**, **`update-bundled`**, **`set-authtoken`** (with **`authtoken`** string). |
| **GET** / **POST** | **`/api/dev/tunnel-gate`** | Tunnel Basic Auth file status / save / clear. |
| **GET** | **`/api/dev/share-url-hints`** | LAN URL guess + public URL hint from the local inspector. |

Implementation: **`apps/wayofwork-ui/server/ngrok-tunnel-manager.ts`**, **`ngrok-binary.ts`**, **`ngrok-inspector.ts`**, **`tunnel-gate.ts`**.

---

## Security

- A public tunnel exposes **your dev server** to the internet for as long as it runs. Use **short-lived** tunnels and **stop** when finished.
- Prefer **tunnel login** (section 4) so the ngrok URL is not a wide-open door.
- **Do not** commit ngrok **authtokens** or tunnel passwords to git.
- **`install-bundled`** and **`update-bundled`** run a package manager on disk under **`apps/wayofwork-ui`**; only use them on machines you trust.

---

## Related docs

- **[WAY_OF_PI_INTRODUCTION.md](./WAY_OF_PI_INTRODUCTION.md)** — short optional ngrok mention.
- **[WOP_NAMESPACE.md](./WOP_NAMESPACE.md)** — **`WOP_*`** names and **`WOP_HOME`**.
- **[WOP_PI_BACKEND_WIRING_PLAN.md](./WOP_PI_BACKEND_WIRING_PLAN.md)** — server and Pi integration map.
- **[apps/wayofwork-ui/README.md](../apps/wayofwork-ui/README.md)** — dev server and API table.
