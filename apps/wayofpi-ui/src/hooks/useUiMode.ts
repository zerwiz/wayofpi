import { useCallback, useEffect, useState } from "react";

export type UiMode = "simple" | "technical";

const STORAGE_KEY = "wayofpi.uiMode";

function readStored(): UiMode {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === "technical" || v === "simple") return v;
	} catch {
		/* ignore */
	}
	return "simple";
}

export function useUiMode() {
	const [mode, setModeState] = useState<UiMode>(() =>
		typeof window !== "undefined" ? readStored() : "simple",
	);

	useEffect(() => {
		setModeState(readStored());
	}, []);

	const setMode = useCallback((next: UiMode) => {
		setModeState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			/* ignore */
		}
	}, []);

	const toggleMode = useCallback(() => {
		setModeState((m) => {
			const next: UiMode = m === "simple" ? "technical" : "simple";
			try {
				localStorage.setItem(STORAGE_KEY, next);
			} catch {
				/* ignore */
			}
			return next;
		});
	}, []);

	return { mode, setMode, toggleMode, isTechnical: mode === "technical" };
}
