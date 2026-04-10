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

function wsUrl(): string {
	const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${proto}//${window.location.host}/ws`;
}

export function useWayOfPiSession(
	onTreeRefresh?: () => void,
	/** When ref is true, assistant deltas are buffered and applied once on `done` (Simple UI “streaming off”). */
	bufferAssistantDeltasRef?: MutableRefObject<boolean>,
) {
	const [connected, setConnected] = useState(false);
	const [rows, setRows] = useState<ChatRow[]>([]);
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

	const shouldBufferDeltas = () => bufferAssistantDeltasRef?.current === true;

	useEffect(() => {
		const ws = new WebSocket(wsUrl());
		wsRef.current = ws;
		ws.onopen = () => {
			setConnected(true);
			setError(null);
			setChatQueuePending(0);
		};
		ws.onclose = () => {
			setConnected(false);
		};
		ws.onerror = () => {
			setError("WebSocket error");
		};
		ws.onmessage = (ev) => {
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
					setRows((R) => [
						...R,
						{ id: `u-${Date.now()}`, role: "user", content: String(data.content ?? ""), timestamp: ts },
					]);
					setStreaming(true);
					return;
				}
				if (type === "user_queued") {
					const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
					setRows((R) => [
						...R,
						{
							id: `uq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
							role: "user",
							content: String(data.content ?? ""),
							timestamp: ts,
						},
					]);
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
					setRows((R) => {
						const i = R.findIndex((r) => r.id === aid);
						if (i === -1) {
							const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
							return [...R, { id: aid, role: "assistant" as const, content: piece, timestamp: ts }];
						}
						const next = [...R];
						next[i] = { ...next[i], content: next[i].content + piece };
						return next;
					});
					return;
				}
				if (type === "session_reset") {
					setRows([]);
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
							setRows((R) => {
								const i = R.findIndex((r) => r.id === aid);
								if (i === -1) {
									return [...R, { id: aid, role: "assistant" as const, content: buf, timestamp: ts }];
								}
								const next = [...R];
								next[i] = { ...next[i], content: next[i].content + buf };
								return next;
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
		return () => {
			ws.close();
			wsRef.current = null;
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
		setError(null);
		setStreaming(false);
		assistantIdRef.current = null;
		bufferThisTurnRef.current = false;
		bufferedAssistantRef.current = "";
		setRows([]);
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "new_session" }));
		}
	}, []);

	return {
		connected,
		rows,
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
