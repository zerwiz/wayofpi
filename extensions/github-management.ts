/**
 * GitHub management — `gh` + `git` helpers for agents (PR list/view/diff/checks/review/inline comments).
 *
 * Slash: `/ghm <subcommand> [args]`
 * Tools: `ghm_exec` (legacy dispatcher), `github_pr_*` (typed; preferred for review flows)
 *
 * Requires [GitHub CLI](https://cli.github.com/) (`gh`) authenticated (`gh auth login`).
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { randomBytes } from "node:crypto";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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

async function shell(
	ctx: ExtensionContext,
	cmd: string,
	blockMs = 120_000,
): Promise<{ ok: boolean; out: string }> {
	const res = await ctx.tools.exec({
		command: cmd,
		working_directory: ctx.cwd,
		block_until_ms: blockMs,
		description: `ghm: ${cmd.slice(0, 96)}`,
	});
	const parts = [res.stdout ?? "", res.stderr ?? ""].filter((s) => s.trim().length > 0);
	const out = parts.join("\n").trim();
	if (res.exit_code !== 0) {
		return { ok: false, out: `command failed (exit ${res.exit_code})\n${out || "(no output)"}` };
	}
	return { ok: true, out: out || "(no output)" };
}

async function repoSlug(ctx: ExtensionContext): Promise<string | null> {
	const r = await shell(ctx, "gh repo view --json nameWithOwner -q .nameWithOwner", 30_000);
	if (r.ok && r.out && !r.out.includes("failed")) {
		const s = r.out.trim().split("\n")[0]?.trim();
		if (s && /^[\w.-]+\/[\w.-]+$/.test(s)) return s;
	}
	return null;
}

async function resolvePrArg(args: string, ctx: ExtensionContext): Promise<string> {
	const n = args.trim().split(/\s+/)[0];
	if (n && /^\d+$/.test(n)) return n;
	const r = await shell(ctx, "gh pr view --json number -q .number", 30_000);
	if (!r.ok) return "";
	return r.out.trim().split("\n")[0] ?? "";
}

const MAX_PATCH_CHARS = 120_000;

function buildHelpText(): string {
	const lines: string[] = [];
	lines.push("GitHub Management CLI (ghm)");
	lines.push("Unified wrapper around git + gh. Prefer LLM tools: github_pr_list, github_pr_view, github_pr_diff, …");
	lines.push("");
	lines.push("Usage: ghm <command> [args]");
	lines.push("");
	lines.push("Commands:");
	for (const cmd of commands) {
		lines.push(`  ${cmd.name.padEnd(18)} ${cmd.description}`);
	}
	lines.push("");
	lines.push("Examples:");
	lines.push("  ghm help");
	lines.push("  ghm status");
	lines.push("  ghm pr-list");
	lines.push("  ghm pr-view 42");
	return lines.join("\n");
}

async function handleHelp(_args: string, ctx: ExtensionContext) {
	ctx.ui.notify(buildHelpText(), "info");
}

async function handleStatus(_args: string, ctx: ExtensionContext) {
	const r = await shell(ctx, "git status -sb", 20_000);
	ctx.ui.notify(r.ok ? `ghm status:\n${r.out}` : r.out, r.ok ? "info" : "error");
}

async function handlePrList(_args: string, ctx: ExtensionContext) {
	const r = await shell(
		ctx,
		'gh pr list --json number,title,author,state,isDraft,url --limit 30',
		60_000,
	);
	ctx.ui.notify(r.ok ? r.out : r.out, r.ok ? "info" : "error");
}

async function handlePrView(args: string, ctx: ExtensionContext) {
	const n = args.trim() || (await resolvePrArg("", ctx));
	const cmd = n
		? `gh pr view ${n} --json title,body,state,url,baseRefName,headRefName,additions,deletions,changedFiles,files`
		: `gh pr view --json title,body,state,url,baseRefName,headRefName,additions,deletions,changedFiles,files`;
	const r = await shell(ctx, cmd, 60_000);
	ctx.ui.notify(r.ok ? r.out : r.out, r.ok ? "info" : "error");
}

async function handlePrDiff(args: string, ctx: ExtensionContext) {
	const parts = args.trim().split(/\s+/).filter(Boolean);
	let n = "";
	let mode: "patch" | "stat" | "name_only" = "stat";
	for (const p of parts) {
		if (/^\d+$/.test(p)) n = p;
		else if (p === "--patch" || p === "-p") mode = "patch";
		else if (p === "--stat") mode = "stat";
		else if (p === "--name-only") mode = "name_only";
	}
	if (!n) n = await resolvePrArg("", ctx);
	if (!n) {
		ctx.ui.notify("ghm pr-diff: could not resolve PR number (try: ghm pr-diff 12)", "warning");
		return;
	}
	const flag = mode === "patch" ? "" : mode === "stat" ? "--stat" : "--name-only";
	const r = await shell(ctx, `gh pr diff ${n} ${flag}`.trim(), 120_000);
	let out = r.out;
	if (mode === "patch" && out.length > MAX_PATCH_CHARS) {
		out = out.slice(0, MAX_PATCH_CHARS) + `\n\n… [truncated; use github_pr_diff with format stat or name_only, or gh pr diff ${n} locally]`;
	}
	ctx.ui.notify(r.ok ? out : out, r.ok ? "info" : "error");
}

async function handlePrChecks(args: string, ctx: ExtensionContext) {
	const n = (args.trim().split(/\s+/)[0] || (await resolvePrArg("", ctx))).trim();
	if (!n) {
		ctx.ui.notify("ghm pr-checks: need PR number or current branch PR", "warning");
		return;
	}
	const r = await shell(ctx, `gh pr checks ${n}`, 120_000);
	ctx.ui.notify(r.ok ? r.out : r.out, r.ok ? "info" : "error");
}

function dispatchCliNotify(argv: string, ctx: ExtensionContext) {
	const raw = argv.trim();
	const [cmdName, ...rest] = raw.split(/\s+/).filter(Boolean);
	const restStr = rest.join(" ");
	const args = restStr;

	if (!cmdName || cmdName === "help" || cmdName === "--help" || cmdName === "-h") {
		return handleHelp(args, ctx);
	}

	const multi = `${cmdName} ${rest[0] ?? ""}`.trim();
	const cmd =
		commands.find((c) => c.name === cmdName) ??
		commands.find((c) => c.name === multi) ??
		null;

	if (!cmd) {
		return ctx.ui.notify(
			`Unknown ghm command "${raw}".\n\n${buildHelpText()}`,
			"warning",
		);
	}

	const handlerArgs = cmd.name.includes(" ") ? rest.slice(1).join(" ") : restStr;
	return cmd.handler(handlerArgs, ctx);
}

/** Run ghm-style argv and return text for tools (no TUI notify). */
async function ghmExecText(argv: string, ctx: ExtensionContext): Promise<string> {
	const raw = argv.trim();
	const [cmdName, ...rest] = raw.split(/\s+/).filter(Boolean);
	const restStr = rest.join(" ");

	if (!cmdName || cmdName === "help" || cmdName === "-h" || cmdName === "--help") {
		return buildHelpText();
	}

	if (cmdName === "status") {
		const r = await shell(ctx, "git status -sb", 20_000);
		return r.out;
	}

	if (cmdName === "pr-list") {
		const r = await shell(ctx, 'gh pr list --json number,title,author,state,isDraft,url --limit 30', 60_000);
		return r.ok ? r.out : r.out;
	}

	if (cmdName === "pr-view") {
		const n = restStr.trim() || (await resolvePrArg("", ctx));
		const cmd = n
			? `gh pr view ${n} --json title,body,state,url,baseRefName,headRefName,additions,deletions,changedFiles,files`
			: `gh pr view --json title,body,state,url,baseRefName,headRefName,additions,deletions,changedFiles,files`;
		const r = await shell(ctx, cmd, 60_000);
		return r.out;
	}

	if (cmdName === "pr-diff") {
		const parts = restStr.split(/\s+/).filter(Boolean);
		let n = "";
		let mode: "patch" | "stat" | "name_only" = "stat";
		for (const p of parts) {
			if (/^\d+$/.test(p)) n = p;
			else if (p === "--patch" || p === "-p") mode = "patch";
			else if (p === "--name-only") mode = "name_only";
			else if (p === "--stat") mode = "stat";
		}
		if (!n) n = await resolvePrArg("", ctx);
		if (!n) return "pr-diff: could not resolve PR number";
		const flag = mode === "patch" ? "" : mode === "stat" ? "--stat" : "--name-only";
		const r = await shell(ctx, `gh pr diff ${n} ${flag}`.trim(), 120_000);
		let out = r.out;
		if (mode === "patch" && out.length > MAX_PATCH_CHARS) {
			out =
				out.slice(0, MAX_PATCH_CHARS) +
				`\n\n… [truncated at ${MAX_PATCH_CHARS} chars; use stat/name_only or smaller PR]`;
		}
		return out;
	}

	if (cmdName === "pr-checks") {
		const n = rest[0] ?? (await resolvePrArg("", ctx));
		if (!n) return "pr-checks: need PR number";
		const r = await shell(ctx, `gh pr checks ${n}`, 120_000);
		return r.out;
	}

	return `Unknown ghm subcommand: ${raw}\n\n${buildHelpText()}`;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
	});

	registerCliCommand("help", "Show ghm help", "ghm help", handleHelp);
	registerCliCommand("status", "git status -sb", "ghm status", handleStatus);
	registerCliCommand("pr-list", "List open PRs (JSON)", "ghm pr-list", handlePrList);
	registerCliCommand("pr-view", "PR details JSON (gh pr view)", "ghm pr-view [number]", handlePrView);
	registerCliCommand(
		"pr-diff",
		"PR diff: [--stat|--name-only|--patch] [number]",
		"ghm pr-diff [--stat] [number]",
		handlePrDiff,
	);
	registerCliCommand("pr-checks", "CI checks for PR", "ghm pr-checks [number]", handlePrChecks);

	pi.registerTool({
		name: "ghm_exec",
		label: "GitHub management CLI (ghm)",
		description:
			"Run ghm subcommands and return stdout/stderr text (not only notifications). Args: `help`, `status`, `pr-list`, `pr-view [N]`, `pr-diff [--stat|--name-only|--patch] [N]`, `pr-checks [N]`. Requires `gh` CLI.",
		parameters: Type.Object({
			args: Type.String({
				description:
					"ghm arguments, e.g. `pr-list`, `pr-view 12`, `pr-diff --stat 12`, `pr-checks 12`",
			}),
		}),
		async execute(_id, params: { args: string }, _s, _u, ctx: ExtensionContext) {
			const text = await ghmExecText(params.args, ctx);
			return { content: [{ type: "text", text }] };
		},
	});

	pi.registerTool({
		name: "github_pr_list",
		label: "List GitHub pull requests",
		description: "List open PRs for the current repo via `gh pr list` (JSON). Use before review workflows.",
		parameters: Type.Object({
			limit: Type.Optional(
				Type.Number({ description: "Max PRs (default 30, max 50)", minimum: 1, maximum: 50 }),
			),
		}),
		async execute(_id, params: { limit?: number }, _s, _u, ctx: ExtensionContext) {
			const lim = Math.min(50, Math.max(1, params.limit ?? 30));
			const r = await shell(
				ctx,
				`gh pr list --json number,title,author,state,isDraft,url,headRefName,baseRefName --limit ${lim}`,
				60_000,
			);
			return { content: [{ type: "text", text: r.out }] };
		},
	});

	pi.registerTool({
		name: "github_pr_view",
		label: "View GitHub pull request",
		description:
			"Show PR metadata as JSON (title, body, branches, changedFiles summary, files list). Omit pr_number for PR associated with current branch.",
		parameters: Type.Object({
			pr_number: Type.Optional(
				Type.Number({ description: "Pull request number (omit if branch has an open PR)" }),
			),
		}),
		async execute(_id, params: { pr_number?: number }, _s, _u, ctx: ExtensionContext) {
			const n = params.pr_number;
			const cmd =
				n != null
					? `gh pr view ${n} --json title,body,state,url,baseRefName,headRefName,headRefOid,additions,deletions,changedFiles,files,commits`
					: `gh pr view --json title,body,state,url,baseRefName,headRefName,headRefOid,additions,deletions,changedFiles,files,commits`;
			const r = await shell(ctx, cmd, 60_000);
			return { content: [{ type: "text", text: r.out }] };
		},
	});

	pi.registerTool({
		name: "github_pr_diff",
		label: "GitHub PR diff",
		description:
			"Fetch PR diff via `gh pr diff`. Use format `stat` or `name_only` for large PRs; `patch` may truncate.",
		parameters: Type.Object({
			pr_number: Type.Optional(Type.Number({ description: "PR number (default: PR for current branch)" })),
			format: Type.Optional(
				Type.Union(
					[
						Type.Literal("patch"),
						Type.Literal("stat"),
						Type.Literal("name_only"),
					],
					{ description: "Default stat" },
				),
			),
		}),
		async execute(
			_id,
			params: { pr_number?: number; format?: "patch" | "stat" | "name_only" },
			_s,
			_u,
			ctx: ExtensionContext,
		) {
			let n = params.pr_number != null ? String(params.pr_number) : await resolvePrArg("", ctx);
			if (!n) {
				return {
					content: [{ type: "text", text: "Could not resolve PR number; pass pr_number explicitly." }],
				};
			}
			const fmt = params.format ?? "stat";
			const flag = fmt === "patch" ? "" : fmt === "stat" ? "--stat" : "--name-only";
			const r = await shell(ctx, `gh pr diff ${n} ${flag}`.trim(), 120_000);
			let out = r.out;
			if (fmt === "patch" && out.length > MAX_PATCH_CHARS) {
				out =
					out.slice(0, MAX_PATCH_CHARS) +
					`\n\n… [truncated; use stat or name_only for overview]`;
			}
			return { content: [{ type: "text", text: out }] };
		},
	});

	pi.registerTool({
		name: "github_pr_checks",
		label: "GitHub PR checks",
		description: "Run `gh pr checks` for CI status on a PR.",
		parameters: Type.Object({
			pr_number: Type.Optional(Type.Number({ description: "PR number (default: current branch PR)" })),
		}),
		async execute(_id, params: { pr_number?: number }, _s, _u, ctx: ExtensionContext) {
			const n =
				params.pr_number != null ? String(params.pr_number) : await resolvePrArg("", ctx);
			if (!n) {
				return {
					content: [{ type: "text", text: "Could not resolve PR number; pass pr_number explicitly." }],
				};
			}
			const r = await shell(ctx, `gh pr checks ${n}`, 120_000);
			return { content: [{ type: "text", text: r.out }] };
		},
	});

	pi.registerTool({
		name: "github_pr_review_submit",
		label: "Submit GitHub PR review",
		description:
			"Submit an approval, request changes, or comment-only review via `gh pr review`. For line-level suggestions use github_pr_review_inline.",
		parameters: Type.Object({
			pr_number: Type.Optional(Type.Number({ description: "PR number (default: current branch PR)" })),
			event: Type.Union(
				[
					Type.Literal("approve"),
					Type.Literal("request_changes"),
					Type.Literal("comment"),
				],
				{ description: "Review type" },
			),
			body: Type.Optional(
				Type.String({ description: "Review comment (required for request_changes and comment)" }),
			),
		}),
		async execute(
			_id,
			params: {
				pr_number?: number;
				event: "approve" | "request_changes" | "comment";
				body?: string;
			},
			_s,
			_u,
			ctx: ExtensionContext,
		) {
			const n =
				params.pr_number != null ? String(params.pr_number) : await resolvePrArg("", ctx);
			if (!n) {
				return {
					content: [{ type: "text", text: "Could not resolve PR number; pass pr_number explicitly." }],
				};
			}
			const ev = params.event;
			const body = (params.body ?? "").trim();
			if ((ev === "request_changes" || ev === "comment") && !body) {
				return {
					content: [
						{
							type: "text",
							text: "body is required for request_changes and comment reviews",
						},
					],
				};
			}
			let cmd = `gh pr review ${n}`;
			if (ev === "approve") cmd += " --approve";
			if (ev === "request_changes") cmd += " --request-changes";
			if (ev === "comment") cmd += " --comment";
			if (body) {
				const tmp = join(ctx.cwd, ".pi", "tmp");
				try {
					mkdirSync(tmp, { recursive: true });
				} catch {
					/* use cwd */
				}
				const f = join(tmp, `ghm-review-${randomBytes(8).toString("hex")}.txt`);
				writeFileSync(f, body, "utf-8");
				cmd += ` --body-file "${f.replace(/"/g, '\\"')}"`;
				const r = await shell(ctx, cmd, 60_000);
				try {
					unlinkSync(f);
				} catch {
					/* ok */
				}
				return { content: [{ type: "text", text: r.out }] };
			}
			const r = await shell(ctx, cmd, 60_000);
			return { content: [{ type: "text", text: r.out }] };
		},
	});

	pi.registerTool({
		name: "github_pr_review_inline",
		label: "GitHub PR inline review comment (suggested edits)",
		description:
			"Post a line-level review comment on a PR file via GitHub API (`gh api`). Put a suggested replacement in `body` using a markdown code fence: ```suggestion\\n...new line...\\n``` (GitHub suggested change). Get headRefOid from github_pr_view.",
		parameters: Type.Object({
			pr_number: Type.Number({ description: "Pull request number" }),
			path: Type.String({ description: "Repo-relative file path (e.g. src/foo.ts)" }),
			line: Type.Number({
				description: "Line number in the diff (new file side / right side for most reviews)",
			}),
			side: Type.Optional(
				Type.Union([Type.Literal("RIGHT"), Type.Literal("LEFT")], {
					description: "Usually RIGHT (after change); default RIGHT",
				}),
			),
			commit_oid: Type.String({
				description: "Head commit SHA for the PR (headRefOid from github_pr_view)",
			}),
			body: Type.String({
				description: "Comment markdown; include ```suggestion ... ``` for applyable edits",
			}),
		}),
		async execute(
			_id,
			params: {
				pr_number: number;
				path: string;
				line: number;
				side?: "RIGHT" | "LEFT";
				commit_oid: string;
				body: string;
			},
			_s,
			_u,
			ctx: ExtensionContext,
		) {
			const slug = await repoSlug(ctx);
			if (!slug) {
				return {
					content: [
						{
							type: "text",
							text: "Could not resolve owner/repo (run inside a gh repo; check `gh repo view`).",
						},
					],
				};
			}
			const payload = {
				body: params.body,
				commit_id: params.commit_oid.trim(),
				path: params.path.replace(/\\/g, "/"),
				line: params.line,
				side: params.side ?? "RIGHT",
			};
			const tmpDir = join(ctx.cwd, ".pi", "tmp");
			try {
				mkdirSync(tmpDir, { recursive: true });
			} catch {
				/* */
			}
			const f = join(tmpDir, `ghm-inline-${randomBytes(8).toString("hex")}.json`);
			writeFileSync(f, JSON.stringify(payload), "utf-8");
			const apiPath = `repos/${slug}/pulls/${params.pr_number}/comments`;
			const r = await shell(ctx, `gh api ${apiPath} --method POST --input "${f.replace(/"/g, '\\"')}"`, 60_000);
			try {
				unlinkSync(f);
			} catch {
				/* */
			}
			return {
				content: [
					{
						type: "text",
						text: r.ok
							? `Inline review comment created.\n${r.out}`
							: `Failed to create inline comment:\n${r.out}`,
					},
				],
			};
		},
	});

	pi.registerCommand("ghm", {
		description:
			"GitHub helper: /ghm help | status | pr-list | pr-view [N] | pr-diff [--stat|--name-only|--patch] [N] | pr-checks [N]",
		handler: async (args: string, ctx) => {
			dispatchCliNotify(args, ctx);
		},
	});
}
