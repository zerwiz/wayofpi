import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "../api/client";
import type { TreeNode, WorkspaceFolderInfo, WorkspaceGitState, WorkspaceResponse } from "../types/tree";

const emptyGit: WorkspaceGitState = { roots: [] };

/** Poll the workspace tree every N ms to pick up on-disk changes (file saves, agent writes, etc). */
const TREE_POLL_MS = 4_000;

export function useWorkspaceTree() {
	const [root, setRoot] = useState<string>("");
	const [nodes, setNodes] = useState<TreeNode[]>([]);
	const [folders, setFolders] = useState<WorkspaceFolderInfo[]>([]);
	const [git, setGit] = useState<WorkspaceGitState>(emptyGit);
	const [switchAllowed, setSwitchAllowed] = useState(true);
	const [initialRoot, setInitialRoot] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const silentRefreshRef = useRef<() => Promise<void>>(async () => {});

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

	/** Silent background poll: updates tree without flashing the loading state. */
	const silentRefresh = useCallback(async () => {
		try {
			const data = await apiGet<WorkspaceResponse>("/api/tree");
			setRoot(data.root);
			setNodes(data.nodes);
			setFolders(data.folders ?? []);
			setGit(data.git ?? emptyGit);
			setSwitchAllowed(data.switchAllowed !== false);
			setInitialRoot(data.initialRoot ?? "");
		} catch {
			// ignore background poll errors — the explicit refresh will surface them
		}
	}, []);

	silentRefreshRef.current = silentRefresh;

	useEffect(() => {
		void refresh();
	}, [refresh]);

	// Auto-refresh: poll in the background so file-system changes (saves, agent writes,
	// new files) appear in the explorer without the user having to click refresh.
	useEffect(() => {
		const id = window.setInterval(() => {
			void silentRefreshRef.current?.();
		}, TREE_POLL_MS);
		return () => window.clearInterval(id);
	}, []);

	return { root, nodes, folders, git, switchAllowed, initialRoot, error, loading, refresh };
}
