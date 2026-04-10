/**
 * Context local hints — make local (e.g. Ollama) sessions more "context aware" in the prompt
 *
 * Ollama often omits or approximates streaming usage; Pi's footer meter is then a hint only.
 * This extension injects <context_awareness> each turn for configured providers so the model
 * sees turn count, a rough character/token estimate from the in-memory branch, configured
 * contextWindow, and concrete recovery steps (/remember, compaction, session saver).
 *
 * Env: PI_CONTEXT_HINT_PROVIDERS — comma-separated provider ids (default: "ollama").
 *      Also treats any model whose baseUrl contains "localhost", "127.0.0.1", or ":11434" as local.
 *
 * Commands: /context-hint [status|on|off]
 *
 * Usage: pi -e extensions/context-local-hints.ts — list after session-memory in .pi/settings.json
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./themeMap.ts";

function extractMessageText(entry: { message?: { content?: unknown } }): string {
	const msg = entry.message;
	if (!msg) return "";
	const content = msg.content as unknown;
	if (!content) return "";
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.map((c: { type?: string; text?: string; name?: string; arguments?: unknown }) => {
				if (c.type === "text") return c.text || "";
				if (c.type === "toolCall")
					return `Tool: ${c.name}(${JSON.stringify(c.arguments).slice(0, 200)})`;
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}
	return JSON.stringify(content).slice(0, 500);
}

function defaultHintProviders(): string[] {
	const raw = process.env.PI_CONTEXT_HINT_PROVIDERS?.trim();
	if (raw) {
		return raw
			.split(",")
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean);
	}
	return ["ollama"];
}

function modelBaseUrl(ctx: ExtensionContext): string {
	const m = ctx.model as { baseUrl?: string } | undefined;
	return typeof m?.baseUrl === "string" ? m.baseUrl.toLowerCase() : "";
}

function isLocalModel(ctx: ExtensionContext): boolean {
	const prov = (ctx.model?.provider || "").toLowerCase();
	const base = modelBaseUrl(ctx);
	if (
		base.includes("localhost") ||
		base.includes("127.0.0.1") ||
		base.includes(":11434")
	) {
		return true;
	}
	const allow = defaultHintProviders();
	return allow.includes(prov);
}

function branchStats(ctx: ExtensionContext): { turns: number; chars: number } {
	const sm = ctx.sessionManager as { getBranch?: () => unknown[] } | undefined;
	const getBranch = sm?.getBranch;
	if (!getBranch) return { turns: 0, chars: 0 };

	const branch = getBranch.call(sm);
	if (!Array.isArray(branch)) return { turns: 0, chars: 0 };

	let turns = 0;
	let chars = 0;
	for (const entry of branch as { type?: string; message?: { role?: string } }[]) {
		if (entry.type !== "message") continue;
		const msg = entry.message;
		if (!msg || (msg.role !== "user" && msg.role !== "assistant")) continue;
		const text = extractMessageText(entry as { message?: { content?: unknown } }).trim();
		if (!text) continue;
		turns++;
		chars += text.length;
	}
	return { turns, chars };
}

function formatUsage(ctx: ExtensionContext): string {
	const raw = ctx.getContextUsage?.() as Record<string, unknown> | null | undefined;
	if (!raw || typeof raw !== "object") return "(getContextUsage() not available or empty)";
	const parts: string[] = [];
	const pct = raw.percent;
	if (typeof pct === "number") parts.push(`Pi percent: ~${Math.round(pct)}%`);
	const win =
		raw.contextWindow ?? raw.maxContextTokens ?? raw.total ?? raw.limit ?? raw.max;
	const used = raw.used ?? raw.usedTokens ?? raw.promptTokens ?? raw.tokens ?? raw.input;
	if (typeof used === "number" && typeof win === "number" && win > 0) {
		parts.push(`used/window tokens (reported): ~${used}/${win}`);
	} else {
		parts.push(
			"Token used/window not exposed (common for local servers — treat footer meter as unreliable).",
		);
	}
	return parts.join(" · ");
}

function buildBlock(ctx: ExtensionContext): string {
	const mid = ctx.model?.id || "(unknown)";
	const prov = ctx.model?.provider || "(unknown)";
	const win = ctx.model?.contextWindow ?? 0;
	const { turns, chars } = branchStats(ctx);
	const roughTok = Math.round(chars / 4);

	let lines: string[] = [
		`You are on a **local or OpenAI-compatible** endpoint (provider **${prov}**, model **${mid}**).`,
		`Configured **contextWindow** in Pi: **${win > 0 ? win : "unknown / default"}** tokens — it must match the real model/NVRAM setup in **agent/models.json** or Pi will mis-report pressure.`,
		`Pi usage line: ${formatUsage(ctx)}`,
		`This session branch (in memory): **${turns}** messages worth of text, **${chars}** chars (~**${roughTok}** tokens, very rough ÷4 — not authoritative).`,
		``,
		`**When context is tight or the task is long:**`,
		`- Summarize and suggest the user start a **checkpoint** (gist of state in chat).`,
		`- Point them to **/remember** for durable notes (**~/.pi/storage/agent-memory.md**) — see **docs/AGENT_MEMORY.md**.`,
		`- **Session saver**: **/save**, **/load** a **.jsonl** if they use it; Pi may **compact** older turns (see session JSONL **compaction** lines).`,
		`- Prefer **smaller reads** and avoid pasting huge blobs back into the thread.`,
	];
	if (win > 0 && roughTok > win * 0.7) {
		lines.push(
			``,
			`**Heuristic alert:** estimated branch tokens are a large fraction of **contextWindow** — bias toward wrapping up, delegating to files under **plans/**, or asking the user to open a fresh chat with a short recap.`,
		);
	}
	return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
	let enabled = true;

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		if (!isLocalModel(ctx)) return;
		ctx.ui.notify(
			"Context local hints: extra <context_awareness> each turn for this model. /context-hint status",
			"info",
		);
	});

	pi.registerCommand("context-hint", {
		description:
			"Local context digest: /context-hint [status|on|off] — Ollama & PI_CONTEXT_HINT_PROVIDERS",
		handler: async (args, ctx) => {
			const a = args.trim().toLowerCase();
			if (a === "off" || a === "disable" || a === "0") {
				enabled = false;
				ctx.ui.notify("context_local_hints: OFF", "warning");
				return;
			}
			if (a === "on" || a === "enable" || a === "1") {
				enabled = true;
				ctx.ui.notify("context_local_hints: ON", "success");
				return;
			}
			const block = buildBlock(ctx);
			ctx.ui.notify(
				`${enabled ? "ON" : "OFF"} · localModel=${isLocalModel(ctx)}\n\n${block}`,
				"info",
			);
		},
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!enabled || !isLocalModel(ctx)) return;
		const block = [
			"<context_awareness>",
			"(Injected for local / Ollama-class models: footer context % may be wrong if the server omits usage.)",
			"",
			buildBlock(ctx),
			"</context_awareness>",
		].join("\n");
		return { systemPrompt: `${event.systemPrompt}\n\n${block}\n` };
	});
}
