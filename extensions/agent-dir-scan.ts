/**
 * Collect all `*.md` files under an agent directory tree (recursive).
 * Used so specialists can live in `.pi/agents/domain-specialists/<category>/…`.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function collectAgentMarkdownFiles(dir: string): string[] {
	if (!existsSync(dir)) return [];
	const out: string[] = [];

	function walk(d: string): void {
		let entries;
		try {
			entries = readdirSync(d, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			const p = join(d, e.name);
			if (e.isDirectory()) {
				walk(p);
			} else if (e.isFile() && e.name.endsWith(".md")) {
				out.push(p);
			}
		}
	}

	walk(dir);
	return out;
}
