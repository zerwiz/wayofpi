import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";
import type { ClawTelegramStatusV1 } from "../../shared/claw-telegram-status";

const POLL_MS = 30_000;

export function useClawTelegramStatus() {
	const [status, setStatus] = useState<ClawTelegramStatusV1 | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async (mode: "full" | "silent" = "full") => {
		if (mode === "full") setLoading(true);
		setError(null);
		try {
			const s = await apiGet<ClawTelegramStatusV1>("/api/claw/telegram/status");
			setStatus(s);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
			setStatus(null);
		} finally {
			if (mode === "full") setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh("full");
		const id = window.setInterval(() => void refresh("silent"), POLL_MS);
		return () => window.clearInterval(id);
	}, [refresh]);

	return { status, loading, error, refresh };
}
