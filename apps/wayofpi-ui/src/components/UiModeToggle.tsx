import type { UiMode } from "../hooks/useUiMode";

/** Same control as in the technical `MenuBar` (IDE chrome). */
export function UiModeToggle({
	uiMode,
	onUiModeChange,
}: {
	uiMode: UiMode;
	onUiModeChange: (mode: UiMode) => void;
}) {
	return (
		<div className="flex shrink-0 items-center gap-1 rounded border border-[#454545] bg-[#2d2d2d] p-0.5 text-[11px]">
			<button
				type="button"
				onClick={() => onUiModeChange("simple")}
				className={`rounded px-2 py-0.5 transition-colors ${
					uiMode === "simple" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Calmer layout and friendly labels"
			>
				Simple
			</button>
			<button
				type="button"
				onClick={() => onUiModeChange("technical")}
				className={`rounded px-2 py-0.5 transition-colors ${
					uiMode === "technical" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="IDE-style chrome and technical labels"
			>
				Technical
			</button>
		</div>
	);
}
