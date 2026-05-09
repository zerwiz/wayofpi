import { DocumentHandlerProvider } from "../components/documenthandler/context/DocumentHandlerContext";
import { DocsApp } from "../components/docs/DocsApp";
import type { TreeNode } from "../types/tree";
import type { ChatRow } from "../hooks/useWayOfPiSession";

interface DocsPageProps {
  uiMode: string;
  setUiMode: (m: string) => void;
  nodes: TreeNode[];
  treeLoading: boolean;
  treeError: string | null;
  refreshTree: () => void;
  selectedPath: string | null;
  setSelectedPath: (p: string | null) => void;
  rows: ChatRow[];
  streaming: boolean;
  connected: boolean;
  sendChat: (t: string) => void;
  stop: () => void;
}

export function DocsPage({
  uiMode, setUiMode, nodes, treeLoading, treeError,
  refreshTree, selectedPath, setSelectedPath,
  rows, streaming, connected, sendChat, stop,
}: DocsPageProps) {
  return (
    <DocumentHandlerProvider>
      <DocsApp
        uiMode={uiMode}
        setUiMode={setUiMode}
        nodes={nodes}
        treeLoading={treeLoading}
        treeError={treeError}
        refreshTree={refreshTree}
        selectedPath={selectedPath}
        setSelectedPath={setSelectedPath}
        rows={rows}
        streaming={streaming}
        connected={connected}
        sendChat={sendChat}
        stop={stop}
      />
    </DocumentHandlerProvider>
  );
}
