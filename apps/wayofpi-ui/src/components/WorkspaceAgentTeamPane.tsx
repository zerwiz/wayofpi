import { useEffect, useMemo, useState } from "react";
import type { AgentMeta } from "../hooks/useAgents";
import { AgentTeamPulseGrid, buildPulseMembersFromRoster } from "./AgentTeamPulseGrid";

/** Agent roster for a **workspace** tab (same data as Chat **Team** overlay, without filling the chat column). */
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
		return <p className="font-mono text-[12px] text-[#a3a3a3]">Loading workspace agents…</p>;
	}
	if (teamNames.length === 0) {
		return (
			<div className="rounded border border-[#3c3c3c] bg-[#252526] p-4 font-mono text-[12px] leading-relaxed text-[#858585]">
				<p className="mb-2 text-[#cccccc]">No teams in workspace</p>
				<p>
					Pi <strong className="text-[#d4d4d4]">agent-team</strong> reads{" "}
					<code className="text-[#fb923c]">.pi/agents/teams.yaml</code>. Add rosters there, refresh the tree or
					reload the app.
				</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-col font-mono text-[12px] text-[#858585]">
			{teamNames.length > 1 ? (
				<label className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[#cccccc]">
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
			{pulseTeam && pulseMembers.length > 0 ? (
				<AgentTeamPulseGrid
					activeTeamName={pulseTeam}
					members={pulseMembers}
					streamDetail={pulseStreamDetail}
					onStreamDetailChange={setPulseStreamDetail}
					showSessionHint={false}
				/>
			) : (
				<p className="text-[#a3a3a3]">Selected team has no members in YAML.</p>
			)}
		</div>
	);
}
