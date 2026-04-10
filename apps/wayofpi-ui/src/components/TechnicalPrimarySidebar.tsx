import { ChevronLeft, GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { DockRegionTitleBar } from "./DockRegionTitleBar";

/**
 * Technical shell: primary (left) sidebar frame — title row (grip, label, activity detail, hide) + panel body.
 */
export function TechnicalPrimarySidebar({
	widthPx,
	minWidthPx = 200,
	maxWidthPx = 640,
	activityDetail,
	onHide,
	children,
}: {
	widthPx: number;
	minWidthPx?: number;
	maxWidthPx?: number;
	/** Shown next to the hide control (Explorer, Search, …). */
	activityDetail: string;
	onHide: () => void;
	children: ReactNode;
}) {
	return (
		<div
			className="flex min-h-0 shrink-0 flex-col overflow-hidden border border-[#3c3c3c] bg-[#1e1e1e]"
			style={{
				width: widthPx,
				minWidth: minWidthPx,
				maxWidth: maxWidthPx,
			}}
		>
			<DockRegionTitleBar
				grip={<GripVertical size={14} />}
				label="Primary sidebar"
				trailing={
					<>
						<span className="truncate text-[#6b6b6b]">{activityDetail}</span>
						<button
							type="button"
							title="Hide primary sidebar (Ctrl+B)"
							aria-label="Hide primary sidebar"
							onClick={onHide}
							className="shrink-0 rounded p-0.5 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
						>
							<ChevronLeft size={14} strokeWidth={2} aria-hidden />
						</button>
					</>
				}
				title="Primary sidebar — drag the thick vertical bar to resize"
			/>
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
		</div>
	);
}
