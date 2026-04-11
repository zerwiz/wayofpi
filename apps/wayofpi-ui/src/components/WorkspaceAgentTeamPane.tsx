import { useEffect, useMemo, useState } from "react";
import type { AgentMeta } from "../hooks/useAgents";
import { AgentTeamPulseGrid, buildPulseMembersFromRoster } from "./AgentTeamPulseGrid";

/** Agent roster in a **workspace** column tab — Pi-style: transcript area above, roster grid pinned to the bottom. */
export function WorkspaceAgentTeamPane({
	agentTeams,
	agents,
	agentsLoading,
}: {
	agentTeams: Record<string, string[]>;
	agents: AgentMeta[];
	agentsLoading?: boolean;
}) {
	const teamNames = useMemo(() => Object.keys(agentTeams ?? {}), [agentTeams]);
	const [pulseTeam, setPulseTeam] = useState<string | null>(null);
	const [pulseStreamDetail, setPulseStreamDetail] = useState(true);

	useEffect(() => {
		if (!agentTeams || teamNames.length === 0) {
			setPulseTeam(null);
			return;
		}
		setPulseTeam((prev) => (prev && agentTeams[prev] ? prev : (teamNames[0] ?? null)));
	}, [agentTeams, teamNames]);

	const pulseRoster = pulseTeam ? (agentTeams[pulseTeam] ?? []) : [];
	const pulseMembers = useMemo(
		() => buildPulseMembersFromRoster(pulseRoster, agents ?? []),
		[pulseRoster, agents],
	);

	if (agentsLoading) {
		return (
			<div className="p-3 font-mono text-[12px] text-[#a3a3a3]">
				Loading workspace agents…
			</div>
		);
	}
	if (teamNames.length === 0) {
		return (
			<div className="p-3">
				<div className="rounded border border-[#3c3c3c] bg-[#252526] p-4 font-mono text-[12px] leading-relaxed text-[#858585]">
					<p className="mb-2 text-[#cccccc]">No teams in workspace</p>
					<p>
						Pi <strong className="text-[#d4d4d4]">agent-team</strong> reads{" "}
						<code className="text-[#fb923c]">.pi/agents/teams.yaml</code>. Add rosters there, refresh the tree or
						reload the app.
					</p>
				</div>
			</div>
		);
	}

	const hasRoster = Boolean(pulseTeam && pulseMembers.length > 0);

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#1e1e1e] font-mono text-[12px] text-[#858585]">
			<div className="shrink-0 border-b border-[#3c3c3c] px-3 pb-2 pt-3">
				{teamNames.length > 1 ? (
					<label className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-[#cccccc]">
						<span className="text-[#858585]">Team</span>
						<select
							value={pulseTeam ?? ""}
							onChange={(e) => setPulseTeam(e.target.value || null)}
							className="max-w-full rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 font-mono text-[11px] text-[#d4d4d4]"
						>
							{teamNames.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</label>
				) : null}
				{hasRoster ? (
					<AgentTeamPulseGrid
						activeTeamName={pulseTeam!}
						members={pulseMembers}
						streamDetail={pulseStreamDetail}
						onStreamDetailChange={setPulseStreamDetail}
						showSessionHint={false}
						section="toolbar"
					/>
				) : (
					<p className="text-[#a3a3a3]">Selected team has no members in YAML.</p>
				)}
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
				<p className="max-w-prose text-[11px] leading-relaxed text-[#6b6b6b]">
					Sub-agent replies, tool output, and token streams will appear here once the workspace is wired to the
					multi-agent stream (see <code className="text-[#858585]">docs/WOP_MULTI_AGENT_WEBSOCKET.md</code>). In Pi,
					the main transcript stays above the <code className="text-[#858585]">agent-team</code> footer widget.
				</p>
			</div>

			{hasRoster ? (
				<div className="max-h-[min(50vh,480px)] shrink-0 overflow-y-auto border-t border-[#3c3c3c] px-3 pb-3 pt-2">
					<AgentTeamPulseGrid
						activeTeamName={pulseTeam!}
						members={pulseMembers}
						streamDetail={pulseStreamDetail}
						showSessionHint={false}
						section="roster"
					/>
				</div>
			) : null}
		</div>
	);
}
