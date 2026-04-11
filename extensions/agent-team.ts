/**
 * Agent Team — Dispatcher-only orchestrator with grid dashboard
 *
 * The primary Pi agent delegates implementation via `dispatch_agent` and has
 * read-only repo tools (`read`, `ls`, `grep`) to verify specialists' outputs.
 * Grid cards show per-specialist context % and last-run token totals (prompt / completion)
 * from the JSON subprocess stream. Each specialist maintains its own Pi session.
 *
 * Loads agent definitions from agents/, .claude/agents/, .pi/agents/ recursively (all nested `*.md` files).
 * Teams are defined in .pi/agents/teams.yaml — on boot a select dialog lets
 * you pick which team to work with. Only team members are available for dispatch.
 *
 * **Default team:** first key in merged teams, unless **`PI_AGENT_TEAM_DEFAULT`** is set to a valid team
 * name (e.g. `build-orchestra`). **`just ext-builder-team`** exports that for the builder-orchestrator roster.
 *
 * Commands:
 *   /agents-team          — switch active team
 *   /agents-list          — list loaded agents
 *   /agents-grid N        — set column count (default 2)
 *   /agents-stream [on|off|toggle] — grid stream detail ON by default; turn off to hide (also ctrl+shift+v)
 *   /agents-team-add A    — add agent A to active team (in-memory)
 *   /agents-team-remove A — remove agent A from active team (in-memory)
 *   /agents-team-replace FROM TO — swap one roster slot for another agent
 *   /agents-reload        — rescan agent *.md from disk (after editing personas)
 *   /agents-preset-save K — save current roster as preset K (JSON + reload merge)
 *   /agents-preset-load K — activate team/preset K
 *   /agents-preset-list   — list built-in + saved presets
 *   /agents-preset-delete K — delete saved preset K (not YAML teams)
 *   /agents-models — show resolved Pi --model string per roster agent (overrides + frontmatter)
 *
 * Per-subagent models: optional **model** in agent .md frontmatter; optional **.pi/agents/agent-models.json**
 * (agent name → model id, plus **default** for fallbacks). **dispatch_agent** accepts optional **model** for a one-shot override.
 *
 * LLM tools (dispatcher): team_list, team_member_add, team_member_remove,
 *   team_member_replace, team_reload_agents, team_activate, team_save_preset,
 *   team_load_preset, team_delete_preset
 *
 * Usage: `pi -e extensions/agent-team.ts` (default team = first key in **`teams.yaml`**).
 * For **build-orchestra** only, use **`extensions/agent-team-build-orchestra.ts`** or **`just ext-builder-team`**.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, type AutocompleteItem, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import { footerContextStats } from "./footer-context-stats.ts";
import { applyExtensionDefaults } from "./themeMap.ts";
import { collectAgentMarkdownFiles } from "./agent-dir-scan.ts";

// ── Types ────────────────────────────────────────

interface AgentDef {
	name: string;
	description: string;
	tools: string;
	/** Optional Pi `--model` value (`provider/id`). Overrides session default when set. */
	model?: string;
	systemPrompt: string;
	file: string;
}

/** Normalize provider usage objects from JSON stream (`message_end` / `agent_end`). */
/** Extract streamed tool stdout from tool_execution_update JSON. */
function partialToolOutput(ev: Record<string, unknown>): string {
	const pr = ev.partialResult as { content?: Array<{ type?: string; text?: string }> } | undefined;
	if (!pr?.content || !Array.isArray(pr.content)) return "";
	return pr.content
		.map((b) => (b?.type === "text" && typeof b.text === "string" ? b.text : ""))
		.join("");
}

function usageInOut(u: unknown): { input: number; output: number } | null {
	if (!u || typeof u !== "object") return null;
	const o = u as Record<string, unknown>;
	const input =
		typeof o.input === "number"
			? o.input
			: typeof o.prompt_tokens === "number"
				? o.prompt_tokens
				: null;
	const output =
		typeof o.output === "number"
			? o.output
			: typeof o.completion_tokens === "number"
				? o.completion_tokens
				: null;
	if (input == null && output == null) return null;
	return { input: input ?? 0, output: output ?? 0 };
}

interface AgentState {
	def: AgentDef;
	status: "idle" | "running" | "done" | "error";
	task: string;
	toolCount: number;
	elapsed: number;
	lastWork: string;
	/** Latest model thinking preview (stream detail mode + --thinking minimal on sub-pi). */
	lastThinking: string;
	/** Current or last tool name from JSON stream (e.g. bash, read). */
	lastTool: string;
	contextPct: number;
	/** Sum of token usage events for the last completed subprocess dispatch (in/out). */
	lastRunTokensIn: number;
	lastRunTokensOut: number;
	/** Last Pi `--model` passed to this specialist (for grid). */
	resolvedModel: string;
	sessionFile: string | null;
	runCount: number;
	timer?: ReturnType<typeof setInterval>;
}

// ── Display Name Helper ──────────────────────────

function displayName(name: string): string {
	const k = name.trim().toLowerCase();
	if (k === "ralph") return "Ralph Wiggum";
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fmtTok(n: number): string {
	if (n < 1000) return `${n}`;
	return `${(n / 1000).toFixed(1)}k`;
}

/** Built-in team with builder-orchestrator dispatcher prompt (`teams.yaml`). */
const BUILD_ORCHESTRA_TEAM = "build-orchestra";

// ── Teams YAML Parser ────────────────────────────

function parseTeamsYaml(raw: string): Record<string, string[]> {
	const teams: Record<string, string[]> = {};
	let current: string | null = null;
	for (const line of raw.split("\n")) {
		const teamMatch = line.match(/^(\S[^:]*):$/);
		if (teamMatch) {
			current = teamMatch[1].trim();
			teams[current] = [];
			continue;
		}
		const itemMatch = line.match(/^\s+-\s+(.+)$/);
		if (itemMatch && current) {
			teams[current].push(itemMatch[1].trim());
		}
	}
	return teams;
}

const TEAM_PRESETS_FILE = "teams-presets.json";
const AGENT_MODELS_FILE = "agent-models.json";

interface TeamsPresetsFile {
	version: 1;
	presets: Record<string, string[]>;
}

function loadTeamPresets(presetPath: string): Record<string, string[]> {
	if (!existsSync(presetPath)) return {};
	try {
		const data = JSON.parse(readFileSync(presetPath, "utf-8")) as TeamsPresetsFile;
		if (data && typeof data.presets === "object" && data.presets) return data.presets;
	} catch {}
	return {};
}

function saveTeamPresets(presetPath: string, presets: Record<string, string[]>) {
	const dir = join(presetPath, "..");
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	const body: TeamsPresetsFile = { version: 1, presets };
	writeFileSync(presetPath, JSON.stringify(body, null, 2), "utf-8");
}

function mergeTeamMaps(
	yamlTeams: Record<string, string[]>,
	userPresets: Record<string, string[]>,
): Record<string, string[]> {
	return { ...yamlTeams, ...userPresets };
}

interface AgentModelsFile {
	version: 1;
	/** Agent name (lowercase ok) → full Pi model string e.g. openrouter/anthropic/claude-sonnet-4. Key `default` = fallback when no per-agent rule. */
	models: Record<string, string>;
}

function loadAgentModelsFile(presetPath: string): Record<string, string> {
	if (!existsSync(presetPath)) return {};
	try {
		const data = JSON.parse(readFileSync(presetPath, "utf-8")) as AgentModelsFile;
		if (data && typeof data.models === "object" && data.models) {
			const out: Record<string, string> = {};
			for (const [k, v] of Object.entries(data.models)) {
				if (typeof v === "string" && v.trim()) out[k.trim().toLowerCase()] = v.trim();
			}
			return out;
		}
	} catch {}
	return {};
}

function unquoteFrontmatterField(raw: string): string {
	let s = raw.trim();
	if (
		(s.startsWith('"') && s.endsWith('"')) ||
		(s.startsWith("'") && s.endsWith("'"))
	) {
		s = s.slice(1, -1);
	}
	return s.trim();
}

// ── Frontmatter Parser ───────────────────────────

function parseAgentFile(filePath: string): AgentDef | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) return null;

		const frontmatter: Record<string, string> = {};
		for (const line of match[1].split("\n")) {
			const idx = line.indexOf(":");
			if (idx > 0) {
				frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
			}
		}

		if (!frontmatter.name) return null;

		const modelRaw = frontmatter.model ? unquoteFrontmatterField(frontmatter.model) : "";

		return {
			name: unquoteFrontmatterField(frontmatter.name),
			description: unquoteFrontmatterField(frontmatter.description || ""),
			tools: unquoteFrontmatterField(frontmatter.tools || "read,grep,find,ls"),
			...(modelRaw ? { model: modelRaw } : {}),
			systemPrompt: match[2].trim(),
			file: filePath,
		};
	} catch {
		return null;
	}
}

function scanAgentDirs(cwd: string): AgentDef[] {
	const dirs = [
		join(cwd, "agents"),
		join(cwd, ".claude", "agents"),
		join(cwd, ".pi", "agents"),
	];

	const agents: AgentDef[] = [];
	const seen = new Set<string>();

	for (const dir of dirs) {
		for (const fullPath of collectAgentMarkdownFiles(dir)) {
			const def = parseAgentFile(fullPath);
			if (def && !seen.has(def.name.toLowerCase())) {
				seen.add(def.name.toLowerCase());
				agents.push(def);
			}
		}
	}

	return agents;
}

// ── Extension ────────────────────────────────────

export default function (pi: ExtensionAPI) {
	const agentStates: Map<string, AgentState> = new Map();
	let allAgentDefs: AgentDef[] = [];
	let teams: Record<string, string[]> = {};
	/** Keys that originate from `.pi/agents/teams.yaml` (cannot delete via preset-delete). */
	let yamlTeamKeys = new Set<string>();
	/** Saved presets from `.pi/agents/teams-presets.json` (merged over YAML). */
	let userTeamPresets: Record<string, string[]> = {};
	let activeTeamName = "";
	let gridCols = 2;
	/** Default ON: taller cards, subagent `--thinking minimal`, stream thinking/tool into grid. `/agents-stream off` or ctrl+shift+v to hide. */
	let gridStreamDetail = true;
	let widgetCtx: any;
	let sessionDir = "";
	let extensionCwd = "";
	let contextWindow = 0;
	/** Per-agent + `default` overrides from `.pi/agents/agent-models.json`. */
	let agentModelOverrides: Record<string, string> = {};
	/** Primary session Pi model (`provider/id`); subagents fall back here if no override. */
	let dispatcherSessionModel = "openrouter/google/gemini-3-flash-preview";

	function agentModelsPathFor(cwd: string) {
		return join(cwd, ".pi", "agents", AGENT_MODELS_FILE);
	}

	function reloadAgentModelOverrides(cwd: string) {
		agentModelOverrides = loadAgentModelsFile(agentModelsPathFor(cwd));
	}

	function resolveSubagentModel(def: AgentDef, oneOff?: string | null): string {
		const o = oneOff?.trim();
		if (o) return o;
		const key = def.name.toLowerCase();
		const fromFile = agentModelOverrides[key];
		if (fromFile) return fromFile;
		if (def.model?.trim()) return def.model.trim();
		const fallback = agentModelOverrides["default"];
		if (fallback) return fallback;
		return dispatcherSessionModel;
	}

	function formatSubagentModelsSection(): string {
		if (agentStates.size === 0) return "";
		const lines: string[] = [
			"",
			"**Subagent Pi models** (`pi --model`; priority: `dispatch_agent.model` → `.pi/agents/agent-models.json` → agent `model:` frontmatter → `default` in JSON → your session model):",
		];
		for (const s of agentStates.values()) {
			lines.push(`- \`${s.def.name}\`: ${s.resolvedModel}`);
		}
		lines.push(`- *(dispatcher session)*: ${dispatcherSessionModel}`);
		return lines.join("\n");
	}

	function reloadTeamsFromFiles(cwd: string) {
		const teamsPath = join(cwd, ".pi", "agents", "teams.yaml");
		let yamlTeams: Record<string, string[]> = {};
		if (existsSync(teamsPath)) {
			try {
				yamlTeams = parseTeamsYaml(readFileSync(teamsPath, "utf-8"));
			} catch {
				yamlTeams = {};
			}
		}
		if (Object.keys(yamlTeams).length === 0) {
			yamlTeams = { all: allAgentDefs.map((d) => d.name) };
		}
		yamlTeamKeys = new Set(Object.keys(yamlTeams));

		const presetPath = join(cwd, ".pi", "agents", TEAM_PRESETS_FILE);
		userTeamPresets = loadTeamPresets(presetPath);
		teams = mergeTeamMaps(yamlTeams, userTeamPresets);
	}

	function loadAgents(cwd: string) {
		extensionCwd = cwd;
		// Create session storage dir
		sessionDir = join(cwd, ".pi", "agent-sessions");
		if (!existsSync(sessionDir)) {
			mkdirSync(sessionDir, { recursive: true });
		}

		// Load all agent definitions
		allAgentDefs = scanAgentDirs(cwd);
		reloadAgentModelOverrides(cwd);
		reloadTeamsFromFiles(cwd);
	}

	function presetPathFor(cwd: string) {
		return join(cwd, ".pi", "agents", TEAM_PRESETS_FILE);
	}

	function persistUserPresets(cwd: string) {
		saveTeamPresets(presetPathFor(cwd), userTeamPresets);
	}

	function findAgentDefByName(name: string): AgentDef | undefined {
		const key = name.trim().toLowerCase();
		return allAgentDefs.find((d) => d.name.toLowerCase() === key);
	}

	function addMemberToActiveTeam(agentName: string): { ok: boolean; message: string } {
		if (!activeTeamName) return { ok: false, message: "No active team." };
		const def = findAgentDefByName(agentName);
		if (!def) {
			return {
				ok: false,
				message: `Unknown agent "${agentName}". Known: ${allAgentDefs.map((d) => d.name).join(", ") || "(none)"}`,
			};
		}
		const roster = teams[activeTeamName] ? [...teams[activeTeamName]] : [];
		if (roster.some((m) => m.toLowerCase() === def.name.toLowerCase())) {
			return { ok: true, message: `${def.name} already on team ${activeTeamName}.` };
		}
		roster.push(def.name);
		teams[activeTeamName] = roster;
		activateTeam(activeTeamName);
		updateWidget();
		return { ok: true, message: `Added ${def.name} to ${activeTeamName}. Members: ${roster.join(", ")}` };
	}

	function removeMemberFromActiveTeam(agentName: string): { ok: boolean; message: string } {
		if (!activeTeamName) return { ok: false, message: "No active team." };
		const key = agentName.trim().toLowerCase();
		const roster = teams[activeTeamName] ? [...teams[activeTeamName]] : [];
		const next = roster.filter((m) => m.toLowerCase() !== key);
		if (next.length === roster.length) {
			return { ok: false, message: `Agent "${agentName}" not on team ${activeTeamName}.` };
		}
		if (next.length === 0) {
			return { ok: false, message: "Cannot remove last member from team." };
		}
		teams[activeTeamName] = next;
		activateTeam(activeTeamName);
		updateWidget();
		return { ok: true, message: `Removed from ${activeTeamName}. Members: ${next.join(", ")}` };
	}

	function replaceMemberOnActiveTeam(
		fromName: string,
		toName: string,
	): { ok: boolean; message: string } {
		if (!activeTeamName) return { ok: false, message: "No active team." };
		const toDef = findAgentDefByName(toName);
		if (!toDef) {
			return {
				ok: false,
				message: `Unknown agent "${toName}". Known: ${allAgentDefs.map((d) => d.name).join(", ") || "(none)"}`,
			};
		}
		const fromKey = fromName.trim().toLowerCase();
		const roster = teams[activeTeamName] ? [...teams[activeTeamName]] : [];
		const idx = roster.findIndex((m) => m.toLowerCase() === fromKey);
		if (idx < 0) {
			return { ok: false, message: `Agent "${fromName}" not on team ${activeTeamName}.` };
		}
		roster[idx] = toDef.name;
		teams[activeTeamName] = roster;
		activateTeam(activeTeamName);
		updateWidget();
		return {
			ok: true,
			message: `Changed agent on roster: ${fromName} → ${toDef.name}. Members: ${roster.join(", ")}`,
		};
	}

	function reloadAgentDefinitionsFromDisk(): { ok: boolean; message: string } {
		if (!extensionCwd) return { ok: false, message: "Extension cwd not set." };
		allAgentDefs = scanAgentDirs(extensionCwd);
		reloadAgentModelOverrides(extensionCwd);
		reloadTeamsFromFiles(extensionCwd);
		const prev = activeTeamName;
		if (prev && teams[prev]) {
			activateTeam(prev);
		} else {
			const first = Object.keys(teams)[0];
			if (first) activateTeam(first);
		}
		updateWidget();
		if (widgetCtx) {
			widgetCtx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		}
		return {
			ok: true,
			message: `Rescanned agent .md files (${allAgentDefs.length} definitions). Active team: ${activeTeamName} (${agentStates.size} members).`,
		};
	}

	function activateTeamByName(teamName: string): { ok: boolean; message: string } {
		if (!teams[teamName]) {
			return {
				ok: false,
				message: `Unknown team "${teamName}". Teams: ${Object.keys(teams).join(", ") || "(none)"}`,
			};
		}
		activateTeam(teamName);
		updateWidget();
		if (widgetCtx) {
			widgetCtx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		}
		return {
			ok: true,
			message: `Active team: ${teamName} — ${Array.from(agentStates.values())
				.map((s) => displayName(s.def.name))
				.join(", ")}`,
		};
	}

	function saveCurrentTeamAsPreset(presetName: string, overwrite: boolean): { ok: boolean; message: string } {
		const key = presetName.trim();
		if (!key) return { ok: false, message: "Preset name required." };
		if (!activeTeamName || !teams[activeTeamName]) {
			return { ok: false, message: "No active team roster to save." };
		}
		if (!overwrite && userTeamPresets[key] && !yamlTeamKeys.has(key)) {
			return { ok: false, message: `Preset "${key}" exists. Pass overwrite=true or delete first.` };
		}
		const roster = [...teams[activeTeamName]];
		userTeamPresets[key] = roster;
		teams[key] = [...roster];
		persistUserPresets(extensionCwd);
		return { ok: true, message: `Saved preset "${key}" (${roster.length} members). Use team_load_preset or /agents-preset-load ${key}.` };
	}

	function deleteSavedPreset(teamName: string): { ok: boolean; message: string } {
		const key = teamName.trim();
		if (yamlTeamKeys.has(key)) {
			return { ok: false, message: `Team "${key}" is defined in teams.yaml — remove it there if needed.` };
		}
		if (!userTeamPresets[key]) {
			return { ok: false, message: `No saved preset "${key}".` };
		}
		delete userTeamPresets[key];
		persistUserPresets(extensionCwd);
		reloadTeamsFromFiles(extensionCwd);
		if (!teams[activeTeamName]) {
			const first = Object.keys(teams)[0];
			if (first) activateTeamByName(first);
		} else {
			activateTeam(activeTeamName);
			updateWidget();
		}
		if (widgetCtx) {
			widgetCtx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		}
		return { ok: true, message: `Deleted preset "${key}".` };
	}

	function formatTeamListText(): string {
		const lines: string[] = [];
		for (const name of Object.keys(teams).sort()) {
			const src = yamlTeamKeys.has(name) ? "yaml" : "preset";
			const members = (teams[name] || []).join(", ");
			lines.push(`- **${name}** (${src}): ${members}`);
		}
		return lines.length ? lines.join("\n") : "(no teams)";
	}

	function activateTeam(teamName: string) {
		activeTeamName = teamName;
		const members = teams[teamName] || [];
		const defsByName = new Map(allAgentDefs.map(d => [d.name.toLowerCase(), d]));

		agentStates.clear();
		for (const member of members) {
			const def = defsByName.get(member.toLowerCase());
			if (!def) continue;
			const key = def.name.toLowerCase().replace(/\s+/g, "-");
			const sessionFile = join(sessionDir, `${key}.json`);
			agentStates.set(def.name.toLowerCase(), {
				def,
				status: "idle",
				task: "",
				toolCount: 0,
				elapsed: 0,
				lastWork: "",
				lastThinking: "",
				lastTool: "",
				contextPct: 0,
				lastRunTokensIn: 0,
				lastRunTokensOut: 0,
				resolvedModel: resolveSubagentModel(def),
				sessionFile: existsSync(sessionFile) ? sessionFile : null,
				runCount: 0,
			});
		}

		// Auto-size grid columns based on team size
		const size = agentStates.size;
		gridCols = size <= 3 ? size : size === 4 ? 2 : 3;
	}

	// ── Grid Rendering ───────────────────────────

	/** Word-wrap plain text to fixed line widths (cell interior; mostly ASCII agent blurbs). */
	function wrapPlainToLines(s: string, lineWidth: number, maxLines: number): string[] {
		const t = s.replace(/\s+/g, " ").trim();
		if (!lineWidth || maxLines <= 0) return [];
		if (!t) return [""];
		const lines: string[] = [];
		let cur = "";
		for (const word of t.split(" ")) {
			if (!word) continue;
			if (lines.length >= maxLines) break;
			const next = cur ? `${cur} ${word}` : word;
			if (next.length <= lineWidth) {
				cur = next;
				continue;
			}
			if (cur) {
				lines.push(truncateToWidth(cur, lineWidth));
				cur = "";
				if (lines.length >= maxLines) break;
			}
			if (lines.length >= maxLines) break;
			if (word.length <= lineWidth) {
				cur = word;
			} else {
				lines.push(truncateToWidth(word, lineWidth));
			}
		}
		if (cur && lines.length < maxLines) lines.push(truncateToWidth(cur, lineWidth));
		return lines.length ? lines.slice(0, maxLines) : [""];
	}

	function renderCard(state: AgentState, colWidth: number, theme: any, streamMode: boolean): string[] {
		const w = colWidth - 2;
		const innerTextW = Math.max(4, w - 1);

		const statusColor = state.status === "idle" ? "dim"
			: state.status === "running" ? "accent"
			: state.status === "done" ? "success" : "error";
		const statusIcon = state.status === "idle" ? "○"
			: state.status === "running" ? "●"
			: state.status === "done" ? "✓" : "✗";

		const name = displayName(state.def.name);
		const namePlain = truncateToWidth(name, innerTextW);
		const nameStr = theme.fg("accent", theme.bold(namePlain));
		const nameVisible = visibleWidth(namePlain);

		const statusStr = `${statusIcon} ${state.status}`;
		const timeStr = state.status !== "idle" ? ` ${Math.round(state.elapsed / 1000)}s` : "";
		const statusPlain = truncateToWidth(statusStr + timeStr, innerTextW);
		const statusLine = theme.fg(statusColor, statusPlain);
		const statusVisible = visibleWidth(statusPlain);

		// Context bar: 5 blocks + percent
		const filled = Math.ceil(state.contextPct / 20);
		const bar = "#".repeat(filled) + "-".repeat(5 - filled);
		const ctxStr = `[${bar}] ${Math.ceil(state.contextPct)}%`;
		const ctxPlain = truncateToWidth(ctxStr, innerTextW);
		const ctxLine = theme.fg("dim", ctxPlain);
		const ctxVisible = visibleWidth(ctxPlain);

		const tokStr =
			state.status === "running"
				? state.lastRunTokensIn + state.lastRunTokensOut > 0
					? `↓${fmtTok(state.lastRunTokensIn)} ↑${fmtTok(state.lastRunTokensOut)} …`
					: "tok …"
				: state.lastRunTokensIn + state.lastRunTokensOut > 0
					? `↓${fmtTok(state.lastRunTokensIn)} ↑${fmtTok(state.lastRunTokensOut)}`
					: "tok —";
		const visTok = truncateToWidth(tokStr, innerTextW);
		const tokLine = theme.fg("dim", visTok);
		const tokVisible = visibleWidth(visTok);

		const workRaw = state.task
			? (state.lastWork || state.task)
			: state.def.description;
		const maxDescLines = streamMode ? 3 : 2;
		const workLines = wrapPlainToLines(workRaw || "", innerTextW, maxDescLines);

		const top = "╭" + "─".repeat(w) + "╮";
		const bot = "╰" + "─".repeat(w) + "╯";
		const border = (content: string, visLen: number) =>
			theme.fg("dim", "│") + content + " ".repeat(Math.max(0, w - visLen)) + theme.fg("dim", "│");

		const modPlain = truncateToWidth(`⎆ ${state.resolvedModel}`, innerTextW);
		const modLine = theme.fg("dim", modPlain);
		const modVisible = visibleWidth(modPlain);

		const lines: string[] = [
			theme.fg("dim", top),
			border(" " + nameStr, 1 + nameVisible),
			border(" " + modLine, 1 + modVisible),
			border(" " + statusLine, 1 + statusVisible),
			border(" " + ctxLine, 1 + ctxVisible),
			border(" " + tokLine, 1 + tokVisible),
		];
		if (streamMode) {
			const toolPre = "⚙ ";
			const toolAvail = Math.max(1, innerTextW - visibleWidth(toolPre));
			const toolPlain = state.lastTool
				? toolPre + truncateToWidth(state.lastTool, toolAvail)
				: "—";
			const thinkPre = "τ ";
			const thinkAvail = Math.max(1, innerTextW - visibleWidth(thinkPre));
			const thinkPlain = state.lastThinking
				? thinkPre + truncateToWidth(state.lastThinking, thinkAvail)
				: "—";
			const toolStyled = theme.fg(state.lastTool ? "accent" : "dim", toolPlain);
			const thinkStyled = theme.fg(state.lastThinking ? "muted" : "dim", thinkPlain);
			lines.push(border(" " + toolStyled, 1 + visibleWidth(toolPlain)));
			lines.push(border(" " + thinkStyled, 1 + visibleWidth(thinkPlain)));
		}
		for (const seg of workLines) {
			const workSeg = theme.fg("muted", seg);
			lines.push(border(" " + workSeg, 1 + visibleWidth(seg)));
		}
		lines.push(theme.fg("dim", bot));
		return lines;
	}

	function updateWidget() {
		if (!widgetCtx) return;

		widgetCtx.ui.setWidget("agent-team", (_tui: any, theme: any) => {
			const text = new Text("", 0, 1);

			return {
				render(width: number): string[] {
					if (agentStates.size === 0) {
						text.setText(theme.fg("dim", "No agents found. Add .md files to agents/"));
						return text.render(width);
					}

					const cols = Math.min(gridCols, agentStates.size);
					const gap = 1;
					const colWidth = Math.floor((width - gap * (cols - 1)) / cols);
					const agents = Array.from(agentStates.values());
					const rows: string[][] = [];

					const wInner = Math.max(2, colWidth - 2);
					const emptyCardLine =
						theme.fg("dim", "│") + " ".repeat(wInner) + theme.fg("dim", "│");
					for (let i = 0; i < agents.length; i += cols) {
						const rowAgents = agents.slice(i, i + cols);
						const cards = rowAgents.map((a) =>
							renderCard(a, colWidth, theme, gridStreamDetail),
						);
						const cardHeight = Math.max(...cards.map((c) => c.length), 1);
						for (const card of cards) {
							const need = cardHeight - card.length;
							if (need <= 0) continue;
							const bot = card.pop();
							if (bot !== undefined) {
								for (let k = 0; k < need; k++) card.push(emptyCardLine);
								card.push(bot);
							}
						}
						const stubCard = (): string[] => {
							const top = theme.fg("dim", "╭" + "─".repeat(wInner) + "╮");
							const bot = theme.fg("dim", "╰" + "─".repeat(wInner) + "╯");
							if (cardHeight < 2) return [top, bot];
							return [top, ...Array(cardHeight - 2).fill(emptyCardLine), bot];
						};
						while (cards.length < cols) {
							cards.push(stubCard());
						}
						for (let line = 0; line < cardHeight; line++) {
							rows.push(cards.map((card) => card[line] ?? ""));
						}
					}

					const rule = theme.fg("dim", "─".repeat(Math.max(0, width)));
					const title = theme.fg(
						"accent",
						truncateToWidth(` ◆ ${activeTeamName}`, width),
					);
					const output = [title, rule, ...rows.map(cols => cols.join(" ".repeat(gap)))];
					text.setText(output.join("\n"));
					return text.render(width);
				},
				invalidate() {
					text.invalidate();
				},
			};
		});
	}

	// ── Dispatch Agent (returns Promise) ─────────

	function dispatchAgent(
		agentName: string,
		task: string,
		ctx: any,
		modelOverride?: string | null,
	): Promise<{
		output: string;
		exitCode: number;
		elapsed: number;
		usage?: { input: number; output: number };
	}> {
		const key = agentName.toLowerCase();
		const state = agentStates.get(key);
		if (!state) {
			return Promise.resolve({
				output: `Agent "${agentName}" not found. Available: ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`,
				exitCode: 1,
				elapsed: 0,
				usage: undefined,
			});
		}

		if (state.status === "running") {
			return Promise.resolve({
				output: `Agent "${displayName(state.def.name)}" is already running. Wait for it to finish.`,
				exitCode: 1,
				elapsed: 0,
				usage: undefined,
			});
		}

		state.status = "running";
		state.task = task;
		state.toolCount = 0;
		state.elapsed = 0;
		state.lastWork = "";
		state.lastThinking = "";
		state.lastTool = "";
		state.lastRunTokensIn = 0;
		state.lastRunTokensOut = 0;
		state.runCount++;
		updateWidget();

		const startTime = Date.now();
		state.timer = setInterval(() => {
			state.elapsed = Date.now() - startTime;
			updateWidget();
		}, 1000);

		const model = resolveSubagentModel(state.def, modelOverride);
		state.resolvedModel = model;

		// Session file for this agent
		const agentKey = state.def.name.toLowerCase().replace(/\s+/g, "-");
		const agentSessionFile = join(sessionDir, `${agentKey}.json`);

		// Build args — first run creates session, subsequent runs resume
		const args = [
			"--mode", "json",
			"-p",
			"--no-extensions",
			"--model", model,
			"--tools", state.def.tools,
			"--thinking", gridStreamDetail ? "minimal" : "off",
			"--append-system-prompt", state.def.systemPrompt,
			"--session", agentSessionFile,
		];

		// Continue existing session if we have one
		if (state.sessionFile) {
			args.push("-c");
		}

		args.push(task);

		const textChunks: string[] = [];
		const thinkingChunks: string[] = [];

		return new Promise((resolve) => {
			const proc = spawn("pi", args, {
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env },
			});

			let buffer = "";

			proc.stdout!.setEncoding("utf-8");
			proc.stdout!.on("data", (chunk: string) => {
				buffer += chunk;
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";
				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const event = JSON.parse(line);
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent as
								| { type?: string; delta?: string }
								| undefined;
							if (delta?.type === "text_delta") {
								textChunks.push(delta.delta || "");
								const full = textChunks.join("");
								const last = full.split("\n").filter((l: string) => l.trim()).pop() || "";
								state.lastWork = last;
								updateWidget();
							} else if (delta?.type === "thinking_start") {
								thinkingChunks.length = 0;
								state.lastThinking = "";
								updateWidget();
							} else if (delta?.type === "thinking_delta") {
								thinkingChunks.push(delta.delta || "");
								const fullT = thinkingChunks.join("");
								const tl = fullT.split("\n").filter((l: string) => l.trim());
								state.lastThinking = (tl.length ? tl[tl.length - 1] : fullT.slice(-200)) || "";
								updateWidget();
							} else if (delta?.type === "thinking_end") {
								updateWidget();
							}
						} else if (event.type === "tool_execution_start") {
							state.toolCount++;
							const te = event as { toolName?: string };
							if (typeof te.toolName === "string" && te.toolName) {
								state.lastTool = te.toolName;
							}
							updateWidget();
						} else if (event.type === "tool_execution_update") {
							const ev = event as Record<string, unknown>;
							const out = partialToolOutput(ev);
							if (out) {
								const tail =
									out.split("\n").filter((l: string) => l.trim()).pop() || out.slice(-120);
								state.lastWork = `→ ${tail}`;
								updateWidget();
							}
						} else if (event.type === "tool_execution_end") {
							const te = event as { toolName?: string };
							if (typeof te.toolName === "string" && te.toolName) {
								state.lastTool = te.toolName;
							}
							updateWidget();
						} else if (event.type === "message_end") {
							const msg = event.message;
							const pair = msg?.usage ? usageInOut(msg.usage) : null;
							if (pair) {
								state.lastRunTokensIn += pair.input;
								state.lastRunTokensOut += pair.output;
							}
							if (msg?.usage && contextWindow > 0) {
								const inp = usageInOut(msg.usage)?.input ?? (msg.usage as { input?: number }).input ?? 0;
								state.contextPct = (inp / contextWindow) * 100;
							}
							updateWidget();
						} else if (event.type === "agent_end") {
							const msgs = event.messages || [];
							let sumIn = 0;
							let sumOut = 0;
							for (const m of msgs) {
								const mm = m as { role?: string; usage?: unknown };
								if (mm.role === "assistant" && mm.usage) {
									const p = usageInOut(mm.usage);
									if (p) {
										sumIn += p.input;
										sumOut += p.output;
									}
								}
							}
							if (sumIn + sumOut > 0) {
								state.lastRunTokensIn = sumIn;
								state.lastRunTokensOut = sumOut;
							}
							const last = [...msgs].reverse().find((m: any) => m.role === "assistant");
							if (last?.usage && contextWindow > 0) {
								const inp =
									usageInOut(last.usage)?.input ?? (last.usage as { input?: number }).input ?? 0;
								state.contextPct = (inp / contextWindow) * 100;
							}
							updateWidget();
						}
					} catch {}
				}
			});

			proc.stderr!.setEncoding("utf-8");
			proc.stderr!.on("data", () => {});

			proc.on("close", (code) => {
				if (buffer.trim()) {
					try {
						const event = JSON.parse(buffer);
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") textChunks.push(delta.delta || "");
						}
					} catch {}
				}

				clearInterval(state.timer);
				state.elapsed = Date.now() - startTime;
				state.status = code === 0 ? "done" : "error";

				// Mark session file as available for resume
				if (code === 0) {
					state.sessionFile = agentSessionFile;
				}

				const full = textChunks.join("");
				state.lastWork = full.split("\n").filter((l: string) => l.trim()).pop() || "";
				updateWidget();

				const tok =
					state.lastRunTokensIn + state.lastRunTokensOut > 0
						? ` · ↓${fmtTok(state.lastRunTokensIn)} ↑${fmtTok(state.lastRunTokensOut)} tok`
						: "";
				ctx.ui.notify(
					`${displayName(state.def.name)} ${state.status} in ${Math.round(state.elapsed / 1000)}s${tok}`,
					state.status === "done" ? "success" : "error"
				);

				resolve({
					output: full,
					exitCode: code ?? 1,
					elapsed: state.elapsed,
					usage:
						state.lastRunTokensIn + state.lastRunTokensOut > 0
							? { input: state.lastRunTokensIn, output: state.lastRunTokensOut }
							: undefined,
				});
			});

			proc.on("error", (err) => {
				clearInterval(state.timer);
				state.status = "error";
				state.lastWork = `Error: ${err.message}`;
				updateWidget();
				resolve({
					output: `Error spawning agent: ${err.message}`,
					exitCode: 1,
					elapsed: Date.now() - startTime,
					usage:
						state.lastRunTokensIn + state.lastRunTokensOut > 0
							? { input: state.lastRunTokensIn, output: state.lastRunTokensOut }
							: undefined,
				});
			});
		});
	}

	// ── dispatch_agent Tool (registered at top level) ──

	pi.registerTool({
		name: "dispatch_agent",
		label: "Dispatch Agent",
		description:
			"Dispatch a task to a specialist agent. The agent will execute the task and return the result. Use the system prompt to see available agent names. Optional **model** sets Pi `--model` for that run only (otherwise agent-models.json, agent frontmatter model:, default key, then your session model).",
		parameters: Type.Object({
			agent: Type.String({ description: "Agent name (case-insensitive)" }),
			task: Type.String({ description: "Task description for the agent to execute" }),
			model: Type.Optional(
				Type.String({
					description:
						"Optional one-shot Pi model (e.g. openrouter/anthropic/claude-3.5-sonnet). Overrides per-agent config for this dispatch only.",
				}),
			),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { agent, task, model } = params as { agent: string; task: string; model?: string };

			try {
				if (onUpdate) {
					onUpdate({
						content: [{ type: "text", text: `Dispatching to ${agent}...` }],
						details: { agent, task, status: "dispatching" },
					});
				}

				const result = await dispatchAgent(agent, task, ctx, model ?? null);

				const truncated = result.output.length > 8000
					? result.output.slice(0, 8000) + "\n\n... [truncated]"
					: result.output;

				const status = result.exitCode === 0 ? "done" : "error";
				const tok =
					result.usage && (result.usage.input > 0 || result.usage.output > 0)
						? ` · ↓${fmtTok(result.usage.input)} ↑${fmtTok(result.usage.output)} tok`
						: "";
				const summary = `[${agent}] ${status} in ${Math.round(result.elapsed / 1000)}s${tok}`;

				return {
					content: [{ type: "text", text: `${summary}\n\n${truncated}` }],
					details: {
						agent,
						task,
						status,
						elapsed: result.elapsed,
						exitCode: result.exitCode,
						fullOutput: result.output,
						usage: result.usage,
					},
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error dispatching to ${agent}: ${err?.message || err}` }],
					details: { agent, task, status: "error", elapsed: 0, exitCode: 1, fullOutput: "" },
				};
			}
		},

		renderCall(args, theme) {
			const agentName = (args as any).agent || "?";
			const task = (args as any).task || "";
			const modelArg = (args as any).model as string | undefined;
			const preview = task.length > 60 ? task.slice(0, 57) + "..." : task;
			const mod = modelArg ? theme.fg("dim", ` · ${modelArg}`) : "";
			return new Text(
				theme.fg("toolTitle", theme.bold("dispatch_agent ")) +
				theme.fg("accent", agentName) +
				mod +
				theme.fg("dim", " — ") +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, options, theme) {
			const details = result.details as any;
			if (!details) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "", 0, 0);
			}

			// Streaming/partial result while agent is still running
			if (options.isPartial || details.status === "dispatching") {
				return new Text(
					theme.fg("accent", `● ${details.agent || "?"}`) +
					theme.fg("dim", " working..."),
					0, 0,
				);
			}

			const icon = details.status === "done" ? "✓" : "✗";
			const color = details.status === "done" ? "success" : "error";
			const elapsed = typeof details.elapsed === "number" ? Math.round(details.elapsed / 1000) : 0;
			const u = details.usage as { input?: number; output?: number } | undefined;
			const tok =
				u && (u.input || u.output)
					? theme.fg("dim", ` ↓${fmtTok(u.input || 0)} ↑${fmtTok(u.output || 0)}`)
					: "";
			const header = theme.fg(color, `${icon} ${details.agent}`) +
				theme.fg("dim", ` ${elapsed}s`) +
				tok;

			if (options.expanded && details.fullOutput) {
				const output = details.fullOutput.length > 4000
					? details.fullOutput.slice(0, 4000) + "\n... [truncated]"
					: details.fullOutput;
				return new Text(header + "\n" + theme.fg("muted", output), 0, 0);
			}

			return new Text(header, 0, 0);
		},
	});

	const TEAM_TOOLS = [
		"team_list",
		"team_member_add",
		"team_member_remove",
		"team_member_replace",
		"team_reload_agents",
		"team_activate",
		"team_save_preset",
		"team_load_preset",
		"team_delete_preset",
	] as const;

	/** Built-ins so the dispatcher can confirm files after a specialist run (not write/edit/bash). */
	const DISPATCHER_VERIFY_TOOLS = ["read", "ls", "grep"] as const;

	pi.registerTool({
		name: "team_list",
		label: "Team list",
		description:
			"List all teams (YAML + saved presets), active team, and roster. Use to see valid team names and agent names for dispatch.",
		parameters: Type.Object({}),
		async execute(_id, _p, _s, _u, ctx) {
			widgetCtx = ctx;
			const active = activeTeamName
				? `${activeTeamName}: ${(teams[activeTeamName] || []).join(", ")}`
				: "(none)";
			const catalog = allAgentDefs.map((d) => `- ${d.name}: ${d.description.slice(0, 120)}`).join("\n");
			const text = `**Teams**\n${formatTeamListText()}\n\n**Active:** ${active}\n\n**All agent definitions (scan):**\n${catalog || "(none)"}${formatSubagentModelsSection()}`;
			return { content: [{ type: "text", text }], details: { teamCount: Object.keys(teams).length } };
		},
	});

	pi.registerTool({
		name: "team_member_add",
		label: "Team add member",
		description: "Add a specialist to the active team by agent name (must exist in scanned .md definitions). In-memory until you team_save_preset.",
		parameters: Type.Object({
			agentName: Type.String({ description: "Agent name as in frontmatter (e.g. scout, builder)" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { agentName } = params as { agentName: string };
			const r = addMemberToActiveTeam(agentName);
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_member_remove",
		label: "Team remove member",
		description: "Remove a specialist from the active team roster (cannot remove the last member).",
		parameters: Type.Object({
			agentName: Type.String({ description: "Agent name to remove" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { agentName } = params as { agentName: string };
			const r = removeMemberFromActiveTeam(agentName);
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_member_replace",
		label: "Team replace member",
		description:
			"Replace one specialist on the active team with another (by agent names from scanned .md files).",
		parameters: Type.Object({
			fromAgent: Type.String({ description: "Agent to replace (must be on current roster)" }),
			toAgent: Type.String({ description: "Agent to put in that slot" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { fromAgent, toAgent } = params as { fromAgent: string; toAgent: string };
			const r = replaceMemberOnActiveTeam(fromAgent, toAgent);
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_reload_agents",
		label: "Reload agent definitions",
		description:
			"Rescan agents/*.md, .claude/agents, .pi/agents for updated personas. Use after editing agent files on disk.",
		parameters: Type.Object({}),
		async execute(_id, _p, _s, _u, ctx) {
			widgetCtx = ctx;
			const r = reloadAgentDefinitionsFromDisk();
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_activate",
		label: "Team activate",
		description: "Switch active team to a YAML or saved preset name.",
		parameters: Type.Object({
			teamName: Type.String({ description: "Team / preset key" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { teamName } = params as { teamName: string };
			const r = activateTeamByName(teamName.trim());
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_save_preset",
		label: "Team save preset",
		description:
			"Save the CURRENT active team roster under a name to .pi/agents/teams-presets.json (merged on load). Set overwrite=true to replace an existing preset.",
		parameters: Type.Object({
			name: Type.String({ description: "Preset key (e.g. my-plan-build)" }),
			overwrite: Type.Optional(Type.Boolean({ description: "Replace if preset exists" })),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { name, overwrite } = params as { name: string; overwrite?: boolean };
			const r = saveCurrentTeamAsPreset(name, overwrite === true);
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_load_preset",
		label: "Team load preset",
		description: "Same as team_activate — switch to a team/preset by name.",
		parameters: Type.Object({
			teamName: Type.String({ description: "Team or preset name" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { teamName } = params as { teamName: string };
			const r = activateTeamByName(teamName.trim());
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	pi.registerTool({
		name: "team_delete_preset",
		label: "Team delete preset",
		description:
			"Delete a saved preset from teams-presets.json. Cannot delete teams that only exist in teams.yaml (edit YAML instead).",
		parameters: Type.Object({
			name: Type.String({ description: "Preset name to delete" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			widgetCtx = ctx;
			const { name } = params as { name: string };
			const r = deleteSavedPreset(name);
			if (ctx.hasUI) ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			return { content: [{ type: "text", text: r.message }], details: { ok: r.ok } };
		},
	});

	// ── Commands ─────────────────────────────────

	pi.registerCommand("agents-team", {
		description: "Select a team to work with",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const teamNames = Object.keys(teams);
			if (teamNames.length === 0) {
				ctx.ui.notify("No teams found (.pi/agents/teams.yaml + teams-presets.json).", "warning");
				return;
			}

			const options = teamNames.map(name => {
				const members = teams[name].map(m => displayName(m));
				return `${name} — ${members.join(", ")}`;
			});

			const choice = await ctx.ui.select("Select Team", options);
			if (choice === undefined) return;

			const idx = options.indexOf(choice);
			const name = teamNames[idx];
			activateTeam(name);
			updateWidget();
			ctx.ui.setStatus("agent-team", `Team: ${name} (${agentStates.size})`);
			ctx.ui.notify(`Team: ${name} — ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`, "info");
		},
	});

	pi.registerCommand("agents-list", {
		description: "List all loaded agents",
		handler: async (_args, _ctx) => {
			widgetCtx = _ctx;
			const names = Array.from(agentStates.values())
				.map(s => {
					const session = s.sessionFile ? "resumed" : "new";
					return `${displayName(s.def.name)} (${s.status}, ${session}, runs: ${s.runCount}): ${s.def.description}`;
				})
				.join("\n");
			_ctx.ui.notify(names || "No agents loaded", "info");
		},
	});

	pi.registerCommand("agents-grid", {
		description: "Set grid columns: /agents-grid <1-6>",
		getArgumentCompletions: (prefix: string): AutocompleteItem[] | null => {
			const items = ["1", "2", "3", "4", "5", "6"].map(n => ({
				value: n,
				label: `${n} columns`,
			}));
			const filtered = items.filter(i => i.value.startsWith(prefix));
			return filtered.length > 0 ? filtered : items;
		},
		handler: async (args, _ctx) => {
			widgetCtx = _ctx;
			const n = parseInt(args?.trim() || "", 10);
			if (n >= 1 && n <= 6) {
				gridCols = n;
				_ctx.ui.notify(`Grid set to ${gridCols} columns`, "info");
				updateWidget();
			} else {
				_ctx.ui.notify("Usage: /agents-grid <1-6>", "error");
			}
		},
	});

	pi.registerCommand("agents-stream", {
		description: "Grid stream detail (default ON): /agents-stream off to hide, on to show",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const a = args.trim().toLowerCase();
			if (a === "on" || a === "1" || a === "true") gridStreamDetail = true;
			else if (a === "off" || a === "0" || a === "false") gridStreamDetail = false;
			else gridStreamDetail = !gridStreamDetail;
			ctx.ui.notify(
				`Agent grid stream detail: ${gridStreamDetail ? "ON" : "OFF"} ` +
					`(default ON; subagent --thinking ${gridStreamDetail ? "minimal" : "off"}; ctrl+shift+v to toggle). Applies to new dispatches.`,
				"info",
			);
			updateWidget();
		},
	});

	pi.registerShortcut("ctrl+shift+v", {
		description: "Toggle agent-team grid stream (default ON; hide compact cards)",
		handler: async (ctx) => {
			widgetCtx = ctx;
			gridStreamDetail = !gridStreamDetail;
			ctx.ui.notify(
				`Agent grid stream: ${gridStreamDetail ? "ON" : "OFF"} (subagent --thinking ${gridStreamDetail ? "minimal" : "off"})`,
				"info",
			);
			updateWidget();
		},
	});

	pi.registerCommand("agents-team-add", {
		description: "Add agent to active team: /agents-team-add <agentName>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const r = addMemberToActiveTeam(args.trim());
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		},
	});

	pi.registerCommand("agents-team-remove", {
		description: "Remove agent from active team: /agents-team-remove <agentName>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const r = removeMemberFromActiveTeam(args.trim());
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		},
	});

	pi.registerCommand("agents-team-replace", {
		description: "Replace roster slot: /agents-team-replace <fromAgent> <toAgent>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const parts = args.trim().split(/\s+/).filter(Boolean);
			if (parts.length < 2) {
				ctx.ui.notify("Usage: /agents-team-replace <from> <to>", "error");
				return;
			}
			const [fromAgent, ...rest] = parts;
			const toAgent = rest.join(" ");
			const r = replaceMemberOnActiveTeam(fromAgent, toAgent);
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		},
	});

	pi.registerCommand("agents-reload", {
		description: "Rescan agent .md definitions from disk",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const r = reloadAgentDefinitionsFromDisk();
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
		},
	});

	pi.registerCommand("agents-models", {
		description: "Show resolved Pi --model per roster agent (agent-models.json + frontmatter + session)",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const p = agentModelsPathFor(ctx.cwd);
			const hint = existsSync(p)
				? p
				: `${p} (missing — copy .pi/agents/agent-models.example.json)`;
			const body = formatSubagentModelsSection().replace(/^\s+/, "") || "No active roster.";
			ctx.ui.notify(`**${hint}**\n\n${body}`, "info");
			updateWidget();
		},
	});

	pi.registerCommand("agents-preset-save", {
		description: "Save active roster as preset: /agents-preset-save <name> [overwrite]",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const parts = args.trim().split(/\s+/);
			const name = parts[0] || "";
			const overwrite = parts[1]?.toLowerCase() === "overwrite" || parts[1]?.toLowerCase() === "true";
			const r = saveCurrentTeamAsPreset(name, overwrite);
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
		},
	});

	pi.registerCommand("agents-preset-load", {
		description: "Activate team/preset: /agents-preset-load <name>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const r = activateTeamByName(args.trim());
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		},
	});

	pi.registerCommand("agents-preset-list", {
		description: "List teams (yaml vs preset)",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			ctx.ui.notify(formatTeamListText(), "info");
		},
	});

	pi.registerCommand("agents-preset-delete", {
		description: "Delete saved preset: /agents-preset-delete <name>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const r = deleteSavedPreset(args.trim());
			ctx.ui.notify(r.message, r.ok ? "success" : "warning");
			ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		},
	});

	// ── System Prompt Override ───────────────────

	pi.on("before_agent_start", async (_event, _ctx) => {
		if (_ctx.model?.provider && _ctx.model?.id) {
			dispatcherSessionModel = `${_ctx.model.provider}/${_ctx.model.id}`;
		}
		for (const s of agentStates.values()) {
			s.resolvedModel = resolveSubagentModel(s.def);
		}

		// Build dynamic agent catalog from active team only
		const agentCatalog = Array.from(agentStates.values())
			.map(
				s =>
					`### ${displayName(s.def.name)}\n**Dispatch as:** \`${s.def.name}\`\n**Pi model:** \`${s.resolvedModel}\` (override with \`dispatch_agent\` \`model\` for one shot)\n${s.def.description}\n**Tools:** ${s.def.tools}`,
			)
			.join("\n\n");

		const teamMembers = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");

		const isBuildOrchestra = activeTeamName === BUILD_ORCHESTRA_TEAM;
		const roleIntro = isBuildOrchestra
			? `You are the **Builder orchestrator** (dispatcher). You route every implementation task to the **best specialist** on the roster: **planner**, **builder**, **reviewer**, **documenter**, or a **domain builder** (lang-*/infra-*/data-*). You coordinate outcomes; you do not implement code yourself.`
			: `You are a dispatcher agent. You coordinate specialist agents to accomplish tasks.`;

		const buildOrchestraWorkflow = isBuildOrchestra
			? `

## Builder-orchestra workflow (this team)
You are the **lead builder / orchestrator** in chat: you **never** implement with write/edit/bash. You **coordinate** by dispatching:
- **planner**, **reviewer**, **documenter** when needed (planning, quality gate, prose docs).
- **builder** for **generic** implementation when no lang-*/infra-*/data-* is a better match.
- A **domain specialist** (below) for **stack-specific** code, infra, or ML wiring.

**Core roster** — use when the task fits (not every trivial step needs planner/reviewer/documenter):
- **planner** — scope, trade-offs, or a multi-step plan before coding when things are ambiguous.
- **builder** — general implementation when no domain agent is a clearly better fit.
- **reviewer** — quality, security, and correctness before you claim work is done.
- **documenter** — user-facing prose: README, changelog, handoff notes.

**Domain builders** (spawn these for the specific code/problem — not every step needs one):
- **lang-typescript-pro** — TypeScript, typings, Node TS services.
- **lang-python-pro** — Python libraries, scripts, tooling.
- **lang-rust-engineer** — Rust crates, systems / performance-sensitive code.
- **lang-javascript-pro** — JavaScript-first or mixed JS/TS legacy.
- **lang-react-specialist** — React components, hooks, UI work.
- **lang-java-architect** — Java, JVM backends, enterprise patterns.
- **infra-devops-engineer** — CI/CD, pipelines, release automation.
- **infra-docker-expert** — Dockerfiles, Compose, container layout.
- **data-ai-engineer** — ML/LLM app integration, data paths touching models.

**Routing:** If the stack is unclear, **planner** first, then one domain builder. For small edits in a known language, go straight to that domain agent. After substantive edits, chain **reviewer**; use **documenter** when behavior changes need user-visible explanation.`
			: "";

		return {
			systemPrompt: `${roleIntro}
You MUST delegate implementation work through the dispatch_agent tool — you do not
use write, edit, or bash yourself.

You **do** have **read**, **ls**, and **grep** to **verify** files specialists claim
to have created or changed, and to **show** the user excerpts or paths before saying
work is done.

## Active Team: ${activeTeamName}
Members: ${teamMembers}
You can ONLY dispatch to agents listed below. Do not attempt to dispatch to agents outside this team.${buildOrchestraWorkflow}

## Team roster management (you have tools for this)
- **team_list** — all teams (YAML + saved presets) and every scanned agent definition
- **team_member_add** / **team_member_remove** — change the active team roster (in-memory; reflected immediately for dispatch)
- **team_member_replace** — swap one roster slot from agent A to agent B (same as “change agent” for that slot)
- **team_reload_agents** — rescan agent markdown from disk and reload \`.pi/agents/agent-models.json\` after you edit personas or model map
- **team_activate** or **team_load_preset** — switch to another team or saved preset
- **team_save_preset** — persist the current active roster under a name to \`.pi/agents/teams-presets.json\` (use **overwrite** if replacing)
- **team_delete_preset** — remove a saved JSON preset (cannot remove teams that exist only in \`teams.yaml\`)

## How to Work
- Analyze the user's request and break it into clear sub-tasks
- Choose the right agent(s) for each sub-task
- Dispatch tasks using the dispatch_agent tool
- Review results and dispatch follow-up agents if needed
- If a task fails, try a different agent or adjust the task description
- Summarize the outcome for the user

## Rules
- NEVER use **write**, **edit**, or **bash** — delegate those to specialists
- Use **read** / **ls** / **grep** only to **verify** or **quote** outputs (paths, snippets)
- ALWAYS use dispatch_agent for implementation (team tools only adjust who you can dispatch)
- You can chain agents: use scout to explore, then builder to implement
- You can dispatch the same agent multiple times with different tasks
- Keep tasks focused — one clear objective per dispatch
- **Subagent models:** specialists run as separate \`pi\` subprocesses with a resolved \`--model\` (see **Pi model** per agent below). Priority: optional \`dispatch_agent\` **model** (one dispatch only) → \`.pi/agents/agent-models.json\` (per-agent + **default** key) → agent .md frontmatter **model:** → your primary session model

## Agents

${agentCatalog}`,
		};
	});

	// ── Session Start ────────────────────────────

	pi.on("session_start", async (_event, _ctx) => {
		applyExtensionDefaults(import.meta.url, _ctx);
		// Clear widgets from previous session
		if (widgetCtx) {
			widgetCtx.ui.setWidget("agent-team", undefined);
		}
		widgetCtx = _ctx;
		contextWindow = _ctx.model?.contextWindow || 0;
		dispatcherSessionModel =
			_ctx.model?.provider && _ctx.model?.id
				? `${_ctx.model.provider}/${_ctx.model.id}`
				: "openrouter/google/gemini-3-flash-preview";

		// Wipe old agent session files so subagents start fresh
		const sessDir = join(_ctx.cwd, ".pi", "agent-sessions");
		if (existsSync(sessDir)) {
			for (const f of readdirSync(sessDir)) {
				if (f.endsWith(".json")) {
					try { unlinkSync(join(sessDir, f)); } catch {}
				}
			}
		}

		loadAgents(_ctx.cwd);

		// Default team: PI_AGENT_TEAM_DEFAULT if valid, else first YAML/preset key — /agents-team to switch
		const teamNames = Object.keys(teams);
		if (teamNames.length > 0) {
			const preferred = process.env.PI_AGENT_TEAM_DEFAULT?.trim();
			let initial = teamNames[0];
			if (preferred) {
				if (teams[preferred]) {
					initial = preferred;
				} else {
					_ctx.ui.notify(
						`PI_AGENT_TEAM_DEFAULT="${preferred}" not in teams — using "${initial}".`,
						"warning",
					);
				}
			}
			activateTeam(initial);
		}

		// Dispatcher: dispatch + team mgmt + read-only verify (so "Tool read not found" cannot happen)
		pi.setActiveTools(["dispatch_agent", ...TEAM_TOOLS, ...DISPATCHER_VERIFY_TOOLS]);

		_ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		const members = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");
		_ctx.ui.notify(
			`Team: ${activeTeamName} (${members})\n` +
			`Teams: .pi/agents/teams.yaml + .pi/agents/teams-presets.json\n\n` +
			`/agents-team             Select a team\n` +
			`/agents-list             Active agents + status\n` +
			`/agents-grid <1-6>       Grid columns\n` +
			`/agents-stream [off]   Stream detail ON by default; hide if unwanted (ctrl+shift+v)\n` +
			`/agents-team-add/remove/replace  Edit active roster\n` +
			`/agents-reload            Rescan agent .md + agent-models.json\n` +
			`/agents-models            Resolved Pi --model per roster agent\n` +
			`/agents-preset-save/load/list/delete  Saved presets\n` +
				`Tools: dispatch + team_* + read, ls, grep (verify only)`,
			"info",
		);
		updateWidget();

		// Footer: model | team | context bar
		_ctx.ui.setFooter((_tui, theme, _footerData) => ({
			dispose: () => {},
			invalidate() {},
			render(width: number): string[] {
				const model = _ctx.model?.id || "no-model";
				const usage = _ctx.getContextUsage();
				const pct = usage ? usage.percent : 0;
				const filled = Math.round(pct / 10);
				const bar = "#".repeat(filled) + "-".repeat(10 - filled);

				const left = theme.fg("dim", ` ${model}`) +
					theme.fg("muted", " · ") +
					theme.fg("accent", activeTeamName);
				const stats = footerContextStats(_ctx);
				const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}%${stats} `);
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));
	});
}
