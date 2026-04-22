```/home/zerwiz/CodeP/Way of pi/apps/wayofpi-ui/src/components/documenthandler/DocsApp.tsx
import { useState, useCallback, useEffect } from "react";
import { FileText, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import { FileEntry } from "./types/documenthandler.types";
import type { Agent } from "./types/documenthandler.types";
import { FileExplorer } from "./FileExplorer";
import { ChatPanel } from "./ChatPanel";
import { PreviewModal } from "./PreviewModal";
import "./styles/ChatExplorer.css";

interface DocsAppProps {
	connected: boolean;
	config: any;
	refreshWorkspace: () => Promise<void>;
	modelLabel: string;
	workspaceOperational: boolean;
	onOpenAgentSetup: () => void;
}

interface DocsContentProps {
	connected: boolean;
	onAgentSelect: (agent: Agent) => void;
	currentAgent: Agent | null;
	files: FileEntry[];
	selectedFile: FileEntry | null;
	onSelectFile: (file: FileEntry) => void;
	onRefreshWorkspace: () => Promise<void>;
	appearanceDark: boolean;
	previewVisible: boolean;
	previewFile: FileEntry | null;
	onTogglePreview: () => void;
	currentZoom: number;
	setCurrentZoom: (zoom: number) => void;
}

const MODES = [
	{
		id: "simple",
		label: "Simple",
		description: "Simple chat interface",
	},
	{
		id: "technical",
		label: "Technical",
		description: "Technical IDE mode",
	},
	{
		id: "claw",
		label: "Claw",
		description: "Claw UI mode",
	},
	{
		id: "docs",
		label: "Docs",
		description: "Document explorer mode",
	},
];

const MOCK_AGENTS: Agent[] = [
	{ id: "1", name: "General Assistant", description: "General purpose AI assistant" },
	{ id: "2", name: "Code Reviewer", description: "Specialized in code review and analysis" },
	{ id: "3", name: "Technical Writer", description: "Helps with documentation and writing" },
];

export function DocsContent({
	connected,
	onAgentSelect,
	currentAgent,
	files,
	selectedFile,
	onSelectFile,
	onRefreshWorkspace,
	appearanceDark = true,
	previewVisible,
	previewFile,
	onTogglePreview,
	currentZoom,
	setCurrentZoom,
}: DocsContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"list" | "icon">("list");
	const [sortBy, setSortBy] = useState<"name" | "date" | "size">("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [searchVisible, setSearchVisible] = useState(true);

	const subC = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const titleC = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const mainBg = appearanceDark ? "bg-[#1e1e1e]" : "bg-white";
	const aside = appearanceDark ? "bg-[#252526]" : "bg-white";
	const border = appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]";

	const filteredFiles = files.filter((file) =>
		file.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const sortedFiles = [...filteredFiles].sort((a, b) => {
		let comparison = 0;
		if (sortBy === "name") {
			comparison = a.name.localeCompare(b.name);
		} else if (sortBy === "date") {
			comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
		} else if (sortBy === "size") {
			comparison = a.size - b.size;
		}
		return sortOrder === "asc" ? comparison : -comparison;
	});

	return (
		<div className={`flex h-full flex-col ${mainBg}`}>
			{/* Header with agent selector */}
			<div
				className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${aside}`}
			>
				<div className="flex items-center gap-3">
					<FileText
						size={18}
						className={`shrink-0 ${
							appearanceDark ? "text-[#fb923c]" : "text-[#ea580c]"
						} hover:rotate-12 transition-transform cursor-pointer`}
						onClick={() => onAgentSelect(currentAgent ?? MOCK_AGENTS[0])}
						title="Select agent"
					/>
					<div>
						<h2 className={`text-sm font-semibold ${titleC}`}>
							{currentAgent?.name ?? "Select an Agent"}
						</h2>
						<p className={`text-xs ${subC}`}>
							{currentAgent?.description ?? "Choose your AI assistant"}
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={onRefreshWorkspace}
					disabled={!connected}
					className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
						appearanceDark
							? "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4c4c4c]"
							: "bg-[#f5f5f5] text-[#333333] hover:bg-[#e5e5e5]"
					}`}
					title="Refresh workspace"
				>
					<Settings size={14} className="mr-1" />
					Refresh
				</button>
			</div>

			{/* File Explorer */}
			<div className="flex min-h-0 flex-1 overflow-hidden">
				{/* Activity Bar */}
				<div
					className={`flex flex-col border-r px-3 py-4 ${aside}`}
					style={{ width: "60px" }}
				>
					<button
						type="button"
						className={`flex flex-1 items-center justify-center rounded-lg text-2xl ${
							searchVisible
								? appearanceDark ? "text-[#fb923c]" : "text-[#ea580c]"
								: appearanceDark
								? "text-[#858585] hover:text-[#cccccc]"
								: "text-[#616161] hover:text-[#333333]"
						}`}
						onClick={() => setSearchVisible(true)}
						title="Toggle Search"
					>
						🔍
					</button>
					<div className="flex-1" />
					<span className={`text-center text-xs ${subC}`}>Docs</span>
				</div>

				{/* Content Area */}
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					{/* Toolbar */}
					<div className={`flex items-center justify-between border-b px-4 py-2 ${aside}`}>
						<div className="flex items-center gap-2">
							<span className={`text-xs font-semibold ${subC}`}>Files:</span>
							<span className={`text-xs ${titleC}`}>{sortedFiles.length}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className={`text-xs ${subC}`}>Sort:</span>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as "name" | "date" | "size")}
								className={`rounded border px-2 py-0.5 text-xs ${
									appearanceDark
										? "border-[#3c3c3c] bg-[#252526] text-[#cccccc]"
										: "border-[#d4d4d4] bg-white text-[#333333]"
								}`}
							>
								<option value="name">Name</option>
								<option value="date">Date</option>
								<option value="size">Size</option>
							</select>
							<span className={`text-xs ${subC}`}>View:</span>
							<div className="flex rounded overflow-hidden border">
								<button
									type="button"
									onClick={() => setViewMode("list")}
									className={`px-2 py-1 text-xs ${
										viewMode === "list"
											? "bg-[#ea580c] text-white"
											: appearanceDark
											? "bg-[#252526] text-[#858585] hover:bg-[#3c3c3c]"
											: "bg-white text-[#616161] hover:bg-[#f5f5f5]"
									}`}
								>
									List
								</button>
								<button
									type="button"
									onClick={() => setViewMode("icon")}
									className={`px-2 py-1 text-xs ${
										viewMode === "icon"
											? "bg-[#ea580c] text-white"
											: appearanceDark
											? "bg-[#252526] text-[#858585] hover:bg-[#3c3c3c]"
											: "bg-white text-[#616161] hover:bg-[#f5f5f5]"
									}`}
								>
									Icon
								</button>
							</div>
						</div>
					</div>

					{/* File List */}
					<div className="flex min-h-0 flex-1 overflow-y-auto p-2">
						{sortedFiles.length === 0 ? (
							<div className="flex min-h-0 flex-1 items-center justify-center">
								<div className="text-center">
									<FileText
										size={48}
										className={`mx-auto mb-2 ${subC}`}
									/>
									<p className={`text-sm ${subC}`}>
										{searchQuery
											? "No files match your search"
											: "No files found"}
									</p>
									{!searchQuery && (
										<p className={`mt-1 text-xs ${subC}`}>
											Use the file explorer to add your documents
										</p>
									)}
								</div>
							</div>
						) : (
							sortedFiles.map((file) => (
								<div
									key={file.id}
									className={`group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
										selectedFile?.id === file.id
											? appearanceDark
												? "bg-[#2d2d2d]"
												: "bg-[#f5f5f5]"
											: appearanceDark
											? "hover:bg-[#2d2d2d]/50"
											: "hover:bg-[#f5f5f5]/70"
									}`}
									onClick={() => onSelectFile(file)}
								>
									<FileText
										size={20}
										className={appearanceDark ? "text-[#858585]" : "text-[#616161]"}
									/>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className={`truncate text-sm font-medium ${titleC}`}>
											{file.name}
										</span>
										<div className={`flex items-center gap-2 text-xs ${subC}`}>
											<span>{new Date(file.modified).toLocaleDateString()}</span>
										</div>
									</div>
								</div>
							))
						)}
					</div>

					{/* Footer */}
					<div
						className={`flex shrink-0 items-center justify-between border-t px-4 py-2 text-xs ${subC}`}
					>
						<span>{files.length} document{files.length !== 1 ? "s" : ""} loaded</span>
						<span>
							View: {viewMode}, Sort: {sortBy} {sortOrder === "asc" ? "↑" : "↓"}
						</span>
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			{previewVisible && previewFile && (
				<PreviewModal
					file={previewFile}
					appearanceDark={appearanceDark}
					previewVisible={previewVisible}
					onToggle={onTogglePreview}
					currentZoom={currentZoom}
					setCurrentZoom={setCurrentZoom}
				/>
			)}
		</div>
	);
}

export function DocsApp({
	connected,
	config,
	refreshWorkspace,
	modelLabel,
	workspaceOperational,
	onOpenAgentSetup,
}: DocsAppProps) {
	const [uiMode, setUiMode] = useState<string>("simple");
	const [setUiModeRev,] = useState(0);
	const [chatMode, setChatMode] = useState<string>("chat");
	const [agentPanelVisible, setAgentPanelVisible] = useState(false);
	const [chatSizePx, setChatSizePx] = useState(400);
	const [agentChatDock, setAgentChatDock] = useState("left");
	const [agentChatDockOpen, setAgentChatDockOpen] = useState(false);
	const [chatSizePxWhenSwitchingDock, setChatSizePxWhenSwitchingDock] = useState(400);
	const [showMenu, setShowMenu] = useState(false);

	// Theme state
	const [appearanceDark, setAppearanceDark] = useState(true);

	// Toggle agent panel
	const toggleAgentPanel = useCallback(() => {
		setAgentPanelVisible((prev) => !prev);
		if (!agentPanelVisible) {
			setChatSizePx(400);
			setAgentChatDockOpen(true);
		}
	}, [agentPanelVisible, chatSizePx, agentChatDockOpen]);

	// Handle agent selection
	const handleAgentSelect = useCallback(
		(agent: Agent) => {
			// Agent selection handled in DocsContent
			console.log(`Selected agent: ${agent.name}`);
		},
		[]
	);

	// Handle UI mode change
	const handleUiModeChange = useCallback(
		(mode: string) => {
			setUiMode(mode);
			if (mode !== "simple") {
				setChatMode("agents");
			} else {
				setChatMode("chat");
			}
		},
		[]
	);

	// Toggle appearance theme
	const toggleAppearance = useCallback(() => {
		setAppearanceDark((prev) => !prev);
	}, []);

	return (
		<div className="flex min-h-0 w-full flex-col overflow-hidden">
			{/* Shared MenuBar */}
			<MenuBar
				modelLabel={modelLabel}
				uiMode={uiMode}
				onUiModeChange={handleUiModeChange}
				config={config}
				onOpenCommandPalette={() => console.log("Command palette")}
				onSave={() => console.log("Save")}
				canSave={false}
				onRevertFile={() => console.log("Revert")}
				canRevert={false}
				onRefreshWorkspace={refreshWorkspace}
				onCopyWorkspacePath={() => console.log("Copy path")}
				onSelectActivity={(a) => console.log("Activity:", a)}
				technicalActivity={uiMode === "technical" ? "explorer" : undefined}
				onFocusBottomTab={(t) => console.log("Focus tab:", t)}
				leftSidebarVisible={true}
				onToggleLeftSidebar={() => console.log("Toggle sidebar")}
				agentPanelVisible={agentPanelVisible}
				agentChatDock={agentChatDock}
				onSetAgentChatDock={(r) => {
					setAgentChatDock(r);
					setChatSizePxWhenSwitchingDock(chatSizePx);
				}}
				onToggleAgentPanel={toggleAgentPanel}
				fileMenu={<FileMenu />}
				editMenu={<EditMenu />}
				selectionMenu={<SelectionMenu />}
				goMenu={<GoMenu />}
				runMenu={<RunMenu />}
				terminalMenu={<TerminalMenu />}
				helpMenu={<HelpMenu />}
				onOpenAgentSetup={onOpenAgentSetup}
				onOpenAgentPermissions={() => console.log("Agent permissions")}
				settingsMenu={<SettingsMenu />}
				onOpenTeamsYaml={() => console.log("Open teams yaml")}
			 onCreateAgentMarkdown={() => console.log("Create agent markdown")}
				onReloadAgents={() => console.log("Reload agents")}
				onOpenPiModelConfig={() => console.log("Open PI model config")}
				chatSessionControls={{
					mode: chatMode,
					switchDisabled: false,
					onSetMode: (mode) => setChatMode(mode),
				}}
				onNewPlanFile={() => console.log("New plan file")}
				newPlanFileDisabled={!workspaceOperational}
				viewTechnical={
					<>
						<button
							type="button"
							className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[#3c3c3c]"
							onClick={() => {
								setUiMode("technical");
								setAgentPanelVisible(false);
								setAgentChatDockOpen(false);
							}}
						>
							IDE
						</button>
						<button
							type="button"
							className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[#3c3c3c]"
							onClick={() => setUiMode("claw")}
						>
							Claw
						</button>
						<button
							type="button"
							className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[#3c3c3c]"
							onClick={() => setUiMode("simple")}
						>
							Simple
						</button>
					</>
				}
				menuBarVisible={true}
				onToggleMenuBar={() => setShowMenu((prev) => !prev)}
				agentTabsVisible={true}
				onToggleAgentTabs={() => setAgentPanelVisible((prev) => !prev)}
				showStatusbar={false}
				onToggleStatusbar={() => console.log("Toggle statusbar")}
				zoom={100}
				onZoomIn={() => console.log("Zoom in")}
				onZoomOut={() => console.log("Zoom out")}
				onZoomReset={() => console.log("Zoom reset")}
			/>

			{/* Appearance Toggle */}
			<div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={toggleAppearance}
						className={`rounded px-3 py-1 text-xs transition-colors ${
							appearanceDark
								? "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4c4c4c]"
								: "bg-[#f5f5f5] text-[#333333] hover:bg-[#e5e5e5]"
						}`}
						title="Toggle theme"
					>
						{appearanceDark ? "🌙 Dark" : "☀️ Light"}
					</button>
				</div>
			</div>

			{/* Content Area */}
			<DocsContent
				connected={connected}
				onAgentSelect={handleAgentSelect}
				currentAgent={null}
				files={[]}
				selectedFile={null}
				onSelectFile={() => {}}
				onRefreshWorkspace={refreshWorkspace}
				appearanceDark={appearanceDark}
				previewVisible={false}
				previewFile={null}
				onTogglePreview={() => {}}
				currentZoom={100}
				setCurrentZoom={() => {}}
			/>

			{/* Agent Panel */}
			{agentChatDock && agentChatDockOpen && (
				<div
					className={`absolute z-10 ${
						agentChatDock === "left" ? "left-0" : "right-0"
					} h-full w-[400px] transform transition-transform ${
						agentPanelVisible ? "translate-x-0" : agentChatDock === "right"
							? "-translate-x-full"
							: "translate-x-full"
					}`}
				>
					<div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
						{/* Agent Panel Header */}
						<div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-4 py-3">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-[#cccccc]">Agent Panel</span>
								{agentPanelVisible && (
									<span className="rounded-full px-2 py-0.5 text-xs text-[#cccccc] bg-[#ea580c]">
										{chatSizePx}
									</span>
								)}
							</div>
							<button
								type="button"
								onClick={() => setAgentChatDockOpen(false)}
								className="rounded p-1 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
							>
								<X size={14} />
							</button>
						</div>

						{/* Agent Panel Content */}
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
							{/* Chat messages placeholder */}
							<div className="flex min-h-0 flex-1 overflow-y-auto p-4">
								<div className="flex min-h-0 flex-1 flex-col gap-3">
									<div className="flex min-h-0 flex-1 items-center justify-center">
										<div className="text-center">
											<span className="text-xs text-[#858585]">
												Select a file and ask your AI assistant a question
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Chat input placeholder */}
							<div className="shrink-0 border-t border-[#3c3c3c] bg-[#252526] p-3">
								<form
									className="flex items-center gap-2"
									onSubmit={(e) => {
										e.preventDefault();
										console.log("Chat submission");
									}}
								>
									<input
										type="text"
										placeholder="Ask your agent..."
										className="flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] placeholder-[#858585] focus:border-[#ea580c] focus:outline-none"
									/>
									<button
										type="submit"
										className="rounded bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c2410c]"
									>
										Send
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function FileMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">New File...</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">New Folder...</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Add Folder to Workspace...</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Open File...</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Open Recent</span>
			</div>
			<div className="h-px bg-[#3c3c3c]" />
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Save</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Save As...</span>
			</div>
		</div>
	);
}

function EditMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Undo</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Redo</span>
			</div>
			<div className="h-px bg-[#3c3c3c]" />
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Cut</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Copy</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Paste</span>
			</div>
		</div>
	);
}

function SelectionMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Select All</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Invert Selection</span>
			</div>
		</div>
	);
}

function GoMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Go to File</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Go to Symbol</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Go to Line</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Go to Symbol in Editor</span>
			</div>
		</div>
	);
}

function RunMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Start Debugging</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Start Without Debugging</span>
			</div>
		</div>
	);
}

function TerminalMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">New Terminal</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Split Terminal</span>
			</div>
		</div>
	);
}

function HelpMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">How to Use</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Accessibility Features</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Give Feedback</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Support Us</span>
			</div>
		</div>
	);
}

function SettingsMenu() {
	return (
		<div className="flex flex-col gap-0.5 text-xs">
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">PI Model Config</span>
			</div>
			<div className="flex items-center gap-1 p-1 hover:bg-[#3c3c3c]">
				<span className="text-[#cccccc]">Appearance</span>
			</div>
		</div>
	);
}

export default DocsApp;
