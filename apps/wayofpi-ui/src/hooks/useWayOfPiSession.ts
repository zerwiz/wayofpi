import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

const ACTIVE_LLM_STORAGE_KEY = "wayofpi.activeLlmModel";
const CHAT_MODE_STORAGE_KEY = "wayofpi.chatMode";
const CHAT_AGENT_STORAGE_KEY = "wayofpi.chatAgent";

export type ChatSessionMode = "build" | "plan";

function readStoredChatMode(): ChatSessionMode {
	try {
		const v = localStorage.getItem(CHAT_MODE_STORAGE_KEY);
		if (v === "plan" || v === "build") return v;
	} catch {
		/* ignore */
	}
	return "build";
}

function readStoredChatAgent(): string | null {
	try {
		const v = localStorage.getItem(CHAT_AGENT_STORAGE_KEY)?.trim();
		return v || null;
	} catch {
		/* ignore */
	}
	return null;
}

export interface ChatRow {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export interface LogRow {
	time: string;
	level: string;
	source: string;
	msg: string;
}

export interface ChatSessionTab {
	id: string;
	label: string;
}

const TAB_TITLE_MAX_CHARS = 44;

/** First-line style title from the user's opening message (for session tab labels). */
function tabTitleFromUserMessage(raw: string): string | null {
	const single = raw.replace(/\s+/g, " ").trim();
	if (!single) return null;
	if (single.length <= TAB_TITLE_MAX_CHARS) return single;
	return `${single.slice(0, TAB_TITLE_MAX_CHARS - 1)}…`;
}

function wsUrl(): string {
	const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${proto}//${window.location.host}/ws`;
}

export function useWayOfPiSession(
	onTreeRefresh?: () => void,
	/** When ref is true, assistant deltas are buffered and applied once on `done` (Simple UI “streaming off”). */
	bufferAssistantDeltasRef?: MutableRefObject<boolean>,
) {
	const initialTabIdRef = useRef<string | null>(null);
	if (initialTabIdRef.current == null) {
		initialTabIdRef.current = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}
	const initialTabId = initialTabIdRef.current;

	const [connected, setConnected] = useState(false);
	const [chatTabs, setChatTabs] = useState<ChatSessionTab[]>([
		{ id: initialTabId, label: "Session Chat" },
	]);
	const [activeChatTabId, setActiveChatTabId] = useState(initialTabId);
	const [rowsByTab, setRowsByTab] = useState<Record<string, ChatRow[]>>(() => ({
		[initialTabId]: [],
	}));
	const rows = rowsByTab[activeChatTabId] ?? [];

	const [logs, setLogs] = useState<LogRow[]>([]);
	const [streaming, setStreaming] = useState(false);
	/** Server-side count of user messages waiting after the in-flight assistant turn. */
	const [chatQueuePending, setChatQueuePending] = useState(0);
	const [error, setError] = useState<string | null>(null);
	/** Server-reported model id in use for this WebSocket (Ollama tag or OpenRouter id). */
	const [effectiveModel, setEffectiveModel] = useState<string | null>(null);
	const [chatMode, setChatModeState] = useState<ChatSessionMode>(() =>
		typeof window !== "undefined" ? readStoredChatMode() : "build",
	);
	const [chatAgentName, setChatAgentNameState] = useState<string | null>(() =>
		typeof window !== "undefined" ? readStoredChatAgent() : null,
	);
	const wsRef = useRef<WebSocket | null>(null);
	const assistantIdRef = useRef<string | null>(null);
	const bufferThisTurnRef = useRef(false);
	const bufferedAssistantRef = useRef("");
	const activeChatTabIdRef = useRef(activeChatTabId);
	const rowsByTabRef = useRef(rowsByTab);
	const chatTabsRef = useRef(chatTabs);

	useEffect(() => {
		activeChatTabIdRef.current = activeChatTabId;
	}, [activeChatTabId]);
	useEffect(() => {
		rowsByTabRef.current = rowsByTab;
	}, [rowsByTab]);
	useEffect(() => {
		chatTabsRef.current = chatTabs;
	}, [chatTabs]);

	const shouldBufferDeltas = () => bufferAssistantDeltasRef?.current === true;

	const WS_ERROR_HINT =
		"Chat WebSocket unreachable — start the Bun server on port 3333 (from apps/wayofpi-ui: npm run dev, or: bun run server/index.ts). Vite-only (npm run dev:ui) does not include the server.";

	useEffect(() => {
		let disposed = false;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let attempt = 0;

		const clearReconnect = () => {
			if (reconnectTimer !== null) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
		};

		const scheduleReconnect = () => {
			clearReconnect();
			if (disposed) return;
			const ms = Math.min(30_000, Math.round(400 * 1.65 ** attempt));
			attempt += 1;
			reconnectTimer = setTimeout(() => {
				reconnectTimer = null;
				openSocket();
			}, ms);
		};

		const applyFirstUserTabTitle = (tabId: string, userContent: string) => {
			const prior = rowsByTabRef.current[tabId] ?? [];
			if (prior.some((r) => r.role === "user")) return;
			const title = tabTitleFromUserMessage(userContent);
			if (!title) return;
			setChatTabs((tabs) => {
				const next = tabs.map((t) => (t.id === tabId ? { ...t, label: title } : t));
				chatTabsRef.current = next;
				return next;
			});
		};

		function openSocket() {
			if (disposed) return;
			clearReconnect();
			const ws = new WebSocket(wsUrl());
			wsRef.current = ws;

			ws.onopen = () => {
				if (wsRef.current !== ws) return;
				attempt = 0;
				setConnected(true);
				setError(null);
				setChatQueuePending(0);
				queueMicrotask(() => {
					const w = wsRef.current;
					if (!w || w.readyState !== WebSocket.OPEN) return;
					const id = activeChatTabIdRef.current;
					const tabRows = rowsByTabRef.current[id] ?? [];
					if (tabRows.length === 0) return;
					w.send(
						JSON.stringify({
							type: "activate_session",
							transcript: tabRows.map((r) => ({ role: r.role, content: r.content })),
						}),
					);
				});
			};

			ws.onclose = () => {
				if (wsRef.current === ws) wsRef.current = null;
				if (disposed) return;
				setConnected(false);
				setStreaming(false);
				setChatQueuePending(0);
				assistantIdRef.current = null;
				bufferThisTurnRef.current = false;
				bufferedAssistantRef.current = "";
				scheduleReconnect();
			};

			ws.onerror = () => {
				setError(WS_ERROR_HINT);
			};

			ws.onmessage = (ev) => {
				if (wsRef.current !== ws) return;
				try {
					const data = JSON.parse(String(ev.data)) as Record<string, unknown>;
					const type = data.type as string;
					if (type === "ready") {
						const eff = String(data.effectiveModel ?? "").trim();
						if (eff) setEffectiveModel(eff);
						const srvMode = data.chatMode === "plan" || data.chatMode === "build" ? data.chatMode : "build";
						const want = readStoredChatMode();
						setChatModeState(want);
						if (want !== srvMode && ws.readyState === WebSocket.OPEN) {
							ws.send(JSON.stringify({ type: "set_chat_mode", mode: want }));
						}
						const srvAgent =
							data.agentName === null || typeof data.agentName === "string" ? data.agentName : null;
						const wantAgent = readStoredChatAgent();
						setChatAgentNameState(wantAgent);
						if (wantAgent !== srvAgent && ws.readyState === WebSocket.OPEN) {
							ws.send(JSON.stringify({ type: "set_agent", agent: wantAgent }));
						}
						setLogs((L) => [
							...L,
							{
								time: new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "",
								level: "SUCCESS",
								source: "wop-server",
								msg: `Connected. Workspace: ${String(data.workspace ?? "")}`,
							},
						]);
						try {
							const saved = localStorage.getItem(ACTIVE_LLM_STORAGE_KEY)?.trim();
							if (saved && saved !== eff && ws.readyState === WebSocket.OPEN) {
								ws.send(JSON.stringify({ type: "set_model", model: saved }));
							}
						} catch {
							/* ignore */
						}
						return;
					}
				if (type === "chat_mode") {
					const m = data.mode === "plan" || data.mode === "build" ? data.mode : "build";
					setChatModeState(m);
					try {
						localStorage.setItem(CHAT_MODE_STORAGE_KEY, m);
					} catch {
						/* ignore */
					}
					return;
				}
				if (type === "agent") {
					const n = data.name === null || typeof data.name === "string" ? data.name : null;
					setChatAgentNameState(n);
					try {
						if (n) localStorage.setItem(CHAT_AGENT_STORAGE_KEY, n);
						else localStorage.removeItem(CHAT_AGENT_STORAGE_KEY);
					} catch {
						/* ignore */
					}
					return;
				}
				if (type === "model_set") {
					const eff = String(data.effectiveModel ?? "").trim();
					if (eff) setEffectiveModel(eff);
					return;
				}
				if (type === "log") {
					setLogs((L) => [
						...L,
						{
							time: String(data.time ?? ""),
							level: String(data.level ?? "INFO"),
							source: String(data.source ?? ""),
							msg: String(data.msg ?? ""),
						},
					]);
					return;
				}
				if (type === "user_message") {
					const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
					const tabId = activeChatTabIdRef.current;
					const userText = String(data.content ?? "");
					applyFirstUserTabTitle(tabId, userText);
					setRowsByTab((prev) => {
						const R = prev[tabId] ?? [];
						return {
							...prev,
							[tabId]: [
								...R,
								{
									id: `u-${Date.now()}`,
									role: "user",
									content: userText,
									timestamp: ts,
								},
							],
						};
					});
					setStreaming(true);
					return;
				}
				if (type === "user_queued") {
					const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
					const tabId = activeChatTabIdRef.current;
					const queuedText = String(data.content ?? "");
					applyFirstUserTabTitle(tabId, queuedText);
					setRowsByTab((prev) => {
						const R = prev[tabId] ?? [];
						return {
							...prev,
							[tabId]: [
								...R,
								{
									id: `uq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
									role: "user",
									content: queuedText,
									timestamp: ts,
								},
							],
						};
					});
					return;
				}
				if (type === "assistant_turn_start") {
					assistantIdRef.current = `a-${Date.now()}`;
					bufferThisTurnRef.current = shouldBufferDeltas();
					bufferedAssistantRef.current = "";
					setStreaming(true);
					return;
				}
				if (type === "queue_state") {
					const n = data.pending;
					setChatQueuePending(typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
					return;
				}
				if (type === "assistant_delta") {
					const piece = String(data.content ?? "");
					const aid = assistantIdRef.current;
					if (!aid) return;
					if (bufferThisTurnRef.current) {
						bufferedAssistantRef.current += piece;
						return;
					}
					const tabId = activeChatTabIdRef.current;
					setRowsByTab((prev) => {
						const R = prev[tabId] ?? [];
						const i = R.findIndex((r) => r.id === aid);
						if (i === -1) {
							const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
							return {
								...prev,
								[tabId]: [...R, { id: aid, role: "assistant" as const, content: piece, timestamp: ts }],
							};
						}
						const next = [...R];
						next[i] = { ...next[i], content: next[i].content + piece };
						return { ...prev, [tabId]: next };
					});
					return;
				}
				if (type === "session_reset") {
					const tabId = activeChatTabIdRef.current;
					setRowsByTab((prev) => ({ ...prev, [tabId]: [] }));
					setStreaming(false);
					setChatQueuePending(0);
					assistantIdRef.current = null;
					bufferThisTurnRef.current = false;
					bufferedAssistantRef.current = "";
					return;
				}
				if (type === "done") {
					if (bufferThisTurnRef.current) {
						const buf = bufferedAssistantRef.current;
						const aid = assistantIdRef.current;
						bufferedAssistantRef.current = "";
						bufferThisTurnRef.current = false;
						if (buf && aid) {
							const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
							const tabId = activeChatTabIdRef.current;
							setRowsByTab((prev) => {
								const R = prev[tabId] ?? [];
								const i = R.findIndex((r) => r.id === aid);
								if (i === -1) {
									return {
										...prev,
										[tabId]: [...R, { id: aid, role: "assistant" as const, content: buf, timestamp: ts }],
									};
								}
								const next = [...R];
								next[i] = { ...next[i], content: next[i].content + buf };
								return { ...prev, [tabId]: next };
							});
						}
					} else {
						bufferThisTurnRef.current = false;
						bufferedAssistantRef.current = "";
					}
					setStreaming(false);
					assistantIdRef.current = null;
					onTreeRefresh?.();
					return;
				}
				if (type === "error") {
					bufferThisTurnRef.current = false;
					bufferedAssistantRef.current = "";
					setStreaming(false);
					setError(String(data.message ?? "Unknown error"));
					setLogs((L) => [
						...L,
						{
							time: new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "",
							level: "ERROR",
							source: "chat",
							msg: String(data.message ?? ""),
						},
					]);
				}
				} catch {
					/* ignore */
				}
			};
		}

		openSocket();

		return () => {
			disposed = true;
			clearReconnect();
			const cur = wsRef.current;
			wsRef.current = null;
			try {
				cur?.close();
			} catch {
				/* ignore */
			}
		};
		// bufferAssistantDeltasRef is read via .current inside handlers; omit from deps to avoid reconnecting the socket.
	}, [onTreeRefresh]);

	const sendChat = useCallback((text: string) => {
		const t = text.trim();
		if (!t || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
		setError(null);
		wsRef.current.send(JSON.stringify({ type: "chat", content: t }));
	}, []);

	const setChatMode = useCallback((mode: ChatSessionMode) => {
		setChatModeState(mode);
		try {
			localStorage.setItem(CHAT_MODE_STORAGE_KEY, mode);
		} catch {
			/* ignore */
		}
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "set_chat_mode", mode }));
		}
	}, []);

	const setChatAgent = useCallback((name: string | null) => {
		const next = name?.trim() || null;
		setChatAgentNameState(next);
		try {
			if (next) localStorage.setItem(CHAT_AGENT_STORAGE_KEY, next);
			else localStorage.removeItem(CHAT_AGENT_STORAGE_KEY);
		} catch {
			/* ignore */
		}
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "set_agent", agent: next }));
		}
	}, []);

	const setLlmModel = useCallback((modelId: string) => {
		const id = modelId.trim();
		if (!id) return;
		try {
			localStorage.setItem(ACTIVE_LLM_STORAGE_KEY, id);
		} catch {
			/* ignore */
		}
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "set_model", model: id }));
		}
	}, []);

	const stop = useCallback(() => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "stop_chat" }));
		}
	}, []);

	const startNewSession = useCallback(() => {
		const newId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		setChatTabs((tabs) => [...tabs, { id: newId, label: "New chat" }]);
		setActiveChatTabId(newId);
		activeChatTabIdRef.current = newId;
		setRowsByTab((prev) => ({ ...prev, [newId]: [] }));
		setError(null);
		setStreaming(false);
		assistantIdRef.current = null;
		bufferThisTurnRef.current = false;
		bufferedAssistantRef.current = "";
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "new_session" }));
		}
	}, []);

	const selectChatTab = useCallback((id: string) => {
		if (id === activeChatTabIdRef.current) return;
		activeChatTabIdRef.current = id;
		setActiveChatTabId(id);
		const tabRows = rowsByTabRef.current[id] ?? [];
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "activate_session",
					transcript: tabRows.map((r) => ({ role: r.role, content: r.content })),
				}),
			);
		}
	}, []);

	const closeChatTab = useCallback(
		(id: string) => {
			if (streaming && activeChatTabIdRef.current === id) return;
			const tabs = chatTabsRef.current;
			if (tabs.length <= 1) return;
			const idx = tabs.findIndex((t) => t.id === id);
			if (idx < 0) return;

			const wasActive = activeChatTabIdRef.current === id;
			const nextTabs = tabs.filter((t) => t.id !== id);
			const nextActiveId = wasActive
				? (tabs[idx + 1]?.id ?? tabs[idx - 1]?.id ?? nextTabs[0]?.id)
				: activeChatTabIdRef.current;
			if (wasActive && !nextActiveId) return;

			chatTabsRef.current = nextTabs;
			setChatTabs(nextTabs);
			setRowsByTab((prev) => {
				const n = { ...prev };
				delete n[id];
				return n;
			});

			if (wasActive && nextActiveId) {
				activeChatTabIdRef.current = nextActiveId;
				setActiveChatTabId(nextActiveId);
				const tabRows = rowsByTabRef.current[nextActiveId] ?? [];
				const ws = wsRef.current;
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(
						JSON.stringify({
							type: "activate_session",
							transcript: tabRows.map((r) => ({ role: r.role, content: r.content })),
						}),
					);
				}
			}
		},
		[streaming],
	);

	return {
		connected,
		rows,
		chatTabs,
		activeChatTabId,
		selectChatTab,
		closeChatTab,
		logs,
		streaming,
		chatQueuePending,
		error,
		effectiveModel,
		chatMode,
		setChatMode,
		chatAgentName,
		setChatAgent,
		sendChat,
		setLlmModel,
		stop,
		startNewSession,
		clearError: () => setError(null),
	};
}
