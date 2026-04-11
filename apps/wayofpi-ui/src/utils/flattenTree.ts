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

export interface GitMarkedTreeEntry {
	path: string;
	name: string;
	status: string;
	type: "file" | "dir";
}

/** All nodes that carry a Git label (including propagated `*` on folders). */
export function flattenTreeGitEntries(nodes: TreeNode[]): GitMarkedTreeEntry[] {
	const out: GitMarkedTreeEntry[] = [];
	function walk(n: TreeNode): void {
		if (n.gitStatus) out.push({ path: n.path, name: n.name, status: n.gitStatus, type: n.type });
		if (n.children) for (const c of n.children) walk(c);
	}
	for (const n of nodes) walk(n);
	out.sort((a, b) => a.path.localeCompare(b.path));
	return out;
}

/** Paths Git reported directly — omit folder-only `*` markers (nested changes). */
export function flattenDirectGitStatusPaths(nodes: TreeNode[]): GitMarkedTreeEntry[] {
	return flattenTreeGitEntries(nodes).filter((e) => e.type === "file" || e.status !== "*");
}
