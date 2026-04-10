/** Persisted technical-shell UI (primary left sidebar visibility). */
const LEFT_SIDEBAR_KEY = "wayofpi.technical.leftSidebarVisible";

export function readLeftSidebarVisibleInitial(): boolean {
	if (typeof window === "undefined") return true;
	try {
		if (localStorage.getItem(LEFT_SIDEBAR_KEY) === "0") return false;
	} catch {
		/* ignore */
	}
	return true;
}

export function writeLeftSidebarVisible(visible: boolean): void {
	try {
		localStorage.setItem(LEFT_SIDEBAR_KEY, visible ? "1" : "0");
	} catch {
		/* ignore */
	}
}

/** Where the agent / session chat dock sits (Zed-style dock regions — subset). */
export type ChatDockRegion = "right" | "bottom";

/**
 * Horizontal **tool dock** slots: same band type (`UnifiedHorizontalDock` + tabs), different **attachment** in the tree
 * (upper band: full width under menu/top of main; lower band: bottom of the **editor stack** so the agent column stays full height).
 */
export type HorizontalToolDockSlot = "top" | "bottom";

/** Ordered slots for iteration (status bar, menus, commands). */
export const HORIZONTAL_TOOL_DOCK_SLOTS: readonly HorizontalToolDockSlot[] = ["top", "bottom"];

/** UI copy + a11y strings per slot (one dock system, two placements). */
export const HORIZONTAL_TOOL_DOCK_UI: Record<
	HorizontalToolDockSlot,
	{ bandLabel: string; bandTitle: string; dropLabel: string; splitResizeAria: string }
> = {
	top: {
		bandLabel: "Tool dock",
		bandTitle: "Tool dock — upper band (main column, full width)",
		dropLabel: "Drop tool or file tabs here (upper band)",
		splitResizeAria: "Resize upper tool dock height",
	},
	bottom: {
		bandLabel: "Tool dock",
		bandTitle: "Tool dock — lower band (editor stack — does not shrink the agent column)",
		dropLabel: "Drop tool or file tabs here (lower band)",
		splitResizeAria: "Resize lower tool dock height",
	},
};

export interface TechnicalDockLayout {
	chatDock: ChatDockRegion;
	/** When false, only a slim restore control is shown (more editor / terminal space). */
	agentPanelVisible: boolean;
	/** Primary sidebar (Explorer / Search / …) width beside the activity bar. */
	leftSidebarWidthPx: number;
	/** Width (px) when `chatDock === "right"`; height (px) when `chatDock === "bottom"`. */
	chatSizePx: number;
	/** Row height (px) for each horizontal tool-dock slot — same semantics for both keys. */
	horizontalToolDockHeightsPx: Record<HorizontalToolDockSlot, number>;
}

export const DOCK_DEFAULTS: TechnicalDockLayout = {
	chatDock: "right",
	agentPanelVisible: true,
	leftSidebarWidthPx: 256,
	chatSizePx: 400,
	horizontalToolDockHeightsPx: { top: 280, bottom: 140 },
};

const DOCK_KEY = "wayofpi.technical.dockLayout";

function clamp(n: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Math.round(n)));
}

export function clampLeftSidebarWidth(px: number): number {
	return clamp(px, 200, 640);
}

export function clampChatWidth(px: number): number {
	return clamp(px, 220, 1280);
}

export function clampChatHeight(px: number): number {
	return clamp(px, 120, 720);
}

export function clampBottomPanelHeight(px: number): number {
	return clamp(px, 100, 560);
}

export function clampTopPanelHeight(px: number): number {
	return clamp(px, 120, 640);
}

export function readDockLayout(): TechnicalDockLayout {
	const base = { ...DOCK_DEFAULTS };
	if (typeof window === "undefined") return base;
	try {
		const raw = localStorage.getItem(DOCK_KEY);
		if (!raw) return base;
		const o = JSON.parse(raw) as Record<string, unknown>;
		if (o.chatDock === "right" || o.chatDock === "bottom") base.chatDock = o.chatDock;
		if (typeof o.agentPanelVisible === "boolean") base.agentPanelVisible = o.agentPanelVisible;
		if (typeof o.leftSidebarWidthPx === "number" && Number.isFinite(o.leftSidebarWidthPx)) {
			base.leftSidebarWidthPx = clampLeftSidebarWidth(o.leftSidebarWidthPx);
		}
		if (typeof o.chatSizePx === "number" && Number.isFinite(o.chatSizePx)) {
			base.chatSizePx =
				base.chatDock === "right"
					? clampChatWidth(o.chatSizePx as number)
					: clampChatHeight(o.chatSizePx as number);
		}
		let topH = DOCK_DEFAULTS.horizontalToolDockHeightsPx.top;
		let botH = DOCK_DEFAULTS.horizontalToolDockHeightsPx.bottom;
		const hObj = o.horizontalToolDockHeightsPx;
		if (hObj && typeof hObj === "object") {
			const rec = hObj as Record<string, unknown>;
			if (typeof rec.top === "number" && Number.isFinite(rec.top)) topH = clampTopPanelHeight(rec.top);
			if (typeof rec.bottom === "number" && Number.isFinite(rec.bottom)) botH = clampBottomPanelHeight(rec.bottom);
		} else {
			if (typeof o.topPanelHeightPx === "number" && Number.isFinite(o.topPanelHeightPx)) {
				topH = clampTopPanelHeight(o.topPanelHeightPx as number);
			}
			if (typeof o.bottomPanelHeightPx === "number" && Number.isFinite(o.bottomPanelHeightPx)) {
				botH = clampBottomPanelHeight(o.bottomPanelHeightPx as number);
			}
		}
		base.horizontalToolDockHeightsPx = { top: topH, bottom: botH };
	} catch {
		/* ignore */
	}
	return base;
}

export function writeDockLayout(layout: TechnicalDockLayout): void {
	try {
		localStorage.setItem(
			DOCK_KEY,
			JSON.stringify({
				chatDock: layout.chatDock,
				agentPanelVisible: layout.agentPanelVisible,
				leftSidebarWidthPx: layout.leftSidebarWidthPx,
				chatSizePx: layout.chatSizePx,
				horizontalToolDockHeightsPx: layout.horizontalToolDockHeightsPx,
			}),
		);
	} catch {
		/* ignore */
	}
}

/**
 * Which horizontal tool-dock slot hosts a tab (`top` / `bottom` are **slots** in one system, not different dock kinds).
 */
export type ToolPanelZone = HorizontalToolDockSlot;

export type ToolPanelId = "problems" | "output" | "tool_log" | "terminal";

export interface ToolPanelPlacement {
	zone: ToolPanelZone;
	visible: boolean;
	order: number;
}

/** One tab in a horizontal dock strip — tool surface or workspace file (same drag model). */
export type DockStripEntry =
	| { type: "tool"; id: ToolPanelId }
	| { type: "file"; path: string };

export interface ToolDockLayout {
	panels: Record<ToolPanelId, ToolPanelPlacement>;
	/** Ordered tabs per slot (tools + file pins). */
	strips: Record<HorizontalToolDockSlot, DockStripEntry[]>;
	/** Active tab index per slot (into `strips[slot]`). */
	activeIndexBySlot: Record<HorizontalToolDockSlot, number>;
}

export const TOOL_PANEL_IDS: ToolPanelId[] = ["problems", "output", "tool_log", "terminal"];

const TOOL_DOCK_KEY = "wayofpi.technical.toolDock";

function defaultPlacements(): Record<ToolPanelId, ToolPanelPlacement> {
	return {
		terminal: { zone: "bottom", visible: true, order: 0 },
		output: { zone: "bottom", visible: true, order: 1 },
		problems: { zone: "bottom", visible: true, order: 2 },
		tool_log: { zone: "bottom", visible: true, order: 3 },
	};
}

function defaultStrips(): Record<HorizontalToolDockSlot, DockStripEntry[]> {
	return {
		top: [],
		bottom: [
			{ type: "tool", id: "terminal" },
			{ type: "tool", id: "output" },
			{ type: "tool", id: "problems" },
			{ type: "tool", id: "tool_log" },
		],
	};
}

/** Upper tool dock removed: all tools live in `bottom`. */
function normalizeDockZone(z: ToolPanelZone): ToolPanelZone {
	return z === "top" ? "bottom" : z;
}

function mergeStripEntriesDedupe(first: DockStripEntry[], second: DockStripEntry[]): DockStripEntry[] {
	const seenTool = new Set<ToolPanelId>();
	const seenPath = new Set<string>();
	const out: DockStripEntry[] = [];
	const push = (e: DockStripEntry) => {
		if (e.type === "tool") {
			if (seenTool.has(e.id)) return;
			seenTool.add(e.id);
		} else {
			if (seenPath.has(e.path)) return;
			seenPath.add(e.path);
		}
		out.push(e);
	};
	for (const e of first) push(e);
	for (const e of second) push(e);
	return out;
}

/**
 * Fold legacy `strips.top` into `strips.bottom` (dedupe), clear `top`.
 * Call on load/save so the upper horizontal tool dock can be removed from the UI.
 */
export function collapseTopToolDockIntoBottom(layout: ToolDockLayout): void {
	if (layout.strips.top.length === 0) return;
	const bottom = layout.strips.bottom;
	const prevIdx = layout.activeIndexBySlot.bottom;
	const prevEntry = prevIdx >= 0 && prevIdx < bottom.length ? bottom[prevIdx] : null;

	layout.strips.bottom = mergeStripEntriesDedupe(layout.strips.top, layout.strips.bottom);
	layout.strips.top = [];
	layout.activeIndexBySlot.top = 0;

	if (prevEntry) {
		const ni = layout.strips.bottom.findIndex((e) => dockEntriesEqual(e, prevEntry));
		layout.activeIndexBySlot.bottom = ni >= 0 ? ni : 0;
	} else {
		layout.activeIndexBySlot.bottom = 0;
	}
}

/** Legacy `middle` / `top` → bottom; legacy `right` (under agent) → bottom. */
function migratePanelZones(layout: ToolDockLayout): void {
	for (const id of TOOL_PANEL_IDS) {
		const z = layout.panels[id].zone as string;
		if (z === "middle" || z === "top" || z === "right") layout.panels[id].zone = "bottom";
	}
	reindexZone(layout, "bottom");
	reindexZone(layout, "top");
}

export const TOOL_DOCK_DEFAULTS: ToolDockLayout = {
	panels: defaultPlacements(),
	strips: defaultStrips(),
	activeIndexBySlot: { top: 0, bottom: 0 },
};

function reindexZone(layout: ToolDockLayout, zone: ToolPanelZone): void {
	const ids = TOOL_PANEL_IDS.filter((t) => layout.panels[t].zone === zone && layout.panels[t].visible).sort(
		(a, b) => layout.panels[a].order - layout.panels[b].order,
	);
	ids.forEach((t, i) => {
		layout.panels[t].order = i;
	});
}

export function dockEntriesEqual(a: DockStripEntry, b: DockStripEntry): boolean {
	if (a.type !== b.type) return false;
	if (a.type === "tool") return b.type === "tool" && a.id === b.id;
	return b.type === "file" && a.path === b.path;
}

function buildStripsFromPanels(layout: ToolDockLayout): Record<HorizontalToolDockSlot, DockStripEntry[]> {
	const out: Record<HorizontalToolDockSlot, DockStripEntry[]> = { top: [], bottom: [] };
	for (const slot of HORIZONTAL_TOOL_DOCK_SLOTS) {
		const tools = TOOL_PANEL_IDS.filter((id) => layout.panels[id].zone === slot && layout.panels[id].visible).sort(
			(a, b) => layout.panels[a].order - layout.panels[b].order,
		);
		out[slot] = tools.map((id) => ({ type: "tool" as const, id }));
	}
	return out;
}

export function syncPanelsFromStrips(layout: ToolDockLayout): void {
	for (const id of TOOL_PANEL_IDS) {
		layout.panels[id].visible = false;
	}
	for (const slot of HORIZONTAL_TOOL_DOCK_SLOTS) {
		let toolOrder = 0;
		for (const e of layout.strips[slot]) {
			if (e.type === "tool") {
				layout.panels[e.id].visible = true;
				layout.panels[e.id].zone = slot;
				layout.panels[e.id].order = toolOrder++;
			}
		}
	}
}

function clampActiveIndices(layout: ToolDockLayout): void {
	for (const slot of HORIZONTAL_TOOL_DOCK_SLOTS) {
		const n = layout.strips[slot].length;
		if (n === 0) layout.activeIndexBySlot[slot] = 0;
		else layout.activeIndexBySlot[slot] = Math.min(Math.max(0, layout.activeIndexBySlot[slot]), n - 1);
	}
}

function cloneLayout(layout: ToolDockLayout): ToolDockLayout {
	const panels = { ...layout.panels };
	for (const k of TOOL_PANEL_IDS) {
		panels[k] = { ...panels[k] };
	}
	return {
		...layout,
		panels,
		strips: {
			top: [...layout.strips.top],
			bottom: [...layout.strips.bottom],
		},
		activeIndexBySlot: { ...layout.activeIndexBySlot },
	};
}

function findEntrySlotIndex(
	layout: ToolDockLayout,
	entry: DockStripEntry,
): { slot: ToolPanelZone; index: number } | null {
	for (const slot of HORIZONTAL_TOOL_DOCK_SLOTS) {
		const index = layout.strips[slot].findIndex((e) => dockEntriesEqual(e, entry));
		if (index >= 0) return { slot, index };
	}
	return null;
}

/** Move or reorder any strip entry (tool or file) between slots or within a slot. */
export function applyDockStripMoveEntry(
	layout: ToolDockLayout,
	moving: DockStripEntry,
	targetZone: ToolPanelZone,
	before: DockStripEntry | null,
): ToolDockLayout {
	const zone = normalizeDockZone(targetZone);
	const next = cloneLayout(layout);
	const found = findEntrySlotIndex(next, moving);
	if (!found) return next;
	next.strips[found.slot].splice(found.index, 1);
	let insertAt = next.strips[zone].length;
	if (before) {
		const bi = next.strips[zone].findIndex((e) => dockEntriesEqual(e, before));
		if (bi >= 0) insertAt = bi;
	}
	next.strips[zone].splice(insertAt, 0, moving);
	syncPanelsFromStrips(next);
	clampActiveIndices(next);
	const ni = next.strips[zone].findIndex((e) => dockEntriesEqual(e, moving));
	if (ni >= 0) next.activeIndexBySlot[zone] = ni;
	return next;
}

/** Append a workspace file tab to a slot (no duplicate path in that slot). */
export function applyAddFileToStrip(layout: ToolDockLayout, zone: ToolPanelZone, path: string): ToolDockLayout {
	const z = normalizeDockZone(zone);
	const next = cloneLayout(layout);
	const entry: DockStripEntry = { type: "file", path };
	if (next.strips[z].some((e) => e.type === "file" && e.path === path)) return next;
	next.strips[z].push(entry);
	syncPanelsFromStrips(next);
	clampActiveIndices(next);
	next.activeIndexBySlot[z] = next.strips[z].length - 1;
	return next;
}

/** Remove a file tab from whichever strip contains it. */
export function applyRemoveFileFromStrips(layout: ToolDockLayout, path: string): ToolDockLayout {
	const next = cloneLayout(layout);
	for (const slot of HORIZONTAL_TOOL_DOCK_SLOTS) {
		const i = next.strips[slot].findIndex((e) => e.type === "file" && e.path === path);
		if (i >= 0) {
			next.strips[slot].splice(i, 1);
			if (next.activeIndexBySlot[slot] >= next.strips[slot].length) {
				next.activeIndexBySlot[slot] = Math.max(0, next.strips[slot].length - 1);
			}
		}
	}
	syncPanelsFromStrips(next);
	clampActiveIndices(next);
	return next;
}

/** Move or reorder a tool panel; updates `strips` and derived `panels`. */
export function applyToolPanelMove(
	layout: ToolDockLayout,
	id: ToolPanelId,
	targetZone: ToolPanelZone,
	beforeId: ToolPanelId | null,
): ToolDockLayout {
	const moving: DockStripEntry = { type: "tool", id };
	let before: DockStripEntry | null = null;
	if (beforeId) before = { type: "tool", id: beforeId };
	return applyDockStripMoveEntry(layout, moving, targetZone, before);
}

export function applyToolPanelClose(layout: ToolDockLayout, id: ToolPanelId): ToolDockLayout {
	const next = cloneLayout(layout);
	for (const slot of HORIZONTAL_TOOL_DOCK_SLOTS) {
		next.strips[slot] = next.strips[slot].filter((e) => !(e.type === "tool" && e.id === id));
	}
	syncPanelsFromStrips(next);
	clampActiveIndices(next);
	return next;
}

export function applyToolPanelShow(layout: ToolDockLayout, id: ToolPanelId, zone?: ToolPanelZone): ToolDockLayout {
	const z = normalizeDockZone(zone ?? layout.panels[id].zone);
	const entry: DockStripEntry = { type: "tool", id };
	const found = findEntrySlotIndex(layout, entry);
	if (found && found.slot === z) {
		const next = cloneLayout(layout);
		syncPanelsFromStrips(next);
		const idx = next.strips[z].findIndex((e) => e.type === "tool" && e.id === id);
		if (idx >= 0) next.activeIndexBySlot[z] = idx;
		return next;
	}
	return applyDockStripMoveEntry(layout, entry, z, null);
}

function parsePanelZone(raw: unknown): ToolPanelZone | null {
	if (raw === "top" || raw === "bottom") return raw;
	if (raw === "middle") return "top";
	if (raw === "right") return "bottom";
	return null;
}

export function parseDockStripEntry(raw: unknown): DockStripEntry | null {
	if (!raw || typeof raw !== "object") return null;
	const o = raw as Record<string, unknown>;
	if (o.type === "tool" && typeof o.id === "string" && TOOL_PANEL_IDS.includes(o.id as ToolPanelId)) {
		return { type: "tool", id: o.id as ToolPanelId };
	}
	if (o.type === "file" && typeof o.path === "string" && o.path.length > 0) {
		return { type: "file", path: o.path };
	}
	return null;
}

/** Drag-and-drop payload (`application/x-wop-dockstrip-entry`). */
export function serializeDockStripEntry(e: DockStripEntry): string {
	return JSON.stringify(e);
}

export function parseDockStripEntryJson(raw: string): DockStripEntry | null {
	try {
		return parseDockStripEntry(JSON.parse(raw) as unknown);
	} catch {
		return null;
	}
}

/** Focus an already-visible tool tab by strip index (no reorder). */
export function applyActivateToolTab(layout: ToolDockLayout, id: ToolPanelId): ToolDockLayout {
	const entry: DockStripEntry = { type: "tool", id };
	const found = findEntrySlotIndex(layout, entry);
	if (!found) return applyToolPanelShow(layout, id);
	const next = cloneLayout(layout);
	next.activeIndexBySlot[found.slot] = found.index;
	return next;
}

function parseStrips(raw: unknown): Record<HorizontalToolDockSlot, DockStripEntry[]> | null {
	if (!raw || typeof raw !== "object") return null;
	const o = raw as Record<string, unknown>;
	const top = o.top;
	const bottom = o.bottom;
	if (!Array.isArray(top) || !Array.isArray(bottom)) return null;
	const parseArr = (a: unknown[]): DockStripEntry[] => {
		const out: DockStripEntry[] = [];
		for (const x of a) {
			const e = parseDockStripEntry(x);
			if (e) out.push(e);
		}
		return out;
	};
	return { top: parseArr(top), bottom: parseArr(bottom) };
}

function toolIndexInStrip(strip: DockStripEntry[], toolId: ToolPanelId): number {
	return strip.findIndex((e) => e.type === "tool" && e.id === toolId);
}

export function readToolDockLayout(): ToolDockLayout {
	const base: ToolDockLayout = {
		panels: defaultPlacements(),
		strips: defaultStrips(),
		activeIndexBySlot: { top: 0, bottom: 0 },
	};
	let legacyActiveTop: ToolPanelId = "terminal";
	let legacyActiveBottom: ToolPanelId = "problems";
	if (typeof window === "undefined") return base;
	try {
		const raw = localStorage.getItem(TOOL_DOCK_KEY);
		if (!raw) return base;
		const o = JSON.parse(raw) as Partial<ToolDockLayout> & {
			topActiveTab?: ToolPanelId;
			bottomActiveTab?: ToolPanelId;
			activeTabBySlot?: Record<string, unknown>;
		};
		if (o.panels && typeof o.panels === "object") {
			for (const id of TOOL_PANEL_IDS) {
				const p = (o.panels as Record<string, ToolPanelPlacement>)[id];
				if (!p) continue;
				const z = parsePanelZone(p.zone);
				if (z) base.panels[id].zone = z;
				if (typeof p.visible === "boolean") base.panels[id].visible = p.visible;
				if (typeof p.order === "number" && Number.isFinite(p.order)) base.panels[id].order = p.order;
			}
		}
		migratePanelZones(base);
		const parsedStrips = parseStrips(o.strips);
		if (parsedStrips) {
			base.strips = parsedStrips;
		} else {
			base.strips = buildStripsFromPanels(base);
		}
		const bySlot = o.activeTabBySlot;
		if (bySlot && typeof bySlot === "object") {
			const rec = bySlot as Record<string, unknown>;
			if (rec.top && TOOL_PANEL_IDS.includes(rec.top as ToolPanelId)) legacyActiveTop = rec.top as ToolPanelId;
			if (rec.bottom && TOOL_PANEL_IDS.includes(rec.bottom as ToolPanelId)) {
				legacyActiveBottom = rec.bottom as ToolPanelId;
			}
		} else {
			if (o.topActiveTab && TOOL_PANEL_IDS.includes(o.topActiveTab)) legacyActiveTop = o.topActiveTab;
			if (o.bottomActiveTab && TOOL_PANEL_IDS.includes(o.bottomActiveTab)) {
				legacyActiveBottom = o.bottomActiveTab;
			}
		}
		const ai = o.activeIndexBySlot;
		if (ai && typeof ai === "object") {
			const r = ai as Record<string, unknown>;
			if (typeof r.top === "number" && Number.isFinite(r.top)) base.activeIndexBySlot.top = Math.floor(r.top);
			if (typeof r.bottom === "number" && Number.isFinite(r.bottom)) {
				base.activeIndexBySlot.bottom = Math.floor(r.bottom);
			}
		} else {
			const it = toolIndexInStrip(base.strips.top, legacyActiveTop);
			const ib = toolIndexInStrip(base.strips.bottom, legacyActiveBottom);
			if (it >= 0) base.activeIndexBySlot.top = it;
			if (ib >= 0) base.activeIndexBySlot.bottom = ib;
		}
	} catch {
		/* ignore */
	}
	syncPanelsFromStrips(base);
	clampActiveIndices(base);
	collapseTopToolDockIntoBottom(base);
	syncPanelsFromStrips(base);
	clampActiveIndices(base);
	return base;
}

export function writeToolDockLayout(layout: ToolDockLayout): void {
	collapseTopToolDockIntoBottom(layout);
	syncPanelsFromStrips(layout);
	clampActiveIndices(layout);
	try {
		localStorage.setItem(TOOL_DOCK_KEY, JSON.stringify(layout));
	} catch {
		/* ignore */
	}
}
