/**
 * Workspace boundary — Injects which directory is the user's app vs the Pi playground.
 *
 * When you launch via ppi/pi-e, PI_USER_PROJECT_DIR is the app repo; Pi may still load
 * global ~/.pi/agent context and extension paths under PI_PLAYGROUND — models confuse those
 * with "the project". This extension adds an explicit <workspace_boundary> block every turn.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./themeMap.ts";

function block(ctx: ExtensionContext): string {
	const cwd = ctx.cwd;
	const userRoot = process.env.PI_USER_PROJECT_DIR || process.env.PI_E_PROJECT_DIR || "";
	const playground = process.env.PI_PLAYGROUND || "";

	const lines: string[] = [
		"<workspace_boundary>",
		"Pi also loads **global** files under `~/.pi/agent/` (e.g. AGENTS.md, packages). Those describe **Pi itself**, not necessarily the user's application repository.",
		"",
		`**Process tool cwd** (default for relative paths in tools): \`${cwd}\``,
	];

	if (userRoot) {
		lines.push(
			`**User application root** (set when launching via \`ppi\` / \`pi-launch-from-project\`): \`${userRoot}\``,
		);
		lines.push(
			"When the user says *this project*, *my repo*, *our codebase*, or *the files here*, they mean **User application root** unless they explicitly say *playground*, *Pi extensions*, or *~/.pi*.",
		);
		lines.push(
			"If `ls .` or similar under **Process tool cwd** looks like the Pi playground (e.g. `projects/_template/`, top-level `extensions/` next to `justfile` for the **playground** repo) but **User application root** is a different path, **list and read files under User application root** (absolute path) for questions about their app.",
		);
	}

	if (playground) {
		lines.push(
			`**Pi playground clone** (extension/skill sources from linked settings): \`${playground}\``,
		);
	}

	lines.push("</workspace_boundary>");
	return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		const userRoot = process.env.PI_USER_PROJECT_DIR || process.env.PI_E_PROJECT_DIR;
		if (!userRoot) return;
		const same = userRoot === ctx.cwd;
		ctx.ui.notify(
			`Workspace: user app → ${userRoot}\nTool cwd → ${ctx.cwd}${same ? "" : "\n(if they differ, prefer absolute paths under user app for *their* files)"}`,
			same ? "info" : "warning",
		);
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!ctx) return;
		return {
			systemPrompt: `${event.systemPrompt}\n\n${block(ctx)}\n`,
		};
	});
}
