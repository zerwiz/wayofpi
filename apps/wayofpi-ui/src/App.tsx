import React from "react";
import { useUiMode } from "./hooks/useUiMode";
import { useWorkspaceTree } from "./hooks/useWorkspaceTree";
import { useMaxWidthMediaQuery } from "./hooks/useMaxWidthMediaQuery";
import { useShellMobile } from "./components/mobile/useShellMobile";
import { useAgents } from "./hooks/useAgents";
import { useSimplePreferences } from "./hooks/useSimplePreferences";
import { useWorkspaceStaticAnalysis } from "./hooks/useWorkspaceStaticAnalysis";
import { useServerConfig } from "./hooks/useServerConfig";
import { useWayOfPiSession } from "./hooks/useWayOfPiSession";
import { SimpleApp } from "./components/simple/SimpleApp";
import { ClawApp } from "./components/claw/ClawApp";
import { StatusBar } from "./components/StatusBar";
import { MenuBar } from "./components/MenuBar";
import { WorkspaceStaticAnalysisProvider } from "./context/WorkspaceStaticAnalysisContext";

export function App() {
  const { mode, setMode } = useUiMode();
  const { shellMobile } = useShellMobile();
  const isMobile = useMaxWidthMediaQuery(768);
  const { root, folders, loading } = useWorkspaceTree();
  const { data: agentsData } = useAgents();
  const { colorMode } = useSimplePreferences();
  const { data: config } = useServerConfig();
  const workspaceStaticAnalysis = useWorkspaceStaticAnalysis(true);

  // Always call the hook, but choose a surfaceId that is always valid.
  const activeSurface = mode === "documenthandler" ? "simple" : mode;
  const session = useWayOfPiSession(activeSurface, undefined, undefined, undefined, undefined);
  const modelLabel = config?.chatEngine || "No server";

  // Get properties with safe defaults for when session might be undefined
  const rows = session?.rows ?? [];
  const logs = session?.logs ?? [];
  const streaming = session?.streaming ?? false;
  const chatQueuePending = session?.chatQueuePending ?? 0;
  const chatQueueItems = session?.chatQueueItems ?? [];
  const connected = session?.connected ?? false;
  const error = session?.error ?? null;
  const chatAgentName = session?.chatAgentName ?? null;
  const chatMode = session?.chatMode ?? "build";
  const contextPct = session?.tokenMeter.contextPct ?? "";
  const contextFillPct = session?.tokenMeter.contextFillPct ?? 0;
  const tokensDown = session?.tokenMeter.tokensDown ?? "";
  const tokensUp = session?.tokenMeter.tokensUp ?? "";
  const contextTitle = session?.tokenMeter.contextTitle ?? "";
  const tokensTitle = session?.tokenMeter.tokensTitle ?? "";

  // Determine if this is a valid chat mode or documenthandler
  const isDocumentHandlerMode = mode === "documenthandler";

  return (
    <React.StrictMode>
      <WorkspaceStaticAnalysisProvider value={workspaceStaticAnalysis}>
        <div className="min-h-screen bg-[#1e1e1e] text-[#cccccc] flex flex-col">
          <MenuBar
            uiMode={mode}
            onUiModeChange={setMode}
            modelLabel={modelLabel}
            config={config}
          />

          <main className="flex-1 overflow-hidden">
            {!isDocumentHandlerMode && mode === "simple" && (
              <SimpleApp
                uiMode={mode}
                setUiMode={setMode}
                root={root}
                rootLabel={folders[0]?.name || "Workspace"}
                nodes={[]}
                treeLoading={loading}
                treeError={null}
                refreshTree={() => {}}
                refreshTreeQuiet={() => {}}
                modelLabel={modelLabel}
                config={config}
                effectiveModel={null}
                onSelectLlmModel={() => {}}
                selectedPath={null}
                setSelectedPath={() => {}}
                content=""
                setContent={() => {}}
                persistEncoding="utf8"
                fileMimeType={null}
                fileLoading={false}
                fileError={null}
                dirty={false}
                save={() => Promise.resolve(true)}
                discardUnsavedChanges={() => {}}
                line={1}
                col={1}
                onCursor={() => {}}
                rows={rows}
                logs={logs}
                streaming={streaming}
                chatStreamUiEnabled={true}
                onChatStreamUiEnabledChange={() => {}}
                chatQueuePending={chatQueuePending}
                chatQueueItems={chatQueueItems}
                editChatQueueItem={() => {}}
                deleteChatQueueItem={() => {}}
                forceChatQueueItem={() => {}}
                connected={connected}
                error={error}
                sendChat={() => Promise.resolve()}
                stop={() => {}}
                clearError={() => {}}
                onReopenLlmFixModal={() => {}}
                chatAgentName={chatAgentName}
                dispatchTurnAgent={() => {}}
                onChatAgentChange={() => {}}
                chatMode={chatMode}
                onChatModeChange={() => {}}
                activeTab={null as any}
                onTabChange={() => {}}
                providerConfigInitialPath={null}
                providerConfigInitialNonce={0}
                onConsumeProviderConfigFocus={() => {}}
                workspaceEditorRef={{ current: null }}
                onUndoRedoStackChange={() => {}}
                onSelectionPrefsChange={() => {}}
                onFindInFiles={() => {}}
                onReplaceInFiles={() => {}}
                teamsYamlWritePath={null}
                workspaceReady={!!root}
                onOpenTeamsYaml={() => {}}
                onCreateAgentDefinition={() => {}}
                onOpenFolder={() => {}}
                onOpenRecentFolder={() => {}}
                recentFolders={[]}
                onHelp={() => {}}
                onConfigRefresh={() => {}}
                onNewPlanFile={() => {}}
                newPlanFileDisabled={false}
                onOpenIndexingDocs={() => {}}
                contextPct={contextPct}
                contextFillPct={contextFillPct}
                tokensDown={tokensDown}
                tokensUp={tokensUp}
                contextTitle={contextTitle}
                tokensTitle={tokensTitle}
                onMoveFileToDirectory={() => Promise.resolve()}
                layoutVariant="desktop"
              />
            )}

            {!isDocumentHandlerMode && mode === "claw" && (
              <ClawApp
                uiMode={mode}
                setUiMode={setMode}
                root={root}
                rootLabel={folders[0]?.name || "Workspace"}
                nodes={[]}
                treeLoading={loading}
                treeError={null}
                refreshTree={() => {}}
                refreshTreeQuiet={() => {}}
                modelLabel={modelLabel}
                config={config}
                effectiveModel={null}
                onSelectLlmModel={() => {}}
                selectedPath={null}
                setSelectedPath={() => {}}
                content=""
                setContent={() => {}}
                persistEncoding="utf8"
                fileMimeType={null}
                fileLoading={false}
                fileError={null}
                dirty={false}
                save={() => Promise.resolve(true)}
                discardUnsavedChanges={() => {}}
                line={1}
                col={1}
                onCursor={() => {}}
                rows={rows}
                logs={logs}
                chatTabs={session?.chatTabs ?? []}
                activeChatTabId={session?.activeChatTabId ?? ""}
                onSelectChatTab={() => {}}
                onCloseChatTab={() => {}}
                onRenameChatTab={() => {}}
                onNewSession={() => {}}
                streaming={streaming}
                chatStreamUiEnabled={true}
                onChatStreamUiEnabledChange={() => {}}
                chatQueuePending={chatQueuePending}
                chatQueueItems={chatQueueItems}
                editChatQueueItem={() => {}}
                deleteChatQueueItem={() => {}}
                forceChatQueueItem={() => {}}
                connected={connected}
                error={error}
                sendChat={() => Promise.resolve()}
                stop={() => {}}
                clearError={() => {}}
                onReopenLlmFixModal={() => {}}
                chatAgentName={chatAgentName}
                dispatchTurnAgent={() => {}}
                onChatAgentChange={() => {}}
                chatMode={chatMode}
                onChatModeChange={() => {}}
                chatSessionControls={undefined}
                workspaceReady={!!root}
                onOpenTeamsYaml={() => {}}
                onCreateAgentDefinition={() => {}}
                onOpenFolder={() => {}}
                onOpenRecentFolder={() => {}}
                recentFolders={[]}
                onHelp={() => {}}
                onConfigRefresh={() => {}}
                onNewPlanFile={() => {}}
                newPlanFileDisabled={false}
                onOpenHostDoctor={() => {}}
                contextPct={contextPct}
                contextFillPct={contextFillPct}
                tokensDown={tokensDown}
                tokensUp={tokensUp}
                contextTitle={contextTitle}
                tokensTitle={tokensTitle}
                onMoveFileToDirectory={() => Promise.resolve()}
                layoutVariant="desktop"
              />
            )}

            {mode === "technical" && (
              <div className="flex-1 p-4 text-gray-300">
                <h1 className="text-xl font-bold">Technical Mode</h1>
                <p>Workspace: {root || "No workspace"}</p>
              </div>
            )}

            {mode === "documenthandler" && (
              <div className="flex-1 p-4 text-gray-300">
                <h1 className="text-xl font-bold">Document Handler</h1>
                <p>Workspace: {root || "No workspace"}</p>
              </div>
            )}
          </main>

          <StatusBar
            uiMode={mode}
            workspaceRoot={root || "No workspace"}
            connected={connected}
            line={1}
            col={1}
            language=""
            contextPct={contextPct}
            tokensDown={tokensDown}
            tokensUp={tokensUp}
            contextTitle={contextTitle}
            tokensTitle={tokensTitle}
            onCopyWorkspacePath={() => {}}
            chatMode={chatMode}
            chatAgentName={chatAgentName}
          />
        </div>
      </WorkspaceStaticAnalysisProvider>
    </React.StrictMode>
  );
}

export default App;
