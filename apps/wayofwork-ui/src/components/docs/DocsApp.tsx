import { useCallback, useMemo, useState, useEffect } from "react";
import { FolderOpen, MessageSquare, Eye, FileText, FileCheck, FileWarning, FileClock, CheckCircle, AlertCircle, Clock, Send } from "lucide-react";
import type { TreeNode } from "../../types/tree";
import type { ChatRow, ChatSessionMode, LogRow } from "../../hooks/useWayOfPiSession";
import { FileExplorer } from "../documenthandler/FileExplorer";
import { DocumentBrowser } from "./DocumentBrowser";
import { apiGet } from "../../api/client";
import { useDocumentHandler } from "../documenthandler/context/DocumentHandlerContext";
import type { FileEntry } from "../documenthandler/types/documenthandler.types";
import { SimpleChatView } from "../simple/SimpleChatView";
import { useAgents } from "../../hooks/useAgents";
import { PreviewContent } from "../documenthandler/PreviewContent";
import type { ChatQueueItem } from "../../utils/chatQueueTranscript";

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
	error: string | null;
	modelLabel: string;
	clearError: () => void;
	onReopenLlmFixModal?: () => void;
	chatAgentName: string | null;
	dispatchTurnAgent?: string | null;
	onChatAgentChange: (name: string | null) => void;
	chatMode: ChatSessionMode;
	onChatModeChange: (m: ChatSessionMode) => void;
	chatStreamUiEnabled: boolean;
	onChatStreamUiEnabledChange: (on: boolean) => void;
	chatQueuePending?: number;
	chatQueueItems?: ChatQueueItem[];
	editChatQueueItem?: (id: string, text: string) => void;
	deleteChatQueueItem?: (id: string) => void;
	forceChatQueueItem?: (id: string) => void;
	contextFillPct?: number | null;
	contextTitle?: string;
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
	error,
	modelLabel,
	clearError,
	onReopenLlmFixModal,
	chatAgentName,
	dispatchTurnAgent,
	onChatAgentChange,
	chatMode,
	onChatModeChange,
	chatStreamUiEnabled,
	onChatStreamUiEnabledChange,
	chatQueuePending = 0,
	chatQueueItems = [],
	editChatQueueItem,
	deleteChatQueueItem,
	forceChatQueueItem,
	contextFillPct = null,
	contextTitle = "",
}: DocsAppProps) {
	const [leftOpen, setLeftOpen] = useState(true); // Now Chat toggle
	const [treeOpen, setTreeOpen] = useState(true); // Now Tree toggle
	const [docStatus, setDocStatus] = useState<"draft" | "review" | "approved" | null>(null);
	const [showDocBrowser, setShowDocBrowser] = useState(false);
	const [selectedContent, setSelectedContent] = useState<string | null>(null);
	const [contentLoading, setContentLoading] = useState(false);

	const agentsApi = useAgents();

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
			// Also update the DocumentHandlerContext if available
			try {
				const name = path.split('/').pop() || path;
				const extension = name.split('.').pop() || '';
				docHandlerContext?.onSelectFile?.({ 
					id: path,
					name, 
					path,
					extension,
					size: 0,
					modified: new Date(),
					isDirectory: false
				} as FileEntry);
			} catch {
				// Context not available - that's ok
			}
		},
		[setSelectedPath, docHandlerContext],
	);

	// Detect document status and fetch content
	useEffect(() => {
		if (!selectedPath) {
			setDocStatus(null);
			setSelectedContent(null);
			return;
		}
		async function fetchFile() {
			setContentLoading(true);
			try {
				const content = await apiGet<string>(`/api/file?path=${encodeURIComponent(selectedPath ?? '')}`);
				setSelectedContent(content);
				
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
				setSelectedContent(null);
			} finally {
				setContentLoading(false);
			}
		}
		fetchFile();
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

	const previewFile = useMemo(() => {
		if (!selectedPath) return null;
		return docHandlerContext?.selectedFileForPreview || ({
			id: selectedPath,
			name: selectedPath.split('/').pop() || '',
			path: selectedPath,
			extension: selectedPath.split('.').pop() || '',
			size: 0,
			modified: new Date(),
			isDirectory: false
		} as FileEntry);
	}, [selectedPath, docHandlerContext?.selectedFileForPreview]);

	return (
		<div className={`docs-mode flex h-full min-w-0 flex-1 flex-col overflow-hidden font-sans ${bg}`}>
			{/* Header */}
			<div className={`flex shrink-0 items-center justify-between border-b px-4 py-2 ${border}`}>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setLeftOpen((v) => !v)}
						className={`rounded p-1.5 ${leftOpen ? "bg-[#ea580c] text-white" : `${subC} hover:bg-[#3c3c3c]`}`}
						title="Toggle Chat"
					>
						<MessageSquare size={18} />
					</button>
					<button
						type="button"
						onClick={() => setTreeOpen((v) => !v)}
						className={`rounded p-1.5 ${treeOpen ? "bg-[#ea580c] text-white" : `${subC} hover:bg-[#3c3c3c]`}`}
						title="Toggle Documents"
					>
						<FolderOpen size={18} />
					</button>
					<div className="flex items-center gap-2">
						<FileText size={18} className="text-[#fb923c]" />
						<span className={`text-sm font-semibold tracking-tighter ${titleC}`}>DOCS</span>
						{statusBadge(docStatus)}
					</div>
				</div>

				<div className="flex items-center gap-3">
					<span className={`text-xs ${subC}`}>{selectedPath ? selectedPath.split("/").pop() : "No file selected"}</span>
				</div>
			</div>

			{/* Three-panel layout: Tree | Preview | Chat */}
			<div className="docs-content flex min-h-0 flex-1 overflow-hidden">
				
				{/* Left: File Tree */}
				{treeOpen && (
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
									visible={treeOpen}
									onToggle={() => setTreeOpen(v => !v)}
									appearanceDark={appearanceDark}
								/>
							)}
						</div>
					</div>
				)}

				{/* Middle: Preview Panel */}
				<div
					className={`docs-preview flex min-w-0 flex-1 flex-col overflow-hidden border-r ${border} ${bg}`}
				>
					<div className={`flex shrink-0 items-center justify-between border-b px-3 py-2 ${border}`}>
						<span className={`text-xs font-semibold uppercase tracking-wider ${titleC}`}>Preview</span>
						{selectedPath && (
							<span className={`text-xs ${subC}`}>{selectedPath.split("/").pop()}</span>
						)}
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto">
						{contentLoading ? (
							<div className="flex h-full items-center justify-center">
								<div className={`animate-pulse text-sm ${subC}`}>Loading content...</div>
							</div>
						) : selectedPath ? (
							<PreviewContent
								file={previewFile}
								content={selectedContent}
								zoom={docHandlerContext?.currentZoom || 100}
								currentPage={docHandlerContext?.currentPage || 1}
								appearanceDark={appearanceDark}
							/>
						) : (
							<div className="flex h-full items-center justify-center p-8 text-center text-[#858585]">
								Select a document from the tree to preview it here.
							</div>
						)}
					</div>
				</div>

				{/* Right: Chat Panel (Simple styled) */}
				{leftOpen && (
					<div className={`docs-chat flex w-[400px] shrink-0 flex-col overflow-hidden ${panelBg}`}>
						<SimpleChatView
							compactChrome={true}
							rows={rows}
							streaming={streaming}
							chatStreamUiEnabled={chatStreamUiEnabled}
							onChatStreamUiEnabledChange={onChatStreamUiEnabledChange}
							chatQueuePending={chatQueuePending}
							chatQueueItems={chatQueueItems}
							onChatQueueEdit={editChatQueueItem}
							onChatQueueDelete={deleteChatQueueItem}
							onChatQueueForce={forceChatQueueItem}
							connected={connected}
							error={error}
							modelLabel={modelLabel}
							onSend={sendChat}
							onStop={stop}
							onClearError={clearError}
							onReopenLlmFixModal={onReopenLlmFixModal}
							appearanceDark={appearanceDark}
							agents={agentsApi.data?.agents ?? []}
							agentTeams={agentsApi.data?.teams ?? {}}
							agentsLoading={agentsApi.loading}
							chatAgentName={chatAgentName}
							dispatchTurnAgent={dispatchTurnAgent}
							onChatAgentChange={onChatAgentChange}
							chatMode={chatMode}
							onChatModeChange={onChatModeChange}
							contextFillPct={contextFillPct}
							contextTitle={contextTitle}
							onOpenPlanFileForReview={() => {}}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

