import { FileCode2, Save, X } from "lucide-react";
import type { FormEvent } from "react";
import { forwardRef } from "react";
import type { WorkspaceEditorRef } from "../../types/workspaceEditor";
import type { FilePreview } from "../../types/workspaceFile";
import { WorkspaceTextBuffer } from "../WorkspaceTextBuffer";

export const SimpleFilePanel = forwardRef<
	WorkspaceEditorRef,
	{
		path: string;
		content: string;
		onChange: (next: string) => void;
		filePreview: FilePreview | null;
		loading: boolean;
		error: string | null;
		dirty: boolean;
		onSave: () => void | Promise<void>;
		onClose: () => void;
		onCursor?: (line: number, col: number) => void;
		appearanceDark: boolean;
		onUndoRedoStackChange?: () => void;
		onSelectionPrefsChange?: () => void;
		onFindInFiles?: () => void;
		onReplaceInFiles?: () => void;
		/** `besideChat` = chat left / editor right column (no stacked header height cap). */
		columnLayout?: "stacked" | "besideChat";
	}
>(function SimpleFilePanel(
	{
		path,
		content,
		onChange,
		filePreview,
		loading,
		error,
		dirty,
		onSave,
		onClose,
		onCursor,
		appearanceDark,
		onUndoRedoStackChange,
		onSelectionPrefsChange,
		onFindInFiles,
		onReplaceInFiles,
		columnLayout = "stacked",
	},
	ref,
) {
	const fileName = path.split("/").pop() ?? path;

	const shell = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";
	const header = appearanceDark ? "border-[#3c3c3c] bg-[#1e1e1e]/90" : "border-[#e5e5e5] bg-[#ececec]";
	const title = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const pathMuted = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const btnGhost =
		appearanceDark
			? "rounded-lg px-3 py-1.5 text-xs font-semibold text-[#cccccc] hover:bg-[#3c3c3c]"
			: "rounded-lg px-3 py-1.5 text-xs font-semibold text-[#616161] hover:bg-[#e5e5e5]";
	const btnPrimary =
		appearanceDark
			? "inline-flex items-center gap-1.5 rounded-lg bg-[#ea580c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#c2410c] disabled:opacity-40"
			: "inline-flex items-center gap-1.5 rounded-lg bg-[#ea580c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#c2410c] disabled:opacity-40";
	const bodyBg = appearanceDark ? "bg-[#1e1e1e]" : "bg-[#f3f3f3]";
	const lineNums = appearanceDark ? "text-[#858585]" : "text-[#858585]";
	const textArea = appearanceDark
		? "text-[13px] leading-relaxed text-[#cccccc] selection:bg-[#9a3412]"
		: "text-[13px] leading-relaxed text-[#333333] selection:bg-[#fed7aa]/40";

	const submitSave = (e: FormEvent) => {
		e.preventDefault();
		if (!dirty || loading || filePreview) return;
		void onSave();
	};

	const outer =
		columnLayout === "besideChat"
			? `flex min-h-0 flex-1 flex-col overflow-hidden ${shell}`
			: `flex max-h-[min(42vh,360px)] min-h-[160px] shrink-0 flex-col overflow-hidden border-b ${shell}`;

	const fileIconClass = appearanceDark ? "text-[#fb923c]" : "text-[#ea580c]";

	return (
		<div className={outer}>
			<div className={`flex shrink-0 items-center gap-3 border-b px-4 py-3 ${header}`}>
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<div
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
							appearanceDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#e5e5e5] bg-white"
						}`}
					>
						<FileCode2 size={20} className={fileIconClass} />
					</div>
					<div className="min-w-0 flex-1">
						<div className={`truncate text-sm font-bold ${title}`}>{fileName}</div>
						<div className={`truncate font-mono text-[11px] ${pathMuted}`} title={path}>
							{path}
						</div>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{dirty && !filePreview ? (
						<form onSubmit={submitSave}>
							<button type="submit" disabled={loading} className={btnPrimary}>
								<Save size={14} />
								Save
							</button>
						</form>
					) : null}
					<button type="button" onClick={onClose} className={`inline-flex items-center gap-1 ${btnGhost}`}>
						<X size={14} />
						Close
					</button>
				</div>
			</div>

			<div className={`flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 ${bodyBg}`}>
				{filePreview?.kind === "image" ? (
					<div className="flex min-h-0 flex-1 overflow-auto">
						<img
							src={filePreview.src}
							alt=""
							className="mx-auto block h-auto max-w-full object-contain [image-rendering:auto]"
							loading="lazy"
							decoding="async"
						/>
					</div>
				) : filePreview?.kind === "binary" ? (
					<div className={`flex flex-1 overflow-auto p-2 text-sm leading-relaxed ${pathMuted}`}>
						<div className="max-w-md">
							<p className={`mb-1 font-semibold ${title}`}>Binary file</p>
							<p>
								Type <span className={appearanceDark ? "text-[#fed7aa]" : "text-[#c2410c]"}>{filePreview.mimeType}</span>.
								Open it externally or from the workspace folder on disk.
							</p>
						</div>
					</div>
				) : (
					<WorkspaceTextBuffer
						ref={ref}
						path={path}
						content={content}
						onChange={onChange}
						loading={loading}
						error={error}
						onCursor={onCursor}
						wordWrap
						scrollClassName="font-mono"
						lineGutterClassName={`w-9 py-1 pr-2 font-mono text-[12px] ${lineNums}`}
						textareaClassName={`py-1 pr-2 ${textArea}`}
						findBarClassName={`shrink-0 border-t ${appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]"}`}
						statusLoadingClassName={`p-4 text-sm ${pathMuted}`}
						statusErrorClassName="p-4 text-sm text-red-500"
						onUndoRedoStackChange={onUndoRedoStackChange}
						onSelectionPrefsChange={onSelectionPrefsChange}
						onFindInFiles={onFindInFiles}
						onReplaceInFiles={onReplaceInFiles}
					/>
				)}
			</div>
		</div>
	);
});
