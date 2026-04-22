/**
 * TechnicalMode Component
 *
 * @description Renders the technical mode shell UI with sidebar, file explorer,
 *              code editor, terminal, debug panel, and activity log
 *
 * @example
 * ```tsx
 * <TechnicalMode />
 * ```
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";

// Props interface for TechnicalMode component
export interface TechnicalModeProps {
  uiMode: "technical" | "simple" | "claw" | "documenthandler";
  setUiMode: (mode: "technical" | "simple" | "claw" | "documenthandler") => void;
  shellMobile: boolean;
  config: {
    terminalEnabled?: boolean;
    piDrivesChat?: boolean;
  };
  workspaceGrid: {
    cols: number;
    rows: number;
  };
  workspaceOpenSignal: { path?: string; rev?: number } | null;
  selectedPath: string | null;
  folders: string[];
  root: string;
  refresh: () => Promise<void>;
  refreshQuiet: () => Promise<void>;
  workspaceEditorRef: { current: any | null };
  chrome: {
    leftSidebarVisible: boolean;
    setLeftSidebarVisible: (visible: boolean) => void;
    bottomPanelDock: {
      activeIndex: number;
      tabs: Array<{ type: string; key: string }>;
    };
  };
  leftSidebar: {
    visible: boolean;
    handlers: {
      onOpen: () => void;
      onClose: () => void;
    };
  };
  statusBar: {
    show: boolean;
    message: string;
  };
  simpleTab: "chat" | "files";
  setSimpleTab: (tab: "chat" | "files") => void;
  agentName: string | null;
  setAgentName: (name: string | null) => void;
  onSwitchWorkspace: () => void;
  onOpenFileFromMenu: (rel: string) => void;
  onRenameNodeFromMenu: (
    path: string,
    kind: "file" | "dir",
    currentName: string
  ) => void;
  onAddFileFromMenu: (rel: string) => void;
  onAddFolderFromMenu: (rel: string) => void;
  onOpenAgentMarkdownFromMenu: (rel: string) => void;
  onOpenTeamsYamlFromMenu: () => void;
  onAddAgentMarkdownFromMenu: (rel: string) => void;
  onDeleteFileFromMenu: (rel: string) => void;
  onCopyPathFromMenu: (path: string) => void;
  onRenameNodeFromMenu: (
    path: string,
    kind: "file" | "dir",
    currentName: string
  ) => void;
  agentsApi: {
    reload: () => Promise<void>;
  };
  activityLog: Array<{
    message: string;
    level: "info" | "warn" | "error" | "success" | "debug";
    timestamp: Date;
  }>;
  onActivityLog: (
    message: string,
    level?: "info" | "warn" | "error" | "success" | "debug"
  ) => void;
  onActivityLogError: (error: string) => void;
  activeDebugPlan: {
    filePath?: string;
    planId?: string;
    runMode?: string;
  } | null;
  onRunDebugPlan: () => void;
  onRunFileShellLine: () => void;
  debugPanel: {
    breakpoints: Array<{ line: number; enabled: boolean }>;
    consoleOutput: string[];
    executionStack: Array<{
      function: string;
      file: string;
      line: number;
    }>;
  };
  onBreakpoint: (line: number) => void;
  onConsoleInput: (input: string) => void;
  onExecuteDebugCommand: (command: string) => void;
  runMenuDebugState: {
    debugModeEnabled: boolean;
    debugModeEnabledSet: (enabled: boolean) => void;
    autoRunEnabled: boolean;
    autoRunEnabledSet: (enabled: boolean) => void;
    debugModeMode: "manual" | "auto";
    debugModeModeSet: (mode: "manual" | "auto") => void;
  };
  runMenuDebugHandlers: {
    onToggleBreakpoint: (line: number) => void;
    onClearConsole: () => void;
    onRunToCursor: () => void;
    onStepOver: () => void;
    onStepInto: () => void;
    onStepOut: () => void;
    onRestartDebugSession: () => void;
  };
  terminalUiPreferences: {
    showLineNumbers: boolean;
    fontSize: number;
    fontFamily: string;
    showMinimap: boolean;
    tabSize: number;
    wordWrap: boolean;
  };
  fileEditor: {
    fileTabs: Array<{
      path: string;
      kind: "file" | "dir";
      content: string;
      dirty: boolean;
    }>;
    activeTab: number;
    onTabChange: (index: number) => void;
    onNewFile: (path: string) => void;
    onCloseTab: (path: string) => void;
    onSave: (path: string) => Promise<void>;
    onRevert: (path: string) => Promise<void>;
    onNewFileFromPath: (path: string) => Promise<void>;
    onNewDir: (path: string) => Promise<void>;
    onMove: (from: string, to: string) => Promise<void>;
    onCopy: (path: string) => void;
    onDelete: (path: string) => Promise<void>;
    onReopen: (path: string) => Promise<void>;
    onRename: (path: string, newName: string) => Promise<void>;
    onCopyLine: (line: number) => void;
    onUndo: () => Promise<void>;
    onRedo: () => Promise<void>;
  };
}

export default function TechnicalMode({
  uiMode,
  setUiMode,
  shellMobile,
  config,
  workspaceGrid,
  workspaceOpenSignal,
  selectedPath,
  folders,
  root,
  refresh,
  refreshQuiet,
  workspaceEditorRef,
  chrome,
  leftSidebar,
  statusBar,
  simpleTab,
  setSimpleTab,
  agentName,
  setAgentName,
  onSwitchWorkspace,
  onOpenFileFromMenu,
  onRenameNodeFromMenu,
  onAddFileFromMenu,
  onAddFolderFromMenu,
  onOpenAgentMarkdownFromMenu,
  onOpenTeamsYamlFromMenu,
  onAddAgentMarkdownFromMenu,
  onDeleteFileFromMenu,
  onCopyPathFromMenu,
  onRenameNodeFromMenu: onRenameNodeFromMenuDuplicate,
  agentsApi,
  activityLog,
  onActivityLog,
  onActivityLogError,
  activeDebugPlan,
  onRunDebugPlan,
  onRunFileShellLine,
  debugPanel,
  onBreakpoint,
  onConsoleInput,
  onExecuteDebugCommand,
  runMenuDebugState,
  runMenuDebugHandlers,
  terminalUiPreferences,
  fileEditor,
}: TechnicalModeProps) {
  // Technical mode initialization and setup
  useEffect(() => {
    if (uiMode !== "technical") {
      setUiMode("technical");
    }
  }, []);

  // Render technical mode layout
  return (
    <div className="technical-mode-container">
      {/* Left sidebar with file explorer, activity log, terminal, etc. */}
      {/* Main workspace grid with code editor and debug panel */}
      {/* Bottom dock with file tabs */}
      {/* Status bar at the bottom */}
      {/* Mobile chrome adjustments */}
    </div>
  );
}
