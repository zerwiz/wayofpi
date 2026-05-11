import { createContext, useContext, type ReactNode } from "react";
import type { FileMenuProps } from "../types/fileMenu";
import type {
  EditMenuHandlers, GoMenuHandlers, HelpMenuHandlers,
  RunMenuHandlers, SelectionMenuHandlers, SettingsMenuHandlers,
  TerminalMenuHandlers,
} from "../types/workspaceEditor";
import type { ViewMenuSimpleOptions, ViewMenuTechnicalOptions, ChatDockRegion } from "../types/technicalShell";
import type { ServerConfig } from "../hooks/useServerConfig";
import type { ChatSessionMode } from "../hooks/useWayOfPiSession";

export interface PageHeaderHandlers {
  modelLabel: string;
  config: ServerConfig | null;
  onOpenCommandPalette: () => void;
  onSave: () => void | Promise<void>;
  canSave: boolean;
  onRevertFile: () => void | Promise<void>;
  canRevert: boolean;
  onRefreshWorkspace: () => void | Promise<void>;
  onCopyWorkspacePath: () => void;
  onSelectActivity: (a: any) => void;
  onFocusBottomTab: (t: any) => void;
  fileMenu?: FileMenuProps;
  editMenu?: EditMenuHandlers;
  selectionMenu?: SelectionMenuHandlers;
  goMenu?: GoMenuHandlers;
  runMenu?: RunMenuHandlers;
  terminalMenu?: TerminalMenuHandlers;
  helpMenu?: HelpMenuHandlers;
  settingsMenu?: SettingsMenuHandlers;
  onOpenAgentSetup: () => void;
  onOpenAgentPermissions: () => void;
  onOpenTeamsYaml: () => void;
  onCreateAgentMarkdown: () => void;
  onReloadAgents: () => void;
  onOpenPiModelConfig: () => void;
  chatSessionControls?: {
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

const STUB: PageHeaderHandlers = {
  modelLabel: "Way of Pi",
  config: null,
  onOpenCommandPalette: () => {},
  onSave: () => {},
  canSave: false,
  onRevertFile: () => {},
  canRevert: false,
  onRefreshWorkspace: () => {},
  onCopyWorkspacePath: () => {},
  onSelectActivity: () => {},
  onFocusBottomTab: () => {},
  onOpenAgentSetup: () => {},
  onOpenAgentPermissions: () => {},
  onOpenTeamsYaml: () => {},
  onCreateAgentMarkdown: () => {},
  onReloadAgents: () => {},
  onOpenPiModelConfig: () => {},
  onNewPlanFile: () => {},
  newPlanFileDisabled: true,
};

const PageHeaderCtx = createContext<PageHeaderHandlers>(STUB);

export function usePageHeader() {
  return useContext(PageHeaderCtx);
}

export function PageHeaderProvider({ value, children }: { value: Partial<PageHeaderHandlers>; children: ReactNode }) {
  const parent = usePageHeader();
  const merged = { ...parent, ...value };
  return <PageHeaderCtx.Provider value={merged}>{children}</PageHeaderCtx.Provider>;
}
