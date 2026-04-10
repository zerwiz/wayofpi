import { X } from "lucide-react";
import type { CSSProperties } from "react";
import type { LogRow } from "../hooks/useWayOfPiSession";
import type { BottomPanelTab } from "../types/technicalShell";
import {
	serializeDockStripEntry,
	parseDockStripEntryJson,
	type DockStripEntry,
	type ToolPanelId,
	type ToolPanelZone,
} from "../utils/technicalLayoutStorage";
import { dataTransferHasType } from "../utils/dataTransferTypes";
import { DockZoneAddMenu, type DockFileActionItem } from "./dockToolAddMenu";
import { StripFilePreview } from "./StripFilePreview";
import { ToolPanelBody } from "./ToolPanelBody";

const TAB_LABELS: Record<ToolPanelId, string> = {
	problems: "Problems",
	output: "Output",
	tool_log: "Tool Log",
	terminal: "Terminal",
};

const DND_TYPE = "application/x-wop-dockstrip-entry";

function entryLabel(e: DockStripEntry): string {
	if (e.type === "tool") return TAB_LABELS[e.id];
	const parts = e.path.split("/");
	return parts[parts.length - 1] || e.path;
}

function entryKey(e: DockStripEntry): string {
	return e.type === "tool" ? `tool:${e.id}` : `file:${e.path}`;
}

export function DockableToolStrip({
	zone,
	heightPx,
	fillVertical,
	className,
	entries,
	activeIndex,
	onActiveIndexChange,
	onSelectFilePath,
	onMoveEntry,
	onCloseEntry,
	onReorderInZone,
	logs,
	dropLabel,
	onAddTool,
	fileActions,
	allowEmpty,
}: {
	zone: ToolPanelZone;
	heightPx?: number;
	fillVertical?: boolean;
	className?: string;
	entries: DockStripEntry[];
	activeIndex: number;
	onActiveIndexChange: (index: number) => void;
	/** When the user activates a file tab, open it in the main editor. */
	onSelectFilePath?: (path: string) => void;
	onMoveEntry: (moving: DockStripEntry, targetZone: ToolPanelZone, before: DockStripEntry | null) => void;
	onCloseEntry: (entry: DockStripEntry) => void;
	onReorderInZone: (moving: DockStripEntry, before: DockStripEntry | null) => void;
	logs: LogRow[];
	dropLabel: string;
	onAddTool: (tab: BottomPanelTab) => void;
	fileActions: DockFileActionItem[];
	allowEmpty?: boolean;
}) {
	const onDragStart = (e: React.DragEvent, entry: DockStripEntry) => {
		e.dataTransfer.setData(DND_TYPE, serializeDockStripEntry(entry));
		e.dataTransfer.effectAllowed = "move";
	};

	const allowDrop = (e: React.DragEvent) => {
		if (dataTransferHasType(e.dataTransfer, DND_TYPE)) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
		}
	};

	const onBarDrop = (e: React.DragEvent, before: DockStripEntry | null) => {
		e.preventDefault();
		const raw = e.dataTransfer.getData(DND_TYPE);
		const moving = parseDockStripEntryJson(raw);
		if (!moving) return;
		if (before && entryKey(moving) === entryKey(before)) return;
		const inThisStrip = entries.some((x) => entryKey(x) === entryKey(moving));
		if (inThisStrip) {
			onReorderInZone(moving, before);
		} else {
			onMoveEntry(moving, zone, before);
		}
	};

	const safeIndex =
		entries.length === 0 ? 0 : Math.min(Math.max(0, activeIndex), entries.length - 1);
	const activeEntry = entries.length > 0 ? entries[safeIndex] : null;

	const showBody = activeEntry;
	if (!showBody && !allowEmpty) return null;

	const edgeBorder = zone === "bottom" ? "border-t" : "border-b";
	const fillRowDock = (zone === "top" || zone === "bottom") && heightPx == null && !fillVertical;
	const outerClass =
		`flex flex-col border-[#3c3c3c] bg-[#1e1e1e] ${edgeBorder} ${
			fillVertical ? "min-h-0 flex-1" : fillRowDock ? "h-full min-h-0 flex-1" : "shrink-0"
		} ${className ?? ""}`.trim();

	const outerStyle: CSSProperties = !fillVertical && heightPx != null ? { height: heightPx } : {};

	return (
		<div className={outerClass} style={outerStyle}>
			<div
				className="flex shrink-0 flex-wrap items-end border-b border-[#3c3c3c] bg-[#1e1e1e] px-2 pt-1 font-mono text-[11px] uppercase tracking-wider"
				onDragOver={allowDrop}
				onDrop={(e) => onBarDrop(e, null)}
				title={dropLabel}
			>
				<DockZoneAddMenu zone={zone} onAddTool={onAddTool} fileActions={fileActions} />
				{entries.map((entry, idx) => (
					<div key={entryKey(entry)} className="flex items-stretch" onDragOver={allowDrop}>
						<div
							className={`flex items-center border-b-2 pb-2 pt-1 ${
								safeIndex === idx
									? "border-[#ea580c] text-[#cccccc]"
									: "border-transparent text-[#858585]"
							}`}
						>
							<button
								type="button"
								draggable
								onDragStart={(e) => onDragStart(e, entry)}
								onDragOver={allowDrop}
								onDrop={(e) => onBarDrop(e, entry)}
								onClick={() => {
									onActiveIndexChange(idx);
									if (entry.type === "file") onSelectFilePath?.(entry.path);
								}}
								className="flex max-w-[200px] items-center gap-1 truncate px-2 hover:text-[#cccccc]"
								title={`${entryLabel(entry)} — drag to other dock or reorder`}
							>
								<span className="cursor-grab shrink-0 text-[#555] active:cursor-grabbing" aria-hidden>
									⋮⋮
								</span>
								<span className="truncate normal-case tracking-normal">{entryLabel(entry)}</span>
							</button>
							<button
								type="button"
								className="shrink-0 rounded px-0.5 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#f14c4c]"
								title={entry.type === "tool" ? "Close panel" : "Close tab"}
								onClick={() => onCloseEntry(entry)}
							>
								<X size={11} strokeWidth={2.5} />
							</button>
						</div>
						{idx < entries.length - 1 ? (
							<span className="mx-0.5 w-px self-stretch bg-[#3c3c3c]" aria-hidden />
						) : null}
					</div>
				))}
			</div>
			<div
				className={
					showBody?.type === "tool" && showBody.id === "terminal"
						? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
						: showBody
							? "min-h-0 flex-1 overflow-hidden"
							: "flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 font-mono text-[11px] text-[#858585]"
				}
			>
				{showBody ? (
					showBody.type === "tool" ? (
						<ToolPanelBody tab={showBody.id} logs={logs} />
					) : (
						<StripFilePreview path={showBody.path} />
					)
				) : (
					<span className="text-center">Use + to add a file or panel to this dock.</span>
				)}
			</div>
		</div>
	);
}
