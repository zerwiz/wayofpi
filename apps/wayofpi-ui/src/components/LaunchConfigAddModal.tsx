import { X } from "lucide-react";
import {
	LAUNCH_SNIPPET_LABELS,
	LAUNCH_SNIPPET_ORDER,
	type LaunchSnippetId,
} from "../utils/launchJsonMutate";

/**
 * Cursor/VS Code-style picker: append a template to **`.vscode/launch.json`**.
 */
export function LaunchConfigAddModal({
	open,
	onDismiss,
	onPick,
}: {
	open: boolean;
	onDismiss: () => void;
	onPick: (id: LaunchSnippetId) => void;
}) {
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 p-4"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onDismiss();
			}}
		>
			<div
				className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-[#454545] bg-[#252526] text-[#cccccc] shadow-2xl"
				role="dialog"
				aria-labelledby="launch-add-title"
				aria-modal="true"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-[#3c3c3c] px-4 py-3">
					<h2 id="launch-add-title" className="text-[15px] font-semibold text-white">
						Add configuration…
					</h2>
					<button
						type="button"
						onClick={onDismiss}
						className="rounded p-1 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>
				<div className="px-4 py-3">
					<p className="mb-3 text-[12px] leading-relaxed text-[#858585]">
						Chooses a template like Cursor / VS Code and appends one entry to{" "}
						<code className="text-[#9cdcfe]">.vscode/launch.json</code>, then opens it in the editor. Install matching
						debuggers in Cursor (e.g. Python <strong className="text-[#cccccc]">debugpy</strong>, Bun extension) if
						needed.
					</p>
					<ul className="m-0 list-none space-y-1 p-0">
						{LAUNCH_SNIPPET_ORDER.map((id) => (
							<li key={id}>
								<button
									type="button"
									className="block w-full rounded border border-transparent px-3 py-2.5 text-left text-[13px] text-[#cccccc] hover:border-[#007acc]/40 hover:bg-[#2a2d2e]"
									onClick={() => onPick(id)}
								>
									{LAUNCH_SNIPPET_LABELS[id]}
								</button>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
