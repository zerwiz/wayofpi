import { useCallback, useState } from "react";
import { FolderOpen, MessageSquare, Eye, FileText } from "lucide-react";
import type { TreeNode } from "../../types/tree";
import type { ChatRow, LogRow } from "../../hooks/useWayOfPiSession";
import type { UiMode } from "../../hooks/useUiMode";
import { FileExplorer } from "../documenthandler/FileExplorer";
import { ChatPanel } from "../documenthandler/ChatPanel";
import { PreviewModal } from "../documenthandler/PreviewModal";
import { UiModeToggle } from "../UiModeToggle";

interface DocsAppProps {
	uiMode: UiMode;
	setUiMode: (m: UiMode) => void;
	nodes: TreeNode[];
	treeLoading: boolean;
	treeError: string | null;
	refreshTree: () => void;
	selectedPath: string | null;
	setSelectedPath: (p: string | null) => void;
	rows: ChatRow[];
	streaming: boolean;
	connected: boolean;
	sendChat: (t: string) => void;
	stop: () => void;
}

export function DocsApp({
	uiMode,
	setUiMode,
	nodes,
	treeLoading,
	treeError,
	refreshTree,
	selectedPath,
	setSelectedPath,
	rows,
	streaming,
	connected,
	sendChat,
	stop,
}: DocsAppProps) {
	const [previewOpen, setPreviewOpen] = useState(false);
	const [leftOpen, setLeftOpen] = useState(true);
	const [rightOpen, setRightOpen] = useState(true);

	const handleSelectFile = useCallback(
		(path: string) => {
			setSelectedPath(path);
			setPreviewOpen(true);
		},
		[setSelectedPath],
	);

	const appearanceDark = true;
	const bg = "bg-[#1e1e1e]";
	const border = "border-[#3c3c3c]";
	const titleC = "text-[#cccccc]";
	const subC = "text-[#858585]";
	const panelBg = "bg-[#252526]";

	return (
		<div className={`docs-mode flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden font-sans ${bg}`}>
			{/* Header */}
			<div className={`flex shrink-0 items-center justify-between border-b px-4 py-2 ${border}`}>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setLeftOpen((v) => !v)}
						className={`rounded p-1.5 ${subC} hover:bg-[#3c3c3c]`}
						title="Toggle file tree"
					>
						<FolderOpen size={18} />
					</button>
					<div className="flex items-center gap-2">
						<FileText size={18} className="text-[#fb923c]" />
						<span className={`text-sm font-semibold ${titleC}`}>DOCS</span>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<span className={`text-xs ${subC}`}>{selectedPath ? "File selected" : "No file selected"}</span>
					<button
						type="button"
						onClick={() => setRightOpen((v) => !v)}
						className={`rounded p-1.5 ${subC} hover:bg-[#3c3c3c]`}
						title="Toggle preview"
					>
						<Eye size={18} />
					</button>
					<UiModeToggle uiMode={uiMode} onUiModeChange={setUiMode} />
				</div>
			</div>

			{/* Three-panel layout */}
			<div className="docs-content flex min-h-0 flex-1 overflow-hidden">
				{/* Left: File Tree */}
				{leftOpen && (
					<div
						className={`docs-file-tree flex w-[280px] shrink-0 flex-col overflow-hidden border-r ${border} ${panelBg}`}
						style={{ minWidth: "200px", maxWidth: "400px" }}
					>
						<div className={`flex shrink-0 items-center justify-between border-b px-3 py-2 ${border}`}>
							<span className={`text-xs font-semibold uppercase tracking-wider ${titleC}`}>Files</span>
							<button
								type="button"
								onClick={refreshTree}
								className={`rounded p-1 text-xs ${subC} hover:bg-[#3c3c3c]`}
								title="Refresh file tree"
							>
								↻
							</button>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto p-1">
							<FileExplorer
								nodes={nodes}
								loading={treeLoading}
								error={treeError}
								onSelectFile={handleSelectFile}
								selectedPath={selectedPath}
							/>
						</div>
					</div>
				)}

				{/* Middle: Chat Panel */}
				<div className={`docs-chat flex min-w-0 flex-1 flex-col overflow-hidden border-r ${border}`}>
					<ChatPanel
						rows={rows}
						streaming={streaming}
						connected={connected}
						onSend={sendChat}
						onStop={stop}
						appearanceDark={appearanceDark}
					/>
				</div>

				{/* Right: Preview Panel */}
				{rightOpen && (
					<div
						className={`docs-preview flex w-[45%] shrink-0 flex-col overflow-hidden ${panelBg}`}
					>
						<div className={`flex shrink-0 items-center justify-between border-b px-3 py-2 ${border}`}>
							<span className={`text-xs font-semibold uppercase tracking-wider ${titleC}`}>Preview</span>
							{selectedPath && (
								<span className={`text-xs ${subC}`}>{selectedPath.split("/").pop()}</span>
							)}
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto">
							<PreviewModal
								isOpen={previewOpen}
								onClose={() => setPreviewOpen(false)}
								filePath={selectedPath}
								appearanceDark={appearanceDark}
								embedded
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
