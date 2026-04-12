import { useCallback, useEffect, useState } from "react";
import { parseClawTelegramStatusV1, type ClawTelegramStatusV1 } from "../../shared/claw-telegram-status";
import { apiGet } from "../api/client";
import type { ClawAutomationStatus } from "./useClawAutomationStatus";

export type WayofpiApiCapabilities = {
	workspaceProblems?: boolean;
	/** This Bun build supports **`POST /api/config`** session toggles (Extensions → Orchestration). */
	configRuntimePost?: boolean;
	/** This Bun build exposes **`GET /api/claw/tree`** (Claw host `.claw/` explorer). */
	clawHostTreeGet?: boolean;
	/** Telegram snapshot on **`GET /api/config`** and **`GET /api/claw/telegram/status`**. */
	clawTelegramStatusGet?: boolean;
};

export interface ServerConfig {
	provider: string;
	/** Echo of **`GET /api/health`** `capabilities` when present — detect stale Bun vs this UI. */
	capabilities?: WayofpiApiCapabilities;
	/** Effective chat backend label: **`pi`**, **`auto`**, or provider id when bundled. */
	chatEngine: string;
	/** True when **`pi`** resolves and headless Pi JSON is active — all personas use `pi --mode json` (full Pi tools). */
	piDrivesChat: boolean;
	/** True when engine mode is **`pi`** or **`auto`** (includes **unset**, which defaults to **`auto`**). */
	piChatEngineRequested?: boolean;
	/** Same as **`piDrivesChat`** today: Pi binary found for JSON-mode turns. */
	piChatEngineWired?: boolean;
	/** **`pi`** executable resolved on the server (PATH or **`WOP_PI_BINARY`**). */
	piBinaryResolved?: boolean;
	/** Open workspace folder contains **`.pi/`** (settings tree — not the Pi CLI). */
	workspaceDotPiPresent?: boolean;
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
	/** Node `process.arch` from the Bun server (`arm64` on Apple Silicon, `x64` on Intel/Rosetta). */
	arch?: string;
	/** Way of Pi checkout root where host-scoped **`.claw/`** lives (not the opened project workspace). */
	clawHostRepoRoot?: string;
	/** Absolute host **`.claw/`** (optional `telegram.json`, etc.). */
	clawDotDirAbs?: string;
	/** Absolute **`.claw/workspace/`** (seven scaffold files + `memory/`). */
	clawWorkspaceDirAbs?: string;
	/** Same shape as **`GET /api/claw/automation`** — echoed on **`GET /api/config`** for Claw Mission. */
	clawAutomation?: ClawAutomationStatus;
	/** Same shape as **`GET /api/claw/telegram/status`** — echoed on **`GET /api/config`** for Claw Channels. */
	clawTelegramStatus?: ClawTelegramStatusV1;
}

/**
 * Older APIs omitted **`piChatEngineRequested`** (undefined → was wrongly read as false).
 * Legacy servers also sent **`piChatEngineRequested: false`** with **`chatEngine: ollama`** when **`WOP_CHAT_ENGINE=ollama`**
 * was misinterpreted as Bun-only — treat that as Pi/auto intent for Mission / diagnostics copy.
 */
function normalizePiChatEngineRequested(raw: ServerConfig): boolean {
	const explicit = raw.piChatEngineRequested;
	const ce = String(raw.chatEngine ?? "").trim().toLowerCase();
	if (explicit === true) return true;
	if (explicit === false) {
		if (ce === "bundled" || ce === "bun") return false;
		if (ce === "ollama" || ce === "openrouter") return true;
		return false;
	}
	if (ce === "bundled" || ce === "bun") return false;
	return true;
}

function normalizeServerConfig(raw: ServerConfig): ServerConfig {
	const cap = raw.capabilities;
	return {
		...raw,
		capabilities: cap
			? {
					workspaceProblems: cap.workspaceProblems === true,
					configRuntimePost: cap.configRuntimePost === true,
					clawHostTreeGet: cap.clawHostTreeGet === true,
					clawTelegramStatusGet: cap.clawTelegramStatusGet === true,
				}
			: undefined,
		chatEngine: raw.chatEngine ?? raw.provider ?? "ollama",
		piDrivesChat: raw.piDrivesChat ?? false,
		piChatEngineRequested: normalizePiChatEngineRequested(raw),
		piChatEngineWired: raw.piChatEngineWired ?? false,
		piBinaryResolved: raw.piBinaryResolved ?? false,
		workspaceDotPiPresent: raw.workspaceDotPiPresent === true,
		orchestratorTools: raw.orchestratorTools ?? false,
		orchestratorBash: raw.orchestratorBash ?? false,
		clawHostRepoRoot: typeof raw.clawHostRepoRoot === "string" ? raw.clawHostRepoRoot : undefined,
		clawDotDirAbs: typeof raw.clawDotDirAbs === "string" ? raw.clawDotDirAbs : undefined,
		clawWorkspaceDirAbs: typeof raw.clawWorkspaceDirAbs === "string" ? raw.clawWorkspaceDirAbs : undefined,
		clawAutomation: (() => {
			const a = raw.clawAutomation;
			if (!a || typeof a !== "object") return undefined;
			if ((a as ClawAutomationStatus).version !== 1) return undefined;
			return a as ClawAutomationStatus;
		})(),
		clawTelegramStatus: parseClawTelegramStatusV1(raw.clawTelegramStatus) ?? undefined,
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
