import { GripHorizontal } from "lucide-react";
import type { ComponentProps } from "react";
import type { HorizontalToolDockSlot } from "../utils/technicalLayoutStorage";
import { HORIZONTAL_TOOL_DOCK_UI } from "../utils/technicalLayoutStorage";
import { DockableToolStrip } from "./DockableToolStrip";
import { DockRegionTitleBar } from "./DockRegionTitleBar";

type StripProps = Omit<ComponentProps<typeof DockableToolStrip>, "zone">;

/**
 * One **horizontal tool dock** band. Top and bottom rows use this same component; only {@link slot} (placement) differs.
 */
export function UnifiedHorizontalDock({
	slot,
	bandHeightPx,
	...stripProps
}: StripProps & {
	slot: HorizontalToolDockSlot;
	bandHeightPx: number;
}) {
	const ui = HORIZONTAL_TOOL_DOCK_UI[slot];
	return (
		<div
			className="flex shrink-0 flex-col overflow-hidden bg-[#1e1e1e]"
			style={{ height: bandHeightPx, minHeight: 120 }}
		>
			<DockRegionTitleBar
				grip={<GripHorizontal size={14} className="text-[#555]" aria-hidden />}
				label={ui.bandLabel}
				title={`${ui.bandTitle} — drag tool tabs between bands (same dock system)`}
			/>
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<DockableToolStrip zone={slot} {...stripProps} />
			</div>
		</div>
	);
}
