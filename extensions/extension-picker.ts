/**
 * Extension Picker — List extension entry points from Pi packages and launch hints
 *
 * Reads packages in agent settings.json (git: and npm:), resolves declared
 * `pi.extensions` paths from each package's package.json. Also lists
 * `extensions/*.ts` in the current project when present.
 *
 * Commands:
 *   /ext, /extensions, /extentions, /extention — pick an extension; saves `pi -e <path>` to storage
 *   /remember <text>         — append a line to cross-session memory
 *   /memory                  — show recent cross-session memory (tail)
 *
 * Pi cannot hot-load extensions mid-session; after picking, restart Pi with the
 * printed command (also written to ~/.pi/storage/last-extension.json).
 *
 * Usage: pi -e extensions/extension-picker.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	appendFileSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { applyExtensionDefaults } from "./themeMap.ts";

interface ExtEntry {
	absPath: string;
	display: string;
	source: string;
}

interface PiManifest {
	pi?: { extensions?: string[] };
}

const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"native",
	"coverage",
	"__tests__",
	".ralph",
]);

function resolveAgentDirs(cwd: string): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	function add(p: string) {
		if (!seen.has(p)) {
			seen.add(p);
			out.push(p);
		}
	}
	add(join(cwd, "agent"));
	add(join(cwd, ".pi", "agent"));
	add(join(homedir(), ".pi", "agent"));
	return out;
}

function agentDirWithSettings(cwd: string): string {
	for (const dir of resolveAgentDirs(cwd)) {
		if (existsSync(join(dir, "settings.json"))) return dir;
	}
	return join(homedir(), ".pi", "agent");
}

function storageDir(): string {
	const d = join(homedir(), ".pi", "storage");
	mkdirSync(d, { recursive: true });
	return d;
}

function memoryPath(): string {
	return join(storageDir(), "agent-memory.md");
}

function lastExtPath(): string {
	return join(storageDir(), "last-extension.json");
}

function parseSettingsPackages(agentDir: string): string[] {
	const raw = join(agentDir, "settings.json");
	if (!existsSync(raw)) return [];
	try {
		const j = JSON.parse(readFileSync(raw, "utf-8")) as { packages?: string[] };
		return Array.isArray(j.packages) ? j.packages : [];
	} catch {
		return [];
	}
}

function resolveGitPackage(agentDir: string, spec: string): string | null {
	if (!spec.startsWith("git:")) return null;
	const rest = spec.slice("git:".length).replace(/^\/+/, "");
	const p = join(agentDir, "git", rest);
	return existsSync(join(p, "package.json")) ? p : existsSync(p) ? p : null;
}

function npmPackageName(spec: string): string | null {
	if (!spec.startsWith("npm:")) return null;
	const rest = spec.slice(4);
	if (rest.startsWith("@")) {
		const m = rest.match(/^(@[^/]+\/[^@]+)(?:@.+)?$/);
		return m ? m[1] : rest;
	}
	const name = rest.split("@")[0];
	return name || null;
}

function resolveNpmPackage(agentDir: string, spec: string): string | null {
	const name = npmPackageName(spec);
	if (!name) return null;

	const candidates = [
		join(agentDir, "npm", name),
		join(homedir(), ".npm-global/lib/node_modules", name),
		join(homedir(), ".local/share/pnpm/global/5/node_modules", name),
		join(homedir(), "node_modules", name),
	];
	for (const c of candidates) {
		if (existsSync(join(c, "package.json"))) return c;
	}
	return null;
}

function collectDeclaredExtensions(root: string, sourceLabel: string): ExtEntry[] {
	const out: ExtEntry[] = [];
	const pkgPath = join(root, "package.json");
	if (!existsSync(pkgPath)) return out;
	let pkg: PiManifest;
	try {
		pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as PiManifest;
	} catch {
		return out;
	}
	const rels = pkg.pi?.extensions;
	if (!Array.isArray(rels)) return out;
	for (const rel of rels) {
		if (typeof rel !== "string") continue;
		const clean = rel.replace(/^\.\//, "");
		const abs = join(root, clean);
		if (existsSync(abs)) {
			out.push({
				absPath: abs,
				display: `${sourceLabel}: ${clean}`,
				source: sourceLabel,
			});
		}
	}
	return out;
}

function collectWorkspaceExtensions(root: string, sourceLabel: string): ExtEntry[] {
	const out: ExtEntry[] = [];
	if (!existsSync(root)) return out;
	let entries: string[] = [];
	try {
		entries = readdirSync(root, { withFileTypes: true })
			.filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name))
			.map((e) => e.name);
	} catch {
		return out;
	}
	for (const name of entries) {
		const sub = join(root, name);
		out.push(...collectDeclaredExtensions(sub, `${sourceLabel}/${name}`));
	}
	return out;
}

function collectProjectExtensions(cwd: string): ExtEntry[] {
	const extDir = join(cwd, "extensions");
	if (!existsSync(extDir)) return [];
	let files: string[] = [];
	try {
		files = readdirSync(extDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));
	} catch {
		return [];
	}
	return files.map((f) => {
		const abs = join(extDir, f);
		return {
			absPath: abs,
			display: `project: extensions/${f}`,
			source: "project",
		};
	});
}

function discoverAll(cwd: string): ExtEntry[] {
	const agentDir = agentDirWithSettings(cwd);
	const list: ExtEntry[] = [];
	const seenPath = new Set<string>();

	function push(entries: ExtEntry[]) {
		for (const e of entries) {
			const key = e.absPath;
			if (seenPath.has(key)) continue;
			seenPath.add(key);
			list.push(e);
		}
	}

	for (const spec of parseSettingsPackages(agentDir)) {
		const gitRoot = resolveGitPackage(agentDir, spec);
		if (gitRoot) {
			push(collectDeclaredExtensions(gitRoot, spec));
			push(collectWorkspaceExtensions(gitRoot, spec));
			continue;
		}
		const npmRoot = resolveNpmPackage(agentDir, spec);
		if (npmRoot) {
			push(collectDeclaredExtensions(npmRoot, spec));
			continue;
		}
	}

	push(collectProjectExtensions(cwd));
	list.sort((a, b) => a.display.localeCompare(b.display));
	return list;
}

function formatPiCommand(paths: string[]): string {
	const parts = paths.map((p) => `-e "${p}"`);
	return `pi ${parts.join(" ")}`;
}

async function runPicker(ctx: ExtensionContext, entries: ExtEntry[]) {
	if (!ctx.hasUI) return;
	if (entries.length === 0) {
		ctx.ui.notify("No extensions found. Check agent settings packages and pi.extensions in package.json.", "warning");
		return;
	}

	const options = entries.map((e) => e.display);
	const choice = await ctx.ui.select("Extensions (restart Pi with command below)", options);
	if (choice === undefined) return;

	const idx = options.indexOf(choice);
	const entry = entries[idx];
	const cmd = formatPiCommand([entry.absPath]);

	const payload = JSON.stringify(
		{
			path: entry.absPath,
			piCommand: cmd,
			pickedAt: new Date().toISOString(),
		},
		null,
		2,
	);
	try {
		writeFileSync(lastExtPath(), payload, "utf-8");
	} catch {
		/* ignore */
	}

	ctx.ui.notify(`${cmd}\n\nSaved: ${lastExtPath()}`, "info");
}

export default function (pi: ExtensionAPI) {
	let entries: ExtEntry[] = [];
	let memoryPrimed = false;

	const refresh = (cwd: string) => {
		entries = discoverAll(cwd);
	};

	pi.on("session_start", async (_event, ctx) => {
		memoryPrimed = false;
		applyExtensionDefaults(import.meta.url, ctx);
		refresh(ctx.cwd);
		const agentDir = agentDirWithSettings(ctx.cwd);
		const nPkg = parseSettingsPackages(agentDir).length;
		ctx.ui.notify(
			`Extension picker: ${entries.length} entries (${nPkg} package(s) + project). Try /ext or /extensions`,
			"info",
		);
	});

	const pickerHandler = async (_args: string, ctx: ExtensionContext) => {
		refresh(ctx.cwd);
		await runPicker(ctx, entries);
	};

	pi.registerCommand("extensions", {
		description: "Pick a package extension; saves pi -e command for next launch",
		handler: pickerHandler,
	});

	pi.registerCommand("ext", {
		description: "Extension picker (short; same as /extensions)",
		handler: pickerHandler,
	});

	pi.registerCommand("extentions", {
		description: "Same as /extensions (common typo)",
		handler: pickerHandler,
	});

	pi.registerCommand("extention", {
		description: "Same as /extensions (/extention spelling)",
		handler: pickerHandler,
	});

	pi.registerCommand("remember", {
		description: "Append text to cross-session memory (~/.pi/storage/agent-memory.md)",
		handler: async (args, ctx) => {
			const line = args.trim();
			if (!line) {
				ctx.ui.notify("Usage: /remember <text to save for later sessions>", "warning");
				return;
			}
			const ts = new Date().toISOString();
			const block = `\n## ${ts}\n${line}\n`;
			try {
				appendFileSync(memoryPath(), block, "utf-8");
				ctx.ui.notify(`Appended to ${memoryPath()}`, "success");
			} catch (e) {
				ctx.ui.notify(`Could not write memory: ${e}`, "error");
			}
		},
	});

	pi.registerCommand("memory", {
		description: "Show tail of cross-session memory file",
		handler: async (_args, ctx) => {
			const p = memoryPath();
			if (!existsSync(p)) {
				ctx.ui.notify("No memory file yet. Use /remember <text>.", "info");
				return;
			}
			let content: string;
			try {
				content = readFileSync(p, "utf-8");
			} catch (e) {
				ctx.ui.notify(`Could not read memory: ${e}`, "error");
				return;
			}
			const tail = content.length > 3500 ? "…\n" + content.slice(-3500) : content;
			ctx.ui.notify(tail, "info");
		},
	});

	pi.on("before_agent_start", async (event) => {
		if (memoryPrimed) return;
		const p = memoryPath();
		if (!existsSync(p)) {
			memoryPrimed = true;
			return;
		}
		let memo: string;
		try {
			memo = readFileSync(p, "utf-8").trim();
		} catch {
			return;
		}
		if (!memo) {
			memoryPrimed = true;
			return;
		}
		memoryPrimed = true;
		const excerpt = memo.length > 2000 ? memo.slice(-2000) : memo;
		return {
			systemPrompt: `${event.systemPrompt}\n\n---\nCross-session memory (from ~/.pi/storage/agent-memory.md):\n${excerpt}\n---\n`,
		};
	});
}
