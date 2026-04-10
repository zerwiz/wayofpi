import { useMemo, useState, type MouseEvent } from "react";
import type { PiModelConfigPath } from "../constants/piModelConfigPaths";
import { PI_MODEL_CONFIG_ENTRIES } from "../constants/piModelConfigPaths";
import type { ServerConfig } from "../hooks/useServerConfig";
import type { ChatSessionMode } from "../hooks/useWayOfPiSession";
import type { TreeNode } from "../types/tree";
import { flattenTreeFiles } from "../utils/flattenTree";

export function SearchSidePanel({
	nodes,
	selectedPath,
	onSelectFile,
}: {
	nodes: TreeNode[];
	selectedPath: string | null;
	onSelectFile: (path: string, ev?: MouseEvent) => void;
}) {
	const [q, setQ] = useState("");
	const files = useMemo(() => flattenTreeFiles(nodes), [nodes]);
	const filtered = useMemo(() => {
		const t = q.trim().toLowerCase();
		const list = !t ? files : files.filter((f) => f.path.toLowerCase().includes(t));
		return list.slice(0, 300);
	}, [files, q]);

	return (
		<div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-r border-[#3c3c3c] bg-[#252526]">
			<div className="shrink-0 border-b border-[#3c3c3c] p-2">
				<input
					type="search"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Filter by path…"
					className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1.5 font-mono text-[12px] text-[#cccccc] outline-none focus:border-[#007acc]"
				/>
			</div>
			<ul className="min-h-0 flex-1 overflow-y-auto py-1 font-mono text-[12px]">
				{filtered.map((f) => (
					<li key={f.path}>
						<button
							type="button"
							onClick={(e) => onSelectFile(f.path, e)}
							className={`w-full truncate px-3 py-1.5 text-left hover:bg-[#2d2d2d] ${
								selectedPath === f.path ? "bg-[#007acc]/20 text-white" : "text-[#cccccc]"
							}`}
							title={f.path}
						>
							{f.path}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

export function ScmSidePanel({
	root,
	onRefresh,
}: {
	root: string;
	onRefresh: () => void | Promise<void>;
}) {
	return (
		<div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-r border-[#3c3c3c] bg-[#252526]">
			<div className="flex flex-col gap-3 p-3 text-[13px] leading-relaxed text-[#cccccc]">
				<p className="text-[#858585]">
					Git markers in the explorer come from the server when a repo is detected. Full SCM UI is planned.
				</p>
				<p className="break-all font-mono text-[11px] text-[#9cdcfe]">{root || "—"}</p>
				<button
					type="button"
					onClick={() => void onRefresh()}
					className="rounded border border-[#007acc]/50 bg-[#007acc]/15 px-3 py-2 text-[12px] text-[#9cdcfe] hover:bg-[#007acc]/25"
				>
					Refresh workspace tree
				</button>
			</div>
		</div>
	);
}

export function ExtensionsSidePanel() {
	return (
		<div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-r border-[#3c3c3c] bg-[#252526]">
			<div className="flex flex-col gap-2 p-3 text-[13px] text-[#858585]">
				<p>Orchestration and extension toggles will live here. Use the chat tool log in the bottom panel for now.</p>
			</div>
		</div>
	);
}

export function PlanningSidePanel({
	chatMode,
	onChatModeChange,
	streaming,
}: {
	chatMode: ChatSessionMode;
	onChatModeChange: (m: ChatSessionMode) => void;
	streaming: boolean;
}) {
	return (
		<div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-r border-[#3c3c3c] bg-[#252526]">
			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 text-[13px] leading-relaxed text-[#cccccc]">
				<p className="text-[#858585]">
					<strong className="font-medium text-[#cccccc]">Plan</strong> /{" "}
					<strong className="font-medium text-[#cccccc]">Build</strong> switch the session system prompt before you
					chat. <strong className="text-[#cccccc]">Plan</strong> uses the Pi{" "}
					<span className="font-mono text-[12px] text-[#9cdcfe]">planner</span> role (structured goals, steps,{" "}
					<span className="font-mono text-[11px]">plans/PLAN-*.md</span>).{" "}
					<strong className="font-medium text-[#cccccc]">Build</strong> is the default assistant (plus{" "}
					<span className="font-mono text-[11px]">WOP_SYSTEM_PROMPT</span> on the server if set).
				</p>
				<p className="text-[12px] text-[#858585]">
					In full Pi TUI, the same role lives in{" "}
					<span className="font-mono text-[#9cdcfe]">.pi/agents/planner.md</span> and agent-team dispatch; here it is
					session-only (no <span className="font-mono text-[11px]">dispatch_agent</span>). Pick any workspace agent from
					the <strong className="text-[#cccccc]">Workspace agent</strong> menu in the session chat header (body text
					from <span className="font-mono text-[11px]">.pi/agents/*.md</span>).
				</p>
				<div className="rounded border border-[#3c3c3c] bg-[#1e1e1e] p-3">
					<div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#858585]">
						Menu bar &amp; shell backlog
					</div>
					<p className="text-[12px] leading-relaxed text-[#858585]">
						Full parity matrix (File → Help, palette, panels, Pi-backed tools):{" "}
						<a
							href="https://github.com/zerwiz/wayofpi/blob/main/docs/WOP_MENU_BAR_BACKLOG.md"
							target="_blank"
							rel="noreferrer"
							className="text-[#3794ff] underline"
						>
							docs/WOP_MENU_BAR_BACKLOG.md
						</a>
						. Everything there is scoped to <span className="font-mono text-[11px] text-[#9cdcfe]">Way of Pi</span>{" "}
						(web UI, Bun server, headless Pi, <span className="font-mono text-[11px]">WOP_*</span>).
					</p>
					<ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] text-[#cccccc]">
						<li>Next spine: headless Pi chat/tools + manifest endpoint (see open TODOs doc).</li>
						<li>Editor depth: outline, problems from diagnostics, symbol/LSP or Pi resolve.</li>
						<li>Run/debug: task runner registry, debug session state, breakpoint persistence.</li>
					</ul>
				</div>
				<div className="flex rounded border border-[#3c3c3c] bg-[#1e1e1e] p-0.5">
					<button
						type="button"
						disabled={streaming}
						onClick={() => onChatModeChange("build")}
						className={`flex-1 rounded px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-wide ${
							chatMode === "build" ? "bg-[#007acc] text-white" : "text-[#858585] hover:text-[#cccccc]"
						} disabled:opacity-40`}
					>
						Build
					</button>
					<button
						type="button"
						disabled={streaming}
						onClick={() => onChatModeChange("plan")}
						className={`flex-1 rounded px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-wide ${
							chatMode === "plan" ? "bg-[#c586c0]/90 text-white" : "text-[#858585] hover:text-[#cccccc]"
						} disabled:opacity-40`}
					>
						Plan
					</button>
				</div>
				{streaming ? (
					<p className="font-mono text-[11px] text-[#ce9178]">Finish the current reply before switching mode.</p>
				) : null}
			</div>
		</div>
	);
}

export function SettingsSidePanel({
	config,
	workspaceRoot,
	onOpenPiModelConfig,
}: {
	config: ServerConfig | null;
	workspaceRoot: string;
	onOpenPiModelConfig?: (path: PiModelConfigPath) => void;
}) {
	return (
		<div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-r border-[#3c3c3c] bg-[#252526]">
			<div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] text-[#cccccc]">
				<div className="mb-2 text-[10px] font-bold uppercase text-[#858585]">Workspace</div>
				<div className="mb-4 break-all text-[#9cdcfe]">{workspaceRoot || "—"}</div>
				<div className="mb-2 text-[10px] font-bold uppercase text-[#858585]">LLM (server)</div>
				{config ? (
					<pre className="whitespace-pre-wrap rounded border border-[#3c3c3c] bg-[#1e1e1e] p-2 text-[10px] leading-relaxed">
						{JSON.stringify(config, null, 2)}
					</pre>
				) : (
					<span className="text-[#858585]">Loading…</span>
				)}
				<p className="mt-3 text-[11px] leading-snug text-[#858585]">
					Web UI session can follow host env. Pi <span className="font-mono text-[#9cdcfe]">/models</span> uses workspace
					JSON — open a file below to edit in the main editor.
				</p>
				{onOpenPiModelConfig ? (
					<div className="mt-4 border-t border-[#3c3c3c] pt-3">
						<div className="mb-2 text-[10px] font-bold uppercase text-[#858585]">Provider files</div>
						<ul className="list-none space-y-1 p-0">
							{PI_MODEL_CONFIG_ENTRIES.map((e) => (
								<li key={e.id}>
									<button
										type="button"
										onClick={() => onOpenPiModelConfig(e.path)}
										className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-2 text-left hover:border-[#007acc]/50 hover:bg-[#2d2d2d]"
										title={e.hint}
									>
										<span className="block text-[12px] text-[#cccccc]">{e.label}</span>
										<span className="mt-0.5 block font-mono text-[10px] text-[#858585]">{e.path}</span>
									</button>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</div>
	);
}
