import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPostJson } from "../api/client";
import type { WorkspaceProblemsResponse } from "../types/workspaceProblems";

const EMPTY: WorkspaceProblemsResponse = {
	ok: true,
	ranAt: new Date(0).toISOString(),
	engine: "none",
	problems: [],
	exitCode: null,
	log: "",
};

export function useWorkspaceStaticAnalysis(enabled: boolean) {
	const [snapshot, setSnapshot] = useState<WorkspaceProblemsResponse>(EMPTY);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loadCached = useCallback(async () => {
		if (!enabled) {
			setSnapshot(EMPTY);
			return;
		}
		try {
			const r = await apiGet<WorkspaceProblemsResponse>("/api/workspace/problems");
			setSnapshot(r);
		} catch (e) {
			const hint =
				e instanceof Error
					? e.message
					: "Network error";
			const stale404 =
				/404/i.test(hint) && /not\s*found/i.test(hint);
			setSnapshot({
				...EMPTY,
				ok: false,
				error: "Could not reach the Way of Pi Bun server (GET /api/workspace/problems failed).",
				log: stale404
					? `${hint}\n\nOften this 404 means an old Bun process is still bound to port 3333 (/api/health works but routes are missing). Stop that process (ss -tlnp | grep 3333, then kill the PID) and start again: cd apps/wayofpi-ui && bun run server/index.ts — or use Start service after restarting Vite so it can detect a stale API.`
					: `${hint}\n\nFix: run the API from apps/wayofpi-ui (e.g. bun run server/index.ts or the full dev script) so Vite can proxy /api. Opening only the Vite preview without the server returns 404 for this route.`,
			});
		}
	}, [enabled]);

	const runAnalysis = useCallback(async () => {
		if (!enabled) return;
		setLoading(true);
		try {
			const r = await apiPostJson<WorkspaceProblemsResponse>("/api/workspace/problems/run", {});
			setSnapshot(r);
		} catch (e) {
			setSnapshot({
				...EMPTY,
				ok: false,
				error: e instanceof Error ? e.message : String(e),
				ranAt: new Date().toISOString(),
				log: e instanceof Error ? e.message : String(e),
			});
		} finally {
			setLoading(false);
		}
	}, [enabled]);

	const scheduleDebouncedRefresh = useCallback(() => {
		if (!enabled) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			void runAnalysis();
		}, 1400);
	}, [enabled, runAnalysis]);

	useEffect(() => {
		void loadCached();
	}, [loadCached]);

	useEffect(
		() => () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		},
		[],
	);

	const errorCount = snapshot.problems.filter((p) => p.severity === "error").length;
	const warningCount = snapshot.problems.filter((p) => p.severity === "warning").length;

	return {
		snapshot,
		loading,
		loadCached,
		runAnalysis,
		scheduleDebouncedRefresh,
		totalCount: snapshot.problems.length,
		errorCount,
		warningCount,
	};
}
