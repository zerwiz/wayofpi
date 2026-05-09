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
    session: { rows, streaming, connected, sendChat, stop }
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
        rows={rows}
        streaming={streaming}
        connected={connected}
        sendChat={(text) => void sendChat(text)}
        stop={stop}
      />
    </DocumentHandlerProvider>
  );
}
