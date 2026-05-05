import { useState, useEffect, useRef } from 'react';
import { FileIcon, ArrowLeftIcon, ArrowRightIcon, PrinterIcon, DownloadIcon, ShareIcon } from '@heroicons/react/24/outline';
import './DocumentViewer.css';

interface DocumentViewerProps {
  content: string;
  title?: string;
  onBack?: () => void;
}

export function DocumentViewer({ content, title = 'Document', onBack }: DocumentViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const handleDoubleClick = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="document-viewer-container" onScroll={handleScroll}>
      <div className="viewer-toolbar">
        <button onClick={onBack?.} className="toolbar-nav-btn">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="viewer-title">{title}</span>
        <div className="viewer-actions">
          <button className="toolbar-btn" onClick={() => window.print()}>
            <PrinterIcon className="w-4 h-4" />
          </button>
          <button className="toolbar-btn">
            <DownloadIcon className="w-4 h-4" />
          </button>
          <button className="toolbar-btn">
            <ShareIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div 
        className="viewer-content" 
        ref={contentRef}
        onDoubleClick={handleDoubleClick}
      >
        <div className="viewer-body" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
