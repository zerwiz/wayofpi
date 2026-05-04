import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { basename as posixBasename, join as posixJoin } from "node:path/posix";
import type { ChatMessage, StreamChatResult } from "./chat";
import { runOrchestratorToolLoop } from "./chat-orchestrator-tools";
import { streamChatCompletion } from "./chat";
import {
	approximateStreamUsageFromMessages,
	estimateContextWindowTokens,
	type StreamTokenUsage,
} from "./chat-usage";
import { applyChatContextBudget } from "./chat-context-budget";
import { applyLeadSystem, type ChatSessionMode } from "./session-prompts";
import { getAgentBodyByName, loadWorkspaceAgents, readPlannerAgentBodySync } from "./agents";
import { fetchOllamaTags, isValidOllamaModelId, isValidOpenRouterModelId } from "./llm-models";
import {
	getClawDotDirAbs,
	getClawHostRepoRoot,
	getClawWorkspaceBundleDirAbs,
	clawWorkspaceBundleToLegacyFlatRel,
	resolveWorkspaceOrClawAbs,
} from "./claw-workspace-root";
import { getWorkspaceRoot, MAX_FILE_BYTES, safeResolveUnderWorkspace } from "./paths";
import { imageMimeFromPath } from "./workspace-file-mime";
import { listPlansCatalog } from "./plans-catalog";
import { readPackageScripts } from "./package-scripts";
import { readUiViewsCatalog, seedUiViewsCatalogIfMissing } from "./ui-views-catalog";
import { gitStageAbsolutePath, gitStageAllFromAbsolutePath } from "./git";
import { buildClawHostTree, buildWorkspaceTree } from "./tree";
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
	saveCodeWorkspaceFileToPath,
	setWorkspaceFoldersAbs,
	workspaceSwitchAllowed,
} from "./workspace-state";
import { pickNativePath } from "./native-file-dialog";
import {
	attachTerminalSession,
	disposeTerminal,
	handleTerminalMessage,
	terminalAllowed,
	terminalShellHints,
	type TerminalWsData,
} from "./terminal-ws";
import { getClawAutomationStatus } from "./claw-automation-status";
import { readClawMissionEvents } from "./claw-mission-events";
import {
	normalizeSchedule,
	readClawSchedulesMerged,
	writeClawSchedulesDefinitions,
} from "./claw-schedules-store";
import { executeClawAutomation } from "./claw-schedule-executor";
import { startClawScheduler } from "./claw-scheduler";
import {
	clawWebhookConfigured,
	clawWebhookInboundEnabled,
	ensureWebhookSecret,
	readWebhookSecret,
	rotateWebhookSecret,
	verifyWebhookBearer,
} from "./claw-webhook-store";
import { getClawTelegramIntegrationStatus } from "./claw-telegram-status";
import { collectDiagnostics, collectUpstreamSnapshot } from "./diagnostics";
import { runWorkspaceProblemsAnalysis, type WorkspaceProblemsRunResult } from "./workspace-problems";
import { resolveOllamaHost, resolveOllamaModelDefault } from "./pi-ollama-env";
import { collectStaticWebManifest } from "./web-manifest";
import {
	broadcastToolLog,
	registerChatSocketForToolLogs,
	unregisterChatSocketForToolLogs,
} from "./tool-log-broadcast";
import {
	appendWayofpiSessionMessage,
	loadWayofpiSessionMessages,
	sanitizeSessionKey,
	syncWayofpiSessionFile,
	wayofpiSessionBasename,
} from "./wop-session-jsonl";
import { tryAutoDispatchFromUserText } from "./orchestrator-dispatch-intent";
import {
	orchestratorBashEnabled,
	orchestratorToolsEnabled,
	patchOrchestratorGateRuntime,
	type OrchestratorGateRuntimePatch,
} from "./orchestrator-tools-exec";
import {
	patchPiJsonChatRuntimeOverride,
	piAgentRuntimeBlockedReason,
	resolvePiBinaryPath,
	runPiChatTurn,
	shouldUsePiJsonChat,
	wopChatEngineFromEnv,
} from "./pi-agent-runtime";
import { evalChatSlashCommand, type ChatSlashMutation } from "./chat-slash-commands";
import {
	addWorkspaceIndexDoc,
	applyAutoSync,
	clearWorkspaceIndex,
	getWorkspaceIndexChatBoostSync,
	getWorkspaceIndexStatus,
	patchWorkspaceIndexOptions,
	removeWorkspaceIndexDoc,
	syncWorkspaceIndex,
	syncWorkspaceIndexDoc,
} from "./workspace-index";
import {
	readGithubConnectionMeta,
	removeGithubCredentials,
	saveGithubCredentials,
	verifyGithubToken,
} from "./github-connection";
import { db } from "./db";
import { createToken, verifyToken } from "./auth";

// Integrated terminal: in production (`NODE_ENV=production`) keep opt-in via WOP_ALLOW_TERMINAL only.
// In non-production, default on when unset so local `npm run dev` gets a real shell; disable with WOP_ALLOW_TERMINAL=0|false|no|off.
// `npm run dev` forces NODE_ENV=development for the Bun process so an inherited NODE_ENV=production cannot skip this default.
if (process.env.NODE_ENV !== "production") {
	const v = process.env.WOP_ALLOW_TERMINAL?.trim();
	if (v === undefined || v === "") {
		process.env.WOP_ALLOW_TERMINAL = "1";
	}
}

/** Settings → Restart server: allowed when unset in dev (`NODE_ENV !== "production"`). Production requires explicit `1`/`true`/`yes`/`on`. Disable in dev with `0`/`false`/`no`/`off`. */
function isWopServerRestartHttpAllowed(): boolean {
	const raw = process.env.WOP_ALLOW_SERVER_RESTART?.trim() ?? "";
	if (raw === "") {
		return process.env.NODE_ENV !== "production";
	}
	const v = raw.toLowerCase();
	if (v === "0" || v === "false" || v === "no" || v === "off") return false;
	return v === "1" || v === "true" || v === "yes" || v === "on";
}

const PORT = Number(process.env.WOP_SERVER_PORT || "3333");
const DIST = join(import.meta.dir, "..", "dist");

type PendingChatItem = { id: string; text: string };

type ChatWsData = {
	kind: "chat";
	messages: ChatMessage[];
	/** True while a chat completion stream is in flight. */
	busy: boolean;
	/** User texts received while `busy`; run after the current turn completes (stable ids for queue UI). */
	pendingChatQueue: PendingChatItem[];
	/** Per-connection override (UI-selected); falls back to Pi-aligned defaults (`resolveOllamaModelDefault` / OPENROUTER_MODEL). */
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
	/** Cumulative prompt + completion tokens (Pi footer-style — sums per finished assistant turn). */
	cumPromptTokens: number;
	cumCompletionTokens: number;
	/** Client chat tab id — persists transcript under `agent/sessions/wayofpi-chat-*.jsonl`. */
	wopSessionKey: string | null;
	tenantId: string;
	userId: string;
};

type ServerWsData = ChatWsData | TerminalWsData;

function applyLeadFromCache(
	data: ChatWsData,
	opts?: {
		/**
		 * Phrase-dispatch: specialist body is merged for this turn only while `agentName` stays null (Pi dispatcher).
		 * Must match that specialist for Plan-mode planner dedup (avoid stacking planner twice on `planner.md`).
		 */
		effectiveAgentNameLower?: string | null;
	},
) {
	const agentNameLower =
		data.agentName?.trim().toLowerCase() ??
		(opts?.effectiveAgentNameLower != null ? opts.effectiveAgentNameLower.trim().toLowerCase() : null) ??
		null;
	let plannerBody: string | null = null;
	if (data.chatMode === "plan" && agentNameLower !== "planner") {
		plannerBody = readPlannerAgentBodySync(getPrimaryWorkspacePath(data.tenantId));
	}
	const piJson = shouldUsePiJsonChat();
	applyLeadSystem(data.messages, {
		mode: data.chatMode,
		envSystemPrompt: process.env.WOP_SYSTEM_PROMPT,
		agentBody: data.cachedAgentBody,
		agentNameLower,
		plannerAgentBody: plannerBody,
		orchestratorPiToolsEnabled: orchestratorToolsEnabled() && !piJson,
		piJsonChatRuntime: piJson,
		workspaceIndexBoost: getWorkspaceIndexChatBoostSync(),
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

function sendQueueState(ws: { send: (data: string) => void }, queue: PendingChatItem[]) {
	try {
		ws.send(
			JSON.stringify({
				type: "queue_state",
				pending: queue.length,
				items: queue.map((q) => ({ id: q.id, text: q.text })),
			}),
		);
	} catch {
		/* socket may be closing */
	}
}

function effectiveChatModelId(data: ChatWsData): string {
	const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
	if (provider === "openrouter") {
		return (data.openrouterModel || process.env.OPENROUTER_MODEL || "openrouter/auto").trim();
	}
	return (data.ollamaModel || resolveOllamaModelDefault(data.tenantId)).trim();
}

function sendChatUsageMeter(
	ws: { send: (data: string) => void },
	data: ChatWsData,
	lastTurn: StreamTokenUsage,
	usageApproximate: boolean,
) {
	const model = effectiveChatModelId(data);
	const win = estimateContextWindowTokens(model);
	const lp = lastTurn.promptTokens;
	const pct = win != null && lp > 0 ? Math.min(100, (lp / win) * 100) : null;
	try {
		ws.send(
			JSON.stringify({
				type: "chat_usage",
				streamPeek: false,
				lastPrompt: lastTurn.promptTokens,
				lastCompletion: lastTurn.completionTokens,
				cumPrompt: data.cumPromptTokens,
				cumCompletion: data.cumCompletionTokens,
				contextWindow: win,
				contextPercent: pct,
				approximate: usageApproximate,
			}),
		);
	} catch {
		/* closing */
	}
}

/** Mid-stream usage from SSE (Pi-style live footer) — session cum not incremented until the turn completes. */
function sendChatUsageStreamPeek(
	ws: { send: (data: string) => void },
	data: ChatWsData,
	u: StreamTokenUsage,
) {
	const model = effectiveChatModelId(data);
	const win = estimateContextWindowTokens(model);
	const cumP = data.cumPromptTokens;
	const cumC = data.cumCompletionTokens;
	const lp = Math.max(0, u.promptTokens);
	const lc = Math.max(0, u.completionTokens);
	const estInput = cumP + lp;
	const pct = win != null && estInput > 0 ? Math.min(100, (estInput / win) * 100) : null;
	try {
		ws.send(
			JSON.stringify({
				type: "chat_usage",
				streamPeek: true,
				lastPrompt: lp,
				lastCompletion: lc,
				cumPrompt: cumP,
				cumCompletion: cumC,
				contextWindow: win,
				contextPercent: pct,
				approximate: false,
			}),
		);
	} catch {
		/* closing */
	}
}

async function processActivateSession(
	ws: { data: ChatWsData; send: (data: string) => void },
	msg: { transcript?: unknown; sessionKey?: unknown },
): Promise<void> {
	const raw = msg.transcript;
	if (!Array.isArray(raw)) {
		ws.send(
			JSON.stringify({
				type: "error",
				message: "activate_session requires a transcript array of user/assistant messages.",
			}),
		);
		return;
	}
	const skRaw = msg.sessionKey;
	const sessionKey =
		typeof skRaw === "string" && skRaw.trim() ? sanitizeSessionKey(skRaw.trim()) : null;
	ws.data.wopSessionKey = sessionKey;

	const next: ChatMessage[] = [];
	for (const item of raw.slice(0, 500)) {
		if (!item || typeof item !== "object") continue;
		const role = (item as { role?: unknown }).role;
		const content = String((item as { content?: unknown }).content ?? "");
		if (role === "user" || role === "assistant") {
			next.push({ role, content });
		}
	}

	let hydratedFromDisk = false;
	if (next.length === 0 && sessionKey) {
		const disk = await loadWayofpiSessionMessages(sessionKey);
		if (disk.length > 0) {
			ws.data.messages = disk;
			hydratedFromDisk = true;
		} else {
			ws.data.messages = [];
		}
	} else {
		ws.data.messages = next;
	}

	ws.data.pendingChatQueue = [];
	ws.data.cumPromptTokens = 0;
	ws.data.cumCompletionTokens = 0;
	sendQueueState(ws, []);
	applyLeadFromCache(ws.data);

	if (sessionKey) {
		try {
			await syncWayofpiSessionFile(sessionKey, ws.data.messages);
			const n = ws.data.messages.filter((m) => m.role === "user" || m.role === "assistant").length;
			broadcastToolLog(
				"INFO",
				"session",
				`JSONL ${wayofpiSessionBasename(sessionKey)} (${n} turn${n === 1 ? "" : "s"})`,
			);
		} catch (e) {
			const m = e instanceof Error ? e.message : String(e);
			ws.send(logLine("WARN", "session", `Failed to write session JSONL: ${m}`));
		}
	}

	const userAsstCount = ws.data.messages.filter(
		(m) =>
			m.role === "user" ||
			(m.role === "assistant" && String(m.content ?? "").trim().length > 0),
	).length;
	ws.send(
		logLine(
			"INFO",
			"chat",
			hydratedFromDisk && sessionKey
				? `Restored ${userAsstCount} message(s) from ${wayofpiSessionBasename(sessionKey)}`
				: `Chat tab active — ${userAsstCount} message${userAsstCount === 1 ? "" : "s"} for this connection.`,
		),
	);

	if (hydratedFromDisk && sessionKey) {
		const turns = ws.data.messages
			.filter(
				(m) =>
					m.role === "user" ||
					(m.role === "assistant" && String(m.content ?? "").trim().length > 0),
			)
			.map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content ?? "") }));
		ws.send(JSON.stringify({ type: "session_transcript", sessionKey, turns }));
	}
}

async function applySlashMutations(
	ws: { data: ChatWsData; send: (data: string) => void },
	mutation: ChatSlashMutation | undefined,
): Promise<void> {
	if (!mutation) return;
	const data = ws.data;
	if (mutation.setModelId) {
		const id = mutation.setModelId;
		const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
		if (provider === "openrouter") {
			data.openrouterModel = id;
			data.ollamaModel = undefined;
		} else {
			data.ollamaModel = id;
			data.openrouterModel = undefined;
		}
		ws.send(JSON.stringify({ type: "model_set", effectiveModel: id, provider }));
	}
	if (mutation.setChatMode) {
		data.chatMode = mutation.setChatMode;
		applyLeadFromCache(data);
		ws.send(JSON.stringify({ type: "chat_mode", mode: mutation.setChatMode }));
		ws.send(
			logLine(
				"INFO",
				"chat",
				mutation.setChatMode === "plan"
					? "Plan mode — session uses workspace planner.md (Pi) when present, else built-in fallback; no duplicate if agent is planner."
					: "Build mode — Orchestrator when no .md agent, else selected agent; WOP_SYSTEM_PROMPT prepended when set.",
			),
		);
	}
	if (mutation.setAgentName !== undefined) {
		const name = mutation.setAgentName;
		if (name) {
			const body = await getAgentBodyByName(name, ws.data.tenantId);
			data.agentName = name;
			data.cachedAgentBody = body ?? null;
		} else {
			data.agentName = null;
			data.cachedAgentBody = null;
		}
		applyLeadFromCache(data);
		ws.send(JSON.stringify({ type: "agent", name: data.agentName }));
		ws.send(
			logLine(
				"INFO",
				"chat",
				data.agentName
					? `Agent persona: ${data.agentName} (markdown system prompt from workspace).`
					: "Agent persona: Orchestrator (no workspace .md — server injects Pi-shaped orchestrator system prompt).",
			),
		);
	}
}

async function runChatTurn(
	ws: { data: ChatWsData; send: (data: string) => void },
	text: string,
	notifyUser: boolean,
): Promise<void> {
	const data = ws.data;
	data.busy = true;
	/** Snapshot before phrase-dispatch overwrites `cachedAgentBody` for one turn (Pi: dispatcher unchanged). */
	let phraseDispatchRestoreCached: string | null | undefined = undefined;
	try {
		const trimmed = text.trim();
		const slash = await evalChatSlashCommand(trimmed, {
			provider: (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase(),
			ollamaModel: data.ollamaModel,
			openrouterModel: data.openrouterModel,
		});

		if (slash.handled) {
			if (slash.mutation?.clearTranscript) {
				data.messages = [];
				data.pendingChatQueue = [];
				data.cumPromptTokens = 0;
				data.cumCompletionTokens = 0;
				sendQueueState(ws, []);
				applyLeadFromCache(data);
				if (data.wopSessionKey) {
					try {
						await syncWayofpiSessionFile(data.wopSessionKey, data.messages);
					} catch (e) {
						const m = e instanceof Error ? e.message : String(e);
						ws.send(logLine("WARN", "session", `sync JSONL after /clear: ${m}`));
					}
				}
				ws.send(JSON.stringify({ type: "session_reset" }));
				ws.send(JSON.stringify({ type: "chat_mode", mode: data.chatMode }));
				ws.send(JSON.stringify({ type: "agent", name: data.agentName }));
				ws.send(logLine("INFO", "chat", "Transcript cleared (/clear)."));
				return;
			}

			await applySlashMutations(ws, slash.mutation);

			if (!slash.skipUserEcho) {
				if (notifyUser) {
					ws.send(JSON.stringify({ type: "user_message", content: trimmed }));
				}
				data.messages.push({ role: "user", content: trimmed });
				if (data.wopSessionKey) {
					try {
						await appendWayofpiSessionMessage(data.wopSessionKey, "user", trimmed);
					} catch (e) {
						const m = e instanceof Error ? e.message : String(e);
						ws.send(logLine("WARN", "session", `append user JSONL: ${m}`));
					}
				}
			}

			ws.send(JSON.stringify({ type: "assistant_turn_start" }));
			const reply = slash.assistantText;
			if (reply.length > 0) {
				ws.send(JSON.stringify({ type: "assistant_delta", content: reply }));
				data.messages.push({ role: "assistant", content: reply });
				if (data.wopSessionKey) {
					try {
						await appendWayofpiSessionMessage(data.wopSessionKey, "assistant", reply);
					} catch (e) {
						const m = e instanceof Error ? e.message : String(e);
						ws.send(logLine("WARN", "session", `append assistant JSONL: ${m}`));
					}
				}
			}
			ws.send(JSON.stringify({ type: "done" }));
			return;
		}

		const lenBeforeUserMsg = data.messages.length;
		if (notifyUser) {
			ws.send(JSON.stringify({ type: "user_message", content: text }));
		}
		data.messages.push({ role: "user", content: text });
		if (data.wopSessionKey) {
			try {
				await appendWayofpiSessionMessage(data.wopSessionKey, "user", text);
			} catch (e) {
				const m = e instanceof Error ? e.message : String(e);
				ws.send(logLine("WARN", "session", `append user JSONL: ${m}`));
			}
		}

		/** Re-merge lead `system` from disk + env (planner.md, WOP_SYSTEM_PROMPT) before phrase-dispatch and the model. */
		applyLeadFromCache(data);

		const sendLog = (level: "INFO" | "WARN" | "ERROR", source: string, m: string) => {
			ws.send(logLine(level, source, m));
		};

		/**
		 * Pi-style **phrase dispatch** — infer specialist ("start scout", "dispatch the planner …") like roster hints.
		 * Does **not** persist `agentName` (picker / `set_agent`): specialist `.md` is merged **for this turn only**,
		 * matching Pi **agent-team** where the dispatcher process stays primary.
		 */
		try {
			const disp = await tryAutoDispatchFromUserText(text, data.agentName);
			if (disp.kind === "orchestrator") {
				data.agentName = null;
				data.cachedAgentBody = null;
				phraseDispatchRestoreCached = undefined;
				applyLeadFromCache(data);
				ws.send(JSON.stringify({ type: "agent", name: data.agentName }));
				sendLog(
					"INFO",
					"dispatch",
					"Switched to **Orchestrator** (Pi dispatcher posture — no merged specialist `.md`).",
				);
				broadcastToolLog("INFO", "dispatch_agent", "→ orchestrator");
			} else if (disp.kind === "agent") {
				phraseDispatchRestoreCached = data.cachedAgentBody;
				data.cachedAgentBody = disp.body;
				applyLeadFromCache(data, { effectiveAgentNameLower: disp.canonicalName.trim().toLowerCase() });
				try {
					ws.send(JSON.stringify({ type: "dispatch_turn", agent: disp.canonicalName }));
				} catch {
					/* closing */
				}
				sendLog(
					"INFO",
					"dispatch",
					`Phrase-dispatch **${disp.canonicalName}** for this reply only — session persona unchanged (Pi **dispatch_agent** / dispatcher posture).`,
				);
				broadcastToolLog(
					"INFO",
					"dispatch_agent",
					`→ ${disp.canonicalName} (one turn) — ${text.length > 140 ? `${text.slice(0, 137)}…` : text}`,
				);
			}
		} catch (e) {
			const m = e instanceof Error ? e.message : String(e);
			sendLog("WARN", "dispatch", `Handoff detection skipped: ${m}`);
		}

		ws.send(JSON.stringify({ type: "assistant_turn_start" }));

		const piBlocked = piAgentRuntimeBlockedReason();
		if (piBlocked) {
			ws.send(JSON.stringify({ type: "error", message: piBlocked }));
			sendLog("ERROR", "chat", piBlocked);
			data.messages.length = lenBeforeUserMsg;
			if (data.wopSessionKey) {
				try {
					await syncWayofpiSessionFile(data.wopSessionKey, data.messages);
				} catch {
					/* ignore */
				}
			}
			return;
		}

		const budget = applyChatContextBudget(data.messages, sendLog);
		if (budget.droppedMessages > 0 && data.wopSessionKey) {
			try {
				await syncWayofpiSessionFile(data.wopSessionKey, data.messages);
			} catch (e) {
				const m = e instanceof Error ? e.message : String(e);
				sendLog("WARN", "session", `sync JSONL after context budget trim: ${m}`);
			}
		}

		const ac = new AbortController();
		data.chatAbort = ac;
		const usePiChat = shouldUsePiJsonChat();
		const useOrchestratorTools = !usePiChat && orchestratorToolsEnabled();
		sendLog(
			"INFO",
			"chat",
			usePiChat
				? "Running turn via headless Pi (`pi --mode json`)…"
				: useOrchestratorTools
					? "Chat completion with workspace tools (read, list_dir, grep, write, team_list, team_member_*, …)…"
					: "Requesting completion…",
		);
		let full = "";
		let lastStreamUsage: StreamTokenUsage | null = null;
		const emitUsagePeek = (u: StreamTokenUsage) => {
			sendChatUsageStreamPeek(ws, data, u);
		};
		const sendReasoning = (delta: string) => {
			try {
				ws.send(JSON.stringify({ type: "assistant_reasoning_delta", content: delta }));
			} catch {
				/* closing */
			}
		};
		try {
			let result: StreamChatResult;
			if (usePiChat) {
				const o = await runPiChatTurn({
					cwd: getPrimaryWorkspacePath(data.tenantId),
					messages: data.messages,
					onDelta: (delta) => {
						full += delta;
						ws.send(JSON.stringify({ type: "assistant_delta", content: delta }));
					},
					onReasoningDelta: sendReasoning,
					onStreamUsage: emitUsagePeek,
					onLog: sendLog,
					signal: ac.signal,
				});
				result = o.result;
				lastStreamUsage = o.lastStreamUsage;
			} else if (useOrchestratorTools) {
				const o = await runOrchestratorToolLoop(
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
					{
						signal: ac.signal,
						onStreamUsage: emitUsagePeek,
						onReasoningDelta: sendReasoning,
						onAgentsCatalogChanged: () => {
							try {
								ws.send(JSON.stringify({ type: "agents_catalog_changed" }));
							} catch {
								/* closing */
							}
						},
						onWorkspaceFileWritten: (relPath) => {
							try {
								ws.send(JSON.stringify({ type: "focus_workspace_file", path: relPath }));
							} catch {
								/* closing */
							}
						},
					},
				);
				result = o.result;
				lastStreamUsage = o.lastStreamUsage;
				full = o.finalAssistantText;
			} else {
				result = await streamChatCompletion(
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
					{
						signal: ac.signal,
						onReasoningDelta: sendReasoning,
						onStreamUsage: (u) => {
							lastStreamUsage = u;
							emitUsagePeek(u);
						},
					},
				);
			}

			if (!result.ok) {
				if ("aborted" in result && result.aborted) {
					if (useOrchestratorTools) {
						data.messages.length = lenBeforeUserMsg;
						sendLog("WARN", "chat", "Generation stopped by user.");
						ws.send(JSON.stringify({ type: "done" }));
						return;
					}
					const msgsBeforeAssistantAbort = data.messages;
					const turnUsageAbort =
						lastStreamUsage ??
						approximateStreamUsageFromMessages(msgsBeforeAssistantAbort, full);
					const approxAbort = lastStreamUsage == null;
					if (full.length > 0) {
						data.messages.push({ role: "assistant", content: full });
						if (data.wopSessionKey) {
							try {
								await appendWayofpiSessionMessage(data.wopSessionKey, "assistant", full);
							} catch (e) {
								const m = e instanceof Error ? e.message : String(e);
								sendLog("WARN", "session", `append assistant JSONL: ${m}`);
							}
						}
					}
					sendLog("WARN", "chat", "Generation stopped by user.");
					data.cumPromptTokens += turnUsageAbort.promptTokens;
					data.cumCompletionTokens += turnUsageAbort.completionTokens;
					sendChatUsageMeter(ws, data, turnUsageAbort, approxAbort);
					ws.send(JSON.stringify({ type: "done" }));
					return;
				}
				if ("error" in result) {
					ws.send(JSON.stringify({ type: "error", message: result.error }));
					data.messages.length = lenBeforeUserMsg;
					if (data.wopSessionKey) {
						try {
							await syncWayofpiSessionFile(data.wopSessionKey, data.messages);
						} catch {
							/* ignore */
						}
					}
				}
				return;
			}

			const msgsBeforeAssistant = useOrchestratorTools
				? data.messages.slice(0, -1)
				: data.messages;
			const turnUsage =
				lastStreamUsage ?? approximateStreamUsageFromMessages(msgsBeforeAssistant, full);
			const approxTurn = lastStreamUsage == null;
			data.cumPromptTokens += turnUsage.promptTokens;
			data.cumCompletionTokens += turnUsage.completionTokens;
			if (!useOrchestratorTools) {
				data.messages.push({ role: "assistant", content: full });
			}
			if (data.wopSessionKey && full.length > 0) {
				try {
					await appendWayofpiSessionMessage(data.wopSessionKey, "assistant", full);
				} catch (e) {
					const m = e instanceof Error ? e.message : String(e);
					sendLog("WARN", "session", `append assistant JSONL: ${m}`);
				}
			}
			sendChatUsageMeter(ws, data, turnUsage, approxTurn);
			ws.send(JSON.stringify({ type: "done" }));
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			ws.send(JSON.stringify({ type: "error", message }));
			data.messages.length = lenBeforeUserMsg;
			if (data.wopSessionKey) {
				try {
					await syncWayofpiSessionFile(data.wopSessionKey, data.messages);
				} catch {
					/* ignore */
				}
			}
		}
	} finally {
		if (phraseDispatchRestoreCached !== undefined) {
			data.cachedAgentBody = phraseDispatchRestoreCached;
			phraseDispatchRestoreCached = undefined;
			applyLeadFromCache(data);
		}
		data.chatAbort = null;
		data.busy = false;
		const next = data.pendingChatQueue.shift();
		sendQueueState(ws, data.pendingChatQueue);
		if (next != null) {
			void runChatTurn(ws, next.text, false).catch(() => {
				/* runChatTurn already reports errors to the client */
			});
		}
	}
}

/** Last static analysis snapshot (ESLint or `tsc` under the primary workspace root). */
let lastWorkspaceProblems: WorkspaceProblemsRunResult | null = null;

function applySessionRuntimePostBody(body: Record<string, unknown>): Response {
	const orchPatch: OrchestratorGateRuntimePatch = {};
	let any = false;
	if ("orchestratorTools" in body) {
		any = true;
		const v = body.orchestratorTools;
		if (v === null) orchPatch.orchestratorTools = null;
		else if (typeof v === "boolean") orchPatch.orchestratorTools = v;
		else return json({ error: "orchestratorTools must be boolean or null" }, 400);
	}
	if ("orchestratorBash" in body) {
		any = true;
		const v = body.orchestratorBash;
		if (v === null) orchPatch.orchestratorBash = null;
		else if (typeof v === "boolean") orchPatch.orchestratorBash = v;
		else return json({ error: "orchestratorBash must be boolean or null" }, 400);
	}
	if ("piDrivesChat" in body) {
		any = true;
		const v = body.piDrivesChat;
		if (v === null) patchPiJsonChatRuntimeOverride(null);
		else if (typeof v === "boolean") patchPiJsonChatRuntimeOverride(v);
		else return json({ error: "piDrivesChat must be boolean or null" }, 400);
	}
	if (!any) {
		return json(
			{ error: "Provide orchestratorTools, orchestratorBash, and/or piDrivesChat (boolean or null)" },
			400,
		);
	}
	patchOrchestratorGateRuntime(orchPatch);
	return json({
		ok: true,
		orchestratorTools: orchestratorToolsEnabled(),
		orchestratorBash: orchestratorBashEnabled(),
		piDrivesChat: shouldUsePiJsonChat(),
	});
}

async function handleApi(url: URL, req: Request): Promise<Response> {
	/** Collapse duplicate slashes; strip trailing slash (except root). */
	const p = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";

	if (req.method === "OPTIONS" && p.startsWith("/api/")) {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
				"Access-Control-Max-Age": "86400",
			},
		});
	}

	if (p === "/api/login" && req.method === "POST") {
		let body: { username?: string; password?: string };
		try {
			body = (await req.json()) as { username?: string; password?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const { username, password } = body;
		if (!username || !password) {
			return json({ error: "Username and password required" }, 400);
		}

		const user = db.query("SELECT * FROM users WHERE username = ?").get(username) as any;
		if (!user || !(await Bun.password.verify(password, user.password_hash))) {
			return json({ error: "Invalid credentials" }, 401);
		}

		const token = await createToken(user.id, user.tenant_id);
		return json({
			token,
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
				tenantId: user.tenant_id,
			},
		});
	}

	// Worker Portal login (ID + PIN)
	if (p === "/api/portal/login" && req.method === "POST") {
		let body: { workerId?: string; pin?: string };
		try {
			body = (await req.json()) as { workerId?: string; pin?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const { workerId, pin } = body;
		if (!workerId || !pin) {
			return json({ error: "Worker ID and PIN required" }, 400);
		}

		const user = db.query("SELECT * FROM users WHERE username = ? AND pin = ?").get(workerId, pin) as any;
		if (!user) {
			return json({ error: "Invalid credentials" }, 401);
		}

		const token = await createToken(user.id, user.tenant_id);
		return json({
			token,
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
				tenantId: user.tenant_id,
			},
		});
	}

	// Auth check for all other /api routes
	const authHeader = req.headers.get("Authorization");
	const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
	let auth = token ? await verifyToken(token) : null;

	// DEV MODE: Allow requests without auth when WOP_DEV_MODE=true
	const isDevMode = process.env.WOP_DEV_MODE === "true";
	const isPublicRoute = p === "/api/manifest" || p === "/api/config" || p === "/api/health";

	if (!auth && !isDevMode) {
		if (!isPublicRoute) {
			return json({ error: "Unauthorized" }, 401);
		}
	}
	// In dev mode, create a fake auth for compatibility
	if (!auth && isDevMode) {
		auth = { userId: "dev-user", tenantId: "dev-tenant" };
	}

	if (p === "/api/health") {
		return json({
			ok: true,
			service: "wayofpi-ui-server",
			time: new Date().toISOString(),
			/** Bump clients (Vite/Electron “Start service”) so they do not treat an old Bun on this port as healthy. */
			capabilities: {
				workspaceProblems: true,
				/** **`POST /api/config`** runtime toggles (Pi drives chat, orchestrator tools/bash) exist on this build. */
				configRuntimePost: true,
				/** **`GET /api/claw/tree`** — host **`.claw/`** file explorer for Claw mode. */
				clawHostTreeGet: true,
				/** **`GET /api/claw/telegram/status`** and **`GET /api/config`** → **`clawTelegramStatus`**. */
				clawTelegramStatusGet: true,
			},
		});
	}

	if (p === "/api/claw/tree" && req.method === "GET") {
		try {
			const { rootDisplay, nodes } = await buildClawHostTree();
			return json({ rootDisplay, nodes });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/claw/automation" && req.method === "GET") {
		try {
			return json(getClawAutomationStatus());
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ version: 1, error: message }, 500);
		}
	}

	if (p === "/api/claw/mission-events" && req.method === "GET") {
		try {
			const events = await readClawMissionEvents(40);
			return json({ version: 1, events });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ version: 1, events: [], error: message }, 500);
		}
	}

	if (p === "/api/claw/schedules" && req.method === "GET") {
		try {
			const schedules = await readClawSchedulesMerged();
			return json({ version: 1, schedules });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ version: 1, schedules: [], error: message }, 500);
		}
	}

	if (p === "/api/claw/schedules" && req.method === "PUT") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const raw = body.schedules;
		if (!Array.isArray(raw)) return json({ error: "schedules array required" }, 400);
		const coerced = raw.map(normalizeSchedule).filter((s): s is NonNullable<typeof s> => s !== null);
		try {
			await writeClawSchedulesDefinitions(coerced);
			const schedules = await readClawSchedulesMerged();
			return json({ ok: true, version: 1, schedules });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	// Worker Portal APIs
	if (p === "/api/portal/me" && req.method === "GET") {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		const user = db.query("SELECT id, username, role, tenant_id FROM users WHERE id = ?").get(auth.userId) as any;
		if (!user) return json({ error: "User not found" }, 404);
		return json({ id: user.id, username: user.username, role: user.role, tenantId: user.tenant_id });
	}

	if (p === "/api/portal/tasks" && req.method === "GET") {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		try {
			const tasks = db.query(`
				SELECT t.*, p.name as project_name
				FROM tasks t
				LEFT JOIN projects p ON t.project_id = p.id
				WHERE t.tenant_id = ? AND t.assigned_to = ?
				ORDER BY t.due_date ASC, t.created_at DESC
			`).all(auth.tenantId, auth.userId) as any[];
			return json(tasks || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch tasks", details: message }, 500);
		}
	}

	if (p === "/api/portal/files" && req.method === "GET") {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		try {
			const files = db.query(`
				SELECT *
				FROM workspace_files
				WHERE tenant_id = ?
				ORDER BY created_at DESC
			`).all(auth.tenantId) as any[];
			return json(files || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch files", details: message }, 500);
		}
	}

	if (p === "/api/portal/time" && req.method === "GET") {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		try {
			const entries = db.query(`
				SELECT te.*, t.title as task_title, p.name as project_name
				FROM time_entries te
				LEFT JOIN tasks t ON te.task_id = t.id
				LEFT JOIN projects p ON te.project_id = p.id
				WHERE te.tenant_id = ? AND te.user_id = ?
				ORDER BY te.date DESC, te.created_at DESC
				LIMIT 100
			`).all(auth.tenantId, auth.userId) as any[];
			return json(entries || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch time entries", details: message }, 500);
		}
	}

	if (p === "/api/portal/time" && req.method === "POST") {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		let body: { hours?: number; project?: string; date?: string; taskId?: string; description?: string; drawingRef?: string };
		try {
			body = (await req.json()) as { hours?: number; project?: string; date?: string; taskId?: string; description?: string; drawingRef?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}

		if (!body.hours || !body.project || !body.date) {
			return json({ error: "Missing required fields: hours, project, date" }, 400);
		}

		try {
			const id = `time_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			const result = db.query(`
				INSERT INTO time_entries (id, tenant_id, user_id, project_id, task_id, date, hours, description, drawing_ref, status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
			`).run(id, auth.tenantId, auth.userId, body.project, body.taskId || null, body.date, body.hours, body.description || null, body.drawingRef || null);

			if (result.changes === 0) {
				return json({ error: "Failed to save time entry" }, 500);
			}

			return json({ ok: true, id });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to save time entry", details: message }, 500);
		}
	}

	if (p.startsWith("/api/portal/download/") && req.method === "GET") {
		if (!auth) return json({ error: "Unauthorized" }, 401);

		const fileId = p.split("/").pop();
		if (!fileId) return json({ error: "File ID required" }, 400);

		try {
			// Get file info from DB (tenant-scoped)
			const file = db.query("SELECT * FROM workspace_files WHERE id = ? AND tenant_id = ?")
				.get(fileId, auth.tenantId) as any;

			if (!file) return json({ error: "File not found" }, 404);

			// Build safe path within tenant workspace
			const workspaceRoot = getPrimaryWorkspacePath({ tenantId: auth.tenantId });
			const safePath = resolve(workspaceRoot, file.file_path);

			// Ensure path is within workspace
			if (!safePath.startsWith(workspaceRoot)) {
				return json({ error: "Invalid file path" }, 403);
			}

			// Check if file exists
			const fileInfo = stat(safePath);
			if (!fileInfo.isFile) {
				return json({ error: "File not found on disk" }, 404);
			}

			// Update download count
			db.query("UPDATE workspace_files SET download_count = download_count + 1 WHERE id = ?")
				.run(fileId);

			// Log audit
			db.query(`
				INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details_json)
				VALUES (?, ?, 'FILE_DOWNLOAD', 'file', ?, ?)
			`).run(auth.tenantId, auth.userId, fileId, JSON.stringify({ path: file.file_path }));

			// Return file
			const fileContent = readFile(safePath);
			return new Response(fileContent, {
				headers: {
					"Content-Type": file.mime_type || "application/octet-stream",
					"Content-Disposition": `attachment; filename="${file.file_path.split("/").pop()}"`,
					"Content-Length": fileInfo.size.toString(),
				}
			});

		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to download file", details: message }, 500);
		}
	}

	if (p === "/api/diagnostics" && req.method === "GET") {
		try {
			return json(await collectDiagnostics());
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/upstream" && req.method === "GET") {
		try {
			return json(await collectUpstreamSnapshot());
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	/** Process exit from Settings → Restart server (dev default on; production needs WOP_ALLOW_SERVER_RESTART=1). `concurrently` does not auto-restart Bun alone. */
	if (p === "/api/server/restart" && req.method === "POST") {
		if (!isWopServerRestartHttpAllowed()) {
			const raw = process.env.WOP_ALLOW_SERVER_RESTART?.trim() ?? "";
			const v = raw.toLowerCase();
			const hint =
				v === "0" || v === "false" || v === "no" || v === "off"
					? "WOP_ALLOW_SERVER_RESTART disables this exit. Unset it for the usual dev default (on), or set it to 1, then use Settings → Restart server again."
					: process.env.NODE_ENV === "production"
						? "Set WOP_ALLOW_SERVER_RESTART=1 on the Way of Pi Bun process, then use Settings → Restart server again. Otherwise stop and start your dev command in the terminal (e.g. npm run dev from apps/wayofpi-ui)."
						: `Unrecognized WOP_ALLOW_SERVER_RESTART value. Use 1, true, yes, or on; unset for the dev default. Current: ${raw || "(empty)"}`;
			return json(
				{
					ok: false,
					error: "Server restart is disabled.",
					hint,
				},
				403,
			);
		}
		queueMicrotask(() => {
			setTimeout(() => process.exit(0), 80);
		});
		return json({
			ok: true,
			exiting: true,
			message:
				"Way of Pi server process will exit. Start it again from the terminal (npm run dev / bun run server/index.ts).",
		});
	}

	/** Toggle terminal on/off at runtime + persist to .env file so it survives restarts. */
	if (p === "/api/terminal/set-enabled" && req.method === "POST") {
		let body: { enabled?: unknown };
		try {
			body = (await req.json()) as { enabled?: unknown };
		} catch {
			return json({ ok: false, error: "Bad JSON body" }, 400);
		}
		const enable = body.enabled === true || body.enabled === 1 || body.enabled === "1";
		// Apply immediately — terminalAllowed() re-reads process.env on each call
		process.env.WOP_ALLOW_TERMINAL = enable ? "1" : "0";

		// Persist to the repo-root .env file (create if missing)
		let persisted = false;
		try {
			const { join: pathJoin } = await import("node:path");
			const { readFileSync, writeFileSync } = await import("node:fs");
			// server/ → wayofpi-ui/ → apps/ → repo root
			const dotEnvPath = pathJoin(import.meta.dir, "..", "..", "..", ".env");
			let src = "";
			try { src = readFileSync(dotEnvPath, "utf8"); } catch { /* file may not exist yet */ }
			const key = "WOP_ALLOW_TERMINAL";
			const val = enable ? "1" : "0";
			const re = new RegExp(`^${key}=.*$`, "m");
			src = re.test(src) ? src.replace(re, `${key}=${val}`) : src + (src.endsWith("\n") || src === "" ? "" : "\n") + `${key}=${val}\n`;
			writeFileSync(dotEnvPath, src, "utf8");
			persisted = true;
		} catch {
			// persist failed — runtime change still works for this session
		}

		return json({ ok: true, enabled: enable, persisted });
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
			root: getPrimaryWorkspacePath(auth?.tenantId),
			folders: listWorkspaceFolders(auth?.tenantId),
			switchAllowed: workspaceSwitchAllowed(),
			initialRoot: getFrozenInitialWorkspacePath(),
		});
	}

	if (p === "/api/workspace/problems" && req.method === "GET") {
		if (lastWorkspaceProblems) return json(lastWorkspaceProblems);
		return json({
			ok: true,
			ranAt: new Date(0).toISOString(),
			engine: "none",
			problems: [],
			exitCode: null,
			log: "No analysis run yet — open the Problems panel and choose Run analysis. (Requires ESLint or tsconfig at workspace root, or under apps/wayofpi-ui in this monorepo.)",
		} satisfies WorkspaceProblemsRunResult);
	}

	if (p === "/api/workspace/problems/run" && req.method === "POST") {
		try {
			const root = getPrimaryWorkspacePath(auth?.tenantId);
			const result = await runWorkspaceProblemsAnalysis(root);
			lastWorkspaceProblems = result;
			broadcastToolLog(
				"INFO",
				"analyze",
				`workspace problems: engine=${result.engine} count=${result.problems.length}${result.error ? ` (${result.error})` : ""}`,
			);
			return json(result);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message, ranAt: new Date().toISOString(), engine: "error", problems: [], exitCode: null, log: message }, 500);
		}
	}

	if (p === "/api/workspace-index" && req.method === "GET") {
		try {
			const payload = await getWorkspaceIndexStatus();
			return json(payload);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/workspace-index/sync" && req.method === "POST") {
		try {
			const result = await syncWorkspaceIndex();
			broadcastToolLog("INFO", "index", `workspace index sync: files=${result.state.fileCount}`);
			return json(result);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/workspace-index/clear" && req.method === "POST") {
		try {
			await clearWorkspaceIndex();
			broadcastToolLog("INFO", "index", "workspace index cleared");
			return json({ ok: true });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/workspace-index/options" && req.method === "POST") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		try {
		const partial: {
			indexNewFolders?: boolean;
			instantGrepIndex?: boolean;
			attachSummaryToChat?: boolean;
			autoSyncIntervalMinutes?: number;
		} = {};
		if (typeof body.indexNewFolders === "boolean") partial.indexNewFolders = body.indexNewFolders;
		if (typeof body.instantGrepIndex === "boolean") partial.instantGrepIndex = body.instantGrepIndex;
		if (typeof body.attachSummaryToChat === "boolean") partial.attachSummaryToChat = body.attachSummaryToChat;
		if (typeof body.autoSyncIntervalMinutes === "number") partial.autoSyncIntervalMinutes = body.autoSyncIntervalMinutes;
		const options = await patchWorkspaceIndexOptions(partial);
		// Re-arm or cancel the background timer whenever options change.
		void applyAutoSync((result) => {
			broadcastToolLog(
				"INFO",
				"index",
				`auto-sync: files=${result.state.fileCount} fingerprint=${result.state.merkleRoot}`,
			);
		});
		return json({ ok: true, options });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/workspace-index/docs" && req.method === "POST") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const url = String(body.url ?? "").trim();
		if (!url) return json({ error: "url required" }, 400);
		try {
			const entry = await addWorkspaceIndexDoc(url);
			return json({ ok: true, entry });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 400);
		}
	}

	if (p === "/api/workspace-index/docs/sync" && req.method === "POST") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const id = String(body.id ?? "").trim();
		if (!id) return json({ error: "id required" }, 400);
		try {
			const entry = await syncWorkspaceIndexDoc(id);
			if (!entry) return json({ error: "not found" }, 404);
			return json({ ok: true, entry });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/workspace-index/docs/remove" && req.method === "POST") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const id = String(body.id ?? "").trim();
		if (!id) return json({ error: "id required" }, 400);
		const ok = await removeWorkspaceIndexDoc(id);
		if (!ok) return json({ error: "not found" }, 404);
		return json({ ok: true });
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
			        await openFolder(p, auth?.tenantId);
			        broadcastToolLog("INFO", "cd", `workspace open_folder ${p.length > 160 ? `${p.slice(0, 157)}…` : p}`);
			        // Trigger indexing for the new folder
			        void syncWorkspaceIndex().then((res) => {
			                broadcastToolLog("INFO", "index", `open_folder sync: files=${res.state.fileCount} merkle=${res.state.merkleRoot}`);
			        }).catch(() => {});
			        return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}
			if (op === "add_folder") {
			        const p = String(body.path ?? "").trim();
			        if (!p) return json({ error: "path required" }, 400);
			        await addFolder(p, auth?.tenantId);
			        broadcastToolLog("INFO", "cd", `workspace add_folder ${p.length > 160 ? `${p.slice(0, 157)}…` : p}`);
			        // Trigger indexing when adding a folder
			        void syncWorkspaceIndex().then((res) => {
			                broadcastToolLog("INFO", "index", `add_folder sync: files=${res.state.fileCount} merkle=${res.state.merkleRoot}`);
			        }).catch(() => {});
			        return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}

			if (op === "remove_folder") {
				const label = String(body.label ?? "").trim();
				if (!label) return json({ error: "label required" }, 400);
				removeFolderByLabel(label, auth?.tenantId);
				return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}
			if (op === "save_code_workspace_file") {
				const filePath = String(body.path ?? "").trim();
				if (!filePath) return json({ error: "path required" }, 400);
				await saveCodeWorkspaceFileToPath(filePath, auth?.tenantId);
				broadcastToolLog(
					"INFO",
					"write",
					`workspace save_code_workspace_file ${filePath.length > 200 ? `${filePath.slice(0, 197)}…` : filePath}`,
				);
				return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}
			if (op === "close_workspace" || op === "reset_workspace") {
				resetWorkspaceToInitial(auth?.tenantId);
				return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}
			if (op === "open_file") {
				const p = String(body.path ?? "").trim();
				if (!p) return json({ error: "path required" }, 400);
				const selectPath = await openFileInWorkspace(p, auth?.tenantId);
				broadcastToolLog("INFO", "read", `workspace open_file ${p.length > 200 ? `${p.slice(0, 197)}…` : p}`);
				return json({
					ok: true,
					folders: listWorkspaceFolders(auth?.tenantId),
					root: getPrimaryWorkspacePath(auth?.tenantId),
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
				await setWorkspaceFoldersAbs(paths, auth?.tenantId);
				// Trigger indexing
				void syncWorkspaceIndex().then((res) => {
					broadcastToolLog("INFO", "index", `apply_folders sync: files=${res.state.fileCount} merkle=${res.state.merkleRoot}`);
				}).catch(() => {});
				return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}
			if (op === "from_code_workspace_file") {
				const filePath = String(body.workspaceFilePath ?? "").trim();
				const rawJson = body.json;
				if (!filePath || rawJson === undefined) {
					return json({ error: "workspaceFilePath and json required" }, 400);
				}
				await loadFoldersFromWorkspaceJson(rawJson, filePath, auth?.tenantId);
				// Trigger indexing
				void syncWorkspaceIndex().then((res) => {
					broadcastToolLog("INFO", "index", `load_workspace sync: files=${res.state.fileCount} merkle=${res.state.merkleRoot}`);
				}).catch(() => {});
				return json({ ok: true, folders: listWorkspaceFolders(auth?.tenantId), root: getPrimaryWorkspacePath(auth?.tenantId) });
			}
			return json({ error: `Unknown op: ${op}` }, 400);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 400);
		}
	}

	if (
		req.method === "POST" &&
		(p === "/api/config" || p === "/api/config/orchestrator-gates")
	) {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		return applySessionRuntimePostBody(body);
	}

	if (p === "/api/config" && req.method === "GET") {
		const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
		const engineMode = wopChatEngineFromEnv();
		const chatEngine =
			engineMode === "bundled"
				? (process.env.WOP_CHAT_ENGINE || "").trim().toLowerCase() || provider
				: engineMode;
		const piEngineLive = shouldUsePiJsonChat();
		const piBackendRequested = engineMode === "pi" || engineMode === "auto";
		const piBinaryResolved = resolvePiBinaryPath() != null;
		const workspaceDotPiPresent = existsSync(join(getPrimaryWorkspacePath(auth?.tenantId), ".pi"));
		const wantClawTree = url.searchParams.get("clawTree") === "1";
		let clawHostTree: Awaited<ReturnType<typeof buildClawHostTree>> | undefined;
		if (wantClawTree) {
			try {
				clawHostTree = await buildClawHostTree();
			} catch {
				clawHostTree = { rootDisplay: "", nodes: [] };
			}
		}
		const wantSchedules = url.searchParams.get("schedules") === "1";
		let clawSchedules: { version: 1; schedules: Awaited<ReturnType<typeof readClawSchedulesMerged>> } | undefined;
		if (wantSchedules) {
			try {
				const schedules = await readClawSchedulesMerged();
				clawSchedules = { version: 1, schedules };
			} catch {
				clawSchedules = { version: 1, schedules: [] };
			}
		}
		return json({
			provider,
			chatEngine,
			/** Absolute Way of Pi checkout root where host-scoped **`.claw/`** lives (not `WOP_WORKSPACE`). */
			clawHostRepoRoot: getClawHostRepoRoot(),
			/** Absolute path to host **`.claw/`** (e.g. optional `telegram.json`). */
			clawDotDirAbs: getClawDotDirAbs(),
			/** Absolute path to **`.claw/workspace/`** (seven scaffold files + `memory/`). */
			clawWorkspaceDirAbs: getClawWorkspaceBundleDirAbs(),
			/** True when headless **`pi --mode json`** is active (**`pi`**, **`auto`**, or unset default **`auto`**) and the **`pi`** CLI resolves — full Pi tools. */
			piDrivesChat: piEngineLive,
			/** Whether a **`pi`** executable was resolved (`WOP_PI_BINARY` or PATH); **on** still needs this for headless Pi turns. */
			piBinaryResolved,
			/** Open folder contains a **`.pi/`** directory (Pi-shaped **config**). Not the same as a resolvable **`pi`** binary. */
			workspaceDotPiPresent,
			piChatEngineRequested: piBackendRequested,
			piChatEngineWired: piEngineLive,
			/** Interim Bun tool loop only — superseded once Pi owns tools per `docs/WOP_PI_BACKEND_WIRING_PLAN.md`. */
			orchestratorTools: orchestratorToolsEnabled(),
			orchestratorBash: orchestratorBashEnabled(),
			/** Same shape as **`GET /api/health`**. so the UI can detect a stale Bun without a second request. */
			capabilities: {
				workspaceProblems: true,
				configRuntimePost: true,
				clawHostTreeGet: true,
				clawTelegramStatusGet: true,
			},
			manifestUrl: "/api/manifest",
			ollamaHost: resolveOllamaHost(),
			ollamaModel: resolveOllamaModelDefault(),
			openrouterModel: process.env.OPENROUTER_MODEL || "openrouter/auto",
			terminalEnabled: terminalAllowed(),
			...terminalShellHints(),
			...(clawHostTree ? { clawHostTree } : {}),
			/** Same shape as **`GET /api/claw/schedules`** when **`?schedules=1`** — Claw Schedule tab fallback if the dedicated path 404s. */
			...(clawSchedules ? { clawSchedules } : {}),
			/** Same payload as **`GET /api/claw/automation`** — embedded so Claw Mission survives older route ordering or proxy quirks. */
			clawAutomation: getClawAutomationStatus(),
			/** Same payload as **`GET /api/claw/telegram/status`** — embedded so Claw Channels works even if a proxy drops that path. */
			clawTelegramStatus: getClawTelegramIntegrationStatus(),
		});
	}

	if (p === "/api/github/status" && req.method === "GET") {
		try {
			return json(await readGithubConnectionMeta());
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ connected: false, login: null, error: message }, 500);
		}
	}

	if (p === "/api/claw/telegram/status" && req.method === "GET") {
		try {
			return json(getClawTelegramIntegrationStatus());
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ version: 1, error: message }, 500);
		}
	}

	if (p === "/api/claw/webhook/ensure" && req.method === "POST") {
		try {
			const r = await ensureWebhookSecret();
			return json({ ok: true, created: r.created, secret: r.secret });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/claw/webhook/rotate" && req.method === "POST") {
		try {
			const secret = await rotateWebhookSecret();
			return json({ ok: true, secret });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/claw/webhook/meta" && req.method === "GET") {
		return json({
			version: 1,
			configured: clawWebhookConfigured(),
			inboundEnabled: clawWebhookInboundEnabled(),
		});
	}

	if (p === "/api/claw/inbound" && req.method === "POST") {
		const secret = await readWebhookSecret();
		if (!secret) {
			return json({ ok: false, error: "No webhook secret — use POST /api/claw/webhook/ensure first." }, 404);
		}
		if (!clawWebhookInboundEnabled()) {
			return json({ ok: false, error: "Inbound webhook disabled (WOP_CLAW_INBOUND)." }, 403);
		}
		const auth = req.headers.get("authorization");
		if (!verifyWebhookBearer(auth, secret)) {
			return json({ ok: false, error: "Unauthorized" }, 401);
		}
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ ok: false, error: "Invalid JSON" }, 400);
		}
		const prompt = String(body.prompt ?? "").trim();
		if (!prompt) return json({ ok: false, error: "prompt required" }, 400);
		const agentRaw = body.agentName;
		const agentName =
			agentRaw === null || agentRaw === undefined
				? null
				: typeof agentRaw === "string"
					? agentRaw.trim() || null
					: null;
		const name = String(body.name ?? "Inbound webhook").trim() || "Inbound webhook";
		try {
			const r = await executeClawAutomation({
				name,
				prompt,
				agentName,
				source: "webhook",
			});
			if (r.ok) return json({ ok: true });
			return json({ ok: false, error: r.error }, 500);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/github/connect" && req.method === "POST") {
		let body: Record<string, unknown>;
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			return json({ ok: false, error: "Invalid JSON" }, 400);
		}
		const token = String(body.token ?? "");
		const verified = await verifyGithubToken(token);
		if (!verified.ok) return json({ ok: false, error: verified.error }, 400);
		const saved = await saveGithubCredentials(token, verified.login);
		if (!saved.ok) return json({ ok: false, error: saved.error }, 500);
		return json({ ok: true, login: verified.login });
	}

	if (p === "/api/github/disconnect" && req.method === "POST") {
		try {
			await removeGithubCredentials();
			return json({ ok: true });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ ok: false, error: message }, 500);
		}
	}

	if (p === "/api/manifest" && req.method === "GET") {
		try {
			return json(collectStaticWebManifest());
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/ui/views" && req.method === "GET") {
		const data = await readUiViewsCatalog(getPrimaryWorkspacePath(auth?.tenantId));
		return json(data);
	}

	if (p === "/api/ui/views/seed" && req.method === "POST") {
		const r = await seedUiViewsCatalogIfMissing(getPrimaryWorkspacePath(auth?.tenantId));
		return json({ ok: true, created: r.created, path: r.path });
	}

	if (p === "/api/llm/models" && req.method === "GET") {
		const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
		const ollamaHost = resolveOllamaHost();
		const envDefaultOllama = resolveOllamaModelDefault();
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
			const data = await loadWorkspaceAgents(auth!.tenantId);
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
		const cwd = getWorkspaceRoot(auth?.tenantId);
		broadcastToolLog("INFO", "bash", `bun run ${script} (cwd ${cwd.length > 80 ? `${cwd.slice(0, 77)}…` : cwd})`);
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
			const { root, nodes, folders, git } = await buildWorkspaceTree(auth?.tenantId);
			return json({
				root,
				nodes,
				folders,
				git,
				switchAllowed: workspaceSwitchAllowed(),
				initialRoot: getFrozenInitialWorkspacePath(),
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/git/stage" && req.method === "POST") {
		let body: { path?: string; all?: boolean };
		try {
			body = (await req.json()) as { path?: string; all?: boolean };
		} catch {
			return json({ ok: false as const, error: "Invalid JSON" });
		}
		const rel = String(body.path ?? "").trim();
		const abs = safeResolveUnderWorkspace(rel, auth?.tenantId);
		if (!abs) return json({ ok: false as const, error: "Invalid path" });
		if (body.all === true) {
			const result = await gitStageAllFromAbsolutePath(abs);
			if (!result.ok) {
				broadcastToolLog("WARN", "git", `stage all failed (anchor ${rel}): ${result.error}`);
				return json(result);
			}
			broadcastToolLog("INFO", "git", `staged all changes (repo from ${rel})`);
			return json(result);
		}
		const result = await gitStageAbsolutePath(abs);
		if (!result.ok) {
			broadcastToolLog("WARN", "git", `stage failed ${rel}: ${result.error}`);
			return json(result);
		}
		broadcastToolLog("INFO", "git", `staged ${rel}`);
		return json(result);
	}

	if (p === "/api/plans" && req.method === "GET") {
		try {
			const catalog = await listPlansCatalog();
			return json(catalog);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/file" && req.method === "GET") {
		const rel = url.searchParams.get("path") || "";
		const relNorm = rel.trim();
		let abs = resolveWorkspaceOrClawAbs(relNorm);
		if (!abs) return json({ error: "Invalid path" }, 400);
		let readRel = relNorm;
		let st: Awaited<ReturnType<typeof stat>>;
		try {
			st = await stat(abs);
		} catch {
			const legRel = clawWorkspaceBundleToLegacyFlatRel(relNorm);
			if (!legRel) {
				const message = "Not found";
				return json({ error: message }, 404);
			}
			const legAbs = resolveWorkspaceOrClawAbs(legRel);
			if (!legAbs) return json({ error: "Not found" }, 404);
			try {
				st = await stat(legAbs);
				readRel = legRel;
				abs = legAbs;
			} catch {
				return json({ error: "Not found" }, 404);
			}
		}
		try {
			if (!st.isFile()) return json({ error: "Not a file" }, 400);
			if (st.size > MAX_FILE_BYTES) return json({ error: "File too large for editor" }, 413);
			const imageMime = imageMimeFromPath(readRel);
			if (imageMime) {
				const buf = await readFile(abs);
				broadcastToolLog("INFO", "read", `read ${readRel} (image, ${buf.length} bytes)`);
				return json({
					path: readRel,
					encoding: "base64",
					mimeType: imageMime,
					content: buf.toString("base64"),
				});
			}
			const buf = await readFile(abs);
			if (buf.includes(0)) {
				broadcastToolLog("INFO", "read", `read ${readRel} (binary, ${buf.length} bytes)`);
				return json({
					path: readRel,
					encoding: "base64",
					mimeType: "application/octet-stream",
					content: buf.toString("base64"),
				});
			}
			broadcastToolLog("INFO", "read", `read ${readRel} (${buf.length} chars utf8)`);
			return json({ path: readRel, content: buf.toString("utf8") });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 404);
		}
	}

	if (p === "/api/file" && req.method === "PUT") {
		let body: { path?: string; content?: string; encoding?: string };
		try {
			body = (await req.json()) as { path?: string; content?: string; encoding?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const rel = body.path || "";
		const abs = resolveWorkspaceOrClawAbs(rel);
		if (!abs) return json({ error: "Invalid path" }, 400);
		const raw = body.content ?? "";
		try {
			await mkdir(dirname(abs), { recursive: true });
			if (body.encoding === "base64") {
				let buf: Buffer;
				try {
					buf = Buffer.from(raw, "base64");
				} catch {
					return json({ error: "Invalid base64" }, 400);
				}
				if (buf.length > MAX_FILE_BYTES) return json({ error: "Content too large" }, 413);
				await writeFile(abs, buf);
				broadcastToolLog("INFO", "write", `write ${rel} (binary, ${buf.length} bytes)`);
			} else {
				if (Buffer.byteLength(raw, "utf8") > MAX_FILE_BYTES) return json({ error: "Content too large" }, 413);
				await writeFile(abs, raw, "utf8");
				broadcastToolLog("INFO", "write", `write ${rel} (${Buffer.byteLength(raw, "utf8")} bytes utf8)`);
			}
			return json({ ok: true, path: rel });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/fs/move" && req.method === "POST") {
		let body: { from?: string; toDir?: string };
		try {
			body = (await req.json()) as { from?: string; toDir?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const fromRel = String(body.from ?? "")
			.trim()
			.replace(/^[/\\]+/, "");
		const toDirRaw = body.toDir;
		const toDirRel =
			typeof toDirRaw === "string"
				? toDirRaw.trim().replace(/^[/\\]+/, "").replace(/[/\\]+$/, "")
				: "";
		if (!fromRel || fromRel.includes("..")) {
			return json({ error: "Invalid from path" }, 400);
		}
		if (toDirRel.includes("..")) {
			return json({ error: "Invalid toDir" }, 400);
		}
		if (listWorkspaceFolders(auth?.tenantId).length > 1 && !toDirRel) {
			return json({ error: "Drop onto a folder (multi-root workspace has no single root)." }, 400);
		}
		const fromAbs = resolveWorkspaceOrClawAbs(fromRel);
		if (!fromAbs) {
			return json({ error: "Invalid from path" }, 400);
		}
		let stFrom: Awaited<ReturnType<typeof stat>>;
		try {
			stFrom = await stat(fromAbs);
		} catch {
			return json({ error: "Source not found" }, 404);
		}
		if (!stFrom.isFile()) {
			return json({ error: "Only files can be moved from the explorer" }, 400);
		}
		const destRel = toDirRel ? posixJoin(toDirRel, posixBasename(fromRel)) : posixBasename(fromRel);
		const normFrom = fromRel.replace(/\/+$/, "");
		const normDest = destRel.replace(/\/+$/, "");
		if (normDest === normFrom) {
			return json({ error: "Already in that folder" }, 400);
		}
		const destAbs = resolveWorkspaceOrClawAbs(destRel);
		if (!destAbs) {
			return json({ error: "Invalid destination" }, 400);
		}
		if (toDirRel) {
			const toDirAbs = resolveWorkspaceOrClawAbs(toDirRel);
			if (!toDirAbs) {
				return json({ error: "Invalid folder" }, 400);
			}
			let stDir: Awaited<ReturnType<typeof stat>>;
			try {
				stDir = await stat(toDirAbs);
			} catch {
				return json({ error: "Folder not found" }, 404);
			}
			if (!stDir.isDirectory()) {
				return json({ error: "Target is not a folder" }, 400);
			}
		}
		if (existsSync(destAbs)) {
			return json({ error: "A file with that name already exists in the target folder" }, 409);
		}
		try {
			await rename(fromAbs, destAbs);
			broadcastToolLog("INFO", "mv", `mv ${fromRel} → ${destRel}`);
			return json({ ok: true, to: destRel });
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
		const abs = resolveWorkspaceOrClawAbs(rel);
		if (!abs) return json({ error: "Invalid path" }, 400);
		if (existsSync(abs)) {
			return json({ error: "Path already exists" }, 409);
		}
		try {
			if (kind === "dir") {
				await mkdir(abs, { recursive: true });
				broadcastToolLog("INFO", "mkdir", `mkdir ${rel}`);
			} else {
				await mkdir(dirname(abs), { recursive: true });
				await writeFile(abs, "", "utf8");
				broadcastToolLog("INFO", "write", `touch ${rel}`);
			}
			return json({ ok: true, path: rel });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	if (p === "/api/fs/delete" && req.method === "POST") {
		let body: { path?: string };
		try {
			body = (await req.json()) as { path?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		const rel = String(body.path ?? "")
			.trim()
			.replace(/^[/\\]+/, "");
		if (!rel || rel === "." || rel.includes("..")) {
			return json({ error: "Invalid path" }, 400);
		}
		const abs = resolveWorkspaceOrClawAbs(rel);
		if (!abs) return json({ error: "Invalid path" }, 400);
		try {
			await rm(abs, { recursive: true, force: true });
			broadcastToolLog("INFO", "rm", `rm ${rel}`);
			return json({ ok: true as const, path: rel });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: message }, 500);
		}
	}

	// ============================================
	// SUPER ADMIN ENDPOINTS (Phase 2)
	// ============================================

	// Helper: Check if user is SUPER_ADMIN
	const requireSuperAdmin = (auth: any) => {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		if (auth.role !== "SUPER_ADMIN") return json({ error: "Forbidden: Requires SUPER_ADMIN role" }, 403);
		return null;
	};

	// GET /api/admin/tenants - List all tenants
	if (p === "/api/admin/tenants" && req.method === "GET") {
		const forbidden = requireSuperAdmin(auth);
		if (forbidden) return forbidden;
		try {
			const tenants = db.query("SELECT *, (SELECT COUNT(*) FROM users WHERE tenant_id = tenants.id) as user_count FROM tenants ORDER BY created_at DESC").all() as any[];
			return json(tenants || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch tenants", details: message }, 500);
		}
	}

	// POST /api/admin/tenants - Create new tenant
	if (p === "/api/admin/tenants" && req.method === "POST") {
		const forbidden = requireSuperAdmin(auth);
		if (forbidden) return forbidden;
		let body: { name?: string; slug?: string; subscription_tier?: string };
		try {
			body = (await req.json()) as { name?: string; slug?: string; subscription_tier?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		if (!body.name || !body.slug) return json({ error: "Missing required fields: name, slug" }, 400);
		try {
			const id = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			const result = db.query("INSERT INTO tenants (id, name, slug, subscription_tier) VALUES (?, ?, ?, ?)")
				.run(id, body.name, body.slug, body.subscription_tier || 'free');
			if (result.changes === 0) return json({ error: "Failed to create tenant" }, 500);
			const tenant = db.query("SELECT * FROM tenants WHERE id = ?").get(id) as any;
			return json({ ok: true, tenant });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to create tenant", details: message }, 500);
		}
	}

	// GET /api/admin/stats - System statistics
	if (p === "/api/admin/stats" && req.method === "GET") {
		const forbidden = requireSuperAdmin(auth);
		if (forbidden) return forbidden;
		try {
			const stats = {
				tenants: (db.query("SELECT COUNT(*) as count FROM tenants WHERE active = 1").get() as any)?.count || 0,
				users: (db.query("SELECT COUNT(*) as count FROM users WHERE active = 1").get() as any)?.count || 0,
				projects: (db.query("SELECT COUNT(*) as count FROM projects").get() as any)?.count || 0,
				tasks: (db.query("SELECT COUNT(*) as count FROM tasks").get() as any)?.count || 0,
				time_entries: (db.query("SELECT COUNT(*) as count FROM time_entries").get() as any)?.count || 0,
			};
			return json(stats);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch stats", details: message }, 500);
		}
	}

	// GET /api/admin/users - List all users (system-wide)
	if (p === "/api/admin/users" && req.method === "GET") {
		const forbidden = requireSuperAdmin(auth);
		if (forbidden) return forbidden;
		try {
			const users = db.query(`
				SELECT u.*, t.name as tenant_name
				FROM users u
				LEFT JOIN tenants t ON u.tenant_id = t.id
				ORDER BY u.created_at DESC
			`).all() as any[];
			return json(users || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch users", details: message }, 500);
		}
	}

	// ============================================
	// CLIENT ROLE ENDPOINTS (Phase 2)
	// ============================================

	// Helper: Check if user is CLIENT or has permission to view client data
	const requireClientAccess = (auth: any) => {
		if (!auth) return json({ error: "Unauthorized" }, 401);
		// CLIENT role or LEADER can access (leaders may view as client)
		if (auth.role !== "CLIENT" && auth.role !== "LEADER" && auth.role !== "SUPER_ADMIN") {
			return json({ error: "Forbidden: Client access required" }, 403);
		}
		return null;
	};

	// GET /api/client/projects - List projects for client's tenant (read-only)
	if (p === "/api/client/projects" && req.method === "GET") {
		const forbidden = requireClientAccess(auth);
		if (forbidden) return forbidden;
		try {
			const projects = db.query(`
				SELECT p.*,
				       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
				       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'complete') as completed_tasks
				FROM projects p
				WHERE p.tenant_id = ? AND p.status != 'draft'
				ORDER BY p.created_at DESC
			`).all(auth.tenantId) as any[];
			return json(projects || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch projects", details: message }, 500);
		}
	}

	// GET /api/client/projects/:id/progress - Get project progress
	if (p.startsWith("/api/client/projects/") && p.endsWith("/progress") && req.method === "GET") {
		const forbidden = requireClientAccess(auth);
		if (forbidden) return forbidden;
		const projectId = p.split("/")[4]; // /api/client/projects/:id/progress
		try {
			const project = db.query("SELECT * FROM projects WHERE id = ? AND tenant_id = ?")
				.get(projectId, auth.tenantId) as any;
			if (!project) return json({ error: "Project not found" }, 404);

			const tasks = db.query(`
				SELECT status, COUNT(*) as count
				FROM tasks
				WHERE project_id = ? AND tenant_id = ?
				GROUP BY status
			`).all(projectId, auth.tenantId) as any[];

			const timeEntries = db.query(`
				SELECT SUM(hours) as total_hours
				FROM time_entries
				WHERE project_id = ? AND tenant_id = ?
			`).get(projectId, auth.tenantId) as any;

			const progress = {
				project: {
					id: project.id,
					name: project.name,
					description: project.description,
					status: project.status,
					budget_allocated: project.budget_allocated,
					budget_spent: project.budget_spent,
				},
				tasks_summary: tasks,
				total_hours: timeEntries?.total_hours || 0,
				completion_percentage: project.budget_allocated > 0
					? Math.min(100, Math.round((project.budget_spent / project.budget_allocated) * 100))
					: 0,
			};
			return json(progress);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch project progress", details: message }, 500);
		}
	}

	// GET /api/client/drawings - List drawings/documents for client
	if (p === "/api/client/drawings" && req.method === "GET") {
		const forbidden = requireClientAccess(auth);
		if (forbidden) return forbidden;
		try {
			const drawings = db.query(`
				SELECT wf.*, p.name as project_name
				FROM workspace_files wf
				LEFT JOIN projects p ON wf.project_id = p.id
				WHERE wf.tenant_id = ? AND wf.cad_type IN ('dwg', 'rvt', 'pdf', 'image')
				ORDER BY wf.created_at DESC
			`).all(auth.tenantId) as any[];
			return json(drawings || []);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to fetch drawings", details: message }, 500);
		}
	}

	// POST /api/client/feedback - Submit feedback
	if (p === "/api/client/feedback" && req.method === "POST") {
		const forbidden = requireClientAccess(auth);
		if (forbidden) return forbidden;
		let body: { project_id?: string; rating?: number; comment?: string; category?: string };
		try {
			body = (await req.json()) as { project_id?: string; rating?: number; comment?: string; category?: string };
		} catch {
			return json({ error: "Invalid JSON" }, 400);
		}
		try {
			const id = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			db.query(`
				INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details_json)
				VALUES (?, ?, 'CLIENT_FEEDBACK', 'project', ?, ?)
			`).run(auth.tenantId, auth.userId, body.project_id || null, JSON.stringify({
				rating: body.rating,
				comment: body.comment,
				category: body.category,
			}));
			return json({ ok: true, id });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to submit feedback", details: message }, 500);
		}
	}

	}

	// ============================================
	// MANIFEST-DRIVEN UI ENDPOINT (Phase 2)
	// ============================================

	// GET /api/manifest - Return dynamic UI configuration (commands, tools, features)
	if (p === "/api/manifest" && req.method === "GET") {
		try {
			// Get user's role for permission-based manifest
			const userRole = auth?.role || "ANONYMOUS";
			const isSuperAdmin = userRole === "SUPER_ADMIN";
			const isLeader = userRole === "LEADER" || isSuperAdmin;
			const isWorker = userRole === "WORKER" || isLeader;
			const isClient = userRole === "CLIENT" || isLeader;

			const manifest = {
				version: "1.0.0",
				generated_at: new Date().toISOString(),
				user: {
					role: userRole,
					tenant_id: auth?.tenantId || null,
					user_id: auth?.userId || null,
				},
				// Available UI modes based on role
				ui_modes: [
					{ id: "simple", label: "Simple", icon: "MessageSquare", available: true },
					{ id: "technical", label: "Technical", icon: "Terminal", available: true },
					{ id: "claw", label: "Claw", icon: "Bot", available: true },
					{ id: "docs", label: "Docs", icon: "FileText", available: isLeader || isSuperAdmin },
					{ id: "work", label: "Work", icon: "Briefcase", available: isWorker || isLeader },
				].filter(m => m.available),
				// Command palette items (dynamically generated)
				commands: [
					{ id: "chat", label: "Chat", icon: "MessageSquare", category: "core", available: true },
					{ id: "agents", label: "Agents", icon: "Bot", category: "core", available: true },
					{ id: "workspace", label: "Workspace", icon: "FolderOpen", category: "core", available: true },
					{ id: "settings", label: "Settings", icon: "Settings", category: "core", available: true },
					{ id: "tasks", label: "Tasks", icon: "CheckSquare", category: "work", available: isWorker },
					{ id: "time", label: "Time Tracking", icon: "Clock", category: "work", available: isWorker },
					{ id: "files", label: "Files", icon: "File", category: "work", available: isWorker },
					{ id: "team", label: "Team", icon: "Users", category: "leadership", available: isLeader },
					{ id: "projects", label: "Projects", icon: "FolderKanban", category: "leadership", available: isLeader },
					{ id: "ai_predictions", label: "AI Predictions", icon: "Brain", category: "leadership", available: isLeader },
					{ id: "admin_tenants", label: "Manage Tenants", icon: "Building", category: "admin", available: isSuperAdmin },
					{ id: "admin_users", label: "Manage Users", icon: "Users", category: "admin", available: isSuperAdmin },
					{ id: "admin_stats", label: "System Stats", icon: "BarChart3", category: "admin", available: isSuperAdmin },
					{ id: "client_projects", label: "My Projects", icon: "FolderOpen", category: "client", available: isClient },
					{ id: "client_drawings", label: "Drawings", icon: "FileImage", category: "client", available: isClient },
					{ id: "client_feedback", label: "Feedback", icon: "MessageSquarePlus", category: "client", available: isClient },
				].filter(c => c.available),
				// Tool lists (for agent tools, command palette, etc.)
				tools: [
					{ id: "read_file", label: "Read File", category: "file" },
					{ id: "edit_file", label: "Edit File", category: "file" },
					{ id: "write_file", label: "Write File", category: "file" },
					{ id: "bash", label: "Bash", category: "system" },
					{ id: "web_search", label: "Web Search", category: "web" },
					{ id: "web_fetch", label: "Web Fetch", category: "web" },
					{ id: "send_email", label: "Send Email", category: "communication" },
					{ id: "whatsapp_send", label: "WhatsApp Send", category: "communication", available: isWorker },
					{ id: "whatsapp_receive", label: "WhatsApp Receive", category: "communication", available: isWorker },
					{ id: "time_log", label: "Log Time", category: "work", available: isWorker },
					{ id: "task_create", label: "Create Task", category: "work", available: isLeader },
					{ id: "task_assign", label: "Assign Task", category: "work", available: isLeader },
					{ id: "ai_predict", label: "AI Prediction", category: "ai", available: isLeader },
					{ id: "pdf_view", label: "PDF View", category: "view" },
					{ id: "cad_view", label: "CAD View", category: "view", available: isLeader || isClient },
					{ id: "audit_log", label: "Audit Log", category: "admin", available: isSuperAdmin },
					{ id: "manage_tenant", label: "Manage Tenant", category: "admin", available: isSuperAdmin },
				].filter(t => t.available === undefined || t.available),
				// Feature flags
				features: {
					whatsapp_bot: isWorker || isLeader,
					cad_support: isLeader || isClient,
					ai_predictions: isLeader,
					multi_tenancy: isSuperAdmin,
					client_portal: isClient,
					worker_portal: isWorker,
					super_admin: isSuperAdmin,
				},
				// Navigation items (sidebar, bottom nav, etc.)
				navigation: {
					main: [
						{ id: "chat", label: "Chat", icon: "MessageSquare", path: "/" },
						{ id: "workspace", label: "Workspace", icon: "FolderOpen", path: "/workspace" },
					],
					portal: isWorker ? [
						{ id: "portal_tasks", label: "My Tasks", icon: "CheckSquare", path: "/portal" },
						{ id: "portal_time", label: "Time Log", icon: "Clock", path: "/portal" },
						{ id: "portal_files", label: "Files", icon: "File", path: "/portal" },
					] : [],
					admin: isSuperAdmin ? [
						{ id: "admin_dashboard", label: "Admin", icon: "ShieldCheck", path: "/admin" },
					] : [],
					client: isClient ? [
						{ id: "client_dashboard", label: "Client", icon: "Eye", path: "/client" },
					] : [],
				},
			};
			return json(manifest);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return json({ error: "Failed to generate manifest", details: message }, 500);
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

	const isWs = req.headers.get("upgrade")?.toLowerCase() === "websocket";
		const authHeader = req.headers.get("Authorization") || url.searchParams.get("token");
		const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
	const auth = token ? await verifyToken(token) : null;

	// DEV MODE: Skip auth for WebSocket upgrades when WOP_DEV_MODE=true
	const devMode = process.env.WOP_DEV_MODE?.trim().toLowerCase() === "true";
	if (!auth && !devMode) {
		if (url.pathname === "/ws/terminal" || url.pathname === "/ws") {
			return new Response("Unauthorized", { status: 401 });
		}
	}

	if (url.pathname === "/ws/terminal" && isWs) {
		if (!auth && !devMode) {
			return new Response("Unauthorized", { status: 401 });
		}
		if (!terminalAllowed()) {
				return new Response(
					"Terminal disabled. Set WOP_ALLOW_TERMINAL=1 on the server and restart. This exposes a real host shell (security-sensitive).",
					{ status: 403 },
				);
			}
			const upgraded = srv.upgrade(req, {
				data: {
					kind: "terminal",
					session: null,
					stdinLogBuffer: "",
				} satisfies TerminalWsData,
			});
			if (upgraded) return undefined as unknown as Response;
			return new Response("WebSocket upgrade failed", { status: 500 });
		}

                        if (
                                url.pathname === "/ws" &&
                                isWs
                        ) {
				if (!auth) {
					return new Response("Unauthorized", { status: 401 });
				}
                                const upgraded = srv.upgrade(req, {
                                        data: {
                                                kind: "chat",
                                                messages: [] as ChatMessage[],
                                                busy: false,
                                                pendingChatQueue: [],
                                                ollamaModel: undefined,
                                                openrouterModel: undefined,
                                                chatMode: "build",
                                                agentName: null,
                                                cachedAgentBody: null,
                                                chatAbort: null,
                                                cumPromptTokens: 0,
                                                cumCompletionTokens: 0,
                                                wopSessionKey: null,
						tenantId: auth.tenantId,
						userId: auth.userId,
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
			const envOllama = resolveOllamaModelDefault();
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
			registerChatSocketForToolLogs(ws);
		},
		close(ws) {
			if (ws.data.kind === "terminal") {
				disposeTerminal(ws);
			} else if (ws.data.kind === "chat") {
				unregisterChatSocketForToolLogs(ws);
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
							: "Build mode — Orchestrator when no .md agent, else selected agent; WOP_SYSTEM_PROMPT prepended when set.",
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
					const body = await getAgentBodyByName(nextName, ws.data.tenantId);
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
							: "Agent persona: Orchestrator (no workspace .md — server injects Pi-shaped orchestrator system prompt).",
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
				await processActivateSession(ws, msg as { transcript?: unknown; sessionKey?: unknown });
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
				ws.data.pendingChatQueue = [];
				ws.data.wopSessionKey = null;
				ws.data.cumPromptTokens = 0;
				ws.data.cumCompletionTokens = 0;
				sendQueueState(ws, []);
				applyLeadFromCache(ws.data);
				ws.send(JSON.stringify({ type: "session_reset" }));
				ws.send(JSON.stringify({ type: "chat_mode", mode: ws.data.chatMode }));
				ws.send(JSON.stringify({ type: "agent", name: ws.data.agentName }));
				ws.send(logLine("INFO", "chat", "New session — conversation context cleared for this connection."));
				return;
			}
			if (msg.type === "queue_edit") {
				const id = String((msg as { id?: unknown }).id ?? "").trim();
				const nextText = String((msg as { text?: unknown }).text ?? "").trim();
				if (!id || !nextText) {
					ws.send(JSON.stringify({ type: "error", message: "queue_edit requires id and non-empty text." }));
					return;
				}
				const item = ws.data.pendingChatQueue.find((q) => q.id === id);
				if (!item) {
					ws.send(JSON.stringify({ type: "error", message: "Unknown queue message id." }));
					return;
				}
				item.text = nextText;
				sendQueueState(ws, ws.data.pendingChatQueue);
				return;
			}
			if (msg.type === "queue_delete") {
				const id = String((msg as { id?: unknown }).id ?? "").trim();
				if (!id) {
					ws.send(JSON.stringify({ type: "error", message: "queue_delete requires id." }));
					return;
				}
				const before = ws.data.pendingChatQueue.length;
				ws.data.pendingChatQueue = ws.data.pendingChatQueue.filter((q) => q.id !== id);
				if (ws.data.pendingChatQueue.length === before) {
					ws.send(JSON.stringify({ type: "error", message: "Unknown queue message id." }));
					return;
				}
				sendQueueState(ws, ws.data.pendingChatQueue);
				return;
			}
			if (msg.type === "queue_force") {
				const id = String((msg as { id?: unknown }).id ?? "").trim();
				if (!id) {
					ws.send(JSON.stringify({ type: "error", message: "queue_force requires id." }));
					return;
				}
				const idx = ws.data.pendingChatQueue.findIndex((q) => q.id === id);
				if (idx < 0) {
					ws.send(JSON.stringify({ type: "error", message: "Unknown queue message id." }));
					return;
				}
				const [item] = ws.data.pendingChatQueue.splice(idx, 1);
				if (!item) return;
				if (ws.data.busy) {
					ws.data.pendingChatQueue.unshift(item);
					sendQueueState(ws, ws.data.pendingChatQueue);
					return;
				}
				try {
					ws.send(JSON.stringify({ type: "queue_runtime_bind", queueId: item.id }));
				} catch {
					/* socket may be closing */
				}
				sendQueueState(ws, ws.data.pendingChatQueue);
				void runChatTurn(ws, item.text, false).catch(() => {
					/* runChatTurn already reports errors to the client */
				});
				return;
			}
			if (msg.type !== "chat") return;
			const text = String(msg.content ?? "").trim();
			if (!text) return;

			if (ws.data.busy) {
				const id = crypto.randomUUID();
				ws.data.pendingChatQueue.push({ id, text });
				ws.send(JSON.stringify({ type: "user_queued", content: text, queueId: id }));
				sendQueueState(ws, ws.data.pendingChatQueue);
				return;
			}

			void runChatTurn(ws, text, true).catch(() => {
				/* runChatTurn already reports errors to the client */
			});
		},
	},
});

const _bootEngineMode = wopChatEngineFromEnv();
const _bootPiDrives = shouldUsePiJsonChat();
console.log(
	`Way of Pi server http://127.0.0.1:${server.port} workspace=${getWorkspaceRoot()} chatEngine=${_bootEngineMode} piDrivesChat=${_bootPiDrives} manifest=/api/manifest`,
);

// Start the workspace-index auto-sync timer based on saved options.
void applyAutoSync((result) => {
	broadcastToolLog(
		"INFO",
		"index",
		`auto-sync: files=${result.state.fileCount} fingerprint=${result.state.merkleRoot}`,
	);
});

startClawScheduler();
