import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * In-app path entry for new workspace files. Electron’s sandboxed renderer often does not show
 * `window.prompt`, so the dock “New file” flow must not rely on it.
 */
export function NewWorkspaceFileModal({
	open,
	defaultPath,
	initialContent,
	onDismiss,
	onCreate,
}: {
	open: boolean;
	defaultPath: string;
	/** Written after create when user picked a template (Markdown, JSON, …). */
	initialContent?: string;
	onDismiss: () => void;
	onCreate: (relativePath: string, initialContent?: string) => void;
}) {
	const [value, setValue] = useState(defaultPath);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!open) return;
		setValue(defaultPath);
		const id = requestAnimationFrame(() => {
			const el = inputRef.current;
			if (!el) return;
			el.focus();
			el.select();
		});
		return () => cancelAnimationFrame(id);
	}, [open, defaultPath]);

	if (!open) return null;

	const submit = () => {
		const t = value.trim();
		if (!t) return;
		onCreate(t, initialContent);
	};

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
				aria-labelledby="new-ws-file-title"
				aria-modal="true"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-[#3c3c3c] px-4 py-3">
					<h2 id="new-ws-file-title" className="text-[15px] font-semibold">
						New file
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
				<div className="flex flex-col gap-3 px-4 py-4">
					<p className="text-[12px] leading-relaxed text-[#858585]">
						Path relative to the workspace (same as the file tree). You can include folders, e.g.{" "}
						<code className="text-[#c586c0]">docs/notes.md</code>.
					</p>
					<input
						ref={inputRef}
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								submit();
							}
							if (e.key === "Escape") {
								e.preventDefault();
								onDismiss();
							}
						}}
						className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 font-mono text-[13px] text-[#cccccc] outline-none focus:border-[#0e639c]"
						autoComplete="off"
						spellCheck={false}
					/>
					<div className="flex justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={onDismiss}
							className="rounded border border-[#3c3c3c] bg-[#3c3c3c] px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#4a4a4a]"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={submit}
							className="rounded bg-[#0e639c] px-3 py-1.5 text-[13px] text-white hover:bg-[#1177bb]"
						>
							Create
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
