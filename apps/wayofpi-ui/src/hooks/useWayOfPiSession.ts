/**
 * useWayOfPiSession Hook
 *
 * @description Manages session state including chat tabs, streaming status, and LLM connections
 * @returns Object with session state and action functions
 */

import { useState, useEffect, useCallback } from "react";
import type { ChatQueueItem } from "../utils/chatQueueTranscript";

/** @description Chat session error state */
export enum ChatSessionError {
	NotConnected = "not-connected",
	Disconnected = "disconnected",
	Reconnecting = "reconnecting",
	NoAgents = "no-agents",
	StreamingError = "streaming-error",
}

export type UiMode = "simple" | "technical" | "claw" | "docs" | "work" | "admin" | "super_admin" | "profile" | "portal" | "client";

export interface ChatRow {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  text?: string;
  agentId?: string;
  agentName?: string;
  timestamp?: number;
  turnId?: string;
  fromUser?: string;
  segments?: { role: string; parts: string[] }[];
  reasoning?: string;
  assistantPersona?: string;
}

export interface LogRow {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  msg: string;
  timestamp: number;
  time: string;
  source: string;
}

export interface ChatSessionTab {
  id: string;
  label: string;
  agentId?: string;
  agentName?: string;
}
export type ChatPulseMeters = {
  contextFillPct?: number;
  peekPrompt?: number;
  peekCompletion?: number;
  cumPrompt?: number;
  cumCompletion?: number;
  agentId?: string;
  agentName?: string;
};

/** @description Chat session surface ID */
export type ChatSessionSurfaceId = string;

/** @description Chat session mode types */
export type ChatSessionMode = "default" | "simple" | "claw" | "build" | "plan" | "message";

/** @description Chat tab state */
export interface ChatTab {
	id: string;
	agent: string;
	label: string;
	content?: string;
	segments?: { role: string; parts: string[] }[];
	agentName?: string;
	role?: string;
	fromUser?: string;
}

/** @description Pulsing chat meter state */
export interface ChatPulseMeter {
	active: boolean;
	agentId?: string;
	agentName?: string;
}

/** @description Workspace row data */
export interface WorkspaceRow {
	id: string;
	path: string;
	name: string;
	type: string;
}

export interface UseWayOfPiSessionReturn {
	rows: ChatRow[];
	streaming: boolean;
	connected: boolean;
	error: ChatSessionError | null;
	agentName: string | null;
	agentId: string | null;
	agentIds: string[] | null;
	chatTabs: ChatTab[];
	activeChatTabId: string | null;
	model: string;
	dispatchTurnAgent: (turn: string) => Promise<void>;
	selectChatTab: (tabId?: string) => void;
	closeChatTab: (tabId?: string) => void;
	stop: () => void;
	sendChat: (
		agentId: string,
		message: string,
		turnId?: string,
	) => Promise<void>;
	chatPulseMeters: ChatPulseMeters;
	setChatPulseMeters: (meters: ChatPulseMeters) => void;
	setChatAgent: (name: string | null) => void;
	setAgentIds: (agentIds: string[]) => void;
	updateRows: (newRows: ChatRow[]) => void;
	updateChatTabs: (newTabs: ChatTab[]) => void;
	updateModel: (newModel: string) => void;
	clearChatTabs: () => void;
	clearRows: () => void;
	clearChatPulseMeters: () => void;
	reloadSession: () => Promise<void>;
	refreshWs: () => Promise<void>;
	chatMode: ChatSessionMode;
	setChatMode: (mode: ChatSessionMode) => void;
	tokenMeter: { tokensDown: string; tokensUp: string; tokensTitle?: string; contextPct?: number; contextTitle?: string };
	clearError: () => void;
	startNewSession: () => void;
	chatQueuePending: boolean;
	chatQueueItems: ChatQueueItem[];
	editChatQueueItem: (id: string, text: string) => void;
	deleteChatQueueItem: (id: string) => void;
	forceChatQueueItem: (id: string) => void;
	reconnectWebSocket: () => void;
	effectiveModel: string;
	logs: LogRow[];
	chatAgentName: string | null;
	setLlmModel: (model: string) => void;
	llmProviderFromSocket: (socketPath?: string) => string | null;
	renameChatTab: (tabId: string, name: string) => void;
}

export function useWayOfPiSession(): UseWayOfPiSessionReturn {
	const [ws, setWs] = useState<WebSocket | null>(null);

	const [agentName, setAgentNameState] = useState<string | null>(null);
	const [agentId, setAgentIdState] = useState<string | null>(null);
	const [agentIds, setAgentIdsState] = useState<string[] | null>(null);
	const [chatTabs, setChatTabs] = useState<ChatTab[]>([]);
	const [activeChatTabId, setActiveChatTabId] = useState<string | null>(null);
	const [model, setModel] = useState<string>("llama3.2");

	const [rows, setRows] = useState<WorkspaceRow[] | null>(null);
	const [error, setError] = useState<ChatSessionError | null>(null);
	const [streaming, setStreaming] = useState<boolean | null>(null);

	// @description Pulsing chat meters for agent activity visualization
	const [chatPulseMeters, setChatPulseMetersState] = useState<ChatPulseMeters>(
		{},
	);

	// @description Session initialization - always run on mount
	const initSession = useCallback(async () => {
		const wsUrl =
			import.meta.env.VITE_WAYOFPI_WS_URL || `/ws`;
		const newWs = new WebSocket(wsUrl);
		newWs.onopen = () => {
			console.log("WS Connected to:", wsUrl);
			setWs(newWs);
		};
		newWs.onclose = () => {
			console.log("WS Disconnected");
			// Don't auto-reconnect here - let the effect handle it
			setError(ChatSessionError.Disconnected);
		};
		newWs.onerror = (err) => {
			console.error("WS Error:", err);
			setError(ChatSessionError.Disconnected);
		};
		newWs.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === "turn") {
				// Store incoming turns if needed
			} else if (data.type === "pulse") {
				// Update active agent meter
			}
		};
		setWs(newWs);
	}, []);

	// @description Reconnect WebSocket on mount or error
	useEffect(() => {
		const reconnect = async () => {
			try {
				setError(null);
				await initSession();
			} catch (e) {
				console.error("Session init failed:", e);
			}
		};

		// Always try connect on mount
		if (!ws) {
			reconnect();
		}

		// Reconnect on error
		if (error) {
			reconnect();
		}
	}, [ws, error]);

	// @description Send chat message to server
	const sendChat: UseWayOfPiSessionReturn["sendChat"] = async (
		agentId,
		message,
		turnId,
	) => {
		setStreaming(true);
		setAgentIdState(agentId);
		setAgentNameState(agentName || null);

		const payload = { type: "send", to: agentId, text: message, id: turnId };

		return new Promise((resolve, reject) => {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(payload));
				const timer = setTimeout(() => {
					setStreaming(false);
					resolve(undefined);
				}, 120000);

				ws.onclose = () => {
					clearTimeout(timer);
					setStreaming(false);
					reject(new Error("WebSocket closed"));
				};
				ws.onerror = () => {
					clearTimeout(timer);
					setStreaming(false);
					reject(new Error("WebSocket error"));
				};
			} else {
				setStreaming(false);
				reject(new Error("WebSocket not connected"));
			}
		});
	};

	// @description Disconnect active agent
	const stop = () => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.close();
			setWs(null);
		}
	};

	// @description Dispatch turn to active agent
	const dispatchTurnAgent: UseWayOfPiSessionReturn["dispatchTurnAgent"] =
		async (turn: string) => {
			const payload = { type: "dispatch" };
			return new Promise((resolve) => {
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify(payload));
					setTimeout(resolve, 100);
				}
				resolve(undefined);
			});
		};

	// @description Select chat tab by ID
	const selectChatTab: UseWayOfPiSessionReturn["selectChatTab"] = (tabId) => {
		if (tabId) {
			setActiveChatTabId(tabId);
		} else {
			// Select first tab if not specified
			setActiveChatTabId(chatTabs[0]?.id || null);
		}
	};

	// @description Clear active chat tab
	const closeChatTab: UseWayOfPiSessionReturn["closeChatTab"] = (tabId) => {
		const newTabs = chatTabs.filter((t) => t.id !== tabId);
		setChatTabs(newTabs);

		if (activeChatTabId) {
			// If we closed the active tab, select the new active one
			const newActiveId = newTabs[newTabs.length - 1]?.id;
			setActiveChatTabId(newActiveId || null);
		}
	};

	// @description Dispatch turn message
	dispatchTurnAgent("");

	return {
		rows: (rows ?? []) as unknown as ChatRow[],
		streaming: streaming ?? false,
		connected: !error,
		error,
		agentName,
		agentId,
		agentIds,
		chatTabs,
		activeChatTabId,
		model,
		dispatchTurnAgent,
		selectChatTab,
		closeChatTab,
		stop,
		sendChat,
		chatPulseMeters,
		setChatPulseMeters: setChatPulseMetersState,
		setChatAgent: (name: string | null) => setAgentNameState(name),
		setAgentIds: setAgentIdsState,
		updateRows: setRows as any,
		updateChatTabs: setChatTabs,
		updateModel: setModel,
		clearChatTabs: () => {
			setChatTabs([]);
			setActiveChatTabId(null);
			stop();
		},
		clearRows: () => setRows(null),
		clearChatPulseMeters: () => setChatPulseMetersState({}),
		reloadSession: async () => {
			// Would reload session state if needed
		},
		refreshWs: async () => {
			// Would refresh WebSocket if needed
		},
		chatMode: "default" as ChatSessionMode,
		setChatMode: (_mode: ChatSessionMode) => {},
		tokenMeter: { tokensDown: "0", tokensUp: "0", tokensTitle: "", contextPct: 0, contextTitle: "" },
		clearError: () => setError(null),
		startNewSession: () => {},
		chatQueuePending: false,
		chatQueueItems: [],
		editChatQueueItem: (_id: string, _text: string) => {},
		deleteChatQueueItem: (_id: string) => {},
		forceChatQueueItem: (_id: string) => {},
		reconnectWebSocket: () => {},
		effectiveModel: model,
		logs: [],
		chatAgentName: agentName,
		setLlmModel: (_model: string) => {},
		llmProviderFromSocket: (_socketPath?: string) => null,
		renameChatTab: (_tabId: string, _name: string) => {},
	};
}
