export type TechnicalActivity = "explorer" | "search" | "scm" | "extensions" | "planning" | "settings";

import type { UiViewCatalogEntry } from "./uiViewsCatalog";

export type BottomPanelTab =
	| "problems"
	| "output"
	| "tool_log"
	| "agent_log"
	| "terminal"
	| "agent_team"
	| "agent_chat";

/** View → Editor Layout — maps to dock presets in App (subset of VS Code). */
export type EditorLayoutPreset =
	| "single"
	| "two_columns"
	| "two_rows"
	| "two_rows_right"
	| "two_columns_bottom"
	| "grid_2x2"
	| "focus_terminal"
	| "workspace_grid_1x1"
	| "workspace_grid_3x1"
	| "workspace_grid_1x3"
	| "workspace_grid_2x2"
	| "workspace_grid_3x4";

/** Optional bindings so View / Appearance match the technical shell. */
export interface ViewMenuTechnicalOptions {
	statusBarVisible: boolean;
	onToggleStatusBar: () => void;
	menuBarVisible: boolean;
	onToggleMenuBar: () => void;
	zenMode: boolean;
	onEnterZen: () => void;
	onExitZen: () => void;
	onToggleFullScreen: () => void;
	centeredLayout: boolean;
	onToggleCenteredLayout: () => void;
	/** Leave browser fullscreen, exit Zen, and turn off centered layout (default editing surface). */
	onNormalView: () => void;
	wordWrap: boolean;
	onToggleWordWrap: () => void;
	breadcrumbsVisible: boolean;
	onToggleBreadcrumbs: () => void;
	uiZoomPercent: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onZoomReset: () => void;
	onFlipLayout: () => void;
	onApplyLayoutPreset: (preset: EditorLayoutPreset) => void;
}

/** Simple UI: View → Appearance / Workspace views (catalog from `.wayofpi/ui-views.json`). */
export interface ViewMenuSimpleOptions {
	onOpenAppearanceSettings: () => void;
	onToggleFullScreen: () => void;
	/** Write default catalog if missing, then reload. */
	onSeedViewsCatalog: () => void | Promise<void>;
	catalog: UiViewCatalogEntry[];
	catalogLoading: boolean;
	catalogError: string | null;
	catalogParseWarning: string | null;
	catalogSource: "workspace" | "default";
	catalogRelPath: string;
	onActivateEntry: (e: UiViewCatalogEntry) => void;
	/** Open the JSON catalog in the Simple editor (create via seed if needed). */
	onEditCatalog: () => void;
	/** Open human-readable schema doc in the editor. */
	onOpenSchemaDoc: () => void;
}
