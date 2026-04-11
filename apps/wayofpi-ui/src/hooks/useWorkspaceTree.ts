import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";
import type { TreeNode, WorkspaceFolderInfo, WorkspaceGitState, WorkspaceResponse } from "../types/tree";

const emptyGit: WorkspaceGitState = { roots: [] };

export function useWorkspaceTree() {
	const [root, setRoot] = useState<string>("");
	const [nodes, setNodes] = useState<TreeNode[]>([]);
	const [folders, setFolders] = useState<WorkspaceFolderInfo[]>([]);
	const [git, setGit] = useState<WorkspaceGitState>(emptyGit);
	const [switchAllowed, setSwitchAllowed] = useState(true);
	const [initialRoot, setInitialRoot] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await apiGet<WorkspaceResponse>("/api/tree");
			setRoot(data.root);
			setNodes(data.nodes);
			setFolders(data.folders ?? []);
			setGit(data.git ?? emptyGit);
			setSwitchAllowed(data.switchAllowed !== false);
			setInitialRoot(data.initialRoot ?? "");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setRoot("");
			setInitialRoot("");
			setNodes([]);
			setFolders([]);
			setGit(emptyGit);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { root, nodes, folders, git, switchAllowed, initialRoot, error, loading, refresh };
}
