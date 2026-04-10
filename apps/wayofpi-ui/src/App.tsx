import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { MessageSquare } from "lucide-react";
import { apiGet, apiPostJson, apiPutJson } from "./api/client";
import { requestNativePick } from "./api/nativeDialog";
import { postWorkspaceOp } from "./api/workspace";
import { ActivityBar } from "./components/ActivityBar";
import { AgentSessionComposerBar } from "./components/AgentSessionComposerBar";
import { ChatPanel } from "./components/ChatPanel";
import { CommandPalette, type CommandItem } from "./components/CommandPalette";
import { TechnicalPrimarySidebar } from "./components/TechnicalPrimarySidebar";
import { DockSplitHandle } from "./components/DockSplitHandle";
import { EditorPanel } from "./components/EditorPanel";
import { ExplorerSidebar } from "./components/ExplorerSidebar";
import { MenuBar } from "./components/MenuBar";
import { SimpleApp } from "./components/simple/SimpleApp";
import type { SimpleTabId } from "./components/simple/SimpleNavRail";
import { StatusBar } from "./components/StatusBar";
import { UnifiedHorizontalDock } from "./components/UnifiedHorizontalDock";
import {
	ExtensionsSidePanel,
	PlanningSidePanel,
	ScmSidePanel,
	SearchSidePanel,
	SettingsSidePanel,
} from "./components/TechnicalSidePanels";
import { useAgents } from "./hooks/useAgents";
import { useFileEditor } from "./hooks/useFileEditor";
import { useServerConfig } from "./hooks/useServerConfig";
import { useUiMode } from "./hooks/useUiMode";
import { useUiViewsCatalog } from "./hooks/useUiViewsCatalog";
import { useRunMenuDebugState } from "./hooks/useRunMenuDebugState";
import {
	readSimpleChatStreamUiEnabled,
	writeSimpleChatStreamUiEnabled,
} from "./hooks/useSimplePreferences";
import { useWayOfPiSession } from "./hooks/useWayOfPiSession";
import { useWorkspaceTree } from "./hooks/useWorkspaceTree";
import type { PiModelConfigPath } from "./constants/piModelConfigPaths";
import { PI_MODEL_CONFIG_ENTRIES } from "./constants/piModelConfigPaths";
import type { FileMenuProps } from "./types/fileMenu";
import type {
	EditMenuHandlers,
	GoMenuHandlers,
	HelpMenuHandlers,
	RunMenuHandlers,
	SelectionMenuHandlers,
	TerminalMenuHandlers,
	WorkspaceEditorRef,
} from "./types/workspaceEditor";
import type {
	BottomPanelTab,
	EditorLayoutPreset,
	TechnicalActivity,
	ViewMenuSimpleOptions,
	ViewMenuTechnicalOptions,
} from "./types/technicalShell";
import type { UiViewCatalogEntry } from "./types/uiViewsCatalog";
import { flattenTreeFiles } from "./utils/flattenTree";
import { ancestorDirPaths, posixDirname } from "./utils/posixPath";
import { readAutoSaveInitial, writeAutoSave } from "./utils/editorPreferences";
import { pushRecentWorkspaceFolder, readRecentWorkspaceFolders } from "./utils/workspaceRecent";
import {
	applyActivateToolTab,
	applyAddFileToStrip,
	applyDockStripMoveEntry,
	applyRemoveFileFromStrips,
	applyToolPanelClose,
	applyToolPanelShow,
	clampBottomPanelHeight,
	clampChatHeight,
	clampChatWidth,
	clampLeftSidebarWidth,
	clampTopPanelHeight,
	DOCK_DEFAULTS,
	HORIZONTAL_TOOL_DOCK_UI,
	readDockLayout,
	readLeftSidebarVisibleInitial,
	readToolDockLayout,
	writeDockLayout,
	writeLeftSidebarVisible,
	writeToolDockLayout,
	type ChatDockRegion,
	type DockStripEntry,
	type HorizontalToolDockSlot,
	type TechnicalDockLayout,
	type ToolDockLayout,
	type ToolPanelZone,
} from "./utils/technicalLayoutStorage";
import {
	readChromePreferences,
	writeChromePreferences,
	type ChromePreferences,
} from "./utils/chromePreferences";
import { sendTerminalInput } from "./utils/terminalInputBridge";
import { runActiveFileShellLine } from "./utils/terminalRunCommands";

const TASKS_JSON_REL = ".vscode/tasks.json";
const TASKS_JSON_TEMPLATE = `{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "bun run build",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
`;

const LAUNCH_JSON_REL = ".vscode/launch.json";
const LAUNCH_JSON_TEMPLATE = `{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "\${workspaceFolder}/index.ts"
    }
  ]
}
`;

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

export default function App() {
	const { mode: uiMode, setMode: setUiMode } = useUiMode();
	const { root, nodes, folders, switchAllowed, error: treeError, loading: treeLoading, refresh } =
		useWorkspaceTree();
	const { config } = useServerConfig();
	const [simpleChatStreamUiEnabled, setSimpleChatStreamUiEnabled] = useState(readSimpleChatStreamUiEnabled);
	const bufferAssistantDeltasRef = useRef(false);
	bufferAssistantDeltasRef.current = uiMode === "simple" && !simpleChatStreamUiEnabled;
	const onSimpleChatStreamUiEnabledChange = useCallback((on: boolean) => {
		setSimpleChatStreamUiEnabled(on);
		writeSimpleChatStreamUiEnabled(on);
	}, []);
	const session = useWayOfPiSession(refresh, bufferAssistantDeltasRef);
	const agentsApi = useAgents();
	const uiViewsCatalog = useUiViewsCatalog();
	const modelLabel = useMemo(() => {
		if (!config) return "…";
		const p = (config.provider || "ollama").toLowerCase();
		const id =
			session.effectiveModel ?? (p === "openrouter" ? config.openrouterModel : config.ollamaModel);
		return p === "openrouter" ? `openrouter/${id}` : `ollama/${id}`;
	}, [config, session.effectiveModel]);
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [explorerContextDir, setExplorerContextDir] = useState("");
	const [treeExpand, setTreeExpand] = useState<{ rev: number; paths: string[] }>({ rev: 0, paths: [] });
	const [autoSave, setAutoSave] = useState(readAutoSaveInitial);
	const [recentTick, setRecentTick] = useState(0);
	const workspaceFileInputRef = useRef<HTMLInputElement>(null);
	const recentFolders = useMemo(() => readRecentWorkspaceFolders(), [recentTick]);
	const {
		content,
		setContent,
		lastPersistedContent,
		filePreview,
		loading: fileLoading,
		error: fileError,
		dirty,
		save,
		reload,
	} = useFileEditor(selectedPath, { autoSave });
	const [line, setLine] = useState(1);
	const [col, setCol] = useState(1);
	const {
		breakpointsByPath,
		setBreakpointsByPath,
		allBreakpointsDisabled,
		setAllBreakpointsDisabled,
		debugSessionActive,
	} = useRunMenuDebugState();
	const workspaceEditorRef = useRef<WorkspaceEditorRef | null>(null);
	const [editorMenuTick, setEditorMenuTick] = useState(0);
	const bumpEditorMenu = useCallback(() => setEditorMenuTick((t) => t + 1), []);
	const [selectionMenuTick, setSelectionMenuTick] = useState(0);
	const bumpSelectionPrefs = useCallback(() => setSelectionMenuTick((t) => t + 1), []);

	const [activity, setActivity] = useState<TechnicalActivity>("explorer");
	const primarySidebarDockDetail = useMemo(() => {
		const m: Record<TechnicalActivity, string> = {
			explorer: "Explorer",
			search: "Search",
			scm: "Source control",
			extensions: "Run / Extensions",
			planning: "Plan / Build",
			settings: "Settings",
		};
		return m[activity];
	}, [activity]);
	const [simpleTab, setSimpleTab] = useState<SimpleTabId>("chat");
	const [simpleProviderPath, setSimpleProviderPath] = useState<PiModelConfigPath | null>(null);
	const [simpleProviderNonce, setSimpleProviderNonce] = useState(0);
	const [chrome, setChrome] = useState(() => readChromePreferences());
	const [zenMode, setZenMode] = useState(false);
	const zenBackupRef = useRef<{
		leftSidebarVisible: boolean;
		horizontalToolDockVisible: Record<HorizontalToolDockSlot, boolean>;
		agentPanelVisible: boolean;
		chatDock: ChatDockRegion;
		chrome: ChromePreferences;
	} | null>(null);
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const [horizontalToolDockVisible, setHorizontalToolDockVisible] = useState<
		Record<HorizontalToolDockSlot, boolean>
	>({ top: false, bottom: true });
	const [toolDock, setToolDock] = useState<ToolDockLayout>(readToolDockLayout);
	const [leftSidebarVisible, setLeftSidebarVisible] = useState(readLeftSidebarVisibleInitial);
	const [dockLayout, setDockLayoutState] = useState<TechnicalDockLayout>(readDockLayout);

	const updateDockLayout = useCallback((patch: Partial<TechnicalDockLayout> | ((d: TechnicalDockLayout) => TechnicalDockLayout)) => {
		setDockLayoutState((prev) => {
			const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
			const chatSizePx =
				next.chatDock === "right" ? clampChatWidth(next.chatSizePx) : clampChatHeight(next.chatSizePx);
			const prevH = prev.horizontalToolDockHeightsPx;
			const nextH = next.horizontalToolDockHeightsPx ?? prevH;
			const fixed: TechnicalDockLayout = {
				...next,
				chatSizePx,
				leftSidebarWidthPx: clampLeftSidebarWidth(
					next.leftSidebarWidthPx ?? DOCK_DEFAULTS.leftSidebarWidthPx,
				),
				horizontalToolDockHeightsPx: {
					top: clampTopPanelHeight(
						nextH.top ?? prevH.top ?? DOCK_DEFAULTS.horizontalToolDockHeightsPx.top,
					),
					bottom: clampBottomPanelHeight(
						nextH.bottom ?? prevH.bottom ?? DOCK_DEFAULTS.horizontalToolDockHeightsPx.bottom,
					),
				},
			};
			writeDockLayout(fixed);
			return fixed;
		});
	}, []);

	const flipDockLayout = useCallback(() => {
		updateDockLayout((d) => ({
			...d,
			chatDock: d.chatDock === "right" ? "bottom" : "right",
		}));
	}, [updateDockLayout]);

	const focusToolTab = useCallback((t: BottomPanelTab) => {
		setToolDock((prev) => {
			const next = !prev.panels[t].visible ? applyToolPanelShow(prev, t) : applyActivateToolTab(prev, t);
			writeToolDockLayout(next);
			const z = next.panels[t].zone;
			setHorizontalToolDockVisible((v) => ({ ...v, [z]: true }));
			return next;
		});
	}, []);

	const onOpenToolPanel = useCallback((tab: BottomPanelTab, zone: ToolPanelZone) => {
		setHorizontalToolDockVisible((v) => ({ ...v, [zone]: true }));
		setToolDock((prev) => {
			const next = applyToolPanelShow(prev, tab, zone);
			writeToolDockLayout(next);
			return next;
		});
	}, []);

	useEffect(() => {
		writeChromePreferences(chrome);
	}, [chrome]);

	const persistLeftSidebar = useCallback((visible: boolean) => {
		setLeftSidebarVisible(visible);
		writeLeftSidebarVisible(visible);
	}, []);

	const hidePrimarySidebar = useCallback(() => {
		persistLeftSidebar(false);
	}, [persistLeftSidebar]);

	const toggleLeftSidebar = useCallback(() => {
		setLeftSidebarVisible((v) => {
			const next = !v;
			writeLeftSidebarVisible(next);
			return next;
		});
	}, []);

	const selectActivityWithSidebar = useCallback(
		(a: TechnicalActivity) => {
			persistLeftSidebar(true);
			setActivity(a);
		},
		[persistLeftSidebar],
	);

	const openPiModelConfigInEditor = useCallback(
		(path: PiModelConfigPath) => {
			setSelectedPath(path);
			setExplorerContextDir(posixDirname(path));
			setActivity("explorer");
			persistLeftSidebar(true);
		},
		[persistLeftSidebar],
	);

	const openPiModelConfigInSimpleBrains = useCallback((path: PiModelConfigPath) => {
		setSimpleTab("models");
		setSimpleProviderPath(path);
		setSimpleProviderNonce((n) => n + 1);
	}, []);

	const consumeSimpleProviderFocus = useCallback(() => {
		setSimpleProviderPath(null);
	}, []);

	const onCursor = useCallback((l: number, c: number) => {
		setLine(l);
		setCol(c);
	}, []);

	const rootLabel = useMemo(() => {
		if (folders.length > 1) return `Multi-root (${folders.length})`;
		const p = folders[0]?.path ?? root;
		if (!p) return "";
		const parts = p.split(/[/\\]/);
		return parts[parts.length - 1] || p;
	}, [folders, root]);

	const bumpRecent = useCallback(() => setRecentTick((t) => t + 1), []);

	useEffect(() => {
		if (selectedPath) setExplorerContextDir(posixDirname(selectedPath));
	}, [selectedPath]);

	function sanitizeNewEntryName(raw: string): string | null {
		const t = raw.trim().replace(/\\/g, "/").replace(/^\/+/, "");
		if (!t || t === "." || t.includes("..")) return null;
		return t;
	}

	const handleNewFile = useCallback(async () => {
		const name = window.prompt("New file name (under the selected folder)", "untitled.txt");
		if (name == null) return;
		const safe = sanitizeNewEntryName(name);
		if (!safe) {
			window.alert("Invalid name: no .. or empty segments; avoid leading slashes.");
			return;
		}
		const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
		try {
			await apiPostJson<{ ok: boolean }>("/api/fs/entry", { path: rel, kind: "file" });
			setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) });
			await refresh();
			setSelectedPath(rel);
		} catch (e) {
			window.alert(e instanceof Error ? e.message : String(e));
		}
	}, [explorerContextDir, refresh]);

	const handleNewFolder = useCallback(async () => {
		const name = window.prompt("New folder name (under the selected folder)", "new-folder");
		if (name == null) return;
		const safe = sanitizeNewEntryName(name);
		if (!safe) {
			window.alert("Invalid name: no .. or empty segments; avoid leading slashes.");
			return;
		}
		const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
		try {
			await apiPostJson<{ ok: boolean }>("/api/fs/entry", { path: rel, kind: "dir" });
			setTreeExpand({ rev: Date.now(), paths: [...ancestorDirPaths(rel), rel] });
			await refresh();
		} catch (e) {
			window.alert(e instanceof Error ? e.message : String(e));
		}
	}, [explorerContextDir, refresh]);

	const technical = uiMode === "technical";

	const openWorkspaceSearch = useCallback(() => {
		setUiMode("technical");
		persistLeftSidebar(true);
		setActivity("search");
	}, [persistLeftSidebar]);

	const navHistoryRef = useRef<{ stack: string[]; idx: number }>({ stack: [], idx: -1 });
	const skipHistoryPushRef = useRef(false);
	const [navHistoryTick, setNavHistoryTick] = useState(0);

	useEffect(() => {
		if (skipHistoryPushRef.current) {
			skipHistoryPushRef.current = false;
			setNavHistoryTick((t) => t + 1);
			return;
		}
		if (!selectedPath) {
			setNavHistoryTick((t) => t + 1);
			return;
		}
		const h = navHistoryRef.current;
		const cur = h.stack[h.idx];
		if (cur === selectedPath) {
			setNavHistoryTick((t) => t + 1);
			return;
		}
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

	useLayoutEffect(() => {
		bumpEditorMenu();
	}, [selectedPath, fileLoading, fileError, uiMode, simpleTab, bumpEditorMenu]);

	const editMenu = useMemo((): EditMenuHandlers => {
		const fileReady = !!selectedPath && !fileLoading && !fileError;
		const canEdit = fileReady && (technical || simpleTab === "chat");
		return {
			canEdit,
			onUndo: () => {
				workspaceEditorRef.current?.undo();
				bumpEditorMenu();
			},
			onRedo: () => {
				workspaceEditorRef.current?.redo();
				bumpEditorMenu();
			},
			onCut: () => workspaceEditorRef.current?.cut(),
			onCopy: () => workspaceEditorRef.current?.copy(),
			onPaste: async () => {
				await workspaceEditorRef.current?.paste();
			},
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
	}, [
		selectedPath,
		fileLoading,
		fileError,
		technical,
		simpleTab,
		editorMenuTick,
		bumpEditorMenu,
		openWorkspaceSearch,
	]);

	const selectionMenu = useMemo((): SelectionMenuHandlers => {
		const ed = workspaceEditorRef.current;
		const fileReady = !!selectedPath && !fileLoading && !fileError;
		const canEdit = fileReady && (technical || simpleTab === "chat");
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
			onToggleCtrlClickMultiCursor: () => {
				const ed = workspaceEditorRef.current;
				if (!ed) return;
				ed.setCtrlClickMultiCursor(!ed.getCtrlClickMultiCursor());
				bumpSelectionPrefs();
			},
			onToggleColumnSelectionMode: () => {
				const ed = workspaceEditorRef.current;
				if (!ed) return;
				ed.setColumnSelectionMode(!ed.getColumnSelectionMode());
				bumpSelectionPrefs();
			},
		};
	}, [
		selectedPath,
		fileLoading,
		fileError,
		technical,
		simpleTab,
		editorMenuTick,
		selectionMenuTick,
		bumpSelectionPrefs,
	]);

	const focusTerminalForCommands = useCallback(() => {
		setUiMode("technical");
		persistLeftSidebar(true);
		focusToolTab("terminal");
	}, [persistLeftSidebar, focusToolTab]);

	const openTasksJsonInEditor = useCallback(async () => {
		setUiMode("technical");
		persistLeftSidebar(true);
		setActivity("explorer");
		try {
			await apiGet<{ path: string; content: string }>(
				`/api/file?path=${encodeURIComponent(TASKS_JSON_REL)}`,
			);
		} catch {
			await apiPutJson<{ ok: boolean }>("/api/file", {
				path: TASKS_JSON_REL,
				content: TASKS_JSON_TEMPLATE,
			});
		}
		setExplorerContextDir(".vscode");
		setSelectedPath(TASKS_JSON_REL);
	}, [persistLeftSidebar]);

	const openLaunchJsonInEditor = useCallback(async () => {
		setUiMode("technical");
		persistLeftSidebar(true);
		setActivity("explorer");
		try {
			await apiGet<{ path: string; content: string }>(
				`/api/file?path=${encodeURIComponent(LAUNCH_JSON_REL)}`,
			);
		} catch {
			await apiPutJson<{ ok: boolean }>("/api/file", {
				path: LAUNCH_JSON_REL,
				content: LAUNCH_JSON_TEMPLATE,
			});
		}
		setExplorerContextDir(".vscode");
		setSelectedPath(LAUNCH_JSON_REL);
	}, [persistLeftSidebar]);

	const terminalMenu = useMemo((): TerminalMenuHandlers => {
		const termOk = config?.terminalEnabled === true;
		return {
			terminalServerEnabled: termOk,
			onNewTerminal: () => {
				focusTerminalForCommands();
			},
			onSplitTerminal: () => {
				setUiMode("technical");
				persistLeftSidebar(true);
				onOpenToolPanel("terminal", "bottom");
			},
			onRunTask: () => {
				setCommandPaletteOpen(true);
			},
			onRunBuildTask: () => {
				focusTerminalForCommands();
				if (termOk) sendTerminalInput("bun run build\r");
			},
			onRunActiveFile: () => {
				focusTerminalForCommands();
				if (!termOk || !selectedPath) return;
				const line = runActiveFileShellLine(selectedPath);
				if (line) sendTerminalInput(line);
			},
			onRunSelectedText: () => {
				focusTerminalForCommands();
				if (!termOk) return;
				const t = workspaceEditorRef.current?.getSelectedText() ?? "";
				if (!t.trim()) return;
				sendTerminalInput(t.endsWith("\n") ? t : `${t}\r`);
			},
			onConfigureTasks: () => {
				void openTasksJsonInEditor();
			},
			onConfigureDefaultBuildTask: () => {
				void openTasksJsonInEditor();
			},
		};
	}, [
		config?.terminalEnabled,
		focusTerminalForCommands,
		persistLeftSidebar,
		onOpenToolPanel,
		selectedPath,
		openTasksJsonInEditor,
	]);

	const runStartDebugging = useCallback(() => {
		focusTerminalForCommands();
		if (config?.terminalEnabled !== true || !selectedPath) return;
		const shellLine = runActiveFileShellLine(selectedPath);
		if (shellLine) sendTerminalInput(shellLine);
	}, [focusTerminalForCommands, config?.terminalEnabled, selectedPath]);

	const toggleBreakpointAtCursor = useCallback(() => {
		const fileReady = !!selectedPath && !fileLoading && !fileError;
		if (!fileReady || !(technical || simpleTab === "chat")) return;
		setBreakpointsByPath((prev: Record<string, number[]>) => {
			const path = selectedPath as string;
			const cur = prev[path] ? [...prev[path]] : [];
			const idx = cur.indexOf(line);
			if (idx >= 0) cur.splice(idx, 1);
			else cur.push(line);
			cur.sort((a, b) => a - b);
			if (cur.length === 0) {
				const { [path]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [path]: cur };
		});
	}, [selectedPath, line, fileLoading, fileError, technical, simpleTab]);

	const runMenu = useMemo((): RunMenuHandlers => {
		const termOk = config?.terminalEnabled === true;
		const fileReady = !!selectedPath && !fileLoading && !fileError;
		const canToggleBreakpoint = fileReady && (technical || simpleTab === "chat");
		const hasBreakpoints = Object.values(breakpointsByPath as Record<string, number[]>).some(
			(lines) => lines.length > 0,
		);
		return {
			debugSessionActive,
			terminalServerEnabled: termOk,
			canToggleBreakpoint,
			hasBreakpoints,
			allBreakpointsDisabled,
			onStartDebugging: runStartDebugging,
			onRunWithoutDebugging: runStartDebugging,
			onStopDebugging: () => {},
			onRestartDebugging: () => {},
			onAddConfiguration: () => {
				void openLaunchJsonInEditor();
			},
			onStepOver: () => {},
			onStepInto: () => {},
			onStepOut: () => {},
			onContinue: () => {},
			onToggleBreakpoint: toggleBreakpointAtCursor,
			onNewBreakpointInline: () => setCommandPaletteOpen(true),
			onNewBreakpointConditional: () => setCommandPaletteOpen(true),
			onNewBreakpointLogpoint: () => setCommandPaletteOpen(true),
			onNewBreakpointTriggered: () => setCommandPaletteOpen(true),
			onNewBreakpointFunction: () => setCommandPaletteOpen(true),
			onEnableAllBreakpoints: () => setAllBreakpointsDisabled(false),
			onDisableAllBreakpoints: () => setAllBreakpointsDisabled(true),
			onRemoveAllBreakpoints: () => {
				setBreakpointsByPath({});
				setAllBreakpointsDisabled(false);
			},
			onInstallAdditionalDebuggers: () => {
				window.open(
					"https://marketplace.visualstudio.com/search?target=Microsoft.VisualStudio.Code&category=Debuggers&sortBy=Installs",
					"_blank",
					"noopener,noreferrer",
				);
			},
		};
	}, [
		config?.terminalEnabled,
		selectedPath,
		fileLoading,
		fileError,
		technical,
		simpleTab,
		breakpointsByPath,
		allBreakpointsDisabled,
		debugSessionActive,
		runStartDebugging,
		toggleBreakpointAtCursor,
		openLaunchJsonInEditor,
	]);

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
		const fileReady = !!selectedPath && !fileLoading && !fileError;
		const canEditSurface = fileReady && (technical || simpleTab === "chat");
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
			canNavigateProblems: technical,
			onNextProblem: () => {
				setUiMode("technical");
				focusToolTab("problems");
			},
			onPreviousProblem: () => {
				setUiMode("technical");
				focusToolTab("problems");
			},
			canNavigateChanges: false,
			onNextChange: () => {},
			onPreviousChange: () => {},
		};
	}, [
		navHistoryTick,
		selectedPath,
		fileLoading,
		fileError,
		technical,
		simpleTab,
		goHistoryBack,
		goHistoryForward,
		openWorkspaceSearch,
		promptGoToLine,
		focusToolTab,
	]);

	const helpMenu = useMemo((): HelpMenuHandlers => {
		const repo = "https://github.com/zerwiz/wayofpi";
		return {
			onShowAllCommands: () => setCommandPaletteOpen(true),
			onEditorPlayground: () =>
				window.open(`${repo}/blob/main/docs/PLAYGROUND.md`, "_blank", "noopener,noreferrer"),
			onAccessibilityFeatures: () =>
				window.open("https://code.visualstudio.com/docs/editor/accessibility", "_blank", "noopener,noreferrer"),
			onGiveFeedback: () => window.open(`${repo}/issues/new`, "_blank", "noopener,noreferrer"),
			onViewLicense: () => window.open(repo, "_blank", "noopener,noreferrer"),
			canToggleDeveloperTools: false,
			onToggleDeveloperTools: () => {},
			canOpenProcessExplorer: false,
			onOpenProcessExplorer: () => {},
			canDownloadUpdate: true,
			onDownloadUpdate: () => window.open(`${repo}/releases`, "_blank", "noopener,noreferrer"),
		};
	}, []);

	const saveAndRefresh = useCallback(async () => {
		await save();
		await refresh();
	}, [save, refresh]);

	const copyWorkspacePath = useCallback(() => {
		const primary = folders[0]?.path ?? root;
		if (!primary) return;
		void navigator.clipboard.writeText(primary);
	}, [folders, root]);

	/** Native OS picker on the server host; falls back to a path prompt if unavailable. */
	const pickAbsoluteServerPath = useCallback(
		async (kind: "file" | "folder"): Promise<string | null> => {
			if (switchAllowed) {
				const r = await requestNativePick(kind);
				if ("path" in r) return r.path;
				if ("cancelled" in r) return null;
			}
			const def = kind === "folder" ? root || "" : "";
			const msg =
				kind === "folder"
					? "Open folder (absolute path on the server machine)"
					: "Open file (absolute path on the server machine)";
			const p = window.prompt(msg, def);
			if (p == null || !p.trim()) return null;
			return p.trim();
		},
		[switchAllowed, root],
	);

	const openFolderAbs = useCallback(
		async (abs: string) => {
			const r = await postWorkspaceOp({ op: "open_folder", path: abs });
			if (r.error) {
				window.alert(r.error);
				return;
			}
			pushRecentWorkspaceFolder(abs);
			bumpRecent();
			setSelectedPath(null);
			setExplorerContextDir("");
			await refresh();
		},
		[bumpRecent, refresh],
	);

	const handleOpenFolderPrompt = useCallback(() => {
		void (async () => {
			const p = await pickAbsoluteServerPath("folder");
			if (!p) return;
			void openFolderAbs(p);
		})();
	}, [openFolderAbs, pickAbsoluteServerPath]);

	const handleOpenFilePrompt = useCallback(() => {
		void (async () => {
			const abs = await pickAbsoluteServerPath("file");
			if (!abs) return;
			const r = await postWorkspaceOp({ op: "open_file", path: abs });
			if (r.error) {
				window.alert(r.error);
				return;
			}
			const parent = abs.replace(/[/\\][^/\\]*$/, "");
			if (parent) pushRecentWorkspaceFolder(parent);
			bumpRecent();
			if (r.selectPath) {
				setSelectedPath(r.selectPath);
				setExplorerContextDir(posixDirname(r.selectPath));
			}
			await refresh();
		})();
	}, [bumpRecent, pickAbsoluteServerPath, refresh]);

	const handleAddFolderPrompt = useCallback(() => {
		void (async () => {
			const p = await pickAbsoluteServerPath("folder");
			if (!p) return;
			const r = await postWorkspaceOp({ op: "add_folder", path: p });
			if (r.error) window.alert(r.error);
			else {
				pushRecentWorkspaceFolder(p);
				bumpRecent();
				await refresh();
			}
		})();
	}, [bumpRecent, pickAbsoluteServerPath, refresh]);

	const handleOpenRecentFolder = useCallback(
		(abs: string) => {
			void openFolderAbs(abs);
		},
		[openFolderAbs],
	);

	const handleRemoveWorkspaceFolder = useCallback(
		(label: string) => {
			void (async () => {
				const r = await postWorkspaceOp({ op: "remove_folder", label });
				if (r.error) window.alert(r.error);
				else {
					setSelectedPath(null);
					await refresh();
				}
			})();
		},
		[refresh],
	);

	const handleCloseWorkspace = useCallback(() => {
		void (async () => {
			const r = await postWorkspaceOp({ op: "close_workspace" });
			if (r.error) window.alert(r.error);
			else {
				setSelectedPath(null);
				setExplorerContextDir("");
				await refresh();
			}
		})();
	}, [refresh]);

	const downloadWorkspaceJson = useCallback(
		(suggestedName: string) => {
			const payload = { folders: folders.map((f) => ({ path: f.path, name: f.label })) };
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = suggestedName;
			a.click();
			URL.revokeObjectURL(a.href);
		},
		[folders],
	);

	const handleSaveWorkspaceAs = useCallback(() => {
		downloadWorkspaceJson("wayof-pi.code-workspace");
	}, [downloadWorkspaceJson]);

	const handleDuplicateWorkspace = useCallback(() => {
		const name = window.prompt("Save duplicate workspace as", "wayof-pi-copy.code-workspace");
		if (name == null) return;
		downloadWorkspaceJson(name.trim() || "wayof-pi-copy.code-workspace");
	}, [downloadWorkspaceJson]);

	const handleNewTextFile = useCallback(() => {
		const name = window.prompt("New file name", "untitled.txt");
		if (name == null) return;
		const safe = sanitizeNewEntryName(name);
		if (!safe) {
			window.alert("Invalid name.");
			return;
		}
		const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
		void (async () => {
			try {
				await apiPostJson("/api/fs/entry", { path: rel, kind: "file" });
				setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) });
				await refresh();
				setSelectedPath(rel);
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		})();
	}, [explorerContextDir, refresh]);

	const handleNewTextFileInDock = useCallback(
		(zone: HorizontalToolDockSlot) => {
			const name = window.prompt("New file name", "untitled.txt");
			if (name == null) return;
			const safe = sanitizeNewEntryName(name);
			if (!safe) {
				window.alert("Invalid name.");
				return;
			}
			const rel = explorerContextDir ? `${explorerContextDir}/${safe}` : safe;
			void (async () => {
				try {
					await apiPostJson("/api/fs/entry", { path: rel, kind: "file" });
					setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) });
					await refresh();
					setSelectedPath(rel);
					setToolDock((prev) => {
						const next = applyAddFileToStrip(prev, zone, rel);
						writeToolDockLayout(next);
						return next;
					});
					setHorizontalToolDockVisible((v) => ({ ...v, [zone]: true }));
				} catch (e) {
					window.alert(e instanceof Error ? e.message : String(e));
				}
			})();
		},
		[explorerContextDir, refresh],
	);

	const handleOpenFileInDock = useCallback(
		(zone: HorizontalToolDockSlot) => {
			void (async () => {
				const abs = await pickAbsoluteServerPath("file");
				if (!abs) return;
				const r = await postWorkspaceOp({ op: "open_file", path: abs });
				if (r.error) {
					window.alert(r.error);
					return;
				}
				const parent = abs.replace(/[/\\][^/\\]*$/, "");
				if (parent) pushRecentWorkspaceFolder(parent);
				bumpRecent();
				if (r.selectPath) {
					setSelectedPath(r.selectPath);
					setExplorerContextDir(posixDirname(r.selectPath));
					setToolDock((prev) => {
						const next = applyAddFileToStrip(prev, zone, r.selectPath!);
						writeToolDockLayout(next);
						return next;
					});
					setHorizontalToolDockVisible((v) => ({ ...v, [zone]: true }));
				}
				await refresh();
			})();
		},
		[bumpRecent, pickAbsoluteServerPath, refresh],
	);

	const handleSaveAs = useCallback(() => {
		if (!selectedPath) return;
		const suggest = selectedPath;
		const rel = window.prompt("Save as (path relative to workspace)", suggest);
		if (rel == null || !rel.trim()) return;
		const target = rel.trim().replace(/^[/\\]+/, "");
		void (async () => {
			try {
				await apiPutJson("/api/file", { path: target, content });
				setSelectedPath(target);
				setExplorerContextDir(posixDirname(target));
				setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(target) });
				await refresh();
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		})();
	}, [content, selectedPath, refresh]);

	const handleSaveAll = useCallback(async () => {
		if (dirty && selectedPath) await saveAndRefresh();
	}, [dirty, selectedPath, saveAndRefresh]);

	const onWorkspaceFileChange = useCallback(
		async (e: ChangeEvent<HTMLInputElement>) => {
			const f = e.target.files?.[0];
			e.target.value = "";
			if (!f) return;
			let text: string;
			try {
				text = await f.text();
			} catch {
				window.alert("Could not read file");
				return;
			}
			let json: unknown;
			try {
				json = JSON.parse(text);
			} catch {
				window.alert("Invalid JSON workspace file");
				return;
			}
			const absWs = await pickAbsoluteServerPath("file");
			if (!absWs) return;
			const r = await postWorkspaceOp({
				op: "from_code_workspace_file",
				workspaceFilePath: absWs,
				json,
			});
			if (r.error) window.alert(r.error);
			else {
				setSelectedPath(null);
				await refresh();
			}
		},
		[pickAbsoluteServerPath, refresh],
	);

	const openPreferences = useCallback(() => {
		setUiMode("technical");
		persistLeftSidebar(true);
		setActivity("settings");
	}, [persistLeftSidebar]);

	const fileMenu: FileMenuProps = useMemo(
		() => ({
			switchAllowed,
			recentFolders,
			autoSave,
			onToggleAutoSave: () => {
				setAutoSave((v) => {
					const n = !v;
					writeAutoSave(n);
					return n;
				});
			},
			workspaceFolders: folders,
			dirty,
			hasOpenFile: !!selectedPath,
			canSaveFile: !!selectedPath && dirty,
			canRevertFile: !!selectedPath,
			onRefreshWorkspaceTree: refresh,
			onCopyWorkspacePath: copyWorkspacePath,
			onNewTextFile: handleNewTextFile,
			onNewWindow: () => {
				window.open(window.location.href, "_blank", "noopener,noreferrer");
			},
			onNewAgentsWindow: () => {
				const u = new URL(window.location.href);
				u.searchParams.set("agents", "1");
				window.open(u.toString(), "_blank", "noopener,noreferrer");
			},
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
			onRevertFile: reload,
			onCloseEditor: () => setSelectedPath(null),
			onCloseWorkspace: handleCloseWorkspace,
			onCloseWindow: () => {
				window.close();
			},
			onExit: () => {
				window.close();
				window.setTimeout(() => {
					window.alert("If the tab is still open, close it from the browser.");
				}, 100);
			},
			onPreferencesOpen: openPreferences,
			onShareCopyLink: () => void navigator.clipboard.writeText(window.location.href),
			onRemoveWorkspaceFolder: handleRemoveWorkspaceFolder,
		}),
		[
			switchAllowed,
			recentFolders,
			autoSave,
			folders,
			dirty,
			selectedPath,
			refresh,
			copyWorkspacePath,
			handleNewTextFile,
			handleOpenFilePrompt,
			handleOpenFolderPrompt,
			handleAddFolderPrompt,
			handleOpenRecentFolder,
			handleSaveWorkspaceAs,
			handleDuplicateWorkspace,
			saveAndRefresh,
			handleSaveAs,
			handleSaveAll,
			reload,
			handleCloseWorkspace,
			openPreferences,
			handleRemoveWorkspaceFolder,
		],
	);

	const enterZen = useCallback(() => {
		setChrome((c) => {
			zenBackupRef.current = {
				leftSidebarVisible,
				horizontalToolDockVisible: { ...horizontalToolDockVisible },
				agentPanelVisible: dockLayout.agentPanelVisible,
				chatDock: dockLayout.chatDock,
				chrome: { ...c },
			};
			return { ...c, statusBarVisible: false, menuBarVisible: false };
		});
		persistLeftSidebar(false);
		setHorizontalToolDockVisible({ top: false, bottom: false });
		updateDockLayout({ agentPanelVisible: false });
		setZenMode(true);
	}, [
		horizontalToolDockVisible,
		dockLayout.agentPanelVisible,
		dockLayout.chatDock,
		leftSidebarVisible,
		persistLeftSidebar,
		updateDockLayout,
	]);

	const exitZen = useCallback(() => {
		const b = zenBackupRef.current;
		if (b) {
			persistLeftSidebar(b.leftSidebarVisible);
			setHorizontalToolDockVisible({ ...b.horizontalToolDockVisible, top: false });
			updateDockLayout({ agentPanelVisible: b.agentPanelVisible, chatDock: b.chatDock });
			setChrome(b.chrome);
			zenBackupRef.current = null;
		}
		setZenMode(false);
	}, [persistLeftSidebar, updateDockLayout]);

	useEffect(() => {
		if (!zenMode) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") exitZen();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [zenMode, exitZen]);

	const applyEditorLayoutPreset = useCallback(
		(preset: EditorLayoutPreset) => {
			switch (preset) {
				case "single":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({ ...d, agentPanelVisible: false, chatDock: "right" }));
					break;
				case "two_columns":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "right" }));
					break;
				case "two_rows":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "bottom" }));
					break;
				case "two_rows_right":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({
						...d,
						agentPanelVisible: true,
						chatDock: "right",
					}));
					break;
				case "two_columns_bottom":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "bottom" }));
					break;
				case "grid_2x2":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({ ...d, agentPanelVisible: true, chatDock: "right" }));
					break;
				case "focus_terminal":
					persistLeftSidebar(true);
					updateDockLayout((d) => ({ ...d, agentPanelVisible: false }));
					focusToolTab("terminal");
					break;
				default:
					break;
			}
		},
		[focusToolTab, persistLeftSidebar, updateDockLayout],
	);

	const toggleFullScreen = useCallback(async () => {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch {
			/* ignore */
		}
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
			wordWrap: chrome.editorWordWrap,
			onToggleWordWrap: () => setChrome((c) => ({ ...c, editorWordWrap: !c.editorWordWrap })),
			breadcrumbsVisible: chrome.breadcrumbsVisible,
			onToggleBreadcrumbs: () => setChrome((c) => ({ ...c, breadcrumbsVisible: !c.breadcrumbsVisible })),
			uiZoomPercent: chrome.uiZoomPercent,
			onZoomIn: () =>
				setChrome((c) => ({
					...c,
					uiZoomPercent: Math.min(150, c.uiZoomPercent + 10),
				})),
			onZoomOut: () =>
				setChrome((c) => ({
					...c,
					uiZoomPercent: Math.max(75, c.uiZoomPercent - 10),
				})),
			onZoomReset: () => setChrome((c) => ({ ...c, uiZoomPercent: 100 })),
			onFlipLayout: flipDockLayout,
			onApplyLayoutPreset: applyEditorLayoutPreset,
		}),
		[
			chrome.statusBarVisible,
			chrome.menuBarVisible,
			chrome.centeredEditorLayout,
			chrome.editorWordWrap,
			chrome.breadcrumbsVisible,
			chrome.uiZoomPercent,
			zenMode,
			enterZen,
			exitZen,
			toggleFullScreen,
			flipDockLayout,
			applyEditorLayoutPreset,
		],
	);

	const viewSimpleMenu: ViewMenuSimpleOptions | null = useMemo(() => {
		if (technical) return null;
		const d = uiViewsCatalog.data;
		const catalogRel = d?.catalogRelPath ?? ".wayofpi/ui-views.json";
		const schemaRel = d?.schemaDocRelPath ?? "docs/WOP_SIMPLE_UI_VIEWS.md";

		const onActivateEntry = (e: UiViewCatalogEntry) => {
			if (e.kind === "simpleTab") {
				const t = e.target;
				if (t === "chat" || t === "team" || t === "models" || t === "projects" || t === "settings") {
					setSimpleTab(t);
				}
				return;
			}
			if (e.kind === "openFile") {
				setSelectedPath(e.target);
				setSimpleTab("chat");
				return;
			}
			if (e.kind === "technicalActivity") {
				const a = e.target;
				if (
					a === "explorer" ||
					a === "search" ||
					a === "scm" ||
					a === "extensions" ||
					a === "planning" ||
					a === "settings"
				) {
					setUiMode("technical");
					persistLeftSidebar(true);
					setActivity(a);
				}
			}
		};

		return {
			onOpenAppearanceSettings: () => setSimpleTab("settings"),
			onToggleFullScreen: () => void toggleFullScreen(),
			onSeedViewsCatalog: () => void uiViewsCatalog.seedCatalog(),
			catalog: d?.entries ?? [],
			catalogLoading: uiViewsCatalog.loading,
			catalogError: uiViewsCatalog.error,
			catalogParseWarning: d?.parseError ?? null,
			catalogSource: d?.source ?? "default",
			catalogRelPath: catalogRel,
			onActivateEntry,
			onEditCatalog: () => {
				setSelectedPath(catalogRel);
				setSimpleTab("chat");
			},
			onOpenSchemaDoc: () => {
				setSelectedPath(schemaRel);
				setSimpleTab("chat");
			},
		};
	}, [
		technical,
		uiViewsCatalog.data,
		uiViewsCatalog.loading,
		uiViewsCatalog.error,
		uiViewsCatalog.seedCatalog,
		toggleFullScreen,
		persistLeftSidebar,
	]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const inChat = (e.target as HTMLElement | null)?.closest?.("[data-wop-chat-root]");
			const inXterm = (e.target as HTMLElement | null)?.closest?.(".xterm");
			if (!inChat && !inXterm) {
				if (e.key === "F9" && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) {
					e.preventDefault();
					toggleBreakpointAtCursor();
					return;
				}
				if (e.key === "F5") {
					if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
						e.preventDefault();
						if (debugSessionActive) {
							/* continue — reserved for DAP */
						} else {
							runStartDebugging();
						}
						return;
					}
					if (e.ctrlKey && !e.shiftKey && !e.altKey) {
						e.preventDefault();
						runStartDebugging();
						return;
					}
					if (e.shiftKey && !e.ctrlKey && !e.altKey) {
						if (debugSessionActive) e.preventDefault();
						return;
					}
					if (e.ctrlKey && e.shiftKey && !e.altKey) {
						if (debugSessionActive) e.preventDefault();
						return;
					}
				}
				if (debugSessionActive) {
					if (e.key === "F10" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
						e.preventDefault();
						return;
					}
					if (e.key === "F11" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
						e.preventDefault();
						return;
					}
					if (e.key === "F11" && e.shiftKey && !e.ctrlKey && !e.altKey) {
						e.preventDefault();
						return;
					}
				}
				const isMinusKey =
					e.key === "-" ||
					e.key === "_" ||
					e.code === "Minus" ||
					e.code === "NumpadSubtract";
				if ((e.metaKey || e.ctrlKey) && e.altKey && isMinusKey && !e.shiftKey) {
					e.preventDefault();
					goHistoryBack();
					return;
				}
				if ((e.metaKey || e.ctrlKey) && e.shiftKey && isMinusKey && !e.altKey) {
					e.preventDefault();
					goHistoryForward();
					return;
				}
				if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p" && !e.shiftKey && !e.altKey) {
					e.preventDefault();
					openWorkspaceSearch();
					return;
				}
				if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t" && !e.shiftKey && !e.altKey) {
					e.preventDefault();
					setCommandPaletteOpen(true);
					return;
				}
				if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "o" && !e.altKey) {
					e.preventDefault();
					setCommandPaletteOpen(true);
					return;
				}
				if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g" && !e.shiftKey && !e.altKey) {
					e.preventDefault();
					promptGoToLine();
					return;
				}
				if (e.key === "F8" && !e.ctrlKey && !e.altKey) {
					e.preventDefault();
					setUiMode("technical");
					focusToolTab("problems");
					return;
				}
			}
			if (
				technical &&
				(e.metaKey || e.ctrlKey) &&
				e.key.toLowerCase() === "b" &&
				!e.shiftKey &&
				!e.altKey
			) {
				e.preventDefault();
				toggleLeftSidebar();
				return;
			}
			if (
				technical &&
				(e.metaKey || e.ctrlKey) &&
				e.altKey &&
				e.key.toLowerCase() === "b" &&
				!e.shiftKey
			) {
				e.preventDefault();
				updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible }));
				return;
			}
			if (technical && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j" && !e.shiftKey && !e.altKey) {
				e.preventDefault();
				focusToolTab("terminal");
				return;
			}
			if (technical && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") {
				e.preventDefault();
				focusToolTab("problems");
				return;
			}
			if (technical && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
				e.preventDefault();
				setCommandPaletteOpen(true);
				return;
			}
			if (
				!inXterm &&
				(e.metaKey || e.ctrlKey) &&
				e.shiftKey &&
				e.key.toLowerCase() === "b" &&
				!e.altKey
			) {
				e.preventDefault();
				focusTerminalForCommands();
				if (config?.terminalEnabled === true) sendTerminalInput("bun run build\r");
				return;
			}
			if (!inXterm && (e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "Digit5") {
				e.preventDefault();
				setUiMode("technical");
				persistLeftSidebar(true);
				onOpenToolPanel("terminal", "bottom");
				return;
			}
			if (technical && e.altKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "z") {
				if (!inChat) {
					e.preventDefault();
					setChrome((c) => ({ ...c, editorWordWrap: !c.editorWordWrap }));
				}
				return;
			}
			if (technical && e.shiftKey && e.altKey && (e.key === "0" || e.code === "Digit0")) {
				e.preventDefault();
				flipDockLayout();
				return;
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setCommandPaletteOpen(true);
				return;
			}
			if (inChat && (e.metaKey || e.ctrlKey)) {
				const k = e.key.toLowerCase();
				if (k === "n" || k === "o" || k === "w" || k === "q") return;
			}
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s") {
				e.preventDefault();
				handleSaveAs();
				return;
			}
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "s") {
				e.preventDefault();
				void saveAndRefresh();
				return;
			}
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "n") {
				e.preventDefault();
				handleNewTextFile();
				return;
			}
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "o") {
				e.preventDefault();
				handleOpenFilePrompt();
				return;
			}
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "w") {
				e.preventDefault();
				setSelectedPath(null);
				return;
			}
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "q") {
				e.preventDefault();
				window.close();
				return;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		saveAndRefresh,
		technical,
		toggleLeftSidebar,
		updateDockLayout,
		focusToolTab,
		flipDockLayout,
		setCommandPaletteOpen,
		handleSaveAs,
		handleNewTextFile,
		handleOpenFilePrompt,
		focusTerminalForCommands,
		config?.terminalEnabled,
		persistLeftSidebar,
		onOpenToolPanel,
		setUiMode,
		toggleBreakpointAtCursor,
		runStartDebugging,
		debugSessionActive,
		goHistoryBack,
		goHistoryForward,
		openWorkspaceSearch,
		promptGoToLine,
	]);

	const editorTechnicalChromeMain = useMemo(
		() => ({
			onOpenFile: handleOpenFilePrompt,
			onShowAgentChat: () => updateDockLayout((d) => ({ ...d, agentPanelVisible: true })),
		}),
		[handleOpenFilePrompt, updateDockLayout],
	);

	const setStripActiveIndex = useCallback((slot: HorizontalToolDockSlot, index: number) => {
		setToolDock((prev) => {
			const next = {
				...prev,
				activeIndexBySlot: { ...prev.activeIndexBySlot, [slot]: index },
			};
			writeToolDockLayout(next);
			return next;
		});
	}, []);

	const onDockEntryMove = useCallback(
		(moving: DockStripEntry, targetZone: ToolPanelZone, before: DockStripEntry | null) => {
			setHorizontalToolDockVisible((v) => ({ ...v, [targetZone]: true }));
			setToolDock((prev) => {
				const next = applyDockStripMoveEntry(prev, moving, targetZone, before);
				writeToolDockLayout(next);
				return next;
			});
		},
		[],
	);

	const onDockEntryClose = useCallback((entry: DockStripEntry) => {
		setToolDock((prev) => {
			const next =
				entry.type === "tool"
					? applyToolPanelClose(prev, entry.id)
					: applyRemoveFileFromStrips(prev, entry.path);
			writeToolDockLayout(next);
			return next;
		});
	}, []);

	const onSelectFileFromDock = useCallback((path: string) => {
		setSelectedPath(path);
		setExplorerContextDir(posixDirname(path));
	}, []);

	/** Lower band: editor-stack-attached tool dock (+ empty state: add via +). */
	const workspaceLowerToolDock = horizontalToolDockVisible.bottom ? (
		<>
			<DockSplitHandle
				orientation="horizontal"
				ariaLabel={HORIZONTAL_TOOL_DOCK_UI.bottom.splitResizeAria}
				onDelta={(_dx, dy) =>
					updateDockLayout((d) => ({
						...d,
						horizontalToolDockHeightsPx: {
							...d.horizontalToolDockHeightsPx,
							bottom: clampBottomPanelHeight(d.horizontalToolDockHeightsPx.bottom - dy),
						},
					}))
				}
			/>
			<UnifiedHorizontalDock
				slot="bottom"
				bandHeightPx={dockLayout.horizontalToolDockHeightsPx.bottom}
				entries={toolDock.strips.bottom}
				activeIndex={toolDock.activeIndexBySlot.bottom}
				onActiveIndexChange={(i) => setStripActiveIndex("bottom", i)}
				onSelectFilePath={onSelectFileFromDock}
				onMoveEntry={onDockEntryMove}
				onCloseEntry={onDockEntryClose}
				onReorderInZone={(moving, before) => onDockEntryMove(moving, "bottom", before)}
				logs={session.logs}
				dropLabel={HORIZONTAL_TOOL_DOCK_UI.bottom.dropLabel}
				onAddTool={(tab) => onOpenToolPanel(tab, "bottom")}
				fileActions={[
					{
						label: "New text file…",
						detail: "Create under the explorer folder",
						run: () => handleNewTextFileInDock("bottom"),
					},
					{ label: "Open file in this dock…", run: () => handleOpenFileInDock("bottom") },
				]}
				allowEmpty
			/>
		</>
	) : null;

	/** Zed-style status bar icons — see Zed docs (`project_panel`, `terminal`, `agent`, `search`, `git_panel`, `diagnostics`, `status_bar`). */
	const technicalZedStrip = useMemo(
		() => ({
			onToggleLeftSidebar: toggleLeftSidebar,
			leftSidebarVisible,
			onFocusTerminal: () => focusToolTab("terminal"),
			terminalDockedVisible: toolDock.panels.terminal.visible,
			onFocusPlanning: () => {
				persistLeftSidebar(true);
				setActivity("planning");
			},
			planningActive: activity === "planning",
			onToggleAgent: () =>
				updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible })),
			agentVisible: dockLayout.agentPanelVisible,
			onFocusSearch: () => {
				persistLeftSidebar(true);
				setActivity("search");
			},
			searchActive: activity === "search",
			onFocusScm: () => {
				persistLeftSidebar(true);
				setActivity("scm");
			},
			scmActive: activity === "scm",
			onFocusDiagnostics: () => focusToolTab("problems"),
			problemsVisible: toolDock.panels.problems.visible,
			onOpenSettings: openPreferences,
			diagnosticsCount: 0,
		}),
		[
			toggleLeftSidebar,
			leftSidebarVisible,
			focusToolTab,
			toolDock.panels.terminal.visible,
			toolDock.panels.problems.visible,
			persistLeftSidebar,
			activity,
			updateDockLayout,
			dockLayout.agentPanelVisible,
			openPreferences,
		],
	);

	const onExplorerSelectFile = useCallback((p: string, _ev?: MouseEvent) => {
		setExplorerContextDir(posixDirname(p));
		setSelectedPath(p);
	}, []);

	const commandItems: CommandItem[] = useMemo(() => {
		const setAct = (a: TechnicalActivity) => () => {
			persistLeftSidebar(true);
			setActivity(a);
		};
		return [
			{ id: "palette", label: "Command palette", keywords: ["commands"], run: () => setCommandPaletteOpen(true) },
			{
				id: "leftsidebar",
				label: leftSidebarVisible ? "View: Hide primary sidebar" : "View: Show primary sidebar",
				detail: "Ctrl+B",
				keywords: ["activity", "explorer", "dock", "zed"],
				run: toggleLeftSidebar,
			},
			{ id: "explorer", label: "View: Explorer", keywords: ["files", "tree"], run: setAct("explorer") },
			{ id: "search", label: "View: Search", keywords: ["find", "file"], run: setAct("search") },
			{ id: "scm", label: "View: Source control", keywords: ["git"], run: setAct("scm") },
			{ id: "ext", label: "View: Run / Extensions", run: setAct("extensions") },
			{
				id: "planning",
				label: "View: Plan / Build",
				keywords: ["cursor", "planner", "agent", "mode"],
				run: setAct("planning"),
			},
			{
				id: "chat-mode-plan",
				label: "Agent: Plan mode (Pi planner prompt)",
				keywords: ["cursor", "planning"],
				run: () => session.setChatMode("plan"),
			},
			{
				id: "chat-mode-build",
				label: "Agent: Build mode",
				keywords: ["cursor", "coding"],
				run: () => session.setChatMode("build"),
			},
			{
				id: "chat-agent-default",
				label: "Chat: Default assistant (no .md agent)",
				keywords: ["persona", "pi"],
				run: () => session.setChatAgent(null),
			},
			...((agentsApi.data?.agents ?? []).slice(0, 48).map((a) => ({
				id: `chat-agent-${a.name}`,
				label: `Chat: Agent ${a.name}`,
				keywords: [a.name, a.description, "pi", "persona"],
				run: () => session.setChatAgent(a.name),
			})) satisfies CommandItem[]),
			{ id: "settings", label: "View: Settings", run: setAct("settings") },
			{
				id: "save",
				label: "File: Save",
				detail: "Ctrl+S",
				keywords: ["write", "disk"],
				run: () => void saveAndRefresh(),
			},
			{
				id: "revert",
				label: "File: Revert from disk",
				run: () => void reload(),
			},
			{
				id: "refresh",
				label: "Workspace: Refresh tree",
				run: () => void refresh(),
			},
			{
				id: "copypath",
				label: "Workspace: Copy path",
				run: copyWorkspacePath,
			},
			{
				id: "bottom-tool-dock-band",
				label: horizontalToolDockVisible.bottom
					? "View: Hide tool dock (editor stack)"
					: "View: Show tool dock (editor stack)",
				keywords: ["terminal", "problems", "panel", "zed", "dock", "bottom"],
				run: () =>
					setHorizontalToolDockVisible((v) => ({
						...v,
						bottom: !v.bottom,
					})),
			},
			{
				id: "agent-dock-right",
				label: "View: Dock agent panel to the right",
				keywords: ["chat", "session", "sidebar", "zed", "cursor"],
				run: () => updateDockLayout({ chatDock: "right", agentPanelVisible: true }),
			},
			{
				id: "agent-dock-bottom",
				label: "View: Dock agent panel to the bottom",
				keywords: ["chat", "session", "terminal", "zed", "cursor"],
				run: () => updateDockLayout({ chatDock: "bottom", agentPanelVisible: true }),
			},
			{
				id: "agent-toggle",
				label: dockLayout.agentPanelVisible ? "View: Hide agent panel" : "View: Show agent panel",
				keywords: ["chat", "session", "copilot"],
				run: () => updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible })),
			},
			{
				id: "toollog",
				label: "Panel: Tool log",
				run: () => focusToolTab("tool_log"),
			},
			{
				id: "terminal",
				label: "Panel: Terminal",
				run: () => focusToolTab("terminal"),
			},
			{
				id: "output",
				label: "Panel: Output",
				run: () => focusToolTab("output"),
			},
			...PI_MODEL_CONFIG_ENTRIES.map(
				(e) =>
					({
						id: `pi-model-file-${e.id}`,
						label: `Pi: Open ${e.path}`,
						keywords: ["models", "provider", "ollama", "openrouter", e.id, "json"],
						run: () => openPiModelConfigInEditor(e.path),
					}) satisfies CommandItem,
			),
		];
	}, [
		horizontalToolDockVisible,
		toolDock,
		dockLayout.chatDock,
		copyWorkspacePath,
		focusToolTab,
		leftSidebarVisible,
		openPiModelConfigInEditor,
		persistLeftSidebar,
		refresh,
		reload,
		saveAndRefresh,
		toggleLeftSidebar,
		dockLayout.agentPanelVisible,
		updateDockLayout,
		session.setChatMode,
		session.setChatAgent,
		agentsApi.data?.agents,
	]);

	const simpleCommandItems: CommandItem[] = useMemo(() => {
		const files = flattenTreeFiles(nodes).slice(0, 120);
		return [
			{
				id: "s-palette",
				label: "Command palette",
				keywords: ["commands"],
				run: () => setCommandPaletteOpen(true),
			},
			{ id: "s-chat", label: "Simple: Chat", run: () => setSimpleTab("chat") },
			{ id: "s-team", label: "Simple: My Team", run: () => setSimpleTab("team") },
			{ id: "s-models", label: "Simple: AI Brains", run: () => setSimpleTab("models") },
			{ id: "s-projects", label: "Simple: Projects", run: () => setSimpleTab("projects") },
			{ id: "s-settings", label: "Simple: Settings", run: () => setSimpleTab("settings") },
			{ id: "s-tech", label: "Layout: Technical UI", run: () => setUiMode("technical") },
			{
				id: "s-save",
				label: "File: Save",
				detail: "Ctrl+S",
				run: () => void saveAndRefresh(),
			},
			{ id: "s-revert", label: "File: Revert from disk", run: () => void reload() },
			{ id: "s-refresh", label: "Workspace: Refresh tree", run: () => void refresh() },
			{ id: "s-copy", label: "Workspace: Copy path", run: copyWorkspacePath },
			...PI_MODEL_CONFIG_ENTRIES.map(
				(e) =>
					({
						id: `s-pi-model-file-${e.id}`,
						label: `Pi: ${e.label} (${e.path})`,
						keywords: ["models", "provider", "brains", e.id],
						run: () => openPiModelConfigInSimpleBrains(e.path),
					}) satisfies CommandItem,
			),
			...files.map((f) => ({
				id: `s-file-${f.path}`,
				label: `Open: ${f.path}`,
				keywords: [f.name, f.path],
				run: () => {
					setSelectedPath(f.path);
					setSimpleTab("chat");
				},
			})),
		];
	}, [nodes, copyWorkspacePath, openPiModelConfigInSimpleBrains, refresh, reload, saveAndRefresh, setSelectedPath, setSimpleTab, setUiMode]);

	const leftPanel =
		activity === "explorer" ? (
			<ExplorerSidebar
				nodes={nodes}
				rootLabel={rootLabel}
				selectedPath={selectedPath}
				onSelectFile={onExplorerSelectFile}
				onSelectDirectory={setExplorerContextDir}
				onNewFile={handleNewFile}
				onNewFolder={handleNewFolder}
				loading={treeLoading}
				error={treeError}
				expandRevision={treeExpand.rev}
				pathsToExpand={treeExpand.paths}
			/>
		) : activity === "search" ? (
			<SearchSidePanel
				nodes={nodes}
				selectedPath={selectedPath}
				onSelectFile={(p, ev) => {
					onExplorerSelectFile(p, ev);
					setActivity("explorer");
				}}
			/>
		) : activity === "scm" ? (
			<ScmSidePanel root={root} onRefresh={refresh} />
		) : activity === "extensions" ? (
			<ExtensionsSidePanel />
		) : activity === "planning" ? (
			<PlanningSidePanel
				chatMode={session.chatMode}
				onChatModeChange={session.setChatMode}
				streaming={session.streaming}
			/>
		) : (
			<SettingsSidePanel
				config={config}
				workspaceRoot={folders[0]?.path ?? root ?? ""}
				onOpenPiModelConfig={openPiModelConfigInEditor}
			/>
		);

	if (!technical) {
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
						onUiModeChange={setUiMode}
						config={config}
						onOpenCommandPalette={() => setCommandPaletteOpen(true)}
						onSave={saveAndRefresh}
						canSave={!!selectedPath && dirty}
						onRevertFile={() => void reload()}
						canRevert={!!selectedPath}
						onRefreshWorkspace={refresh}
						onCopyWorkspacePath={copyWorkspacePath}
						onSelectActivity={(a) => {
							setUiMode("technical");
							persistLeftSidebar(true);
							setActivity(a);
						}}
						onFocusBottomTab={(t) => {
							setUiMode("technical");
							focusToolTab(t);
						}}
						fileMenu={fileMenu}
						editMenu={editMenu}
						selectionMenu={selectionMenu}
						goMenu={goMenu}
						runMenu={runMenu}
						terminalMenu={terminalMenu}
						helpMenu={helpMenu}
						onOpenPiModelConfig={openPiModelConfigInSimpleBrains}
						viewSimple={viewSimpleMenu ?? undefined}
					/>
					<SimpleApp
						uiMode={uiMode}
						setUiMode={setUiMode}
						root={root || null}
						rootLabel={rootLabel}
						nodes={nodes}
						treeLoading={treeLoading}
						treeError={treeError}
						refreshTree={refresh}
						modelLabel={modelLabel}
						config={config}
						effectiveModel={session.effectiveModel}
						onSelectLlmModel={session.setLlmModel}
						selectedPath={selectedPath}
						setSelectedPath={setSelectedPath}
						content={content}
						setContent={setContent}
						filePreview={filePreview}
						fileLoading={fileLoading}
						fileError={fileError}
						dirty={dirty}
						save={save}
						line={line}
						col={col}
						onCursor={onCursor}
						rows={session.rows}
						logs={session.logs}
						streaming={session.streaming}
						chatStreamUiEnabled={simpleChatStreamUiEnabled}
						onChatStreamUiEnabledChange={onSimpleChatStreamUiEnabledChange}
						chatQueuePending={session.chatQueuePending}
						connected={session.connected}
						error={session.error}
						sendChat={session.sendChat}
						stop={session.stop}
						clearError={session.clearError}
						chatAgentName={session.chatAgentName}
						onChatAgentChange={session.setChatAgent}
						chatMode={session.chatMode}
						onChatModeChange={session.setChatMode}
						activeTab={simpleTab}
						onTabChange={setSimpleTab}
						providerConfigInitialPath={simpleProviderPath}
						providerConfigInitialNonce={simpleProviderNonce}
						onConsumeProviderConfigFocus={consumeSimpleProviderFocus}
						workspaceEditorRef={workspaceEditorRef}
						onUndoRedoStackChange={bumpEditorMenu}
						onSelectionPrefsChange={bumpSelectionPrefs}
						onFindInFiles={openWorkspaceSearch}
						onReplaceInFiles={openWorkspaceSearch}
					/>
				</div>
				<CommandPalette
					open={commandPaletteOpen}
					onClose={() => setCommandPaletteOpen(false)}
					items={simpleCommandItems}
				/>
			</>
		);
	}

	return (
		<div
			data-ui-mode={uiMode}
			className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e] font-sans text-[#cccccc] selection:bg-[#9a3412] wop-density-compact"
		>
			<input
				ref={workspaceFileInputRef}
				type="file"
				accept=".code-workspace,.json,application/json"
				className="hidden"
				aria-hidden
				onChange={onWorkspaceFileChange}
			/>
			{chrome.menuBarVisible ? (
				<MenuBar
					modelLabel={modelLabel}
					uiMode={uiMode}
					onUiModeChange={setUiMode}
					config={config}
					onOpenCommandPalette={() => setCommandPaletteOpen(true)}
					onSave={saveAndRefresh}
					canSave={!!selectedPath && dirty}
					onRevertFile={() => void reload()}
					canRevert={!!selectedPath}
					onRefreshWorkspace={refresh}
					onCopyWorkspacePath={copyWorkspacePath}
					onSelectActivity={selectActivityWithSidebar}
					onFocusBottomTab={focusToolTab}
					leftSidebarVisible={leftSidebarVisible}
					onToggleLeftSidebar={toggleLeftSidebar}
					agentPanelVisible={dockLayout.agentPanelVisible}
					agentChatDock={dockLayout.chatDock}
					onSetAgentChatDock={(r) => updateDockLayout({ chatDock: r, agentPanelVisible: true })}
					onToggleAgentPanel={() =>
						updateDockLayout((d) => ({ ...d, agentPanelVisible: !d.agentPanelVisible }))
					}
					fileMenu={fileMenu}
					editMenu={editMenu}
					selectionMenu={selectionMenu}
					goMenu={goMenu}
					runMenu={runMenu}
					terminalMenu={terminalMenu}
					helpMenu={helpMenu}
					onOpenPiModelConfig={openPiModelConfigInEditor}
					viewTechnical={viewTechnicalOptions}
					horizontalToolDockToggles={{
						bottom: {
							hasTabs: true,
							visible: horizontalToolDockVisible.bottom,
							onToggle: () =>
								setHorizontalToolDockVisible((v) => ({ ...v, bottom: !v.bottom })),
							terminalSubmenuLabel: "Tool dock (editor stack)",
						},
					}}
				/>
			) : (
				<div className="flex h-8 shrink-0 items-center gap-2 border-b border-[#252526] bg-[#2d2d2d] px-2">
					<button
						type="button"
						onClick={() => setChrome((c) => ({ ...c, menuBarVisible: true }))}
						className="rounded px-2 py-0.5 text-[11px] text-[#fed7aa] hover:bg-[#3c3c3c]"
					>
						⋯ Show menu bar
					</button>
					{zenMode ? (
						<button
							type="button"
							onClick={() => exitZen()}
							className="rounded px-2 py-0.5 text-[11px] text-[#ce9178] hover:bg-[#3c3c3c]"
						>
							Exit Zen (Esc)
						</button>
					) : null}
				</div>
			)}

			<CommandPalette
				open={commandPaletteOpen}
				onClose={() => setCommandPaletteOpen(false)}
				items={commandItems}
			/>

			<div
				className="flex min-h-0 flex-1 overflow-hidden"
				style={{ zoom: chrome.uiZoomPercent / 100 }}
			>
				{!zenMode ? (
					<ActivityBar active={activity} onSelect={selectActivityWithSidebar} />
				) : null}
				{leftSidebarVisible ? (
					<>
						<TechnicalPrimarySidebar
							widthPx={dockLayout.leftSidebarWidthPx}
							activityDetail={primarySidebarDockDetail}
							onHide={hidePrimarySidebar}
						>
							{leftPanel}
						</TechnicalPrimarySidebar>
						<DockSplitHandle
							orientation="vertical"
							ariaLabel="Resize primary sidebar"
							onDelta={(dx) =>
								updateDockLayout((d) => ({
									...d,
									leftSidebarWidthPx: clampLeftSidebarWidth(d.leftSidebarWidthPx + dx),
								}))
							}
						/>
					</>
				) : null}

				<main
					className={`flex min-w-0 flex-1 flex-col bg-[#1e1e1e] ${chrome.centeredEditorLayout ? "mx-auto w-full max-w-[1400px]" : ""}`}
				>
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<div className="flex min-h-0 flex-1 overflow-hidden">
							{dockLayout.agentPanelVisible && dockLayout.chatDock === "right" ? (
								<>
									<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
										<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#3c3c3c] bg-[#1e1e1e]">
											<EditorPanel
												ref={workspaceEditorRef}
												path={selectedPath}
												content={content}
												onChange={setContent}
												loading={fileLoading}
												error={fileError}
												dirty={dirty}
												diskBaseline={lastPersistedContent}
												filePreview={filePreview}
												onSave={async () => {
													await save();
													await refresh();
												}}
												onCursor={onCursor}
												compact
												showExplorerHint={false}
												onOpenWorkspace={refresh}
												technicalEditorChrome={editorTechnicalChromeMain}
												wordWrap={chrome.editorWordWrap}
												showBreadcrumbs={chrome.breadcrumbsVisible}
												onFindInFiles={openWorkspaceSearch}
												onReplaceInFiles={openWorkspaceSearch}
												onUndoRedoStackChange={bumpEditorMenu}
												onSelectionPrefsChange={bumpSelectionPrefs}
											/>
										</div>
										{workspaceLowerToolDock}
									</div>
									<DockSplitHandle
										orientation="vertical"
										ariaLabel="Resize editor vs agent panel width"
										onDelta={(dx) =>
											updateDockLayout((d) => ({
												...d,
												/* Drag splitter right (positive dx) → wider agent panel, narrower editor. */
												chatSizePx: clampChatWidth(d.chatSizePx + dx),
											}))
										}
									/>
									<div
										className="flex min-h-0 shrink-0 flex-col overflow-hidden"
										style={{ width: dockLayout.chatSizePx, minWidth: 220, maxWidth: 1280 }}
									>
										<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#3c3c3c] bg-[#1e1e1e]">
											<ChatPanel
												uiMode={uiMode}
												rows={session.rows}
												streaming={session.streaming}
												connected={session.connected}
												error={session.error}
												onSend={session.sendChat}
												onStop={session.stop}
												onClearError={session.clearError}
												onNewSession={session.startNewSession}
												chatMode={session.chatMode}
												onChatModeChange={session.setChatMode}
												agents={agentsApi.data?.agents ?? []}
												agentsLoading={agentsApi.loading}
												agentTeams={agentsApi.data?.teams ?? {}}
												chatAgentName={session.chatAgentName}
												onChatAgentChange={session.setChatAgent}
												chatQueuePending={session.chatQueuePending}
												dockPanelFrame
												technicalDock={{
													region: "right",
													sizePx: dockLayout.chatSizePx,
													onSetRegion: (r) =>
														updateDockLayout((d) => ({
															...d,
															chatDock: r,
															chatSizePx:
																r === "right"
																	? clampChatWidth(d.chatSizePx)
																	: clampChatHeight(d.chatSizePx),
														})),
													onHidePanel: () => updateDockLayout({ agentPanelVisible: false }),
												}}
											/>
										</div>
									</div>
								</>
							) : dockLayout.agentPanelVisible && dockLayout.chatDock === "bottom" ? (
								<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
									<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
										<div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
											<div className="min-h-0 min-w-0 flex-1 overflow-hidden">
												<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#3c3c3c] bg-[#1e1e1e]">
													<EditorPanel
														ref={workspaceEditorRef}
														path={selectedPath}
														content={content}
														onChange={setContent}
														loading={fileLoading}
														error={fileError}
														dirty={dirty}
														diskBaseline={lastPersistedContent}
														filePreview={filePreview}
														onSave={async () => {
															await save();
															await refresh();
														}}
														onCursor={onCursor}
														compact
														showExplorerHint={false}
														onOpenWorkspace={refresh}
														technicalEditorChrome={editorTechnicalChromeMain}
														wordWrap={chrome.editorWordWrap}
														showBreadcrumbs={chrome.breadcrumbsVisible}
														onFindInFiles={openWorkspaceSearch}
														onReplaceInFiles={openWorkspaceSearch}
														onUndoRedoStackChange={bumpEditorMenu}
														onSelectionPrefsChange={bumpSelectionPrefs}
													/>
												</div>
											</div>
										</div>
										{workspaceLowerToolDock}
									</div>
									<DockSplitHandle
										orientation="horizontal"
										ariaLabel="Resize agent session doc height"
										onDelta={(_dx, dy) =>
											updateDockLayout((d) => ({
												...d,
												chatSizePx: clampChatHeight(d.chatSizePx + dy),
											}))
										}
									/>
									<div
										className="flex min-h-0 shrink-0 flex-col overflow-hidden"
										style={{
											height: dockLayout.chatSizePx,
											minHeight: 120,
											maxHeight: 720,
										}}
									>
										<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#3c3c3c] bg-[#1e1e1e]">
											<ChatPanel
												uiMode={uiMode}
												rows={session.rows}
												streaming={session.streaming}
												connected={session.connected}
												error={session.error}
												onSend={session.sendChat}
												onStop={session.stop}
												onClearError={session.clearError}
												onNewSession={session.startNewSession}
												chatMode={session.chatMode}
												onChatModeChange={session.setChatMode}
												agents={agentsApi.data?.agents ?? []}
												agentsLoading={agentsApi.loading}
												agentTeams={agentsApi.data?.teams ?? {}}
												chatAgentName={session.chatAgentName}
												onChatAgentChange={session.setChatAgent}
												chatQueuePending={session.chatQueuePending}
												dockPanelFrame
												technicalDock={{
													region: "bottom",
													sizePx: dockLayout.chatSizePx,
													onSetRegion: (r) =>
														updateDockLayout((d) => ({
															...d,
															chatDock: r,
															chatSizePx:
																r === "right"
																	? clampChatWidth(d.chatSizePx)
																	: clampChatHeight(d.chatSizePx),
														})),
													onHidePanel: () => updateDockLayout({ agentPanelVisible: false }),
												}}
											/>
										</div>
									</div>
								</div>
							) : (
								<div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
									<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
										<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#3c3c3c] bg-[#1e1e1e]">
											<EditorPanel
												ref={workspaceEditorRef}
												path={selectedPath}
												content={content}
												onChange={setContent}
												loading={fileLoading}
												error={fileError}
												dirty={dirty}
												diskBaseline={lastPersistedContent}
												filePreview={filePreview}
												onSave={async () => {
													await save();
													await refresh();
												}}
												onCursor={onCursor}
												compact
												showExplorerHint={false}
												onOpenWorkspace={refresh}
												technicalEditorChrome={editorTechnicalChromeMain}
												wordWrap={chrome.editorWordWrap}
												showBreadcrumbs={chrome.breadcrumbsVisible}
												onFindInFiles={openWorkspaceSearch}
												onReplaceInFiles={openWorkspaceSearch}
												onUndoRedoStackChange={bumpEditorMenu}
												onSelectionPrefsChange={bumpSelectionPrefs}
											/>
										</div>
										{workspaceLowerToolDock}
									</div>
									<button
										type="button"
										title="Show agent panel"
										aria-label="Show agent panel"
										onClick={() => updateDockLayout({ agentPanelVisible: true })}
										className="flex w-7 shrink-0 flex-col items-center justify-center gap-1 border-l border-[#252526] bg-[#333333] py-2 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
									>
										<MessageSquare size={16} className="shrink-0 opacity-90" />
										<span
											className="max-w-[1.25rem] text-center font-mono text-[8px] uppercase leading-tight tracking-tight text-[#858585]"
											style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
										>
											Agents
										</span>
									</button>
								</div>
							)}
						</div>
						{!dockLayout.agentPanelVisible ? (
							<AgentSessionComposerBar
								connected={session.connected}
								streaming={session.streaming}
								queuePending={session.chatQueuePending}
								onSend={session.sendChat}
								onRevealAgents={() => updateDockLayout({ agentPanelVisible: true })}
							/>
						) : null}
					</div>
				</main>
			</div>

			{chrome.statusBarVisible ? (
				<StatusBar
					uiMode={uiMode}
					workspaceRoot={(folders[0]?.path ?? root) || "—"}
					connected={session.connected}
					line={line}
					col={col}
					language={languageFromPath(selectedPath)}
					contextPct="—"
					tokensDown="—"
					tokensUp="—"
					onCopyWorkspacePath={copyWorkspacePath}
					chatMode={session.chatMode}
					chatAgentName={session.chatAgentName}
					technicalZedStrip={technicalZedStrip}
					technicalToolDock={{
						onReveal: (id) => focusToolTab(id),
						isVisible: (id) => toolDock.panels[id].visible,
						horizontalDockStrip: {
							bottom: {
								hasStrip: true,
								onToggle: () =>
									setHorizontalToolDockVisible((v) => ({ ...v, bottom: !v.bottom })),
								stripHidden: !horizontalToolDockVisible.bottom,
							},
						},
					}}
				/>
			) : null}
		</div>
	);
}
