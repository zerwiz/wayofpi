import { useState } from "react";
import { FileText, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
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

export function DocsApp(props: DocsAppProps) {
  const [show, setShow] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  return (
    <div className="p-2 bg-[#252526] text-[#cccccc]">
      <h3 className="text-[#858585] mb-2">Document Handler</h3>
      <button onClick={() => setShow(!show)} className="mb-2 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-sm text-[#cccccc] hover:bg-[#2d2d2d]">
        {show ? "Hide" : "Show"}
      </button>
      {show && (
        <div className="flex gap-2 overflow-x-auto">
          <FileExplorer onSelectFile={path => setSelectedPath(path)} />
          <ChatPanel />
          {selectedPath && <PreviewModal path={selectedPath} onClose={() => setSelectedPath(null)} />}
        </div>
      )}
    </div>
  );
}