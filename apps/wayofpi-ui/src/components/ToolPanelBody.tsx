import type { LogRow } from "../hooks/useWayOfPiSession";
import type { BottomPanelTab } from "../types/technicalShell";
import { EmbeddedTerminal } from "./EmbeddedTerminal";

/** Body for tool tabs inside `PanelDockBand` — Problems / Output / Tool log / Terminal. */
export function ToolPanelBody({ tab, logs }: { tab: BottomPanelTab; logs: LogRow[] }) {
	if (tab === "tool_log") {
		return (
			<div className="flex flex-col gap-1.5">
				{logs.length === 0 ? (
					<span className="text-[#858585]">No log lines yet.</span>
				) : (
					logs.map((log, idx) => (
						<div key={`${log.time}-${idx}`} className="flex gap-4">
							<span className="w-24 shrink-0 text-[#858585]">[{log.time}]</span>
							<span
								className={`w-16 shrink-0 font-bold ${
									log.level === "INFO"
										? "text-[#ea580c]"
										: log.level === "WARN"
											? "text-[#ce9178]"
											: log.level === "SUCCESS"
												? "text-[#89d185]"
												: "text-[#f14c4c]"
								}`}
							>
								{log.level}
							</span>
							<span className="w-28 shrink-0 text-[#c586c0]">{log.source}</span>
							<span className="text-[#cccccc]">{log.msg}</span>
						</div>
					))
				)}
			</div>
		);
	}
	if (tab === "output") {
		return (
			<div className="text-[#cccccc]">
				Server and client share one origin in dev (Vite proxy). Logs stream over WebSocket.
			</div>
		);
	}
	if (tab === "problems") {
		return <div className="text-[#858585]">No static analyzer wired yet.</div>;
	}
	if (tab === "terminal") {
		return <EmbeddedTerminal />;
	}
	if (tab === "agent_team") {
		return (
			<div className="p-3 font-mono text-[12px] text-[#858585]">
				<strong className="text-[#cccccc]">Team pulse</strong> belongs in the main workspace. Use the editor **+** menu →
				Team pulse, or chat <strong className="text-[#cccccc]">Pane team</strong>.
			</div>
		);
	}
	if (tab === "agent_chat") {
		return (
			<div className="p-3 font-mono text-[12px] text-[#858585]">
				<strong className="text-[#cccccc]">Agent chat</strong> is available in the main workspace pane (toolbar message
				icon or **+** → Agent chat).
			</div>
		);
	}
	return (
		<div className="text-[#858585]">
			Host shell is not exposed here by design. Use approvals + Run (planned) for commands.
		</div>
	);
}
