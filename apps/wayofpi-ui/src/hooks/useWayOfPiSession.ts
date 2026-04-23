/**
 * useWayOfPiSession - Hook that manages terminal and chat sessions
 * Handles session creation, execution, and row management
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  sessionManager,
  screenBuffer,
} from "@wayofpi-server/session";

/**
 * Session state
 */
type SessionState = {
  sessionId: string;
  rows: Array<{
    id: number;
    sessionId: string;
    role: "user" | "assistant";
    inputContent: string;
    inputCursorPosition: { x: number; y: number };
    outputContent: string;
    isTerminal: boolean; // True for terminal rows
    isInteractive: boolean;
  }>;
  prompt: string;
};

/**
 * Hook for terminal sessions
 */
export const useWayOfPiSession = (
  sessionId: string,
  prompt: string = "$ ",
) => {
  const [state, setState] = useState<SessionState>({
    sessionId,
    rows: [],
    prompt,
  });

  /**
   * Execute command in terminal
   */
  const execute = useCallback(
    (text) => {
      // Send command to terminal
      screenBuffer.write(text);
      
      // Update row with command output
      setState((prev) => ({
        ...prev,
        rows: prev.rows.map((row) =>
          row.id === prev.rows.length - 1 ? {
            ...row,
            outputContent: text,
          } : row,
        ),
      }));
    },
    [],
  );

  /**
   * Handle input
   */
  const handleInput = useCallback(
    (sessionId: string, rowId: number, text: string, cursor: { x: number; y: number }) => {
      // Update row with new input
      setState((prev) => ({
        ...prev,
        rows: prev.rows.map((row, idx) =>
          idx === rowId
            ? {
                ...row,
                inputContent: text,
                inputCursorPosition: cursor,
              }
            : row,
        ),
      }));
    },
    [sessionId],
  );

  /**
   * Handle selection
   */
  const handleSelectRow = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      // Focus row
      console.log(`Selected row at ${e.clientX}, ${e.clientY}`);
      setState((prev) => ({
        ...prev,
        rows: prev.rows.map((row, idx) =>
          idx === e.currentTarget.children.indexOf(row.id)
            ? { ...row, isFocused: true }
            : row,
        ),
      }));
    },
    [sessionId],
  );

  return {
    sessionId,
    rows: state.rows,
    state,
    execute,
    handleInput,
    handleSelectRow,
  };
};

export default useWayOfPiSession;
