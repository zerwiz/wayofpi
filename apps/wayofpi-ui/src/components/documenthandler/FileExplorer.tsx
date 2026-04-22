import {
  Folder,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson,
  File as FileIcon,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { TreeNode } from "../../types/tree";

interface FileExplorerProps {
  visible: boolean;
  onToggle: () => void;
  appearanceDark?: boolean;
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  loading: boolean;
  error: string | null;
}

function flattenTree(
  nodes: TreeNode[],
  depth = 0,
): { node: TreeNode; depth: number }[] {
  const result: { node: TreeNode; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.type === "dir" && node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

function fileRowIcon(name: string, appearanceDark: boolean) {
  const lower = name.toLowerCase();
  const code = appearanceDark ? "text-[#858585]" : "text-[#616161]";
  const json = appearanceDark ? "text-amber-400/90" : "text-amber-700";
  if (lower.endsWith(".json")) return <FileJson size={15} className={json} />;
  if (
    lower.endsWith(".py") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".js") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".md")
  ) {
    return <FileCode2 size={15} className={code} />;
  }
  return <FileIcon size={15} className={code} />;
}

export function FileExplorer({
  visible,
  onToggle,
  appearanceDark = true,
  nodes,
  selectedPath,
  onSelectFile,
  loading,
  error,
}: FileExplorerProps) {
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());

  const title = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
  const subC = appearanceDark ? "text-[#858585]" : "text-[#616161]";
  const mainBg = appearanceDark ? "bg-[#1e1e1e]" : "bg-white";
  const sectionBorder = appearanceDark
    ? "border-[#3c3c3c]"
    : "border-[#e5e5e5]";
  const itemHover = appearanceDark
    ? "hover:bg-[#2d2d2d]"
    : "hover:bg-[#f5f5f5]";
  const selectedBg = appearanceDark ? "bg-[#ea580c]/20" : "bg-[#ea580c]/12";
  const dirText = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
  const gitBadge = appearanceDark
    ? "bg-[#164e63] text-[#0ea5e9]"
    : "bg-[#cce0ff] text-[#0066ff]";

  const flatNodes = useMemo(() => flattenTree(nodes), [nodes]);

  const toggleDir = (path: string) => {
    setCollapsedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (!visible) return null;

  return (
    <div className={`file-explorer flex h-full flex-col ${mainBg}`}>
      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3 ${sectionBorder}`}
      >
        <h2
          className={`flex min-w-0 items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider ${title}`}
        >
          <Folder size={16} className="shrink-0 text-[#fb923c]" />
          <span className="truncate">Project Files</span>
        </h2>
      </div>

      <div className="file-explorer-content min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-4 text-center text-sm ${subC}`}>Loading...</div>
        ) : error ? (
          <div className={`p-4 text-center text-sm text-red-500`}>{error}</div>
        ) : flatNodes.length === 0 ? (
          <div className={`p-4 text-center text-sm ${subC}`}>No files</div>
        ) : (
          <div className="flex flex-col gap-0.5 p-2">
            {flatNodes.map(({ node, depth }) => {
              const isDir = node.type === "dir";
              const isCollapsed = collapsedDirs.has(node.path);
              const isSelected = selectedPath === node.path;

              return (
                <button
                  type="button"
                  key={node.path}
                  onClick={() =>
                    isDir ? toggleDir(node.path) : onSelectFile(node.path)
                  }
                  className={`flex items-center gap-2 rounded px-2 py-1 text-left transition-colors ${
                    isSelected ? selectedBg : itemHover
                  }`}
                  style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                  {isDir ? (
                    isCollapsed ? (
                      <ChevronRight size={14} className={subC} />
                    ) : (
                      <ChevronDown size={14} className={subC} />
                    )
                  ) : (
                    <span className="w-3.5" />
                  )}

                  {fileRowIcon(node.name, appearanceDark)}

                  <span
                    className={`min-w-0 truncate text-sm ${isDir ? `font-semibold ${dirText}` : title}`}
                  >
                    {node.name}
                  </span>

                  {node.gitStatus && (
                    <span className={`ml-auto text-xs ${gitBadge}`}>
                      {node.gitStatus}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2 text-xs ${subC} ${sectionBorder}`}
      >
        <span>{flatNodes.length} items</span>
      </div>
    </div>
  );
}

export default FileExplorer;
