import { useRef } from "react";
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import type { UiMode } from "../hooks/useUiMode";

function primaryPointerHandlers(
	dedupeRef: MutableRefObject<string | null>,
	key: string,
	action: () => void,
): {
	onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
	onClick: () => void;
} {
	return {
		onPointerDown: (e) => {
			if (!e.isPrimary || e.button !== 0) return;
			dedupeRef.current = key;
			action();
		},
		onClick: () => {
			if (dedupeRef.current === key) {
				dedupeRef.current = null;
				return;
			}
			dedupeRef.current = null;
			action();
		},
	};
}

/** Same control as in the technical `MenuBar` (IDE chrome). */
export function UiModeToggle({
	uiMode,
	onUiModeChange,
}: {
	uiMode: UiMode;
	onUiModeChange: (mode: UiMode) => void;
}) {
	const dedupeRef = useRef<string | null>(null);
	return (
		<div className="flex shrink-0 items-center gap-0.5 rounded border border-[#454545] bg-[#2d2d2d] p-0.5 text-[11px]">
			<button
				type="button"
				{...primaryPointerHandlers(dedupeRef, "ui-simple", () => onUiModeChange("simple"))}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "simple" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Calmer layout and friendly labels"
			>
				Simple
			</button>
			<button
				type="button"
				{...primaryPointerHandlers(dedupeRef, "ui-technical", () => onUiModeChange("technical"))}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "technical" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="IDE-style chrome and technical labels"
			>
				Technical
			</button>
			<button
				type="button"
				{...primaryPointerHandlers(dedupeRef, "ui-claw", () => onUiModeChange("claw"))}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "claw" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Claw roadmap: autonomous-agent shell (same IDE chrome today; docs/WOP_CLAW_MODE_PLAN.md + WOP_CLAW_UI_PLAN.md)"
			>
				Claw
			</button>
			<button
				type="button"
				{...primaryPointerHandlers(dedupeRef, "ui-documenthandler", () => onUiModeChange("documenthandler"))}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "documenthandler" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Chat & Document Explorer: Combined chat interface and file explorer with document preview"
			>
				Docs
			</button>
		</div>
	);
}
