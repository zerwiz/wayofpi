import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { getWorkspaceRoot } from "./paths";

/** Matches `plans/PLAN-YYYYMMDD-<slug>.md` filenames only. */
const PLAN_FILENAME_RE = /^PLAN-\d{8}-.+\.md$/i;

const MAX_PLAN_READ = 400_000;

export function countPlanTodosInMarkdown(md: string): { openTodos: number; doneTodos: number } {
	let openTodos = 0;
	let doneTodos = 0;
	for (const line of md.split(/\r?\n/)) {
		const m = line.match(/^\s*-\s*\[([ xX])\]/);
		if (!m) continue;
		if (m[1] === " ") openTodos += 1;
		else doneTodos += 1;
	}
	return { openTodos, doneTodos };
}

export type PlansCatalogFile = { path: string; mtimeMs: number };

export type PlansCatalogLatest = PlansCatalogFile & {
	openTodos: number;
	doneTodos: number;
};

export async function listPlansCatalog(): Promise<{
	files: PlansCatalogFile[];
	latest: PlansCatalogLatest | null;
}> {
	const root = getWorkspaceRoot();
	const dir = join(root, "plans");
	if (!existsSync(dir)) {
		return { files: [], latest: null };
	}
	const names = await readdir(dir);
	const files: PlansCatalogFile[] = [];
	for (const name of names) {
		if (!PLAN_FILENAME_RE.test(name)) continue;
		const rel = `plans/${name}`;
		const abs = join(root, rel);
		try {
			const st = await stat(abs);
			if (!st.isFile()) continue;
			files.push({ path: rel.replace(/\\/g, "/"), mtimeMs: st.mtimeMs });
		} catch {
			/* skip */
		}
	}
	files.sort((a, b) => b.mtimeMs - a.mtimeMs);
	let latest: PlansCatalogLatest | null = null;
	if (files.length > 0) {
		const top = files[0]!;
		try {
			const buf = await readFile(join(root, top.path), "utf8");
			const slice = buf.length > MAX_PLAN_READ ? buf.slice(0, MAX_PLAN_READ) : buf;
			const { openTodos, doneTodos } = countPlanTodosInMarkdown(slice);
			latest = { ...top, openTodos, doneTodos };
		} catch {
			latest = { ...top, openTodos: 0, doneTodos: 0 };
		}
	}
	return { files, latest };
}
