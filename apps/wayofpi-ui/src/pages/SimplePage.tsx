import { type ChangeEvent, type RefObject } from "react";
import type { TreeNode } from "../types/tree";
import type { SimpleTabId } from "../components/simple/SimpleNavRail";
import type { CommandItem } from "../components/CommandPalette";
import type { ChatRow, LogRow, ChatSessionTab, ChatSessionMode } from "../hooks/useWayOfPiSession";
import type { FileMenuProps } from "../types/fileMenu";
import type {
  EditMenuHandlers, GoMenuHandlers, HelpMenuHandlers,
  RunMenuHandlers, SelectionMenuHandlers, SettingsMenuHandlers,
  TerminalMenuHandlers,
} from "../types/workspaceEditor";
import type { ViewMenuSimpleOptions } from "../types/technicalShell";
import type { FilePersistEncoding } from "../hooks/useFileEditor";
import type { ServerConfig } from "../hooks/useServerConfig";
import type { PiModelConfigPath } from "../constants/piModelConfigPaths";
import type { WorkspaceEditorRef } from "../types/workspaceEditor";
import { IdeLayout } from "../components/IdeLayout";
import { SimpleApp } from "../components/simple/SimpleApp";
import { ModalsRenderer } from "../components/ModalsRenderer";

const WOP_PUBLIC_REPO_URL = "https://github.com/zerwiz/wayofpi";

interface ShellState {
  uiMode: string;
  setUiMode: (m: string) => void;
  modelLabel: string;
  config: ServerConfig | null;
  workspaceOperational: boolean;
}

interface TreeState {
  root: string;
  rootLabel: string;
  nodes: TreeNode[];
  treeLoading: boolean;
  treeError: string | null;
  refreshTree: () => Promise<void>;
  refreshTreeQuietShell: () => Promise<void>;
  folders: { label: string; path: string }[];
}

interface EditorState {
  selectedPath: string | null;
  setSelectedPath: (p: string | null) => void;
  content: string;
  setContent: (c: string) => void;
  dirty: boolean;
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
  discardUnsavedChanges: () => void;
  persistEncoding: FilePersistEncoding;
  fileMimeType: string;
  fileLoading: boolean;
  fileError: string | null;
  line: number;
  col: number;
  onCursor: (l: number, c: number) => void;
  saveAndRefresh: () => Promise<void>;
  copyWorkspacePath: () => void;
  workspaceEditorRef: RefObject<WorkspaceEditorRef | null>;
}

interface SessionState {
  rows: ChatRow[];
  logs: LogRow[];
  streaming: boolean;
  chatQueuePending: number;
  chatQueueItems: { id: string; text: string }[];
  editChatQueueItem: (id: string, text: string) => void;
  deleteChatQueueItem: (id: string) => void;
  forceChatQueueItem: (id: string) => void;
  connected: boolean;
  error: string | null;
  sendChat: (agentName: string, text: string) => void;
  stop: () => void;
  clearError: () => void;
  chatAgentName: string | null;
  setChatAgent: (name: string | null) => void;
  chatMode: ChatSessionMode;
  effectiveModel: string;
  setLlmModel: (m: string) => void;
  reconnectWebSocket: () => void;
  tokenMeter: { contextPct: number; tokensDown: number; tokensUp: number; contextTitle: string; tokensTitle: string };
  chatPulseMeters: { contextFillPct: number } | null;
}

interface MenuHandlers {
  fileMenu: FileMenuProps;
  editMenu: EditMenuHandlers;
  selectionMenu: SelectionMenuHandlers;
  goMenu: GoMenuHandlers;
  runMenu: RunMenuHandlers;
  terminalMenu: TerminalMenuHandlers;
  helpMenu: HelpMenuHandlers;
  settingsMenuHandlers: SettingsMenuHandlers;
  viewSimpleMenu: ViewMenuSimpleOptions | null;
  onOpenAgentSetup: () => void;
  onOpenTeamsYaml: () => void;
  onCreateAgentMarkdown: () => void;
  onReloadAgents: () => void;
  onOpenPiModelConfig: () => void;
  onSimpleChatStreamUiEnabledChange: (on: boolean) => void;
  handleChatModeChange: (m: ChatSessionMode) => void;
  handleNewPlanFile: () => void;
  openHostDoctor: () => void;
  persistLeftSidebar: (v: boolean) => void;
  setActivity: (a: string) => void;
  focusToolTab: (t: string) => void;
  openLlmFixSimpleBrains: () => void;
  openLlmFixProviderCatalog: () => void;
  openWorkspaceSearch: () => void;
  bumpEditorMenu: () => void;
  bumpSelectionPrefs: () => void;
  teamsYamlWritePath: string;
  simpleChatStreamUiEnabled: boolean;
  simpleProviderPath: PiModelConfigPath | null;
  simpleProviderNonce: number;
  consumeSimpleProviderFocus: () => void;
}

interface ModalState {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  commandPaletteItems: CommandItem[];
  hostDoctorOpen: boolean;
  setHostDoctorOpen: (v: boolean) => void;
  indexingDocsOpen: boolean;
  setIndexingDocsOpen: (v: boolean) => void;
  honchoSettingsOpen: boolean;
  setHonchoSettingsOpen: (v: boolean) => void;
  agentPermissionsOpen: boolean;
  setAgentPermissionsOpen: (v: boolean) => void;
  mitLicenseModalOpen: boolean;
  setMitLicenseModalOpen: (v: boolean) => void;
  restartServerModalOpen: boolean;
  setRestartServerModalOpen: (v: boolean) => void;
  howToUseModalOpen: boolean;
  setHowToUseModalOpen: (v: boolean) => void;
  launchConfigAddOpen: boolean;
  setLaunchConfigAddOpen: (v: boolean) => void;
  installDebuggersModalOpen: boolean;
  setInstallDebuggersModalOpen: (v: boolean) => void;
  newPlanFileModalOpen: boolean;
  setNewPlanFileModalOpen: (v: boolean) => void;
  showLlmFixModal: boolean;
  dismissLlmFixModal: () => void;
  llmFixModalAppearanceDark: boolean;
  newWorkspaceFileDraft: { defaultPath: string; initialContent?: string } | null;
  setNewWorkspaceFileDraft: (d: { defaultPath: string; initialContent?: string } | null) => void;
  performCreateNewWorkspaceFile: (path: string, initialContent?: string) => Promise<void>;
  appendLaunchConfigurationSnippet: (id: any) => Promise<void>;
}

interface SimplePageProps {
  shell: ShellState;
  tree: TreeState;
  editor: EditorState;
  session: SessionState;
  menus: MenuHandlers;
  modals: ModalState;
  workspaceFileInputRef: RefObject<HTMLInputElement | null>;
  onWorkspaceFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  simpleTab: SimpleTabId;
  setSimpleTab: (tab: SimpleTabId) => void;
  handleOpenFolderPrompt: () => void;
  handleOpenRecentFolder: (path: string) => void;
  recentFolders: string[];
  refreshServerConfig: () => void;
  planHandoffWorkspaceKey: string | null;
  handleExplorerMoveFile: (fromPath: string, toDirPath: string) => Promise<void>;
}

export function SimplePage({
  shell, tree, editor, session, menus, modals,
  workspaceFileInputRef, onWorkspaceFileChange,
  simpleTab, setSimpleTab,
  handleOpenFolderPrompt, handleOpenRecentFolder, recentFolders,
  refreshServerConfig, planHandoffWorkspaceKey,
  handleExplorerMoveFile,
}: SimplePageProps) {
  return (
    <>
    <IdeLayout
      workspaceFileInputRef={workspaceFileInputRef}
      onWorkspaceFileChange={onWorkspaceFileChange}
      modelLabel={shell.modelLabel}
      uiMode={shell.uiMode}
      onUiModeChange={shell.setUiMode}
      config={shell.config}
      onOpenCommandPalette={() => modals.setCommandPaletteOpen(true)}
      onSave={editor.saveAndRefresh}
      canSave={!!editor.selectedPath && editor.dirty}
      onRevertFile={() => void editor.reload()}
      canRevert={!!editor.selectedPath && editor.dirty}
      onRefreshWorkspace={tree.refreshTree}
      onCopyWorkspacePath={editor.copyWorkspacePath}
      onSelectActivity={(a) => {
        shell.setUiMode("technical");
        menus.persistLeftSidebar(true);
        menus.setActivity(a);
      }}
      onFocusBottomTab={(t) => {
        shell.setUiMode("technical");
        menus.focusToolTab(t);
      }}
      fileMenu={menus.fileMenu}
      editMenu={menus.editMenu}
      selectionMenu={menus.selectionMenu}
      goMenu={menus.goMenu}
      runMenu={menus.runMenu}
      terminalMenu={menus.terminalMenu}
      helpMenu={menus.helpMenu}
      onOpenAgentSetup={menus.onOpenAgentSetup}
      onOpenAgentPermissions={() => modals.setAgentPermissionsOpen(true)}
      settingsMenu={menus.settingsMenuHandlers}
      onOpenTeamsYaml={menus.onOpenTeamsYaml}
      onCreateAgentMarkdown={menus.onCreateAgentMarkdown}
      onReloadAgents={menus.onReloadAgents}
      onOpenPiModelConfig={menus.onOpenPiModelConfig}
      chatSessionControls={{
        mode: session.chatMode,
        switchDisabled: session.streaming,
        onSetMode: menus.handleChatModeChange,
      }}
      onNewPlanFile={() => void menus.handleNewPlanFile()}
      newPlanFileDisabled={!shell.workspaceOperational}
      viewSimple={menus.viewSimpleMenu ?? undefined}
    >
      <SimpleApp
        uiMode={shell.uiMode}
        setUiMode={shell.setUiMode}
        root={tree.root || null}
        rootLabel={tree.rootLabel}
        nodes={tree.nodes}
        treeLoading={tree.treeLoading}
        treeError={tree.treeError}
        refreshTree={tree.refreshTree}
        refreshTreeQuiet={tree.refreshTreeQuietShell}
        modelLabel={shell.modelLabel}
        config={shell.config}
        effectiveModel={session.effectiveModel}
        onSelectLlmModel={session.setLlmModel}
        selectedPath={editor.selectedPath}
        setSelectedPath={editor.setSelectedPath}
        content={editor.content}
        setContent={editor.setContent}
        persistEncoding={editor.persistEncoding}
        fileMimeType={editor.fileMimeType}
        fileLoading={editor.fileLoading}
        fileError={editor.fileError}
        dirty={editor.dirty}
        save={editor.save}
        discardUnsavedChanges={editor.discardUnsavedChanges}
        line={editor.line}
        col={editor.col}
        onCursor={editor.onCursor}
        rows={session.rows}
        logs={session.logs}
        streaming={session.streaming}
        chatStreamUiEnabled={menus.simpleChatStreamUiEnabled}
        onChatStreamUiEnabledChange={menus.onSimpleChatStreamUiEnabledChange}
        chatQueuePending={Number(session.chatQueuePending)}
        chatQueueItems={session.chatQueueItems}
        editChatQueueItem={session.editChatQueueItem}
        deleteChatQueueItem={session.deleteChatQueueItem}
        forceChatQueueItem={session.forceChatQueueItem}
        connected={session.connected}
        error={session.error}
        sendChat={(text) => void session.sendChat(session.chatAgentName ?? '', text)}
        stop={session.stop}
        clearError={session.clearError}
        onReopenLlmFixModal={modals.dismissLlmFixModal}
        chatAgentName={session.chatAgentName}
        dispatchTurnAgent={session.chatAgentName}
        onChatAgentChange={session.setChatAgent}
        chatMode={session.chatMode}
        onChatModeChange={menus.handleChatModeChange}
        activeTab={simpleTab}
        onTabChange={setSimpleTab}
        providerConfigInitialPath={menus.simpleProviderPath}
        providerConfigInitialNonce={menus.simpleProviderNonce}
        onConsumeProviderConfigFocus={menus.consumeSimpleProviderFocus}
        workspaceEditorRef={editor.workspaceEditorRef}
        onUndoRedoStackChange={menus.bumpEditorMenu}
        onSelectionPrefsChange={menus.bumpSelectionPrefs}
        onFindInFiles={menus.openWorkspaceSearch}
        onReplaceInFiles={menus.openWorkspaceSearch}
        teamsYamlWritePath={menus.teamsYamlWritePath}
        workspaceReady={shell.workspaceOperational}
        onOpenTeamsYaml={menus.onOpenTeamsYaml}
        onCreateAgentDefinition={menus.onCreateAgentMarkdown}
        onOpenFolder={handleOpenFolderPrompt}
        onOpenRecentFolder={handleOpenRecentFolder}
        recentFolders={recentFolders}
        onHelp={() => modals.setHowToUseModalOpen(true)}
        onConfigRefresh={refreshServerConfig}
        onNewPlanFile={() => void menus.handleNewPlanFile()}
        newPlanFileDisabled={!shell.workspaceOperational}
        onOpenIndexingDocs={() => modals.setIndexingDocsOpen(true)}
        contextPct={String(session.tokenMeter.contextPct ?? 0)}
        contextFillPct={session.chatPulseMeters?.contextFillPct ?? null}
        tokensDown={String(session.tokenMeter.tokensDown)}
        tokensUp={String(session.tokenMeter.tokensUp)}
        contextTitle={session.tokenMeter.contextTitle ?? ''}
        tokensTitle={session.tokenMeter.tokensTitle ?? ''}
        planHandoffWorkspaceKey={planHandoffWorkspaceKey}
        onMoveFileToDirectory={handleExplorerMoveFile}
        allowWorkspaceRootDrop={tree.folders.length === 1}
      />
    </IdeLayout>
    <ModalsRenderer
      commandPaletteOpen={modals.commandPaletteOpen}
      onCloseCommandPalette={() => modals.setCommandPaletteOpen(false)}
      commandPaletteItems={modals.commandPaletteItems}
      showLlmFixModal={modals.showLlmFixModal}
      onDismissLlmFixModal={modals.dismissLlmFixModal}
      onClearLlmError={session.clearError}
      llmErrorMessage={session.error ?? ""}
      llmFixModalAppearanceDark={modals.llmFixModalAppearanceDark}
      uiMode={shell.uiMode}
      onOpenSimpleAiBrains={menus.openLlmFixSimpleBrains}
      onOpenProviderCatalog={menus.openLlmFixProviderCatalog}
      hostDoctorOpen={modals.hostDoctorOpen}
      onCloseHostDoctor={() => modals.setHostDoctorOpen(false)}
      onWorkspaceFileSaved={() => void tree.refreshTree()}
      indexingDocsOpen={modals.indexingDocsOpen}
      onCloseIndexingDocs={() => modals.setIndexingDocsOpen(false)}
      honchoSettingsOpen={modals.honchoSettingsOpen}
      onCloseHonchoSettings={() => modals.setHonchoSettingsOpen(false)}
      integrationDocUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/docs/HONCHO_INTEGRATION.md`}
      agentPermissionsOpen={modals.agentPermissionsOpen}
      onCloseAgentPermissions={() => modals.setAgentPermissionsOpen(false)}
      mitLicenseModalOpen={modals.mitLicenseModalOpen}
      onDismissMitLicense={() => modals.setMitLicenseModalOpen(false)}
      restartServerModalOpen={modals.restartServerModalOpen}
      onCloseRestartServer={() => modals.setRestartServerModalOpen(false)}
      onReconnectServer={session.reconnectWebSocket}
      howToUseModalOpen={modals.howToUseModalOpen}
      onDismissHowToUse={() => modals.setHowToUseModalOpen(false)}
      repoBlobBase={`${WOP_PUBLIC_REPO_URL}/blob/main`}
      launchConfigAddOpen={modals.launchConfigAddOpen}
      onDismissLaunchConfigAdd={() => modals.setLaunchConfigAddOpen(false)}
      onPickLaunchConfig={(id) => {
        modals.setLaunchConfigAddOpen(false);
        modals.appendLaunchConfigurationSnippet(id);
      }}
      installDebuggersModalOpen={modals.installDebuggersModalOpen}
      onDismissInstallDebuggers={() => modals.setInstallDebuggersModalOpen(false)}
      newPlanFileModalOpen={modals.newPlanFileModalOpen}
      onDismissNewPlanFile={() => modals.setNewPlanFileModalOpen(false)}
      onCreateNewPlanFile={(title, slug) => {
        modals.setNewPlanFileModalOpen(false);
        menus.handleNewPlanFile(); // or similar create logic
      }}
      newWorkspaceFileDraft={modals.newWorkspaceFileDraft}
      onDismissNewWorkspaceFileModal={() => modals.setNewWorkspaceFileDraft(null)}
      onCreateWorkspaceFile={(path, ic) => {
        modals.setNewWorkspaceFileDraft(null);
        modals.performCreateNewWorkspaceFile(path, ic);
      }}
      clawHelpOpen={false}
      onDismissClawHelp={() => {}}
      clawHelpDefaultSection={null}
      clawConnected={session.connected}
      clawStreaming={session.streaming}
      onGoToTelegramChannels={() => {}}
      onFocusClawChatTab={() => {}}
    />
    </>
  );
}
