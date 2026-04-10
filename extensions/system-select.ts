/**
 * System Select — Switch the system prompt via /system or /agent
 *
 * Scans .pi/agents/, .claude/agents/, .gemini/agents/, .codex/agents/
 * (project-local and global) recursively for agent definition .md files.
 *
 * /system — flat list of all agents (+ reset).
 * /agent — pick a **domain-specialists/** category (01–10 folders), then pick
 * an agent in that domain; or core agents, or full flat list.
 *
 * The selected agent's body is prepended to Pi's default instructions so tool usage
 * still works. Tools are restricted to the agent's declared tool set
 * if specified.
 *
 * Usage: pi -e extensions/system-select.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { homedir } from "node:os";
import { applyExtensionDefaults } from "./themeMap.ts";
import { collectAgentMarkdownFiles } from "./agent-dir-scan.ts";

interface AgentDef {
	name: string;
	description: string;
	tools: string[];
	body: string;
	source: string;
	/** Folder under `domain-specialists/` (e.g. `03-infrastructure`), else `null`. */
	domainCategory: string | null;
}

function parseFrontmatter(raw: string): { fields: Record<string, string>; body: string } {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	if (!match) return { fields: {}, body: raw };
	const fields: Record<string, string> = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx > 0) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
	}
	return { fields, body: match[2] };
}

function domainCategoryFromPath(agentsRoot: string, fullPath: string): string | null {
	const rel = relative(agentsRoot, fullPath).replace(/\\/g, "/");
	const m = rel.match(/^domain-specialists\/([^/]+)\//);
	return m ? m[1] : null;
}

function scanAgents(dir: string, source: string): AgentDef[] {
	if (!existsSync(dir)) return [];
	const agents: AgentDef[] = [];
	try {
		for (const fullPath of collectAgentMarkdownFiles(dir)) {
			const raw = readFileSync(fullPath, "utf-8");
			const { fields, body } = parseFrontmatter(raw);
			agents.push({
				name: fields.name || basename(fullPath, ".md"),
				description: fields.description || "",
				tools: fields.tools ? fields.tools.split(",").map((t) => t.trim()) : [],
				body: body.trim(),
				source,
				domainCategory: domainCategoryFromPath(dir, fullPath),
			});
		}
	} catch {}
	return agents;
}

function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function sortDomainCategories(a: string, b: string): number {
	return a.localeCompare(b, undefined, { numeric: true });
}

export default function (pi: ExtensionAPI) {
	let activeAgent: AgentDef | null = null;
	let allAgents: AgentDef[] = [];
	let defaultTools: string[] = [];

	function activateAgent(ctx: ExtensionContext, agent: AgentDef | null): void {
		if (!agent) {
			activeAgent = null;
			pi.setActiveTools(defaultTools);
			ctx.ui.setStatus("system-prompt", "System Prompt: Default");
			ctx.ui.notify("System Prompt reset to Default", "success");
			return;
		}
		activeAgent = agent;
		if (agent.tools.length > 0) {
			pi.setActiveTools(agent.tools);
		} else {
			pi.setActiveTools(defaultTools);
		}
		ctx.ui.setStatus("system-prompt", `System Prompt: ${displayName(agent.name)}`);
		ctx.ui.notify(`Active agent: ${displayName(agent.name)} (${agent.name})`, "success");
	}

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		activeAgent = null;
		allAgents = [];

		const home = homedir();
		const cwd = ctx.cwd;

		const dirs: [string, string][] = [
			[join(cwd, ".pi", "agents"), ".pi"],
			[join(cwd, ".claude", "agents"), ".claude"],
			[join(cwd, ".gemini", "agents"), ".gemini"],
			[join(cwd, ".codex", "agents"), ".codex"],
			[join(home, ".pi", "agent", "agents"), "~/.pi"],
			[join(home, ".claude", "agents"), "~/.claude"],
			[join(home, ".gemini", "agents"), "~/.gemini"],
			[join(home, ".codex", "agents"), "~/.codex"],
		];

		const seen = new Set<string>();
		const sourceCounts: Record<string, number> = {};

		for (const [dir, source] of dirs) {
			const agents = scanAgents(dir, source);
			for (const agent of agents) {
				const key = agent.name.toLowerCase();
				if (seen.has(key)) continue;
				seen.add(key);
				allAgents.push(agent);
				sourceCounts[source] = (sourceCounts[source] || 0) + 1;
			}
		}

		defaultTools = pi.getActiveTools();
		ctx.ui.setStatus("system-prompt", "System Prompt: Default");

		const defaultPrompt = ctx.getSystemPrompt();
		const lines = defaultPrompt.split("\n").length;
		const chars = defaultPrompt.length;
		
		const loadedSources = Object.entries(sourceCounts)
			.map(([src, count]) => `${count} from ${src}`)
			.join(", ");
		
		const notifyLines: string[] = [];
		if (allAgents.length > 0) {
			notifyLines.push(`Loaded ${allAgents.length} agents (${loadedSources})`);
		}
		notifyLines.push(`System Prompt: Default (${lines} lines, ${chars} chars)`);
		
		ctx.ui.notify(notifyLines.join("\n"), "info");
	});

	pi.registerCommand("system", {
		description: "Select a system prompt from all discovered agents (flat list)",
		handler: async (_args, ctx) => {
			if (allAgents.length === 0) {
				ctx.ui.notify("No agents found in .*/agents/*.md", "warning");
				return;
			}

			const options = [
				"Reset to Default",
				...allAgents.map((a) => `${a.name} — ${a.description} [${a.source}]`),
			];

			const choice = await ctx.ui.select("Select System Prompt", options);
			if (choice === undefined) return;

			if (choice === options[0]) {
				activateAgent(ctx, null);
				return;
			}

			const idx = options.indexOf(choice) - 1;
			const agent = allAgents[idx];
			activateAgent(ctx, agent);
		},
	});

	pi.registerCommand("agent", {
		description:
			"Pick domain category (domain-specialists/*) then specialist, or core agents — same as /system but grouped",
		handler: async (_args, ctx) => {
			if (allAgents.length === 0) {
				ctx.ui.notify("No agents found in .*/agents/*.md", "warning");
				return;
			}

			const byDomain = new Map<string, AgentDef[]>();
			const core: AgentDef[] = [];
			for (const a of allAgents) {
				if (a.domainCategory) {
					if (!byDomain.has(a.domainCategory)) byDomain.set(a.domainCategory, []);
					byDomain.get(a.domainCategory)!.push(a);
				} else {
					core.push(a);
				}
			}

			const domainKeys = [...byDomain.keys()].sort(sortDomainCategories);

			const scopeOptions: string[] = [
				"Reset to Default",
				`Core & other (not under domain-specialists/) — ${core.length} agent(s)`,
				`All agents — flat list (${allAgents.length}, same as /system)`,
			];
			for (const k of domainKeys) {
				const list = byDomain.get(k)!;
				scopeOptions.push(`Domain: ${k} — ${list.length} specialist(s)`);
			}

			const scope = await ctx.ui.select("Agent scope — /agent", scopeOptions);
			if (scope === undefined) return;

			if (scope === scopeOptions[0]) {
				activateAgent(ctx, null);
				return;
			}

			if (scope === scopeOptions[2]) {
				const flat = [
					"Reset to Default",
					...allAgents.map((a) => `${a.name} — ${a.description} [${a.source}]`),
				];
				const pick = await ctx.ui.select("All agents", flat);
				if (pick === undefined) return;
				if (pick === flat[0]) {
					activateAgent(ctx, null);
					return;
				}
				const i = flat.indexOf(pick) - 1;
				activateAgent(ctx, allAgents[i]);
				return;
			}

			let pool: AgentDef[];
			if (scope === scopeOptions[1]) {
				pool = core;
			} else {
				const m = scope.match(/^Domain:\s+(\S+)\s+—/);
				const key = m?.[1] ?? "";
				pool = byDomain.get(key) ?? [];
			}

			if (pool.length === 0) {
				ctx.ui.notify("No agents in that scope.", "warning");
				return;
			}

			const agentOptions = pool.map(
				(a) => `${a.name} — ${a.description || "(no description)"} [${a.source}]`,
			);
			const domainTitle = scope.match(/^Domain:\s+(\S+)\s+—/)?.[1];
			const pick2 = await ctx.ui.select(
				domainTitle ? `Specialists — ${domainTitle}` : "Core & other agents",
				agentOptions,
			);
			if (pick2 === undefined) return;

			const j = agentOptions.indexOf(pick2);
			activateAgent(ctx, pool[j]);
		},
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		if (!activeAgent) return;
		return {
			systemPrompt: activeAgent.body + "\n\n" + event.systemPrompt,
		};
	});
}
