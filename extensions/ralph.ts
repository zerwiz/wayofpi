/**
 * Ralph — File-queue helper for todo → inprogress → done HTML tickets
 *
 * Ensures queue dirs on session start. Tool: ralph_queue_status
 * Commands: /ralph help | status | prompt
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";

const QUEUE_DIRS = ["todo", "inprogress", "done"] as const;

function listTxt(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).filter((f) => f.endsWith(".txt")).sort();
}

function buildOneTaskPrompt(cwd: string): string {
	return `You are in the directory: ${cwd}

**Ralph — one task only**

1. Pick **one** \`.txt\` file from \`todo/\`. Move it to \`inprogress/\` immediately (\`mv\`).
2. Read that file. It contains instructions to write **a single HTML file** to a specific path. Follow them exactly.
3. After writing the HTML file, move the task file from \`inprogress/\` to \`done/\`.

**Constraints:** Only create or edit the **one HTML file** this task requires. Do not modify other files. If \`todo/\` has no \`.txt\` files, reply **COMPLETE** and stop.

Use **ralph_queue_status**, **/skill:ralph**, or the **ralph** agent rules if needed.`;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		for (const d of QUEUE_DIRS) {
			const p = join(ctx.cwd, d);
			if (!existsSync(p)) mkdirSync(p, { recursive: true });
		}
	});

	pi.registerTool({
		name: "ralph_queue_status",
		label: "Ralph queue status",
		description:
			"Summarize Ralph ticket folders in cwd: todo/inprogress/done .txt counts and next file. Use before claiming a task.",
		parameters: Type.Object({}),
		async execute(_id, _params, _s, _u, ctx: ExtensionContext) {
			const base = ctx.cwd;
			const todo = listTxt(join(base, "todo"));
			const prog = listTxt(join(base, "inprogress"));
			const done = listTxt(join(base, "done"));
			const lines = [
				`**cwd:** ${base}`,
				`**todo (${todo.length}):** ${todo.join(", ") || "—"}`,
				`**inprogress (${prog.length}):** ${prog.join(", ") || "—"}`,
				`**done (${done.length}, last up to 8):** ${done.slice(-8).join(", ") || "—"}`,
			];
			if (todo.length) lines.push(`**suggested next:** todo/${todo[0]}`);
			if (!todo.length && !prog.length) lines.push("**queue:** empty (COMPLETE)");
			return { content: [{ type: "text", text: lines.join("\n") }], details: { todo, inprogress: prog, done } };
		},
	});

	pi.registerCommand("ralph", {
		description: "Ralph queue — /ralph help | status | prompt",
		handler: async (args: string, ctx) => {
			const a = args.trim().toLowerCase();
			if (!a || a === "help") {
				ctx.ui.notify(
					`Ralph: todo → inprogress → done (.txt tickets → one HTML file each).\n` +
						`/ralph status — counts + next ticket\n` +
						`/ralph prompt — inject one-task instructions\n` +
						`Tool: ralph_queue_status · Skill: /skill:ralph · Agent: ralph\n` +
						`Team ralph: ralph + scout + planner + builder + reviewer + code-documenter + documenter (dispatcher can dispatch helpers)`,
					"info",
				);
				return;
			}
			if (a === "status") {
				const base = ctx.cwd;
				const todo = listTxt(join(base, "todo"));
				const prog = listTxt(join(base, "inprogress"));
				const done = listTxt(join(base, "done"));
				ctx.ui.notify(
					`todo: ${todo.length} | inprogress: ${prog.length} | done: ${done.length}\n` +
						(todo[0] ? `next: todo/${todo[0]}` : prog[0] ? `stuck? inprogress/${prog[0]}` : "queue empty"),
					"info",
				);
				return;
			}
			if (a === "prompt") {
				pi.sendUserMessage(buildOneTaskPrompt(ctx.cwd));
				return;
			}
			ctx.ui.notify(`Unknown "${args}". Try /ralph help`, "warning");
		},
	});
}
