/**
 * Session Saver — Manual + auto-save snapshots, list, preview, resume session files
 *
 * Reads extensions/sessions/config.json for autoSave, storagePath, limits.
 * Commands: /save, /list, /load, /show
 *
 * Usage: pi -e extensions/sessions/index.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	writeFileSync,
	statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const EXT_DIR = dirname(fileURLToPath(import.meta.url));

interface SessionSettings {
	autoSave?: boolean;
	storagePath?: string;
	fileFormat?: string;
	maxFileSize?: number;
	includeMetadata?: boolean;
	notificationOnSave?: boolean;
}

interface SessionPackageConfig {
	settings?: SessionSettings;
}

function readConfig(): SessionSettings {
	const p = join(EXT_DIR, "config.json");
	if (!existsSync(p)) return {};
	try {
		const j = JSON.parse(readFileSync(p, "utf-8")) as SessionPackageConfig;
		return j.settings || {};
	} catch {
		return {};
	}
}

function storageRoot(cfg: SessionSettings, cwd: string): string {
	const rel = cfg.storagePath || ".pi/storage/sessions";
	return resolve(cwd, rel);
}

function ensureDir(dir: string) {
	mkdirSync(dir, { recursive: true });
}

function safeJson(obj: unknown, maxBytes: number): string {
	let s = JSON.stringify(obj, null, 2);
	if (s.length > maxBytes) {
		s = s.slice(0, maxBytes) + `\n/* truncated at ${maxBytes} bytes */`;
	}
	return s;
}

function stringifyMessage(msg: { role?: string; content?: unknown }): unknown {
	return {
		role: msg.role,
		content: msg.content,
	};
}

export default function (pi: ExtensionAPI) {
	let cfg = readConfig();

	pi.on("session_start", async (_e, ctx) => {
		cfg = readConfig();
		const root = storageRoot(cfg, ctx.cwd);
		ensureDir(root);
		if (ctx.hasUI) {
			ctx.ui.notify(
				`Session saver: storage ${root}. autoSave=${cfg.autoSave !== false} /save /list /show`,
				"info",
			);
		}
	});

	const maxBytes = cfg.maxFileSize ?? 512 * 1024;

	pi.on("message_end", async (event, ctx) => {
		if (cfg.autoSave === false) return;
		const root = storageRoot(cfg, ctx.cwd);
		ensureDir(root);
		const msg = event.message;
		const role = msg.role;
		if (role !== "user" && role !== "assistant") return;

		const stamp = new Date().toISOString().replace(/[:.]/g, "-");
		const sid = ctx.sessionManager.getSessionId?.() || "session";
		const shortId = sid.slice(0, 8);
		const fname = `auto-${shortId}-${role}-${stamp}.json`;
		const payload: Record<string, unknown> = {
			savedAt: new Date().toISOString(),
			sessionId: sid,
			cwd: ctx.cwd,
			role,
			message: stringifyMessage(msg as { role?: string; content?: unknown }),
		};
		if (cfg.includeMetadata !== false) {
			payload.model = ctx.model?.id;
		}
		try {
			const body = safeJson(payload, maxBytes);
			writeFileSync(join(root, fname), body, "utf-8");
			if (cfg.notificationOnSave && ctx.hasUI) {
				ctx.ui.notify(`Session auto-saved: ${fname}`, "info");
			}
		} catch (e) {
			if (ctx.hasUI) ctx.ui.notify(`Session auto-save failed: ${e}`, "warning");
		}
	});

	function fullSnapshot(ctx: ExtensionContext): Record<string, unknown> {
		const entries = ctx.sessionManager.getEntries();
		const header = ctx.sessionManager.getHeader();
		return {
			savedAt: new Date().toISOString(),
			sessionId: ctx.sessionManager.getSessionId(),
			sessionFile: ctx.sessionManager.getSessionFile(),
			cwd: ctx.cwd,
			header,
			entryCount: entries.length,
			entryIndex: entries.slice(-800).map((e) => ({
				type: e.type,
				id: e.id,
				parentId: e.parentId,
				timestamp: e.timestamp,
			})),
		};
	}

	pi.registerCommand("save", {
		description: "Save full branch index snapshot to storage (manual)",
		handler: async (_args: string, ctx: ExtensionCommandContext) => {
			cfg = readConfig();
			const root = storageRoot(cfg, ctx.cwd);
			ensureDir(root);
			const stamp = new Date().toISOString().replace(/[:.]/g, "-");
			const fname = `manual-${stamp}.json`;
			const body = safeJson(fullSnapshot(ctx), maxBytes);
			writeFileSync(join(root, fname), body, "utf-8");
			ctx.ui.notify(`Saved ${join(root, fname)}`, "success");
		},
	});

	pi.registerCommand("list", {
		description: "List saved session snapshot files in storage",
		handler: async (_args: string, ctx: ExtensionCommandContext) => {
			cfg = readConfig();
			const root = storageRoot(cfg, ctx.cwd);
			if (!existsSync(root)) {
				ctx.ui.notify("No storage dir yet.", "warning");
				return;
			}
			const files = readdirSync(root)
				.filter((f) => f.endsWith(".json"))
				.map((f) => {
					try {
						const st = statSync(join(root, f));
						return `- ${f} (${st.size} bytes)`;
					} catch {
						return `- ${f}`;
					}
				});
			ctx.ui.notify(files.length ? files.join("\n") : "(empty)", "info");
		},
	});

	pi.registerCommand("show", {
		description: "Preview a saved snapshot: /show <filename>",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const name = args.trim();
			if (!name) {
				ctx.ui.notify("Usage: /show <filename.json>", "warning");
				return;
			}
			cfg = readConfig();
			const root = storageRoot(cfg, ctx.cwd);
			const path = name.includes("/") ? resolve(ctx.cwd, name) : join(root, name);
			if (!existsSync(path)) {
				ctx.ui.notify(`Not found: ${path}`, "error");
				return;
			}
			let text = readFileSync(path, "utf-8");
			if (text.length > 6000) text = text.slice(0, 6000) + "\n… [truncated]";
			ctx.ui.notify(text, "info");
		},
	});

	pi.registerCommand("load", {
		description: "Switch Pi to a saved .jsonl session file: /load <path>",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const name = args.trim();
			if (!name) {
				ctx.ui.notify("Usage: /load /path/to/session.jsonl (Pi session file)", "warning");
				return;
			}
			const path = name.startsWith("/") ? name : resolve(ctx.cwd, name);
			if (!existsSync(path)) {
				ctx.ui.notify(`Not found: ${path}`, "error");
				return;
			}
			if (!path.endsWith(".jsonl")) {
				const snippet = readFileSync(path, "utf-8").slice(0, 400);
				ctx.ui.notify(
					`File is not .jsonl — preview:\n${snippet}\n\nOpen with /show for JSON snapshots.`,
					"info",
				);
				return;
			}
			const r = await ctx.switchSession(path);
			if (r.cancelled) ctx.ui.notify("Session switch cancelled.", "warning");
			else ctx.ui.notify(`Switched session to ${path}`, "success");
		},
	});
}
