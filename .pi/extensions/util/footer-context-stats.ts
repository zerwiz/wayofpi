/**
 * Compact suffix for footers: context used/window (from getContextUsage) + session ↓in/↑out.
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

function num(v: unknown): number | undefined {
	return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function fmtTok(n: number): string {
	if (n < 1000) return `${Math.round(n)}`;
	if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
	return `${(n / 1_000_000).toFixed(2)}M`;
}

/** Returns a string like ` · 12k/128k ctx · ↓4k ↑1k` or empty if nothing to show. */
export function footerContextStats(ctx: ExtensionContext): string {
	const raw = ctx.getContextUsage() as Record<string, unknown> | null | undefined;
	let ctxBit = "";
	if (raw && typeof raw === "object") {
		const win = num(
			raw.contextWindow ?? raw.maxContextTokens ?? raw.total ?? raw.limit ?? raw.max,
		);
		const used = num(
			raw.used ??
				raw.usedTokens ??
				raw.inputTokens ??
				raw.promptTokens ??
				raw.tokens ??
				raw.input,
		);
		if (used != null && win != null && win > 0) {
			ctxBit = ` · ${fmtTok(used)}/${fmtTok(win)} ctx`;
		}
	}

	let tokIn = 0;
	let tokOut = 0;
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type === "message" && entry.message.role === "assistant") {
			const m = entry.message as AssistantMessage;
			tokIn += m.usage.input;
			tokOut += m.usage.output;
		}
	}
	const tokBit =
		tokIn + tokOut > 0 ? ` · ↓${fmtTok(tokIn)} ↑${fmtTok(tokOut)}` : "";

	const suffix = ctxBit + tokBit;
	return suffix.length ? suffix : "";
}
