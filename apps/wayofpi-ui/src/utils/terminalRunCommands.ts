/** Shell line to run a workspace-relative file, or null if unknown type. */
export function runActiveFileShellLine(relPath: string): string | null {
	const t = relPath.trim().replace(/\\/g, "/");
	if (!t || t.includes("..")) return null;
	const q = JSON.stringify(t);
	const ext = t.split(".").pop()?.toLowerCase() ?? "";
	switch (ext) {
		case "sh":
			return `bash ${q}\r`;
		case "py":
		case "pyw":
			return `python3 ${q}\r`;
		case "rb":
			return `ruby ${q}\r`;
		case "js":
		case "cjs":
		case "mjs":
			return `node ${q}\r`;
		case "ts":
		case "tsx":
			return `bun ${q}\r`;
		case "go":
			return `go run ${q}\r`;
		default:
			return null;
	}
}
