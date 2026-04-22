/**
 * MobileChatExplorer Component
 *
 * @description Mobile-optimized container for chat and file explorer UI
 *              Combines chat interface and file explorer in a single-column layout
 *              Designed for screens < 768px with touch-friendly interactions
 *
 * @example
 * ```tsx
 * <MobileChatExplorer
 *   chatVisible={true}
 *   onToggleChat={() => setChatVisible(!chatVisible)}
 *   explorerVisible={true}
 *   onToggleExplorer={() => setExplorerVisible(!explorerVisible)}
 *   files={fileList}
 *   selectedFile={selectedFile}
 *   onSelectFile={handleFileSelect}
 *   previewVisible={previewVisible}
 *   onTogglePreview={() => setPreviewVisible(!previewVisible)}
 *   previewFile={previewFile}
 *   messages={messages}
 *   input={input}
 *   setInput={setInput}
 *   onSend={sendMessage}
 *   onViewMode={viewMode}
 *   onViewModeToggle={setViewMode}
 * />
 * ```
 */

import { useState, useCallback, useMemo } from "react";

// Props interface for MobileChatExplorer component
export interface MobileChatExplorerProps {
  chatVisible: boolean;
  onToggleChat: () => void;
  explorerVisible: boolean;
  onToggleExplorer: () => void;
  files: Array<{
    path: string;
    name: string;
    size: string;
    date: string;
    type: string;
  }>;
  selectedFile: { path: string; name: string } | null;
  onSelectFile: (file: { path: string; name: string }) => void;
  previewVisible: boolean;
  onTogglePreview: () => void;
  previewFile: { path: string; name: string } | null;
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
  input: string;
  setInput: (text: string) => void;
  onSend: (message: string) => Promise<void>;
  viewMode: "icon" | "list";
  onViewModeToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAgentSelect?: (agent: string) => void;
  currentAgent?: string | null;
}

export default function MobileChatExplorer({
  chatVisible,
  onToggleChat,
  explorerVisible,
  onToggleExplorer,
  files,
  selectedFile,
  onSelectFile,
  previewVisible,
  onTogglePreview,
  previewFile,
  messages,
  input,
  setInput,
  onSend,
  viewMode,
  onViewModeToggle,
  searchQuery,
  setSearchQuery,
  onAgentSelect,
  currentAgent,
}: MobileChatExplorerProps) {
  // Mobile-specific layout handling
  const mobileLayout = useMemo(() => ({
    chatPanel: {
      width: "100%",
      minHeight: "300px",
      flex: "1",
    },
    explorerPanel: {
      width: "100%",
      minHeight: "300px",
      flex: "1",
    },
  }), []);

  // Handle file selection
  const handleFileSelect = useCallback((file: { path: string; name: string }) => {
    onSelectFile(file);
  }, [onSelectFile]);

  // Handle message send
  const handleSend = useCallback(async () => {
    if (input.trim()) {
      await onSend(input);
      setInput("");
    }
  }, [input, onSend, setInput]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" &&
