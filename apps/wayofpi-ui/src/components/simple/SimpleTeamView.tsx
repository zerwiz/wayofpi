import { BookOpen, Cpu, Database, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import type { AgentMeta } from "../../hooks/useAgents";

function HireAgentModal({
	open,
	onClose,
	onReload,
	appearanceDark,
}: {
	open: boolean;
	onClose: () => void;
	onReload: () => void;
	appearanceDark: boolean;
}) {
	if (!open) return null;
	const panel = appearanceDark
		? "border-[#3c3c3c] bg-[#252526] text-[#cccccc]"
		: "border-[#e5e5e5] bg-white text-[#333333]";
	const muted = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	return (
		<div
			className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className={`max-w-md rounded-xl border p-6 shadow-2xl ${panel}`} role="dialog">
				<h2 className="text-lg font-bold">Add an agent</h2>
				<p className={`mt-2 text-sm leading-relaxed ${muted}`}>
					Agents are Markdown files with YAML frontmatter (<code className="rounded bg-black/10 px-1">name</code>,{" "}
					<code className="rounded bg-black/10 px-1">description</code>,{" "}
					<code className="rounded bg-black/10 px-1">tools</code>) under{" "}
					<code className="rounded bg-black/10 px-1">agents/</code>, <code className="rounded bg-black/10 px-1">.claude/agents/</code>,{" "}
					<code className="rounded bg-black/10 px-1">.pi/agents/</code>, or <code className="rounded bg-black/10 px-1">.cursor/agents/</code>{" "}
					at the workspace root (same order and frontmatter rules as Pi <span className="font-mono text-xs">agent-team</span>). Teams:{" "}
					<code className="rounded bg-black/10 px-1">.pi/agents/teams.yaml</code>.
				</p>
				<p className={`mt-2 text-sm ${muted}`}>
					See the Way of Pi repo <span className="font-mono text-xs">docs/AGENTS.md</span> for the full format.
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => {
							onReload();
						}}
						className="rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-bold text-white hover:bg-[#c2410c]"
					>
						Reload agents
					</button>
					<button
						type="button"
						onClick={onClose}
						className={`rounded-lg border px-4 py-2 text-sm font-bold ${appearanceDark ? "border-[#6f6f6f] text-[#cccccc]" : "border-[#d4d4d4] text-[#333333]"}`}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

export function SimpleTeamView({
	modelLabel,
	agents,
	teams,
	teamsPath,
	loading,
	error,
	onReload,
	onOpenAgentFile,
	appearanceDark,
}: {
	modelLabel: string;
	agents: AgentMeta[];
	teams: Record<string, string[]>;
	teamsPath: string | null;
	loading: boolean;
	error: string | null;
	onReload: () => void;
	onOpenAgentFile: (relativePath: string) => void;
	appearanceDark: boolean;
}) {
	const [hireOpen, setHireOpen] = useState(false);
	const byName = new Map(agents.map((a) => [a.name, a]));
	const heading = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const sub = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const card = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";

	return (
		<div className="flex-1 overflow-y-auto p-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className={`mb-2 text-2xl font-extrabold ${heading}`}>My AI Team</h1>
						<p className={`font-medium ${sub}`}>
							Agents discovered under <code className="text-xs">agents/</code>, <code className="text-xs">.claude/agents</code>,{" "}
							<code className="text-xs">.pi/agents</code>, and <code className="text-xs">.cursor/agents</code> (Pi agent-team order; duplicate{" "}
							<code className="text-xs">name</code> keeps the first). Rosters:{" "}
							<code className="text-xs">{teamsPath ?? ".pi/agents/teams.yaml"}</code>.
						</p>
					</div>
					<button
						type="button"
						onClick={onReload}
						disabled={loading}
						className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${appearanceDark ? "border-[#3c3c3c] text-[#cccccc] hover:bg-[#3c3c3c]" : "border-[#d4d4d4] text-[#333333] hover:bg-[#e5e5e5]"}`}
					>
						<RefreshCw size={16} className={loading ? "animate-spin" : ""} />
						Refresh
					</button>
				</div>

				{error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
				{loading && agents.length === 0 ? <p className={sub}>Loading agents…</p> : null}

				{Object.keys(teams).length > 0 ? (
					<section className="mb-10">
						<h2 className={`mb-3 flex items-center gap-2 text-lg font-bold ${heading}`}>
							<BookOpen size={18} /> Teams
						</h2>
						<div className="flex flex-col gap-3">
							{Object.entries(teams).map(([team, members]) => (
								<div key={team} className={`rounded-2xl border p-4 ${card}`}>
									<div className={`mb-2 font-mono text-sm font-bold ${heading}`}>{team}</div>
									<div className="flex flex-wrap gap-2">
										{members.map((m) => {
											const meta = byName.get(m);
											return (
												<button
													key={m}
													type="button"
													onClick={() => {
														if (meta) onOpenAgentFile(meta.relativePath);
													}}
													className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
														meta
															? appearanceDark
																? "border-[#ea580c]/40 bg-[#ea580c]/15 text-[#fed7aa] hover:bg-[#ea580c]/25"
																: "border-[#ea580c]/40 bg-[#ea580c]/10 text-[#c2410c] hover:bg-[#ea580c]/15"
															: appearanceDark
																? "border-[#6f6f6f] text-[#858585]"
																: "border-[#d4d4d4] text-[#616161]"
													}`}
													title={meta ? meta.description : "No matching agent file in workspace"}
												>
													{m}
													{!meta ? " (missing)" : ""}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</section>
				) : null}

				<section>
					<h2 className={`mb-4 text-lg font-bold ${heading}`}>All agents ({agents.length})</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{agents.map((agent) => (
							<div key={agent.name} className={`flex flex-col rounded-2xl border p-6 shadow-sm ${card}`}>
								<div className="mb-4 flex items-start justify-between gap-2">
									<div className="flex min-w-0 items-center gap-3">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${appearanceDark ? "border-[#3c3c3c] bg-[#3c3c3c] text-[#cccccc]" : "border-[#e5e5e5] bg-[#ececec] text-[#616161]"}`}
										>
											<Cpu size={20} />
										</div>
										<div className="min-w-0">
											<h3 className={`truncate font-bold ${heading}`}>{agent.name}</h3>
											<p className={`line-clamp-2 text-xs ${sub}`}>{agent.description || "—"}</p>
										</div>
									</div>
									<span
										className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${appearanceDark ? "border-green-500/30 bg-green-500/15 text-green-400" : "border-green-600/30 bg-green-50 text-green-800"}`}
									>
										ready
									</span>
								</div>
								{agent.tools ? (
									<p className={`mb-2 truncate font-mono text-[11px] ${sub}`} title={agent.tools}>
										tools: {agent.tools}
									</p>
								) : null}
								<div className={`mt-auto flex items-center justify-between border-t pt-4 text-sm ${appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]"}`}>
									<span className={`flex min-w-0 items-center gap-1.5 truncate ${sub}`}>
										<Database size={14} className="shrink-0" />
										<span className="truncate">{modelLabel || "—"}</span>
									</span>
									<button
										type="button"
										onClick={() => onOpenAgentFile(agent.relativePath)}
										className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#fb923c] hover:text-[#fed7aa]"
									>
										Open file
									</button>
								</div>
							</div>
						))}

						<button
							type="button"
							onClick={() => setHireOpen(true)}
							className={`flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 transition-colors ${appearanceDark ? "border-[#3c3c3c] bg-[#252526]/50 text-[#858585] hover:border-[#6f6f6f] hover:bg-[#3c3c3c]/50 hover:text-[#cccccc]" : "border-[#d4d4d4] bg-[#f3f3f3] text-[#616161] hover:border-[#c8c8c8] hover:bg-[#e5e5e5] hover:text-[#333333]"}`}
						>
							<Users size={28} className="mb-2" />
							<span className="font-bold">Add agent</span>
							<span className={`mt-1 text-center text-xs ${sub}`}>Markdown + frontmatter on disk</span>
						</button>
					</div>
				</section>
			</div>

			<HireAgentModal
				open={hireOpen}
				onClose={() => setHireOpen(false)}
				onReload={() => {
					onReload();
					setHireOpen(false);
				}}
				appearanceDark={appearanceDark}
			/>
		</div>
	);
}
