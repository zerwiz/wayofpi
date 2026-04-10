import { FileCode2, GitCompare, MessageSquare, Plus, X } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { WorkspaceEditorRef } from "../types/workspaceEditor";
import type { FilePreview } from "../types/workspaceFile";
import { countChangeHunks } from "../utils/fileDiffHunks";
import { FileChangeReview } from "./FileChangeReview";
import { WorkspaceTextBuffer } from "./WorkspaceTextBuffer";

/** Virtual path for the technical “no file open” buffer — same editor chrome as a real file. */
const TECHNICAL_WELCOME_VIRTUAL_PATH = ".wop/getting-started.md";

const TECHNICAL_WELCOME_DOC = `# Getting started

No file is open in this editor column. This pane uses the **same layout** as an open file (tab, breadcrumbs, text buffer).

- Use **+** in the tab bar to open a file, or choose a file in the Explorer.
- **Session** / agent chat: show or dock the panel from the tab bar or View menu.

This document is read-only; open a workspace file to edit.
`;

/** Technical shell: actions for this editor dock only (file open + optional agent panel). */
export type TechnicalEditorChrome = {
	/** Open a file into this editor (workspace path prompt). */
	onOpenFile: () => void;
	/** Show the agent / session chat panel if hidden. */
	onShowAgentChat?: () => void;
};

export type EditorPanelProps = {
	path: string | null;
	content: string;
	onChange: (next: string) => void;
	loading: boolean;
	error: string | null;
	dirty: boolean;
	/** Last saved content on disk (from `useFileEditor.lastPersistedContent`); enables diff review. */
	diskBaseline?: string;
	onSave: () => void | Promise<void>;
	onCursor?: (line: number, col: number) => void;
	/** Tighter typography (Technical UI). */
	compact?: boolean;
	/** Simple UI: no sidebar — explain how to open files. */
	showExplorerHint?: boolean;
	onOpenWorkspace?: () => void;
	/** Technical UI: + opens a file in this editor; optional agent control. */
	technicalEditorChrome?: TechnicalEditorChrome;
	/** View → Appearance → Word wrap */
	wordWrap?: boolean;
	/** View → Appearance → Toggle breadcrumbs (path under tab bar). */
	showBreadcrumbs?: boolean;
	/** Ctrl+Shift+F from editor — workspace search. */
	onFindInFiles?: () => void;
	/** Ctrl+Shift+H from editor — workspace replace. */
	onReplaceInFiles?: () => void;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	/** Close this editor column (multi-file main area). */
	onClosePanel?: () => void;
	/** Whether this column is the focused main editor (tab chrome). */
	isActiveColumn?: boolean;
	/** Non-text file (image preview or binary notice); editor buffer is not used. */
	filePreview?: FilePreview | null;
};

export const EditorPanel = forwardRef<WorkspaceEditorRef, EditorPanelProps>(function EditorPanel(
	{
		path,
		content,
		onChange,
		loading,
		error,
		dirty,
		diskBaseline,
		onSave,
		onCursor,
		compact = true,
		showExplorerHint = false,
		onOpenWorkspace,
		technicalEditorChrome,
		wordWrap = true,
		showBreadcrumbs = true,
		onFindInFiles,
		onReplaceInFiles,
		onUndoRedoStackChange,
		onSelectionPrefsChange,
		onClosePanel,
		isActiveColumn = true,
		filePreview = null,
	},
	ref,
) {
	const bufferRef = useRef<WorkspaceEditorRef | null>(null);
	const [changeReviewOpen, setChangeReviewOpen] = useState(false);
	const reviewRootRef = useRef<HTMLDivElement>(null);

	const diffHunkCount = useMemo(() => {
		if (!dirty || diskBaseline === undefined || !path) return 0;
		return countChangeHunks(diskBaseline, content);
	}, [dirty, diskBaseline, content, path]);

	useEffect(() => {
		if (!dirty) setChangeReviewOpen(false);
	}, [dirty]);

	useEffect(() => {
		if (!changeReviewOpen) return;
		const t = window.setTimeout(() => reviewRootRef.current?.focus(), 50);
		return () => window.clearTimeout(t);
	}, [changeReviewOpen]);

	useImperativeHandle(ref, () => ({
		undo: () => bufferRef.current?.undo() ?? false,
		redo: () => bufferRef.current?.redo() ?? false,
		cut: () => bufferRef.current?.cut(),
		copy: () => bufferRef.current?.copy(),
		paste: () => bufferRef.current?.paste() ?? Promise.resolve(),
		find: () => bufferRef.current?.find(),
		replace: () => bufferRef.current?.replace(),
		toggleLineComment: () => bufferRef.current?.toggleLineComment(),
		toggleBlockComment: () => bufferRef.current?.toggleBlockComment(),
		emmetExpand: () => bufferRef.current?.emmetExpand(),
		canUndo: () => bufferRef.current?.canUndo() ?? false,
		canRedo: () => bufferRef.current?.canRedo() ?? false,
		selectAll: () => bufferRef.current?.selectAll(),
		expandSelection: () => bufferRef.current?.expandSelection(),
		shrinkSelection: () => bufferRef.current?.shrinkSelection(),
		copyLineUp: () => bufferRef.current?.copyLineUp(),
		copyLineDown: () => bufferRef.current?.copyLineDown(),
		moveLineUp: () => bufferRef.current?.moveLineUp(),
		moveLineDown: () => bufferRef.current?.moveLineDown(),
		duplicateSelection: () => bufferRef.current?.duplicateSelection(),
		addNextOccurrence: () => bufferRef.current?.addNextOccurrence(),
		addPreviousOccurrence: () => bufferRef.current?.addPreviousOccurrence(),
		selectAllOccurrences: () => bufferRef.current?.selectAllOccurrences(),
		getCtrlClickMultiCursor: () => bufferRef.current?.getCtrlClickMultiCursor() ?? false,
		setCtrlClickMultiCursor: (v: boolean) => bufferRef.current?.setCtrlClickMultiCursor(v),
		getColumnSelectionMode: () => bufferRef.current?.getColumnSelectionMode() ?? false,
		setColumnSelectionMode: (v: boolean) => bufferRef.current?.setColumnSelectionMode(v),
		getSelectedText: () => bufferRef.current?.getSelectedText() ?? "",
		goToLineColumn: (line: number, column?: number) => bufferRef.current?.goToLineColumn(line, column),
		goToMatchingBracket: () => bufferRef.current?.goToMatchingBracket(),
	}));

	const fileName = path?.split("/").pop() ?? "no file";
	const bodyText = compact ? "text-[14px] leading-relaxed" : "text-[15px] leading-relaxed";

	return (
		<div className="flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
			<div className="relative z-20 flex h-9 shrink-0 items-center gap-0 bg-[#252526]">
				<div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 items-center overflow-x-auto">
					{path ? (
						<div
							className={`group flex min-w-[120px] cursor-pointer items-center border-r border-t border-r-[#2d2d2d] px-3 ${
								isActiveColumn
									? "border-[#ea580c] bg-[#1e1e1e]"
									: "border-transparent border-b border-b-[#252526] bg-[#2d2d2d] text-[#858585]"
							}`}
						>
							<FileCode2 size={14} className="mr-2 text-[#519aba]" />
							<span className={`text-[13px] ${isActiveColumn ? "text-white" : "text-[#cccccc]"}`}>
								{fileName}
							</span>
							{dirty ? (
								<span className="ml-2 font-mono text-[10px] text-[#e2c08d]" title="Modified (unsaved)">
									M{diffHunkCount > 0 ? ` · ${diffHunkCount}Δ` : ""}
								</span>
							) : null}
							{onClosePanel ? (
								<button
									type="button"
									title="Close editor"
									aria-label="Close editor"
									className="ml-auto rounded p-0.5 text-[#858585] opacity-0 hover:bg-[#3c3c3c] hover:text-[#cccccc] group-hover:opacity-100"
									onClick={(e) => {
										e.stopPropagation();
										onClosePanel();
									}}
								>
									<X size={14} />
								</button>
							) : (
								<X size={14} className="ml-auto text-[#858585] opacity-0 group-hover:opacity-100" aria-hidden />
							)}
						</div>
					) : technicalEditorChrome ? (
						<div
							className={`group flex min-w-[120px] cursor-default items-center border-r border-t border-r-[#2d2d2d] px-3 ${
								isActiveColumn
									? "border-[#ea580c] bg-[#1e1e1e]"
									: "border-transparent border-b border-b-[#252526] bg-[#2d2d2d] text-[#858585]"
							}`}
						>
							<FileCode2 size={14} className="mr-2 text-[#519aba]" />
							<span className={`text-[13px] ${isActiveColumn ? "text-white" : "text-[#cccccc]"}`}>
								Getting started
							</span>
							<X size={14} className="ml-auto text-[#858585] opacity-0 group-hover:opacity-100" aria-hidden />
						</div>
					) : (
						<div className="flex items-center px-3 text-[13px] text-[#858585]">No file open</div>
					)}
				</div>
				{dirty && path && !loading && !error && diskBaseline !== undefined && !filePreview ? (
					<button
						type="button"
						title="Review unsaved changes vs last saved"
						onClick={() => setChangeReviewOpen(true)}
						className="ml-1 flex shrink-0 items-center gap-1 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#fed7aa] hover:bg-[#3c3c3c]"
					>
						<GitCompare size={14} className="shrink-0 opacity-90" />
						Review{diffHunkCount > 0 ? ` (${diffHunkCount})` : ""}
					</button>
				) : null}
				{technicalEditorChrome ? (
					<div className="ml-1 flex shrink-0 items-center gap-0.5 pr-1">
						<button
							type="button"
							title="Open file in this editor"
							aria-label="Open file in this editor"
							onClick={() => technicalEditorChrome.onOpenFile()}
							className="flex h-7 w-7 items-center justify-center rounded text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
						>
							<Plus size={16} strokeWidth={2} />
						</button>
						{technicalEditorChrome.onShowAgentChat ? (
							<button
								type="button"
								title="Show agent / session chat"
								aria-label="Show agent chat"
								onClick={() => technicalEditorChrome.onShowAgentChat?.()}
								className="flex h-7 w-7 items-center justify-center rounded text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
							>
								<MessageSquare size={15} strokeWidth={2} />
							</button>
						) : null}
					</div>
				) : null}
			</div>
			{showBreadcrumbs ? (
				<div className="flex h-6 shrink-0 items-center border-b border-[#2d2d2d] bg-[#1e1e1e] px-4 text-[12px] text-[#cccccc] shadow-sm">
					<span className="truncate">{path ?? (technicalEditorChrome ? TECHNICAL_WELCOME_VIRTUAL_PATH : "—")}</span>
				</div>
			) : null}
			{path ? (
				changeReviewOpen && dirty && diskBaseline !== undefined && !filePreview ? (
					<FileChangeReview
						ref={reviewRootRef}
						original={diskBaseline}
						modified={content}
						onChange={onChange}
						onSave={onSave}
						onClose={() => setChangeReviewOpen(false)}
						compact={compact}
					/>
				) : filePreview?.kind === "image" ? (
					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
						<div className="flex min-h-0 flex-1 overflow-auto p-4">
							<img
								src={filePreview.src}
								alt=""
								className="mx-auto block h-auto max-w-full object-contain [image-rendering:auto]"
								loading="lazy"
								decoding="async"
							/>
						</div>
					</div>
				) : filePreview?.kind === "binary" ? (
					<div className="flex min-h-0 flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-[14px] leading-relaxed text-[#d4d4d4]">
						<div className="max-w-xl text-[#858585]">
							<p className="mb-2 text-[#cccccc]">Binary file</p>
							<p>
								Type <span className="text-[#fed7aa]">{filePreview.mimeType}</span>. This file is not shown as
								text. Open it in an external app or use the workspace on disk.
							</p>
						</div>
					</div>
				) : (
					<WorkspaceTextBuffer
						ref={bufferRef}
						path={path}
						content={content}
						onChange={onChange}
						loading={loading}
						error={error}
						onCursor={onCursor}
						wordWrap={wordWrap}
						scrollClassName={`bg-[#1e1e1e] p-4 font-mono text-[#d4d4d4] ${bodyText}`}
						lineGutterClassName="w-8 text-[#858585]"
						textareaClassName="text-[#d4d4d4]"
						findBarClassName="shrink-0 border-t border-[#3c3c3c]"
						onFindInFiles={onFindInFiles}
						onReplaceInFiles={onReplaceInFiles}
						onUndoRedoStackChange={onUndoRedoStackChange}
						onSelectionPrefsChange={onSelectionPrefsChange}
					/>
				)
			) : technicalEditorChrome ? (
				<WorkspaceTextBuffer
					ref={bufferRef}
					path={TECHNICAL_WELCOME_VIRTUAL_PATH}
					content={TECHNICAL_WELCOME_DOC}
					onChange={() => {}}
					readOnly
					loading={false}
					error={null}
					onCursor={onCursor}
					wordWrap={wordWrap}
					scrollClassName={`bg-[#1e1e1e] p-4 font-mono text-[#d4d4d4] ${bodyText}`}
					lineGutterClassName="w-8 text-[#858585]"
					textareaClassName="text-[#d4d4d4]"
					findBarClassName="shrink-0 border-t border-[#3c3c3c]"
					onFindInFiles={onFindInFiles}
					onReplaceInFiles={onReplaceInFiles}
					onUndoRedoStackChange={onUndoRedoStackChange}
					onSelectionPrefsChange={onSelectionPrefsChange}
				/>
			) : (
				<div
					className={`flex min-h-0 flex-1 items-start overflow-auto bg-[#1e1e1e] p-4 font-mono text-[#d4d4d4] ${bodyText}`}
				>
					{showExplorerHint ? (
						<div className="max-w-md font-sans text-[14px] leading-relaxed text-[#cccccc]">
							<p className="text-[#858585]">
								<strong className="text-[#cccccc]">Simple</strong> mode hides the file explorer. Switch to{" "}
								<strong className="text-[#cccccc]">Technical</strong> in the top bar to browse the workspace
								tree, or paste a path if your server supports direct open later.
							</p>
							{onOpenWorkspace ? (
								<button
									type="button"
									onClick={() => onOpenWorkspace()}
									className="mt-4 rounded border border-[#ea580c]/50 bg-[#ea580c]/15 px-3 py-2 text-[13px] text-[#fed7aa] hover:bg-[#ea580c]/25"
								>
									Refresh workspace tree
								</button>
							) : null}
						</div>
					) : (
						<div className="text-[#858585]">Select a file in the explorer.</div>
					)}
				</div>
			)}
			{path && !loading && !error && !changeReviewOpen && !filePreview ? (
				<div className="flex shrink-0 justify-end border-t border-[#3c3c3c] bg-[#252526] px-2 py-1">
					<button
						type="button"
						disabled={!dirty}
						onClick={() => void onSave()}
						className="rounded bg-[#ea580c] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white disabled:opacity-40 hover:bg-[#c2410c]"
					>
						Save
					</button>
				</div>
			) : null}
		</div>
	);
});
