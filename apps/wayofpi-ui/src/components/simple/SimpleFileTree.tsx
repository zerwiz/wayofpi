import { ChevronDown, ChevronRight, FileCode2, FileJson, File as FileIcon, Folder } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TreeNode } from "../../types/tree";
import { GitExplorerStatusBadge } from "../GitExplorerStatusBadge";
import { gitExplorerRowTitle } from "../../utils/gitStatusUi";
import { sortTreeNodes } from "../../utils/sortTreeNodes";

function fileRowIcon(name: string, appearanceDark: boolean) {
	const lower = name.toLowerCase();
	const code = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const json = appearanceDark ? "text-amber-400/90" : "text-amber-700";
	if (lower.endsWith(".json")) return <FileJson size={15} className={`shrink-0 ${json}`} />;
	if (
		lower.endsWith(".py") ||
		lower.endsWith(".ts") ||
		lower.endsWith(".tsx") ||
		lower.endsWith(".js") ||
		lower.endsWith(".jsx") ||
		lower.endsWith(".md")
	) {
		return <FileCode2 size={15} className={`shrink-0 ${code}`} />;
	}
	return <FileIcon size={15} className={`shrink-0 ${code}`} />;
}

function parentDirPaths(filePath: string): string[] {
	const norm = filePath.replace(/\\/g, "/");
	const segs = norm.split("/").filter(Boolean);
	if (segs.length <= 1) return [];
	const out: string[] = [];
	let acc = "";
	for (let i = 0; i < segs.length - 1; i++) {
		acc = acc ? `${acc}/${segs[i]}` : segs[i];
		out.push(acc);
	}
	return out;
}

export function SimpleFileTree({
	nodes,
	selectedPath,
	onSelectFile,
	appearanceDark,
	onExplorerGitMutated,
}: {
	nodes: TreeNode[];
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	appearanceDark: boolean;
	onExplorerGitMutated?: () => void;
}) {
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
	const sorted = useMemo(() => sortTreeNodes(nodes), [nodes]);

	useEffect(() => {
		if (!selectedPath) return;
		const parents = parentDirPaths(selectedPath);
		if (parents.length === 0) return;
		setExpanded((prev) => {
			const next = new Set(prev);
			for (const p of parents) next.add(p);
			return next;
		});
	}, [selectedPath]);

	const toggle = useCallback((path: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	}, []);

	const chevron = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const dirName = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const hoverRow = appearanceDark ? "hover:bg-[#3c3c3c]/80" : "hover:bg-[#e5e5e5]";
	const fileName = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";

	const renderNodes = (list: TreeNode[], depth: number): ReactNode =>
		list.map((node) => {
			const isDir = node.type === "dir";
			const isOpen = expanded.has(node.path);
			const selected = selectedPath === node.path;
			const modified =
				!isDir &&
				node.gitStatus != null &&
				node.gitStatus !== "" &&
				node.gitStatus !== " " &&
				node.gitStatus !== "*";

			const rowBase = `flex w-full items-center rounded-lg border px-2 py-1.5 text-left text-[13px] font-medium transition-colors ${hoverRow}`;
			const rowSelected = selected
				? appearanceDark
					? "border-[#ea580c]/40 bg-[#ea580c]/10"
					: "border-[#ea580c]/50 bg-[#ea580c]/10"
				: modified
					? "border-amber-500/25 bg-amber-500/10"
					: "border-transparent";

			return (
				<div key={node.path}>
					<button
						type="button"
						title={gitExplorerRowTitle(node.gitStatus)}
						onClick={() => {
							if (isDir) toggle(node.path);
							else onSelectFile(node.path);
						}}
						className={`${rowBase} ${rowSelected} w-full`}
						style={{ paddingLeft: `${6 + depth * 14}px` }}
					>
						<div className="flex min-w-0 flex-1 items-center gap-1.5">
							{isDir ? (
								<>
									{isOpen ? (
										<ChevronDown size={14} className={`shrink-0 ${chevron}`} aria-hidden />
									) : (
										<ChevronRight size={14} className={`shrink-0 ${chevron}`} aria-hidden />
									)}
									<Folder size={14} className={`shrink-0 ${appearanceDark ? "text-[#fb923c]/90" : "text-[#ea580c]"}`} />
									<span
										className={`min-w-0 flex-1 truncate font-mono ${dirName} ${
											node.gitStatus && node.gitStatus !== "??" && node.gitStatus !== "*"
												? appearanceDark
													? "text-[#e2c08d]"
													: "text-amber-800"
												: ""
										}${node.gitStatus === "*" ? (appearanceDark ? " text-[#858585]" : " text-[#737373]") : ""}`}
									>
										{node.name}
									</span>
									{node.gitStatus ? (
										<GitExplorerStatusBadge
											gitStatus={node.gitStatus}
											relativePath={node.path}
											variant="simple"
											appearanceDark={appearanceDark}
											onExplorerGitMutated={onExplorerGitMutated}
										/>
									) : null}
								</>
							) : (
								<>
									<div className="w-[14px] shrink-0" aria-hidden />
									{fileRowIcon(node.name, appearanceDark)}
									<span
										className={`min-w-0 flex-1 truncate font-mono ${modified ? "font-semibold text-amber-500" : fileName}`}
									>
										{node.name}
									</span>
									{node.gitStatus ? (
										<GitExplorerStatusBadge
											gitStatus={node.gitStatus}
											relativePath={node.path}
											variant="simple"
											appearanceDark={appearanceDark}
											onExplorerGitMutated={onExplorerGitMutated}
										/>
									) : null}
								</>
							)}
						</div>
					</button>
					{isDir && isOpen && node.children?.length ? renderNodes(node.children, depth + 1) : null}
				</div>
			);
		});

	return <div className="min-h-0 flex-1 overflow-y-auto pr-1">{renderNodes(sorted, 0)}</div>;
}
