/**
 * useUiViewsCatalog Hook
 *
 * @description Manages views catalog state, source, loading status, and editing capabilities
 * @returns Object containing catalog state, loading status, and related operations
 *
 * @example
 * ```tsx
 * const { catalog, catalogLoading, catalogError, catalogParseWarning,
 *          catalogSource, catalogRelPath, onEditCatalog, onSeedViewsCatalog } = useUiViewsCatalog();
 * if (catalogLoading) showLoadingSpinner();
 * ```
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEYS = {
  CATALOG: "wop-ui-views-catalog",
  SCHEMA: "wop-ui-views-schema",
  CATALOG_SOURCE: "wop-ui-views-source",
  CATALOG_REL_PATH: "wop-ui-views-rel-path",
  LOADING: "wop-ui-views-loading",
  ERROR: "wop-ui-views-error",
  WARNING: "wop-ui-views-warning",
};

export interface CatalogEntry {
  id: string;
  label: string;
  detail?: string;
  keywords: string[];
}

export interface ViewsCatalog {
  entries: CatalogEntry[];
  version?: string;
}

export interface UseUiViewsCatalogReturn {
  catalog: ViewsCatalog | null;
  catalogLoading: boolean;
  catalogError: string | null;
  catalogParseWarning: string | null;
  catalogSource: string | null;
  catalogRelPath: string | null;
  onEditCatalog: (onEdit: boolean) => void;
  onSeedViewsCatalog: (seed: boolean) => void;
  onOpenSchemaDoc: () => Promise<void>;
  setCatalogSource: (source: string) => void;
  setCatalogRelPath: (path: string) => void;
}

// Default views catalog
const DEFAULT_CATALOG: ViewsCatalog = {
  entries: [],
  version: "1.0.0",
};

export function useUiViewsCatalog(): UseUiViewsCatalogReturn {
  const [catalog, setCatalogState] = useState<ViewsCatalog | null>(null);
  const [catalogLoading, setCatalogLoadingState] = useState(false);
  const [catalogError, setCatalogErrorState] = useState<string | null>(null);
  const [catalogParseWarning, setCatalogParseWarningState] = useState<string | null>(null);
  const [catalogSource, setCatalogSourceState] = useState<string | null>(null);
  const [catalogRelPath, setCatalogRelPathState] = useState<string | null>(null);

  // Initialize from storage
  useEffect(() => {
    const initCatalog = async () => {
      setCatalogLoadingState(true);
      setCatalogErrorState(null);
      setCatalogParseWarningState(null);

      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CATALOG);
        const source = localStorage.getItem(STORAGE_KEYS.CATALOG_SOURCE);

        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.entries)) {
            setCatalogState(parsed);
            setCatalogSourceState(source || null);
            return;
          }
        }

        // Seed with empty catalog if no storage
        const seededCatalog: ViewsCatalog = {
          entries: [],
          version: DEFAULT_CATALOG.version,
        };
        setCatalogState(seededCatalog);
        localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(seededCatalog));

        // Set default schema source
        const defaultSchemaPath = "https://raw.githubusercontent.com/zerwiz/way-of-pi/master/.pi/agents/schema.json";
        setCatalogSourceState(defaultSchemaPath);
        localStorage.setItem(STORAGE_KEYS.CATALOG_SOURCE, defaultSchemaPath);

      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load views catalog";
        setCatalogErrorState(message);
        setCatalogParseWarningState("Parse error: Invalid catalog format");
      } finally {
        setCatalogLoadingState(false);
      }
    };

    initCatalog();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.CATALOG) {
        try {
          const stored = event.newValue;
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed.entries)) {
              setCatalogState(parsed);
            }
          }
        } catch {
          // Ignore invalid JSON
        }
      } else if (event.key === STORAGE_KEYS.CATALOG_SOURCE) {
        setCatalogSourceState(event.newValue || null);
      } else if (event.key === STORAGE_KEYS.CATALOG_REL_PATH) {
        setCatalogRelPathState(event.newValue || null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const onEditCatalog = useCallback((onEdit: boolean) => {
    if (onEdit) {
      localStorage.setItem(STORAGE_KEYS.CATALOG + "_editable", "true");
    } else {
      localStorage.removeItem(STORAGE_KEYS.CATALOG + "_editable");
    }
  }, []);

  const onSeedViewsCatalog = useCallback((seed: boolean) => {
    if (seed) {
      const seededCatalog: ViewsCatalog = {
        entries: [],
        version: DEFAULT_CATALOG.version,
      };
      setCatalogState(seededCatalog);
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(seededCatalog));
    }
  }, []);

  const onOpenSchemaDoc = useCallback(async () => {
    try {
      const schemaUrl = catalogSource || "https://raw.githubusercontent.com/zerwiz/way-of-pi/master/.pi/agents/schema.json";
      const response = await fetch(schemaUrl);
      if (response.ok) {
        const schema = await response.text();
        window.open(schemaUrl, "_blank");
      }
    } catch (error) {
      console.warn("Failed to open schema doc:", error);
      // Fall back to opening the schema URL directly
      const schemaUrl = catalogSource || "https://raw.githubusercontent.com/zerwiz/way-of-pi/master/.pi/agents/schema.json";
      window.open(schemaUrl, "_blank");
    }
  }, [catalogSource]);

  const setCatalogSource = useCallback((source: string) => {
    setCatalogSourceState(source);
    localStorage.setItem(STORAGE_KEYS.CATALOG_SOURCE, source);
  }, []);

  const setCatalogRelPath = useCallback((path: string) => {
    setCatalogRelPathState(path);
    localStorage.setItem(STORAGE_KEYS.CATALOG_REL_PATH, path);
  }, []);

  return {
    catalog,
    catalogLoading,
    catalogError,
    catalogParseWarning,
    catalogSource,
    catalogRelPath,
    onEditCatalog,
    onSeedViewsCatalog,
    onOpenSchemaDoc,
    setCatalogSource,
    setCatalogRelPath,
  };
}
