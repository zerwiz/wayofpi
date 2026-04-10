import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPostJson } from "../api/client";
import type { UiViewsCatalogResponse } from "../types/uiViewsCatalog";

export function useUiViewsCatalog() {
	const [data, setData] = useState<UiViewsCatalogResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const d = await apiGet<UiViewsCatalogResponse>("/api/ui/views");
			setData(d);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setData(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	const seedCatalog = useCallback(async () => {
		await apiPostJson<{ ok: boolean; created: boolean; path: string }>("/api/ui/views/seed", {});
		await reload();
	}, [reload]);

	return {
		data,
		loading,
		error,
		reload,
		seedCatalog,
	};
}
