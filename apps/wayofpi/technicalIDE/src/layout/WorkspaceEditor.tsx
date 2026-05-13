import { type RefObject, type Dispatch, type SetStateAction } from "react";
import { TechnicalWorkspaceGrid, type TechnicalWorkspaceCellSnapshot } from "@wop/components/TechnicalWorkspaceGrid";
import { WorkspaceCellDropSurface } from "@wop/components/WorkspaceCellDropSurface";
import { WorkspacePane } from "@wop/components/WorkspacePane";
import type { PanelDockLayout, PanelTab, ToolTabId } from "@wop/utils/panelDockLayout";
import type { WorkspaceGridState } from "@wop/utils/workspaceGridStorage";
import type { WorkspaceGridPickerConfig } from "@wop/components/WorkspaceGridLayoutPicker";
import type { LogRow } from "@wop/hooks/useWayOfPiSession";
import type { WorkspaceEditorRef } from "@wop/types/workspaceEditor";
import type { FilePersistEncoding } from "@wop/hooks/useFileEditor";
import type { WopDropZone } from "@wop/utils/workspaceDropZones";

const WORKSPACE_GRID_MAX_COLS = 6;

interface WorkspaceEditorProps {
  isWsMulti: boolean;
  workspaceGrid: WorkspaceGridState;
  patchWorkspaceCellDock: (cellIndex: number, update: any) => void;
  wsFocusedCell: number;
  setWsFocusedCell: Dispatch<SetStateAction<number>>;
  onTechFocusedReport: (s: TechnicalWorkspaceCellSnapshot) => void;
  onTechFocusedCursor: (l: number, c: number) => void;
  workspaceEditorRef: RefObject<WorkspaceEditorRef | null>;
  logs: LogRow[];
  workspaceDockFileActions: any;
  onOpenToolPanelForCell: (cellIndex: number, tab: any) => void;
  refresh: () => Promise<void>;
  workspaceDockActionsMain: any;
  editorWordWrap: boolean;
  breadcrumbsVisible: boolean;
  openWorkspaceSearch: () => void;
  bumpEditorMenu: () => void;
  bumpSelectionPrefs: () => void;
  autoSave: boolean;
  workspaceOpenSignal: { path: string; rev: number } | null;
  workspaceCloseEditorSignal: { rev: number; cellIndex: number } | null;
  onWorkspaceSurfaceDrop: (e: any, surfaceCellIndex: number, zone: any) => void;
  splitEditorRight: () => void;
  gridCols: number;
  wsMaximizedCell: number | null;
  onToggleWorkspaceMaximizeCell: (cellIndex: number) => void;
  removeWorkspaceCellFromGrid: (cellIndex: number) => void;
  workspaceGridToolbar: WorkspaceGridPickerConfig | null;
  agentTeamWorkspacePane: any;
  workspaceEmbeddedChat: () => any;
  movePanelTabBetweenCells: (from: number, to: number, tab: any, before: any) => void;
  onWorkspaceGridRowResize: (rowEdge: number, dy: number) => void;
  onWorkspaceGridColResize: (colEdge: number, dx: number) => void;
  onBindMultiCellSaveApi: (api: any) => void;
  onMultiCellAnyDirtyChange: (v: boolean) => void;
  rootLabel: string | null;
  nodes: any[];
  refreshQuiet: any;
  panelDock: PanelDockLayout;
  setWorkspaceActiveIndex: (index: number) => void;
  onDockEntryMove: (moving: PanelTab, before: PanelTab | null) => void;
  onDockEntryClose: (entry: PanelTab) => void;
  selectedPath: string | null;
  setContent: (c: string) => void;
  content: string;
  fileLoading: boolean;
  fileError: string | null;
  dirty: boolean;
  persistEncoding: FilePersistEncoding;
  workspaceCenterFilePreview: any;
  save: () => Promise<boolean>;
  discardUnsavedChanges: () => void;
  onCursor: (l: number, c: number) => void;
  workspaceGitFileReviewActions: any;
  gitReviewHasAnyMarked: boolean;
  gitReviewCanAdvanceNext: boolean;
}

export function WorkspaceEditor({
  isWsMulti, workspaceGrid, patchWorkspaceCellDock,
  wsFocusedCell, setWsFocusedCell,
  onTechFocusedReport, onTechFocusedCursor,
  workspaceEditorRef, logs, workspaceDockFileActions,
  onOpenToolPanelForCell, refresh,
  workspaceDockActionsMain,
  editorWordWrap, breadcrumbsVisible,
  openWorkspaceSearch, bumpEditorMenu, bumpSelectionPrefs,
  autoSave, workspaceOpenSignal, workspaceCloseEditorSignal,
  onWorkspaceSurfaceDrop, splitEditorRight, gridCols,
  wsMaximizedCell, onToggleWorkspaceMaximizeCell,
  removeWorkspaceCellFromGrid, workspaceGridToolbar,
  agentTeamWorkspacePane, workspaceEmbeddedChat,
  movePanelTabBetweenCells,
  onWorkspaceGridRowResize, onWorkspaceGridColResize,
  onBindMultiCellSaveApi, onMultiCellAnyDirtyChange,
  rootLabel, nodes, refreshQuiet,
  panelDock, setWorkspaceActiveIndex,
  onDockEntryMove, onDockEntryClose,
  selectedPath, setContent, content,
  fileLoading, fileError, dirty,
  persistEncoding, workspaceCenterFilePreview,
  save, discardUnsavedChanges, onCursor,
  workspaceGitFileReviewActions,
  gitReviewHasAnyMarked, gitReviewCanAdvanceNext,
}: WorkspaceEditorProps) {
  if (isWsMulti) {
    return (
      <TechnicalWorkspaceGrid
        grid={workspaceGrid}
        onPatchCell={patchWorkspaceCellDock}
        focusedCell={wsFocusedCell}
        onFocusCell={setWsFocusedCell}
        onFocusedReport={onTechFocusedReport}
        onFocusedCursor={onTechFocusedCursor}
        workspaceEditorRef={workspaceEditorRef}
        logs={logs}
        fileActions={workspaceDockFileActions}
        onOpenToolPanelForCell={onOpenToolPanelForCell}
        onOpenWorkspace={refresh}
        workspaceDockActions={workspaceDockActionsMain}
        wordWrap={editorWordWrap}
        showBreadcrumbs={breadcrumbsVisible}
        onFindInFiles={openWorkspaceSearch}
        onReplaceInFiles={openWorkspaceSearch}
        onUndoRedoStackChange={bumpEditorMenu}
        onSelectionPrefsChange={bumpSelectionPrefs}
        refresh={refresh}
        autoSave={autoSave}
        externalOpenFile={workspaceOpenSignal}
        externalCloseEditor={workspaceCloseEditorSignal}
        onWorkspaceSurfaceDrop={onWorkspaceSurfaceDrop}
        onSplitEditorRight={splitEditorRight}
        splitEditorDisabled={gridCols >= WORKSPACE_GRID_MAX_COLS}
        maximizedCell={wsMaximizedCell}
        onToggleMaximizeCell={onToggleWorkspaceMaximizeCell}
        onRemoveWorkspaceCell={removeWorkspaceCellFromGrid}
        workspaceGridPicker={workspaceGridToolbar}
        agentTeamPane={agentTeamWorkspacePane}
        workspaceEmbeddedChat={workspaceEmbeddedChat}
        onCrossCellTabMoveBetweenCells={movePanelTabBetweenCells}
        onWorkspaceGridRowResize={onWorkspaceGridRowResize}
        onWorkspaceGridColResize={onWorkspaceGridColResize}
        onBindMultiCellSaveApi={onBindMultiCellSaveApi}
        onMultiCellAnyDirtyChange={onMultiCellAnyDirtyChange}
        breadcrumbWorkspaceLabel={rootLabel || null}
        workspaceTreeNodes={nodes}
        refreshQuiet={refreshQuiet}
      />
    );
  }

  return (
    <WorkspaceCellDropSurface
      cellIndex={0}
      cols={1}
      rows={1}
      onDropPayload={onWorkspaceSurfaceDrop}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <WorkspacePane
        ref={workspaceEditorRef}
        tabs={panelDock.tabs}
        activeIndex={panelDock.activeIndex}
        onActiveIndexChange={setWorkspaceActiveIndex}
        onSelectFileTab={(p) => setWorkspaceActiveIndex(panelDock.tabs.findIndex((t) => t.type === "file" && t.path === p))}
        onReorderTab={onDockEntryMove}
        onCloseTab={onDockEntryClose}
        onAddTool={(tab) => onOpenToolPanelForCell(0, tab)}
        fileActions={workspaceDockFileActions}
        logs={logs}
        editorPath={selectedPath}
        content={content}
        onChange={setContent}
        loading={fileLoading}
        error={fileError}
        dirty={dirty}
        persistEncoding={persistEncoding}
        filePreview={workspaceCenterFilePreview}
        onSave={async () => {
          const ok = await save();
          if (ok) await refresh();
        }}
        onDiscardUnsaved={discardUnsavedChanges}
        onCursor={onCursor}
        compact
        showExplorerHint={false}
        onOpenWorkspace={refresh}
        workspaceDockActions={workspaceDockActionsMain}
        wordWrap={editorWordWrap}
        showBreadcrumbs={breadcrumbsVisible}
        onFindInFiles={openWorkspaceSearch}
        onReplaceInFiles={openWorkspaceSearch}
        onUndoRedoStackChange={bumpEditorMenu}
        onSelectionPrefsChange={bumpSelectionPrefs}
        dndSourceCellIndex={0}
        onExternalFileDrop={(path, before) => {
          // handled by parent
        }}
        onSplitEditorRight={splitEditorRight}
        splitEditorDisabled={gridCols >= WORKSPACE_GRID_MAX_COLS}
        workspaceGridPicker={workspaceGridToolbar}
        agentTeamPane={agentTeamWorkspacePane}
        workspaceEmbeddedChat={workspaceEmbeddedChat}
        breadcrumbWorkspaceLabel={rootLabel || null}
        gitFileReviewActions={workspaceGitFileReviewActions}
        gitReviewHasAnyMarked={gitReviewHasAnyMarked}
        gitReviewCanAdvanceNext={gitReviewCanAdvanceNext}
      />
    </WorkspaceCellDropSurface>
  );
}
