import { DocumentHandlerProvider } from "../components/documenthandler/context/DocumentHandlerContext";
import { DocsApp } from "../components/docs/DocsApp";
import { useRefactor } from "../context/RefactorContext";

export function DocsPage() {
  const {
    uiMode,
    setUiMode,
    tree: { nodes, loading, error, refresh },
    selectedPath,
    setSelectedPath,
    session
  } = useRefactor();

  return (
    <DocumentHandlerProvider>
      <DocsApp
        uiMode={uiMode}
        setUiMode={setUiMode}
        nodes={nodes}
        treeLoading={loading}
        treeError={error}
        refreshTree={refresh}
        selectedPath={selectedPath}
        setSelectedPath={setSelectedPath}
        rows={session.rows}
        streaming={session.streaming}
        connected={session.connected}
        sendChat={(text) => void session.sendChat(session.chatAgentName ?? '', text)}
        stop={session.stop}
        error={session.error}
        modelLabel={session.modelLabel}
        clearError={session.clearError}
        onReopenLlmFixModal={() => {}} // Stub or wired if needed
        chatAgentName={session.chatAgentName}
        dispatchTurnAgent={session.dispatchTurnAgent}
        onChatAgentChange={session.setChatAgentName}
        chatMode={session.chatMode}
        onChatModeChange={session.setChatMode}
        chatStreamUiEnabled={session.chatStreamUiEnabled}
        onChatStreamUiEnabledChange={session.setChatStreamUiEnabled}
        chatQueuePending={session.chatQueuePending}
        chatQueueItems={session.chatQueueItems}
        editChatQueueItem={session.editChatQueueItem}
        deleteChatQueueItem={session.deleteChatQueueItem}
        forceChatQueueItem={session.forceChatQueueItem}
        contextFillPct={session.contextFillPct}
        contextTitle={session.contextTitle}
      />
    </DocumentHandlerProvider>
  );
}
