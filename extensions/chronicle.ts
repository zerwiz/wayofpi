/**
 * The Chronicle (phase 1) — Workflow ledger, transitions, snapshot, anti-loop guard
 *
 * Ledger: .pi/chronicle/ledger.json
 * Workflow template: .pi/chronicle/workflow.json (optional; default baked in)
 *
 * Tools: chronicle_status, chronicle_transition, chronicle_snapshot
 * Command: /chronicle
 *
 * Usage: pi -e extensions/chronicle.ts -e extensions/minimal.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";

interface WorkflowDef {
	initial: string;
	states: Record<string, { next: string[]; requires_approval?: boolean }>;
}

interface Ledger {
	version: 1;
	workflowName: string;
	currentState: string;
	history: Array<{ from: string | null; to: string; at: string; summary: string }>;
	snapshot: string;
	loopCounts: Record<string, number>;
}

const DEFAULT_WORKFLOW: WorkflowDef = {
	initial: "planning",
	states: {
		planning: { next: ["implementation"], requires_approval: false },
		implementation: { next: ["verification", "planning"] },
		verification: { next: ["done", "implementation"] },
		done: { next: [] },
		human_intervention: { next: ["planning"] },
	},
};

function chronicleDir(cwd: string) {
	return join(cwd, ".pi", "chronicle");
}

function ledgerPath(cwd: string) {
	return join(chronicleDir(cwd), "ledger.json");
}

function workflowPath(cwd: string) {
	return join(chronicleDir(cwd), "workflow.json");
}

function readWorkflow(cwd: string): WorkflowDef {
	const p = workflowPath(cwd);
	if (!existsSync(p)) return DEFAULT_WORKFLOW;
	try {
		return JSON.parse(readFileSync(p, "utf-8")) as WorkflowDef;
	} catch {
		return DEFAULT_WORKFLOW;
	}
}

function readLedger(cwd: string, wf: WorkflowDef): Ledger {
	const p = ledgerPath(cwd);
	if (!existsSync(p)) {
		return {
			version: 1,
			workflowName: "default",
			currentState: wf.initial,
			history: [],
			snapshot: "",
			loopCounts: {},
		};
	}
	try {
		return JSON.parse(readFileSync(p, "utf-8")) as Ledger;
	} catch {
		return {
			version: 1,
			workflowName: "default",
			currentState: wf.initial,
			history: [],
			snapshot: "",
			loopCounts: {},
		};
	}
}

function writeLedger(cwd: string, L: Ledger) {
	const d = chronicleDir(cwd);
	mkdirSync(d, { recursive: true });
	writeFileSync(ledgerPath(cwd), JSON.stringify(L, null, 2), "utf-8");
}

function updateStatus(ctx: ExtensionContext, L: Ledger) {
	if (!ctx.hasUI) return;
	const trail = L.history
		.slice(-4)
		.map((h) => `${h.from ?? "∅"}→${h.to}`)
		.join(" · ");
	ctx.ui.setStatus("chronicle", `Chronicle: ${L.currentState} ${trail ? "| " + trail : ""}`);
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		const wf = readWorkflow(ctx.cwd);
		const L = readLedger(ctx.cwd, wf);
		writeLedger(ctx.cwd, L);
		updateStatus(ctx, L);
	});

	pi.registerTool({
		name: "chronicle_status",
		label: "Chronicle status",
		description: "Return current workflow state, snapshot summary, and recent transitions",
		parameters: Type.Object({}),
		async execute(_id, _p, _s, _u, ctx) {
			const wf = readWorkflow(ctx.cwd);
			const L = readLedger(ctx.cwd, wf);
			const text = [
				`**State:** ${L.currentState}`,
				`**Snapshot:** ${L.snapshot || "(empty)"}`,
				`**Recent:**`,
				...L.history.slice(-6).map((h) => `- ${h.at} ${h.from}→${h.to}: ${h.summary}`),
			].join("\n");
			updateStatus(ctx, L);
			return { content: [{ type: "text", text }], details: L };
		},
	});

	pi.registerTool({
		name: "chronicle_snapshot",
		label: "Chronicle snapshot",
		description: "Replace the running snapshot text (checkpoint for the next state)",
		parameters: Type.Object({
			text: Type.String({ description: "Markdown/plain summary to carry forward" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			const { text } = params as { text: string };
			const wf = readWorkflow(ctx.cwd);
			const L = readLedger(ctx.cwd, wf);
			L.snapshot = text.slice(0, 24_000);
			writeLedger(ctx.cwd, L);
			updateStatus(ctx, L);
			return { content: [{ type: "text", text: "Snapshot updated." }], details: {} };
		},
	});

	pi.registerTool({
		name: "chronicle_transition",
		label: "Chronicle transition",
		description: "Move to a valid next state from the workflow graph",
		parameters: Type.Object({
			target_state: Type.String({ description: "Next state id" }),
			summary: Type.String({ description: "Why transitioning" }),
		}),
		async execute(_id, params, _s, _u, ctx) {
			const { target_state, summary } = params as { target_state: string; summary: string };
			const wf = readWorkflow(ctx.cwd);
			const L = readLedger(ctx.cwd, wf);
			const cur = L.currentState;
			const node = wf.states[cur];
			if (!node) {
				return {
					content: [{ type: "text", text: `Unknown current state "${cur}"` }],
					details: {},
				};
			}
			if (!node.next.includes(target_state)) {
				return {
					content: [
						{
							type: "text",
							text: `Invalid transition ${cur}→${target_state}. Allowed: ${node.next.join(", ")}`,
						},
					],
					details: { allowed: node.next },
				};
			}
			const edgeKey = `${cur}→${target_state}`;
			L.loopCounts[edgeKey] = (L.loopCounts[edgeKey] || 0) + 1;
			if (L.loopCounts[edgeKey] >= 4) {
				L.currentState = "human_intervention";
				L.history.push({
					from: cur,
					to: "human_intervention",
					at: new Date().toISOString(),
					summary: "Anti-loop: repeated edge " + edgeKey,
				});
				writeLedger(ctx.cwd, L);
				updateStatus(ctx, L);
				return {
					content: [
						{
							type: "text",
							text: "Forced human_intervention (anti-loop). Review ledger and chronicle_transition out when ready.",
						},
					],
					details: { state: L.currentState },
				};
			}
			L.history.push({
				from: cur,
				to: target_state,
				at: new Date().toISOString(),
				summary: summary.slice(0, 2000),
			});
			L.currentState = target_state;
			writeLedger(ctx.cwd, L);
			updateStatus(ctx, L);
			return {
				content: [{ type: "text", text: `Transition OK: now **${target_state}**` }],
				details: { state: target_state },
			};
		},
	});

	pi.registerCommand("chronicle", {
		description: "Show chronicle ledger path and current state",
		handler: async (_a, ctx) => {
			const wf = readWorkflow(ctx.cwd);
			const L = readLedger(ctx.cwd, wf);
			ctx.ui.notify(
				`Ledger: ${ledgerPath(ctx.cwd)}\nState: ${L.currentState}\nSnapshot: ${(L.snapshot || "").slice(0, 400)}`,
				"info",
			);
		},
	});
}
