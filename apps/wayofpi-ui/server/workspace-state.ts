import { existsSync, realpathSync } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";

export interface WorkspaceFolderEntry {
	label: string;
	path: string;
}

/** Captured at process start (before any UI switch). */
let frozenInitialPath = "";

let folders: WorkspaceFolderEntry[] = [];

function syncRealpath(abs: string): string {
	try {
		return normalize(realpathSync(abs));
	} catch {
		return normalize(abs);
	}
}

function uniqueLabelsFor(absPaths: string[]): WorkspaceFolderEntry[] {
	const nameCount = new Map<string, number>();
	return absPaths.map((absPath) => {
		const norm = syncRealpath(absPath);
		const base = basename(norm);
		const n = (nameCount.get(base) ?? 0) + 1;
		nameCount.set(base, n);
		const label = n === 1 ? base : `${base} (${n})`;
		return { label, path: norm };
	});
}

export function initWorkspaceFoldersFromEnv(): void {
	const raw = process.env.WOP_WORKSPACE?.trim();
	const start = normalize(resolve(raw || process.cwd()));
	const real = syncRealpath(start);
	frozenInitialPath = real;
	folders = uniqueLabelsFor([real]);
}

initWorkspaceFoldersFromEnv();

export function getFrozenInitialWorkspacePath(): string {
	return frozenInitialPath;
}

export function listWorkspaceFolders(): WorkspaceFolderEntry[] {
	return folders.map((f) => ({ ...f }));
}

export function getPrimaryWorkspacePath(): string {
	return folders[0]?.path ?? frozenInitialPath;
}

function isSwitchAllowed(): boolean {
	const v = process.env.WOP_ALLOW_WORKSPACE_SWITCH?.trim().toLowerCase();
	return v !== "0" && v !== "false" && v !== "no";
}

export function workspaceSwitchAllowed(): boolean {
	return isSwitchAllowed();
}

/** Path must be inside `root` (no `..` escape). */
function isInsideRoot(root: string, target: string): boolean {
	const rel = relative(root, target);
	if (rel === "") return true;
	if (rel.startsWith("..") || rel.split(sep).includes("..")) return false;
	return true;
}

/**
 * Resolve editor/tree-relative path to absolute file path.
 * Single-folder: `rel` is relative to that folder.
 * Multi-root: `rel` is `label/rest`.
 */
export function resolveUnderWorkspace(relRaw: string): string | null {
	const trimmed = relRaw.replace(/^[/\\]+/, "");
	if (!trimmed || trimmed === "." || trimmed.includes("..")) return null;

	if (folders.length === 1) {
		const root = folders[0].path;
		const joined = normalize(join(root, trimmed));
		if (!isInsideRoot(root, joined)) return null;
		return joined;
	}

	const slash = trimmed.indexOf("/");
	const label = slash === -1 ? trimmed : trimmed.slice(0, slash);
	const rest = slash === -1 ? "" : trimmed.slice(slash + 1);
	const folder = folders.find((f) => f.label === label);
	if (!folder || !rest) return null;
	const joined = normalize(join(folder.path, rest));
	if (!isInsideRoot(folder.path, joined)) return null;
	return joined;
}

export async function assertDirectory(absInput: string): Promise<string> {
	if (!isSwitchAllowed()) {
		throw new Error("Workspace switching is disabled (set WOP_ALLOW_WORKSPACE_SWITCH unset or 1).");
	}
	const abs = normalize(resolve(absInput.trim()));
	if (!existsSync(abs)) throw new Error("Path does not exist");
	const st = await stat(abs);
	if (!st.isDirectory()) throw new Error("Not a directory");
	return syncRealpath(abs);
}

export async function assertFile(absInput: string): Promise<string> {
	if (!isSwitchAllowed()) {
		throw new Error("Workspace switching is disabled (set WOP_ALLOW_WORKSPACE_SWITCH unset or 1).");
	}
	const abs = normalize(resolve(absInput.trim()));
	if (!existsSync(abs)) throw new Error("Path does not exist");
	const st = await stat(abs);
	if (!st.isFile()) throw new Error("Not a file");
	return syncRealpath(abs);
}

export async function setWorkspaceFoldersAbs(absPaths: string[]): Promise<void> {
	if (absPaths.length === 0) throw new Error("At least one folder path is required");
	const resolved: string[] = [];
	for (const p of absPaths) {
		resolved.push(await assertDirectory(p));
	}
	folders = uniqueLabelsFor(resolved);
}

export async function openFolder(absDir: string): Promise<void> {
	const dir = await assertDirectory(absDir);
	folders = uniqueLabelsFor([dir]);
}

export async function addFolder(absDir: string): Promise<void> {
	const dir = await assertDirectory(absDir);
	const paths = [...folders.map((f) => f.path)];
	if (paths.some((p) => p === dir)) throw new Error("Folder is already in the workspace");
	paths.push(dir);
	folders = uniqueLabelsFor(paths);
}

export function removeFolderByLabel(label: string): void {
	if (!isSwitchAllowed()) {
		throw new Error("Workspace switching is disabled.");
	}
	const next = folders.filter((f) => f.label !== label);
	if (next.length === folders.length) throw new Error("Unknown folder label");
	if (next.length === 0) {
		folders = uniqueLabelsFor([frozenInitialPath]);
		return;
	}
	folders = uniqueLabelsFor(next.map((f) => f.path));
}

export function resetWorkspaceToInitial(): void {
	if (!isSwitchAllowed()) {
		throw new Error("Workspace switching is disabled.");
	}
	folders = uniqueLabelsFor([frozenInitialPath]);
}

/**
 * Open a file's containing folder as the only root; returns path relative to new root for editor selection.
 */
export async function openFileInWorkspace(absFile: string): Promise<string> {
	const file = await assertFile(absFile);
	const dir = syncRealpath(dirname(file));
	folders = uniqueLabelsFor([dir]);
	const rel = relative(dir, file).replace(/\\/g, "/");
	if (!rel || rel.startsWith("..")) throw new Error("Could not resolve file under workspace");
	return rel;
}

export async function loadFoldersFromWorkspaceJson(
	raw: unknown,
	workspaceFileAbsPath: string,
): Promise<void> {
	if (!isSwitchAllowed()) {
		throw new Error("Workspace switching is disabled.");
	}
	const baseDir = dirname(workspaceFileAbsPath);
	const o = raw as { folders?: unknown };
	if (!o || !Array.isArray(o.folders)) throw new Error('Invalid workspace file: expected { "folders": [...] }');
	const paths: string[] = [];
	for (const item of o.folders) {
		const p =
			item && typeof item === "object" && item !== null && "path" in item
				? String((item as { path?: string }).path ?? "").trim()
				: "";
		if (!p) continue;
		const abs = isAbsolute(p) ? resolve(p) : resolve(baseDir, p);
		paths.push(abs);
	}
	if (paths.length === 0) throw new Error("Workspace file has no folders");
	const resolved: string[] = [];
	for (const p of paths) {
		resolved.push(await assertDirectory(p));
	}
	folders = uniqueLabelsFor(resolved);
}
