import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
			const port = String(process.env.WOP_SERVER_PORT || "3333").trim() || "3333";
			const healthUrl = `http://127.0.0.1:${port}/api/health`;
			const wayofpiUiRoot = __dirname;

			type HealthJson = {
				ok?: boolean;
				capabilities?: { workspaceProblems?: boolean; configRuntimePost?: boolean };
			};
			/** `fresh` = current Way of Pi API; `stale` = something on the port answered /api/health but is an older build. */
			async function wayofpiBunApiState(): Promise<"absent" | "fresh" | "stale"> {
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
					if (c?.workspaceProblems === true && c?.configRuntimePost === true) return "fresh";
					return "stale";
				} catch {
					return "absent";
				}
			}

			server.middlewares.use(async (req, res, next) => {
				const pathname = req.url?.split("?")[0] ?? "";
				if (pathname !== "/__wop_dev/start-wayofpi-api" || req.method !== "POST") {
					next();
					return;
				}

				res.setHeader("Content-Type", "application/json; charset=utf-8");

				if (startInFlight) {
					res.statusCode = 429;
					res.end(JSON.stringify({ ok: false, message: "A start request is already in progress." }));
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
								message: `Port ${port} responds to /api/health but not this app’s current API (missing workspaceProblems + configRuntimePost on /api/health — old Bun). Stop the old process (macOS: lsof -nP -iTCP:${port} | grep LISTEN; Linux: ss -tlnp | grep ${port}), then click Start service again, or: cd apps/wayofpi-ui && bun run server/index.ts`,
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

export default defineConfig({
	plugins: [wayofpiDevStartApiPlugin(), react()],
	server: {
		proxy: {
			"/api": { target: "http://127.0.0.1:3333", changeOrigin: true },
			// Longer path first so `/ws` does not steal terminal upgrades.
			"/ws/terminal": {
				target: "ws://127.0.0.1:3333",
				ws: true,
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://127.0.0.1:3333",
				ws: true,
				changeOrigin: true,
			},
		},
	},
});
