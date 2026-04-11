/**
 * INTERIM — Bun-native Pi-shaped workspace tools for LLM turns when **`WOP_ORCHESTRATOR_TOOLS`** is on
 * (orchestrator and workspace **`.md`** personas). Supersede with **headless Pi** tool events per
 * **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { broadcastToolLog } from "./tool-log-broadcast";
import { MAX_FILE_BYTES, shouldSkipDir } from "./paths";
import { getPrimaryWorkspacePath, resolveUnderWorkspace } from "./workspace-state";

/** When not `0`/`false`/`no`/`off`, orchestrator turns may use Pi-shaped workspace tools (default: on). */
export function orchestratorToolsEnabled(): boolean {
	const v = process.env.WOP_ORCHESTRATOR_TOOLS?.trim().toLowerCase();
	return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

/** Opt-in: allow `bash` tool (host shell, cwd = workspace). Trusted machines only. */
export function orchestratorBashEnabled(): boolean {
	const v = process.env.WOP_ORCHESTRATOR_BASH?.trim().toLowerCase();
	return v === "1" || v === "true" || v === "yes" || v === "on";
}

const MAX_GREP_BYTES = 120_000;
const MAX_LIST_ENTRIES = 200;
const BASH_TIMEOUT_MS = 28_000;
const MAX_BASH_CMD = 8_000;
/** UTF-8 write cap per call (orchestrator; keeps prompts and disk bounded). */
const MAX_WRITE_UTF8_BYTES = Math.min(MAX_FILE_BYTES, 1_048_576);

function logTool(source: string, msg: string): void {
	broadcastToolLog("INFO", source, msg);
}

async function toolRead(rel: string, offset?: number, limit?: number): Promise<string> {
	const abs = resolveUnderWorkspace(rel.replace(/^[/\\]+/, ""));
	if (!abs) return "read: path is not inside the workspace or is unsafe.";
	try {
		const st = await stat(abs);
		if (!st.isFile()) return `read: not a file: ${rel}`;
		if (st.size > MAX_FILE_BYTES) return `read: file too large (${st.size} bytes; max ${MAX_FILE_BYTES}).`;
		const raw = await readFile(abs, "utf8");
		const lines = raw.split(/\r?\n/);
		const off = Math.max(1, Math.floor(offset ?? 1));
		const lim = Math.min(500, Math.max(1, Math.floor(limit ?? 200)));
		const slice = lines.slice(off - 1, off - 1 + lim);
		const header = `[read ${rel} lines ${off}-${off + slice.length - 1} of ${lines.length}]\n`;
		return header + slice.join("\n");
	} catch (e) {
		const m = e instanceof Error ? e.message : String(e);
		return `read: ${m}`;
	}
}

async function toolListDir(rel: string): Promise<string> {
	const raw = rel?.trim() || ".";
	const abs =
		raw === "." || raw === ""
			? getPrimaryWorkspacePath()
			: resolveUnderWorkspace(raw.replace(/^[/\\]+/, ""));
	if (!abs) return "list_dir: path is not inside the workspace or is unsafe.";
	try {
		const st = await stat(abs);
		if (!st.isDirectory()) return `list_dir: not a directory: ${raw}`;
		const names = await readdir(abs);
		const filtered = names.filter((n) => !shouldSkipDir(n)).slice(0, MAX_LIST_ENTRIES);
		const more = names.length > filtered.length ? `\n… (${names.length - filtered.length} more entries skipped)` : "";
		return `[list_dir ${raw}]\n${filtered.sort().join("\n")}${more}`;
	} catch (e) {
		const m = e instanceof Error ? e.message : String(e);
		return `list_dir: ${m}`;
	}
}

async function toolWrite(rel: string, content: string): Promise<string> {
	const abs = resolveUnderWorkspace(rel.replace(/^[/\\]+/, ""));
	if (!abs) return "write: path is not inside the workspace or is unsafe.";
	const bytes = new TextEncoder().encode(content).byteLength;
	if (bytes > MAX_WRITE_UTF8_BYTES) {
		return `write: content too large (${bytes} bytes UTF-8; max ${MAX_WRITE_UTF8_BYTES}).`;
	}
	try {
		const st = await stat(abs).catch(() => null);
		if (st?.isDirectory()) return `write: path is a directory: ${rel}`;
		await mkdir(dirname(abs), { recursive: true });
		await writeFile(abs, content, "utf8");
		logTool("write", `${rel} (${bytes} bytes)`);
		return `write: ok — ${bytes} bytes written to ${rel}`;
	} catch (e) {
		const m = e instanceof Error ? e.message : String(e);
		return `write: ${m}`;
	}
}

async function toolGrep(pattern: string, relPath?: string, glob?: string): Promise<string> {
	if (!pattern?.trim()) return "grep: pattern is required.";
	const base = relPath?.trim() || ".";
	const abs =
		base === "." || base === ""
			? getPrimaryWorkspacePath()
			: resolveUnderWorkspace(base.replace(/^[/\\]+/, ""));
	if (!abs) return "grep: path is not inside the workspace or is unsafe.";
	const cwd = getPrimaryWorkspacePath();
	const args = [
		"--line-number",
		"--max-count",
		"48",
		"--max-columns",
		"240",
		"-e",
		pattern,
	];
	if (glob?.trim()) {
		args.push("--glob", glob.trim());
	}
	args.push(abs);
	return await new Promise((resolve) => {
		const child = spawn("rg", args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
		let out = "";
		let err = "";
		const cap = () => {
			if (out.length > MAX_GREP_BYTES) {
				out = `${out.slice(0, MAX_GREP_BYTES)}\n…[truncated]`;
				try {
					child.kill("SIGTERM");
				} catch {
					/* ignore */
				}
			}
		};
		child.stdout?.setEncoding("utf8");
		child.stderr?.setEncoding("utf8");
		child.stdout?.on("data", (c: string) => {
			out += c;
			cap();
		});
		child.stderr?.on("data", (c: string) => {
			err += c;
		});
		const t = setTimeout(() => {
			try {
				child.kill("SIGTERM");
			} catch {
				/* ignore */
			}
		}, 22_000);
		child.on("close", (code) => {
			clearTimeout(t);
			if (code === 2) {
				resolve(`grep: rg error — ${err.trim() || "exit 2"}`);
				return;
			}
			if (code === 1 && !out) {
				resolve(`[grep pattern in ${base}]\n(no matches)`);
				return;
			}
			if (code !== 0 && code !== 1) {
				resolve(`grep: rg exited ${code} — ${err.trim() || out.slice(0, 400)}`);
				return;
			}
			resolve(`[grep in ${base}]\n${out.trim() || "(no output)"}`);
		});
		child.on("error", (e) => {
			clearTimeout(t);
			const m = e instanceof Error ? e.message : String(e);
			resolve(
				`grep: failed to spawn ripgrep (\`rg\`). Install ripgrep or use **read** on known paths. (${m})`,
			);
		});
	});
}

async function toolBash(command: string): Promise<string> {
	if (!orchestratorBashEnabled()) {
		return "bash: disabled on this server (set WOP_ORCHESTRATOR_BASH=1 to opt in — trusted workspace only).";
	}
	const cmd = command?.trim();
	if (!cmd) return "bash: empty command.";
	if (cmd.length > MAX_BASH_CMD) return `bash: command too long (max ${MAX_BASH_CMD} chars).`;
	const cwd = getPrimaryWorkspacePath();
	logTool("bash", cmd.slice(0, 200) + (cmd.length > 200 ? "…" : ""));
	return await new Promise((resolve) => {
		const isWin = process.platform === "win32";
		const child = isWin
			? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", cmd], {
					cwd,
					stdio: ["ignore", "pipe", "pipe"],
					windowsHide: true,
					env: { ...process.env },
				})
			: spawn("/bin/sh", ["-c", cmd], {
					cwd,
					stdio: ["ignore", "pipe", "pipe"],
					windowsHide: true,
					env: { ...process.env, CI: process.env.CI ?? "1" },
				});
		let out = "";
		let err = "";
		const t = setTimeout(() => {
			try {
				child.kill("SIGTERM");
			} catch {
				/* ignore */
			}
		}, BASH_TIMEOUT_MS);
		child.stdout?.setEncoding("utf8");
		child.stderr?.setEncoding("utf8");
		child.stdout?.on("data", (c: string) => {
			out += c;
			if (out.length > MAX_GREP_BYTES) out = `${out.slice(0, MAX_GREP_BYTES)}\n…[truncated stdout]`;
		});
		child.stderr?.on("data", (c: string) => {
			err += c;
			if (err.length > 50_000) err = `${err.slice(0, 50_000)}\n…`;
		});
		child.on("close", (code) => {
			clearTimeout(t);
			const parts = [`[bash exit=${code ?? 0}]`, out.trim(), err.trim()].filter(Boolean);
			resolve(parts.join("\n"));
		});
		child.on("error", (e) => {
			clearTimeout(t);
			const m = e instanceof Error ? e.message : String(e);
			resolve(`bash: ${m}`);
		});
	});
}

/**
 * Run one Pi-named orchestrator tool (workspace-jailed). Results are plain text for the model.
 */
export async function executeOrchestratorTool(name: string, argsJson: string): Promise<string> {
	let args: Record<string, unknown> = {};
	try {
		args = JSON.parse(argsJson || "{}") as Record<string, unknown>;
	} catch {
		return "Invalid JSON in tool arguments.";
	}

	switch (name) {
		case "read": {
			const path = String(args.path ?? "");
			const offset = typeof args.offset === "number" ? args.offset : undefined;
			const limit = typeof args.limit === "number" ? args.limit : undefined;
			logTool("read", path);
			return await toolRead(path, offset, limit);
		}
		case "list_dir": {
			const path = String(args.path ?? ".");
			logTool("list_dir", path);
			return await toolListDir(path);
		}
		case "grep": {
			const pattern = String(args.pattern ?? "");
			const path = args.path != null ? String(args.path) : undefined;
			const glob = args.glob != null ? String(args.glob) : undefined;
			logTool("grep", `${pattern} @ ${path ?? "."}`);
			return await toolGrep(pattern, path, glob);
		}
		case "write": {
			const path = String(args.path ?? "");
			const content = typeof args.content === "string" ? args.content : "";
			return await toolWrite(path, content);
		}
		case "bash": {
			const command = String(args.command ?? "");
			return await toolBash(command);
		}
		default:
			return `Unknown tool "${name}". Allowed: read, list_dir, grep, write, bash (bash requires WOP_ORCHESTRATOR_BASH=1).`;
	}
}

/** OpenAI /v1 `tools` array for orchestrator turns (Pi-shaped names; subset of Pi built-ins). */
export const ORCHESTRATOR_TOOLS_OPENAI = [
	{
		type: "function" as const,
		function: {
			name: "read",
			description:
				"Read a UTF-8 text file under the Way of Pi workspace (Pi `read`-style). Path is relative to workspace root.",
			parameters: {
				type: "object",
				properties: {
					path: { type: "string", description: "Relative file path, e.g. .pi/agents/teams.yaml" },
					offset: { type: "integer", description: "1-based starting line (optional)" },
					limit: { type: "integer", description: "Max lines to return (optional, default 200, max 500)" },
				},
				required: ["path"],
			},
		},
	},
	{
		type: "function" as const,
		function: {
			name: "list_dir",
			description: "List files and subdirectories one level deep (Pi `ls`-style). Path relative to workspace.",
			parameters: {
				type: "object",
				properties: {
					path: { type: "string", description: "Directory path, or . for workspace root" },
				},
			},
		},
	},
	{
		type: "function" as const,
		function: {
			name: "grep",
			description:
				"Search with ripgrep (`rg`) under a workspace path (Pi `grep`-style). Requires `rg` on the server PATH.",
			parameters: {
				type: "object",
				properties: {
					pattern: { type: "string", description: "Ripgrep pattern (literal or regex per rg)" },
					path: { type: "string", description: "File or directory relative to workspace (default .)" },
					glob: { type: "string", description: "Optional glob filter, e.g. *.md" },
				},
				required: ["pattern"],
			},
		},
	},
	{
		type: "function" as const,
		function: {
			name: "write",
			description:
				"Create or overwrite a UTF-8 text file under the workspace (Pi `write`-style). Creates parent directories. Path is relative to workspace root.",
			parameters: {
				type: "object",
				properties: {
					path: { type: "string", description: "Relative file path, e.g. docs/hello.md" },
					content: { type: "string", description: "Full new file contents (UTF-8)" },
				},
				required: ["path", "content"],
			},
		},
	},
	{
		type: "function" as const,
		function: {
			name: "bash",
			description:
				"Run a non-interactive shell command in the workspace root. Only available when the server sets WOP_ORCHESTRATOR_BASH=1.",
			parameters: {
				type: "object",
				properties: {
					command: { type: "string", description: "Single shell command string" },
				},
				required: ["command"],
			},
		},
	},
];

/** Tools sent to the LLM (omit `bash` when not opted in). */
export function orchestratorToolsForLlm(): typeof ORCHESTRATOR_TOOLS_OPENAI {
	if (orchestratorBashEnabled()) return ORCHESTRATOR_TOOLS_OPENAI;
	return ORCHESTRATOR_TOOLS_OPENAI.filter((t) => t.function.name !== "bash");
}
