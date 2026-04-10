#!/usr/bin/env bun
/**
 * Way of Pi — upstream Pi (GitHub / npm) availability check + optional doc mirror sync.
 * Renames paths under vendor/wop-upstream/ per scripts/wop-upstream/config.json (no ambiguous "pi" as our product root).
 *
 * Usage:
 *   bun scripts/wop-pi-upstream.ts check
 *   bun scripts/wop-pi-upstream.ts sync --source pi-mono --ref <tag> --dry-run
 *   bun scripts/wop-pi-upstream.ts sync --source pi-mono --ref <tag> --apply
 *
 * Optional: GITHUB_TOKEN in env (higher GitHub API rate limit).
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, stat, cp, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");
const CONFIG_PATH = join(REPO_ROOT, "scripts", "wop-upstream", "config.json");
const LOCK_PATH = join(REPO_ROOT, "wop.upstream.lock.json");
const TMP_ROOT = join(REPO_ROOT, ".tmp-wop-upstream");

type PathRewrite = { match: string; replace: string };

type GithubArchiveSource = {
	id: string;
	type: "github-archive";
	owner: string;
	repo: string;
	description?: string;
	includePaths: string[];
	pathRewrites: PathRewrite[];
	destRoot: string;
};

type NpmRegistrySource = {
	id: string;
	type: "npm-registry";
	package: string;
	description?: string;
};

type Source = GithubArchiveSource | NpmRegistrySource;

type Config = { version: number; sources: Source[] };

type LockFile = {
	version: number;
	comment?: string;
	sources: Record<
		string,
		{
			pinnedRef?: string;
			lastCheckedRemoteRef?: string;
			lastSyncedAt?: string;
			npmLatest?: string;
		}
	>;
};

async function loadJson<T>(path: string): Promise<T> {
	const raw = await readFile(path, "utf8");
	return JSON.parse(raw) as T;
}

async function loadConfig(): Promise<Config> {
	return loadJson<Config>(CONFIG_PATH);
}

async function loadLock(): Promise<LockFile> {
	try {
		return await loadJson<LockFile>(LOCK_PATH);
	} catch {
		return { version: 1, sources: {} };
	}
}

async function saveLock(lock: LockFile): Promise<void> {
	await writeFile(LOCK_PATH, JSON.stringify(lock, null, "\t") + "\n", "utf8");
}

function githubHeaders(): Record<string, string> {
	const h: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	const t = process.env.GITHUB_TOKEN?.trim();
	if (t) h.Authorization = `Bearer ${t}`;
	return h;
}

async function fetchGithubTags(owner: string, repo: string): Promise<string[]> {
	const url = `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`;
	const res = await fetch(url, { headers: githubHeaders() });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`GitHub tags ${res.status}: ${text.slice(0, 200)}`);
	}
	const data = (await res.json()) as { name: string }[];
	return data.map((t) => t.name);
}

function pickLatestTag(tags: string[]): string | null {
	const vs = tags.filter((t) => /^v\d/i.test(t));
	if (vs.length === 0) return tags[0] ?? null;
	vs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }));
	return vs[0] ?? null;
}

function applyPathRewrites(relPath: string, rules: PathRewrite[]): string {
	let p = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
	for (const r of rules) {
		const re = new RegExp(r.match);
		if (re.test(p)) return p.replace(re, r.replace);
	}
	return p;
}

async function downloadFile(url: string, dest: string): Promise<void> {
	await mkdir(dirname(dest), { recursive: true });
	const res = await fetch(url, { headers: githubHeaders() });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Download ${res.status}: ${text.slice(0, 200)}`);
	}
	if (!res.body) throw new Error("No response body");
	const out = createWriteStream(dest);
	await pipeline(res.body as unknown as NodeJS.ReadableStream, out);
}

async function extractTarball(tarball: string, destDir: string): Promise<void> {
	await mkdir(destDir, { recursive: true });
	execFileSync("tar", ["-xzf", tarball, "-C", destDir], { stdio: "inherit" });
}

async function singleChildDir(parent: string): Promise<string> {
	const entries = await readdir(parent);
	if (entries.length !== 1) {
		throw new Error(`Expected one top-level folder in archive, got: ${entries.join(", ")}`);
	}
	return join(parent, entries[0]!);
}

async function syncGithubArchive(
	src: GithubArchiveSource,
	ref: string,
	dryRun: boolean,
): Promise<void> {
	const safeRef = ref.replace(/[/\\]/g, "-");
	const tarballUrl = `https://codeload.github.com/${src.owner}/${src.repo}/tar.gz/refs/tags/${ref}`;
	const altUrl = `https://github.com/${src.owner}/${src.repo}/archive/refs/tags/${ref}.tar.gz`;
	const staging = join(TMP_ROOT, src.id, safeRef);
	const tarball = join(staging, "upstream.tar.gz");
	const extractRoot = join(staging, "extract");

	console.log(`\n[${src.id}] ref=${ref}`);
	console.log(`  download: ${tarballUrl}`);

	if (dryRun) {
		for (const inc of src.includePaths) {
			const destRel = applyPathRewrites(inc, src.pathRewrites);
			const finalDest = join(REPO_ROOT, src.destRoot, safeRef, destRel);
			console.log(`  would copy: ${inc} -> ${finalDest}`);
		}
		return;
	}

	await rm(staging, { recursive: true, force: true });
	await mkdir(staging, { recursive: true });

	try {
		await downloadFile(tarballUrl, tarball);
	} catch {
		console.log(`  retry: ${altUrl}`);
		await downloadFile(altUrl, tarball);
	}

	await mkdir(extractRoot, { recursive: true });
	await extractTarball(tarball, extractRoot);
	const base = await singleChildDir(extractRoot);

	for (const inc of src.includePaths) {
		const srcPath = join(base, inc);
		try {
			await stat(srcPath);
		} catch {
			console.warn(`  skip (missing): ${inc}`);
			continue;
		}
		const destRel = applyPathRewrites(inc, src.pathRewrites);
		const finalDest = join(REPO_ROOT, src.destRoot, safeRef, destRel);
		await mkdir(dirname(finalDest), { recursive: true });
		await rm(finalDest, { recursive: true, force: true }).catch(() => {});
		await cp(srcPath, finalDest, { recursive: true });
		console.log(`  copied: ${inc} -> ${finalDest}`);
	}

	const lock = await loadLock();
	lock.sources[src.id] = {
		...lock.sources[src.id],
		pinnedRef: ref,
		lastSyncedAt: new Date().toISOString(),
	};
	await saveLock(lock);
	console.log(`  lock updated: ${LOCK_PATH}`);

	await rm(staging, { recursive: true, force: true }).catch(() => {});
}

async function npmLatestVersion(pkg: string): Promise<string> {
	const enc = encodeURIComponent(pkg);
	const res = await fetch(`https://registry.npmjs.org/${enc}/latest`);
	if (!res.ok) throw new Error(`npm registry ${res.status}`);
	const j = (await res.json()) as { version: string };
	return j.version;
}

async function cmdCheck(): Promise<void> {
	const cfg = await loadConfig();
	const lock = await loadLock();
	console.log("Way of Pi — upstream check (Pi original GitHub / npm)\n");
	console.log("Run sync only when you want to apply: bun scripts/wop-pi-upstream.ts sync --source <id> --ref <tag> --apply\n");

	for (const s of cfg.sources) {
		if (s.type === "github-archive") {
			const tags = await fetchGithubTags(s.owner, s.repo);
			const latest = pickLatestTag(tags) ?? tags[0] ?? "?";
			const pinned = lock.sources[s.id]?.pinnedRef;
			let status: string;
			if (!pinned) {
				status = `no local mirror pinned — latest tag is ${latest} (run sync --apply when you want)`;
			} else if (pinned !== latest) {
				status = `UPDATE AVAILABLE: pinned ${pinned} → latest ${latest}`;
			} else {
				status = `pinned tag matches latest (${latest})`;
			}
			console.log(`● ${s.id} (${s.owner}/${s.repo})`);
			console.log(`  type:     github-archive`);
			if (s.description) console.log(`  note:     ${s.description}`);
			console.log(`  latest:   ${latest}`);
			console.log(`  pinned:   ${pinned ?? "(none — never synced)"}`);
			console.log(`  status:   ${status}`);
			lock.sources[s.id] = {
				...lock.sources[s.id],
				lastCheckedRemoteRef: latest,
			};
		} else if (s.type === "npm-registry") {
			const latest = await npmLatestVersion(s.package);
			const prev = lock.sources[s.id]?.npmLatest;
			console.log(`● ${s.id}`);
			console.log(`  type:     npm-registry`);
			console.log(`  package:  ${s.package}`);
			if (s.description) console.log(`  note:     ${s.description}`);
			console.log(`  latest:   ${latest}`);
			console.log(`  previous: ${prev ?? "(first check)"}`);
			console.log(
				`  status:   ${
					prev === undefined
						? "recorded latest for next check"
						: prev !== latest
							? "NEW VERSION on npm — run `pi update` (or reinstall) when you want"
							: "no change vs last check"
				}`,
			);
			lock.sources[s.id] = {
				...lock.sources[s.id],
				npmLatest: latest,
				lastCheckedRemoteRef: latest,
			};
		}
	}

	await saveLock(lock);
	console.log(`\nLock saved: ${LOCK_PATH}`);
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
	const out: Record<string, string | boolean> = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]!;
		if (a === "--dry-run") out.dryRun = true;
		else if (a === "--apply") out.apply = true;
		else if (a === "--source" && argv[i + 1]) {
			out.source = argv[++i]!;
		} else if (a === "--ref" && argv[i + 1]) {
			out.ref = argv[++i]!;
		}
	}
	return out;
}

async function cmdSync(): Promise<void> {
	const args = parseArgs(process.argv.slice(3));
	const cfg = await loadConfig();
	const id = args.source as string | undefined;
	if (!id) {
		console.error("Usage: sync --source <id> [--ref <tag>] --dry-run | --apply");
		process.exit(1);
	}
	const dryRun = args.dryRun === true;
	const apply = args.apply === true;
	if (!dryRun && !apply) {
		console.error("Specify --dry-run (preview) or --apply (write vendor/ + lock).");
		process.exit(1);
	}

	const src = cfg.sources.find((s) => s.id === id);
	if (!src) {
		console.error(`Unknown source id: ${id}`);
		process.exit(1);
	}

	if (src.type !== "github-archive") {
		console.error(`Sync is only implemented for github-archive sources (not ${src.type}).`);
		console.error(`For npm packages, update your Pi install when ready (e.g. pi update).`);
		process.exit(1);
	}

	let ref = args.ref as string | undefined;
	if (!ref) {
		const tags = await fetchGithubTags(src.owner, src.repo);
		ref = pickLatestTag(tags) ?? tags[0] ?? null;
		if (!ref) throw new Error("No tags found");
		console.log(`Using latest tag: ${ref}`);
	}

	await syncGithubArchive(src, ref, dryRun);
}

async function main(): Promise<void> {
	const cmd = process.argv[2];
	if (cmd === "check") await cmdCheck();
	else if (cmd === "sync") await cmdSync();
	else {
		console.log(`Usage:
  bun scripts/wop-pi-upstream.ts check
  bun scripts/wop-pi-upstream.ts sync --source pi-mono [--ref <tag>] --dry-run
  bun scripts/wop-pi-upstream.ts sync --source pi-mono [--ref <tag>] --apply`);
		process.exit(cmd ? 1 : 0);
	}
}

main().catch((e) => {
	console.error(e instanceof Error ? e.message : e);
	process.exit(1);
});
