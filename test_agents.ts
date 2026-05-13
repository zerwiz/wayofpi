import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

function parseAgentMarkdownPiStyle(raw: string): {
	name: string;
	description: string;
	tools: string;
	skills: string;
	body: string;
} | null {
	const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return null;

	const frontmatter: Record<string, string> = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx > 0) {
			frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
		}
	}

	if (!frontmatter.name) return null;

	return {
		name: frontmatter.name,
		description: frontmatter.description || "",
		tools: frontmatter.tools || "read,grep,find,ls",
		skills: frontmatter.skills || "",
		body: match[2].trim(),
	};
}

async function collectAgentMarkdownFiles(absDir: string): Promise<string[]> {
	const out: string[] = [];
	async function walk(d: string) {
		let entries;
		try {
			entries = await readdir(d, { withFileTypes: true });
		} catch (e) {
			console.error("Error reading dir", d, e);
			return;
		}
		for (const e of entries) {
			const p = join(d, e.name);
			if (e.isDirectory()) {
				await walk(p);
			} else if (e.isFile() && e.name.endsWith(".md")) {
				out.push(p);
			}
		}
	}
	await walk(absDir);
	return out;
}

const workspaceRoot = "/home/zerwiz/CodeP/Way of pi";
const agentScanRoots = [
    join(workspaceRoot, "agents"),
    join(workspaceRoot, ".claude", "agents"),
    join(workspaceRoot, ".pi", "agents"),
    join(workspaceRoot, ".cursor", "agents"),
];

async function test() {
    for (const dir of agentScanRoots) {
        console.log("Checking dir:", dir);
        if (!existsSync(dir)) {
            console.log("Dir does not exist:", dir);
            continue;
        }
        const mdFiles = await collectAgentMarkdownFiles(dir);
        console.log("Found MD files:", mdFiles.length);
        for (const abs of mdFiles) {
            const raw = readFileSync(abs, "utf8");
            const parsed = parseAgentMarkdownPiStyle(raw);
            if (parsed) {
                console.log("Parsed agent:", parsed.name, "from", abs);
            } else {
                console.log("Failed to parse agent from", abs);
            }
        }
    }
}

test().catch(console.error);
