/**
 * Session Memory — Reinjects this chat's persisted JSONL + recap into the system prompt
 *
 * Uses ctx.sessionManager.getSessionFile() to read the same append-only JSONL Pi
 * writes for the current session, so context matches what's on disk per chat.
 * Also reinforces follow-ups like "1" as selections from your last numbered list.
 *
 * Commands:
 *   /sessionmemory        — toggle on/off (default on)
 *   /sessionmemory status — show on/off and previews
 *
 * Usage:
 *   pi -e extensions/session-memory.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { applyExtensionDefaults } from "./themeMap.ts";

const OPENING_MAX_MESSAGES = 4;
const OPENING_MAX_CHARS = 450;
const TAIL_BUDGET_CHARS = 4200;
const TAIL_USER_CHARS = 650;
const TAIL_ASSIST_CHARS = 1100;
const MAX_JSONL_FILE_CHARS = 12000;

const FOLLOW_UP_RULES = `Follow-up shorthand (critical): If the latest user message is only digits (e.g. "1", "2") or a minimal token ("yes", "y", "ok") and your immediately previous assistant message offered a numbered or listed choice, treat the user as selecting that option and act on it—do not ask what they want again. Example: if you listed "1. Read the file … 2. …" and the user sends "1", perform option 1 (e.g. read the path) without further clarification.`;

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

interface SessionHeaderLine {
	type: "session";
	id?: string;
	cwd?: string;
}

function extractTurnsFromJsonl(filePath: string): {
	turns: Turn[];
	header: { id?: string; cwd?: string };
	summaries: string[];
} {
	const turns: Turn[] = [];
	const summaries: string[] = [];
	let header: { id?: string; cwd?: string } = {};

	if (!existsSync(filePath)) return { turns, header, summaries };

	let raw: string;
	try {
		raw = readFileSync(filePath, "utf-8");
	} catch {
		return { turns, header, summaries };
	}

	if (raw.length > MAX_JSONL_FILE_CHARS) {
		const start = raw.length - MAX_JSONL_FILE_CHARS;
		const nl = raw.indexOf("\n", start);
		raw = nl === -1 ? raw.slice(start) : raw.slice(nl + 1);
	}

	for (const line of raw.split("\n")) {
		const t = line.trim();
		if (!t) continue;
		let e: Record<string, unknown>;
		try {
			e = JSON.parse(t) as Record<string, unknown>;
		} catch {
			continue;
		}
		const typ = e.type as string | undefined;
		if (typ === "session") {
			const h = e as unknown as SessionHeaderLine;
			header = { id: h.id, cwd: h.cwd };
			continue;
		}
		if (typ === "compaction" && typeof e.summary === "string") {
			summaries.push(`[compaction] ${e.summary}`);
			continue;
		}
		if (typ === "branch_summary" && typeof e.summary === "string") {
			summaries.push(`[branch_summary] ${e.summary}`);
			continue;
		}
		if (typ === "message" && e.message && typeof e.message === "object") {
			const msg = e.message as { role?: string };
			const role = msg.role;
			if (role !== "user" && role !== "assistant") continue;
			const text = extractMessageText({ message: e.message as { content?: unknown } }).trim();
			if (!text) continue;
			turns.push({ role, text });
		}
	}

	return { turns, header, summaries };
}

function truncate(s: string, max: number): string {
	if (s.length <= max) return s;
	return s.slice(0, max) + "...";
}

function formatTurn(role: string, text: string): string {
	return `${role.toUpperCase()}:\n${text}`;
}

function buildRecapFromTurns(turns: Turn[]): string | null {
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

function getSessionFilePath(ctx: ExtensionContext): string | undefined {
	const sm = ctx.sessionManager as { getSessionFile?: () => string | undefined } | undefined;
	const gf = sm?.getSessionFile;
	if (!gf) return undefined;
	return gf.call(sm);
}

function buildFullDigest(ctx: ExtensionContext): string | null {
	const path = getSessionFilePath(ctx);
	const { turns: fromFile, header, summaries } = path
		? extractTurnsFromJsonl(path)
		: { turns: [] as Turn[], header: {}, summaries: [] as string[] };

	const fromBranch = collectTurns(ctx);
	const turns =
		fromFile.length >= fromBranch.length ? fromFile : fromBranch;

	const recap = buildRecapFromTurns(turns);

	const metaLines: string[] = [];
	if (path) metaLines.push(`Session JSONL (this chat): ${path}`);
	if (header.id) metaLines.push(`Session id: ${header.id}`);
	if (header.cwd) metaLines.push(`Session cwd: ${header.cwd}`);

	let summaryBlock = "";
	if (summaries.length) {
		const joined = summaries.map((s) => truncate(s, 700)).join("\n\n");
		summaryBlock = `\n\nPrior summaries from compaction/branch (use as memory):\n${joined}`;
	}

	const recapBlock = recap ? `\n\nDialogue recap (from persisted session file when available):\n${recap}` : "";

	if (!metaLines.length && !recap && !summaryBlock) return null;

	return `${metaLines.join("\n")}${summaryBlock}${recapBlock}`;
}

export default function (pi: ExtensionAPI) {
	let enabled = true;

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		const p = getSessionFilePath(ctx);
		ctx.ui.notify(
			`Session memory: JSONL + recap in system prompt each turn${p ? ` (${p})` : ""}. /sessionmemory to toggle.`,
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
			const digest = buildFullDigest(ctx);
			const preview = digest ? `${digest.length} chars\n${digest.slice(-600)}` : "(empty)";
			ctx.ui.notify(
				`Session memory: ${enabled ? "ON" : "OFF"}\n${getSessionFilePath(ctx) || "(no file)"}\n${preview}`,
				"info",
			);
		},
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!enabled || !ctx) return;

		const digest = buildFullDigest(ctx);
		const block = [
			"<session_memory>",
			FOLLOW_UP_RULES,
			digest ||
				"(No transcript yet in this session file—or session just started. Still apply follow-up rules if the user chose an option.)",
			"</session_memory>",
		].join("\n\n");

		return {
			systemPrompt: `${event.systemPrompt}\n\n${block}\n`,
		};
	});
}
