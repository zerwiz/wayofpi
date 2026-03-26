import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { applyExtensionDefaults } from "./themeMap.ts";

type CommandHandler = (args: string, ctx: ExtensionContext) => Promise<void> | void;

interface RegisteredCommand {
	name: string;
	description: string;
	usage: string;
	handler: CommandHandler;
}

const commands: RegisteredCommand[] = [];

function registerCliCommand(
	name: string,
	description: string,
	usage: string,
	handler: CommandHandler,
) {
	commands.push({ name, description, usage, handler });
}

function buildHelpText(): string {
	const lines: string[] = [];
	lines.push("GitHub Management CLI (ghm)");
	lines.push("Unified wrapper around git + gh for common workflows.");
	lines.push("");
	lines.push("Usage: ghm <command> [args]");
	lines.push("");
	lines.push("Commands:");
	for (const cmd of commands) {
		lines.push(`  ${cmd.name.padEnd(16)} ${cmd.description}`);
	}
	lines.push("");
	lines.push("Examples:");
	lines.push("  ghm help");
	lines.push("  ghm status");
	return lines.join("\n");
}

async function handleHelp(_args: string, ctx: ExtensionContext) {
	ctx.ui.notify(buildHelpText(), "info");
}

async function handleStatus(_args: string, ctx: ExtensionContext) {
	// Minimal status for now – shell out to git when available.
	const cwd = ctx.cwd;
	ctx.tools
		.exec({
			command: "git status -sb",
			working_directory: cwd,
			block_until_ms: 15000,
			description: "ghm status",
		})
		.then((res) => {
			if (res.exit_code === 0) {
				ctx.ui.notify(`ghm status (${cwd}):\n${res.stdout.trim()}`, "info");
			} else {
				ctx.ui.notify(
					`ghm status error (exit ${res.exit_code}):\n${(res.stderr || res.stdout || "").trim()}`,
					"error",
				);
			}
		})
		.catch((err: unknown) => {
			ctx.ui.notify(`ghm status failed: ${String(err)}`, "error");
		});
}

function dispatchCli(argv: string, ctx: ExtensionContext) {
	const raw = argv.trim();
	const [cmdName, ...rest] = raw.split(/\s+/).filter(Boolean);
	const args = rest.join(" ");

	if (!cmdName || cmdName === "help" || cmdName === "--help" || cmdName === "-h") {
		return handleHelp(args, ctx);
	}

	const cmd =
		commands.find((c) => c.name === cmdName) ??
		(commands.find((c) => c.name === `${cmdName} ${rest[0]}`) ?? null);

	if (!cmd) {
		return ctx.ui.notify(
			`Unknown ghm command "${raw}".\n\n${buildHelpText()}`,
			"warning",
		);
	}

	return cmd.handler(args, ctx);
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
	});

	// Register core commands table before any handlers use it.
	registerCliCommand("help", "Show ghm help inside Pi", "ghm help", handleHelp);
	registerCliCommand(
		"status",
		"Show git status for current cwd",
		"ghm status",
		handleStatus,
	);

	pi.registerTool({
		name: "ghm_exec",
		label: "GitHub management CLI (ghm)",
		description:
			"Run basic ghm commands (help, status) against the current working directory.",
		parameters: Type.Object({
			args: Type.String({
				description: "Arguments to pass to ghm, e.g. `status` or `help`.",
			}),
		}),
		async execute(_id, params: { args: string }, _s, _u, ctx: ExtensionContext) {
			await dispatchCli(params.args, ctx);
			return { content: [{ type: "text", text: "ghm command executed." }] };
		},
	});

	pi.registerCommand("ghm", {
		description:
			"GitHub management helper: /ghm help | status (thin wrapper around git/gh).",
		handler: async (args: string, ctx) => {
			await dispatchCli(args, ctx);
		},
	});
}

