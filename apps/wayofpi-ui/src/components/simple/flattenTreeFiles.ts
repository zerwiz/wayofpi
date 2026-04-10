import type { TreeNode } from "../../types/tree";

export interface FlatFileRow {
	name: string;
	path: string;
	parentDir: string;
	gitStatus?: string;
}

export function flattenTreeFiles(nodes: TreeNode[], max = 100): FlatFileRow[] {
	const out: FlatFileRow[] = [];

	function walk(list: TreeNode[]) {
		for (const n of list) {
			if (out.length >= max) return;
			if (n.type === "file") {
				const parts = n.path.split(/[/\\]/);
				parts.pop();
				const parentDir = parts.length ? parts.join("/") + "/" : "";
				out.push({ name: n.name, path: n.path, parentDir, gitStatus: n.gitStatus });
			} else if (n.children?.length) {
				walk(n.children);
				if (out.length >= max) return;
			}
		}
	}

	walk(nodes);
	return out;
}
