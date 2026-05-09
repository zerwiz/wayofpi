import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type ChangeEvent, type DragEvent, type MouseEvent, type SetStateAction,
} from "react";
import { MessageSquare } from "lucide-react";
import { apiGet, apiPostJson, apiPutJson } from "@wop/api/client";
import { requestNativePick } from "@wop/api/nativeDialog";
import { postWorkspaceOp } from "@wop/api/workspace";
import { ActivityBar } from "@wop/components/ActivityBar";
import { ChatPanel } from "@wop/components/ChatPanel";
import { TechnicalPrimarySidebar } from "@wop/components/TechnicalPrimarySidebar";
import { DockSplitHandle } from "@wop/components/DockSplitHandle";
import { MenuBar } from "@wop/components/MenuBar";
import { StatusBar } from "@wop/components/StatusBar";
import { WorkspaceStaticAnalysisProvider } from "@wop/context/WorkspaceStaticAnalysisContext";
import type { WorkspaceStaticAnalysisContextValue } from "@wop/context/WorkspaceStaticAnalysisContext";
import type { WorkspaceProblem } from "@wop/types/workspaceProblems";
import type { TechnicalWorkspaceCellSnapshot } from "@wop/components/TechnicalWorkspaceGrid";
import { useAgents } from "@wop/hooks/useAgents";
import { buildFilePutPayload, useFileEditor, type FilePersistEncoding } from "@wop/hooks/useFileEditor";
import { useServerConfig } from "@wop/hooks/useServerConfig";
import { useRunMenuDebugState } from "@wop/hooks/useRunMenuDebugState";
import { useSimplePreferences } from "@wop/hooks/useSimplePreferences";
import { useWayOfPiSession, type ChatSessionMode, type ChatSessionSurfaceId } from "@wop/hooks/useWayOfPiSession";
import { useWorkspaceTree } from "@wop/hooks/useWorkspaceTree";
import { useWorkspaceStaticAnalysis } from "@wop/hooks/useWorkspaceStaticAnalysis";
import type { PiModelConfigPath } from "@wop/constants/piModelConfigPaths";
import { PI_MODEL_CONFIG_ENTRIES } from "@wop/constants/piModelConfigPaths";
import type { FileMenuProps } from "@wop/types/fileMenu";
import type {
  EditMenuHandlers, GoMenuHandlers, HelpMenuHandlers, RunMenuHandlers,
  SelectionMenuHandlers, SettingsMenuHandlers, TerminalMenuHandlers, WorkspaceEditorRef,
} from "@wop/types/workspaceEditor";
import type { BottomPanelTab, EditorLayoutPreset, TechnicalActivity } from "@wop/types/technicalShell";
import { flattenTreeFiles } from "@wop/utils/flattenTree";
import { ancestorDirPaths, posixBasename, posixDirname } from "@wop/utils/posixPath";
import { injectIntoChatComposer } from "@wop/utils/chatComposerInjectBus";
import { buildImplementPlanPrompt, buildReviewPlanPrompt } from "@wop/utils/planModeComposerTemplates";
import { createPlanArtifactInWorkspace } from "@wop/utils/planModeWorkspace";
import { readAutoSaveInitial, writeAutoSave } from "@wop/utils/editorPreferences";
import { chatErrorSuggestsModelFix } from "@wop/utils/chatErrorModelHint";
import { workspaceAgentDisplayName } from "@wop/utils/workspaceAgentDisplay";
import { pushRecentWorkspaceFolder, readRecentWorkspaceFolders } from "@wop/utils/workspaceRecent";
import { absolutePathForSaveAsDefault, relativePathFromWorkspaceAbs } from "@wop/utils/workspaceDiskPath";
import {
  applyAddFileTab, applyAddPanelTab, applyCloseToolTab, applyEnsureFileTab,
  applyFocusToolTab, applyPanelTabMove, applyRemoveFileTab, applyRemoveTab,
  applyShowToolTab, cloneLayout, PANEL_DOCK_DEFAULTS, PANEL_TAB_DND_TYPE,
  parseFilePathDragJson, parsePanelTabJson, parseWorkspacePaneCellIndex,
  remapFileTabPath, remapPathPrefixInDock, removeExplorerPathsFromDock,
  toolTabVisible, WOP_DND_SOURCE_CELL_TYPE, WOP_FILE_PATH_DND_TYPE,
  WOP_WORKSPACE_PANE_DND_TYPE, type PanelDockLayout, type PanelTab, type ToolTabId,
} from "@wop/utils/panelDockLayout";
import {
  chatSizePxWhenSwitchingDock, clampChatHeight, clampChatWidth,
  clampLeftSidebarWidth, DEFAULT_COMPACT_BOTTOM_CHAT_HEIGHT_PX,
  DOCK_DEFAULTS, readDockLayout, readLeftSidebarVisibleInitial,
  writeDockLayout, writeLeftSidebarVisible, type ChatDockRegion, type TechnicalDockLayout,
} from "@wop/utils/technicalLayoutStorage";
import {
  readChromePreferences, writeChromePreferences, type ChromePreferences,
} from "@wop/utils/chromePreferences";
import {
  applyWorkspaceGridColResizeDelta, applyWorkspaceGridRowResizeDelta,
  growWorkspaceGridForEdgeDrop, mapCellIndexAfterRemoval,
  nextFocusAfterRemove, readWorkspaceGridState, remapWorkspaceCellIndexAfterEdgeGrow,
  removeWorkspaceCellAt, resizeWorkspaceGrid, WORKSPACE_GRID_MAX_COLS, WORKSPACE_GRID_MAX_ROWS,
  writeWorkspaceGridState, type WorkspaceGridState,
} from "@wop/utils/workspaceGridStorage";
import type { WopDropZone } from "@wop/utils/workspaceDropZones";
import { computeWorkspaceFilePreview } from "@wop/utils/workspaceFilePreview";
import { sendTerminalInput } from "@wop/utils/terminalInputBridge";
import { mergeSnippetIntoLaunchJson, type LaunchSnippetId } from "@wop/utils/launchJsonMutate";
import { getActiveFileDebugPlan, runActiveFileShellLine } from "@wop/utils/terminalRunCommands";
import { SidebarContent } from "./layout/SidebarContent";
import { WorkspaceEditor } from "./layout/WorkspaceEditor";

const WOP_PUBLIC_REPO_URL = "https://github.com/zerwiz/wayofpi";
const WOP_FEEDBACK_CONTACT_URL = "https://whynotproductions.netlify.app/contact/";
const WOP_SUPPORT_HOME_URL = "https://whynotproductions.netlify.app/";
const TASKS_JSON_REL = ".vscode/tasks.json";
const LAUNCH_JSON_REL = ".vscode/launch.json";

function languageFromPath(path: string | null): string {
  if (!path) return "Plain Text";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    py: "Python", ts: "TypeScript", tsx: "TypeScript",
    js: "JavaScript", jsx: "JavaScript", json: "JSON",
    md: "Markdown", yml: "YAML", yaml: "YAML",
  };
  return map[ext] ?? "Plain Text";
}

function applyMovePanelTabBetweenCellsInGrid(
  g: WorkspaceGridState, from: number, to: number, tab: PanelTab, before: PanelTab | null,
): WorkspaceGridState {
  const n = g.cols * g.rows;
  if (from < 0 || from >= n || to < 0 || to >= n) return g;
  if (from === to) {
    const cells = [...g.cells];
    const dock = cells[to] ?? cloneLayout(PANEL_DOCK_DEFAULTS);
    const nextDock = applyPanelTabMove(dock, tab, before);
    if (nextDock === dock) return g;
    cells[to] = nextDock;
    return { ...g, cells };
  }
  const cells = [...g.cells];
  const fromDock = cells[from] ?? cloneLayout(PANEL_DOCK_DEFAULTS);
  const toDock = cells[to] ?? cloneLayout(PANEL_DOCK_DEFAULTS);
  const afterRemove = applyRemoveTab(fromDock, tab);
  const afterAdd = applyAddPanelTab(toDock, tab);
  const afterMove = before ? applyPanelTabMove(afterAdd, tab, before) : afterAdd;
  if (afterRemove === fromDock && afterMove === toDock) return g;
  cells[from] = afterRemove;
  cells[to] = afterMove;
  return { ...g, cells };
}

export function TechnicalApp() {
  const uiMode = "technical";
  const technical = true;
  const { mode: _ignore, setMode: setUiMode } = { mode: uiMode, setMode: (_m: string) => {} };
  const {
    root, nodes, folders, git, switchAllowed, error: treeError,
    loading: treeLoading, refresh, refreshQuiet,
  } = useWorkspaceTree();
  const refreshTreeQuietShell = useCallback(async () => { await refreshQuiet(); }, [refreshQuiet]);
  const workspaceOperational = useMemo(
    () => !treeError && (folders.length > 0 || Boolean(root?.trim())),
    [treeError, folders.length, root],
  );
  const { config, refresh: refreshServerConfig } = useServerConfig();
  const agentsApi = useAgents();
  const chatSurfaceId: ChatSessionSurfaceId = "technical";
  const session = useWayOfPiSession();
  const teamPulseSessionTokenSummary = useMemo(
    () => ({
      tokensDown: session.tokenMeter.tokensDown,
      tokensUp: session.tokenMeter.tokensUp,
      tokensTitle: session.tokenMeter.tokensTitle,
    }),
    [session.tokenMeter.tokensDown, session.tokenMeter.tokensUp, session.tokenMeter.tokensTitle],
  );
  const { isDark: simpleIsDark } = useSimplePreferences();
  const llmFixModalAppearanceDark = true;
  const [llmFixModalDismissed, setLlmFixModalDismissed] = useState(false);
  const prevChatErrorRef = useRef<string | null>(null);
  useEffect(() => {
    const e = session.error;
    if (!e) { prevChatErrorRef.current = null; setLlmFixModalDismissed(false); return; }
    if (prevChatErrorRef.current !== e) { prevChatErrorRef.current = e; setLlmFixModalDismissed(false); }
  }, [session.error]);
  const showLlmFixModal = !!session.error && chatErrorSuggestsModelFix(session.error) && !llmFixModalDismissed;
  const teamsYamlWritePath = useMemo(() => {
    const tp = agentsApi.data?.teamsPath;
    if (tp) return tp;
    if (folders.length > 1 && folders[0]) return `${folders[0].label}/.pi/agents/teams.yaml`;
    return ".pi/agents/teams.yaml";
  }, [agentsApi.data?.teamsPath, folders]);
  const modelLabel = useMemo(() => {
    if (!config) return "…";
    const p = (session.llmProviderFromSocket() ?? config.provider ?? "ollama").toLowerCase();
    const id = session.effectiveModel?.trim() || (p === "openrouter" ? config.openrouterModel : config.ollamaModel);
    const trimmed = String(id ?? "").trim();
    if (!trimmed) return "…";
    const stackLabel = p === "openrouter" ? `openrouter/${trimmed}` : p === "ollama" ? `ollama/${trimmed}` : `${p}/${trimmed}`;
    if (config.piDrivesChat) return `Pi · ${stackLabel}`;
    return `Bun · ${stackLabel}`;
  }, [config, session.effectiveModel, session.llmProviderFromSocket]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [explorerContextDir, setExplorerContextDir] = useState("");
  const [treeExpand, setTreeExpand] = useState<{ rev: number; paths: string[] }>({ rev: 0, paths: [] });
  const [autoSave, setAutoSave] = useState(readAutoSaveInitial);
  const [recentTick, setRecentTick] = useState(0);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);
  const recentFolders = useMemo(() => readRecentWorkspaceFolders(), [recentTick]);
  const [workspaceGrid, setWorkspaceGrid] = useState(() => readWorkspaceGridState());
  const [wsFocusedCell, setWsFocusedCell] = useState(0);
  const [wsMaximizedCell, setWsMaximizedCell] = useState<number | null>(null);
  useEffect(() => {
    if (wsMaximizedCell == null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setWsMaximizedCell(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wsMaximizedCell]);
  const [techWsSnapshot, setTechWsSnapshot] = useState<TechnicalWorkspaceCellSnapshot | null>(null);
  const [multiCellAnyDirty, setMultiCellAnyDirty] = useState(false);
  const multiCellSaveApiRef = useRef<{ saveAllDirty: () => Promise<boolean> } | null>(null);
  const [workspaceOpenSignal, setWorkspaceOpenSignal] = useState<{ path: string; rev: number } | null>(null);
  const [workspaceCloseEditorSignal, setWorkspaceCloseEditorSignal] = useState<{ rev: number; cellIndex: number } | null>(null);
  const [line, setLine] = useState(1);
  const [col, setCol] = useState(1);
  const techWsSnapshotRef = useRef<TechnicalWorkspaceCellSnapshot | null>(null);
  useLayoutEffect(() => { techWsSnapshotRef.current = techWsSnapshot; }, [techWsSnapshot]);
  const isWsMulti = workspaceGrid.cols > 1 || workspaceGrid.rows > 1;
  const panelDock = workspaceGrid.cells[wsFocusedCell] ?? workspaceGrid.cells[0] ?? cloneLayout(PANEL_DOCK_DEFAULTS);

  const patchWorkspaceCellDock = useCallback((cellIndex: number, update: SetStateAction<PanelDockLayout>) => {
    setWorkspaceGrid((g) => {
      const cells = [...g.cells];
      const cur = cells[cellIndex] ?? cloneLayout(PANEL_DOCK_DEFAULTS);
      const nextDock = typeof update === "function" ? (update as (p: PanelDockLayout) => PanelDockLayout)(cur) : update;
      if (nextDock === cur) return g;
      cells[cellIndex] = nextDock;
      const out = { ...g, cells };
      writeWorkspaceGridState(out);
      return out;
    });
  }, []);

  const movePanelTabBetweenCells = useCallback((from: number, to: number, tab: PanelTab, before: PanelTab | null) => {
    if (from === to) return;
    setWorkspaceGrid((g) => {
      const out = applyMovePanelTabBetweenCellsInGrid(g, from, to, tab, before);
      if (out === g) return g;
      writeWorkspaceGridState(out);
      return out;
    });
    setWsFocusedCell(to);
  }, []);

  const onWorkspaceGridRowResize = useCallback((rowEdge: number, dy: number) => {
    setWorkspaceGrid((g) => {
      const next = applyWorkspaceGridRowResizeDelta(g, rowEdge, dy);
      if (next === g) return g;
      writeWorkspaceGridState(next);
      return next;
    });
  }, []);

  const onWorkspaceGridColResize = useCallback((colEdge: number, dx: number) => {
    setWorkspaceGrid((g) => {
      const next = applyWorkspaceGridColResizeDelta(g, colEdge, dx);
      if (next === g) return g;
      writeWorkspaceGridState(next);
      return next;
    });
  }, []);

  const setPanelDock = useCallback(
    (update: SetStateAction<PanelDockLayout>) => {
      const multi = workspaceGrid.cols * workspaceGrid.rows > 1;
      patchWorkspaceCellDock(multi ? wsFocusedCell : 0, update);
    },
    [workspaceGrid.cols, workspaceGrid.rows, wsFocusedCell, patchWorkspaceCellDock],
  );

  const onOpenToolPanelForCell = useCallback(
    (cellIndex: number, tab: BottomPanelTab) => {
      patchWorkspaceCellDock(cellIndex, (prev) => applyShowToolTab(prev, tab as ToolTabId));
    },
    [patchWorkspaceCellDock],
  );

  useEffect(() => {
    if (workspaceGrid.cols * workspaceGrid.rows <= 1) setWsMaximizedCell(null);
  }, [workspaceGrid.cols, workspaceGrid.rows]);

  useEffect(() => {
    const n = workspaceGrid.cols * workspaceGrid.rows;
    if (wsMaximizedCell != null && (wsMaximizedCell < 0 || wsMaximizedCell >= n)) setWsMaximizedCell(null);
  }, [workspaceGrid.cols, workspaceGrid.rows, wsMaximizedCell]);

  const splitEditorRight = useCallback(() => {
    setWorkspaceGrid((g) => {
      if (g.cols >= WORKSPACE_GRID_MAX_COLS) return g;
      const oldCols = g.cols;
      const next = resizeWorkspaceGrid(g, oldCols + 1, g.rows);
      writeWorkspaceGridState(next);
      const fc = wsFocusedCell;
      const row = Math.floor(fc / oldCols);
      const newFocus = Math.min(row * next.cols + oldCols, next.cols * next.rows - 1);
      queueMicrotask(() => setWsFocusedCell(newFocus));
      return next;
    });
  }, [wsFocusedCell]);

  const onWorkspaceSurfaceDrop = useCallback((e: DragEvent, surfaceCellIndex: number, zone: WopDropZone) => {
    const dt = e.dataTransfer;
    const rawPaneCell = dt.getData(WOP_WORKSPACE_PANE_DND_TYPE);
    const paneSrc = parseWorkspacePaneCellIndex(rawPaneCell);
    const rawTab = dt.getData(PANEL_TAB_DND_TYPE);
    const rawPath = dt.getData(WOP_FILE_PATH_DND_TYPE);
    const rawSrc = dt.getData(WOP_DND_SOURCE_CELL_TYPE);
    const tab = parsePanelTabJson(rawTab);
    const path = rawPath.length > 0 ? parseFilePathDragJson(rawPath) : parseFilePathDragJson(dt.getData("text/plain"));
    const srcParsed = parseInt(rawSrc, 10);
    const sourceCell = Number.isFinite(srcParsed) ? srcParsed : undefined;
    setWorkspaceGrid((g) => {
      const { grid: g1, targetCell: t0 } = growWorkspaceGridForEdgeDrop(g, surfaceCellIndex, zone);
      const n = g1.cols * g1.rows;
      const t = Math.max(0, Math.min(t0, n - 1));
      const paneSrcRem = paneSrc != null ? remapWorkspaceCellIndexAfterEdgeGrow(g, g1, zone, surfaceCellIndex, paneSrc) : null;
      const srcRem = sourceCell !== undefined ? remapWorkspaceCellIndexAfterEdgeGrow(g, g1, zone, surfaceCellIndex, sourceCell) : undefined;
      if (paneSrcRem != null && paneSrcRem >= 0 && paneSrcRem < n && paneSrcRem !== t) {
        const cells = [...g1.cells];
        const a = cells[paneSrcRem]!;
        const b = cells[t]!;
        cells[paneSrcRem] = b;
        cells[t] = a;
        const out = { ...g1, cells };
        writeWorkspaceGridState(out);
        queueMicrotask(() => setWsFocusedCell(t));
        return out;
      }
      if (path) {
        const cells = [...g1.cells];
        const cur = cells[t] ?? cloneLayout(PANEL_DOCK_DEFAULTS);
        cells[t] = applyAddFileTab(cur, path);
        const out = { ...g1, cells };
        writeWorkspaceGridState(out);
        queueMicrotask(() => setWsFocusedCell(t));
        return out;
      }
      if (tab) {
        const src = srcRem !== undefined ? srcRem : t;
        if (src !== t) {
          const out = applyMovePanelTabBetweenCellsInGrid(g1, src, t, tab, null);
          if (out === g1 && g1 === g) return g;
          writeWorkspaceGridState(out);
          queueMicrotask(() => setWsFocusedCell(t));
          return out;
        }
        const cells = [...g1.cells];
        const dock = cells[t] ?? cloneLayout(PANEL_DOCK_DEFAULTS);
        const nextDock = applyPanelTabMove(dock, tab, null);
        if (nextDock === dock) { if (g1 !== g) writeWorkspaceGridState(g1); return g1 !== g ? g1 : g; }
        cells[t] = nextDock;
        const out = { ...g1, cells };
        writeWorkspaceGridState(out);
        queueMicrotask(() => setWsFocusedCell(t));
        return out;
      }
      return g;
    });
  }, []);

  const onToggleWorkspaceMaximizeCell = useCallback((cellIndex: number) => {
    setWsMaximizedCell((m) => (m === cellIndex ? null : cellIndex));
  }, []);

  const removeWorkspaceCellFromGrid = useCallback((cellIndex: number) => {
    setWorkspaceGrid((g) => {
      const next = removeWorkspaceCellAt(g, cellIndex);
      if (next === g) return g;
      writeWorkspaceGridState(next);
      queueMicrotask(() => { setWsFocusedCell((fc) => nextFocusAfterRemove(g, next, cellIndex, fc)); setWsMaximizedCell((m) => m == null ? m : mapCellIndexAfterRemoval(g, cellIndex, m)); });
      return next;
    });
  }, []);

  const onTechFocusedReport = useCallback((s: TechnicalWorkspaceCellSnapshot) => {
    setTechWsSnapshot(s);
    setSelectedPath(s.selectedPath);
    if (s.selectedPath) setExplorerContextDir(posixDirname(s.selectedPath));
  }, []);

  const onTechFocusedCursor = useCallback((l: number, c: number) => {
    setLine(l); setCol(c);
  }, []);

  const { content, setContent, persistEncoding, mimeType: fileMimeType, loading: fileLoading, error: fileError, dirty, save, reload, discardUnsavedChanges } =
    useFileEditor(isWsMulti ? null : selectedPath, { autoSave, onDiskPathMismatch: (p) => setSelectedPath(p) });

  const workspaceCenterFilePreview = useMemo(() => {
    if (fileLoading) return null;
    return computeWorkspaceFilePreview(selectedPath, persistEncoding, fileMimeType, content);
  }, [fileLoading, selectedPath, persistEncoding, fileMimeType, content]);

  useEffect(() => { if (isWsMulti) return; setTechWsSnapshot(null); }, [isWsMulti]);
  useEffect(() => { if (!isWsMulti) { setMultiCellAnyDirty(false); multiCellSaveApiRef.current = null; } }, [isWsMulti]);

  const onBindMultiCellSaveApi = useCallback((api: { saveAllDirty: () => Promise<boolean> } | null) => {
    multiCellSaveApiRef.current = api;
  }, []);

  const onMultiCellAnyDirtyChange = useCallback((v: boolean) => { setMultiCellAnyDirty(v); }, []);

  const effSelectedPath = isWsMulti ? (techWsSnapshot?.selectedPath ?? null) : selectedPath;
  const effDirty = isWsMulti ? !!techWsSnapshot?.dirty : dirty;
  const effFileLoading = isWsMulti ? !!techWsSnapshot?.loading : fileLoading;
  const effFileError = isWsMulti ? techWsSnapshot?.error ?? null : fileError;

  const { breakpointsByPath, setBreakpointsByPath, allBreakpointsDisabled, setAllBreakpointsDisabled, debugSessionActive, debugReplSession, beginDebugSession, endDebugSession } =
    useRunMenuDebugState();

  const workspaceEditorRef = useRef<WorkspaceEditorRef | null>(null);
  const [editorMenuTick, setEditorMenuTick] = useState(0);
  const bumpEditorMenu = useCallback(() => setEditorMenuTick((t) => t + 1), []);
  const [selectionMenuTick, setSelectionMenuTick] = useState(0);
  const bumpSelectionPrefs = useCallback(() => setSelectionMenuTick((t) => t + 1), []);
  const [activity, setActivity] = useState<TechnicalActivity>("explorer");
  const [chrome, setChrome] = useState(() => readChromePreferences());
  const [zenMode, setZenMode] = useState(false);
  const zenBackupRef = useRef<{ leftSidebarVisible: boolean; agentPanelVisible: boolean; chatDock: ChatDockRegion; chrome: ChromePreferences } | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(readLeftSidebarVisibleInitial);
  const [dockLayout, setDockLayoutState] = useState<TechnicalDockLayout>(readDockLayout);

  const updateDockLayout = useCallback((patch: Partial<TechnicalDockLayout> | ((d: TechnicalDockLayout) => TechnicalDockLayout)) => {
    setDockLayoutState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      const chatSizePx = next.chatDock === "right" ? clampChatWidth(next.chatSizePx) : clampChatHeight(next.chatSizePx);
      const prevH = prev.horizontalToolDockHeightsPx;
      const nextH = next.horizontalToolDockHeightsPx ?? prevH;
      const fixed = { ...next, chatSizePx, leftSidebarWidthPx: clampLeftSidebarWidth(next.leftSidebarWidthPx ?? DOCK_DEFAULTS.leftSidebarWidthPx), horizontalToolDockHeightsPx: { top: clampBottomPanelHeight(nextH.top ?? prevH.top ?? DOCK_DEFAULTS.horizontalToolDockHeightsPx.top), bottom: clampBottomPanelHeight(nextH.bottom ?? prevH.bottom ?? DOCK_DEFAULTS.horizontalToolDockHeightsPx.bottom) } };
      writeDockLayout(fixed);
      return fixed;
    });
  }, []);

  const persistLeftSidebar = useCallback((visible: boolean) => { setLeftSidebarVisible(visible); writeLeftSidebarVisible(visible); }, []);
  const toggleLeftSidebar = useCallback(() => { setLeftSidebarVisible((v) => { const n = !v; writeLeftSidebarVisible(n); return n; }); }, []);
  const selectActivityWithSidebar = useCallback((a: TechnicalActivity) => { persistLeftSidebar(true); setActivity(a); }, [persistLeftSidebar]);
  const [hostDoctorOpen, setHostDoctorOpen] = useState(false);
  const [indexingDocsOpen, setIndexingDocsOpen] = useState(false);
  const [honchoSettingsOpen, setHonchoSettingsOpen] = useState(false);
  const [agentPermissionsOpen, setAgentPermissionsOpen] = useState(false);
  const [launchConfigAddOpen, setLaunchConfigAddOpen] = useState(false);
  const [installDebuggersModalOpen, setInstallDebuggersModalOpen] = useState(false);
  const [mitLicenseModalOpen, setMitLicenseModalOpen] = useState(false);
  const [restartServerModalOpen, setRestartServerModalOpen] = useState(false);
  const [howToUseModalOpen, setHowToUseModalOpen] = useState(false);
  const [newPlanFileModalOpen, setNewPlanFileModalOpen] = useState(false);
  const [newWorkspaceFileDraft, setNewWorkspaceFileDraft] = useState<{ defaultPath: string; initialContent?: string } | null>(null);

  const openHostDoctor = useCallback(() => { setHostDoctorOpen(true); }, []);
  const dismissLlmFixModal = useCallback(() => setLlmFixModalDismissed(true), []);
  const reopenLlmFixModal = useCallback(() => setLlmFixModalDismissed(false), []);
  const openLlmFixSimpleBrains = useCallback(() => { dismissLlmFixModal(); queueMicrotask(() => setUiMode("simple")); }, [dismissLlmFixModal]);
  const openLlmFixProviderCatalog = useCallback(() => { dismissLlmFixModal(); queueMicrotask(() => openPiModelConfigInEditor("agent/models.json")); }, [dismissLlmFixModal]);

  const openPiModelConfigInEditor = useCallback((path: PiModelConfigPath) => {
    if (workspaceGrid.cols > 1 || workspaceGrid.rows > 1) {
      setWorkspaceOpenSignal((s) => ({ path, rev: (s?.rev ?? 0) + 1 }));
    } else { setSelectedPath(path); }
    setExplorerContextDir(posixDirname(path));
    setActivity("explorer");
    persistLeftSidebar(true);
  }, [persistLeftSidebar, workspaceGrid.cols, workspaceGrid.rows]);

  const openAgentSetupFromMenu = useCallback(() => { setUiMode("simple"); }, []);
  const openWorkspaceSearch = useCallback(() => { persistLeftSidebar(true); setActivity("search"); }, [persistLeftSidebar]);
  const onCursor = useCallback((l: number, c: number) => { setLine(l); setCol(c); }, []);

  const rootLabel = useMemo(() => {
    if (folders.length > 1) return `Multi-root (${folders.length})`;
    const p = folders[0]?.path ?? root;
    if (!p) return "";
    const parts = p.split(/[/\\]/);
    return parts[parts.length - 1] || p;
  }, [folders, root]);

  const bumpRecent = useCallback(() => setRecentTick((t) => t + 1), []);
  useEffect(() => { if (selectedPath) setExplorerContextDir(posixDirname(selectedPath)); }, [selectedPath]);

  function sanitizeNewEntryName(raw: string): string | null {
    const t = raw.trim().replace(/\\/g, "/").replace(/^\/+/, "");
    if (!t || t === "." || t.includes("..")) return null;
    return t;
  }

  const handleNewFile = useCallback(async () => {
    const name = window.prompt("New file name (under the selected folder)", "untitled.txt");
    if (name == null) return;
    const safe = sanitizeNewEntryName(name);
    if (!safe) { window.alert("Invalid name."); return; }
    const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
    try { await apiPostJson("/api/fs/entry", { path: rel, kind: "file" }); setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) }); await refresh(); setSelectedPath(rel); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [explorerContextDir, refresh]);

  const handleNewFolder = useCallback(async () => {
    const name = window.prompt("New folder name (under the selected folder)", "new-folder");
    if (name == null) return;
    const safe = sanitizeNewEntryName(name);
    if (!safe) { window.alert("Invalid name."); return; }
    const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
    try { await apiPostJson("/api/fs/entry", { path: rel, kind: "dir" }); setTreeExpand({ rev: Date.now(), paths: [...ancestorDirPaths(rel), rel] }); await refresh(); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [explorerContextDir, refresh]);

  const handleExplorerCopyPath = useCallback((path: string) => { void navigator.clipboard.writeText(path).catch(() => window.alert("Could not copy to clipboard.")); }, []);

  const handleExplorerMoveFile = useCallback(async (from: string, toDir: string) => {
    const destPreview = toDir ? `${toDir}/${posixBasename(from)}` : posixBasename(from);
    if (destPreview.replace(/\/+$/, "") === from.replace(/\/+$/, "")) return;
    if (effDirty && effSelectedPath === from) { window.alert("Save or revert the open file before moving it."); return; }
    try {
      const r = await apiPostJson<{ ok: boolean; to: string }>("/api/fs/move", { from, toDir });
      setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(r.to) });
      setWorkspaceGrid((g) => { const cells = g.cells.map((dock) => remapFileTabPath(dock, from, r.to)); const out = { ...g, cells }; writeWorkspaceGridState(out); return out; });
      if (selectedPath === from) setSelectedPath(r.to);
      await refresh();
    } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [effDirty, effSelectedPath, selectedPath, refresh]);

  const handleExplorerRenameNode = useCallback(async (path: string, kind: "file" | "dir", currentName: string) => {
    const next = window.prompt(`Rename ${kind}`, currentName);
    if (next == null) return;
    const safe = sanitizeNewEntryName(next);
    if (!safe) { window.alert("Invalid name."); return; }
    if (safe === currentName) return;
    if (effDirty && effSelectedPath && (effSelectedPath === path || (kind === "dir" && effSelectedPath.startsWith(`${path}/`)))) { window.alert("Save or revert open file(s) before renaming."); return; }
    try {
      const r = await apiPostJson<{ ok: boolean; to: string }>("/api/fs/rename", { from: path, newName: safe });
      setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(r.to) });
      setWorkspaceGrid((g) => { const cells = g.cells.map((dock) => kind === "dir" ? remapPathPrefixInDock(dock, path, r.to) : remapFileTabPath(dock, path, r.to)); const out = { ...g, cells }; writeWorkspaceGridState(out); return out; });
      setSelectedPath((p) => { if (!p) return p; if (kind === "file") return p === path ? r.to : p; if (p === path) return r.to; if (p.startsWith(`${path}/`)) return `${r.to}/${p.slice(path.length + 1)}`; return p; });
      await refresh();
    } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [effDirty, effSelectedPath, refresh]);

  const handleExplorerDeleteNode = useCallback(async (path: string, kind: "file" | "dir") => {
    const label = kind === "dir" ? `folder "${posixBasename(path)}" and everything inside it` : `"${posixBasename(path)}"`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    if (effDirty && effSelectedPath && (effSelectedPath === path || (kind === "dir" && effSelectedPath.startsWith(`${path}/`)))) { window.alert("Save or revert open file(s) before deleting."); return; }
    try {
      await apiPostJson("/api/fs/delete", { path });
      setWorkspaceGrid((g) => { const cells = g.cells.map((dock) => removeExplorerPathsFromDock(dock, path, kind)); const out = { ...g, cells }; writeWorkspaceGridState(out); return out; });
      setSelectedPath((p) => { if (!p) return p; if (p === path || (kind === "dir" && p.startsWith(`${path}/`))) return null; return p; });
      await refresh();
    } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [effDirty, effSelectedPath, refresh]);

  const handleNewPlanFile = useCallback(() => {
    if (!workspaceOperational) { window.alert("No workspace loaded."); return; }
    setNewPlanFileModalOpen(true);
  }, [workspaceOperational]);

  const handleNewPlanFileCreate = useCallback(async (title: string, slugSuggestion: string) => {
    setNewPlanFileModalOpen(false);
    try {
      const { path } = await createPlanArtifactInWorkspace({ slugSuggestion, title });
      setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(path) });
      await refresh();
      setSelectedPath(path);
      persistLeftSidebar(true);
      setActivity("explorer");
    } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [refresh, persistLeftSidebar]);

  const handleChatModeChange = useCallback((m: ChatSessionMode) => { session.setChatMode(m); }, [session.setChatMode]);

  const focusWorkspaceFileFromMenu = useCallback((rel: string) => {
    setExplorerContextDir(posixDirname(rel));
    if (workspaceGrid.cols > 1 || workspaceGrid.rows > 1) { setWorkspaceOpenSignal((s) => ({ path: rel, rev: (s?.rev ?? 0) + 1 })); }
    else { setSelectedPath(rel); }
    setActivity("explorer");
    persistLeftSidebar(true);
  }, [workspaceGrid.cols, workspaceGrid.rows, persistLeftSidebar]);

  const openTeamsYamlFromMenu = useCallback(() => {
    const rel = agentsApi.data?.teamsPath ?? ".pi/agents/teams.yaml";
    focusWorkspaceFileFromMenu(rel);
  }, [agentsApi.data?.teamsPath, focusWorkspaceFileFromMenu]);

  const createNewAgentMarkdownFromMenu = useCallback(() => {
    const teamsPath = agentsApi.data?.teamsPath;
    const baseDir = teamsPath ? posixDirname(teamsPath) : ".pi/agents";
    const raw = window.prompt("New agent id", "my-agent");
    if (raw == null) return;
    const trimmed = raw.trim().replace(/\.md$/i, "");
    if (!trimmed || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(trimmed)) { window.alert("Invalid id."); return; }
    const rel = `${baseDir}/${trimmed}.md`;
    const content = `---\nname: ${trimmed}\ndescription:\n---\n\n`;
    void (async () => {
      try { await apiPutJson("/api/file", { path: rel, content }); setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) }); await refresh(); focusWorkspaceFileFromMenu(rel); agentsApi.reload(); }
      catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
    })();
  }, [agentsApi, focusWorkspaceFileFromMenu, refresh]);


  const settingsMenuHandlers = useMemo<SettingsMenuHandlers>(() => ({
    onOpenSimpleAppSettings: () => {},
    onOpenAiBrains: () => {},
    onOpenProjects: () => {},
    onOpenIndexingDocs: () => setIndexingDocsOpen(true),
    onOpenHonchoSettings: () => setHonchoSettingsOpen(true),
    onEditWorkspaceViewsCatalog: () => {},
    onRestartServer: () => setRestartServerModalOpen(true),
  }), []);

  const navHistoryRef = useRef<{ stack: string[]; idx: number }>({ stack: [], idx: -1 });
  const skipHistoryPushRef = useRef(false);
  const [navHistoryTick, setNavHistoryTick] = useState(0);

  useEffect(() => {
    if (skipHistoryPushRef.current) { skipHistoryPushRef.current = false; setNavHistoryTick((t) => t + 1); return; }
    if (!selectedPath) { setNavHistoryTick((t) => t + 1); return; }
    const h = navHistoryRef.current;
    const cur = h.stack[h.idx];
    if (cur === selectedPath) { setNavHistoryTick((t) => t + 1); return; }
    const nextStack = h.stack.slice(0, h.idx + 1);
    nextStack.push(selectedPath);
    navHistoryRef.current = { stack: nextStack, idx: nextStack.length - 1 };
    setNavHistoryTick((t) => t + 1);
  }, [selectedPath]);

  const goHistoryBack = useCallback(() => {
    const h = navHistoryRef.current;
    if (h.idx <= 0) return;
    h.idx -= 1;
    const p = h.stack[h.idx];
    if (!p) return;
    skipHistoryPushRef.current = true;
    setSelectedPath(p);
    setNavHistoryTick((t) => t + 1);
  }, []);

  const goHistoryForward = useCallback(() => {
    const h = navHistoryRef.current;
    if (h.idx >= h.stack.length - 1) return;
    h.idx += 1;
    const p = h.stack[h.idx];
    if (!p) return;
    skipHistoryPushRef.current = true;
    setSelectedPath(p);
    setNavHistoryTick((t) => t + 1);
  }, []);

  const saveAndRefresh = useCallback(async () => {
    let ok = true;
    if (isWsMulti) { const s = techWsSnapshotRef.current; ok = s ? await s.save() : true; }
    else { ok = await save(); }
    if (ok) {
      await refresh();
      if (staticAnalysisEnabled) workspaceStaticAnalysis.scheduleDebouncedRefresh();
    }
  }, [isWsMulti, save, refresh, staticAnalysisEnabled, workspaceStaticAnalysis]);

  const reloadFocusedOrMain = useCallback(async () => {
    if (isWsMulti) { await techWsSnapshotRef.current?.reload?.(); }
    else { await reload(); }
  }, [isWsMulti, reload]);

  const copyWorkspacePath = useCallback(() => {
    const primary = folders[0]?.path ?? root;
    if (!primary) return;
    void navigator.clipboard.writeText(primary);
  }, [folders, root]);

  const pickAbsoluteServerPath = useCallback(async (kind: "file" | "folder"): Promise<string | null> => {
    if (switchAllowed) { const r = await requestNativePick(kind); if ("path" in r) return r.path; if ("cancelled" in r) return null; }
    const def = kind === "folder" ? root || "" : "";
    const p = window.prompt(kind === "folder" ? "Open folder (absolute path)" : "Open file (absolute path)", def);
    if (p == null || !p.trim()) return null;
    return p.trim();
  }, [switchAllowed, root]);

  const openFolderAbs = useCallback(async (abs: string) => {
    const r = await postWorkspaceOp({ op: "open_folder", path: abs });
    if (r.error) { window.alert(r.error); return; }
    pushRecentWorkspaceFolder(abs);
    bumpRecent();
    setSelectedPath(null);
    setExplorerContextDir("");
    await refresh();
  }, [bumpRecent, refresh]);

  const handleOpenFolderPrompt = useCallback(() => {
    void (async () => { const p = await pickAbsoluteServerPath("folder"); if (!p) return; void openFolderAbs(p); })();
  }, [openFolderAbs, pickAbsoluteServerPath]);

  const handleOpenFilePrompt = useCallback(() => {
    void (async () => {
      const abs = await pickAbsoluteServerPath("file");
      if (!abs) return;
      const r = await postWorkspaceOp({ op: "open_file", path: abs });
      if (r.error) { window.alert(r.error); return; }
      const parent = abs.replace(/[/\\][^/\\]*$/, "");
      if (parent) pushRecentWorkspaceFolder(parent);
      bumpRecent();
      if (r.selectPath) {
        setExplorerContextDir(posixDirname(r.selectPath));
        if (isWsMulti) { setWorkspaceOpenSignal((s) => ({ path: r.selectPath!, rev: (s?.rev ?? 0) + 1 })); }
        else { setSelectedPath(r.selectPath); }
      }
      await refresh();
    })();
  }, [bumpRecent, pickAbsoluteServerPath, refresh, isWsMulti]);

  const handleAddFolderPrompt = useCallback(() => {
    void (async () => {
      const p = await pickAbsoluteServerPath("folder");
      if (!p) return;
      const r = await postWorkspaceOp({ op: "add_folder", path: p });
      if (r.error) window.alert(r.error);
      else { pushRecentWorkspaceFolder(p); bumpRecent(); await refresh(); }
    })();
  }, [bumpRecent, pickAbsoluteServerPath, refresh]);

  const handleOpenRecentFolder = useCallback((abs: string) => { void openFolderAbs(abs); }, [openFolderAbs]);
  const handleRemoveWorkspaceFolder = useCallback(async (label: string) => {
    const r = await postWorkspaceOp({ op: "remove_folder", label });
    if (r.error) window.alert(r.error);
    else { setSelectedPath(null); await refresh(); }
  }, [refresh]);

  const handleCloseWorkspace = useCallback(async () => {
    const r = await postWorkspaceOp({ op: "close_workspace" });
    if (r.error) window.alert(r.error);
    else { setSelectedPath(null); setExplorerContextDir(""); await refresh(); }
  }, [refresh]);

  const handleCloseEditor = useCallback(() => {
    if (isWsMulti) {
      const s = techWsSnapshotRef.current;
      const p = s?.selectedPath;
      if (!p) return;
      if (s.dirty && !window.confirm("Close editor? Unsaved changes will be lost.")) return;
      setWorkspaceCloseEditorSignal((sig) => ({ rev: (sig?.rev ?? 0) + 1, cellIndex: wsFocusedCell }));
      return;
    }
    const t = panelDock.tabs[panelDock.activeIndex];
    const pathToClose = t?.type === "file" ? t.path : panelDock.tabs.find((x) => x.type === "file")?.path ?? selectedPath;
    if (!pathToClose) return;
    if (pathToClose === selectedPath && dirty && !window.confirm("Close editor? Unsaved changes will be lost.")) return;
    setPanelDock((prev) => applyRemoveFileTab(prev, pathToClose));
  }, [isWsMulti, selectedPath, dirty, wsFocusedCell, panelDock]);

  const closeAppWindowOrTab = useCallback(() => {
    const shell = (window as any).wopShell;
    if (shell?.closeWindow) { void shell.closeWindow(); return; }
    window.close();
    window.setTimeout(() => { window.alert("If the tab is still open, close it from the browser."); }, 100);
  }, []);

  const downloadWorkspaceJson = useCallback((suggestedName: string, parentDir: string | null) => {
    const payload = parentDir ? { folders: [{ path: parentDir }], settings: {} } : { folders: [], settings: {} };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const handleSaveWorkspaceAs = useCallback(() => {
    const raw = window.prompt("Parent folder path for workspace file", folders[0]?.path ?? "");
    if (raw == null) return;
    downloadWorkspaceJson("wayof-pi.code-workspace", raw.trim() || null);
  }, [folders, downloadWorkspaceJson]);

  const handleDuplicateWorkspace = useCallback(() => {
    const name = window.prompt("Save duplicate workspace as", "wayof-pi-copy.code-workspace");
    if (name == null) return;
    const raw = window.prompt("Parent folder path", folders[0]?.path ?? "");
    if (raw == null) return;
    downloadWorkspaceJson(name.trim() || "wayof-pi-copy.code-workspace", raw.trim() || null);
  }, [folders, downloadWorkspaceJson]);

  const handleNewTextFile = useCallback(() => {
    const name = window.prompt("New file name", "untitled.txt");
    if (name == null) return;
    const safe = sanitizeNewEntryName(name);
    if (!safe) { window.alert("Invalid name."); return; }
    const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
    void (async () => { try { await apiPostJson("/api/fs/entry", { path: rel, kind: "file" }); setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) }); await refresh(); setSelectedPath(rel); } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); } })();
  }, [explorerContextDir, refresh]);

  const performCreateNewWorkspaceFile = useCallback(async (relRaw: string, initialContent?: string) => {
    const safe = sanitizeNewEntryName(relRaw);
    if (!safe) { window.alert("Invalid name."); return; }
    try {
      await apiPostJson("/api/fs/entry", { path: safe, kind: "file" });
      if (initialContent !== undefined) { await apiPutJson("/api/file", { path: safe, content: initialContent }); }
      setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(safe) });
      await refresh();
      if (isWsMulti) { setWorkspaceOpenSignal((s) => ({ path: safe, rev: (s?.rev ?? 0) + 1 })); }
      else { setSelectedPath(safe); setPanelDock((prev) => applyAddFileTab(prev, safe)); }
    } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }, [refresh, isWsMulti]);

  const handleNewFileInDock = useCallback((defaultSuggestion: string, initialContent?: string) => {
    setNewWorkspaceFileDraft({ defaultPath: defaultSuggestion, initialContent });
  }, []);

  const handleOpenFileInDock = useCallback(() => {
    void (async () => {
      const abs = await pickAbsoluteServerPath("file");
      if (!abs) return;
      const r = await postWorkspaceOp({ op: "open_file", path: abs });
      if (r.error) { window.alert(r.error); return; }
      const parent = abs.replace(/[/\\][^/\\]*$/, "");
      if (parent) pushRecentWorkspaceFolder(parent);
      bumpRecent();
      if (r.selectPath) {
        setExplorerContextDir(posixDirname(r.selectPath));
        setWorkspaceOpenSignal((s) => ({ path: r.selectPath!, rev: (s?.rev ?? 0) + 1 }));
      }
      await refresh();
    })();
  }, [bumpRecent, pickAbsoluteServerPath, refresh]);

  const resolveSaveAsTargetPath = useCallback(async (relEditorPath: string): Promise<string | null> => {
    const shellSave = typeof window !== "undefined" ? (window as any).wopShell?.saveFileAs : undefined;
    if (shellSave && folders.length > 0) {
      const defaultPath = absolutePathForSaveAsDefault(relEditorPath, folders);
      const r = await shellSave({ defaultPath });
      if ("cancelled" in r && r.cancelled) return null;
      if ("error" in r && r.error) { window.alert(r.error); return null; }
      if ("path" in r && r.path) {
        const rel = relativePathFromWorkspaceAbs(r.path, folders);
        if (!rel) { window.alert("Save location must be inside an open workspace folder."); return null; }
        return rel;
      }
      return null;
    }
    const rel = window.prompt("Save as (path relative to workspace)", relEditorPath);
    if (rel == null || !rel.trim()) return null;
    return rel.trim().replace(/^[/\\]+/, "");
  }, [folders]);

  const handleSaveAs = useCallback(() => {
    const multi = isWsMulti;
    const snap = techWsSnapshotRef.current;
    const path = multi ? (snap?.selectedPath ?? null) : selectedPath;
    const fileContent = multi ? (snap?.content ?? "") : content;
    const enc: FilePersistEncoding = multi ? (snap?.persistEncoding ?? "utf8") : persistEncoding;
    if (!path) return;
    void (async () => {
      const target = await resolveSaveAsTargetPath(path);
      if (!target) return;
      try {
        await apiPutJson("/api/file", buildFilePutPayload(target, fileContent, enc));
        if (multi) { setWorkspaceOpenSignal((s) => ({ path: target, rev: (s?.rev ?? 0) + 1 })); }
        else { setSelectedPath(target); setPanelDock((prev) => applyAddFileTab(prev, target)); }
        setExplorerContextDir(posixDirname(target));
        setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(target) });
        await refresh();
        if (staticAnalysisEnabled) workspaceStaticAnalysis.scheduleDebouncedRefresh();
      } catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
    })();
  }, [content, selectedPath, persistEncoding, refresh, resolveSaveAsTargetPath, isWsMulti, staticAnalysisEnabled, workspaceStaticAnalysis]);

  const handleSaveAll = useCallback(async () => {
    const multi = isWsMulti;
    if (multi) {
      const api = multiCellSaveApiRef.current;
      let ok = true;
      if (api) ok = await api.saveAllDirty();
      if (ok) { await refresh(); if (staticAnalysisEnabled) workspaceStaticAnalysis.scheduleDebouncedRefresh(); }
    } else if (dirty && selectedPath) { await saveAndRefresh(); }
  }, [dirty, selectedPath, saveAndRefresh, refresh, isWsMulti, staticAnalysisEnabled, workspaceStaticAnalysis]);

  const onWorkspaceFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    let text: string;
    try { text = await f.text(); } catch { window.alert("Could not read file"); return; }
    let json: unknown;
    try { json = JSON.parse(text); } catch { window.alert("Invalid JSON workspace file"); return; }
    const absWs = await pickAbsoluteServerPath("file");
    if (!absWs) return;
    const r = await postWorkspaceOp({ op: "from_code_workspace_file", workspaceFilePath: absWs, json });
    if (r.error) window.alert(r.error);
    else { setSelectedPath(null); await refresh(); }
  }, [pickAbsoluteServerPath, refresh]);

  const openPreferences = useCallback(() => {
    persistLeftSidebar(true);
    setActivity("settings");
  }, [persistLeftSidebar]);

  const flipDockLayout = useCallback(() => {
    updateDockLayout((d) => {
      const next = d.chatDock === "right" ? "bottom" : "right";
      return { ...d, chatDock: next, chatSizePx: chatSizePxWhenSwitchingDock(d.chatDock, next, d.chatSizePx) };
    });
  }, [updateDockLayout]);

  const staticAnalysisEnabled = !!(folders[0]?.path ?? root);
  const workspaceStaticAnalysis = useWorkspaceStaticAnalysis(staticAnalysisEnabled);

  const openProblemLocation = useCallback((relPath: string, line: number, column: number) => {
    const path = relPath.replace(/^[/\\]+/, "");
    if (!path) return;
    setExplorerContextDir(posixDirname(path));
    if (isWsMulti) { setWorkspaceOpenSignal((s) => ({ path, rev: (s?.rev ?? 0) + 1 })); }
    else { setSelectedPath(path); setPanelDock((prev) => applyAddFileTab(prev, path)); }
    queueMicrotask(() => { workspaceEditorRef.current?.goToLineColumn(Math.max(1, line), Math.max(1, column)); });
  }, [isWsMulti]);

  const workspaceStaticAnalysisApi = useMemo(
    () => ({
      problems: workspaceStaticAnalysis.snapshot.problems as unknown as WorkspaceProblem[],
      loading: workspaceStaticAnalysis.loading,
      runAnalysis: workspaceStaticAnalysis.runAnalysis,
      scheduleDebouncedRefresh: workspaceStaticAnalysis.scheduleDebouncedRefresh,
      engine: workspaceStaticAnalysis.snapshot.engine,
      log: workspaceStaticAnalysis.snapshot.log.join('\n'),
      ranAt: workspaceStaticAnalysis.snapshot.ranAt.toISOString(),
      ok: workspaceStaticAnalysis.snapshot.ok,
      error: workspaceStaticAnalysis.snapshot.error ?? undefined,
      openProblem: openProblemLocation,
      refreshProblemsCache: workspaceStaticAnalysis.loadCached,
    } as unknown as WorkspaceStaticAnalysisContextValue),
    [workspaceStaticAnalysis.loading, workspaceStaticAnalysis.runAnalysis, workspaceStaticAnalysis.scheduleDebouncedRefresh, workspaceStaticAnalysis.loadCached, workspaceStaticAnalysis.snapshot.problems, workspaceStaticAnalysis.snapshot.engine, workspaceStaticAnalysis.snapshot.log, workspaceStaticAnalysis.snapshot.ranAt, workspaceStaticAnalysis.snapshot.ok, workspaceStaticAnalysis.snapshot.error, openProblemLocation],
  );

  const prevEffDirtyForProblems = useRef(effDirty);
  useEffect(() => {
    if (!staticAnalysisEnabled) return;
    if (prevEffDirtyForProblems.current && !effDirty && effSelectedPath) {
      workspaceStaticAnalysis.scheduleDebouncedRefresh();
    }
    prevEffDirtyForProblems.current = effDirty;
  }, [effDirty, effSelectedPath, staticAnalysisEnabled, workspaceStaticAnalysis.scheduleDebouncedRefresh]);

  const onOpenToolPanel = useCallback((tab: BottomPanelTab) => {
    setPanelDock((prev) => applyShowToolTab(prev, tab as ToolTabId));
  }, []);

  useEffect(() => { writeChromePreferences(chrome); }, [chrome]);

  const focusToolTab = useCallback((t: BottomPanelTab) => {
    setPanelDock((prev) => {
      const visible = toolTabVisible(prev, t as ToolTabId);
      return visible ? applyFocusToolTab(prev, t as ToolTabId) : applyShowToolTab(prev, t as ToolTabId);
    });
  }, []);

  const onOpenToolPanelForCellWithFocus = useCallback((cellIndex: number, t: BottomPanelTab) => {
    onOpenToolPanelForCell(cellIndex, t);
  }, [onOpenToolPanelForCell]);

  const workspaceDockFileActions = useMemo(
    () => [
      {
        label: "New file…",
        detail: "Opens as a new editor tab",
        run: () => handleNewFileInDock("untitled.txt"),
        submenu: [
          { label: "Plain text", detail: ".txt", run: () => handleNewFileInDock("untitled.txt") },
          { label: "Markdown", detail: ".md", run: () => handleNewFileInDock("untitled.md", "# \n\n") },
          { label: "JSON", detail: ".json", run: () => handleNewFileInDock("untitled.json", "{\n  \n}\n") },
          { label: "TypeScript", detail: ".ts", run: () => handleNewFileInDock("untitled.ts", "// \n") },
          { label: "JavaScript", detail: ".js", run: () => handleNewFileInDock("untitled.js", "// \n") },
          { label: "Python", detail: ".py", run: () => handleNewFileInDock("untitled.py", "# \n") },
          { label: "YAML", detail: ".yaml", run: () => handleNewFileInDock("untitled.yaml", "# \n") },
          { label: "Shell script", detail: ".sh", run: () => handleNewFileInDock("untitled.sh", "#!/usr/bin/env bash\n\n") },
        ],
      },
      { label: "Open file in workspace…", run: handleOpenFileInDock },
    ],
    [handleNewFileInDock, handleOpenFileInDock],
  );

  const fileMenu: FileMenuProps = useMemo(
    () => ({
      switchAllowed,
      recentFolders,
      autoSave,
      onToggleAutoSave: () => { setAutoSave((v) => { const n = !v; writeAutoSave(n); return n; }); },
      workspaceFolders: folders,
      dirty: isWsMulti ? multiCellAnyDirty : effDirty,
      hasOpenFile: !!effSelectedPath,
      canSaveFile: !!effSelectedPath && effDirty,
      canRevertFile: !!effSelectedPath && effDirty,
      onRefreshWorkspaceTree: refresh,
      onCopyWorkspacePath: copyWorkspacePath,
      onNewTextFile: handleNewTextFile,
      onNewWindow: () => { window.open(window.location.href, "_blank", "noopener,noreferrer"); },
      onNewAgentsWindow: () => { const u = new URL(window.location.href); u.searchParams.set("agents", "1"); window.open(u.toString(), "_blank", "noopener,noreferrer"); },
      onOpenFile: handleOpenFilePrompt,
      onOpenFolder: handleOpenFolderPrompt,
      onAddFolderToWorkspace: handleAddFolderPrompt,
      onOpenWorkspaceFromFile: () => workspaceFileInputRef.current?.click(),
      onOpenRecentFolder: handleOpenRecentFolder,
      onSaveWorkspaceAs: handleSaveWorkspaceAs,
      onDuplicateWorkspace: handleDuplicateWorkspace,
      onSave: saveAndRefresh,
      onSaveAs: handleSaveAs,
      onSaveAll: handleSaveAll,
      onRevertFile: reloadFocusedOrMain,
      onCloseEditor: handleCloseEditor,
      onCloseWorkspace: handleCloseWorkspace,
      onCloseWindow: closeAppWindowOrTab,
      onExit: closeAppWindowOrTab,
      onPreferencesOpen: openPreferences,
      onShareCopyLink: () => void navigator.clipboard.writeText(window.location.href),
      onRemoveWorkspaceFolder: handleRemoveWorkspaceFolder,
    }),
    [switchAllowed, recentFolders, autoSave, folders, isWsMulti, multiCellAnyDirty, effDirty, effSelectedPath, refresh, copyWorkspacePath, handleNewTextFile, handleOpenFilePrompt, handleOpenFolderPrompt, handleAddFolderPrompt, handleOpenRecentFolder, handleSaveWorkspaceAs, handleDuplicateWorkspace, saveAndRefresh, handleSaveAs, handleSaveAll, reloadFocusedOrMain, handleCloseEditor, handleCloseWorkspace, closeAppWindowOrTab, openPreferences, handleRemoveWorkspaceFolder],
  );

  const editMenu = useMemo((): EditMenuHandlers => {
    const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
    const dockForEditMenu = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;
    const activeDockTab = dockForEditMenu.tabs[dockForEditMenu.activeIndex];
    const fileTabFocusedInPane = activeDockTab?.type === "file";
    const bufferMounted = Boolean(workspaceEditorRef.current);
    const canEdit = fileReady && fileTabFocusedInPane && bufferMounted;
    return {
      canEdit,
      onUndo: () => { workspaceEditorRef.current?.undo(); bumpEditorMenu(); },
      onRedo: () => { workspaceEditorRef.current?.redo(); bumpEditorMenu(); },
      onCut: () => workspaceEditorRef.current?.cut(),
      onCopy: () => workspaceEditorRef.current?.copy(),
      onPaste: async () => { await workspaceEditorRef.current?.paste(); },
      onFind: () => workspaceEditorRef.current?.find(),
      onReplace: () => workspaceEditorRef.current?.replace(),
      onFindInFiles: () => openWorkspaceSearch(),
      onReplaceInFiles: () => openWorkspaceSearch(),
      onToggleLineComment: () => workspaceEditorRef.current?.toggleLineComment(),
      onToggleBlockComment: () => workspaceEditorRef.current?.toggleBlockComment(),
      onEmmetExpand: () => workspaceEditorRef.current?.emmetExpand(),
      canUndo: workspaceEditorRef.current?.canUndo() ?? false,
      canRedo: workspaceEditorRef.current?.canRedo() ?? false,
    };
  }, [effSelectedPath, effFileLoading, effFileError, isWsMulti, techWsSnapshot, panelDock, editorMenuTick, bumpEditorMenu, openWorkspaceSearch]);

  const selectionMenu = useMemo((): SelectionMenuHandlers => {
    const ed = workspaceEditorRef.current;
    const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
    const dockForSM = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;
    const activeDockTab = dockForSM.tabs[dockForSM.activeIndex];
    const fileTabFocusedInPane = activeDockTab?.type === "file";
    const bufferMounted = Boolean(workspaceEditorRef.current);
    const canEdit = fileReady && fileTabFocusedInPane && bufferMounted;
    return {
      canEdit,
      ctrlClickMultiCursor: ed?.getCtrlClickMultiCursor() ?? false,
      columnSelectionMode: ed?.getColumnSelectionMode() ?? false,
      onSelectAll: () => workspaceEditorRef.current?.selectAll(),
      onExpandSelection: () => workspaceEditorRef.current?.expandSelection(),
      onShrinkSelection: () => workspaceEditorRef.current?.shrinkSelection(),
      onCopyLineUp: () => workspaceEditorRef.current?.copyLineUp(),
      onCopyLineDown: () => workspaceEditorRef.current?.copyLineDown(),
      onMoveLineUp: () => workspaceEditorRef.current?.moveLineUp(),
      onMoveLineDown: () => workspaceEditorRef.current?.moveLineDown(),
      onDuplicateSelection: () => workspaceEditorRef.current?.duplicateSelection(),
      onAddNextOccurrence: () => workspaceEditorRef.current?.addNextOccurrence(),
      onAddPreviousOccurrence: () => workspaceEditorRef.current?.addPreviousOccurrence(),
      onSelectAllOccurrences: () => workspaceEditorRef.current?.selectAllOccurrences(),
      onToggleCtrlClickMultiCursor: () => { const e = workspaceEditorRef.current; if (!e) return; e.setCtrlClickMultiCursor(!e.getCtrlClickMultiCursor()); bumpSelectionPrefs(); },
      onToggleColumnSelectionMode: () => { const e = workspaceEditorRef.current; if (!e) return; e.setColumnSelectionMode(!e.getColumnSelectionMode()); bumpSelectionPrefs(); },
    };
  }, [effSelectedPath, effFileLoading, effFileError, isWsMulti, techWsSnapshot, panelDock, editorMenuTick, selectionMenuTick, bumpSelectionPrefs]);

  const focusTerminalForCommands = useCallback(() => {
    persistLeftSidebar(true);
    focusToolTab("terminal");
  }, [persistLeftSidebar, focusToolTab]);

  const openTasksJsonInEditor = useCallback(async () => {
    persistLeftSidebar(true);
    setActivity("explorer");
    try { await apiGet<{ path: string; content: string }>(`/api/file?path=${encodeURIComponent(TASKS_JSON_REL)}`); }
    catch { await apiPutJson<{ ok: boolean }>("/api/file", { path: TASKS_JSON_REL, content: TASKS_JSON_TEMPLATE }); }
    setExplorerContextDir(".vscode");
    setSelectedPath(TASKS_JSON_REL);
  }, [persistLeftSidebar]);

  const openLaunchJsonInEditor = useCallback(async () => {
    persistLeftSidebar(true);
    setActivity("explorer");
    try { await apiGet<{ path: string; content: string }>(`/api/file?path=${encodeURIComponent(LAUNCH_JSON_REL)}`); }
    catch { await apiPutJson<{ ok: boolean }>("/api/file", { path: LAUNCH_JSON_REL, content: LAUNCH_JSON_TEMPLATE }); }
    setExplorerContextDir(".vscode");
    setSelectedPath(LAUNCH_JSON_REL);
  }, [persistLeftSidebar]);

  const appendLaunchConfigurationSnippet = useCallback(async (id: LaunchSnippetId) => {
    setLaunchConfigAddOpen(false);
    persistLeftSidebar(true);
    setActivity("explorer");
    let base = '{"version":"0.2.0","configurations":[]}';
    try { const r = await apiGet<{ path: string; content: string }>(`/api/file?path=${encodeURIComponent(LAUNCH_JSON_REL)}`); base = r.content; }
    catch { /* missing file: start from empty configurations */ }
    const merged = mergeSnippetIntoLaunchJson(base, id);
    await apiPutJson<{ ok: boolean }>("/api/file", { path: LAUNCH_JSON_REL, content: merged });
    setExplorerContextDir(".vscode");
    setSelectedPath(LAUNCH_JSON_REL);
    void refresh();
  }, [persistLeftSidebar, refresh]);

  const terminalMenu = useMemo((): TerminalMenuHandlers => {
    const termOk = config?.terminalEnabled === true;
    return {
      terminalServerEnabled: termOk,
      onNewTerminal: () => { focusTerminalForCommands(); },
      onSplitTerminal: () => { persistLeftSidebar(true); onOpenToolPanel("terminal"); },
      onRunTask: () => { setCommandPaletteOpen(true); },
      onRunBuildTask: () => { focusTerminalForCommands(); if (termOk) sendTerminalInput("bun run build\r"); },
      onRunActiveFile: () => { focusTerminalForCommands(); if (!termOk || !selectedPath) return; const line = runActiveFileShellLine(selectedPath); if (line) sendTerminalInput(line); },
      onRunSelectedText: () => { focusTerminalForCommands(); if (!termOk) return; const t = workspaceEditorRef.current?.getSelectedText() ?? ""; if (!t.trim()) return; sendTerminalInput(t.endsWith("\n") ? t : `${t}\r`); },
      onConfigureTasks: () => { void openTasksJsonInEditor(); },
      onConfigureDefaultBuildTask: () => { void openTasksJsonInEditor(); },
    };
  }, [config?.terminalEnabled, focusTerminalForCommands, persistLeftSidebar, onOpenToolPanel, effSelectedPath, openTasksJsonInEditor]);

  const runWithoutDebugging = useCallback(() => {
    endDebugSession();
    focusTerminalForCommands();
    if (config?.terminalEnabled !== true || !effSelectedPath) return;
    const shellLine = runActiveFileShellLine(effSelectedPath);
    if (shellLine) sendTerminalInput(shellLine);
  }, [endDebugSession, focusTerminalForCommands, config?.terminalEnabled, effSelectedPath]);

  const startDebugging = useCallback(() => {
    focusTerminalForCommands();
    if (config?.terminalEnabled !== true || !effSelectedPath) return;
    const plan = getActiveFileDebugPlan(effSelectedPath);
    if (!plan) return;
    sendTerminalInput(plan.line);
    beginDebugSession(plan.repl);
  }, [focusTerminalForCommands, config?.terminalEnabled, effSelectedPath, beginDebugSession]);

  const stopDebugging = useCallback(() => {
    focusTerminalForCommands();
    if (config?.terminalEnabled === true) sendTerminalInput("\x03");
    endDebugSession();
  }, [focusTerminalForCommands, config?.terminalEnabled, endDebugSession]);

  const restartDebugging = useCallback(() => {
    focusTerminalForCommands();
    if (config?.terminalEnabled === true) sendTerminalInput("\x03");
    endDebugSession();
    window.setTimeout(() => {
      if (config?.terminalEnabled !== true || !effSelectedPath) return;
      const plan = getActiveFileDebugPlan(effSelectedPath);
      if (!plan) return;
      focusTerminalForCommands();
      sendTerminalInput(plan.line);
      beginDebugSession(plan.repl);
    }, 150);
  }, [focusTerminalForCommands, config?.terminalEnabled, effSelectedPath, endDebugSession, beginDebugSession]);

  const sendReplDebugCommand = useCallback((cmd: string) => {
    if (!debugReplSession || config?.terminalEnabled !== true) return;
    focusTerminalForCommands();
    sendTerminalInput(cmd.endsWith("\r") ? cmd : `${cmd}\r`);
  }, [debugReplSession, config?.terminalEnabled, focusTerminalForCommands]);

  const toggleBreakpointAtCursor = useCallback(() => {
    const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
    if (!fileReady) return;
    setBreakpointsByPath((prev: Record<string, number[]>) => {
      const path = effSelectedPath as string;
      const cur = prev[path] ? [...prev[path]] : [];
      const idx = cur.indexOf(line);
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(line);
      cur.sort((a, b) => a - b);
      if (cur.length === 0) { const { [path]: _, ...rest } = prev; return rest; }
      return { ...prev, [path]: cur };
    });
  }, [effSelectedPath, line, effFileLoading, effFileError]);

  const runMenu = useMemo((): RunMenuHandlers => {
    const termOk = config?.terminalEnabled === true;
    const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
    const canToggleBreakpoint = fileReady;
    const hasBreakpoints = Object.values(breakpointsByPath as Record<string, number[]>).some((lines) => lines.length > 0);
    const canStartDebugging = termOk && !!effSelectedPath && getActiveFileDebugPlan(effSelectedPath) != null;
    return {
      debugSessionActive, canStartDebugging, debugReplSession,
      terminalServerEnabled: termOk, canToggleBreakpoint, hasBreakpoints, allBreakpointsDisabled,
      onStartDebugging: startDebugging,
      onRunWithoutDebugging: runWithoutDebugging,
      onStopDebugging: stopDebugging,
      onRestartDebugging: restartDebugging,
      onOpenConfigurations: () => { void openLaunchJsonInEditor(); },
      onAddConfiguration: () => setLaunchConfigAddOpen(true),
      onStepOver: () => sendReplDebugCommand("n"),
      onStepInto: () => sendReplDebugCommand("s"),
      onStepOut: () => sendReplDebugCommand("return"),
      onContinue: () => sendReplDebugCommand("c"),
      onToggleBreakpoint: toggleBreakpointAtCursor,
      onNewBreakpointInline: () => setCommandPaletteOpen(true),
      onNewBreakpointConditional: () => setCommandPaletteOpen(true),
      onNewBreakpointLogpoint: () => setCommandPaletteOpen(true),
      onNewBreakpointTriggered: () => setCommandPaletteOpen(true),
      onNewBreakpointFunction: () => setCommandPaletteOpen(true),
      onEnableAllBreakpoints: () => setAllBreakpointsDisabled(false),
      onDisableAllBreakpoints: () => setAllBreakpointsDisabled(true),
      onRemoveAllBreakpoints: () => { setBreakpointsByPath({}); setAllBreakpointsDisabled(false); },
      onInstallAdditionalDebuggers: () => setInstallDebuggersModalOpen(true),
    };
  }, [config?.terminalEnabled, effSelectedPath, effFileLoading, effFileError, breakpointsByPath, allBreakpointsDisabled, debugSessionActive, debugReplSession, startDebugging, runWithoutDebugging, stopDebugging, restartDebugging, sendReplDebugCommand, toggleBreakpointAtCursor, openLaunchJsonInEditor]);

  const promptGoToLine = useCallback(() => {
    const raw = window.prompt("Go to line:column", `${line}`);
    if (raw == null) return;
    const m = raw.trim().match(/^(\d+)(?::(\d+))?/);
    if (!m) return;
    const ln = parseInt(m[1], 10);
    const c = m[2] ? parseInt(m[2], 10) : 1;
    workspaceEditorRef.current?.goToLineColumn(ln, c);
  }, [line]);

  const goMenu = useMemo((): GoMenuHandlers => {
    void navHistoryTick;
    const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
    const canEditSurface = fileReady;
    const h = navHistoryRef.current;
    return {
      canGoBack: h.idx > 0,
      canGoForward: h.idx < h.stack.length - 1,
      onBack: goHistoryBack,
      onForward: goHistoryForward,
      canLastEditLocation: false,
      onLastEditLocation: () => {},
      canSwitchEditorPrevious: false,
      canSwitchEditorNext: false,
      onSwitchEditorPrevious: () => {},
      onSwitchEditorNext: () => {},
      onGoToFile: () => openWorkspaceSearch(),
      onGoToSymbolInWorkspace: () => setCommandPaletteOpen(true),
      canGoToLine: canEditSurface,
      onGoToLineColumn: promptGoToLine,
      canGoToBracket: canEditSurface,
      onGoToBracket: () => workspaceEditorRef.current?.goToMatchingBracket(),
      canLanguageFeatures: false,
      onGoToSymbolInEditor: () => setCommandPaletteOpen(true),
      onGoToDefinition: () => {},
      onGoToDeclaration: () => {},
      onGoToTypeDefinition: () => {},
      onGoToImplementations: () => {},
      onGoToReferences: () => {},
      canAddSymbolToChat: false,
      onAddSymbolToCurrentChat: () => {},
      onAddSymbolToNewChat: () => {},
      canNavigateProblems: true,
      onNextProblem: () => { focusToolTab("problems"); },
      onPreviousProblem: () => { focusToolTab("problems"); },
      canNavigateChanges: false,
      onNextChange: () => {},
      onPreviousChange: () => {},
    };
  }, [navHistoryTick, effSelectedPath, effFileLoading, effFileError, goHistoryBack, goHistoryForward, openWorkspaceSearch, promptGoToLine, focusToolTab]);

  const helpMenu = useMemo((): HelpMenuHandlers => {
    const repo = WOP_PUBLIC_REPO_URL;
    const shell = typeof window !== "undefined" ? (window as any).wopShell : undefined;
    return {
      onShowAllCommands: () => setCommandPaletteOpen(true),
      onHowToUse: () => { setHowToUseModalOpen(true); },
      onOpenHostDoctor: openHostDoctor,
      onEditorPlayground: () => window.open(`${repo}/blob/main/docs/PLAYGROUND.md`, "_blank", "noopener,noreferrer"),
      onAccessibilityFeatures: () => window.open("https://code.visualstudio.com/docs/editor/accessibility", "_blank", "noopener,noreferrer"),
      onGiveFeedback: () => { window.open(WOP_FEEDBACK_CONTACT_URL, "_blank", "noopener,noreferrer"); },
      onSupportUs: () => { window.open(WOP_SUPPORT_HOME_URL, "_blank", "noopener,noreferrer"); },
      onViewLicense: () => setMitLicenseModalOpen(true),
      canToggleDeveloperTools: Boolean(shell?.toggleDevtools),
      onToggleDeveloperTools: () => { void shell?.toggleDevtools?.(); },
      canOpenProcessExplorer: false,
      onOpenProcessExplorer: () => {},
      canDownloadUpdate: true,
      onDownloadUpdate: () => window.open(`${repo}/releases`, "_blank", "noopener,noreferrer"),
    };
  }, [openHostDoctor]);

  const enterZen = useCallback(() => {
    setChrome((c) => {
      zenBackupRef.current = { leftSidebarVisible, agentPanelVisible: dockLayout.agentPanelVisible, chatDock: dockLayout.chatDock, chrome: { ...c } };
      return { ...c, statusBarVisible: false, menuBarVisible: false };
    });
    persistLeftSidebar(false);
    updateDockLayout({ agentPanelVisible: false });
    setZenMode(true);
  }, [dockLayout.agentPanelVisible, dockLayout.chatDock, leftSidebarVisible, persistLeftSidebar, updateDockLayout]);

  const exitZen = useCallback(() => {
    const b = zenBackupRef.current;
    if (b) {
      persistLeftSidebar(b.leftSidebarVisible);
      updateDockLayout({ agentPanelVisible: b.agentPanelVisible, chatDock: b.chatDock });
      setChrome(b.chrome);
      zenBackupRef.current = null;
    }
    setZenMode(false);
  }, [persistLeftSidebar, updateDockLayout]);

  const restoreNormalView = useCallback(() => {
    if (zenMode) exitZen();
    setChrome((c) => ({ ...c, centeredEditorLayout: false }));
    void (async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignore */ } })();
  }, [zenMode, exitZen]);

  useEffect(() => {
    if (!zenMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") exitZen(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zenMode, exitZen]);

  const applyWorkspaceGridShape = useCallback((cols: number, rows: number) => {
    setWorkspaceGrid((g) => { const next = resizeWorkspaceGrid(g, cols, rows); writeWorkspaceGridState(next); return next; });
    setWsFocusedCell((f) => Math.min(f, cols * rows - 1));
  }, []);

  const applyEditorLayoutPreset = useCallback((preset: EditorLayoutPreset) => {
    switch (preset) {
      case "single": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: false, chatDock: "right" })); applyWorkspaceGridShape(1, 1); break;
      case "two_columns": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "right" })); break;
      case "two_rows": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "bottom", chatSizePx: clampChatHeight(DEFAULT_COMPACT_BOTTOM_CHAT_HEIGHT_PX) })); break;
      case "two_rows_right": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "right" })); break;
      case "two_columns_bottom": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "bottom", chatSizePx: clampChatHeight(DEFAULT_COMPACT_BOTTOM_CHAT_HEIGHT_PX) })); break;
      case "grid_2x2": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "right" })); break;
      case "focus_terminal": persistLeftSidebar(true); updateDockLayout((d) => ({ ...d, agentPanelVisible: false })); focusToolTab("terminal"); break;
      case "workspace_grid_1x1": applyWorkspaceGridShape(1, 1); break;
      case "workspace_grid_3x1": applyWorkspaceGridShape(3, 1); break;
      case "workspace_grid_1x3": applyWorkspaceGridShape(1, 3); break;
      case "workspace_grid_2x2": applyWorkspaceGridShape(2, 2); break;
      case "workspace_grid_3x4": applyWorkspaceGridShape(3, 4); break;
    }
  }, [applyWorkspaceGridShape, focusToolTab, persistLeftSidebar, updateDockLayout]);

  const workspaceGridToolbar = useMemo((): WorkspaceGridPickerConfig | null => ({
    cols: workspaceGrid.cols, rows: workspaceGrid.rows, maxCols: WORKSPACE_GRID_MAX_COLS, maxRows: WORKSPACE_GRID_MAX_ROWS, onSelect: applyWorkspaceGridShape,
  }), [workspaceGrid.cols, workspaceGrid.rows, applyWorkspaceGridShape]);

  const agentTeamWorkspacePane = useMemo(() => ({
    agentTeams: agentsApi.data?.teams ?? {},
    agents: agentsApi.data?.agents as any[],
    agentsLoading: agentsApi.loading,
    teamSessionTranscript: session.rows,
    streaming: session.streaming,
    chatAgentName: session.chatAgentName,
    dispatchTurnAgent: session.chatAgentName,
    chatPulseMeters: session.chatPulseMeters,
    sessionTokenSummary: teamPulseSessionTokenSummary,
    onEditTeam: openAgentSetupFromMenu,
  }), [agentsApi.data?.teams, agentsApi.data?.agents, agentsApi.loading, session.rows, session.streaming, session.chatAgentName, session.chatPulseMeters, teamPulseSessionTokenSummary, openAgentSetupFromMenu]);

  const planHandoffWorkspaceKey = folders[0]?.path ?? root ?? "";
  const [teamPulseDockSignal, setTeamPulseDockSignal] = useState(0);
  const openTeamPulseInAgentDock = useCallback(() => {
    updateDockLayout({ agentPanelVisible: true });
    setTeamPulseDockSignal((n) => n + 1);
  }, [updateDockLayout]);

  const openPlanFileForReview = useCallback((workspaceRelativePath: string) => {
    const p = workspaceRelativePath.replace(/^[/\\]+/, "");
    if (!p) return;
    setExplorerContextDir(posixDirname(p));
    setSelectedPath(p);
    setPanelDock((prev) => applyAddFileTab(prev, p));
  }, []);

  const workspaceEmbeddedChat = useCallback(
    () => (
      <ChatPanel
        rows={session.rows}
        chatTabs={session.chatTabs}
        activeChatTabId={session.activeChatTabId ?? ''}
        onSelectChatTab={session.selectChatTab}
        onCloseChatTab={session.closeChatTab}
        streaming={session.streaming}
        connected={session.connected}
        error={session.error}
        onSend={(text) => void session.sendChat(session.chatAgentName ?? '', text)}
        onStop={session.stop}
        onClearError={session.clearError}
        onReopenLlmFixModal={reopenLlmFixModal}
        onNewSession={session.startNewSession}
        chatMode={session.chatMode}
        onChatModeChange={handleChatModeChange}
        agents={agentsApi.data?.agents ?? []}
        agentsLoading={agentsApi.loading}
        agentTeams={agentsApi.data?.teams ?? {}}
        onOpenAgentTeamInPane={openTeamPulseInAgentDock}
        openTeamPulseSignal={teamPulseDockSignal}
        onEditTeam={openAgentSetupFromMenu}
        chatAgentName={session.chatAgentName}
        dispatchTurnAgent={session.chatAgentName}
        onChatAgentChange={session.setChatAgent}
        chatQueuePending={Number(session.chatQueuePending)}
        chatQueueItems={session.chatQueueItems}
        editChatQueueItem={session.editChatQueueItem}
        deleteChatQueueItem={session.deleteChatQueueItem}
        forceChatQueueItem={session.forceChatQueueItem}
        chatPulseMeters={session.chatPulseMeters}
        contextTitle={session.tokenMeter.contextTitle ?? ''}
        sessionTokenSummary={teamPulseSessionTokenSummary}
        embeddedInWorkspace
        onOpenPlanFileForReview={openPlanFileForReview}
        planHandoffWorkspaceKey={planHandoffWorkspaceKey}
      />
    ),
    [session.rows, session.chatTabs, session.activeChatTabId, session.selectChatTab, session.closeChatTab, session.streaming, session.connected, session.error, session.sendChat, session.stop, session.clearError, reopenLlmFixModal, session.startNewSession, session.chatMode, handleChatModeChange, agentsApi.data?.agents, agentsApi.loading, agentsApi.data?.teams, openTeamPulseInAgentDock, teamPulseDockSignal, openAgentSetupFromMenu, session.chatAgentName, session.dispatchTurnAgent, session.setChatAgent, session.chatQueuePending, session.chatQueueItems, session.editChatQueueItem, session.deleteChatQueueItem, session.forceChatQueueItem, session.chatPulseMeters, session.tokenMeter.contextTitle, teamPulseSessionTokenSummary, openPlanFileForReview, planHandoffWorkspaceKey],
  );

  const toggleFullScreen = useCallback(async () => {
    try { if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); } else { await document.exitFullscreen(); } }
    catch { /* ignore */ }
  }, []);

  const viewTechnicalOptions: ViewMenuTechnicalOptions = useMemo(
    () => ({
      statusBarVisible: chrome.statusBarVisible,
      onToggleStatusBar: () => setChrome((c) => ({ ...c, statusBarVisible: !c.statusBarVisible })),
      menuBarVisible: chrome.menuBarVisible,
      onToggleMenuBar: () => setChrome((c) => ({ ...c, menuBarVisible: !c.menuBarVisible })),
      zenMode,
      onEnterZen: enterZen,
      onExitZen: exitZen,
      onToggleFullScreen: toggleFullScreen,
      centeredLayout: chrome.centeredEditorLayout,
      onToggleCenteredLayout: () => setChrome((c) => ({ ...c, centeredEditorLayout: !c.centeredEditorLayout })),
      onNormalView: restoreNormalView,
      wordWrap: chrome.editorWordWrap,
      onToggleWordWrap: () => setChrome((c) => ({ ...c, editorWordWrap: !c.editorWordWrap })),
      breadcrumbsVisible: chrome.breadcrumbsVisible,
      onToggleBreadcrumbs: () => setChrome((c) => ({ ...c, breadcrumbsVisible: !c.breadcrumbsVisible })),
      uiZoomPercent: chrome.uiZoomPercent,
      onZoomIn: () => setChrome((c) => ({ ...c, uiZoomPercent: Math.min(150, c.uiZoomPercent + 10) })),
      onZoomOut: () => setChrome((c) => ({ ...c, uiZoomPercent: Math.max(75, c.uiZoomPercent - 10) })),
      onZoomReset: () => setChrome((c) => ({ ...c, uiZoomPercent: 100 })),
      onFlipLayout: flipDockLayout,
      onApplyLayoutPreset: applyEditorLayoutPreset,
    }),
    [chrome.statusBarVisible, chrome.menuBarVisible, chrome.centeredEditorLayout, chrome.editorWordWrap, chrome.breadcrumbsVisible, chrome.uiZoomPercent, zenMode, enterZen, exitZen, restoreNormalView, toggleFullScreen, flipDockLayout, applyEditorLayoutPreset],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inChat = (e.target as HTMLElement | null)?.closest?.("[data-wop-chat-root]");
      const inXterm = (e.target as HTMLElement | null)?.closest?.(".xterm");
      if (!inChat && !inXterm) {
        if (e.key === "F11" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !(debugSessionActive && debugReplSession)) {
          e.preventDefault(); void toggleFullScreen(); return;
        }
        if (e.key === "F9" && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleBreakpointAtCursor(); return; }
        if (e.key === "F5") {
          if (!e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); if (debugSessionActive) { if (debugReplSession) { focusTerminalForCommands(); sendTerminalInput("c\r"); } } else { startDebugging(); } return; }
          if (e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); runWithoutDebugging(); return; }
          if (e.shiftKey && !e.ctrlKey && !e.altKey) { if (debugSessionActive) { e.preventDefault(); stopDebugging(); } return; }
          if (e.ctrlKey && e.shiftKey && !e.altKey) { if (debugSessionActive) { e.preventDefault(); restartDebugging(); } return; }
        }
        if (debugSessionActive && debugReplSession) {
          if (e.key === "F10" && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); focusTerminalForCommands(); sendTerminalInput("n\r"); return; }
          if (e.key === "F11" && !e.shiftKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); focusTerminalForCommands(); sendTerminalInput("s\r"); return; }
          if (e.key === "F11" && e.shiftKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); focusTerminalForCommands(); sendTerminalInput("return\r"); return; }
        }
        const isMinusKey = e.key === "-" || e.key === "_" || e.code === "Minus" || e.code === "NumpadSubtract";
        if ((e.metaKey || e.ctrlKey) && e.altKey && isMinusKey && !e.shiftKey) { e.preventDefault(); goHistoryBack(); return; }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && isMinusKey && !e.altKey) { e.preventDefault(); goHistoryForward(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p" && !e.shiftKey && !e.altKey) { e.preventDefault(); openWorkspaceSearch(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t" && !e.shiftKey && !e.altKey) { e.preventDefault(); setCommandPaletteOpen(true); return; }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "o" && !e.altKey) { e.preventDefault(); setCommandPaletteOpen(true); return; }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g" && !e.shiftKey && !e.altKey) { e.preventDefault(); promptGoToLine(); return; }
        if (e.key === "F8" && !e.ctrlKey && !e.altKey) { e.preventDefault(); focusToolTab("problems"); return; }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !e.shiftKey && !e.altKey) { e.preventDefault(); toggleLeftSidebar(); return; }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === "b" && !e.shiftKey) { e.preventDefault(); updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible })); return; }
      if ((e.metaKey || e.ctrlKey) && e.altKey && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); if (zenMode) exitZen(); else enterZen(); return; }
      if ((e.metaKey || e.ctrlKey) && e.altKey && !e.shiftKey && e.key.toLowerCase() === "c") { e.preventDefault(); setChrome((c) => ({ ...c, centeredEditorLayout: !c.centeredEditorLayout })); return; }
      if ((e.metaKey || e.ctrlKey) && e.altKey && !e.shiftKey && e.key.toLowerCase() === "n") { e.preventDefault(); restoreNormalView(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j" && !e.shiftKey && !e.altKey) { e.preventDefault(); focusToolTab("terminal"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") { e.preventDefault(); focusToolTab("problems"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setCommandPaletteOpen(true); return; }
      if (!inXterm && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b" && !e.altKey) { e.preventDefault(); focusToolTab("terminal"); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && !e.shiftKey && !e.altKey && !e.metaKey) { e.preventDefault(); void saveAndRefresh(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s" && !e.altKey) { e.preventDefault(); void handleSaveAs(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w" && !e.shiftKey && !e.altKey) { e.preventDefault(); handleCloseEditor(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n" && !e.shiftKey && !e.altKey && !e.altKey) { e.preventDefault(); handleNewTextFile(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n" && !e.altKey) { e.preventDefault(); handleNewFolder(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "`" && !e.shiftKey && !e.altKey) { e.preventDefault(); if (config?.terminalEnabled === true) { focusToolTab("terminal"); } return; }
      if (!inXterm && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e" && !e.shiftKey && !e.altKey) { e.preventDefault(); toggleLeftSidebar(); setActivity("explorer"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e" && !e.altKey) { e.preventDefault(); persistLeftSidebar(true); setActivity("explorer"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f" && !e.altKey) { e.preventDefault(); openWorkspaceSearch(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "g" && !e.altKey) { e.preventDefault(); persistLeftSidebar(true); setActivity("scm"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "x" && !e.altKey) { e.preventDefault(); persistLeftSidebar(true); setActivity("extensions"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d" && !e.altKey) { e.preventDefault(); updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible })); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debugSessionActive, debugReplSession, sendTerminalInput, focusTerminalForCommands, startDebugging, runWithoutDebugging, stopDebugging, restartDebugging, toggleBreakpointAtCursor, goHistoryBack, goHistoryForward, openWorkspaceSearch, promptGoToLine, toggleFullScreen, toggleLeftSidebar, enterZen, exitZen, restoreNormalView, zenMode, setChrome, saveAndRefresh, handleSaveAs, handleCloseEditor, handleNewTextFile, handleNewFolder, focusToolTab, config?.terminalEnabled, persistLeftSidebar, setActivity, updateDockLayout]);

  const workspaceDockActionsMain = useMemo(
    () => ({
      onOpenFile: handleOpenFilePrompt,
      onShowAgentChat: (cellIndex: number) => {
        if (isWsMulti) { setWsFocusedCell(cellIndex); patchWorkspaceCellDock(cellIndex, (prev) => applyShowToolTab(prev, "agent_chat")); }
        else { setPanelDock((prev) => applyShowToolTab(prev, "agent_chat")); }
      },
    }),
    [handleOpenFilePrompt, isWsMulti, patchWorkspaceCellDock],
  );

  const setWorkspaceActiveIndex = useCallback((index: number) => {
    setPanelDock((prev) => ({ ...prev, activeIndex: index }));
  }, []);

  const onDockEntryMove = useCallback((moving: PanelTab, before: PanelTab | null) => {
    setPanelDock((prev) => applyPanelTabMove(prev, moving, before));
  }, []);

  const onDockEntryClose = useCallback((entry: PanelTab) => {
    setPanelDock((prev) => entry.type === "tool" ? applyCloseToolTab(prev, entry.id) : applyRemoveFileTab(prev, entry.path));
  }, []);

  const onSelectFileFromWorkspaceTab = useCallback((path: string) => {
    setSelectedPath(path);
    setExplorerContextDir(posixDirname(path));
  }, []);

  const gitReviewHasAnyMarked = useMemo(() => gitMarkedFilePathsSorted(nodes).length > 0, [nodes]);
  const gitReviewCanAdvanceNext = useMemo(() => nextGitReviewFilePath(selectedPath, nodes) != null, [selectedPath, nodes]);

  const workspaceGitFileReviewActions = useMemo(() => {
    if (isWsMulti) return null;
    return {
      onSaveAndStage: async () => {
        if (!selectedPath) return;
        if (dirty) { const ok = await save(); if (!ok) return; }
        const r = await apiPostJson<{ ok?: boolean; error?: string }>("/api/git/stage", { path: selectedPath });
        if (!r.ok) return;
        await refreshQuiet();
      },
      onOpenNextGitReviewPath: async () => {
        if (!selectedPath) return;
        if (dirty) { const ok = await save(); if (!ok) return; }
        await refreshQuiet();
        const next = nextGitReviewFilePath(selectedPath, nodes);
        if (next) onSelectFileFromWorkspaceTab(next);
      },
    };
  }, [isWsMulti, selectedPath, dirty, save, refreshQuiet, onSelectFileFromWorkspaceTab, nodes]);

  const onExplorerSelectFile = useCallback((p: string, _ev?: MouseEvent) => {
    setExplorerContextDir(posixDirname(p));
    if (isWsMulti) { setWorkspaceOpenSignal((s) => ({ path: p, rev: (s?.rev ?? 0) + 1 })); }
    else { setSelectedPath(p); setPanelDock((prev) => applyAddFileTab(prev, p)); }
  }, [isWsMulti]);

  useEffect(() => {
    if (isWsMulti) return;
    if (!selectedPath) return;
    setPanelDock((prev) => { const next = applyEnsureFileTab(prev, selectedPath); return next === prev ? prev : next; });
  }, [selectedPath, isWsMulti]);

  useEffect(() => {
    if (isWsMulti) return;
    const a = panelDock.tabs[panelDock.activeIndex];
    if (a?.type !== "file") return;
    setSelectedPath((p) => (p === a.path ? p : a.path));
    setExplorerContextDir(posixDirname(a.path));
  }, [panelDock.activeIndex, panelDock.tabs, isWsMulti]);

  useEffect(() => {
    if (isWsMulti) return;
    const hasFile = panelDock.tabs.some((t) => t.type === "file");
    if (!hasFile) setSelectedPath(null);
  }, [panelDock.tabs, isWsMulti]);

  const dockForZedStrip = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;

  const technicalZedStrip = useMemo(
    () => ({
      onToggleLeftSidebar: toggleLeftSidebar,
      leftSidebarVisible,
      onFocusTerminal: () => focusToolTab("terminal"),
      terminalDockedVisible: toolTabVisible(dockForZedStrip, "terminal"),
      onFocusPlanning: () => { persistLeftSidebar(true); setActivity("planning"); },
      planningActive: activity === "planning",
      onToggleAgent: () => updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible })),
      agentVisible: dockLayout.agentPanelVisible,
      onFocusSearch: () => { persistLeftSidebar(true); setActivity("search"); },
      searchActive: activity === "search",
      onFocusScm: () => { persistLeftSidebar(true); setActivity("scm"); },
      scmActive: activity === "scm",
      onFocusDiagnostics: () => focusToolTab("problems"),
      problemsVisible: toolTabVisible(dockForZedStrip, "problems"),
      onOpenSettings: openPreferences,
      diagnosticsCount: workspaceStaticAnalysis.totalCount,
    }),
    [toggleLeftSidebar, leftSidebarVisible, focusToolTab, dockForZedStrip, persistLeftSidebar, activity, updateDockLayout, dockLayout.agentPanelVisible, openPreferences, workspaceStaticAnalysis.totalCount],
  );

  const commandItems: CommandItem[] = useMemo(() => {
    const setAct = (a: TechnicalActivity) => () => { persistLeftSidebar(true); setActivity(a); };
    return [
      { id: "palette", label: "Command palette", keywords: ["commands"], run: () => setCommandPaletteOpen(true) },
      { id: "host-doctor", label: "Help: Host doctor", detail: "Workspace, env, Ollama/OpenRouter, Pi CLI, terminal", keywords: ["doctor", "diagnostics", "health", "wop", "env", "ollama"], run: openHostDoctor },
      { id: "how-to-use", label: "Help: How to use Way of Pi", detail: "Getting started modal + doc links", keywords: ["help", "start", "guide", "tutorial", "onboarding"], run: () => setHowToUseModalOpen(true) },
      { id: "leftsidebar", label: leftSidebarVisible ? "View: Hide primary sidebar" : "View: Show primary sidebar", detail: "Ctrl+B", keywords: ["activity", "explorer", "dock", "zed"], run: toggleLeftSidebar },
      { id: "explorer", label: "View: Explorer", keywords: ["files", "tree"], run: setAct("explorer") },
      { id: "search", label: "View: Search", keywords: ["find", "file"], run: setAct("search") },
      { id: "scm", label: "View: Source control", keywords: ["git"], run: setAct("scm") },
      { id: "ext", label: "View: Run / Extensions", run: setAct("extensions") },
      { id: "planning", label: "View: Plan / Build", keywords: ["cursor", "planner", "agent", "mode"], run: setAct("planning") },
      { id: "chat-mode-plan", label: "Agent: Plan mode", keywords: ["cursor", "planning"], run: () => handleChatModeChange("plan") },
      { id: "chat-mode-build", label: "Agent: Build mode", keywords: ["cursor", "coding"], run: () => handleChatModeChange("build") },
      { id: "chat-agent-default", label: "Chat: Orchestrator (no .md agent)", keywords: ["persona", "pi"], run: () => session.setChatAgent(null) },
      ...((agentsApi.data?.agents ?? []).slice(0, 48).map((a) => ({
        id: `chat-agent-${a.name}`,
        label: `Chat: Agent ${workspaceAgentDisplayName(a.name)}`,
        keywords: [a.name, workspaceAgentDisplayName(a.name), a.description ?? '', "pi", "persona"],
        run: () => session.setChatAgent(a.name),
      }))),
      { id: "settings", label: "View: Settings", run: setAct("settings") },
      { id: "save", label: "File: Save", detail: "Ctrl+S", keywords: ["write", "disk"], run: () => void saveAndRefresh() },
      { id: "revert", label: "File: Revert from disk", run: () => void reloadFocusedOrMain() },
      { id: "refresh", label: "Workspace: Refresh tree", run: () => void refresh() },
      { id: "copypath", label: "Workspace: Copy path", run: copyWorkspacePath },
      { id: "new-plan-file", label: "File: New plan markdown (plans/PLAN-…)", keywords: ["plan", "planner", "markdown", "spec"], run: () => void handleNewPlanFile() },
      {
        id: "chat-build-from-plan-compose", label: "Chat: Insert Build handoff from latest plan", keywords: ["plan", "implement", "build", "composer"],
        run: () => { void apiGet<{ latest: { path: string } | null }>("/api/plans").then((d) => { const p = d.latest?.path; if (!p) { injectIntoChatComposer("No `plans/PLAN-*.md` file found yet — use File: New plan markdown."); return; } injectIntoChatComposer(buildImplementPlanPrompt(p)); }).catch(() => injectIntoChatComposer("Could not load /api/plans")); },
      },
      {
        id: "chat-review-plan-compose", label: "Chat: Insert review prompt for latest plan", keywords: ["plan", "review", "critique"],
        run: () => { void apiGet<{ latest: { path: string } | null }>("/api/plans").then((d) => { const p = d.latest?.path; if (!p) { injectIntoChatComposer("No `plans/PLAN-*.md` file found yet."); return; } openPlanFileForReview(p); injectIntoChatComposer(buildReviewPlanPrompt(p)); }).catch(() => injectIntoChatComposer("Could not load /api/plans.")); },
      },
      {
        id: "chat-plan-reviewer-latest", label: "Chat: Set plan-reviewer + review latest plan", keywords: ["plan-reviewer", "plan", "review"],
        run: () => { const roster = agentsApi.data?.agents ?? []; if (roster.some((a) => a.name === "plan-reviewer")) session.setChatAgent("plan-reviewer"); void apiGet<{ latest: { path: string } | null }>("/api/plans").then((d) => { const p = d.latest?.path; if (!p) { injectIntoChatComposer("No `plans/PLAN-*.md` file found yet."); return; } openPlanFileForReview(p); injectIntoChatComposer(buildReviewPlanPrompt(p)); }).catch(() => injectIntoChatComposer("Could not load /api/plans.")); },
      },
      { id: "agent-dock-right", label: "View: Dock agent panel to the right", keywords: ["chat", "session", "sidebar"], run: () => updateDockLayout((d) => ({ ...d, chatDock: "right", agentPanelVisible: true, chatSizePx: chatSizePxWhenSwitchingDock(d.chatDock, "right", d.chatSizePx) })) },
      { id: "agent-dock-bottom", label: "View: Dock agent panel to the bottom", keywords: ["chat", "session", "terminal"], run: () => updateDockLayout((d) => ({ ...d, chatDock: "bottom", agentPanelVisible: true, chatSizePx: chatSizePxWhenSwitchingDock(d.chatDock, "bottom", d.chatSizePx) })) },
      { id: "agent-toggle", label: dockLayout.agentPanelVisible ? "View: Hide agent panel" : "View: Show agent panel", detail: "Ctrl+Alt+B", keywords: ["chat", "session"], run: () => updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible })) },
      { id: "toollog", label: "Panel: Tool log", run: () => focusToolTab("tool_log") },
      { id: "terminal", label: "Panel: Terminal", keywords: ["shell"], run: () => focusToolTab("terminal") },
      { id: "problems", label: "Panel: Problems", run: () => focusToolTab("problems") },
      { id: "agent_chat", label: "Panel: Agent chat", run: () => setPanelDock((prev) => applyShowToolTab(prev, "agent_chat")) },
      { id: "output", label: "Panel: Output", run: () => focusToolTab("output") },
      { id: "debug_console", label: "Panel: Debug console", run: () => focusToolTab("debug_console") },
    ];
  }, [leftSidebarVisible, toggleLeftSidebar, persistLeftSidebar, focusToolTab, openHostDoctor, handleChatModeChange, agentsApi.data?.agents, session.setChatAgent, saveAndRefresh, reloadFocusedOrMain, refresh, copyWorkspacePath, handleNewPlanFile, apiGet, injectIntoChatComposer, buildImplementPlanPrompt, buildReviewPlanPrompt, openPlanFileForReview, updateDockLayout, dockLayout.agentPanelVisible, setPanelDock]);

