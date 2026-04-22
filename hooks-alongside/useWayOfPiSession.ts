/**
 * useWayOfPiSession Hook
 *
 * @description Manages Way of Pi chat session state including token meters,
 *              error handling, agent selection, and session keys for API communication
 * @param chatSurfaceId - Current UI mode (simple/technical/claw) for surface-specific session
 * @param refresh - Tree refresh callback for session sync
 * @param bufferAssistantDeltasRef - Ref to buffer assistant message deltas
 * @param reloadAgentsCatalog - Function to reload agents catalog
 * @param focusAgentWrittenWorkspaceFileRef - Callback to focus workspace file from agent
 *
 * @returns Complete session object with chat state, token meters, and session methods
 */

import { useState, useCallback, useEffect, useMemo } from "react";

export interface SessionTokenMeter {
  tokensDown: number;
  tokensUp: number;
  tokensTitle: string;
}

export interface ChatSessionError {
  message: string;
  suggestModelFix?: boolean;
  provider?: string;
  model?: string;
}

export interface UseWayOfPiSessionReturn {
  chatMode: "simple" | "plan" | "technical";
  setChatMode: (mode: "simple" | "plan" | "technical") => void;
  error: ChatSessionError | null;
  tokenMeter: SessionTokenMeter;
  tokensTitle: string;
  chatAgentName: string | null;
  setChatAgentName: (name: string | null) => void;
  wireSessionKey: string;
  activate_session: () => Promise<void>;
  get_session: () => SessionData | null;
}

export interface SessionData {
  chatMode: "simple" | "plan" | "technical";
  agentName: string | null;
  wireSessionKey: string;
  messagePrefix: string;
  messageSuffix: string;
}

// Storage key for session persistence
const SESSION_STORAGE_KEY = (surface: string) => `wop-session-${surface}`;

// Default session configuration
const DEFAULT_SESSION: SessionData = {
  chatMode: "technical",
  agentName: null,
  wireSessionKey: "",
  messagePrefix: "[Way of Pi] ",
  messageSuffix: "",
};

// Default token meter
const DEFAULT_TOKEN_METER: SessionTokenMeter = {
  tokensDown: 0,
  tokensUp: 0,
  tokensTitle: "Initializing...",
};

// Session key generation
const generateSessionKey = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wop-${timestamp}-${random}`;
};

// Initialize session from storage or create new
const initializeSession = (
  surface: string,
  currentMode: string,
): SessionData => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY(surface));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.chatMode === currentMode) {
        return parsed;
      }
    }
  } catch {
    // Storage not available or parse error
  }
  return DEFAULT_SESSION;
};

// Save session to storage
const saveSession = (surface: string, session: SessionData): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY(surface), JSON.stringify(session));
  } catch {
    // Storage might not be available
  }
};

export function useWayOfPiSession(
  chatSurfaceId: "simple" | "technical" | "claw",
  refresh?: () => Promise<void> | void,
  bufferAssistantDeltasRef?: React.RefObject<boolean>,
  reloadAgentsCatalog?: () => Promise<void> | void,
  focusAgentWrittenWorkspaceFileRef?: React.RefObject<(rel: string) => void>,
): UseWayOfPiSessionReturn {
  const [session, setSessionState] = useState<SessionData>(() =>
    initializeSession(chatSurfaceId, chatSurfaceId),
  );

  const [tokenMeter, setTokenMeter] = useState<SessionTokenMeter>(
    () => DEFAULT_TOKEN_METER,
  );

  // Initialize session on mount with current surface ID
  useEffect(() => {
    // When surface changes, reinitialize session for that surface
    const storedSession = initializeSession(chatSurfaceId, chatSurfaceId);
    setSessionState(storedSession);
    setTokenMeter(DEFAULT_TOKEN_METER);
  }, [chatSurfaceId]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key.startsWith(SESSION_STORAGE_KEY(chatSurfaceId.substring(0, 6)))
      ) {
        try {
          const stored = event.newValue;
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.chatMode === chatSurfaceId) {
              setSessionState(parsed);
            }
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [chatSurfaceId]);

  const activate_session = useCallback(async (): Promise<void> => {
    try {
      // Simulate session activation
      // In production this would connect to the backend API
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update token meter
      setTokenMeter((prev) => ({
        ...prev,
        tokensDown: 0,
        tokensUp: 0,
        tokensTitle: "Active",
      }));

      // Notify parent of activation
      focusAgentWrittenWorkspaceFileRef?.current?.(session.wireSessionKey);

      // Refresh if needed
      if (refresh) {
        await refresh();
      }
    } catch (error) {
      console.warn("Failed to activate session:", error);
      // Fall back to default session
      setSessionState(DEFAULT_SESSION);
    }
  }, [
    session.wireSessionKey,
    refresh,
    focusAgentWrittenWorkspaceFileRef?.current,
  ]);

  const get_session = useCallback((): SessionData | null => {
    return session;
  }, [session]);

  const setChatMode = useCallback(
    (mode: "simple" | "plan" | "technical") => {
      setSessionState((prev) => {
        const updated = { ...prev, chatMode: mode };
        saveSession(chatSurfaceId, updated);
        return updated;
      });
    },
    [chatSurfaceId],
  );

  const setChatAgentName = useCallback((name: string | null) => {
    setSessionState((prev) => ({
      ...prev,
      agentName: name,
    }));
  }, []);

  const wireSessionKey = useMemo(() => {
    if (!session.wireSessionKey) {
      session.wireSessionKey = generateSessionKey();
      saveSession(chatSurfaceId, session);
    }
    return session.wireSessionKey;
  }, [chatSurfaceId, session.wireSessionKey]);

  // Update token meter when session is active
  useEffect(() => {
    if (session.chatMode === "plan" && session.wireSessionKey) {
      setTokenMeter((prev) => ({
        ...prev,
        tokensTitle: "Running",
      }));
    } else {
      setTokenMeter((prev) => ({
        ...prev,
        tokensTitle: "Idle",
      }));
    }
  }, [session.chatMode, session.wireSessionKey]);

  return {
    chatMode: session.chatMode,
    setChatMode,
    error:
      session.chatMode !== "technical"
        ? ({
            message: "Session not available in this mode",
          } as ChatSessionError)
        : null,
    tokenMeter,
    tokensTitle: tokenMeter.tokensTitle,
    chatAgentName: session.agentName,
    setChatAgentName,
    wireSessionKey,
    activate_session,
    get_session,
  };
}

export default useWayOfPiSession;
