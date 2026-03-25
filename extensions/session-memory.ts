/**
 * Session Memory — Re-injects recent chat into the system prompt each turn
 *
 * Smaller models and long threads often lose track of earlier user goals.
 * This extension appends a short chronological recap (recent USER / ASSISTANT
 * text from the live branch) so follow-ups like "set that up" stay grounded.
 *
 * Commands:
 *   /sessionmemory        — toggle on/off (default on)
 *   /sessionmemory status — show on/off and size limits
 *
 * Usage:
 *   pi -e extensions/session-memory.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./themeMap.ts";

const OPENING_MAX_MESSAGES = 4;
const OPENING_MAX_CHARS = 450;
const TAIL_BUDGET_CHARS = 4200;
const TAIL_USER_CHARS = 650;
const TAIL_ASSIST_CHARS = 1100;

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
					return `Tool: ${c.name}(${JSON.stringify(c.arguments).slice(0, 160)})`;
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}
	return JSON.stringify(content).slice(0, 400);
}

type Turn = { role: "user" | "assistant"; text: string };

function collectTurns(ctx: ExtensionContext): Turn[] {
	const sm = ctx.sessionManager as { getBranch?: () => unknown[] } | undefined;
	const getBranch = sm?.getBranch;
	if (!getBranch) return [];

	const branch = getBranch.call(sm);
	if (!Array.isArray(branch)) return [];

	const out: Turn[] = [];
	for (const entry of branch as { type?: string; message?: { role?: string } }[]) {
		if (entry.type !== "message") continue;
		const msg = entry.message;
		if (!msg || (msg.role !== "user" && msg.role !== "assistant")) continue;
		const text = extractMessageText(entry as { message?: { content?: unknown } }).trim();
		if (!text) continue;
		out.push({ role: msg.role as "user" | "assistant", text });
	}
	return out;
}

function truncate(s: string, max: number): string {
	if (s.length <= max) return s;
	return s.slice(0, max) + "...";
}

function formatTurn(role: string, text: string): string {
	return `${role.toUpperCase()}:\n${text}`;
}

function buildRecap(ctx: ExtensionContext): string | null {
	const turns = collectTurns(ctx);
	if (turns.length === 0) return null;

	if (turns.length <= 5) {
		const blocks = turns.map((t) => {
			const cap = t.role === "user" ? TAIL_USER_CHARS : TAIL_ASSIST_CHARS;
			const chunk = truncate(t.text.replace(/\s+/g, " ").trim(), cap);
			return formatTurn(t.role, chunk);
		});
		return `Full session so far (short thread):\n${blocks.join("\n\n")}`;
	}

	const parts: string[] = [];

	if (turns.length >= 8) {
		const opening = turns.slice(0, OPENING_MAX_MESSAGES);
		const openerLines: string[] = [];
		for (const t of opening) {
			const cap = t.role === "user" ? OPENING_MAX_CHARS : Math.floor(OPENING_MAX_CHARS * 1.2);
			const chunk = truncate(t.text.replace(/\s+/g, " ").trim(), cap);
			const line = formatTurn(t.role === "user" ? "User (early)" : "Assistant (early)", chunk);
			openerLines.push(line);
		}
		parts.push(`Session start (anchors vague follow-ups like \"do that\"):\n${openerLines.join("\n\n")}`);
	}

	const tailSource = turns.length >= 8 ? turns.slice(OPENING_MAX_MESSAGES) : turns;
	const tailPieces: string[] = [];
	let tailChars = 0;
	for (let i = tailSource.length - 1; i >= 0 && tailChars < TAIL_BUDGET_CHARS; i--) {
		const t = tailSource[i];
		const cap = t.role === "user" ? TAIL_USER_CHARS : TAIL_ASSIST_CHARS;
		const chunk = truncate(t.text.replace(/\s+/g, " ").trim(), cap);
		const block = formatTurn(t.role, chunk);
		if (tailChars + block.length > TAIL_BUDGET_CHARS) break;
		tailPieces.push(block);
		tailChars += block.length + 2;
	}
	tailPieces.reverse();

	if (tailPieces.length) {
		parts.push(`Recent thread (most recent at bottom):\n${tailPieces.join("\n\n")}`);
	}

	return parts.join("\n\n---\n\n").trim() || null;
}

export default function (pi: ExtensionAPI) {
	let enabled = true;

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		ctx.ui.notify(
			"Session memory: recent dialogue is echoed into the system prompt each turn. /sessionmemory to toggle.",
			"info",
		);
	});

	pi.registerCommand("sessionmemory", {
		description: "Toggle recap injection: /sessionmemory [on|off|status]",
		handler: async (args, ctx) => {
			const a = args.trim().toLowerCase();
			if (a === "off" || a === "disable" || a === "0") {
				enabled = false;
				ctx.ui.notify("Session memory injection: OFF", "warning");
				return;
			}
			if (a === "on" || a === "enable" || a === "1") {
				enabled = true;
				ctx.ui.notify("Session memory injection: ON", "success");
				return;
			}
			const recap = buildRecap(ctx);
			const preview = recap ? `${recap.length} chars (preview)\n${recap.slice(-500)}` : "(empty)";
			ctx.ui.notify(
				`Session memory: ${enabled ? "ON" : "OFF"}\nOpen: ${OPENING_MAX_MESSAGES} msgs / ${OPENING_MAX_CHARS}c, tail budget ${TAIL_BUDGET_CHARS}c\n${preview}`,
				"info",
			);
		},
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!enabled || !ctx) return;
		const recap = buildRecap(ctx);
		if (!recap) return;
		return {
			systemPrompt: `${event.systemPrompt}\n\n<session_memory>\nTreat this as a compressed recap of what already happened in this chat. Use it to interpret short follow-ups (e.g. “do that”, “set it up”) as referring to goals and steps the user stated earlier.\n\n${recap}\n</session_memory>\n`,
		};
	});
}
