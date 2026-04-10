import { useCallback, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Draggable splitter between dock regions (Zed / VS Code–style resize).
 * Does not persist — parent updates layout state and may write `localStorage` on change.
 */
export function DockSplitHandle({
	orientation,
	onDelta,
	ariaLabel,
	className,
}: {
	orientation: "vertical" | "horizontal";
	/** Called with incremental pointer delta since last move (pixels). */
	onDelta: (dx: number, dy: number) => void;
	ariaLabel: string;
	/** Merged with default track colors (e.g. Simple UI light theme). */
	className?: string;
}) {
	const onPointerDown = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			const el = e.currentTarget;
			el.setPointerCapture(e.pointerId);
			let lx = e.clientX;
			let ly = e.clientY;
			const move = (ev: PointerEvent) => {
				onDelta(ev.clientX - lx, ev.clientY - ly);
				lx = ev.clientX;
				ly = ev.clientY;
			};
			const up = (ev: PointerEvent) => {
				if (el.hasPointerCapture(ev.pointerId)) {
					el.releasePointerCapture(ev.pointerId);
				}
				window.removeEventListener("pointermove", move);
				window.removeEventListener("pointerup", up);
				window.removeEventListener("pointercancel", up);
			};
			window.addEventListener("pointermove", move);
			window.addEventListener("pointerup", up);
			window.addEventListener("pointercancel", up);
		},
		[onDelta],
	);

	const vertical = orientation === "vertical";

	const base =
		vertical
			? "group relative z-10 w-2 shrink-0 cursor-col-resize bg-[#2d2d2d] hover:bg-[#ea580c]/40 active:bg-[#ea580c]/60"
			: "group relative z-10 h-2 shrink-0 cursor-row-resize bg-[#2d2d2d] hover:bg-[#ea580c]/40 active:bg-[#ea580c]/60";

	return (
		<div
			role="separator"
			aria-orientation={vertical ? "vertical" : "horizontal"}
			aria-label={ariaLabel}
			title={ariaLabel}
			onPointerDown={onPointerDown}
			className={className ? `${base} ${className}` : base}
		>
			<span className="sr-only">{ariaLabel}</span>
		</div>
	);
}
