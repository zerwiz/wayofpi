/**
 * Agent Team — Dispatcher-only orchestrator with grid dashboard
 *
 * The primary Pi agent has NO codebase tools. It can ONLY delegate work
 * to specialist agents via the `dispatch_agent` tool. Each specialist
 * maintains its own Pi session for cross-invocation memory.
 *
 * Loads agent definitions from agents/*.md, .claude/agents/*.md, .pi/agents/*.md.
 * Teams are defined in .pi/agents/teams.yaml — on boot a select dialog lets
 * you pick which team to work with. Only team members are available for dispatch.
 *
 * Commands:
 *   /agents-team          — switch active team
 *   /agents-list          — list loaded agents
 *   /agents-grid N        — set column count (default 2)
 *   /agents-team-add A    — add agent A to active team (in-memory)
 *   /agents-team-remove A — remove agent A from active team (in-memory)
 *   /agents-team-replace FROM TO — swap one roster slot for another agent
 *   /agents-reload        — rescan agent *.md from disk (after editing personas)
 *   /agents-preset-save K — save current roster as preset K (JSON + reload merge)
 *   /agents-preset-load K — activate team/preset K
 *   /agents-preset-list   — list built-in + saved presets
 *   /agents-preset-delete K — delete saved preset K (not YAML teams)
 *
 * LLM tools (dispatcher): team_list, team_member_add, team_member_remove,
 *   team_member_replace, team_reload_agents, team_activate, team_save_preset,
 *   team_load_preset, team_delete_preset
 *
 * Usage: pi -e extensions/agent-team.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, type AutocompleteItem, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, resolve } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";

// ── Types ────────────────────────────────────────

interface AgentDef {
	name: string;
	description: string;
	tools: string;
	systemPrompt: string;
	file: string;
}

interface AgentState {
	def: AgentDef;
	status: "idle" | "running" | "done" | "error";
	task: string;
	toolCount: number;
	elapsed: number;
	lastWork: string;
	contextPct: number;
	sessionFile: string | null;
	runCount: number;
	timer?: ReturnType<typeof setInterval>;
}

// ── Display Name Helper ──────────────────────────

function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

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

		return {
			name: frontmatter.name,
			description: frontmatter.description || "",
			tools: frontmatter.tools || "read,grep,find,ls",
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
		if (!existsSync(dir)) continue;
		try {
			for (const file of readdirSync(dir)) {
				if (!file.endsWith(".md")) continue;
				const fullPath = resolve(dir, file);
				const def = parseAgentFile(fullPath);
				if (def && !seen.has(def.name.toLowerCase())) {
					seen.add(def.name.toLowerCase());
					agents.push(def);
				}
			}
		} catch {}
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
	let widgetCtx: any;
	let sessionDir = "";
	let extensionCwd = "";
	let contextWindow = 0;

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
				contextPct: 0,
				sessionFile: existsSync(sessionFile) ? sessionFile : null,
				runCount: 0,
			});
		}

		// Auto-size grid columns based on team size
		const size = agentStates.size;
		gridCols = size <= 3 ? size : size === 4 ? 2 : 3;
	}

	// ── Grid Rendering ───────────────────────────

	function renderCard(state: AgentState, colWidth: number, theme: any): string[] {
		const w = colWidth - 2;
		const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 3) + "..." : s;

		const statusColor = state.status === "idle" ? "dim"
			: state.status === "running" ? "accent"
			: state.status === "done" ? "success" : "error";
		const statusIcon = state.status === "idle" ? "○"
			: state.status === "running" ? "●"
			: state.status === "done" ? "✓" : "✗";

		const name = displayName(state.def.name);
		const nameStr = theme.fg("accent", theme.bold(truncate(name, w)));
		const nameVisible = Math.min(name.length, w);

		const statusStr = `${statusIcon} ${state.status}`;
		const timeStr = state.status !== "idle" ? ` ${Math.round(state.elapsed / 1000)}s` : "";
		const statusLine = theme.fg(statusColor, statusStr + timeStr);
		const statusVisible = statusStr.length + timeStr.length;

		// Context bar: 5 blocks + percent
		const filled = Math.ceil(state.contextPct / 20);
		const bar = "#".repeat(filled) + "-".repeat(5 - filled);
		const ctxStr = `[${bar}] ${Math.ceil(state.contextPct)}%`;
		const ctxLine = theme.fg("dim", ctxStr);
		const ctxVisible = ctxStr.length;

		const workRaw = state.task
			? (state.lastWork || state.task)
			: state.def.description;
		const workText = truncate(workRaw, Math.min(50, w - 1));
		const workLine = theme.fg("muted", workText);
		const workVisible = workText.length;

		const top = "┌" + "─".repeat(w) + "┐";
		const bot = "└" + "─".repeat(w) + "┘";
		const border = (content: string, visLen: number) =>
			theme.fg("dim", "│") + content + " ".repeat(Math.max(0, w - visLen)) + theme.fg("dim", "│");

		return [
			theme.fg("dim", top),
			border(" " + nameStr, 1 + nameVisible),
			border(" " + statusLine, 1 + statusVisible),
			border(" " + ctxLine, 1 + ctxVisible),
			border(" " + workLine, 1 + workVisible),
			theme.fg("dim", bot),
		];
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

					for (let i = 0; i < agents.length; i += cols) {
						const rowAgents = agents.slice(i, i + cols);
						const cards = rowAgents.map(a => renderCard(a, colWidth, theme));

						while (cards.length < cols) {
							cards.push(Array(6).fill(" ".repeat(colWidth)));
						}

						const cardHeight = cards[0].length;
						for (let line = 0; line < cardHeight; line++) {
							rows.push(cards.map(card => card[line] || ""));
						}
					}

					const output = rows.map(cols => cols.join(" ".repeat(gap)));
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
	): Promise<{ output: string; exitCode: number; elapsed: number }> {
		const key = agentName.toLowerCase();
		const state = agentStates.get(key);
		if (!state) {
			return Promise.resolve({
				output: `Agent "${agentName}" not found. Available: ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`,
				exitCode: 1,
				elapsed: 0,
			});
		}

		if (state.status === "running") {
			return Promise.resolve({
				output: `Agent "${displayName(state.def.name)}" is already running. Wait for it to finish.`,
				exitCode: 1,
				elapsed: 0,
			});
		}

		state.status = "running";
		state.task = task;
		state.toolCount = 0;
		state.elapsed = 0;
		state.lastWork = "";
		state.runCount++;
		updateWidget();

		const startTime = Date.now();
		state.timer = setInterval(() => {
			state.elapsed = Date.now() - startTime;
			updateWidget();
		}, 1000);

		const model = ctx.model
			? `${ctx.model.provider}/${ctx.model.id}`
			: "openrouter/google/gemini-3-flash-preview";

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
			"--thinking", "off",
			"--append-system-prompt", state.def.systemPrompt,
			"--session", agentSessionFile,
		];

		// Continue existing session if we have one
		if (state.sessionFile) {
			args.push("-c");
		}

		args.push(task);

		const textChunks: string[] = [];

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
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") {
								textChunks.push(delta.delta || "");
								const full = textChunks.join("");
								const last = full.split("\n").filter((l: string) => l.trim()).pop() || "";
								state.lastWork = last;
								updateWidget();
							}
						} else if (event.type === "tool_execution_start") {
							state.toolCount++;
							updateWidget();
						} else if (event.type === "message_end") {
							const msg = event.message;
							if (msg?.usage && contextWindow > 0) {
								state.contextPct = ((msg.usage.input || 0) / contextWindow) * 100;
								updateWidget();
							}
						} else if (event.type === "agent_end") {
							const msgs = event.messages || [];
							const last = [...msgs].reverse().find((m: any) => m.role === "assistant");
							if (last?.usage && contextWindow > 0) {
								state.contextPct = ((last.usage.input || 0) / contextWindow) * 100;
								updateWidget();
							}
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

				ctx.ui.notify(
					`${displayName(state.def.name)} ${state.status} in ${Math.round(state.elapsed / 1000)}s`,
					state.status === "done" ? "success" : "error"
				);

				resolve({
					output: full,
					exitCode: code ?? 1,
					elapsed: state.elapsed,
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
				});
			});
		});
	}

	// ── dispatch_agent Tool (registered at top level) ──

	pi.registerTool({
		name: "dispatch_agent",
		label: "Dispatch Agent",
		description: "Dispatch a task to a specialist agent. The agent will execute the task and return the result. Use the system prompt to see available agent names.",
		parameters: Type.Object({
			agent: Type.String({ description: "Agent name (case-insensitive)" }),
			task: Type.String({ description: "Task description for the agent to execute" }),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { agent, task } = params as { agent: string; task: string };

			try {
				if (onUpdate) {
					onUpdate({
						content: [{ type: "text", text: `Dispatching to ${agent}...` }],
						details: { agent, task, status: "dispatching" },
					});
				}

				const result = await dispatchAgent(agent, task, ctx);

				const truncated = result.output.length > 8000
					? result.output.slice(0, 8000) + "\n\n... [truncated]"
					: result.output;

				const status = result.exitCode === 0 ? "done" : "error";
				const summary = `[${agent}] ${status} in ${Math.round(result.elapsed / 1000)}s`;

				return {
					content: [{ type: "text", text: `${summary}\n\n${truncated}` }],
					details: {
						agent,
						task,
						status,
						elapsed: result.elapsed,
						exitCode: result.exitCode,
						fullOutput: result.output,
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
			const preview = task.length > 60 ? task.slice(0, 57) + "..." : task;
			return new Text(
				theme.fg("toolTitle", theme.bold("dispatch_agent ")) +
				theme.fg("accent", agentName) +
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
			const header = theme.fg(color, `${icon} ${details.agent}`) +
				theme.fg("dim", ` ${elapsed}s`);

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
			const text = `**Teams**\n${formatTeamListText()}\n\n**Active:** ${active}\n\n**All agent definitions (scan):**\n${catalog || "(none)"}`;
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
		// Build dynamic agent catalog from active team only
		const agentCatalog = Array.from(agentStates.values())
			.map(s => `### ${displayName(s.def.name)}\n**Dispatch as:** \`${s.def.name}\`\n${s.def.description}\n**Tools:** ${s.def.tools}`)
			.join("\n\n");

		const teamMembers = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");

		return {
			systemPrompt: `You are a dispatcher agent. You coordinate specialist agents to accomplish tasks.
You do NOT have direct access to the codebase. You MUST delegate all work through
agents using the dispatch_agent tool.

## Active Team: ${activeTeamName}
Members: ${teamMembers}
You can ONLY dispatch to agents listed below. Do not attempt to dispatch to agents outside this team.

## Team roster management (you have tools for this)
- **team_list** — all teams (YAML + saved presets) and every scanned agent definition
- **team_member_add** / **team_member_remove** — change the active team roster (in-memory; reflected immediately for dispatch)
- **team_member_replace** — swap one roster slot from agent A to agent B (same as “change agent” for that slot)
- **team_reload_agents** — rescan agent markdown from disk after you edit personas
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
- NEVER try to read, write, or execute code directly — you have no such tools
- ALWAYS use dispatch_agent to get work done (team tools only adjust who you can dispatch)
- You can chain agents: use scout to explore, then builder to implement
- You can dispatch the same agent multiple times with different tasks
- Keep tasks focused — one clear objective per dispatch

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

		// Default to first team — use /agents-team to switch
		const teamNames = Object.keys(teams);
		if (teamNames.length > 0) {
			activateTeam(teamNames[0]);
		}

		// Lock down to dispatcher-only (tool already registered at top level)
		pi.setActiveTools(["dispatch_agent", ...TEAM_TOOLS]);

		_ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		const members = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");
		_ctx.ui.notify(
			`Team: ${activeTeamName} (${members})\n` +
			`Teams: .pi/agents/teams.yaml + .pi/agents/teams-presets.json\n\n` +
			`/agents-team             Select a team\n` +
			`/agents-list             Active agents + status\n` +
			`/agents-grid <1-6>       Grid columns\n` +
			`/agents-team-add/remove/replace  Edit active roster\n` +
			`/agents-reload            Rescan agent .md\n` +
			`/agents-preset-save/load/list/delete  Saved presets\n` +
			`Tools: + team_member_replace, team_reload_agents`,
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
				const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));
	});
}
