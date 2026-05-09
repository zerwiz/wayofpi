import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type DragEvent,
	type MouseEvent,
	type SetStateAction,
} from "react";
import { MessageSquare } from "lucide-react";
import { apiGet, apiPostJson, apiPutJson } from "./api/client";
import { requestNativePick } from "./api/nativeDialog";
import { postWorkspaceOp } from "./api/workspace";
import { ActivityBar } from "./components/ActivityBar";
import { ChatPanel } from "./components/ChatPanel";
import { CommandPalette, type CommandItem } from "./components/CommandPalette";
import { AgentPermissionsModal } from "./components/AgentPermissionsModal";
import { HostDoctorModal } from "./components/HostDoctorModal";
import { HonchoSettingsModal } from "./components/HonchoSettingsModal";
import { IndexingDocsModal } from "./components/IndexingDocsModal";
import { InstallDebuggersModal } from "./components/InstallDebuggersModal";
import { HowToUseModal } from "./components/HowToUseModal";
import { MitLicenseModal } from "./components/MitLicenseModal";
import { RestartServerModal } from "./components/RestartServerModal";
import { LaunchConfigAddModal } from "./components/LaunchConfigAddModal";
import { NewPlanFileModal } from "./components/NewPlanFileModal";
import { NewWorkspaceFileModal } from "./components/NewWorkspaceFileModal";
import { LlmFixModal } from "./components/LlmFixModal";
import { TechnicalPrimarySidebar } from "./components/TechnicalPrimarySidebar";
import { DockSplitHandle } from "./components/DockSplitHandle";
import { ExplorerSidebar } from "./components/ExplorerSidebar";
import { MenuBar } from "./components/MenuBar";
import { SimpleApp } from "./components/simple/SimpleApp";
import type { SimpleTabId } from "./components/simple/SimpleNavRail";
import { ClawApp } from "./components/claw/ClawApp";
import { DocsApp } from "./components/docs/DocsApp";
import { WorkApp } from "./components/work";
import { WorkerPortal, ClientDashboard, AdminDashboard, SuperAdminDashboard, UserProfile } from "./pages";
import { Navigation } from "./components/Navigation";
import { ClawHelpModal, type ClawHelpSectionId } from "./components/claw/ClawHelpModal";
import type { ClawTabId } from "./components/claw/ClawNavRail";
import "./claw/clawUserUiModules";
import { StatusBar } from "./components/StatusBar";
import { WorkspaceStaticAnalysisProvider } from "./context/WorkspaceStaticAnalysisContext";
import type { WorkspaceStaticAnalysisContextValue } from "./context/WorkspaceStaticAnalysisContext";
import type { WorkspaceProblem } from "./types/workspaceProblems";
import { DocumentHandlerProvider } from "./components/documenthandler/context/DocumentHandlerContext";
import { TechnicalWorkspaceGrid, type TechnicalWorkspaceCellSnapshot } from "./components/TechnicalWorkspaceGrid";
import { WorkspaceCellDropSurface } from "./components/WorkspaceCellDropSurface";
import type { WorkspaceGridPickerConfig } from "./components/WorkspaceGridLayoutPicker";
import { WorkspacePane } from "./components/WorkspacePane";
import {
	ExtensionsSidePanel,
	PlanningSidePanel,
	ScmSidePanel,
	SearchSidePanel,
	SettingsSidePanel,
} from "./components/TechnicalSidePanels";
import { useAgents } from "./hooks/useAgents";
import { buildFilePutPayload, useFileEditor, type FilePersistEncoding } from "./hooks/useFileEditor";
import { useServerConfig } from "./hooks/useServerConfig";
import { useUiMode, type UiMode } from "./hooks/useUiMode";
import { useUiViewsCatalog } from "./hooks/useUiViewsCatalog";
import { useRunMenuDebugState } from "./hooks/useRunMenuDebugState";
import {
	readSimpleChatStreamUiEnabled,
	useSimplePreferences,
	writeSimpleChatStreamUiEnabled,
} from "./hooks/useSimplePreferences";
import {
	useWayOfPiSession,
	type ChatSessionMode,
	type ChatSessionSurfaceId,
} from "./hooks/useWayOfPiSession";
import { useWorkspaceTree } from "./hooks/useWorkspaceTree";
import { useWorkspaceStaticAnalysis } from "./hooks/useWorkspaceStaticAnalysis";
import type { PiModelConfigPath } from "./constants/piModelConfigPaths";
import { PI_MODEL_CONFIG_ENTRIES } from "./constants/piModelConfigPaths";
import type { FileMenuProps } from "./types/fileMenu";
import type {
	EditMenuHandlers,
	GoMenuHandlers,
	HelpMenuHandlers,
	RunMenuHandlers,
	SelectionMenuHandlers,
	SettingsMenuHandlers,
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
import { buildCodeWorkspacePayload } from "./utils/codeWorkspaceFile";
import { flattenTreeFiles, gitMarkedFilePathsSorted, nextGitReviewFilePath } from "./utils/flattenTree";
import { ancestorDirPaths, posixBasename, posixDirname } from "./utils/posixPath";
import { injectIntoChatComposer } from "./utils/chatComposerInjectBus";
import { buildImplementPlanPrompt, buildReviewPlanPrompt } from "./utils/planModeComposerTemplates";
import { createPlanArtifactInWorkspace } from "./utils/planModeWorkspace";
import { readAutoSaveInitial, writeAutoSave } from "./utils/editorPreferences";
import { chatErrorSuggestsModelFix } from "./utils/chatErrorModelHint";
import { workspaceAgentDisplayName } from "./utils/workspaceAgentDisplay";
import { pushRecentWorkspaceFolder, readRecentWorkspaceFolders } from "./utils/workspaceRecent";
import { absolutePathForSaveAsDefault, relativePathFromWorkspaceAbs } from "./utils/workspaceDiskPath";
import {
	applyAddFileTab,
	applyAddPanelTab,
	applyCloseToolTab,
	applyEnsureFileTab,
	applyFocusToolTab,
	applyPanelTabMove,
	applyRemoveFileTab,
	applyRemoveTab,
	remapFileTabPath,
	remapPathPrefixInDock,
	removeExplorerPathsFromDock,
	applyShowToolTab,
	cloneLayout,
	PANEL_DOCK_DEFAULTS,
	PANEL_TAB_DND_TYPE,
	parseFilePathDragJson,
	parsePanelTabJson,
	parseWorkspacePaneCellIndex,
	toolTabVisible,
	WOP_DND_SOURCE_CELL_TYPE,
	WOP_FILE_PATH_DND_TYPE,
	WOP_WORKSPACE_PANE_DND_TYPE,
	type PanelDockLayout,
	type PanelTab,
	type ToolTabId,
} from "./utils/panelDockLayout";
import {
	chatSizePxWhenSwitchingDock,
	clampBottomPanelHeight,
	clampChatHeight,
	clampChatWidth,
	clampLeftSidebarWidth,
	clampTopPanelHeight,
	DEFAULT_COMPACT_BOTTOM_CHAT_HEIGHT_PX,
	DOCK_DEFAULTS,
	readDockLayout,
	readLeftSidebarVisibleInitial,
	writeDockLayout,
	writeLeftSidebarVisible,
	type ChatDockRegion,
	type TechnicalDockLayout,
} from "./utils/technicalLayoutStorage";
import {
	readChromePreferences,
	writeChromePreferences,
	type ChromePreferences,
} from "./utils/chromePreferences";
import {
	applyWorkspaceGridColResizeDelta,
	applyWorkspaceGridRowResizeDelta,
	growWorkspaceGridForEdgeDrop,
	mapCellIndexAfterRemoval,
	nextFocusAfterRemove,
	readWorkspaceGridState,
	remapWorkspaceCellIndexAfterEdgeGrow,
	removeWorkspaceCellAt,
	resizeWorkspaceGrid,
	WORKSPACE_GRID_MAX_COLS,
	WORKSPACE_GRID_MAX_ROWS,
	writeWorkspaceGridState,
	type WorkspaceGridState,
} from "./utils/workspaceGridStorage";
import type { WopDropZone } from "./utils/workspaceDropZones";
import { computeWorkspaceFilePreview } from "./utils/workspaceFilePreview";
import { sendTerminalInput } from "./utils/terminalInputBridge";
import { mergeSnippetIntoLaunchJson, type LaunchSnippetId } from "./utils/launchJsonMutate";
import { getActiveFileDebugPlan, runActiveFileShellLine } from "./utils/terminalRunCommands";

function applyMovePanelTabBetweenCellsInGrid(
	g: WorkspaceGridState,
	from: number,
	to: number,
	tab: PanelTab,
	before: PanelTab | null,
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

/** Public source repo (Help menu links, View License on GitHub). */
const WOP_PUBLIC_REPO_URL = "https://github.com/zerwiz/wayofpi";

/** Help → Give Feedback — [WhyNot Productions contact](https://whynotproductions.netlify.app/contact/). */
const WOP_FEEDBACK_CONTACT_URL = "https://whynotproductions.netlify.app/contact/";
/** Help → Support us — maintainer home (same as About dialog “Home”). */
const WOP_SUPPORT_HOME_URL = "https://whynotproductions.netlify.app/";

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

const isPortal = window.location.pathname === "/portal" || window.location.pathname.startsWith("/portal/");
const isClient = window.location.pathname === "/client" || window.location.pathname.startsWith("/client/");
const isAdmin = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");
const isSuperAdmin = window.location.pathname === "/super-admin" || window.location.pathname.startsWith("/super-admin/");
const isProfile = window.location.pathname === "/profile" || window.location.pathname.startsWith("/profile/");

export default function App() {
	const { mode: uiMode, setMode: setUiMode } = useUiMode();
	useEffect(() => {
		if (!technical || !staticAnalysisEnabled) return;
		if (prevEffDirtyForProblems.current && !effDirty && effSelectedPath) {
			workspaceStaticAnalysis.scheduleDebouncedRefresh();
		}
		prevEffDirtyForProblems.current = effDirty;
	}, [
		effDirty,
		effSelectedPath,
		technical,
		staticAnalysisEnabled,
		workspaceStaticAnalysis.scheduleDebouncedRefresh,
	]);

	const onOpenToolPanel = useCallback((tab: BottomPanelTab) => {
		setPanelDock((prev) => applyShowToolTab(prev, tab as ToolTabId));
	}, []);

	useEffect(() => {
		writeChromePreferences(chrome);
	}, [chrome]);

	const persistLeftSidebar = useCallback((visible: boolean) => {
		setLeftSidebarVisible(visible);
		writeLeftSidebarVisible(visible);
	}, []);

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
			if (uiMode === "technical" && (workspaceGrid.cols > 1 || workspaceGrid.rows > 1)) {
				setWorkspaceOpenSignal((s) => ({ path, rev: (s?.rev ?? 0) + 1 }));
			} else {
				setSelectedPath(path);
			}
			setExplorerContextDir(posixDirname(path));
			if (uiMode === "technical") {
				setActivity("explorer");
				persistLeftSidebar(true);
			} else if (uiMode === "claw") {
				setClawTab("files");
			}
		},
		[persistLeftSidebar, uiMode, workspaceGrid.cols, workspaceGrid.rows],
	);

	const openPiModelConfigInSimpleBrains = useCallback((path: PiModelConfigPath) => {
		setSimpleTab("models");
		setSimpleProviderPath(path);
		setSimpleProviderNonce((n) => n + 1);
	}, []);

	const dismissLlmFixModal = useCallback(() => setLlmFixModalDismissed(true), []);
	const reopenLlmFixModal = useCallback(() => setLlmFixModalDismissed(false), []);

	const openLlmFixSimpleBrains = useCallback(() => {
		dismissLlmFixModal();
		queueMicrotask(() => {
			if (technical) setUiMode("simple");
			setSimpleTab("models");
		});
	}, [dismissLlmFixModal, technical, setUiMode]);

	const openLlmFixProviderCatalog = useCallback(() => {
		dismissLlmFixModal();
		queueMicrotask(() => {
			openPiModelConfigInEditor("agent/models.json");
		});
	}, [dismissLlmFixModal, openPiModelConfigInEditor]);

	/** Menu Settings → My Team (Pi `.pi/agents/*.md`, `teams.yaml`); Technical mode switches to Simple so the view exists. */
	const openAgentSetupFromMenu = useCallback(() => {
		setUiMode("simple");
		setSimpleTab("team");
	}, []);

	/** Open a workspace-relative file from the menu (Technical: explorer / grid; Simple: editor + chat layout). */
	const focusWorkspaceFileFromMenu = useCallback(
		(rel: string) => {
			setExplorerContextDir(posixDirname(rel));
			if (uiMode === "simple") {
				setSelectedPath(rel);
				setSimpleTab("chat");
			} else if (uiMode === "claw") {
				setSelectedPath(rel);
				setClawTab("files");
			} else {
				if (workspaceGrid.cols > 1 || workspaceGrid.rows > 1) {
					setWorkspaceOpenSignal((s) => ({ path: rel, rev: (s?.rev ?? 0) + 1 }));
				} else {
					setSelectedPath(rel);
				}
				setActivity("explorer");
				persistLeftSidebar(true);
			}
		},
		[uiMode, workspaceGrid.cols, workspaceGrid.rows, persistLeftSidebar],
	);
	focusAgentWrittenWorkspaceFileRef.current = focusWorkspaceFileFromMenu;

	const openTeamsYamlFromMenu = useCallback(() => {
		const rel = agentsApi.data?.teamsPath ?? ".pi/agents/teams.yaml";
		focusWorkspaceFileFromMenu(rel);
	}, [agentsApi.data?.teamsPath, focusWorkspaceFileFromMenu]);

	const createNewAgentMarkdownFromMenu = useCallback(() => {
		const teamsPath = agentsApi.data?.teamsPath;
		const baseDir = teamsPath ? posixDirname(teamsPath) : ".pi/agents";
		const raw = window.prompt(
			"New agent id (filename and YAML name; letters, numbers, -, _, .)",
			"my-agent",
		);
		if (raw == null) return;
		const trimmed = raw.trim().replace(/\.md$/i, "");
		if (!trimmed || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(trimmed)) {
			window.alert("Use a non-empty id: letters, digits, hyphen, underscore, or dot (no slashes).");
			return;
		}
		const rel = `${baseDir}/${trimmed}.md`;
		const content = `---
name: ${trimmed}
description:
---

`;
		void (async () => {
			try {
				await apiPutJson<{ ok: boolean }>("/api/file", { path: rel, content });
				setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(rel) });
				await refresh();
				focusWorkspaceFileFromMenu(rel);
				agentsApi.reload();
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		})();
	}, [agentsApi.data?.teamsPath, agentsApi.reload, focusWorkspaceFileFromMenu, refresh]);

	const settingsMenuHandlers = useMemo<SettingsMenuHandlers>(
		() => ({
			onOpenSimpleAppSettings: () => {
				setUiMode("simple");
				setSimpleTab("settings");
			},
			onOpenAiBrains: () => {
				setUiMode("simple");
				setSimpleTab("models");
			},
			onOpenProjects: () => {
				setUiMode("simple");
				setSimpleTab("projects");
			},
			onOpenIndexingDocs: () => {
				setIndexingDocsOpen(true);
			},
			onOpenHonchoSettings: () => {
				setHonchoSettingsOpen(true);
			},
			onEditWorkspaceViewsCatalog: () => {
				const rel = uiViewsCatalog.data?.catalogRelPath ?? ".wayofpi/ui-views.json";
				setUiMode("simple");
				setSelectedPath(rel);
				setSimpleTab("chat");
			},
			onRestartServer: () => {
				setRestartServerModalOpen(true);
			},
		}),
		[uiViewsCatalog.data?.catalogRelPath],
	);

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

	const handleExplorerMoveFile = useCallback(
		async (from: string, toDir: string) => {
			const destPreview = toDir ? `${toDir}/${posixBasename(from)}` : posixBasename(from);
			if (destPreview.replace(/\/+$/, "") === from.replace(/\/+$/, "")) return;
			if (effDirty && effSelectedPath === from) {
				window.alert("Save or revert the open file before moving it.");
				return;
			}
			try {
				const r = await apiPostJson<{ ok: boolean; to: string }>("/api/fs/move", { from, toDir });
				const toPath = r.to;
				setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(toPath) });
				setWorkspaceGrid((g) => {
					const cells = g.cells.map((dock) => remapFileTabPath(dock, from, toPath));
					const out = { ...g, cells };
					writeWorkspaceGridState(out);
					return out;
				});
				if (selectedPath === from) setSelectedPath(toPath);
				await refresh();
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		},
		[effDirty, effSelectedPath, selectedPath, refresh],
	);

	const handleExplorerCopyPath = useCallback((path: string) => {
		void navigator.clipboard.writeText(path).catch(() => {
			window.alert("Could not copy to the clipboard.");
		});
	}, []);

	const handleExplorerRenameNode = useCallback(
		async (path: string, kind: "file" | "dir", currentName: string) => {
			const next = window.prompt(`Rename ${kind}`, currentName);
			if (next == null) return;
			const safe = sanitizeNewEntryName(next);
			if (!safe) {
				window.alert("Invalid name: no .. or empty segments; avoid slashes.");
				return;
			}
			if (safe === currentName) return;
			if (
				effDirty &&
				effSelectedPath &&
				(effSelectedPath === path || (kind === "dir" && effSelectedPath.startsWith(`${path}/`)))
			) {
				window.alert("Save or revert open file(s) before renaming.");
				return;
			}
			try {
				const r = await apiPostJson<{ ok: boolean; to: string }>("/api/fs/rename", { from: path, newName: safe });
				const toPath = r.to;
				setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(toPath) });
				setWorkspaceGrid((g) => {
					const cells = g.cells.map((dock) =>
						kind === "dir" ? remapPathPrefixInDock(dock, path, toPath) : remapFileTabPath(dock, path, toPath),
					);
					const out = { ...g, cells };
					writeWorkspaceGridState(out);
					return out;
				});
				setSelectedPath((p) => {
					if (!p) return p;
					if (kind === "file") return p === path ? toPath : p;
					if (p === path) return toPath;
					if (p.startsWith(`${path}/`)) return `${toPath}/${p.slice(path.length + 1)}`;
					return p;
				});
				await refresh();
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		},
		[effDirty, effSelectedPath, refresh],
	);

	const handleExplorerDeleteNode = useCallback(
		async (path: string, kind: "file" | "dir") => {
			const label =
				kind === "dir"
					? `folder “${posixBasename(path)}” and everything inside it`
					: `“${posixBasename(path)}”`;
			if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
			if (
				effDirty &&
				effSelectedPath &&
				(effSelectedPath === path || (kind === "dir" && effSelectedPath.startsWith(`${path}/`)))
			) {
				window.alert("Save or revert open file(s) before deleting.");
				return;
			}
			try {
				await apiPostJson<{ ok: boolean }>("/api/fs/delete", { path });
				setWorkspaceGrid((g) => {
					const cells = g.cells.map((dock) => removeExplorerPathsFromDock(dock, path, kind));
					const out = { ...g, cells };
					writeWorkspaceGridState(out);
					return out;
				});
				setSelectedPath((p) => {
					if (!p) return p;
					if (p === path || (kind === "dir" && p.startsWith(`${path}/`))) return null;
					return p;
				});
				await refresh();
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		},
		[effDirty, effSelectedPath, refresh],
	);

	const [newPlanFileModalOpen, setNewPlanFileModalOpen] = useState(false);

	const handleNewPlanFile = useCallback(() => {
		if (!workspaceOperational) {
			window.alert("No workspace loaded — use File → Open Folder, or wait until the file tree finishes loading.");
			return;
		}
		setNewPlanFileModalOpen(true);
	}, [workspaceOperational]);

	const handleNewPlanFileCreate = useCallback(
		async (title: string, slugSuggestion: string) => {
			setNewPlanFileModalOpen(false);
			try {
				const { path } = await createPlanArtifactInWorkspace({ slugSuggestion, title });
				setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(path) });
				await refresh();
				setSelectedPath(path);
				if (uiMode === "claw") {
					// Stay in Claw mode — open the plan file in the Files tab
					setClawTab("files");
				} else if (technical) {
					setUiMode("technical");
					persistLeftSidebar(true);
					setActivity("explorer");
				} else {
					setSimpleTab("chat");
				}
			} catch (e) {
				window.alert(e instanceof Error ? e.message : String(e));
			}
		},
		[persistLeftSidebar, refresh, setActivity, setClawTab, setSelectedPath, setSimpleTab, setUiMode, technical, uiMode],
	);

	const orchestratorPlanBootstrapLockRef = useRef(false);

	/**
	 * When Plan mode is active as Orchestrator and the workspace has no `plans/PLAN-*.md` yet,
	 * create `plans/PLAN-<date>-session.md` (toolbar, `/plan`, reconnect, or saved Plan preference).
	 */
	const tryOrchestratorPlanArtifactBootstrap = useCallback(
		(agentName: string | null) => {
			if (agentName != null) return;
			const hasWorkspace = Boolean(root) || folders.length > 0;
			if (!hasWorkspace) return;
			if (orchestratorPlanBootstrapLockRef.current) return;
			orchestratorPlanBootstrapLockRef.current = true;
			void (async () => {
				try {
					const d = await apiGet<{ files: Array<{ path: string }> }>("/api/plans");
					if ((d.files?.length ?? 0) > 0) return;
					const { path } = await createPlanArtifactInWorkspace({
						slugSuggestion: "session",
						title: "Plan",
					});
					setTreeExpand({ rev: Date.now(), paths: ancestorDirPaths(path) });
					await refresh();
					setSelectedPath(path);
				} catch {
					/* user can create manually via File: New plan markdown */
				} finally {
					orchestratorPlanBootstrapLockRef.current = false;
				}
			})();
		},
		[folders.length, refresh, root],
	);

	useEffect(() => {
		if (!session.connected) return;
		if (session.chatMode !== "plan") return;
		tryOrchestratorPlanArtifactBootstrap(session.chatAgentName);
	}, [
		session.connected,
		session.chatMode,
		session.chatAgentName,
		tryOrchestratorPlanArtifactBootstrap,
	]);

	/** Plan mode: server prompt via WebSocket; Orchestrator + empty workspace plans → seed `plans/PLAN-*.md`. */
	const handleChatModeChange = useCallback(
		(m: Parameters<typeof session.setChatMode>[0]) => {
			const agentAtClick = session.chatAgentName;
			session.setChatMode(m);
			if (m === "plan" && !technical) {
				setSelectedPath((p) => {
					if (!p) return null;
					const norm = p.replace(/\\/g, "/");
					if (/(^|\/)plans\/plan-[^/]+\.md$/i.test(norm)) return null;
					return p;
				});
			}
			if (m !== "plan") return;
			tryOrchestratorPlanArtifactBootstrap(agentAtClick);
		},
		[
			session.chatAgentName,
			session.setChatMode,
			setSelectedPath,
			technical,
			tryOrchestratorPlanArtifactBootstrap,
		],
	);

	/** Technical shell: show Planning in the primary sidebar while Plan chat mode is on; restore shell when leaving Plan. */
	const prevTechnicalChatModeRef = useRef<ChatSessionMode | null>(null);
	const latestShellForPlanRef = useRef<{ activity: TechnicalActivity; leftSidebarVisible: boolean }>({
		activity: "explorer",
		leftSidebarVisible: true,
	});
	const shellBeforePlanRef = useRef<{ activity: TechnicalActivity; leftSidebarVisible: boolean } | null>(null);
	latestShellForPlanRef.current = { activity, leftSidebarVisible };

	useEffect(() => {
		if (!technical) return;
		/** Plan sidebar layout is Technical-only; Claw has its own chat `surfaceId` and must not drive this ref. */
		if (uiMode !== "technical") return;
		const prev = prevTechnicalChatModeRef.current;
		const mode = session.chatMode;
		prevTechnicalChatModeRef.current = mode;

		if (mode === "plan") {
			if (prev !== "plan") {
				shellBeforePlanRef.current = { ...latestShellForPlanRef.current };
				persistLeftSidebar(true);
				setActivity("planning");
			}
			return;
		}

		if (prev === "plan") {
			const snap = shellBeforePlanRef.current;
			shellBeforePlanRef.current = null;
			if (snap) {
				setActivity(snap.activity);
				persistLeftSidebar(snap.leftSidebarVisible);
			}
		} else {
			shellBeforePlanRef.current = null;
		}
		// `latestShellForPlanRef` is updated each render; do not list `activity` / `leftSidebarVisible` here or the effect would fire on every sidebar change while in Plan.
	}, [persistLeftSidebar, session.chatMode, technical, uiMode]);

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
	}, [
		effSelectedPath,
		effFileLoading,
		effFileError,
		uiMode,
		simpleTab,
		bumpEditorMenu,
		isWsMulti,
		techWsSnapshot?.panelDock?.activeIndex,
		techWsSnapshot?.panelDock?.tabs,
		panelDock.activeIndex,
		panelDock.tabs,
	]);

	const editMenu = useMemo((): EditMenuHandlers => {
		const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
		const inSimpleFileSurface = uiMode === "simple" && simpleTab === "chat";
		const inTechnicalSurface = technical;
		const dockForEditMenu = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;
		const activeDockTab = dockForEditMenu.tabs[dockForEditMenu.activeIndex];
		const fileTabFocusedInPane = activeDockTab?.type === "file";
		const bufferMounted = Boolean(workspaceEditorRef.current);
		const canEdit =
			fileReady &&
			(inSimpleFileSurface || inTechnicalSurface) &&
			(inSimpleFileSurface ? bufferMounted : fileTabFocusedInPane && bufferMounted);
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
		effSelectedPath,
		effFileLoading,
		effFileError,
		technical,
		simpleTab,
		uiMode,
		isWsMulti,
		techWsSnapshot,
		panelDock,
		editorMenuTick,
		bumpEditorMenu,
		openWorkspaceSearch,
	]);

	const selectionMenu = useMemo((): SelectionMenuHandlers => {
		const ed = workspaceEditorRef.current;
		const fileReady = !!effSelectedPath && !effFileLoading && !effFileError;
		const inSimpleFileSurface = uiMode === "simple" && simpleTab === "chat";
		const inTechnicalSurface = technical;
		const dockForEditMenu = isWsMulti ? (techWsSnapshot?.panelDock ?? panelDock) : panelDock;
		const activeDockTab = dockForEditMenu.tabs[dockForEditMenu.activeIndex];
		const fileTabFocusedInPane = activeDockTab?.type === "file";
		const bufferMounted = Boolean(workspaceEditorRef.current);
		const canEdit =
			fileReady &&
			(inSimpleFileSurface || inTechnicalSurface) &&
			(inSimpleFileSurface ? bufferMounted : fileTabFocusedInPane && bufferMounted);
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
				onChatModeChange={handleChatModeChange}
				streaming={session.streaming}
				hasWorkspace={!!root || folders.length > 0}
				onNewPlanFile={() => void handleNewPlanFile()}
			/>
		) : (
			<SettingsSidePanel
				config={config}
				workspaceRoot={folders[0]?.path ?? root ?? ""}
				onOpenPiModelConfig={openPiModelConfigInEditor}
			/>
		);

	const anyPageActive = isPortal || isClient || isAdmin || isProfile || isSuperAdmin;
	if (isPortal) {
		return <WorkerPortal uiMode={uiMode} setUiMode={setUiMode} />;
	}
	if (isClient) {
		return <ClientDashboard uiMode={uiMode} setUiMode={setUiMode} />;
	}
	if (isAdmin) {
		return <AdminDashboard uiMode={uiMode} setUiMode={setUiMode} />;
	}
	if (isSuperAdmin) {
		return <SuperAdminDashboard uiMode={uiMode} setUiMode={setUiMode} />;
	}
	if (isProfile) {
		return <UserProfile uiMode={uiMode} setUiMode={setUiMode} />;
	}

	// ── Claw shell ───────────────────────────────────────────────
	if (uiMode === "claw") {
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
				<div className="flex h-screen w-full flex-col overflow-hidden font-sans selection:bg-[#9a3412]">
					<MenuBar
						modelLabel={modelLabel}
						uiMode={uiMode}
						onUiModeChange={setUiMode}
						config={config}
						onOpenCommandPalette={() => setCommandPaletteOpen(true)}
						onSave={saveAndRefresh}
						canSave={!!selectedPath && dirty}
						onRevertFile={() => void reload()}
						canRevert={!!selectedPath && dirty}
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
						onOpenAgentSetup={openAgentSetupFromMenu}
						onOpenAgentPermissions={() => setAgentPermissionsOpen(true)}
						settingsMenu={settingsMenuHandlers}
						onOpenTeamsYaml={openTeamsYamlFromMenu}
						onCreateAgentMarkdown={createNewAgentMarkdownFromMenu}
						onReloadAgents={agentsApi.reload}
						onOpenPiModelConfig={openPiModelConfigInSimpleBrains}
						chatSessionControls={{
							mode: session.chatMode,
							switchDisabled: session.streaming,
							onSetMode: handleChatModeChange,
						}}
						onNewPlanFile={() => void handleNewPlanFile()}
						newPlanFileDisabled={!workspaceOperational}
						viewSimple={viewSimpleMenu ?? undefined}
					/>
					<ClawApp
						refreshTreeQuiet={refreshTreeQuietShell}
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
						persistEncoding={persistEncoding}
						fileMimeType={fileMimeType}
						fileLoading={fileLoading}
						fileError={fileError}
						dirty={dirty}
						save={save}
						discardUnsavedChanges={discardUnsavedChanges}
						line={line}
						col={col}
						onCursor={onCursor}
					rows={session.rows}
					logs={session.logs}
					chatTabs={session.chatTabs}
					activeChatTabId={session.activeChatTabId ?? ''}
					onSelectChatTab={session.selectChatTab}
					onCloseChatTab={session.closeChatTab}
					onRenameChatTab={session.renameChatTab}
					onNewSession={session.startNewSession}
					streaming={session.streaming}
					chatStreamUiEnabled={simpleChatStreamUiEnabled}
					onChatStreamUiEnabledChange={onSimpleChatStreamUiEnabledChange}
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
					onReopenLlmFixModal={reopenLlmFixModal}
					chatAgentName={session.chatAgentName}
					dispatchTurnAgent={session.chatAgentName}
					onChatAgentChange={session.setChatAgent}
					chatMode={session.chatMode}
					onChatModeChange={handleChatModeChange}
					activeTab={clawTab}
					onTabChange={setClawTab}
						providerConfigInitialPath={simpleProviderPath}
						providerConfigInitialNonce={simpleProviderNonce}
						onConsumeProviderConfigFocus={consumeSimpleProviderFocus}
						workspaceEditorRef={workspaceEditorRef}
						onUndoRedoStackChange={bumpEditorMenu}
						onSelectionPrefsChange={bumpSelectionPrefs}
						onFindInFiles={openWorkspaceSearch}
						onReplaceInFiles={openWorkspaceSearch}
						teamsYamlWritePath={teamsYamlWritePath}
						workspaceReady={workspaceOperational}
						onOpenTeamsYaml={openTeamsYamlFromMenu}
						onCreateAgentDefinition={createNewAgentMarkdownFromMenu}
						onNewPlanFile={() => void handleNewPlanFile()}
						newPlanFileDisabled={!workspaceOperational}
					onOpenIndexingDocs={() => setIndexingDocsOpen(true)}
					onOpenHostDoctor={openHostDoctor}
					onHelp={(section) => {
						setClawHelpDefaultSection(section ?? null);
						setClawHelpOpen(true);
					}}
					contextPct={String(session.tokenMeter.contextPct ?? 0)}
					contextFillPct={session.chatPulseMeters?.contextFillPct ?? null}
					tokensDown={session.tokenMeter.tokensDown}
					tokensUp={session.tokenMeter.tokensUp}
					contextTitle={session.tokenMeter.contextTitle ?? ''}
					tokensTitle={session.tokenMeter.tokensTitle ?? ''}
					onMoveFileToDirectory={handleExplorerMoveFile}
					allowWorkspaceRootDrop={folders.length === 1}
				/>
			</div>
				<CommandPalette
					open={commandPaletteOpen}
					onClose={() => setCommandPaletteOpen(false)}
					items={simpleCommandItems}
				/>
				<LlmFixModal
					open={showLlmFixModal}
					onClose={dismissLlmFixModal}
					onClearError={session.clearError}
					errorMessage={session.error ?? ""}
					appearanceDark={llmFixModalAppearanceDark}
					uiMode={uiMode}
					onOpenSimpleAiBrains={openLlmFixSimpleBrains}
					onOpenProviderCatalog={openLlmFixProviderCatalog}
				/>
				<HostDoctorModal
					open={hostDoctorOpen}
					onClose={() => setHostDoctorOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
					onWorkspaceFileSaved={() => void refresh()}
				/>
				<IndexingDocsModal
					open={indexingDocsOpen}
					onClose={() => setIndexingDocsOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
				/>
				<HonchoSettingsModal
					open={honchoSettingsOpen}
					onClose={() => setHonchoSettingsOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
					integrationDocUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/docs/HONCHO_INTEGRATION.md`}
				/>
				<AgentPermissionsModal
					open={agentPermissionsOpen}
					onClose={() => setAgentPermissionsOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
				/>
			<MitLicenseModal
				open={mitLicenseModalOpen}
				onDismiss={() => setMitLicenseModalOpen(false)}
				repoLicenseUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/LICENSE`}
			/>
			<RestartServerModal
				open={restartServerModalOpen}
				onClose={() => setRestartServerModalOpen(false)}
				appearanceDark={llmFixModalAppearanceDark}
				onReconnectIfStillUp={session.reconnectWebSocket}
			/>
			<ClawHelpModal
				open={clawHelpOpen}
				onDismiss={() => {
					setClawHelpOpen(false);
					setClawHelpDefaultSection(null);
				}}
				defaultSection={clawHelpDefaultSection}
				connected={session.connected}
				streaming={session.streaming}
				onGoToTelegramChannels={() => setClawTab("channels")}
				onFocusClawChatTab={() => setClawTab("chat")}
			/>
			<NewPlanFileModal
				open={newPlanFileModalOpen}
				onDismiss={() => setNewPlanFileModalOpen(false)}
				onCreate={(title, slug) => void handleNewPlanFileCreate(title, slug)}
			/>
		</>
	);
}

	// ── Docs shell ────────────────────────────────────────────────
	if (uiMode === "docs") {
		return (
			<DocumentHandlerProvider>
				<DocsApp
					uiMode={uiMode}
					setUiMode={setUiMode}
					nodes={nodes}
					treeLoading={treeLoading}
					treeError={treeError}
					refreshTree={refresh}
					selectedPath={selectedPath}
					setSelectedPath={setSelectedPath}
					rows={session.rows}
					streaming={session.streaming}
					connected={session.connected}
					sendChat={(text) => void session.sendChat(session.chatAgentName ?? '', text)}
					stop={session.stop}
				/>
			</DocumentHandlerProvider>
		);
	}

	// ── Work shell ────────────────────────────────────────────────
	if (uiMode === "work") {
		return (
			<WorkApp
				uiMode={uiMode}
				setUiMode={setUiMode}
			/>
		);
	}

	// ── Simple shell ───────────────────────────────────────────────
	if (uiMode === "simple") {
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
						canRevert={!!selectedPath && dirty}
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
						onOpenAgentSetup={openAgentSetupFromMenu}
						onOpenAgentPermissions={() => setAgentPermissionsOpen(true)}
						settingsMenu={settingsMenuHandlers}
						onOpenTeamsYaml={openTeamsYamlFromMenu}
						onCreateAgentMarkdown={createNewAgentMarkdownFromMenu}
						onReloadAgents={agentsApi.reload}
						onOpenPiModelConfig={openPiModelConfigInSimpleBrains}
						chatSessionControls={{
							mode: session.chatMode,
							switchDisabled: session.streaming,
							onSetMode: handleChatModeChange,
						}}
						onNewPlanFile={() => void handleNewPlanFile()}
						newPlanFileDisabled={!workspaceOperational}
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
						refreshTreeQuiet={refreshTreeQuietShell}
						modelLabel={modelLabel}
						config={config}
						effectiveModel={session.effectiveModel}
						onSelectLlmModel={session.setLlmModel}
						selectedPath={selectedPath}
						setSelectedPath={setSelectedPath}
						content={content}
						setContent={setContent}
						persistEncoding={persistEncoding}
						fileMimeType={fileMimeType}
						fileLoading={fileLoading}
						fileError={fileError}
						dirty={dirty}
						save={save}
						discardUnsavedChanges={discardUnsavedChanges}
						line={line}
						col={col}
						onCursor={onCursor}
						rows={session.rows}
						logs={session.logs}
						streaming={session.streaming}
						chatStreamUiEnabled={simpleChatStreamUiEnabled}
						onChatStreamUiEnabledChange={onSimpleChatStreamUiEnabledChange}
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
						onReopenLlmFixModal={reopenLlmFixModal}
						chatAgentName={session.chatAgentName}
						dispatchTurnAgent={session.chatAgentName}
						onChatAgentChange={session.setChatAgent}
						chatMode={session.chatMode}
						onChatModeChange={handleChatModeChange}
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
					teamsYamlWritePath={teamsYamlWritePath}
					workspaceReady={workspaceOperational}
					onOpenTeamsYaml={openTeamsYamlFromMenu}
					onCreateAgentDefinition={createNewAgentMarkdownFromMenu}
				onOpenFolder={handleOpenFolderPrompt}
				onOpenRecentFolder={handleOpenRecentFolder}
				recentFolders={recentFolders}
				onHelp={() => setHowToUseModalOpen(true)}
				onConfigRefresh={refreshServerConfig}
				onNewPlanFile={() => void handleNewPlanFile()}
					newPlanFileDisabled={!workspaceOperational}
					onOpenIndexingDocs={() => setIndexingDocsOpen(true)}
					contextPct={String(session.tokenMeter.contextPct ?? 0)}
					contextFillPct={session.chatPulseMeters?.contextFillPct ?? null}
					tokensDown={session.tokenMeter.tokensDown}
					tokensUp={session.tokenMeter.tokensUp}
				contextTitle={session.tokenMeter.contextTitle ?? ''}
				tokensTitle={session.tokenMeter.tokensTitle ?? ''}
				planHandoffWorkspaceKey={planHandoffWorkspaceKey}
				onMoveFileToDirectory={handleExplorerMoveFile}
				allowWorkspaceRootDrop={folders.length === 1}
			/>
				</div>
				<CommandPalette
					open={commandPaletteOpen}
					onClose={() => setCommandPaletteOpen(false)}
					items={simpleCommandItems}
				/>
				<LlmFixModal
					open={showLlmFixModal}
					onClose={dismissLlmFixModal}
					onClearError={session.clearError}
					errorMessage={session.error ?? ""}
					appearanceDark={llmFixModalAppearanceDark}
					uiMode={uiMode}
					onOpenSimpleAiBrains={openLlmFixSimpleBrains}
					onOpenProviderCatalog={openLlmFixProviderCatalog}
				/>
				<HostDoctorModal
					open={hostDoctorOpen}
					onClose={() => setHostDoctorOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
					onWorkspaceFileSaved={() => void refresh()}
				/>
				<IndexingDocsModal
					open={indexingDocsOpen}
					onClose={() => setIndexingDocsOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
				/>
				<HonchoSettingsModal
					open={honchoSettingsOpen}
					onClose={() => setHonchoSettingsOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
					integrationDocUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/docs/HONCHO_INTEGRATION.md`}
				/>
				<AgentPermissionsModal
					open={agentPermissionsOpen}
					onClose={() => setAgentPermissionsOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
				/>
				<NewWorkspaceFileModal
					open={newWorkspaceFileDraft != null}
					defaultPath={newWorkspaceFileDraft?.defaultPath ?? ""}
					initialContent={newWorkspaceFileDraft?.initialContent}
					onDismiss={() => setNewWorkspaceFileDraft(null)}
					onCreate={(path, ic) => {
						setNewWorkspaceFileDraft(null);
						void performCreateNewWorkspaceFile(path, ic);
					}}
				/>
				<LaunchConfigAddModal
					open={launchConfigAddOpen}
					onDismiss={() => setLaunchConfigAddOpen(false)}
					onPick={(id) => void appendLaunchConfigurationSnippet(id)}
				/>
				<InstallDebuggersModal
					open={installDebuggersModalOpen}
					onDismiss={() => setInstallDebuggersModalOpen(false)}
				/>
				<MitLicenseModal
					open={mitLicenseModalOpen}
					onDismiss={() => setMitLicenseModalOpen(false)}
					repoLicenseUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/LICENSE`}
				/>
				<RestartServerModal
					open={restartServerModalOpen}
					onClose={() => setRestartServerModalOpen(false)}
					appearanceDark={llmFixModalAppearanceDark}
					onReconnectIfStillUp={session.reconnectWebSocket}
				/>
				<HowToUseModal
					open={howToUseModalOpen}
					onDismiss={() => setHowToUseModalOpen(false)}
					repoBlobBase={`${WOP_PUBLIC_REPO_URL}/blob/main`}
				/>
			</>
		);
	}

	const workspaceEditorBody = isWsMulti ? (
		<TechnicalWorkspaceGrid
			grid={workspaceGrid}
			onPatchCell={patchWorkspaceCellDock}
			focusedCell={wsFocusedCell}
			onFocusCell={setWsFocusedCell}
			onFocusedReport={onTechFocusedReport}
			onFocusedCursor={onTechFocusedCursor}
			workspaceEditorRef={workspaceEditorRef}
			logs={session.logs}
			fileActions={workspaceDockFileActions}
			onOpenToolPanelForCell={onOpenToolPanelForCell}
			onOpenWorkspace={refresh}
			workspaceDockActions={workspaceDockActionsMain}
			wordWrap={chrome.editorWordWrap}
			showBreadcrumbs={chrome.breadcrumbsVisible}
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
			splitEditorDisabled={workspaceGrid.cols >= WORKSPACE_GRID_MAX_COLS}
			maximizedCell={wsMaximizedCell}
			onToggleMaximizeCell={onToggleWorkspaceMaximizeCell}
			onRemoveWorkspaceCell={removeWorkspaceCellFromGrid}
			workspaceGridPicker={workspaceGridToolbar}
				agentTeamPane={agentTeamWorkspacePane as any}
			workspaceEmbeddedChat={workspaceEmbeddedChat}
			onCrossCellTabMoveBetweenCells={movePanelTabBetweenCells}
			onWorkspaceGridRowResize={onWorkspaceGridRowResize}
			onWorkspaceGridColResize={onWorkspaceGridColResize}
			onBindMultiCellSaveApi={onBindMultiCellSaveApi}
			onMultiCellAnyDirtyChange={onMultiCellAnyDirtyChange}
			breadcrumbWorkspaceLabel={rootLabel || null}
			workspaceTreeNodes={nodes}
			refreshQuiet={refreshQuiet as any}
		/>
	) : (
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
				onSelectFileTab={onSelectFileFromWorkspaceTab}
				onReorderTab={onDockEntryMove}
				onCloseTab={onDockEntryClose}
				onAddTool={onOpenToolPanel}
				fileActions={workspaceDockFileActions}
				logs={session.logs}
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
				wordWrap={chrome.editorWordWrap}
				showBreadcrumbs={chrome.breadcrumbsVisible}
				onFindInFiles={openWorkspaceSearch}
				onReplaceInFiles={openWorkspaceSearch}
				onUndoRedoStackChange={bumpEditorMenu}
				onSelectionPrefsChange={bumpSelectionPrefs}
				dndSourceCellIndex={0}
				onExternalFileDrop={(path, before) => {
					setPanelDock((prev) => {
						const next = applyAddFileTab(prev, path);
						const moving: PanelTab = { type: "file", path };
						return applyPanelTabMove(next, moving, before);
					});
				}}
				onSplitEditorRight={splitEditorRight}
				splitEditorDisabled={workspaceGrid.cols >= WORKSPACE_GRID_MAX_COLS}
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

	return (
		<WorkspaceStaticAnalysisProvider value={workspaceStaticAnalysisApi}>
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
					canSave={!!effSelectedPath && effDirty}
					onRevertFile={() => void reloadFocusedOrMain()}
					canRevert={!!effSelectedPath && effDirty}
					onRefreshWorkspace={refresh}
					onCopyWorkspacePath={copyWorkspacePath}
					onSelectActivity={selectActivityWithSidebar}
					onFocusBottomTab={focusToolTab}
					leftSidebarVisible={leftSidebarVisible}
					onToggleLeftSidebar={toggleLeftSidebar}
					agentPanelVisible={dockLayout.agentPanelVisible}
					agentChatDock={dockLayout.chatDock}
					onSetAgentChatDock={(r) =>
						updateDockLayout((d) => ({
							...d,
							chatDock: r,
							agentPanelVisible: true,
							chatSizePx: chatSizePxWhenSwitchingDock(d.chatDock, r, d.chatSizePx),
						}))
					}
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
					onOpenAgentSetup={openAgentSetupFromMenu}
					onOpenAgentPermissions={() => setAgentPermissionsOpen(true)}
					settingsMenu={settingsMenuHandlers}
					onOpenTeamsYaml={openTeamsYamlFromMenu}
					onCreateAgentMarkdown={createNewAgentMarkdownFromMenu}
					onReloadAgents={agentsApi.reload}
					onOpenPiModelConfig={openPiModelConfigInEditor}
					chatSessionControls={{
						mode: session.chatMode,
						switchDisabled: session.streaming,
						onSetMode: handleChatModeChange,
					}}
					onNewPlanFile={() => void handleNewPlanFile()}
					newPlanFileDisabled={!workspaceOperational}
					viewTechnical={viewTechnicalOptions}
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
			<LlmFixModal
				open={showLlmFixModal}
				onClose={dismissLlmFixModal}
				onClearError={session.clearError}
				errorMessage={session.error ?? ""}
				appearanceDark={llmFixModalAppearanceDark}
				uiMode={uiMode}
				onOpenSimpleAiBrains={openLlmFixSimpleBrains}
				onOpenProviderCatalog={openLlmFixProviderCatalog}
			/>
			<HostDoctorModal
				open={hostDoctorOpen}
				onClose={() => setHostDoctorOpen(false)}
				appearanceDark={llmFixModalAppearanceDark}
				onWorkspaceFileSaved={() => void refresh()}
			/>
			<IndexingDocsModal
				open={indexingDocsOpen}
				onClose={() => setIndexingDocsOpen(false)}
				appearanceDark={llmFixModalAppearanceDark}
			/>
			<HonchoSettingsModal
				open={honchoSettingsOpen}
				onClose={() => setHonchoSettingsOpen(false)}
				appearanceDark={llmFixModalAppearanceDark}
				integrationDocUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/docs/HONCHO_INTEGRATION.md`}
			/>
			<AgentPermissionsModal
				open={agentPermissionsOpen}
				onClose={() => setAgentPermissionsOpen(false)}
				appearanceDark={llmFixModalAppearanceDark}
			/>
			<NewWorkspaceFileModal
				open={newWorkspaceFileDraft != null}
				defaultPath={newWorkspaceFileDraft?.defaultPath ?? ""}
				initialContent={newWorkspaceFileDraft?.initialContent}
				onDismiss={() => setNewWorkspaceFileDraft(null)}
				onCreate={(path, ic) => {
					setNewWorkspaceFileDraft(null);
					void performCreateNewWorkspaceFile(path, ic);
				}}
			/>
			<NewPlanFileModal
				open={newPlanFileModalOpen}
				onDismiss={() => setNewPlanFileModalOpen(false)}
				onCreate={(title, slug) => void handleNewPlanFileCreate(title, slug)}
			/>
			<LaunchConfigAddModal
				open={launchConfigAddOpen}
				onDismiss={() => setLaunchConfigAddOpen(false)}
				onPick={(id) => void appendLaunchConfigurationSnippet(id)}
			/>
			<InstallDebuggersModal
				open={installDebuggersModalOpen}
				onDismiss={() => setInstallDebuggersModalOpen(false)}
			/>
			<MitLicenseModal
				open={mitLicenseModalOpen}
				onDismiss={() => setMitLicenseModalOpen(false)}
				repoLicenseUrl={`${WOP_PUBLIC_REPO_URL}/blob/main/LICENSE`}
			/>
			<RestartServerModal
				open={restartServerModalOpen}
				onClose={() => setRestartServerModalOpen(false)}
				appearanceDark={llmFixModalAppearanceDark}
				onReconnectIfStillUp={session.reconnectWebSocket}
			/>
			<HowToUseModal
				open={howToUseModalOpen}
				onDismiss={() => setHowToUseModalOpen(false)}
				repoBlobBase={`${WOP_PUBLIC_REPO_URL}/blob/main`}
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
						<TechnicalPrimarySidebar widthPx={dockLayout.leftSidebarWidthPx}>
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
									<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{workspaceEditorBody}</div>
									<DockSplitHandle
										orientation="vertical"
										ariaLabel="Resize editor vs agent panel width"
										onDelta={(dx) =>
											updateDockLayout((d) => ({
												...d,
												/* Pointer right (+dx) → vertical edge follows cursor → wider editor, narrower agent. */
												chatSizePx: clampChatWidth(d.chatSizePx - dx),
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
												dockPanelFrame
												onOpenPlanFileForReview={openPlanFileForReview}
												planHandoffWorkspaceKey={planHandoffWorkspaceKey}
												technicalDock={{
													region: "right",
													sizePx: dockLayout.chatSizePx,
													onSetRegion: (r) =>
														updateDockLayout((d) => ({
															...d,
															chatDock: r,
															chatSizePx: chatSizePxWhenSwitchingDock(d.chatDock, r, d.chatSizePx),
														})),
													onHidePanel: () => updateDockLayout({ agentPanelVisible: false }),
												}}
											/>
										</div>
									</div>
								</>
							) : dockLayout.agentPanelVisible && dockLayout.chatDock === "bottom" ? (
								<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
									<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{workspaceEditorBody}</div>
									<DockSplitHandle
										orientation="horizontal"
										ariaLabel="Resize agent session doc height"
										onDelta={(_dx, dy) =>
											updateDockLayout((d) => ({
												...d,
												chatSizePx: clampChatHeight(d.chatSizePx - dy),
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
												dockPanelFrame
												onOpenPlanFileForReview={openPlanFileForReview}
												planHandoffWorkspaceKey={planHandoffWorkspaceKey}
												technicalDock={{
													region: "bottom",
													sizePx: dockLayout.chatSizePx,
													onSetRegion: (r) =>
														updateDockLayout((d) => ({
															...d,
															chatDock: r,
															chatSizePx: chatSizePxWhenSwitchingDock(d.chatDock, r, d.chatSizePx),
														})),
													onHidePanel: () => updateDockLayout({ agentPanelVisible: false }),
												}}
											/>
										</div>
									</div>
								</div>
							) : (
								<div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
									<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{workspaceEditorBody}</div>
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
					contextPct={String(session.tokenMeter.contextPct ?? 0)}
					tokensDown={session.tokenMeter.tokensDown}
					tokensUp={session.tokenMeter.tokensUp}
					contextTitle={session.tokenMeter.contextTitle ?? ''}
					tokensTitle={session.tokenMeter.tokensTitle ?? ''}
					onCopyWorkspacePath={copyWorkspacePath}
					chatMode={session.chatMode}
					chatAgentName={session.chatAgentName}
					technicalZedStrip={technicalZedStrip}
					technicalToolDock={{
						onReveal: (id) => focusToolTab(id),
						isVisible: (id) => toolTabVisible(dockForZedStrip, id as ToolTabId),
					}}
					diagnosticsSummary={
						technical && staticAnalysisEnabled
							? {
									total: workspaceStaticAnalysis.totalCount,
									errors: workspaceStaticAnalysis.errorCount,
									warnings: workspaceStaticAnalysis.warningCount,
									onOpenProblems: () => focusToolTab("problems"),
								}
							: null
					}
				/>
			) : null}
		</div>
		</WorkspaceStaticAnalysisProvider>
	);
}
