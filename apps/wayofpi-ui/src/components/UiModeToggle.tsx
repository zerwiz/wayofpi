import type { UiMode } from "../hooks/useUiMode";
import { FileText } from "lucide-react";

/** Same control as in the technical `MenuBar` (IDE chrome). */
export function UiModeToggle({
	uiMode,
	onUiModeChange,
}: {
	uiMode: UiMode;
	onUiModeChange: (mode: UiMode) => void;
}) {
	return (
		<div className="flex shrink-0 items-center gap-0.5 rounded border border-[#454545] bg-[#2d2d2d] p-0.5 text-[11px]">
			<button
				type="button"
				onClick={() => onUiModeChange("simple")}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "simple" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Calmer layout and friendly labels"
			>
				Simple
			</button>
			<button
				type="button"
				onClick={() => onUiModeChange("technical")}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "technical" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="IDE-style chrome and technical labels"
			>
				Technical
			</button>
			<button
				type="button"
				onClick={() => onUiModeChange("claw")}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "claw" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Claw roadmap: autonomous-agent shell (same IDE chrome today; docs/WOP_CLAW_MODE_PLAN.md + WOP_CLAW_UI_PLAN.md)"
			>
				Claw
			</button>
			<button
				type="button"
				onClick={() => onUiModeChange("docs")}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "docs" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Docs mode: 3-panel layout with file tree, chat, and preview"
			>
				<FileText size={12} />
				Docs
			</button>
		</div>
	);
}
