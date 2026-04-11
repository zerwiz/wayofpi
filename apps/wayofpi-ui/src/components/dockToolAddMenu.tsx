import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BottomPanelTab } from "../types/technicalShell";
import { PANEL_BAND_CHROME, WORKSPACE_PANE_MENU_HEADING, type PanelBand } from "../utils/panelDockLayout";

export const DOCK_ADD_TOOL_ITEMS: { tab: BottomPanelTab; label: string; detail?: string }[] = [
	{ tab: "terminal", label: "Terminal", detail: "Shell / host (when enabled)" },
	{ tab: "agent_chat", label: "Agent chat", detail: "Session chat in this editor pane" },
	{ tab: "agent_team", label: "Team pulse", detail: "Pi agent-team roster (from teams.yaml)" },
	{ tab: "tool_log", label: "Tool log", detail: "Server / chat activity" },
	{ tab: "output", label: "Output", detail: "Structured output" },
	{ tab: "problems", label: "Problems", detail: "Diagnostics (placeholder)" },
];

export type DockFileActionItem = { label: string; detail?: string; run: () => void };

function bandMenuHeading(b: PanelBand): string {
	return PANEL_BAND_CHROME[b].bandLabel;
}

function resolveMenuHeading(band: PanelBand | undefined, menuHeading: string | undefined): string {
	if (menuHeading) return menuHeading;
	if (band != null) return bandMenuHeading(band);
	return WORKSPACE_PANE_MENU_HEADING;
}

/** + menu: file actions and tool panels (single workspace stack or legacy band). */
export function DockZoneAddMenu({
	band,
	menuHeading,
	onAddTool,
	fileActions,
	rootClassName,
}: {
	/** Legacy horizontal band; omit when using {@link menuHeading} for the main workspace pane. */
	band?: PanelBand;
	/** e.g. {@link WORKSPACE_PANE_MENU_HEADING} for the unified stack. */
	menuHeading?: string;
	onAddTool: (tab: BottomPanelTab) => void;
	fileActions: DockFileActionItem[];
	/** Override wrapper (e.g. unified dock tab row alignment). */
	rootClassName?: string;
}) {
	const heading = resolveMenuHeading(band, menuHeading);
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const close = (e: MouseEvent) => {
			if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [open]);

	const run = (fn: () => void) => {
		fn();
		setOpen(false);
	};

	return (
		<div ref={rootRef} className={rootClassName ?? "relative ml-1 shrink-0"}>
			<button
				type="button"
				title={`Add file or view — ${heading} (terminal, new file, …)`}
				aria-label={`Add tab — ${heading}`}
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
				className="flex h-8 w-8 items-center justify-center rounded border border-transparent text-[#858585] hover:border-[#3c3c3c] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
			>
				<Plus size={16} strokeWidth={2} />
			</button>
			{open ? (
				<ul
					className="absolute left-0 top-full z-[8000] mt-0.5 max-h-[min(70vh,520px)] min-w-[240px] list-none overflow-y-auto rounded border border-[#454545] bg-[#252526] py-1 shadow-xl"
					role="menu"
				>
					<li className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#858585]">
						{heading}
					</li>
					{fileActions.length > 0 ? (
						<>
							<li className="px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#6b6b6b]">
								Files
							</li>
							{fileActions.map((a) => (
								<li key={a.label} role="none">
									<button
										type="button"
										role="menuitem"
										className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[13px] text-[#cccccc] hover:bg-[#2a2d2e]"
										onClick={() => run(a.run)}
									>
										<span>{a.label}</span>
										{a.detail ? (
											<span className="font-mono text-[11px] text-[#858585]">{a.detail}</span>
										) : null}
									</button>
								</li>
							))}
							<li className="my-1 border-t border-[#3c3c3c]" role="separator" />
						</>
					) : null}
					<li className="px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#6b6b6b]">
						Views
					</li>
					{DOCK_ADD_TOOL_ITEMS.map(({ tab, label, detail }) => (
						<li key={tab} role="none">
							<button
								type="button"
								role="menuitem"
								className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[13px] text-[#cccccc] hover:bg-[#2a2d2e]"
								onClick={() => run(() => onAddTool(tab))}
							>
								<span>{label}</span>
								{detail ? <span className="font-mono text-[11px] text-[#858585]">{detail}</span> : null}
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
