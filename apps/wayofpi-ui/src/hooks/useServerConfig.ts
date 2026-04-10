import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export interface ServerConfig {
	provider: string;
	ollamaHost: string;
	ollamaModel: string;
	openrouterModel: string;
	/** True when `WOP_ALLOW_TERMINAL=1` — WebSocket `/ws/terminal` is allowed. */
	terminalEnabled?: boolean;
}

export function useServerConfig() {
	const [config, setConfig] = useState<ServerConfig | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiGet<ServerConfig>("/api/config")
			.then(setConfig)
			.catch((e) => setError(e instanceof Error ? e.message : String(e)));
	}, []);

	return { config, error };
}
