#!/usr/bin/env bun
/**
 * Emit a comma-separated list for `pi --models ...` so the /model picker (scoped)
 * shows entries in priority order: local Ollama → OpenRouter :free → other OpenRouter → native OpenAI (only if present in pi.config.json).
 *
 * Pi sorts the scoped list by provider (stable), so all `ollama/*` stay before `openrouter/*`.
 * Use this when other providers (anthropic, google, …) would otherwise appear before Ollama in "all" mode.
 *
 * Reads: <repo>/agent/models.json + <repo>/pi.config.json (run from playground root).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const agentPath = join(root, "agent", "models.json");
const piConfigPath = join(root, "pi.config.json");

function isOrFree(id: string): boolean {
	return id.endsWith(":free") || id.includes(":free");
}

const out: string[] = [];
const seen = new Set<string>();

function push(token: string) {
	if (seen.has(token)) return;
	seen.add(token);
	out.push(token);
}

if (!existsSync(agentPath)) {
	console.error(`pi-models-scoped-priority: missing ${agentPath}`);
	process.exit(1);
}

const agentJson = JSON.parse(readFileSync(agentPath, "utf-8")) as {
	providers?: { ollama?: { models?: Array<{ id: string }> } };
};
for (const m of agentJson.providers?.ollama?.models ?? []) {
	if (m?.id) push(`ollama/${m.id}`);
}

if (existsSync(piConfigPath)) {
	const pi = JSON.parse(readFileSync(piConfigPath, "utf-8")) as {
		models?: Array<{ provider?: string; id?: string }>;
	};
	const flat = pi.models ?? [];
	const orFree = flat.filter((m) => m.provider === "openrouter" && m.id && isOrFree(m.id));
	const orRest = flat.filter((m) => m.provider === "openrouter" && m.id && !isOrFree(m.id));
	const openai = flat.filter((m) => m.provider === "openai" && m.id);
	for (const m of orFree) push(`openrouter/${m.id}`);
	for (const m of orRest) push(`openrouter/${m.id}`);
	for (const m of openai) push(`openai/${m.id}`);
}

console.log(out.join(","));
