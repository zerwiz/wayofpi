import { ChevronDown, ChevronRight, FilePlus, FolderPlus, SidebarClose } from "lucide-react";
import { useCallback, useState, type DragEvent, type MouseEvent } from "react";
import { FileTree } from "./FileTree";
import type { TreeNode } from "../types/tree";
import { isExplorerFilePathDrag, readDraggedExplorerFilePath } from "../utils/panelDockLayout";
import { posixDirname } from "../utils/posixPath";

export function ExplorerSidebar({
	nodes,
	rootLabel,
	selectedPath,
	secondarySelectedPath,
	openInMainEditorPaths,
	onSelectFile,
	onSelectDirectory,
	onMoveFileToDirectory,
	allowDropToWorkspaceRoot,
	onRenameExplorerNode,
	onDeleteExplorerNode,
	onCopyExplorerPath,
	onNewFile,
	onNewFolder,
	loading,
	error,
	expandRevision,
	pathsToExpand,
	onClosePrimarySidebar,
}: {
	nodes: TreeNode[];
	rootLabel: string;
	selectedPath: string | null;
	secondarySelectedPath?: string | null;
	openInMainEditorPaths?: readonly string[];
	onSelectFile: (path: string, ev?: MouseEvent) => void;
	onSelectDirectory?: (dirPath: string) => void;
	/** Move file on disk (single- and multi-root). */
	onMoveFileToDirectory?: (fromPath: string, toDirPath: string) => Promise<void>;
	/** Single-folder workspace: allow drop into empty area below tree → workspace root. */
	allowDropToWorkspaceRoot?: boolean;
	onRenameExplorerNode?: (path: string, kind: "file" | "dir", currentName: string) => Promise<void>;
	onDeleteExplorerNode?: (path: string, kind: "file" | "dir") => Promise<void>;
	onCopyExplorerPath?: (path: string) => void;
	onNewFile?: () => void;
	onNewFolder?: () => void;
	loading: boolean;
	error: string | null;
	expandRevision?: number;
	pathsToExpand?: string[];
	/** Hide the whole primary (left) sidebar — same as menu bar / Ctrl+B. */
	onClosePrimarySidebar?: () => void;
}) {
	const [outlineOpen, setOutlineOpen] = useState(false);
	const [timelineOpen, setTimelineOpen] = useState(false);
	const [workspaceTreeOpen, setWorkspaceTreeOpen] = useState(true);
	const [rootDropActive, setRootDropActive] = useState(false);

	const onRootDragOver = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			if (!allowDropToWorkspaceRoot || !onMoveFileToDirectory || !isExplorerFilePathDrag(e.dataTransfer)) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			setRootDropActive(true);
		},
		[allowDropToWorkspaceRoot, onMoveFileToDirectory],
	);

	const onRootDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		const rel = e.relatedTarget as Node | null;
		if (rel && e.currentTarget.contains(rel)) return;
		setRootDropActive(false);
	}, []);

	const onRootDrop = useCallback(
		async (e: DragEvent<HTMLDivElement>) => {
			if (!allowDropToWorkspaceRoot || !onMoveFileToDirectory) return;
			e.preventDefault();
			setRootDropActive(false);
			const from = readDraggedExplorerFilePath(e.dataTransfer);
			if (!from) return;
			if (posixDirname(from) === "") return;
			await onMoveFileToDirectory(from, "");
		},
		[allowDropToWorkspaceRoot, onMoveFileToDirectory],
	);

	return (
		<div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-r border-[#3c3c3c] bg-[#252526]">
			<div className="flex shrink-0 w-full min-w-0 items-stretch bg-[#2d2d2d]">
				<button
					type="button"
					onClick={() => setWorkspaceTreeOpen((o) => !o)}
					className="flex min-w-0 flex-1 cursor-pointer items-center px-1 py-1 text-left text-[11px] font-bold uppercase text-[#cccccc] hover:bg-[#383838]"
				>
					{workspaceTreeOpen ? (
						<ChevronDown size={14} className="mr-1 shrink-0" />
					) : (
						<ChevronRight size={14} className="mr-1 shrink-0" />
					)}
					<span className="truncate" title={rootLabel}>
						{rootLabel || "WORKSPACE"}
					</span>
				</button>
				{onClosePrimarySidebar ? (
					<button
						type="button"
						title="Close primary sidebar (Ctrl+B)"
						aria-label="Close primary sidebar"
						onClick={(e) => {
							e.stopPropagation();
							onClosePrimarySidebar();
						}}
						className="flex shrink-0 items-center border-l border-[#3c3c3c] px-1.5 text-[#858585] hover:bg-[#383838] hover:text-[#cccccc]"
					>
						<SidebarClose size={14} strokeWidth={1.75} aria-hidden />
					</button>
				) : null}
			</div>
			{workspaceTreeOpen ? (
				<div className="flex shrink-0 items-center justify-end gap-0.5 border-b border-[#3c3c3c] bg-[#252526] px-1 py-0.5">
					<button
						type="button"
						title="New file"
						onClick={() => onNewFile?.()}
						disabled={!onNewFile}
						className="rounded p-1 text-[#cccccc] hover:bg-[#3c3c3c] disabled:cursor-not-allowed disabled:opacity-40"
					>
						<FilePlus size={16} />
					</button>
					<button
						type="button"
						title="New folder"
						onClick={() => onNewFolder?.()}
						disabled={!onNewFolder}
						className="rounded p-1 text-[#cccccc] hover:bg-[#3c3c3c] disabled:cursor-not-allowed disabled:opacity-40"
					>
						<FolderPlus size={16} />
					</button>
				</div>
			) : null}
			<div
				className={`min-h-0 flex-1 overflow-y-auto py-1 ${rootDropActive ? "bg-[#264f78]/25 outline outline-1 outline-[#ea580c]/40 -outline-offset-1" : ""}`}
				onDragOver={allowDropToWorkspaceRoot && onMoveFileToDirectory ? onRootDragOver : undefined}
				onDragLeave={allowDropToWorkspaceRoot && onMoveFileToDirectory ? onRootDragLeave : undefined}
				onDrop={allowDropToWorkspaceRoot && onMoveFileToDirectory ? (e) => void onRootDrop(e) : undefined}
			>
				{!workspaceTreeOpen ? null : loading ? (
					<div className="px-3 py-2 font-mono text-[12px] text-[#858585]">Loading tree…</div>
				) : error ? (
					<div className="px-3 py-2 font-mono text-[12px] text-[#f14c4c]">{error}</div>
				) : (
					<FileTree
						nodes={nodes}
						selectedPath={selectedPath}
						secondarySelectedPath={secondarySelectedPath}
						openInMainEditorPaths={openInMainEditorPaths}
						onSelectFile={onSelectFile}
						onSelectDirectory={onSelectDirectory}
						onMoveFileToDirectory={onMoveFileToDirectory}
						onRenameNode={onRenameExplorerNode}
						onDeleteNode={onDeleteExplorerNode}
						onCopyPath={onCopyExplorerPath}
						expandRevision={expandRevision}
						pathsToExpand={pathsToExpand}
					/>
				)}
			</div>
			<div className="shrink-0 border-t border-[#3c3c3c] bg-[#2d2d2d]">
				<button
					type="button"
					onClick={() => setOutlineOpen((o) => !o)}
					className="flex w-full cursor-pointer items-center px-1 py-1 text-left text-[11px] font-bold uppercase text-[#cccccc] hover:bg-[#383838]"
				>
					{outlineOpen ? <ChevronDown size={14} className="mr-1 shrink-0" /> : <ChevronRight size={14} className="mr-1 shrink-0" />}
					OUTLINE
				</button>
				{outlineOpen ? (
					<div className="border-t border-[#3c3c3c] px-3 py-2 font-mono text-[11px] text-[#858585]">
						{selectedPath ? (
							<span>Symbols for open file — not wired yet. File: {selectedPath}</span>
						) : (
							<span>Open a file to see outline (planned).</span>
						)}
					</div>
				) : null}
			</div>
			<div className="shrink-0 border-t border-[#3c3c3c] bg-[#2d2d2d]">
				<button
					type="button"
					onClick={() => setTimelineOpen((o) => !o)}
					className="flex w-full cursor-pointer items-center px-1 py-1 text-left text-[11px] font-bold uppercase text-[#cccccc] hover:bg-[#383838]"
				>
					{timelineOpen ? <ChevronDown size={14} className="mr-1 shrink-0" /> : <ChevronRight size={14} className="mr-1 shrink-0" />}
					TIMELINE
				</button>
				{timelineOpen ? (
					<div className="border-t border-[#3c3c3c] px-3 py-2 font-mono text-[11px] text-[#858585]">
						Git / local history — planned. Use your VCS outside the shell for now.
					</div>
				) : null}
			</div>
		</div>
	);
}
