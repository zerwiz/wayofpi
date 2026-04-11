import { X } from "lucide-react";
import { MIT_LICENSE_TEXT } from "../constants/mitLicenseText";

async function openLearnUrl(href: string): Promise<void> {
	try {
		if (typeof window !== "undefined" && window.wopShell?.openExternalUrl) {
			await window.wopShell.openExternalUrl(href);
			return;
		}
	} catch {
		/* fall through */
	}
	window.open(href, "_blank", "noopener,noreferrer");
}

export function MitLicenseModal({
	open,
	onDismiss,
	repoLicenseUrl,
}: {
	open: boolean;
	onDismiss: () => void;
	/** e.g. GitHub **LICENSE** in default branch */
	repoLicenseUrl: string;
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
				className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#454545] bg-[#252526] text-[#cccccc] shadow-2xl"
				role="dialog"
				aria-labelledby="mit-license-title"
				aria-modal="true"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] px-4 py-3">
					<h2 id="mit-license-title" className="text-[15px] font-semibold text-white">
						MIT License
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
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
					<pre className="m-0 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#d4d4d4]">
						{MIT_LICENSE_TEXT}
					</pre>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#3c3c3c] px-4 py-3">
					<a
						href={repoLicenseUrl}
						target="_blank"
						rel="noopener noreferrer"
						title={repoLicenseUrl}
						className="inline-flex rounded border border-[#454545] px-3 py-1.5 text-[12px] text-[#cccccc] no-underline hover:bg-[#2a2d2e]"
						onClick={(e) => {
							e.preventDefault();
							void openLearnUrl(repoLicenseUrl);
						}}
					>
						Open LICENSE in repository
					</a>
					<button
						type="button"
						onClick={onDismiss}
						className="rounded bg-[#007acc] px-4 py-2 text-[13px] text-white hover:bg-[#006bb3]"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
