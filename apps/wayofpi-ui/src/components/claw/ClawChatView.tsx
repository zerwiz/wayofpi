/**
 * Claw Chat tab — session-aware chat with an optional file panel rooted at host **`.claw/`**.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Active session + [New] [.claw/]                            │  ← ClawSessionStrip
 *   ├──────────────────────────┬──────────────┬────────────────┤
 *   │  SimpleChatView          │ Session list │ .claw/ tree    │
 *   │                          │ (sidebar)    │ (when open)    │
 *   └──────────────────────────┴──────────────┴────────────────┘
 *
 * The file panel lists the host checkout’s **`.claw/`** tree (not the opened
 * `WOP_WORKSPACE` project). Paths are `.claw/…` for API read/write/move.
 */
import { FilePlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSessionTab, ChatSessionMode, ChatRow } from "../../hooks/useWayOfPiSession";
import type { AgentMeta } from "../../hooks/useAgents";
import type { ChatQueueItem } from "../../utils/chatQueueTranscript";
import type { TreeNode } from "../../types/tree";
import type { FilePersistEncoding } from "../../hooks/useFileEditor";
import type { WorkspaceEditorRef } from "../../types/workspaceEditor";
import { SimpleChatView } from "../simple/SimpleChatView";
import { SimpleFileTree } from "../simple/SimpleFileTree";
import { SimpleFilePanel } from "../simple/SimpleFilePanel";
import { DockSplitHandle } from "../DockSplitHandle";
import { ClawSessionStrip } from "./ClawSessionStrip";
import { ClawSessionSidebar } from "./ClawSessionSidebar";

/** Minimum width for the file panel side in px. */
const FILE_PANEL_MIN_PX = 220;
/** Default width for the file panel side in px. */
const FILE_PANEL_DEFAULT_PX = 340;

export function ClawChatView({
	// Session
	chatTabs,
	activeChatTabId,
	onSelectChatTab,
	onCloseChatTab,
	onRenameChatTab,
	onNewSession,
	// Chat content
	rows,
	streaming,
	chatStreamUiEnabled,
	onChatStreamUiEnabledChange,
	chatQueuePending,
	chatQueueItems,
	onChatQueueEdit,
	onChatQueueDelete,
	onChatQueueForce,
	connected,
	error,
	modelLabel,
	onSend,
	onStop,
	onClearError,
	onReopenLlmFixModal,
	agents,
	agentTeams,
	agentsLoading,
	chatAgentName,
	dispatchTurnAgent,
	onChatAgentChange,
	chatMode,
	onChatModeChange,
	contextFillPct,
	contextTitle,
	// Files (Claw host `.claw/` tree — not `WOP_WORKSPACE` explorer)
	filePanelNodes,
	filePanelTreeLoading,
	onRefreshFilePanelTree,
	/** Host `.claw/` absolute path (from server config) — shown in file panel header. */
	filePanelRootLabel,
	selectedPath,
	setSelectedPath,
	content,
	setContent,
	persistEncoding,
	fileMimeType,
	fileLoading,
	fileError,
	dirty,
	onSave,
	onDiscardUnsaved,
	onCursor,
	workspaceEditorRef,
	onUndoRedoStackChange,
	onSelectionPrefsChange,
	onFindInFiles,
	onReplaceInFiles,
	onRefreshTree,
	onMoveFileToDirectory,
	allowWorkspaceRootDrop: _allowWorkspaceRootDrop = false,
	dark,
	filePanelTreeError,
	onAddClawMarkdownDocument,
	addClawMarkdownDocumentBusy,
}: {
	chatTabs: ChatSessionTab[];
	activeChatTabId: string;
	onSelectChatTab: (id: string) => void;
	onCloseChatTab: (id: string) => void;
	onRenameChatTab: (id: string, label: string) => void;
	onNewSession: () => void;
	rows: ChatRow[];
	streaming: boolean;
	chatStreamUiEnabled: boolean;
	onChatStreamUiEnabledChange: (on: boolean) => void;
	chatQueuePending: number;
	chatQueueItems: ChatQueueItem[];
	onChatQueueEdit: (id: string, text: string) => void;
	onChatQueueDelete: (id: string) => void;
	onChatQueueForce: (id: string) => void;
	connected: boolean;
	error: string | null;
	modelLabel: string;
	onSend: (text: string) => void;
	onStop: () => void;
	onClearError: () => void;
	onReopenLlmFixModal?: () => void;
	agents: AgentMeta[];
	agentTeams: Record<string, string[]>;
	agentsLoading: boolean;
	chatAgentName: string | null;
	dispatchTurnAgent?: string | null;
	onChatAgentChange: (name: string | null) => void;
	chatMode: ChatSessionMode;
	onChatModeChange: (m: ChatSessionMode) => void;
	contextFillPct: number | null;
	contextTitle: string;
	filePanelNodes: TreeNode[];
	filePanelTreeLoading: boolean;
	onRefreshFilePanelTree: () => void | Promise<void>;
	filePanelRootLabel?: string | null;
	selectedPath: string | null;
	setSelectedPath: (p: string | null) => void;
	content: string;
	setContent: (s: string) => void;
	persistEncoding: FilePersistEncoding;
	fileMimeType: string | null;
	fileLoading: boolean;
	fileError: string | null;
	dirty: boolean;
	onSave: () => Promise<boolean>;
	onDiscardUnsaved: () => void;
	onCursor: (l: number, c: number) => void;
	workspaceEditorRef?: React.RefObject<WorkspaceEditorRef | null>;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	onFindInFiles?: () => void;
	onReplaceInFiles?: () => void;
	onRefreshTree: () => void;
	onMoveFileToDirectory?: (fromPath: string, toDirPath: string) => Promise<void>;
	allowWorkspaceRootDrop?: boolean;
	dark: boolean;
	filePanelTreeError?: string | null;
	onAddClawMarkdownDocument?: () => Promise<void>;
	addClawMarkdownDocumentBusy?: boolean;
}) {
	const clawAgentAvailable = agents.some((a) => a.name === "claw");
	const [showFilePanel, setShowFilePanel] = useState(false);
	const [filePanelWidth, setFilePanelWidth] = useState(FILE_PANEL_DEFAULT_PX);
	const containerRef = useRef<HTMLDivElement>(null);

	const toggleFilePanel = useCallback(() => {
		setShowFilePanel((v) => !v);
	}, []);

	const handleOpenClawFile = useCallback(
		(path: string) => {
			setSelectedPath(path);
			setShowFilePanel(true);
		},
		[setSelectedPath],
	);

	const handlePlanFileReview = useCallback(
		(rel: string) => {
			setSelectedPath(rel);
			setShowFilePanel(true);
		},
		[setSelectedPath],
	);

	const handleAddClawMarkdownDocument = useCallback(async () => {
		if (!onAddClawMarkdownDocument) return;
		await onAddClawMarkdownDocument();
		setShowFilePanel(true);
	}, [onAddClawMarkdownDocument]);

	const splitHandleC = dark
		? "hidden md:block"
		: "hidden md:block !bg-[#ececec] hover:!bg-[#007acc]/35 active:!bg-[#007acc]/55";

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
			{/* Session strip */}
			<ClawSessionStrip
				tabs={chatTabs}
				activeTabId={activeChatTabId}
				onNew={onNewSession}
				showClawFiles={showFilePanel}
				onToggleClawFiles={toggleFilePanel}
				dark={dark}
			/>

			{/* Chat + optional file panel */}
			<div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
				{/* Chat column */}
				<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
					<SimpleChatView
						rows={rows}
						streaming={streaming}
						chatStreamUiEnabled={chatStreamUiEnabled}
						onChatStreamUiEnabledChange={onChatStreamUiEnabledChange}
						chatQueuePending={chatQueuePending}
						chatQueueItems={chatQueueItems}
						onChatQueueEdit={onChatQueueEdit}
						onChatQueueDelete={onChatQueueDelete}
						onChatQueueForce={onChatQueueForce}
						connected={connected}
						error={error}
						modelLabel={modelLabel}
						onSend={onSend}
						onStop={onStop}
						onClearError={onClearError}
						onReopenLlmFixModal={onReopenLlmFixModal}
						appearanceDark={dark}
						agents={agents}
						agentTeams={agentTeams}
						agentsLoading={agentsLoading}
						chatAgentName={chatAgentName}
						dispatchTurnAgent={dispatchTurnAgent}
						onChatAgentChange={onChatAgentChange}
						chatMode={chatMode}
						onChatModeChange={onChatModeChange}
						contextFillPct={contextFillPct}
						contextTitle={contextTitle}
						onOpenPlanFileForReview={handlePlanFileReview}
						sessionLeadFallbackLabel="Claw"
						clawAgentAvailable={clawAgentAvailable}
					/>
				</div>

				<ClawSessionSidebar
					tabs={chatTabs}
					activeTabId={activeChatTabId}
					onSelect={onSelectChatTab}
					onClose={onCloseChatTab}
					onRename={onRenameChatTab}
					dark={dark}
					streaming={streaming}
				/>

				{/* File panel */}
				{showFilePanel ? (
					<>
						<DockSplitHandle
							orientation="vertical"
							className={splitHandleC}
							onDelta={(dx) => {
								setFilePanelWidth((w) =>
									Math.max(FILE_PANEL_MIN_PX, w - dx),
								);
							}}
							ariaLabel="Resize chat and file panel"
						/>
						<div
							className="flex min-h-0 flex-col overflow-hidden"
							style={{ width: filePanelWidth, minWidth: FILE_PANEL_MIN_PX, flexShrink: 0 }}
						>
							<ClawFilePanel
								nodes={filePanelNodes}
								treeLoading={filePanelTreeLoading}
								filePanelRootLabel={filePanelRootLabel}
								filePanelTreeError={filePanelTreeError}
								onAddClawMarkdownDocument={
									onAddClawMarkdownDocument ? handleAddClawMarkdownDocument : undefined
								}
								addClawMarkdownDocumentBusy={Boolean(addClawMarkdownDocumentBusy)}
								selectedPath={selectedPath}
								onSelectFile={handleOpenClawFile}
								content={content}
								setContent={setContent}
								persistEncoding={persistEncoding}
								fileMimeType={fileMimeType}
								fileLoading={fileLoading}
								fileError={fileError}
								dirty={dirty}
								onSave={async () => {
									await onSave();
									await onRefreshTree();
									await onRefreshFilePanelTree();
								}}
								onDiscardUnsaved={onDiscardUnsaved}
								onClose={() => setSelectedPath(null)}
								onCursor={onCursor}
								workspaceEditorRef={workspaceEditorRef}
								onUndoRedoStackChange={onUndoRedoStackChange}
								onSelectionPrefsChange={onSelectionPrefsChange}
								onFindInFiles={onFindInFiles}
								onReplaceInFiles={onReplaceInFiles}
								onMoveFileToDirectory={onMoveFileToDirectory}
								allowWorkspaceRootDrop={false}
								dark={dark}
							/>
						</div>
					</>
				) : null}
			</div>
		</div>
	);
}

/** File tree + editor inside the Claw chat file panel. */
function ClawFilePanel({
	nodes,
	treeLoading,
	filePanelRootLabel,
	filePanelTreeError,
	onAddClawMarkdownDocument,
	addClawMarkdownDocumentBusy,
	selectedPath,
	onSelectFile,
	content,
	setContent,
	persistEncoding,
	fileMimeType,
	fileLoading,
	fileError,
	dirty,
	onSave,
	onDiscardUnsaved,
	onClose,
	onCursor,
	workspaceEditorRef,
	onUndoRedoStackChange,
	onSelectionPrefsChange,
	onFindInFiles,
	onReplaceInFiles,
	onMoveFileToDirectory,
	allowWorkspaceRootDrop = false,
	dark,
}: {
	nodes: TreeNode[];
	treeLoading: boolean;
	filePanelRootLabel?: string | null;
	filePanelTreeError?: string | null;
	onAddClawMarkdownDocument?: () => void | Promise<void>;
	addClawMarkdownDocumentBusy?: boolean;
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	content: string;
	setContent: (s: string) => void;
	persistEncoding: FilePersistEncoding;
	fileMimeType: string | null;
	fileLoading: boolean;
	fileError: string | null;
	dirty: boolean;
	onSave: () => void | Promise<void>;
	onDiscardUnsaved: () => void;
	onClose: () => void;
	onCursor: (l: number, c: number) => void;
	workspaceEditorRef?: React.RefObject<WorkspaceEditorRef | null>;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	onFindInFiles?: () => void;
	onReplaceInFiles?: () => void;
	onMoveFileToDirectory?: (fromPath: string, toDirPath: string) => Promise<void>;
	allowWorkspaceRootDrop?: boolean;
	dark: boolean;
}) {
	const borderC = dark ? "border-[#252526]" : "border-[#e5e5e5]";
	const treeBg = dark ? "bg-[#1a1a1a]" : "bg-[#f5f5f5]";
	const muted = dark ? "text-[#585858]" : "text-[#aaaaaa]";
	const emptyHint = dark ? "text-[#585858]" : "text-[#aaaaaa]";

	// Preview-first: markdown defaults to rendered view; resets on each new file.
	const [markdownMode, setMarkdownMode] = useState<"preview" | "source">("preview");
	useEffect(() => {
		setMarkdownMode("preview");
	}, [selectedPath]);

	const addBusy = Boolean(addClawMarkdownDocumentBusy);

	return (
		<div className={`flex min-h-0 flex-1 flex-col overflow-hidden border-l ${borderC}`}>
			{/* Panel header */}
			<div
				className={`flex shrink-0 flex-col gap-1 border-b px-3 py-1.5 ${borderC} ${dark ? "bg-[#1a1a1a]" : "bg-[#f5f5f5]"}`}
			>
				<div className="flex min-w-0 items-start justify-between gap-2">
					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<span className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>
							Files · .claw
						</span>
						{filePanelRootLabel ? (
							<span
								className={`truncate font-mono text-[9px] ${dark ? "text-[#6f6f6f]" : "text-[#9ca3af]"}`}
								title={filePanelRootLabel}
							>
								{filePanelRootLabel}
							</span>
						) : null}
					</div>
					<div className="flex shrink-0 items-center gap-2">
						{onAddClawMarkdownDocument ? (
							<button
								type="button"
								disabled={addBusy}
								title="Create a new Markdown file in Workspace"
								onClick={() => void onAddClawMarkdownDocument()}
								className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${
									dark
										? "border-[#3c3c3c] bg-[#2d2d2d] text-[#cccccc] hover:bg-[#383838] disabled:opacity-50"
										: "border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
								}`}
							>
								<FilePlus size={12} className="shrink-0 opacity-80" aria-hidden />
								Add document
							</button>
						) : null}
						{selectedPath ? (
							<span
								className={`hidden max-w-[120px] truncate font-mono text-[10px] sm:inline ${dark ? "text-[#858585]" : "text-[#888888]"}`}
								title={selectedPath}
							>
								{selectedPath
									.replace(/^\.claw\/workspace\//, "")
									.replace(/^\.claw\//, "")}
							</span>
						) : null}
					</div>
				</div>
				{filePanelTreeError ? (
					<p
						className={`font-mono text-[10px] leading-snug ${dark ? "text-red-400" : "text-red-600"}`}
						title={filePanelTreeError}
					>
						{filePanelTreeError}
					</p>
				) : null}
			</div>

			{/* Tree (always visible, compact) — search bar pinned; list scrolls */}
			<div
				className={`flex min-h-0 max-h-[min(45vh,260px)] shrink-0 flex-col overflow-hidden border-b ${borderC} ${treeBg}`}
			>
				{treeLoading ? (
					<p className={`p-3 text-[11px] ${muted}`}>Loading…</p>
				) : (
					<SimpleFileTree
						nodes={nodes}
						selectedPath={selectedPath}
						onSelectFile={onSelectFile}
						appearanceDark={dark}
						onMoveFileToDirectory={onMoveFileToDirectory}
						allowWorkspaceRootDrop={allowWorkspaceRootDrop}
						emptyTreeHint="No files under host .claw/ yet. Use Mission → workspace setup, Add document, or create .claw/ on disk."
					/>
				)}
			</div>

			{/* Editor / preview */}
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{selectedPath ? (
					<SimpleFilePanel
						ref={workspaceEditorRef}
						path={selectedPath}
						content={content}
						onChange={setContent}
						persistEncoding={persistEncoding}
						fileMimeType={fileMimeType}
						loading={fileLoading}
						error={fileError}
						dirty={dirty}
						onSave={onSave}
						onDiscardUnsaved={onDiscardUnsaved}
						onClose={onClose}
						onCursor={onCursor}
						appearanceDark={dark}
						onUndoRedoStackChange={onUndoRedoStackChange}
						onSelectionPrefsChange={onSelectionPrefsChange}
						onFindInFiles={onFindInFiles}
						onReplaceInFiles={onReplaceInFiles}
						columnLayout="besideChat"
						markdownPaneMode={markdownMode}
						onMarkdownPaneModeChange={setMarkdownMode}
					/>
				) : (
					<div className={`flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center ${emptyHint}`}>
						<span className="text-[11px] font-semibold text-[#cccccc]">Workspace</span>
						<span className="text-[11px]">Pick a file from the list on the left to view or edit it here.</span>
						<span className="text-[10px] opacity-70">The assistant can still open files from your opened project when you ask.</span>
					</div>
				)}
			</div>
		</div>
	);
}
