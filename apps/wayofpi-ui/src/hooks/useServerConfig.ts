import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export interface ServerConfig {
	provider: string;
	/** Effective chat backend label (`ollama` / `openrouter` / reserved `pi`). */
	chatEngine: string;
	/** True when headless Pi owns chat turns (not shipped yet — always false today). */
	piDrivesChat: boolean;
	/** Static manifest path (filesystem scan; not runtime Pi introspection). */
	manifestUrl?: string;
	ollamaHost: string;
	ollamaModel: string;
	openrouterModel: string;
	/** True when `WOP_ALLOW_TERMINAL` is enabled (`1`, `true`, `yes`, `on`) — WebSocket `/ws/terminal` is allowed. */
	terminalEnabled?: boolean;
}

export function useServerConfig() {
	const [config, setConfig] = useState<ServerConfig | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiGet<ServerConfig>("/api/config")
			.then((raw) =>
				setConfig({
					...raw,
					chatEngine: raw.chatEngine ?? raw.provider ?? "ollama",
					piDrivesChat: raw.piDrivesChat ?? false,
				}),
			)
			.catch((e) => setError(e instanceof Error ? e.message : String(e)));
	}, []);

	return { config, error };
}
