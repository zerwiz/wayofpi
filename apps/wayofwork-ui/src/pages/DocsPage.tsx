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
      />
    </DocumentHandlerProvider>
  );
}
