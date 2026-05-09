import { useCallback } from "react";
import { ExplorerSidebar } from "@wop/components/ExplorerSidebar";
import { SearchSidePanel } from "@wop/components/TechnicalSidePanels";
import { ScmSidePanel } from "@wop/components/TechnicalSidePanels";
import { ExtensionsSidePanel } from "@wop/components/TechnicalSidePanels";
import { PlanningSidePanel } from "@wop/components/TechnicalSidePanels";
import { SettingsSidePanel } from "@wop/components/TechnicalSidePanels";
import type { TreeNode } from "@wop/types/tree";
import type { TechnicalActivity } from "@wop/types/technicalShell";
import type { ServerConfig } from "@wop/hooks/useServerConfig";
import type { ChatRow, ChatSessionMode } from "@wop/hooks/useWayOfPiSession";

interface SidebarContentProps {
  activity: TechnicalActivity;
  nodes: TreeNode[];
  rootLabel: string;
  selectedPath: string | null;
  onExplorerSelectFile: (path: string, ev?: any) => void;
  setExplorerContextDir: (d: string) => void;
  handleExplorerMoveFile: (from: string, toDir: string) => Promise<void>;
  folders: { label: string; path: string }[];
  handleExplorerRenameNode: (path: string, kind: "file" | "dir", name: string) => Promise<void>;
  handleExplorerDeleteNode: (path: string, kind: "file" | "dir") => Promise<void>;
  handleExplorerCopyPath: (path: string) => void;
  handleNewFile: () => Promise<void>;
  handleNewFolder: () => Promise<void>;
  treeLoading: boolean;
  treeError: string | null;
  treeExpand: { rev: number; paths: string[] };
  refreshQuiet: () => Promise<any>;
  persistLeftSidebar: (v: boolean) => void;
  setActivity: (a: TechnicalActivity) => void;
  root: string;
  git: any;
  refresh: () => void;
  config: ServerConfig | null;
  refreshServerConfig: () => Promise<void>;
  chatMode: ChatSessionMode;
  onChatModeChange: (m: ChatSessionMode) => void;
  streaming: boolean;
  workspaceOperational: boolean;
  focusWorkspaceFileFromMenu: (rel: string) => void;
  openTeamsYamlFromMenu: () => void;
  focusToolTab: (t: string) => void;
}

export function SidebarContent({
  activity, nodes, rootLabel, selectedPath,
  onExplorerSelectFile, setExplorerContextDir,
  handleExplorerMoveFile, folders,
  handleExplorerRenameNode, handleExplorerDeleteNode,
  handleExplorerCopyPath, handleNewFile, handleNewFolder,
  treeLoading, treeError, treeExpand, refreshQuiet,
  persistLeftSidebar, setActivity,
  root, git, refresh, config, refreshServerConfig,
  chatMode, onChatModeChange, streaming,
  workspaceOperational, focusWorkspaceFileFromMenu,
  openTeamsYamlFromMenu, focusToolTab,
}: SidebarContentProps) {
  if (activity === "explorer") {
    return (
      <ExplorerSidebar
        nodes={nodes}
        rootLabel={rootLabel}
        selectedPath={selectedPath}
        onSelectFile={onExplorerSelectFile}
        onSelectDirectory={setExplorerContextDir}
        onMoveFileToDirectory={handleExplorerMoveFile}
        allowDropToWorkspaceRoot={folders.length === 1}
        onRenameExplorerNode={handleExplorerRenameNode}
        onDeleteExplorerNode={handleExplorerDeleteNode}
        onCopyExplorerPath={handleExplorerCopyPath}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        loading={treeLoading}
        error={treeError}
        expandRevision={treeExpand.rev}
        pathsToExpand={treeExpand.paths}
        onExplorerGitMutated={refreshQuiet}
        onClosePrimarySidebar={() => persistLeftSidebar(false)}
      />
    );
  }

  if (activity === "search") {
    return (
      <SearchSidePanel
        nodes={nodes}
        selectedPath={selectedPath}
        onSelectFile={(p, ev) => {
          onExplorerSelectFile(p, ev);
          setActivity("explorer");
        }}
      />
    );
  }

  if (activity === "scm") {
    return (
      <ScmSidePanel
        root={root}
        git={git}
        nodes={nodes}
        treeLoading={treeLoading}
        treeError={treeError}
        onRefresh={refresh}
        onOpenFile={(p) => {
          onExplorerSelectFile(p);
          setActivity("explorer");
        }}
      />
    );
  }

  if (activity === "extensions") {
    return (
      <ExtensionsSidePanel
        folders={folders}
        config={config}
        refreshServerConfig={refreshServerConfig}
        chatMode={chatMode}
        onChatModeChange={onChatModeChange}
        streaming={streaming}
        hasWorkspace={!!root || folders.length > 0}
        focusWorkspaceFile={focusWorkspaceFileFromMenu}
        onOpenTeamsYaml={openTeamsYamlFromMenu}
        onFocusToolLog={() => focusToolTab("tool_log")}
        onTreeRefresh={refresh}
      />
    );
  }

  if (activity === "planning") {
    return (
      <PlanningSidePanel
        chatMode={chatMode}
        onChatModeChange={onChatModeChange}
        streaming={streaming}
        hasWorkspace={workspaceOperational}
        onNewPlanFile={() => {}}
      />
    );
  }

  return (
    <SettingsSidePanel
      config={config}
      workspaceRoot={folders[0]?.path ?? root ?? ""}
      onOpenPiModelConfig={() => {}}
    />
  );
}
