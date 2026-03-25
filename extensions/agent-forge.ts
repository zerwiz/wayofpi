/**
 * Agent Forge (phase 1) — Generate `extensions/forge-*.ts` modules and registry
 *
 * After forge_create writes a file, add `.pi/extensions/forge-<name>.ts` shim and
 * an entry in `.pi/settings.json`, then /reload. Tools are then loaded like any extension.
 *
 * LLM tools: forge_list, forge_create (writes TypeScript + updates forge-registry.json)
 *
 * Usage: pi -e extensions/agent-forge.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";

interface ForgeRegistry {
	version: 1;
	tools: Array<{ name: string; file: string; description: string; createdAt: string }>;
}

const REGISTRY = "forge-registry.json";

function registryPath(cwd: string) {
	return join(cwd, "extensions", REGISTRY);
}

function readRegistry(cwd: string): ForgeRegistry {
	const p = registryPath(cwd);
	if (!existsSync(p)) return { version: 1, tools: [] };
	try {
		return JSON.parse(readFileSync(p, "utf-8")) as ForgeRegistry;
	} catch {
		return { version: 1, tools: [] };
	}
}

function writeRegistry(cwd: string, reg: ForgeRegistry) {
	const p = registryPath(cwd);
	writeFileSync(p, JSON.stringify(reg, null, 2), "utf-8");
}

function forgeFileName(name: string) {
	const slug = name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48) || "tool";
	return `forge-${slug}.ts`;
}

function wrapForgeModule(
	name: string,
	description: string,
	executeBody: string,
): string {
	const safeDesc = description.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
	return `/**
 * Forged tool module (Agent Forge) — ${safeDesc}
 * Generated file. Edit carefully; run /reload after changes.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: ${JSON.stringify(name)},
		label: ${JSON.stringify(name)},
		description: ${JSON.stringify(description)},
		parameters: Type.Object({
			input: Type.String({ description: "Single text argument for this forged tool" }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const input = (params as { input: string }).input;
			${executeBody}
		},
	});
}
`;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		const r = join(ctx.cwd, "extensions");
		if (!existsSync(r)) mkdirSync(r, { recursive: true });
		if (ctx.hasUI) {
			ctx.ui.notify("Agent Forge: use forge_list / forge_create tools. Then shim + /reload.", "info");
		}
	});

	pi.registerTool({
		name: "forge_list",
		label: "Forge list",
		description: "List forged tools from forge-registry.json and forge-*.ts files in extensions/",
		parameters: Type.Object({}),
		async execute(_id, _p, _s, _u, ctx) {
			const cwd = ctx.cwd;
			const reg = readRegistry(cwd);
			const lines = reg.tools.map((t) => `- **${t.name}** → \`${t.file}\` (${t.createdAt})`);
			return {
				content: [
					{
						type: "text",
						text:
							lines.length > 0
								? lines.join("\n")
								: "(no registered forged tools yet; use forge_create)",
					},
				],
				details: { count: reg.tools.length },
			};
		},
	});

	pi.registerTool({
		name: "forge_create",
		label: "Forge create",
		description:
			"Write extensions/forge-<name>.ts that registers one tool. executeBody must return { content: [{type:'text', text: string}], details: {} } using variable `input` and optional `ctx`.",
		parameters: Type.Object({
			name: Type.String({ description: "Tool name (alphanumeric_)" }),
			description: Type.String({ description: "Tool description for the LLM" }),
			executeBody: Type.String({
				description:
					"TypeScript statements/body inside execute(); use `input` string; must return tool result object",
			}),
		}),
		async execute(_id, params, _s, _u, ctx: ExtensionContext) {
			const { name, description, executeBody } = params as {
				name: string;
				description: string;
				executeBody: string;
			};
			if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
				return {
					content: [{ type: "text", text: "Invalid name: use letters, digits, underscore." }],
					details: {},
				};
			}
			if (executeBody.length > 12_000) {
				return {
					content: [{ type: "text", text: "executeBody too large (max 12000 chars)" }],
					details: {},
				};
			}
			const fname = forgeFileName(name);
			const abs = join(ctx.cwd, "extensions", fname);
			const src = wrapForgeModule(name, description, executeBody);
			writeFileSync(abs, src, "utf-8");
			const reg = readRegistry(ctx.cwd);
			reg.tools = reg.tools.filter((t) => t.name !== name);
			reg.tools.push({
				name,
				file: `extensions/${fname}`,
				description,
				createdAt: new Date().toISOString(),
			});
			writeRegistry(ctx.cwd, reg);
			const hint =
				`Wrote ${abs}. Add to .pi/settings.json: ".pi/extensions/${fname}" with shim exporting default from ../../extensions/${fname}, then /reload.`;
			return {
				content: [{ type: "text", text: `forge_create OK.\n${hint}` }],
				details: { path: abs },
			};
		},
	});
}
