import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchOllamaTags } from "./llm-models";
import { getPlaygroundRepoRoot, resolveOllamaHost, resolveOllamaModelDefault } from "./pi-ollama-env";
import { collectStaticWebManifest } from "./web-manifest";
import {
	getFrozenInitialWorkspacePath,
	getPrimaryWorkspacePath,
	listWorkspaceFolders,
} from "./workspace-state";
import { terminalAllowed } from "./terminal-ws";

/** @deprecated use {@link getPlaygroundRepoRoot} from pi-ollama-env */
export function getWayOfPiPlaygroundRoot(): string {
	return getPlaygroundRepoRoot();
}

async function readTextIfExists(abs: string): Promise<string | null> {
	try {
		return await readFile(abs, "utf8");
	} catch {
		return null;
	}
}

async function probePiVersion(bin: string, ms: number): Promise<{ version: string | null; error: string | null }> {
	const proc = Bun.spawn([bin, "--version"], { stdout: "pipe", stderr: "pipe" });
	let tid: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<{ version: null; error: string }>((resolve) => {
		tid = setTimeout(() => {
			try {
				proc.kill();
			} catch {
				/* ignore */
			}
			resolve({ version: null, error: `timeout after ${ms}ms` });
		}, ms);
	});
	const run = (async () => {
		try {
			const out = await new Response(proc.stdout).text();
			const err = await new Response(proc.stderr).text();
			const code = await proc.exited;
			if (tid !== undefined) clearTimeout(tid);
			const text = (out || err).trim().split("\n")[0] ?? "";
			if (code !== 0 && !text) {
				return { version: null, error: `exit ${code}` } as const;
			}
			return { version: text || null, error: code !== 0 ? `exit ${code}` : null } as const;
		} catch (e) {
			if (tid !== undefined) clearTimeout(tid);
			const message = e instanceof Error ? e.message : String(e);
			return { version: null, error: message } as const;
		}
	})();
	return Promise.race([run, timeout]);
}

export async function probePiBinary(): Promise<{
	resolvedPath: string | null;
	source: "WOP_PI_BINARY" | "PATH" | null;
	exists: boolean;
	version: string | null;
	versionError: string | null;
}> {
	const configured = process.env.WOP_PI_BINARY?.trim();
	if (configured) {
		const exists = existsSync(configured);
		if (!exists) {
			return {
				resolvedPath: configured,
				source: "WOP_PI_BINARY",
				exists: false,
				version: null,
				versionError: "file missing",
			};
		}
		const v = await probePiVersion(configured, 4000);
		return {
			resolvedPath: configured,
			source: "WOP_PI_BINARY",
			exists: true,
			version: v.version,
			versionError: v.error,
		};
	}
	const which = Bun.which("pi");
	if (!which) {
		return { resolvedPath: null, source: null, exists: false, version: null, versionError: null };
	}
	const v = await probePiVersion(which, 4000);
	return {
		resolvedPath: which,
		source: "PATH",
		exists: true,
		version: v.version,
		versionError: v.error,
	};
}

export async function collectDiagnostics(): Promise<Record<string, unknown>> {
	const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
	const ollamaHost = resolveOllamaHost();
	let ollamaSummary: Record<string, unknown>;
	if (provider !== "ollama") {
		ollamaSummary = { skipped: true, reason: `WOP_LLM_PROVIDER=${provider}` };
	} else {
		const tags = await fetchOllamaTags(ollamaHost, { signal: AbortSignal.timeout(2500) });
		ollamaSummary = tags.ok
			? { ok: true, modelCount: tags.models.length }
			: { ok: false, error: tags.error };
	}

	const pi = await probePiBinary();
	const man = collectStaticWebManifest();
	const extensionShimCount = man.shimFiles.reduce((n, s) => n + s.files.length, 0);
	const settingsExtensionEntriesTotal = man.settingsExtensions.reduce((n, s) => n + s.entries.length, 0);

	return {
		ok: true,
		service: "wayofpi-ui-server",
		time: new Date().toISOString(),
		playgroundRoot: getPlaygroundRepoRoot(),
		workspace: {
			primary: getPrimaryWorkspacePath(),
			folders: listWorkspaceFolders(),
			initialRoot: getFrozenInitialWorkspacePath(),
		},
		env: {
			WOP_HOME: process.env.WOP_HOME?.trim() || null,
			WOP_PI_BINARY: process.env.WOP_PI_BINARY?.trim() || null,
			WOP_WORKSPACE: process.env.WOP_WORKSPACE?.trim() || null,
			WOP_LLM_PROVIDER: provider,
			WOP_CHAT_ENGINE: process.env.WOP_CHAT_ENGINE?.trim() || null,
			WOP_SERVER_PORT: process.env.WOP_SERVER_PORT?.trim() || null,
			OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL?.trim() || null,
			resolvedOllamaHost: ollamaHost,
			resolvedOllamaModelDefault: resolveOllamaModelDefault(),
			terminalEnabled: terminalAllowed(),
		},
		llm: {
			provider,
			ollamaHost,
			ollama: ollamaSummary,
		},
		piBinary: pi,
		manifestStatic: {
			source: man.source,
			piDrivesRuntime: man.piDrivesRuntime,
			extensionShimCount,
			settingsJsonCount: man.settingsExtensions.length,
			settingsExtensionEntriesTotal,
		},
		note: "Web chat uses Ollama/OpenRouter in this server; headless Pi subprocess is not wired yet. piBinary is a host probe for future integration. GET /api/manifest is filesystem-only.",
	};
}

/** Read-only snapshot of upstream mirror config + lock (no GitHub/npm refresh). */
export async function collectUpstreamSnapshot(): Promise<Record<string, unknown>> {
	const root = getPlaygroundRepoRoot();
	const lockPath = join(root, "wop.upstream.lock.json");
	const configPath = join(root, "scripts", "wop-upstream", "config.json");
	const lockRaw = await readTextIfExists(lockPath);
	const configRaw = await readTextIfExists(configPath);
	let lock: unknown = null;
	let config: unknown = null;
	if (lockRaw) {
		try {
			lock = JSON.parse(lockRaw) as unknown;
		} catch {
			lock = { parseError: true };
		}
	}
	if (configRaw) {
		try {
			config = JSON.parse(configRaw) as unknown;
		} catch {
			config = { parseError: true };
		}
	}
	return {
		ok: true,
		playgroundRoot: root,
		lockPath,
		configPath,
		lockPresent: lockRaw != null,
		configPresent: configRaw != null,
		lock,
		config,
		note: "Read-only. Remote check + lock updates: `bun scripts/wop-pi-upstream.ts check` from the playground repo.",
	};
}
