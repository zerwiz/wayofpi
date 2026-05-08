/**
 * useSimplePreferences Hook
 *
 * @description Manages simple mode color preferences (dark/light) with localStorage persistence
 * @returns Object containing current dark mode state and setter function
 *
 * @example
 * ```tsx
 * const { isDark: simpleIsDark } = useSimplePreferences();
 * if (simpleIsDark) renderDarkUI();
 * ```
 */
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "wop-simple-preferences-is-dark";
const DEFAULT_DARK_MODE = true;

export interface UseSimplePreferencesReturn {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

export function useSimplePreferences(): UseSimplePreferencesReturn {
  const [isDark, setIsDarkState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch {
      // Storage not available or parse error
    }
    return DEFAULT_DARK_MODE;
  });

  const setIsDark = useCallback(
    (darkMode: boolean) => {
      setIsDarkState(darkMode);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(darkMode));
      } catch {
        // Storage might not be available
      }
    },
    []
  );

  useEffect(() => {
    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        try {
          const stored = JSON.parse(event.newValue || "true");
          setIsDarkState(stored);
        } catch {
          // Ignore invalid JSON
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return {
    isDark,
    setIsDark,
  };
}
