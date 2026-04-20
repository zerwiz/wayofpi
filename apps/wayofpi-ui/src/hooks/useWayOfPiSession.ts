import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  reconcileQueuedTranscript,
  type ChatQueueItem,
} from "../utils/chatQueueTranscript";
import { contextMeterBlocks, fmtTok } from "../utils/tokenMeterFormat";

/** Numeric slice of `chat_usage` for agent pulse cards (context bar + token counts). */
export type ChatPulseMeters = {
  cumPrompt: number;
  cumCompletion: number;
  /** 0–100 when server sends usage or derives from lastPrompt/contextWindow. */
  contextFillPct: number | null;
  /** In-flight turn from SSE / Pi JSON (`streamPeek`); cleared on final `chat_usage`. */
  peekPrompt?: number;
  peekCompletion?: number;
};

type ChatUsageCore = {
  cumP: number;
  cumC: number;
  pct: number | null;
  lastP: number | null;
  win: number | null;
  approx: boolean;
};

function computeChatUsageCore(data: Record<string, unknown>): ChatUsageCore {
  const cumP =
    typeof data.cumPrompt === "number" && Number.isFinite(data.cumPrompt)
      ? data.cumPrompt
      : 0;
  const cumC =
    typeof data.cumCompletion === "number" &&
    Number.isFinite(data.cumCompletion)
      ? data.cumCompletion
      : 0;
  const pctRaw =
    typeof data.contextPercent === "number" &&
    Number.isFinite(data.contextPercent)
      ? data.contextPercent
      : null;
  const win =
    typeof data.contextWindow === "number" &&
    Number.isFinite(data.contextWindow) &&
    data.contextWindow > 0
      ? data.contextWindow
      : null;
  const lastP =
    typeof data.lastPrompt === "number" && Number.isFinite(data.lastPrompt)
      ? Math.max(0, data.lastPrompt)
      : null;
  const approx = data.approximate === true;
  let pct = pctRaw;
  if (pct == null && lastP != null && win != null) {
    pct = Math.min(100, (lastP / win) * 100);
  }
  return { cumP, cumC, pct, lastP, win, approx };
}

const ACTIVE_LLM_STORAGE_KEY = "wayofpi.activeLlmModel";

/** Stale UI picks / bad docs — never valid on typical `ollama list` for this playground. */
const LEGACY_DISCARD_OLLAMA_MODEL_IDS = new Set(["qwen3.5:latest"]);

/** Persisted chat model id (Ollama tag or OpenRouter id); applied on connect via `set_model`. */
function readStoredLlmModelId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem(ACTIVE_LLM_STORAGE_KEY)?.trim();
    return v || null;
  } catch {
    return null;
  }
}

function scrubLegacyStoredOllamaModel(): void {
  try {
    const v = localStorage
      .getItem(ACTIVE_LLM_STORAGE_KEY)
      ?.trim()
      .toLowerCase();
    if (v && LEGACY_DISCARD_OLLAMA_MODEL_IDS.has(v)) {
      localStorage.removeItem(ACTIVE_LLM_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
const CHAT_MODE_STORAGE_KEY = "wayofpi.chatMode";
const CHAT_AGENT_STORAGE_KEY = "wayofpi.chatAgent";

/** UI shell surface: each gets its own chat tabs, transcript, JSONL session key prefix, and persisted mode/agent. */
export type ChatSessionSurfaceId = "simple" | "technical" | "claw";

export type ChatSessionMode = "build" | "plan";

function chatModeScopedKey(surface: ChatSessionSurfaceId): string {
  return `wayofpi.chatMode.${surface}`;
}

function chatAgentScopedKey(surface: ChatSessionSurfaceId): string {
  return `wayofpi.chatAgent.${surface}`;
}

/** Match server **`sanitizeSessionKey`** (`server/wop-session-jsonl.ts`) for `session_transcript` correlation. */
function clientSanitizeSessionKey(raw: string): string {
  const t = raw
    .trim()
    .slice(0, 200)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return t.length > 0 ? t : "session";
}

export function wireSessionKeyForSurface(
  surface: ChatSessionSurfaceId,
  tabId: string,
): string {
  return `${surface}.${tabId}`;
}

function readStoredChatModeForSurface(
  surface: ChatSessionSurfaceId,
): ChatSessionMode {
  try {
    if (typeof window === "undefined") return "build";
    const scoped = window.localStorage.getItem(chatModeScopedKey(surface));
    if (scoped === "plan" || scoped === "build") return scoped;
    if (surface === "technical") {
      const legacy = window.localStorage.getItem(CHAT_MODE_STORAGE_KEY);
      if (legacy === "plan" || legacy === "build") return legacy;
    }
  } catch {
    /* ignore */
  }
  return "build";
}

function writeStoredChatModeForSurface(
  surface: ChatSessionSurfaceId,
  mode: ChatSessionMode,
): void {
  try {
    window.localStorage.setItem(chatModeScopedKey(surface), mode);
    if (surface === "technical")
      window.localStorage.setItem(CHAT_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function readStoredChatAgentForSurface(
  surface: ChatSessionSurfaceId,
): string | null {
  try {
    if (typeof window === "undefined") return null;
    const scoped = window.localStorage
      .getItem(chatAgentScopedKey(surface))
      ?.trim();
    if (scoped) {
      if (surface !== "claw" && scoped.toLowerCase() === "claw") return null;
      return scoped;
    }
    if (surface === "technical") {
      const legacy = window.localStorage
        .getItem(CHAT_AGENT_STORAGE_KEY)
        ?.trim();
      if (!legacy || legacy.toLowerCase() === "claw") return null;
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredChatAgentForSurface(
  surface: ChatSessionSurfaceId,
  name: string | null,
): void {
  try {
    const store =
      name && !(surface !== "claw" && name.trim().toLowerCase() === "claw")
        ? name.trim()
        : null;
    if (store) {
      window.localStorage.setItem(chatAgentScopedKey(surface), store);
      if (surface === "technical")
        window.localStorage.setItem(CHAT_AGENT_STORAGE_KEY, store);
    } else {
      window.localStorage.removeItem(chatAgentScopedKey(surface));
      if (surface === "technical")
        window.localStorage.removeItem(CHAT_AGENT_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

const TOKEN_METER_EMPTY = {
  contextPct: "—",
  tokensDown: "—",
  tokensUp: "—",
  contextTitle:
    "Context fill — after a turn completes, the bar uses stream usage when present, else a Pi-style ~characters÷4 estimate",
  tokensTitle:
    "Token totals — cumulative per turn (stream usage when present, else ~characters÷4 for that turn)",
} as const;

function formatChatUsagePayload(data: Record<string, unknown>): {
  contextPct: string;
  tokensDown: string;
  tokensUp: string;
  contextTitle: string;
  tokensTitle: string;
} {
  const c = computeChatUsageCore(data);
  const { cumP, cumC, pct, lastP, win, approx } = c;

  let contextPct = "—";
  if (pct != null) {
    const bar = contextMeterBlocks(pct);
    contextPct = `[${bar}] ${Math.round(pct)}%`;
  }

  const tokensDown = cumP > 0 ? fmtTok(cumP) : "—";
  const tokensUp = cumC > 0 ? fmtTok(cumC) : "—";
  const approxNote = approx
    ? " (~estimated: characters÷4, no usage in stream)"
    : "";
  const contextTitle =
    lastP != null && win != null
      ? `Context (last request): ${fmtTok(lastP)} / ${fmtTok(win)} tokens — Pi-style meter${approxNote}`
      : approx
        ? "Context fill — ~estimated (characters÷4); stream did not include usage"
        : "Context fill — after a turn completes, the bar uses stream usage when present, else a Pi-style estimate";
  const tokensTitle =
    cumP + cumC > 0
      ? `Session cumulative (Pi footer-style): ↓ ${fmtTok(cumP)} prompt-side, ↑ ${fmtTok(cumC)} completion${approxNote}`
      : approx
        ? "Token totals — cumulative uses ~estimate when the provider omits usage"
        : "Token totals — cumulative per turn (stream usage when present, else ~characters÷4)";
  return { contextPct, tokensDown, tokensUp, contextTitle, tokensTitle };
}

type TokenMeterState = {
  contextPct: string;
  tokensDown: string;
  tokensUp: string;
  contextTitle: string;
  tokensTitle: string;
};

export interface ChatRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  /** Model reasoning / “thinking” stream when the provider sends it (e.g. OpenRouter). */
  reasoning?: string;
  /** Server queue slot while message waits behind an in-flight assistant turn. */
  queueId?: string;
  /**
   * Workspace agent from the **session picker** only (`set_agent` / persisted pick).
   * Phrase-dispatch merges a specialist for one turn but Session Chat still shows **Orchestrator** — we do not tag those
   * rows with the dispatch name so Team pulse does not relabel orchestrator replies as specialists.
   * Absent / null = orchestrator for transcript purposes.
   */
  assistantPersona?: string | null;
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
  /** When true, the first user message must not overwrite `label` with an auto title. */
  labelUserSet?: boolean;
}

const TAB_TITLE_MAX_CHARS = 44;

/** First-line style title from the user's opening message (for session tab labels). */
function tabTitleFromUserMessage(raw: string): string | null {
  const single = raw.replace(/\s+/g, " ").trim();
  if (!single) return null;
  if (single.length <= TAB_TITLE_MAX_CHARS) return single;
  return `${single.slice(0, TAB_TITLE_MAX_CHARS - 1)}…`;
}

/** Manual rename: same trimming/length rules; empty input becomes **New Chat**. */
function manualTabLabel(raw: string): string {
  const single = raw.replace(/\s+/g, " ").trim();
  if (!single) return "New Chat";
  if (single.length <= TAB_TITLE_MAX_CHARS) return single;
  return `${single.slice(0, TAB_TITLE_MAX_CHARS - 1)}…`;
}

type SurfaceSlice = {
  chatTabs: ChatSessionTab[];
  activeChatTabId: string;
  rowsByTab: Record<string, ChatRow[]>;
  chatMode: ChatSessionMode;
  chatAgentName: string | null;
};

function createInitialSurface(
  surface: ChatSessionSurfaceId,
  salt: string,
): SurfaceSlice {
  const tid = `t-${Date.now()}-${salt}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    chatTabs: [{ id: tid, label: "New Chat" }],
    activeChatTabId: tid,
    rowsByTab: { [tid]: [] },
    chatMode:
      typeof window !== "undefined"
        ? readStoredChatModeForSurface(surface)
        : "build",
    chatAgentName:
      typeof window !== "undefined"
        ? readStoredChatAgentForSurface(surface)
        : null,
  };
}

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

function chatWsErrorHint(): string {
  const base =
    "Chat WebSocket unreachable — start the Bun server on port 3333 (from apps/wayofpi-ui: npm run dev, or: bun run server/index.ts). Vite-only (npm run dev:ui) does not include the server.";
  if (typeof window === "undefined") return base;
  const h = window.location.hostname;
  if (h !== "localhost" && h !== "127.0.0.1") {
    return `${base} On a phone or LAN URL, Bun must still be running on the dev PC (Vite on ${window.location.host} proxies /ws to 127.0.0.1:3333 there).`;
  }
  return base;
}

/**
 * Single WebSocket, **three** in-memory chat surfaces (`simple`, `technical`, `claw`): separate tab stacks,
 * row maps, persisted mode/agent keys, and `activate_session` keys so server JSONL never collides across shells.
 * Pass the current shell as `surfaceId` (in `App.tsx`, the active `uiMode`).
 */
export function useWayOfPiSession(
  /** Active UI shell — must match `App` `uiMode` so Simple / Technical / Claw never share one transcript. */
  surfaceId: ChatSessionSurfaceId,
  onTreeRefresh?: () => void,
  /** When ref is true, assistant deltas are buffered and applied once on `done` (Simple UI “streaming off”). */
  bufferAssistantDeltasRef?: MutableRefObject<boolean>,
  /** Refreshes agent/team catalog when the server rewrites `teams.yaml` (orchestrator `team_*` tools). */
  onAgentsCatalogInvalidate?: () => void,
  /** Open/focus a workspace-relative path after orchestrator **`write`** (new file or overwrite). */
  onFocusWorkspaceFile?: (path: string) => void,
) {
  const surfaceIdRef = useRef(surfaceId);
  surfaceIdRef.current = surfaceId;

  const [surfaces, setSurfaces] = useState<
    Record<ChatSessionSurfaceId, SurfaceSlice>
  >(() => ({
    simple: createInitialSurface("simple", "s"),
    technical: createInitialSurface("technical", "t"),
    claw: createInitialSurface("claw", "c"),
  }));
  const surfacesRef = useRef(surfaces);
  surfacesRef.current = surfaces;

  const slice = surfaces[surfaceId];
  const { chatTabs, activeChatTabId, rowsByTab, chatMode, chatAgentName } =
    slice;
  const rows = rowsByTab[activeChatTabId] ?? [];

  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [streaming, setStreaming] = useState(false);
  /** Server-side count of user messages waiting after the in-flight assistant turn. */
  const [chatQueuePending, setChatQueuePending] = useState(0);
  /** Pending texts + ids (from `queue_state.items`) for queue manager UI. */
  const [chatQueueItems, setChatQueueItems] = useState<ChatQueueItem[]>([]);
  const prevQueueSnapshotRef = useRef<ChatQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Server-reported model id in use for this WebSocket (Ollama tag or OpenRouter id). */
  const [effectiveModel, setEffectiveModel] = useState<string | null>(() =>
    readStoredLlmModelId(),
  );
  /** From **`ready`** / **`model_set`** — same source as the Bun chat session (not only `/api/config`). */
  const [llmProviderFromSocket, setLlmProviderFromSocket] = useState<
    string | null
  >(null);
  /** Phrase-dispatch specialist for this assistant turn only (picker / `agent` unchanged). */
  const [dispatchTurnAgent, setDispatchTurnAgent] = useState<string | null>(
    null,
  );
  const [tokenMeter, setTokenMeter] = useState<TokenMeterState>(() => ({
    ...TOKEN_METER_EMPTY,
  }));
  const onAgentsCatalogInvalidateRef = useRef(onAgentsCatalogInvalidate);
  onAgentsCatalogInvalidateRef.current = onAgentsCatalogInvalidate;
  const onFocusWorkspaceFileRef = useRef(onFocusWorkspaceFile);
  onFocusWorkspaceFileRef.current = onFocusWorkspaceFile;
  const [chatPulseMeters, setChatPulseMeters] =
    useState<ChatPulseMeters | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatAgentNameRef = useRef<string | null>(chatAgentName);
  const dispatchTurnAgentRef = useRef<string | null>(null);
  /** Snapshot at `assistant_turn_start` — phrase-dispatch wins over session picker (matches server merge). */
  const assistantTurnPersonaRef = useRef<string | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const bufferThisTurnRef = useRef(false);
  const bufferedAssistantRef = useRef("");
  const bufferedReasoningRef = useRef("");
  const activeChatTabIdRef = useRef(activeChatTabId);
  const rowsByTabRef = useRef(rowsByTab);
  const chatTabsRef = useRef(chatTabs);

  useEffect(() => {
    activeChatTabIdRef.current = slice.activeChatTabId;
    rowsByTabRef.current = slice.rowsByTab;
    chatTabsRef.current = slice.chatTabs;
    chatAgentNameRef.current = slice.chatAgentName;
  }, [
    slice.activeChatTabId,
    slice.rowsByTab,
    slice.chatTabs,
    slice.chatAgentName,
  ]);
  useEffect(() => {
    dispatchTurnAgentRef.current = dispatchTurnAgent;
  }, [dispatchTurnAgent]);

  /** Empty tabs show **New Chat**; normalize legacy **Session Chat** / **New chat** when there are no user rows yet. */
  useEffect(() => {
    setSurfaces((prev) => {
      let any = false;
      const next: Record<ChatSessionSurfaceId, SurfaceSlice> = { ...prev };
      for (const sid of ["simple", "technical", "claw"] as const) {
        const s = next[sid];
        const mapped = s.chatTabs.map((t) => {
          const r = s.rowsByTab[t.id] ?? [];
          const hasUser = r.some((row) => row.role === "user");
          if (hasUser) return t;
          if (t.label === "Session Chat" || t.label === "New chat")
            return { ...t, label: "New Chat" };
          return t;
        });
        if (mapped.some((t, i) => t !== s.chatTabs[i])) {
          next[sid] = { ...s, chatTabs: mapped };
          any = true;
        }
      }
      if (!any) return prev;
      surfacesRef.current = next;
      return next;
    });
  }, [surfaces]);

  const shouldBufferDeltas = () => bufferAssistantDeltasRef?.current === true;

  const patchActiveSurface = useCallback(
    (fn: (s: SurfaceSlice) => SurfaceSlice) => {
      setSurfaces((prev) => {
        const sid = surfaceIdRef.current;
        const next = { ...prev, [sid]: fn(prev[sid]) };
        surfacesRef.current = next;
        return next;
      });
    },
    [],
  );

  const setRowsByTab = useCallback(
    (updater: SetStateAction<Record<string, ChatRow[]>>) => {
      patchActiveSurface((cur) => ({
        ...cur,
        rowsByTab:
          typeof updater === "function"
            ? (
                updater as (
                  p: Record<string, ChatRow[]>,
                ) => Record<string, ChatRow[]>
              )(cur.rowsByTab)
            : updater,
      }));
    },
    [patchActiveSurface],
  );

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
      const tabMeta = chatTabsRef.current.find((t) => t.id === tabId);
      if (tabMeta?.labelUserSet) return;
      const prior = rowsByTabRef.current[tabId] ?? [];
      if (prior.some((r) => r.role === "user")) return;
      const title = tabTitleFromUserMessage(userContent);
      if (!title) return;
      const sid = surfaceIdRef.current;
      setSurfaces((prev) => {
        const cur = prev[sid];
        const nextTabs = cur.chatTabs.map((t) =>
          t.id === tabId ? { ...t, label: title } : t,
        );
        if (nextTabs.every((t, i) => t === cur.chatTabs[i])) return prev;
        const out = { ...prev, [sid]: { ...cur, chatTabs: nextTabs } };
        surfacesRef.current = out;
        return out;
      });
    };

    function openSocket() {
      if (disposed) return;
      scrubLegacyStoredOllamaModel();
      clearReconnect();
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        attempt = 0;
        setConnected(true);
        setError(null);
        setChatQueuePending(0);
        setChatQueueItems([]);
        prevQueueSnapshotRef.current = [];
        setTokenMeter({ ...TOKEN_METER_EMPTY });
        setChatPulseMeters(null);
        dispatchTurnAgentRef.current = null;
        setDispatchTurnAgent(null);
        queueMicrotask(() => {
          const w = wsRef.current;
          if (!w || w.readyState !== WebSocket.OPEN) return;
          const sid = surfaceIdRef.current;
          const id = activeChatTabIdRef.current;
          const tabRows = rowsByTabRef.current[id] ?? [];
          w.send(
            JSON.stringify({
              type: "activate_session",
              sessionKey: wireSessionKeyForSurface(sid, id),
              transcript: tabRows.map((r) => ({
                role: r.role,
                content: r.content,
              })),
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
        setChatQueueItems([]);
        prevQueueSnapshotRef.current = [];
        setLlmProviderFromSocket(null);
        assistantIdRef.current = null;
        bufferThisTurnRef.current = false;
        bufferedAssistantRef.current = "";
        scheduleReconnect();
      };

      ws.onerror = () => {
        setError(chatWsErrorHint());
      };

      ws.onmessage = (ev) => {
        if (wsRef.current !== ws) return;
        try {
          const data = JSON.parse(String(ev.data)) as Record<string, unknown>;
          const type = data.type as string;
          if (type === "ready") {
            const eff = String(data.effectiveModel ?? "").trim();
            const pr =
              typeof data.provider === "string" && data.provider.trim()
                ? data.provider.trim().toLowerCase()
                : "";
            if (pr) setLlmProviderFromSocket(pr);
            const saved = readStoredLlmModelId()?.trim() ?? "";
            const displayId = saved && saved !== eff ? saved : eff || saved;
            if (displayId) setEffectiveModel(displayId);
            const srvMode =
              data.chatMode === "plan" || data.chatMode === "build"
                ? data.chatMode
                : "build";
            const sidReady = surfaceIdRef.current;
            const curSlice = surfacesRef.current[sidReady];
            const want = curSlice.chatMode;
            const wantAgent = curSlice.chatAgentName;
            chatAgentNameRef.current = wantAgent;
            if (want !== srvMode && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "set_chat_mode", mode: want }));
            }
            const srvAgent =
              data.agentName === null || typeof data.agentName === "string"
                ? data.agentName
                : null;
            if (wantAgent !== srvAgent && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "set_agent", agent: wantAgent }));
            }
            setLogs((L) => [
              ...L,
              {
                time:
                  new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "",
                level: "SUCCESS",
                source: "wop-server",
                msg: `Connected. Workspace: ${String(data.workspace ?? "")}`,
              },
            ]);
            try {
              if (saved && saved !== eff && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "set_model", model: saved }));
              }
            } catch {
              /* ignore */
            }
            return;
          }
          if (type === "chat_mode") {
            const m =
              data.mode === "plan" || data.mode === "build"
                ? data.mode
                : "build";
            const sidCm = surfaceIdRef.current;
            writeStoredChatModeForSurface(sidCm, m);
            setSurfaces((prev) => {
              const cur = prev[sidCm];
              if (cur.chatMode === m) return prev;
              const out = { ...prev, [sidCm]: { ...cur, chatMode: m } };
              surfacesRef.current = out;
              return out;
            });
            return;
          }
          if (type === "agent") {
            const n =
              data.name === null || typeof data.name === "string"
                ? data.name
                : null;
            chatAgentNameRef.current = n;
            const sidAg = surfaceIdRef.current;
            writeStoredChatAgentForSurface(sidAg, n);
            setSurfaces((prev) => {
              const cur = prev[sidAg];
              if (cur.chatAgentName === n) return prev;
              const out = { ...prev, [sidAg]: { ...cur, chatAgentName: n } };
              surfacesRef.current = out;
              return out;
            });
            return;
          }
          if (type === "model_set") {
            const eff = String(data.effectiveModel ?? "").trim();
            if (eff) setEffectiveModel(eff);
            const pr =
              typeof data.provider === "string" && data.provider.trim()
                ? data.provider.trim().toLowerCase()
                : "";
            if (pr) setLlmProviderFromSocket(pr);
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
            const ts = new Date().toLocaleTimeString("en-GB", {
              hour12: false,
            });
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
            const ts = new Date().toLocaleTimeString("en-GB", {
              hour12: false,
            });
            const tabId = activeChatTabIdRef.current;
            const queuedText = String(data.content ?? "");
            const queueId = String(data.queueId ?? "").trim() || undefined;
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
                    ...(queueId ? { queueId } : {}),
                  },
                ],
              };
            });
            return;
          }
          if (type === "queue_runtime_bind") {
            const qid = String(data.queueId ?? "").trim();
            if (!qid) return;
            const tabId = activeChatTabIdRef.current;
            setRowsByTab((prev) => {
              const R = prev[tabId] ?? [];
              const idx = R.findIndex(
                (r) => r.role === "user" && r.queueId === qid,
              );
              if (idx === -1) return prev;
              const copy = [...R];
              copy[idx] = { ...copy[idx], queueId: undefined };
              return { ...prev, [tabId]: copy };
            });
            return;
          }
          if (type === "agents_catalog_changed") {
            onAgentsCatalogInvalidateRef.current?.();
            return;
          }
          if (type === "focus_workspace_file") {
            const raw = String(data.path ?? "")
              .trim()
              .replace(/^[/\\]+/, "");
            if (raw) {
              onFocusWorkspaceFileRef.current?.(raw);
              try {
                void onTreeRefresh?.();
              } catch {
                /* ignore */
              }
            }
            return;
          }
          if (type === "dispatch_turn") {
            const a = data.agent;
            const next = typeof a === "string" && a.trim() ? a.trim() : null;
            dispatchTurnAgentRef.current = next;
            setDispatchTurnAgent(next);
            return;
          }
          if (type === "assistant_turn_start") {
            const picker = chatAgentNameRef.current?.trim() ?? "";
            assistantTurnPersonaRef.current = picker || null;
            assistantIdRef.current = `a-${Date.now()}`;
            bufferThisTurnRef.current = shouldBufferDeltas();
            bufferedAssistantRef.current = "";
            bufferedReasoningRef.current = "";
            setStreaming(true);
            setChatPulseMeters(null);
            return;
          }
          if (type === "queue_state") {
            const rawItems = data.items;
            const items: ChatQueueItem[] = [];
            if (Array.isArray(rawItems)) {
              for (const el of rawItems) {
                if (!el || typeof el !== "object") continue;
                const o = el as Record<string, unknown>;
                const id = String(o.id ?? "").trim();
                const text = String(o.text ?? o.content ?? "").trim();
                if (id) items.push({ id, text });
              }
            }
            const n =
              typeof data.pending === "number" && Number.isFinite(data.pending)
                ? Math.max(0, Math.floor(data.pending))
                : items.length;
            setChatQueuePending(n);
            setChatQueueItems(items);
            const tabId = activeChatTabIdRef.current;
            const prevSnap = prevQueueSnapshotRef.current;
            reconcileQueuedTranscript(prevSnap, items, tabId, setRowsByTab);
            prevQueueSnapshotRef.current = items;
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
                const ts = new Date().toLocaleTimeString("en-GB", {
                  hour12: false,
                });
                const persona = assistantTurnPersonaRef.current;
                return {
                  ...prev,
                  [tabId]: [
                    ...R,
                    {
                      id: aid,
                      role: "assistant" as const,
                      content: piece,
                      timestamp: ts,
                      ...(persona ? { assistantPersona: persona } : {}),
                    },
                  ],
                };
              }
              const next = [...R];
              next[i] = { ...next[i], content: next[i].content + piece };
              return { ...prev, [tabId]: next };
            });
            return;
          }
          if (type === "assistant_reasoning_delta") {
            const piece = String(data.content ?? "");
            if (!piece) return;
            const aid = assistantIdRef.current;
            if (!aid) return;
            if (bufferThisTurnRef.current) {
              bufferedReasoningRef.current += piece;
              return;
            }
            const tabId = activeChatTabIdRef.current;
            const ts = new Date().toLocaleTimeString("en-GB", {
              hour12: false,
            });
            setRowsByTab((prev) => {
              const R = prev[tabId] ?? [];
              const i = R.findIndex((r) => r.id === aid);
              if (i === -1) {
                const persona = assistantTurnPersonaRef.current;
                return {
                  ...prev,
                  [tabId]: [
                    ...R,
                    {
                      id: aid,
                      role: "assistant" as const,
                      content: "",
                      reasoning: piece,
                      timestamp: ts,
                      ...(persona ? { assistantPersona: persona } : {}),
                    },
                  ],
                };
              }
              const next = [...R];
              const cur = next[i]!;
              next[i] = {
                ...cur,
                reasoning: (cur.reasoning ?? "") + piece,
              };
              return { ...prev, [tabId]: next };
            });
            return;
          }
          if (type === "session_reset") {
            const tabId = activeChatTabIdRef.current;
            setRowsByTab((prev) => ({ ...prev, [tabId]: [] }));
            setStreaming(false);
            setChatQueuePending(0);
            setChatQueueItems([]);
            prevQueueSnapshotRef.current = [];
            assistantIdRef.current = null;
            assistantTurnPersonaRef.current = null;
            bufferThisTurnRef.current = false;
            bufferedAssistantRef.current = "";
            bufferedReasoningRef.current = "";
            setTokenMeter({ ...TOKEN_METER_EMPTY });
            setChatPulseMeters(null);
            dispatchTurnAgentRef.current = null;
            setDispatchTurnAgent(null);
            return;
          }
          if (type === "chat_usage") {
            setTokenMeter(formatChatUsagePayload(data));
            const u = computeChatUsageCore(data);
            const peek = data.streamPeek === true;
            const lp =
              typeof data.lastPrompt === "number" &&
              Number.isFinite(data.lastPrompt)
                ? Math.max(0, data.lastPrompt)
                : 0;
            const lc =
              typeof data.lastCompletion === "number" &&
              Number.isFinite(data.lastCompletion)
                ? Math.max(0, data.lastCompletion)
                : 0;
            if (peek) {
              setChatPulseMeters({
                cumPrompt: u.cumP,
                cumCompletion: u.cumC,
                contextFillPct: u.pct,
                peekPrompt: lp,
                peekCompletion: lc,
              });
            } else {
              setChatPulseMeters({
                cumPrompt: u.cumP,
                cumCompletion: u.cumC,
                contextFillPct: u.pct,
              });
            }
            return;
          }
          if (type === "session_transcript") {
            const sk = String(data.sessionKey ?? "");
            const turns = Array.isArray(data.turns) ? data.turns : [];
            const sidTr = surfaceIdRef.current;
            const tabIdTr = activeChatTabIdRef.current;
            const expectSk = clientSanitizeSessionKey(
              wireSessionKeyForSurface(sidTr, tabIdTr),
            );
            if (!sk || sk !== expectSk) return;
            const ts = new Date().toLocaleTimeString("en-GB", {
              hour12: false,
            });
            setRowsByTab((prev) => ({
              ...prev,
              [tabIdTr]: turns.map((row: unknown, i: number) => {
                const r = row as { role?: string; content?: string };
                const role = r.role === "assistant" ? "assistant" : "user";
                return {
                  id: `disk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
                  role,
                  content: String(r.content ?? ""),
                  timestamp: ts,
                };
              }),
            }));
            return;
          }
          if (type === "done") {
            if (bufferThisTurnRef.current) {
              const buf = bufferedAssistantRef.current;
              const rbuf = bufferedReasoningRef.current;
              const aid = assistantIdRef.current;
              bufferedAssistantRef.current = "";
              bufferedReasoningRef.current = "";
              bufferThisTurnRef.current = false;
              if ((buf || rbuf) && aid) {
                const ts = new Date().toLocaleTimeString("en-GB", {
                  hour12: false,
                });
                const tabId = activeChatTabIdRef.current;
                setRowsByTab((prev) => {
                  const R = prev[tabId] ?? [];
                  const i = R.findIndex((r) => r.id === aid);
                  if (i === -1) {
                    const persona = assistantTurnPersonaRef.current;
                    return {
                      ...prev,
                      [tabId]: [
                        ...R,
                        {
                          id: aid,
                          role: "assistant" as const,
                          content: buf,
                          ...(rbuf ? { reasoning: rbuf } : {}),
                          timestamp: ts,
                          ...(persona ? { assistantPersona: persona } : {}),
                        },
                      ],
                    };
                  }
                  const next = [...R];
                  const cur = next[i]!;
                  const persona = assistantTurnPersonaRef.current;
                  next[i] = {
                    ...cur,
                    content: cur.content + buf,
                    ...(rbuf
                      ? { reasoning: (cur.reasoning ?? "") + rbuf }
                      : {}),
                    ...(persona && cur.assistantPersona == null
                      ? { assistantPersona: persona }
                      : {}),
                  };
                  return { ...prev, [tabId]: next };
                });
              }
            } else {
              bufferThisTurnRef.current = false;
              bufferedAssistantRef.current = "";
              bufferedReasoningRef.current = "";
            }
            setStreaming(false);
            assistantIdRef.current = null;
            assistantTurnPersonaRef.current = null;
            dispatchTurnAgentRef.current = null;
            setDispatchTurnAgent(null);
            onTreeRefresh?.();
            return;
          }
          if (type === "error") {
            bufferThisTurnRef.current = false;
            bufferedAssistantRef.current = "";
            bufferedReasoningRef.current = "";
            setStreaming(false);
            dispatchTurnAgentRef.current = null;
            setDispatchTurnAgent(null);
            setError(String(data.message ?? "Unknown error"));
            setLogs((L) => [
              ...L,
              {
                time:
                  new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "",
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

    // bufferAssistantDeltasRef is read via .current inside handlers; omit from deps to avoid reconnecting the socket.
  }, [onTreeRefresh, setRowsByTab]);

  const prevSurfaceSwitchRef = useRef<ChatSessionSurfaceId | null>(null);
  useEffect(() => {
    const prev = prevSurfaceSwitchRef.current;
    if (prev === surfaceId) return;
    prevSurfaceSwitchRef.current = surfaceId;
    if (prev === null) return;

    const sid = surfaceId;
    const s = surfacesRef.current[sid];
    const tabId = s.activeChatTabId;
    const tabRows = s.rowsByTab[tabId] ?? [];
    activeChatTabIdRef.current = tabId;
    rowsByTabRef.current = s.rowsByTab;
    chatTabsRef.current = s.chatTabs;
    chatAgentNameRef.current = s.chatAgentName;
    prevQueueSnapshotRef.current = [];
    setChatQueueItems([]);
    setChatQueuePending(0);
    setTokenMeter({ ...TOKEN_METER_EMPTY });
    setChatPulseMeters(null);
    dispatchTurnAgentRef.current = null;
    setDispatchTurnAgent(null);
    setStreaming(false);
    assistantIdRef.current = null;
    bufferThisTurnRef.current = false;
    bufferedAssistantRef.current = "";
    bufferedReasoningRef.current = "";

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "activate_session",
          sessionKey: wireSessionKeyForSurface(sid, tabId),
          transcript: tabRows.map((r) => ({
            role: r.role,
            content: r.content,
          })),
        }),
      );
      ws.send(JSON.stringify({ type: "set_chat_mode", mode: s.chatMode }));
      ws.send(JSON.stringify({ type: "set_agent", agent: s.chatAgentName }));
    }
  }, [surfaceId]);

  const sendChat = useCallback((text: string) => {
    const t = text.trim();
    if (!t || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;
    setError(null);
    wsRef.current.send(JSON.stringify({ type: "chat", content: t }));
  }, []);

  const sendQueuePayload = useCallback((payload: Record<string, unknown>) => {
    const w = wsRef.current;
    if (!w || w.readyState !== WebSocket.OPEN) return;
    w.send(JSON.stringify(payload));
  }, []);

  const editChatQueueItem = useCallback(
    (id: string, text: string) => {
      const t = text.trim();
      if (!id || !t) return;
      sendQueuePayload({ type: "queue_edit", id, text: t });
    },
    [sendQueuePayload],
  );

  const deleteChatQueueItem = useCallback(
    (id: string) => {
      if (!id.trim()) return;
      sendQueuePayload({ type: "queue_delete", id: id.trim() });
    },
    [sendQueuePayload],
  );

  const forceChatQueueItem = useCallback(
    (id: string) => {
      if (!id.trim()) return;
      sendQueuePayload({ type: "queue_force", id: id.trim() });
    },
    [sendQueuePayload],
  );

  const setChatMode = useCallback(
    (mode: ChatSessionMode) => {
      const sid = surfaceIdRef.current;
      writeStoredChatModeForSurface(sid, mode);
      patchActiveSurface((cur) =>
        cur.chatMode === mode ? cur : { ...cur, chatMode: mode },
      );
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "set_chat_mode", mode }));
      }
    },
    [patchActiveSurface],
  );

  const setChatAgent = useCallback(
    (name: string | null) => {
      let next = name?.trim() || null;
      const sid = surfaceIdRef.current;
      if (sid !== "claw" && next?.toLowerCase() === "claw") next = null;
      chatAgentNameRef.current = next;
      writeStoredChatAgentForSurface(sid, next);
      patchActiveSurface((cur) =>
        cur.chatAgentName === next ? cur : { ...cur, chatAgentName: next },
      );
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "set_agent", agent: next }));
      }
    },
    [patchActiveSurface],
  );

  const setLlmModel = useCallback((modelId: string) => {
    const id = modelId.trim();
    if (!id) return;
    setEffectiveModel(id);
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

  /** Close the chat WebSocket so the client reconnect loop runs (e.g. after a manual server restart). */
  const reconnectWebSocket = useCallback(() => {
    const ws = wsRef.current;
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    ) {
      try {
        ws.close(4000, "client restart/reconnect");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const startNewSession = useCallback(() => {
    const newId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const sid = surfaceIdRef.current;
    patchActiveSurface((cur) => ({
      ...cur,
      chatTabs: [...cur.chatTabs, { id: newId, label: "New Chat" }],
      activeChatTabId: newId,
      rowsByTab: { ...cur.rowsByTab, [newId]: [] },
    }));
    const s = surfacesRef.current[sid];
    activeChatTabIdRef.current = s.activeChatTabId;
    rowsByTabRef.current = s.rowsByTab;
    chatTabsRef.current = s.chatTabs;
    prevQueueSnapshotRef.current = [];
    setChatQueueItems([]);
    setTokenMeter({ ...TOKEN_METER_EMPTY });
    setChatPulseMeters(null);
    dispatchTurnAgentRef.current = null;
    setDispatchTurnAgent(null);
    setError(null);
    setStreaming(false);
    assistantIdRef.current = null;
    bufferThisTurnRef.current = false;
    bufferedAssistantRef.current = "";
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "new_session" }));
      ws.send(
        JSON.stringify({
          type: "activate_session",
          sessionKey: wireSessionKeyForSurface(sid, newId),
          transcript: [],
        }),
      );
    }
  }, [patchActiveSurface]);

  const selectChatTab = useCallback(
    (id: string) => {
      if (id === activeChatTabIdRef.current) return;
      const sid = surfaceIdRef.current;
      patchActiveSurface((cur) => ({ ...cur, activeChatTabId: id }));
      const s = surfacesRef.current[sid];
      activeChatTabIdRef.current = s.activeChatTabId;
      rowsByTabRef.current = s.rowsByTab;
      chatTabsRef.current = s.chatTabs;
      prevQueueSnapshotRef.current = [];
      setChatQueueItems([]);
      setTokenMeter({ ...TOKEN_METER_EMPTY });
      setChatPulseMeters(null);
      dispatchTurnAgentRef.current = null;
      setDispatchTurnAgent(null);
      const tabRows = s.rowsByTab[id] ?? [];
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "activate_session",
            sessionKey: wireSessionKeyForSurface(sid, id),
            transcript: tabRows.map((r) => ({
              role: r.role,
              content: r.content,
            })),
          }),
        );
      }
    },
    [patchActiveSurface],
  );

  const renameChatTab = useCallback(
    (id: string, rawLabel: string) => {
      const label = manualTabLabel(rawLabel);
      const sid = surfaceIdRef.current;
      patchActiveSurface((cur) => ({
        ...cur,
        chatTabs: cur.chatTabs.map((t) =>
          t.id === id ? { ...t, label, labelUserSet: true } : t,
        ),
      }));
      chatTabsRef.current = surfacesRef.current[sid].chatTabs;
    },
    [patchActiveSurface],
  );

  const closeChatTab = useCallback(
    (id: string) => {
      if (streaming && activeChatTabIdRef.current === id) return;
      const sid = surfaceIdRef.current;
      const tabs = chatTabsRef.current;

      /** Last tab cannot be removed; replace with a fresh session (same server contract as **New session**). */
      if (tabs.length <= 1) {
        const only = tabs[0];
        if (!only || only.id !== id) return;
        const newId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const nextTabs = [{ id: newId, label: "New Chat" }];
        patchActiveSurface((cur) => ({
          chatTabs: nextTabs,
          activeChatTabId: newId,
          rowsByTab: { [newId]: [] },
          chatMode: cur.chatMode,
          chatAgentName: cur.chatAgentName,
        }));
        const s = surfacesRef.current[sid];
        chatTabsRef.current = s.chatTabs;
        activeChatTabIdRef.current = s.activeChatTabId;
        rowsByTabRef.current = s.rowsByTab;
        prevQueueSnapshotRef.current = [];
        setChatQueueItems([]);
        setTokenMeter({ ...TOKEN_METER_EMPTY });
        setChatPulseMeters(null);
        dispatchTurnAgentRef.current = null;
        setDispatchTurnAgent(null);
        setError(null);
        setStreaming(false);
        assistantIdRef.current = null;
        bufferThisTurnRef.current = false;
        bufferedAssistantRef.current = "";
        bufferedReasoningRef.current = "";
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "new_session" }));
          ws.send(
            JSON.stringify({
              type: "activate_session",
              sessionKey: wireSessionKeyForSurface(sid, newId),
              transcript: [],
            }),
          );
        }
        return;
      }

      const idx = tabs.findIndex((t) => t.id === id);
      if (idx < 0) return;

      const wasActive = activeChatTabIdRef.current === id;
      const nextTabs = tabs.filter((t) => t.id !== id);
      const nextActiveId = wasActive
        ? (tabs[idx + 1]?.id ?? tabs[idx - 1]?.id ?? nextTabs[0]?.id)
        : activeChatTabIdRef.current;
      if (wasActive && !nextActiveId) return;

      patchActiveSurface((cur) => {
        const n = { ...cur.rowsByTab };
        delete n[id];
        return {
          ...cur,
          chatTabs: nextTabs,
          rowsByTab: n,
          ...(wasActive && nextActiveId
            ? { activeChatTabId: nextActiveId }
            : {}),
        };
      });
      const s2 = surfacesRef.current[sid];
      chatTabsRef.current = s2.chatTabs;
      rowsByTabRef.current = s2.rowsByTab;
      if (wasActive && nextActiveId) {
        activeChatTabIdRef.current = nextActiveId;
        prevQueueSnapshotRef.current = [];
        setChatQueueItems([]);
        setTokenMeter({ ...TOKEN_METER_EMPTY });
        setChatPulseMeters(null);
        dispatchTurnAgentRef.current = null;
        setDispatchTurnAgent(null);
        const tabRows = s2.rowsByTab[nextActiveId] ?? [];
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "activate_session",
              sessionKey: wireSessionKeyForSurface(sid, nextActiveId),
              transcript: tabRows.map((r) => ({
                role: r.role,
                content: r.content,
              })),
            }),
          );
        }
      }
    },
    [streaming, patchActiveSurface],
  );

  return {
    connected,
    rows,
    chatTabs,
    activeChatTabId,
    selectChatTab,
    closeChatTab,
    renameChatTab,
    logs,
    streaming,
    chatQueuePending,
    chatQueueItems,
    editChatQueueItem,
    deleteChatQueueItem,
    forceChatQueueItem,
    error,
    effectiveModel,
    llmProviderFromSocket,
    chatMode,
    setChatMode,
    chatAgentName,
    dispatchTurnAgent,
    setChatAgent,
    sendChat,
    setLlmModel,
    stop,
    startNewSession,
    reconnectWebSocket,
    clearError: () => setError(null),
    tokenMeter,
    chatPulseMeters,
  };
}
