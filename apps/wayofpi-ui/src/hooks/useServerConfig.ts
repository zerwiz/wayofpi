import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

export type WayofpiApiCapabilities = {
	workspaceProblems?: boolean;
	/** This Bun build supports **`POST /api/config`** session toggles (Extensions → Orchestration). */
	configRuntimePost?: boolean;
};

export interface ServerConfig {
	provider: string;
	/** Echo of **`GET /api/health`** `capabilities` when present — detect stale Bun vs this UI. */
	capabilities?: WayofpiApiCapabilities;
	/** Effective chat backend label: **`pi`**, **`auto`**, or provider id when bundled. */
	chatEngine: string;
	/** True when **`WOP_CHAT_ENGINE`** is **`pi`** or **`auto`** and **`pi`** resolves — all personas use `pi --mode json` (full Pi tools). */
	piDrivesChat: boolean;
	/** True when **`WOP_CHAT_ENGINE`** is **`pi`** or **`auto`** (Pi backend requested; **`auto`** falls back to Bun if **`pi`** is missing). */
	piChatEngineRequested?: boolean;
	/** Same as **`piDrivesChat`** today: Pi binary found for JSON-mode turns. */
	piChatEngineWired?: boolean;
	/** **`pi`** executable resolved on the server (PATH or **`WOP_PI_BINARY`**). */
	piBinaryResolved?: boolean;
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
	/** Shell binary the server spawns for the embedded terminal (from `WOP_SHELL` or default). */
	shellExecutable?: string;
	shellArgs?: string[];
	/** True when `WOP_SHELL` is set on the server. */
	customShell?: boolean;
	/** Node `process.platform` from the Bun server. */
	platform?: string;
}

function normalizeServerConfig(raw: ServerConfig): ServerConfig {
	const cap = raw.capabilities;
	return {
		...raw,
		capabilities: cap
			? {
					workspaceProblems: cap.workspaceProblems === true,
					configRuntimePost: cap.configRuntimePost === true,
				}
			: undefined,
		chatEngine: raw.chatEngine ?? raw.provider ?? "ollama",
		piDrivesChat: raw.piDrivesChat ?? false,
		piChatEngineRequested: raw.piChatEngineRequested ?? false,
		piChatEngineWired: raw.piChatEngineWired ?? false,
		piBinaryResolved: raw.piBinaryResolved ?? false,
		orchestratorTools: raw.orchestratorTools ?? false,
		orchestratorBash: raw.orchestratorBash ?? false,
	};
}

export function useServerConfig() {
	const [config, setConfig] = useState<ServerConfig | null>(null);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setError(null);
		try {
			const raw = await apiGet<ServerConfig>("/api/config");
			setConfig(normalizeServerConfig(raw));
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { config, error, refresh };
}
