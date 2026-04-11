import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AgentMeta } from "../hooks/useAgents";
import type { ChatPulseMeters, ChatRow } from "../hooks/useWayOfPiSession";
import {
	AgentTeamPulseGrid,
	buildPulseMembersFromRoster,
	overlayPulseMembersWithActiveChat,
	useAgentPulseDoneFlash,
} from "./AgentTeamPulseGrid";

/** Agent roster in a **workspace** column tab — Pi-style: full session transcript above, roster grid at the bottom. */
export function WorkspaceAgentTeamPane({
	agentTeams,
	agents,
	agentsLoading,
	teamSessionTranscript = [],
	streaming = false,
	chatAgentName = null,
	dispatchTurnAgent = null,
	chatPulseMeters = null,
}: {
	agentTeams: Record<string, string[]>;
	agents: AgentMeta[];
	agentsLoading?: boolean;
	/** Active Session Chat tab — same rows as the docked / embedded chat (user + assistant). */
	teamSessionTranscript?: ChatRow[];
	streaming?: boolean;
	chatAgentName?: string | null;
	/** Phrase-dispatch specialist for this turn (picker unchanged). */
	dispatchTurnAgent?: string | null;
	chatPulseMeters?: ChatPulseMeters | null;
}) {
	const teamNames = useMemo(() => Object.keys(agentTeams ?? {}), [agentTeams]);
	const [pulseTeam, setPulseTeam] = useState<string | null>(null);
	const [pulseStreamDetail, setPulseStreamDetail] = useState(true);
	const endRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!agentTeams || teamNames.length === 0) {
			setPulseTeam(null);
			return;
		}
		setPulseTeam((prev) => (prev && agentTeams[prev] ? prev : (teamNames[0] ?? null)));
	}, [agentTeams, teamNames]);

	const pulseRoster = pulseTeam ? (agentTeams[pulseTeam] ?? []) : [];
	const pulseAgentName = chatAgentName?.trim() || dispatchTurnAgent?.trim() || null;
	const pulseDoneFlashLower = useAgentPulseDoneFlash(streaming, pulseAgentName);
	const userRows = useMemo(
		() => teamSessionTranscript.filter((r) => r.role === "user"),
		[teamSessionTranscript],
	);
	const lastUserTask = useMemo(() => {
		for (let i = userRows.length - 1; i >= 0; i--) {
			const t = String(userRows[i]?.content ?? "").trim();
			if (t) return t;
		}
		return null;
	}, [userRows]);
	const pulseMembers = useMemo(() => {
		const base = buildPulseMembersFromRoster(pulseRoster, agents ?? []);
		return overlayPulseMembersWithActiveChat(base, {
			activeAgentName: pulseAgentName,
			streaming,
			doneFlashAgentLower: pulseDoneFlashLower,
			lastUserTask,
			meters: chatPulseMeters ?? null,
		});
	}, [
		pulseRoster,
		agents,
		pulseAgentName,
		streaming,
		pulseDoneFlashLower,
		lastUserTask,
		chatPulseMeters,
	]);

	const lastRowSig = teamSessionTranscript.at(-1)?.id ?? "";
	/** New row only — avoids snapping scroll on every streaming token when the user has scrolled up. */
	useLayoutEffect(() => {
		endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
	}, [teamSessionTranscript.length, lastRowSig]);

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
	const hasTranscript = teamSessionTranscript.length > 0;

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

			<div
				className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-3 py-3"
				role="log"
				aria-label="Team session transcript"
			>
				<p className="max-w-prose shrink-0 text-[11px] leading-relaxed text-[#6b6b6b]">
					<strong className="text-[#858585]">Session mirror</strong> — the full <strong className="text-[#858585]">active</strong>{" "}
					chat tab (you + orchestrator) so you can review work next to the roster. Per-agent sub-streams are still
					planned (see <code className="text-[#858585]">docs/WOP_MULTI_AGENT_WEBSOCKET.md</code>).
				</p>
				{hasTranscript ? (
					<div className="flex min-w-0 flex-col gap-3 border-t border-[#3c3c3c] pt-3">
						<p className="text-[10px] font-semibold uppercase tracking-wide text-[#858585]">
							Team session transcript
						</p>
						{teamSessionTranscript.map((msg) => (
							<div key={msg.id} className="flex min-w-0 flex-col gap-1">
								<div className="flex items-center justify-between gap-2">
									<span className="text-[11px] font-semibold uppercase text-[#858585]">
										{msg.role === "user" ? "You" : "Assistant"}
									</span>
									<span className="shrink-0 font-mono text-[10px] text-[#555555]">{msg.timestamp}</span>
								</div>
								<div
									className={`rounded border px-2 py-2 text-[11px] leading-relaxed ${
										msg.role === "user"
											? "border-[#ea580c]/30 bg-[#ea580c]/10 text-[#d4d4d4]"
											: "border-[#3c3c3c] bg-[#252526] text-[#cccccc]"
									}`}
								>
									<pre className="w-full min-w-0 whitespace-pre-wrap break-words font-mono">{msg.content}</pre>
								</div>
							</div>
						))}
						<div ref={endRef} className="h-px shrink-0" aria-hidden />
					</div>
				) : (
					<p className="shrink-0 border-t border-[#3c3c3c] pt-3 text-[11px] italic text-[#6b6b6b]">
						No messages yet — send prompts from the chat tab (empty tabs are titled New Chat); they appear here in order.
					</p>
				)}
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
