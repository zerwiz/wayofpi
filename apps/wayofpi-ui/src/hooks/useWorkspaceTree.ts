import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";
import type { TreeNode, WorkspaceFolderInfo, WorkspaceResponse } from "../types/tree";

export function useWorkspaceTree() {
	const [root, setRoot] = useState<string>("");
	const [nodes, setNodes] = useState<TreeNode[]>([]);
	const [folders, setFolders] = useState<WorkspaceFolderInfo[]>([]);
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
			setSwitchAllowed(data.switchAllowed !== false);
			setInitialRoot(data.initialRoot ?? "");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setNodes([]);
			setFolders([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { root, nodes, folders, switchAllowed, initialRoot, error, loading, refresh };
}
