/**
 * **Pi agent runtime** — when **`WOP_CHAT_ENGINE=pi`** or **`auto`**, chat turns can run through **`pi --mode json`**
 * with cwd = primary workspace so **`.pi/settings.json`**, built-ins (**read**, **write**, **edit**, **bash**, …),
 * and **extension-registered** tools match the Pi TUI.
 * See **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`** and **`.cursor/rules/wop-ui-pi-backend-parity.mdc`**.
 */

import type { ChatMessage, StreamChatResult } from "./chat";
import type { StreamTokenUsage } from "./chat-usage";
import { resolvePiBinaryPath } from "./pi-binary";
import { streamPiJsonChatTurn } from "./pi-json-mode-chat";

export { resolvePiBinaryPath } from "./pi-binary";

/** Normalized `WOP_CHAT_ENGINE`: **`pi`** (require Pi), **`auto`** (Pi if CLI resolves), else **bundled** (Bun → provider). */
export type WopChatEngineMode = "pi" | "auto" | "bundled";

export function wopChatEngineFromEnv(): WopChatEngineMode {
	const v = (process.env.WOP_CHAT_ENGINE || "").trim().toLowerCase();
	if (v === "pi") return "pi";
	if (v === "auto") return "auto";
	return "bundled";
}

let piJsonChatRuntimeOverride: boolean | undefined;

/**
 * In-memory **`pi --mode json`** toggle from **`POST /api/config`** (`piDrivesChat`) until process restart;
 * **`null`** clears the override ( **`WOP_CHAT_ENGINE`** applies again).
 */
export function patchPiJsonChatRuntimeOverride(value: boolean | null): void {
	piJsonChatRuntimeOverride = value === null ? undefined : value;
}

/** Strict **`WOP_CHAT_ENGINE=pi`** — server must error if the Pi CLI is missing (no silent fallback to Bun). */
export function isPiChatEngineForced(): boolean {
	return wopChatEngineFromEnv() === "pi";
}

/**
 * Use **`pi --mode json`** for this turn when the operator chose **`pi`** or **`auto`** and **`pi`** resolves.
 * All workspace personas (orchestrator + **`.md`** agents) share this path — **full Pi tools** inside the subprocess.
 */
export function shouldUsePiJsonChat(): boolean {
	if (piJsonChatRuntimeOverride === false) return false;
	if (piJsonChatRuntimeOverride === true) {
		return resolvePiBinaryPath() != null;
	}
	const mode = wopChatEngineFromEnv();
	if (mode === "bundled") return false;
	return resolvePiBinaryPath() != null;
}

/**
 * When **`WOP_CHAT_ENGINE=pi`** (strict) but the **`pi`** binary cannot be resolved (`WOP_PI_BINARY` or PATH).
 * **`auto`** without a CLI falls back to Bun and does **not** use this error.
 */
export function piAgentRuntimeBlockedReason(): string | null {
	if (piJsonChatRuntimeOverride === false) return null;
	if (!isPiChatEngineForced()) return null;
	if (!resolvePiBinaryPath()) {
		return (
			"Chat engine is Pi (`WOP_CHAT_ENGINE=pi`), but the Pi CLI was not found. " +
			"Install Pi on your PATH or set **`WOP_PI_BINARY`** to the absolute path of the `pi` executable, " +
			"or use **`WOP_CHAT_ENGINE=auto`** to fall back to the interim provider when Pi is missing."
		);
	}
	return null;
}

/** @deprecated Prefer `RunPiChatTurnOpts` — kept for wiring-plan references. */
export type PiChatTurnContext = {
	workspaceRoot: string;
	sessionKey: string | null;
};

export type RunPiChatTurnOpts = {
	cwd: string;
	messages: ChatMessage[];
	onDelta: (s: string) => void;
	/** Forward Pi `thinking_delta` to the client as `assistant_reasoning_delta`. */
	onReasoningDelta?: (s: string) => void;
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void;
	signal?: AbortSignal;
};

/** Serialize prior turns + latest user line for a single `pi --mode json` prompt. */
export function messagesToPiPrompt(messages: ReadonlyArray<ChatMessage>): string {
	const parts: string[] = [];
	for (const m of messages) {
		if (m.role === "system") {
			parts.push(`[system]\n${m.content ?? ""}`);
		} else if (m.role === "user") {
			parts.push(`[user]\n${m.content ?? ""}`);
		} else if (m.role === "assistant") {
			const body = m.content ?? "";
			const tc = m.tool_calls?.length
				? `\n[tool_calls]\n${JSON.stringify(m.tool_calls, null, 2)}`
				: "";
			parts.push(`[assistant]\n${body}${tc}`);
		} else if (m.role === "tool") {
			parts.push(`[tool name=${m.name ?? "?"} id=${m.tool_call_id ?? ""}]\n${m.content ?? ""}`);
		}
	}
	return parts.join("\n\n---\n\n");
}

export async function runPiChatTurn(
	opts: RunPiChatTurnOpts,
): Promise<{ result: StreamChatResult; lastStreamUsage: StreamTokenUsage | null }> {
	const piBinary = resolvePiBinaryPath();
	if (!piBinary) {
		return {
			result: { ok: false, error: "Pi CLI not found (set WOP_PI_BINARY or install `pi` on PATH)." },
			lastStreamUsage: null,
		};
	}
	const prompt = messagesToPiPrompt(opts.messages);
	const r = await streamPiJsonChatTurn({
		piBinary,
		cwd: opts.cwd,
		prompt,
		signal: opts.signal,
		onDelta: opts.onDelta,
		onReasoningDelta: opts.onReasoningDelta,
		onLog: opts.onLog,
	});
	if (r.ok) {
		return { result: { ok: true }, lastStreamUsage: r.lastStreamUsage };
	}
	if ("aborted" in r && r.aborted) {
		return { result: { ok: false, aborted: true }, lastStreamUsage: null };
	}
	return { result: { ok: false, error: r.error }, lastStreamUsage: null };
}
