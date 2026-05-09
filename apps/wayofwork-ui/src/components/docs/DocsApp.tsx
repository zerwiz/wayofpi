import { useCallback, useMemo, useState, useEffect } from "react";
import { FolderOpen, MessageSquare, Eye, FileText, FileCheck, FileWarning, FileClock, CheckCircle, AlertCircle, Clock, Send } from "lucide-react";
import type { TreeNode } from "../../types/tree";
import type { ChatRow, LogRow } from "../../hooks/useWayOfPiSession";
// UiMode imported as string type
import { FileExplorer } from "../documenthandler/FileExplorer";
import { ChatPanel } from "../documenthandler/ChatPanel";
import { PreviewModal } from "../documenthandler/PreviewModal";
import { DocumentBrowser } from "./DocumentBrowser";
import { UiModeToggle } from "../UiModeToggle";
import { apiGet } from "../../api/client";
import { useDocumentHandler } from "../documenthandler/context/DocumentHandlerContext";
import type { FileEntry } from "../documenthandler/types/documenthandler.types";

interface DocsAppProps {
	uiMode: string;
	setUiMode: (m: string) => void;
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
	const [docStatus, setDocStatus] = useState<"draft" | "review" | "approved" | null>(null);
	const [showDocBrowser, setShowDocBrowser] = useState(false);

	/** Filter tree to only show document files (.md, .txt, .doc, .docx) */
	const docsNodes = useMemo(() => {
		const docExts = new Set([".md", ".txt", ".doc", ".docx", ".pdf"]);
		function filterNode(node: TreeNode): TreeNode | null {
			if (node.type === "dir") {
				const children = (node.children || [])
					.map(filterNode)
					.filter((n): n is TreeNode => n !== null);
				if (children.length === 0) return null;
				return { ...node, children };
			}
			const ext = "." + node.name.split(".").pop()?.toLowerCase();
			return docExts.has(ext) ? node : null;
		}
		return nodes.map(filterNode).filter((n): n is TreeNode => n !== null);
	}, [nodes]);

	// Try to get DocumentHandlerContext - may not be available
	const docHandlerContext = useDocumentHandler();

	const handleSelectFile = useCallback(
		(path: string) => {
			setSelectedPath(path);
			setPreviewOpen(true);
			// Also update the DocumentHandlerContext if available
			try {
				docHandlerContext?.onSelectFile?.({ 
					name: path.split('/').pop() || path, 
					path 
				} as FileEntry);
			} catch {
				// Context not available - that's ok
			}
		},
		[setSelectedPath, docHandlerContext],
	);

	// Detect document status from content
	useEffect(() => {
		if (!selectedPath) {
			setDocStatus(null);
			return;
		}
		async function detectStatus() {
			try {
				const content = await apiGet<string>(`/api/file?path=${encodeURIComponent(selectedPath ?? '')}`);
				const lower = content.toLowerCase();
				if (lower.includes("status: approved") || lower.includes("# approved")) {
					setDocStatus("approved");
				} else if (lower.includes("status: review") || lower.includes("# review")) {
					setDocStatus("review");
				} else if (lower.includes("status: draft") || lower.includes("# draft")) {
					setDocStatus("draft");
				} else {
					setDocStatus(selectedPath?.includes("/plans/") ? "draft" : "review");
				}
			} catch {
				setDocStatus(null);
			}
		}
		detectStatus();
	}, [selectedPath]);

	const statusBadge = (status: string | null) => {
		const badges = {
			draft: { color: "bg-amber-900/30 text-amber-400", icon: <FileClock size={12} />, label: "Draft" },
			review: { color: "bg-blue-900/30 text-blue-400", icon: <AlertCircle size={12} />, label: "Review" },
			approved: { color: "bg-green-900/30 text-green-400", icon: <CheckCircle size={12} />, label: "Approved" },
		};
		const b = status ? badges[status as keyof typeof badges] : null;
		return b ? (
			<span className={`ml-2 flex items-center gap-1 rounded px-2 py-0.5 text-xs ${b.color}`}>
				{b.icon}
				{b.label}
			</span>
		) : null;
	};

	const appearanceDark = true;
	const bg = "bg-[#1e1e1e]";
	const border = "border-[#3c3c3c]";
	const titleC = "text-[#cccccc]";
	const subC = "text-[#858585]";
	const panelBg = "bg-[#252526]";

	return (
		<div className={`docs-mode flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden font-sans ${bg} overflow-y-auto`}>
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
						{statusBadge(docStatus)}
					</div>
				</div>

				<div className="flex items-center gap-3">
					<span className={`text-xs ${subC}`}>{selectedPath ? selectedPath.split("/").pop() : "No file selected"}</span>
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
						<span className={`text-xs font-semibold uppercase tracking-wider ${titleC}`}>Documents</span>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => setShowDocBrowser(!showDocBrowser)}
								className={`rounded p-1 text-xs ${showDocBrowser ? 'bg-[#ea580c] text-white' : `${subC} hover:bg-[#3c3c3c]`}`}
								title={showDocBrowser ? "Switch to File Tree" : "Switch to Document Browser"}
							>
								{showDocBrowser ? '📄 Tree' : '📂 Docs'}
							</button>
							<button
								type="button"
								onClick={refreshTree}
								className={`rounded p-1 text-xs ${subC} hover:bg-[#3c3c3c]`}
								title="Refresh file tree"
							>
								↻
							</button>
						</div>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto p-1">
						{showDocBrowser ? (
							<DocumentBrowser
								nodes={docsNodes}
								loading={treeLoading}
								error={treeError}
								selectedPath={selectedPath}
								onSelectFile={handleSelectFile}
							/>
						) : (
							<FileExplorer
								nodes={docsNodes}
								loading={treeLoading}
								error={treeError}
								onSelectFile={handleSelectFile}
								selectedPath={selectedPath}
								visible={leftOpen}
								onToggle={() => setLeftOpen(v => !v)}
								appearanceDark={appearanceDark}
							/>
						)}
					</div>
					</div>
				)}

				{/* Middle: Chat Panel */}
				<div className={`docs-chat flex min-w-0 flex-col overflow-hidden border-r ${border}`}>
					{/* Quick action buttons for document Q&A */}
					{selectedPath && (
						<div className={`flex shrink-0 gap-2 border-b px-3 py-2 ${border}`}>
							<button
								type="button"
								onClick={() => sendChat(`Summarize this document: ${selectedPath}`)}
								disabled={streaming}
								className={`rounded px-3 py-1 text-xs transition-colors ${
									streaming
										? "cursor-not-allowed bg-[#3c3c3c] text-[#666]"
										: "bg-[#ea580c] text-white hover:bg-[#c2410c]"
								}`}
							>
								📝 Summarize
							</button>
							<button
								type="button"
								onClick={() => sendChat(`Extract action items from: ${selectedPath}`)}
								disabled={streaming}
								className={`rounded px-3 py-1 text-xs transition-colors ${
									streaming
										? "cursor-not-allowed bg-[#3c3c3c] text-[#666]"
										: "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
								}`}
							>
								✅ Action Items
							</button>
							<button
								type="button"
								onClick={() => sendChat(`Review this document for completeness: ${selectedPath}`)}
								disabled={streaming}
								className={`rounded px-3 py-1 text-xs transition-colors ${
									streaming
										? "cursor-not-allowed bg-[#3c3c3c] text-[#666]"
										: "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
								}`}
							>
								🔍 Review
							</button>
						</div>
					)}
					<ChatPanel
						rows={rows}
						streaming={streaming}
						connected={connected}
						onSend={sendChat}
						onStop={stop}
						appearanceDark={appearanceDark}
						visible={true}
						onToggle={() => {}}
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
							visible={previewOpen && !!selectedPath}
							onClose={() => setPreviewOpen(false)}
							path={selectedPath || ''}
							appearanceDark={appearanceDark}
						/>
					</div>
					</div>
				)}
			</div>
		</div>
	);
}
