/**
 * **Pi agent runtime** — routes chat turns through the pi.dev SDK.
 *
 * Engine modes (`WOP_CHAT_ENGINE`):
 * - **`sdk`** — use `@earendil-works/pi-coding-agent` SDK directly (typed events, in-process tools).
 * - **`auto`** — try SDK first; if unavailable, fall back to Bundled Bun chat.
 * - **`bundled`** / **`bun`** — force Bundled Bun path (no pi SDK).
 *
 * The **SDK path** replaces the fragile subprocess approach:
 * - No binary discovery / PATH hacks
 * - No JSONL stream parsing
 * - Typed `AgentSessionEvent` subscriptions
 * - In-process tool execution
 * - No ENOENT errors from missing pi binary
 */

import type { ChatMessage, ChatRuntimeModel, StreamChatResult } from "./chat";
import type { StreamTokenUsage } from "./chat-usage";
import { isSdkAvailable, runSdkChatTurn } from "./pi-sdk-runtime";

export { isSdkAvailable } from "./pi-sdk-runtime";

/**
 * Stub — piDrivesChat is always managed via SDK in the current architecture.
 * Kept for backward compat with /api/config POST handler in index.ts.
 */
export function patchPiJsonChatRuntimeOverride(_v: boolean | null): void {}

/** Stub — pi is never "blocked" in SDK mode. */
export function piAgentRuntimeBlockedReason(): string | null { return null; }

/**
 * Normalized `WOP_CHAT_ENGINE`:
 * - **`sdk`** — use `@earendil-works/pi-coding-agent` SDK directly.
 * - **`auto`** — SDK → Bun, whichever resolves first.
 * - **`bundled`** / **`bun`** — force Bundled Bun path.
 * - **Unset** or any other value — treated as **`auto`**, preferring SDK.
 */
export type WopChatEngineMode = "sdk" | "auto" | "bundled";

export function wopChatEngineFromEnv(): WopChatEngineMode {
	const v = (process.env.WOP_CHAT_ENGINE || "").trim().toLowerCase();
	if (v === "sdk") return "sdk";
	if (v === "auto") return "auto";
	if (v === "bundled" || v === "bun") return "bundled";
	return "sdk";
}

/**
 * Use the SDK (`@earendil-works/pi-coding-agent`) for chat turns.
 * In SDK mode the runtime always requires the SDK package.
 */
export function shouldUseSdkChat(): boolean {
	const mode = wopChatEngineFromEnv();
	if (mode === "sdk") return true;
	if (mode === "bundled") return false;
	return isSdkAvailable();
}

/** Deprecated — SDK-only mode, no subprocess fallback. */
export function shouldUsePiJsonChat(): boolean {
	return false;
}

/** Deprecated — not needed in SDK mode. */
export function getPiStackForSurface(_surface: string | null): string {
	return "";
}

/** Deprecated — no binary resolution needed in SDK mode. */
export function resolvePiBinaryPath(): string | null {
	return null;
}

/** Deprecated — no loader path needed in SDK mode. */
export function resolvePiLoaderPath(): string | null {
	return null;
}

export type RunPiChatTurnOpts = {
	piStack?: string;
	cwd: string;
	messages: ChatMessage[];
	onDelta: (s: string) => void;
	onReasoningDelta?: (s: string) => void;
	onStreamUsage?: (u: StreamTokenUsage) => void;
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void;
	signal?: AbortSignal;
	runtime?: ChatRuntimeModel;
};

export async function runPiChatTurn(
	opts: RunPiChatTurnOpts,
): Promise<{ result: StreamChatResult; lastStreamUsage: StreamTokenUsage | null }> {
	if (!shouldUseSdkChat()) {
		return {
			result: { ok: false, error: "Chat engine is not SDK mode (set WOP_CHAT_ENGINE=sdk or auto)." },
			lastStreamUsage: null,
		};
	}

	if (!isSdkAvailable()) {
		return {
			result: { ok: false, error: "@earendil-works/pi-coding-agent not installed. Run bun install." },
			lastStreamUsage: null,
		};
	}

	return runSdkChatTurn({
		cwd: opts.cwd,
		messages: opts.messages,
		onDelta: opts.onDelta,
		onReasoningDelta: opts.onReasoningDelta,
		onStreamUsage: opts.onStreamUsage,
		onLog: opts.onLog,
		signal: opts.signal,
		runtime: opts.runtime,
	});
}
