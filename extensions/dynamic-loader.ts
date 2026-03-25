/**
 * Extension hints — Map playground basenames to `pi -e` lines (no hot-load)
 *
 * Pi cannot load a new extension into a running process. This module only
 * helps you compose shell commands. Prefer `/extensions` for the full picker.
 *
 * Usage: pi -e extensions/dynamic-loader.ts
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Basenames that exist under extensions/ for quick hints (extend as needed). */
const PLAYGROUND_BASES = [
	"minimal",
	"theme-cycler",
	"agent-team",
	"agent-chain",
	"pi-pi",
	"tilldone",
	"extension-picker",
	"session-memory",
	"sessions/index",
	"agent-forge",
	"chronicle",
	"ralph",
	"purpose-gate",
	"damage-control",
	"cross-agent",
	"system-select",
	"session-replay",
	"subagent-widget",
	"tool-counter",
	"tool-counter-widget",
	"pure-focus",
] as const;

function resolveExtPath(cwd: string, slug: string): string | null {
	const candidates = [
		join(cwd, "extensions", slug.endsWith(".ts") ? slug : `${slug}.ts`),
		join(cwd, "extensions", `${slug.replace(/\/$/, "")}.ts`),
	];
	for (const p of candidates) {
		if (existsSync(p)) return p;
	}
	const nested = join(cwd, "extensions", slug, "index.ts");
	if (existsSync(nested)) return nested;
	return null;
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("extension-hint", {
		description: "Print pi -e for a playground extension: /extension-hint <name>",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const slug = args.trim().replace(/^extensions\//, "");
			if (!slug) {
				const lines = PLAYGROUND_BASES.map((b) => `- ${b}`).join("\n");
				ctx.ui.notify(
					`Known short names:\n${lines}\n\nUsage: /extension-hint agent-team`,
					"info",
				);
				return;
			}
			const one = resolveExtPath(ctx.cwd, slug);
			if (!one) {
				ctx.ui.notify(`No file for "${slug}" under extensions/`, "warning");
				return;
			}
			const minimal = join(ctx.cwd, "extensions", "minimal.ts");
			const stack = existsSync(minimal)
				? `pi -e "${minimal}" -e "${one}"`
				: `pi -e "${one}"`;
			ctx.ui.notify(
				`Quit Pi, then run:\n${stack}\n\n(No hot-load — new Pi process only.)`,
				"info",
			);
		},
	});
}
