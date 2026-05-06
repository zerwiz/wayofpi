import { useState, useEffect, useRef } from 'react';
import { DocumentIcon, ArrowLeftIcon, FolderIcon, SearchIcon } from '@heroicons/react/24/outline';
import { kanbanService } from '../../services/api';
import './DocumentBrowser.css';

type FileData = {
  id: string;
  name: string;
  type: 'markdown-file' | 'markdown-folder' | 'text-file' | 'text-folder' | 'other';
  path: string;
  parentId: string | null;
  size: number;
  modified: Date;
};

export interface DocumentBrowserProps {
  documentStoreId: string;
  initialFolderPath?: string;
  onSelectFile?: (file: FileData) => void;
}

export function DocumentBrowser({
  documentStoreId,
  initialFolderPath = '/',
  onSelectFile,
}: DocumentBrowserProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFolder, setCurrentFolder] = useState<'root' | string>(initialFolderPath || 'root');
  const [filterType, setFilterType] = useState<'all' | 'markdown' | 'text' | 'code'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Root', path: 'root' }]);
  const fileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFiles();
  }, [documentStoreId]);

  const loadFiles = async () => {
    setFiles([]);
  };

  return (
    <div className="document-browser-container" style={{ backgroundColor: '#1e1e1e', color: '#cccccc' }}>
      <div className="document-browser-toolbar" style={{ borderBottom: '1px solid #3c3c3c', padding: '8px' }}>
        <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {breadcrumb.map((item, index) => (
            <React.Fragment key={item.path}>
              {index > 0 && <span className="breadcrumb-separator" style={{ color: '#585858' }}>/</span>}
              <span className="breadcrumb-item" style={{ color: '#cccccc' }}>{item.name}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
