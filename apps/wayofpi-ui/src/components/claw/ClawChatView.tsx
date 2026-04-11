/**
 * Claw Chat tab — session-aware chat with an optional `.claw/` file panel.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Active session + [New] [.claw/]                            │  ← ClawSessionStrip
 *   ├──────────────────────────┬──────────────┬────────────────┤
 *   │  SimpleChatView          │ Session list │ .claw/ files   │
 *   │                          │ (sidebar)    │ (when open)    │
 *   └──────────────────────────┴──────────────┴────────────────┘
 *
 * The file panel shows the `.claw/` directory tree on the left and opens
 * any file in a read/edit view. The user can also open any workspace file
 * from here — Claw can reach other files when requested.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSessionTab, ChatSessionMode, ChatRow } from "../../hooks/useWayOfPiSession";
import type { AgentMeta } from "../../hooks/useAgents";
import type { ChatQueueItem } from "../../utils/chatQueueTranscript";
import type { TreeNode } from "../../types/tree";
import type { FilePersistEncoding } from "../../hooks/useFileEditor";
import type { WorkspaceEditorRef } from "../../types/workspaceEditor";
import type { ClawHelpSectionId } from "./ClawHelpModal";
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
	// Files
	nodes,
	treeLoading,
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
	allowWorkspaceRootDrop = false,
	onGoToTelegramChannels,
	onOpenClawHelpSection,
	dark,
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
	nodes: TreeNode[];
	treeLoading: boolean;
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
	onGoToTelegramChannels?: () => void;
	onOpenClawHelpSection?: (section: ClawHelpSectionId) => void;
	dark: boolean;
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
						onGoToTelegramChannels={onGoToTelegramChannels}
						onOpenClawHelpSection={onOpenClawHelpSection}
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
								nodes={nodes}
								treeLoading={treeLoading}
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
									onRefreshTree();
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
								allowWorkspaceRootDrop={allowWorkspaceRootDrop}
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

	return (
		<div className={`flex min-h-0 flex-1 flex-col overflow-hidden border-l ${borderC}`}>
			{/* Panel header */}
			<div
				className={`flex shrink-0 items-center justify-between border-b px-3 py-1.5 ${borderC} ${dark ? "bg-[#1a1a1a]" : "bg-[#f5f5f5]"}`}
			>
				<span className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>
					Files
				</span>
				{selectedPath ? (
					<span className={`truncate font-mono text-[10px] ${dark ? "text-[#858585]" : "text-[#888888]"} max-w-[160px]`}>
						{selectedPath.replace(/^\.claw\//, "")}
					</span>
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
						<span className="font-mono text-[11px]">.claw/</span>
						<span className="text-[11px]">Select a file to view or edit it here.</span>
						<span className="text-[10px] opacity-70">The agent can reach any workspace file when asked.</span>
					</div>
				)}
			</div>
		</div>
	);
}
