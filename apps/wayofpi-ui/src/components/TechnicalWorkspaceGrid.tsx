import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AgentMeta } from "../hooks/useAgents";
import type { LogRow } from "../hooks/useWayOfPiSession";
import { useFileEditor } from "../hooks/useFileEditor";
import type { BottomPanelTab } from "../types/technicalShell";
import type { WorkspaceEditorRef } from "../types/workspaceEditor";
import type { FilePreview } from "../types/workspaceFile";
import type { WorkspaceGridState } from "../utils/workspaceGridStorage";
import {
	applyAddFileTab,
	applyCloseToolTab,
	applyEnsureFileTab,
	applyPanelTabMove,
	applyRemoveFileTab,
	type PanelDockLayout,
	type PanelTab,
} from "../utils/panelDockLayout";
import type { WopDropZone } from "../utils/workspaceDropZones";
import type { DockFileActionItem } from "./dockToolAddMenu";
import { DockSplitHandle } from "./DockSplitHandle";
import { WorkspaceCellDropSurface } from "./WorkspaceCellDropSurface";
import type { WorkspaceGridPickerConfig } from "./WorkspaceGridLayoutPicker";
import { WorkspacePane } from "./WorkspacePane";

export type TechnicalWorkspaceCellSnapshot = {
	selectedPath: string | null;
	content: string;
	setContent: (next: string) => void;
	loading: boolean;
	error: string | null;
	dirty: boolean;
	filePreview: FilePreview | null;
	save: () => Promise<void>;
	reload: () => Promise<void>;
	discardUnsavedChanges: () => void;
	panelDock: PanelDockLayout;
};

type WorkspaceGridCellProps = {
	cellIndex: number;
	panelDock: PanelDockLayout;
	patchDock: (u: SetStateAction<PanelDockLayout>) => void;
	isFocused: boolean;
	onActivate: () => void;
	onReportFocused: (s: TechnicalWorkspaceCellSnapshot) => void;
	onCursor: (line: number, col: number) => void;
	editorRef: React.Ref<WorkspaceEditorRef> | undefined;
	logs: LogRow[];
	fileActions: DockFileActionItem[];
	onAddTool: (tab: BottomPanelTab) => void;
	onOpenWorkspace: () => void | Promise<void>;
	workspaceDockActions?: {
		onOpenFile: () => void;
		onShowAgentChat: (cellIndex: number) => void;
	};
	/** Factory: new chat UI per pane (see `WorkspacePane`). */
	workspaceEmbeddedChat?: () => ReactNode;
	wordWrap: boolean;
	showBreadcrumbs: boolean;
	onFindInFiles?: () => void;
	onReplaceInFiles?: () => void;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	refresh: () => Promise<void>;
	autoSave: boolean;
	/** When `rev` changes, focused cell opens this path (explorer / dock actions). */
	externalOpenFile: { path: string; rev: number } | null;
	/** Hit-testing for snap overlay (1×1 when this cell is maximized). */
	hitCols: number;
	hitRows: number;
	/** Actual workspace grid size (for split / maximize toolbar). */
	layoutCols: number;
	layoutRows: number;
	onWorkspaceSurfaceDrop: (e: React.DragEvent, surfaceCellIndex: number, zone: WopDropZone) => void;
	onSplitEditorRight?: () => void;
	splitEditorDisabled?: boolean;
	maximizedCell: number | null;
	onToggleMaximizeCell?: (cellIndex: number) => void;
	onRemoveWorkspaceCell?: (cellIndex: number) => void;
	workspaceGridPicker: WorkspaceGridPickerConfig | null;
	agentTeamPane: {
		agentTeams: Record<string, string[]>;
		agents: AgentMeta[];
		agentsLoading?: boolean;
	} | null;
	onCrossCellTabMoveBetweenCells?: (
		fromCell: number,
		toCell: number,
		tab: PanelTab,
		before: PanelTab | null,
	) => void;
};

function WorkspaceGridCell({
	cellIndex,
	panelDock,
	patchDock,
	isFocused,
	onActivate,
	onReportFocused,
	onCursor,
	editorRef,
	logs,
	fileActions,
	onAddTool,
	onOpenWorkspace,
	workspaceDockActions,
	workspaceEmbeddedChat,
	wordWrap,
	showBreadcrumbs,
	onFindInFiles,
	onReplaceInFiles,
	onUndoRedoStackChange,
	onSelectionPrefsChange,
	refresh,
	autoSave,
	externalOpenFile,
	hitCols,
	hitRows,
	layoutCols,
	layoutRows,
	onWorkspaceSurfaceDrop,
	onSplitEditorRight,
	splitEditorDisabled,
	maximizedCell,
	onToggleMaximizeCell,
	onRemoveWorkspaceCell,
	workspaceGridPicker,
	agentTeamPane,
	onCrossCellTabMoveBetweenCells,
}: WorkspaceGridCellProps) {
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const lastExternalRev = useRef(0);
	const {
		content,
		setContent,
		filePreview,
		loading: fileLoading,
		error: fileError,
		dirty,
		save,
		reload,
		discardUnsavedChanges,
	} = useFileEditor(selectedPath, { autoSave });

	const setWorkspaceActiveIndex = useCallback(
		(index: number) => {
			patchDock((prev) => ({ ...prev, activeIndex: index }));
		},
		[patchDock],
	);

	const onDockEntryMove = useCallback(
		(moving: PanelTab, before: PanelTab | null) => {
			patchDock((prev) => applyPanelTabMove(prev, moving, before));
		},
		[patchDock],
	);

	const onDockEntryClose = useCallback(
		(entry: PanelTab) => {
			patchDock((prev) =>
				entry.type === "tool"
					? applyCloseToolTab(prev, entry.id)
					: applyRemoveFileTab(prev, entry.path),
			);
		},
		[patchDock],
	);

	const onSelectFileFromWorkspaceTab = useCallback((path: string) => {
		setSelectedPath(path);
	}, []);

	useEffect(() => {
		if (!isFocused || !externalOpenFile) return;
		if (externalOpenFile.rev === lastExternalRev.current) return;
		lastExternalRev.current = externalOpenFile.rev;
		setSelectedPath(externalOpenFile.path);
		patchDock((prev) => applyAddFileTab(prev, externalOpenFile.path));
	}, [isFocused, externalOpenFile, patchDock]);

	useEffect(() => {
		if (!selectedPath) return;
		patchDock((prev) => {
			const next = applyEnsureFileTab(prev, selectedPath);
			return next === prev ? prev : next;
		});
	}, [selectedPath, patchDock]);

	useEffect(() => {
		const a = panelDock.tabs[panelDock.activeIndex];
		if (a?.type !== "file") return;
		setSelectedPath((p) => (p === a.path ? p : a.path));
	}, [panelDock.activeIndex, panelDock.tabs]);

	useEffect(() => {
		const hasFile = panelDock.tabs.some((t) => t.type === "file");
		if (!hasFile) setSelectedPath(null);
	}, [panelDock.tabs]);

	const buildSnapshot = useCallback((): TechnicalWorkspaceCellSnapshot => {
		return {
			selectedPath,
			content,
			setContent,
			loading: fileLoading,
			error: fileError,
			dirty,
			filePreview,
			save,
			reload,
			discardUnsavedChanges,
			panelDock,
		};
	}, [
		selectedPath,
		content,
		setContent,
		fileLoading,
		fileError,
		dirty,
		filePreview,
		save,
		reload,
		discardUnsavedChanges,
		panelDock,
	]);

	useLayoutEffect(() => {
		if (!isFocused) return;
		onReportFocused(buildSnapshot());
	}, [isFocused, onReportFocused, buildSnapshot]);

	const onSave = useCallback(async () => {
		await save();
		await refresh();
	}, [save, refresh]);

	const onExternalFileDrop = useCallback(
		(path: string, before: PanelTab | null) => {
			patchDock((prev) => {
				const next = applyAddFileTab(prev, path);
				const moving: PanelTab = { type: "file", path };
				return applyPanelTabMove(next, moving, before);
			});
		},
		[patchDock],
	);

	const layoutMulti = layoutCols * layoutRows > 1;

	return (
		<WorkspaceCellDropSurface
			cellIndex={cellIndex}
			cols={hitCols}
			rows={hitRows}
			onDropPayload={onWorkspaceSurfaceDrop}
			className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
				isFocused ? "ring-2 ring-[#ea580c] ring-inset" : "ring-0"
			}`}
		>
			<div
				className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
				data-wop-workspace-cell={cellIndex}
				onMouseDownCapture={() => onActivate()}
			>
				<WorkspacePane
					ref={editorRef}
					tabs={panelDock.tabs}
					activeIndex={panelDock.activeIndex}
					onActiveIndexChange={setWorkspaceActiveIndex}
					onSelectFileTab={onSelectFileFromWorkspaceTab}
					onReorderTab={onDockEntryMove}
					onCloseTab={onDockEntryClose}
					onAddTool={onAddTool}
					fileActions={fileActions}
					logs={logs}
					editorPath={selectedPath}
					content={content}
					onChange={setContent}
					loading={fileLoading}
					error={fileError}
					dirty={dirty}
					filePreview={filePreview}
					onSave={onSave}
					onDiscardUnsaved={discardUnsavedChanges}
					onCursor={onCursor}
					compact
					showExplorerHint={false}
					onOpenWorkspace={onOpenWorkspace}
					workspaceDockActions={workspaceDockActions}
					wordWrap={wordWrap}
					showBreadcrumbs={showBreadcrumbs}
					onFindInFiles={onFindInFiles}
					onReplaceInFiles={onReplaceInFiles}
					onUndoRedoStackChange={onUndoRedoStackChange}
					onSelectionPrefsChange={onSelectionPrefsChange}
					dndSourceCellIndex={cellIndex}
					workspacePaneReorderCellIndex={
						layoutMulti && maximizedCell == null ? cellIndex : undefined
					}
					onExternalFileDrop={onExternalFileDrop}
					onCrossCellTabDrop={
						onCrossCellTabMoveBetweenCells
							? (fromCell, tab, before) =>
									onCrossCellTabMoveBetweenCells(fromCell, cellIndex, tab, before)
							: undefined
					}
					onSplitEditorRight={onSplitEditorRight}
					splitEditorDisabled={splitEditorDisabled}
					onToggleWorkspaceMaximize={
						layoutMulti ? () => onToggleMaximizeCell?.(cellIndex) : undefined
					}
					workspaceMaximizeActive={maximizedCell === cellIndex}
					workspaceMaximizeDisabled={!layoutMulti}
					onCloseWorkspacePane={
						layoutMulti
							? maximizedCell != null
								? () => onToggleMaximizeCell?.(cellIndex)
								: () => onRemoveWorkspaceCell?.(cellIndex)
							: undefined
					}
					closeWorkspacePaneDisabled={false}
					workspaceGridPicker={workspaceGridPicker}
					agentTeamPane={agentTeamPane}
					workspaceEmbeddedChat={workspaceEmbeddedChat}
				/>
			</div>
		</WorkspaceCellDropSurface>
	);
}

export type TechnicalWorkspaceGridProps = {
	grid: WorkspaceGridState;
	onPatchCell: (cellIndex: number, update: SetStateAction<PanelDockLayout>) => void;
	focusedCell: number;
	onFocusCell: Dispatch<SetStateAction<number>>;
	onFocusedReport: (s: TechnicalWorkspaceCellSnapshot) => void;
	onFocusedCursor: (line: number, col: number) => void;
	workspaceEditorRef: React.RefObject<WorkspaceEditorRef | null>;
	logs: LogRow[];
	fileActions: DockFileActionItem[];
	onOpenToolPanelForCell: (cellIndex: number, tab: BottomPanelTab) => void;
	onOpenWorkspace: () => void | Promise<void>;
	workspaceDockActions?: {
		onOpenFile: () => void;
		onShowAgentChat: (cellIndex: number) => void;
	};
	workspaceEmbeddedChat?: () => ReactNode;
	wordWrap: boolean;
	showBreadcrumbs: boolean;
	onFindInFiles?: () => void;
	onReplaceInFiles?: () => void;
	onUndoRedoStackChange?: () => void;
	onSelectionPrefsChange?: () => void;
	refresh: () => Promise<void>;
	autoSave: boolean;
	externalOpenFile: { path: string; rev: number } | null;
	onWorkspaceSurfaceDrop: (e: React.DragEvent, surfaceCellIndex: number, zone: WopDropZone) => void;
	onSplitEditorRight?: () => void;
	splitEditorDisabled?: boolean;
	maximizedCell: number | null;
	onToggleMaximizeCell?: (cellIndex: number) => void;
	onRemoveWorkspaceCell?: (cellIndex: number) => void;
	workspaceGridPicker: WorkspaceGridPickerConfig | null;
	agentTeamPane: {
		agentTeams: Record<string, string[]>;
		agents: AgentMeta[];
		agentsLoading?: boolean;
	} | null;
	onCrossCellTabMoveBetweenCells?: (
		fromCell: number,
		toCell: number,
		tab: PanelTab,
		before: PanelTab | null,
	) => void;
	/** Drag horizontal bar between stacked rows (`rows > 1`). */
	onWorkspaceGridRowResize?: (rowEdge: number, dy: number) => void;
	/** Drag vertical bar between columns (`cols > 1`). */
	onWorkspaceGridColResize?: (colEdge: number, dx: number) => void;
};

export function TechnicalWorkspaceGrid({
	grid,
	onPatchCell,
	focusedCell,
	onFocusCell,
	onFocusedReport,
	onFocusedCursor,
	workspaceEditorRef,
	logs,
	fileActions,
	onOpenToolPanelForCell,
	onOpenWorkspace,
	workspaceDockActions,
	workspaceEmbeddedChat,
	wordWrap,
	showBreadcrumbs,
	onFindInFiles,
	onReplaceInFiles,
	onUndoRedoStackChange,
	onSelectionPrefsChange,
	refresh,
	autoSave,
	externalOpenFile,
	onWorkspaceSurfaceDrop,
	onSplitEditorRight,
	splitEditorDisabled,
	maximizedCell,
	onToggleMaximizeCell,
	onRemoveWorkspaceCell,
	workspaceGridPicker,
	agentTeamPane,
	onCrossCellTabMoveBetweenCells,
	onWorkspaceGridRowResize,
	onWorkspaceGridColResize,
}: TechnicalWorkspaceGridProps) {
	const total = grid.cols * grid.rows;

	if (maximizedCell != null && maximizedCell >= 0 && maximizedCell < total) {
		const dock = grid.cells[maximizedCell] ?? grid.cells[0]!;
		const patchDock = (u: SetStateAction<PanelDockLayout>) => onPatchCell(maximizedCell, u);
		return (
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<WorkspaceGridCell
					key={maximizedCell}
					cellIndex={maximizedCell}
					panelDock={dock}
					patchDock={patchDock}
					isFocused
					onActivate={() => onFocusCell(maximizedCell)}
					onReportFocused={onFocusedReport}
					onCursor={onFocusedCursor}
					editorRef={workspaceEditorRef}
					logs={logs}
					fileActions={fileActions}
					onAddTool={(tab) => onOpenToolPanelForCell(maximizedCell, tab)}
					onOpenWorkspace={onOpenWorkspace}
					workspaceDockActions={workspaceDockActions}
					wordWrap={wordWrap}
					showBreadcrumbs={showBreadcrumbs}
					onFindInFiles={onFindInFiles}
					onReplaceInFiles={onReplaceInFiles}
					onUndoRedoStackChange={onUndoRedoStackChange}
					onSelectionPrefsChange={onSelectionPrefsChange}
					refresh={refresh}
					autoSave={autoSave}
					externalOpenFile={externalOpenFile}
					hitCols={1}
					hitRows={1}
					layoutCols={grid.cols}
					layoutRows={grid.rows}
					onWorkspaceSurfaceDrop={onWorkspaceSurfaceDrop}
					onSplitEditorRight={onSplitEditorRight}
					splitEditorDisabled={splitEditorDisabled}
					maximizedCell={maximizedCell}
					onToggleMaximizeCell={onToggleMaximizeCell}
					onRemoveWorkspaceCell={onRemoveWorkspaceCell}
					workspaceGridPicker={workspaceGridPicker}
					agentTeamPane={agentTeamPane}
					workspaceEmbeddedChat={workspaceEmbeddedChat}
					onCrossCellTabMoveBetweenCells={onCrossCellTabMoveBetweenCells}
				/>
			</div>
		);
	}

	const rowW =
		grid.rowWeights?.length === grid.rows
			? grid.rowWeights
			: Array.from({ length: grid.rows }, () => 1);
	const colW =
		grid.colWeights?.length === grid.cols
			? grid.colWeights
			: Array.from({ length: grid.cols }, () => 1);

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#252526]">
			{Array.from({ length: grid.rows }, (_, r) => (
				<Fragment key={`wrow-${r}`}>
					{r > 0 ? (
						<DockSplitHandle
							orientation="horizontal"
							ariaLabel={`Resize workspace row ${r} / ${r + 1}`}
							onDelta={(_, dy) => onWorkspaceGridRowResize?.(r - 1, dy)}
						/>
					) : null}
					<div
						className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden"
						style={{
							flex: rowW[r],
							minHeight: grid.rows > 1 ? 72 : undefined,
						}}
					>
						{Array.from({ length: grid.cols }, (_, c) => {
							const cellIndex = r * grid.cols + c;
							const dock = grid.cells[cellIndex] ?? grid.cells[0]!;
							const patchDock = (u: SetStateAction<PanelDockLayout>) => onPatchCell(cellIndex, u);
							return (
								<Fragment key={`wcell-${cellIndex}`}>
									{c > 0 ? (
										<DockSplitHandle
											orientation="vertical"
											ariaLabel={`Resize workspace column ${c} / ${c + 1}`}
											onDelta={(dx) => onWorkspaceGridColResize?.(c - 1, dx)}
										/>
									) : null}
									<div
										className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
										style={{
											flex: colW[c],
											minWidth: grid.cols > 1 ? 96 : undefined,
										}}
									>
										<WorkspaceGridCell
											cellIndex={cellIndex}
											panelDock={dock}
											patchDock={patchDock}
											isFocused={focusedCell === cellIndex}
											onActivate={() => onFocusCell(cellIndex)}
											onReportFocused={onFocusedReport}
											onCursor={(line, col) => {
												if (focusedCell === cellIndex) onFocusedCursor(line, col);
											}}
											editorRef={focusedCell === cellIndex ? workspaceEditorRef : undefined}
											logs={logs}
											fileActions={fileActions}
											onAddTool={(tab) => onOpenToolPanelForCell(cellIndex, tab)}
											onOpenWorkspace={onOpenWorkspace}
											workspaceDockActions={workspaceDockActions}
											wordWrap={wordWrap}
											showBreadcrumbs={showBreadcrumbs}
											onFindInFiles={onFindInFiles}
											onReplaceInFiles={onReplaceInFiles}
											onUndoRedoStackChange={onUndoRedoStackChange}
											onSelectionPrefsChange={onSelectionPrefsChange}
											refresh={refresh}
											autoSave={autoSave}
											externalOpenFile={externalOpenFile}
											hitCols={grid.cols}
											hitRows={grid.rows}
											layoutCols={grid.cols}
											layoutRows={grid.rows}
											onWorkspaceSurfaceDrop={onWorkspaceSurfaceDrop}
											onSplitEditorRight={onSplitEditorRight}
											splitEditorDisabled={splitEditorDisabled}
											maximizedCell={maximizedCell}
											onToggleMaximizeCell={onToggleMaximizeCell}
											onRemoveWorkspaceCell={onRemoveWorkspaceCell}
											workspaceGridPicker={workspaceGridPicker}
											agentTeamPane={agentTeamPane}
											workspaceEmbeddedChat={workspaceEmbeddedChat}
											onCrossCellTabMoveBetweenCells={onCrossCellTabMoveBetweenCells}
										/>
									</div>
								</Fragment>
							);
						})}
					</div>
				</Fragment>
			))}
		</div>
	);
}
