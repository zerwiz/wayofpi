import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export interface ServerConfig {
	provider: string;
	/** Effective chat backend label: **`pi`**, **`auto`**, or provider id when bundled. */
	chatEngine: string;
	/** True when **`WOP_CHAT_ENGINE`** is **`pi`** or **`auto`** and **`pi`** resolves — all personas use `pi --mode json` (full Pi tools). */
	piDrivesChat: boolean;
	/** True when **`WOP_CHAT_ENGINE`** is **`pi`** or **`auto`** (Pi backend requested; **`auto`** falls back to Bun if **`pi`** is missing). */
	piChatEngineRequested?: boolean;
	/** Same as **`piDrivesChat`** today: Pi binary found for JSON-mode turns. */
	piChatEngineWired?: boolean;
	/** Pi-shaped workspace tools on orchestrator turns (read/grep/…); not full Pi extensions. */
	orchestratorTools?: boolean;
	orchestratorBash?: boolean;
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
					piChatEngineRequested: raw.piChatEngineRequested ?? false,
					piChatEngineWired: raw.piChatEngineWired ?? false,
					orchestratorTools: raw.orchestratorTools ?? false,
					orchestratorBash: raw.orchestratorBash ?? false,
				}),
			)
			.catch((e) => setError(e instanceof Error ? e.message : String(e)));
	}, []);

	return { config, error };
}
