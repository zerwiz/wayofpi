import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { gitStatusMap } from "./git";
import { shouldSkipDir } from "./paths";
import { listWorkspaceFolders, type WorkspaceFolderEntry } from "./workspace-state";

export interface TreeNode {
	name: string;
	path: string;
	type: "file" | "dir";
	gitStatus?: string;
	children?: TreeNode[];
}

const MAX_DEPTH = 14;
const MAX_NODES = 4000;

async function readTreeRecursive(
	absDir: string,
	root: string,
	gitMap: Record<string, string>,
	depth: number,
	counter: { n: number },
): Promise<TreeNode[]> {
	if (depth > MAX_DEPTH || counter.n > MAX_NODES) return [];
	const entries = await readdir(absDir, { withFileTypes: true }).catch(() => []);
	const nodes: TreeNode[] = [];
	for (const ent of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (counter.n > MAX_NODES) break;
		if (ent.isDirectory() && shouldSkipDir(ent.name)) continue;
		const abs = join(absDir, ent.name);
		const rel = relative(root, abs).replace(/\\/g, "/");
		if (ent.isDirectory()) {
			counter.n += 1;
			const children = await readTreeRecursive(abs, root, gitMap, depth + 1, counter);
			nodes.push({
				name: ent.name,
				path: rel,
				type: "dir",
				gitStatus: gitMap[rel],
				children,
			});
		} else if (ent.isFile()) {
			counter.n += 1;
			nodes.push({
				name: ent.name,
				path: rel,
				type: "file",
				gitStatus: gitMap[rel],
			});
		}
	}
	return nodes;
}

function prefixTreeNodes(nodes: TreeNode[], label: string): TreeNode[] {
	return nodes.map((n) => ({
		...n,
		path: `${label}/${n.path}`,
		children: n.children ? prefixTreeNodes(n.children, label) : undefined,
	}));
}

export async function buildWorkspaceTree(): Promise<{
	root: string;
	nodes: TreeNode[];
	folders: WorkspaceFolderEntry[];
}> {
	const list = listWorkspaceFolders();

	if (list.length === 1) {
		const root = list[0].path;
		const gitMap = await gitStatusMap(root);
		const counter = { n: 0 };
		const nodes = await readTreeRecursive(root, root, gitMap, 0, counter);
		return { root, nodes, folders: list };
	}

	const top: TreeNode[] = [];
	for (const f of list) {
		const gitMap = await gitStatusMap(f.path);
		const counter = { n: 0 };
		const children = await readTreeRecursive(f.path, f.path, gitMap, 0, counter);
		const prefixed = prefixTreeNodes(children, f.label);
		top.push({
			name: f.label,
			path: f.label,
			type: "dir",
			children: prefixed,
		});
	}
	const rootDisplay = list.map((x) => x.path).join(" | ");
	return { root: rootDisplay, nodes: top, folders: list };
}
