import { type ChangeEvent, type RefObject } from "react";
import { MenuBar } from "./MenuBar";
import type { FileMenuProps } from "../types/fileMenu";
import type {
  EditMenuHandlers, GoMenuHandlers, HelpMenuHandlers,
  RunMenuHandlers, SelectionMenuHandlers, SettingsMenuHandlers,
  TerminalMenuHandlers,
} from "../types/workspaceEditor";
import type { ViewMenuSimpleOptions, ViewMenuTechnicalOptions, ChatDockRegion } from "../types/technicalShell";
import type { ServerConfig } from "../hooks/useServerConfig";
import type { ChatSessionMode } from "../hooks/useWayOfPiSession";

interface IdeLayoutProps {
  children: React.ReactNode;
  workspaceFileInputRef: RefObject<HTMLInputElement | null>;
  onWorkspaceFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  modelLabel: string;
  uiMode: string;
  onUiModeChange: (m: string) => void;
  config: ServerConfig | null;
  onOpenCommandPalette: () => void;
  onSave: () => void | Promise<void>;
  canSave: boolean;
  onRevertFile: () => void;
  canRevert: boolean;
  onRefreshWorkspace: () => void;
  onCopyWorkspacePath: () => void;
  onSelectActivity: (a: any) => void;
  onFocusBottomTab: (t: any) => void;
  fileMenu: FileMenuProps;
  editMenu: EditMenuHandlers;
  selectionMenu: SelectionMenuHandlers;
  goMenu: GoMenuHandlers;
  runMenu: RunMenuHandlers;
  terminalMenu: TerminalMenuHandlers;
  helpMenu: HelpMenuHandlers;
  onOpenAgentSetup: () => void;
  onOpenAgentPermissions: () => void;
  settingsMenu: SettingsMenuHandlers;
  onOpenTeamsYaml: () => void;
  onCreateAgentMarkdown: () => void;
  onReloadAgents: () => void;
  onOpenPiModelConfig: () => void;
  chatSessionControls: {
    mode: ChatSessionMode;
    switchDisabled: boolean;
    onSetMode: (m: ChatSessionMode) => void;
  };
  onNewPlanFile: () => void;
  newPlanFileDisabled: boolean;
  viewSimple?: ViewMenuSimpleOptions;
  viewTechnical?: ViewMenuTechnicalOptions;
  leftSidebarVisible?: boolean;
  onToggleLeftSidebar?: () => void;
  agentPanelVisible?: boolean;
  agentChatDock?: ChatDockRegion;
  onSetAgentChatDock?: (r: ChatDockRegion) => void;
  onToggleAgentPanel?: () => void;
}

export function IdeLayout({
  children, workspaceFileInputRef, onWorkspaceFileChange,
  modelLabel, uiMode, onUiModeChange, config,
  onOpenCommandPalette, onSave, canSave, onRevertFile, canRevert,
  onRefreshWorkspace, onCopyWorkspacePath,
  onSelectActivity, onFocusBottomTab,
  fileMenu, editMenu, selectionMenu, goMenu, runMenu, terminalMenu, helpMenu,
  onOpenAgentSetup, onOpenAgentPermissions, settingsMenu,
  onOpenTeamsYaml, onCreateAgentMarkdown, onReloadAgents, onOpenPiModelConfig,
  chatSessionControls, onNewPlanFile, newPlanFileDisabled,
  viewSimple, viewTechnical,
  leftSidebarVisible, onToggleLeftSidebar,
  agentPanelVisible, agentChatDock, onSetAgentChatDock, onToggleAgentPanel,
}: IdeLayoutProps) {
  return (
    <>
      <input
        ref={workspaceFileInputRef}
        type="file"
        accept=".code-workspace,.json,application/json"
        className="hidden"
        aria-hidden
        onChange={onWorkspaceFileChange}
      />
      <div className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e] font-sans text-[#cccccc] selection:bg-[#9a3412]">
        <MenuBar
          modelLabel={modelLabel}
          uiMode={uiMode}
          onUiModeChange={onUiModeChange}
          config={config}
          onOpenCommandPalette={onOpenCommandPalette}
          onSave={onSave}
          canSave={canSave}
          onRevertFile={onRevertFile}
          canRevert={canRevert}
          onRefreshWorkspace={onRefreshWorkspace}
          onCopyWorkspacePath={onCopyWorkspacePath}
          onSelectActivity={onSelectActivity}
          onFocusBottomTab={onFocusBottomTab}
          fileMenu={fileMenu}
          editMenu={editMenu}
          selectionMenu={selectionMenu}
          goMenu={goMenu}
          runMenu={runMenu}
          terminalMenu={terminalMenu}
          helpMenu={helpMenu}
          onOpenAgentSetup={onOpenAgentSetup}
          onOpenAgentPermissions={onOpenAgentPermissions}
          settingsMenu={settingsMenu}
          onOpenTeamsYaml={onOpenTeamsYaml}
          onCreateAgentMarkdown={onCreateAgentMarkdown}
          onReloadAgents={onReloadAgents}
          onOpenPiModelConfig={onOpenPiModelConfig}
          chatSessionControls={chatSessionControls}
          onNewPlanFile={onNewPlanFile}
          newPlanFileDisabled={newPlanFileDisabled}
          viewSimple={viewSimple}
          viewTechnical={viewTechnical}
          leftSidebarVisible={leftSidebarVisible}
          onToggleLeftSidebar={onToggleLeftSidebar}
          agentPanelVisible={agentPanelVisible}
          agentChatDock={agentChatDock}
          onSetAgentChatDock={onSetAgentChatDock}
          onToggleAgentPanel={onToggleAgentPanel}
        />
        {children}
      </div>
    </>
  );
}
