/**
 * Honcho mirror — push Pi user/assistant turns to a local Honcho API so cross-session
 * memory (search, context, deriver) can include your Pi work.
 *
 * Does **not** replace Pi’s built-in memory: JSONL session log, session-memory recap,
 * session-saver, /remember, AGENTS.md, etc. (**AGENT_MEMORY.md**). Mirroring is a
 * side channel only; the model’s context for each turn still comes from Pi’s normal layers.
 *
 * **Default on** when this extension is loaded. Opt out:
 *   PI_HONCHO_MIRROR=0 | false | no | off
 *   HONCHO_MIRROR_DISABLED=1
 *
 * Optional: HONCHO_BASE_URL (default http://127.0.0.1:18000), HONCHO_WORKSPACE,
 * HONCHO_USER_PEER, HONCHO_AI_PEER, HONCHO_JWT (when Honcho AUTH_USE_AUTH=true).
 * Falls back to ~/.honcho/config.json for workspace + peer ids when set.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MAX_CONTENT = 24_000;

function mirrorEnabled(): boolean {
	const off = process.env.PI_HONCHO_MIRROR?.toLowerCase();
	if (off === "0" || off === "false" || off === "no" || off === "off") return false;
	const dis = process.env.HONCHO_MIRROR_DISABLED?.toLowerCase();
	if (dis === "1" || dis === "true" || dis === "yes") return false;
	return true;
}

function readHonchoJsonConfig(): {
	defaultWorkspace?: string;
	userPeer?: string;
	aiPeer?: string;
} | null {
	try {
		const p = join(homedir(), ".honcho", "config.json");
		if (!existsSync(p)) return null;
		const j = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
		return {
			defaultWorkspace: typeof j.defaultWorkspace === "string" ? j.defaultWorkspace : undefined,
			userPeer: typeof j.userPeer === "string" ? j.userPeer : undefined,
			aiPeer: typeof j.aiPeer === "string" ? j.aiPeer : undefined,
		};
	} catch {
		return null;
	}
}

function honchoBaseUrl(): string {
	return (
		process.env.HONCHO_BASE_URL?.replace(/\/$/, "") ||
		process.env.HONCHO_MIRROR_URL?.replace(/\/$/, "") ||
		"http://127.0.0.1:18000"
	);
}

function extractMessageText(msg: { content?: unknown }): string {
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
	return JSON.stringify(content).slice(0, 400);
}

function sanitizeHonchoId(raw: string, fallback: string): string {
	let s = raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
	if (!s) s = fallback;
	return s;
}

const ensuredKeys = new Set<string>();
let warnedFail = false;

async function honchoPost(
	base: string,
	path: string,
	body: unknown,
	jwt: string | undefined,
): Promise<Response> {
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (jwt) headers.Authorization = `Bearer ${jwt}`;
	return fetch(`${base}${path}`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		if (!mirrorEnabled()) return;
		warnedFail = false;
		if (ctx.hasUI) {
			const hc = readHonchoJsonConfig();
			const ws =
				process.env.HONCHO_WORKSPACE || hc?.defaultWorkspace || "pi-mirror";
			ctx.ui.notify(
				`Honcho mirror (standard) → ${honchoBaseUrl()} workspace "${ws}" — set PI_HONCHO_MIRROR=0 to disable`,
				"info",
			);
		}
	});

	pi.on("message_end", async (event, ctx) => {
		if (!mirrorEnabled()) return;

		const msg = event.message;
		const role = msg.role;
		if (role !== "user" && role !== "assistant") return;

		const text = extractMessageText(msg as { content?: unknown }).trim();
		if (!text) return;

		const hc = readHonchoJsonConfig();
		const workspace = sanitizeHonchoId(
			process.env.HONCHO_WORKSPACE || hc?.defaultWorkspace || "pi-mirror",
			"pi-mirror",
		);
		const userPeer = sanitizeHonchoId(
			process.env.HONCHO_USER_PEER || hc?.userPeer || "user",
			"user",
		);
		const aiPeer = sanitizeHonchoId(process.env.HONCHO_AI_PEER || hc?.aiPeer || "pi", "pi");
		const peerId = role === "user" ? userPeer : aiPeer;

		const sid = ctx.sessionManager.getSessionId?.() || "session";
		const honchoSession = sanitizeHonchoId(sid, "session");
		const jwt = process.env.HONCHO_JWT?.trim() || undefined;
		const base = honchoBaseUrl();
		const cacheKey = `${workspace}:${honchoSession}`;

		const content = text.length > MAX_CONTENT ? text.slice(0, MAX_CONTENT) + "\n…[truncated]" : text;

		try {
			if (!ensuredKeys.has(cacheKey)) {
				let r = await honchoPost(base, `/v3/workspaces`, { name: workspace }, jwt);
				if (!r.ok && r.status !== 200 && r.status !== 201) {
					throw new Error(`workspace: HTTP ${r.status}`);
				}
				r = await honchoPost(
					base,
					`/v3/workspaces/${encodeURIComponent(workspace)}/peers`,
					{ name: userPeer },
					jwt,
				);
				if (!r.ok && r.status !== 200 && r.status !== 201) {
					throw new Error(`peer ${userPeer}: HTTP ${r.status}`);
				}
				r = await honchoPost(
					base,
					`/v3/workspaces/${encodeURIComponent(workspace)}/peers`,
					{ name: aiPeer },
					jwt,
				);
				if (!r.ok && r.status !== 200 && r.status !== 201) {
					throw new Error(`peer ${aiPeer}: HTTP ${r.status}`);
				}
				r = await honchoPost(
					base,
					`/v3/workspaces/${encodeURIComponent(workspace)}/sessions`,
					{ name: honchoSession },
					jwt,
				);
				if (!r.ok && r.status !== 200 && r.status !== 201) {
					throw new Error(`session: HTTP ${r.status}`);
				}
				ensuredKeys.add(cacheKey);
			}

			const meta: Record<string, unknown> = {
				source: "pi",
				role,
				piSessionId: sid,
				cwd: ctx.cwd,
			};
			if (ctx.model?.id) meta.model = ctx.model.id;

			const r = await honchoPost(
				base,
				`/v3/workspaces/${encodeURIComponent(workspace)}/sessions/${encodeURIComponent(honchoSession)}/messages`,
				{
					messages: [
						{
							content,
							peer_id: peerId,
							metadata: meta,
						},
					],
				},
				jwt,
			);
			if (!r.ok) {
				const errBody = await r.text().catch(() => "");
				throw new Error(`messages: HTTP ${r.status} ${errBody.slice(0, 200)}`);
			}
		} catch (e) {
			ensuredKeys.delete(cacheKey);
			if (!warnedFail && ctx.hasUI) {
				warnedFail = true;
				ctx.ui.notify(
					`Honcho mirror failed (once): ${e}\nCheck API, DB, and HONCHO_JWT if auth is on.`,
					"warning",
				);
			}
		}
	});
}
