/**
 * Way of Pi — Technical IDE Server
 *
 * Starts a Bun.serve instance on port 3334.
 * Handles terminal WebSocket connections natively (proxied to main server).
 * Shares the same SQLite database as wayofwork-ui.
 *
 * Run: `bun run server/index.ts`
 */

import { serve, file } from "bun";

const PORT = 3334;
const DB_PATH = import.meta.resolveSync("../wayofwork-ui/server/wayofpi.sqlite");
const UPSTREAM_HTTP = "http://127.0.0.1:3333";
const UPSTREAM_WS = "ws://127.0.0.1:3333";

console.log(`[technical-ide] using db at ${DB_PATH}`);

const db = new (await import("bun:sqlite")).Database(DB_PATH, { readonly: true });

serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    const isWs = req.headers.get("upgrade")?.toLowerCase() === "websocket";

    // Health check (HTTP only)
    if (url.pathname === "/api/health" && !isWs) {
      return new Response(JSON.stringify({ ok: true, app: "technical-ide" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // WebSocket upgrade — proxy to upstream main server
    if (isWs) {
      const upstreamUrl = `${UPSTREAM_WS}${url.pathname}${url.search}`;
      const upstream = new WebSocket(upstreamUrl);

      try {
        await new Promise<void>((resolve, reject) => {
          upstream.onopen = () => resolve();
          upstream.onerror = () => reject(new Error("upstream WS connection failed"));
        });
      } catch {
        upstream.close();
        return new Response("WebSocket proxy: upstream unavailable", { status: 502 });
      }

      const upgraded = server.upgrade(req, { data: { upstream } });
      if (!upgraded) {
        upstream.close();
        return new Response("WebSocket upgrade failed", { status: 500 });
      }
      return;
    }

    // Proxy HTTP to upstream
    const target = `${UPSTREAM_HTTP}${url.pathname}${url.search}`;
    try {
      const upstreamRes = await fetch(target, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      return upstreamRes;
    } catch {
      return new Response("Gateway error", { status: 502 });
    }
  },

  websocket: {
    open(ws) {
      const upstream = ws.data.upstream as WebSocket;
      upstream.onmessage = (event) => {
        try { ws.send(event.data as string); } catch { /* ignore */ }
      };
      upstream.onclose = () => {
        try { ws.close(); } catch { /* ignore */ }
      };
      upstream.onerror = () => {
        try { ws.close(); } catch { /* ignore */ }
      };
    },
    message(ws, message) {
      const upstream = ws.data.upstream as WebSocket;
      if (upstream.readyState === WebSocket.OPEN) {
        try { upstream.send(message); } catch { /* ignore */ }
      }
    },
    close(ws) {
      const upstream = ws.data.upstream as WebSocket;
      try { upstream.close(); } catch { /* ignore */ }
    },
  },
});

console.log(`[technical-ide] server running on http://0.0.0.0:${PORT}`);
console.log(`[technical-ide] proxying HTTP  -> ${UPSTREAM_HTTP}`);
console.log(`[technical-ide] proxying WS    -> ${UPSTREAM_WS}`);
