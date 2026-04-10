/** Simple UI Chat tab: editor vs chat arrangement (persisted). */
export type SimpleChatWorkspaceLayout = "stacked" | "side_by_side";

const STORAGE_KEY = "wayofpi.simple.chatWorkspaceLayout.v1";

export interface SimpleChatWorkspaceState {
	layout: SimpleChatWorkspaceLayout;
	/** Width of the chat column when `layout === "side_by_side"` (md+). */
	chatColumnWidthPx: number;
}

export const SIMPLE_CHAT_WORKSPACE_DEFAULTS: SimpleChatWorkspaceState = {
	/** Chat left, editor right (with project panel) — avoids cramped editor-above-chat when editing. */
	layout: "side_by_side",
	chatColumnWidthPx: 420,
};

export function clampSimpleChatColumnWidth(px: number): number {
	return Math.min(1280, Math.max(260, Math.round(px)));
}

export function readSimpleChatWorkspaceState(): SimpleChatWorkspaceState {
	const base = { ...SIMPLE_CHAT_WORKSPACE_DEFAULTS };
	if (typeof window === "undefined") return base;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return base;
		const o = JSON.parse(raw) as Partial<SimpleChatWorkspaceState>;
		if (o.layout === "stacked" || o.layout === "side_by_side") base.layout = o.layout;
		if (typeof o.chatColumnWidthPx === "number" && Number.isFinite(o.chatColumnWidthPx)) {
			base.chatColumnWidthPx = clampSimpleChatColumnWidth(o.chatColumnWidthPx);
		}
	} catch {
		/* ignore */
	}
	return base;
}

export function writeSimpleChatWorkspaceState(state: SimpleChatWorkspaceState): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				layout: state.layout,
				chatColumnWidthPx: clampSimpleChatColumnWidth(state.chatColumnWidthPx),
			}),
		);
	} catch {
		/* ignore */
	}
}
