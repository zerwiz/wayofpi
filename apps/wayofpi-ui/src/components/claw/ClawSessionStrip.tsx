/**
 * Claw chat — top bar: active session hint, new session, and .claw/ file panel toggle.
 *
 * Open sessions are listed in **ClawSessionSidebar** to the right of the chat.
 */
import { MessageSquare, Plus } from "lucide-react";
import type { ChatSessionTab } from "../../hooks/useWayOfPiSession";

export function ClawSessionStrip({
	tabs,
	activeTabId,
	onNew,
	showClawFiles,
	onToggleClawFiles,
	dark,
}: {
	tabs: ChatSessionTab[];
	activeTabId: string;
	onNew: () => void;
	/** Whether the right file panel is currently open. */
	showClawFiles: boolean;
	onToggleClawFiles: () => void;
	dark: boolean;
}) {
	const stripBg = dark ? "bg-[#1a1a1a] border-[#252526]" : "bg-[#f0f0f0] border-[#e5e5e5]";
	const iconBtnC = dark
		? "flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[10px] font-semibold transition-colors text-[#585858] hover:bg-[#252526] hover:text-[#aaaaaa]"
		: "flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[10px] font-semibold transition-colors text-[#888888] hover:bg-white hover:text-[#555555]";
	const filesBtnActive = dark
		? "bg-[#ea580c]/15 text-[#fb923c]"
		: "bg-[#ea580c]/10 text-[#ea580c]";
	const activeLabel = tabs.find((t) => t.id === activeTabId)?.label ?? "Chat";
	const hintC = dark ? "text-[#858585]" : "text-[#888888]";
	const titleC = dark ? "text-[#d4d4d4]" : "text-[#222222]";

	return (
		<div className={`flex min-h-0 shrink-0 items-stretch border-b ${stripBg}`}>
			<div
				className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-3 py-2 ${hintC}`}
				title={activeLabel}
			>
				<MessageSquare size={14} className="shrink-0 opacity-70" aria-hidden />
				<span className={`min-w-0 truncate text-[12px] font-semibold ${titleC}`}>{activeLabel}</span>
			</div>

			{/* Right controls */}
			<div className={`flex shrink-0 items-center gap-1 px-2 border-l ${dark ? "border-[#252526]" : "border-[#e5e5e5]"}`}>
				<button
					type="button"
					onClick={onNew}
					title="New session"
					className={iconBtnC}
				>
					<Plus size={12} />
					<span>New</span>
				</button>
				<button
					type="button"
					onClick={onToggleClawFiles}
					title="Toggle Workspace file panel"
					className={`${iconBtnC} ${showClawFiles ? filesBtnActive : ""}`}
				>
					<span>Workspace</span>
				</button>
			</div>
		</div>
	);
}
