import { useCallback, useState } from "react";
import { FolderOpen, MessageSquare, Eye, FileText } from "lucide-react";
import type { TreeNode } from "../../types/tree";
import type { ChatRow, LogRow } from "../../hooks/useWayOfPiSession";
import type { UiMode } from "../../hooks/useUiMode";
import { FileExplorer } from "../documenthandler/FileExplorer";
import { ChatPanel } from "../documenthandler/ChatPanel";
import { PreviewModal } from "../documenthandler/PreviewModal";

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
					<button
						type="button"
						onClick={() => setUiMode("simple")}
						className={`rounded px-2 py-1 text-xs ${subC} hover:bg-[#3c3c3c]`}
						title="Switch to Simple mode"
					>
						Switch to Simple
					</button>
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
						<div className="min-h-0 flex-1 overflow-y-auto">
							<FileExplorer
								visible={true}
								onToggle={() => {}}
								appearanceDark={appearanceDark}
								nodes={nodes}
								selectedPath={selectedPath}
								onSelectFile={handleSelectFile}
								loading={treeLoading}
								error={treeError}
							/>
						</div>
					</div>
				)}

				{/* Middle: Chat */}
				<div className="docs-chat flex min-w-0 flex-1 flex-col overflow-hidden">
					<div className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 ${border}`}>
						<MessageSquare size={16} className="text-[#ea580c]" />
						<span className={`text-xs font-semibold uppercase tracking-wider ${titleC}`}>Chat</span>
					</div>
					<div className="min-h-0 flex-1 overflow-hidden">
						<ChatPanel
							visible={true}
							onToggle={() => {}}
							appearanceDark={appearanceDark}
							rows={rows}
							streaming={streaming}
							connected={connected}
							onSend={sendChat}
							onStop={stop}
						/>
					</div>
				</div>

				{/* Right: Document Preview */}
				{rightOpen && (
					<div className={`docs-preview flex w-[400px] shrink-0 flex-col overflow-hidden border-l ${border} ${panelBg}`}>
						<div className={`flex shrink-0 items-center justify-between border-b px-3 py-2 ${border}`}>
							<div className="flex items-center gap-2">
								<Eye size={16} className="text-[#22c55e]" />
								<span className={`text-xs font-semibold uppercase tracking-wider ${titleC}`}>Preview</span>
							</div>
							{selectedPath && (
								<button
									type="button"
									onClick={() => {
										setSelectedPath(selectedPath);
										setUiMode("simple");
									}}
									className={`rounded px-2 py-1 text-xs ${subC} hover:bg-[#3c3c3c]`}
									title="Open in editor"
								>
									Open in editor →
								</button>
							)}
						</div>
						<div className="min-h-0 flex-1 overflow-auto p-4">
							{selectedPath ? (
								<div className="h-full">
									<PreviewModal
										visible={previewOpen}
										onClose={() => setPreviewOpen(false)}
										path={selectedPath}
										appearanceDark={appearanceDark}
									/>
								</div>
							) : (
								<div className={`flex h-full items-center justify-center text-sm ${subC}`}>
									<div className="text-center">
										<FileText size={48} className="mx-auto mb-3 opacity-50" />
										<p>Select a file from the tree to preview it here</p>
										<p className="mt-1 text-xs">Chat with the AI about your documents</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
