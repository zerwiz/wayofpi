import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { StatusBar } from "../StatusBar";
import { DockSplitHandle } from "../DockSplitHandle";
import type { ServerConfig } from "../../hooks/useServerConfig";
import { useAgents } from "../../hooks/useAgents";
import { useSimpleChatWorkspaceLayout } from "../../hooks/useSimpleChatWorkspaceLayout";
import { useSimplePreferences } from "../../hooks/useSimplePreferences";
import type { PiModelConfigPath } from "../../constants/piModelConfigPaths";
import type { ChatRow, ChatSessionMode, LogRow } from "../../hooks/useWayOfPiSession";
import type { UiMode } from "../../hooks/useUiMode";
import type { TreeNode } from "../../types/tree";
import type { FilePreview } from "../../types/workspaceFile";
import { SimpleChatView } from "./SimpleChatView";
import { SimpleFilePanel } from "./SimpleFilePanel";
import { SimplePlanWorkspacePane } from "./SimplePlanWorkspacePane";
import { SimpleModelsView } from "./SimpleModelsView";
import type { WorkspaceEditorRef } from "../../types/workspaceEditor";
import type { SimpleTabId } from "./SimpleNavRail";
import { SimpleNavRail } from "./SimpleNavRail";
import { SimpleProjectsView } from "./SimpleProjectsView";
import { SimpleRightPanel } from "./SimpleRightPanel";
import { SimpleSecondaryToolbar } from "./SimpleSecondaryToolbar";
import { SimpleSettingsView } from "./SimpleSettingsView";
import { SimpleTeamView } from "./SimpleTeamView";

function languageFromPath(path: string | null): string {
	if (!path) return "Plain Text";
	const ext = path.split(".").pop()?.toLowerCase() ?? "";
	const map: Record<string, string> = {
		py: "Python",
		ts: "TypeScript",
		tsx: "TypeScript",
		js: "JavaScript",
		jsx: "JavaScript",
		json: "JSON",
		md: "Markdown",
		yml: "YAML",
		yaml: "YAML",
	};
	return map[ext] ?? "Plain Text";
}

export function SimpleApp({
	uiMode,
	setUiMode,
	root,
	rootLabel,
	nodes,
	treeLoading,
	treeError,
	refreshTree,
	modelLabel,
	config,
	effectiveModel,
	onSelectLlmModel,
	selectedPath,
	setSelectedPath,
	content,
	setContent,
	filePreview,
	fileLoading,
	fileError,
	dirty,
	save,
	line,
	col,
	onCursor,
	rows,
	logs,
	streaming,
	chatStreamUiEnabled,
	onChatStreamUiEnabledChange,
	chatQueuePending,
	connected,
	error,
	sendChat,
	stop,
	clearError,
	chatAgentName,
	onChatAgentChange,
	chatMode,
	onChatModeChange,
	activeTab,
	onTabChange,
	providerConfigInitialPath,
	providerConfigInitialNonce,
	onConsumeProviderConfigFocus,
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
	newPlanFileDisabled,
}: {
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
	filePreview: FilePreview | null;
	fileLoading: boolean;
	fileError: string | null;
	dirty: boolean;
	save: () => Promise<void>;
	line: number;
	col: number;
	onCursor: (l: number, c: number) => void;
	rows: ChatRow[];
	logs: LogRow[];
	streaming: boolean;
	chatStreamUiEnabled: boolean;
	onChatStreamUiEnabledChange: (on: boolean) => void;
	chatQueuePending: number;
	connected: boolean;
	error: string | null;
	sendChat: (t: string) => void;
	stop: () => void;
	clearError: () => void;
	chatAgentName: string | null;
	onChatAgentChange: (name: string | null) => void;
	chatMode: ChatSessionMode;
	onChatModeChange: (m: ChatSessionMode) => void;
	activeTab: SimpleTabId;
	onTabChange: (t: SimpleTabId) => void;
	providerConfigInitialPath?: PiModelConfigPath | null;
	providerConfigInitialNonce?: number;
	onConsumeProviderConfigFocus?: () => void;
	workspaceEditorRef?: RefObject<WorkspaceEditorRef | null>;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	onFindInFiles?: () => void;
	onReplaceInFiles?: () => void;
	/** Primary `teams.yaml` path for GET/PUT (matches `/api/agents` + multi-root). */
	teamsYamlWritePath: string;
	workspaceReady: boolean;
	onOpenTeamsYaml?: () => void;
	onCreateAgentDefinition?: () => void;
	onNewPlanFile: () => void;
	newPlanFileDisabled: boolean;
}) {
	const [leftOpen, setLeftOpen] = useState(true);
	const [rightOpen, setRightOpen] = useState(true);
	const {
		approvalQueue,
		setApprovalQueue,
		isDark,
		colorMode,
		setColorMode,
		markdownPaneMode,
		setMarkdownPaneMode,
	} = useSimplePreferences();
	const {
		chatWorkspaceLayout,
		setChatWorkspaceLayout,
		toggleChatWorkspaceLayout,
		chatColumnWidthPx,
		applyChatSplitDelta,
	} = useSimpleChatWorkspaceLayout();
	const agentsApi = useAgents();

	const prevChatPathRef = useRef<string | null>(selectedPath);
	const prevSimpleTabRef = useRef<SimpleTabId>(activeTab);
	useEffect(() => {
		const pathJustOpened = prevChatPathRef.current == null && selectedPath != null;
		const switchedToChatWithFile =
			prevSimpleTabRef.current !== "chat" && activeTab === "chat" && selectedPath != null;
		prevChatPathRef.current = selectedPath;
		prevSimpleTabRef.current = activeTab;
		if (activeTab !== "chat" || !selectedPath) return;
		if (pathJustOpened || switchedToChatWithFile) {
			setChatWorkspaceLayout("side_by_side");
		}
	}, [selectedPath, activeTab, setChatWorkspaceLayout]);

	const workspacePath = root ?? "—";
	const appearanceDark = isDark;

	const copyWorkspacePath = useCallback(() => {
		if (!root) return;
		void navigator.clipboard.writeText(root);
	}, [root]);

	const openAgentFile = useCallback(
		(relativePath: string) => {
			setSelectedPath(relativePath);
			onTabChange("chat");
		},
		[setSelectedPath, onTabChange],
	);

	const rootShell = appearanceDark
		? "bg-[#1e1e1e] text-[#cccccc] selection:bg-[#264f78]"
		: "bg-[#f3f3f3] text-[#333333] selection:bg-[#add6ff]/60";
	const mainCol = appearanceDark ? "bg-[#1e1e1e]" : "bg-[#f3f3f3]";
	const splitHandleTone = appearanceDark
		? "hidden md:block"
		: "hidden md:block !bg-[#ececec] hover:!bg-[#007acc]/35 active:!bg-[#007acc]/55";

	const chatViewEl = (
		<SimpleChatView
			rows={rows}
			streaming={streaming}
			chatStreamUiEnabled={chatStreamUiEnabled}
			onChatStreamUiEnabledChange={onChatStreamUiEnabledChange}
			chatQueuePending={chatQueuePending}
			connected={connected}
			error={error}
			modelLabel={modelLabel}
			onSend={sendChat}
			onStop={stop}
			onClearError={clearError}
			appearanceDark={appearanceDark}
			agents={agentsApi.data?.agents ?? []}
			agentsLoading={agentsApi.loading}
			chatAgentName={chatAgentName}
			onChatAgentChange={onChatAgentChange}
			chatMode={chatMode}
			onChatModeChange={onChatModeChange}
		/>
	);

	const emptyEditorHint = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const showPlanWorkspace = chatMode === "plan" && !selectedPath;

	return (
		<div
			data-simple-theme={appearanceDark ? "dark" : "light"}
			className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden font-sans ${rootShell}`}
		>
			<div className="flex min-h-0 flex-1 overflow-hidden">
				{leftOpen ? (
					<SimpleNavRail activeTab={activeTab} onTab={onTabChange} appearanceDark={appearanceDark} />
				) : null}

				<div className={`flex min-w-0 flex-1 flex-col ${mainCol}`}>
					<SimpleSecondaryToolbar
						leftOpen={leftOpen}
						rightOpen={rightOpen}
						onToggleLeft={() => setLeftOpen((v) => !v)}
						onToggleRight={() => setRightOpen((v) => !v)}
						connected={connected}
						appearanceDark={appearanceDark}
					/>

					<div className="flex min-h-0 flex-1 overflow-hidden">
						<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
							{activeTab === "chat" ? (
								chatWorkspaceLayout === "side_by_side" ? (
									<div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
										<div
											className="flex min-h-[min(36vh,280px)] min-w-0 w-full flex-1 flex-col md:min-h-0 md:min-w-[260px] md:max-w-[min(94vw,1600px)] md:flex-none md:[width:var(--wop-simple-chat-col)]"
											style={
												{ ["--wop-simple-chat-col" as string]: `${chatColumnWidthPx}px` } as CSSProperties
											}
										>
											{chatViewEl}
										</div>
										<DockSplitHandle
											orientation="vertical"
											className={splitHandleTone}
											onDelta={(dx) => applyChatSplitDelta(dx)}
											ariaLabel="Resize chat and editor"
										/>
										<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
											{selectedPath ? (
												<SimpleFilePanel
													ref={workspaceEditorRef}
													path={selectedPath}
													content={content}
													onChange={setContent}
													filePreview={filePreview}
													loading={fileLoading}
													error={fileError}
													dirty={dirty}
													onSave={async () => {
														await save();
														await refreshTree();
													}}
													onClose={() => setSelectedPath(null)}
													onCursor={onCursor}
													appearanceDark={appearanceDark}
													onUndoRedoStackChange={onUndoRedoStackChange}
													onSelectionPrefsChange={onSelectionPrefsChange}
													onFindInFiles={onFindInFiles}
													onReplaceInFiles={onReplaceInFiles}
													columnLayout="besideChat"
													markdownPaneMode={markdownPaneMode}
													onMarkdownPaneModeChange={setMarkdownPaneMode}
												/>
											) : showPlanWorkspace ? (
												<SimplePlanWorkspacePane
													appearanceDark={appearanceDark}
													columnLayout="besideChat"
													canCreatePlan={!newPlanFileDisabled}
													onNewPlanFile={onNewPlanFile}
												/>
											) : (
												<div
													className={`flex flex-1 items-center justify-center px-6 text-center text-sm leading-relaxed ${emptyEditorHint}`}
												>
													Open a file from Project Files to edit it here. Use the layout control next to
													&quot;Project Files&quot; if you prefer editor above chat.
												</div>
											)}
										</div>
									</div>
								) : (
									<>
										{selectedPath ? (
											<SimpleFilePanel
												ref={workspaceEditorRef}
												path={selectedPath}
												content={content}
												onChange={setContent}
												filePreview={filePreview}
												loading={fileLoading}
												error={fileError}
												dirty={dirty}
												onSave={async () => {
													await save();
													await refreshTree();
												}}
												onClose={() => setSelectedPath(null)}
												onCursor={onCursor}
												appearanceDark={appearanceDark}
												onUndoRedoStackChange={onUndoRedoStackChange}
												onSelectionPrefsChange={onSelectionPrefsChange}
												onFindInFiles={onFindInFiles}
												onReplaceInFiles={onReplaceInFiles}
												columnLayout="stacked"
												markdownPaneMode={markdownPaneMode}
												onMarkdownPaneModeChange={setMarkdownPaneMode}
											/>
										) : showPlanWorkspace ? (
											<SimplePlanWorkspacePane
												appearanceDark={appearanceDark}
												columnLayout="stacked"
												canCreatePlan={!newPlanFileDisabled}
												onNewPlanFile={onNewPlanFile}
											/>
										) : null}
										<div className="flex min-h-0 flex-1 flex-col overflow-hidden">{chatViewEl}</div>
									</>
								)
							) : null}
							{activeTab === "team" ? (
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
									appearanceDark={appearanceDark}
								/>
							) : null}
							{activeTab === "models" ? (
								<SimpleModelsView
									config={config}
									appearanceDark={appearanceDark}
									effectiveModel={effectiveModel}
									onSelectModel={onSelectLlmModel}
									providerConfigInitialPath={providerConfigInitialPath}
									providerConfigInitialNonce={providerConfigInitialNonce}
									onConsumeProviderConfigFocus={onConsumeProviderConfigFocus}
								/>
							) : null}
							{activeTab === "projects" ? (
								<SimpleProjectsView
									rootLabel={rootLabel}
									rootPath={workspacePath}
									onRefresh={() => void refreshTree()}
									appearanceDark={appearanceDark}
								/>
							) : null}
							{activeTab === "settings" ? (
								<SimpleSettingsView
									colorMode={colorMode}
									onColorMode={setColorMode}
									approvalQueue={approvalQueue}
									onApprovalQueue={setApprovalQueue}
									onSwitchToTechnical={() => setUiMode("technical")}
								/>
							) : null}
						</div>

						{rightOpen ? (
							<div className="hidden h-full shrink-0 md:flex">
								<SimpleRightPanel
									nodes={nodes}
									selectedPath={selectedPath}
									onSelectFile={setSelectedPath}
									loading={treeLoading}
									error={treeError}
									logs={logs}
									streaming={streaming}
									appearanceDark={appearanceDark}
									chatWorkspaceLayout={activeTab === "chat" ? chatWorkspaceLayout : undefined}
									onToggleChatWorkspaceLayout={
										activeTab === "chat" ? toggleChatWorkspaceLayout : undefined
									}
								/>
							</div>
						) : null}
					</div>
				</div>
			</div>

			<StatusBar
				uiMode={uiMode}
				workspaceRoot={workspacePath}
				connected={connected}
				line={line}
				col={col}
				language={languageFromPath(selectedPath)}
				contextPct="—"
				tokensDown="—"
				tokensUp="—"
				onCopyWorkspacePath={copyWorkspacePath}
				simpleAppearanceDark={appearanceDark}
			/>
		</div>
	);
}
