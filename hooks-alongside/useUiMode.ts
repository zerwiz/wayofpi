/**
 * useUiMode Hook
 *
 * @description Manages UI mode state (technical/simple/claw) with localStorage persistence
 * @returns Object containing current mode and setter function
 *
 * @example
 * ```tsx
 * const { mode: uiMode, setMode: setUiMode } = useUiMode();
 * if (uiMode === "simple") renderSimpleUI();
 * ```
 */

import { useState, useCallback } from "react";

const STORAGE_KEY = "wop-ui-mode";
const DEFAULT_MODE = "technical" as const;

export interface UseUiModeReturn {
  mode: "technical" | "simple" | "claw";
  setMode: (mode: "technical" | "simple" | "claw") => void;
}

export function useUiMode(): UseUiModeReturn {
  const [mode, setModeState] = useState<"technical" | "simple" | "claw">(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = stored as "technical" | "simple" | "claw";
        if (["technical", "simple", "claw"].includes(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Storage not available
    }
    return DEFAULT_MODE;
  });

  const setMode = useCallback((newMode: "technical" | "simple" | "claw") => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Storage might not be available
    }
  }, []);

  return {
    mode,
    setMode,
  };
}
