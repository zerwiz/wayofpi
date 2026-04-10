import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BottomPanelTab } from "../types/technicalShell";
import { HORIZONTAL_TOOL_DOCK_UI, type ToolPanelZone } from "../utils/technicalLayoutStorage";

export const DOCK_ADD_TOOL_ITEMS: { tab: BottomPanelTab; label: string; detail?: string }[] = [
	{ tab: "terminal", label: "Terminal", detail: "Shell / host (when enabled)" },
	{ tab: "tool_log", label: "Tool log", detail: "Server / chat activity" },
	{ tab: "output", label: "Output", detail: "Structured output" },
	{ tab: "problems", label: "Problems", detail: "Diagnostics (placeholder)" },
];

export type DockFileActionItem = { label: string; detail?: string; run: () => void };

function zoneTitle(z: ToolPanelZone): string {
	return HORIZONTAL_TOOL_DOCK_UI[z].bandTitle;
}

/** + menu: file actions and tool panels for this dock band only. */
export function DockZoneAddMenu({
	zone,
	onAddTool,
	fileActions,
}: {
	zone: ToolPanelZone;
	onAddTool: (tab: BottomPanelTab) => void;
	fileActions: DockFileActionItem[];
}) {
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
		<div ref={rootRef} className="relative ml-1 shrink-0">
			<button
				type="button"
				title={`Add file or panel to ${zoneTitle(zone)}`}
				aria-label={`Add to ${zone} tool dock`}
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
				className="flex h-7 w-7 items-center justify-center rounded text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
			>
				<Plus size={16} strokeWidth={2} />
			</button>
			{open ? (
				<ul
					className="absolute left-0 top-full z-[500] mt-0.5 max-h-[min(70vh,520px)] min-w-[240px] list-none overflow-y-auto rounded border border-[#454545] bg-[#252526] py-1 shadow-xl"
					role="menu"
				>
					<li className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#858585]">
						{zoneTitle(zone)}
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
						Panels
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
