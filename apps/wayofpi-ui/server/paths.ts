import { normalize, relative, sep } from "node:path";
import { getPrimaryWorkspacePath, resolveUnderWorkspace } from "./workspace-state";

const FORBIDDEN_SEGMENTS = new Set([
	"..",
	".git",
	"node_modules",
	".venv",
	"__pycache__",
	"dist",
	".next",
	".turbo",
]);

/** Primary (first) workspace folder — backward compatible with single-root servers. */
export function getWorkspaceRoot(): string {
	return getPrimaryWorkspacePath();
}

/** True if `target` is inside `root` (after resolve). */
export function isInsideRoot(root: string, target: string): boolean {
	const rel = relative(root, target);
	if (rel === "") return true;
	if (rel.startsWith("..") || rel.split(sep).includes("..")) return false;
	return true;
}

/** Resolve user-supplied relative path under workspace folder(s); returns null if unsafe. */
export function safeResolveUnderWorkspace(rel: string): string | null {
	return resolveUnderWorkspace(rel);
}

export function shouldSkipDir(name: string): boolean {
	return FORBIDDEN_SEGMENTS.has(name);
}

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MiB read cap for editor
