import { Play } from "lucide-react";
import { useState } from "react";
import type { LogRow } from "../hooks/useWayOfPiSession";
import type { UiMode } from "../hooks/useUiMode";
import type { BottomPanelTab } from "../types/technicalShell";

const TABS = ["problems", "output", "tool_log", "terminal"] as const;

const TAB_LABELS: Record<UiMode, Record<(typeof TABS)[number], string>> = {
	technical: {
		problems: "Problems",
		output: "Output",
		tool_log: "Tool Log",
		terminal: "Terminal",
	},
	simple: {
		problems: "Issues",
		output: "Output",
		tool_log: "Activity",
		terminal: "Run",
	},
};

export function BottomPanel({
	uiMode,
	logs,
	activeTab: controlledTab,
	onTabChange,
	onRunPlanned,
	heightPx,
}: {
	uiMode: UiMode;
	logs: LogRow[];
	/** Controlled bottom tab (IDE menus / Run button). */
	activeTab?: BottomPanelTab;
	onTabChange?: (t: BottomPanelTab) => void;
	/** Run (planned) focuses terminal tab and ensures panel visible. */
	onRunPlanned?: () => void;
	/** Resizable dock height (terminal / problems strip). */
	heightPx: number;
}) {
	const [internalTab, setInternalTab] = useState<BottomPanelTab>("tool_log");
	const tab = controlledTab ?? internalTab;
	const setTab = onTabChange ?? setInternalTab;
	const labels = TAB_LABELS[uiMode];

	return (
		<div
			className="flex min-h-[120px] max-h-[560px] shrink-0 flex-col border-t border-[#3c3c3c] bg-[#1e1e1e]"
			style={{ height: heightPx }}
		>
			<div className="flex shrink-0 border-b border-[#3c3c3c] bg-[#1e1e1e] px-4 pt-2 font-mono text-[11px] uppercase tracking-wider">
				{TABS.map((tname) => (
					<button
						key={tname}
						type="button"
						onClick={() => setTab(tname)}
						className={`border-b-2 px-3 pb-2 ${
							tab === tname ? "border-[#ea580c] text-[#cccccc]" : "border-transparent text-[#858585] hover:text-[#cccccc]"
						}`}
					>
						{labels[tname]}
					</button>
				))}
				<div className="ml-auto flex items-center gap-2 pb-2">
					<button
						type="button"
						onClick={() => onRunPlanned?.()}
						className="flex items-center gap-1.5 border border-[#3c3c3c] bg-[#2d2d2d] px-3 py-0.5 text-[#cccccc] hover:bg-[#3c3c3c]"
						title="Open terminal panel (host shell not exposed)"
					>
						<Play size={10} fill="currentColor" className="text-[#89d185]" />
						Run (planned)
					</button>
				</div>
			</div>
			<div className="min-h-0 flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-[12px]">
				{tab === "tool_log" ? (
					<div className="flex flex-col gap-1.5">
						{logs.length === 0 ? (
							<span className="text-[#858585]">No log lines yet.</span>
						) : (
							logs.map((log, idx) => (
								<div key={`${log.time}-${idx}`} className="flex gap-4">
									<span className="w-24 shrink-0 text-[#858585]">[{log.time}]</span>
									<span
										className={`w-16 shrink-0 font-bold ${
											log.level === "INFO"
												? "text-[#ea580c]"
												: log.level === "WARN"
													? "text-[#ce9178]"
													: log.level === "SUCCESS"
														? "text-[#89d185]"
														: "text-[#f14c4c]"
										}`}
									>
										{log.level}
									</span>
									<span className="w-28 shrink-0 text-[#c586c0]">{log.source}</span>
									<span className="text-[#cccccc]">{log.msg}</span>
								</div>
							))
						)}
					</div>
				) : null}
				{tab === "output" ? (
					<div className="text-[#cccccc]">
						Server and client share one origin in dev (Vite proxy). Logs stream over WebSocket.
					</div>
				) : null}
				{tab === "problems" ? (
					<div className="text-[#858585]">No static analyzer wired yet.</div>
				) : null}
				{tab === "terminal" ? (
					<div className="text-[#858585]">
						Host shell is not exposed here by design. Use approvals + Run (planned) for commands.
					</div>
				) : null}
			</div>
		</div>
	);
}
