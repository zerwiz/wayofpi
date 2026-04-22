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
  // Placeholder for future use
}

export function DocsApp(props: DocsAppProps) {
  const [show, setShow] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const toggleShow = useCallback(() => setShow(!show), []);

  const handleOpenFile = (path: string) => {
    setSelectedPath(path);
  };

  const closePreview = () => {
    setSelectedPath(null);
  };

  return (
    <div className="p-2 bg-[#252526] text-[#cccccc]">
      <h3 className="text-[#858585] mb-2">Document Handler</h3>
      <div className="flex gap-2">
        <button
          className="rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 font-mono text-[12px] text-[#cccccc] hover:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={toggleShow}
        >
          {show ? "Hide" : "Show"}
        </button>
        {show && (
          <div className="flex gap-2 overflow-x-auto">
            <FileExplorer onSelectFile={handleOpenFile} />
            <ChatPanel />
            {selectedPath && (
              <PreviewModal path={selectedPath} onClose={closePreview} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}