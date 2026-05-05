import { useCallback, useEffect, useState } from "react";

export type UiMode = "simple" | "technical" | "claw" | "docs" | "work";

const STORAGE_KEY = "wayofpi.uiMode";

function readStored(): UiMode {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === "technical" || v === "simple" || v === "claw" || v === "docs" || v === "work") return v;
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
			const next: UiMode = m === "simple" ? "technical" : m === "technical" ? "claw" : m === "claw" ? "docs" : m === "docs" ? "work" : "simple";
			try {
				localStorage.setItem(STORAGE_KEY, next);
			} catch {
				/* ignore */
			}
			return next;
		});
	}, []);

	/** Switch directly to docs mode. */
	const switchToDocs = useCallback(() => {
		setModeState("docs");
		try {
			localStorage.setItem(STORAGE_KEY, "docs");
		} catch { /* ignore */ }
	}, []);

	return { mode, setMode, toggleMode, switchToDocs, isTechnical: mode === "technical", isClaw: mode === "claw", isDocs: mode === "docs", isWork: mode === "work" };
}
