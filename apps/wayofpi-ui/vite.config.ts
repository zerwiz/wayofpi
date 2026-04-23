import { spawn } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import {
  tunnelGateAllowsNodeRequest,
  tunnelGateWriteUnauthorizedNode,
} from "./server/tunnel-gate";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Forward the browser `Host` so the Bun API can tell ngrok / tunnel hostnames from `127.0.0.1` (`changeOrigin` alone hides it). */
function attachTunnelHostForward(proxy: {
  on(event: string, listener: (...args: unknown[]) => void): void;
}): void {
  const set = (
    proxyReq: { setHeader: (n: string, v: string) => void },
    req: IncomingMessage,
  ) => {
    const h = req.headers.host;
    if (h) proxyReq.setHeader("X-Forwarded-Host", h);
  };
  proxy.on("proxyReq", (proxyReq, req) =>
    set(
      proxyReq as { setHeader: (n: string, v: string) => void },
      req as IncomingMessage,
    ),
  );
  proxy.on("proxyReqWs", (proxyReq, req) =>
    set(
      proxyReq as { setHeader: (n: string, v: string) => void },
      req as IncomingMessage,
    ),
  );
}

/** HTTP Basic Auth for tunnel-like `Host` headers (same config file as Bun — see `server/tunnel-gate.ts`). */
function wayofpiTunnelGatePlugin(): Plugin {
  return {
    name: "wayofpi-tunnel-gate",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          if (!tunnelGateAllowsNodeRequest(req as IncomingMessage)) {
            tunnelGateWriteUnauthorizedNode(res as ServerResponse);
            return;
          }
          next();
        } catch (e) {
          next(e instanceof Error ? e : new Error(String(e)));
        }
      });
    },
  };
}

/**
 * Browser dev cannot spawn processes; this dev-server-only route lets **Start service** spawn
 * `bun run server/index.ts` the same way Electron does (see `electron/electron-main.mjs`).
 * Path is outside `/api` so Vite handles it instead of proxying to Bun.
 */
function wayofpiDevStartApiPlugin(): Plugin {
  return {
    name: "wayofpi-dev-start-api",
    apply: "serve",
    configureServer(server) {
      let startInFlight = false;
      const port =
        String(process.env.WOP_SERVER_PORT || "3333").trim() || "3333";
      const healthUrl = `http://127.0.0.1:${port}/api/health`;
      const wayofpiUiRoot = __dirname;

      type HealthJson = {
        ok?: boolean;
        capabilities?: {
          workspaceProblems?: boolean;
          configRuntimePost?: boolean;
          clawHostTreeGet?: boolean;
          clawTelegramStatusGet?: boolean;
        };
      };
      /** `fresh` = current Way of Pi API; `stale` = something on the port answered /api/health but is an older build. */
      async function wayofpiBunApiState(): Promise<
        "absent" | "fresh" | "stale"
      > {
        try {
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), 900);
          const r = await fetch(healthUrl, {
            signal: ac.signal,
            headers: { Accept: "application/json" },
          });
          clearTimeout(t);
          if (!r.ok) return "absent";
          const j = (await r.json().catch(() => ({}))) as HealthJson;
          const c = j?.capabilities;
          if (
            c?.workspaceProblems === true &&
            c?.configRuntimePost === true &&
            c?.clawHostTreeGet === true &&
            c?.clawTelegramStatusGet === true
          ) {
            return "fresh";
          }
          return "stale";
        } catch {
          return "absent";
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (
          pathname !== "/__wop_dev/start-wayofpi-api" ||
          req.method !== "POST"
        ) {
          next();
          return;
        }

        res.setHeader("Content-Type", "application/json; charset=utf-8");

        if (startInFlight) {
          res.statusCode = 429;
          res.end(
            JSON.stringify({
              ok: false,
              message: "A start request is already in progress.",
            }),
          );
          return;
        }

        startInFlight = true;
        try {
          const state = await wayofpiBunApiState();
          if (state === "fresh") {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                ok: true,
                alreadyRunning: true,
                message: `Bun API is already reachable at ${healthUrl}.`,
              }),
            );
            return;
          }
          if (state === "stale") {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                ok: false,
                staleServer: true,
                message: `Port ${port} responds to /api/health but not this app's current API (missing capabilities.workspaceProblems, configRuntimePost, clawHostTreeGet, and/or clawTelegramStatusGet — old Bun). Stop the old process (macOS: lsof -nP -iTCP:${port} | grep LISTEN; Linux: ss -tlnp | grep ${port}), then click Start service again, or: cd apps/wayofpi-ui && bun run server/index.ts`,
              }),
            );
            return;
          }

          const bunExe = process.platform === "win32" ? "bun.exe" : "bun";
          try {
            const child = spawn(bunExe, ["run", "server/index.ts"], {
              cwd: wayofpiUiRoot,
              detached: true,
              stdio: "ignore",
              env: { ...process.env, NODE_ENV: "development" },
            });
            child.on("error", (err) => {
              console.error("[wayofpi-vite] failed to spawn Bun server:", err);
            });
            child.unref();
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, message }));
            return;
          }

          const deadline = Date.now() + 20_000;
          while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 400));
            if ((await wayofpiBunApiState()) === "fresh") {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  ok: true,
                  message: `Started Bun server (apps/wayofpi-ui) — ${healthUrl} is responding.`,
                }),
              );
              return;
            }
          }

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: false,
              message: `Bun did not become ready on port ${port} within 20s. Install Bun, or start manually: cd apps/wayofpi-ui && bun run server/index.ts`,
            }),
          );
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, message }));
        } finally {
          startInFlight = false;
        }
      });
    },
  };
}

/** Dev server bind: `local` = loopback only; default `0.0.0.0` = IPv4 all interfaces (phones on LAN). */
const viteHostEnv = String(process.env.WOP_VITE_HOST ?? "")
  .trim()
  .toLowerCase();
const viteServerHost =
  viteHostEnv === "" || viteHostEnv === "lan" || viteHostEnv === "all"
    ? "0.0.0.0"
    : viteHostEnv === "local" ||
        viteHostEnv === "localhost" ||
        viteHostEnv === "loopback"
      ? "127.0.0.1"
      : process.env.WOP_VITE_HOST?.trim() || "0.0.0.0";

/** Dev UI port (default **5173**). Override with **`WOP_VITE_PORT`** or **`VITE_DEV_SERVER_PORT`** if needed. */
const vitePortEnv = String(
  process.env.WOP_VITE_PORT ?? process.env.VITE_DEV_SERVER_PORT ?? "",
).trim();
const viteDevPort = /^\d+$/.test(vitePortEnv)
  ? Math.min(65535, Math.max(1, Number.parseInt(vitePortEnv, 10)))
  : 5173;

export default defineConfig({
  plugins: [wayofpiTunnelGatePlugin(), wayofpiDevStartApiPlugin(), react()],
  resolve: {
    alias: {
      "@": path.join(__dirname, "./src"),
    },
  },
  server: {
    host: viteServerHost,
    port: viteDevPort,
    // Do not silently use 5174+ (confuses bookmarks / `wait-on` / LAN); free the port or set **`WOP_VITE_PORT`**.
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3333",
        changeOrigin: true,
        configure: (proxy) => attachTunnelHostForward(proxy),
      },
      // Longer path first so `/ws` does not steal terminal upgrades.
      "/ws/terminal": {
        target: "ws://127.0.0.1:3333",
        ws: true,
        changeOrigin: true,
        configure: (proxy) => attachTunnelHostForward(proxy),
        // Browsers send Origin=http://<LAN-ip>:5173; rewrite so the hop to Bun matches Host/Origin (see vitejs/vite#16557).
        rewriteWsOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:3333",
        ws: true,
        changeOrigin: true,
        configure: (proxy) => attachTunnelHostForward(proxy),
        rewriteWsOrigin: true,
      },
    },
  },
});
