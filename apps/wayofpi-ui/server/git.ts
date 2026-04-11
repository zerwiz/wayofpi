import { realpathSync } from "node:fs";
import { join, relative } from "node:path";

function syncRealpath(abs: string): string {
	try {
		return realpathSync(abs);
	} catch {
		return abs;
	}
}

/** Two-column porcelain status → short label for the explorer (keeps `??`). */
function compactPorcelainStatus(xy: string): string {
	const pair = xy.length >= 2 ? xy.slice(0, 2) : xy;
	if (pair === "??") return "??";
	return pair.replace(/\s/g, "");
}

function unquotePorcelainPath(raw: string): string {
	let s = raw.trim();
	if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
		s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}
	return s.replace(/\\/g, "/");
}

function stripTrailingSlash(p: string): string {
	return p.replace(/\/+$/, "");
}

/**
 * Map a path from `git status` (repo-root-relative) to a path relative to
 * `workspaceRoot`. Returns null when the path is outside the workspace.
 *
 * Git reports paths relative to the repository root even when using
 * `git -C <workspaceSubdir>`, while the file tree uses paths relative to the
 * opened folder — so we rebase against `rev-parse --show-toplevel`.
 */
function repoPathToWorkspaceKey(
	workspaceRoot: string,
	repoTop: string,
	repoRelRaw: string,
): string | null {
	const parsed = stripTrailingSlash(unquotePorcelainPath(repoRelRaw));
	if (!parsed || parsed.includes("//")) return null;
	const abs = syncRealpath(join(repoTop, parsed));
	const wr = syncRealpath(workspaceRoot);
	const key = relative(wr, abs).replace(/\\/g, "/");
	if (!key || key.startsWith("..") || key.split("/").includes("..")) return null;
	return key;
}

function recordPath(
	map: Record<string, string>,
	workspaceRoot: string,
	repoTop: string,
	repoRelRaw: string,
	status: string,
): void {
	const key = repoPathToWorkspaceKey(workspaceRoot, repoTop, repoRelRaw);
	if (key) map[key] = status;
}

/** Relative path (tree keys) → short porcelain status (M, ??, MM, …). */
export async function gitStatusMap(root: string): Promise<Record<string, string>> {
	const map: Record<string, string> = {};
	const topProc = Bun.spawn(["git", "-C", root, "rev-parse", "--show-toplevel"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const topRaw = await new Response(topProc.stdout).text();
	if ((await topProc.exited) !== 0) return map;
	const repoTop = syncRealpath(topRaw.trim());
	if (!repoTop) return map;

	const proc = Bun.spawn(["git", "-C", root, "status", "--porcelain"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const out = await new Response(proc.stdout).text();
	if ((await proc.exited) !== 0) return map;

	for (const line of out.split("\n")) {
		if (line.length < 4) continue;
		const xyRaw = line.slice(0, 2);
		const status = compactPorcelainStatus(xyRaw);
		if (!status) continue;
		let rest = line.slice(3).trimStart();
		if (!rest) continue;

		const arrow = rest.indexOf(" -> ");
		const repoPaths = arrow === -1 ? [rest] : [rest.slice(0, arrow), rest.slice(arrow + 4)];
		for (const rp of repoPaths) {
			recordPath(map, root, repoTop, rp, status);
		}
	}
	return map;
}
