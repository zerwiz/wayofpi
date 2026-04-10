export interface TreeNode {
	name: string;
	path: string;
	type: "file" | "dir";
	gitStatus?: string;
	children?: TreeNode[];
}

export interface WorkspaceFolderInfo {
	label: string;
	path: string;
}

export interface WorkspaceResponse {
	root: string;
	nodes: TreeNode[];
	folders: WorkspaceFolderInfo[];
	switchAllowed: boolean;
	initialRoot: string;
}
