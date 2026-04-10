import type { TreeNode } from "../types/tree";

export interface FlatFile {
	path: string;
	name: string;
}

export function flattenTreeFiles(nodes: TreeNode[]): FlatFile[] {
	const out: FlatFile[] = [];
	function walk(n: TreeNode): void {
		if (n.type === "file") out.push({ path: n.path, name: n.name });
		if (n.children) for (const c of n.children) walk(c);
	}
	for (const n of nodes) walk(n);
	out.sort((a, b) => a.path.localeCompare(b.path));
	return out;
}
