import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ChatMessage } from "./chat";
import { streamChatCompletion } from "./chat";
import { applyLeadSystem, type ChatSessionMode } from "./session-prompts";
import { getAgentBodyByName, loadWorkspaceAgents, readPlannerAgentBodySync } from "./agents";
import { fetchOllamaTags, isValidOllamaModelId, isValidOpenRouterModelId } from "./llm-models";
import { getWorkspaceRoot, MAX_FILE_BYTES, safeResolveUnderWorkspace } from "./paths";
import { imageMimeFromPath } from "./workspace-file-mime";
import { readPackageScripts } from "./package-scripts";
import { readUiViewsCatalog, seedUiViewsCatalogIfMissing } from "./ui-views-catalog";
import { buildWorkspaceTree } from "./tree";
import {
	addFolder,
	getFrozenInitialWorkspacePath,
	getPrimaryWorkspacePath,
	listWorkspaceFolders,
	loadFoldersFromWorkspaceJson,
	openFileInWorkspace,
	openFolder,
	removeFolderByLabel,
	resetWorkspaceToInitial,
	setWorkspaceFoldersAbs,
	workspaceSwitchAllowed,
} from "./workspace-state";
import { pickNativePath } from "./native-file-dialog";
import {
	attachTerminalSession,
	disposeTerminal,
	handleTerminalMessage,
	terminalAllowed,
	type TerminalWsData,
} from "./terminal-ws";

// Integrated terminal: in production (`NODE_ENV=production`) keep opt-in via WOP_ALLOW_TERMINAL only.
// In non-production, default on when unset so local `npm run dev` gets a real shell; disable with WOP_ALLOW_TERMINAL=0|false|no|off.
// `npm run dev` forces NODE_ENV=development for the Bun process so an inherited NODE_ENV=production cannot skip this default.
if (process.env.NODE_ENV !== "production") {
	const v = process.env.WOP_ALLOW_TERMINAL?.trim();
	if (v === undefined || v === "") {
		process.env.WOP_ALLOW_TERMINAL = "1";
	}
}

const PORT = Number(process.env.WOP_SERVER_PORT || "3333");
const DIST = join(import.meta.dir, "..", "dist");

type ChatWsData = {
	kind: "chat";
	messages: ChatMessage[];
	/** True while a chat completion stream is in flight. */
	busy: boolean;
	/** User texts received while `busy`; run after the current turn completes. */
	pendingChatTexts: string[];
	/** Per-connection override (UI-selected); falls back to OLLAMA_MODEL / OPENROUTER_MODEL. */
	ollamaModel?: string;
	openrouterModel?: string;
	/** Cursor-style Plan vs Build: Plan injects Pi planner-style system instructions. */
	chatMode: ChatSessionMode;
	/** Selected Pi agent `name` from workspace `.md`, or null for generic assistant. */
	agentName: string | null;
	/** Resolved agent markdown body (after frontmatter); mirrors last successful `agentName`. */
	cachedAgentBody: string | null;
	/** Abort in-flight LLM stream (Pi-style stop generation). */
	chatAbort: AbortController | null;
};

type ServerWsData = ChatWsData | TerminalWsData;

function applyLeadFromCache(data: ChatWsData) {
	let plannerBody: string | null = null;
	if (data.chatMode === "plan" && data.agentName?.trim().toLowerCase() !== "planner") {
		plannerBody = readPlannerAgentBodySync(getPrimaryWorkspacePath());
	}
	applyLeadSystem(data.messages, {
		mode: data.chatMode,
		envSystemPrompt: process.env.WOP_SYSTEM_PROMPT,
		agentBody: data.cachedAgentBody,
		agentNameLower: data.agentName?.trim().toLowerCase() ?? null,
		plannerAgentBody: plannerBody,
	});
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

function logLine(
	level: "INFO" | "WARN" | "SUCCESS" | "ERROR",
	source: string,
	msg: string,
): string {
	const time = new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "";
	return JSON.stringify({ type: "log", time, level, source, msg });
}

function sendQueueState(ws: { send: (data: string) => void }, pending: number) {
	try {
		ws.send(JSON.stringify({ type: "queue_state", pending }));
	} catch {
		/* socket may be closing */
	}
}

async function runChatTurn(
	ws: { data: ChatWsData; send: (data: string) => void },
	text: string,
	notifyUser: boolean,
): Promise<void> {
	const data = ws.data;

	if (notifyUser) {
		ws.send(JSON.stringify({ type: "user_message", content: text }));
	}
	data.messages.push({ role: "user", content: text });
	ws.send(JSON.stringify({ type: "assistant_turn_start" }));

	const sendLog = (level: "INFO" | "WARN" | "ERROR", source: string, m: string) => {
		ws.send(logLine(level, source, m));
	};

	data.busy = true;
	const ac = new AbortController();
	data.chatAbort = ac;
	sendLog("INFO", "chat", "Requesting completion…");
	let full = "";
	try {
		const result = await streamChatCompletion(
			data.messages,
			(delta) => {
				full += delta;
				ws.send(JSON.stringify({ type: "assistant_delta", content: delta }));
			},
			sendLog,
			{
				ollamaModel: data.ollamaModel,
				openrouterModel: data.openrouterModel,
			},
			{ signal: ac.signal },
		);

		if (!result.ok) {
			if ("aborted" in result && result.aborted) {
				if (full.length > 0) {
					data.messages.push({ role: "assistant", content: full });
				}
				sendLog("WARN", "chat", "Generation stopped by user.");
				ws.send(JSON.stringify({ type: "done" }));
				return;
			}
			if ("error" in result) {
				ws.send(JSON.stringify({ type: "error", message: result.error }));
				data.messages.pop();
			}
			return;
		}

		data.messages.push({ role: "assistant", content: full });
		ws.send(JSON.stringify({ type: "done" }));
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		ws.send(JSON.stringify({ type: "error", message }));
		const last = data.messages[data.messages.length - 1];
		if (last?.role === "user") data.messages.pop();
	} finally {
		data.chatAbort = null;
		data.busy = false;
		const next = data.pendingChatTexts.shift();
		sendQueueState(ws, data.pendingChatTexts.length);
		if (next != null) {
			void runChatTurn(ws, next, false).catch(() => {
				/* runChatTurn already reports errors to the client */
			});
		}
	}
}

async function handleApi(url: URL, req: Request): Promise<Response> {
	/** Avoid 404 when clients or proxies append a trailing slash. */
	const p = url.pathname.replace(/\/+$/, "") || "/";

	if (p === "/api/health") {
		return json({ ok: true, service: "wayofpi-ui-server", time: new Date().toISOString() });
	}

	if (p === "/api/native-dialog/pick" && req.method === "POST") {
		if (!workspaceSwitchAllowed()) {
			return json({ error: "Native pick requires workspace switch (WOP_ALLOW_WORKSPACE_SWITCH)", fallback: true }, 403);
		}
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const kind = String(body.kind ?? "") === "folder" ? "folder" : "file";
		const result = pickNativePath(kind);
		if ("error" in result) {
			return json({ error: result.error, fallback: true });
		}
		if ("cancelled" in result) {
			return json({ cancelled: true });
		}
		return json({ path: result.path });
	}

	if (p === "/api/workspace" && req.method === "GET") {
		return json({
			root: getPrimaryWorkspacePath(),
			folders: listWorkspaceFolders(),
			switchAllowed: workspaceSwitchAllowed(),
			initialRoot: getFrozenInitialWorkspacePath(),
		});
	}

	if (p === "/api/workspace" && req.method === "POST") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const op = String(body.op ?? "");
		try {
			if (op === "open_folder") {
				const p = String(body.path ?? "").trim();
				if (!p) return json({ error: "path required" }, 400);
				await openFolder(p);
				return json({ ok: true, folders: listWorkspaceFolders(), root: getPrimaryWorkspacePath() });
			}
			if (op === "add_folder") {
				const p = String(body.path ?? "").trim();
				if (!p) return json({ error: "path required" }, 400);
				await addFolder(p);
				return json({ ok: true, folders: listWorkspaceFolders(), root: getPrimaryWorkspacePath() });
			}
			if (op === "remove_folder") {
				const label = String(body.label ?? "").trim();
				if (!label) return json({ error: "label required" }, 400);
				removeFolderByLabel(label);
				return json({ ok: true, folders: listWorkspaceFolders(), root: getPrimaryWorkspacePath() });
			}
			if (op === "close_workspace" || op === "reset_workspace") {
				resetWorkspaceToInitial();
				return json({ ok: true, folders: listWorkspaceFolders(), root: getPrimaryWorkspacePath() });
			}
			if (op === "open_file") {
				const p = String(body.path ?? "").trim();
				if (!p) return json({ error: "path required" }, 400);
				const selectPath = await openFileInWorkspace(p);
				return json({
					ok: true,
					folders: listWorkspaceFolders(),
					root: getPrimaryWorkspacePath(),
					selectPath,
				});
			}
			if (op === "apply_workspace_folders") {
				const pathsRaw = body.paths;
				if (!Array.isArray(pathsRaw) || pathsRaw.length === 0) {
					return json({ error: "paths array required" }, 400);
				}
				const paths = pathsRaw.map((item) => String(item ?? "").trim()).filter(Boolean);
				if (paths.length === 0) return json({ error: "No valid paths" }, 400);
				await setWorkspaceFoldersAbs(paths);
				return json({ ok: true, folders: listWorkspaceFolders(), root: getPrimaryWorkspacePath() });
			}
			if (op === "from_code_workspace_file") {
				const filePath = String(body.workspaceFilePath ?? "").trim();
				const rawJson = body.json;
				if (!filePath || rawJson === undefined) {
					return json({ error: "workspaceFilePath and json required" }, 400);
				}
				await loadFoldersFromWorkspaceJson(rawJson, filePath);
				return json({ ok: true, folders: listWorkspaceFolders(), root: getPrimaryWorkspacePath() });
			}
			return json({ error: `Unknown op: ${op}` }, 400);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 400);
		}
	}

	if (p === "/api/config" && req.method === "GET") {
		return json({
			provider: process.env.WOP_LLM_PROVIDER || "ollama",
			ollamaHost: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
			ollamaModel: process.env.OLLAMA_MODEL || "llama3",
			openrouterModel: process.env.OPENROUTER_MODEL || "openrouter/auto",
			terminalEnabled: terminalAllowed(),
		});
	}

	if (p === "/api/ui/views" && req.method === "GET") {
		const data = await readUiViewsCatalog(getPrimaryWorkspacePath());
		return json(data);
	}

	if (p === "/api/ui/views/seed" && req.method === "POST") {
		const r = await seedUiViewsCatalogIfMissing(getPrimaryWorkspacePath());
		return json({ ok: true, created: r.created, path: r.path });
	}

	if (p === "/api/llm/models" && req.method === "GET") {
		const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
		const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
		const envDefaultOllama = process.env.OLLAMA_MODEL || "llama3";
		const envDefaultOpenrouter = process.env.OPENROUTER_MODEL || "openrouter/auto";

		if (provider === "openrouter") {
			return json({
				provider: "openrouter",
				ollamaHost,
				envDefaultOllama,
				envDefaultOpenrouter,
				models: [] as unknown[],
				catalogNote:
					"OpenRouter: set OPENROUTER_API_KEY on the host; default model OPENROUTER_MODEL. Type any OpenRouter model id below (same strings Pi uses with OpenRouter).",
			});
		}

		if (provider !== "ollama") {
			return json({
				provider,
				ollamaHost,
				envDefaultOllama,
				envDefaultOpenrouter,
				models: [] as unknown[],
				unsupportedProvider: true,
				catalogNote: `This server only implements web chat for WOP_LLM_PROVIDER=ollama or openrouter. Current value "${provider}" is unsupported — change host env or use Pi TUI for other providers.`,
			});
		}

		const tags = await fetchOllamaTags(ollamaHost);
		if (!tags.ok) {
			return json({
				provider: "ollama",
				ollamaHost,
				envDefaultOllama,
				envDefaultOpenrouter,
				models: [],
				error: tags.error,
			});
		}
		return json({
			provider: "ollama",
			ollamaHost,
			envDefaultOllama,
			envDefaultOpenrouter,
			models: tags.models.map((m) => ({
				name: m.name,
				size: m.size,
				modified_at: m.modified_at,
			})),
		});
	}

	if (p === "/api/agents" && req.method === "GET") {
		try {
			const data = await loadWorkspaceAgents();
			return json(data);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/package-scripts" && req.method === "GET") {
		try {
			const scripts = await readPackageScripts();
			return json({ scripts });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/run-script" && req.method === "POST") {
		if (process.env.WOP_ALLOW_RUN?.trim() !== "1") {
			return json(
				{
					error:
						"Run is disabled. Set WOP_ALLOW_RUN=1 on the server to allow npm/bun scripts from package.json (security-sensitive).",
				},
				403,
			);
		}
		let body: { script?: string };
		try {
			body = (await req.json()) as { script?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const script = String(body.script ?? "").trim();
		if (!/^[a-zA-Z0-9_-]+$/.test(script)) return json({ error: "Invalid script name" }, 400);
		const scripts = await readPackageScripts();
		if (!scripts || !(script in scripts)) return json({ error: "Script not in package.json" }, 400);
		const cwd = getWorkspaceRoot();
		try {
			const proc = Bun.spawn(["bun", "run", script], {
				cwd,
				stdout: "pipe",
				stderr: "pipe",
			});
			const stdout = await new Response(proc.stdout).text();
			const stderr = await new Response(proc.stderr).text();
			const code = await proc.exited;
			return json({
				ok: code === 0,
				exitCode: code,
				stdout: stdout.slice(0, 24_000),
				stderr: stderr.slice(0, 24_000),
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/tree" && req.method === "GET") {
		try {
			const { root, nodes, folders } = await buildWorkspaceTree();
			return json({
				root,
				nodes,
				folders,
				switchAllowed: workspaceSwitchAllowed(),
				initialRoot: getFrozenInitialWorkspacePath(),
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/file" && req.method === "GET") {
		const rel = url.searchParams.get("path") || "";
		const abs = safeResolveUnderWorkspace(rel);
		if (!abs) return json({ error: "Invalid path" }, 400);
		try {
			const st = await stat(abs);
			if (!st.isFile()) return json({ error: "Not a file" }, 400);
			if (st.size > MAX_FILE_BYTES) return json({ error: "File too large for editor" }, 413);
			const imageMime = imageMimeFromPath(rel);
			if (imageMime) {
				const buf = await readFile(abs);
				return json({
					path: rel,
					encoding: "base64",
					mimeType: imageMime,
					content: buf.toString("base64"),
				});
			}
			const buf = await readFile(abs);
			if (buf.includes(0)) {
				return json({
					path: rel,
					encoding: "base64",
					mimeType: "application/octet-stream",
					content: buf.toString("base64"),
				});
			}
			return json({ path: rel, content: buf.toString("utf8") });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 404);
		}
	}

	if (p === "/api/file" && req.method === "PUT") {
		let body: { path?: string; content?: string };
		try {
			body = (await req.json()) as { path?: string; content?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const rel = body.path || "";
		const abs = safeResolveUnderWorkspace(rel);
		if (!abs) return json({ error: "Invalid path" }, 400);
		const content = body.content ?? "";
		if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) return json({ error: "Content too large" }, 413);
		try {
			await mkdir(dirname(abs), { recursive: true });
			await writeFile(abs, content, "utf8");
			return json({ ok: true, path: rel });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/fs/entry" && req.method === "POST") {
		let body: { path?: string; kind?: string };
		try {
			body = (await req.json()) as { path?: string; kind?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const rel = String(body.path ?? "").trim().replace(/^[/\\]+/, "");
		const kind = body.kind === "dir" ? "dir" : body.kind === "file" ? "file" : "";
		if (!rel || rel === "." || rel.includes("..")) {
			return json({ error: "Invalid path" }, 400);
		}
		if (kind !== "file" && kind !== "dir") {
			return json({ error: 'kind must be "file" or "dir"' }, 400);
		}
		const abs = safeResolveUnderWorkspace(rel);
		if (!abs) return json({ error: "Invalid path" }, 400);
		if (existsSync(abs)) {
			return json({ error: "Path already exists" }, 409);
		}
		try {
			if (kind === "dir") {
				await mkdir(abs, { recursive: true });
			} else {
				await mkdir(dirname(abs), { recursive: true });
				await writeFile(abs, "", "utf8");
			}
			return json({ ok: true, path: rel });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	return json({ error: "Not found" }, 404);
}

function serveStatic(pathname: string): Response | null {
	if (!existsSync(DIST)) return null;
	let rel = pathname === "/" || pathname === "" ? "index.html" : pathname.replace(/^\/+/, "");
	if (rel.includes("..")) return null;
	const file = join(DIST, rel);
	const distNorm = join(DIST, ".");
	if (!file.startsWith(distNorm)) return null;
	if (existsSync(file)) {
		return new Response(Bun.file(file));
	}
	if (!rel.includes(".")) {
		const idx = join(DIST, "index.html");
		if (existsSync(idx)) return new Response(Bun.file(idx));
	}
	return null;
}

const server = Bun.serve<ServerWsData>({
	port: PORT,
	async fetch(req, srv) {
		const url = new URL(req.url);

		if (url.pathname === "/ws/terminal" && req.headers.get("upgrade") === "websocket") {
			if (!terminalAllowed()) {
				return new Response(
					"Terminal disabled. Set WOP_ALLOW_TERMINAL=1 on the server and restart. This exposes a real host shell (security-sensitive).",
					{ status: 403 },
				);
			}
			const upgraded = srv.upgrade(req, {
				data: {
					kind: "terminal",
					child: null,
				} satisfies TerminalWsData,
			});
			if (upgraded) return undefined as unknown as Response;
			return new Response("WebSocket upgrade failed", { status: 500 });
		}

		if (
			url.pathname === "/ws" &&
			req.headers.get("upgrade") === "websocket"
		) {
			const upgraded = srv.upgrade(req, {
				data: {
					kind: "chat",
					messages: [] as ChatMessage[],
					busy: false,
					pendingChatTexts: [],
					ollamaModel: undefined,
					openrouterModel: undefined,
					chatMode: "build",
					agentName: null,
					cachedAgentBody: null,
					chatAbort: null,
				} satisfies ChatWsData,
			});
			if (upgraded) return undefined as unknown as Response;
			return new Response("WebSocket upgrade failed", { status: 500 });
		}

		if (url.pathname.startsWith("/api/")) {
			return handleApi(url, req);
		}

		const staticRes = serveStatic(url.pathname);
		if (staticRes) return staticRes;

		return new Response("Not found", { status: 404 });
	},
	websocket: {
		open(ws) {
			if (ws.data.kind === "terminal") {
				attachTerminalSession(ws);
				return;
			}
			applyLeadFromCache(ws.data);
			const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
			const envOllama = process.env.OLLAMA_MODEL || "llama3";
			const envOr = process.env.OPENROUTER_MODEL || "openrouter/auto";
			const effectiveModel =
				provider === "openrouter"
					? ws.data.openrouterModel || envOr
					: ws.data.ollamaModel || envOllama;
			ws.send(
				JSON.stringify({
					type: "ready",
					workspace: getWorkspaceRoot(),
					provider,
					effectiveModel,
					ollamaModel: ws.data.ollamaModel ?? null,
					openrouterModel: ws.data.openrouterModel ?? null,
					chatMode: ws.data.chatMode,
					agentName: ws.data.agentName,
				}),
			);
		},
		close(ws) {
			if (ws.data.kind === "terminal") {
				disposeTerminal(ws);
			}
		},
		async message(ws, raw) {
			if (ws.data.kind === "terminal") {
				handleTerminalMessage(ws, raw);
				return;
			}
			let msg: { type?: string; content?: string; model?: string; mode?: string; agent?: string | null };
			try {
				msg = JSON.parse(String(raw));
			} catch {
				ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}
			if (msg.type === "ping") {
				ws.send(JSON.stringify({ type: "pong" }));
				return;
			}
			if (msg.type === "stop_chat") {
				ws.data.chatAbort?.abort();
				return;
			}
			if (msg.type === "set_model") {
				if (ws.data.busy) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Wait for the current reply to finish before changing the model.",
						}),
					);
					return;
				}
				const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
				const id = String(msg.model ?? "").trim();
				if (provider !== "openrouter" && provider !== "ollama") {
					ws.send(
						JSON.stringify({
							type: "error",
							message: `WOP_LLM_PROVIDER="${provider}" — web chat only supports ollama or openrouter; cannot set session model.`,
						}),
					);
					return;
				}
				if (provider === "openrouter") {
					if (!isValidOpenRouterModelId(id)) {
						ws.send(JSON.stringify({ type: "error", message: "Invalid OpenRouter model id" }));
						return;
					}
					ws.data.openrouterModel = id;
					ws.data.ollamaModel = undefined;
				} else {
					if (!isValidOllamaModelId(id)) {
						ws.send(JSON.stringify({ type: "error", message: "Invalid Ollama model id" }));
						return;
					}
					ws.data.ollamaModel = id;
					ws.data.openrouterModel = undefined;
				}
				ws.send(
					JSON.stringify({
						type: "model_set",
						effectiveModel: id,
						provider,
					}),
				);
				return;
			}
			if (msg.type === "set_chat_mode") {
				if (ws.data.busy) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Wait for the current reply to finish before switching Plan / Build mode.",
						}),
					);
					return;
				}
				const next: ChatSessionMode = String(msg.mode ?? "") === "plan" ? "plan" : "build";
				ws.data.chatMode = next;
				applyLeadFromCache(ws.data);
				ws.send(JSON.stringify({ type: "chat_mode", mode: next }));
				ws.send(
					logLine(
						"INFO",
						"chat",
						next === "plan"
							? "Plan mode — session uses workspace planner.md (Pi) when present, else built-in fallback; no duplicate if agent is planner."
							: "Build mode — standard assistant (WOP_SYSTEM_PROMPT only if set).",
					),
				);
				return;
			}
			if (msg.type === "set_agent") {
				if (ws.data.busy) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Wait for the current reply to finish before changing the agent.",
						}),
					);
					return;
				}
				const raw = msg.agent;
				const nextName =
					raw === null || raw === undefined || String(raw).trim() === ""
						? null
						: String(raw).trim();
				if (nextName) {
					const body = await getAgentBodyByName(nextName);
					if (!body) {
						ws.send(
							JSON.stringify({
								type: "error",
								message: `Agent "${nextName}" not found under agents/, .claude/agents/, .pi/agents/, or .cursor/agents/ (same scan order as Pi agent-team).`,
							}),
						);
						return;
					}
					ws.data.agentName = nextName;
					ws.data.cachedAgentBody = body;
				} else {
					ws.data.agentName = null;
					ws.data.cachedAgentBody = null;
				}
				applyLeadFromCache(ws.data);
				ws.send(JSON.stringify({ type: "agent", name: ws.data.agentName }));
				ws.send(
					logLine(
						"INFO",
						"chat",
						ws.data.agentName
							? `Agent persona: ${ws.data.agentName} (markdown system prompt from workspace).`
							: "Agent persona: default (no workspace .md agent).",
					),
				);
				return;
			}
			if (msg.type === "activate_session") {
				if (ws.data.busy) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Cannot switch chat tab while a reply is still streaming.",
						}),
					);
					return;
				}
				const raw = (msg as { transcript?: unknown }).transcript;
				if (!Array.isArray(raw)) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "activate_session requires a transcript array of user/assistant messages.",
						}),
					);
					return;
				}
				const next: ChatMessage[] = [];
				for (const item of raw.slice(0, 500)) {
					if (!item || typeof item !== "object") continue;
					const role = (item as { role?: unknown }).role;
					const content = String((item as { content?: unknown }).content ?? "");
					if (role === "user" || role === "assistant") {
						next.push({ role, content });
					}
				}
				ws.data.messages = next;
				ws.data.pendingChatTexts = [];
				sendQueueState(ws, 0);
				applyLeadFromCache(ws.data);
				ws.send(
					logLine(
						"INFO",
						"chat",
						`Chat tab active — restored ${next.length} message${next.length === 1 ? "" : "s"} for this connection.`,
					),
				);
				return;
			}
			if (msg.type === "new_session") {
				if (ws.data.busy) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Cannot start a new session while a reply is still streaming.",
						}),
					);
					return;
				}
				ws.data.messages = [];
				ws.data.pendingChatTexts = [];
				sendQueueState(ws, 0);
				applyLeadFromCache(ws.data);
				ws.send(JSON.stringify({ type: "session_reset" }));
				ws.send(JSON.stringify({ type: "chat_mode", mode: ws.data.chatMode }));
				ws.send(JSON.stringify({ type: "agent", name: ws.data.agentName }));
				ws.send(logLine("INFO", "chat", "New session — conversation context cleared for this connection."));
				return;
			}
			if (msg.type !== "chat") return;
			const text = String(msg.content ?? "").trim();
			if (!text) return;

			if (ws.data.busy) {
				ws.data.pendingChatTexts.push(text);
				ws.send(JSON.stringify({ type: "user_queued", content: text }));
				sendQueueState(ws, ws.data.pendingChatTexts.length);
				return;
			}

			void runChatTurn(ws, text, true).catch(() => {
				/* runChatTurn already reports errors to the client */
			});
		},
	},
});

console.log(`Way of Pi server http://127.0.0.1:${server.port}  workspace=${getWorkspaceRoot()}`);
