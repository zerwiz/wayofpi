/** Relative path -> porcelain status (M, A, D, ??, etc.) */
export async function gitStatusMap(root: string): Promise<Record<string, string>> {
	const map: Record<string, string> = {};
	const proc = Bun.spawn(["git", "-C", root, "status", "--porcelain"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const out = await new Response(proc.stdout).text();
	if ((await proc.exited) !== 0) return map;
	for (const line of out.split("\n")) {
		if (line.length < 4) continue;
		const status = line.slice(0, 2).trim();
		const rel = line.slice(3).trim();
		if (rel) map[rel.replace(/\\/g, "/")] = status;
	}
	return map;
}
