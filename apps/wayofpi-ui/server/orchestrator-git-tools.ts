/**
 * INTERIM — Bun orchestrator Git helpers (github.com HTTPS PAT from `.wayofpi/github-credentials.json`).
 * Prefer headless Pi for long-term parity; see **`docs/WOP_PI_BACKEND_WIRING_PLAN.md`**.
 */
import { broadcastToolLog } from "./tool-log-broadcast";
import { gitStatusMap, gitWorktreeSnapshot } from "./git";
import { readGithubTokenForGit } from "./github-connection";
import { getPrimaryWorkspacePath } from "./workspace-state";

const MAX_GIT_COMBINED_OUT = 120_000;
const GIT_NET_TIMEOUT_MS = 90_000;

function orchestratorToolsEnabledInline(): boolean {
	const v = process.env.WOP_ORCHESTRATOR_TOOLS?.trim().toLowerCase();
	return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

/** When unset, Git tools follow **`WOP_ORCHESTRATOR_TOOLS`**. Set to 0/false/no/off to hide them. */
export function orchestratorGitWorkspaceToolsEnabled(): boolean {
	if (!orchestratorToolsEnabledInline()) return false;
	const v = process.env.WOP_ORCHESTRATOR_GIT_TOOLS?.trim().toLowerCase();
	if (v === "0" || v === "false" || v === "no" || v === "off") return false;
	return true;
}

function logGit(source: string, msg: string): void {
	broadcastToolLog("INFO", source, msg);
}

async function runGitArgv(
	args: string[],
	logLine: string,
): Promise<{ code: number; combined: string }> {
	const proc = Bun.spawn(args, {
		stdout: "pipe",
		stderr: "pipe",
	});
	const killTimer = setTimeout(() => {
		try {
			proc.kill("SIGTERM");
		} catch {
			/* ignore */
		}
	}, GIT_NET_TIMEOUT_MS);
	let out = "";
	let err = "";
	try {
		out = await new Response(proc.stdout).text();
		err = await new Response(proc.stderr).text();
	} finally {
		clearTimeout(killTimer);
	}
	const code = await proc.exited;
	let combined = [out.trim(), err.trim()].filter(Boolean).join("\n");
	if (combined.length > MAX_GIT_COMBINED_OUT) {
		combined = `${combined.slice(0, MAX_GIT_COMBINED_OUT)}\n…[truncated]`;
	}
	logGit("git", logLine);
	return { code, combined: combined || `(no output, exit ${code})` };
}

function buildGitSpawnArgs(cwd: string, token: string | null, rest: string[]): string[] {
	const argv = ["git"];
	if (token) {
		const b64 = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");
		argv.push("-c", `http.https://github.com/.extraheader=AUTHORIZATION: basic ${b64}`);
	}
	argv.push("-C", cwd, ...rest);
	return argv;
}

export async function orchestratorToolGitStatus(): Promise<string> {
	const cwd = getPrimaryWorkspacePath();
	const snap = await gitWorktreeSnapshot(cwd);
	if (!snap.isRepo) {
		return [
			"git_status: no Git worktree at the primary workspace folder.",
			"If the UI says “No Git repository detected”, open the repository root (the folder that contains `.git`) or a subdirectory inside that clone — not a parent directory above the repo.",
		].join("\n");
	}
	if (snap.error) {
		return `git_status: ${snap.error}`;
	}
	const map = await gitStatusMap(cwd);
	const keys = Object.keys(map).sort();
	const lines = keys.slice(0, 120).map((k) => `${map[k]}\t${k}`);
	const more = keys.length > 120 ? `\n… (${keys.length - 120} more paths)` : "";
	return [
		`branch: ${snap.branch ?? "?"}`,
		`repo_top: ${snap.topLevel ?? "?"}`,
		"porcelain:",
		lines.join("\n") || "(clean)",
		more,
	].join("\n");
}

export async function orchestratorToolGitRemote(): Promise<string> {
	const cwd = getPrimaryWorkspacePath();
	const { code, combined } = await runGitArgv(
		["git", "-C", cwd, "remote", "-v"],
		`git remote -v (cwd=${cwd})`,
	);
	if (code !== 0) return `git_remote: exit ${code}\n${combined}`;
	return `[git_remote]\n${combined}`;
}

export async function orchestratorToolGitFetch(args: {
	remote?: string;
	prune?: boolean;
}): Promise<string> {
	const cwd = getPrimaryWorkspacePath();
	const token = await readGithubTokenForGit();
	const remote = typeof args.remote === "string" && args.remote.trim() ? args.remote.trim() : "origin";
	const rest = ["fetch", remote];
	if (args.prune === true) rest.push("--prune");
	const argv = buildGitSpawnArgs(cwd, token, rest);
	const { code, combined } = await runGitArgv(argv, `git fetch ${remote}`);
	if (code !== 0) {
		const hint = !token
			? "\n(hint: connect GitHub in Way of Pi Settings if this remote is a private github.com HTTPS repo.)"
			: "";
		return `git_fetch: exit ${code}\n${combined}${hint}`;
	}
	return `git_fetch: ok\n${combined}`;
}

export async function orchestratorToolGitPull(args: { remote?: string; branch?: string }): Promise<string> {
	const cwd = getPrimaryWorkspacePath();
	const token = await readGithubTokenForGit();
	const remote = typeof args.remote === "string" && args.remote.trim() ? args.remote.trim() : "";
	const branch = typeof args.branch === "string" && args.branch.trim() ? args.branch.trim() : "";
	if (branch && !remote) {
		return "git_pull: pass **remote** when you pass **branch** (e.g. remote `origin`, branch `main`).";
	}
	const rest = ["pull", "--ff-only"];
	if (remote) rest.push(remote);
	if (branch) rest.push(branch);
	const argv = buildGitSpawnArgs(cwd, token, rest);
	const label =
		rest.length <= 2 ? "git pull --ff-only" : `git pull --ff-only ${rest.slice(2).join(" ")}`;
	const { code, combined } = await runGitArgv(argv, label);
	if (code !== 0) {
		const hint = !token
			? "\n(hint: Settings → GitHub adds a PAT for private github.com HTTPS remotes.)"
			: "";
		return `git_pull: exit ${code}\n${combined}${hint}`;
	}
	return `git_pull: ok\n${combined}`;
}

export async function orchestratorToolGitPush(args: {
	remote?: string;
	branch?: string;
	forceWithLease?: boolean;
}): Promise<string> {
	const cwd = getPrimaryWorkspacePath();
	const token = await readGithubTokenForGit();
	const remote = typeof args.remote === "string" && args.remote.trim() ? args.remote.trim() : "origin";
	const branch = typeof args.branch === "string" && args.branch.trim() ? args.branch.trim() : "";
	const rest: string[] = ["push", remote];
	if (args.forceWithLease === true) rest.push("--force-with-lease");
	if (branch) rest.push(branch);
	const argv = buildGitSpawnArgs(cwd, token, rest);
	const label = `git push ${remote}${branch ? ` ${branch}` : ""}${args.forceWithLease ? " --force-with-lease" : ""}`;
	const { code, combined } = await runGitArgv(argv, label);
	if (code !== 0) {
		const hint = !token
			? "\n(hint: Settings → GitHub adds a PAT for github.com HTTPS push.)"
			: "";
		return `git_push: exit ${code}\n${combined}${hint}`;
	}
	return `git_push: ok\n${combined}`;
}

export const ORCHESTRATOR_GIT_TOOLS_OPENAI = [
	{
		type: "function" as const,
		function: {
			name: "git_status",
			description:
				"Show current branch, repository top, and `git status --porcelain` for the primary workspace (local only; no network). Use when the user asks about Git state or the UI shows no repo — if this fails, the workspace folder is not inside a Git clone.",
			parameters: { type: "object", properties: {}, required: [] },
		},
	},
	{
		type: "function" as const,
		function: {
			name: "git_remote",
			description: "Run `git remote -v` in the workspace (read-only). Shows configured remotes and URLs.",
			parameters: { type: "object", properties: {}, required: [] },
		},
	},
	{
		type: "function" as const,
		function: {
			name: "git_fetch",
			description:
				"Run `git fetch` against a remote (default origin). When a GitHub PAT is saved in Way of Pi Settings, adds HTTPS auth for github.com; otherwise still runs (public remotes, SSH, or host credential helpers). Optional --prune.",
			parameters: {
				type: "object",
				properties: {
					remote: { type: "string", description: "Remote name (default origin)" },
					prune: { type: "boolean", description: "Pass --prune to fetch" },
				},
				required: [],
			},
		},
	},
	{
		type: "function" as const,
		function: {
			name: "git_pull",
			description:
				"Run `git pull --ff-only` (fast-forward only). With no arguments, uses the branch’s configured upstream. Optional remote and branch; if branch is set, remote is required. PAT from Settings → GitHub is injected for github.com HTTPS when present.",
			parameters: {
				type: "object",
				properties: {
					remote: { type: "string", description: "Remote name (default origin)" },
					branch: { type: "string", description: "Optional branch/ref to merge from remote" },
				},
				required: [],
			},
		},
	},
	{
		type: "function" as const,
		function: {
			name: "git_push",
			description:
				"Run `git push` to origin (or chosen remote). Uses GitHub PAT from Way of Pi Settings for github.com HTTPS. Prefer non-force; optional --force-with-lease for safe force updates.",
			parameters: {
				type: "object",
				properties: {
					remote: { type: "string", description: "Remote name (default origin)" },
					branch: { type: "string", description: "Optional branch to push (default: Git push default)" },
					forceWithLease: { type: "boolean", description: "If true, add --force-with-lease" },
				},
				required: [],
			},
		},
	},
] as const;
