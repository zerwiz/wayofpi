/** Imperative API for the workspace text buffer (technical `MainDockPanel` / `SimpleFilePanel`). */
export type WorkspaceEditorRef = {
	undo: () => boolean;
	redo: () => boolean;
	cut: () => void;
	copy: () => void;
	paste: () => Promise<void>;
	/** Open in-file find (Ctrl+F). */
	find: () => void;
	/** Open in-file replace (Ctrl+H). */
	replace: () => void;
	toggleLineComment: () => void;
	toggleBlockComment: () => void;
	/** Emmet-style expand or insert Tab at caret. */
	emmetExpand: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	selectAll: () => void;
	expandSelection: () => void;
	shrinkSelection: () => void;
	copyLineUp: () => void;
	copyLineDown: () => void;
	moveLineUp: () => void;
	moveLineDown: () => void;
	duplicateSelection: () => void;
	addNextOccurrence: () => void;
	addPreviousOccurrence: () => void;
	selectAllOccurrences: () => void;
	getCtrlClickMultiCursor: () => boolean;
	setCtrlClickMultiCursor: (v: boolean) => void;
	getColumnSelectionMode: () => boolean;
	setColumnSelectionMode: (v: boolean) => void;
	/** Current textarea selection (collapsed caret → empty string). */
	getSelectedText: () => string;
	/** Move caret to 1-based line and column (clamped). */
	goToLineColumn: (line: number, column?: number) => void;
	/** Jump to the bracket matching `()`, `[]`, or `{}` at or before the caret. */
	goToMatchingBracket: () => void;
};

/** Menu bar Go → … (navigation; LSP-backed items stay disabled until a language service exists). */
export type GoMenuHandlers = {
	canGoBack: boolean;
	canGoForward: boolean;
	onBack: () => void;
	onForward: () => void;
	canLastEditLocation: boolean;
	onLastEditLocation: () => void;
	canSwitchEditorPrevious: boolean;
	canSwitchEditorNext: boolean;
	onSwitchEditorPrevious: () => void;
	onSwitchEditorNext: () => void;
	onGoToFile: () => void;
	onGoToSymbolInWorkspace: () => void;
	canGoToLine: boolean;
	onGoToLineColumn: () => void;
	canGoToBracket: boolean;
	onGoToBracket: () => void;
	canLanguageFeatures: boolean;
	onGoToSymbolInEditor: () => void;
	onGoToDefinition: () => void;
	onGoToDeclaration: () => void;
	onGoToTypeDefinition: () => void;
	onGoToImplementations: () => void;
	onGoToReferences: () => void;
	canAddSymbolToChat: boolean;
	onAddSymbolToCurrentChat: () => void;
	onAddSymbolToNewChat: () => void;
	canNavigateProblems: boolean;
	onNextProblem: () => void;
	onPreviousProblem: () => void;
	canNavigateChanges: boolean;
	onNextChange: () => void;
	onPreviousChange: () => void;
};

/** Menu bar Run → … (debug / breakpoints; stepping when `debugSessionActive`). */
export type RunMenuHandlers = {
	debugSessionActive: boolean;
	terminalServerEnabled: boolean;
	/** File open in editor and ready — toggles breakpoint on current line. */
	canToggleBreakpoint: boolean;
	hasBreakpoints: boolean;
	allBreakpointsDisabled: boolean;
	onStartDebugging: () => void;
	onRunWithoutDebugging: () => void;
	onStopDebugging: () => void;
	onRestartDebugging: () => void;
	onAddConfiguration: () => void;
	onStepOver: () => void;
	onStepInto: () => void;
	onStepOut: () => void;
	onContinue: () => void;
	onToggleBreakpoint: () => void;
	onNewBreakpointInline: () => void;
	onNewBreakpointConditional: () => void;
	onNewBreakpointLogpoint: () => void;
	onNewBreakpointTriggered: () => void;
	onNewBreakpointFunction: () => void;
	onEnableAllBreakpoints: () => void;
	onDisableAllBreakpoints: () => void;
	onRemoveAllBreakpoints: () => void;
	onInstallAdditionalDebuggers: () => void;
};

/** Menu bar Settings → preferences, sidebars, and technical chrome (wired from App). */
export type SettingsMenuHandlers = {
	/** Simple UI **Settings** tab (appearance, approvals, switch to Technical). */
	onOpenSimpleAppSettings: () => void;
	/** Simple **AI Brains** tab (models / provider). */
	onOpenAiBrains: () => void;
	/** Simple **Projects** tab. */
	onOpenProjects: () => void;
	/** Open `.wayofpi/ui-views.json` in the Simple editor (optional). */
	onEditWorkspaceViewsCatalog?: () => void;
};

/** Menu bar Help → … (documentation links; some items are inert in the browser). */
export type HelpMenuHandlers = {
	onShowAllCommands: () => void;
	onEditorPlayground: () => void;
	onAccessibilityFeatures: () => void;
	onGiveFeedback: () => void;
	onViewLicense: () => void;
	/** False in the browser; true only if embedded in a shell that exposes devtools. */
	canToggleDeveloperTools: boolean;
	onToggleDeveloperTools: () => void;
	canOpenProcessExplorer: boolean;
	onOpenProcessExplorer: () => void;
	canDownloadUpdate: boolean;
	onDownloadUpdate: () => void;
};

/** Menu bar Terminal → … */
export type TerminalMenuHandlers = {
	/** Server allows PTY (WOP_ALLOW_TERMINAL=1); needed for injected run commands. */
	terminalServerEnabled: boolean;
	onNewTerminal: () => void;
	onSplitTerminal: () => void;
	onRunTask: () => void;
	onRunBuildTask: () => void;
	onRunActiveFile: () => void;
	onRunSelectedText: () => void;
	onConfigureTasks: () => void;
	onConfigureDefaultBuildTask: () => void;
};

/** Menu bar Edit → … actions; optional when no editor surface. */
export type EditMenuHandlers = {
	/** File open and editor ready (not loading/error). */
	canEdit: boolean;
	onUndo: () => void;
	onRedo: () => void;
	onCut: () => void;
	onCopy: () => void;
	onPaste: () => void | Promise<void>;
	onFind: () => void;
	onReplace: () => void;
	onFindInFiles: () => void;
	onReplaceInFiles: () => void;
	onToggleLineComment: () => void;
	onToggleBlockComment: () => void;
	onEmmetExpand: () => void;
	canUndo: boolean;
	canRedo: boolean;
};

/** Menu bar Selection → … (workspace text editor). */
export type SelectionMenuHandlers = {
	canEdit: boolean;
	/** Visual / preference toggles (native textarea has a single caret). */
	ctrlClickMultiCursor: boolean;
	columnSelectionMode: boolean;
	onSelectAll: () => void;
	onExpandSelection: () => void;
	onShrinkSelection: () => void;
	onCopyLineUp: () => void;
	onCopyLineDown: () => void;
	onMoveLineUp: () => void;
	onMoveLineDown: () => void;
	onDuplicateSelection: () => void;
	onAddNextOccurrence: () => void;
	onAddPreviousOccurrence: () => void;
	onSelectAllOccurrences: () => void;
	onToggleCtrlClickMultiCursor: () => void;
	onToggleColumnSelectionMode: () => void;
};
