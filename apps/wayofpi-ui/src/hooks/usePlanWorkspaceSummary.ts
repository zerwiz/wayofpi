import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export type PlanWorkspaceLatest = {
	path: string;
	mtimeMs: number;
	openTodos: number;
	doneTodos: number;
};

type PlansApi = {
	files: Array<{ path: string; mtimeMs: number }>;
	latest: PlanWorkspaceLatest | null;
};

export function usePlanWorkspaceSummary(enabled: boolean): PlanWorkspaceLatest | null {
	const [latest, setLatest] = useState<PlanWorkspaceLatest | null>(null);

	useEffect(() => {
		if (!enabled) {
			setLatest(null);
			return;
		}
		let cancelled = false;
		const run = () => {
			void apiGet<PlansApi>("/api/plans")
				.then((d) => {
					if (!cancelled) setLatest(d.latest ?? null);
				})
				.catch(() => {
					if (!cancelled) setLatest(null);
				});
		};
		run();
		const id = window.setInterval(run, 12_000);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [enabled]);

	return latest;
}
