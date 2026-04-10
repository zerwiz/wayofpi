import { ChevronDown, ChevronRight, FileCode2, FileJson, File as FileIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import type { TreeNode } from "../types/tree";
import { sortTreeNodes } from "../utils/sortTreeNodes";

function fileIcon(name: string) {
	const lower = name.toLowerCase();
	if (lower.endsWith(".json")) return <FileJson size={13} className="text-[#cbcb41]" />;
	if (
		lower.endsWith(".py") ||
		lower.endsWith(".ts") ||
		lower.endsWith(".tsx") ||
		lower.endsWith(".js") ||
		lower.endsWith(".jsx") ||
		lower.endsWith(".md")
	) {
		return <FileCode2 size={13} className="text-[#519aba]" />;
	}
	return <FileIcon size={13} className="text-[#cccccc]" />;
}

export function FileTree({
	nodes,
	selectedPath,
	secondarySelectedPath,
	/** Files open in another main editor column (not the focused one). */
	openInMainEditorPaths,
	onSelectFile,
	onSelectDirectory,
	expandRevision,
	pathsToExpand,
}: {
	nodes: TreeNode[];
	selectedPath: string | null;
	onSelectFile: (path: string, ev?: MouseEvent) => void;
	/** Secondary highlight (e.g. file open in top/middle aux dock). */
	secondarySelectedPath?: string | null;
	openInMainEditorPaths?: readonly string[];
	onSelectDirectory?: (dirPath: string) => void;
	/** Bump when `pathsToExpand` should be merged into expanded folders. */
	expandRevision?: number;
	pathsToExpand?: string[];
}) {
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
	const sorted = useMemo(() => sortTreeNodes(nodes), [nodes]);

	useEffect(() => {
		if (expandRevision === undefined || !pathsToExpand?.length) return;
		setExpanded((prev) => {
			const next = new Set(prev);
			for (const p of pathsToExpand) next.add(p);
			return next;
		});
	}, [expandRevision, pathsToExpand]);

	const toggle = useCallback((path: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	}, []);

	const renderNodes = (list: TreeNode[], depth: number): ReactNode => {
		return list.map((node) => (
			<div key={node.path}>
				<button
					type="button"
					className={`flex w-full cursor-pointer items-center px-2 py-1 text-left hover:bg-[#2a2d2e] ${
						selectedPath === node.path
							? "bg-[#37373d]"
							: secondarySelectedPath === node.path
								? "bg-[#2d3d4a] ring-1 ring-inset ring-[#ea580c]/40"
								: node.type === "file" && openInMainEditorPaths?.includes(node.path)
									? "bg-[#2d2d2d] text-[#cccccc] ring-1 ring-inset ring-[#858585]/35"
									: "text-[#cccccc]"
					}`}
					style={{ paddingLeft: `${depth * 12 + 8}px` }}
					onClick={(e) => {
						if (node.type === "dir") {
							toggle(node.path);
							onSelectDirectory?.(node.path);
						} else {
							onSelectFile(node.path, e);
						}
					}}
				>
					<div className="flex w-full min-w-0 items-center gap-1.5">
						{node.type === "dir" ? (
							<>
								{expanded.has(node.path) ? (
									<ChevronDown size={14} className="shrink-0 text-[#cccccc]" />
								) : (
									<ChevronRight size={14} className="shrink-0 text-[#cccccc]" />
								)}
								<span className="truncate font-mono text-[13px]">{node.name}</span>
							</>
						) : (
							<>
								<div className="w-3 shrink-0" />
								{fileIcon(node.name)}
								<span
									className={`truncate font-mono text-[13px] ${
										node.gitStatus && node.gitStatus !== "??" ? "text-[#e2c08d]" : ""
									}`}
								>
									{node.name}
								</span>
								{node.gitStatus ? (
									<span className="ml-auto shrink-0 text-[11px] font-bold text-[#e2c08d]">
										{node.gitStatus}
									</span>
								) : null}
							</>
						)}
					</div>
				</button>
				{node.type === "dir" && expanded.has(node.path) && node.children
					? renderNodes(node.children, depth + 1)
					: null}
			</div>
		));
	};

	return <div className="py-1">{renderNodes(sorted, 0)}</div>;
}
