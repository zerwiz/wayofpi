/**
 * Claw UI root shell.
 *
 * Same colour system and aesthetic as SimpleApp (uses `useSimplePreferences` for dark/light).
 * Distinct from Technical: full-height **left nav rail** instead of IDE activity bar;
 * **Mission** tab as default instead of a file tree; no workspace grid.
 */
import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import { useClawWorkspace } from "../../hooks/useClawWorkspace";
import {
	isClawWorkspaceOnboardingDismissed,
	markClawWorkspaceOnboardingDismissed,
} from "../../utils/clawWorkspaceOnboardingStorage";
import type { ServerConfig } from "../../hooks/useServerConfig";
import type { ChatRow, ChatSessionMode, ChatSessionTab, LogRow } from "../../hooks/useWayOfPiSession";
import type { ChatQueueItem } from "../../utils/chatQueueTranscript";
import type { UiMode } from "../../hooks/useUiMode";
import type { TreeNode } from "../../types/tree";
import type { FilePersistEncoding } from "../../hooks/useFileEditor";
import type { WorkspaceEditorRef } from "../../types/workspaceEditor";
import type { PiModelConfigPath } from "../../constants/piModelConfigPaths";
import { useSimplePreferences } from "../../hooks/useSimplePreferences";
import { useAgents } from "../../hooks/useAgents";
import { StatusBar } from "../StatusBar";
import { SimpleTeamView } from "../simple/SimpleTeamView";
import { SimpleSettingsView } from "../simple/SimpleSettingsView";
import { SimpleFilePanel } from "../simple/SimpleFilePanel";
import { SimpleFileTree } from "../simple/SimpleFileTree";
import { getClawUiModule, isClawBuiltinTab } from "../../claw/clawUiModules";
import { ClawNavRail, type ClawTabId } from "./ClawNavRail";
import type { ClawHelpSectionId } from "./ClawHelpModal";
import { ClawMissionView } from "./ClawMissionView";
import { ClawChatView } from "./ClawChatView";
import { ClawSchedulesView } from "./ClawSchedulesView";
import { ClawChannelsView } from "./ClawChannelsView";
import { ClawWorkspaceOnboardingModal } from "./ClawWorkspaceOnboardingModal";
import { DockSplitHandle } from "../DockSplitHandle";

/** Files tab: resizable file tree column (default matches former `w-56`). */
const FILES_TREE_DEFAULT_PX = 224;
const FILES_TREE_MIN_PX = 160;
const FILES_TREE_MAX_PX = 720;

function languageFromPath(path: string | null): string {
	if (!path) return "Plain Text";
	const ext = path.split(".").pop()?.toLowerCase() ?? "";
	const map: Record<string, string> = {
		py: "Python", ts: "TypeScript", tsx: "TypeScript", js: "JavaScript",
		jsx: "JavaScript", json: "JSON", md: "Markdown", yml: "YAML", yaml: "YAML",
	};
	return map[ext] ?? "Plain Text";
}

export type ClawAppProps = {
	uiMode: UiMode;
	setUiMode: (m: UiMode) => void;
	root: string | null;
	rootLabel: string;
	nodes: TreeNode[];
	treeLoading: boolean;
	treeError: string | null;
	refreshTree: () => void;
	modelLabel: string;
	config: ServerConfig | null;
	effectiveModel: string | null;
	onSelectLlmModel: (modelId: string) => void;
	selectedPath: string | null;
	setSelectedPath: (p: string | null) => void;
	content: string;
	setContent: (s: string) => void;
	persistEncoding: FilePersistEncoding;
	fileMimeType: string | null;
	fileLoading: boolean;
	fileError: string | null;
	dirty: boolean;
	save: () => Promise<boolean>;
	discardUnsavedChanges: () => void;
	line: number;
	col: number;
	onCursor: (l: number, c: number) => void;
	rows: ChatRow[];
	logs: LogRow[];
	/** Session tab management */
	chatTabs: ChatSessionTab[];
	activeChatTabId: string;
	onSelectChatTab: (id: string) => void;
	onCloseChatTab: (id: string) => void;
	onRenameChatTab: (id: string, label: string) => void;
	onNewSession: () => void;
	streaming: boolean;
	chatStreamUiEnabled: boolean;
	onChatStreamUiEnabledChange: (on: boolean) => void;
	chatQueuePending: number;
	chatQueueItems: ChatQueueItem[];
	editChatQueueItem: (id: string, text: string) => void;
	deleteChatQueueItem: (id: string) => void;
	forceChatQueueItem: (id: string) => void;
	connected: boolean;
	error: string | null;
	sendChat: (t: string) => void;
	stop: () => void;
	clearError: () => void;
	onReopenLlmFixModal?: () => void;
	chatAgentName: string | null;
	dispatchTurnAgent?: string | null;
	onChatAgentChange: (name: string | null) => void;
	chatMode: ChatSessionMode;
	onChatModeChange: (m: ChatSessionMode) => void;
	activeTab: ClawTabId;
	onTabChange: (t: ClawTabId) => void;
	providerConfigInitialPath?: PiModelConfigPath | null;
	providerConfigInitialNonce?: number;
	onConsumeProviderConfigFocus?: () => void;
	workspaceEditorRef?: RefObject<WorkspaceEditorRef | null>;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	onFindInFiles?: () => void;
	onReplaceInFiles?: () => void;
	teamsYamlWritePath: string;
	workspaceReady: boolean;
	onOpenTeamsYaml?: () => void;
	onCreateAgentDefinition?: () => void;
	onNewPlanFile: () => void;
	newPlanFileDisabled: boolean;
	onOpenIndexingDocs?: () => void;
	onOpenHostDoctor: () => void;
	/** Open Claw Help; optional section defaults to Overview (product roadmap). */
	onHelp?: (defaultSection?: ClawHelpSectionId | null) => void;
	contextPct: string;
	contextFillPct: number | null;
	tokensDown: string;
	tokensUp: string;
	contextTitle: string;
	tokensTitle: string;
	onMoveFileToDirectory?: (fromPath: string, toDirPath: string) => Promise<void>;
	allowWorkspaceRootDrop?: boolean;
};

export function ClawApp({
	uiMode,
	setUiMode,
	root,
	rootLabel: _rootLabel,
	nodes,
	treeLoading,
	treeError: _treeError,
	refreshTree,
	modelLabel,
	config,
	effectiveModel: _effectiveModel,
	onSelectLlmModel: _onSelectLlmModel,
	selectedPath,
	setSelectedPath,
	content,
	setContent,
	persistEncoding,
	fileMimeType,
	fileLoading,
	fileError,
	dirty,
	save,
	discardUnsavedChanges,
	line,
	col,
	onCursor,
	rows,
	logs,
	chatTabs,
	activeChatTabId,
	onSelectChatTab,
	onCloseChatTab,
	onRenameChatTab,
	onNewSession,
	streaming,
	chatStreamUiEnabled,
	onChatStreamUiEnabledChange,
	chatQueuePending,
	chatQueueItems,
	editChatQueueItem,
	deleteChatQueueItem,
	forceChatQueueItem,
	connected,
	error,
	sendChat,
	stop,
	clearError,
	onReopenLlmFixModal,
	chatAgentName,
	dispatchTurnAgent,
	onChatAgentChange,
	chatMode,
	onChatModeChange,
	activeTab,
	onTabChange,
	providerConfigInitialPath: _providerConfigInitialPath,
	providerConfigInitialNonce: _providerConfigInitialNonce,
	onConsumeProviderConfigFocus: _onConsumeProviderConfigFocus,
	workspaceEditorRef,
	onUndoRedoStackChange,
	onSelectionPrefsChange,
	onFindInFiles,
	onReplaceInFiles,
	teamsYamlWritePath,
	workspaceReady,
	onOpenTeamsYaml,
	onCreateAgentDefinition,
	onNewPlanFile,
	newPlanFileDisabled: _newPlanFileDisabled,
	onOpenIndexingDocs,
	onOpenHostDoctor,
	onHelp,
	contextPct,
	contextFillPct,
	tokensDown,
	tokensUp,
	contextTitle,
	tokensTitle,
	onMoveFileToDirectory,
	allowWorkspaceRootDrop = false,
}: ClawAppProps) {
	const {
		isDark,
		colorMode,
		setColorMode,
		approvalQueue,
		setApprovalQueue,
	} = useSimplePreferences();
	const agentsApi = useAgents();

	const workspacePath = root ?? "—";
	const clawWorkspace = useClawWorkspace(!!root);

	const [clawWorkspaceOnboardingOpen, setClawWorkspaceOnboardingOpen] = useState(false);

	useEffect(() => {
		setClawWorkspaceOnboardingOpen(false);
	}, [root]);

	useEffect(() => {
		if (!root || !clawWorkspace.ready || clawWorkspace.missingCount === 0) return;
		if (isClawWorkspaceOnboardingDismissed(root)) return;
		setClawWorkspaceOnboardingOpen(true);
	}, [root, clawWorkspace.ready, clawWorkspace.missingCount]);

	const dismissClawWorkspaceOnboarding = useCallback(() => {
		if (root) markClawWorkspaceOnboardingDismissed(root);
		setClawWorkspaceOnboardingOpen(false);
	}, [root]);

	useEffect(() => {
		if (!clawWorkspaceOnboardingOpen) return;
		if (!clawWorkspace.ready || clawWorkspace.scaffolding) return;
		if (clawWorkspace.missingCount === 0) {
			if (root) markClawWorkspaceOnboardingDismissed(root);
			setClawWorkspaceOnboardingOpen(false);
		}
	}, [
		clawWorkspaceOnboardingOpen,
		root,
		clawWorkspace.ready,
		clawWorkspace.missingCount,
		clawWorkspace.scaffolding,
	]);

	const clawModuleContext = useMemo(
		() => ({
			activeTab,
			workspaceRoot: root,
			appearanceDark: isDark,
			serverConfig: config,
			setTab: onTabChange,
			openWorkspaceFile: (relativePath: string) => {
				setSelectedPath(relativePath);
				onTabChange("files");
			},
		}),
		[activeTab, root, isDark, config, onTabChange, setSelectedPath],
	);

	useEffect(() => {
		if (isClawBuiltinTab(activeTab)) return;
		if (!getClawUiModule(activeTab)) onTabChange("mission");
	}, [activeTab, onTabChange]);

	const copyWorkspacePath = useCallback(() => {
		if (!root) return;
		void navigator.clipboard.writeText(root);
	}, [root]);

	const openAgentFile = useCallback(
		(relativePath: string) => {
			setSelectedPath(relativePath);
			onTabChange("files");
		},
		[setSelectedPath, onTabChange],
	);

	const openFile = useCallback(
		(path: string) => {
			setSelectedPath(path);
			onTabChange("files");
		},
		[setSelectedPath, onTabChange],
	);

	// Default to preview in Claw — reset whenever the open file changes.
	const [clawMarkdownMode, setClawMarkdownMode] = useState<"preview" | "source">("preview");
	useEffect(() => {
		setClawMarkdownMode("preview");
	}, [selectedPath]);

	const [filesTreeWidthPx, setFilesTreeWidthPx] = useState(FILES_TREE_DEFAULT_PX);
	const filesSplitHandleClass = isDark
		? "hidden md:block"
		: "hidden md:block !bg-[#ececec] hover:!bg-[#007acc]/35 active:!bg-[#007acc]/55";

	const bg = isDark ? "bg-[#1e1e1e] text-[#cccccc] selection:bg-[#264f78]" : "bg-[#f3f3f3] text-[#333333] selection:bg-[#add6ff]/60";

	return (
		<div
			data-claw-theme={isDark ? "dark" : "light"}
			className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden font-sans ${bg}`}
		>
			{/* ── Body ── */}
			<div className="flex min-h-0 flex-1 overflow-hidden">
				{/* Nav rail */}
				<ClawNavRail activeTab={activeTab} onTab={onTabChange} onHelp={onHelp} appearanceDark={isDark} />

				{/* Main panel */}
				<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
					{activeTab === "mission" ? (
						<ClawMissionView
							config={config}
							connected={connected}
							streaming={streaming}
							agents={agentsApi.data?.agents ?? []}
							agentsLoading={agentsApi.loading}
							logs={logs}
							workspacePath={workspacePath}
							onStartChat={() => onTabChange("chat")}
							onNewPlan={onNewPlanFile}
							onOpenHostDoctor={onOpenHostDoctor}
							onSwitchToTeam={() => onTabChange("team")}
							onSwitchToSchedule={() => onTabChange("schedule")}
							onSwitchToChannels={() => onTabChange("channels")}
							onOpenFile={openFile}
							onOpenClawHelp={onHelp}
							dark={isDark}
							clawWorkspace={clawWorkspace}
						/>
				) : activeTab === "chat" ? (
					<ClawChatView
						chatTabs={chatTabs}
						activeChatTabId={activeChatTabId}
						onSelectChatTab={onSelectChatTab}
						onCloseChatTab={onCloseChatTab}
						onRenameChatTab={onRenameChatTab}
						onNewSession={onNewSession}
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
						nodes={nodes}
						treeLoading={treeLoading}
						selectedPath={selectedPath}
						setSelectedPath={setSelectedPath}
						content={content}
						setContent={setContent}
						persistEncoding={persistEncoding}
						fileMimeType={fileMimeType}
						fileLoading={fileLoading}
						fileError={fileError}
						dirty={dirty}
						onSave={save}
						onDiscardUnsaved={discardUnsavedChanges}
						onCursor={onCursor}
						workspaceEditorRef={workspaceEditorRef}
						onUndoRedoStackChange={onUndoRedoStackChange}
						onSelectionPrefsChange={onSelectionPrefsChange}
						onFindInFiles={onFindInFiles}
						onReplaceInFiles={onReplaceInFiles}
						onRefreshTree={refreshTree}
						onMoveFileToDirectory={onMoveFileToDirectory}
						allowWorkspaceRootDrop={allowWorkspaceRootDrop}
						dark={isDark}
					/>
					) : activeTab === "team" ? (
						<SimpleTeamView
							modelLabel={modelLabel}
							agents={agentsApi.data?.agents ?? []}
							teams={agentsApi.data?.teams ?? {}}
							teamsPath={agentsApi.data?.teamsPath ?? null}
							teamsYamlWritePath={teamsYamlWritePath}
							workspaceReady={workspaceReady}
							loading={agentsApi.loading}
							error={agentsApi.error}
							onReload={agentsApi.reload}
							onOpenAgentFile={openAgentFile}
							onOpenTeamsYaml={onOpenTeamsYaml}
							onCreateAgentDefinition={onCreateAgentDefinition}
							appearanceDark={isDark}
						/>
					) : activeTab === "schedule" ? (
						<ClawSchedulesView dark={isDark} onOpenClawHelp={onHelp} />
					) : activeTab === "channels" ? (
						<ClawChannelsView dark={isDark} onOpenFile={openFile} onOpenClawHelp={onHelp} />
					) : activeTab === "files" ? (
						<div className="flex min-h-0 flex-1 overflow-hidden">
							{/* File tree sidebar */}
							<div
								className={`flex min-h-0 shrink-0 flex-col overflow-hidden ${
									isDark ? "bg-[#1a1a1a]" : "bg-white"
								}`}
								style={{
									width: filesTreeWidthPx,
									minWidth: FILES_TREE_MIN_PX,
									maxWidth: FILES_TREE_MAX_PX,
								}}
							>
								<SimpleFileTree
									nodes={nodes}
									selectedPath={selectedPath}
									onSelectFile={(p) => setSelectedPath(p)}
									appearanceDark={isDark}
									onExplorerGitMutated={() => void refreshTree()}
									onMoveFileToDirectory={onMoveFileToDirectory}
									allowWorkspaceRootDrop={allowWorkspaceRootDrop}
								/>
							</div>
							<DockSplitHandle
								orientation="vertical"
								className={filesSplitHandleClass}
								onDelta={(dx) => {
									setFilesTreeWidthPx((w) =>
										Math.min(
											FILES_TREE_MAX_PX,
											Math.max(FILES_TREE_MIN_PX, w + dx),
										),
									);
								}}
								ariaLabel="Resize file tree and document"
							/>
							{/* Preview / editor panel — full height, markdown defaults to rendered preview */}
							<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
										onDiscardUnsaved={discardUnsavedChanges}
										onSave={async () => {
											await save();
											await refreshTree();
										}}
										onClose={() => setSelectedPath(null)}
										onCursor={onCursor}
										appearanceDark={isDark}
										onUndoRedoStackChange={onUndoRedoStackChange}
										onSelectionPrefsChange={onSelectionPrefsChange}
										onFindInFiles={onFindInFiles}
										onReplaceInFiles={onReplaceInFiles}
										columnLayout="besideChat"
										markdownPaneMode={clawMarkdownMode}
										onMarkdownPaneModeChange={setClawMarkdownMode}
									/>
								) : (
									<div
										className={`flex flex-1 flex-col items-center justify-center gap-2 text-[13px] ${
											isDark ? "text-[#585858]" : "text-[#aaaaaa]"
										}`}
									>
										<span>Select a file to preview or edit it.</span>
										<span className={`text-[11px] ${isDark ? "text-[#3c3c3c]" : "text-[#cccccc]"}`}>
											Markdown files open in Preview mode by default.
										</span>
									</div>
								)}
							</div>
						</div>
					) : activeTab === "settings" ? (
						<SimpleSettingsView
							colorMode={colorMode}
							onColorMode={setColorMode}
							approvalQueue={approvalQueue}
							onApprovalQueue={setApprovalQueue}
							onSwitchToTechnical={() => setUiMode("technical")}
							onOpenIndexingDocs={onOpenIndexingDocs}
							serverConfig={config}
						/>
					) : (() => {
						const mod = getClawUiModule(activeTab);
						return mod ? mod.render(clawModuleContext) : null;
					})()}
				</div>
			</div>

			{/* ── Status bar ── */}
			<StatusBar
				uiMode={uiMode}
				workspaceRoot={workspacePath}
				connected={connected}
				line={line}
				col={col}
				language={languageFromPath(selectedPath)}
				contextPct={contextPct}
				tokensDown={tokensDown}
				tokensUp={tokensUp}
				contextTitle={contextTitle}
				tokensTitle={tokensTitle}
				onCopyWorkspacePath={copyWorkspacePath}
				simpleAppearanceDark={isDark}
			/>

			{root ? (
				<ClawWorkspaceOnboardingModal
					open={clawWorkspaceOnboardingOpen}
					dark={isDark}
					workspaceRoot={root}
					ws={clawWorkspace}
					onDismiss={dismissClawWorkspaceOnboarding}
				/>
			) : null}
		</div>
	);
}
